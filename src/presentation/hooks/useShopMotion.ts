import { useEffect } from "react";
import { useReducedMotion } from "./useOrbitSpring";

// Animate meaningful groups, never individual form fields or changing cart totals.
const revealSelector = [
  ".section-heading",
  ".page-heading",
  ".mood-category",
  ".style-story",
  ".collection-toolbar",
  ".product-card",
  ".service-row > div",
  ".product-gallery",
  ".product-info",
  ".account-welcome",
  ".account-panel",
  ".admin-stats > div",
  ".info-body",
  ".footer-manifesto",
].join(",");
const ambientSelector = "[data-ambient]";
const scopeSelector = "#main, .site-footer";

export function useShopMotion() {
  const reduced = useReducedMotion();
  useEffect(() => {
    // Content is visible by default, including browsers without IntersectionObserver.
    if (reduced || typeof IntersectionObserver === "undefined") return;
    const reveals = new Set<HTMLElement>();
    const ambient = new Set<HTMLElement>();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          const element = target as HTMLElement;
          if (element.dataset.motion === "pending")
            element.dataset.motion = "shown";
          revealObserver.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -24px 0px", threshold: 0.02 },
    );
    const ambientObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          (target as HTMLElement).dataset.motionActive = String(isIntersecting);
        });
      },
      { threshold: 0 },
    );

    const register = (root: Element) => {
      const targets = [
        root,
        ...Array.from(
          root.querySelectorAll(`${revealSelector}, ${ambientSelector}`),
        ),
      ];
      targets.forEach((target) => {
        if (!(target instanceof HTMLElement) || !target.closest(scopeSelector))
          return;
        if (target.matches(revealSelector) && !target.dataset.motion) {
          // A short stagger within a row; never accumulate delays down the page.
          const staggered = target.matches(
            ".product-card, .mood-category, .service-row > div, .admin-stats > div",
          );
          const index =
            staggered && target.parentElement
              ? Array.from(target.parentElement.children).indexOf(target) % 4
              : 0;
          target.style.setProperty("--reveal-delay", `${index * 45}ms`);
          target.dataset.motion = target.contains(document.activeElement)
            ? "done"
            : "pending";
          reveals.add(target);
          if (target.dataset.motion === "pending")
            revealObserver.observe(target);
        }
        if (target.matches(ambientSelector) && !ambient.has(target)) {
          ambient.add(target);
          ambientObserver.observe(target);
        }
      });
    };
    const visibility = () => {
      document.documentElement.dataset.ambientPaused = String(document.hidden);
    };
    const finish = (event: AnimationEvent) => {
      if (
        event.animationName === "step-reveal" &&
        event.target instanceof HTMLElement
      ) {
        event.target.dataset.motion = "done";
      }
    };
    const focus = (event: FocusEvent) => {
      // Keyboard navigation and anchor jumps must never land on invisible controls.
      let element = event.target instanceof Element ? event.target : null;
      while (element) {
        if (element instanceof HTMLElement && element.dataset.motion) {
          element.dataset.motion = "done";
          revealObserver.unobserve(element);
        }
        element = element.parentElement;
      }
    };
    const mutations = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) register(node);
        }),
      );
      // Release detached route/product nodes instead of retaining every visited page.
      if (records.some((record) => record.removedNodes.length)) {
        reveals.forEach((node) => {
          if (!node.isConnected) {
            revealObserver.unobserve(node);
            reveals.delete(node);
          }
        });
        ambient.forEach((node) => {
          if (!node.isConnected) {
            ambientObserver.unobserve(node);
            ambient.delete(node);
          }
        });
      }
    });
    register(document.body);
    visibility();
    mutations.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("animationend", finish);
    document.addEventListener("focusin", focus);
    return () => {
      mutations.disconnect();
      revealObserver.disconnect();
      ambientObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("animationend", finish);
      document.removeEventListener("focusin", focus);
      reveals.forEach((node) => {
        // Pending blocks must be observable again after StrictMode's setup/cleanup pass.
        if (node.dataset.motion === "pending") delete node.dataset.motion;
        else node.dataset.motion = "done";
        node.style.removeProperty("--reveal-delay");
      });
      ambient.forEach((node) => {
        delete node.dataset.motionActive;
      });
      delete document.documentElement.dataset.ambientPaused;
    };
  }, [reduced]);
}
