import { Preferences } from "../../application/ports/preferences";
import {
  CheckoutInput,
  Credentials,
  ProductInput,
  ProfileInput,
  Registration,
  ShopGateway,
} from "../../application/ports/shop-gateway";
import { deliveryPrice, validCart } from "../../domain/cart";
import { Order, OrderStatus, Product, User } from "../../domain/models";
import { seedProducts } from "./catalog";

type DemoOrder = Order & { requestId: string };
interface DemoData {
  version: 1;
  products: Product[];
  users: User[];
  orders: DemoOrder[];
  userId: string | null;
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const initial = (): DemoData => ({
  version: 1,
  products: seedProducts(),
  orders: [],
  userId: null,
  users: (["customer", "admin"] as const).map((role) => ({
    id: `demo-${role}`,
    role,
    name: role === "admin" ? "Команда STEP" : "Саша",
    email: `${role}@step.example`,
    phone: "+7 999 000-00-00",
    address: "Демо-город, улица Примерная, дом 1",
    favorites: [],
    createdAt: "2026-10-10T00:00:00.000Z",
  })),
});
function validSnapshot(value: unknown): boolean {
  const data = value as DemoData | null;
  return (
    !!data &&
    data.version === 1 &&
    Array.isArray(data.products) &&
    data.products.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        Array.isArray(p.images) &&
        p.stock &&
        typeof p.price === "number",
    ) &&
    Array.isArray(data.users) &&
    data.users.length === 2 &&
    data.users.every(
      (u) =>
        u &&
        ["demo-customer", "demo-admin"].includes(u.id) &&
        Array.isArray(u.favorites),
    ) &&
    Array.isArray(data.orders) &&
    data.orders.every(
      (o) => o && Array.isArray(o.items) && typeof o.id === "string",
    ) &&
    (data.userId === null || data.users.some((u) => u.id === data.userId))
  );
}

