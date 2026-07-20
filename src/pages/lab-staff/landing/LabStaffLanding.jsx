import React from "react";
import { useNavigate } from "react-router-dom";
import "./LabStaffLanding.css";

const LabStaffLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="lab-staff-landing">
      <div className="lab-staff-landing-content">
        <div className="lab-staff-landing-logo">
          <div className="lab-staff-landing-icon">🔬</div>
          <h1>HemaLink Lab Staff</h1>
        </div>

        <p className="lab-staff-landing-subtitle">
          Hệ thống quản lý lịch xét nghiệm cho nhân viên phòng Lab
        </p>

        <div className="lab-staff-landing-features">
          <div className="lab-staff-landing-feature">
            <div className="feature-icon">📅</div>
            <h3>Quản lý lịch hẹn</h3>
            <p>Xem và cập nhật lịch xét nghiệm của bệnh nhân</p>
          </div>

          <div className="lab-staff-landing-feature">
            <div className="feature-icon">✏️</div>
            <h3>Chỉnh sửa trạng thái</h3>
            <p>Cập nhật trạng thái và đổi giờ hẹn dễ dàng</p>
          </div>

          <div className="lab-staff-landing-feature">
            <div className="feature-icon">📊</div>
            <h3>Thống kê chi tiết</h3>
            <p>Xem báo cáo và thống kê theo ngày</p>
          </div>
        </div>

        <div className="lab-staff-landing-actions">
          <button
            className="lab-staff-landing-btn primary"
            onClick={() => navigate("/lab-staff/dashboard")}
          >
            Truy cập Dashboard
          </button>

          <button
            className="lab-staff-landing-btn secondary"
            onClick={() => navigate("/")}
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabStaffLanding;
