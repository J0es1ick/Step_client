// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "node:util";

// JSDOM does not provide these browser APIs used by React Router 7.
Object.assign(globalThis, { TextEncoder, TextDecoder });
Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  },
  close: {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  },
});
