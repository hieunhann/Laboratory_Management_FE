import React from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import "./ReportsManagement.css";

const ReportsManagement = () => {
  const breadcrumbs = [
    { name: "Laboratory", link: "#" },
    { name: "Reports Management" },
  ];

  return (
    <AdminLayout pageTitle="Reports Management" breadcrumbs={breadcrumbs}>
      <div className="reports-management-content">
        <p>Reports Management - Coming soon</p>
      </div>
    </AdminLayout>
  );
};

export default ReportsManagement;
