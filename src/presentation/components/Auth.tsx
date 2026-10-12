import React, { FormEvent, useState } from "react";
import { errorText } from "../../application/errors";

import { useStore } from "../state/StoreProvider";
import { DemoAccess } from "./DemoBanner";
import Icon from "./Icon";
import Modal from "./Modal";

export function AuthForm() {
  const { signIn, shop } = useStore();
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const input = {
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
      ...(register ? { name: String(form.get("name")).trim() } : {}),
    };
    try {
      await signIn(
        await (register
          ? shop.register({ ...input, name: input.name || "" })
          : shop.login(input)),
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  if (shop.preview)
    return (
      <div className="auth-form">
        <span className="auth-symbol">✳</span>
        <span className="eyebrow">STEP / PLAYGROUND</span>
        <h2>Попробуй любой образ</h2>
        <DemoAccess />
      </div>
    );
  return (
    <div className="auth-form">
      <span className="auth-symbol">✳</span>
      <span className="eyebrow">ТВОЙ МАЛЕНЬКИЙ МИР STEP</span>
      <h2>{register ? "Давай знакомиться" : "Рады тебя видеть"}</h2>
      <p>
        {register
          ? "Сохраняй любимое и следи за заказами в одном месте."
          : "Войди, чтобы твои любимые вещи всегда были рядом."}
      </p>
      <div className="auth-tabs">
        <button
          className={!register ? "active" : ""}
          aria-pressed={!register}
          onClick={() => {
            setRegister(false);
            setError("");
          }}
        >
          Войти
        </button>
        <button
          className={register ? "active" : ""}
          aria-pressed={register}
          onClick={() => {
            setRegister(true);
            setError("");
          }}
        >
          Создать аккаунт
        </button>
      </div>
      <form onSubmit={submit} key={String(register)}>
        {register && (
          <label className="field">
            Как тебя зовут
            <input
              name="name"
              autoComplete="name"
              placeholder="Твоё имя"
              required
              minLength={2}
              maxLength={80}
            />
          </label>
        )}
        <label className="field">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={254}
          />
        </label>
        <label className="field">
          Пароль
          <span className="password-field">
            <input
              type={visible ? "text" : "password"}
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              placeholder="Не менее 8 символов"
              required
              minLength={8}
              maxLength={128}
            />
            <button
              type="button"
              className="icon-button"
              aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
              onClick={() => setVisible(!visible)}
            >
              <Icon name="eye" size={19} />
            </button>
          </span>
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <button className="button full-width" disabled={busy}>
          {busy ? "Секунду…" : register ? "Создать аккаунт" : "Войти"}
          <Icon name="arrow" size={18} />
        </button>
      </form>
      <p className="auth-small">
        {register
          ? "Аккаунт нужен для оформления заказа и сохранения избранного. Данные используются для работы магазина."
          : "Твоя корзина сохранится после входа."}
      </p>
    </div>
  );
}
export default function AuthModal() {
  const { authOpen, setAuthOpen } = useStore();
  return authOpen ? (
    <Modal title="Вход в личный кабинет" onClose={() => setAuthOpen(false)}>
      <AuthForm />
    </Modal>
  ) : null;
}
