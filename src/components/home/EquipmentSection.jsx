// src/components/home/EquipmentSection.jsx
import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import "./EquipmentSection.css";
import InstrumentService from "../../services/InstrumentService";
import { setAuthToken } from "../../utils/auth";

export default function EquipmentSection() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      // Thử lấy token nếu có (user đã login) và set vào header
      const token = localStorage.getItem("accessToken");
      if (token) {
        setAuthToken(token);
      }

      // Gọi API ngay cả khi không có token (public endpoint)
      const response = await InstrumentService.list({
        pageSize: 100,
        page: 1,
      });
      const items = response?.data?.data?.items || response?.data?.items || response?.data?.data || response?.items || [];
      setEquipments(items);
    } catch {
      // Nếu có lỗi (401, 403...), không hiển thị dữ liệu
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  };

  const getVisibleEquipments = () => {
    const startIndex = currentIndex;
    const endIndex = startIndex + itemsPerPage;
    return equipments.slice(startIndex, endIndex);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      Math.min(equipments.length - itemsPerPage, prev + 1)
    );
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < equipments.length - itemsPerPage;

  if (loading) {
    return (
      <div className="equipment-section-bg" id="equipments">
        <span className="equipment-badge">Thiết bị y tế</span>
        <h2 className="equipment-title">Thiết bị y tế hiện đại</h2>
        <p className="equipment-desc">
          Trang bị công nghệ tiên tiến giúp chẩn đoán và điều trị chính xác, an
          toàn.
        </p>
        <div className="equipment-cards">
          <div
            style={{ textAlign: "center", width: "100%", padding: "40px 0" }}
          >
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-section-bg" id="equipments">
      <span className="equipment-badge">Thiết bị y tế</span>
      <h2 className="equipment-title">Thiết bị y tế hiện đại</h2>
      <p className="equipment-desc">
        Trang bị công nghệ tiên tiến giúp chẩn đoán và điều trị chính xác, an
        toàn.
      </p>
      <div className="equipment-carousel-container">
        {equipments.length > itemsPerPage && (
          <button
            className={`equipment-nav-btn equipment-nav-btn-left ${
              !canGoPrevious ? "disabled" : ""
            }`}
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            aria-label="Thiết bị trước"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="equipment-cards">
          {equipments.length === 0 ? (
            <p style={{ textAlign: "center", width: "100%", color: "#6b7280" }}>
              Chưa có thiết bị nào.
            </p>
          ) : (
            getVisibleEquipments().map((item, index) => {
              const itemCode = item.code || item.instrumentCode;
              
              const getHardcodedImage = (code, idx) => {
                switch (code) {
                  case "ALINITY_CI":
                    return "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop"; // Lab machine
                  case "ARCHITECTI2000":
                    return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=600&auto=format&fit=crop"; // Modern equipment
                  case "BC6800":
                    return "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=600&auto=format&fit=crop"; // Blood test tubes
                  default: {
                    // Array of beautiful generic medical/lab equipments for fallback
                    const fallbacks = [
                      "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=600&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1631815587646-b85a1bb02246?q=80&w=600&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1579165466991-467135ad3110?q=80&w=600&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1579154204467-3316cc810f63?q=80&w=600&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=600&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?q=80&w=600&auto=format&fit=crop"
                    ];
                    // Cycle through fallbacks using the item's index
                    return fallbacks[idx % fallbacks.length];
                  }
                }
              };

              // Get image URL - ưu tiên imageUrl đã được build từ InstrumentService
              // Nếu không có, fallback về ảnh cứng đẹp mắt
              const imageUrl = item.imageUrl || item.imageData || getHardcodedImage(itemCode, index);

              return (
                <div className="equipment-card" key={item.code || item.id}>
                  <div className="equipment-img-bg">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="equipment-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          // Hiển thị placeholder khi ảnh lỗi
                          const placeholder =
                            e.target.parentElement.querySelector(
                              ".equipment-img-placeholder"
                            );
                          if (placeholder) {
                            placeholder.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="equipment-img-placeholder"
                      style={{ display: imageUrl ? "none" : "flex" }}
                    >
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                          stroke="#cbd5e0"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" fill="#cbd5e0" />
                        <path
                          d="M21 15l-5-5L5 21"
                          stroke="#cbd5e0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        style={{
                          marginTop: "8px",
                          color: "#9ca3af",
                          fontSize: "0.875rem",
                        }}
                      >
                        Không có ảnh
                      </span>
                    </div>
                  </div>
                  <div className="equipment-info">
                    <h3 className="equipment-name">{item.name}</h3>
                    <div className="equipment-code-wrapper">
                      <span className="equipment-code-label">Mã thiết bị:</span>
                      <span className="equipment-code-value">
                        {item.code || item.instrumentCode}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {equipments.length > itemsPerPage && (
          <button
            className={`equipment-nav-btn equipment-nav-btn-right ${
              !canGoNext ? "disabled" : ""
            }`}
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Thiết bị tiếp theo"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
