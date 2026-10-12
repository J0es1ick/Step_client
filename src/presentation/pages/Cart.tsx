import React, { FormEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { errorText } from "../../application/errors";
import { Order } from "../../domain/models";
import Icon from "../components/Icon";
import { Breadcrumbs, Empty } from "../components/Layout";
import Modal from "../components/Modal";
import { ProductImage } from "../components/ProductCard";
import { money } from "../format";
import { useStore } from "../state/StoreProvider";

export function CartItems({ compact = false }: { compact?: boolean }) {
  const { cart, products, setQuantity, setCartOpen } = useStore();
  return (
    <div className={`cart-items ${compact ? "compact" : ""}`}>
      {cart.map((line) => {
        const p = products.find((p) => p.id === line.productId);
        return (
          <article className="cart-item" key={`${line.productId}-${line.size}`}>
            <Link
              className="cart-item-image"
              to={`/product/${line.productId}`}
              onClick={() => setCartOpen(false)}
            >
              {p ? <ProductImage product={p} /> : <Icon name="box" size={30} />}
            </Link>
            <div className="cart-item-info">
              <span className="muted small">
                {p?.brand || "Товар недоступен"}
              </span>
              <Link
                to={`/product/${line.productId}`}
                onClick={() => setCartOpen(false)}
              >
                <h3>{p?.name || line.productId}</h3>
              </Link>
              <p>
                Размер: {line.size}
                {p && ` · ${p.color}`}
              </p>
              <div className="quantity-control">
                <button
                  type="button"
                  aria-label={`Уменьшить количество ${p?.name}`}
                  onClick={() =>
                    setQuantity(line.productId, line.size, line.quantity - 1)
                  }
                >
                  <Icon name="minus" size={15} />
                </button>
                <span>{line.quantity}</span>
                <button
                  type="button"
                  aria-label={`Увеличить количество ${p?.name}`}
                  disabled={
                    !p || line.quantity >= Math.min(p.stock[line.size] || 0, 20)
                  }
                  onClick={() =>
                    setQuantity(line.productId, line.size, line.quantity + 1)
                  }
                >
                  <Icon name="plus" size={15} />
                </button>
              </div>
              {(!p || line.quantity > (p.stock[line.size] || 0)) && (
                <span className="field-error">
                  Нет нужного количества. Измените корзину.
                </span>
              )}
            </div>
            <div className="cart-item-end">
              <strong>{p ? money(p.price * line.quantity) : "—"}</strong>
              <button
                type="button"
                className="icon-button"
                aria-label={`Удалить ${p?.name || "товар"}`}
                onClick={() => setQuantity(line.productId, line.size, 0)}
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, products } = useStore();
  if (!cartOpen) return null;
  const subtotal = cart.reduce(
    (sum, line) =>
      sum +
      (products.find((p) => p.id === line.productId)?.price || 0) *
        line.quantity,
    0,
  );
  return (
    <Modal title="Корзина" drawer onClose={() => setCartOpen(false)}>
      <div className="drawer-heading">
        <span className="eyebrow">ПОЧТИ ТВОЁ</span>
        <h2>
          Твоя корзина{" "}
          <span>{cart.reduce((sum, l) => sum + l.quantity, 0)}</span>
        </h2>
      </div>
      {cart.length ? (
        <>
          <div className="delivery-progress">
            <p>
              {subtotal >= 10000
                ? "Твоя доставка — за наш счёт"
                : `Ещё ${money(10000 - subtotal)} до бесплатной доставки`}
            </p>
            <div>
              <span style={{ width: `${Math.min(subtotal / 100, 100)}%` }} />
            </div>
          </div>
          <CartItems compact />
          <div className="drawer-summary">
            <div>
              <span>Товары на сумму</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <p>Доставку рассчитаем на следующем шаге.</p>
            <Link
              to="/cart"
              className="button full-width"
              onClick={() => setCartOpen(false)}
            >
              Перейти к оформлению <Icon name="arrow" size={18} />
            </Link>
            <button className="text-link" onClick={() => setCartOpen(false)}>
              Продолжить выбирать
            </button>
          </div>
        </>
      ) : (
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setCartOpen(false);
          }}
        >
          <Empty title="Здесь пока пусто">
            Самое время найти свою новую любимую пару.
          </Empty>
        </div>
      )}
    </Modal>
  );
}
export default function Cart() {
  const {
    shop,
    cart,
    products,
    user,
    setAuthOpen,
    clearCart,
    refresh,
    loading,
    error: catalogError,
  } = useStore();
  const [delivery, setDelivery] = useState<"courier" | "pickup">("courier");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const requestId = useRef("");
  const navigate = useNavigate();
  const subtotal = cart.reduce(
    (sum, line) =>
      sum +
      (products.find((p) => p.id === line.productId)?.price || 0) *
        line.quantity,
    0,
  );
  const deliveryCost = delivery === "pickup" || subtotal >= 10000 ? 0 : 490;
  const invalidCart =
    loading ||
    !!catalogError ||
    cart.some((line) => {
      const p = products.find((p) => p.id === line.productId);
      return !p || line.quantity > (p.stock[line.size] || 0);
    });
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setBusy(true);
    setError("");
    const fields = new FormData(e.currentTarget);
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      const order = await shop.checkout({
        items: cart,
        name: String(fields.get("name") || ""),
        phone: String(fields.get("phone") || ""),
        address:
          delivery === "courier" ? String(fields.get("address") || "") : "",
        comment: String(fields.get("comment") || "") || "",
        delivery,
        payment: "on_receipt",
        requestId: requestId.current,
      });
      setOrder(order);
      clearCart();
      await refresh();
    } catch (e) {
      setError(errorText(e));
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  if (order)
    return (
      <div className="container page-content">
        <div className="order-success">
          <div className="success-icon">
            <Icon name="check" size={40} />
          </div>
          <span className="eyebrow">ЕЩЁ ОДИН ХОРОШИЙ ШАГ</span>
          <h1>{shop.preview ? "Демо-заказ готов!" : "Заказ оформлен!"}</h1>
          <p>
            {shop.preview
              ? "Ты прошёл весь путь покупки. Это учебный заказ — оплаты и доставки не будет."
              : `Спасибо, ${order.name.split(" ")[0]}. Твои новые любимые вещи скоро будут рядом.`}
          </p>
          <div className="success-ticket">
            <div>
              <span>Номер заказа</span>
              <strong>{order.id}</strong>
            </div>
            <div>
              <span>К оплате при получении</span>
              <strong>{money(order.total)}</strong>
            </div>
            <div>
              <span>Доставка</span>
              <strong>
                {order.delivery === "courier" ? "Курьером" : "Самовывоз"}
              </strong>
            </div>
          </div>
          <p className="muted">
            Заказ сохранён. Его статус доступен в личном кабинете.
            <br />
            {shop.preview
              ? "Он хранится только в этом браузере."
              : "Срок получения подтвердит менеджер."}
          </p>
          <button className="button" onClick={() => navigate("/account")}>
            Мои заказы <Icon name="arrow" size={18} />
          </button>
          <Link className="text-link" to="/catalog">
            Продолжить покупки
          </Link>
        </div>
      </div>
    );
  return (
    <div className="container page-content cart-page">
      <Breadcrumbs items={[{ label: "Корзина" }]} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">ВЫБОР, КОТОРЫЙ РАДУЕТ</span>
          <h1>Твоя корзина</h1>
        </div>
        <Link to="/catalog" className="text-link">
          Продолжить покупки <Icon name="arrow" size={18} />
        </Link>
      </div>
      {!cart.length ? (
        <Empty title="Первый шаг — выбрать любимое">
          Добавляй вещи в корзину. Мы сохраним их, пока ты определяешься.
        </Empty>
      ) : (
        <form onSubmit={submit} className="checkout-layout">
          <div>
            <CartItems />
            {!user ? (
              <div className="checkout-signin">
                <Icon name="user" size={30} />
                <div>
                  <h2>Давай сохраним твой заказ</h2>
                  <p>Войди или создай аккаунт, чтобы продолжить.</p>
                </div>
                <button
                  className="button"
                  type="button"
                  onClick={() => setAuthOpen(true)}
                >
                  Войти
                </button>
              </div>
            ) : (
              <div className="checkout-fields" key={user.id}>
                <h2>
                  <span>01</span> Как с тобой связаться
                </h2>
                <div className="form-grid">
                  <label className="field">
                    Имя получателя
                    <input
                      name="name"
                      autoComplete="name"
                      defaultValue={user.name}
                      required
                      minLength={2}
                      maxLength={80}
                    />
                  </label>
                  <label className="field">
                    Телефон
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      defaultValue={user.phone}
                      placeholder="+7 999 123-45-67"
                      pattern="\+?[0-9\s()\-]{10,25}"
                      required
                      maxLength={25}
                    />
                  </label>
                </div>
                <h2>
                  <span>02</span> Как получить
                </h2>
                <div className="delivery-options">
                  <label className={delivery === "courier" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === "courier"}
                      onChange={() => setDelivery("courier")}
                    />
                    <Icon name="truck" />
                    <span>
                      <strong>Курьером</strong>
                      <small>По указанному адресу</small>
                    </span>
                    <b>{subtotal >= 10000 ? "Бесплатно" : "490 ₽"}</b>
                  </label>
                  <label className={delivery === "pickup" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === "pickup"}
                      onChange={() => setDelivery("pickup")}
                    />
                    <Icon name="pin" />
                    <span>
                      <strong>Самовывоз</strong>
                      <small>Место согласует менеджер</small>
                    </span>
                    <b>Бесплатно</b>
                  </label>
                </div>
                {delivery === "courier" && (
                  <label className="field">
                    Адрес доставки
                    <input
                      name="address"
                      autoComplete="street-address"
                      defaultValue={user.address}
                      required
                      minLength={10}
                      maxLength={300}
                      placeholder="Город, улица, дом, квартира"
                    />
                  </label>
                )}
                <label className="field">
                  Комментарий к заказу{" "}
                  <span className="muted">необязательно</span>
                  <textarea
                    name="comment"
                    rows={3}
                    maxLength={500}
                    placeholder="Например, как найти подъезд"
                  />
                </label>
                <h2>
                  <span>03</span> Оплата при получении
                </h2>
                <p className="muted">
                  Оплатишь заказ после получения. Онлайн-списания сейчас нет.
                </p>
              </div>
            )}
          </div>
          <aside className="order-summary">
            <h2>Твой заказ</h2>
            <div>
              <span>
                Товары ({cart.reduce((sum, l) => sum + l.quantity, 0)})
              </span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Доставка</span>
              <strong>
                {deliveryCost ? money(deliveryCost) : "Бесплатно"}
              </strong>
            </div>
            {deliveryCost > 0 && (
              <p className="summary-hint">От 10 000 ₽ доставляем бесплатно</p>
            )}
            <div className="summary-total">
              <span>Итого</span>
              <strong>{money(subtotal + deliveryCost)}</strong>
            </div>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {invalidCart && (
              <p className="field-error">
                {catalogError ||
                  "Проверь наличие и количество товаров в корзине."}
              </p>
            )}
            <button
              className="button full-width"
              disabled={busy || invalidCart}
            >
              {busy
                ? "Оформляем…"
                : !user
                  ? "Войти и оформить"
                  : "Оформить заказ"}
              <Icon name="arrow" size={18} />
            </button>
            <p className="checkout-terms">
              Нажимая кнопку, ты подтверждаешь данные заказа.{" "}
              <Link to="/info/privacy">Как мы используем данные</Link>
            </p>
            <span className="secure-note">
              <Icon name="shield" size={16} />
              Безопасно и без предоплаты
            </span>
          </aside>
        </form>
      )}
    </div>
  );
}
