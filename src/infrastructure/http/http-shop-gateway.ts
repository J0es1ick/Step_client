import {
  CheckoutInput,
  Credentials,
  ProductInput,
  ProfileInput,
  Registration,
  ShopGateway,
} from "../../application/ports/shop-gateway";
import {
  AdminData,
  Order,
  OrderStatus,
  Product,
  User,
} from "../../domain/models";
import { api, body } from "./request";

export class HttpShopGateway implements ShopGateway {
  catalog = () => api<Product[]>("/products");
  me = () => api<User | null>("/auth/me");
  login = (input: Credentials) =>
    api<User>("/auth/login", { method: "POST", body: body(input) });
  register = (input: Registration) =>
    api<User>("/auth/register", { method: "POST", body: body(input) });
  logout = async () => {
    await api("/auth/logout", { method: "POST" });
  };
  updateProfile = (input: ProfileInput) =>
    api<User>("/profile", { method: "PATCH", body: body(input) });
  favorite = (id: string, saved: boolean) =>
    api<User>(`/favorites/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: body({ saved }),
    });
  orders = () => api<Order[]>("/orders");
  checkout = (input: CheckoutInput) =>
    api<Order>("/orders", { method: "POST", body: body(input) });
  cancelOrder = (id: string) =>
    api<Order>(`/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });
  adminData = () => api<AdminData>("/admin");
  saveProduct = (input: ProductInput, id?: string) =>
    api<Product>(`/admin/products${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PATCH" : "POST",
      body: body(input),
    });
  archiveProduct = (id: string) =>
    api<Product>(`/admin/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  orderStatus = (id: string, status: OrderStatus) =>
    api<Order>(`/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: body({ status }),
    });
}
