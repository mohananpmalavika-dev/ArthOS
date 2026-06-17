import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require('express');

// Load the existing Express router (CommonJS) from api_src
const cognitionRouter = require('../api_src/longitudinal/cognition-graph-index.js');

const app = express();
app.use(express.json());
app.use('/api/cognition', cognitionRouter);

export default async function handler(req, res) {
  // Delegate to the express app; return a promise that resolves when response finishes
  return new Promise((resolve) => {
    // Ensure Express writes to the same res object
    res.once && res.once('finish', resolve);
    app(req, res, () => {
      // If no route matched, send 404
      if (!res.headersSent) res.status(404).json({ error: 'Cognition route not found' });
      resolve();
    });
  });
}
