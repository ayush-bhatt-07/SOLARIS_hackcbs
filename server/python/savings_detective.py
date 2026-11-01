"""Private JSON-lines Python inference worker. No network listener or credentials.

The Express gateway authorises and supplies the property's persisted dataset.
This worker never accepts filesystem paths from a request or emits NaN JSON.
"""
import hashlib
import io
import json
import math
from pathlib import Path
import sys
from collections import OrderedDict
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

FEATURES = ['generation_ratio', 'import_residual_kwh']
TRAIN_DAYS = 220
ROOT = Path(__file__).resolve().parents[2]
CACHE = OrderedDict()

def template():
    path = ROOT / 'solaris_isolation_forest' / 'synthetic_daily_solar.csv'
    raw = path.read_bytes()
    frame = pd.read_csv(io.BytesIO(raw))
    columns = ['date', 'expected_generation_kwh', 'actual_generation_kwh', 'mall_load_kwh', 'grid_import_kwh', 'injected_anomaly_label']
    records = json.loads(frame[columns].to_json(orient='records', double_precision=15))
    validate(records, 9)
    if len(records) != 365:
        raise ValueError('The supplied synthetic reference must contain 365 complete daily rows.')
    return {'sourceHash': hashlib.sha256(raw).hexdigest(), 'records': records}

def charge_paise(units, tariff):
    return int((Decimal(str(units)) * Decimal(str(tariff)) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))

def validate(records, tariff):
    if not isinstance(records, list) or not TRAIN_DAYS < len(records) <= 1000:
        raise ValueError('A chronological dataset with 221–1000 daily records is required.')
    if isinstance(tariff, bool) or not isinstance(tariff, (float, int)) or not math.isfinite(tariff) or not 0 <= tariff <= 100:
        raise ValueError('Tariff must be a finite number from 0 to 100 INR/kWh.')
    dates = []
    for row in records:
        if not isinstance(row, dict):
            raise ValueError('Each reading must be an object.')
        dates.append(date.fromisoformat(row['date']))
        for key in ['expected_generation_kwh', 'mall_load_kwh', 'grid_import_kwh', 'actual_generation_kwh']:
            value = row.get(key)
            if key == 'actual_generation_kwh' and value is None:
                continue
            if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not 0 <= value <= 10000000:
                raise ValueError(f'Invalid {key}.')
        if row['expected_generation_kwh'] <= 0:
            raise ValueError('Expected generation must be positive.')
        if row.get('injected_anomaly_label') not in (0, 1):
            raise ValueError('Synthetic evaluation labels must be 0 or 1.')
    if dates != sorted(set(dates)):
        raise ValueError('Dates must be unique and chronological.')

