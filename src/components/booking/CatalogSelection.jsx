import React, { useEffect, useState } from "react";
import "./PackageSelection.css";
import api from "../../configs/axios";
import { setAuthToken } from "../../utils/auth";

const endPoint = "testorder/api/test-catalogs?page=1&pageSize=20";

function CatalogSelection({ setPackageMode, onContinue }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [catalog, setCatalog] = useState([]);

  const normalizeCatalog = (data) => {
    if (!data || !Array.isArray(data.catalogDTOs)) return [];

    return data.catalogDTOs.map((it) => ({
      catalogId: String(it.id),
      testName: it.catalogName,
      price: Number(it.price) || 0,
      description: it.description,
      _raw: it,
    }));
  };

  useEffect(() => {
    const fetchAPI = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) setAuthToken(token);
        const response = await api.get(endPoint);
        const data = response.data;
        console.log("data" + data);
        if (response.status >= 200 && response.status < 300) {
          setCatalog(normalizeCatalog(data));
        }
      } catch (error) {
        console.log(error);
        setCatalog([]);
      }
    };
    fetchAPI();
  }, []);

  const toggle = (id) => {
    const key = String(id);
    const next = new Set(selectedIds);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedIds(next);
  };

  const parsePrice = (price = 0) =>
    (Number(price) || 0).toLocaleString("vi-VN") + "₫";

  const normalized = Array.isArray(catalog) ? catalog : [];

  const total = Array.from(selectedIds).reduce((sum, catalogId) => {
    const item = normalized.find((c) => c.catalogId === String(catalogId));
    return sum + (item ? Number(item.price) : 0);
  }, 0);

  const selectedItemsArray = Array.from(selectedIds)
    .map((id) => {
      const item = normalized.find((c) => c.catalogId === String(id));
      return item
        ? {
            catalogId: item.catalogId,
            testName: item.testName,
            price: item.price,
            description: item.description,
          }
        : null;
    })
    .filter(Boolean);

  return (
    <div className="package-selection">
      {/* Header: nút quay về Chọn gói có sẵn (không reload trang) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn-primary-1"
            onClick={() => setPackageMode && setPackageMode("preset")}
          >
            Chọn gói có sẵn
          </button>
          <button className="btn-secondary active">Tùy chỉnh xét nghiệm</button>
        </div>
      </div>

      <div className="packages-grid" style={{ marginTop: 8 }}>
        {normalized.map((item) => (
          <div
            key={item.catalogId}
            className="package-card"
            style={{ minHeight: 110, padding: 14 }}
          >
            <label
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(String(item.catalogId))}
                onChange={() => toggle(item.catalogId)}
                style={{ marginTop: 6 }}
              />
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                    {item.testName}
                  </div>
                  <div style={{ color: "#3b82f6", fontWeight: 800 }}>
                    {parsePrice(item.price)}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  {item.description}
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Summary bên dưới */}
      <div className="selection-summary" style={{ justifyContent: "flex-end" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ color: "#6b7280" }}>{selectedIds.size} xét nghiệm</div>
          <div style={{ fontWeight: 800, color: "#3b82f6" }}>
            {total.toLocaleString()}₫
          </div>
          <button
            className="summary-continue"
            onClick={() => {
              onContinue &&
                onContinue({
                  source: "catalog",
                  items: selectedItemsArray,
                  total,
                });
            }}
            disabled={selectedIds.size === 0}
          >
            Tiếp tục ({selectedIds.size} xét nghiệm)
          </button>
        </div>
      </div>
    </div>
  );
}

export default CatalogSelection;
