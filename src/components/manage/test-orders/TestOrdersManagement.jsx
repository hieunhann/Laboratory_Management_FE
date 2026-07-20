import React from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import "./TestOrdersManagement.css";

const TestOrdersManagement = () => {
  const breadcrumbs = [
    { name: "Laboratory", link: "#" },
    { name: "Test Orders Management" },
  ];

  return (
    <AdminLayout pageTitle="Test Orders Management" breadcrumbs={breadcrumbs}>
      <div className="test-orders-management-content">
        <p>Test Orders Management - Coming soon</p>
      </div>
    </AdminLayout>
  );
};

export default TestOrdersManagement;
