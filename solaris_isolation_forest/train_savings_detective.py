"""Solaris Savings Detective: reproducible SYNTHETIC demonstration.
Run: pip install -r requirements.txt && python train_savings_detective.py
No production reliability or equipment diagnosis is implied.
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT=Path(__file__).resolve().parent
rng=np.random.default_rng(42)
n=365
period=pd.date_range('2025-01-01', periods=n, freq='D')
day=np.arange(n)
# Synthetic irradiance-driven expectations, 200-kWp site: 650-1050 kWh/day.
season=0.92+0.13*np.sin(2*np.pi*(day-80)/365)
cloudiness=np.clip(rng.normal(0.91,0.10,n),0.48,1.04)
expected=np.clip(900*season*cloudiness,300,None)
# Main mall load, deliberately larger than solar generation for simple demo accounting.
load=1800+180*np.sin(2*np.pi*(day-20)/365)+rng.normal(0,55,n)
# Normal inverter production and grid import.
actual=np.maximum(0,expected*(1+rng.normal(0,0.045,n)))
labels=np.zeros(n,dtype=int)
# Inject distinct post-training events in held-out period, with known ground truth.
train_n=220
anom_days=np.array([239,240,241,267,268,302,326,327,349,350])
labels[anom_days]=1
actual[anom_days] *= np.array([.40,.43,.46,.32,.35,.49,.30,.33,.42,.39])
# One separate missing data day: quality flag, NOT an equipment fault.
missing_day=290
actual[missing_day]=np.nan
# Values are synthetic; baseline energy cost only, not complete DISCOM bill.
import_kwh=np.maximum(load-np.nan_to_num(actual,nan=0),0)
expected_import=np.maximum(load-expected,0)
actual_avoided=np.minimum(load,np.nan_to_num(actual,nan=0))*9
expected_avoided=np.minimum(load,expected)*9
frame=pd.DataFrame({'date':period.strftime('%Y-%m-%d'), 'expected_generation_kwh':expected,
    'actual_generation_kwh':actual,'mall_load_kwh':load,'grid_import_kwh':import_kwh,
    'expected_grid_import_kwh':expected_import,'expected_avoided_rupees':expected_avoided,
    'actual_avoided_rupees':actual_avoided,'injected_anomaly_label':labels,
    'data_missing':pd.isna(actual).astype(int)})
frame['generation_ratio']=frame.actual_generation_kwh/frame.expected_generation_kwh
frame['import_residual_kwh']=frame.grid_import_kwh-frame.expected_grid_import_kwh
frame['avoided_cost_gap_rupees']=frame.expected_avoided_rupees-frame.actual_avoided_rupees
FEATURES=['generation_ratio','import_residual_kwh']
train=frame.iloc[:train_n].dropna(subset=FEATURES)
test=frame.iloc[train_n:].copy()
# Data only from chronological training interval; no test data used when fitting.
model=Pipeline([('scale',StandardScaler()),('iforest',IsolationForest(n_estimators=250,
    max_samples='auto',contamination=0.035,random_state=42,n_jobs=-1))])
model.fit(train[FEATURES]); eligible=test[FEATURES].notna().all(axis=1)
test.loc[eligible,'decision_score']=model.decision_function(test.loc[eligible,FEATURES])
test.loc[eligible,'flagged']=model.predict(test.loc[eligible,FEATURES])==-1
test['flagged']=test.flagged.fillna(False).astype(bool)
# Include data quality as independent issue; do not count missing meter data as an ML detection.
test['status']=np.where(~eligible,'MISSING_DATA',np.where(test.flagged,'INVESTIGATE','NORMAL'))
valid=test.loc[eligible]
y=valid.injected_anomaly_label.astype(int)
pred=valid.flagged.astype(int)
metrics={'source':'fully synthetic demonstration','train_days':len(train),'evaluation_days':len(valid),
  'injected_test_anomalies':int(y.sum()),'flagged_test_days':int(pred.sum()),
  'precision':float(precision_score(y,pred,zero_division=0)),
  'recall':float(recall_score(y,pred,zero_division=0)),
  'f1':float(f1_score(y,pred,zero_division=0)),
  'confusion_matrix_rows_true_0_1_columns_pred_0_1':confusion_matrix(y,pred,labels=[0,1]).tolist(),
  'caveat':'Injected anomalies are synthetic and easy to distinguish; results do not establish real-world model quality.'}
frame.to_csv(ROOT/'synthetic_daily_solar.csv',index=False)
test.to_csv(ROOT/'scored_evaluation.csv',index=False)
(ROOT/'evaluation_metrics.json').write_text(json.dumps(metrics,indent=2))
fig,axs=plt.subplots(2,1,figsize=(12,7),sharex=True,layout='constrained')
x=pd.to_datetime(test.date)
axs[0].plot(x,test.expected_generation_kwh,label='Weather-adjusted expected (synthetic)')
axs[0].plot(x,test.actual_generation_kwh,label='Actual (synthetic)',alpha=.85)
flag=test.flagged
axs[0].scatter(x[flag],test.loc[flag,'actual_generation_kwh'],s=35,label='Flagged by Isolation Forest',zorder=4)
axs[0].set_ylabel('Generation (kWh/day)');axs[0].legend();axs[0].set_title('Solaris Savings Detective — Held-out Evaluation')
axs[1].plot(x,test.avoided_cost_gap_rupees,label='Expected minus actual avoided cost')
axs[1].axhline(0,linewidth=.8)
axs[1].set_ylabel('Avoided-cost gap (₹/day)');axs[1].set_xlabel('Date');axs[1].legend()
fig.savefig(ROOT/'savings_detective_chart.png',dpi=150)
plt.close(fig)
print(json.dumps(metrics,indent=2))
print('Artifacts saved in',ROOT)
