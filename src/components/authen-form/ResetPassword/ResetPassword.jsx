import React from "react";
import { Card, Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import { useResetPassword } from "../../../services/IAMService.jsx";
import { setAuthToken } from "../../../utils/auth";
import "./ResetPassword.css";

const ResetPassword = () => {
  const accessToken = localStorage.getItem("accessToken");
  setAuthToken(accessToken);

  const { onFinish, loading, token } = useResetPassword();

  return (
    <div className="rp-container">
      <div className="rp-card-wrapper">
        <Card title="Đặt lại mật khẩu" className="rp-card">
          {!token ? (
            <div className="rp-no-token">
              <p>Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn</p>
              <Link to="/forgot-password">
                Yêu cầu gửi lại email đặt lại mật khẩu
              </Link>
            </div>
          ) : (
            <>
              <p className="rp-subtitle">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>
              <Form name="reset" layout="vertical" onFinish={onFinish}>
                <Form.Item
                  name="password"
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu mới" },
                    { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                  ]}
                >
                  <Input.Password placeholder="Mật khẩu mới" size="large" />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label="Xác nhận mật khẩu"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Mật khẩu xác nhận không khớp")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Xác nhận mật khẩu"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                  >
                    Đặt lại mật khẩu
                  </Button>
                </Form.Item>

                <div className="rp-actions">
                  <Link to="/login" className="rp-link">
                    Quay lại đăng nhập
                  </Link>
                </div>
              </Form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
