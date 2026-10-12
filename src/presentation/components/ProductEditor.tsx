import React, { FormEvent, useState } from "react";
import { errorText, ShopConflictError } from "../../application/errors";
import { ProductInput } from "../../application/ports/shop-gateway";
import { Product } from "../../domain/models";
import { useStore } from "../state/StoreProvider";
import Icon from "./Icon";
import Modal from "./Modal";
import { parseStock, StockField } from "./StockEditor";
import ConflictNotice from "./ConflictNotice";
import { categories } from "../format";

const blankProduct: Omit<Product, "id" | "createdAt"> = {
  version: 0,
  name: "",
  brand: "STEP Studio",
  category: "sneakers",
  gender: "unisex",
  price: 4990,
  oldPrice: null,
  description: "",
  material: "",
  color: "",
  colorHex: "#b5bca8",
  images: [""],
  stock: { "37": 5, "38": 5, "39": 5, "40": 5, "41": 5, "42": 5 },
  badge: "",
  active: true,
};
export default function ProductEditor({
  product,
  close,
  saved,
  reload,
}: {
  product: Product | null;
  close: () => void;
  saved: () => void;
  reload: () => Promise<void>;
}) {
  const { shop } = useStore();
  const initial = product || blankProduct;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const input: ProductInput = {
        name: String(form.get("name") || ""),
        brand: String(form.get("brand") || ""),
        category: String(form.get("category")) as Product["category"],
        gender: String(form.get("gender")) as Product["gender"],
        price: Number(form.get("price")),
        oldPrice: form.get("oldPrice") ? Number(form.get("oldPrice")) : null,
        description: String(form.get("description") || ""),
        material: String(form.get("material") || ""),
        color: String(form.get("color") || ""),
        colorHex: String(form.get("colorHex") || ""),
        images: String(form.get("images"))
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        ...(product
          ? { expectedVersion: product.version }
          : { stock: parseStock(form.get("stock")) }),
        badge: String(form.get("badge") || ""),
        active: form.get("active") === "on",
      };
      setBusy(true);
      await shop.saveProduct(input, product?.id);
      saved();
    } catch (e) {
      setError(errorText(e));
      setConflict(e instanceof ShopConflictError);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={product ? "Редактирование товара" : "Новый товар"}
      onClose={close}
      wide
    >
      <div className="admin-editor">
        <span className="eyebrow">КАТАЛОГ STEP</span>
        <h2>{product ? "Редактировать товар" : "Добавить товар"}</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              Название
              <input
                name="name"
                defaultValue={initial.name}
                required
                minLength={2}
                maxLength={120}
              />
            </label>
            <label className="field">
              Бренд
              <input
                name="brand"
                defaultValue={initial.brand}
                required
                maxLength={80}
              />
            </label>
            <label className="field">
              Категория
              <select name="category" defaultValue={initial.category}>
                {Object.entries(categories).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Для кого
              <select name="gender" defaultValue={initial.gender}>
                <option value="unisex">Унисекс</option>
                <option value="women">Женщинам</option>
                <option value="men">Мужчинам</option>
              </select>
            </label>
            <label className="field">
              Цена, ₽
              <input
                name="price"
                type="number"
                defaultValue={initial.price}
                required
                min="1"
                max="1000000"
                step="1"
              />
            </label>
            <label className="field">
              Старая цена, ₽
              <input
                name="oldPrice"
                type="number"
                defaultValue={initial.oldPrice || ""}
                min="1"
                max="1000000"
                step="1"
              />
            </label>
            <label className="field">
              Цвет
              <input
                name="color"
                defaultValue={initial.color}
                maxLength={80}
                required
              />
            </label>
            <label className="field">
              Образец цвета
              <input
                type="color"
                name="colorHex"
                defaultValue={initial.colorHex}
              />
            </label>
          </div>
          <label className="field">
            Описание
            <textarea
              name="description"
              rows={3}
              defaultValue={initial.description}
              minLength={10}
              maxLength={2000}
              required
            />
          </label>
          <label className="field">
            Состав и материал
            <input
              name="material"
              defaultValue={initial.material}
              maxLength={500}
            />
          </label>
          <label className="field">
            Фотографии — одна ссылка на строку
            <textarea
              name="images"
              rows={3}
              defaultValue={initial.images.join("\n")}
              required
              placeholder="https://…"
            />
            <small>
              HTTPS-ссылки или локальные файлы /media/. До 8 фотографий.
            </small>
          </label>
          {!product && <StockField stock={initial.stock} />}
          {product && (
            <p className="muted small">
              Количество по размерам меняется отдельно — кнопкой «Остатки» в
              списке товаров.
            </p>
          )}
          <label className="field">
            Метка
            <input
              name="badge"
              defaultValue={initial.badge}
              maxLength={30}
              placeholder="Например, Новинка"
            />
          </label>
          <label className="checkbox-label">
            <input
              name="active"
              type="checkbox"
              defaultChecked={initial.active}
            />
            Показывать в каталоге
          </label>
          {error && !conflict && (
            <div className="form-error" role="alert">
              {error}
            </div>
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
              {busy ? "Сохраняем…" : "Сохранить товар"}
              <Icon name="check" size={18} />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
