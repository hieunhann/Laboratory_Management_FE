// src/components/home/HeroSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./HeroSection.css";

export default function HeroSection() {
  return (
    <div className="hero-section-bg">
      <div className="hero-section-content">
        <div className="hero-section-left">
          <span className="hero-badge">Phòng khám hiện đại</span>
          <h1 className="hero-title">
            Kết nối bệnh nhân
            <br />
            và chẩn đoán
          </h1>
          <p className="hero-desc">
            Phòng khám hiện đại, kết nối chẩn đoán và điều trị, mang đến dịch vụ
            y tế chất lượng và đáng tin cậy. Hệ thống hiện đại, kết quả chính
            xác và kịp thời.
          </p>
          <div className="hero-btns">
            <Link to="/booking" className="hero-btn-primary">
              Đặt lịch xét nghiệm
            </Link>
            <button className="hero-btn-outline">Tìm hiểu thêm</button>
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-number">10K+</div>
              <div className="stat-label">Bệnh nhân</div>
            </div>
            <div>
              <div className="stat-number">15+</div>
              <div className="stat-label">Bác sĩ</div>
            </div>
            <div>
              <div className="stat-number">98%</div>
              <div className="stat-label">Hài lòng</div>
            </div>
          </div>
        </div>
        <div className="hero-section-right">
          <div className="hero-img-bg">
            <img
              src="https://st2.depositphotos.com/1194063/6742/i/950/depositphotos_67429539-stock-photo-scientist-looking-through-a-microscope.jpg"
              alt="Phòng xét nghiệm"
              className="hero-img"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
