import React, { useState, useMemo, useEffect } from "react";
import "./DateTimeSelection.css";
import { IoMdTime } from "react-icons/io";
import { CiCalendar } from "react-icons/ci";
import { bookingService } from "../../services/TestOrderService.jsx";
import { setAuthToken } from "../../utils/auth";
function DateTimeSelection({ onBack, onContinue }) {
  // tạo danh sách 30 ngày bắt đầu từ hôm nay
  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 1; i < 31; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      // set giờ về giữa trưa để tránh vấn đề timezone khi parse ISO trên client khác múi giờ
      d.setHours(12, 0, 0, 0);
      arr.push(d);
    }
    return arr;
  }, []);

  const morningSlots = ["07:00", "08:00", "09:00", "10:00", "11:00"];
  const afternoonSlots = ["13:00", "14:00", "15:00", "16:00"];

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slotCounts, setSlotCounts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setAuthToken(token);
    const fetchSlotCounts = async () => {
      try {
        const response = await bookingService.getAppointmentSlotCounts();

        const data = response;
        if (Array.isArray(data)) {
          setSlotCounts(data);
        } else {
          setSlotCounts([]);
        }
      } catch (error) {
        console.log("Error fetching slot counts:", error);
        setSlotCounts([]);
      }
    };
    fetchSlotCounts();
  }, []);

  // Helper function to check if a slo  t is fully booked
  const isSlotFullyBooked = (dateISO, time) => {
    if (!dateISO || !time) return false;
    // Convert ISO date to YYYY-MM-DD format
    const dateStr = new Date(dateISO).toISOString().split("T")[0];
    // Convert time from "HH:mm" to "HH:mm:ss"
    const timeBlock = time + ":00";

    // console.log("Checking slot:", dateStr, timeBlock);
    const slot = slotCounts.find(
      (s) => s.appointmentDate === dateStr && s.timeBlock === timeBlock
    );
    // console.log("Found slot:", slot);
    return slot ? slot.isFullyBooked : false;
  };

  // Helper function to get booking count
  const getBookingCount = (dateISO, time) => {
    if (!dateISO || !time) return 0;
    const dateStr = new Date(dateISO).toISOString().split("T")[0];
    const timeBlock = time + ":00";

    const slot = slotCounts.find(
      (s) => s.appointmentDate === dateStr && s.timeBlock === timeBlock
    );
    return slot ? slot.totalBookings : 0;
  };

  // Helper function to get remaining slots
  const getRemainingSlots = (dateISO, time) => {
    if (!dateISO || !time) return 10;
    const bookingCount = getBookingCount(dateISO, time);
    return Math.max(0, 10 - bookingCount);
  };

  const formatDayLabel = (d) => {
    const opts = { weekday: "short", day: "numeric", month: "numeric" };
    return d.toLocaleDateString("vi-VN", opts);
  };

  return (
    <div className="dt-selection">
      <div className="dt-location-card">
        <div>Trung Tâm Xét nghiệm FPT</div>
        <div className="dt-location-sub">
          Tòa nhà F-Town 1, Lô T2, Đường D1, Khu Công nghệ Cao Sài Gòn, Phường
          Tân Phú, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam.
        </div>
      </div>
      <h4 className="dt-sub ">
        <CiCalendar style={{ color: "#2563eb", fontWeight: "bolder" }} />
        <span className="dt-title">Chọn ngày (trong vòng 30 ngày)</span>
      </h4>
      <div className="dt-day-grid">
        {days.map((d) => {
          const key = d.toISOString(); // ISO with time (no timezone shift issues)
          const isSelected = selectedDate === key;
          return (
            <button
              key={key}
              className={`dt-day ${isSelected ? "selected" : ""}`}
              onClick={() => {
                setSelectedDate(key);
                setSelectedTime(null);
              }}
              type="button"
            >
              {formatDayLabel(d)}
            </button>
          );
        })}
      </div>
      <h4 className="dt-sub ">
        <IoMdTime style={{ color: "#2563eb", fontWeight: "bolder" }} />
        <span className="dt-title">Chọn giờ</span>
      </h4>
      <div className="dt-slots">
        <h4>Ca sáng (07:00 - 11:00)</h4>
        <div className="dt-slot-row">
          {morningSlots.map((t) => {
            const isFullyBooked = isSlotFullyBooked(selectedDate, t);
            const remainingSlots = getRemainingSlots(selectedDate, t);

            return (
              <button
                key={t}
                className={`dt-slot ${selectedTime === t ? "selected" : ""} ${
                  isFullyBooked ? "fully-booked" : ""
                }`}
                onClick={() => setSelectedTime(t)}
                disabled={!selectedDate || isFullyBooked}
                type="button"
              >
                <div>{t}</div>
                {selectedDate && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: isFullyBooked ? "#ef4444" : "#6b7280",
                      marginTop: "2px",
                      fontWeight: isFullyBooked ? "600" : "normal",
                      cursor: isFullyBooked ? "not-allowed" : "pointer",
                    }}
                  >
                    {isFullyBooked ? "Hết chỗ" : `Còn ${remainingSlots} chỗ`}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <h4>Ca chiều (13:00 - 17:00)</h4>
        <div className="dt-slot-row">
          {afternoonSlots.map((t) => {
            const isFullyBooked = isSlotFullyBooked(selectedDate, t);
            const remainingSlots = getRemainingSlots(selectedDate, t);

            return (
              <button
                key={t}
                className={`dt-slot ${selectedTime === t ? "selected" : ""} ${
                  isFullyBooked ? "fully-booked" : ""
                }`}
                onClick={() => setSelectedTime(t)}
                disabled={!selectedDate || isFullyBooked}
                type="button"
              >
                <div>{t}</div>
                {selectedDate && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: isFullyBooked ? "#ef4444" : "#6b7280",
                      marginTop: "2px",
                      fontWeight: isFullyBooked ? "600" : "normal",
                    }}
                  >
                    {isFullyBooked ? "Hết chỗ" : `Còn ${remainingSlots} chỗ`}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dt-actions">
        <button className="dt-back" onClick={() => onBack && onBack()}>
          Quay lại
        </button>
        <button
          className={`dt-continue ${
            selectedDate && selectedTime ? "enabled" : ""
          }`}
          disabled={!selectedDate || !selectedTime}
          onClick={() =>
            onContinue &&
            onContinue({
              // pass full ISO date (with time set midday) to avoid timezone shift later
              date: selectedDate,
              time: selectedTime,
            })
          }
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

export default DateTimeSelection;
