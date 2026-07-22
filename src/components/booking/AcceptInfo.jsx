import "./AcceptInfo.css";
import React, { useState, useEffect } from "react";
import { CiCalendar } from "react-icons/ci";
import { IoMdTime } from "react-icons/io";
import { HiOutlineLocationMarker, HiOutlineTicket } from "react-icons/hi";
import { FiTag, FiX } from "react-icons/fi";
import api from "../../configs/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { formatDate1 } from "../../utils/formatDate";
import { setAuthToken } from "../../utils/auth";
import VoucherAPI from "../../apis/VoucherAPI";
import SvgMarginIcon from "../../assets/icon/SVG_margin.svg";

const endPoint = "testorder/api/bookings";

function AcceptInfo({
  selectedItems,
  selectedDateTime,
  onBack,
  onProceed,
  selectedPatient,
}) {
  // selectedItems: { source:'package', package: {...}, total } OR { source:'catalog', items:[{name,price}], total }
  
  // Voucher States
  const [useVoucher, setUseVoucher] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [appliedCode, setAppliedCode] = useState("");

  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { code, discountAmount, finalAmount }
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  let headerTitle = "Xét nghiệm đã chọn";
  let itemList = [];
  let total = 0;

  if (!selectedItems) {
    itemList = [];
    total = 0;
  } else if (selectedItems.source === "package") {
    const pkg = selectedItems.package || null;
    headerTitle = pkg ? pkg.title : headerTitle;
    if (pkg && Array.isArray(pkg.includes)) {
      const first = pkg.includes[0];
      if (typeof first === "object" && first !== null) {
        itemList = pkg.includes.map((obj) => ({
          testName: obj.testName || obj.name || "Không rõ",
          price: obj.price || null,
          description: obj.description || "",
        }));
      } else if (typeof first === "number") {
        itemList = pkg.includes.map((id) => ({
          testName: `Catalog ID: ${id}`,
          price: null,
          description: "",
        }));
      } else {
        itemList = pkg.includes.map((testName) => ({ testName, price: null }));
      }
    } else {
      itemList = [];
    }

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
  const finalTotalAmount = Math.max(0, total - appliedDiscount);
  const formattedFinalTotal = finalTotalAmount.toLocaleString("vi-VN") + "₫";

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

  // Toggle Voucher box and fetch list
  const handleToggleVoucher = async (checked) => {
    setUseVoucher(checked);
    if (checked && vouchers.length === 0) {
      try {
        setLoadingVouchers(true);
        const data = await VoucherAPI.getAllVouchers(1, 100);
        const now = new Date();
        const validVouchers = (data || []).filter((v) => {
          if (!v.isActive) return false;
          if (v.expiryDate && new Date(v.expiryDate) < now) return false;
          if (v.startDate && new Date(v.startDate) > now) return false;
          if (v.usageLimit && (v.usageCount || 0) >= v.usageLimit) return false;
          return true;
        });
        setVouchers(validVouchers);
      } catch (err) {
        console.error("Lỗi tải danh sách voucher:", err);
      } finally {
        setLoadingVouchers(false);
      }
    }
    if (!checked) {
      setSelectedVoucher(null);
      setAppliedDiscount(0);
      setVoucherMessage("");
      setAppliedCode("");
      setManualCode("");
    }
  };

  const fixEncoding = (msg) => {
    if (!msg) return "";
    if (
      msg.includes("thnh") ||
      msg.includes("Thnh") ||
      msg.includes("cng") ||
      msg.includes("\uFFFD")
    ) {
      return "Áp dụng voucher thành công!";
    }
    return msg;
  };

  const calculateDiscount = (voucher, totalAmount, resDiscount) => {
    if (typeof resDiscount === "number" && resDiscount > 0) {
      return resDiscount;
    }
    if (!voucher) return 0;
    const type = voucher.discountType || voucher.DiscountType;
    const val = voucher.discountValue || voucher.DiscountValue || 0;
    const maxDisc = voucher.maxDiscountAmount || voucher.MaxDiscountAmount;
    if (type === 1) {
      // Percentage
      let computed = (totalAmount * val) / 100;
      if (maxDisc && computed > maxDisc) computed = maxDisc;
      return Math.min(computed, totalAmount);
    } else if (type === 2) {
      // Fixed amount
      return Math.min(val, totalAmount);
    }
    return 0;
  };

  // Apply Voucher Code
  const applyVoucherCode = async (codeToApply, voucherObj = null) => {
    if (!codeToApply || codeToApply.trim() === "") {
      toast.warning("Vui lòng nhập hoặc chọn mã voucher!");
      return;
    }
    const cleanCode = codeToApply.trim().toUpperCase();
    try {
      const res = await VoucherAPI.validateVoucher(cleanCode, total);
      const isOK = res?.isValid ?? res?.IsValid ?? false;
      if (isOK) {
        const matchedVoucher =
          voucherObj ||
          vouchers.find((v) => v.code?.toUpperCase() === cleanCode);
        const discountVal = calculateDiscount(
          matchedVoucher,
          total,
          res?.discountAmount ?? res?.DiscountAmount
        );
        setAppliedDiscount(discountVal);
        const rawMsg = res?.message || res?.Message;
        const cleanMsg = fixEncoding(rawMsg) || "Áp dụng voucher thành công!";
        setVoucherMessage(cleanMsg);
        setAppliedCode(cleanCode);
        setSelectedVoucher(matchedVoucher || { code: cleanCode });
        toast.success(
          `Áp dụng mã ${cleanCode} thành công! Giảm ${discountVal.toLocaleString(
            "vi-VN"
          )}₫`
        );
      } else {
        setAppliedDiscount(0);
        const rawMsg = res?.message || res?.Message;
        const errMsg = fixEncoding(rawMsg) || "Mã voucher không hợp lệ.";
        setVoucherMessage(errMsg);
        setAppliedCode("");
        setSelectedVoucher(null);
        toast.error(errMsg);
      }
    } catch (err) {
      console.error("Error applying voucher:", err);
      toast.error("Không thể xác thực voucher.");
    }
  };

  // Select Voucher from list
  const handleSelectVoucher = (v) => {
    if (selectedVoucher?.code === v.code) {
      setSelectedVoucher(null);
      setAppliedDiscount(0);
      setVoucherMessage("");
      setAppliedCode("");
      setManualCode("");
    } else {
      setManualCode(v.code);
      applyVoucherCode(v.code, v);
    }
  };

  // Format giờ: HH:mm:ss
  const formatTimeBlock = (timeStr) => {
    if (!timeStr) return "";
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr + ":00";
    return timeStr;
  };

  // Lấy bundleId và catalogs
  const source = selectedItems?.source || null;
  const bundleId =
    source === "package" ? selectedItems?.package?.bundleId ?? 0 : 0;

  const catalogs =
    source === "catalog"
      ? (selectedItems?.items || []).map((it) => it.catalogId)
      : selectedItems?.package && Array.isArray(selectedItems.package.includes)
      ? selectedItems.package.includes.map((it) =>
          typeof it === "object" && it !== null ? it.catalogId : it
        )
      : [];

  const slotDTO = {
    appointmentDate: formatDate1(selectedDateTime?.date),
    timeBlock: formatTimeBlock(selectedDateTime?.time),
  };

  const { patientId, fullName, phone, email } = selectedPatient || {};

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setVoucherError("Vui lòng nhập mã voucher.");
      return;
    }
    setIsValidatingVoucher(true);
    setVoucherError("");
    try {
      const response = await api.post("testorder/api/vouchers/validate", {
        code: code,
        orderValue: total,
      });
      const data = response.data;
      if (data && data.isValid) {
        setAppliedVoucher({
          code: code,
          discountAmount: data.discountAmount || 0,
          finalAmount: data.finalAmount ?? (total - (data.discountAmount || 0)),
        });
        toast.success(data.message || "Áp dụng voucher thành công!");
      } else {
        setVoucherError(data?.message || "Mã voucher không hợp lệ.");
        setAppliedVoucher(null);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Mã voucher không hợp lệ hoặc đã hết hạn.";
      setVoucherError(typeof errorMsg === "string" ? errorMsg : "Voucher không hợp lệ.");
      setAppliedVoucher(null);
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError("");
  };

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
        voucherCode: appliedCode || (appliedVoucher ? appliedVoucher.code : undefined),
        slotDTO: slotDTO,
      });
      if (response.status >= 200 && response.status < 300) {
        toast.success(
          "Đặt lịch thành công, vui lòng thanh toán sau khi đặt lịch"
        );
        const payloadData = response?.data?.data || response?.data;
        const newBookingId =
          payloadData?.bookingId || payloadData?.instancesCode || payloadData || "";
        if (onProceed) onProceed(newBookingId, finalTotalAmount);
      }
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

  let catalogIdsStr = "";
  if (selectedItems && source === "package") {
    const pkg = selectedItems.package;
    if (pkg && Array.isArray(pkg.includes)) {
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
                <img src={SvgMarginIcon} alt="icon" />
                <span className="item-name">
                  {it.name || it.testName || "Không rõ"}
                </span>
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

      {/* VOUCHER SECTION */}
      <div className="card voucher-card">
        <div className="voucher-header">
          <div className="voucher-title-group">
            <HiOutlineTicket className="voucher-header-icon" />
            <span className="voucher-card-title">Mã giảm giá / Voucher</span>
          </div>
          <label className="voucher-checkbox-label">
            <input
              type="checkbox"
              checked={useVoucher}
              onChange={(e) => handleToggleVoucher(e.target.checked)}
            />
            <span>Sử dụng Voucher</span>
          </label>
        </div>

        {useVoucher && (
          <div className="voucher-body">
            <div className="voucher-input-group">
              <input
                type="text"
                placeholder="Nhập mã Voucher..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyVoucherCode(manualCode);
                }}
              />
              <button
                type="button"
                className="btn-apply-voucher"
                onClick={() => applyVoucherCode(manualCode)}
              >
                Áp dụng
              </button>
            </div>

            {voucherMessage && (
              <div
                className={`voucher-alert-msg ${
                  appliedCode ? "success" : "error"
                }`}
              >
                {voucherMessage}
              </div>
            )}

            <div className="voucher-list-heading">Voucher dành cho bạn:</div>

            {loadingVouchers ? (
              <div className="voucher-loading">Đang tải danh sách Voucher...</div>
            ) : vouchers.length === 0 ? (
              <div className="voucher-empty-msg">
                Bạn chưa có voucher nào khả dụng.
              </div>
            ) : (
              <div className="voucher-list">
                {vouchers.map((v) => {
                  const isSelected = selectedVoucher?.code === v.code;
                  const remaining = v.usageLimit
                    ? Math.max(0, v.usageLimit - (v.usageCount || 0))
                    : null;
                  const desc =
                    v.discountType === 1
                      ? `Giảm ${v.discountValue}%${
                          v.maxDiscountAmount
                            ? ` (Tối đa ${v.maxDiscountAmount.toLocaleString(
                                "vi-VN"
                              )}₫)`
                            : ""
                        }`
                      : `Giảm ${v.discountValue.toLocaleString("vi-VN")}₫`;

                  return (
                    <div
                      key={v.voucherId || v.code}
                      className={`voucher-item-box ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectVoucher(v)}
                    >
                      <div className="voucher-item-left">
                        <div className="voucher-code-tag">{v.code}</div>
                        <div className="voucher-item-desc">{desc}</div>
                        {v.minOrderValue && (
                          <div className="voucher-item-condition">
                            Đơn tối thiểu: {v.minOrderValue.toLocaleString("vi-VN")}₫
                          </div>
                        )}
                        <div className="voucher-item-qty">
                          Số lượng có sẵn:{" "}
                          <strong>
                            {remaining !== null ? `${remaining} lượt` : "Không giới hạn"}
                          </strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn-voucher-action ${isSelected ? "active" : ""}`}
                      >
                        {isSelected ? "Đã áp dụng" : "Dùng mã"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chi tiết chi phí thanh toán */}
      <div className="billing-summary-card">
        <div className="billing-card-header">
          <span className="billing-title">Chi tiết thanh toán</span>
        </div>
        <div className="billing-card-body">
          <div className="billing-row">
            <span className="billing-label">Tạm tính dịch vụ</span>
            <span className="billing-value">{formattedTotal}</span>
          </div>

          {appliedDiscount > 0 && (
            <div className="billing-row discount-row">
              <span className="billing-label">
                <span className="voucher-badge-inline">VOUCHER</span> {appliedCode}
              </span>
              <span className="billing-value discount-text">
                -{appliedDiscount.toLocaleString("vi-VN")}₫
              </span>
            </div>
          )}

          <div className="billing-row">
            <span className="billing-label">Phí dịch vụ & Khám</span>
            <span className="billing-value free-text">Miễn phí</span>
          </div>

          <div className="billing-divider"></div>

          <div className="billing-row total-row">
            <div className="total-label-group">
              <span className="total-title">Tổng thanh toán</span>
              <span className="total-subtext">Đã bao gồm thuế và các khoản ưu đãi</span>
            </div>
            <div className="total-price-group">
              {appliedDiscount > 0 && (
                <span className="original-price-strike">{formattedTotal}</span>
              )}
              <span className="final-price">{formattedFinalTotal}</span>
            </div>
          </div>
        </div>
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


