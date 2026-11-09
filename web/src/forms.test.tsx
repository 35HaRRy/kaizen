import { test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicForm } from "./components/PublicForm";
afterEach(() => vi.unstubAllGlobals());

test("failed sending preserves input and never shows success", async () => {
  vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "test-key");
  window.turnstile = {
    render: (_node, options) => {
      queueMicrotask(() => options.callback("test-token"));
      return "widget";
    },
    remove: () => {},
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
             error: { message: "Mesaj kaydedilemedi." },
          }),
          { status: 503 },
        ),
    ),
  );
  render(<PublicForm kind="contact" />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Adınız Soyadınız"), "Ayşe");
  await user.type(
    screen.getByLabelText("E-posta Adresiniz"),
    "ayse@example.com",
  );
  await user.type(screen.getByLabelText("Mesajınız"), "Merhaba");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Mesaj Gönder" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Mesaj Gönder" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Mesaj kaydedilemedi.",
  );
  expect(screen.getByLabelText("Adınız Soyadınız")).toHaveValue("Ayşe");
  expect(screen.queryByText("Mesajınız Alındı!")).not.toBeInTheDocument();
});
