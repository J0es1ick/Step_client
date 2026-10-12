import React, { FormEvent, useState } from "react";
import { errorText, ShopConflictError } from "../../application/errors";
import { validateStock } from "../../application/product-edits";
import { Product } from "../../domain/models";
import { useStore } from "../state/StoreProvider";
import ConflictNotice from "./ConflictNotice";
import Modal from "./Modal";

export function parseStock(value: FormDataEntryValue | null) {
  const stock = Object.fromEntries(
    String(value || "")
      .split(",")
      .map((entry) => {
        const [size, quantity, extra] = entry.trim().split(":");
        if (!size || !quantity?.trim() || extra !== undefined)
          throw new Error("Остатки указываются в формате 38:5, 39:8, 40:3");
        return [size.trim(), Number(quantity)];
      }),
  );
  validateStock(stock);
  return stock;
}
export function StockField({ stock }: { stock: Product["stock"] }) {
  return (
    <label className="field">
      Размеры и остатки
      <input
        name="stock"
        defaultValue={Object.entries(stock)
          .map(([size, count]) => `${size}:${count}`)
          .join(", ")}
        required
      />
      <small>
        Например: 38:5, 39:8 или S:10, M:12. Ноль означает «нет в наличии».
      </small>
    </label>
  );
}
export default function StockEditor({
  product,
  close,
  saved,
  reload,
}: {
  product: Product;
  close: () => void;
  saved: () => void;
  reload: () => Promise<void>;
}) {
  const { shop } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setConflict(false);
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await shop.updateStock(product.id, {
        stock: parseStock(form.get("stock")),
        expectedVersion: product.version,
      });
      saved();
    } catch (e) {
      setError(errorText(e));
      setConflict(e instanceof ShopConflictError);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={`Остатки: ${product.name}`} onClose={close}>
      <div className="admin-editor">
        <span className="eyebrow">СКЛАД STEP</span>
        <h2>Остатки товара</h2>
        <p>{product.name}</p>
        <form onSubmit={submit}>
          <StockField stock={product.stock} />
          <p className="muted small">
            Укажи фактическое количество по каждому размеру. Если товар
            изменится, попросим обновить данные.
          </p>
          {error && !conflict && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {conflict && <ConflictNotice reload={reload} />}
          <div className="editor-actions">
            <button
              type="button"
              className="button button-light"
              onClick={close}
            >
              Отмена
            </button>
            <button className="button" disabled={busy || conflict}>
              {busy ? "Сохраняем…" : "Сохранить остатки"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
