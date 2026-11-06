import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventGallery } from "./components/EventGallery";
import type { EventItem } from "../../shared/events";
const event: EventItem = {
  id: "1",
  category: "Seminerler",
  date: "2026-11-06",
  title: "Seminer",
  description: "Birlikte çalışma",
  location: "Dojo",
  media: [],
  coverMediaId: null,
  version: 1,
  createdAt: "",
  updatedAt: "",
};
test("empty gallery and video-only gallery remain usable", () => {
  const { rerender } = render(<EventGallery event={event} />);
  expect(
    screen.getByText("Henüz eklenmiş bir görsel bulunmuyor"),
  ).toBeInTheDocument();
  rerender(
    <EventGallery
      event={{
        ...event,
        media: [
          {
            id: "v",
            key: "v",
            url: "https://media.test/v",
            kind: "video",
            mime: "video/mp4",
            size: 20,
            originalName: "video.mp4",
          },
        ],
      }}
    />,
  );
  expect(screen.getByLabelText("Seminer — video")).toHaveAttribute("controls");
});
test("selected image removal falls back to remaining media", async () => {
  const image = (id: string) => ({
    id,
    key: id,
    url: `https://media.test/${id}`,
    kind: "image" as const,
    mime: "image/jpeg",
    size: 20,
    originalName: id,
  });
  const { rerender } = render(
    <EventGallery event={{ ...event, media: [image("a"), image("b")] }} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "b seç" }));
  rerender(<EventGallery event={{ ...event, media: [image("a")] }} />);
  expect(screen.getByAltText("Seminer")).toHaveAttribute(
    "src",
    "https://media.test/a",
  );
});
