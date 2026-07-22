import React, { useEffect, useState } from "react";
import { Pagination, Spin } from "antd";
import "./BookingHistory.css";
import api from "../../configs/axios";
import { formatDate, formatTime } from "../../utils/formatDate";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import TestOrderServiceAPI from "../../apis/TestOrderServiceAPI";
import { setAuthToken } from "../../utils/auth";

function BookingHistory() {
  const endPoint = "testorder/api/bookings/patient";
  const endPoint1 = "testorder/api/test-bundles";
  const endPointCatalog = "testorder/api/test-catalogs";

  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();
  const [BookingHistory, setBookingHistory] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings
  const [Package, setPackage] = useState({}); // map: bundleId -> package
  const [Catalogs, setCatalogs] = useState({}); // map: catalogId -> catalog
  const [Payments, SetPayments] = useState({}); // map: bookingId -> payment
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");
  const [patientId, setPatientId] = useState(patientIdFromUrl || null);
  const [noProfile, setNoProfile] = useState(false);

  // If patientId not in URL, fetch from patients/me
  useEffect(() => {
    if (patientIdFromUrl) {
      setPatientId(patientIdFromUrl);
      return;
    }
    const resolvePatientId = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) setAuthToken(token);
        const res = await api.get("patient/v1/patients/me");
        console.log("[BookingHistory] patients/me response:", JSON.stringify(res?.data, null, 2));
        const patient = res?.data?.data?.data || res?.data?.data || res?.data;
        const pid = patient?.patientId || patient?.id;
        console.log("[BookingHistory] resolved patientId:", pid);
        if (pid) {
          setPatientId(pid);
        } else {
          setNoProfile(true);
        }
      } catch (err) {
        console.error("[BookingHistory] patients/me error:", err);
        setNoProfile(true);
      }
    };
    resolvePatientId();
  }, [patientIdFromUrl]);

  // pagination & loading
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalRecords, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState(""); // "" means all statuses

  useEffect(() => {
    const fetchAPi = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (token) setAuthToken(token);

        // Build API URL with filters
        let apiUrl = `testorder/api/patients/${patientId}/bookings?pageNumber=${page}&pageSize=${pageSize}`;
        if (filterStatus) {
          apiUrl += `&filterStatus=${filterStatus}`;
        }

        const response = await api.get(apiUrl);
        const data = response?.data?.bookingResponses || response?.data?.data?.bookingResponses || response?.data?.items || response?.data?.data?.items || response?.data?.data || response?.data;
        if (response.status >= 200 && response.status < 300) {
          let allItems = [];
          if (Array.isArray(data)) {
            allItems = data;
          } else if (data?.items) {
            allItems = data.items;
          } else {
            allItems = data;
          }

          setAllBookings(allItems);
          // Get total from API response
          setTotal(response?.data?.totalRecords || response?.data?.data?.totalRecords || response?.data?.totalItems || response?.data?.data?.totalItems || allItems.length);
          setBookingHistory(allItems);

          // Build unique ids from all items
          const bundleIds = [
            ...new Set(allItems.map((i) => i.bundleId).filter(Boolean)),
          ];
          const catalogIds = [
            ...new Set(
              allItems
                .filter((i) => !i.bundleId && i.catalogId)
                .map((i) => i.catalogId)
            ),
          ];
          const bookingIds = [
            ...new Set(allItems.map((i) => i.bookingId).filter(Boolean)),
          ];

          // Fetch packages by bundleId in parallel
          if (bundleIds.length) {
            const token = localStorage.getItem("accessToken");
            if (token) setAuthToken(token);
            const pkgEntries = await Promise.all(
              bundleIds.map(async (id) => {
                try {
                  const r = await api.get(`${endPoint1}/${id}`);
                  if (r.status >= 200 && r.status < 300) return [id, r.data];
                } catch (error) {
                  console.log(error);
                }
                return [id, null];
              })
            );
            const pkgMap = Object.fromEntries(pkgEntries.filter(([, v]) => v));
            setPackage(pkgMap);
          } else {
            setPackage({});
          }

          // Fetch catalogs by catalogId in parallel
          if (catalogIds.length) {
            const token = localStorage.getItem("accessToken");
            if (token) setAuthToken(token);
            const catalogEntries = await Promise.all(
              catalogIds.map(async (id) => {
                try {
                  const r = await api.get(`${endPointCatalog}/${id}`);
                  if (r.status >= 200 && r.status < 300) return [id, r.data];
                } catch (error) {
                  console.log(error);
                }
                return [id, null];
              })
            );
            const catalogMap = Object.fromEntries(
              catalogEntries.filter(([, v]) => v)
            );
            setCatalogs(catalogMap);
          } else {
            setCatalogs({});
          }

          // Fetch payments by bookingId in parallel
          if (bookingIds.length) {
            const token = localStorage.getItem("accessToken");
            if (token) setAuthToken(token);
            const payEntries = await Promise.all(
              bookingIds.map(async (id) => {
                try {
                  const r = await api.get(
                    `testorder/api/bookings/${id}/payments`
                  );
                  if (r.status >= 200 && r.status < 300) {
                    console.log("data" + r);
                    return [id, r.data];
                  }
                } catch (error) {
                  // Nếu payment không tồn tại (400 BadRequest), có nghĩa là đang chờ thanh toán
                  console.log(error);
                  return [
                    id,
                    { status: "unpaid", method: "Chưa có", amount: 0 },
                  ];
                }
                return [id, { status: "unpaid", method: "Chưa có", amount: 0 }];
              })
            );
            const payMap = Object.fromEntries(payEntries);
            SetPayments(payMap);
          } else {
            SetPayments({});
          }
        }

        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error("Lỗi khi fetch API:", err);
      }
    };

    if (patientId) fetchAPi();
  }, [patientId, page, pageSize, filterStatus]);

  const toggle = (bookingCode) => {
    setExpanded((s) => ({ ...s, [bookingCode]: !s[bookingCode] }));
  };

  const statusLabel = (status) => {
    switch (String(status).toLowerCase()) {
      case "pending":
        return { text: "Chờ xác nhận", className: "badge-yellow" };
      case "confirmed":
        return { text: "Đã xác nhận", className: "badge-blue" };
      case "completed":
        return { text: "Hoàn thành", className: "badge-green" };
      case "cancelled":
        return { text: "Đã hủy", className: "badge-red" };
      default:
        return { text: status, className: "" };
    }
  };
  const paymentStatus = (status) => {
    switch (String(status).toLowerCase()) {
      case "pending":
        return { text: "Đang thanh toán", className: "badge-yellow" };
      case "completed":
        return { text: "Đã thanh toán", className: "badge-blue" };
      case "cancelled":
        return { text: "Đã hủy", className: "badge-red" };
      case "unpaid":
        return { text: "Chưa thanh toán", className: "badge-gray" };
      default:
        return { text: status, className: "" };
    }
  };

  const handlePay = async (bookingId, amount) => {
    try {
      if (!bookingId) return toast.error("Thiếu bookingId");
      if (!amount || amount <= 0)
        return toast.error("Không xác định được số tiền");
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const resp = await TestOrderServiceAPI.bookingService.createVnPayUrl(
        bookingId,
        amount
      );
      // Giả sử API trả về { data: { paymentUrl: "..." } } hoặc trực tiếp url
      const payUrl =
        resp?.data?.paymentUrl ||
        resp?.data?.url ||
        resp?.data?.vnpUrl ||
        resp?.data;
      if (typeof payUrl === "string") {
        window.location.href = payUrl;
      } else {
        toast.error("Không lấy được URL thanh toán");
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Tạo URL thanh toán thất bại");
    }
  };

  if (noProfile) {
    return (
      <div className="booking-history-page">
        <div className="booking-history-header">
          <h1>Lịch sử đặt lịch</h1>
          <p>Xem tất cả các lịch hẹn đã đặt</p>
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          gap: "16px",
          color: "#64748b"
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#475569" }}>
            Bạn chưa có lịch đặt nào
          </p>
          <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>
            Hãy đặt lịch xét nghiệm để theo dõi lịch sử tại đây.
          </p>
          <a
            href="/booking"
            style={{
              marginTop: "8px",
              padding: "10px 24px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "14px"
            }}
          >
            Đặt lịch ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-history-page">
      <div className="booking-history-header">
        <h1>Lịch sử đặt lịch</h1>
        <p>Xem tất cả các lịch hẹn đã đặt</p>
      </div>

      <div className="booking-filters">
        <div className="filters-title">
          <img src="src\assets\icon\Fillter.svg" alt="Filters" />
          <strong>Bộ lọc</strong>
        </div>
        <span style={{ color: "#737373", fontSize: "15px" }}>
          Lọc lịch hẹn theo ngày và trạng thái
        </span>
        <div className="filter-row">
          <div style={{ display: "flex", gap: "16px" }}>
            <div className="filter-item">
              <label htmlFor="from-date" className="filter-label">
                Từ ngày
              </label>
              <input type="date" id="from-date" className="filter-date-input" />
            </div>
            <div className="filter-item">
              <label htmlFor="to-date" className="filter-label">
                Đến ngày
              </label>
              <input type="date" id="to-date" className="filter-date-input" />
            </div>
          </div>
          <div className="filter-item">
            <label htmlFor="status" className="filter-label">
              Trạng thái
            </label>
            <select
              id="status"
              className="filter-status-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1); // Reset to first page when filter changes
              }}
            >
              <option value="">Tất cả</option>
              <option value="1">Chờ xác nhận</option>
              <option value="2">Đã xác nhận</option>
              <option value="3">Đã check-in</option>
              <option value="4">Đang xử lý</option>
              <option value="5">Hoàn thành</option>
              <option value="6">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      <div className="booking-list">
        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin size="large" />
          </div>
        ) : (
          BookingHistory.map((b) => {
            const s = statusLabel(b.status);
            const isExpanded = !!expanded[b.bookingCode];
            const pkg = b.bundleId ? Package?.[b.bundleId] : null;
            const catalog =
              !b.bundleId && b.catalogId ? Catalogs?.[b.catalogId] : null;
            const payment = Payments?.[b.bookingId];
            const payS = payment
              ? paymentStatus(payment.status)
              : { text: "Chưa Thanh Toán", className: "" };
            const derivedAmount = b.totalAmount;
            const bookingStatusLower = String(b.status).toLowerCase();
            const paymentStatusLower = String(
              payment?.status || "unpaid"
            ).toLowerCase();
            const shouldShowPayButton =
              ["pending", "confirmed"].includes(bookingStatusLower) &&
              ["unpaid", "pending"].includes(paymentStatusLower);

            return (
              <div
                key={b.bookingCode}
                className={`booking-card booking-${String(
                  b.status
                ).toLowerCase()}`}
              >
                <div className="booking-card-header">
                  <div className="booking-code">
                    Mã đặt lịch: {b.bookingCode}
                  </div>
                  <div className="booking-main">
                    <img src="src\assets\icon\Calender.svg" alt="Calender" />
                    <div className="booking-date&time">
                      <div className="booking-date">{b.RunDate}</div>
                      <div className="booking-time">
                        Ngày/Giờ hẹn: {formatDate(b.slotInfo.appointmentDate)} /{" "}
                        {formatTime(b.slotInfo.timeBlock)}
                      </div>
                    </div>
                    <div className={`booking-badge ${s.className}`}>
                      {s.text}
                    </div>
                  </div>
                  <div className="booking-created">
                    Đặt lịch ngày: {formatDate(b.createdAt)}
                  </div>
                  <div className="booking-actions">
                    <button
                      className="btn-dropdown"
                      onClick={() => toggle(b.bookingCode)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                    </button>
                  </div>
                </div>

                <div
                  className={`booking-card-body ${
                    isExpanded ? "open" : "closed"
                  }`}
                  aria-hidden={!isExpanded}
                >
                  <div className="completed-layout expanded-grid">
                    <div className="left-col">
                      <div className="section">
                        <h4>Thông tin cá nhân</h4>
                        <div className="info-row">
                          <div className="info-row-1">
                            <img src="src\assets\icon\User.svg" alt="User" />
                            <span className="label">Họ và tên</span>
                          </div>
                          <span className="value">{b.patientName}</span>
                        </div>
                        <div className="info-row">
                          <div className="info-row-1">
                            <img src="src\assets\icon\Mail.svg" alt="Email" />
                            <span className="label">Email</span>
                          </div>
                          <span className="value">{b.patientEmail}</span>
                        </div>
                        <div className="info-row">
                          <div className="info-row-1">
                            <img src="src\assets\icon\Phone.svg" alt="Phone" />{" "}
                            <span className="label">Điện thoại</span>
                          </div>
                          <span className="value">{b.patientPhoneNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="middle-col">
                      <div className="section">
                        <h4>Chi tiết đặt lịch</h4>
                        <div className="info-row">
                          <div className="info-row-1">
                            <img
                              src="src\assets\icon\Document_Gray.svg"
                              alt="Document"
                            />
                            <span className="label">
                              {b.bundleId ? "Gói" : "Dịch vụ"}
                            </span>
                          </div>
                          <span className="value">
                            {b.bundleId
                              ? pkg?.bundleName || `Gói #${b.bundleId}`
                              : b.catalogId
                              ? catalog?.catalogName ||
                                `Dịch vụ #${b.catalogId}`
                              : "Xét nghiệm đơn lẻ"}
                          </span>
                        </div>
                        {/* Nếu có thêm thông tin về dịch vụ hoặc catalog, có thể hiển thị ở đây */}
                      </div>
                    </div>

                    <div className="right-col">
                      <div className="section payment">
                        <h4>Thông tin thanh toán</h4>
                        <div className="info-row">
                          <div className="info-row-1">
                            <img src="src\assets\icon\Pay.svg" alt="Pay" />
                            <span className="label">Hình thức</span>
                          </div>
                          <span className="value">
                            {payment?.method || "Chưa có"}
                          </span>
                        </div>
                        {/* Nếu có trường price thì hiển thị, nếu không thì bỏ qua */}
                        {derivedAmount > 0 && (
                          <div className="info-row">
                            <div className="info-row-1">
                              <img src="src\assets\icon\Pay.svg" alt="Pay" />
                              <span className="label">Tổng tiền</span>
                            </div>
                            <span className="value">
                              {derivedAmount.toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                        )}
                        <div className="info-row">
                          <div className="info-row-1">
                            <span className="label">Trạng Thái</span>
                          </div>
                          <span className={`value`}>{payS.text}</span>
                        </div>
                        {shouldShowPayButton && (
                          <div className="info-row" style={{ marginTop: 8 }}>
                            <button
                              className="btn-primary-history-booking"
                              onClick={() => {
                                if (derivedAmount <= 0) {
                                  toast.error(
                                    "Không xác định được giá. Vui lòng liên hệ nhân viên."
                                  );
                                } else {
                                  handlePay(b.bookingId, derivedAmount);
                                }
                              }}
                            >
                              Thanh toán
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* result area: chỉ hiển thị nếu có status completed/cancelled */}
                  <strong>
                    <h2>Kết quả xét nghiệm</h2>
                  </strong>
                  <div className="result-area" style={{ marginTop: 20 }}>
                    {String(b.status).toLowerCase() === "completed" ? (
                      <div className="result-box ready">
                        <img
                          src="src\assets\icon\Document_Border.svg"
                          alt="Document_Borders"
                          className="img-doc"
                        />{" "}
                        <br />
                        <strong style={{ fontSize: "18px" }}>
                          Kết quả xét nghiệm đã sẵn sàng
                        </strong>
                        <p
                          style={{
                            fontSize: "13px",
                            marginTop: "10px",
                            color: "#737373",
                          }}
                        >
                          Vui lòng liên hệ phòng khám để nhận kết quả.
                        </p>
                        <button
                          className="btn-primary-history-booking"
                          onClick={() => {
                            // Điều hướng sang trang MedicalRecordDetail và truyền bookingId
                            navigate(
                              `/medical-record?patientId=${b.patientId}&bookingId=${b.bookingId}`
                            );
                          }}
                        >
                          <img
                            src="src/assets/icon/Document_white.svg"
                            alt=""
                          />
                          Xem chi tiết kết quả xét nghiệm
                        </button>
                      </div>
                    ) : String(b.status).toLowerCase() === "cancelled" ? (
                      <div className="result-box cancelled">
                        <strong>Không có kết quả xét nghiệm</strong>
                        <p>Lịch hẹn đã bị hủy, không có kết quả.</p>
                      </div>
                    ) : (
                      <div
                        className={`result-box ${
                          String(b.status).toLowerCase() === "pending" ||
                          String(b.status).toLowerCase() === "confirmed"
                            ? "yellow"
                            : "normal"
                        }`}
                      >
                        <p>Chưa có kết quả xét nghiệm</p>
                        {(String(b.status).toLowerCase() === "pending" ||
                          String(b.status).toLowerCase() === "confirmed") && (
                          <small>
                            Kết quả sẽ được cập nhật sau khi hoàn tất lấy mẫu.
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* Pagination */}
        {totalRecords > 0 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalRecords}
              onChange={(p, ps) => {
                setPage(p);
                if (ps !== pageSize) {
                  setPageSize(ps);
                  setPage(1); // reset to first when pageSize changes
                }
              }}
              showSizeChanger
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingHistory;
