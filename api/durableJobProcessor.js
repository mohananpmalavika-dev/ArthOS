import handler from '../api_src/durableJobProcessor.js';

export default async function(req, res) {
  // Delegate to existing processor in api_src
  return handler(req, res);
}
