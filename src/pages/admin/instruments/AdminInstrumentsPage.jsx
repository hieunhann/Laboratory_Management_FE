import React from "react";
import { useSearchParams } from "react-router-dom";
import InstrumentsManagement from "../../../components/manage/instruments/InstrumentsManagement";
import InstrumentRun from "../../../components/manage/instruments/InstrumentRun";

const AdminInstrumentsPage = () => {
  const [params] = useSearchParams();
  const hasBooking = !!params.get("bookingId");
  return hasBooking ? <InstrumentRun /> : <InstrumentsManagement />;
};

export default AdminInstrumentsPage;
