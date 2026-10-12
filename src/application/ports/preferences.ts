export interface Preferences {
  read<T>(key: string, fallback: T, validate: (value: unknown) => boolean): T;
  write(key: string, value: unknown): void;
}
