import { loadConfig } from "./config.js";
import { connectDb } from "./db.js";
import { buildApp } from "./app.js";
const config = loadConfig();
const { db, client } = await connectDb(config);
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";
const server = buildApp({ db, config }).listen(
  port,
  host,
  () => console.log(`API: http://${host}:${port}`),
);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.once(signal, () => server.close(() => { void client.close(); }));
