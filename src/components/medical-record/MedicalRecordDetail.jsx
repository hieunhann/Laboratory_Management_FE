import React, { useEffect, useState } from "react";
import { Pagination, Spin } from "antd";
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
  const patientId = searchParams.get("patientId");
  const autoExpandBookingId = searchParams.get("bookingId");
  const [patients, setPatient] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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
          `testorder/api/patients/${patientId}/bookings?pageNumber=1&pageSize=1000&filterStatus=5`
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

  return (
    <div className="medical-record-detail">
      <Navbar />
      {/* Header */}
      <div className="medical-record-header-1">
        <button
          className="back-to-profile-btn"
          onClick={() => navigate("/profile")}
        >
          <svg
            className="back-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Quay lại thông tin cá nhân
        </button>
        <h1 className="page-title-1">Chi tiết hồ sơ bệnh án</h1>
      </div>

      {/* Patient Info Section */}
      <div className="patient-info-section">
        <h2 className="section-title">Thông tin bệnh nhân</h2>
        <p className="section-subtitle">Thông tin chi tiết của bệnh nhân</p>

        <div className="patient-info-grid">
          {/* Cột 1 - 5 trường */}
          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Họ và tên</span>
              <span className="info-value">{patients?.fullName}</span>
            </div>
          </div>

          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-value">{patients?.patientId}</span>
            </div>
          </div>

          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Địa chỉ</span>
              <span className="info-value">{patients?.address}</span>
            </div>
          </div>

          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Số CMND/CCCD</span>
              <span className="info-value">{patients?.citizenId}</span>
            </div>
          </div>

          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Số bảo hiểm y tế</span>
              <span className="info-value">
                {patients?.insuranceNumber || patients?.healthInsurance || "—"}
              </span>
            </div>
          </div>

          {/* Cột 2 - 4 trường */}
          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
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
            </div>
            <div className="info-content">
              <span className="info-label">Ngày sinh</span>
              <span className="info-value">
                {patients?.dateOfBirth} ({calculateAge(patients?.dateOfBirth)}{" "}
                Tuổi)
              </span>
            </div>
          </div>

          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Giới tính</span>
              <span className="info-value">
                {patients?.gender == 1 ? "Nam" : "Nữ"}
              </span>
            </div>
          </div>

          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Số điện thoại</span>
              <span className="info-value">{patients?.phone}</span>
            </div>
          </div>

          <div className="patient-info-item">
            <div className="info-icon-wrapper">
              <svg
                className="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Email</span>
              <span className="info-value">{patients?.email}</span>
            </div>
          </div>
        </div>
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
              Lọc xét nghiệm theo ngày trước ngày tháng năm
            </span>
          </div>
          <div className="filter-dates">
            <div className="date-picker">
              <label>Từ ngày</label>
              <input type="text" placeholder="mm/dd/yyyy" />
            </div>
            <div className="date-picker">
              <label>Đến ngày</label>
              <input type="text" placeholder="mm/dd/yyyy" />
            </div>
            <button className="filter-reset">
              <span>Tất cả</span>
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
              {appointmentHistory
                .slice((page - 1) * pageSize, page * pageSize)
                .map((appointment) => (
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
                      <div className="appointment-actions">
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
                      </div>
                    </div>
                    {expandedTests[appointment.id] && (
                      <div className="test-detail-dropdown">
                        <TestResultDetail
                          test={appointment}
                          inline={true}
                          bookingId={appointment.id}
                        />
                      </div>
                    )}
                  </div>
                ))}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={appointmentHistory.length}
                  onChange={(p, ps) => {
                    setPage(p);
                    if (ps !== pageSize) {
                      setPageSize(ps);
                      setPage(1);
                    }
                  }}
                  showSizeChanger
                  pageSizeOptions={[5, 10, 20, 50]}
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
