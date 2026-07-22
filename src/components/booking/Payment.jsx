import React, { useState } from "react";
import { useSelector } from "react-redux";
import "./Payment.css";
import { bookingService } from "../../services/TestOrderService.jsx";
// import api from "../../configs/axios";
// import { toast } from "react-toastify";

export default function Payment({
  selectedItems,
  selectedDateTime,
  bookingId,
  selectedPatient,
  onBack,
  onFinish,
}) {
  const [form, setForm] = useState({
    fullName: "Tuấn Lê",
    email: "email@example.com",
    phone: "0123321132",
    paymentMethod: "VnPay",
  });

  // modal state moved into Payment
  const [showWarningModal, setShowWarningModal] = useState(false);

  const { fullName, phone, email } = selectedPatient;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProceed = (e) => {
    // ensure no form submit
    if (e && e.preventDefault) e.preventDefault();
    // show modal inside Payment; when modal confirmed, call parent onConfirm (or fallback)
    setShowWarningModal(true);
  };

  const handleModalCancel = () => setShowWarningModal(false);
  const amount = selectedItems?.total;
  const handleModalConfirm = async () => {
    setShowWarningModal(false);

    const extractedBookingId = typeof bookingId === 'object' ? (bookingId?.instancesCode || bookingId?.id || bookingId?.bookingId) : bookingId;

    if (!extractedBookingId || !amount) {
      console.error("Missing bookingId or amount to create VNPAY URL", { extractedBookingId, amount, bookingId });
      return;
    }

    try {
      const res = await bookingService.createVnPayUrl(
        extractedBookingId,
        amount
      );
      // Lấy URL từ nhiều khả năng trả về
      const url =
        typeof res === "string"
          ? res
          : res?.data?.url || res?.data?.paymentUrl || res?.data;

      if (typeof url === "string") {
        window.location.assign(url);
      } else {
        console.error("Invalid VNPAY URL response:", res);
      }
    } catch (err) {
      console.error("Failed to create VNPAY URL:", err);
    }
  };

  return (
    <div className="payment-container">
      <h2 className="payment-title">Thanh toán</h2>
      <p className="payment-sub">
        Hoàn tất thông tin và thanh toán để xác nhận lịch hẹn
      </p>

      <div className="payment-layout">
        {/* LEFT COLUMN */}
        <div className="payment-left">
          {/* Thông tin cá nhân */}
          <div className="card info-card">
            <h3>Thông tin cá nhân</h3>
            <div className="form-grid">
              <label>
                Họ và tên<span>*</span>
                <input
                  name="fullName"
                  value={fullName}
                  onChange={handleChange}
                />
              </label>
              <div className="info-card-1">
                <label>
                  Email<span>*</span>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Số điện thoại<span>*</span>
                  <input name="phone" value={phone} onChange={handleChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="card method-card">
            <h3>Phương thức thanh toán</h3>
            <div className="payment-methods">
              <label className="method-item">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit"
                  checked={form.paymentMethod === "credit"}
                  onChange={handleChange}
                />
                <img src="src\\assets\\icon\\ATM.svg" />
                <span>Thẻ Visa</span>
              </label>

              <label className="method-item">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VnPay"
                  checked={form.paymentMethod === "VnPay"}
                  onChange={handleChange}
                />
                <img src="src\\assets\\icon\\Momo.svg" />
                <span>VnPay</span>
              </label>

              <label className="method-item">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={form.paymentMethod === "momo"}
                  onChange={handleChange}
                />
                <img src="src\\assets\\icon\\bank.svg" />
                <span>Ví Momo</span>
              </label>
            </div>

            {/* Thông tin thẻ */}
            {form.paymentMethod === "credit" && (
              <div className="card-inputs">
                <label>
                  Số thẻ<span>*</span>
                  <input
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={form.cardNumber}
                    onChange={handleChange}
                  />
                </label>
                <div className="small-row">
                  <label>
                    Ngày hết hạn<span>*</span>
                    <input
                      name="exp"
                      placeholder="MM/YY"
                      value={form.exp}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    CVV<span>*</span>
                    <input
                      name="cvv"
                      placeholder="123"
                      value={form.cvv}
                      onChange={handleChange}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {onBack && (
            <button type="button" className="btn-back" onClick={onBack}>
              Quay lại
            </button>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="payment-right">
          <div className="card summary-card">
            <h3>Tóm tắt đơn hàng</h3>
            <div className="summary-line">
              <span>Gói xét nghiệm:</span>
              <strong>
                {/* Hiển thị tên gói nếu có, nếu không thì liệt kê các xét nghiệm đơn lẻ */}
                {selectedItems?.source === "package"
                  ? selectedItems?.package?.bundleName ||
                    selectedItems?.package?.title ||
                    "Gói không rõ tên"
                  : selectedItems?.source === "catalog" &&
                    Array.isArray(selectedItems.items)
                  ? selectedItems.items.map((item) => item.testName).join(", ")
                  : "Xét nghiệm tổng quát"}
              </strong>
            </div>
            <div className="summary-line">
              <span>Địa điểm:</span>
              <strong>Phòng khám Xét nghiệm Y tế</strong>
            </div>
            <div className="summary-line">
              <span>Ngày:</span>
              <strong>
                {selectedDateTime?.date
                  ? new Date(selectedDateTime.date).toLocaleDateString(
                      "vi-VN",
                      {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )
                  : "Thứ 6, 17/10/2025"}
              </strong>
            </div>
            <div className="summary-line">
              <span>Giờ:</span>
              <strong>{selectedDateTime?.time || "08:00"}</strong>
            </div>

            <hr />

            <div className="summary-line">
              <span>Tạm tính:</span>
              <span>
                {(selectedItems?.total || 300000).toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="summary-line">
              <span>Phí dịch vụ:</span>
              <span>0đ</span>
            </div>

            <div className="summary-total">
              <strong>Tổng cộng:</strong>
              <strong className="price-total">
                {(selectedItems?.total || 300000).toLocaleString("vi-VN")}đ
              </strong>
            </div>

            {/* ensure button is explicit non-submit and identifiable by fallback listener */}
            <button
              type="button"
              className="btn-confirm"
              data-action="confirm-payment"
              onClick={handleProceed}
            >
              Xác nhận thanh toán
            </button>

            <p className="secure-note">
              Thông tin của bạn được bảo mật và mã hóa theo tiêu chuẩn quốc tế
            </p>
          </div>
        </div>
      </div>

      {/* Modal warning / confirmation now rendered inside Payment */}
      {showWarningModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-title">Chính sách hoàn tiền</div>
            <div className="modal-body-alert">
              <p>
                <strong>Lưu ý quan trọng:</strong>
              </p>
              <ul>
                <li id>
                  Thanh toán sẽ <strong>không được hoàn</strong> nếu hủy trong
                  vòng 24 giờ trước lịch hẹn.
                </li>
                <li>
                  Nếu lịch hẹn vào thứ 7 hoặc chủ nhật, sẽ không được hoàn tiền
                  khi hủy.
                </li>
              </ul>
              <p>Bạn có chắc chắn muốn tiếp tục thanh toán?</p>
            </div>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={handleModalCancel}>
                Hủy
              </button>
              <button
                className="btn-modal-confirm"
                onClick={handleModalConfirm}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
