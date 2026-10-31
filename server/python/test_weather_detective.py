import copy
import json
import unittest
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from weather_detective import expected_hour, weather_template, weather_infer

class WeatherDetectiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.seed = weather_template()
        cls.report = weather_infer(cls.seed['solar'], cls.seed['weather'], cls.seed['site'], synthetic=True)

    def test_rainy_and_sunny_definition_of_done(self):
        days = {d['date']: d for d in self.report['days']}
        rain = days[self.report['examples']['rainy']]
        sunny = days[self.report['examples']['sunnyAlert']]
        self.assertEqual(rain['weather'], 'RAINY')
        self.assertEqual(rain['status'], 'WEATHER_CONSISTENT')
        self.assertGreaterEqual(rain['score'], 0)
        self.assertAlmostEqual(rain['ratio'], 1, delta=.06)
        self.assertEqual(sunny['weather'], 'SUNNY')
        self.assertEqual(sunny['status'], 'INVESTIGATE')
        self.assertLess(sunny['score'], 0)
        self.assertLess(sunny['ratio'], .5)
        self.assertGreater(sunny['gapInr'], 0)

    def test_comparison_metrics_reproducible_and_honest(self):
        original, normalised, threshold = self.report['comparisons']
        self.assertEqual(original['confusionMatrix'], [[73, 47], [0, 22]])
        self.assertEqual(normalised['confusionMatrix'], [[113, 7], [0, 22]])
        self.assertEqual(threshold['confusionMatrix'], [[120, 0], [3, 19]])
        self.assertLess(normalised['rainyCloudyFalseAlerts'], original['rainyCloudyFalseAlerts'])
        self.assertEqual(normalised['recall'], 1)
        # The simple residual comparator has fewer false positives; do not hide this.
        self.assertLess(threshold['falsePositives'], normalised['falsePositives'])

    def test_baseline_units_orientation_and_temperature(self):
        w = {'shortwaveRadiation': 1000, 'gti': 1000, 'cloudCover': 0, 'precipitation': 0, 'temperatureC': 25, 'isDay': 1}
        self.assertAlmostEqual(expected_hour(self.seed['site'], w), 140)
        no_temp = {**self.seed['site'], 'temperatureCoefficient': None, 'noctC': None}
        self.assertAlmostEqual(expected_hour(no_temp, w), 160)
        missing = {**w, 'gti': None}
        self.assertIsNone(expected_hour(self.seed['site'], missing))
        horizontal = {**no_temp, 'tilt': None, 'azimuth': None}
        self.assertEqual(expected_hour(horizontal, missing), 160)
        self.assertEqual(expected_hour(self.seed['site'], {**w, 'isDay': 0}), 0)

    def test_missing_and_meter_inconsistent_days_not_scored_or_valued(self):
        excluded = [d for d in self.report['days'] if not d['eligible']]
        self.assertEqual(len(excluded), 3)
        codes = {warning for day in excluded for warning in day['warnings']}
        self.assertTrue({'MISSING_SOLAR', 'MISSING_WEATHER', 'METER_INCONSISTENCY'} <= codes)
        for day in excluded:
            self.assertIsNone(day['score']); self.assertIsNone(day['gapInr']); self.assertIsNone(day['ratio'])
        json.dumps(self.report, allow_nan=False)

    def test_actual_data_never_used_to_generate_expected_baseline(self):
        solar = copy.deepcopy(self.seed['solar'])
        target = self.report['examples']['rainy']
        zone = ZoneInfo(self.seed['site']['timezone'])
        for s in solar:
            if datetime.fromtimestamp(s['timestamp'] - 1, zone).date().isoformat() == target and s['actualKwh']:
                s['actualKwh'] *= .3
                s['gridImportKwh'] = max(0, s['loadKwh'] - s['actualKwh'])
        changed = weather_infer(solar, self.seed['weather'], self.seed['site'], synthetic=True)
        for old, new in zip(self.report['days'], changed['days']):
            self.assertEqual(old['expectedKwh'], new['expectedKwh'])
            if old['date'] != target:
                self.assertEqual(old['score'], new['score'])

    def test_no_label_leakage_or_test_set_fitting(self):
        solar = [{**s, 'label': 1 - s['label'], 'scenario': 'OTHER'} for s in self.seed['solar']]
        changed = weather_infer(solar, self.seed['weather'], self.seed['site'], synthetic=True)
        self.assertEqual([d['score'] for d in self.report['days']], [d['score'] for d in changed['days']])

    def test_night_readings_do_not_drive_production_scoring(self):
        solar = copy.deepcopy(self.seed['solar'])
        by_time = {w['timestamp']: w for w in self.seed['weather']}
        for s in solar:
            if by_time[s['timestamp']]['isDay'] == 0:
                s['actualKwh'] = None
        changed = weather_infer(solar, self.seed['weather'], self.seed['site'], synthetic=True)
        self.assertEqual([d['score'] for d in self.report['days']], [d['score'] for d in changed['days']])
        night_weather = [{**w, 'isDay': 0, 'shortwaveRadiation': 0, 'gti': 0} for w in self.seed['weather'][:24]]
        night_solar = [{**s, 'actualKwh': 0, 'gridImportKwh': s['loadKwh']} for s in self.seed['solar'][:24]]
        night = weather_infer(night_solar, night_weather, self.seed['site'])['days'][0]
        self.assertFalse(night['eligible']); self.assertIsNone(night['score']); self.assertIsNone(night['gapInr'])
        self.assertIn('NO_SCOREABLE_DAYLIGHT', night['warnings'])

    def test_financial_gap_is_interval_matched_and_money_safe(self):
        from savings_detective import charge_paise
        target = self.report['examples']['sunnyAlert']
        zone = ZoneInfo(self.seed['site']['timezone'])
        by_time = {w['timestamp']: w for w in self.seed['weather']}
        expected = actual = 0
        for s in self.seed['solar']:
            if datetime.fromtimestamp(s['timestamp'] - 1, zone).date().isoformat() != target:
                continue
            estimate = expected_hour(self.seed['site'], by_time[s['timestamp']])
            if estimate:
                expected += charge_paise(min(s['loadKwh'], estimate), 9)
                actual += charge_paise(min(s['loadKwh'], s['actualKwh']), 9)
        day = next(d for d in self.report['days'] if d['date'] == target)
        self.assertEqual(day['gapInr'], (expected - actual) / 100)

    def test_dst_and_insufficient_training_are_explicit(self):
        site = {**self.seed['site'], 'timezone': 'Europe/Berlin', 'tilt': None, 'azimuth': None}
        start = datetime(2025, 3, 30, tzinfo=ZoneInfo(site['timezone']))
        end = start + timedelta(days=1)
        timestamps = list(range(int(start.timestamp()) + 3600, int(end.timestamp()) + 1, 3600))
        self.assertEqual(len(timestamps), 23)
        weather = [{'timestamp': t, 'shortwaveRadiation': 500, 'gti': None, 'cloudCover': 10, 'precipitation': 0, 'temperatureC': 20, 'isDay': 1} for t in timestamps]
        solar = [{'timestamp': t, 'actualKwh': expected_hour(site, weather[0]), 'loadKwh': 200, 'gridImportKwh': 200 - expected_hour(site, weather[0])} for t in timestamps]
        result = weather_infer(solar, weather, site)
        self.assertEqual(len(result['days']), 1)
        self.assertTrue(result['days'][0]['eligible'])
        self.assertEqual(result['days'][0]['status'], 'INSUFFICIENT_TRAINING')
        self.assertIsNone(result['comparisons'][0]['precision'])

    def test_missing_intervals_and_bad_settings_are_rejected_or_excluded(self):
        solar = self.seed['solar'][:240] + self.seed['solar'][241:]
        result = weather_infer(solar, self.seed['weather'], self.seed['site'], synthetic=True)
        # Missing training intervals reduce training eligibility rather than becoming zero.
        self.assertEqual(result['summary']['trainDays'], 219)
        with self.assertRaises(ValueError):
            weather_infer(self.seed['solar'], self.seed['weather'], {**self.seed['site'], 'performanceRatio': 2})
        with self.assertRaises(ValueError):
            weather_infer([self.seed['solar'][0], self.seed['solar'][0]], self.seed['weather'], self.seed['site'])

if __name__ == '__main__':
    unittest.main(verbosity=2)
