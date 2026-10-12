import React, { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorText } from "../../application/errors";
import { Order } from "../../domain/models";
import { AuthForm } from "../components/Auth";
import Icon from "../components/Icon";
import { Breadcrumbs, Empty } from "../components/Layout";
import { date, money, statuses } from "../format";
import { useStore } from "../state/StoreProvider";
import { assetUrl } from "../assets";

export default function Account() {
  const { shop, user, authLoading, setUser, logout, notify, refresh } =
    useStore();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await shop.orders());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) load();
  }, [user?.id]);
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      setUser(
        await shop.updateProfile({
          name: String(form.get("name") || ""),
          phone: String(form.get("phone") || ""),
          address: String(form.get("address") || ""),
        }),
      );
      notify("Данные сохранены");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const cancel = async (id: string) => {
    if (!window.confirm("Отменить этот заказ? Товары вернутся в продажу."))
      return;
    setBusy(true);
    try {
      await shop.cancelOrder(id);
      await load();
      await refresh();
      notify("Заказ отменён");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  if (authLoading)
    return (
      <div className="container page-content loading-text" role="status">
        Открываем твой кабинет…
      </div>
    );
  if (!user)
    return (
      <div className="container page-content">
        <div className="standalone-auth">
          <AuthForm />
        </div>
      </div>
    );
  return (
    <div className="container page-content account-page">
      <Breadcrumbs items={[{ label: "Личный кабинет" }]} />
      <div className="account-welcome">
        <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <span className="eyebrow">ТВОЁ ПРОСТРАНСТВО STEP</span>
          <h1>
            Привет, {user.name.split(" ")[0]}
            <span className="heading-spark">✳</span>
          </h1>
          <p>Всё любимое и все заказы — здесь.</p>
        </div>
      </div>
      <div className="account-layout">
        <aside className="account-nav">
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => {
              setTab("orders");
              setError("");
            }}
          >
            <Icon name="box" />
            Мои заказы <span>{orders.length}</span>
          </button>
          <button
            className={tab === "profile" ? "active" : ""}
            onClick={() => {
              setTab("profile");
              setError("");
            }}
          >
            <Icon name="user" />
            Личные данные
          </button>
          <Link to="/favorites">
            <Icon name="heart" />
            Избранное <span>{user.favorites.length}</span>
          </Link>
          {user.role === "admin" && (
            <Link to="/admin">
              <Icon name="grid" />
              Управление магазином
            </Link>
          )}
          <button
            className="logout-button"
            onClick={() => logout().catch((e) => setError(errorText(e)))}
          >
            <Icon name="logout" />
            Выйти
          </button>
        </aside>
        <section className="account-panel">
          {error && (
            <div className="form-error" role="alert">
              {error}
              {tab === "orders" && (
                <button className="text-link" onClick={load}>
                  Повторить
                </button>
              )}
            </div>
          )}
          {tab === "orders" ? (
            <>
              <h2>Мои заказы</h2>
              {loading ? (
                <p className="loading-text">Загружаем заказы…</p>
              ) : orders.length ? (
                <div className="order-list">
                  {orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="order-card-heading">
                        <div>
                          <strong>{order.id}</strong>
                          <span>{date(order.createdAt)}</span>
                        </div>
                        <span className={`status status-${order.status}`}>
                          {statuses[order.status]}
                        </span>
                      </div>
                      <div className="order-products">
                        {order.items.map((item) => (
                          <Link
                            key={`${item.productId}-${item.size}`}
                            to={`/product/${item.productId}`}
                          >
                            <img src={assetUrl(item.image)} alt={item.name} />
                            <div>
                              <strong>{item.name}</strong>
                              <span>
                                Размер {item.size} · {item.quantity} шт.
                              </span>
                            </div>
                            <b>{money(item.price * item.quantity)}</b>
                          </Link>
                        ))}
                      </div>
                      <div className="order-delivery">
                        <Icon name="pin" size={18} />
                        <span>{order.address}</span>
                      </div>
                      <div className="order-card-bottom">
                        <span>
                          {order.payment === "on_receipt"
                            ? "Оплата при получении"
                            : ""}
                          <strong>{money(order.total)}</strong>
                        </span>
                        {order.status === "new" && (
                          <button
                            className="text-link"
                            disabled={busy}
                            onClick={() => cancel(order.id)}
                          >
                            Отменить заказ
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                !error && (
                  <Empty title="Здесь начнётся история твоих покупок">
                    Найди что-то по душе — и первый заказ появится здесь.
                  </Empty>
                )
              )}
            </>
          ) : (
            <>
              <h2>Личные данные</h2>
              <p className="muted">
                Заполни один раз — и оформляй заказы быстрее.
              </p>
              <form className="profile-form" onSubmit={save}>
                <label className="field">
                  Имя
                  <input
                    name="name"
                    defaultValue={user.name}
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </label>
                <label className="field">
                  Email
                  <input value={user.email} type="email" disabled />
                  <small>Используется для входа в аккаунт.</small>
                </label>
                <label className="field">
                  Телефон
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    defaultValue={user.phone}
                    placeholder="+7 999 123-45-67"
                    maxLength={30}
                  />
                </label>
                <label className="field">
                  Адрес доставки
                  <input
                    name="address"
                    autoComplete="street-address"
                    defaultValue={user.address}
                    placeholder="Город, улица, дом, квартира"
                    maxLength={300}
                  />
                </label>
                <button className="button" disabled={busy}>
                  {busy ? "Сохраняем…" : "Сохранить изменения"}
                  <Icon name="check" size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
