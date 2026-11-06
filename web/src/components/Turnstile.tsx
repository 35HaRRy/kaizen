import { useEffect, useRef, useState } from "react";
interface TurnstileOptions {
  sitekey: string;
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}
declare global {
  interface Window {
    turnstile?: {
      render: (node: HTMLElement, options: TurnstileOptions) => string;
      remove: (id: string) => void;
    };
  }
}
let scriptPromise: Promise<void> | undefined;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        scriptPromise = undefined;
        reject(new Error("Turnstile yüklenemedi."));
      };
      document.head.append(script);
    });
  return scriptPromise;
}
export function Turnstile({
  action,
  onToken,
}: {
  action: string;
  onToken: (token: string) => void;
}) {
  const node = useRef<HTMLDivElement>(null),
    callback = useRef(onToken);
  callback.current = onToken;
  const [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false,
      id: string | undefined;
    const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!sitekey) {
      setError(
        "Güvenlik doğrulaması yapılandırılmamış. Lütfen telefonla ulaşın.",
      );
      return;
    }
    setError("");
    loadScript()
      .then(() => {
        if (disposed || !node.current) return;
        id = window.turnstile!.render(node.current, {
          sitekey,
          action,
          callback: (token) => {
            setError("");
            callback.current(token);
          },
          "expired-callback": () => callback.current(""),
          "error-callback": () => {
            callback.current("");
            setError("Güvenlik doğrulaması yüklenemedi.");
          },
        });
      })
      .catch(() => {
        if (!disposed) setError("Güvenlik doğrulaması yüklenemedi.");
      });
    return () => {
      disposed = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [action, attempt]);
  return (
    <div>
      <div ref={node} />
      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Yeniden dene
          </button>
        </p>
      )}
    </div>
  );
}
