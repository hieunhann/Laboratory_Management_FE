import React, { useEffect, useState } from "react";
import AdminLayout from "../../admin/layout/AdminLayout.jsx";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiX,
  FiAlertTriangle,
  FiEye,
} from "react-icons/fi";
import CustomPagination from "../../common/Pagination";
import { PatientServiceAPI } from "../../../apis/PatientServiceAPI.js";
import { setAuthToken } from "../../../utils/auth.js";
import { toast } from "react-toastify";
import "./PatientsManagement.css";

const PatientsManagement = () => {
  const breadcrumbs = [
    { name: "Laboratory", link: "#" },
    { name: "Patients Management" },
  ];

  const token = localStorage.getItem("accessToken");
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    bloodType: "",
    phone: "",
    email: "",
    address: "",
    citizenId: "",
    insuranceNumber: "",
    createdChannel: "admin",
  });
  const [formErrors, setFormErrors] = useState({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (token) setAuthToken(token);
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchDebounce, sortBy, sortDir]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        sortBy,
        sortDir,
      };
      // Search in name, phone, or email
      if (searchDebounce) {
        const searchValue = searchDebounce.trim();
        // Check if it's a phone number (all digits)
        if (/^\d+$/.test(searchValue)) {
          params.phone = searchValue;
        }
        // Check if it's an email (contains @)
        else if (searchValue.includes("@")) {
          params.email = searchValue;
        }
        // Otherwise search by name
        else {
          params.name = searchValue;
        }
      }

      const response = await PatientServiceAPI.GetAllPatients(params);
      if (response.status === 200 && response.data) {
        const responseData = response.data;
        // Handle different response structures
        let patientsList = [];
        let totalItems = 0;

        if (Array.isArray(responseData)) {
          patientsList = responseData;
          totalItems = responseData.length;
        } else if (responseData.data) {
          if (Array.isArray(responseData.data)) {
            patientsList = responseData.data;
            totalItems =
              responseData.total ||
              responseData.totalItems ||
              responseData.data.length;
          } else if (responseData.data.items) {
            patientsList = responseData.data.items;
            totalItems =
              responseData.data.total ||
              responseData.data.totalItems ||
              responseData.data.items.length;
          }
        } else if (responseData.items) {
          patientsList = responseData.items;
          totalItems =
            responseData.total ||
            responseData.totalItems ||
            responseData.items.length;
        }

        setPatients(patientsList);
        setTotal(totalItems);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách bệnh nhân"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      fullName: "",
      dateOfBirth: "",
      gender: "",
      bloodType: "",
      phone: "",
      email: "",
      address: "",
      citizenId: "",
      insuranceNumber: "",
      createdChannel: "admin",
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      fullName: "",
      dateOfBirth: "",
      gender: "",
      bloodType: "",
      phone: "",
      email: "",
      address: "",
      citizenId: "",
      insuranceNumber: "",
      createdChannel: "admin",
    });
    setFormErrors({});
  };

  // eslint-disable-next-line no-unused-vars
  const handleOpenEditModal = async (patient) => {
    try {
      // Set auth token before API call
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      setLoading(true);
      const response = await PatientServiceAPI.GetPatientById(
        patient.patientId || patient.id
      );
      if (response.status === 200 && response.data) {
        const patientData = response.data.data || response.data;
        setPatientToEdit(patient);
        setFormData({
          fullName: patientData.fullName || "",
          dateOfBirth: patientData.dateOfBirth
            ? patientData.dateOfBirth.split("T")[0]
            : "",
          gender: String(patientData.gender || ""),
          bloodType: String(patientData.bloodType || ""),
          phone: patientData.phone || "",
          email: patientData.email || "",
          address: patientData.address || "",
          citizenId: patientData.citizenId || "",
          insuranceNumber: patientData.insuranceNumber || "",
        });
        setFormErrors({});
        setIsEditModalOpen(true);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tải thông tin bệnh nhân"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setPatientToEdit(null);
    setFormData({
      fullName: "",
      dateOfBirth: "",
      gender: "",
      bloodType: "",
      phone: "",
      email: "",
      address: "",
      citizenId: "",
      insuranceNumber: "",
      createdChannel: "admin",
    });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = async () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Họ và tên là bắt buộc";
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = "Ngày sinh là bắt buộc";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        errors.dateOfBirth = "Ngày sinh không thể lớn hơn ngày hiện tại";
      }
    }

    if (formData.gender === "") {
      errors.gender = "Giới tính là bắt buộc";
    }

    if (formData.bloodType === "") {
      errors.bloodType = "Nhóm máu là bắt buộc";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Số điện thoại là bắt buộc";
    } else if (!/^0\d{9}$/.test(formData.phone.trim())) {
      errors.phone = "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số";
    }

    if (!formData.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Email không hợp lệ";
    }

    if (!formData.address.trim()) {
      errors.address = "Địa chỉ là bắt buộc";
    }

    if (!formData.citizenId.trim()) {
      errors.citizenId = "CCCD/CMND là bắt buộc";
    } else if (!/^\d{9,12}$/.test(formData.citizenId.trim())) {
      errors.citizenId = "CCCD/CMND phải có từ 9 đến 12 chữ số";
    }

    // Check for duplicates (only for create mode)
    if (isCreateModalOpen) {
      try {
        // Check phone
        if (formData.phone && formData.phone.trim()) {
          const phoneCheckParams = { phone: formData.phone.trim() };
          const phoneCheckResponse = await PatientServiceAPI.GetAllPatients(
            phoneCheckParams
          );
          if (phoneCheckResponse.status === 200 && phoneCheckResponse.data) {
            const phoneCheckData =
              phoneCheckResponse.data.data || phoneCheckResponse.data;
            const phonePatients = Array.isArray(phoneCheckData)
              ? phoneCheckData
              : phoneCheckData.items || [];

            const phoneExists = phonePatients.some(
              (p) => p.phone && p.phone.trim() === formData.phone.trim()
            );
            if (phoneExists) {
              errors.phone = "Số điện thoại đã tồn tại";
            }
          }
        }

        // Check email
        if (formData.email && formData.email.trim()) {
          const emailCheckParams = { email: formData.email.trim() };
          const emailCheckResponse = await PatientServiceAPI.GetAllPatients(
            emailCheckParams
          );
          if (emailCheckResponse.status === 200 && emailCheckResponse.data) {
            const emailCheckData =
              emailCheckResponse.data.data || emailCheckResponse.data;
            const emailPatients = Array.isArray(emailCheckData)
              ? emailCheckData
              : emailCheckData.items || [];

            const emailExists = emailPatients.some(
              (p) =>
                p.email &&
                p.email.trim().toLowerCase() ===
                  formData.email.trim().toLowerCase()
            );
            if (emailExists) {
              errors.email = "Email đã tồn tại";
            }
          }
        }

        // Check citizenId
        if (formData.citizenId && formData.citizenId.trim()) {
          const citizenIdCheckParams = {
            citizenId: formData.citizenId.trim(),
          };
          const citizenIdCheckResponse = await PatientServiceAPI.GetAllPatients(
            citizenIdCheckParams
          );
          if (
            citizenIdCheckResponse.status === 200 &&
            citizenIdCheckResponse.data
          ) {
            const citizenIdCheckData =
              citizenIdCheckResponse.data.data || citizenIdCheckResponse.data;
            const citizenIdPatients = Array.isArray(citizenIdCheckData)
              ? citizenIdCheckData
              : citizenIdCheckData.items || [];

            const citizenIdExists = citizenIdPatients.some(
              (p) =>
                p.citizenId && p.citizenId.trim() === formData.citizenId.trim()
            );
            if (citizenIdExists) {
              errors.citizenId = "CCCD/CMND đã tồn tại";
            }
          }
        }

        // Check insuranceNumber (BHYT)
        if (formData.insuranceNumber && formData.insuranceNumber.trim()) {
          const insuranceCheckParams = {
            insuranceNumber: formData.insuranceNumber.trim(),
          };
          const insuranceCheckResponse = await PatientServiceAPI.GetAllPatients(
            insuranceCheckParams
          );
          if (
            insuranceCheckResponse.status === 200 &&
            insuranceCheckResponse.data
          ) {
            const insuranceCheckData =
              insuranceCheckResponse.data.data || insuranceCheckResponse.data;
            const insurancePatients = Array.isArray(insuranceCheckData)
              ? insuranceCheckData
              : insuranceCheckData.items || [];

            const insuranceExists = insurancePatients.some(
              (p) =>
                p.insuranceNumber &&
                p.insuranceNumber.trim() === formData.insuranceNumber.trim()
            );
            if (insuranceExists) {
              errors.insuranceNumber = "Số thẻ BHYT đã tồn tại";
            }
          }
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        toast.error("Có lỗi xảy ra khi kiểm tra dữ liệu trùng lặp");
      }
    }

    // Check for duplicates in edit mode (exclude current patient)
    if (isEditModalOpen && patientToEdit) {
      try {
        const currentId = patientToEdit.patientId || patientToEdit.id;

        // Check phone
        if (formData.phone && formData.phone.trim()) {
          const phoneCheckParams = { phone: formData.phone.trim() };
          const phoneCheckResponse = await PatientServiceAPI.GetAllPatients(
            phoneCheckParams
          );
          if (phoneCheckResponse.status === 200 && phoneCheckResponse.data) {
            const phoneCheckData =
              phoneCheckResponse.data.data || phoneCheckResponse.data;
            const phonePatients = Array.isArray(phoneCheckData)
              ? phoneCheckData
              : phoneCheckData.items || [];

            const phoneExists = phonePatients.some((p) => {
              const pId = p.patientId || p.id;
              return (
                pId !== currentId &&
                p.phone &&
                p.phone.trim() === formData.phone.trim()
              );
            });
            if (phoneExists) {
              errors.phone = "Số điện thoại đã tồn tại";
            }
          }
        }

        // Check email
        if (formData.email && formData.email.trim()) {
          const emailCheckParams = { email: formData.email.trim() };
          const emailCheckResponse = await PatientServiceAPI.GetAllPatients(
            emailCheckParams
          );
          if (emailCheckResponse.status === 200 && emailCheckResponse.data) {
            const emailCheckData =
              emailCheckResponse.data.data || emailCheckResponse.data;
            const emailPatients = Array.isArray(emailCheckData)
              ? emailCheckData
              : emailCheckData.items || [];

            const emailExists = emailPatients.some((p) => {
              const pId = p.patientId || p.id;
              return (
                pId !== currentId &&
                p.email &&
                p.email.trim().toLowerCase() ===
                  formData.email.trim().toLowerCase()
              );
            });
            if (emailExists) {
              errors.email = "Email đã tồn tại";
            }
          }
        }

        // Check citizenId
        if (formData.citizenId && formData.citizenId.trim()) {
          const citizenIdCheckParams = {
            citizenId: formData.citizenId.trim(),
          };
          const citizenIdCheckResponse = await PatientServiceAPI.GetAllPatients(
            citizenIdCheckParams
          );
          if (
            citizenIdCheckResponse.status === 200 &&
            citizenIdCheckResponse.data
          ) {
            const citizenIdCheckData =
              citizenIdCheckResponse.data.data || citizenIdCheckResponse.data;
            const citizenIdPatients = Array.isArray(citizenIdCheckData)
              ? citizenIdCheckData
              : citizenIdCheckData.items || [];

            const citizenIdExists = citizenIdPatients.some((p) => {
              const pId = p.patientId || p.id;
              return (
                pId !== currentId &&
                p.citizenId &&
                p.citizenId.trim() === formData.citizenId.trim()
              );
            });
            if (citizenIdExists) {
              errors.citizenId = "CCCD/CMND đã tồn tại";
            }
          }
        }

        // Check insuranceNumber (BHYT)
        if (formData.insuranceNumber && formData.insuranceNumber.trim()) {
          const insuranceCheckParams = {
            insuranceNumber: formData.insuranceNumber.trim(),
          };
          const insuranceCheckResponse = await PatientServiceAPI.GetAllPatients(
            insuranceCheckParams
          );
          if (
            insuranceCheckResponse.status === 200 &&
            insuranceCheckResponse.data
          ) {
            const insuranceCheckData =
              insuranceCheckResponse.data.data || insuranceCheckResponse.data;
            const insurancePatients = Array.isArray(insuranceCheckData)
              ? insuranceCheckData
              : insuranceCheckData.items || [];

            const insuranceExists = insurancePatients.some((p) => {
              const pId = p.patientId || p.id;
              return (
                pId !== currentId &&
                p.insuranceNumber &&
                p.insuranceNumber.trim() === formData.insuranceNumber.trim()
              );
            });
            if (insuranceExists) {
              errors.insuranceNumber = "Số thẻ BHYT đã tồn tại";
            }
          }
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        toast.error("Có lỗi xảy ra khi kiểm tra dữ liệu trùng lặp");
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!(await validateForm())) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Set auth token before API call
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      const data = {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: parseInt(formData.gender, 10),
        bloodType: parseInt(formData.bloodType, 10),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        citizenId: formData.citizenId.trim(),
        insuranceNumber: formData.insuranceNumber.trim() || "",
        createdChannel: formData.createdChannel,
      };

      const response = await PatientServiceAPI.CreatePatient(data);
      if (response.status >= 200 && response.status < 300) {
        toast.success("Tạo bệnh nhân thành công!");
        handleCloseCreateModal();
        fetchPatients();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Có lỗi xảy ra khi tạo bệnh nhân";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    if (!(await validateForm())) {
      return;
    }

    if (!patientToEdit) {
      toast.error("Không tìm thấy thông tin bệnh nhân để chỉnh sửa");
      return;
    }

    const id = patientToEdit.patientId || patientToEdit.id;
    if (!id) {
      toast.error("Không tìm thấy ID bệnh nhân để chỉnh sửa");
      return;
    }

    setIsSubmitting(true);
    try {
      // Set auth token before API call
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      const data = {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: parseInt(formData.gender, 10),
        bloodType: parseInt(formData.bloodType, 10),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        citizenId: formData.citizenId.trim(),
        insuranceNumber: formData.insuranceNumber.trim() || "",
      };

      const response = await PatientServiceAPI.UpdatePatient(id, data);
      if (response.status >= 200 && response.status < 300) {
        toast.success("Cập nhật bệnh nhân thành công!");
        handleCloseEditModal();
        fetchPatients();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Có lỗi xảy ra khi cập nhật bệnh nhân";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenViewModal = async (patient) => {
    const id = patient.patientId || patient.id;
    if (!id) {
      toast.error("Không tìm thấy ID bệnh nhân");
      return;
    }
    setIsLoadingDetail(true);
    setIsViewModalOpen(true);
    try {
      // Set auth token before API call
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      const response = await PatientServiceAPI.GetPatientById(id);
      if (response.status === 200 && response.data) {
        const patientData = response.data.data || response.data;
        setPatientDetail(patientData);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tải thông tin bệnh nhân"
      );
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setPatientDetail(null);
  };

  // eslint-disable-next-line no-unused-vars
  const handleOpenDeleteModal = (patient) => {
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPatientToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    const id = patientToDelete.patientId || patientToDelete.id;
    if (!id) {
      toast.error("Không tìm thấy ID bệnh nhân để xóa");
      return;
    }
    setIsDeleting(true);
    try {
      // Set auth token before API call
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      const response = await PatientServiceAPI.DeletePatient(id);
      if (response.status === 200 || response.status === 204) {
        toast.success("Xóa bệnh nhân thành công!");
        handleCloseDeleteModal();
        fetchPatients();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Có lỗi xảy ra khi xóa bệnh nhân";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const getGenderLabel = (gender) => {
    const genderMap = { 0: "Nữ", 1: "Nam", 2: "Khác" };
    return genderMap[gender] || "-";
  };

  const getBloodTypeLabel = (bloodType) => {
    const bloodTypeMap = { 0: "A", 1: "B", 2: "AB", 3: "O" };
    return bloodTypeMap[bloodType] || "-";
  };

  return (
    <AdminLayout pageTitle="Patients Management" breadcrumbs={breadcrumbs}>
      <div className="patients-container">
        <div className="patients-header">
          <div className="patients-header-left">
            <h1>Quản lý bệnh nhân</h1>
            <p>Quản lý thông tin và hồ sơ bệnh nhân</p>
          </div>
          <button
            className="add-patient-button"
            onClick={handleOpenCreateModal}
          >
            <FiPlus size={20} />
            <span>Thêm bệnh nhân</span>
          </button>
        </div>

        <div className="patients-content">
          {/* Filters Section */}
          <div className="patients-filters-section">
            <div className="search-section">
              <div className="search-box">
                <FiSearch size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="patients-table-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
              </div>
            ) : (
              <table className="patients-table">
                <thead>
                  <tr>
                    <th
                      className="sortable"
                      onClick={() => handleSort("fullName")}
                      style={{ cursor: "pointer" }}
                    >
                      Họ và tên{getSortIcon("fullName")}
                    </th>
                    <th>Ngày sinh</th>
                    <th>Giới tính</th>
                    <th>Nhóm máu</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th
                      className="sortable date-header"
                      onClick={() => handleSort("createdAt")}
                      style={{ cursor: "pointer" }}
                    >
                      Ngày tạo{getSortIcon("createdAt")}
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length > 0 ? (
                    patients.map((patient, index) => {
                      const patientId =
                        patient.patientId || patient.id || index;
                      return (
                        <tr key={patientId}>
                          <td>
                            <span className="patient-name">
                              {patient.fullName || "-"}
                            </span>
                          </td>
                          <td>
                            {patient.dateOfBirth
                              ? new Date(
                                  patient.dateOfBirth
                                ).toLocaleDateString("vi-VN")
                              : "-"}
                          </td>
                          <td>{getGenderLabel(patient.gender)}</td>
                          <td>{getBloodTypeLabel(patient.bloodType)}</td>
                          <td>{patient.phone || "-"}</td>
                          <td>{patient.email || "-"}</td>
                          <td className="date-cell">
                            {patient.createdAt
                              ? new Date(patient.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "-"}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-button view"
                                onClick={() => handleOpenViewModal(patient)}
                                title="Xem chi tiết"
                              >
                                <FiEye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "center", padding: "40px" }}
                      >
                        Không tìm thấy bệnh nhân nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="patients-pagination">
            <CustomPagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
            />
          </div>
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="modal-overlay" onClick={handleCloseCreateModal}>
            <div
              className="patients-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Thêm bệnh nhân mới</h2>
                <button
                  className="modal-close"
                  onClick={handleCloseCreateModal}
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleCreatePatient}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Họ và tên <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className={`form-input ${
                        formErrors.fullName ? "error" : ""
                      }`}
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="Nhập họ và tên"
                    />
                    {formErrors.fullName && (
                      <span className="form-error">{formErrors.fullName}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Ngày sinh <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        className={`form-input ${
                          formErrors.dateOfBirth ? "error" : ""
                        }`}
                        value={formData.dateOfBirth}
                        onChange={handleFormChange}
                        max={new Date().toISOString().split("T")[0]}
                      />
                      {formErrors.dateOfBirth && (
                        <span className="form-error">
                          {formErrors.dateOfBirth}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Giới tính <span className="required">*</span>
                      </label>
                      <select
                        name="gender"
                        className={`form-input ${
                          formErrors.gender ? "error" : ""
                        }`}
                        value={formData.gender}
                        onChange={handleFormChange}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="1">Nam</option>
                        <option value="0">Nữ</option>
                        <option value="2">Khác</option>
                      </select>
                      {formErrors.gender && (
                        <span className="form-error">{formErrors.gender}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Nhóm máu <span className="required">*</span>
                      </label>
                      <select
                        name="bloodType"
                        className={`form-input ${
                          formErrors.bloodType ? "error" : ""
                        }`}
                        value={formData.bloodType}
                        onChange={handleFormChange}
                      >
                        <option value="">Chọn nhóm máu</option>
                        <option value="0">A</option>
                        <option value="1">B</option>
                        <option value="2">AB</option>
                        <option value="3">O</option>
                      </select>
                      {formErrors.bloodType && (
                        <span className="form-error">
                          {formErrors.bloodType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Số điện thoại <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="phone"
                        className={`form-input ${
                          formErrors.phone ? "error" : ""
                        }`}
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="Nhập số điện thoại"
                        maxLength={10}
                      />
                      {formErrors.phone && (
                        <span className="form-error">{formErrors.phone}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className={`form-input ${
                          formErrors.email ? "error" : ""
                        }`}
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Nhập email"
                      />
                      {formErrors.email && (
                        <span className="form-error">{formErrors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Địa chỉ <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      className={`form-input ${
                        formErrors.address ? "error" : ""
                      }`}
                      value={formData.address}
                      onChange={handleFormChange}
                      placeholder="Nhập địa chỉ"
                    />
                    {formErrors.address && (
                      <span className="form-error">{formErrors.address}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        CCCD/CMND <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="citizenId"
                        className={`form-input ${
                          formErrors.citizenId ? "error" : ""
                        }`}
                        value={formData.citizenId}
                        onChange={handleFormChange}
                        placeholder="Nhập CCCD/CMND"
                        maxLength={12}
                      />
                      {formErrors.citizenId && (
                        <span className="form-error">
                          {formErrors.citizenId}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Số thẻ BHYT</label>
                      <input
                        type="text"
                        name="insuranceNumber"
                        className={`form-input ${
                          formErrors.insuranceNumber ? "error" : ""
                        }`}
                        value={formData.insuranceNumber}
                        onChange={handleFormChange}
                        placeholder="Nhập số thẻ BHYT"
                      />
                      {formErrors.insuranceNumber && (
                        <span className="form-error">
                          {formErrors.insuranceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="modal-button cancel"
                    onClick={handleCloseCreateModal}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="modal-button primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang tạo..." : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="modal-overlay" onClick={handleCloseEditModal}>
            <div
              className="patients-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Chỉnh sửa bệnh nhân</h2>
                <button className="modal-close" onClick={handleCloseEditModal}>
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdatePatient}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Họ và tên <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className={`form-input ${
                        formErrors.fullName ? "error" : ""
                      }`}
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="Nhập họ và tên"
                    />
                    {formErrors.fullName && (
                      <span className="form-error">{formErrors.fullName}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Ngày sinh <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        className={`form-input ${
                          formErrors.dateOfBirth ? "error" : ""
                        }`}
                        value={formData.dateOfBirth}
                        onChange={handleFormChange}
                        max={new Date().toISOString().split("T")[0]}
                      />
                      {formErrors.dateOfBirth && (
                        <span className="form-error">
                          {formErrors.dateOfBirth}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Giới tính <span className="required">*</span>
                      </label>
                      <select
                        name="gender"
                        className={`form-input ${
                          formErrors.gender ? "error" : ""
                        }`}
                        value={formData.gender}
                        onChange={handleFormChange}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="1">Nam</option>
                        <option value="0">Nữ</option>
                        <option value="2">Khác</option>
                      </select>
                      {formErrors.gender && (
                        <span className="form-error">{formErrors.gender}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Nhóm máu <span className="required">*</span>
                      </label>
                      <select
                        name="bloodType"
                        className={`form-input ${
                          formErrors.bloodType ? "error" : ""
                        }`}
                        value={formData.bloodType}
                        onChange={handleFormChange}
                      >
                        <option value="">Chọn nhóm máu</option>
                        <option value="0">A</option>
                        <option value="1">B</option>
                        <option value="2">AB</option>
                        <option value="3">O</option>
                      </select>
                      {formErrors.bloodType && (
                        <span className="form-error">
                          {formErrors.bloodType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Số điện thoại <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="phone"
                        className={`form-input ${
                          formErrors.phone ? "error" : ""
                        }`}
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="Nhập số điện thoại"
                        maxLength={10}
                      />
                      {formErrors.phone && (
                        <span className="form-error">{formErrors.phone}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className={`form-input ${
                          formErrors.email ? "error" : ""
                        }`}
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Nhập email"
                      />
                      {formErrors.email && (
                        <span className="form-error">{formErrors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Địa chỉ <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      className={`form-input ${
                        formErrors.address ? "error" : ""
                      }`}
                      value={formData.address}
                      onChange={handleFormChange}
                      placeholder="Nhập địa chỉ"
                    />
                    {formErrors.address && (
                      <span className="form-error">{formErrors.address}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        CCCD/CMND <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="citizenId"
                        className={`form-input ${
                          formErrors.citizenId ? "error" : ""
                        }`}
                        value={formData.citizenId}
                        onChange={handleFormChange}
                        placeholder="Nhập CCCD/CMND"
                        maxLength={12}
                      />
                      {formErrors.citizenId && (
                        <span className="form-error">
                          {formErrors.citizenId}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Số thẻ BHYT</label>
                      <input
                        type="text"
                        name="insuranceNumber"
                        className={`form-input ${
                          formErrors.insuranceNumber ? "error" : ""
                        }`}
                        value={formData.insuranceNumber}
                        onChange={handleFormChange}
                        placeholder="Nhập số thẻ BHYT"
                      />
                      {formErrors.insuranceNumber && (
                        <span className="form-error">
                          {formErrors.insuranceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="modal-button cancel"
                    onClick={handleCloseEditModal}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="modal-button primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Detail Modal */}
        {isViewModalOpen && (
          <div className="modal-overlay" onClick={handleCloseViewModal}>
            <div
              className="patients-modal view-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Chi tiết bệnh nhân</h2>
                <button className="modal-close" onClick={handleCloseViewModal}>
                  <FiX size={20} />
                </button>
              </div>
              <div className="modal-body">
                {isLoadingDetail ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin...</p>
                  </div>
                ) : patientDetail ? (
                  <div className="patient-detail">
                    <div className="detail-section">
                      <h3 className="detail-section-title">Thông tin cơ bản</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label className="detail-label">Họ và tên:</label>
                          <span className="detail-value">
                            {patientDetail.fullName || "-"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">Ngày sinh:</label>
                          <span className="detail-value">
                            {patientDetail.dateOfBirth
                              ? new Date(
                                  patientDetail.dateOfBirth
                                ).toLocaleDateString("vi-VN")
                              : "-"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">Giới tính:</label>
                          <span className="detail-value">
                            {getGenderLabel(patientDetail.gender)}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">Nhóm máu:</label>
                          <span className="detail-value">
                            {getBloodTypeLabel(patientDetail.bloodType)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3 className="detail-section-title">
                        Thông tin liên hệ
                      </h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label className="detail-label">Số điện thoại:</label>
                          <span className="detail-value">
                            {patientDetail.phone || "-"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">Email:</label>
                          <span className="detail-value">
                            {patientDetail.email || "-"}
                          </span>
                        </div>
                        <div className="detail-item full-width">
                          <label className="detail-label">Địa chỉ:</label>
                          <span className="detail-value">
                            {patientDetail.address || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3 className="detail-section-title">
                        Thông tin định danh
                      </h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label className="detail-label">CCCD/CMND:</label>
                          <span className="detail-value">
                            {patientDetail.citizenId || "-"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">Số thẻ BHYT:</label>
                          <span className="detail-value">
                            {patientDetail.insuranceNumber || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3 className="detail-section-title">
                        Thông tin hệ thống
                      </h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label className="detail-label">Ngày tạo:</label>
                          <span className="detail-value">
                            {patientDetail.createdAt
                              ? new Date(
                                  patientDetail.createdAt
                                ).toLocaleDateString("vi-VN")
                              : "-"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">Kênh tạo:</label>
                          <span className="detail-value">
                            {patientDetail.createdChannel || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-text">
                    Không tìm thấy thông tin bệnh nhân
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="modal-button primary"
                  onClick={handleCloseViewModal}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="modal-overlay" onClick={handleCloseDeleteModal}>
            <div
              className="delete-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Xác nhận xóa</h2>
                <button
                  className="modal-close"
                  onClick={handleCloseDeleteModal}
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-confirm-icon">
                  <FiAlertTriangle size={48} />
                </div>
                <div className="delete-confirm-message">
                  <p>
                    Bạn có chắc chắn muốn xóa bệnh nhân{" "}
                    <strong>{patientToDelete?.fullName || "này"}</strong> không?
                  </p>
                  <p className="delete-confirm-warning">
                    Hành động này không thể hoàn tác!
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  className="modal-button delete-button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PatientsManagement;
