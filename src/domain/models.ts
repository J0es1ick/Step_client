export type Category = "sneakers" | "shoes" | "clothing" | "accessories";
export interface Product {
  id: string;
  version: number;
  name: string;
  brand: string;
  category: Category;
  gender: "women" | "men" | "unisex";
  price: number;
  oldPrice: number | null;
  description: string;
  material: string;
  color: string;
  colorHex: string;
  images: string[];
  stock: Record<string, number>;
  badge: string;
  active: boolean;
  createdAt: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  phone: string;
  address: string;
  favorites: string[];
  createdAt: string;
}
export interface CartLine {
  productId: string;
  size: string;
  quantity: number;
}
export type OrderStatus =
  "new" | "confirmed" | "shipped" | "delivered" | "cancelled";
export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    image: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  name: string;
  phone: string;
  address: string;
  comment: string;
  delivery: "courier" | "pickup";
  payment: "on_receipt";
  status: OrderStatus;
  createdAt: string;
}
export interface AdminData {
  products: Product[];
  orders: Order[];
  customers: User[];
}
