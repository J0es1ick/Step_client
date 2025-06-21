import React from "react";
import { Product, ProductUpdate } from "./productList";
import styles from "./productItem.module.css";

interface IProps {
  product: Product;
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

  const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandId(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryId(e.target.value);
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupplierId(e.target.value);
  };

  return (
    <div className={styles.product_item}>
      <div>
        <label htmlFor="product_name">Название: </label>
        <input
          type="text"
          id="product_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.product_textarea}
        />
      </div>
      <div>
        <label htmlFor="product_description">Описание: </label>
        <input
          type="text"
          id="product_description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.product_textarea_description}
        />
      </div>
      <div>
        <label htmlFor="product_price">Цена: </label>
        <input
          type="number"
          id="product_price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={styles.product_textarea}
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label htmlFor="product_brand">Бренд ID: </label>
        <input
          type="number"
          id="product_brand"
          value={brandId || ""}
          onChange={handleBrandChange}
          className={styles.product_textarea}
          min="1"
        />
      </div>
      <div>
        <label htmlFor="product_category">Категория ID: </label>
        <input
          type="number"
          id="product_category"
          value={categoryId || ""}
          onChange={handleCategoryChange}
          className={styles.product_textarea}
          min="1"
        />
      </div>
      <div>
        <label htmlFor="product_supplier">Поставщик ID: </label>
        <input
          type="number"
          id="product_supplier"
          value={supplierId || ""}
          onChange={handleSupplierChange}
          className={styles.product_textarea}
          min="1"
        />
      </div>
      {product.sizes && product.sizes.length > 0 ? (
        <div className={styles.sizes}>
          <h4>Размеры:</h4>
          <ul>
            {product.sizes.map((size) => (
              <li>
                Размер: {size.size} (ID: {size.product_id})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.noSizes}>Нет доступных размеров</p>
      )}
      <div className={styles.product_buttons}>
        <button className={styles.product_button} onClick={handleSubmit}>
          Сохранить
        </button>
        <button className={styles.product_button} onClick={handleDelete}>
          Удалить
        </button>
      </div>
    </div>
  );
}
