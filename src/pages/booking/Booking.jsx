import React, { useState, useEffect } from "react";
import { isAuthenticated } from "../../utils/auth"; // <-- login check util (returns boolean)
import Navbar from "../../components/navbar/Navbar";
import BookingHeader from "../../components/booking/BookingHeader";
import PatientSelection from "../../components/booking/PatientSelection";
import PackageSelection from "../../components/booking/PackageSelection";
import CatalogSelection from "../../components/booking/CatalogSelection";
import DateTimeSelection from "../../components/booking/DateTimeSelection";
import AcceptInfo from "../../components/booking/AcceptInfo";
import LoginRequirement from "../../components/booking/LoginRequirement";
import Payment from "../../components/booking/Payment";
import Success from "../../components/booking/SuccessBooking";
import "./Booking.css";
import { useNavigate, useSearchParams } from "react-router-dom";

function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedItems, setSelectedItems] = useState(null); // payload from Package/Catalog continue
  const [selectedDateTime, setSelectedDateTime] = useState(null); // { date, time }
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [packageMode, setPackageMode] = useState("preset");
  // modal state for payment confirmation warning
  // const [showWarningModal, setShowWarningModal] = useState(false);
  // store payment result to show in Success
  const [paymentResult, setPaymentResult] = useState(null);
  // store bookingId from AcceptInfo after successful booking
  const [bookingId, setBookingId] = useState(null);

  // Reset booking to initial state (bắt đầu lại bước 1)
  const handleNewBooking = () => {
    setSelectedPatient(null);
    setSelectedPackage(null);
    setSelectedItems(null);
    setSelectedDateTime(null);
    setPaymentResult(null);
    setBookingId(null);
    setPackageMode("preset");
    setCurrentStep(1);
    // nếu cần, cuộn lên top hoặc focus UI ở đây
  };

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const checkLoginStatus = () => {
      // CHECKPOINT: đây là nơi gọi isAuthenticated() để update trạng thái isLoggedIn
      // Nếu muốn debug, console.log(isAuthenticated()) tại đây.
      const loggedIn = isAuthenticated();
      setIsLoggedIn(loggedIn);
    };

    checkLoginStatus();

    // Lắng nghe sự thay đổi trong localStorage
    window.addEventListener("storage", checkLoginStatus);
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, []);

  // Tự động chọn bundle từ URL query params
  useEffect(() => {
    const bundleIdFromUrl = searchParams.get("bundleId");
    if (bundleIdFromUrl && isLoggedIn && currentStep === 1) {
      // Chuyển bundleId từ string sang number nếu cần
      const bundleId = Number(bundleIdFromUrl) || bundleIdFromUrl;
      setSelectedPackage(bundleId);
      // Đảm bảo đang ở chế độ preset package
      setPackageMode("preset");
      // Xóa query param sau khi đã sử dụng để tránh conflict
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("bundleId");
      const newUrl = newSearchParams.toString()
        ? `/booking?${newSearchParams.toString()}`
        : "/booking";
      navigate(newUrl, { replace: true });
    }
  }, [searchParams, isLoggedIn, currentStep, navigate]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setCurrentStep(2);
  };

  const handlePackageSelect = (packageId) => {
    setSelectedPackage(packageId);
  };

  // Modified: handleContinue nhận payload từ PackageSelection hoặc CatalogSelection
  const handleContinueFromSelection = (payload) => {
    // payload: { source: 'package'|'catalog', package: {...} } OR { source: 'catalog', items: [...] }
    setSelectedItems(payload);
    // chuyển sang chọn ngày & giờ
    setCurrentStep(3);
  };

  // DateTimeSelection tiếp tục -> chuyển sang AcceptInfo
  const handleContinueFromDateTime = (dateTime) => {
    setSelectedDateTime(dateTime);
    setCurrentStep(4);
  };

  // AcceptInfo tiếp tục (chỉ chuyển nội bộ sang Payment step)
  const handleProceedPayment = (bookingIdFromAcceptInfo, discountedTotal) => {
    // Lưu bookingId từ AcceptInfo sau khi booking thành công
    if (bookingIdFromAcceptInfo) {
      setBookingId(bookingIdFromAcceptInfo);
    }
    if (typeof discountedTotal === "number" && !isNaN(discountedTotal)) {
      setSelectedItems((prev) => (prev ? { ...prev, total: discountedTotal } : prev));
    }
    setCurrentStep(5);
  };

  // Payment hoàn tất -> chuyển sang Success
  const handlePaymentFinish = (result) => {
    setPaymentResult(result || { status: "success", time: Date.now() });
    // Navigate với bookingId trong URL params
    // Ưu tiên dùng bookingId từ result, fallback về state
    const finalBookingId = result?.bookingId || bookingId;
    if (finalBookingId) {
      navigate(`/booking/successBooking?bookingId=${finalBookingId}`);
    } else {
      navigate("/booking/successBooking");
    }
  };

  // back handlers
  const backToPatientSelection = () => setCurrentStep(1);
  const backToSelection = () => setCurrentStep(2);
  const backToDateTime = () => setCurrentStep(3);
  const backFromPayment = () => setCurrentStep(4);

  // Called by Payment component when user presses "Xác nhận thanh toán"
  // const handleRequestConfirm = () => {
  //   setShowWarningModal(true);
  // };

  useEffect(() => {
    const clickHandler = (e) => {
      if (currentStep !== 4) return;
      // detect by class OR data-action attribute
      const btn =
        e.target.closest(".btn-confirm") ||
        e.target.closest('[data-action="confirm-payment"]');
      const inPayment = e.target.closest(".payment-container");
      if (btn && inPayment && !btn.disabled) {
        e.preventDefault();
        // setShowWarningModal(true);
      }
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [currentStep]);

  // Nếu chưa đăng nhập, hiển thị yêu cầu đăng nhập
  if (!isLoggedIn) {
    // EARLY RETURN: khi isLoggedIn === false, component sẽ return LoginRequirement và không render phần booking
    return (
      <div className="booking-container">
        <Navbar />
        <LoginRequirement />
      </div>
    );
  }
  const steps = [
    { id: 1, label: "Chọn bệnh nhân", name: "Chọn bệnh nhân" },
    { id: 2, label: "Chọn xét nghiệm", name: "Chọn xét nghiệm" },
    { id: 3, label: "Chọn giờ", name: "Chọn giờ" },
    { id: 4, label: "Xác nhận", name: "Xác nhận" },
    { id: 5, label: "Thanh toán", name: "Thanh toán" },
    { id: 6, label: "Thành công", name: "Thành công" },
  ];
  // Nếu đã đăng nhập, hiển thị trang đặt lịch
  return (
    <div className="booking-container">
      <Navbar />
      <div className="booking-content">
        {currentStep !== 5 && (
          <BookingHeader
            title="Đặt lịch xét nghiệm"
            subtitle="Chọn gói xét nghiệm, địa điểm và thời gian phù hợp với bạn"
            currentStep={currentStep}
            steps={steps}
          />
        )}

        {/* Render nội bộ không reload trang theo currentStep */}
        {currentStep === 1 && (
          <PatientSelection
            onSelectPatient={handlePatientSelect}
            onBack={() => navigate("/")}
          />
        )}

        {currentStep === 2 && (
          <>
            {packageMode === "preset" ? (
              <PackageSelection
                selectedPackage={selectedPackage}
                onPackageSelect={handlePackageSelect}
                onContinue={(payload) => handleContinueFromSelection(payload)}
                setPackageMode={setPackageMode}
                mode={packageMode}
                selectedPatient={selectedPatient}
              />
            ) : (
              <CatalogSelection
                setPackageMode={setPackageMode}
                onContinue={(payload) => handleContinueFromSelection(payload)}
                selectedPatient={selectedPatient}
              />
            )}
          </>
        )}

        {currentStep === 3 && (
          <DateTimeSelection
            onBack={backToSelection}
            onContinue={(dt) => handleContinueFromDateTime(dt)}
            selectedPatient={selectedPatient}
          />
        )}

        {currentStep === 4 && (
          <AcceptInfo
            selectedItems={selectedItems}
            selectedDateTime={selectedDateTime}
            onBack={backToDateTime}
            onProceed={handleProceedPayment}
            selectedPatient={selectedPatient}
          />
        )}
        {currentStep === 5 && (
          <Payment
            selectedItems={selectedItems}
            selectedDateTime={selectedDateTime}
            bookingId={bookingId}
            onBack={backFromPayment}
            onFinish={(result) => handlePaymentFinish(result)}
            selectedPatient={selectedPatient}
            // onConfirmRequested={handleRequestConfirm}
          />
        )}

        {currentStep === 6 && (
          <Success
            paymentResult={paymentResult}
            selectedItems={selectedItems}
            selectedDateTime={selectedDateTime}
            onNewBooking={handleNewBooking}
            selectedPatient={selectedPatient}
          />
        )}

        {/* Modal warning / confirmation rendered at Booking level */}
      </div>
    </div>
  );
}

export default Booking;
