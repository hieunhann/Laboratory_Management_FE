import React from "react";
import { Form, Input, Select, DatePicker } from "antd";
import Navbar from "../navbar/Navbar";
import Footer from "../footer/Footer";
import "./CreateProfile.css";
import dayjs from "dayjs";
import { useCreatePatient } from "../../services/PatientService";
import { bloodTypeOptions } from "../../utils/bloodType";

const { Option } = Select;

function CreateProfile() {
  const {
    handleSubmit,
    handleOpenModal,
    handleCloseModal,
    isModalOpen,
    isSubmitting,
    form,
  } = useCreatePatient();

  return (
    <div className="create-profile-page">
      <Navbar />
      <div className="create-profile-container">
        <div className="create-profile-content">
          <div className="create-profile-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1>Chưa có hồ sơ bệnh nhân</h1>
          <p>
            Bạn chưa có hồ sơ bệnh nhân trong hệ thống. Vui lòng tạo hồ sơ để sử
            dụng các dịch vụ của chúng tôi.
          </p>
          <button className="create-profile-button" onClick={handleOpenModal}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tạo hồ sơ bệnh nhân
          </button>
        </div>
      </div>

      {/* Modal giữ nguyên CSS cũ */}
      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={handleCloseModal}>
          <div
            className="profile-modal-container"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <h2>Tạo hồ sơ bệnh nhân</h2>
              <button
                className="profile-modal-close"
                onClick={handleCloseModal}
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

            {/* FORM dùng antd, vẫn theo layout CSS */}
            <Form
              form={form}
              className="profile-modal-form"
              layout="vertical"
              onFinish={handleSubmit}
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
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="profile-btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Tạo hồ sơ"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateProfile;
