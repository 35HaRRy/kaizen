import type { ErrorRequestHandler } from "express";
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error?.type === "entity.too.large") {
    res
      .status(413)
      .json({ error: { code: "BODY_TOO_LARGE", message: "İstek çok büyük." } });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res
      .status(400)
      .json({ error: { code: "INVALID_JSON", message: "Geçersiz istek." } });
    return;
  }
  // Never log request bodies, driver errors (may contain credentials), or tokens.
  console.error("API request failed", error?.name ?? "Error");
  res
    .status(503)
    .json({
      error: {
        code: "UNAVAILABLE",
        message: "İşlem şu anda tamamlanamıyor. Lütfen tekrar deneyin.",
      },
    });
};
export function text(value: unknown, max: number, min = 1): string {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max ||
    /\u0000/.test(value)
  )
    throw new HttpError(400, "VALIDATION", "Lütfen alanları kontrol edin.");
  return value.trim();
}
