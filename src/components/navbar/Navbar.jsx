import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserData, logoutUser } from "../../utils/auth";
// import api from "../../configs/axios";
import "./Navbar.css";
import api from "../../configs/axios";
import { setAuthToken } from "../../utils/auth";
// import { usePermission } from "../../utils/permission";
import ChangePasswordModal from "../profile/ChangePassword";

function Navbar() {
  // const { can } = usePermission();

  const [user, setUser] = useState(null);
  const [openChange, setOpenChange] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileInfo, setProfileInfo] = useState(null);

  useEffect(() => {
    const userData = getUserData();
    setUser(userData);

    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
        if (token) setAuthToken(token);
        const response = await api.get(`patient/v1/patients/me`);
        const patientData = response?.data?.data?.data || response?.data?.data || response?.data;
        if (patientData) {
          setProfileInfo({
            fullName: patientData.fullName || patientData.name || userData?.fullname || userData?.fullName || "Người dùng",
            email: patientData.email || userData?.email || "Chưa cập nhật email",
          });
        }
      } catch (err) {
        if (userData) {
          setProfileInfo({
            fullName: userData.fullname || userData.fullName || "Người dùng",
            email: userData.email || "Chưa cập nhật email",
          });
        }
      }
    };

    fetchUserProfile();
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setProfileInfo(null);
    navigate("/login");
  };



  const handleProfileClick = () => {
    setMobileMenuOpen(false);
    navigate("/profile");
  };

  const handleHistoryClick = async (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    try {
      const token = localStorage.getItem("accessToken");
      setAuthToken(token);
      const response = await api.get(`patient/v1/patients/me`);
      
      const patient = response.data?.data?.data || response.data?.data || response.data;
      const patientId = patient?.patientId || patient?.id;

      if (patientId) {
        navigate(`/history?patientId=${patientId}`);
      } else {
        navigate("/create-profile");
      }
    } catch (error) {
      console.error("Error checking patient profile for history:", error);
      navigate("/create-profile");
    }
  };

  const handleMedicalRecordClick = async (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    try {
      const token = localStorage.getItem("accessToken");
      setAuthToken(token);
      const response = await api.get(`patient/v1/patients/me`);
      
      const patient = response.data?.data?.data || response.data?.data || response.data;
      const patientId = patient?.patientId || patient?.id;

      if (patientId) {
        navigate(`/medical-record?patientId=${patientId}`);
      } else {
        navigate("/create-profile");
      }
    } catch (error) {
      console.error("Error checking patient profile for medical record:", error);
      navigate("/create-profile");
    }
  };

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false); // Close mobile menu when clicking a link

    // Tính toán offset của navbar (72px theo CSS)
    const navbarHeight = 72;

    // Nếu đang ở trang chủ, scroll đến section
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    } else {
      // Nếu không ở trang chủ, điều hướng về trang chủ với hash
      navigate(`/#${sectionId}`, { replace: false });
      // Sau khi navigate, scroll đến section
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 200);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate("/");
    // Scroll to top when going to home
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  // Handle scroll to section when navigating from another page with hash
  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const sectionId = location.hash.substring(1);
      const navbarHeight = 72;
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 200);
    }
  }, [location]);

  // Track active section on scroll
  const [activeSection, setActiveSection] = useState("hero");
  const [navbarScrolled, setNavbarScrolled] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sections = ["hero", "equipments", "blog", "bundles"];
    const handleScroll = () => {
      // Update navbar scrolled state
      setNavbarScrolled(window.scrollY > 10);

      const scrollPosition = window.scrollY + 150;

      // Check if at top of page
      if (window.scrollY < 100) {
        setActiveSection("hero");
        return;
      }

      // Find the section currently in view
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const offsetTop = section.offsetTop;
          const offsetHeight = section.offsetHeight;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  return (
    <header className={`navbar ${navbarScrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link
          to="/"
          className="navbar-logo"
          onClick={handleLogoClick}
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span className="navbar-logo-icon">
            <img
              src="/logo.png"
              alt="HemaLink Logo"
              className="navbar-logo-img"
            />
          </span>
          <span className="navbar-logo-text">HemaLink</span>
        </Link>
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <nav className={`navbar-menu ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <a
            href="#hero"
            className={`navbar-menu-item ${
              location.pathname === "/" && activeSection === "hero"
                ? "active"
                : ""
            }`}
            onClick={(e) => handleNavClick(e, "hero")}
            title="Trang chủ"
          >
            <svg
              className="navbar-menu-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="navbar-menu-text">Trang chủ</span>
            <span className="navbar-menu-item-tooltip">Trang chủ</span>
          </a>
          <a
            href="#equipments"
            className={`navbar-menu-item ${
              location.pathname === "/" && activeSection === "equipments"
                ? "active"
                : ""
            }`}
            onClick={(e) => handleNavClick(e, "equipments")}
            title="Thiết bị"
          >
            <svg
              className="navbar-menu-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span className="navbar-menu-text">Thiết bị</span>
            <span className="navbar-menu-item-tooltip">Thiết bị</span>
          </a>
          <a
            href="#blog"
            className={`navbar-menu-item ${
              location.pathname === "/" && activeSection === "blog"
                ? "active"
                : ""
            }`}
            onClick={(e) => handleNavClick(e, "blog")}
            title="Blog"
          >
            <svg
              className="navbar-menu-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="navbar-menu-text">Blog</span>
            <span className="navbar-menu-item-tooltip">Blog</span>
          </a>
          <a
            href="#bundles"
            className={`navbar-menu-item ${
              location.pathname === "/" && activeSection === "bundles"
                ? "active"
                : ""
            }`}
            onClick={(e) => handleNavClick(e, "bundles")}
            title="Gói xét nghiệm"
          >
            <svg
              className="navbar-menu-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="navbar-menu-text">Gói xét nghiệm</span>
            <span className="navbar-menu-item-tooltip">Gói xét nghiệm</span>
          </a>
          <Link
            to="/booking"
            className={`navbar-menu-item navbar-link ${
              location.pathname === "/booking" ? "active" : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
            title="Đặt Lịch"
          >
            <svg
              className="navbar-menu-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="navbar-menu-text">Đặt Lịch</span>
            <span className="navbar-menu-item-tooltip">Đặt Lịch</span>
          </Link>
          {user && (
            <>
              <div className="navbar-menu-item-dropdown" tabIndex={0}>
                <button
                  className={`navbar-menu-item navbar-link ${
                    location.pathname === "/history" || location.pathname === "/medical-record" ? "active" : ""
                  }`}
                  style={{ background: "none", border: "none", padding: "8px 0" }}
                >
                  <svg
                    className="navbar-menu-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="navbar-menu-text">Lịch sử khám</span>
                  <span className="navbar-menu-item-tooltip">Lịch sử khám</span>
                </button>

                <div className="dropdown-submenu" role="menu">
                  <button
                    className="dropdown-submenu-item"
                    onClick={handleMedicalRecordClick}
                    type="button"
                  >
                    <svg
                      style={{ width: "16px", height: "16px", marginRight: "8px" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Kết quả xét nghiệm
                  </button>
                  <button
                    className="dropdown-submenu-item"
                    onClick={handleHistoryClick}
                    type="button"
                  >
                    <svg
                      style={{ width: "16px", height: "16px", marginRight: "8px" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Lịch hẹn đã đặt
                  </button>
                </div>
              </div>

              <Link
                to="/my-vouchers"
                className={`navbar-menu-item navbar-link ${
                  location.pathname === "/my-vouchers" ? "active" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
                title="Kho Voucher"
              >
                <svg
                  className="navbar-menu-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span className="navbar-menu-text">Kho Voucher</span>
                <span className="navbar-menu-item-tooltip">Kho Voucher</span>
              </Link>
            </>
          )}
        </nav>
        <div
          className={`navbar-actions ${mobileMenuOpen ? "mobile-open" : ""}`}
        >
          {!user ? (
            <>
              <a
                href="/login"
                className="navbar-login"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng nhập
              </a>
              <a
                href="/register"
                className="navbar-register"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng ký
              </a>
            </>
          ) : (
            <div className="navbar-user-info">
              <div className="navbar-avatar-dropdown" tabIndex={0}>
                <button
                  className="navbar-avatar-icon"
                  role="button"
                  aria-haspopup="true"
                  aria-label="Tài khoản"
                  style={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: "8px",
                  }}
                >
                  <svg
                    className="user-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                <div className="avatar-menu" role="menu">
                  {profileInfo && (
                    <div className="avatar-user-header">
                      <div className="avatar-user-name">{profileInfo.fullName}</div>
                      <div className="avatar-user-email">{profileInfo.email}</div>
                    </div>
                  )}
                  <button
                    className="avatar-menu-item"
                    onClick={handleProfileClick}
                    type="button"
                  >
                    <svg
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "8px",
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Thông tin cá nhân
                  </button>
                  <button
                    className="avatar-menu-item"
                    onClick={() => setOpenChange(true)}
                    type="button"
                  >
                    <svg
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "8px",
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Đổi mật khẩu
                  </button>
                  <button className="navbar-logout" onClick={handleLogout}>
                    <svg
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "8px",
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Đăng Xuất
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render change-password modal */}
      <ChangePasswordModal
        open={openChange}
        onClose={() => setOpenChange(false)}
      />
    </header>
  );
}

export default Navbar;
