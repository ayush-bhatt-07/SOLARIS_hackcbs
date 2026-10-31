"""Weather-normalised hourly PV baseline and held-out Isolation Forest comparison.

No weather values are invented for supplied property readings. The seeded experiment
explicitly generates its own synthetic weather, never masquerading as reanalysis.
"""
import hashlib
import json
import math
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

BASELINE_VERSION = 'pv-hourly-pr-noct-1'
MODEL_VERSION = 'weather-iforest-1'

def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

def validate_site(site):
    ZoneInfo(site['timezone'])
    for name, low, high in [('latitude', -90, 90), ('longitude', -180, 180), ('capacityKwp', .1, 2000), ('performanceRatio', .4, 1)]:
        if not finite(site.get(name)) or not low <= site[name] <= high:
            raise ValueError('Invalid system setting: ' + name)
    for name, low, high in [('tilt', 0, 90), ('azimuth', -180, 180), ('temperatureCoefficient', -.01, 0), ('noctC', 20, 70)]:
        if site.get(name) is not None and (not finite(site[name]) or not low <= site[name] <= high):
            raise ValueError('Invalid system setting: ' + name)
    if (site.get('tilt') is None) != (site.get('azimuth') is None) or (site.get('noctC') is None) != (site.get('temperatureCoefficient') is None):
        raise ValueError('Incomplete orientation or temperature parameter pair.')

def expected_hour(site, weather):
    """kWp × hourly plane-of-array irradiation / STC × PR × temperature factor."""
    field = 'gti' if site.get('tilt') is not None else 'shortwaveRadiation'
    irradiance = weather.get(field)
    required = ['shortwaveRadiation', 'cloudCover', 'precipitation', 'temperatureC', 'isDay']
    if not finite(irradiance) or any(not finite(weather.get(key)) for key in required):
        return None
    if not 0 <= irradiance <= 1800 or not 0 <= weather['shortwaveRadiation'] <= 1600 or not 0 <= weather['cloudCover'] <= 100 or not 0 <= weather['precipitation'] <= 500 or not -90 <= weather['temperatureC'] <= 65 or weather['isDay'] not in (0, 1):
        return None
    # Conservative exclusion of nighttime and weak twilight. Not zero-filled measurements.
    if weather['isDay'] == 0 or irradiance < 20:
        return 0.0
    adjustment = 1.0
    if site.get('temperatureCoefficient') is not None:
        cell = weather['temperatureC'] + (site['noctC'] - 20) / 800 * irradiance
        adjustment = max(0, 1 + site['temperatureCoefficient'] * (cell - 25))
    return site['capacityKwp'] * irradiance / 1000 * site['performanceRatio'] * adjustment

def weather_template():
    from savings_detective import template
    original = template()['records']
    rng = np.random.default_rng(2026)
    site = {'latitude': 28.6139, 'longitude': 77.2090, 'timezone': 'Asia/Kolkata', 'capacityKwp': 200,
            'performanceRatio': .8, 'tilt': 20, 'azimuth': 0, 'temperatureCoefficient': -.004, 'noctC': 45,
            'source': 'SYNTHETIC', 'version': 1}
    solar, weather = [], []
    zone = ZoneInfo(site['timezone'])
    faults = {239, 240, 241, 267, 268, 302, 326, 327, 349, 350}
    for i, day in enumerate(original):
        condition = ['SUNNY', 'CLOUDY', 'RAINY'][int(rng.choice(3, p=[.65, .23, .12]))]
        if i in faults:
            condition = 'SUNNY'
        reduction = {'SUNNY': 1, 'CLOUDY': .48, 'RAINY': .20}[condition]
        cloud = {'SUNNY': 12, 'CLOUDY': 78, 'RAINY': 96}[condition]
        ratio = 1 + float(rng.normal(0, .018))
        scenario = 'NORMAL_' + condition
        label = 0
        if i in faults:
            ratio *= .4
            scenario, label = 'SUNNY_UNDERPERFORMANCE', 1
        if 310 <= i <= 329:
            ratio *= 1 - .022 * (i - 309)
            scenario = 'GRADUAL_DEGRADATION'
            label = int((1 - .022 * (i - 309)) < .85)
        if i == 290:
            scenario = 'MISSING_SOLAR'
        if i == 280:
            scenario = 'MISSING_WEATHER'
        if i == 300:
            scenario = 'METER_INCONSISTENCY'
        start = datetime.fromisoformat(day['date']).replace(tzinfo=zone)
        for hour in range(1, 25):
            end = start + timedelta(hours=hour)
            timestamp = int(end.timestamp())
            sun = max(0, math.sin(math.pi * ((hour - .5) - 6) / 12)) if 6 <= hour - .5 <= 18 else 0
            ghi = 850 * sun * reduction * (1 + .06 * math.sin(i / 24))
            w = {'timestamp': timestamp, 'shortwaveRadiation': ghi, 'gti': ghi * 1.04,
                 'cloudCover': cloud, 'precipitation': .8 if condition == 'RAINY' and sun > 0 else 0,
                 'temperatureC': 25 + 7 * sun + 4 * math.sin(i / 40), 'isDay': int(sun > 0)}
            expected = expected_hour(site, w)
            actual = expected * ratio if expected else 0.0
            actual = None if i == 290 and expected else actual
            load = day['mall_load_kwh'] / 24
            imported = None if actual is None else max(0, load - actual)
            if i == 300 and expected:
                imported += 40
            solar.append({'timestamp': timestamp, 'actualKwh': actual, 'loadKwh': load, 'gridImportKwh': imported, 'label': label, 'scenario': scenario})
            if i == 280 and hour == 12:
                w = {key: timestamp if key == 'timestamp' else None for key in w}
            weather.append(w)
    return {'site': site, 'solar': solar, 'weather': weather,
            'sourceHash': hashlib.sha256(json.dumps({'solar': solar, 'weather': weather}, sort_keys=True).encode()).hexdigest()}

