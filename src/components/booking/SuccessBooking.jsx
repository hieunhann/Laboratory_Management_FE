import React from "react";
import "./SuccessBooking.css";
import { useSearchParams, useNavigate } from "react-router-dom";
import packageIcon from "../../assets/icon/SVG_margin.svg";
import locationIcon from "../../assets/icon/Location.svg";
import calendarIcon from "../../assets/icon/Calender.svg";
import clockIcon from "../../assets/icon/Clock.svg";

export default function SuccessBooking({
  paymentResult,
  selectedItems,
  selectedDateTime,
  onNewBooking,
  bookingData, // Thêm prop để nhận dữ liệu từ API
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const Amount = Number(searchParams.get("Amount")) || 0;
  // Sử dụng dữ liệu từ API nếu có, nếu không dùng dữ liệu mặc định
  const orderCode =
    bookingData?.bookingCode || paymentResult?.orderCode || "XN2025010001";
  const formattedTotal = (price) => price.toLocaleString("vi-VN") + "đ";

  // Lấy tên gói/test từ API
  const pkgName = bookingData?.bundleId
    ? bookingData.testInfo?.bundleName ||
      bookingData.testInfo?.name ||
      "Gói xét nghiệm"
    : bookingData?.testCatalogs
    ? bookingData.testInfo?.map((t, i) => (
        <div style={{ marginTop: "10px" }} key={i}>
          <strong>{t.description || t.testName || "Test"}</strong>{" "}
          <span style={{ color: "gray" }}>({t.catalogName || ""})</span>
        </div>
      ))
    : selectedItems?.package?.name || "Xét nghiệm tổng quát";

  // Thông tin khách hàng từ API
  const fullName = bookingData?.patientName || "—";
  const email = bookingData?.patientEmail || "—";
  const phone = bookingData?.patientPhoneNumber || "—";

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const handleNew = () => {
    if (typeof onNewBooking === "function") {
      onNewBooking();
      return;
    }
  };

  return (
    <div className="sb-page">
      <div className="sb-inner">
        <div className="sb-top">
          <div className="sb-check">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#E6FFF0" />
              <path
                d="M7 12.5l2.5 2.5L17 8"
                stroke="#0FAC5A"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="sb-title">Thanh Toán thành công!</h1>
          <p className="sb-desc">
            Cảm ơn bạn đã đặt lịch. Chúng tôi đã gửi xác nhận đến email của bạn.
          </p>
        </div>

        <div className="sb-content">
          <div className="sb-receipt">
            <div className="sb-receipt-top">
              <div className="sb-code">
                Mã đặt lịch <br />{" "}
                <span className="sb-code-val">{orderCode}</span>
              </div>
              <div className="sb-code">
                Tổng Thanh Toán <br />
                <span className="sb-total">{formattedTotal(Amount)}</span>
              </div>
            </div>

            <div className="sb-receipt-body">
              <div className="sb-row">
                <div className="sb-icon">
                  {/* icon list */}
                  <img src={packageIcon} alt="Gói xét nghiệm" />
                </div>
                <div className="sb-text">
                  <div className="sb-label">Gói xét nghiệm</div>
                  <div className="sb-value">{pkgName}</div>
                </div>
              </div>

              <div className="sb-row">
                <div className="sb-icon">
                  <img src={locationIcon} alt="Địa điểm" />
                </div>
                <div className="sb-text">
                  <div className="sb-label">Địa điểm</div>
                  <div className="sb-value">
                    Phòng khám Xét nghiệm Y tế
                    <br />
                    <span className="sb-value-1">
                      123 Nguyễn Huệ, Q.1, TP.HCM
                    </span>
                  </div>
                </div>
              </div>

              <div className="sb-row">
                <div className="sb-icon">
                  <img src={calendarIcon} alt="Ngày khám" />
                </div>
                <div className="sb-text">
                  <div className="sb-label">Ngày khám</div>
                  <div className="sb-value">
                    {formatDate(
                      bookingData?.slotInfo?.appointmentDate ||
                        selectedDateTime?.date
                    )}
                  </div>
                </div>
              </div>

              <div className="sb-row">
                <div className="sb-icon">
                  <img src={clockIcon} alt="Giờ khám" />
                </div>
                <div className="sb-text">
                  <div className="sb-label">Giờ khám</div>
                  <div className="sb-value">
                    {bookingData?.slotInfo?.timeBlock ||
                      selectedDateTime?.time ||
                      "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sb-customer">
            <div className="sb-cust-title">Thông tin khách hàng</div>
            <div className="sb-cust-grid">
              <div>
                <div className="c-l">Họ và tên</div>
                <div className="c-v">{fullName}</div>
              </div>
              <div>
                <div className="c-l">Email</div>
                <div className="c-v">{email}</div>
              </div>
              <div>
                <div className="c-l">Số điện thoại</div>
                <div className="c-v">{phone}</div>
              </div>
            </div>
          </div>

          <div className="sb-note">
            <div className="sb-note-title">Lưu ý quan trọng</div>
            <ul>
              <li>Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục.</li>
              <li>Nhịn ăn 8-12 tiếng trước khi xét nghiệm nếu cần.</li>
              <li>Mang theo CMND/CCCD và in/gửi vé khi đến khám.</li>
              <li>Kết quả xét nghiệm sẽ có sau 24-48 giờ (tùy dịch vụ).</li>
            </ul>
          </div>

          <div className="sb-actions">
            <button className="btn outline" onClick={() => navigate("/")}>
              Trở về trang chủ
            </button>
            <button className="btn outline">Tải xuống xác nhận</button>
            <button className="btn outline">Gửi lại email</button>

            <button className="btn primary" onClick={handleNew}>
              Đặt lịch mới
            </button>
          </div>

          <div className="sb-help">
            Cần hỗ trợ? Liên hệ hotline: <strong>1900 1234</strong> hoặc email:{" "}
            <strong>support@xetnghiem.vn</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
