import React from "react";
import { Modal, Form, Input, Button } from "antd";
import { useChangePassword } from "../../services/IAMService.jsx";

const ChangePasswordModal = ({
  open: propOpen = false,
  onClose: propOnClose = () => {},
}) => {
  // pass props into hook so hook knows open/onClose from parent
  const { handleSubmit, loading, passwordPattern, onClose, open, form } =
    useChangePassword({ open: propOpen, onClose: propOnClose });

  return (
    <Modal
      title="Đổi mật khẩu"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      className="cp-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Mật khẩu cũ"
          name="oldPassword"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
        >
          <Input.Password placeholder="Mật khẩu cũ" size="large" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới" },
            {
              validator: (_, value) => {
                if (!value) return Promise.reject();
                return passwordPattern.test(value)
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                      )
                    );
              },
            },
          ]}
        >
          <Input.Password placeholder="Mật khẩu mới" size="large" />
        </Form.Item>
        <div className="cp-password-hint">
          Mật khẩu cần tối thiểu 8 ký tự và phải bao gồm chữ hoa, chữ thường,
          chữ số và ký tự đặc biệt.
        </div>

        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp")
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="Xác nhận mật khẩu mới" size="large" />
        </Form.Item>

        <Form.Item>
          <div className="cp-actions">
            <Button
              onClick={() => {
                form.resetFields();
                onClose();
              }}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
