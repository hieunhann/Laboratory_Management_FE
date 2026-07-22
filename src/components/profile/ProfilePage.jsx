import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import { setAuthToken } from "../../utils/auth";
import api from "../../configs/axios";
import { toast } from "react-toastify";
import { Pagination, Modal, Form, Input, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import {
  parseDateToInput,
  calculateAge,
  formatDateTime,
} from "../../utils/formatDate";
import { getBloodTypeLabel, bloodTypeOptions } from "../../utils/bloodType";
import {
  useFetchProfile,
  useMedicalRecord,
  useUpdateProfile,
  useAddMedicalRecords,
} from "../../services/PatientService";
import Navbar from "../navbar/Navbar";

// Change password feature removed:
// This ProfilePage does not include any "change password" UI, state or API calls.
// If a change-password feature is added later, keep it in a separate component/modal
// and do not couple password changes with profile data updates.

// ===== CONSTANTS & UTILS =====
const initialFormData = {
  fullName: "",
  gender: "",
  bloodType: "",
  dateOfBirth: "",
  phoneNumber: "",
  email: "",
  address: "",
  identityCard: "",
  healthInsurance: "",
};
// Add: expose Option from Select
const { Option } = Select;

export default function ProfilePage() {
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState(initialFormData);
  const [createForm] = Form.useForm();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(2);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  // ===== HOOKS =====
  useEffect(() => {
    fetchProfile();
    fetchMedicalRecords(page, pageSize);
  }, [page, pageSize]);

  // ===== API CALLS =====
  const { fetchProfile, userData } = useFetchProfile();

  // Lấy danh sách hồ sơ bệnh án cá nhân (phân trang)
  const { fetchMedicalRecords, medicalRecords, totalRecords } =
    useMedicalRecord();

  // ===== FORM UTILS =====

  const {
    handleSave,
    handleOpenModal,
    handleCloseModal,
    errors,
    setErrors,
    showModal,
  } = useUpdateProfile(userData, formData, setFormData, fetchProfile);

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Thêm hồ sơ bệnh án mới
  const {
    handleCreateMedicalRecord,
    showCreateModal,
    isCreating,
    setShowCreateModal,
  } = useAddMedicalRecords(page, pageSize, fetchMedicalRecords, createForm);
  // ===== RENDER MAIN UI =====
  return (
    <div className="profile-page">
      <Navbar />
      {/* ===== HEADER SECTION ===== */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {getInitials(userData.fullName)}
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{userData.fullName}</h1>
              <div className="profile-tags">
                <span className="profile-tag">
                  {userData.gender == 1 ? "Nam" : "Nữ"}
                </span>
                <span className="profile-tag">
                  {typeof userData.age !== "undefined"
                    ? userData.age
                    : calculateAge(parseDateToInput(userData.dateOfBirth))}{" "}
                  Tuổi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="profile-content">
        {/* ===== TABS ===== */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${
              activeTab === "personal" ? "active" : ""
            }`}
            onClick={() => setActiveTab("personal")}
          >
            <svg
              className="tab-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Thông tin cá nhân
          </button>
          <button
            className={`profile-tab ${activeTab === "medical" ? "active" : ""}`}
            onClick={() => setActiveTab("medical")}
          >
            <svg
              className="tab-icon"
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
            Hồ sơ bệnh án
          </button>
        </div>

        {/* ===== TAB: PERSONAL INFO ===== */}
        {activeTab === "personal" && (
          <div className="profile-tab-content">
            <div className="profile-section">
              <div className="profile-Title">
                <div>
                  <h2 className="profile-section-title">Thông tin cá nhân</h2>
                  <p className="profile-section-subtitle">
                    Thông tin chi tiết về bệnh nhân
                  </p>
                </div>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-column">
                  <div className="profile-info-item">
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
                      <span className="info-value">{userData.fullName}</span>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <div className="info-icon-wrapper">
                      <svg
                        className="info-icon"
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
                    </div>
                    <div className="info-content">
                      <span className="info-label">Ngày sinh</span>
                      <span className="info-value">{userData.dateOfBirth}</span>
                    </div>
                  </div>

                  <div className="profile-info-item">
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
                      <span className="info-value">{userData.phone}</span>
                    </div>
                  </div>

                  <div className="profile-info-item">
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
                      <span className="info-value">{userData.email}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-info-column">
                  <div className="profile-info-item">
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
                      <span className="info-value">{userData.address}</span>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <div className="info-icon-wrapper">
                      <svg
                        className="info-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Số CMND/CCCD</span>
                      <span className="info-value">{userData.citizenId}</span>
                    </div>
                  </div>

                  <div className="profile-info-item">
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
                        {userData.insuranceNumber}
                      </span>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <div className="info-icon-wrapper">
                      <svg
                        className="info-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Nhóm máu</span>
                      <span className="info-value">
                        {getBloodTypeLabel(userData.bloodType)}
                      </span>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <div className="info-icon-wrapper">
                      <svg
                        className="info-icon"
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
                    </div>
                    <div className="info-content">
                      <span className="info-label">Ngày đăng ký</span>
                      <span className="info-value">
                        {formatDateTime(userData.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="profile-update-btn" onClick={handleOpenModal}>
                <svg
                  className="update-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Cập nhật
              </button>
            </div>
          </div>
        )}

        {/* ===== TAB: MEDICAL RECORDS ===== */}
        {activeTab === "medical" && (
          <div className="profile-tab-content">
            {/* Khu vực hồ sơ bệnh án cá nhân (chỉ hiển thị profile hiện tại) */}
            <div className="profile-section personal">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <div>
                  <h2 className="profile-section-title personal">
                    Hồ sơ bệnh án cá nhân
                  </h2>
                  <p className="profile-section-subtitle">
                    Thông tin chi tiết về hồ sơ bệnh án của bạn
                  </p>
                </div>
                <button
                  className="profile-update-btn"
                  onClick={() => {
                    createForm.resetFields();
                    setShowCreateModal(true);
                  }}
                  style={{ marginBottom: 0 }}
                >
                  + Thêm hồ sơ bệnh án
                </button>
              </div>
              <div className="medical-records-list">
                <div className="medical-record-card">
                  <div className="medical-record-header">
                    <h3 className="medical-record-title" title={userData.patientId}>
                      Hồ sơ bệnh án #{userData.patientId?.slice(0, 8).toUpperCase()}
                    </h3>
                    <span className="medical-record-status">
                      {userData.status || "Đang hoạt động"}
                    </span>
                  </div>
                  <div className="medical-record-dates">
                    <span className="medical-record-date">
                      Ngày tạo: {formatDateTime(userData.createdAt)}
                    </span>
                    <span className="medical-record-separator">•</span>
                    <span className="medical-record-date">
                      Cập nhật lần cuối: {formatDateTime(userData.updatedAt)}
                    </span>
                  </div>
                  <div className="medical-record-patient-info">
                    <div className="medical-record-patient-details">
                      <div className="medical-record-patient-column">
                        <div className="medical-record-patient-item">
                          <span className="medical-record-patient-label">
                            Họ tên:
                          </span>
                          <span className="medical-record-patient-value">
                            {userData.fullName}
                          </span>
                        </div>
                        <div className="medical-record-patient-item">
                          <span className="medical-record-patient-label">
                            Ngày sinh:
                          </span>
                          <span className="medical-record-patient-value">
                            {userData.dateOfBirth}
                          </span>
                        </div>
                      </div>
                      <div className="medical-record-patient-column">
                        <div className="medical-record-patient-item">
                          <span className="medical-record-patient-label">
                            Mã BN:
                          </span>
                          <span className="medical-record-patient-value" title={userData.patientId}>
                            {userData.patientId?.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div className="medical-record-patient-item">
                          <span className="medical-record-patient-label">
                            Giới tính:
                          </span>
                          <span className="medical-record-patient-value">
                            {userData.gender === 1 ? "Nam" : "Nữ"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    className="medical-record-view-btn"
                    onClick={() =>
                      navigate(
                        `/medical-record?patientId=${userData.patientId}`
                      )
                    }
                  >
                    <svg
                      className="view-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
            {/* Khu vực hồ sơ bệnh án của người khác (list từ API, loại bỏ hồ sơ cá nhân nếu trùng patientId) */}
            <div className="profile-section others" style={{ marginTop: 32 }}>
              <h2 className="profile-section-title others">
                Hồ sơ bệnh án của người khác
              </h2>
              <p className="profile-section-subtitle">
                Danh sách hồ sơ bệnh án của người khác
              </p>
              <div className="medical-records-list">
                {medicalRecords.filter(
                  (record) => record.patientId !== userData.patientId
                ).length === 0 ? (
                  <div style={{ color: "#888", marginBottom: 16 }}>
                    Không có hồ sơ bệnh án nào.
                  </div>
                ) : (
                  medicalRecords
                    .filter((record) => record.patientId !== userData.patientId)
                    .map((record) => (
                      <div
                        className="medical-record-card"
                        key={record.patientId}
                      >
                        <div className="medical-record-header">
                          <h3 className="medical-record-title" title={record.patientId}>
                            Hồ sơ bệnh án #{record.patientId?.slice(0, 8).toUpperCase()}
                          </h3>
                          <span className="medical-record-status">
                            {record.status || "Đang hoạt động"}
                          </span>
                        </div>
                        <div className="medical-record-dates">
                          <span className="medical-record-date">
                            Ngày tạo: {formatDateTime(record.createdAt)}
                          </span>
                          <span className="medical-record-separator">•</span>
                          <span className="medical-record-date">
                            Cập nhật lần cuối:{" "}
                            {formatDateTime(record.updatedAt)}
                          </span>
                        </div>
                        <div className="medical-record-patient-info">
                          <h4 className="medical-record-patient-title">
                            Thông tin bệnh nhân
                          </h4>
                          <div className="medical-record-patient-details">
                            <div className="medical-record-patient-column">
                              <div className="medical-record-patient-item">
                                <span className="medical-record-patient-label">
                                  Họ tên:
                                </span>
                                <span className="medical-record-patient-value">
                                  {record.fullName}
                                </span>
                              </div>
                              <div className="medical-record-patient-item">
                                <span className="medical-record-patient-label">
                                  Ngày sinh:
                                </span>
                                <span className="medical-record-patient-value">
                                  {record.dateOfBirth}
                                </span>
                              </div>
                            </div>
                            <div className="medical-record-patient-column">
                              <div className="medical-record-patient-item">
                                <span className="medical-record-patient-label">
                                  Mã BN:
                                </span>
                                <span className="medical-record-patient-value" title={record.patientId}>
                                  {record.patientId?.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                              <div className="medical-record-patient-item">
                                <span className="medical-record-patient-label">
                                  Giới tính:
                                </span>
                                <span className="medical-record-patient-value">
                                  {record.gender === 1 ? "Nam" : "Nữ"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className="medical-record-view-btn"
                            onClick={() =>
                              navigate(
                                `/medical-record?patientId=${record.patientId}`
                              )
                            }
                          >
                            <svg
                              className="view-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Xem chi tiết hồ sơ bệnh án
                          </button>
                          <button
                            className="medical-record-delete-btn"
                            onClick={() => {
                              setRecordToDelete(record);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <svg
                              className="delete-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))
                )}
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={totalRecords}
                    onChange={(p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                    }}
                    showSizeChanger
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== UPDATE MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-1">
              <h2 className="modal-title">Cập nhật thông tin bệnh nhân</h2>
              <p className="modal-subtitle">
                Chỉnh sửa thông tin cá nhân của bệnh nhân
              </p>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body-1">
              <div className="form-row-1">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? "error" : ""}
                  />
                  {errors.fullName && (
                    <span className="error-text">{errors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="1">Nam</option>
                    <option value="0">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="form-row-1">
                <div className="form-group">
                  <label>Nhóm máu</label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className={errors.bloodType ? "error" : ""}
                  >
                    <option value="">Chọn nhóm máu</option>
                    {bloodTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.bloodType && (
                    <span className="error-text">{errors.bloodType}</span>
                  )}
                </div>
              </div>

              <div className="form-row-1">
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={errors.dateOfBirth ? "error" : ""}
                  />
                  {errors.dateOfBirth && (
                    <span className="error-text">{errors.dateOfBirth}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={errors.phoneNumber ? "error" : ""}
                  />
                  {errors.phoneNumber && (
                    <span className="error-text">{errors.phoneNumber}</span>
                  )}
                </div>
              </div>
              <div className="form-row-1">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={errors.address ? "error" : ""}
                  />
                  {errors.address && (
                    <span className="error-text">{errors.address}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Số CMND/CCCD</label>
                  <input
                    type="text"
                    name="identityCard"
                    value={formData.identityCard}
                    onChange={handleInputChange}
                    className={errors.identityCard ? "error" : ""}
                  />
                  {errors.identityCard && (
                    <span className="error-text">{errors.identityCard}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Số bảo hiểm y tế</label>
                  <input
                    type="text"
                    name="healthInsurance"
                    value={formData.healthInsurance}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="btn-save" onClick={handleSave}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE MEDICAL RECORD MODAL ===== */}
      <Modal
        open={showCreateModal}
        title="Thêm hồ sơ bệnh án"
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateMedicalRecord}
        >
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[
              { required: true, message: "Họ và tên là bắt buộc" },
              {
                pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
                message: "Chỉ được nhập chữ cái, không số hoặc ký tự đặc biệt!",
              },
            ]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>
          <Form.Item
            label="Ngày sinh"
            name="dateOfBirth"
            rules={[
              { required: true, message: "Ngày sinh là bắt buộc" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (value.isAfter(dayjs(), "day")) {
                    return Promise.reject("Ngày sinh không được ở tương lai!");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
              placeholder="Chọn ngày sinh"
              disabledDate={(current) =>
                current && current > dayjs().endOf("day")
              }
            />
          </Form.Item>
          <Form.Item
            label={
              <>
                Nhóm máu <span className="required">*</span>
              </>
            }
            name="bloodType"
            rules={[{ required: true, message: "Vui lòng chọn nhóm máu" }]}
          >
            <Select placeholder="Chọn nhóm máu">
              <Option value="0">Không xác định</Option>
              <Option value="1">A+</Option>
              <Option value="2">A-</Option>
              <Option value="3">B+</Option>
              <Option value="4">B-</Option>
              <Option value="5">AB+</Option>
              <Option value="6">AB-</Option>
              <Option value="7">O+</Option>
              <Option value="8">O-</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Giới tính"
            name="gender"
            rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
          >
            <Select placeholder="Chọn giới tính">
              <Option value="1">Nam</Option>
              <Option value="0">Nữ</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phoneNumber"
            rules={[
              { required: true, message: "Số điện thoại là bắt buộc" },
              {
                pattern: /^0\d{9}$/,
                message:
                  "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số!",
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" maxLength={10} />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email là bắt buộc" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>
          <Form.Item
            label="CCCD/CMND"
            name="identityCard"
            rules={[
              { required: true, message: "CCCD/CMND là bắt buộc" },
              {
                pattern: /^\d{9}$|^\d{12}$/,
                message: "CCCD/CMND phải có 9 hoặc 12 chữ số hợp lệ!",
              },
            ]}
          >
            <Input placeholder="Nhập số CCCD/CMND" maxLength={12} />
          </Form.Item>
          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ required: true, message: "Địa chỉ là bắt buộc" }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>
          <Form.Item label="Số thẻ BHYT" name="healthInsurance">
            <Input placeholder="Nhập số thẻ BHYT (nếu có)" />
          </Form.Item>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setShowCreateModal(false);
                createForm.resetFields();
              }}
              disabled={isCreating}
            >
              Hủy
            </button>
            <button type="submit" className="btn-save" disabled={isCreating}>
              {isCreating ? "Đang xử lý..." : "Thêm hồ sơ"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="delete-confirm-modal-overlay"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-confirm-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="delete-confirm-title">Xác nhận xóa hồ sơ bệnh án</h3>
            <p className="delete-confirm-message">
              Bạn có chắc chắn muốn xóa hồ sơ bệnh án{" "}
              <strong>#{recordToDelete?.patientId}</strong> không?
            </p>
            <p className="delete-confirm-warning">
              Hành động này không thể hoàn tác. Tất cả thông tin liên quan đến
              hồ sơ này sẽ bị xóa vĩnh viễn.
            </p>
            <div className="delete-confirm-actions">
              <button
                className="delete-confirm-cancel"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRecordToDelete(null);
                }}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="delete-confirm-delete"
                onClick={async () => {
                  if (!recordToDelete) return;
                  setIsDeleting(true);
                  try {
                    const token = localStorage.getItem("accessToken");
                    setAuthToken(token);
                    await api.delete(
                      `patient/v1/patients/${recordToDelete.patientId}`
                    );
                    toast.success("Xóa hồ sơ bệnh án thành công!");
                    fetchMedicalRecords(page, pageSize);
                    setIsDeleteModalOpen(false);
                    setRecordToDelete(null);
                  } catch (error) {
                    toast.error(
                      error.response?.data?.message || "Xóa hồ sơ thất bại!"
                    );
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Đang xóa..." : "Xóa hồ sơ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
