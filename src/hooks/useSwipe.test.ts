import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { isSwipeLock, readSwipe, useSwipe } from "./useSwipe";

describe("readSwipe", () => {
  it("needs a real horizontal flick", () => {
    expect(readSwipe(20, 0)).toBeNull();
    expect(readSwipe(20, 40)).toBeNull();
    expect(readSwipe(-80, 70)).toBeNull();
  });

  it("maps left / right", () => {
    expect(readSwipe(-80, 10)).toBe("left");
    expect(readSwipe(80, -8)).toBe("right");
  });
});

describe("isSwipeLock", () => {
  it("ignores tap jitter", () => {
    expect(isSwipeLock(4, 1)).toBe(false);
    expect(isSwipeLock(20, 30)).toBe(false);
  });

  it("locks once it's clearly sideways", () => {
    expect(isSwipeLock(20, 0)).toBe(true);
  });
});

function Board({
  onSwipeLeft,
  onSwipeRight,
  onClickLeft,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onClickLeft: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useSwipe(ref, onSwipeLeft, onSwipeRight);
  return createElement(
    "div",
    { ref, "data-testid": "board" },
    createElement("button", { type: "button", "data-testid": "left", onClick: onClickLeft }, "L"),
  );
}

function pointer(el: Element, type: "pointerDown" | "pointerMove" | "pointerUp", x: number) {
  fireEvent[type](el, {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    clientX: x,
    clientY: 10,
  });
}

describe("useSwipe vs child clicks", () => {
  it("does not capture the pointer on pointerdown", () => {
    const prev = HTMLElement.prototype.setPointerCapture;
    const spy = vi.fn();
    HTMLElement.prototype.setPointerCapture = spy;
    render(
      createElement(Board, { onSwipeLeft: vi.fn(), onSwipeRight: vi.fn(), onClickLeft: vi.fn() }),
    );
    pointer(screen.getByTestId("left"), "pointerDown", 100);
    expect(spy).not.toHaveBeenCalled();
    HTMLElement.prototype.setPointerCapture = prev;
  });

  it("lets a tap on a 50/50 card fire the button click", () => {
    const onSwipeLeft = vi.fn();
    const onClickLeft = vi.fn();
    render(createElement(Board, { onSwipeLeft, onSwipeRight: vi.fn(), onClickLeft }));
    const btn = screen.getByTestId("left");
    pointer(btn, "pointerDown", 100);
    pointer(btn, "pointerUp", 100);
    fireEvent.click(btn);
    expect(onClickLeft).toHaveBeenCalledOnce();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("swipes without treating the leftover click as a tap", () => {
    const onSwipeLeft = vi.fn();
    const onClickLeft = vi.fn();
    render(createElement(Board, { onSwipeLeft, onSwipeRight: vi.fn(), onClickLeft }));
    const btn = screen.getByTestId("left");
    pointer(btn, "pointerDown", 200);
    pointer(btn, "pointerMove", 80);
    pointer(btn, "pointerUp", 80);
    fireEvent.click(btn);
    expect(onSwipeLeft).toHaveBeenCalledOnce();
    expect(onClickLeft).not.toHaveBeenCalled();
  });
});
