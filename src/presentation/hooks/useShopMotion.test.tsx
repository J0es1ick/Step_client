import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { useShopMotion } from "./useShopMotion";

class Observer {
  static instances: Observer[] = [];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor(public callback: IntersectionObserverCallback) {
    Observer.instances.push(this);
  }
  intersect(target: Element, visible: boolean) {
    this.callback(
      [{ target, isIntersecting: visible } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}
let preference: {
  matches: boolean;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
};
let preferenceChange: (() => void) | undefined;
const originalObserver = window.IntersectionObserver;
const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  Observer.instances = [];
  preferenceChange = undefined;
  preference = {
    matches: false,
    addEventListener: jest.fn((_name, callback) => {
      preferenceChange = callback;
    }),
    removeEventListener: jest.fn(),
  };
  window.matchMedia = jest.fn(() => preference as unknown as MediaQueryList);
  window.IntersectionObserver =
    Observer as unknown as typeof IntersectionObserver;
});
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  window.IntersectionObserver = originalObserver;
  jest.useRealTimers();
});
function Shop() {
  useShopMotion();
  return (
    <main id="main">
      <section className="page-heading" data-testid="block">
        <a href="#shop">Каталог</a>
      </section>
      <div data-ambient data-testid="sticker" />
    </main>
  );
}

test("scroll reveals survive StrictMode, run once, and keyboard focus exposes a pending block", () => {
  const { unmount } = render(
    <React.StrictMode>
      <Shop />
    </React.StrictMode>,
  );
  const block = screen.getByTestId("block");
  const observer = Observer.instances[Observer.instances.length - 2];
  expect(block).toHaveAttribute("data-motion", "pending");
  expect(observer.observe).toHaveBeenCalledWith(block);
  fireEvent.focusIn(screen.getByRole("link", { name: "Каталог" }));
  expect(block).toHaveAttribute("data-motion", "done");
  act(() => observer.intersect(block, true));
  expect(block).toHaveAttribute("data-motion", "done");
  unmount();
  expect(observer.disconnect).toHaveBeenCalled();
});

test("turning reduced motion on exposes waiting content immediately and stops ambient observation", () => {
  render(<Shop />);
  const block = screen.getByTestId("block");
  const sticker = screen.getByTestId("sticker");
  const [revealObserver, ambientObserver] = Observer.instances;
  act(() => ambientObserver.intersect(sticker, true));
  expect(sticker).toHaveAttribute("data-motion-active", "true");
  act(() => ambientObserver.intersect(sticker, false));
  expect(sticker).toHaveAttribute("data-motion-active", "false");
  act(() => {
    preference.matches = true;
    preferenceChange?.();
  });
  expect(block).not.toHaveAttribute("data-motion", "pending");
  expect(sticker).not.toHaveAttribute("data-motion-active");
  expect(revealObserver.disconnect).toHaveBeenCalled();
  expect(ambientObserver.disconnect).toHaveBeenCalled();
});

test("content stays visible when IntersectionObserver is unavailable", () => {
  window.IntersectionObserver =
    undefined as unknown as typeof IntersectionObserver;
  render(<Shop />);
  expect(screen.getByTestId("block")).not.toHaveAttribute("data-motion");
});
