import { Category, Product } from "../domain/models";
export interface CatalogQuery {
  get(name: string): string | null;
  has(name: string): boolean;
}
export function filterProducts(
  products: Product[],
  params: CatalogQuery,
  labels: Partial<Record<Category, string>> = {},
) {
  const q = (params.get("q") || "").toLocaleLowerCase("ru").trim();
  const category = params.get("category");
  const gender = params.get("gender");
  const brand = params.get("brand");
  const size = params.get("size");
  const max = Number(params.get("max")) || Infinity;
  const sorted = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!gender || p.gender === gender || p.gender === "unisex") &&
      (!brand || p.brand === brand) &&
      (!size || (p.stock[size] || 0) > 0) &&
      p.price <= max &&
      (!params.has("sale") || !!p.oldPrice) &&
      (!params.has("new") || p.badge === "Новинка") &&
      (!params.has("collection") ||
        [
          "sage-runner",
          "weekend-hoodie",
          "essential-tee",
          "daily-pack",
          "city-white",
        ].includes(p.id)) &&
      (!q ||
        `${p.name} ${p.brand} ${p.color} ${labels[p.category] || p.category}`
          .toLocaleLowerCase("ru")
          .includes(q)),
  );
  return sorted.sort((a, b) =>
    params.get("sort") === "price-asc"
      ? a.price - b.price
      : params.get("sort") === "price-desc"
        ? b.price - a.price
        : params.get("sort") === "new"
          ? b.createdAt.localeCompare(a.createdAt)
          : 0,
  );
}
