export const formatDate = (dateStr) => {
  if (!dateStr) return "";

  const d = new Date(dateStr);

  // Mảng thứ trong tiếng Việt
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];

  const dayName = days[d.getDay()]; // getDay() trả 0-6

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${dayName}, ${dd}-${mm}-${yyyy}`;
};

export const formatDate1 = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

// format ngày va giờ
export const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
};
// Tính tuổi theo (YYYY-MM-DD)
export const calculateAge = (dateStr) => {
  if (!dateStr) return 0;
  const [year, month, day] = dateStr.split("-");
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
// Parse date string to input value (YYYY-MM-DD)
export const parseDateToInput = (dateStr) => {
  if (!dateStr) return "";
  // Accept ISO or "DD tháng MM, YYYY"
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  const match = dateStr.match(/(\d+)\s+tháng\s+(\d+),\s*(\d+)/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return "";
};

export const validateForm = (formData) => {
  const newErrors = {};
  if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
  if (!formData.phoneNumber.trim())
    newErrors.phoneNumber = "Vui lòng nhập số điện thoại";
  else if (!/^0[3-9]\d{8}$/.test(formData.phoneNumber))
    newErrors.phoneNumber = "Số điện thoại không hợp lệ";
  if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email))
    newErrors.email = "Email không hợp lệ";
  if (!formData.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
  if (!formData.identityCard.trim())
    newErrors.identityCard = "Vui lòng nhập số CMND/CCCD";
  if (!formData.dateOfBirth.trim())
    newErrors.dateOfBirth = "Vui lòng nhập ngày sinh";
  else {
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Ngày sinh phải có định dạng YYYY-MM-DD";
    } else {
      const [year, month, day] = formData.dateOfBirth.split("-");
      const date = new Date(year, month - 1, day);
      if (
        date.getMonth() !== month - 1 ||
        date.getDate() !== parseInt(day) ||
        date.getFullYear() !== parseInt(year)
      ) {
        newErrors.dateOfBirth = "Ngày sinh không hợp lệ";
      } else {
        const today = new Date();
        if (date > today) {
          newErrors.dateOfBirth = "Ngày sinh không thể là ngày trong tương lai";
        }
      }
    }
  }
  return newErrors;
};

export const formatTime = (timeString) => {
  const [hour] = timeString.split(":").map(Number);

  if (hour >= 7 && hour < 11) return hour + " Giờ Sáng";
  if (hour >= 13 && hour < 18) return hour + " Giờ Chiều";

  return hour + " Giờ Tối";
};
