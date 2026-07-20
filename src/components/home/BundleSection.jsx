// src/components/home/BundleSection.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import "./BundleSection.css";
import { getAllBundles } from "../../services/TestOrderService.jsx";

export default function BundleSection() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      setLoading(true);
      const { items } = await getAllBundles({ page: 1, pageSize: 100 });

      // Lọc chỉ lấy các bundle đang hoạt động
      const activeBundles = (items || []).filter((bundle) => {
        const activeValue =
          bundle?.isActive ?? bundle?.active ?? bundle?.status;
        // Xử lý các trường hợp: boolean, string, number
        if (typeof activeValue === "boolean") {
          return activeValue;
        }
        if (typeof activeValue === "string") {
          return activeValue.toLowerCase() === "true" || activeValue === "1";
        }
        if (typeof activeValue === "number") {
          return activeValue === 1 || activeValue > 0;
        }
        // Mặc định là false nếu không có giá trị (chỉ hiển thị bundle có isActive = true)
        return false;
      });

      // Giới hạn hiển thị tối đa 6 bundle
      setBundles(activeBundles.slice(0, 6));
      setError(null);
    } catch (err) {
      console.error("Error loading bundles:", err);
      setError("Không thể tải gói xét nghiệm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="bundle-section-bg">
      <div className="bundle-section-header">
        <span className="bundle-badge">Các gói xét nghiệm</span>
        <div className="bundle-title-group">
          <h2 className="bundle-title">Các dịch vụ xét nghiệm tại trung tâm</h2>
          <p className="bundle-desc">
            Khám phá các gói xét nghiệm toàn diện được thiết kế để đáp ứng nhu
            cầu chăm sóc sức khỏe của bạn. Từ kiểm tra cơ bản đến các xét nghiệm
            chuyên sâu, chúng tôi cung cấp giải pháp phù hợp cho mọi lứa tuổi.
          </p>
        </div>
        <Link to="/booking" className="bundle-viewall">
          Mua gói ngay &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="bundle-loading">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="bundle-error">
          <p>{error}</p>
        </div>
      ) : bundles.length === 0 ? (
        <div className="bundle-empty">
          <p>Hiện tại chưa có gói xét nghiệm nào đang hoạt động.</p>
        </div>
      ) : (
        <div className="bundle-cards">
          {bundles.map((bundle) => (
            <div key={bundle.bundleId || bundle.id} className="bundle-card">
              <div className="bundle-card-content">
                <div className="bundle-card-header">
                  <h3 className="bundle-card-title">
                    {bundle.bundleName || bundle.name || "Gói xét nghiệm"}
                  </h3>
                  <div className="bundle-price">
                    {formatPrice(bundle.price)}
                  </div>
                </div>
                <p className="bundle-card-desc">
                  {bundle.description ||
                    "Gói xét nghiệm toàn diện giúp đánh giá tình trạng sức khỏe tổng thể."}
                </p>
                {bundle.catalogs && bundle.catalogs.length > 0 && (
                  <div className="bundle-catalogs">
                    <div className="bundle-catalogs-label">
                      Bao gồm {bundle.catalogs.length} danh mục:
                    </div>
                    <div className="bundle-catalogs-list">
                      {bundle.catalogs.slice(0, 3).map((catalog, index) => (
                        <span key={index} className="bundle-catalog-tag">
                          {catalog.testName ||
                            catalog.catalogName ||
                            "Xét nghiệm"}
                        </span>
                      ))}
                      {bundle.catalogs.length > 3 && (
                        <span className="bundle-catalog-more">
                          +{bundle.catalogs.length - 3} khác
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link
                to={`/booking?bundleId=${bundle.bundleId || bundle.id}`}
                className="bundle-book-btn"
              >
                Mua gói ngay
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
