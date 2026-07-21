import "./AcceptInfo.css";
import React, { useEffect } from "react";
import { CiCalendar } from "react-icons/ci";
import { IoMdTime } from "react-icons/io";
import { HiOutlineLocationMarker } from "react-icons/hi";
import api from "../../configs/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { formatDate1 } from "../../utils/formatDate";
import { setAuthToken } from "../../utils/auth";
// import { toast } from "react-toastify";

const endPoint = "testorder/api/bookings";

function AcceptInfo({
  selectedItems,
  selectedDateTime,
  onBack,
  onProceed,
  selectedPatient,
}) {
  // selectedItems: { source:'package', package: {...}, total } OR { source:'catalog', items:[{name,price}], total }
  // Không cần dispatch nữa vì không fetch patient

  let headerTitle = "Xét nghiệm đã chọn";
  let itemList = [];
  let total = 0;

  if (!selectedItems) {
    itemList = [];
    total = 0;
  } else if (selectedItems.source === "package") {
    const pkg = selectedItems.package || null;
    headerTitle = pkg ? pkg.title : headerTitle;
    selectedPatient;
    // pkg.includes có thể là mảng object (catalog) hoặc mảng id
    if (pkg && Array.isArray(pkg.includes)) {
      const first = pkg.includes[0];
      if (typeof first === "object" && first !== null) {
        // includes là mảng object (catalog) - dữ liệu đã đầy đủ
        itemList = pkg.includes.map((obj) => ({
          testName: obj.testName || obj.name || "Không rõ",
          price: obj.price || null,
          description: obj.description || "",
        }));
      } else if (typeof first === "number") {
        // includes là mảng id (số) - chỉ hiển thị id, không có thông tin chi tiết
        itemList = pkg.includes.map((id) => ({
          testName: `Catalog ID: ${id}`,
          price: null,
          description: "",
        }));
      } else {
        // includes là tên chuỗi
        itemList = pkg.includes.map((testName) => ({ testName, price: null }));
      }
    } else {
      itemList = [];
    }

    // tổng ưu tiên dùng selectedItems.total, fallback tính từ includes nếu là objects
    if (
      typeof selectedItems.total === "number" &&
      !Number.isNaN(selectedItems.total)
    ) {
      total = selectedItems.total;
    } else if (
      pkg &&
      Array.isArray(pkg.includes) &&
      typeof pkg.includes[0] === "object" &&
      pkg.includes[0] !== null
    ) {
      // Tính tổng từ includes nếu là objects
      total = pkg.includes.reduce((s, obj) => {
        return s + (obj && typeof obj.price === "number" ? obj.price : 0);
      }, 0);
    } else {
      total =
        selectedItems.total || (typeof pkg?.price === "number" ? pkg.price : 0);
    }
  } else if (selectedItems.source === "catalog") {
    itemList = selectedItems.items || [];
    total =
      selectedItems.total || itemList.reduce((s, it) => s + (it.price || 0), 0);
  }

  const formattedTotal = total ? total.toLocaleString("vi-VN") + "₫" : "0₫";
  const formatDateLabel = (isoDate) => {
    if (!isoDate) return "";
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoDate;
    }
  };

  const token = localStorage.getItem("accessToken");
  const decode = jwtDecode(token);

  // Format giờ: HH:mm:ss
  const formatTimeBlock = (timeStr) => {
    // Nếu đã có dạng HH:mm:ss thì giữ nguyên, nếu HH:mm thì thêm :00
    if (!timeStr) return "";
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr + ":00";
    return timeStr;
  };

  // Lấy bundleId và catalogs
  const source = selectedItems?.source || null;
  const bundleId =
    source === "package" ? selectedItems?.package?.bundleId ?? 0 : 0; // nếu chọn catalog thì luôn là 0

  const catalogs =
    source === "catalog"
      ? (selectedItems?.items || []).map((it) => it.catalogId)
      : selectedItems?.package && Array.isArray(selectedItems.package.includes)
      ? selectedItems.package.includes.map((it) =>
          typeof it === "object" && it !== null ? it.catalogId : it
        )
      : [];

  // Lấy thông tin slotDTO
  const slotDTO = {
    appointmentDate: formatDate1(selectedDateTime?.date),
    timeBlock: formatTimeBlock(selectedDateTime?.time),
  };

  // Lấy thông tin bệnh nhân từ props (bắt buộc phải truyền từ Booking.jsx)
  const { patientId, fullName, phone, email } = selectedPatient || {};

  const handleBooking = async () => {
    if (!patientId || !fullName || !phone || !email) {
      alert("Vui lòng cập nhật đầy đủ thông tin cá nhân trước khi đặt lịch!");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const response = await api.post(endPoint, {
        patientId: patientId,
        patientPhoneNumber: phone,
        patientName: fullName,
        patientEmail: email,
        createdBy: decode.sub,
        bundleId: bundleId > 0 ? bundleId : 0,
        catalogs: bundleId > 0 ? [] : catalogs,
        slotDTO: slotDTO,
      });
      if (response.status >= 200 && response.status < 300) {
        toast.success(
          "Đặt lịch thành công, vui lòng thanh toán sau khi đặt lịch"
        );
        // Lấy bookingId từ response (API có thể trả response.data.bookingId hoặc response.data)
        const payloadData = response?.data?.data || response?.data;
        const newBookingId = payloadData?.bookingId || payloadData?.instancesCode || payloadData || "";
        // Gọi onProceed và truyền bookingId ngay (không đợi state update)
        if (onProceed) onProceed(newBookingId);
      }
      // setBookingId(response.data.bookingId);
    } catch (error) {
      if (error.response) {
        toast.error(
          "Lỗi API: " + (error.response.data?.message || "Không rõ nguyên nhân")
        );
      } else {
        toast.error("Lỗi kết nối API!");
      }
    }
  };

  // Lấy danh sách catalogId nếu là package
  let catalogIdsStr = "";
  if (selectedItems && source === "package") {
    const pkg = selectedItems.package;
    if (pkg && Array.isArray(pkg.includes)) {
      // includes có thể là array of id hoặc array of object
      const ids = pkg.includes.map((it) =>
        typeof it === "object" && it !== null ? it.catalogId : it
      );
      catalogIdsStr = ids.filter(Boolean).join(",");
    }
  }

  return (
    <div className="accept-info">
      <h2>Xác nhận thông tin</h2>
      <p className="accept-sub">
        Vui lòng kiểm tra lại thông tin trước khi thanh toán
      </p>

      <div className="card">
        <div className="card-title">{headerTitle}</div>
        <ul className="selected-list">
          {itemList.map((it, idx) => (
            <li key={idx} className="selected-item">
              <div className="item-left">
                <img src="src/assets/icon/SVG_margin.svg" />
                <span className="item-name">
                  {it.name || it.testName || "Không rõ"}
                </span>
                {/* Nếu muốn hiển thị mô tả */}
                {it.description && (
                  <span
                    className="item-desc"
                    style={{
                      color: "#888",
                      fontSize: 12,
                      marginLeft: 8,
                    }}
                  >
                    {it.description}
                  </span>
                )}
              </div>
              <div className="item-price">
                {source === "catalog" && it.price
                  ? it.price.toLocaleString("vi-VN") + "₫"
                  : ""}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="card-title">Địa điểm và thời gian</div>
        <div className="location">
          <div className="location-main">
            <HiOutlineLocationMarker className="loc-icon" />
            <div>
              <div className="loc-title">Phòng khám Xét nghiệm Y tế</div>
              <div className="location-sub">123 Nguyễn Huệ, Quận 1, TP.HCM</div>
            </div>
          </div>
          <div className="location-time">
            {selectedDateTime ? (
              <>
                <div className="time-row">
                  <CiCalendar className="time-icon" />
                  <div className="loc-title">Ngày khám</div>
                </div>
                <div className="value">
                  {" "}
                  {formatDateLabel(selectedDateTime.date)}
                </div>

                <div className="time-row">
                  <IoMdTime className="time-icon" />
                  <div className="loc-title">Giờ khám</div>
                </div>
                <div className="value">Giờ: {selectedDateTime.time}</div>
              </>
            ) : (
              <div className="no-dt">Chưa chọn ngày giờ</div>
            )}
          </div>
        </div>
      </div>

      <div className="card total-card">
        <div>
          <div className="total-label">Tổng chi phí</div>
          <div className="total-sub">Tạm tính</div>
        </div>
        <div className="total-amount">{formattedTotal}</div>
      </div>

      <div className="note-card">
        <div className="note-title">Lưu ý quan trọng</div>
        <ul>
          <li>Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục.</li>
          <li>
            Nhịn ăn 8-12 tiếng trước khi xét nghiệm (nếu cần theo hướng dẫn).
          </li>
          <li>Mang theo CMND/CCCD khi đến làm thủ thuật.</li>
          {catalogIdsStr && (
            <li>
              <strong>Danh sách catalogId trong gói:</strong> {catalogIdsStr}
            </li>
          )}
        </ul>
      </div>

      <div className="accept-actions">
        <button className="btn-back" onClick={() => onBack && onBack()}>
          Quay lại
        </button>
        <button className="btn-proceed" onClick={handleBooking}>
          Tiếp tục thanh toán
        </button>
      </div>
    </div>
  );
}

export default AcceptInfo;
// Không cần sửa gì thêm, đã lấy đúng dữ liệu từ selectedItems
