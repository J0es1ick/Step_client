import React, { useState } from "react";
import { Link } from "react-router-dom";
import GraffitiMark from "../components/GraffitiMark";
import Icon from "../components/Icon";
import ProductCard, { ProductsState } from "../components/ProductCard";
import Showcase, { OrbitArtwork } from "../components/Showcase";
import { useStore } from "../state/StoreProvider";

const categories = [
  {
    id: "sneakers",
    label: "Кроссовки",
    product: "sage-runner",
    note: "В своём ритме",
  },
  {
    id: "clothing",
    label: "Одежда",
    product: "weekend-hoodie",
    note: "Твой мягкий знак",
  },
  {
    id: "accessories",
    label: "Аксессуары",
    product: "daily-pack",
    note: "Всё дело в деталях",
  },
  {
    id: "shoes",
    label: "Обувь",
    product: "terra-walk",
    note: "Куда захочется",
  },
];

export default function Home() {
  const { products, loading, error } = useStore();
  const [tab, setTab] = useState("all");
  const featured = products
    .filter((product) => tab === "all" || product.category === tab)
    .slice(0, 4);
  return (
    <>
      <Showcase />
      <div className="mood-strip" aria-hidden="true">
        <span>ХОРОШИЙ ДЕНЬ</span>
        <i>✳</i>
        <span>НАЧИНАЕТСЯ С ТЕБЯ</span>
        <i>✳</i>
        <span>MAKE YOUR MOVE</span>
        <i>✳</i>
        <span>ХОРОШИЙ ДЕНЬ</span>
      </div>
      <div className="container">
        <section
          className="section category-section"
          aria-labelledby="category-title"
        >
          <div className="section-heading">
            <h2 id="category-title">
              Что по <span className="hand-underline">настроению?</span>
            </h2>
            <Link className="text-link" to="/catalog">
              Смотреть всё <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => {
              const product =
                products.find((item) => item.id === category.product) ||
                products.find((item) => item.category === category.id);
              return (
                <Link
                  key={category.id}
                  className={`mood-category mood-category-${index}`}
                  to={`/catalog?category=${category.id}`}
                >
                  <span className="category-note">{category.note}</span>
                  <span className="category-doodle" aria-hidden="true">
                    {index % 2 ? "✷" : "✳"}
                  </span>
                  <div className="category-art" aria-hidden="true">
                    {product && <OrbitArtwork product={product} />}
                  </div>
                  <span className="category-label">
                    {category.label}
                    <span>
                      <Icon name="arrow" size={20} />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="style-story">
          <GraffitiMark />
          <div className="story-copy">
            <span className="eyebrow">ПОВОД НЕ НУЖЕН</span>
            <h2>
              БОЛЬШЕ
              <br />
              <span>ТЕБЯ.</span>
              <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <circle cx="50" cy="50" r="42" />
                <path d="M29 56q21 27 43-3M34 31v13m30-15v13" />
              </svg>
            </h2>
            <p>
              Выходи за привычное. Смешивай любимое.
              <br />
              Самое классное в твоём образе — ты.
            </p>
            <Link className="button" to="/catalog?collection=weekend">
              Собрать свой образ <Icon name="arrow" size={20} />
            </Link>
          </div>
          <span className="story-stamp" aria-hidden="true">
            GOOD
            <br />
            THINGS
            <br />
            AHEAD ↗
          </span>
        </section>
        <section
          className="section collection-section"
          id="collection"
          tabIndex={-1}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">ПРИСМОТРИСЬ. ВДРУГ ЭТО ОНО?</span>
              <h2>
                В самое <span className="hand-underline">сердечко.</span>
              </h2>
            </div>
            <Link className="text-link" to="/catalog">
              Весь каталог <Icon name="diagonal" size={18} />
            </Link>
          </div>
          <div className="collection-toolbar">
            <div className="tabs" aria-label="Подборка товаров">
              {[
                ["all", "Все вещи"],
                ["sneakers", "Кроссовки"],
                ["clothing", "Одежда"],
                ["accessories", "Аксессуары"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={tab === id ? "active" : ""}
                  aria-pressed={tab === id}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="collection-index">ВЫБРАНО С ЛЮБОВЬЮ ♡</span>
          </div>
          {loading || error ? (
            <ProductsState />
          ) : featured.length ? (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="muted">В этой подборке пока нет товаров.</p>
          )}
        </section>
        <section className="service-row" aria-label="Покупать просто">
          <div>
            <span aria-hidden="true">
              <Icon name="truck" size={30} />
            </span>
            <h3>Навстречу хорошему</h3>
            <p>Доставка бесплатно от 10 000 ₽</p>
            <Link to="/info/delivery">
              Доставка и оплата <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div>
            <span aria-hidden="true">
              <Icon name="check" size={30} />
            </span>
            <h3>Сядет как надо</h3>
            <p>Поможем найти свой размер</p>
            <Link to="/info/sizes">
              Гид по размерам <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div>
            <span aria-hidden="true">
              <Icon name="return" size={30} />
            </span>
            <h3>Можно передумать</h3>
            <p>Возврат и обмен без загадок</p>
            <Link to="/info/returns">
              Условия возврата <Icon name="arrow" size={16} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
