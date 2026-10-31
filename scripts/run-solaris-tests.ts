import { runAllSolarisTests } from '../src/tests/solarisTests';

const results = runAllSolarisTests();
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.message}`);
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  process.exitCode = 1;
}
