import React from "react";
import LabStaffLayout from "../../../components/lab-staff/layout/LabStaffLayout";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const LabStaffDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Lịch hẹn hôm nay",
      value: "24",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      color: "#2563eb",
    },
    {
      title: "Đã hoàn thành",
      value: "18",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: "#10b981",
    },
    {
      title: "Đang chờ",
      value: "6",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "#f59e0b",
    },
    {
      title: "Đã hủy",
      value: "2",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      color: "#ef4444",
    },
  ];

  return (
    <LabStaffLayout>
      <div className="lab-dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Tổng quan</h1>
            <p className="dashboard-subtitle">Chào mừng trở lại!</p>
          </div>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div
                className="stat-icon"
                style={{ background: `${stat.color}15` }}
              >
                <div style={{ color: stat.color }}>{stat.icon}</div>
              </div>
              <div className="stat-content">
                <p className="stat-title">{stat.title}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="quick-actions">
          <h2 className="section-title">Truy cập nhanh</h2>
          <div className="actions-grid">
            <button
              className="action-card"
              onClick={() => navigate("/lab-staff/appointment-schedule")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Quản lý lịch xét nghiệm</span>
            </button>
          </div>
        </div>
      </div>
    </LabStaffLayout>
  );
};

export default LabStaffDashboard;
