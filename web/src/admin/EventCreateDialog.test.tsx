import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCreateDialog } from "./EventCreateDialog";
test("category-only creation edits protect draft on navigation", async () => {
  render(<EventCreateDialog onClose={() => {}} onCreated={() => {}} />);
  const clean = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);
  await userEvent.selectOptions(screen.getByLabelText("Tür"), "Dojo yaşamı");
  const dirty = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(dirty);
  expect(dirty.defaultPrevented).toBe(true);
});
