import React, { useState, useEffect } from "react";
import { Spin, Tag, Empty, message } from "antd";
import VoucherAPI from "../../apis/VoucherAPI";
import "./VoucherList.css";

export default function VoucherList() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await VoucherAPI.getAllVouchers(1, 100);
      setVouchers(data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã ${code}`);
  };

  const formatCurrency = (val) => {
    if (!val) return "0đ";
    return val.toLocaleString("vi-VN") + "đ";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Không giới hạn";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="voucher-page">
      <div className="voucher-banner">
        <h1 className="voucher-title">Kho Voucher Ưu Đãi</h1>
        <p className="voucher-subtitle">
          Danh sách các mã giảm giá và ưu đãi xét nghiệm dành riêng cho bạn
        </p>
      </div>

      <div className="voucher-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: "#6b7280" }}>Đang tải kho voucher...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div style={{ padding: "60px 0" }}>
            <Empty description="Hiện tại chưa có voucher nào trong kho" />
          </div>
        ) : (
          <div className="voucher-grid">
            {vouchers.map((v) => {
              const expired = isExpired(v.expiryDate);
              const discountText =
                v.discountType === 1 || v.discountType === "Percentage"
                  ? `Giảm ${v.discountValue}%`
                  : `Giảm ${formatCurrency(v.discountValue)}`;

              return (
                <div
                  key={v.voucherId || v.id || v.code}
                  className={`voucher-card ${expired ? "expired" : ""}`}
                >
                  <div className="voucher-left">
                    <div className="voucher-badge-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </div>
                    <div className="voucher-discount-val">{discountText}</div>
                  </div>

                  <div className="voucher-right">
                    <div className="voucher-header-info">
                      <span className="voucher-code">{v.code}</span>
                      {expired ? (
                        <Tag color="red">Hết hạn</Tag>
                      ) : v.isActive === false ? (
                        <Tag color="default">Tạm ngưng</Tag>
                      ) : (
                        <Tag color="green">Có hiệu lực</Tag>
                      )}
                    </div>

                    <div className="voucher-details">
                      {v.minOrderValue > 0 && (
                        <div className="voucher-detail-item">
                          Đơn tối thiểu: <strong>{formatCurrency(v.minOrderValue)}</strong>
                        </div>
                      )}
                      {v.maxDiscountAmount > 0 && (
                        <div className="voucher-detail-item">
                          Giảm tối đa: <strong>{formatCurrency(v.maxDiscountAmount)}</strong>
                        </div>
                      )}
                      <div className="voucher-detail-item expiry">
                        Hạn dùng: {formatDate(v.expiryDate)}
                      </div>
                    </div>

                    <button
                      className="btn-copy-voucher"
                      disabled={expired || v.isActive === false}
                      onClick={() => handleCopyCode(v.code)}
                    >
                      {expired ? "Đã hết hạn" : "Sao chép mã"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
