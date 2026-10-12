import { Product } from "../domain/models";
import { ShopConflictError } from "./errors";

export function requireProductVersion(product: Product, expected: unknown) {
  if (!Number.isSafeInteger(expected) || expected !== product.version)
    throw new ShopConflictError(
      "Товар изменился. Обновите данные и повторите изменения.",
    );
}
export function validateStock(
  stock: unknown,
): asserts stock is Record<string, number> {
  if (
    !stock ||
    typeof stock !== "object" ||
    Array.isArray(stock) ||
    !Object.keys(stock).length ||
    Object.keys(stock).length > 30 ||
    Object.entries(stock).some(
      ([size, qty]) =>
        !/^[\w .-]{1,20}$/.test(size) ||
        !Number.isInteger(qty) ||
        qty < 0 ||
        qty > 100000,
    )
  )
    throw new Error("Проверьте размеры и остатки.");
}
