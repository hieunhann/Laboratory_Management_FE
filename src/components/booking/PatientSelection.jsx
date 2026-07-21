import React, { useEffect, useState } from "react";
import { Spin, Form, Input, Select, DatePicker } from "antd";
import { useMedicalRecord, useAddMedicalRecords } from "../../services/PatientService";
import { bloodTypeOptions } from "../../utils/bloodType";
import dayjs from "dayjs";
import "./PatientSelection.css";

const { Option } = Select;

function PatientSelection({ onSelectPatient, onBack }) {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [form] = Form.useForm();
  const { fetchMedicalRecords, medicalRecords } = useMedicalRecord();
  const [loading, setLoading] = useState(false);

  const {
    handleCreateMedicalRecord,
    showCreateModal,
    isCreating,
    setShowCreateModal,
  } = useAddMedicalRecords(1, 10000, fetchMedicalRecords, form);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    form.resetFields();
  };

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      await fetchMedicalRecords(1, 10000); // Lấy tất cả patient
      setLoading(false);
    };

    loadPatients();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreateModal]);

  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.patientId);
  };

  const handleContinue = () => {
    const selected = medicalRecords.find(
      (p) => p.patientId === selectedPatientId
    );
    if (selected && onSelectPatient) {
      // Chuẩn hóa object để luôn có đủ các trường cần thiết
      const normalized = {
        patientId: selected.patientId || selected.id || selected._id,
        fullName: selected.fullName || selected.name,
        phone: selected.phone || selected.phoneNumber || selected.sdt,
        email: selected.email || selected.mail,
        ...selected, // giữ lại các trường khác nếu cần
      };
      onSelectPatient(normalized);
    }
  };

  return (
    <div className="patient-selection">
      <h2>Chọn bệnh nhân</h2>
      <p className="patient-selection-sub">
        Vui lòng chọn bệnh nhân để tiếp tục đặt lịch xét nghiệm
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="patient-list">
            {medicalRecords.length === 0 ? (
              <div className="no-patients">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 64, height: 64, margin: "0 auto 16px" }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <p>Chưa có hồ sơ bệnh nhân nào</p>
                <p style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
                  Vui lòng tạo hồ sơ bệnh nhân trước khi đặt lịch
                </p>
                <button
                  className="btn-create-profile"
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                >
                  Tạo hồ sơ bệnh nhân
                </button>
              </div>
            ) : (
              medicalRecords.map((patient) => (
                <div
                  key={patient.patientId}
                  className={`patient-card ${
                    selectedPatientId === patient.patientId ? "selected" : ""
                  }`}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="patient-card-header">
                    <div className="patient-avatar">
                      {patient.fullName
                        ? patient.fullName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </div>
                    <div className="patient-info">
                      <h3 className="patient-name">{patient.fullName}</h3>
                      <p className="patient-id">Mã BN: {patient.patientId}</p>
                    </div>
                    {selectedPatientId === patient.patientId && (
                      <div className="selected-icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="patient-details">
                    <div className="detail-row">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: 16, height: 16 }}
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
                      <span>Ngày sinh: {patient.dateOfBirth}</span>
                    </div>
                    <div className="detail-row">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: 16, height: 16 }}
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>{patient.phone}</span>
                    </div>
                    <div className="detail-row">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: 16, height: 16 }}
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{patient?.email}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="patient-selection-actions">
            <button className="btn-back" onClick={() => onBack && onBack()}>
              Quay lại
            </button>
            <button
              className="btn-continue"
              onClick={handleContinue}
              disabled={!selectedPatientId}
            >
              Tiếp tục
            </button>
          </div>
        </>
      )}

      {/* Modal Tạo hồ sơ bệnh nhân trực tiếp trên page booking */}
      {showCreateModal && (
        <div className="profile-modal-overlay" onClick={handleCloseCreateModal}>
          <div
            className="profile-modal-container"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <h2>Tạo hồ sơ bệnh nhân</h2>
              <button
                className="profile-modal-close"
                type="button"
                onClick={handleCloseCreateModal}
              >
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

            <Form
              form={form}
              className="profile-modal-form"
              layout="vertical"
              onFinish={handleCreateMedicalRecord}
            >
              {/* Hàng 1 */}
              <div className="profile-form-row">
                {/* Họ và tên */}
                <div className="profile-form-group">
                  <Form.Item
                    label={
                      <>
                        Họ và tên <span className="required">*</span>
                      </>
                    }
                    name="fullName"
                    rules={[
                      { required: true, message: "Họ và tên là bắt buộc" },
                      {
                        pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
                        message:
                          "Chỉ được nhập chữ cái, không số hoặc ký tự đặc biệt!",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Nhập họ và tên"
                      onKeyPress={(e) => {
                        const regex = /^[a-zA-ZÀ-ỹ\s]$/;
                        if (!regex.test(e.key)) e.preventDefault();
                      }}
                    />
                  </Form.Item>
                </div>

                {/* Ngày sinh */}
                <div className="profile-form-group">
                  <Form.Item
                    label={
                      <>
                        Ngày sinh <span className="required">*</span>
                      </>
                    }
                    name="dateOfBirth"
                    rules={[
                      { required: true, message: "Ngày sinh là bắt buộc" },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          if (value.isAfter(dayjs(), "day")) {
                            return Promise.reject(
                              "Ngày sinh không được ở tương lai!"
                            );
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
                </div>

                {/* Giới tính */}
                <div className="profile-form-group">
                  <Form.Item
                    label={
                      <>
                        Giới tính <span className="required">*</span>
                      </>
                    }
                    name="gender"
                    rules={[
                      { required: true, message: "Vui lòng chọn giới tính" },
                    ]}
                  >
                    <Select placeholder="Chọn giới tính">
                      <Option value="1">Nam</Option>
                      <Option value="0">Nữ</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>

              {/* Hàng 2 */}
              <div className="profile-form-row">
                {/* Số điện thoại */}
                <div className="profile-form-group">
                  <Form.Item
                    label={
                      <>
                        Số điện thoại <span className="required">*</span>
                      </>
                    }
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
                    <Input
                      placeholder="Nhập số điện thoại"
                      maxLength={10}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                    />
                  </Form.Item>
                </div>

                {/* Email */}
                <div className="profile-form-group">
                  <Form.Item
                    label={
                      <>
                        Email <span className="required">*</span>
                      </>
                    }
                    name="email"
                    rules={[
                      { required: true, message: "Email là bắt buộc" },
                      { type: "email", message: "Email không hợp lệ" },
                    ]}
                  >
                    <Input placeholder="Nhập email" />
                  </Form.Item>
                </div>

                {/* Nhóm máu */}
                <div className="profile-form-group">
                  <Form.Item
                    label={
                      <>
                        Nhóm máu <span className="required">*</span>
                      </>
                    }
                    name="bloodType"
                    rules={[
                      { required: true, message: "Vui lòng chọn nhóm máu" },
                    ]}
                  >
                    <Select 
                      placeholder="Chọn nhóm máu"
                      listHeight={180}
                    >
                      {bloodTypeOptions.map((opt) => (
                        <Option key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                {/* CCCD/CMND */}
                <div className="profile-form-group">
                  <Form.Item
                    label={
                      <>
                        CCCD/CMND <span className="required">*</span>
                      </>
                    }
                    name="identityCard"
                    rules={[
                      { required: true, message: "CCCD/CMND là bắt buộc" },
                      {
                        pattern: /^\d{9}$|^\d{12}$/,
                        message: "CCCD/CMND phải có 9 hoặc 12 chữ số hợp lệ!",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Nhập số CCCD/CMND"
                      maxLength={12}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Hàng 3 */}
              <div className="profile-form-row">
                <div className="profile-form-group profile-form-full">
                  <Form.Item
                    label={
                      <>
                        Địa chỉ <span className="required">*</span>
                      </>
                    }
                    name="address"
                    rules={[{ required: true, message: "Địa chỉ là bắt buộc" }]}
                  >
                    <Input placeholder="Nhập địa chỉ" />
                  </Form.Item>
                </div>

                <div className="profile-form-group profile-form-full">
                  <Form.Item label="Số thẻ BHYT" name="healthInsurance">
                    <Input placeholder="Nhập số thẻ BHYT (nếu có)" />
                  </Form.Item>
                </div>
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn-cancel"
                  onClick={handleCloseCreateModal}
                  disabled={isCreating}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="profile-btn-submit"
                  disabled={isCreating}
                >
                  {isCreating ? "Đang xử lý..." : "Tạo hồ sơ"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientSelection;
