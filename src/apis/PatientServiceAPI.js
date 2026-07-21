import api from "../configs/axios";

const URL = "patient/v1/patients";
const URL_REPORT = "testorder/api/test-reports";

export const PatientServiceAPI = {
  CreateProfile: async (data) => {
    return await api.post(URL, data);
  },
  Profile: async () => {
    return await api.get(`${URL}/me`);
  },
  GetProfileByPatientId: async (patientId) => {
    return await api.get(`${URL}/internal/${patientId}`);
  },
  GetMedicalRecords: async (page, pageSize) => {
    return await api.get(`${URL}/mine?page=${page}&pageSize=${pageSize}`);
  },
  UpdateProfile: async (patientId, data) => {
    return await api.put(`${URL}/${patientId}`, data);
  },
  AddNewProfile: async (data) => {
    return await api.post(`${URL}`, data);
  },
  // New endpoints for CRUD management
  GetAllPatients: async (params) => {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append("name", params.name);
    if (params.phone) queryParams.append("phone", params.phone);
    if (params.email) queryParams.append("email", params.email);
    if (params.insuranceNumber)
      queryParams.append("insuranceNumber", params.insuranceNumber);
    if (params.citizenId) queryParams.append("citizenId", params.citizenId);
    if (params.page) queryParams.append("page", params.page);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortDir) queryParams.append("sortDir", params.sortDir);
    return await api.get(`${URL}/all?${queryParams.toString()}`);
  },
  GetPatientById: async (id) => {
    return await api.get(`${URL}/internal/${id}`);
  },
  CreatePatient: async (data) => {
    return await api.post(URL, data);
  },
  UpdatePatient: async (id, data) => {
    return await api.put(`${URL}/${id}`, data);
  },
  DeletePatient: async (id) => {
    return await api.delete(`${URL}/${id}`);
  },
  TestReport: async (BookingId) => {
    return await api.get(`testorder/api/bookings/${BookingId}/reports/file`, {
      responseType: "arraybuffer",
    });
  },
};
