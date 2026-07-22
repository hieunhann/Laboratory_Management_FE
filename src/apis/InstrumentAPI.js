import api from "../configs/axios";
import { setAuthToken } from "../utils/auth";

export const getAllInstrument = async () => {
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await api.get(
    "instrument/api/instruments?page=1&pageSize=10000000"
  );
  return response?.data ?? {};
};

export const startInstrumentRun = async (bookingId, instrumentCode) => {
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const payload = { bookingId, instrumentCode };
  const res = await api.post("instrument/api/instruments/runs", payload);
  return res?.data?.data ?? res?.data ?? {};
};

export default {
  startInstrumentRun,
  getAllInstrument,
};
