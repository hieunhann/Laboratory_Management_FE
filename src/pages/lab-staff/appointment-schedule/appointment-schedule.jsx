import React, { useState } from "react";
import LabStaffLayout from "../../../components/lab-staff/layout/LabStaffLayout";
import "./appointment-schedule.css";

const AppointmentSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 9, 30)); // Oct 30, 2025
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "patient0@example.com",
      phone: "0970192306",
      bookingCode: "BK20251030000",
      time: "07:30",
      status: "check-out",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "patient1@example.com",
      phone: "0709497553",
      bookingCode: "BK20251030001",
      time: "08:00",
      status: "waiting",
    },
    {
      id: 3,
      name: "Phạm Minh C",
      email: "patient2@example.com",
      phone: "0754468120",
      bookingCode: "BK20251030002",
      time: "08:30",
      status: "waiting",
    },
    {
      id: 4,
      name: "Hoàng Hải D",
      email: "patient3@example.com",
      phone: "0889971951",
      bookingCode: "BK20251030003",
      time: "09:00",
      status: "cancelled",
    },
    {
      id: 5,
      name: "Võ Linh E",
      email: "patient4@example.com",
      phone: "0739733943",
      bookingCode: "BK20251030004",
      time: "09:30",
      status: "check-out",
    },
    {
      id: 6,
      name: "Nguyễn Văn A",
      email: "patient5@example.com",
      phone: "0196276415",
      bookingCode: "BK20251030005",
      time: "10:00",
      status: "cancelled",
    },
    {
      id: 7,
      name: "Trần Thị B",
      email: "patient6@example.com",
      phone: "0492138199",
      bookingCode: "BK20251030006",
      time: "10:30",
      status: "check-out",
    },
  ];

  // Time slots for modal
  const timeSlots = [
    { time: "07:30", available: 1, total: 5 },
    { time: "08:00", available: 4, total: 5 },
    { time: "08:30", available: 4, total: 5 },
    { time: "09:00", available: 0, total: 5 },
    { time: "09:30", available: 2, total: 5 },
    { time: "10:00", available: 0, total: 5 },
    { time: "10:30", available: 2, total: 5 },
    { time: "11:00", available: 1, total: 5 },
    { time: "13:30", available: 4, total: 5 },
    { time: "14:00", available: 2, total: 5 },
    { time: "14:30", available: 2, total: 5 },
    { time: "15:00", available: 4, total: 5 },
  ];

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedTimeSlot(appointment.time);
    setShowEditModal(true);
  };

  const handleSaveChanges = () => {
    console.log("Saving changes for:", selectedAppointment);
    console.log("New time slot:", selectedTimeSlot);
    setShowEditModal(false);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "check-out":
        return "status-check-out";
      case "waiting":
        return "status-waiting";
      case "cancelled":
        return "status-cancelled";
      default:
        return "";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "check-out":
        return "Check out";
      case "waiting":
        return "Chờ xác nhận";
      case "cancelled":
        return "Hủy";
      default:
        return status;
    }
  };

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  // Get week days for calendar view
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 14; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <LabStaffLayout>
      <div className="appointment-schedule-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Quản lý lịch xét nghiệm</h1>
            <p className="page-subtitle">
              Quản lý lịch hẹn xét nghiệm của bệnh nhân
            </p>
          </div>
        </div>

        {/* Calendar View */}
        <div className="calendar-section">
          <div className="calendar-header">
            <div className="calendar-title">
              <svg
                className="calendar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Chọn ngày</span>
            </div>
            <div className="calendar-navigation">
              <button
                className="calendar-nav-btn"
                onClick={() => navigateMonth(-1)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="calendar-current-month">
                Thứ Năm, 30 tháng 10, 2025
              </span>
              <button
                className="calendar-nav-btn"
                onClick={() => navigateMonth(1)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {weekDays.map((day, index) => {
              const isSelected =
                day.toDateString() === selectedDate.toDateString();
              const dayName = day.toLocaleDateString("vi-VN", {
                weekday: "short",
              });
              const dayNumber = day.getDate();
              const monthNumber = day.getMonth() + 1;

              return (
                <div
                  key={index}
                  className={`calendar-day ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="calendar-day-header">
                    <span className="calendar-day-name">
                      {dayName.replace("Th ", "Th ")}
                    </span>
                    <span className="calendar-day-number">{dayNumber}</span>
                  </div>
                  <div className="calendar-day-content">
                    <span className="calendar-day-name">
                      {dayName.replace("Th ", "Th ")}
                    </span>
                    <span className="calendar-day-number">
                      {monthNumber}/{dayNumber}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="appointments-section">
          <div className="appointments-search">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc mã đặt lịch..."
              className="appointments-search-input"
            />
          </div>

          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Mã đặt lịch</th>
                  <th>Giờ</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="name-cell">{appointment.name}</td>
                    <td className="email-cell">{appointment.email}</td>
                    <td>{appointment.phone}</td>
                    <td className="booking-code-cell">
                      {appointment.bookingCode}
                    </td>
                    <td>{appointment.time}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="appointments-pagination">
            <span className="pagination-info">
              Hiển thị 1 đến 7 trong 16 lịch hẹn
            </span>
            <div className="pagination-controls">
              <button className="pagination-btn">Trước</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">Sau</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Appointment Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Chỉnh sửa trạng thái lịch hẹn</h2>
                <p className="modal-subtitle">
                  Cập nhật trạng thái cho lịch hẹn của{" "}
                  {selectedAppointment?.name}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info-row">
                <div className="modal-info-item">
                  <label>Mã đặt lịch</label>
                  <input
                    type="text"
                    value={selectedAppointment?.bookingCode}
                    disabled
                    className="modal-input disabled"
                  />
                </div>
                <div className="modal-info-item">
                  <label>Giờ hẹn hiện tại</label>
                  <input
                    type="text"
                    value={selectedAppointment?.time}
                    disabled
                    className="modal-input disabled"
                  />
                </div>
              </div>

              <div className="modal-status-section">
                <label>Trạng thái</label>
                <select className="modal-select">
                  <option value="check-out">Check out</option>
                  <option value="waiting">Chờ xác nhận</option>
                  <option value="cancelled">Hủy</option>
                </select>
              </div>

              <div className="modal-timeslots-section">
                <label>Đổi lịch trong ngày (tùy chọn)</label>
                <div className="timeslots-grid">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      className={`timeslot-btn ${
                        slot.available === 0 ? "disabled" : ""
                      } ${selectedTimeSlot === slot.time ? "selected" : ""}`}
                      onClick={() =>
                        slot.available > 0 && setSelectedTimeSlot(slot.time)
                      }
                      disabled={slot.available === 0}
                    >
                      <span className="timeslot-time">{slot.time}</span>
                      <span className="timeslot-availability">
                        {slot.available}/{slot.total}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedTimeSlot &&
                  selectedTimeSlot !== selectedAppointment?.time && (
                    <p className="timeslot-change-notice">
                      Sẽ đổi lịch sang {selectedTimeSlot}
                    </p>
                  )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button
                className="modal-btn save-btn"
                onClick={handleSaveChanges}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </LabStaffLayout>
  );
};

export default AppointmentSchedule;
