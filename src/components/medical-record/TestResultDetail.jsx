import React, { useState, useEffect } from "react";
import { Spin, Tag } from "antd";
import "./TestResultDetail.css";
import api from "../../configs/axios";

export default function TestResultDetail({
  test,
  onClose,
  inline = false,
  bookingId,
}) {
  const [expandedSections, setExpandedSections] = useState({});
  const [realResult, setRealResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    const fetchAPI = async () => {
      try {
        const response = await api.get(
          `testorder/api/TestResult/booking/${bookingId}`
        );
        if (response.status >= 200 && response.status < 300) {
          setRealResult(response.data);
          console.log(response.data);
        } else {
          setRealResult(null);
          setError("Không lấy được kết quả xét nghiệm thực tế.");
        }
      } catch (err) {
        setRealResult(err || null);
        setError("Không lấy được kết quả xét nghiệm thực tế.");
      } finally {
        setLoading(false);
      }
    };
    fetchAPI();
  }, [bookingId]);

  // Helper to normalize realResult to [{ name, description, tests: [{...}] }]
  const normalizeRealResult = (result) => {
    if (!result) return [];
    // If result is already in expected format
    if (Array.isArray(result)) return result;
    // If result has a 'catalogs' array (API shape)
    if (Array.isArray(result.catalogs)) {
      return result.catalogs.map((cat) => ({
        name: cat.catalogName || cat.name || "Danh mục xét nghiệm",
        description: cat.description || "",
        tests: Array.isArray(cat.parameters)
          ? cat.parameters.map((p) => ({
              name: p.parameterName || p.name,
              value: p.resultValue || p.value,
              unit: p.unit,
              referenceRange: p.referenceRange || p.range,
              isNormal: p.isNormal,
            }))
          : [],
      }));
    }
    // If result has a 'parameters' array (single catalog)
    if (Array.isArray(result.parameters)) {
      return [
        {
          name: result.catalogName || result.name || "Danh mục xét nghiệm",
          description: result.description || "",
          tests: result.parameters.map((p) => ({
            name: p.parameterName || p.name,
            value: p.resultValue || p.value,
            unit: p.unit,
            referenceRange: p.referenceRange || p.range,
            isNormal: p.isNormal,
          })),
        },
      ];
    }
    // Fallback: not recognized
    return [];
  };

  const toggleSection = (index) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  // Decide which data to show: realResult if available and valid
  let sections = [];
  if (realResult) {
    sections = normalizeRealResult(realResult);
  }

  return (
    <div className={`test-result-detail ${inline ? "inline-mode" : ""}`}>
      {/* Header - Only show if not inline */}
      {!inline && (
        <div className="test-result-header">
          <div className="breadcrumb">
            <button onClick={onClose} className="breadcrumb-link">
              Quay lại
            </button>
          </div>
          <h1 className="page-title">{test.title}</h1>
          <p className="page-subtitle">
            Ngày xét nghiệm: {test.date} • Khám tại: {test.location}
          </p>
        </div>
      )}

      {/* Test Results */}
      <div className="test-results-container">
        <div className="results-header">
          <h2 className="section-title">Kết quả xét nghiệm</h2>
        </div>

        {loading ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <div style={{ padding: "24px", color: "red", textAlign: "center" }}>
            {error}
          </div>
        ) : sections.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            Không có kết quả xét nghiệm.
          </div>
        ) : (
          sections.map((section, index) => (
            <div key={index} className="result-section">
              <button
                className="section-header"
                onClick={() => toggleSection(index)}
              >
                <div className="section-header-left">
                  <div className="section-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <div className="section-info">
                    <h3 className="section-name">{section.name}</h3>
                    <p className="section-description">{section.description}</p>
                  </div>
                </div>
                <svg
                  className={`expand-icon ${
                    expandedSections[index] ? "expanded" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSections[index] && (
                <div className="section-content">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Tên xét nghiệm</th>
                        <th>Kết quả</th>
                        <th>Đơn vị</th>
                        <th>Giá trị tham chiếu</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.tests.map((testItem, testIndex) => (
                        <tr key={testIndex}>
                          <td className="test-name">{testItem.name}</td>
                          <td className="test-value">{testItem.value}</td>
                          <td className="test-unit">{testItem.unit}</td>
                          <td className="test-reference">
                            {testItem.referenceRange}
                          </td>
                          <td className="test-status">
                            {testItem.isNormal === true ? (
                              <Tag color="success">Bình thường</Tag>
                            ) : (
                              <Tag color="error">Bất thường</Tag>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Note */}
      {/* <div className="result-footer">
        <div className="footer-note">
          <svg
            className="note-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p>
            Lưu ý: Kết quả xét nghiệm chỉ mang tính chất tham khảo. Vui lòng
            tham khảo ý kiến bác sĩ để được tư vấn và điều trị phù hợp.
          </p>
        </div>
      </div> */}
    </div>
  );
}