def infer(records, tariff=9):
    validate(records, tariff)
    frame = pd.DataFrame(records)
    # Derive model features again. Neither saved CSV scores nor truth labels feed inference.
    frame['generation_ratio'] = frame.actual_generation_kwh / frame.expected_generation_kwh
    frame['expected_import'] = np.maximum(frame.mall_load_kwh - frame.expected_generation_kwh, 0)
    frame['import_residual_kwh'] = frame.grid_import_kwh - frame.expected_import
    train = frame.iloc[:TRAIN_DAYS].dropna(subset=FEATURES)
    if len(train) < 100:
        raise ValueError('Insufficient complete training readings.')
    key = hashlib.sha256(train[FEATURES].to_json(double_precision=15).encode()).hexdigest()
    model = CACHE.get(key)
    if model is None:
        model = Pipeline([('scale', StandardScaler()), ('iforest', IsolationForest(n_estimators=250, max_samples='auto', contamination=0.035, random_state=42, n_jobs=1))])
        model.fit(train[FEATURES])
        CACHE[key] = model
        if len(CACHE) > 8:
            CACHE.popitem(last=False)
    test = frame.iloc[TRAIN_DAYS:].copy()
    eligible = test[FEATURES].notna().all(axis=1)
    scores = model.decision_function(test.loc[eligible, FEATURES]) if eligible.any() else []
    predictions = model.predict(test.loc[eligible, FEATURES]) if eligible.any() else []
    by_index = {index: (float(score), bool(prediction == -1)) for index, score, prediction in zip(test.index[eligible], scores, predictions)}
    days = []
    for index, row in test.iterrows():
        missing = index not in by_index
        score, flag = by_index.get(index, (None, False))
        expected, actual, load = float(row.expected_generation_kwh), None if missing else float(row.actual_generation_kwh), float(row.mall_load_kwh)
        # Missing generation is unknown, not zero; financial values stay null.
        before = None if missing else charge_paise(min(load, expected), tariff)
        after = None if missing else charge_paise(min(load, actual), tariff)
        gap = None if missing else before - after
        days.append({'date': row.date, 'expectedKwh': expected, 'actualKwh': actual, 'loadKwh': load,
            'gridImportKwh': float(row.grid_import_kwh), 'expectedImportKwh': float(row.expected_import),
            'generationRatio': None if missing else float(row.generation_ratio),
            'importResidualKwh': None if missing else float(row.import_residual_kwh), 'score': score,
            'status': 'MISSING_DATA' if missing else 'INVESTIGATE' if flag else 'NORMAL',
            'expectedAvoidedInr': None if missing else before / 100, 'actualAvoidedInr': None if missing else after / 100,
            'gapInr': None if missing else gap / 100,
            'direction': 'MISSING_DATA' if missing else 'SHORTFALL' if gap >= 0 else 'ABOVE_BASELINE'})
    valid = [d for d in days if d['status'] != 'MISSING_DATA']
    flags = [d for d in valid if d['status'] == 'INVESTIGATE']
    truth = test.loc[eligible, 'injected_anomaly_label'].astype(int)
    predicted = [int(prediction == -1) for prediction in predictions]
    total = lambda rows, key: sum(int(round(d[key] * 100)) for d in rows) / 100
    return {'modelVersion': 'savings-detective-iforest-1', 'sklearnVersion': sklearn.__version__,
        'model': {'features': FEATURES, 'trainDays': len(train), 'trees': 250, 'contamination': 0.035, 'seed': 42, 'threshold': 0},
        'summary': {'days': len(days), 'validDays': len(valid), 'missingDays': len(days) - len(valid), 'flags': len(flags),
            'flaggedShortfallInr': total([d for d in flags if d['gapInr'] > 0], 'gapInr'),
            'flaggedSurplusInr': -total([d for d in flags if d['gapInr'] < 0], 'gapInr'),
            'netGapInr': total(valid, 'gapInr'), 'expectedKwh': sum(d['expectedKwh'] for d in valid), 'actualKwh': sum(d['actualKwh'] for d in valid)},
        'evaluation': {'precision': float(precision_score(truth, predicted, zero_division=0)) if valid else 0,
            'recall': float(recall_score(truth, predicted, zero_division=0)) if valid else 0,
            'f1': float(f1_score(truth, predicted, zero_division=0)) if valid else 0,
            'confusionMatrix': confusion_matrix(truth, predicted, labels=[0, 1]).tolist() if valid else [[0, 0], [0, 0]], 'injectedAnomalies': int(truth.sum())},
        'days': days,
        'assumptions': [
            'All readings and expected weather-like generation are synthetic, for a 200 kWp reference system in 2025; not measurements from this property.',
            'First 220 chronological days train the scaler and forest. Later days are scored without refitting. Ground-truth labels are used only for synthetic evaluation.',
            'Negative decision scores are unusual, not probabilities, fault diagnoses or proof of financial loss. Both high and low production can be flagged.',
            f'Illustrative avoided energy charge ₹{tariff}/kWh. Daily avoided cost = min(site load, generation) × tariff; expected minus actual is signed. Charges round half-up to integer paise.',
            'Daily energy matching assumes coincident site consumption. No interval load profile, export payment, taxes, fixed/demand charges or tenant sharing is modelled.',
            'Missing readings have no ML score or monetary estimate and are excluded from paired generation and financial totals.',
            'Precision/recall use easy injected synthetic anomalies and do not establish real-world reliability. Validate per-site baseline, seasonal performance and drift before production use.',
        ]}

def main():
    for line in sys.stdin:
        request = {}
        try:
            request = json.loads(line)
            if not isinstance(request, dict):
                raise ValueError('Request must be an object.')
            if request.get('operation') == 'template':
                result = template()
            elif request.get('operation') == 'infer':
                result = infer(request.get('records'), request.get('tariff', 9))
            elif request.get('operation') == 'weather-template':
                from weather_detective import weather_template
                result = weather_template()
            elif request.get('operation') == 'weather-infer':
                from weather_detective import weather_infer
                result = weather_infer(request.get('solar'), request.get('weather'), request.get('site'), request.get('tariff', 9), request.get('synthetic', False))
            else:
                raise ValueError('Unknown inference operation.')
            response = {'id': request.get('id'), 'result': result}
        except Exception as error:
            response = {'id': request.get('id') if isinstance(request, dict) else None, 'error': str(error)}
        print(json.dumps(response, allow_nan=False), flush=True)

if __name__ == '__main__':
    main()
