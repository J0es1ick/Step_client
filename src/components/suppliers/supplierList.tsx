import React from "react";
import styles from "./supplierList.module.css";
import { Alert, CircularProgress } from "@mui/material";
import SupplierItem from "./supplierItem";
import Pagination from "../UI/pagination/pagination";
import { Product } from "../products/productList";

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  email: string;
  phone: string;
  products?: Product[];
}

const getSuppliers = async (
  page: number = 1,
  limit: number = 8
): Promise<{ data: Supplier[]; total: number }> => {
  try {
    const response = await fetch(`api/suppliers?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return await response.json();
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    throw err;
  }
};

export default function SupplierList() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalSuppliers, setTotalSuppliers] = React.useState(0);
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

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, total } = await getSuppliers(page);
      setSuppliers(data);
      setTotalSuppliers(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadSuppliers = async () => {
      await fetchSuppliers();
    };

    if (isMounted) {
      loadSuppliers();
    }

    return () => {
      isMounted = false;
    };
  }, [page]);

  const createSupplier = async () => {
    setSuppliers([
      ...suppliers,
      { supplier_id: 0, supplier_name: "", email: "", phone: "" },
    ]);
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    if (updatedSupplier.supplier_id === 0) {
      setSuppliers((prev) =>
        prev.map((b) => (b.supplier_id === 0 ? updatedSupplier : b))
      );
    } else {
      setSuppliers((prev) =>
        prev.map((b) =>
          b.supplier_id === updatedSupplier.supplier_id ? updatedSupplier : b
        )
      );
    }
    fetchSuppliers();
  };

  const deleteSupplier = async (supplierId: number) => {
    try {
      setSuppliers((prev) => prev.filter((b) => b.supplier_id !== supplierId));
      if (suppliers.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchSuppliers();
      }
    } catch (err) {
      setError("Failed to delete supplier");
    }
  };

  const errorSupplier = async (errorMsg: string) => {
    setError(errorMsg);
    fetchSuppliers();
  };

  return (
    <div className={styles.supplier_list}>
      <div className={styles.supplier_list_header}>
        <h3>Поставщики</h3>
        <button
          className={styles.create_supplier}
          onClick={createSupplier}
          disabled={loading}
        >
          Добавить поставщика
        </button>
      </div>
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
            {suppliers.map((supplier) => (
              <SupplierItem
                key={supplier.supplier_id}
                supplier={supplier}
                onUpdate={updateSupplier}
                onDelete={deleteSupplier}
                onError={errorSupplier}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalProps={totalSuppliers}
            loading={loading}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}
