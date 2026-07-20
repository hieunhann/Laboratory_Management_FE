import React from "react";
import AdminLayout from "../../../components/admin/layout/AdminLayout"; // Sửa lại đường dẫn
import { Card, Col, Row, Statistic, Progress, Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import "./DashboardPage.css";

// Dữ liệu giả lập, sau này bạn sẽ thay bằng API
const dashboardData = {
  orders: {
    today: 47,
    completed: 32,
    pending: 12,
    reviewed: 3,
  },
  instruments: [
    { name: "Hematology Analyzer", status: "Ready" },
    { name: "Chemistry Analyzer", status: "Maintenance" },
    { name: "Immunoassay System", status: "Ready" },
    { name: "Coagulation Analyzer", status: "Error" },
    { name: "Urinalysis System", status: "Inactive" },
    { name: "Blood Gas Analyzer", status: "Ready" },
  ],
};

const getInstrumentStatusTag = (status) => {
  switch (status) {
    case "Ready":
      return <Tag color="success">Ready</Tag>;
    case "Maintenance":
      return <Tag color="warning">Maintenance</Tag>;
    case "Error":
      return <Tag color="error">Error</Tag>;
    case "Inactive":
      return <Tag color="default">Inactive</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const DashboardPage = () => {
  const breadcrumbs = [
    { name: "Laboratory", link: "#" },
    { name: "Dashboard" },
  ];

  const { orders, instruments } = dashboardData;
  const totalOrders = orders.completed + orders.pending + orders.reviewed;

  return (
    <AdminLayout pageTitle="Dashboard" breadcrumbs={breadcrumbs}>
      {/* Thống kê tổng quan */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Today's Orders" value={orders.today} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Completed" value={orders.completed} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Pending" value={orders.pending} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Reviewed" value={orders.reviewed} />
          </Card>
        </Col>
      </Row>

      {/* Trạng thái thiết bị và phân bổ đơn hàng */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Instruments Status */}
        <Col xs={24} lg={12}>
          <Card title="Instruments Status" className="instrument-status-card">
            {instruments.map((instrument, index) => (
              <div className="instrument-status-item" key={index}>
                <span>{instrument.name}</span>
                {getInstrumentStatusTag(instrument.status)}
              </div>
            ))}
          </Card>
        </Col>

        {/* Order Status Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Order Status Distribution">
            <div className="order-distribution-chart">
              <Progress
                type="circle"
                percent={100}
                format={() => `${totalOrders}\nTotal`}
                width={150}
                strokeWidth={10}
              />
            </div>
            <div className="order-distribution-legend">
              <div className="legend-item">
                <span className="legend-dot completed"></span>
                <span>Completed</span>
                <span>{orders.completed}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot pending"></span>
                <span>Pending</span>
                <span>{orders.pending}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot reviewed"></span>
                <span>Reviewed</span>
                <span>{orders.reviewed}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
};

export default DashboardPage;
