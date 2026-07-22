import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form } from "antd";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setPatient } from "../data/patientSlice";
import { setAuthToken } from "../utils/auth";
import dayjs from "dayjs";
import { PatientServiceAPI } from "../apis/PatientServiceAPI";
import { validateForm } from "../utils/formatDate";
import {
  parseDateToInput,
  // calculateAge,
  // formatDateTime,
} from "../utils/formatDate";

const extractErrorMessage = (error, defaultMsg) => {
  console.error("API Error Details:", error);
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return data.join(" | ");
    if (data.message) return data.message;
    if (data.Message) return data.Message;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.errors) {
      const validationErrors = data.errors;
      const messages = [];
      for (const key in validationErrors) {
        if (Array.isArray(validationErrors[key])) {
          messages.push(...validationErrors[key]);
        } else if (typeof validationErrors[key] === "string") {
          messages.push(validationErrors[key]);
        }
      }
      if (messages.length > 0) return messages.join(" | ");
    }
    try {
      const stringified = JSON.stringify(data);
      if (stringified && stringified !== "{}") {
        return stringified;
      }
    } catch (e) {
      // ignore
    }
  }
  return error.message || defaultMsg;
};

export const useCreatePatient = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.openModal) {
      setIsModalOpen(true);
      // Xóa state để tránh việc tự động mở lại modal khi reload trang
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      setAuthToken(token);

      const data = {
        fullName: values.fullName,
        dateOfBirth: dayjs(values.dateOfBirth).format("YYYY-MM-DD"),
        gender: parseInt(values.gender, 10), // Convert string to number
        bloodType: parseInt(values.bloodType, 10), // Convert string to number
        phone: values.phoneNumber,
        email: values.email,
        address: values.address,
        citizenId: values.identityCard,
        insuranceNumber: values.healthInsurance || "", // Handle empty string
        createdChannel: "self",
      };

      const response = await PatientServiceAPI.CreateProfile(data);
      console.log(response);
      if (response.status >= 200 && response.status < 300) {
        toast.success("Tạo hồ sơ bệnh nhân thành công!");
        handleCloseModal();
        navigate("/profile");
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Có lỗi xảy ra khi tạo hồ sơ. Vui lòng thử lại!"));
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    handleSubmit,
    handleOpenModal,
    handleCloseModal,
    isModalOpen,
    isSubmitting,
    form,
  };
};

export const useFetchProfile = () => {
  const [userData, setUserData] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      setAuthToken(token);

      const check = await PatientServiceAPI.Profile();
      const patient = check?.data?.data?.data || check?.data?.data || check?.data;

      if (!patient) {
        navigate("/create-profile");
        return;
      }

      const patientId = patient?.patientId || patient?.id;

      if (patientId) {
        try {
          const response = await PatientServiceAPI.GetProfileByPatientId(patientId);
          const data = response?.data?.data?.data || response?.data?.data || response?.data;
          if (data) {
            setUserData(data);
            dispatch(
              setPatient({
                patientId: data.patientId || patientId,
                fullName: data.fullName || patient.fullName,
                phone: data.phone || patient.phone,
                email: data.email || patient.email,
              })
            );
            return;
          }
        } catch (e) {
          // If GetProfileByPatientId fail, fallback to patient info from /me
        }
      }

      // Fallback directly using patient info from /me API
      setUserData(patient);
      dispatch(
        setPatient({
          patientId: patient.patientId || patient.id,
          fullName: patient.fullName,
          phone: patient.phone,
          email: patient.email,
        })
      );
    } catch (error) {
      console.error("Fetch profile error:", error);
      navigate("/create-profile");
    }
  };
  return { fetchProfile, userData };
};

