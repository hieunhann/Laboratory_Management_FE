import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../configs/axios";
import { useSearchParams } from "react-router-dom";
import { startInstrumentRun } from "../../../apis/InstrumentAPI.jsx";
import AdminLayout from "../../admin/layout/AdminLayout";
import { setAuthToken } from "../../../utils/auth";
import { FiDroplet, FiCheckCircle } from "react-icons/fi";
import { Modal, Button, Card, Spin } from "antd";
import "./InstrumentRun.css";
import { getAllInstrument } from "../../../apis/InstrumentAPI.js";

const BASE_URL = "http://localhost:8080";

// Không dùng defaultResults nữa, sẽ lấy từ API

const InstrumentRun = () => {
  // const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId");
  const bookingCode = params.get("bookingCode") || "";
  const patientName = params.get("patientName") || "";

  const [seconds, setSeconds] = useState(30);
  const [phase, setPhase] = useState("pending"); // pending -> running -> done | error
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]); // [{catalogName, parameters: [{name, value, unit, referenceRange}]}]
  // Instrument selection modal state
  const [showModal, setShowModal] = useState(false);
  const [instruments, setInstruments] = useState([]);
  const [loadingInstruments, setLoadingInstruments] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const hasStartedRef = useRef(false);
  const breadcrumbs = useMemo(
    () => [
      { name: "Phòng Xét Nghiệm", link: "/instruments" },
      { name: "Mô phỏng" },
    ],
    []
  );

  useEffect(() => {
    if (!bookingId) return;

    // Kiểm tra xem đã có instrument run trong localStorage chưa
    const storageKey = `instrument_run_${bookingId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      // Đã chọn máy rồi, khôi phục trạng thái
      try {
        const data = JSON.parse(stored);
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const remaining = Math.max(0, (data.totalSeconds || 15) - elapsed);

        setShowModal(false);
        setWaiting(true);
        hasStartedRef.current = false;

        if (data.phase === "done") {
          setPhase("done");
          setProgress(100);
          setSeconds(0);
        } else if (remaining > 0) {
          // Vẫn còn đang chạy
          setPhase("pending");
          setSeconds(remaining);
          setProgress(0);
        } else {
          // Đã hết thời gian nhưng chưa gọi API
          setPhase("pending");
          setSeconds(0);
          setProgress(0);
        }

        // Lấy thông tin máy đã chọn
        if (data.instrumentCode) {
          setLoadingInstruments(true);
          getAllInstrument()
            .then((instrumentData) => {
              const instruments = Array.isArray(instrumentData.items)
                ? instrumentData.items
                : instrumentData;
              const selected = instruments.find(
                (ins) => ins.instrumentCode === data.instrumentCode
              );
              if (selected) {
                setSelectedInstrument(selected);
              }
              setInstruments(instruments);
            })
            .catch(() => setInstruments([]))
            .finally(() => setLoadingInstruments(false));
        }
      } catch (e) {
        console.error("Error parsing stored run data:", e);
        // Nếu có lỗi, hiển thị modal chọn máy
        setShowModal(true);
        setSelectedInstrument(null);
        setWaiting(false);
        hasStartedRef.current = false;
        setLoadingInstruments(true);
        getAllInstrument()
          .then((data) => {
            setInstruments(Array.isArray(data.items) ? data.items : data);
          })
          .catch(() => setInstruments([]))
          .finally(() => setLoadingInstruments(false));
      }
    } else {
      // Chưa chọn máy, hiển thị modal
      setShowModal(true);
      setSelectedInstrument(null);
      setWaiting(false);
      hasStartedRef.current = false;
      setLoadingInstruments(true);
      getAllInstrument()
        .then((data) => {
          setInstruments(Array.isArray(data.items) ? data.items : data);
        })
        .catch(() => setInstruments([]))
        .finally(() => setLoadingInstruments(false));
    }

    // Reset các state khác nếu cần
    setMessage("");
    setResults([]);
  }, [bookingId]);

  // Khi bấm tiếp tục, đợi 15s rồi run API
  useEffect(() => {
    if (!waiting || !selectedInstrument || !bookingId) return;

    // Kiểm tra xem có đang khôi phục trạng thái từ localStorage không
    const storageKey = `instrument_run_${bookingId}`;
    const stored = localStorage.getItem(storageKey);

    // Nếu chưa có localStorage, tạo mới
    if (!stored) {
      setPhase("pending");
      setProgress(0);
      setSeconds(15);
      setMessage("");

      // Lưu thông tin vào localStorage để theo dõi khi quay lại
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          startTime: Date.now(),
          phase: "pending",
          instrumentCode: selectedInstrument.instrumentCode,
          instrumentName:
            selectedInstrument.name || selectedInstrument.instrumentName,
          totalSeconds: 15,
        })
      );
    }
    // Nếu đã có localStorage, giữ nguyên seconds đã được set từ useEffect đầu tiên

    // Luôn tạo timer để đếm ngược
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          // Gọi API startInstrumentRun
          (async () => {
            if (hasStartedRef.current) return; // guard: ensure we only start once
            hasStartedRef.current = true;
            setPhase("running");
            setProgress(35);
            try {
              const data = await startInstrumentRun(
                bookingId,
                selectedInstrument.instrumentCode
              );
              const status = data?.status || data?.Status || "";
              const msg = String(data?.message || data?.Message || "");
              setMessage(msg);
              setProgress(100);
              if (status === 1) {
                setPhase("done");
                // Cập nhật localStorage
                const storageKey = `instrument_run_${bookingId}`;
                localStorage.setItem(
                  storageKey,
                  JSON.stringify({
                    startTime: Date.now(),
                    phase: "done",
                    instrumentCode: selectedInstrument.instrumentCode,
                    instrumentName:
                      selectedInstrument.name ||
                      selectedInstrument.instrumentName,
                  })
                );
              } else {
                setPhase("error");
              }
            } catch (e) {
              let msg = "Không thể khởi chạy thiết bị. Vui lòng thử lại.";
              if (typeof e === "string") {
                msg = e;
              } else if (e?.response?.data?.message) {
                msg = String(e.response.data.message);
              } else if (e?.message) {
                msg = String(e.message);
              } else if (e) {
                try {
                  msg = JSON.stringify(e);
                } catch {
                  msg = "Không thể khởi chạy thiết bị. Vui lòng thử lại.";
                }
              }
              setMessage(msg);
              setPhase("error");
            }
          })();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [waiting, selectedInstrument, bookingId]);

  // Kick off API when countdown reaches 0
  useEffect(() => {
    if (phase !== "pending" || seconds !== 0 || !bookingId) return;

    const run = async () => {
      const storageKey = `instrument_run_${bookingId}`;
      const stored = localStorage.getItem(storageKey);
      const originalStartTime = stored
        ? JSON.parse(stored).startTime
        : Date.now();

      try {
        setPhase("running");
        setProgress(35);

        // Cập nhật localStorage - GIỮ NGUYÊN startTime gốc
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            startTime: originalStartTime,
            phase: "running",
            progress: 35,
            message: "",
          })
        );

        const data = await startInstrumentRun(bookingId);
        const status = data?.status || data?.Status || "";
        const msg = String(data?.message || data?.Message || "");
        setMessage(msg);

        // Simulate progress finishing quickly after response
        setProgress(100);
        if (status === 1) {
          setPhase("done");
        } else {
          setPhase("error");
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              startTime: originalStartTime,
              phase: "error",
              progress: 100,
              message: msg,
            })
          );
        }
      } catch (e) {
        let msg = "Không thể khởi chạy thiết bị. Vui lòng thử lại.";

        if (typeof e === "string") {
          msg = e;
        } else if (e?.response?.data?.message) {
          msg = String(e.response.data.message);
        } else if (e?.message) {
          msg = String(e.message);
        } else if (e) {
          try {
            msg = JSON.stringify(e);
          } catch {
            msg = "Không thể khởi chạy thiết bị. Vui lòng thử lại.";
          }
        }

        setMessage(msg);
        setPhase("error");
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            startTime: originalStartTime,
            phase: "error",
            progress: 0,
            message: msg,
          })
        );
      }
    };

    run();
  }, [seconds, phase, bookingId]);

  // Khi phase done, gọi API lấy kết quả thực tế
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setAuthToken(token);
    if (phase === "done" && bookingId) {
      const storageKey = `instrument_run_${bookingId}`;
      localStorage.removeItem(storageKey);

      // Gọi API lấy kết quả
      const fetchResults = async () => {
        try {
          const res = await api.get(
            `/testorder/api/bookings/${bookingId}/results`
          );
          if (res.data && Array.isArray(res.data.catalogs)) {
            setResults(res.data.catalogs);
          } else {
            setResults([]);
          }
        } catch (e) {
          setResults([e || "Error"]);
        }
      };
      fetchResults();
    }
  }, [phase, bookingId]);

  return (
    <AdminLayout pageTitle="Phòng Xét Nghiệm Tự Động" breadcrumbs={breadcrumbs}>
      {/* Modal chọn máy */}
      <Modal
        open={showModal}
        title="Chọn máy thực hiện xét nghiệm"
        footer={null}
        closable={false}
        centered
        width={1300}
        bodyStyle={{ minHeight: 100 }}
      >
        {loadingInstruments ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="ir-instrument-modal">
            {instruments.length === 0 ? (
              <div>Không có máy nào khả dụng.</div>
            ) : (
              instruments.map((ins) => {
                const insKey = ins.instrumentCode;
                const selectedKey =
                  selectedInstrument && selectedInstrument.instrumentCode;
                const isSelectable =
                  ins.status === 0 &&
                  (ins.reagentStatus === 0 || ins.reagentStatus === 1);
                return (
                  <div
                    key={insKey}
                    className={
                      "ir-instrument-card" +
                      (selectedKey === insKey ? " selected" : "") +
                      (!isSelectable ? " disabled" : "")
                    }
                    tabIndex={isSelectable ? 0 : -1}
                    onClick={() => isSelectable && setSelectedInstrument(ins)}
                    onKeyDown={(e) => {
                      if (!isSelectable) return;
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedInstrument(ins);
                    }}
                  >
                    <div className="ir-instrument-status-row">
                      <span
                        className={`ir-badge-status ${
                          ins.status === 0
                            ? "active"
                            : ins.status === 1
                            ? "inactive"
                            : ins.status === 2
                            ? "error"
                            : ins.status === 3
                            ? "maintenance"
                            : ""
                        }`}
                      >
                        {ins.status === 0
                          ? "Hoạt động"
                          : ins.status === 1
                          ? "Không hoạt động"
                          : ins.status === 2
                          ? "Máy bị lỗi"
                          : ins.status === 3
                          ? "Máy đang bảo trì"
                          : "Chưa có trạng thái"}
                      </span>
                      <span
                        className={`ir-badge-reagent ${
                          ins.reagentStatus === 0
                            ? "full"
                            : ins.reagentStatus === 1
                            ? "low"
                            : ins.reagentStatus === 2
                            ? "empty"
                            : ""
                        }`}
                      >
                        {ins.reagentStatus === 0
                          ? "Hóa chất đầy đủ"
                          : ins.reagentStatus === 1
                          ? "Hóa chất sắp hết"
                          : ins.reagentStatus === 2
                          ? "Hóa chất đã hết"
                          : "Trạng thái hóa chất lỗi"}
                      </span>
                    </div>
                    <div className="ir-instrument-title">
                      {ins.name ||
                        ins.instrumentName ||
                        ins.code ||
                        ins.instrumentCode}
                    </div>
                    <div className="img-box">
                      <img
                        src={`${BASE_URL}/instrument/` + ins.imagePath || ""}
                      />
                    </div>
                    <div className="ir-instrument-desc">
                      {ins.description || ins.type || ""}
                    </div>
                    <div className="ir-instrument-code">
                      Mã: {ins.instrumentCode || ins.code || ins.id}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        <div className="ir-instrument-modal-footer">
          <Button
            type="primary"
            disabled={!selectedInstrument}
            onClick={() => {
              setShowModal(false);
              setWaiting(true);
            }}
          >
            Tiếp tục
          </Button>
        </div>
      </Modal>
      <div className="ir-container">
        <div className="ir-header">
          <h1 className="ir-title">
            <FiDroplet className="ir-title-icon" /> Kết Quả Xét Nghiệm
          </h1>
          <p className="ir-sub">Dưới đây là kết quả xét nghiệm</p>
          <div className="ir-badge">
            <div className="ir-badge-inner">
              <div className="ir-badge-title">Bệnh nhân</div>
              <div className="ir-badge-name">{patientName || "—"}</div>
              <div className="ir-badge-code">
                Mã đặt lịch: {bookingCode || bookingId}
              </div>
            </div>
          </div>
        </div>

        {phase === "pending" && (
          <div className="ir-card waiting">
            <div className="ir-wait-inner">
              {/* <img
                src={bloodCellsGif}
                alt="Blood cells animation"
                style={{
                  width: "150px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              /> */}
              <h2 className="ir-wait-title">Đang Xử Lý Mẫu</h2>
              <p className="ir-wait-desc">Xét nghiệm sẽ tự động bắt đầu sau:</p>
              <div className="ir-countdown">{`${String(
                Math.floor(seconds / 60)
              ).padStart(1, "0")}:${String(seconds % 60).padStart(
                2,
                "0"
              )}`}</div>
              <div className="ir-note">
                Đang trong quá trình lấy mẫu và xét nghiệm,Vui lòng đợi trong
                giây lát
              </div>
            </div>
            <div className="ir-hint">
              💡 Kết quả xét nghiệm sẽ tự động gửi sau khi hết khoảng thời gian
              đợi ở trên.
            </div>
          </div>
        )}

        {(phase === "running" || phase === "done") && (
          <div className="ir-card results">
            <div className="ir-progress-head">
              <span className="ir-progress-label">Tiến Độ Xét Nghiệm</span>
              <span className="ir-progress-percent">
                {progress === 100 ? "100%" : `${progress}%`}
              </span>
            </div>
            <div className="ir-progress">
              <div className="bar" style={{ width: `${progress}%` }} />
            </div>

            {/* Nếu phase là running, hiển thị đang chạy */}
            {phase === "running" && (
              <div className="ir-grid">
                <div>Đang chạy xét nghiệm...</div>
              </div>
            )}

            {/* Nếu phase là done, hiển thị kết quả thật */}
            {phase === "done" && (
              <div className="ir-results-list">
                {results.length === 0 ? (
                  <div>Không có kết quả xét nghiệm.</div>
                ) : (
                  results.map((catalog, idx) => (
                    <div
                      key={catalog.catalogId || idx}
                      className="ir-catalog-block"
                    >
                      <div className="ir-catalog-title">
                        <strong>{catalog.catalogName}</strong>
                        <span
                          style={{ marginLeft: 8, color: "#888", fontSize: 13 }}
                        >
                          {catalog.catalogDescription}
                        </span>
                      </div>
                      {/* Bảng kết quả chỉ số */}
                      <div style={{ overflowX: "auto" }}>
                        <table className="ir-params-table">
                          <thead>
                            <tr>
                              <th>Tên chỉ số</th>
                              <th>Kết quả</th>
                              <th>Đơn vị</th>
                              <th>Giá trị tham chiếu</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(catalog.parameters) &&
                            catalog.parameters.length > 0 ? (
                              catalog.parameters.map((param, pidx) => (
                                <tr key={pidx}>
                                  <td>{param.name}</td>
                                  <strong>
                                    {" "}
                                    <td>{param.value}</td>
                                  </strong>
                                  <td>{param.unit}</td>
                                  <td>{param.referenceRange}</td>
                                  <td>
                                    <span className="ir-param-status">
                                      {param.isNormal === false
                                        ? "Bất thường"
                                        : param.isNormal === true
                                        ? "Bình thường"
                                        : "—"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5}>Không có thông số.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
                <div className="ir-complete">
                  <div className="ir-complete-row">
                    <FiCheckCircle className="ir-complete-icon" />
                    <div>
                      <div className="ir-complete-title">
                        Hoàn Thành Xét Nghiệm
                      </div>
                      <div className="ir-complete-desc">
                        Xét Nghiệm Thành Công, Kết quả xét nghiệm đã được trả về
                        lịch sử xét nghiệm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="ir-footer-hint">
              💡 Kết quả xét nghiệm tự động chạy sau 30 giây kể từ khi check-in
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="ir-card error">
            <div className="ir-complete-icon">⚠️</div>
            <div className="ir-complete-title">
              Không thể hoàn tất xét nghiệm
            </div>
            <div className="ir-complete-desc">
              {String(message || "Vui lòng thử lại hoặc liên hệ quản trị.")}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InstrumentRun;
