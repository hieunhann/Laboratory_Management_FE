import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer-bg">
      <div className="footer-container">
        <div className="footer-col footer-col-logo">
          <div className="footer-logo">
            <img
              src="/logo.png"
              alt="HemaLink Logo"
              className="footer-logo-img"
            />
            <span className="footer-logo-text">HemaLink</span>
          </div>
          <p className="footer-desc">
            Kết nối bệnh nhân và chẩn đoán, mang đến dịch vụ y tế chất lượng và
            đáng tin cậy.
          </p>
        </div>
        <div className="footer-col">
          <div className="footer-title">Dịch vụ</div>
          <ul>
            <li>
              <Link to="/#services">Xét nghiệm máu</Link>
            </li>
            <li>
              <Link to="/#services">Xét nghiệm sinh hóa</Link>
            </li>
            <li>
              <Link to="/#services">Xét nghiệm vi sinh</Link>
            </li>
            <li>
              <Link to="/#services">Tư vấn sức khỏe</Link>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-title">Về chúng tôi</div>
          <ul>
            <li>
              <Link to="/#hero">Giới thiệu</Link>
            </li>
            <li>
              <Link to="/#equipments">Thiết bị y tế hiện đại</Link>
            </li>
            <li>
              <Link to="/blog">Blog</Link>
            </li>
            <li>
              <Link to="/#hero">Liên hệ</Link>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-title">Liên hệ</div>
          <ul>
            <li>
              Email: <a href="mailto:info@hemalink.vn">info@hemalink.vn</a>
            </li>
            <li>Hotline: 1900 xxxx</li>
            <li>Địa chỉ: TP. Hồ Chí Minh</li>
          </ul>
        </div>
      </div>
      <div className="footer-divider"></div>
      <div className="footer-bottom">
        © 2025 HemaLink. Tất cả quyền được bảo lưu.
      </div>
    </footer>
  );
}

export default Footer;
