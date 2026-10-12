import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { filterProducts } from "../application/filter-products";
import { validCart } from "../domain/cart";
import { Product } from "../domain/models";
import { HttpShopGateway } from "../infrastructure/http/http-shop-gateway";
import { BrowserPreferences } from "../infrastructure/storage/browser-preferences";
import { ProductDetails } from "./pages/Product";
import { StoreProvider, useStore } from "./state/StoreProvider";

import ProductGallery, { productPhotos } from "./components/ProductGallery";
import Showcase, { OrbitCollection } from "./components/Showcase";
import { advanceOrbitMotion, OrbitMotion } from "./hooks/useOrbitSpring";
import Admin from "./pages/Admin";

const product: Product = {
  id: "test",
  version: 0,
  name: "Test Runner",
  brand: "STEP",
  category: "sneakers",
  gender: "unisex",
  price: 8990,
  oldPrice: null,
  description: "Comfortable everyday shoes.",
  material: "Cotton",
  color: "Sage",
  colorHex: "#889977",
  images: ["/media/step-hero.png"],
  stock: { "38": 0, "39": 2 },
  badge: "Новинка",
  active: true,
  createdAt: "2026-10-10",
};
const apparel: Product = {
  ...product,
  id: "tee",
  name: "Essential Tee",
  category: "clothing",
  price: 2490,
  oldPrice: 2990,
  stock: { M: 4 },
  badge: "−17%",
};
beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () =>
      String(url).includes("/products") ? [product, apparel] : null,
  })) as jest.Mock;
});
afterEach(() => jest.restoreAllMocks());
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <StoreProvider
      shop={new HttpShopGateway()}
      preferences={new BrowserPreferences()}
    >
      {children}
    </StoreProvider>
  </MemoryRouter>
);

