import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { UserMessage } from "../../../shared/messages";
import { apiRequest, errorMessage } from "../api";

export function MessageDetail({ messageId }: { messageId: string }) {
  const [message, setMessage] = useState<UserMessage>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMessage(undefined);
    async function load() {
      try {
        const data = await apiRequest<UserMessage>(`/admin/messages/${messageId}`);
        if (!active) return;
        setMessage(data);
        if (!data.isRead) {
          await apiRequest(`/admin/messages/${messageId}/read`, { method: "POST" });
          if (active) setMessage({ ...data, isRead: true });
        }
      } catch (error) {
        if (active) setError(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [messageId, retry]);

  return (
    <>
      <a href="/admin/messages" className="message-back"><ArrowLeft size={16} />Kullanıcı mesajlarına dön</a>
      {loading && <div className="admin-empty" role="status">Mesaj yükleniyor…</div>}
      {error && <p role="alert" className="admin-error">{error}{" "}<button className="text-button" disabled={loading} onClick={() => setRetry((n) => n + 1)}>Yeniden dene</button></p>}
      {message && (
        <article className="admin-message-detail">
          <div className="admin-page-heading">
            <div><h1>{message.name}</h1><p>{message.type === "contact" ? "Hızlı mesaj" : "Ücretsiz deneme dersi"}</p></div>
            <span className={`message-read-state${message.isRead ? "" : " unread"}`}>{message.isRead ? "Okundu" : "Okunmadı"}</span>
          </div>
          <dl className="message-fields">
            <div><dt>E-posta</dt><dd>{message.email}</dd></div>
            <div><dt>Gönderim tarihi</dt><dd><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</time></dd></div>
            {message.type === "trial" && <>
              <div><dt>Telefon</dt><dd>{message.phone}</dd></div>
              <div><dt>Eğitim grubu</dt><dd>{message.group}</dd></div>
            </>}
          </dl>
          <section className="message-body" aria-labelledby="message-content-title">
            <h2 id="message-content-title">{message.type === "contact" ? "Mesaj" : "Notlar"}</h2>
            <p>{message.type === "contact" ? message.message : message.notes || "Not eklenmemiş."}</p>
          </section>
          {message.type === "trial" && <p className="message-trial-note">Bu bir deneme dersi talebidir; kesinleşmiş randevu değildir.</p>}
        </article>
      )}
    </>
  );
}
