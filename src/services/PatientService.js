import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export const useCreatePatient = () => {
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        FullName: values.fullName,
        DateOfBirth: dayjs(values.dateOfBirth).format("YYYY-MM-DD"),
        Gender: parseInt(values.gender, 10), // Convert string to number
        BloodType: parseInt(values.bloodType, 10), // Convert string to number
        Phone: values.phoneNumber,
        Email: values.email,
        Address: values.address,
        CitizenId: values.identityCard,
        InsuranceNumber: values.healthInsurance || "", // Handle empty string
        CreatedChannel: "self",
      };

      const response = await PatientServiceAPI.CreateProfile(data);
      console.log(response);
      if (response.status >= 200 && response.status < 300) {
        toast.success("Tạo hồ sơ bệnh nhân thành công!");
        handleCloseModal();
        navigate("/profile");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tạo hồ sơ. Vui lòng thử lại!"
      );
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
      if (!check.data || check.data.succeeded === false || !check.data.data) {
        navigate("/create-profile");
        return;
      }

      const patient = check.data.data;
      const patientId = patient.patientId;

      if (!patientId) {
        navigate("/create-profile");
        return;
      }

      const response = await PatientServiceAPI.GetProfileByPatientId(patientId);
      const data = response.data;
      if (response.status === 200 && response.data) {
        setUserData(data);

        dispatch(
          setPatient({
            patientId: data.patientId,
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
          })
        );
      } else {
        navigate("/create-profile");
      }
    } catch (error) {
      toast.error(error);
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
        setMedicalRecords(response.data.items || [null]);
        setTotalRecords(response.data.total || 0);
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
        FullName: formData.fullName,
        DateOfBirth: formData.dateOfBirth,
        Gender: formData.gender === "1" ? 1 : formData.gender === "0" ? 0 : 2,
        BloodType: parseInt(formData.bloodType, 10),
        Phone: formData.phoneNumber,
        Email: formData.email,
        Address: formData.address,
        CitizenId: formData.identityCard,
        InsuranceNumber: formData.healthInsurance || "",
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
        toast.error(error.response?.data?.message || "Cập nhật thất bại!");
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
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi thêm hồ sơ. Vui lòng thử lại!"
      );
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
