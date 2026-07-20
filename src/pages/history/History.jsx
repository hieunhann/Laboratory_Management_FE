import React from "react";
import Navbar from "../../components/navbar/Navbar";
import BookingHistory from "../../components/historyBooking/BookingHistory";
import "./History.css";

function History() {
  return (
    <div className="history-container">
      <Navbar />
      <div className="history-content">
        <BookingHistory />
      </div>
    </div>
  );
}

export default History;
