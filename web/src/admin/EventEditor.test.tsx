import { test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventEditor } from "./EventEditor";
import type { EventItem } from "../../../shared/events";
const event: EventItem = {
  id: "abc",
  category: "Seminerler",
  date: "2026-11-06",
  title: "Eski başlık",
  description: "Birlikte çalışma",
  location: "Dojo",
  media: [
    {
      id: "a",
      key: "a",
      kind: "image",
      url: "https://media.test/a",
      mime: "image/jpeg",
      size: 20,
      originalName: "a.jpg",
    },
    {
      id: "b",
      key: "b",
      kind: "image",
      url: "https://media.test/b",
      mime: "image/jpeg",
      size: 20,
      originalName: "b.jpg",
    },
    {
      id: "v",
      key: "v",
      kind: "video",
      url: "https://media.test/v",
      mime: "video/mp4",
      size: 20,
      originalName: "v.mp4",
    },
  ],
  coverMediaId: "a",
  version: 1,
  createdAt: "",
  updatedAt: "",
};
afterEach(() => vi.unstubAllGlobals());
test("an imported event can keep its blank category while editing", async () => {
  let saved: any;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    if (init?.method === "PUT") {
      saved = JSON.parse(init.body);
      return new Response(JSON.stringify({ ...event, ...saved, version: 2 }));
    }
    return new Response(JSON.stringify({ ...event, category: "" }));
  }));
  render(<EventEditor eventId="abc" />);
  const category = await screen.findByLabelText("Tür");
  expect(category).toHaveValue("");
  await userEvent.type(screen.getByLabelText("Başlık"), " düzenlendi");
  await userEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  await waitFor(() => expect(saved.category).toBe(""));
  expect(await screen.findByText("Etkinlik kaydedildi.")).toBeInTheDocument();
  await userEvent.selectOptions(category, "Seminerler");
  await userEvent.selectOptions(category, "");
  expect(category).toHaveValue("");
});
test("save tracks dirty changes and preserves draft on version conflict", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, init) =>
      init?.method === "PUT"
        ? new Response(
            JSON.stringify({
              error: {
                code: "CONFLICT",
                message: "Başka bir sekmede değişti.",
              },
            }),
            { status: 409 },
          )
        : new Response(JSON.stringify(event)),
    ),
  );
  render(<EventEditor eventId="abc" />);
  const save = await screen.findByRole("button", { name: "Kaydet" });
  expect(save).toBeDisabled();
  const title = screen.getByLabelText("Başlık");
  await userEvent.clear(title);
  await userEvent.type(title, "Yeni başlık");
  expect(save).toBeEnabled();
  await userEvent.click(save);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Başka bir sekmede değişti.",
  );
  expect(title).toHaveValue("Yeni başlık");
  expect(save).toBeEnabled();
});
test("removing cover promotes next image, not video, before saving", async () => {
  let saved: any;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, init) => {
      if (init?.method === "PUT") {
        saved = JSON.parse(init.body);
        return new Response(
          JSON.stringify({
            ...event,
            ...saved,
            media: event.media.slice(1),
            version: 2,
          }),
        );
      }
      return new Response(JSON.stringify(event));
    }),
  );
  render(<EventEditor eventId="abc" />);
  await screen.findByRole("button", { name: "Kaydet" });
  expect(screen.getByRole("button", { name: "a.jpg kapak" })).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "v.mp4 kapak" }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "a.jpg galeriden kaldır" }),
  );
  expect(screen.getByRole("button", { name: "b.jpg kapak" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  await waitFor(() => expect(saved.coverMediaId).toBe("b"));
  expect(saved.mediaIds).toEqual(["b", "v"]);
});
