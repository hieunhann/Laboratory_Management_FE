import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Pagination, Spin } from "antd";
import AdminLayout from "../../../components/admin/layout/AdminLayout";
import {
  FiCalendar,
  FiSearch,
  FiEdit2,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCheck,
  FiTrendingUp,
} from "react-icons/fi";
import {
  appointmentStatuses,
  timeSlots,
  getAppointmentCountBySlot,
} from "../../../data/appointment";
import "./AdminAppointmentSchedulePage.css";
import api from "../../../configs/axios";
import { formatDate1 } from "../../../utils/formatDate";
import { setAuthToken } from "../../../utils/auth";
import { StatisticsAPI } from "../../../apis/StatisticsAPI";
// import { CgLayoutGrid } from "react-icons/cg";

const AdminAppointmentSchedulePage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date()); // Ngày hiện tại
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Tháng hiện tại cho calendar picker
  const [search, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const [Booking, SetBookings] = useState([]);
  const [checkingInId, setCheckingInId] = useState(null);
  const [justCheckedInId, setJustCheckedInId] = useState(null); // Track booking vừa check-in
  // const [checkingOutId, setCheckingOutId] = useState(null); // track check-out
  // const [instrumentModal, setInstrumentModal] = useState({
  //   open: false,
  //   bookingId: null,
  //   bookingCode: "",
  //   patientName: "",
  // });
  const totalFetchedRef = React.useRef(false); // Đánh dấu đã fetch total chưa

  // Statistics state
  const [bookingsStats, setBookingsStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get next 7 days from today
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const next7Days = getNext7Days();

  // Get all days in current month for calendar picker
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    // const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    // Start from Monday of the week containing the 1st
    startDate.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

    const days = [];
    const currentDate = new Date(startDate);

    // Get 6 weeks (42 days) to fill the calendar
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const calendarDays = getCalendarDays();

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentPage(1); // Reset về trang 1 khi đổi ngày
    setIsDatePickerOpen(false);
    totalFetchedRef.current = false; // Reset để fetch total lại khi đổi ngày
  };

  // Handle month navigation in calendar picker
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Handle navigation
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);

    // Không cho chọn ngày trước hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);

    // Không cho chọn ngày sau 7 ngày
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 6);
    maxDate.setHours(23, 59, 59, 999);

    if (newDate <= maxDate) {
      setSelectedDate(newDate);
    }
  };

  // // Handle edit appointment
  // const handleEditAppointment = (appointment) => {
  //   setSelectedAppointment(appointment);
  //   setEditingStatus(appointment.status);
  //   setIsModalOpen(true);
  // };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setEditingStatus("");
    setStatusDropdownOpen(false);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    // Trong thực tế, gọi API để cập nhật
    console.log("Cập nhật trạng thái:", editingStatus);
    handleCloseModal();
  };

  // Format Vietnamese day name
  const getVietnameseDayName = (date) => {
    const days = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    return days[date.getDay()];
  };

  // Format month/year for calendar picker
  const formatCalendarMonthYear = (date) => {
    const months = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Check if date is in current month
  const isInCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };
  const formatMonthYear = (date) => {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const months = [
      "tháng 1",
      "tháng 2",
      "tháng 3",
      "tháng 4",
      "tháng 5",
      "tháng 6",
      "tháng 7",
      "tháng 8",
      "tháng 9",
      "tháng 10",
      "tháng 11",
      "tháng 12",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${
      months[date.getMonth()]
    }, ${date.getFullYear()}`;
  };

  // Check if can go prev/next
  const canGoPrev = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(selectedDate.getDate() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prevDate >= today;
  };

  const canGoNext = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 6);
    return nextDate <= maxDate;
  };

  const fetchAPI = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const response = await api.get(
        `testorder/api/bookings?date=${formatDate1(
          selectedDate
        )}&keyword=${search}&pageSize=${pageSize}&pageNumber=${currentPage}`
      );
      const dataObj = response.data?.data || response.data;
      if (response.status >= 200 && response.status < 300) {
        // Extract bookingResponses array and totalItem
        SetBookings(dataObj.bookingResponses || dataObj.items || dataObj.data || dataObj || []);
        setTotal(dataObj.totalItem || dataObj.total || 0);
      } else if (response.responseCode === -2 || dataObj.responseCode === -2) {
        SetBookings([]);
        setTotal(0);
      }
      return [];
    } catch (error) {
      console.log(error || "Lỗi");
      SetBookings([]);
      setTotal(0);
      return [];
    }
  };

  // Map raw status to Vietnamese label & CSS class (except keeping 'Check In')
  const mapStatus = (raw) => {
    const s = String(raw || "").toLowerCase();
    switch (s) {
      case "pending":
        return { label: "Chờ xử lý", className: "pending" };
      case "inprogress":
        return { label: "Đang Xét Nghiệm", className: "pending" };
      case "confirmed":
        return { label: "Đã xác nhận", className: "confirmed" };
      case "checked-in":
      case "checkedin":
        return { label: "Check In", className: "checked-in" }; // giữ nguyên tiếng Anh theo yêu cầu
      case "processing":
        return { label: "Đang xử lý", className: "processing" };
      case "checked-out":
        return { label: "Đã Check Out", className: "checked-out" };
      case "completed":
        return { label: "Hoàn thành", className: "completed" };
      case "cancelled":
        return { label: "Đã hủy", className: "cancelled" };
      default:
        return { label: raw, className: "pending" };
    }
  };

  const getStatusDisplay = (status) => mapStatus(status).label;

  useEffect(() => {
    // Reset totalFetchedRef khi đổi ngày
    if (selectedDate) {
      totalFetchedRef.current = false;
    }
    fetchAPI();
    fetchBookingsStatistics();
  }, [selectedDate, currentPage, pageSize, search]);

  const fetchBookingsStatistics = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const response = await StatisticsAPI.getBookingsStatistics();
      if (response?.data) {
        const bookingsData = response.data.data || response.data;
        if (bookingsData && typeof bookingsData === "object") {
          setBookingsStats(bookingsData);
        }
      }
    } catch (error) {
      console.error("Error fetching bookings statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Auto-refresh để cập nhật thời gian đếm ngược cho các booking đang xét nghiệm
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render để cập nhật thời gian
      SetBookings((prev) => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckin = async (bookingId) => {
    const token = localStorage.getItem("accessToken");
    setAuthToken(token);
    try {
      setCheckingInId(bookingId);
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const response = await api.put(
        `testorder/api/bookings/${bookingId}/check-in`
      );
      const data = response.data || {};

      if (data.responseCode === -2) {
        toast.error(data.message || "Không thể check-in.");
        return;
      } else if (data.responseCode === 0) {
        toast.success("Check in thành công!");
        await fetchAPI();

        // Đánh dấu booking vừa check-in để hiển thị nút "Chọn máy"
        setJustCheckedInId(bookingId);
      }
    } catch (err) {
      const message = "Bạn Chỉ Được CheckIn vào đúng ngày, giờ!!!";
      toast.error(message);
      console.error("Check-in failed:", err);
    } finally {
      setCheckingInId(null);
    }
  };

  // const handleCheckout = async (bookingId) => {
  //   try {
  //     setCheckingOutId(bookingId);
  //     const response = await api.put(
  //       `testorder/api/bookings/${bookingId}/check-out`
  //     );

  //     if (response.status >= 200 && response.status < 300) {
  //       toast.success("Check In thành công!!");
  //       await fetchAPI();
  //     }
  //   } catch (err) {
  //     console.error("Check-out failed:", err);
  //   } finally {
  //     setCheckingOutId(null);
  //   }
  // };

  return (
    <AdminLayout
      pageTitle="Quản lý lịch xét nghiệm"
      breadcrumbs={[
        { name: "Tổng quan", link: "/admin/dashboard" },
        { name: "Quản lý gói xét nghiệm" },
      ]}
    >
      <div className="appointment-schedule-container">
        <div className="appointment-header">
          <h1>Quản lý lịch xét nghiệm</h1>
          <p>Quản lý lịch hẹn xét nghiệm của bệnh nhân</p>
        </div>

        {/* Statistics Cards */}
        {loadingStats ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <Spin />
          </div>
        ) : bookingsStats ? (
          <div className="appointment-stats-cards">
            <div className="appointment-stat-card">
              <div
                className="appointment-stat-icon"
                style={{ color: "#3b82f6" }}
              >
                <FiCalendar />
              </div>
              <div className="appointment-stat-content">
                <div className="appointment-stat-title">Lịch hẹn hôm nay</div>
                <div className="appointment-stat-value">
                  {bookingsStats.totalBookingsToday || 0}
                </div>
                <div className="appointment-stat-change">Hôm nay</div>
              </div>
            </div>

            <div className="appointment-stat-card">
              <div
                className="appointment-stat-icon"
                style={{ color: "#10b981" }}
              >
                <FiCalendar />
              </div>
              <div className="appointment-stat-content">
                <div className="appointment-stat-title">Lịch hẹn tháng này</div>
                <div className="appointment-stat-value">
                  {bookingsStats.totalBookingsThisMonth || 0}
                </div>
                <div className="appointment-stat-change">Tháng hiện tại</div>
              </div>
            </div>

            <div className="appointment-stat-card">
              <div
                className="appointment-stat-icon"
                style={{ color: "#f59e0b" }}
              >
                <FiTrendingUp />
              </div>
              <div className="appointment-stat-content">
                <div className="appointment-stat-title">Lịch hẹn đang chờ</div>
                <div className="appointment-stat-value">
                  {bookingsStats.pendingBookings || 0}
                </div>
                <div className="appointment-stat-change">Chờ xử lý</div>
              </div>
            </div>

            <div className="appointment-stat-card">
              <div
                className="appointment-stat-icon"
                style={{ color: "#10b981" }}
              >
                <FiCheck />
              </div>
              <div className="appointment-stat-content">
                <div className="appointment-stat-title">
                  Lịch hẹn đã hoàn thành
                </div>
                <div className="appointment-stat-value">
                  {bookingsStats.completedBookings || 0}
                </div>
                <div className="appointment-stat-change">Đã hoàn thành</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="appointment-content">
          {/* Calendar Section */}
          <div className="calendar-section">
            <div className="calendar-header">
              <div className="calendar-title">
                <button
                  className="calendar-icon-button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  title="Chọn ngày"
                >
                  <FiCalendar />
                </button>
                <span>Chọn ngày</span>
              </div>
              <div className="calendar-nav">
                <button onClick={handlePrevDay} disabled={!canGoPrev()}>
                  <FiChevronLeft size={20} />
                </button>
                <span className="calendar-current-date">
                  {formatMonthYear(selectedDate)}
                </span>
                <button onClick={handleNextDay} disabled={!canGoNext()}>
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Date Picker Dropdown */}
            {isDatePickerOpen && (
              <div className="date-picker-dropdown">
                <div className="date-picker-header">
                  <button onClick={handlePrevMonth}>
                    <FiChevronLeft size={20} />
                  </button>
                  <span>{formatCalendarMonthYear(currentMonth)}</span>
                  <button onClick={handleNextMonth}>
                    <FiChevronRight size={20} />
                  </button>
                </div>

                <div className="date-picker-weekdays">
                  <div>T2</div>
                  <div>T3</div>
                  <div>T4</div>
                  <div>T5</div>
                  <div>T6</div>
                  <div>T7</div>
                  <div>CN</div>
                </div>

                <div className="date-picker-calendar">
                  {calendarDays.map((day, index) => {
                    const isSelected =
                      formatDate(day) === formatDate(selectedDate);
                    const inMonth = isInCurrentMonth(day);
                    const today = isToday(day);

                    return (
                      <div
                        key={index}
                        className={`date-picker-calendar-day ${
                          isSelected ? "selected" : ""
                        } ${!inMonth ? "other-month" : ""} ${
                          today ? "today" : ""
                        }`}
                        onClick={() => handleDateSelect(day)}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>

                <div className="date-picker-footer">
                  <button
                    onClick={() => {
                      setSelectedDate(new Date());
                      setCurrentMonth(new Date());
                    }}
                  >
                    Hôm nay
                  </button>
                  <button onClick={() => setIsDatePickerOpen(false)}>
                    Đóng
                  </button>
                </div>
              </div>
            )}

            <div className="calendar-grid">
              {next7Days.map((day, index) => {
                const isSelected = formatDate(day) === formatDate(selectedDate);
                return (
                  <div
                    key={index}
                    className={`calendar-day ${isSelected ? "selected" : ""}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    <div className="day-label">{getVietnameseDayName(day)}</div>
                    <div className="day-number">{day.getDate()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-box">
              <FiSearch size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc mã đặt lịch..."
                value={search}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Appointments Table */}
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Mã đặt lịch</th>
                  <th>Ngày Khám</th>
                  <th>Giờ Khám</th>
                  <th>Trạng thái</th>
                  <th>Thao Tác</th>
                  {/* <th>Hành động</th> */}
                </tr>
              </thead>
              <tbody>
                {Booking.length > 0 ? (
                  Booking.map((appointment) => {
                    const status = String(appointment.status).toLowerCase();
                    const isConfirmed = status === "confirmed";
                    const isCheckedIn =
                      status === "checked-in" || status === "checkedin";
                    const isInProgress = status === "inprogress";
                    const canProcessSample = isCheckedIn || isInProgress;
                    const isCheckingIn = checkingInId === appointment.bookingId;
                    // const isCheckingOut =
                    //   checkingOutId === appointment.bookingId;

                    // Kiểm tra xem có instrument run đang chạy không
                    const getInstrumentRunStatus = () => {
                      const storageKey = `instrument_run_${appointment.bookingId}`;
                      const stored = localStorage.getItem(storageKey);
                      if (!stored)
                        return {
                          hasActiveRun: false,
                          isRunning: false,
                          remainingTime: 0,
                        };
                      try {
                        const data = JSON.parse(stored);
                        const elapsed = Math.floor(
                          (Date.now() - data.startTime) / 1000
                        );
                        const totalSeconds = data.totalSeconds || 30;
                        const remaining = Math.max(0, totalSeconds - elapsed);
                        const isRunning =
                          remaining > 0 &&
                          (data.phase === "running" || data.phase === "pending");
                        const isDone = data.phase === "done";
                        return {
                          hasActiveRun: isRunning || isDone,
                          isRunning: isRunning,
                          remainingTime: remaining,
                          phase: data.phase,
                          instrumentName: data.instrumentName,
                        };
                      } catch {
                        return {
                          hasActiveRun: false,
                          isRunning: false,
                          remainingTime: 0,
                        };
                      }
                    };

                    const runStatus = getInstrumentRunStatus();

                    return (
                      <tr key={appointment.bookingId}>
                        <td>{appointment.patientName}</td>
                        <td>{appointment.patientEmail}</td>
                        <td>{appointment.patientPhoneNumber}</td>
                        <td>{appointment.bookingCode}</td>
                        <td>{appointment.slotInfo.appointmentDate}</td>
                        <td>{appointment.slotInfo.timeBlock}</td>
                        <td>
                          {(() => {
                            const m = mapStatus(appointment.status);
                            return (
                              <span className={`status-badge ${m.className}`}>
                                {m.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {isConfirmed && (
                            <button
                              onClick={() =>
                                handleCheckin(appointment.bookingId)
                              }
                              disabled={isCheckingIn}
                              className="CheckIn-Button"
                            >
                              {isCheckingIn ? "Đang check in..." : "Check In"}
                            </button>
                          )}
                          {justCheckedInId === appointment.bookingId && (
                            <button
                              onClick={() => {
                                navigate(
                                  `/instruments?bookingId=${
                                    appointment.bookingId
                                  }&bookingCode=${encodeURIComponent(
                                    appointment.bookingCode || ""
                                  )}&patientName=${encodeURIComponent(
                                    appointment.patientName || ""
                                  )}`
                                );
                                setJustCheckedInId(null);
                              }}
                              className="Process-Button"
                              style={{
                                animation: "pulse 1.5s ease-in-out infinite",
                              }}
                            >
                              Chọn máy
                            </button>
                          )}
                          {canProcessSample &&
                            justCheckedInId !== appointment.bookingId && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/instruments?bookingId=${
                                      appointment.bookingId
                                    }&bookingCode=${encodeURIComponent(
                                      appointment.bookingCode || ""
                                    )}&patientName=${encodeURIComponent(
                                      appointment.patientName || ""
                                    )}`
                                  )
                                }
                                className="Process-Button"
                              >
                                {runStatus.isRunning
                                  ? "Đang xét nghiệm"
                                  : runStatus.phase === "done"
                                  ? "Đã hoàn thành"
                                  : "Chọn máy"}
                              </button>
                            )}
                        </td>
                        {/* <td>
                          <button
                            className="action-button"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <FiEdit2 size={18} />
                          </button>
                        </td> */}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      Không có lịch hẹn nào trong ngày này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {Booking.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "24px",
                padding: "16px 0",
              }}
            >
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                showSizeChanger
                showQuickJumper
                pageSizeOptions={["5", "10", "20", "50"]}
                onChange={(page) => {
                  setCurrentPage(page);
                }}
                onShowSizeChange={(current, size) => {
                  setPageSize(size);
                  setCurrentPage(1); // Reset về trang 1 khi đổi pageSize
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedAppointment && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="appointment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Chỉnh sửa trạng thái lịch hẹn</h2>
                <p className="modal-subtitle">
                  Cập nhật trạng thái cho lịch hẹn của{" "}
                  {selectedAppointment.patientName}
                </p>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <FiX size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info-1">
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <span className="modal-info-label">Mã đặt lịch</span>
                    <span className="modal-info-value">
                      {selectedAppointment.bookingCode}
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="modal-info-label">Giờ hẹn hiện tại</span>
                    <span className="modal-info-value">
                      {selectedAppointment.slotInfo.timeBlock}
                    </span>
                  </div>
                </div>

                <div className="modal-section">
                  <h3 className="modal-section-title">Trạng thái</h3>
                  <div className="status-dropdown">
                    <button
                      className="status-dropdown-button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    >
                      <span>{getStatusDisplay(editingStatus)}</span>
                      <FiChevronRight
                        style={{
                          transform: statusDropdownOpen
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    {statusDropdownOpen && (
                      <div className="status-dropdown-menu">
                        {appointmentStatuses.map((status) => {
                          const m = mapStatus(status.value);
                          return (
                            <div
                              key={status.value}
                              className={`status-dropdown-item ${
                                editingStatus === status.value ? "selected" : ""
                              }`}
                              onClick={() => {
                                setEditingStatus(status.value);
                                setStatusDropdownOpen(false);
                              }}
                            >
                              {editingStatus === status.value && (
                                <FiCheck size={16} />
                              )}
                              <span>{m.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3 className="modal-section-title">
                  Đổi lịch trong ngày (tùy chọn)
                </h3>
                <div className="time-slots-grid">
                  {timeSlots.map((slot) => {
                    const count = getAppointmentCountBySlot(
                      selectedAppointment.appointmentDate,
                      slot.time
                    );
                    const isDisabled = count >= slot.capacity;
                    const isSelected =
                      selectedAppointment.appointmentTime === slot.time;

                    return (
                      <div
                        key={slot.time}
                        className={`time-slot-card ${
                          isDisabled ? "disabled" : ""
                        } ${isSelected ? "selected" : ""}`}
                      >
                        <div className="time-slot-time">{slot.time}</div>
                        <div className="time-slot-capacity">
                          {count}/{slot.capacity}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="reschedule-note">Sẽ đổi lịch sang 10:30</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-button cancel"
                onClick={handleCloseModal}
              >
                Hủy
              </button>
              <button
                className="modal-button primary"
                onClick={handleSaveChanges}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAppointmentSchedulePage;
