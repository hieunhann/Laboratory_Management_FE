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
            getVisibleEquipments().map((item) => {
              const itemCode = item.code || item.instrumentCode;
              const realIndex = equipments.findIndex(e => (e.code || e.id) === (item.code || item.id));
              
              const getHardcodedImage = (code, idx) => {
                // Những hình ảnh đã được xác minh là load thành công 100% trên giao diện hiện tại
                const safeImg1 = "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop"; 
                const safeImg2 = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=600&auto=format&fit=crop"; 
                const safeImg3 = "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=600&auto=format&fit=crop"; // Bàn tay tím
                const safeImg4 = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop"; // Sảnh bệnh viện
                const safeImg5 = "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?q=80&w=600&auto=format&fit=crop"; // Kính hiển vi (ổn định)

                switch (code) {
                  case "CFX96": return safeImg1;
                  case "ALINITY_CI": return safeImg1;
                  case "ARCHITECTI2000": return safeImg2;
                  case "ISE900": return safeImg2;
                  case "BC6800": return safeImg3;
                  case "MAGNA_PURE": return safeImg3;
                  case "COBAS_PURE": return safeImg4;
                  case "VITROS5600": return safeImg5;
                  default: {
                    const fallbacks = [safeImg1, safeImg2, safeImg3, safeImg4, safeImg5];
                    return fallbacks[idx % fallbacks.length];
                  }
                }
              };

              // Ép dùng ảnh từ thư viện chuẩn cứng để mọi thiết bị đều có 1 ảnh cố định, đẹp mắt, không lỗi.
              const imageUrl = getHardcodedImage(itemCode, realIndex);

              return (
                <div className="equipment-card" key={item.code || item.id}>
                  <div className="equipment-img-bg">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="equipment-img"
                      onError={(e) => {
                        // Tránh lặp vô hạn nếu ảnh cứng cũng lỗi
                        if (e.target.src !== getHardcodedImage(itemCode, realIndex)) {
                          e.target.onerror = null;
                          e.target.src = getHardcodedImage(itemCode, realIndex);
                        }
                      }}
                    />
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
