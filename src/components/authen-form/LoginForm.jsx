import React from "react";
import { Button, Checkbox, Form, Input, Card } from "antd";
import "./login.css";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import {
  useLoginWithGoogle,
  useLoginWithPassword,
} from "../../services/IAMService.jsx";

const LoginForm = ({ errorMessage }) => {
  const { onFinish } = useLoginWithPassword();
  const { handleGoogleLoginSuccess } = useLoginWithGoogle();
  // ✅ Đăng nhập bằng Google

  return (
    <div className="auth-login-container">
      <div className="auth-login-welcome">
        <div className="auth-login-welcome-content">
          <h1 className="auth-login-welcome-title">
            Chào mừng đến với HemaLink
          </h1>
          <p className="auth-login-welcome-subtitle">
            Nền tảng quản lý xét nghiệm thông minh – chính xác, nhanh chóng và
            bảo mật.
          </p>

          <div className="auth-login-welcome-features">
            <div className="auth-login-welcome-feature">
              <div className="auth-login-welcome-feature-icon">🧪</div>
              <div className="auth-login-welcome-feature-text">
                Kết quả xét nghiệm chuẩn xác và kịp thời
              </div>
            </div>
            <div className="auth-login-welcome-feature">
              <div className="auth-login-welcome-feature-icon">📊</div>
              <div className="auth-login-welcome-feature-text">
                Theo dõi hồ sơ và lịch sử xét nghiệm tiện lợi
              </div>
            </div>
            <div className="auth-login-welcome-feature">
              <div className="auth-login-welcome-feature-icon">🔒</div>
              <div className="auth-login-welcome-feature-text">
                Bảo mật dữ liệu bệnh nhân nhiều lớp
              </div>
            </div>
            <div className="auth-login-welcome-feature">
              <div className="auth-login-welcome-feature-icon">👨‍⚕️</div>
              <div className="auth-login-welcome-feature-text">
                Kết nối nhanh với đội ngũ y bác sĩ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="auth-login-form-section">
        <div className="auth-login-form-wrapper">
          <Card
            className="auth-login-card"
            title="ĐĂNG NHẬP"
            extra={
              <Link to="/" className="auth-login-back-home">
                Quay về trang chủ
              </Link>
            }
          >
            {errorMessage && (
              <div className="auth-login-error">{errorMessage}</div>
            )}

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              className="auth-login-form"
            >
              <Form.Item
                label="Tên đăng nhập"
                name="username"
                rules={[
                  { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                ]}
              >
                <Input placeholder="Nhập tên đăng nhập" size="large" />
              </Form.Item>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              >
                <Input.Password placeholder="Nhập mật khẩu" size="large" />
              </Form.Item>
              <Form.Item
                name="remember"
                valuePropName="checked"
                className="auth-login-form-item-remember"
              >
                <div className="auth-login-haha">
                  <Checkbox className="auth-login-checkbox">
                    Ghi nhớ đăng nhập
                  </Checkbox>
                  <div className="auth-login-forgot-link">
                    <Link
                      to="/forgot-password"
                      className="auth-login-forgot-link-a"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                </div>
              </Form.Item>

              <Form.Item className="auth-login-form-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="auth-login-button"
                  size="large"
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              <div className="auth-login-register-link">
                Chưa có tài khoản?
                <Link to="/register" className="auth-login-register-link-a">
                  Đăng ký ngay
                </Link>
              </div>

              {/* ✅ Nút Google Login */}
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={() => toast.error("Đăng nhập Google thất bại!")}
                />
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
