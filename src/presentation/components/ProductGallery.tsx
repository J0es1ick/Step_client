import React, { useRef, useState } from "react";
import { Product } from "../../domain/models";
import { assetUrl } from "../assets";

import { wrapIndex } from "../hooks/useOrbitSpring";
import Icon from "./Icon";

// The original demo gets its locally created editorial views. Merchant-provided
// galleries always take precedence, including a replaced cover photograph.
export function productPhotos(product: Product) {
  if (
    product.id === "sage-runner" &&
    product.images.length === 1 &&
    product.images[0] === "/media/step-hero.png"
  ) {
    return [
      "/media/step-floating.png",
      "/media/step-hero.png",
      "/media/step-top-view.png",
    ];
  }
  return product.images.length
    ? product.images
    : ["/media/product-placeholder.svg"];
}

export default function ProductGallery({ product }: { product: Product }) {
  const photos = productPhotos(product);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressZoom = useRef(false);
  const select = (index: number) => {
    setDirection(index >= active ? 1 : -1);
    setActive(wrapIndex(index, photos.length));
    setZoomed(false);
    setOrigin("50% 50%");
  };
  const fallback = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!event.currentTarget.dataset.fallback) {
      event.currentTarget.dataset.fallback = "true";
      event.currentTarget.src = assetUrl("/media/product-placeholder.svg");
    }
  };
  return (
    <div
      className="product-gallery"
      role="region"
      aria-label={`Фотографии ${product.name}`}
    >
      <div
        className={`product-stage ${zoomed ? "is-zoomed" : ""}`}
        style={{ "--gallery-direction": direction } as React.CSSProperties}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            select(active + (event.key === "ArrowRight" ? 1 : -1));
          }
          if (event.key === "Escape" && zoomed) {
            event.stopPropagation();
            setZoomed(false);
          }
        }}
      >
        <span className="gallery-wordmark" aria-hidden="true">
          STEP.
        </span>
        <button
          className="gallery-main"
          aria-label={zoomed ? "Уменьшить фотографию" : "Увеличить фотографию"}
          aria-pressed={zoomed}
          onClick={() => {
            if (!suppressZoom.current) setZoomed(!zoomed);
            suppressZoom.current = false;
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            suppressZoom.current = false;
            pointer.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              moved: false,
            };
          }}
          onPointerMove={(event) => {
            const start = pointer.current;
            if (zoomed) {
              const rect = event.currentTarget.getBoundingClientRect();
              setOrigin(
                `${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`,
              );
            }
            if (
              !start ||
              start.id !== event.pointerId ||
              zoomed ||
              photos.length < 2
            )
              return;
            const dx = event.clientX - start.x,
              dy = event.clientY - start.y;
            if (
              !start.moved &&
              Math.abs(dy) > 10 &&
              Math.abs(dy) > Math.abs(dx)
            ) {
              pointer.current = null;
              return;
            }
            if (Math.abs(dx) > 10) {
              start.moved = true;
              suppressZoom.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
            }
          }}
          onPointerUp={(event) => {
            const start = pointer.current;
            pointer.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
            if (start?.moved && Math.abs(event.clientX - start.x) > 40)
              select(active + (event.clientX < start.x ? 1 : -1));
          }}
          onPointerCancel={() => {
            pointer.current = null;
            suppressZoom.current = true;
          }}
          onDragStart={(event) => event.preventDefault()}
        >
          {photos.map((src, index) => (
            <span
              key={`${src}-${index}`}
              className={`gallery-slide ${active === index ? "is-current" : ""}`}
              aria-hidden={active !== index}
            >
              <img
                className={`gallery-photo ${src === "/media/step-floating.png" ? "gallery-cutout" : ""}`}
                src={assetUrl(src)}
                alt={
                  active === index ? `${product.name} — фото ${index + 1}` : ""
                }
                draggable={false}
                decoding="async"
                onError={fallback}
                style={{
                  transformOrigin: origin,
                  transform:
                    zoomed && active === index ? "scale(1.85)" : "scale(1)",
                }}
              />
            </span>
          ))}
        </button>
        <div className="gallery-topline">
          <span className="gallery-edition">STEP STUDIO / EVERYDAY EDIT</span>
          {product.badge && (
            <span className="gallery-badge">{product.badge}</span>
          )}
        </div>
        <div className="gallery-bottomline">
          <span className="gallery-pagination" aria-live="polite">
            {String(active + 1).padStart(2, "0")}{" "}
            <span>/ {String(photos.length).padStart(2, "0")}</span>
          </span>
          <button
            className="gallery-zoom"
            onClick={() => setZoomed(!zoomed)}
            aria-label={zoomed ? "Закрыть увеличение" : "Рассмотреть детали"}
          >
            <Icon name={zoomed ? "minus" : "plus"} size={18} />{" "}
            {zoomed ? "Уменьшить" : "Детали ближе"}
          </button>
        </div>
        {photos.length > 1 && (
          <div className="gallery-arrows">
            <button
              aria-label="Предыдущее фото"
              onClick={() => select(active - 1)}
            >
              <Icon name="arrow" size={20} />
            </button>
            <button
              aria-label="Следующее фото"
              onClick={() => select(active + 1)}
            >
              <Icon name="arrow" size={20} />
            </button>
          </div>
        )}
      </div>
      <div className="gallery-rail">
        {photos.length > 1 && (
          <div className="gallery-thumbnails" aria-label="Выбрать фотографию">
            {photos.map((src, index) => (
              <button
                key={`${src}-${index}`}
                className={active === index ? "selected" : ""}
                aria-label={`Фото ${index + 1}`}
                aria-pressed={active === index}
                onClick={() => select(index)}
              >
                <img
                  src={assetUrl(src)}
                  alt=""
                  draggable={false}
                  onError={fallback}
                />
              </button>
            ))}
          </div>
        )}
        <span className="gallery-footnote">
          В ТВОЁМ РИТМЕ.
          <br />В КАЖДОЙ ДЕТАЛИ.
        </span>
      </div>
    </div>
  );
}
