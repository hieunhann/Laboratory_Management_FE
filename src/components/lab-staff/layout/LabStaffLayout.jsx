import React from "react";
import Sidebar from "../sidebar";
import LabStaffHeader from "../Lab-staffHeader";
import "./LabStaffLayout.css";

const LabStaffLayout = ({ children }) => {
  return (
    <div className="lab-staff-layout">
      <Sidebar />
      <div className="lab-staff-main">
        <LabStaffHeader />
        <div className="lab-staff-content">{children}</div>
      </div>
    </div>
  );
};

export default LabStaffLayout;
