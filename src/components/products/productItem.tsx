import React from "react";
import { Product, ProductUpdate } from "./productList";
import styles from "./productItem.module.css";
import { Brand } from "../brands/brandList";
import { Category } from "../categories/categoryList";
import { Supplier } from "../suppliers/supplierList";

interface IProps {
  product: Product;
  brands: Brand[];
  categories: Category[];
  suppliers: Supplier[];
  onUpdate?: (updatedProduct: Product) => void;
  onDelete?: (productId: number) => void;
  onError?: (error: string) => void;
}

const updateProduct = async (product: ProductUpdate): Promise<Product> => {
  const method = product.product_id !== 0 ? "PATCH" : "POST";
  const url =
    product.product_id !== 0
      ? `api/products/${product.product_id}`
      : "api/products";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: product.name,
      description: product.description,
      current_price: product.current_price,
      brand_id: product.brand_id,
      category_id: product.category_id,
      supplier_id: product.supplier_id,
    }),
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export default function ProductItem({
  product,
  brands,
  categories,
  suppliers,
  onUpdate,
  onDelete,
  onError,
}: IProps) {
  const [name, setName] = React.useState<string>(product.name);
  const [description, setDescription] = React.useState<string>(
    product.description
  );
  const [price, setPrice] = React.useState(product.current_price.toString());
  const [brandId, setBrandId] = React.useState(
    product.brand?.brand_id?.toString() || ""
  );
  const [categoryId, setCategoryId] = React.useState(
    product.category?.category_id?.toString() || ""
  );
  const [supplierId, setSupplierId] = React.useState(
    product.supplier?.supplier_id?.toString() || ""
  );
  const [showSizes, setShowSizes] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const updatedProduct = await updateProduct({
        ...product,
        name,
        description,
        current_price: parseFloat(price),
        brand_id: brandId ? parseInt(brandId) : null,
        category_id: categoryId ? parseInt(categoryId) : null,
        supplier_id: supplierId ? parseInt(supplierId) : null,
      });
      onUpdate?.(updatedProduct);
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      onError?.(error instanceof Error ? error.message : "Неизвестная ошибка");
    }
  };

  const handleDelete = async () => {
    if (!product.product_id || !onDelete) return;

    if (!window.confirm("Вы уверены, что хотите удалить этот продукт?")) return;

    try {
      const response = await fetch(`/api/products/${product.product_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении");
      }

      onDelete(product.product_id);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Ошибка при удалении");
    }
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrandId(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSupplierId(e.target.value);
  };

  return (
    <div className={styles.product}>
      <div className={styles.product_item}>
        <h1>{product.product_id}</h1>
        <input
          type="text"
          id="product_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.product_textarea}
        />
        <textarea
          id="product_description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.product_textarea_description}
        />
        <input
          type="number"
          id="product_price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={styles.product_textarea}
          min="0"
          step="0.01"
        />
        <select
          id="brand"
          value={brandId}
          onChange={handleBrandChange}
          className={styles.product_select}
        >
          <option value="">Выберите бренд</option>
          {brands.map((brand) => (
            <option key={brand.brand_id} value={brand.brand_id}>
              {brand.brand_name}
            </option>
          ))}
        </select>
        <select
          id="category"
          value={categoryId}
          onChange={handleCategoryChange}
          className={styles.product_select}
        >
          <option value="">Выберите категорию</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_name}
            </option>
          ))}
        </select>
        <select
          id="supplier"
          value={supplierId}
          onChange={handleSupplierChange}
          className={styles.product_select}
        >
          <option value="">Выберите поставщика</option>
          {suppliers.map((supplier) => (
            <option key={supplier.supplier_id} value={supplier.supplier_id}>
              {supplier.supplier_name}
            </option>
          ))}
        </select>
        <div className={styles.product_buttons}>
          <button className={styles.product_button_save} onClick={handleSubmit}>
            Сохранить
          </button>
          <button
            className={styles.product_button_delete}
            onClick={handleDelete}
          >
            Удалить
          </button>
        </div>
      </div>
      <div className={styles.sizes_container}>
        <button
          onClick={() => setShowSizes(!showSizes)}
          className={styles.sizes_toggle}
        >
          Размеры ({product.sizes?.length || 0})
        </button>

        {showSizes && (
          <div className={styles.sizes_popup}>
            <div className={styles.sizes_header}>
              <h4>Доступные размеры</h4>
              <button
                onClick={() => setShowSizes(false)}
                className={styles.sizes_cancel}
              >
                ×
              </button>
            </div>

            <div className={styles.sizes_list}>
              {product.sizes?.map((size) => (
                <div key={size.product_id} className={styles.size_item}>
                  <span>{size.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
