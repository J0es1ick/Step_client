import { CheckoutInput } from "../../application/ports/shop-gateway";
import { BrowserPreferences } from "../storage/browser-preferences";
import { DemoShopGateway } from "./demo-shop-gateway";

const input = (requestId = "same-checkout-request"): CheckoutInput => ({
  items: [{ productId: "sage-runner", size: "40", quantity: 1 }],
  name: "Саша",
  phone: "+7 999 000-00-00",
  address: "Демо-город, улица Примерная, 1",
  comment: "",
  delivery: "courier",
  payment: "on_receipt",
  requestId,
});
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: jest.fn(() => "a1234567-1234-4321-9999-012345678901"),
  });
});
afterEach(() => jest.restoreAllMocks());

test("quota failures preserve successful edits and logout in memory", async () => {
  const shop = new DemoShopGateway(new BrowserPreferences("step-demo-"));
  await shop.preview.enter("admin");
  const product = (await shop.adminData()).products[0];
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  const saved = await shop.updateStock(product.id, {
    stock: { ...product.stock, "40": 3 },
    expectedVersion: product.version,
  });
  expect((await shop.catalog())[0]).toEqual(saved);
  await shop.logout();
  expect(await shop.me()).toBeNull();
  await shop.preview.reset();
  expect((await shop.catalog())[0].stock["40"]).toBe(8);
});
test("preview checkout never uses fetch, is idempotent and restores stock only once", async () => {
  const network = jest.fn();
  global.fetch = network;
  const shop = new DemoShopGateway(new BrowserPreferences("step-demo-"));
  await shop.preview.enter("customer");
  const first = await shop.checkout(input());
  expect(first.total).toBe(9480);
  expect((await shop.checkout(input())).id).toBe(first.id);
  expect((await shop.catalog())[0].stock["40"]).toBe(7);
  await shop.cancelOrder(first.id);
  await expect(shop.cancelOrder(first.id)).rejects.toThrow();
  expect((await shop.catalog())[0].stock["40"]).toBe(8);
  expect(network).not.toHaveBeenCalled();
});
test("roles, edits and reset survive reload without touching live preferences", async () => {
  localStorage.setItem("step-cart-v1", "live-cart");
  const prefs = new BrowserPreferences("step-demo-");
  const shop = new DemoShopGateway(prefs);
  await expect(shop.adminData()).rejects.toThrow();
  await shop.preview.enter("customer");
  await expect(shop.archiveProduct("sage-runner")).rejects.toThrow();
  await shop.preview.enter("admin");
  await shop.archiveProduct("sage-runner");
  const reloaded = new DemoShopGateway(prefs);
  expect((await reloaded.me())?.role).toBe("admin");
  expect(await reloaded.catalog()).toHaveLength(7);
  await reloaded.preview.reset();
  expect(await reloaded.me()).toBeNull();
  expect(await reloaded.catalog()).toHaveLength(8);
  expect(localStorage.getItem("step-cart-v1")).toBe("live-cart");
});
test("failed and duplicated cart lines roll back inventory and create no order", async () => {
  const shop = new DemoShopGateway(new BrowserPreferences("step-demo-"));
  await shop.preview.enter("customer");
  const checkout = input();
  checkout.items = [
    { productId: "sage-runner", size: "40", quantity: 5 },
    { productId: "sage-runner", size: "40", quantity: 5 },
  ];
  await expect(shop.checkout(checkout)).rejects.toThrow();
  expect((await shop.catalog())[0].stock["40"]).toBe(8);
  expect(await shop.orders()).toHaveLength(0);
});
test("invalid saved state falls back to the fictional catalog", async () => {
  localStorage.setItem(
    "step-demo-snapshot-v1",
    '{"version":1,"products":null}',
  );
  expect(
    await new DemoShopGateway(new BrowserPreferences("step-demo-")).catalog(),
  ).toHaveLength(8);
});

test("stale demo edits cannot restore sold stock, including a second gateway instance", async () => {
  const prefs = new BrowserPreferences("step-demo-");
  const shop = new DemoShopGateway(prefs);
  await shop.preview.enter("admin");
  const { id, createdAt, version, stock, ...details } = (await shop.adminData())
    .products[0];
  const second = new DemoShopGateway(prefs);
  await second.preview.enter("customer");
  const order = await second.checkout(input());
  await second.preview.enter("admin");
  await expect(
    shop.saveProduct({ ...details, expectedVersion: version }, id),
  ).rejects.toThrow("Товар изменился");
  await expect(
    shop.updateStock(id, { stock, expectedVersion: version }),
  ).rejects.toThrow("Товар изменился");
  const current = (await shop.catalog())[0];
  expect(current.stock["40"]).toBe(7);
  const saved = await shop.saveProduct(
    { ...details, name: "Updated", expectedVersion: current.version },
    id,
  );
  expect(saved.stock["40"]).toBe(7);
  const adjusted = await shop.updateStock(id, {
    stock: { ...saved.stock, "40": 3 },
    expectedVersion: saved.version,
  });
  expect(adjusted.version).toBe(saved.version + 1);
  await shop.preview.enter("customer");
  await shop.cancelOrder(order.id);
  await shop.preview.enter("admin");
  await expect(
    shop.saveProduct({ ...details, expectedVersion: adjusted.version }, id),
  ).rejects.toThrow("Товар изменился");
  expect((await shop.catalog())[0].stock["40"]).toBe(4);
});
