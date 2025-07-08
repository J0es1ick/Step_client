import React from "react";
import styles from "./productList.module.css";
import { Alert, CircularProgress } from "@mui/material";
import ProductItem from "./productItem";
import Pagination from "../UI/pagination/pagination";
import { Brand } from "../brands/brandList";
import { Category } from "../categories/categoryList";
import { Supplier } from "../suppliers/supplierList";
import ReactModal from "react-modal";

export interface Product {
  product_id: number;
  name: string;
  description: string;
  current_price: number;
  brand?: Brand;
  category?: Category;
  supplier?: Supplier;
  sizes?: Size[];
}

export interface ProductUpdate {
  product_id?: number;
  name: string;
  description: string;
  current_price: number;
  brand_id: number | null;
  category_id: number | null;
  supplier_id: number | null;
}

interface Size {
  product_id: number;
  size: string;
}

const customStyles: ReactModal.Styles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "1000px",
    maxWidth: "90%",
    height: "720px",
    maxHeight: "90%",
    padding: "20px",
    borderRadius: "40px",
    border: "none",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    background: "#fff",
    fontFamily: '"Inter", sans-serif',
    scrollbarWidth: "none",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
};

const getProducts = async (
  page: number = 1,
  limit: number = 8
): Promise<{ data: Product[]; total: number }> => {
  try {
    const response = await fetch(`api/products?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err;
  }
};

const getBrands = async (
  page: number = 1,
  limit: number = 100
): Promise<{ data: Brand[]; total: number }> => {
  const response = await fetch(`/api/brands?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch brands");
  return await response.json();
};

const getCategories = async (
  page: number = 1,
  limit: number = 100
): Promise<{ data: Category[]; total: number }> => {
  const response = await fetch(`/api/categories?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch categories");
  return await response.json();
};

const getSuppliers = async (
  page: number = 1,
  limit: number = 100
): Promise<{ data: Supplier[]; total: number }> => {
  const response = await fetch(`/api/suppliers?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch suppliers");
  return await response.json();
};

export default function ProductList() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
    {}
  );

  const [newProduct, setNewProduct] = React.useState<ProductUpdate>({
    name: "",
    description: "",
    current_price: 0,
    brand_id: null,
    category_id: null,
    supplier_id: null,
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, total } = await getProducts(page);
      setProducts(data);
      setTotalProducts(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      await fetchProducts();
    };

    if (isMounted) {
      loadProducts();
    }

    return () => {
      isMounted = false;
    };
  }, [page]);

  const updateProduct = async (updatedProduct: Product) => {
    if (updatedProduct.product_id === 0) {
      setProducts((prev) =>
        prev.map((p) => (p.product_id === 0 ? updatedProduct : p))
      );
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === updatedProduct.product_id ? updatedProduct : p
        )
      );
    }
    fetchProducts();
  };

  const deleteProduct = async (productId: number) => {
    try {
      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchProducts();
      }
    } catch (err) {
      setError("Failed to delete product");
    }
  };

  const errorProduct = async (errorMsg: string) => {
    setError(errorMsg);
    fetchProducts();
  };

  React.useEffect(() => {
    ReactModal.setAppElement("#root");
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [productsData, brandsData, categoriesData, suppliersData] =
        await Promise.all([
          getProducts(page),
          getBrands(),
          getCategories(),
          getSuppliers(),
        ]);

      setProducts(productsData.data);
      setTotalProducts(productsData.total);
      setBrands(brandsData.data);
      setCategories(categoriesData.data);
      setSuppliers(suppliersData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newProduct.name.trim()) {
      errors.name = "Название обязательно";
    }

    if (newProduct.current_price <= 0) {
      errors.current_price = "Цена должна быть больше 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        current_price: newProduct.current_price,
        brand_id: newProduct.brand_id,
        category_id: newProduct.category_id,
        supplier_id: newProduct.supplier_id,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      const createdProduct = await response.json();

      setProducts((prev) => [createdProduct, ...prev]);
      setModalIsOpen(false);
      setNewProduct({
        name: "",
        description: "",
        current_price: 0,
        brand_id: null,
        category_id: null,
        supplier_id: null,
      });

      setSuccessMessage("Продукт успешно создан!");
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchProducts();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setNewProduct((prev) => ({
      ...prev,
      [name]: name === "current_price" ? Number(value) : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setNewProduct((prev) => ({
      ...prev,
      [name]: name === "current_price" ? Number(value) : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className={styles.product_list}>
      <div className={styles.product_list_header}>
        <h3>Продукты</h3>
        <button
          className={styles.create_product}
          onClick={() => setModalIsOpen(true)}
          disabled={loading}
        >
          Добавить продукт
        </button>
      </div>
      {error && (
        <div className={styles.alert_error}>
          {error}
          <button onClick={() => setError(null)} className={styles.alert_close}>
            &times;
          </button>
        </div>
      )}
      {successMessage && (
        <div className={styles.alert_success}>
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            className={styles.alert_close}
          >
            &times;
          </button>
        </div>
      )}
      <ReactModal
        isOpen={modalIsOpen}
        onRequestClose={() => !isSubmitting && setModalIsOpen(false)}
        style={customStyles}
        contentLabel="Добавить новый продукт"
      >
        <h2 className={styles.modal_title}>Добавить новый продукт</h2>
        <form onSubmit={handleSubmit} className={styles.product_form}>
          <div
            className={`${styles.form_group} ${
              formErrors.name ? styles.has_error : ""
            }`}
          >
            <label htmlFor="name">Название</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
            />
            {formErrors.name && (
              <span className={styles.error_text}>{formErrors.name}</span>
            )}
          </div>
          <div
            className={`${styles.form_group} ${
              formErrors.description ? styles.has_error : ""
            }`}
          >
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
            />
          </div>
          <div
            className={`${styles.form_group} ${
              formErrors.current_price ? styles.has_error : ""
            }`}
          >
            <label htmlFor="current_price">Цена</label>
            <input
              type="number"
              id="current_price"
              name="current_price"
              value={newProduct.current_price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
            />
            {formErrors.current_price && (
              <span className={styles.error_text}>
                {formErrors.current_price}
              </span>
            )}
          </div>
          <div className={styles.form_group}>
            <label htmlFor="brand">Бренд</label>
            <select
              id="brand"
              name="brand_id"
              value={newProduct.brand_id || ""}
              onChange={handleSelectChange}
            >
              <option value="">Выберите бренд</option>
              {brands.map((brand) => (
                <option key={brand.brand_id} value={brand.brand_id}>
                  {brand.brand_name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.form_group}>
            <label htmlFor="category">Категория</label>
            <select
              id="category"
              name="category_id"
              value={newProduct.category_id || ""}
              onChange={handleSelectChange}
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.form_group}>
            <label htmlFor="supplier">Поставщик</label>
            <select
              id="supplier"
              name="supplier_id"
              value={newProduct.supplier_id || ""}
              onChange={handleSelectChange}
            >
              <option value="">Выберите поставщика</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.modal_buttons}>
            <button
              type="button"
              onClick={() => setModalIsOpen(false)}
              disabled={isSubmitting}
              className={styles.cancel_button}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submit_button}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span> Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </button>
          </div>
        </form>
      </ReactModal>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {loading ? (
        <div className={styles.loading}>
          <CircularProgress />
        </div>
      ) : (
        <>
          <div>
            <div className={styles.option_names}>
              <button>ID</button>
              <button>Название</button>
              <button>Описание</button>
              <button>Цена</button>
              <button>Бренд</button>
              <button>Категория</button>
              <button>Поставщик</button>
              <button>Действия</button>
            </div>
            {products.map((product) => (
              <ProductItem
                key={product.product_id}
                product={product}
                brands={brands}
                categories={categories}
                suppliers={suppliers}
                onUpdate={updateProduct}
                onDelete={deleteProduct}
                onError={errorProduct}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalProps={totalProducts}
            loading={loading}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}
