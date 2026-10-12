import React, { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Product } from "../../domain/models";
import Icon from "../components/Icon";
import { Breadcrumbs, Empty } from "../components/Layout";
import Modal from "../components/Modal";
import ProductCard, { ProductsState } from "../components/ProductCard";
import ProductGallery from "../components/ProductGallery";
import { categories, money } from "../format";
import { useReducedMotion } from "../hooks/useOrbitSpring";
import { useStore } from "../state/StoreProvider";

export function ProductDetails({
  product,
  quick = false,
}: {
  product: Product;
  quick?: boolean;
}) {
  const { addToCart, favorites, toggleFavorite, setQuickView, setCartOpen } =
    useStore();
  const [size, setSize] = useState("");
  const sizesRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [celebration, setCelebration] = useState(0);
  const [showSizes, setShowSizes] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const available = Object.values(product.stock).some((qty) => qty > 0);
  const favorite = favorites.includes(product.id);
  const add = () => {
    if (!size) {
      setSizeError(true);
      sizesRef.current?.scrollIntoView?.({
        behavior: reduced ? "auto" : "smooth",
        block: "center",
      });
      sizesRef.current
        ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus({ preventScroll: true });
      return;
    }
    if (addToCart(product, size)) {
      setAdded(true);
      setCelebration((value) => value + 1);
    }
  };
  return (
    <div className={`product-detail ${quick ? "quick-detail" : ""}`}>
      <ProductGallery product={product} />
      <div className="product-info">
        <span className="eyebrow">
          {product.brand} · {categories[product.category]}
        </span>
        <h1>{product.name}</h1>
        <div className="detail-price">
          <strong>{money(product.price)}</strong>
          {product.oldPrice && <del>{money(product.oldPrice)}</del>}
        </div>
        <p className="detail-description">{product.description}</p>
        <div className="color-choice">
          <span
            className="color-dot"
            style={{ background: product.colorHex }}
          />
          <span>
            Цвет: <strong>{product.color}</strong>
          </span>
        </div>
        <div className="size-heading">
          <strong>
            Выбери размер{" "}
            <span className="size-unit">
              {product.category === "shoes" || product.category === "sneakers"
                ? "EU"
                : ""}
            </span>
          </strong>
          <button
            className="text-link"
            aria-expanded={showSizes}
            aria-controls={`size-guide-${product.id}`}
            onClick={() => setShowSizes(!showSizes)}
          >
            Таблица размеров
          </button>
        </div>
        <div
          ref={sizesRef}
          className={`size-selector ${sizeError ? "has-error" : ""}`}
          role="group"
          aria-label="Размер"
          aria-describedby={sizeError ? `size-error-${product.id}` : undefined}
        >
          {Object.entries(product.stock).map(([value, quantity]) => (
            <button
              key={value}
              className={size === value ? "selected" : ""}
              disabled={!quantity}
              aria-pressed={size === value}
              title={!quantity ? "Нет в наличии" : `${quantity} шт. в наличии`}
              onClick={() => {
                setSize(value);
                setSizeError(false);
                setAdded(false);
              }}
            >
              {value}
            </button>
          ))}
        </div>
        {sizeError && (
          <p
            id={`size-error-${product.id}`}
            className="field-error"
            role="alert"
          >
            Сначала выбери размер.
          </p>
        )}
        {showSizes && (
          <div className="size-guide" id={`size-guide-${product.id}`}>
            <p>
              {product.category === "clothing"
                ? "Размеры унисекс. Для свободной посадки выбирай на размер больше."
                : "Измерь стопу от пятки до самого длинного пальца. Если между размерами — выбирай больший."}
            </p>
            {product.category !== "clothing" &&
            product.category !== "accessories" ? (
              <table>
                <thead>
                  <tr>
                    <th>EU</th>
                    {[
                      "36",
                      "37",
                      "38",
                      "39",
                      "40",
                      "41",
                      "42",
                      "43",
                      "44",
                      "45",
                    ].map((s) => (
                      <th key={s}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>См</th>
                    {[
                      "23",
                      "23,5",
                      "24",
                      "24,5",
                      "25",
                      "26",
                      "26,5",
                      "27",
                      "28",
                      "28,5",
                    ].map((s) => (
                      <td key={s}>{s}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            ) : (
              <Link to="/info/sizes" onClick={() => setQuickView(null)}>
                Подробный гид по размерам →
              </Link>
            )}
          </div>
        )}
        <div className="purchase-actions">
          <div className="add-row">
            <button
              className={`button add-to-cart ${added ? "button-added" : ""}`}
              disabled={!available}
              onClick={add}
            >
              <span
                key={celebration}
                className={`add-button-content ${added ? "just-added" : ""}`}
              >
                <Icon name={added ? "check" : "bag"} size={20} />
                {!available
                  ? "Скоро вернётся"
                  : added
                    ? "Добавлено в корзину"
                    : "Добавить в корзину"}
              </span>
              <Icon name="arrow" size={19} />
            </button>
            <button
              className={`button button-outline save-product ${favorite ? "is-favorite" : ""}`}
              aria-label={
                favorite ? "Убрать из избранного" : "Добавить в избранное"
              }
              aria-pressed={favorite}
              onClick={() => toggleFavorite(product.id)}
            >
              <Icon name="heart" />
            </button>
          </div>
          <div
            className={`cart-feedback ${added ? "is-visible" : ""}`}
            aria-live="polite"
          >
            {added && (
              <div className="cart-receipt" key={celebration}>
                <span className="receipt-check">
                  <Icon name="check" size={17} />
                </span>
                <span>
                  <strong>Отличный выбор.</strong>
                  <span>Размер {size} уже в корзине</span>
                </span>
                <button
                  className="text-link"
                  onClick={() => {
                    setQuickView(null);
                    setCartOpen(true);
                  }}
                >
                  К корзине <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="stock-note">
          <span className={available ? "stock-dot" : "stock-dot unavailable"} />
          {available
            ? size
              ? `Размер ${size} в наличии`
              : "В наличии · можно заказывать"
            : "Сейчас нет в наличии"}
        </p>
        <div className="product-promises">
          <span>
            <Icon name="truck" size={20} />
            Бесплатно от 10 000 ₽
          </span>
          <span>
            <Icon name="shield" size={20} />
            Оплата при получении
          </span>
        </div>
        {quick ? (
          <Link
            className="text-link full-product-link"
            to={`/product/${product.id}`}
            onClick={() => setQuickView(null)}
          >
            Всё о товаре <Icon name="arrow" size={18} />
          </Link>
        ) : (
          <div className="product-accordions">
            <details open>
              <summary>Состав и уход</summary>
              <p>{product.material}</p>
              <p>
                Ориентируйся на рекомендации на ярлыке. Для обуви используй
                мягкую щётку и средства для соответствующего материала.
              </p>
            </details>
            <details>
              <summary>Доставка и оплата</summary>
              <p>
                Курьером — 490 ₽, от 10 000 ₽ бесплатно. Самовывоз бесплатно по
                согласованию. Оплата при получении. Срок и адрес самовывоза
                подтвердит менеджер.
              </p>
            </details>
            <details>
              <summary>Возврат и обмен</summary>
              <p>
                Если вещь не подошла, открой раздел «Возврат и обмен». Сохрани
                товарный вид, упаковку и подтверждение заказа.
              </p>
              <Link to="/info/returns">Подробнее →</Link>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
export function QuickView() {
  const { quickView, setQuickView } = useStore();
  return quickView ? (
    <Modal
      title={`Быстрый просмотр: ${quickView.name}`}
      onClose={() => setQuickView(null)}
      wide
    >
      <ProductDetails key={quickView.id} product={quickView} quick />
    </Modal>
  ) : null;
}
export default function ProductPage() {
  const { id } = useParams();
  const { products, loading, error } = useStore();
  const product = products.find((p) => p.id === id);
  return (
    <div className="container page-content product-page">
      <Breadcrumbs
        items={[
          { label: "Каталог", to: "/catalog" },
          { label: product?.name || "Товар" },
        ]}
      />
      {loading || error ? (
        <ProductsState />
      ) : product ? (
        <>
          <ProductDetails key={product.id} product={product} />
          <section className="section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ХОРОШАЯ КОМПАНИЯ</span>
                <h2>Вместе — ещё лучше</h2>
              </div>
              <Link className="text-link" to="/catalog">
                В каталог <Icon name="arrow" size={18} />
              </Link>
            </div>
            <div className="product-grid">
              {products
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </section>
        </>
      ) : (
        <Empty title="Эта вещь пока недоступна">
          Но в каталоге наверняка найдётся что-то твоё.
        </Empty>
      )}
    </div>
  );
}
