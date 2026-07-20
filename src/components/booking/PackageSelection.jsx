import React, { useEffect, useState, useRef } from "react";
import "./PackageSelection.css";
import api from "../../configs/axios";
import { setAuthToken } from "../../utils/auth";

const EndPoint = "testorder/api/CatalogBundle";

function PackageSelection({
  selectedPackage,
  onPackageSelect,
  onContinue,
  setPackageMode,
  mode,
}) {
  const [packages, setPackages] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});
  const loading = useRef(true);

  useEffect(() => {
    if (loading.current) {
      const fetchAPI = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          if (token) setAuthToken(token);
          const response = await api.get(EndPoint);
          if (response.status >= 200 && response.status < 300) {
            setPackages(response.data || []);
          }
        } catch (error) {
          console.log(error);
          setPackages([]);
        }
      };
      fetchAPI();
      loading.current = false;
    }
  }, [loading]);
  // helper chuyển "1.200.000₫" -> 1200000 (number)
  const PasePrice = (price) => price.toLocaleString("Vi-VN") + "đ" || 0;

  // Select Gói
  const selectedPkg =
    packages.find((p) => p.bundleId === selectedPackage) || null;
  const testsCount = selectedPkg
    ? selectedPkg.catalogs
      ? selectedPkg.catalogs.length
      : 0
    : 0;

  // Tổng tiền: dùng trực tiếp giá của gói (nếu có), fallback parse từ chuỗi
  const totalPriceNumber = selectedPkg
    ? typeof selectedPkg.price === "number"
      ? selectedPkg.price
      : parseInt(String(selectedPkg.price).replace(/[^\d]/g, "")) || 0
    : 0;

  const formattedTotal = totalPriceNumber
    ? totalPriceNumber.toLocaleString("vi-VN") + "₫"
    : "0₫";

  // Chuẩn hóa object truyền sang AcceptInfo
  const acceptPackageObj = selectedPkg
    ? {
        bundleId: selectedPkg.bundleId,
        title: selectedPkg.bundleName || selectedPkg.title,
        includes: selectedPkg.catalogs || [],
        price: selectedPkg.price,
        description: selectedPkg.description,
        total: totalPriceNumber,
      }
    : null;

  return (
    <div className="package-selection">
      {/* Header: nút chuyển chế độ giống CatalogSelection */}
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
            className={`btn-primary-1 ${mode === "preset" ? "active" : ""}`}
            onClick={() => setPackageMode && setPackageMode("preset")}
            type="button"
          >
            Chọn gói có sẵn
          </button>
          <button
            className={`btn-secondary ${mode === "custom" ? "active" : ""}`}
            onClick={() => setPackageMode && setPackageMode("custom")}
            type="button"
          >
            Tùy chỉnh xét nghiệm
          </button>
        </div>
      </div>

      <div className="packages-grid">
        {packages.map((pkg) => {
          const catalogsList = pkg.catalogs || [];
          const isExpanded = expandedCards[pkg.bundleId];
          const shouldShowToggle = catalogsList.length > 5;
          const displayedCatalogs =
            isExpanded || !shouldShowToggle
              ? catalogsList
              : catalogsList.slice(0, 5);

          return (
            <div
              key={pkg.bundleId}
              className={`package-card ${
                selectedPackage === pkg.bundleId ? "selected" : ""
              }`}
              onClick={() => onPackageSelect(pkg.bundleId)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter") onPackageSelect(pkg.bundleId);
              }}
            >
              {pkg.isPopular && <div className="popular-badge">Phổ biến</div>}

              <div className="package-header">
                <strong>
                  <h3 className="package-title">{pkg.bundleName}</h3>
                </strong>
                <p className="package-description">{pkg.description}</p>
                <div className="package-price">
                  <span className="price-amount">{PasePrice(pkg.price)}</span>
                </div>
              </div>

              <div className="package-includes">
                <h4 className="includes-title">Bao gồm:</h4>
                <ul className="includes-list">
                  {displayedCatalogs.map((itemId, index) => {
                    return (
                      <li key={index} className="includes-item">
                        <svg
                          className="check-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M13.5 4.5L6 12L2.5 8.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{itemId.description}</span>
                      </li>
                    );
                  })}
                </ul>
                {shouldShowToggle && (
                  <button
                    className="toggle-more-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCards((prev) => ({
                        ...prev,
                        [pkg.bundleId]: !prev[pkg.bundleId],
                      }));
                    }}
                  >
                    {isExpanded
                      ? "Thu gọn"
                      : `Xem thêm (${catalogsList.length - 5})`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary bar below packages (giống ảnh) */}
      <div className="selection-summary">
        <div className="summary-left">
          <div className="summary-title">Gói đã chọn</div>
          <div className="summary-sub">
            {selectedPkg ? selectedPkg.title : "Chưa chọn gói"}
          </div>
        </div>

        <div className="summary-right">
          <div className="summary-price">{formattedTotal}</div>
          <button
            className="summary-continue"
            onClick={() =>
              onContinue &&
              onContinue({
                source: "package",
                package: acceptPackageObj,
                total: totalPriceNumber,
              })
            }
            disabled={!selectedPkg}
          >
            Tiếp tục {selectedPkg && `(${testsCount} xét nghiệm)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PackageSelection;