/** Browser-only simulation. No credentials, API requests or real orders. */
export class DemoShopGateway implements ShopGateway {
  private data: DemoData;
  constructor(private readonly preferences: Preferences) {
    this.data = preferences.read("snapshot-v1", initial(), validSnapshot);
  }
  private change<T>(operation: (data: DemoData) => T): T {
    const copy = clone(this.data);
    const result = operation(copy);
    this.data = copy;
    this.preferences.write("snapshot-v1", copy);
    return clone(result);
  }
  private user(admin = false): User {
    const user = this.data.users.find((u) => u.id === this.data.userId);
    if (!user) throw new Error("Выберите демо-профиль для продолжения.");
    if (admin && user.role !== "admin")
      throw new Error("Этот раздел доступен демо-администратору.");
    return user;
  }
  readonly preview = {
    enter: async (role: User["role"]) =>
      this.change((data) => {
        const user = data.users.find((u) => u.role === role);
        if (!user) throw new Error("Неизвестный демо-профиль.");
        data.userId = user.id;
        return user;
      }),
    reset: async () => {
      this.data = initial();
      this.preferences.write("snapshot-v1", this.data);
    },
  };
  catalog = async () => clone(this.data.products.filter((p) => p.active));
  me = async () =>
    clone(this.data.users.find((u) => u.id === this.data.userId) || null);
  login = async (_input: Credentials): Promise<User> => {
    throw new Error("В демо выберите готовый профиль. Пароль не нужен.");
  };
  register = async (_input: Registration): Promise<User> => {
    throw new Error(
      "Регистрация доступна в полной версии. Здесь есть готовые демо-профили.",
    );
  };
  logout = async () => {
    this.change((data) => {
      data.userId = null;
      return null;
    });
  };
  updateProfile = async (input: ProfileInput) => {
    const id = this.user().id;
    if (input.name.trim().length < 2) throw new Error("Укажите имя.");
    return this.change((data) =>
      Object.assign(
        data.users.find((u) => u.id === id)!,
        input,
      ),
    );
  };
  favorite = async (id: string, saved: boolean) => {
    const userId = this.user().id;
    return this.change((data) => {
      if (saved && !data.products.some((p) => p.id === id && p.active))
        throw new Error("Товар не найден.");
      const user = data.users.find((u) => u.id === userId)!;
      user.favorites = user.favorites.filter((value) => value !== id);
      if (saved) user.favorites.push(id);
      return user;
    });
  };
  orders = async () => {
    const id = this.user().id;
    return clone(this.data.orders.filter((o) => o.userId === id).reverse());
  };
  checkout = async (input: CheckoutInput): Promise<Order> => {
    const userId = this.user().id;
    return this.change((data) => {
      const previous = data.orders.find(
        (o) => o.userId === userId && o.requestId === input.requestId,
      );
      if (previous) return previous;
      if (!input.items.length || !validCart(input.items))
        throw new Error("Проверьте корзину.");
      if (input.delivery === "courier" && input.address.trim().length < 10)
        throw new Error("Укажите город, улицу и дом.");
      const lines = new Map<string, CheckoutInput["items"][number]>();
      for (const item of input.items) {
        const key = item.productId + ":" + item.size;
        lines.set(key, {
          ...item,
          quantity: item.quantity + (lines.get(key)?.quantity || 0),
        });
      }
      const items = [...lines.values()].map((line) => {
        const product = data.products.find(
          (p) => p.id === line.productId && p.active,
        );
        if (
          !product ||
          !Object.prototype.hasOwnProperty.call(product.stock, line.size) ||
          product.stock[line.size] < line.quantity ||
          line.quantity > 20
        )
          throw new Error("Недостаточно товара. Обновите корзину.");
        product.stock[line.size] -= line.quantity;
        return {
          ...line,
          name: product.name,
          image: product.images[0],
          price: product.price,
        };
      });
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const deliveryCost = deliveryPrice(subtotal, input.delivery);
      const order: DemoOrder = {
        ...input,
        id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        userId,
        items,
        subtotal,
        deliveryCost,
        total: subtotal + deliveryCost,
        status: "new",
        createdAt: new Date().toISOString(),
      };
      data.orders.push(order);
      return order;
    });
  };
  private restore(data: DemoData, order: Order) {
    for (const item of order.items) {
      const product = data.products.find((p) => p.id === item.productId);
      if (product)
        product.stock[item.size] =
          (product.stock[item.size] || 0) + item.quantity;
    }
  }
  cancelOrder = async (id: string) => {
    const userId = this.user().id;
    return this.change((data) => {
      const order = data.orders.find((o) => o.id === id && o.userId === userId);
      if (!order || order.status !== "new")
        throw new Error("Можно отменить только свой новый заказ.");
      this.restore(data, order);
      order.status = "cancelled";
      return order;
    });
  };
  adminData = async () => {
    this.user(true);
    return clone({
      products: this.data.products,
      customers: this.data.users,
      orders: [...this.data.orders].reverse(),
    });
  };
  saveProduct = async (input: ProductInput, id?: string) => {
    this.user(true);
    if (
      !input.name.trim() ||
      input.price < 1 ||
      !Number.isInteger(input.price) ||
      !input.images.length ||
      Object.values(input.stock).some((q) => !Number.isInteger(q) || q < 0)
    )
      throw new Error("Проверьте название, цену, фото и остатки.");
    return this.change((data) => {
      if (id) {
        const product = data.products.find((p) => p.id === id);
        if (!product) throw new Error("Товар не найден.");
        return Object.assign(product, input);
      }
      const product: Product = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      data.products.push(product);
      return product;
    });
  };
  archiveProduct = async (id: string) => {
    this.user(true);
    return this.change((data) => {
      const product = data.products.find((p) => p.id === id);
      if (!product) throw new Error("Товар не найден.");
      product.active = false;
      return product;
    });
  };
  orderStatus = async (id: string, status: OrderStatus) => {
    this.user(true);
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      new: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    return this.change((data) => {
      const order = data.orders.find((o) => o.id === id);
      if (!order) throw new Error("Заказ не найден.");
      if (order.status === status) return order;
      if (!allowed[order.status].includes(status))
        throw new Error("Недопустимый переход статуса заказа.");
      if (status === "cancelled") this.restore(data, order);
      order.status = status;
      return order;
    });
  };
}
