import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiPackage,
  FiFileText,
  FiBarChart2,
  FiBook,
  FiActivity,
  FiBox,
  FiCalendar,
  FiFolder,
} from "react-icons/fi";
import "./layout/AdminLayout.css";
import { getMenuItems } from "../../utils/role";

// Icon mapping
const iconMap = {
  dashboard: <FiHome />,
  "appointment-schedule": <FiCalendar />,
  users: <FiUsers />,
  roles: <FiBriefcase />,
  instruments: <FiPackage />,
  blogs: <FiBook />,
  categories: <FiFolder />,
  patients: <FiUsers />,
  packages: <FiBox />,
  catalogs: <FiPackage />,
  parameter: <FiActivity />,
  reports: <FiBarChart2 />,
};

const Sidebar = () => {
  const location = useLocation();
  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="HemaLink Logo" />
        </div>
        <div className="sidebar-title">
          <h3>HemaLink</h3>
          <p>Blood Test System</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={
                  location.pathname.startsWith(item.path) ? "active" : ""
                }
              >
                {iconMap[item.icon] || <FiPackage />}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; // Dòng này rất quan trọng
