import {
  AdminData,
  CartLine,
  Order,
  OrderStatus,
  Product,
  User,
} from "../../domain/models";

export type ProductInput = Omit<
  Product,
  "id" | "createdAt" | "version" | "stock"
> & {
  stock?: Product["stock"];
  expectedVersion?: number;
};
export interface StockInput {
  stock: Product["stock"];
  expectedVersion: number;
}
export type ProfileInput = Pick<User, "name" | "phone" | "address">;
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  name: string;
}
export interface CheckoutInput extends ProfileInput {
  items: CartLine[];
  comment: string;
  delivery: Order["delivery"];
  payment: Order["payment"];
  requestId: string;
}
export interface PreviewControls {
  enter(role: User["role"]): Promise<User>;
  reset(): Promise<void>;
}
/** The UI knows use cases, never URLs, cookies, fetch or storage formats. */
export interface ShopGateway {
  readonly preview?: PreviewControls;
  catalog(): Promise<Product[]>;
  me(): Promise<User | null>;
  login(input: Credentials): Promise<User>;
  register(input: Registration): Promise<User>;
  logout(): Promise<void>;
  updateProfile(input: ProfileInput): Promise<User>;
  favorite(id: string, saved: boolean): Promise<User>;
  orders(): Promise<Order[]>;
  checkout(input: CheckoutInput): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;
  adminData(): Promise<AdminData>;
  saveProduct(input: ProductInput, id?: string): Promise<Product>;
  updateStock(id: string, input: StockInput): Promise<Product>;
  archiveProduct(id: string): Promise<Product>;
  orderStatus(id: string, status: OrderStatus): Promise<Order>;
}
