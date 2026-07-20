import React, { useEffect, useState } from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import { Card, Spin } from "antd";
import {
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiCalendar,
  FiBook,
  FiAlertTriangle,
} from "react-icons/fi";
import { IAMServiceAPI } from "../../../apis/IAMServiceAPI";
import { StatisticsAPI } from "../../../apis/StatisticsAPI";
import { setAuthToken } from "../../../utils/auth";
import "./DashboardManagement.css";

const DashboardManagement = () => {
  const breadcrumbs = [
    { name: "Laboratory", link: "#" },
    { name: "Tổng quan" },
  ];

  // Statistics state
  const [usersStats, setUsersStats] = useState(null);
  const [catalogsStats, setCatalogsStats] = useState(null);
  const [bookingsStats, setBookingsStats] = useState(null);
  const [blogsStats, setBlogsStats] = useState(null);
  const [instrumentsStats, setInstrumentsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // Weekly new users data - will be updated when API provides daily statistics
  // eslint-disable-next-line no-unused-vars
  const [weeklyNewUsers, setWeeklyNewUsers] = useState([
    { day: "T2", value: 0 },
    { day: "T3", value: 0 },
    { day: "T4", value: 0 },
    { day: "T5", value: 0 },
    { day: "T6", value: 0 },
    { day: "T7", value: 0 },
    { day: "CN", value: 0 },
  ]);
  // Monthly revenue data - 6 months
  // eslint-disable-next-line no-unused-vars
  const [monthlyRevenue, setMonthlyRevenue] = useState([
    { month: "T7", value: 0 },
    { month: "T8", value: 0 },
    { month: "T9", value: 0 },
    { month: "T10", value: 0 },
    { month: "T11", value: 0 },
    { month: "T12", value: 0 },
  ]);
  // Monthly bookings data
  // eslint-disable-next-line no-unused-vars
  const [monthlyBookings, setMonthlyBookings] = useState([
    { month: "T7", value: 0 },
    { month: "T8", value: 0 },
    { month: "T9", value: 0 },
    { month: "T10", value: 0 },
    { month: "T11", value: 0 },
    { month: "T12", value: 0 },
  ]);

  // Fetch all statistics
  useEffect(() => {
    const fetchAllStatistics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (token) setAuthToken(token);

        // Fetch all statistics concurrently
        const [usersRes, catalogsRes, bookingsRes, blogsRes, instrumentsRes] =
          await Promise.all([
            IAMServiceAPI.GetUsersStatistics(),
            StatisticsAPI.getCatalogsStatistics(),
            StatisticsAPI.getBookingsStatistics(),
            StatisticsAPI.getBlogsStatistics(),
            StatisticsAPI.getInstrumentsStatistics(),
          ]);

        // Handle different response structures
        if (usersRes?.data) {
          // Check if response has nested data structure
          const usersData = usersRes.data.data || usersRes.data;
          if (usersData && typeof usersData === "object") {
            setUsersStats(usersData);
          }
        }
        if (catalogsRes?.data) {
          const catalogsData = catalogsRes.data.data || catalogsRes.data;
          if (catalogsData && typeof catalogsData === "object") {
            setCatalogsStats(catalogsData);
          }
        }
        if (bookingsRes?.data) {
          const bookingsData = bookingsRes.data.data || bookingsRes.data;
          if (bookingsData && typeof bookingsData === "object") {
            setBookingsStats(bookingsData);
            // TODO: Update monthlyRevenue and monthlyBookings when API provides this data
          }
        }
        if (blogsRes?.data) {
          const blogsData = blogsRes.data.data || blogsRes.data;
          if (blogsData && typeof blogsData === "object") {
            setBlogsStats(blogsData);
          }
        }
        if (instrumentsRes?.data) {
          const instrumentsData =
            instrumentsRes.data.data || instrumentsRes.data;
          if (instrumentsData && typeof instrumentsData === "object") {
            setInstrumentsStats(instrumentsData);
          }
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStatistics();
  }, []);

  const maxNewUsers = Math.max(...weeklyNewUsers.map((u) => u.value), 1);
  const maxRevenue = Math.max(...monthlyRevenue.map((r) => r.value), 1);
  const maxBookings = Math.max(...monthlyBookings.map((b) => b.value), 1);

  // Calculate revenue percentage
  const revenuePercentage =
    bookingsStats?.totalRevenueThisYear > 0
      ? (
          (bookingsStats.totalRevenueThisMonth /
            bookingsStats.totalRevenueThisYear) *
          100
        ).toFixed(1)
      : 0;

  // Calculate bookings percentage
  const bookingsPercentage =
    bookingsStats?.totalBookingsThisYear > 0
      ? (
          (bookingsStats.totalBookingsThisMonth /
            bookingsStats.totalBookingsThisYear) *
          100
        ).toFixed(1)
      : 0;

  if (loading) {
    return (
      <AdminLayout pageTitle="Tổng quan" breadcrumbs={breadcrumbs}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Spin size="large" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Tổng quan" breadcrumbs={breadcrumbs}>
      <div className="dashboard-management-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Tổng quan</h1>
          <p className="dashboard-subtitle">
            Theo dõi hoạt động và hiệu suất của trung tâm xét nghiệm
          </p>
        </div>

        {/* KPI Cards Section */}
        <div className="dashboard-kpi-cards">
          {/* Customer Statistics Card */}
          {usersStats && (
            <Card className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon" style={{ color: "#8b5cf6" }}>
                <FiUsers />
              </div>
              <div className="dashboard-kpi-content">
                <div className="dashboard-kpi-title">Tổng số khách hàng</div>
                <div className="dashboard-kpi-value">
                  {usersStats.totalCustomers || 0}
                </div>
                <div className="dashboard-kpi-change">
                  Khách hàng mới tháng này:{" "}
                  {usersStats.newCustomersThisMonth || 0} người
                </div>
              </div>
            </Card>
          )}

          {/* Packages/Catalogs Statistics Card */}
          {catalogsStats && (
            <Card className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon" style={{ color: "#3b82f6" }}>
                <FiPackage />
              </div>
              <div className="dashboard-kpi-content">
                <div className="dashboard-kpi-title">
                  Tổng số gói xét nghiệm
                </div>
                <div className="dashboard-kpi-value">
                  {catalogsStats.totalBundles || 0}
                </div>
                <div className="dashboard-kpi-change">
                  {catalogsStats.totalCatalogs || 0} mục xét nghiệm
                </div>
              </div>
            </Card>
          )}

          {/* Revenue Statistics Card */}
          {bookingsStats && (
            <Card className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon" style={{ color: "#f59e0b" }}>
                <FiTrendingUp />
              </div>
              <div className="dashboard-kpi-content">
                <div className="dashboard-kpi-title">Doanh thu tháng này</div>
                <div className="dashboard-kpi-value">
                  {(
                    (bookingsStats.totalRevenueThisMonth || 0) / 1000000
                  ).toFixed(1)}{" "}
                  triệu ₫
                </div>
                <div className="dashboard-kpi-change">
                  {revenuePercentage}% so với cả năm
                </div>
              </div>
            </Card>
          )}

          {/* Bookings Statistics Card */}
          {bookingsStats && (
            <Card className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon" style={{ color: "#10b981" }}>
                <FiCalendar />
              </div>
              <div className="dashboard-kpi-content">
                <div className="dashboard-kpi-title">Lịch hẹn tháng này</div>
                <div className="dashboard-kpi-value">
                  {bookingsStats.totalBookingsThisMonth || 0}
                </div>
                <div className="dashboard-kpi-change">
                  {bookingsPercentage}% so với cả năm
                </div>
              </div>
            </Card>
          )}

          {/* Blogs Statistics Card */}
          {blogsStats && (
            <Card className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon" style={{ color: "#8b5cf6" }}>
                <FiBook />
              </div>
              <div className="dashboard-kpi-content">
                <div className="dashboard-kpi-title">Tổng số bài viết</div>
                <div className="dashboard-kpi-value">
                  {blogsStats.totalPosts || 0}
                </div>
                <div className="dashboard-kpi-change">
                  {blogsStats.postsThisMonth || 0} bài viết tháng này
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Charts Section */}
        <div className="dashboard-charts-section">
          {/* New Users Chart */}
          <Card className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Người dùng mới trong tuần</h3>
            {maxNewUsers > 0 ? (
              <div className="dashboard-bar-chart">
                <div className="chart-y-axis">
                  {(() => {
                    const max = Math.max(maxNewUsers, 10);
                    const steps = [
                      max,
                      Math.floor(max * 0.75),
                      Math.floor(max * 0.5),
                      Math.floor(max * 0.25),
                      0,
                    ];
                    return steps.map((val) => (
                      <div key={val} className="y-axis-label">
                        {val}
                      </div>
                    ));
                  })()}
                </div>
                <div className="chart-content">
                  <div className="chart-bars">
                    {weeklyNewUsers.map((day, index) => {
                      const height =
                        maxNewUsers > 0 ? (day.value / maxNewUsers) * 100 : 0;
                      return (
                        <div key={index} className="chart-bar-container">
                          <div
                            className="chart-bar"
                            style={{ height: `${height}%` }}
                            title={`${day.day}: ${day.value} người`}
                          >
                            <span className="chart-bar-value">{day.value}</span>
                          </div>
                          <div className="chart-x-axis-label">{day.day}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "250px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Chưa có dữ liệu người dùng mới trong tuần
              </div>
            )}
          </Card>

          {/* Revenue Chart */}
          {bookingsStats && (
            <Card className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">
                Doanh thu 6 tháng gần đây
              </h3>
              {maxRevenue > 0 ? (
                <div className="dashboard-line-chart">
                  <div className="chart-y-axis">
                    {(() => {
                      const max = Math.max(maxRevenue, 10);
                      const steps = [
                        max,
                        Math.floor(max * 0.75),
                        Math.floor(max * 0.5),
                        Math.floor(max * 0.25),
                        0,
                      ];
                      return steps.map((val) => (
                        <div key={val} className="y-axis-label">
                          {(val / 1000000).toFixed(1)} triệu
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="chart-content">
                    <svg
                      className="line-chart-svg"
                      viewBox="0 0 300 200"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        points={monthlyRevenue
                          .map(
                            (r, i) =>
                              `${(i * 300) / (monthlyRevenue.length - 1)},${
                                200 - (r.value / maxRevenue) * 200
                              }`
                          )
                          .join(" ")}
                      />
                      {monthlyRevenue.map((r, i) => {
                        const x = (i * 300) / (monthlyRevenue.length - 1);
                        const y = 200 - (r.value / maxRevenue) * 200;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#f59e0b"
                            className="chart-point"
                          />
                        );
                      })}
                    </svg>
                    <div className="chart-x-axis-labels">
                      {monthlyRevenue.map((r, index) => (
                        <div key={index} className="x-axis-label">
                          {r.month}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "250px",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Chưa có dữ liệu doanh thu
                </div>
              )}
            </Card>
          )}

          {/* Bookings Chart */}
          {bookingsStats && (
            <Card className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">
                Lịch hẹn 6 tháng gần đây
              </h3>
              {maxBookings > 0 ? (
                <div className="dashboard-bar-chart">
                  <div className="chart-y-axis">
                    {(() => {
                      const max = Math.max(maxBookings, 10);
                      const steps = [
                        max,
                        Math.floor(max * 0.75),
                        Math.floor(max * 0.5),
                        Math.floor(max * 0.25),
                        0,
                      ];
                      return steps.map((val) => (
                        <div key={val} className="y-axis-label">
                          {val}
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="chart-content">
                    <div className="chart-bars">
                      {monthlyBookings.map((booking, index) => {
                        const height =
                          maxBookings > 0
                            ? (booking.value / maxBookings) * 100
                            : 0;
                        return (
                          <div key={index} className="chart-bar-container">
                            <div
                              className="chart-bar"
                              style={{
                                height: `${height}%`,
                                background:
                                  "linear-gradient(180deg, #10b981 0%, #34d399 100%)",
                              }}
                              title={`${booking.month}: ${booking.value}`}
                            >
                              <span className="chart-bar-value">
                                {booking.value}
                              </span>
                            </div>
                            <div className="chart-x-axis-label">
                              {booking.month}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "250px",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Chưa có dữ liệu lịch hẹn
                </div>
              )}
            </Card>
          )}

          {/* Inventory Alerts Card - 4th position in charts grid */}
          {instrumentsStats && (
            <Card className="dashboard-list-card">
              <div className="dashboard-list-header">
                <div
                  className="dashboard-list-icon alert"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  <FiAlertTriangle />
                </div>
                <h3 className="dashboard-list-title">Cảnh báo tồn kho</h3>
              </div>
              <div className="dashboard-list-items">
                {instrumentsStats.faultInstruments > 0 && (
                  <div className="dashboard-list-item">
                    <div className="list-item-content">
                      <div className="list-item-name">Máy đang lỗi</div>
                      <div className="list-item-details">
                        {instrumentsStats.faultInstruments} máy cần xử lý
                      </div>
                    </div>
                    <div className="list-item-alert urgent">Nguy cấp</div>
                  </div>
                )}
                {instrumentsStats.maintenanceInstruments > 0 && (
                  <div className="dashboard-list-item">
                    <div className="list-item-content">
                      <div className="list-item-name">Máy đang bảo trì</div>
                      <div className="list-item-details">
                        {instrumentsStats.maintenanceInstruments} máy
                      </div>
                    </div>
                    <div className="list-item-alert warning">Cảnh báo</div>
                  </div>
                )}
                {instrumentsStats.offlineInstruments > 0 && (
                  <div className="dashboard-list-item">
                    <div className="list-item-content">
                      <div className="list-item-name">Máy đang tắt</div>
                      <div className="list-item-details">
                        {instrumentsStats.offlineInstruments} máy
                      </div>
                    </div>
                    <div className="list-item-alert warning">Cảnh báo</div>
                  </div>
                )}
                {instrumentsStats.faultInstruments === 0 &&
                  instrumentsStats.maintenanceInstruments === 0 &&
                  instrumentsStats.offlineInstruments === 0 && (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      Không có cảnh báo tồn kho
                    </div>
                  )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardManagement;
