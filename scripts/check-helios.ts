import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY?.trim()) {
  console.error('Helios is not configured: add GEMINI_API_KEY to the repository .env file. Do not commit the key.');
  process.exitCode = 2;
} else {
  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 15000 } });
    if (process.argv.includes('--list-models')) {
      const models = await client.models.list({ config: { pageSize: 100 } });
      for await (const model of models) {
        if (model.supportedActions?.includes('generateContent')) console.log(model.name);
      }
    } else {
    const response = await client.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3.5-flash', contents: 'Reply with exactly HELIOS_READY.', config: { maxOutputTokens: 128 } });
    if (response.text?.includes('HELIOS_READY')) console.log('PASS: server-side Gemini generation responded. No key or private customer data was printed.');
    else { console.error('Gemini responded, but the readiness response did not match. Review the configured model.'); process.exitCode = 1; }
    }
  } catch (error) {
    const status = Number((error as { status?: number }).status);
    console.error(`Helios Gemini check failed${Number.isFinite(status) ? ` (HTTP ${status})` : ''}. Check the key, configured model, quota and network. Credentials were not logged.`);
    process.exitCode = 1;
  }
}
