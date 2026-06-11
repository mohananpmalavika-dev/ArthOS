import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse/dist/pdf-parse/cjs/index.cjs');

async function run() {
  const file = process.argv[2] || './SANKHYA_ARTHOS_Blueprint_V3.pdf';
  try {
    const data = fs.readFileSync(file);
    const parsed = await pdf(data);
    // Print plain text for downstream processing
    process.stdout.write(parsed.text || "");
  } catch (err) {
    console.error('PDF extract error:', err?.message || err);
    process.exit(2);
  }
}

run();
