import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../../domain/models";
import { assetUrl } from "../assets";
import { money } from "../format";
import { useStore } from "../state/StoreProvider";
import Icon from "./Icon";
export function ProductImage({
  product,
  className = "",
  index = 0,
}: {
  product: Pick<Product, "images" | "name">;
  className?: string;
  index?: number;
}) {
  return (
    <img
      className={className}
      src={assetUrl(
        product.images[index] ||
          product.images[0] ||
          "/media/product-placeholder.svg",
      )}
      alt={product.name}
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = "true";
          img.src = assetUrl("/media/product-placeholder.svg");
        }
      }}
    />
  );
}
export default function ProductCard({ product }: { product: Product }) {
  const { favorites, toggleFavorite, setQuickView } = useStore();
  const favorite = favorites.includes(product.id);
  return (
    <article className="product-card">
      <div className={`product-photo photo-${product.category}`}>
        <Link
          to={`/product/${product.id}`}
          aria-label={`Подробнее: ${product.name}`}
        >
          <ProductImage product={product} />
        </Link>
        {product.badge && (
          <span className={`badge ${product.oldPrice ? "badge-sale" : ""}`}>
            {product.badge}
          </span>
        )}
        <button
          className={`favorite-button ${favorite ? "is-favorite" : ""}`}
          aria-label={`${favorite ? "Убрать из" : "Добавить в"} избранное: ${product.name}`}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(product.id)}
        >
          <Icon name="heart" size={20} />
        </button>
        <button className="quick-button" onClick={() => setQuickView(product)}>
          <Icon name="eye" size={18} />
          Быстрый просмотр
        </button>
      </div>
      <div className="product-card-meta">
        <span>{product.brand}</span>
        <span
          className="color-dot"
          style={{ background: product.colorHex }}
          title={product.color}
        />
      </div>
      <Link className="product-name" to={`/product/${product.id}`}>
        {product.name}
      </Link>
      <p className="product-type">
        {product.category === "clothing"
          ? "Одежда"
          : product.category === "accessories"
            ? "Аксессуары"
            : product.category === "shoes"
              ? "Обувь"
              : "Кроссовки"}{" "}
        · {product.color.split("/")[0]}
      </p>
      <div className="product-price">
        <strong>{money(product.price)}</strong>
        {product.oldPrice && <del>{money(product.oldPrice)}</del>}
      </div>
    </article>
  );
}
export function ProductsState() {
  const { loading, error, refresh } = useStore();
  if (loading)
    return (
      <div
        className="product-grid"
        aria-label="Загрузка каталога"
        aria-busy="true"
      >
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton-card" key={i}>
            <div />
            <span />
            <span />
          </div>
        ))}
      </div>
    );
  if (error)
    return (
      <div className="empty-state">
        <Icon name="box" size={38} />
        <h2>Небольшая пауза</h2>
        <p>{error}</p>
        <button className="button" onClick={refresh}>
          Попробовать снова
        </button>
      </div>
    );
  return null;
}
