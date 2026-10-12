import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { errorText } from "../../application/errors";
import { mergeFavorites } from "../../application/merge-favorites";
import { Preferences } from "../../application/ports/preferences";
import { ShopGateway } from "../../application/ports/shop-gateway";
import { addCartLine, validCart } from "../../domain/cart";
import { CartLine, Product, User } from "../../domain/models";

const validFavorites = (v: unknown) =>
  Array.isArray(v) && v.every((s) => typeof s === "string");
interface StoreContext {
  shop: ShopGateway;
  resetDemo: () => Promise<void>;
  products: Product[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  signIn: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  cart: CartLine[];
  addToCart: (product: Product, size: string) => boolean;
  setQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => Promise<void>;
  quickView: Product | null;
  setQuickView: (product: Product | null) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  toast: string;
  notify: (text: string) => void;
}
const Context = createContext<StoreContext>(null!);
export const useStore = () => useContext(Context);
export function StoreProvider({
  children,
  shop,
  preferences,
}: {
  children: React.ReactNode;
  shop: ShopGateway;
  preferences: Preferences;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>(() =>
    preferences.read("cart-v1", [], validCart),
  );
  const [guestFavorites, setGuestFavorites] = useState<string[]>(() =>
    preferences.read("favorites-v1", [], validFavorites),
  );
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState("");
  const notify = useCallback((text: string) => setToast(text), []);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await shop.catalog());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [shop]);
  useEffect(() => {
    refresh();
    shop
      .me()
      .then(setUser)
      .catch(() => undefined)
      .finally(() => setAuthLoading(false));
  }, [refresh, shop]);
  useEffect(() => {
    preferences.write("cart-v1", cart);
  }, [cart, preferences]);
  useEffect(() => {
    preferences.write("favorites-v1", guestFavorites);
  }, [guestFavorites, preferences]);
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);
  const signIn = async (next: User) => {
    setUser(next);
    setAuthOpen(false);
    try {
      setUser(await mergeFavorites(shop, next, guestFavorites));
      setGuestFavorites([]);
    } catch {
      notify("Вы вошли. Часть избранного не удалось перенести.");
    }
  };
  const logout = async () => {
    await shop.logout();
    setUser(null);
    notify("Вы вышли из аккаунта");
  };
  const addToCart = (product: Product, size: string) => {
    try {
      const next = addCartLine(cart, product, size);
      setCart(next);
      notify(product.name + " — в корзине");
      return true;
    } catch (error) {
      notify(errorText(error));
      return false;
    }
  };
  const setQuantity = (id: string, size: string, quantity: number) => {
    const product = products.find((p) => p.id === id);
    if (
      quantity > 0 &&
      (!product || quantity > Math.min(product.stock[size] || 0, 20))
    ) {
      notify("Больше нет в наличии");
      return;
    }
    setCart((current) =>
      current
        .map((line) =>
          line.productId === id && line.size === size
            ? { ...line, quantity }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };
  const toggleFavorite = async (id: string) => {
    if (!user) {
      setGuestFavorites((current) =>
        current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id],
      );
      return;
    }
    try {
      setUser(await shop.favorite(id, !user.favorites.includes(id)));
    } catch (e) {
      notify(errorText(e));
    }
  };
  return (
    <Context.Provider
      value={{
        shop,
        resetDemo: async () => {
          if (!shop.preview) return;
          await shop.preview.reset();
          setUser(null);
          setCart([]);
          setGuestFavorites([]);
          setQuickView(null);
          setCartOpen(false);
          setAuthOpen(false);
          await refresh();
          notify("Демо начато заново");
        },
        products,
        loading,
        error,
        refresh,
        user,
        authLoading,
        setUser,
        signIn,
        logout,
        cart,
        addToCart,
        setQuantity,
        clearCart: () => setCart([]),
        favorites: user?.favorites || guestFavorites,
        toggleFavorite,
        quickView,
        setQuickView,
        cartOpen,
        setCartOpen,
        authOpen,
        setAuthOpen,
        toast,
        notify,
      }}
    >
      {children}
    </Context.Provider>
  );
}
