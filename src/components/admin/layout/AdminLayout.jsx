import React from "react";
import Sidebar from "../Sidebar.jsx"; // Sửa lại: đi lùi một cấp (../)
import AdminHeader from "../AdminHeader.jsx"; // Giữ nguyên vì cùng thư mục layout
import "./AdminLayout.css";

const AdminLayout = ({ children, pageTitle, breadcrumbs }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main-content">
        <AdminHeader pageTitle={pageTitle} breadcrumbs={breadcrumbs} />
        <main className="admin-page-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
