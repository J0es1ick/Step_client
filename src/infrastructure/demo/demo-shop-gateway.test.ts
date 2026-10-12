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
