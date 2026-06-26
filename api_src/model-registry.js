import {
  getModelRegistryRecord,
  getRegistrySummary,
  listModelRegistryRecords
} from "../src/engines/modelRegistry.js";

function setCors(res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id");
}

function getQuery(req) {
  if (req.query) {
    return req.query;
  }
  return Object.fromEntries(new URL(req.url || "/", "http://localhost").searchParams.entries());
}

export default async function modelRegistryHandler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const query = getQuery(req);
  const model = query.model || query.modelType || query.key;

  if (model) {
    const record = getModelRegistryRecord(model);
    return res.status(200).json({
      ok: true,
      contractVersion: "model-registry.record.v1",
      record: {
        ...record,
        rollbackAvailable: Boolean(record.rollbackTarget),
        lineageId: `${record.registryId}:${record.version}`
      }
    });
  }

  return res.status(200).json({
    ok: true,
    contractVersion: "model-registry.summary.v1",
    summary: getRegistrySummary(),
    records: listModelRegistryRecords()
  });
}
