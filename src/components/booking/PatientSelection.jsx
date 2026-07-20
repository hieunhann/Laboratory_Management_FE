import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import { useMedicalRecord } from "../../services/PatientService";
import "./PatientSelection.css";

function PatientSelection({ onSelectPatient, onBack }) {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const { fetchMedicalRecords, medicalRecords } = useMedicalRecord();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      await fetchMedicalRecords(1, 10000); // Lấy tất cả patient
      setLoading(false);
    };

    loadPatients();
  }, []);

  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.patientId);
  };

  const handleContinue = () => {
    const selected = medicalRecords.find(
      (p) => p.patientId === selectedPatientId
    );
    if (selected && onSelectPatient) {
      // Chuẩn hóa object để luôn có đủ các trường cần thiết
      const normalized = {
        patientId: selected.patientId || selected.id || selected._id,
        fullName: selected.fullName || selected.name,
        phone: selected.phone || selected.phoneNumber || selected.sdt,
        email: selected.email || selected.mail,
        ...selected, // giữ lại các trường khác nếu cần
      };
      onSelectPatient(normalized);
    }
  };

  return (
    <div className="patient-selection">
      <h2>Chọn bệnh nhân</h2>
      <p className="patient-selection-sub">
        Vui lòng chọn bệnh nhân để tiếp tục đặt lịch xét nghiệm
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="patient-list">
            {medicalRecords.length === 0 ? (
              <div className="no-patients">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 64, height: 64, margin: "0 auto 16px" }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <p>Chưa có hồ sơ bệnh nhân nào</p>
                <p style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
                  Vui lòng tạo hồ sơ bệnh nhân trước khi đặt lịch
                </p>
              </div>
            ) : (
              medicalRecords.map((patient) => (
                <div
                  key={patient.patientId}
                  className={`patient-card ${
                    selectedPatientId === patient.patientId ? "selected" : ""
                  }`}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="patient-card-header">
                    <div className="patient-avatar">
                      {patient.fullName
                        ? patient.fullName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </div>
                    <div className="patient-info">
                      <h3 className="patient-name">{patient.fullName}</h3>
                      <p className="patient-id">Mã BN: {patient.patientId}</p>
                    </div>
                    {selectedPatientId === patient.patientId && (
                      <div className="selected-icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="patient-details">
                    <div className="detail-row">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: 16, height: 16 }}
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Ngày sinh: {patient.dateOfBirth}</span>
                    </div>
                    <div className="detail-row">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: 16, height: 16 }}
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>{patient.phone}</span>
                    </div>
                    <div className="detail-row">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: 16, height: 16 }}
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{patient?.email}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="patient-selection-actions">
            <button className="btn-back" onClick={() => onBack && onBack()}>
              Quay lại
            </button>
            <button
              className="btn-continue"
              onClick={handleContinue}
              disabled={!selectedPatientId}
            >
              Tiếp tục
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PatientSelection;
