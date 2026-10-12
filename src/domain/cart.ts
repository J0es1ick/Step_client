import { CartLine, Product } from "./models";

export function validCart(value: unknown): value is CartLine[] {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every(
      (v) =>
        v &&
        typeof v.productId === "string" &&
        typeof v.size === "string" &&
        Number.isInteger(v.quantity) &&
        v.quantity > 0 &&
        v.quantity <= 20,
    )
  );
}
export function addCartLine(
  cart: CartLine[],
  product: Product,
  size: string,
): CartLine[] {
  const count =
    cart.find((line) => line.productId === product.id && line.size === size)
      ?.quantity || 0;
  if (
    !size ||
    !Object.prototype.hasOwnProperty.call(product.stock, size) ||
    !product.stock[size]
  )
    throw new Error("Выберите доступный размер");
  if (count >= Math.min(product.stock[size], 20))
    throw new Error("В корзине уже всё доступное количество этого размера");
  return count
    ? cart.map((line) =>
        line.productId === product.id && line.size === size
          ? { ...line, quantity: count + 1 }
          : line,
      )
    : [...cart, { productId: product.id, size, quantity: 1 }];
}
export const deliveryPrice = (
  subtotal: number,
  delivery: "courier" | "pickup",
) => (delivery === "pickup" || subtotal >= 10000 ? 0 : 490);
