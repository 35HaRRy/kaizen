export interface Config {
  uri: string;
  dbName: string;
  origin: string;
  production: boolean;
  originSecret?: string;
}
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!env.MONGODB_DB || !/^[a-zA-Z0-9_-]+$/.test(env.MONGODB_DB))
    throw new Error("MONGODB_DB is required");
  if (!env.APP_ORIGIN) throw new Error("APP_ORIGIN is required");
  const origin = new URL(env.APP_ORIGIN).origin;
  const production = env.NODE_ENV === "production";
  if (production && !origin.startsWith("https://"))
    throw new Error("APP_ORIGIN must use HTTPS");
  const originSecret = env.ORIGIN_SECRET;
  if ((production || originSecret !== undefined) && !/^[a-f0-9]{64}$/.test(originSecret ?? ""))
    throw new Error("ORIGIN_SECRET must be 32 random bytes encoded as 64 lowercase hex characters");
  return {
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB,
    origin,
    production,
    originSecret,
  };
}
