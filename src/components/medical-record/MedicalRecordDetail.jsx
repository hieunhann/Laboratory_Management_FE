import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import CustomPagination from "../common/Pagination";
import { useNavigate } from "react-router-dom";
import "./MedicalRecordDetail.css";
import TestResultDetail from "./TestResultDetail";
import { useSearchParams } from "react-router-dom";
import { PatientServiceAPI } from "../../apis/PatientServiceAPI";
import { setAuthToken } from "../../utils/auth";
import { calculateAge } from "../../utils/formatDate";
import api from "../../configs/axios";
import { bookingService } from "../../services/TestOrderService.jsx";
import Navbar from "../navbar/Navbar";

function MedicalRecordDetail() {
  const navigate = useNavigate();
  const [expandedTests, setExpandedTests] = useState({});
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");
  const autoExpandBookingId = searchParams.get("bookingId");
  const [patientId, setPatientId] = useState(patientIdFromUrl || null);
  const [patients, setPatient] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noProfile, setNoProfile] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  // Sorting and Filtering states
  const [sortByDate, setSortByDate] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("");

  // If patientId not in URL, fetch from patients/me
  useEffect(() => {
    if (patientIdFromUrl) {
      setPatientId(patientIdFromUrl);
      return;
    }
    const resolvePatientId = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) setAuthToken(token);
        const res = await api.get("patient/v1/patients/me");
        const patient = res?.data?.data?.data || res?.data?.data || res?.data;
        const pid = patient?.patientId || patient?.id;
        if (pid) {
          setPatientId(pid);
        } else {
          setNoProfile(true);
        }
      } catch {
        setNoProfile(true);
      }
    };
    resolvePatientId();
  }, [patientIdFromUrl]);

  // Client-side filter and sort based on status and date
  const filteredAppointments = appointmentHistory
    .filter((item) => {
      if (!filterStatus) return true;
      const statusStr = String(item.status).toLowerCase();
      if (filterStatus === "completed") {
        return statusStr === "completed" || statusStr === "5";
      }
      if (filterStatus === "cancelled") {
        return statusStr === "cancelled" || statusStr === "6";
      }
      if (filterStatus === "pending") {
        return statusStr !== "completed" && statusStr !== "5" && statusStr !== "cancelled" && statusStr !== "6";
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.booking?.slotInfo?.appointmentDate || a.booking?.appointmentDate || 0);
      const dateB = new Date(b.booking?.slotInfo?.appointmentDate || b.booking?.appointmentDate || 0);
      if (sortByDate === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setAuthToken(token);

    const fetchPatientAPI = async () => {
      const response = await PatientServiceAPI.GetProfileByPatientId(patientId);
      if (response.status >= 200 && response.status < 300) {
        const data = response.data?.data || response.data;
        setPatient(data);
        console.log("Patient data:", data);
      }
    };

    fetchPatientAPI();
  }, [patientId]);

  useEffect(() => {
    const fetchBookingHistory = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (token) setAuthToken(token);
        const response = await api.get(
          `testorder/api/patients/${patientId}/bookings?pageNumber=1&pageSize=1000`
        );
        if (response.status >= 200 && response.status < 300) {
          // Hỗ trợ cả trường hợp trả về object có bookingResponses hoặc array
          let bookingsRaw = [];
          const dataObj = response.data?.data || response.data;
          console.log("Bookings API Response DataObj:", dataObj);
          
          if (Array.isArray(dataObj)) {
            bookingsRaw = dataObj;
          } else if (Array.isArray(dataObj?.bookingResponses)) {
            bookingsRaw = dataObj.bookingResponses;
          } else if (Array.isArray(dataObj?.items)) {
            bookingsRaw = dataObj.items;
          } else if (Array.isArray(dataObj?.data)) {
            bookingsRaw = dataObj.data;
          }
          console.log("Bookings Raw parsed:", bookingsRaw);
          // Xử lý từng booking để lấy thông tin gói hoặc catalog
          const processedBookings = await Promise.all(
            bookingsRaw.map(async (booking) => {
              let title = "Xét nghiệm đơn lẻ";
              if (booking.bundleId) {
                try {
                  const bundleData = await bookingService.getTestBundle(
                    booking.bundleId
                  );
                  title =
                    bundleData?.bundleName ||
                    bundleData?.name ||
                    "Gói xét nghiệm";
                } catch (error) {
                  console.error("Error fetching bundle:", error);
                  title = "Gói xét nghiệm";
                }
              } else if (
                booking.testCatalogs &&
                Array.isArray(booking.testCatalogs) &&
                booking.testCatalogs.length > 0
              ) {
                try {
                  const catalogPromises = booking.testCatalogs.map(
                    (catalogId) => bookingService.getTestCatalog(catalogId)
                  );
                  const catalogs = await Promise.all(catalogPromises);
                  const testNames = catalogs
                    .map((cat) => cat?.testName || cat?.name)
                    .filter(Boolean);
                  title =
                    testNames.length > 0
                      ? testNames.join(", ")
                      : "Xét nghiệm đơn lẻ";
                } catch (error) {
                  console.error("Error fetching catalogs:", error);
                  title = "Xét nghiệm đơn lẻ";
                }
              }
              const formatDate = (dateStr) => {
                if (!dateStr) return "—";
                try {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                } catch {
                  return dateStr;
                }
              };
              return {
                id: booking.bookingId || booking.id,
                title: title,
                date: formatDate(
                  booking.slotInfo?.appointmentDate || booking.appointmentDate
                ),
                location:
                  booking.slotInfo?.location ||
                  "Phòng khám Xét nghiệm Y tế, 123 Nguyễn Huệ, Q.1, TP.HCM",
                status: booking.status || "completed",
                booking: booking, // Lưu toàn bộ booking data để dùng sau
              };
            })
          );
          console.log("Processed Bookings:", processedBookings);
          setAppointmentHistory(processedBookings);
        }
      } catch (error) {
        console.error("Error fetching booking history:", error);
        setAppointmentHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingHistory();
  }, [patientId]);

  const toggleTestDetail = (testId) => {
    setExpandedTests((prev) => ({
      ...prev,
      [testId]: !prev[testId],
    }));
  };

  // Tự động expand nếu có bookingId trên URL
  useEffect(() => {
    if (autoExpandBookingId) {
      setExpandedTests((prev) => ({ ...prev, [autoExpandBookingId]: true }));
    }
  }, [autoExpandBookingId]);

  if (noProfile) {
    return (
      <div className="medical-record-detail">
        <Navbar />
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          gap: "16px",
          color: "#64748b"
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#475569" }}>
            Bạn chưa có kết quả xét nghiệm nào
          </p>
          <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>
            Hãy đặt lịch xét nghiệm để xem kết quả tại đây.
          </p>
          <a
            href="/booking"
            style={{
              marginTop: "8px",
              padding: "10px 24px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "14px"
            }}
          >
            Đặt lịch ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-record-detail">
      <Navbar />
      {/* Header */}
      <div className="medical-record-header-1">

        <h1 className="page-title-1">Kết quả xét nghiệm</h1>
      </div>



      {/* Appointment History Section */}
      <div className="appointment-history-section">
        <h2 className="section-title">Lịch sử xét nghiệm</h2>
        <p className="section-subtitle">
          Các xét nghiệm đã thực hiện trong quá khứ (chỉ xem)
        </p>

        <div className="filter-bar">
          <div className="filter-item">
            <svg
              className="filter-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Bộ lọc</span>
            <span className="filter-note">
              Sắp xếp theo ngày và lọc theo trạng thái kết quả
            </span>
          </div>
          <div className="filter-dates">
            <div className="date-picker">
              <label>Sắp xếp theo ngày</label>
              <select
                value={sortByDate}
                onChange={(e) => {
                  setSortByDate(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>
            <div className="date-picker">
              <label>Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="completed">Đã hoàn thành (Có kết quả)</option>
                <option value="pending">Chưa có kết quả</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <button
              className="filter-reset"
              onClick={() => {
                setSortByDate("newest");
                setFilterStatus("");
                setPage(1);
              }}
            >
              <span>Thiết lập lại</span>
            </button>
          </div>
        </div>

        <div className="appointment-list">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {filteredAppointments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  Chưa có lịch sử xét nghiệm nào.
                </div>
              ) : (
                filteredAppointments
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((appointment) => {
                    const statusStr = String(appointment.status).toLowerCase();
                    const isCompleted = statusStr === "completed" || statusStr === "5";
                    const isCancelled = statusStr === "cancelled" || statusStr === "6";

                    return (
                      <div
                        key={appointment.id}
                        className="appointment-card-wrapper"
                      >
                        <div className="appointment-card">
                          <div className="appointment-icon">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14,2 14,8 20,8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10,9 9,9 8,9" />
                            </svg>
                          </div>
                          <div className="appointment-content">
                            <h3 className="appointment-title">
                              {appointment.title}
                            </h3>
                            <div className="appointment-info">
                              <div className="appointment-date">
                                <svg
                                  className="date-icon"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>Ngày xét nghiệm: {appointment.date}</span>
                              </div>
                              <div className="appointment-location">
                                <span>Khám tại: {appointment.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="appointment-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center", alignSelf: "stretch" }}>
                            {isCompleted ? (
                              <>
                                <button
                                  className={`view-detail-btn ${
                                    expandedTests[appointment.id] ? "active" : ""
                                  }`}
                                  onClick={() => toggleTestDetail(appointment.id)}
                                >
                                  {expandedTests[appointment.id] ? "Ẩn" : "Xem"} chi
                                  tiết kết quả
                                  <svg
                                    className={`chevron-icon ${
                                      expandedTests[appointment.id] ? "expanded" : ""
                                    }`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </button>
                                <button
                                  className="download-report-btn"
                                  style={{ width: "100%", marginTop: "8px" }}
                                  onClick={async () => {
                                    try {
                                      const response =
                                        await PatientServiceAPI.TestReport(
                                          appointment.id
                                        );

                                      const blob = new Blob([response.data], {
                                        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                      });

                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement("a");
                                      link.href = url;
                                      link.download = `KetQuaXetNghiem_${appointment.id}.docx`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                      console.error("Error:", err);
                                    }
                                  }}
                                >
                                  <svg
                                    className="download-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                  Tải kết quả xét nghiệm
                                </button>
                              </>
                            ) : isCancelled ? (
                              <div className="result-box-status cancelled-status" style={{
                                width: "230px",
                                height: "88px",
                                padding: "12px 16px",
                                background: "#fef2f2",
                                border: "1px dashed #ef4444",
                                borderRadius: "8px",
                                color: "#b91c1c",
                                fontSize: "13px",
                                fontWeight: "500",
                                textAlign: "center",
                                lineHeight: "1.4",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                boxSizing: "border-box"
                              }}>
                                <strong>Không có kết quả xét nghiệm</strong>
                                <div style={{ fontSize: "11px", fontWeight: "400", marginTop: "4px", color: "#ef4444" }}>
                                  Lịch hẹn đã bị hủy.
                                </div>
                              </div>
                            ) : (
                              <div className="result-box-status pending-status" style={{
                                width: "230px",
                                height: "88px",
                                padding: "12px 16px",
                                background: "#fffbeb",
                                border: "1px dashed #f59e0b",
                                borderRadius: "8px",
                                color: "#b45309",
                                fontSize: "13px",
                                fontWeight: "500",
                                textAlign: "center",
                                lineHeight: "1.4",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                boxSizing: "border-box"
                              }}>
                                <strong>Chưa có kết quả xét nghiệm</strong>
                                <div style={{ fontSize: "11px", fontWeight: "400", marginTop: "4px", color: "#d97706" }}>
                                  Kết quả sẽ được cập nhật sau khi hoàn tất lấy mẫu.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {isCompleted && expandedTests[appointment.id] && (
                          <div className="test-detail-dropdown">
                            <TestResultDetail
                              test={appointment}
                              inline={true}
                              bookingId={appointment.id}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <CustomPagination
                  current={page}
                  pageSize={pageSize}
                  total={filteredAppointments.length}
                  onChange={(p, ps) => {
                    setPage(p);
                    if (ps !== pageSize) {
                      setPageSize(ps);
                      setPage(1);
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MedicalRecordDetail;
