import React from "react";
import { Card, Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import { useForgotPassword } from "../../services/IAMService.jsx";
import { setAuthToken } from "../../utils/auth";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const accessToken = localStorage.getItem("accessToken");
  setAuthToken(accessToken);

  const { onFinish, loading } = useForgotPassword();

  return (
    <div className="fp-container">
      <div className="fp-card-wrapper">
        <Card title="Quên mật khẩu" className="fp-card">
          <p className="fp-subtitle">
            Nhập email hoặc username bạn đã đăng ký. Chúng tôi sẽ gửi hướng dẫn
            đặt lại mật khẩu.
          </p>

          <Form name="forgot" layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Bạn Có thể Nhập Email or Username"
              name="email"
              rules={[{ required: true, message: "Vui lòng nhập email!" }]}
            >
              <Input placeholder="you@example.com or you" size="large" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                size="large"
              >
                Gửi yêu cầu
              </Button>
            </Form.Item>

            <div className="fp-actions">
              <Link to="/login" className="fp-link">
                Quay lại đăng nhập
              </Link>
              <Link to="/register" className="fp-link">
                Đăng ký tài khoản
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