export const useMedicalRecord = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const fetchMedicalRecords = async (page, pageSize) => {
    try {
      const token = localStorage.getItem("accessToken");
      setAuthToken(token);
      const response = await PatientServiceAPI.GetMedicalRecords(
        page,
        pageSize
      );
      if (response.status >= 200 && response.status < 300) {
        // Đúng cấu trúc response: lấy từ response.data.items và response.data.total
        const respData = response.data;
        let finalItems = [];
        if (Array.isArray(respData)) {
          finalItems = respData;
        } else if (Array.isArray(respData?.items)) {
          finalItems = respData.items;
        } else if (Array.isArray(respData?.data?.items)) {
          finalItems = respData.data.items;
        } else if (Array.isArray(respData?.data)) {
          finalItems = respData.data;
        }
        setMedicalRecords(finalItems);
        setTotalRecords(respData?.total || respData?.data?.total || respData?.totalItems || respData?.data?.totalItems || finalItems.length || 0);
      }
    } catch (error) {
      toast.error(error);
      setMedicalRecords([]);
      setTotalRecords(0);
    }
  };
  return { fetchMedicalRecords, medicalRecords, totalRecords };
};

export const useUpdateProfile = (
  userData,
  formData,
  setFormData,
  refreshProfile
) => {
  // operate on parent's formData / setter
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);

  const handleSave = async () => {
    const newErrors = validateForm(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const data = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender === "1" ? 1 : formData.gender === "0" ? 0 : 2,
        bloodType: parseInt(formData.bloodType, 10),
        phone: formData.phoneNumber,
        email: formData.email,
        address: formData.address,
        citizenId: formData.identityCard,
        insuranceNumber: formData.healthInsurance || "",
      };

      try {
        const token = localStorage.getItem("accessToken");
        setAuthToken(token);

        await PatientServiceAPI.UpdateProfile(userData.patientId, data);

        // refresh parent profile if provided
        if (typeof refreshProfile === "function") {
          await refreshProfile();
        }

        setShowModal(false);
        toast.success("Cập nhật thông tin thành công!");
      } catch (error) {
        toast.error(extractErrorMessage(error, "Cập nhật thất bại!"));
      }
    }
  };

  const handleOpenModal = () => {
    setFormData({
      fullName: userData?.fullName || "",
      gender: userData?.gender === 1 ? "1" : userData?.gender === 0 ? "0" : "",
      bloodType: String(userData?.bloodType || ""),
      dateOfBirth: parseDateToInput(userData?.dateOfBirth),
      phoneNumber: userData?.phone || "",
      email: userData?.email || "",
      address: userData?.address || "",
      identityCard: userData?.citizenId || "",
      healthInsurance: userData?.insuranceNumber || "",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setErrors({});
  };

  return {
    handleSave,
    handleOpenModal,
    handleCloseModal,
    errors,
    setErrors,
    showModal,
  };
};

export const useAddMedicalRecords = (
  page = 1,
  pageSize = 10,
  onRefresh,
  externalForm
) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateMedicalRecord = async (values) => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem("accessToken");
      setAuthToken(token);
      const data = {
        FullName: values.fullName,
        DateOfBirth: dayjs(values.dateOfBirth).format("YYYY-MM-DD"),
        Gender: parseInt(values.gender, 10),
        BloodType: parseInt(values.bloodType, 10),
        Phone: values.phoneNumber,
        Email: values.email,
        Address: values.address,
        CitizenId: values.identityCard,
        InsuranceNumber: values.healthInsurance || "",
        CreatedChannel: "self",
      };
      const response = await PatientServiceAPI.AddNewProfile(data);
      if (response.status >= 200 && response.status < 300) {
        toast.success("Thêm hồ sơ bệnh án thành công!");

        // reset the parent's form instance (if provided) BEFORE closing the modal
        try {
          externalForm?.resetFields();
        } catch (e) {
          console.error("Failed to reset external form:", e);
        }

        setShowCreateModal(false);

        // Nếu component cha truyền fetchMedicalRecords (hoặc onRefresh), gọi để reload danh sách
        if (typeof onRefresh === "function") {
          try {
            await onRefresh(page, pageSize);
          } catch (e) {
            // ignore refresh errors but log for debugging
            console.error("Refresh medical records failed:", e);
          }
        }
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Có lỗi xảy ra khi thêm hồ sơ. Vui lòng thử lại!"));
    } finally {
      setIsCreating(false);
    }
  };
  return {
    handleCreateMedicalRecord,
    showCreateModal,
    isCreating,
    setShowCreateModal,
  };
};
