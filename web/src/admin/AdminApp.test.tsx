import { test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminApp from "./AdminApp";

afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, "", "/"); });

test.each(["/admin/messages", "/admin/messages/000000000000000000000001"])("admin routes messages directly and activates their menu: %s", async (path) => {
  window.history.replaceState({}, "", path);
  vi.stubGlobal("fetch", vi.fn(async (url, init) => {
    if (url === "/api/auth/session") return new Response(JSON.stringify({ username: "sensei", csrfToken: "token" }));
    if (String(url).startsWith("/api/admin/messages?page=")) return new Response(JSON.stringify({ messages: [], page: 1, hasMore: false }));
    if (init?.method === "POST") return new Response(JSON.stringify({ ok: true }));
    return new Response(JSON.stringify({ id: "000000000000000000000001", type: "contact", name: "Ayşe", email: "ayse@example.com", message: "Merhaba", createdAt: "2026-11-09T12:00:00Z", isRead: false }));
  }));
  render(<AdminApp />);
  expect(await screen.findByRole("link", { name: "Kullanıcı mesajları" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Etkinlikler" })).not.toHaveAttribute("aria-current");
  expect(screen.queryByText("Sayfa bulunamadı.")).not.toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: path.endsWith("messages") ? "Kullanıcı mesajları" : "Ayşe" })).toBeInTheDocument();
});

test("existing event list route stays active", async () => {
  window.history.replaceState({}, "", "/admin");
  vi.stubGlobal("fetch", vi.fn(async (url) => new Response(JSON.stringify(url === "/api/auth/session" ? { username: "sensei", csrfToken: "token" } : { events: [] }))));
  render(<AdminApp />);
  expect(await screen.findByRole("link", { name: "Etkinlikler" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Kullanıcı mesajları" })).not.toHaveAttribute("aria-current");
  expect(await screen.findByRole("button", { name: "Yeni Etkinlik Ekle" })).toBeInTheDocument();
});
