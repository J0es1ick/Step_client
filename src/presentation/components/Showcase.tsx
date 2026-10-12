import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Product } from "../../domain/models";
import { assetUrl } from "../assets";
import { money } from "../format";
import {
  useOrbitSpring,
  useReducedMotion,
  wrapIndex,
} from "../hooks/useOrbitSpring";
import { useStore } from "../state/StoreProvider";
import Icon from "./Icon";
import IndieNote from "./IndieNote";
import { ProductImage } from "./ProductCard";

type Selection = "accessories" | "clothing" | "sneakers" | "shoes";
const categoryOptions: { id: Selection; label: string; subtitle: string }[] = [
  { id: "accessories", label: "АКСЕССУАРЫ", subtitle: "Всё решают детали." },
  { id: "clothing", label: "ОДЕЖДА", subtitle: "Твой образ. Твоя свобода." },
  { id: "sneakers", label: "КРОССОВКИ", subtitle: "Для движения без границ." },
  { id: "shoes", label: "ОБУВЬ", subtitle: "Форма. Движение. Ты." },
];

// Cutouts are only used with the original demo photos. An edited/new product uses its own image.
const demoArtwork: Record<string, { source: string; cell: number }> = {
  "city-white": { source: "photo-1600269452121-4f2416e55c28", cell: 0 },
  "terra-walk": { source: "photo-1549298916-b41d501d3772", cell: 1 },
  "cloud-run": { source: "photo-1542291026-7eec264c27ff", cell: 2 },
  "weekend-hoodie": { source: "photo-1556821840-3a63f95609a7", cell: 3 },
  "essential-tee": { source: "photo-1521572163474-6864f9cf17ab", cell: 4 },
  "daily-pack": { source: "photo-1553062407-98eeb64c6a62", cell: 5 },
  "retro-court": { source: "photo-1600185365483-26d7a4cc7519", cell: 0 },
};
export function OrbitArtwork({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const artwork = demoArtwork[product.id];
  if (
    !failed &&
    product.id === "sage-runner" &&
    product.images[0] === "/media/step-hero.png"
  )
    return (
      <img
        className="orbit-cutout"
        src={assetUrl("/media/step-floating.png")}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  if (!failed && artwork && product.images[0]?.includes(artwork.source))
    return (
      <span
        className={`orbit-cutout orbit-sprite sprite-${artwork.cell}`}
        role="img"
        aria-label={product.name}
      >
        <img
          src={assetUrl("/media/step-orbit-collection.png")}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
        />
      </span>
    );
  return (
    <ProductImage product={product} className="orbit-cutout orbit-photo" />
  );
}

function ProductCaption({
  product,
  reduced,
}: {
  product: Product;
  reduced: boolean;
}) {
  const last = useRef(product);
  const [previous, setPrevious] = useState<Product | null>(null);
  useEffect(() => {
    if (last.current.id === product.id) return;
    setPrevious(reduced ? null : last.current);
    last.current = product;
    const timeout = window.setTimeout(() => setPrevious(null), 550);
    return () => window.clearTimeout(timeout);
  }, [product, reduced]);
  return (
    <div className="orbit-caption">
      <div className="caption-stack">
        {previous && (
          <div
            className="caption-leaving"
            key={`old-${previous.id}`}
            aria-hidden="true"
          >
            <span>{previous.brand}</span>
            <div className="orbit-name">{previous.name}</div>
            <p>
              {previous.color} <span>/</span> {money(previous.price)}
            </p>
          </div>
        )}
        <div className="caption-entering" key={product.id}>
          <span>{product.brand}</span>
          <h1 className="orbit-name">{product.name}</h1>
          <p>
            {product.color} <span>/</span> {money(product.price)}
          </p>
        </div>
      </div>
      <Link className="showcase-cta" to={`/product/${product.id}`}>
        Смотреть модель <Icon name="arrow" size={15} />
      </Link>
    </div>
  );
}

export function OrbitCollection({
  products,
  motion,
  reduced,
  onPreview,
}: {
  products: Product[];
  motion: boolean;
  reduced: boolean;
  onPreview: (product: Product) => void;
}) {
  const { position, sway, current, target, dragTo, animateTo } =
    useOrbitSpring(reduced);
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    position: number;
    lastX: number;
    moved: boolean;
    stepWidth: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const count = products.length;
  const product = products[wrapIndex(active, count)];
  const goTo = (next: number, manual = true) => {
    const value = Math.round(next);
    setActive(wrapIndex(value, count));
    animateTo(value);
    if (manual) setInteracted(true);
  };
  const nextProduct = (direction: number) =>
    goTo(Math.round(target.current) + direction);
  const selectProduct = (index: number) => {
    if (suppressClick.current) return;
    if (index === active) {
      onPreview(product);
      setInteracted(true);
      return;
    }
    let distance = wrapIndex(
      index - wrapIndex(Math.round(target.current), count),
      count,
    );
    if (distance > count / 2) distance -= count;
    goTo(Math.round(target.current) + distance);
  };
  useEffect(() => {
    if (!motion || reduced || interacted || hovered || focused || count < 2)
      return;
    const timer = window.setInterval(() => {
      if (!document.hidden) goTo(Math.round(target.current) + 1, false);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [motion, reduced, interacted, hovered, focused, count]);
  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || count < 2) return;
    suppressClick.current = false;
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position: current.current,
      lastX: event.clientX,
      moved: false,
      stepWidth: event.currentTarget.clientWidth < 600 ? 135 : 200,
    };
  };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
      pointer.current = null;
      return;
    }
    if (!start.moved && Math.abs(dx) < 8) return;
    if (!start.moved) {
      start.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      setInteracted(true);
      suppressClick.current = true;
    }
    start.lastX = event.clientX;
    const next = start.position - dx / start.stepWidth;
    dragTo(next);
    setActive(wrapIndex(Math.round(next), count));
  };
  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (start.moved) {
      const delta = start.x - start.lastX;
      const steps =
        Math.round(delta / start.stepWidth) ||
        (Math.abs(delta) > 35 ? Math.sign(delta) : 0);
      goTo(Math.round(start.position) + steps);
    }
  };
  if (!product) return null;
  return (
    <div
      className="orbit-collection"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <div
        className={`orbit-stage ${dragging ? "is-dragging" : ""}`}
        role="group"
        aria-roledescription="карусель"
        aria-label="Круговая витрина товаров. Листайте стрелками или перетаскиванием"
        tabIndex={0}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onDragStart={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            if (count > 1) nextProduct(event.key === "ArrowRight" ? 1 : -1);
          }
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            goTo(event.key === "Home" ? 0 : count - 1);
          }
        }}
      >
        <div className="orbit-plane" aria-hidden="true" />
        {products.map((item, index) => {
          const angle = ((index - position) * Math.PI * 2) / count;
          const depth = (Math.cos(angle) + 1) / 2;
          const x = Math.sin(angle);
          const scale = 0.42 + depth * 0.58;
          return (
            <React.Fragment key={item.id}>
              <span
                className={`orbit-item-shadow ${item.id === "sage-runner" ? "shadow-pair" : item.category === "sneakers" || item.category === "shoes" ? "shadow-shoe" : "shadow-object"}`}
                aria-hidden="true"
                style={
                  {
                    transform: `translateX(-50%) translateX(calc(var(--orbit-radius) * ${x})) translateY(${-45 * (1 - depth)}px) scale(${scale})`,
                    "--orbit-depth": depth,
                  } as React.CSSProperties
                }
              />
              <button
                type="button"
                className={`orbit-item ${index === active ? "is-active" : ""}`}
                tabIndex={index === active ? 0 : -1}
                aria-label={
                  index === active
                    ? `Быстрый просмотр: ${item.name}`
                    : `Выбрать ${item.name}`
                }
                aria-current={index === active ? "true" : undefined}
                onClick={() => selectProduct(index)}
                style={
                  {
                    transform: `translate(-50%, -50%) translate3d(calc(var(--orbit-radius) * ${x}), ${-65 * (1 - depth)}px, 0) scale(${scale}) rotate(${x * -12}deg)`,
                    "--orbit-alpha": 0.15 + Math.pow(depth, 1.65) * 0.85,
                    "--orbit-depth": depth,
                    filter: `blur(${(1 - depth) * 3}px)`,
                    zIndex: Math.round(depth * 100),
                  } as React.CSSProperties
                }
              >
                <span
                  className="orbit-sway"
                  style={{
                    transform: `translateX(${sway * 0.4 * depth}px) rotate(${sway * (0.65 + depth * 0.35) * Math.cos(angle)}deg)`,
                  }}
                >
                  <span
                    className="orbit-float"
                    style={{ animationDelay: `${-index * 1.2}s` }}
                  >
                    <OrbitArtwork product={item} />
                  </span>
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <ProductCaption product={product} reduced={reduced} />
      <div className="orbit-controls" aria-label="Перелистывание товаров">
        <button
          className="orbit-arrow previous"
          type="button"
          aria-label="Предыдущий товар"
          disabled={count < 2}
          onClick={() => nextProduct(-1)}
        >
          <Icon name="arrow" size={20} />
        </button>
        <span className="orbit-counter">
          <strong>{String(active + 1).padStart(2, "0")}</strong>
          <span>/ {String(count).padStart(2, "0")}</span>
        </span>
        <button
          className="orbit-arrow"
          type="button"
          aria-label="Следующий товар"
          disabled={count < 2}
          onClick={() => nextProduct(1)}
        >
          <Icon name="arrow" size={20} />
        </button>
      </div>
      <div className="orbit-dots" aria-label="Товар в коллекции">
        {products.map((item, index) => (
          <button
            key={item.id}
            aria-label={`Перейти к ${item.name}`}
            aria-pressed={index === active}
            onClick={() => {
              let delta = wrapIndex(
                index - wrapIndex(Math.round(target.current), count),
                count,
              );
              if (delta > count / 2) delta -= count;
              goTo(Math.round(target.current) + delta);
            }}
          />
        ))}
      </div>
      <div className="showcase-bottom">
        <a
          href="#collection"
          onClick={(event) => {
            event.preventDefault();
            const collection = document.getElementById("collection");
            collection?.focus({ preventScroll: true });
            collection?.scrollIntoView({
              behavior: reduced ? "auto" : "smooth",
            });
          }}
        >
          Листай. Находи своё. <Icon name="arrow" size={16} />
        </a>
        <span className="orbit-help">
          {count > 1 ? "ПЕРЕТАЩИ, ЧТОБЫ ИССЛЕДОВАТЬ" : "РАССМОТРИ БЛИЖЕ"}
        </span>
        <button onClick={() => onPreview(product)}>
          Быстрый просмотр <Icon name="plus" size={16} />
        </button>
      </div>
      <span
        className="sr-only"
        role="status"
        aria-live={interacted ? "polite" : "off"}
      >
        {active + 1} из {count}: {product.name}, {money(product.price)}
      </span>
    </div>
  );
}

export default function Showcase() {
  const { products, loading, error, refresh, setQuickView } = useStore();
  const [category, setCategory] = useState<Selection>("shoes");
  const [motion, setMotion] = useState(true);
  const reduced = useReducedMotion();
  const collection = products
    .filter((product) =>
      category === "shoes"
        ? product.category === "shoes" || product.category === "sneakers"
        : product.category === category,
    )
    .slice(0, 8);
  return (
    <section
      className={`showcase orbit-showcase ${!motion || reduced ? "motion-paused" : ""}`}
      aria-label="Интерактивная коллекция STEP"
    >
      <div className="container showcase-inner">
        <nav className="showcase-categories" aria-label="Выбрать категорию">
          <span className="showcase-caption">
            <span className="edition-mark" /> НОВАЯ КОЛЛЕКЦИЯ
          </span>
          {categoryOptions.map((option) => (
            <button
              key={option.id}
              className={category === option.id ? "category-current" : ""}
              aria-pressed={category === option.id}
              onClick={() => setCategory(option.id)}
            >
              {option.label}
            </button>
          ))}
          <span className="category-subtitle" key={category}>
            {categoryOptions.find((option) => option.id === category)?.subtitle}
          </span>
        </nav>
        <div className="showcase-tools">
          <span>EVERYDAY EDIT / 2026</span>
          <button
            className="motion-toggle"
            aria-label={motion ? "Остановить анимацию" : "Включить анимацию"}
            aria-pressed={!motion}
            onClick={() => setMotion(!motion)}
          >
            <Icon name={motion ? "pause" : "play"} size={15} />
          </button>
        </div>
        <IndieNote />
        <div className="showcase-intro">
          <span className="eyebrow">ХОРОШИЕ ВЕЩИ. ТВОИ ПРАВИЛА.</span>
          <img
            className="hero-lettering"
            src={assetUrl("/media/step-your-move.png")}
            alt="Твой ход"
            width="640"
            height="480"
          />
          <p>
            Для больших планов.
            <br />И просто хорошего дня.
          </p>
          <Link className="button hero-catalog" to="/catalog">
            Найти своё <Icon name="diagonal" size={20} />
          </Link>
          <span className="hero-handnote" aria-hidden="true">
            будь собой. это идёт тебе :)
          </span>
        </div>
        <div className="hero-blob" aria-hidden="true" />
        <svg
          className="hero-doodles"
          viewBox="0 0 600 500"
          fill="none"
          aria-hidden="true"
        >
          <path d="m63 135 12-29 8 29 28 9-28 9-9 29-9-29-29-8Z" />
          <path d="m486 298 9-25 9 25 22 8-23 9-8 23-8-23-22-9Z" />
          <path d="m91 310-23 18m34-2-11 21m405-222 14-21m-1 36 23-8" />
          <path d="M420 412c58 18 113-9 94-36-11-16-31-7-23 9 10 20 51 4 61-21m-14 4 15-8 3 18" />
        </svg>
        {loading ? (
          <div className="orbit-state" role="status">
            <span className="orbit-loader" />
            Собираем твою коллекцию…
          </div>
        ) : error ? (
          <div className="orbit-state">
            <p>Не удалось загрузить коллекцию</p>
            <button className="text-link" onClick={refresh}>
              Попробовать снова <Icon name="return" size={16} />
            </button>
          </div>
        ) : collection.length ? (
          <OrbitCollection
            key={category}
            products={collection}
            motion={motion}
            reduced={reduced}
            onPreview={setQuickView}
          />
        ) : (
          <div className="orbit-state">
            <h1>Скоро в коллекции</h1>
            <p>Вещи этой категории появятся здесь.</p>
            <Link className="text-link" to="/catalog">
              Смотреть каталог <Icon name="arrow" size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
