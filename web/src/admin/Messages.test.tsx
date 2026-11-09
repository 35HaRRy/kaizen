import { test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageList } from "./MessageList";
import { MessageDetail } from "./MessageDetail";
import type { UserMessage } from "../../../shared/messages";

const message: UserMessage = { id: "000000000000000000000001", type: "contact", name: "Ayşe", email: "ayse@example.com", message: "<img src=x onerror=alert(1)>\nMerhaba", createdAt: "2026-11-09T12:00:00.000Z", isRead: false };
const trial: UserMessage = { id: "000000000000000000000002", type: "trial", name: "Ali", email: "ali@example.com", phone: "+90 555 123 4567", group: "Yetişkinler Grubu (13+ Yaş)", notes: "Akşam uygunum.", createdAt: "2026-11-09T13:00:00.000Z", isRead: true };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

test("list exposes message types, read status, detail links and pagination", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (url === "/api/admin/messages?page=1") return json({ messages: [message], page: 1, hasMore: true });
    if (url === "/api/admin/messages?page=2") return json({ messages: [trial], page: 2, hasMore: false });
    throw new Error(`Unexpected ${url}`);
  }));
  render(<MessageList />);
  expect(screen.getByRole("status")).toHaveTextContent("yükleniyor");
  const link = await screen.findByRole("link", { name: /Ayşe/ });
  expect(link).toHaveAttribute("href", `/admin/messages/${message.id}`);
  expect(screen.getByText("Hızlı mesaj")).toBeInTheDocument();
  expect(screen.getByText("Okunmadı")).toBeInTheDocument();
  expect(screen.getByText("ayse@example.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Önceki" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Sonraki" }));
  expect(await screen.findByText("Ücretsiz deneme dersi")).toBeInTheDocument();
  expect(screen.getByText("Okundu")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sonraki" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Önceki" }));
  expect(await screen.findByText("Ayşe")).toBeInTheDocument();
});

test("list retries failures without presenting them as an empty inbox", async () => {
  let fail = true;
  vi.stubGlobal("fetch", vi.fn(async () => fail ? json({ error: { code: "UNAVAILABLE", message: "Bağlantı kurulamadı." } }, 503) : json({ messages: [], page: 1, hasMore: false })));
  render(<MessageList />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Bağlantı kurulamadı.");
  expect(screen.queryByText("Henüz mesaj yok.")).not.toBeInTheDocument();
  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "Yeniden dene" }));
  expect(await screen.findByText("Henüz mesaj yok.")).toBeInTheDocument();
});

test("detail renders contact text safely and marks it read only after fetching it", async () => {
  let fetched = false;
  let marked = false;
  vi.stubGlobal("fetch", vi.fn(async (url, init) => {
    if (url === `/api/admin/messages/${message.id}` && !init?.method) { fetched = true; return json(message); }
    if (url === `/api/admin/messages/${message.id}/read` && init?.method === "POST" && fetched) { marked = true; return json({ ok: true }); }
    throw new Error("Unexpected request");
  }));
  const { container } = render(<MessageDetail messageId={message.id} />);
  expect(await screen.findByRole("heading", { name: "Ayşe" })).toBeInTheDocument();
  expect(await screen.findByText("Okundu")).toBeInTheDocument();
  expect(marked).toBe(true);
  expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByRole("link", { name: /Kullanıcı mesajlarına dön/ })).toHaveAttribute("href", "/admin/messages");
});

test("trial detail shows every supplied field", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => json(trial)));
  render(<MessageDetail messageId={trial.id} />);
  for (const text of ["Ali", trial.email, trial.phone, trial.group, trial.notes])
    expect(await screen.findByText(text)).toBeInTheDocument();
});

test("failed read update preserves unread state and can be retried", async () => {
  let fail = true;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => init?.method === "POST" ? (fail ? json({ error: { code: "UNAVAILABLE", message: "Okunma durumu kaydedilemedi." } }, 503) : json({ ok: true })) : json(message)));
  render(<MessageDetail messageId={message.id} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Okunma durumu kaydedilemedi.");
  expect(screen.getByText("Okunmadı")).toBeInTheDocument();
  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "Yeniden dene" }));
  expect(await screen.findByText("Okundu")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});

test("failed detail never attempts to mark a message read", async () => {
  let writes = 0;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    if (init?.method === "POST") writes++;
    return json({ error: { code: "NOT_FOUND", message: "Mesaj bulunamadı." } }, 404);
  }));
  render(<MessageDetail messageId={message.id} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Mesaj bulunamadı.");
  expect(writes).toBe(0);
  expect(screen.queryByText("Okundu")).not.toBeInTheDocument();
});
