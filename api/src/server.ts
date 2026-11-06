import { loadConfig } from "./config.js";
import { connectDb } from "./db.js";
import { buildApp } from "./app.js";
const config = loadConfig();
const { db, client } = await connectDb(config);
const server = buildApp({ db, config }).listen(
  Number(process.env.PORT ?? 3001),
  "127.0.0.1",
  () => console.log("API: http://localhost:3001"),
);
process.on("SIGTERM", () =>
  server.close(() => {
    void client.close();
  }),
);
