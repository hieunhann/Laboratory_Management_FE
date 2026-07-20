import React, { useEffect } from "react";
import { Button, Form, Input, Card } from "antd";
import { Link } from "react-router-dom";
import "./register.css";
import { useRegister } from "../../services/IAMService.jsx";

function RegisterForm() {
  const { onFinish, apiErrors, form, setApiErrors } = useRegister();
  // Auto-hide errors after 5 seconds
  useEffect(() => {
    if (Object.keys(apiErrors).length > 0) {
      const timer = setTimeout(() => {
        setApiErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [apiErrors]);

  return (
    <div className="auth-register-container">
      <div className="auth-register-left">
        <div className="auth-register-left-content">
          <h1 className="auth-register-welcome-title">HemaLink</h1>
          <p className="auth-register-welcome-subtitle">
            Phòng khám hiện đại, kết nối chẩn đoán và điều trị, mang đến dịch vụ
            y tế chất lượng và đáng tin cậy.
          </p>

          <div className="auth-register-features">
            <div className="auth-register-feature-item">
              <div className="auth-register-feature-icon">🧪</div>
              <div className="auth-register-feature-text">
                <h3>Xét nghiệm nhanh chóng</h3>
                <p>Hệ thống hiện đại, kết quả chính xác và kịp thời</p>
              </div>
            </div>

            <div className="auth-register-feature-item">
              <div className="auth-register-feature-icon">📋</div>
              <div className="auth-register-feature-text">
                <h3>Quản lý hồ sơ dễ dàng</h3>
                <p>Theo dõi lịch sử khám chữa bệnh mọi lúc, mọi nơi</p>
              </div>
            </div>

            <div className="auth-register-feature-item">
              <div className="auth-register-feature-icon">👨‍⚕️</div>
              <div className="auth-register-feature-text">
                <h3>Đội ngũ bác sĩ giàu kinh nghiệm</h3>
                <p>Tư vấn tận tình, hỗ trợ chuyên sâu cho từng bệnh nhân</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="auth-register-right">
        <Card
          className="auth-register-card"
          title="Đăng ký tài khoản"
          extra={
            <Link to="/" className="auth-register-back-home">
              Quay về trang chủ
            </Link>
          }
        >
          <Form
            form={form}
            name="register"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="auth-register-form"
          >
            <div className="auth-register-form-row">
              <div className="auth-register-form-item">
                <Form.Item
                  label="Họ và tên"
                  name="fullname"
                  validateStatus={apiErrors.fullname ? "error" : ""}
                  help={apiErrors.fullname}
                  rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
                >
                  <Input
                    placeholder="Nhập họ và tên"
                    size="large"
                    className="placeholder"
                    onChange={() => {
                      if (apiErrors.fullname) {
                        const newErrors = { ...apiErrors };
                        delete newErrors.fullname;
                        setApiErrors(newErrors);
                      }
                    }}
                  />
                </Form.Item>
              </div>
              <div className="auth-register-form-item">
                <Form.Item
                  label="Email"
                  name="email"
                  validateStatus={apiErrors.email ? "error" : ""}
                  help={apiErrors.email}
                  rules={[
                    { required: true, message: "Vui lòng nhập email!" },
                    { type: "email", message: "Email không hợp lệ!" },
                  ]}
                >
                  <Input
                    placeholder="Nhập email"
                    size="large"
                    onChange={() => {
                      if (apiErrors.email) {
                        const newErrors = { ...apiErrors };
                        delete newErrors.email;
                        setApiErrors(newErrors);
                      }
                    }}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="auth-register-form-row">
              <div className="auth-register-form-item">
                <Form.Item
                  label="Tên đăng nhập"
                  name="UserName"
                  validateStatus={apiErrors.UserName ? "error" : ""}
                  help={apiErrors.UserName}
                  rules={[
                    { required: true, message: "Vui lòng nhập tên người dùng" },
                  ]}
                >
                  <Input
                    placeholder="Nhập tên người dùng"
                    size="large"
                    onChange={() => {
                      if (apiErrors.UserName) {
                        const newErrors = { ...apiErrors };
                        delete newErrors.UserName;
                        setApiErrors(newErrors);
                      }
                    }}
                  />
                </Form.Item>
              </div>
              <div className="auth-register-form-item">
                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  validateStatus={apiErrors.password ? "error" : ""}
                  help={apiErrors.password}
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu!" },
                    { min: 6, message: "Mật khẩu ít nhất 6 ký tự" },
                  ]}
                  hasFeedback
                >
                  <Input.Password
                    placeholder="Nhập mật khẩu"
                    size="large"
                    onChange={() => {
                      if (apiErrors.password) {
                        const newErrors = { ...apiErrors };
                        delete newErrors.password;
                        setApiErrors(newErrors);
                      }
                    }}
                  />
                </Form.Item>
              </div>
            </div>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              validateStatus={apiErrors.confirmPassword ? "error" : ""}
              help={apiErrors.confirmPassword}
              dependencies={["password"]}
              hasFeedback
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Nhập lại mật khẩu"
                size="large"
                onChange={() => {
                  if (apiErrors.confirmPassword) {
                    const newErrors = { ...apiErrors };
                    delete newErrors.confirmPassword;
                    setApiErrors(newErrors);
                  }
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                className="auth-register-button"
              >
                Đăng ký ngay
              </Button>
            </Form.Item>

            <div className="auth-register-login-link">
              Đã có tài khoản?
              <Link to="/login" className="auth-register-login-link-a">
                Đăng nhập ngay
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default RegisterForm;
