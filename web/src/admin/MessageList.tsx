import { useEffect, useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import type { UserMessage } from "../../../shared/messages";
import { apiRequest, errorMessage } from "../api";

export function MessageList() {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<{ messages: UserMessage[]; hasMore: boolean }>(`/admin/messages?page=${page}`)
      .then((data) => {
        if (active) { setMessages(data.messages); setHasMore(data.hasMore); }
      })
      .catch((error) => { if (active) setError(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, retry]);

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Kullanıcı mesajları</h1>
          <p>İletişim mesajları ve ücretsiz deneme dersi talepleri.</p>
        </div>
      </div>
      {loading ? <div className="admin-empty" role="status">Mesajlar yükleniyor…</div> : error ? (
        <p role="alert" className="admin-error">{error}{" "}<button className="text-button" onClick={() => setRetry((n) => n + 1)}>Yeniden dene</button></p>
      ) : messages.length === 0 ? (
        <div className="admin-empty"><Mail size={38} /><h2>Henüz mesaj yok.</h2><p>Formlardan gelen mesajlar burada listelenecek.</p></div>
      ) : (
        <ul className="admin-message-list" aria-label="Mesajlar">
          {messages.map((message) => (
            <li key={message.id}>
              <a href={`/admin/messages/${message.id}`} className="admin-message-row">
                <div className="message-sender"><strong>{message.name}</strong><span>{message.email}</span></div>
                <span>{message.type === "contact" ? "Hızlı mesaj" : "Ücretsiz deneme dersi"}</span>
                <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</time>
                <span className={`message-read-state${message.isRead ? "" : " unread"}`}>{message.isRead ? "Okundu" : "Okunmadı"}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
      <nav className="message-pagination" aria-label="Mesaj sayfaları">
        <button className="admin-button secondary" disabled={loading || page === 1} onClick={() => setPage((n) => n - 1)}>Önceki</button>
        <span>Sayfa {page}</span>
        <button className="admin-button secondary" disabled={loading || !!error || !hasMore} onClick={() => setPage((n) => n + 1)}>Sonraki</button>
      </nav>
    </>
  );
}
