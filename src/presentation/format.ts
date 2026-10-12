import { Category, OrderStatus } from "../domain/models";
export const categories: Record<Category, string> = {
  sneakers: "Кроссовки и кеды",
  shoes: "Ботинки и туфли",
  clothing: "Одежда",
  accessories: "Аксессуары",
};
export const statuses: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  shipped: "В пути",
  delivered: "Получен",
  cancelled: "Отменён",
};
export const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
export const date = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
