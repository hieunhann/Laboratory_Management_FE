import api from "../configs/axios";
import { setAuthToken } from "../utils/auth";

// Generate instrument code: INSTRUMENT + 10 random digits
const generateInstrumentCode = () => {
  let digits = "";
  for (let i = 0; i < 10; i++) digits += Math.floor(Math.random() * 10);
  return `INSTRUMENT${digits}`;
};

const INSTRUMENT_BASE = "instrument/api/instruments";

const unwrap = (response) => response?.data ?? response;

// Helper function to set auth token before API calls
const ensureAuth = () => {
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
};

export const getInstruments = async (params = {}) => {
  ensureAuth();
  const res = await api.get(INSTRUMENT_BASE, { params });
  return unwrap(res);
};

export const getInstrumentById = async (id) => {
  ensureAuth();
  const res = await api.get(`${INSTRUMENT_BASE}/${id}`);
  return unwrap(res);
};

export const getInstrumentByCode = async (code) => {
  ensureAuth();
  const res = await api.get(`${INSTRUMENT_BASE}/${code}`);
  return unwrap(res);
};

export const createInstrument = async (payload) => {
  ensureAuth();
  const res = await api.post(INSTRUMENT_BASE, payload);
  return unwrap(res);
};

export const updateInstrumentByCode = async (code, payload) => {
  ensureAuth();
  const res = await api.put(`${INSTRUMENT_BASE}/${code}`, payload);
  return unwrap(res);
};

export const deleteInstrumentByCode = async (code) => {
  ensureAuth();
  const res = await api.delete(`${INSTRUMENT_BASE}/${code}`);
  return unwrap(res);
};

export const startInstrumentRun = async (bookingId, instrumentCode) => {
  ensureAuth();
  const code = instrumentCode || generateInstrumentCode();
  const payload = { bookingId, instrumentCode: code };
  const res = await api.post("instrument/api/instruments/runs", payload);
  return res?.data?.data ?? res?.data ?? {};
};

export default {
  getInstruments,
  getInstrumentById,
  getInstrumentByCode,
  createInstrument,
  updateInstrumentByCode,
  deleteInstrumentByCode,
  startInstrumentRun,
};
