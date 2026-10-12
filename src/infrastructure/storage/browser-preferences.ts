import { Preferences } from "../../application/ports/preferences";

export class BrowserPreferences implements Preferences {
  constructor(private readonly prefix = "step-") {}
  read<T>(key: string, fallback: T, validate: (value: unknown) => boolean): T {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(this.prefix + key) || "null",
      );
      return validate(value) ? (value as T) : fallback;
    } catch {
      return fallback;
    }
  }
  write(key: string, value: unknown) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      /* The shop still works when browser storage is unavailable. */
    }
  }
}
