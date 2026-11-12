import { test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventGallery } from "./components/EventGallery";
import type { EventItem } from "../../shared/events";
import { MediaImage } from "./components/MediaImage";
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
test("image failures show the dojo logo once and a new source is retried", () => {
  const { rerender } = render(<MediaImage src="https://media.test/a" alt="Dojo" />);
  const image = screen.getByAltText("Dojo");
  fireEvent.error(image);
  expect(image).toHaveAttribute("src", "/assets/kaizen-logo-1-rb_d77ba5e7.png");
  fireEvent.error(image);
  expect(image).toHaveAttribute("src", "/assets/kaizen-logo-1-rb_d77ba5e7.png");
  rerender(<MediaImage src="https://media.test/b" alt="Dojo" />);
  expect(screen.getByAltText("Dojo")).toHaveAttribute("src", "https://media.test/b");
});
test("gallery stage and thumbnail both use the logo on failure", () => {
  const { container } = render(<EventGallery event={{ ...event, media: [{
    id: "a", key: "a", url: "https://media.test/a", kind: "image",
    mime: "image/jpeg", size: 20, originalName: "a.jpg",
  }] }} />);
  const images = container.querySelectorAll("img");
  expect(images).toHaveLength(2);
  images.forEach(image => {
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", "/assets/kaizen-logo-1-rb_d77ba5e7.png");
  });
});
