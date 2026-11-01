import copy
import json
import unittest
from pathlib import Path
import pandas as pd
from savings_detective import template, infer, charge_paise, validate

class SavingsDetectiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = template()['records']
        cls.result = infer(cls.records)

    def test_predictions_and_scores_reproduce_supplied_evaluation(self):
        saved = pd.read_csv(Path(__file__).resolve().parents[2] / 'solaris_isolation_forest/scored_evaluation.csv')
        self.assertEqual(len(saved), len(self.result['days']))
        for source, actual in zip(saved.to_dict('records'), self.result['days']):
            self.assertEqual(source['date'], actual['date'])
            self.assertEqual(source['status'], actual['status'])
            if actual['score'] is not None:
                self.assertAlmostEqual(source['decision_score'], actual['score'], places=12)
        evaluation = self.result['evaluation']
        self.assertEqual(evaluation['confusionMatrix'], [[131, 3], [0, 10]])
        self.assertAlmostEqual(evaluation['precision'], 10 / 13)
        self.assertEqual(evaluation['recall'], 1)
        self.assertEqual(self.result['summary']['flags'], 13)

    def test_missing_data_has_no_score_or_financial_loss(self):
        missing = [day for day in self.result['days'] if day['status'] == 'MISSING_DATA']
        self.assertEqual(len(missing), 1)
        self.assertEqual(missing[0]['date'], '2025-10-18')
        for key in ['actualKwh', 'score', 'gapInr', 'actualAvoidedInr', 'expectedAvoidedInr']:
            self.assertIsNone(missing[0][key])
        self.assertEqual(self.result['summary']['validDays'], 144)
        json.dumps(self.result, allow_nan=False)

    def test_money_rounding_and_load_cap(self):
        self.assertEqual(charge_paise(0.005, 1), 1)
        self.assertEqual(charge_paise(0.1, 0.2), 2)
        for day in self.result['days']:
            if day['actualKwh'] is None:
                continue
            expected = charge_paise(min(day['loadKwh'], day['expectedKwh']), 9)
            actual = charge_paise(min(day['loadKwh'], day['actualKwh']), 9)
            self.assertEqual(day['gapInr'], (expected - actual) / 100)
        records = copy.deepcopy(self.records)
        records[239]['mall_load_kwh'] = 10
        low_load = infer(records)['days'][19]
        self.assertEqual(low_load['expectedAvoidedInr'], 90)
        self.assertEqual(low_load['actualAvoidedInr'], 90)
        self.assertEqual(low_load['gapInr'], 0)

    def test_higher_output_flags_are_not_losses(self):
        high = [d for d in self.result['days'] if d['status'] == 'INVESTIGATE' and d['direction'] == 'ABOVE_BASELINE']
        self.assertEqual(len(high), 3)
        self.assertTrue(all(d['gapInr'] < 0 for d in high))
        self.assertGreater(self.result['summary']['flaggedSurplusInr'], 0)
        valid = [d for d in self.result['days'] if d['gapInr'] is not None]
        self.assertEqual(self.result['summary']['netGapInr'], sum(round(d['gapInr'] * 100) for d in valid) / 100)

    def test_labels_and_saved_features_do_not_feed_inference(self):
        records = copy.deepcopy(self.records)
        for row in records:
            row['injected_anomaly_label'] = 1 - row['injected_anomaly_label']
            row['generation_ratio'] = 9999
            row['decision_score'] = -9999
        result = infer(records)
        self.assertEqual(self.result['days'], result['days'])

    def test_heldout_changes_do_not_refit_or_alter_other_days(self):
        records = copy.deepcopy(self.records)
        records[230]['actual_generation_kwh'] = 0
        result = infer(records)
        self.assertEqual(result['model'], self.result['model'])
        for n, day in enumerate(result['days']):
            if n != 10:
                self.assertEqual(day, self.result['days'][n])

    def test_invalid_inputs_rejected(self):
        for value in [float('nan'), -1, '9', True, 101]:
            with self.assertRaises(ValueError):
                validate(self.records, value)
        for field, value in [('actual_generation_kwh', -1), ('expected_generation_kwh', 0), ('grid_import_kwh', float('inf'))]:
            records = copy.deepcopy(self.records)
            records[0][field] = value
            with self.assertRaises(ValueError):
                infer(records)
        records = copy.deepcopy(self.records)
        records[1]['date'] = records[0]['date']
        with self.assertRaises(ValueError):
            infer(records)
        with self.assertRaises(ValueError):
            infer(self.records[:220])

    def test_all_evaluation_readings_missing_remains_safe(self):
        records = copy.deepcopy(self.records)
        for row in records[220:]:
            row['actual_generation_kwh'] = None
        result = infer(records)
        self.assertEqual(result['summary']['missingDays'], 145)
        self.assertEqual(result['summary']['netGapInr'], 0)
        self.assertEqual(result['summary']['flags'], 0)
        json.dumps(result, allow_nan=False)

if __name__ == '__main__':
    unittest.main(verbosity=2)
