import React from "react";
import { Spin } from "antd";
import "./LoadingOverlay.css";

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <Spin size="large" />
        <p className="loading-text">Đang tải...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
