import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import SuccessBooking from "../../components/booking/SuccessBooking";
import Navbar from "../../components/navbar/Navbar";
import { bookingService } from "../../services/TestOrderService.jsx";
import { toast } from "react-toastify";
import { setAuthToken } from "../../utils/auth.js";

export default function SuccessBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setAuthToken(token);
    const fetchBookingData = async () => {
      // Lấy bookingId từ URL params
      const bookingId = searchParams.get("bookingId");

      if (!bookingId) {
        toast.error("Không tìm thấy mã đơn hàng");
        navigate("/booking");
        return;
      }

      try {
        const response = await bookingService.getBookingById(bookingId);

        const booking = response.data || response;

        let testInfo = null;
        if (booking.bundleId) {
          const bundleResponse = await bookingService.getTestBundle(
            booking.bundleId
          );
          testInfo = bundleResponse.data || bundleResponse;
        } else if (booking.testCatalogs && booking.testCatalogs.length > 0) {
          const catalogPromises = booking.testCatalogs.map((catalogId) =>
            bookingService.getTestCatalog(catalogId)
          );
          const responses = await Promise.all(catalogPromises);

          // Xử lý response có thể có .data hoặc không
          testInfo = responses.map((r) => r.data || r);
        }

        setBookingData({
          ...booking,
          testInfo,
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error(error?.message || "Không thể tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [searchParams, navigate]);

  const handleNewBooking = () => {
    navigate("/booking");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!bookingData) {
    return null;
  }

  // Format dữ liệu để truyền vào SuccessBooking component
  const selectedItems = {
    total: 0, // Có thể tính từ testInfo nếu API trả về price
    source: bookingData.bundleId ? "package" : "catalog",
    package: bookingData.bundleId
      ? {
          name: bookingData.testInfo?.bundleName,
          title: bookingData.testInfo?.bundleName,
        }
      : null,
    items: !bookingData.bundleId
      ? bookingData.testInfo?.map((test) => ({
          testName: test.testName,
        }))
      : null,
  };

  const selectedDateTime = {
    date: bookingData.slotInfo?.appointmentDate,
    time: bookingData.slotInfo?.timeBlock,
  };

  const paymentResult = {
    orderCode: bookingData.bookingCode,
    amount: 0, // Có thể tính từ testInfo
  };

  return (
    <div className="booking-container">
      <Navbar />
      <SuccessBooking
        paymentResult={paymentResult}
        selectedItems={selectedItems}
        selectedDateTime={selectedDateTime}
        onNewBooking={handleNewBooking}
        bookingData={bookingData}
      />
    </div>
  );
}
