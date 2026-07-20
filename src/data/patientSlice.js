import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  patientId: null,
  fullName: "",
  phone: "",
  email: "",
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    setPatient: (state, action) => {
      const { patientId, fullName, phone, email } = action.payload;
      state.patientId = patientId;
      state.fullName = fullName;
      state.phone = phone;
      state.email = email;
    },

    clearPatient: (state) => {
      state.patientId = null;
      state.fullName = "";
      state.phone = "";
      state.email = "";
    },
  },
});

export const { setPatient, clearPatient } = patientSlice.actions;
export default patientSlice.reducer;
