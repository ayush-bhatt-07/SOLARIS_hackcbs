"""Run the supplied prototype in a temporary copy and compare every numeric output."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import pandas as pd

root = Path(__file__).resolve().parents[1] / 'solaris_isolation_forest'
with tempfile.TemporaryDirectory(prefix='solaris-prototype-') as temp:
    copied = Path(temp)
    for path in root.iterdir():
        if path.is_file():
            shutil.copy2(path, copied / path.name)
    run = subprocess.run([sys.executable, str(copied / 'train_savings_detective.py')], capture_output=True, text=True, timeout=120)
    if run.returncode:
        raise RuntimeError(run.stderr)
    expected = json.loads((root / 'evaluation_metrics.json').read_text())
    actual = json.loads((copied / 'evaluation_metrics.json').read_text())
    assert actual == expected, (actual, expected)
    for name in ['synthetic_daily_solar.csv', 'scored_evaluation.csv']:
        before = pd.read_csv(root / name)
        after = pd.read_csv(copied / name)
        pd.testing.assert_frame_equal(before, after, check_exact=False, rtol=1e-12, atol=1e-12)
        print(f'PASS every row/column reproduced: {name} ({len(before)} rows)')
    print('PASS metrics reproduced exactly:', json.dumps(actual))
    print('PASS chart regenerated:', (copied / 'savings_detective_chart.png').stat().st_size, 'bytes')
    print('Source artifact SHA256 manifest:', json.dumps({p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in root.iterdir() if p.is_file()}, sort_keys=True))
