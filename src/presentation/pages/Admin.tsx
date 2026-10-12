import React, { FormEvent, useEffect, useState } from "react";
import { errorText } from "../../application/errors";
import { ProductInput } from "../../application/ports/shop-gateway";
import { AdminData, OrderStatus, Product } from "../../domain/models";
import Icon from "../components/Icon";
import { Breadcrumbs, Empty } from "../components/Layout";
import Modal from "../components/Modal";
import { categories, date, money, statuses } from "../format";
import { useStore } from "../state/StoreProvider";
import { assetUrl } from "../assets";

const blankProduct: Omit<Product, "id" | "createdAt"> = {
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
function ProductEditor({
  product,
  close,
  saved,
}: {
  product: Product | null;
  close: () => void;
  saved: () => void;
}) {
  const { shop } = useStore();
  const initial = product || blankProduct;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const stock = Object.fromEntries(
        String(form.get("stock"))
          .split(",")
          .map((s) => {
            const [size, count] = s.trim().split(":");
            if (
              !size ||
              !count?.trim() ||
              !Number.isInteger(Number(count)) ||
              Number(count) < 0
            )
              throw new Error("Остатки указываются в формате 38:5, 39:8, 40:3");
            return [size.trim(), Number(count)];
          }),
      );
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
        stock,
        badge: String(form.get("badge") || ""),
        active: form.get("active") === "on",
      };
      setBusy(true);
      await shop.saveProduct(input, product?.id);
      saved();
    } catch (e) {
      setError(errorText(e));
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
          <label className="field">
            Размеры и остатки
            <input
              name="stock"
              defaultValue={Object.entries(initial.stock)
                .map(([s, n]) => `${s}:${n}`)
                .join(", ")}
              required
            />
            <small>
              Например: 38:5, 39:8 или S:10, M:12. Ноль означает «нет в
              наличии».
            </small>
          </label>
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
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="editor-actions">
            <button
              type="button"
              className="button button-light"
              onClick={close}
            >
              Отмена
            </button>
            <button className="button" disabled={busy}>
              {busy ? "Сохраняем…" : "Сохранить товар"}
              <Icon name="check" size={18} />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
export default function Admin() {
  const { shop, user, authLoading, refresh, notify } = useStore();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("products");
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setError("");
    try {
      setData(await shop.adminData());
    } catch (e) {
      setError(errorText(e));
    }
  };
  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user?.role]);
  if (authLoading)
    return (
      <div className="container page-content loading-text">
        Проверяем доступ…
      </div>
    );
  if (user?.role !== "admin")
    return (
      <div className="container page-content">
        <Empty
          icon="shield"
          title="Раздел для команды STEP"
          action={user ? "В личный кабинет" : "Войти в аккаунт"}
          to="/account"
        >
          Управлять магазином может только пользователь с ролью администратора.
        </Empty>
      </div>
    );
  const changeStatus = async (id: string, status: OrderStatus) => {
    setBusy(true);
    try {
      await shop.orderStatus(id, status);
      await load();
      await refresh();
      notify("Статус заказа обновлён");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const archive = async (product: Product) => {
    if (
      !window.confirm(
        `Скрыть «${product.name}» из каталога? История заказов сохранится.`,
      )
    )
      return;
    setBusy(true);
    try {
      await shop.archiveProduct(product.id);
      await load();
      await refresh();
      notify("Товар скрыт из каталога");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="container page-content admin-page">
      <Breadcrumbs
        items={[
          { label: "Кабинет", to: "/account" },
          { label: "Управление магазином" },
        ]}
      />
      <div className="page-heading">
        <div>
          <span className="eyebrow">ЗА КУЛИСАМИ STEP</span>
          <h1>Магазин под контролем</h1>
          <p>Каталог, заказы и люди, которые выбирают нас.</p>
        </div>
        <span className="admin-role">
          <Icon name="shield" size={16} />
          Администратор
        </span>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
          <button className="text-link" onClick={load}>
            Повторить
          </button>
        </div>
      )}
      {data ? (
        <>
          <div className="admin-stats">
            <div>
              <span>Активных товаров</span>
              <strong>{data.products.filter((p) => p.active).length}</strong>
              <Icon name="box" />
            </div>
            <div>
              <span>Новых заказов</span>
              <strong>
                {data.orders.filter((o) => o.status === "new").length}
              </strong>
              <Icon name="bag" />
            </div>
            <div>
              <span>Полученные заказы</span>
              <strong>
                {money(
                  data.orders
                    .filter((o) => o.status === "delivered")
                    .reduce((sum, o) => sum + o.total, 0),
                )}
              </strong>
              <Icon name="check" />
            </div>
            <div>
              <span>Покупателей</span>
              <strong>
                {data.customers.filter((c) => c.role === "customer").length}
              </strong>
              <Icon name="user" />
            </div>
          </div>
          <div className="admin-toolbar">
            <div className="tabs">
              {[
                ["products", "Товары"],
                ["orders", "Заказы"],
                ["customers", "Покупатели"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={tab === id ? "active" : ""}
                  onClick={() => {
                    setTab(id);
                    setSearch("");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "products" && (
              <button className="button" onClick={() => setEditor("new")}>
                <Icon name="plus" size={18} />
                Добавить товар
              </button>
            )}
          </div>
          <div className="admin-search">
            <Icon name="search" size={18} />
            <input
              aria-label="Поиск в админке"
              placeholder={
                tab === "products"
                  ? "Поиск по названию или бренду"
                  : tab === "orders"
                    ? "Номер заказа или имя покупателя"
                    : "Имя или email"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {tab === "products" ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Категория</th>
                    <th>Цена</th>
                    <th>Остаток</th>
                    <th>Статус</th>
                    <th>
                      <span className="sr-only">Действия</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.products
                    .filter((p) =>
                      `${p.name} ${p.brand}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="admin-product">
                            <img src={assetUrl(p.images[0])} alt="" />
                            <span>
                              <strong>{p.name}</strong>
                              <small>{p.brand}</small>
                            </span>
                          </div>
                        </td>
                        <td>{categories[p.category]}</td>
                        <td>{money(p.price)}</td>
                        <td>
                          {Object.values(p.stock).reduce(
                            (sum, n) => sum + n,
                            0,
                          )}{" "}
                          шт.
                        </td>
                        <td>
                          <span
                            className={`status ${p.active ? "status-confirmed" : "status-cancelled"}`}
                          >
                            {p.active ? "В продаже" : "Скрыт"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-button"
                              aria-label={`Редактировать ${p.name}`}
                              onClick={() => setEditor(p)}
                            >
                              <Icon name="edit" size={18} />
                            </button>
                            {p.active && (
                              <button
                                disabled={busy}
                                className="icon-button"
                                aria-label={`Скрыть ${p.name}`}
                                onClick={() => archive(p)}
                              >
                                <Icon name="trash" size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : tab === "orders" ? (
            <div className="admin-orders">
              {data.orders
                .filter((o) =>
                  `${o.id} ${o.name}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((order) => (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-heading">
                      <div>
                        <strong>{order.id}</strong>
                        <span>
                          {date(order.createdAt)} · {order.name} · {order.phone}
                        </span>
                      </div>
                      <select
                        aria-label={`Статус ${order.id}`}
                        disabled={busy}
                        value={order.status}
                        onChange={(e) =>
                          changeStatus(order.id, e.target.value as OrderStatus)
                        }
                      >
                        {Object.entries(statuses).map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p>
                      {order.items
                        .map((i) => `${i.name} / ${i.size} × ${i.quantity}`)
                        .join(", ")}
                    </p>
                    <p className="muted">{order.address}</p>
                    {order.comment && <p>Комментарий: {order.comment}</p>}
                    <div className="order-card-bottom">
                      <span>
                        Оплата при получении{" "}
                        <strong>{money(order.total)}</strong>
                      </span>
                      <span className={`status status-${order.status}`}>
                        {statuses[order.status]}
                      </span>
                    </div>
                  </article>
                ))}
              {!data.orders.length && (
                <div className="empty-state">
                  <Icon name="bag" size={36} />
                  <h2>Новые заказы появятся здесь</h2>
                </div>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>Дата регистрации</th>
                    <th>Роль</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers
                    .filter((c) =>
                      `${c.name} ${c.email}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.phone || "—"}</td>
                        <td>{date(c.createdAt)}</td>
                        <td>
                          {c.role === "admin" ? "Администратор" : "Покупатель"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        !error && <p className="loading-text">Загружаем магазин…</p>
      )}
      {editor && (
        <ProductEditor
          product={editor === "new" ? null : editor}
          close={() => setEditor(null)}
          saved={async () => {
            setEditor(null);
            await load();
            await refresh();
            notify("Товар сохранён");
          }}
        />
      )}
    </div>
  );
}
