import React, { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Product } from "../../domain/models";
import { DemoShopGateway } from "../../infrastructure/demo/demo-shop-gateway";
import { BrowserPreferences } from "../../infrastructure/storage/browser-preferences";
import { StoreProvider } from "../state/StoreProvider";
import ProductEditor from "./ProductEditor";
import StockEditor from "./StockEditor";

beforeEach(() => localStorage.clear());
test.each([false, true])(
  "a stale %s editor keeps edits visible and offers an explicit fresh reload",
  async (stockMode) => {
    const prefs = new BrowserPreferences("step-demo-");
    const shop = new DemoShopGateway(prefs);
    await shop.preview.enter("admin");
    const opened = (await shop.adminData()).products[0];
    await shop.updateStock(opened.id, {
      stock: { ...opened.stock, "40": 7 },
      expectedVersion: opened.version,
    });
    const saved = jest.fn();
    function Harness() {
      const [product, setProduct] = useState<Product>(opened);
      const Editor = stockMode ? StockEditor : ProductEditor;
      return (
        <Editor
          key={product.version}
          product={product}
          close={jest.fn()}
          saved={saved}
          reload={async () => setProduct((await shop.adminData()).products[0])}
        />
      );
    }
    await act(async () => {
      render(
        <MemoryRouter>
          <StoreProvider shop={shop} preferences={prefs}>
            <Harness />
          </StoreProvider>
        </MemoryRouter>,
      );
    });
    const label = stockMode ? /^Размеры и остатки/ : /^Название$/;
    const button = stockMode ? "Сохранить остатки" : "Сохранить товар";
    const edit = stockMode ? "40:10" : "My new name";
    fireEvent.change(screen.getByLabelText(label), { target: { value: edit } });
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Товар изменился",
    );
    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByLabelText(label)).toHaveValue(edit);
    expect(screen.getByRole("button", { name: button })).toBeDisabled();
    expect((await shop.catalog())[0].stock["40"]).toBe(7);
    fireEvent.click(
      screen.getByRole("button", { name: "Загрузить свежие данные" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText(label), { target: { value: edit } });
    fireEvent.click(screen.getByRole("button", { name: button }));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect((await shop.catalog())[0].stock["40"]).toBe(stockMode ? 10 : 7);
    if (!stockMode)
      expect(
        screen.queryByLabelText("Размеры и остатки"),
      ).not.toBeInTheDocument();
  },
);
