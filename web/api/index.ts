import type { IncomingMessage, ServerResponse } from "node:http";
import { loadConfig } from "../../api/src/config.js";
import { connectDb } from "../../api/src/db.js";
import { buildApp } from "../../api/src/app.js";
let appPromise: Promise<ReturnType<typeof buildApp>> | undefined;
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    if (!appPromise) {
      appPromise = (async () => {
        const config = loadConfig();
        const { db } = await connectDb(config);
        return buildApp({ db, config });
      })();
      appPromise.catch(() => {
        appPromise = undefined;
      });
    }
    (await appPromise)(req, res);
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: { code: "UNAVAILABLE", message: "Servis kullanılamıyor." },
      }),
    );
  }
}
