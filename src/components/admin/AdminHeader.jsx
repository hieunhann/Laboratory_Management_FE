import React from "react";
// import { useNavigate } from "react-router-dom"; // Tạm thời bỏ
// import { FiLogOut } from "react-icons/fi"; // Tạm thời bỏ
import "./layout/AdminLayout.css";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../../utils/auth";
import { toast } from "react-toastify";
import { setAuthToken } from "../../utils/auth";
import { jwtDecode } from "jwt-decode";

const AdminHeader = ({ pageTitle, breadcrumbs }) => {
  const token = localStorage.getItem("accessToken");
  const navigate = useNavigate();
  const location = useLocation();
  const decode = jwtDecode(token);
  let role =
    decode["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  const handleLogout = async () => {
    setAuthToken(token);
    await logoutUser();
    toast.success("Đăng Xuất Thành Công!");
    navigate("/login");
  };

  // Kiểm tra xem có đang ở trang instruments không
  const isInstrumentsPage = location.pathname.includes("/instruments");

  return (
    <header className="admin-header">
      <div className="admin-breadcrumbs">
        {isInstrumentsPage && (
          <span
            onClick={() => navigate("/appointment-schedule")}
            style={{ cursor: "pointer", color: "#1976d2", fontWeight: "500" }}
          >
            Phòng Xét Nghiệm
          </span>
        )}
        {!isInstrumentsPage &&
          breadcrumbs &&
          breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {crumb.link ? <a href={crumb.link}>{crumb.name}</a> : crumb.name}
              {index < breadcrumbs.length - 1 && " › "}
            </span>
          ))}
      </div>
      <div className="admin-user-profile">
        <span>{role}</span>

        <button
          onClick={handleLogout}
          className="admin-logout-button"
          title="Đăng xuất"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