test("filters match a shared link including category, price, size and sale, and include unisex products", () => {
  expect(
    filterProducts(
      [product, apparel],
      new URLSearchParams("category=clothing&size=M&sale=1&max=3000"),
    ).map((p) => p.id),
  ).toEqual(["tee"]);
  expect(
    filterProducts(
      [product, apparel],
      new URLSearchParams("gender=women&size=38"),
    ),
  ).toEqual([]);
  expect(
    filterProducts(
      [product, apparel],
      new URLSearchParams("gender=women&sort=price-asc"),
    ).map((p) => p.id),
  ).toEqual(["tee", "test"]);
  expect(
    filterProducts([product, apparel], new URLSearchParams("q=essential")),
  ).toEqual([apparel]);
});
test("ignores corrupted persisted cart data", () => {
  expect(validCart([{ productId: "test", size: "39", quantity: 1 }])).toBe(
    true,
  );
  expect(validCart([{ productId: "test", size: "39", quantity: -1 }])).toBe(
    false,
  );
  expect(validCart([{ productId: "test", size: "39", quantity: 1.5 }])).toBe(
    false,
  );
  expect(validCart({})).toBe(false);
});
test("requires an available size, persists cart, and caps quantity at stock", async () => {
  render(<ProductDetails product={product} />, { wrapper });
  expect(screen.getByRole("button", { name: "38" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Сначала выбери размер");
  fireEvent.click(screen.getByRole("button", { name: "39" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem("step-cart-v1")!)).toEqual([
      { productId: "test", size: "39", quantity: 1 },
    ]),
  );
  expect(screen.getByText("Размер 39 уже в корзине")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Добавлено в корзину" }));
  fireEvent.click(screen.getByRole("button", { name: "Добавлено в корзину" }));
  expect(JSON.parse(localStorage.getItem("step-cart-v1")!)[0].quantity).toBe(2);
});

test("a stale cart can be reduced below its saved quantity while increases still respect stock", async () => {
  localStorage.setItem(
    "step-cart-v1",
    JSON.stringify([{ productId: "test", size: "39", quantity: 5 }]),
  );
  function Controls() {
    const { cart, loading, setQuantity } = useStore();
    if (loading) return null;
    const quantity = cart[0]?.quantity ?? 0;
    return (
      <>
        <output aria-label="Quantity">{quantity}</output>
        <button onClick={() => setQuantity("test", "39", quantity - 1)}>
          Minus
        </button>
        <button onClick={() => setQuantity("test", "39", quantity + 1)}>
          Plus
        </button>
      </>
    );
  }
  render(<Controls />, { wrapper });
  await screen.findByRole("button", { name: "Minus" });
  fireEvent.click(screen.getByRole("button", { name: "Minus" }));
  expect(screen.getByLabelText("Quantity")).toHaveTextContent("4");
  fireEvent.click(screen.getByRole("button", { name: "Plus" }));
  expect(screen.getByLabelText("Quantity")).toHaveTextContent("4");
  fireEvent.click(screen.getByRole("button", { name: "Minus" }));
  fireEvent.click(screen.getByRole("button", { name: "Minus" }));
  expect(screen.getByLabelText("Quantity")).toHaveTextContent("2");
  fireEvent.click(screen.getByRole("button", { name: "Minus" }));
  fireEvent.click(screen.getByRole("button", { name: "Minus" }));
  expect(screen.getByLabelText("Quantity")).toHaveTextContent("0");
});

test("gallery wraps in both directions, switches thumbnails and resets zoom for a new photograph", () => {
  render(
    <ProductGallery
      product={{
        ...product,
        images: ["/first.png", "/second.png", "/third.png"],
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Увеличить фотографию" }));
  expect(
    screen.getByRole("button", { name: "Уменьшить фотографию" }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Предыдущее фото" }));
  expect(
    screen.getByRole("img", { name: "Test Runner — фото 3" }),
  ).toHaveAttribute("src", "/third.png");
  expect(
    screen.getByRole("button", { name: "Увеличить фотографию" }),
  ).toHaveAttribute("aria-pressed", "false");
  fireEvent.keyDown(screen.getByRole("button", { name: "Следующее фото" }), {
    key: "ArrowRight",
  });
  expect(screen.getByRole("button", { name: "Фото 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Фото 2" }));
  expect(
    screen.getByRole("img", { name: "Test Runner — фото 2" }),
  ).toHaveAttribute("src", "/second.png");
});

test("an edited product keeps its own photographs and a single photo has no carousel arrows", () => {
  expect(
    productPhotos({ ...product, id: "sage-runner", images: ["/custom.png"] }),
  ).toEqual(["/custom.png"]);
  render(<ProductGallery product={product} />);
  expect(
    screen.queryByRole("button", { name: "Следующее фото" }),
  ).not.toBeInTheDocument();
});

test.each([30, 60, 120])(
  "orbit items swing past rest in both directions then settle at %i fps",
  (fps) => {
    let state: OrbitMotion = {
      position: 0,
      velocity: 0,
      sway: 0,
      swayVelocity: 0,
    };
    const swings: number[] = [];
    for (let frame = 0; frame < fps * 6; frame++) {
      state = advanceOrbitMotion(state, 1, 1 / fps);
      if (frame > fps / 2 && frame < fps * 2) swings.push(state.sway);
      expect(Number.isFinite(state.sway)).toBe(true);
      expect(Math.abs(state.sway)).toBeLessThanOrEqual(24);
    }
    expect(Math.max(...swings)).toBeGreaterThan(1);
    expect(Math.min(...swings)).toBeLessThan(-0.1);
    expect(state.position).toBeCloseTo(1, 4);
    expect(Math.abs(state.sway)).toBeLessThan(0.001);
    expect(Math.abs(state.swayVelocity)).toBeLessThan(0.001);
  },
);

test("changing direction before settling keeps the orbit finite and settles on the new product", () => {
  let state: OrbitMotion = {
    position: 0,
    velocity: 0,
    sway: 0,
    swayVelocity: 0,
  };
  for (let frame = 0; frame < 600; frame++) {
    const target = frame < 10 ? 3 : frame < 20 ? -2 : 1;
    state = advanceOrbitMotion(state, target, 1 / 60);
    expect(Number.isFinite(state.position)).toBe(true);
  }
  expect(state.position).toBeCloseTo(1, 4);
  expect(Math.abs(state.sway)).toBeLessThan(0.001);
});
test("hides admin operations when not authenticated", async () => {
  render(<Admin />, { wrapper });
  expect(
    await screen.findByRole("heading", { name: "Раздел для команды STEP" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Добавить товар" }),
  ).not.toBeInTheDocument();
  expect(
    (global.fetch as jest.Mock).mock.calls.some(([url]) =>
      String(url).endsWith("/admin"),
    ),
  ).toBe(false);
});

test("orbit navigation wraps and keeps title, price, product link and preview in sync", () => {
  const preview = jest.fn();
  render(
    <MemoryRouter>
      <OrbitCollection
        products={[product, apparel]}
        motion={false}
        reduced={true}
        onPreview={preview}
      />
    </MemoryRouter>,
  );
  const next = screen.getByRole("button", { name: "Следующий товар" });
  fireEvent.click(next);
  expect(
    screen.getByRole("heading", { name: "Essential Tee" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Смотреть модель" })).toHaveAttribute(
    "href",
    "/product/tee",
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "2 из 2: Essential Tee, 2 490 ₽",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Быстрый просмотр: Essential Tee" }),
  );
  expect(preview).toHaveBeenCalledWith(apparel);
  fireEvent.click(next);
  expect(
    screen.getByRole("heading", { name: "Test Runner" }),
  ).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("group", { name: /Круговая витрина/ }), {
    key: "ArrowLeft",
  });
  expect(
    screen.getByRole("heading", { name: "Essential Tee" }),
  ).toBeInTheDocument();
});

test("collection link focuses the section without replacing the demo route hash", () => {
  const scroll = jest.fn();
  render(
    <MemoryRouter>
      <OrbitCollection
        products={[product]}
        motion={false}
        reduced={true}
        onPreview={jest.fn()}
      />
      <section
        id="collection"
        tabIndex={-1}
        ref={(element) => {
          if (element) element.scrollIntoView = scroll;
        }}
      >
        Collection
      </section>
    </MemoryRouter>,
  );
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  fireEvent(screen.getByRole("link", { name: /Листай. Находи своё/ }), click);
  expect(click.defaultPrevented).toBe(true);
  expect(screen.getByText("Collection")).toHaveFocus();
  expect(scroll).toHaveBeenCalledWith({ behavior: "auto" });
});

test("switching orbit categories replaces the objects and handles an empty or single-item category", async () => {
  render(<Showcase />, { wrapper });
  expect(
    await screen.findByRole("heading", { name: "Test Runner" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "ОДЕЖДА" }));
  expect(
    screen.getByRole("heading", { name: "Essential Tee" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Выбрать Test Runner" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Следующий товар" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "АКСЕССУАРЫ" }));
  expect(
    screen.getByRole("heading", { name: "Скоро в коллекции" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "ОБУВЬ" }));
  expect(
    screen.getByRole("heading", { name: "Test Runner" }),
  ).toBeInTheDocument();
});
