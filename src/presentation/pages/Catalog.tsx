import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { filterProducts } from "../../application/filter-products";
import { Category } from "../../domain/models";
import Icon from "../components/Icon";
import { Breadcrumbs, Empty } from "../components/Layout";
import ProductCard, { ProductsState } from "../components/ProductCard";
import { categories, money } from "../format";
import { useStore } from "../state/StoreProvider";

export default function Catalog() {
  const { products, loading, error } = useStore();
  const [params, setParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const filtered = useMemo(
    () => filterProducts(products, params, categories),
    [products, params],
  );
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const sizes = Array.from(
    new Set(
      products
        .filter(
          (p) =>
            !params.get("category") || p.category === params.get("category"),
        )
        .flatMap((p) => Object.keys(p.stock)),
    ),
  );
  const title = params.has("q")
    ? `Поиск: «${params.get("q")}»`
    : params.has("sale")
      ? "Хорошие вещи. Приятные цены."
      : params.has("new")
        ? "Новое в твоём ритме"
        : params.has("collection")
          ? "Для твоих выходных"
          : categories[params.get("category") as Category] ||
            (params.get("gender") === "women"
              ? "Женщинам"
              : params.get("gender") === "men"
                ? "Мужчинам"
                : "Найди своё");
  const activeFilters = Array.from(params.keys()).filter((k) => k !== "sort");
  return (
    <div className="container page-content catalog-page">
      <Breadcrumbs items={[{ label: "Каталог" }]} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">МАЛЕНЬКИЙ ШАГ К ЛЮБИМОМУ ОБРАЗУ</span>
          <h1>{title}</h1>
          <p>Вещи, которые легко становятся любимыми.</p>
        </div>
        <span className="catalog-count">
          <strong>{loading ? "…" : filtered.length}</strong> товаров
        </span>
      </div>
      <div className="catalog-toolbar">
        <button
          className="filter-toggle button button-light"
          aria-expanded={mobileFilters}
          aria-controls="catalog-filters"
          onClick={() => setMobileFilters(!mobileFilters)}
        >
          <Icon name="filter" size={18} />
          Фильтры{" "}
          {activeFilters.length > 0 && <span>{activeFilters.length}</span>}
        </button>
        <div className="catalog-chips">
          <button
            className={!params.get("category") ? "active" : ""}
            onClick={() => update("category", "")}
          >
            Всё
          </button>
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              className={params.get("category") === key ? "active" : ""}
              onClick={() => update("category", key)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="sort-control">
          Сначала
          <select
            aria-label="Сортировка"
            value={params.get("sort") || ""}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="">Рекомендуем</option>
            <option value="new">Новинки</option>
            <option value="price-asc">Дешевле</option>
            <option value="price-desc">Дороже</option>
          </select>
        </label>
      </div>
      <div className="catalog-layout">
        <aside
          id="catalog-filters"
          className={`filters ${mobileFilters ? "filters-open" : ""}`}
          aria-label="Фильтры каталога"
        >
          <div className="filter-title">
            <h2>Фильтры</h2>
            <Icon name="filter" size={18} />
          </div>
          <fieldset>
            <legend>Для кого</legend>
            {[
              ["", "Для всех"],
              ["women", "Женщинам"],
              ["men", "Мужчинам"],
            ].map(([id, label]) => (
              <label className="radio-label" key={id}>
                <input
                  type="radio"
                  name="gender"
                  checked={(params.get("gender") || "") === id}
                  onChange={() => update("gender", id)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Бренд</legend>
            <select
              aria-label="Бренд"
              value={params.get("brand") || ""}
              onChange={(e) => update("brand", e.target.value)}
            >
              <option value="">Все бренды</option>
              {brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </fieldset>
          <fieldset>
            <legend>
              Цена до{" "}
              <strong>{money(Number(params.get("max")) || 20000)}</strong>
            </legend>
            <input
              type="range"
              aria-label="Максимальная цена"
              min="1000"
              max="20000"
              step="500"
              value={params.get("max") || 20000}
              onChange={(e) => update("max", e.target.value)}
            />
            <div className="range-labels">
              <span>1 000 ₽</span>
              <span>20 000 ₽</span>
            </div>
          </fieldset>
          <fieldset>
            <legend>Размер</legend>
            <div className="filter-sizes">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={params.get("size") === size ? "selected" : ""}
                  aria-pressed={params.get("size") === size}
                  onClick={() =>
                    update("size", params.get("size") === size ? "" : size)
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={params.has("sale")}
              onChange={(e) => update("sale", e.target.checked ? "1" : "")}
            />
            Только со скидкой
          </label>
          {activeFilters.length > 0 && (
            <button className="reset-filters" onClick={() => setParams({})}>
              Сбросить фильтры <Icon name="close" size={15} />
            </button>
          )}
          <div className="filter-help">
            <Icon name="spark" />
            <strong>Твоя пара найдётся.</strong>
            <p>Попробуй новый цвет или привычный силуэт.</p>
          </div>
        </aside>
        <div className="catalog-results">
          {params.get("q") && (
            <div className="search-chip">
              {params.get("q")}
              <button
                className="icon-button"
                aria-label="Сбросить поиск"
                onClick={() => update("q", "")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {loading || error ? (
            <ProductsState />
          ) : filtered.length ? (
            <div className="product-grid catalog-product-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="search" size={38} />
              <h2>Пока ничего не нашлось</h2>
              <p>Попробуй другой запрос или убери часть фильтров.</p>
              <button className="button" onClick={() => setParams({})}>
                Показать все товары
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export function Favorites() {
  const { products, favorites, loading, error } = useStore();
  const list = products.filter((p) => favorites.includes(p.id));
  return (
    <div className="container page-content favorites-page">
      <Breadcrumbs items={[{ label: "Избранное" }]} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">СОХРАНИ ТО, ЧТО ОТКЛИКАЕТСЯ</span>
          <h1>
            Твой вишлист<span className="heading-spark">♡</span>
          </h1>
          <p>Любимые вещи — всегда под рукой.</p>
        </div>
        <span className="catalog-count">
          <strong>{list.length}</strong> товаров
        </span>
      </div>
      {loading || error ? (
        <ProductsState />
      ) : list.length ? (
        <div className="product-grid">
          {list.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      ) : (
        <Empty icon="heart" title="Здесь будут твои любимые вещи">
          Нажми на сердечко у товара, чтобы сохранить его на потом.
        </Empty>
      )}
    </div>
  );
}
