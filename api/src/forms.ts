import type { Express } from "express";
import type { Db } from "mongodb";
import type { MessageInput } from "../../shared/messages.js";
import type { Config } from "./config.js";
import { HttpError, text } from "./errors.js";
import { rateLimit } from "./rate-limit.js";
export interface FormServices {
  verify(
    token: string,
  ): Promise<{ success: boolean; hostname?: string; action?: string }>;
}
export function createFormServices(env = process.env): FormServices {
  return {
    async verify(token) {
      if (!env.TURNSTILE_SECRET_KEY)
        throw new HttpError(
          503,
          "TURNSTILE",
          "Güvenlik servisi yapılandırılmamış.",
        );
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: token,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok) throw new Error("Turnstile unavailable");
      return response.json();
    },
  };
}
export function registerForms(
  app: Express,
  db: Db,
  config: Config,
  services: FormServices = createFormServices(),
) {
  for (const trial of [false, true])
    app.post(
      trial ? "/api/trial-requests" : "/api/contact",
      async (req, res) => {
        await rateLimit(db, req, config, "forms", 5);
        const body = req.body ?? {},
          name = text(trial ? body.fullName : body.name, 120),
          email = text(body.email, 254);
        if (
          !/^[^\s@<>(),;:\\"]+@[^\s@<>(),;:\\"]+\.[^\s@<>(),;:\\"]+$/.test(
            email,
          ) ||
          /[\r\n]/.test(email)
        )
          throw new HttpError(400, "EMAIL", "E-posta adresini kontrol edin.");
        let input: MessageInput;
        if (trial) {
          const phone = text(body.phone, 30, 7),
            group = text(body.group, 80);
          if (
            !/^[+\d\s()\-]+$/.test(phone) ||
            ![
              "Minikler Grubu (5-7 Yaş)",
              "Çocuklar Grubu (7-13 Yaş)",
              "Yetişkinler Grubu (13+ Yaş)",
            ].includes(group)
          )
            throw new HttpError(
              400,
              "VALIDATION",
              "Telefon ve eğitim grubunu kontrol edin.",
            );
          input = { type: "trial", name, email, phone, group, notes: text(body.notes ?? "", 5000, 0) };
        } else
          input = { type: "contact", name, email, message: text(body.message, 5000) };
        const token = text(body.turnstileToken, 2048);
        let result;
        try {
          result = await services.verify(token);
        } catch {
          throw new HttpError(
            503,
            "TURNSTILE",
            "Güvenlik servisine ulaşılamıyor. Lütfen yeniden deneyin.",
          );
        }
        if (
          result.success !== true ||
          result.hostname !== new URL(config.origin).hostname ||
          result.action !== (trial ? "trial_request" : "contact")
        )
          throw new HttpError(
            400,
            "TURNSTILE",
            "Güvenlik doğrulaması başarısız. Lütfen yeniden deneyin.",
          );
        await db.collection("messages").insertOne({
          ...input,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
        res.json({ ok: true });
      },
    );
}
