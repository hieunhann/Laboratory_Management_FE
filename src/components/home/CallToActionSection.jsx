// src/components/home/CallToActionSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./CallToActionSection.css";

export default function CallToActionSection() {
  return (
    <div className="cta-section-bg">
      <div className="cta-section-content">
        <div className="cta-left">
          <h2 className="cta-title">Sẵn sàng bắt đầu chăm sóc sức khỏe?</h2>
          <p className="cta-desc">
            Đặt lịch xét nghiệm ngay hôm nay và nhận kết quả nhanh chóng, chính
            xác từ đội ngũ chuyên gia của chúng tôi.
          </p>
          <div className="cta-btns">
            <Link to="/booking" className="cta-btn-primary">
              Đặt lịch ngay
              <svg
                className="cta-btn-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3ZM3 1H13C14.1046 1 15 1.89543 15 3V13C15 14.1046 14.1046 15 13 15H3C1.89543 15 1 14.1046 1 13V3C1 1.89543 1.89543 1 3 1Z"
                  fill="currentColor"
                />
                <path
                  d="M4 0C4.55228 0 5 0.447715 5 1V3C5 3.55228 4.55228 4 4 4C3.44772 4 3 3.55228 3 3V1C3 0.447715 3.44772 0 4 0Z"
                  fill="currentColor"
                />
                <path
                  d="M12 0C12.5523 0 13 0.447715 13 1V3C13 3.55228 12.5523 4 12 4C11.4477 4 11 3.55228 11 3V1C11 0.447715 11.4477 0 12 0Z"
                  fill="currentColor"
                />
                <path d="M2 6H14V7H2V6Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="cta-right">
          <div className="cta-grid">
            <div className="cta-card">
              <div className="cta-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 6V12L16 14"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="cta-card-title">24h</div>
                <div className="cta-card-desc">Kết quả nhanh</div>
              </div>
            </div>
            <div className="cta-card">
              <div className="cta-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L3 7L12 12L21 7L12 2Z"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 17L12 22L21 17"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 12L12 17L21 12"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="cta-card-title">100%</div>
                <div className="cta-card-desc">An toàn</div>
              </div>
            </div>
            <div className="cta-card">
              <div className="cta-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="cta-card-title">4.9/5</div>
                <div className="cta-card-desc">Đánh giá</div>
              </div>
            </div>
            <div className="cta-card">
              <div className="cta-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61Z"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="cta-card-title">10K+</div>
                <div className="cta-card-desc">Bệnh nhân</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
