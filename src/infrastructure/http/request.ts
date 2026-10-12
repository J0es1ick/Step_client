export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api/store${path}`, {
      ...options,
      credentials: "same-origin",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? "Проверьте заполнение полей. Некоторые значения не соответствуют формату."
        : data.message;
      throw new Error(
        message || "Не удалось выполнить запрос. Попробуйте ещё раз.",
      );
    }
    return data;
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw new Error(
        "Не удалось связаться с магазином. Проверьте подключение и повторите попытку.",
      );
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
export const body = (value: unknown) => JSON.stringify(value);
