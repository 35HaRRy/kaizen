import { test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import type { EventItem } from "../../shared/events";

const events: EventItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: String(index + 1),
  category: "Seminerler",
  date: "2026-11-06",
  title: `Etkinlik ${index + 1}`,
  description: "Açıklama",
  location: "Dojo",
  media: [],
  coverMediaId: null,
  version: 1,
  createdAt: "",
  updatedAt: "",
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ events }) })),
  );
});

test("events are paginated four per page and category changes reset the page", async () => {
  render(<App />);
  expect(await screen.findByText("Etkinlik 1")).toBeInTheDocument();
  expect(screen.getByText("Etkinlik 4")).toBeInTheDocument();
  expect(screen.queryByText("Etkinlik 5")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Sonraki sayfa" }));
  expect(screen.getByText("Etkinlik 5")).toBeInTheDocument();
  expect(screen.queryByText("Etkinlik 1")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Seminerler" }));
  expect(screen.getByText("Etkinlik 1")).toBeInTheDocument();
  expect(screen.queryByText("Etkinlik 5")).not.toBeInTheDocument();
});
