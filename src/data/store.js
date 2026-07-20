import { configureStore } from "@reduxjs/toolkit";
import patientReducer from "../data/patientSlice";

export const store = configureStore({
  reducer: {
    patient: patientReducer,
  },
});