def weather_infer(solar, weather, site, tariff=9, synthetic=False):
    from savings_detective import charge_paise
    validate_site(site)
    if not finite(tariff) or not 0 <= tariff <= 100:
        raise ValueError('Invalid tariff.')
    if not isinstance(solar, list) or not 1 <= len(solar) <= 9000 or not isinstance(weather, list) or len(weather) > 9000:
        raise ValueError('Supply 1–9000 hourly solar readings and at most 9000 weather records.')
    zone = ZoneInfo(site['timezone'])
    mapped = {}
    for w in weather:
        t = w.get('timestamp')
        if not isinstance(t, int) or t in mapped:
            raise ValueError('Weather timestamps must be unique UTC epoch seconds.')
        mapped[t] = w
    grouped = {}
    previous = None
    for s in solar:
        t = s.get('timestamp')
        if not isinstance(t, int) or (previous is not None and t <= previous):
            raise ValueError('Solar interval ends must be unique and chronological UTC epoch seconds.')
        local = datetime.fromtimestamp(t, timezone.utc).astimezone(zone)
        if local.minute != 0 or local.second != 0:
            raise ValueError('Hourly interval ends must fall on local clock hours.')
        previous = t
        for key in ['actualKwh', 'loadKwh', 'gridImportKwh']:
            if s.get(key) is not None and (not finite(s[key]) or not 0 <= s[key] <= 1000000):
                raise ValueError('Invalid solar/meter reading.')
        date_key = datetime.fromtimestamp(t - 1, timezone.utc).astimezone(zone).date().isoformat()
        grouped.setdefault(date_key, []).append(s)
    days = []
    for date_key, samples in sorted(grouped.items()):
        midnight = datetime.fromisoformat(date_key).replace(tzinfo=zone)
        next_midnight = (midnight + timedelta(days=1))
        required_hours = int((next_midnight.timestamp() - midnight.timestamp()) / 3600)
        expected_timestamps = {int(midnight.timestamp()) + n * 3600 for n in range(1, required_hours + 1)}
        warnings = []
        if {s['timestamp'] for s in samples} != expected_timestamps:
            warnings.append('INCOMPLETE_INTERVALS')
        expected, actual, irradiance, clouds, rain, temperatures = [], [], [], [], [], []
        before = after = 0
        residual_import = 0
        daylight = matched = 0
        for s in samples:
            w = mapped.get(s['timestamp'])
            estimate = expected_hour(site, w) if w else None
            if estimate is None:
                warnings.append('MISSING_WEATHER')
                continue
            if estimate == 0:
                continue
            clouds.append(w['cloudCover']); rain.append(w['precipitation']); temperatures.append(w['temperatureC'])
            daylight += 1
            rad = w['gti'] if site.get('tilt') is not None else w['shortwaveRadiation']
            irradiance.append(rad / 1000)
            if any(s.get(k) is None for k in ['actualKwh', 'loadKwh', 'gridImportKwh']):
                warnings.append('MISSING_SOLAR')
                continue
            matched += 1
            if abs(s['gridImportKwh'] - max(0, s['loadKwh'] - s['actualKwh'])) > max(1, s['loadKwh'] * .02):
                warnings.append('METER_INCONSISTENCY')
            expected.append(estimate); actual.append(s['actualKwh'])
            before += charge_paise(min(s['loadKwh'], estimate), tariff)
            after += charge_paise(min(s['loadKwh'], s['actualKwh']), tariff)
            residual_import += s['gridImportKwh'] - max(0, s['loadKwh'] - estimate)
        if not daylight:
            warnings.append('NO_SCOREABLE_DAYLIGHT')
        eligible = not warnings and daylight == matched and daylight > 0
        expected_total = sum(expected) if eligible else None
        actual_total = sum(actual) if eligible else None
        weather_complete = 'MISSING_WEATHER' not in warnings and 'INCOMPLETE_INTERVALS' not in warnings
        rain_total = sum(rain) if weather_complete else None
        cloud_mean = float(np.mean(clouds)) if clouds and weather_complete else None
        condition = 'UNKNOWN' if not weather_complete or cloud_mean is None else 'RAINY' if rain_total >= 1 else 'CLOUDY' if cloud_mean >= 65 else 'SUNNY'
        ratio = actual_total / expected_total if eligible and expected_total > 0 else None
        days.append({'date': date_key, 'actualKwh': actual_total, 'expectedKwh': expected_total,
                     'residualKwh': actual_total - expected_total if eligible else None, 'ratio': ratio,
                     'irradianceKwhM2': sum(irradiance) if weather_complete else None, 'cloudCover': cloud_mean,
                     'precipitationMm': rain_total, 'temperatureC': float(np.mean(temperatures)) if temperatures and weather_complete else None,
                     'weather': condition, 'score': None, 'originalScore': None, 'originalFlag': None, 'thresholdFlag': None,
                     'status': 'UNSCORED' if eligible else 'DATA_QUALITY', 'eligible': eligible, 'warnings': sorted(set(warnings)),
                     'gapInr': (before - after) / 100 if eligible else None, 'expectedAvoidedInr': before / 100 if eligible else None, 'actualAvoidedInr': after / 100 if eligible else None,
                     'scenario': samples[0].get('scenario') if synthetic else None, 'label': max(s.get('label', 0) for s in samples) if synthetic else None,
                     'daylightHours': daylight, 'matchedHours': matched, '_importResidual': residual_import,
                     '_load': sum(s['loadKwh'] or 0 for s in samples), '_actualImport': sum(s['gridImportKwh'] or 0 for s in samples)})
    # Fixed chronological split: no test-set fitting, threshold tuning or label filtering.
    train = [d for d in days[:220] if d['eligible']]
    test = days[220:] if len(days) > 220 else days
    train_ok = len(days) > 220 and len(train) >= 90
    features = lambda d: [d['ratio'] - 1, d['residualKwh'] / site['capacityKwp'], d['_importResidual'] / max(d['expectedKwh'], 1)]
    if train_ok:
        fit = lambda values: Pipeline([('scale', StandardScaler()), ('forest', IsolationForest(n_estimators=250, contamination=.035, random_state=42, n_jobs=1))]).fit(values)
        normalised = fit([features(d) for d in train])
        # Comparator A retains original ratio/import-residual IF algorithm with a fixed
        # training-only clear-day expectation: no observed-weather normalisation.
        clear_baseline = float(np.quantile([d['expectedKwh'] for d in train], .8))
        original_features = lambda d: [d['actualKwh'] / clear_baseline, d['_actualImport'] - max(0, d['_load'] - clear_baseline)]
        original = fit([original_features(d) for d in train])
        scored = [d for d in test if d['eligible']]
        if scored:
            vectors = [features(d) for d in scored]
            old_vectors = [original_features(d) for d in scored]
            normal_scores = normalised.decision_function(vectors)
            normal_predictions = normalised.predict(vectors)
            old_scores = original.decision_function(old_vectors)
            old_predictions = original.predict(old_vectors)
        for d, score, prediction, old_score, old_prediction in zip(scored, normal_scores if scored else [], normal_predictions if scored else [], old_scores if scored else [], old_predictions if scored else []):
            d['score'] = float(score)
            d['originalScore'] = float(old_score)
            d['originalFlag'] = bool(old_prediction == -1)
            d['thresholdFlag'] = bool(d['ratio'] < .8)
            d['status'] = 'INVESTIGATE' if prediction == -1 else 'WEATHER_CONSISTENT' if d['weather'] in ('RAINY', 'CLOUDY') and d['expectedKwh'] < clear_baseline * .8 else 'NORMAL'
    else:
        for d in test:
            if d['eligible']:
                d['status'] = 'INSUFFICIENT_TRAINING'
                d['warnings'].append('Need over 220 chronological days and at least 90 complete training days; no model score was invented.')
    comparisons = []
    eligible_test = [d for d in test if d['eligible'] and d['score'] is not None]
    for name, flag in [('Original IF / clear-day baseline', lambda d: d['originalFlag']), ('Weather-normalised IF', lambda d: d['status'] == 'INVESTIGATE'), ('Weather residual threshold / ratio < 0.8', lambda d: d['thresholdFlag'])]:
        if synthetic and eligible_test:
            truth = [d['label'] for d in eligible_test]; pred = [int(flag(d)) for d in eligible_test]
            matrix = confusion_matrix(truth, pred, labels=[0, 1]).tolist()
            metrics = {'precision': float(precision_score(truth, pred, zero_division=0)), 'recall': float(recall_score(truth, pred, zero_division=0)), 'f1': float(f1_score(truth, pred, zero_division=0)), 'falsePositives': matrix[0][1], 'rainyCloudyFalseAlerts': sum(d['label'] == 0 and flag(d) and d['weather'] in ('RAINY', 'CLOUDY') for d in eligible_test), 'confusionMatrix': matrix}
        else:
            metrics = {key: None for key in ['precision', 'recall', 'f1', 'falsePositives', 'rainyCloudyFalseAlerts', 'confusionMatrix']}
        comparisons.append({'model': name, **metrics})
    examples = {}
    for key, match in [('rainy', lambda d: d['weather'] == 'RAINY' and d['status'] == 'WEATHER_CONSISTENT'), ('cloudy', lambda d: d['weather'] == 'CLOUDY' and d['status'] == 'WEATHER_CONSISTENT'), ('sunnyAlert', lambda d: d['weather'] == 'SUNNY' and d['status'] == 'INVESTIGATE' and d['ratio'] < .8), ('degradation', lambda d: d.get('scenario') == 'GRADUAL_DEGRADATION' and d['status'] == 'INVESTIGATE')]:
        found = next((d for d in test if match(d)), None)
        if found:
            examples[key] = found['date']
    for d in test:
        d.pop('_importResidual', None); d.pop('_load', None); d.pop('_actualImport', None); d.pop('label', None)
    return {'modelVersion': MODEL_VERSION, 'baselineVersion': BASELINE_VERSION, 'days': test, 'examples': examples,
            'summary': {'flags': sum(d['status'] == 'INVESTIGATE' for d in test), 'weatherConsistent': sum(d['status'] == 'WEATHER_CONSISTENT' for d in test), 'excluded': sum(not d['eligible'] for d in test), 'flaggedShortfallInr': sum(round(max(0, d['gapInr'] or 0) * 100) for d in test if d['status'] == 'INVESTIGATE') / 100, 'trainDays': len(train) if train_ok else 0},
            'comparisons': comparisons,
            'assumptions': [
                'Hourly UTC epoch timestamps represent interval ends. Radiation is a preceding-hour average in W/m²; one-hour energy is kWh. Daily grouping uses interval end minus one second in the property IANA timezone, including DST.',
                'Expected kWh = capacity kWp × plane-of-array W/m² / 1000 × 1 h × performance ratio × temperature factor. STC reference is 1 kW/m². No Gemini-generated energy values.',
                'When provided: cell temperature ≈ air temperature + (NOCT−20)/800 × irradiance; factor = max(0, 1 + coefficient × (cell temperature−25)). PR represents other losses, excluding this explicit temperature correction.',
                'GTI uses supplied tilt/azimuth. Without orientation, horizontal radiation is an explicitly uncertain proxy; no orientation values are invented. No inverter clipping or site shading model is available.',
                'Nighttime, radiation below 20 W/m², missing weather/solar, incomplete hours and meter inconsistencies are excluded from production anomaly scoring. Every local day must have complete intervals and all daylight fields.',
                'Meter check assumes same connection/time interval: imports ≈ max(load−solar, 0), with tolerance max(1 kWh, 2% of load). Storage, other generators or misaligned meters need a different balance model.',
                'Scalers and 250-tree, seed-42 Isolation Forest models fit only the first 220 calendar days. Scores below zero are unusual, not causal diagnoses or probabilities. Labels are used only for synthetic held-out metrics.',
                'Comparator A uses the original two-feature IF algorithm against a training-only clear-day baseline. The prior prototype already had a synthetic weather-like expectation, so this comparator is explicitly adapted to be weather-unaware.',
                'Residual threshold comparator is predeclared actual/expected < 0.8, not tuned on evaluation labels. Synthetic metrics do not establish real-world accuracy.',
                'Weather labels and air-temperature summaries use scored daylight hours. Weather-consistent low-output status additionally requires expected output below 80% of the training-only clear-day baseline; rain alone is not treated as evidence of reduced irradiation.',
                f'Financial difference sums hourly min(load, expected/actual generation) × ₹{tariff}/kWh, rounded to paise. Fixed/demand charges, export payments, taxes and tenant sharing are excluded.',
            ]}
