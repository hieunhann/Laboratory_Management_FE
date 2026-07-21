import "./App.css";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoginPage from "./pages/login/Login";
import RegisterPage from "./pages/register/Register";
import HomePage from "./pages/home/Home";
import BookingPage from "./pages/booking/Booking";
import HistoryPage from "./pages/history/History";
import ProfilePage from "./components/profile/ProfilePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Booking from "./pages/booking/Booking";
import CatalogSelection from "./components/booking/CatalogSelection";
import SuccessBookingPage from "./pages/booking/SuccessBookingPage";

import DashboardPage from "./pages/admin/dashboard/DashboardPage";
import AdminDashboardPage from "./pages/admin/dashboard/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/user/AdminUsersPage";
import AdminRolesPage from "./pages/admin/roles/AdminRolesPage";
import AdminInstrumentsPage from "./pages/admin/instruments/AdminInstrumentsPage";
import AdminBlogsPage from "./pages/admin/blogs/AdminBlogsPage";
import AdminPatientsPage from "./pages/admin/patients/AdminPatientsPage";
import AdminTestOrdersPage from "./pages/admin/test-orders/AdminTestOrdersPage";
import AdminPackagesPage from "./pages/admin/packages/AdminPackagesPage";
import AdminCatalogsPage from "./pages/admin/catalogs/AdminCatalogsPage";
import AdminParameterPage from "./pages/admin/parameter/AdminParameterPage";
import AdminReportsPage from "./pages/admin/reports/AdminReportsPage";
import AdminAppointmentSchedulePage from "./pages/admin/appointment-schedule/AdminAppointmentSchedulePage";
import AdminCategoriesPage from "./pages/admin/categories/AdminCategoriesPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS
import MedicalRecord from "./pages/medical-record/MedicalRecord";
import ForgotPass from "./components/authen-form/ForgotPassword";
import ResetPass from "./components/authen-form/ResetPassword/ResetPassword";
import AppointmentSchedule from "./pages/lab-staff/appointment-schedule/appointment-schedule";
import LabStaffDashboard from "./pages/lab-staff/dashboard/dashboard";
import LabStaffLanding from "./pages/lab-staff/landing/LabStaffLanding";
import CreatePatient from "./components/profile/CreateProfile";
import BlogPage from "./pages/blog/BlogPage";
import BlogDetailPage from "./pages/blog/BlogDetailPage";
import ChangePasswordModal from "./components/profile/ChangePassword";
import LoadingOverlay from "./components/Loading/LoadingOverlay";

import SuccessBooking from "./components/booking/SuccessBooking";

// Wrapper component to handle loading state
function AppContent() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Short delay to show loading

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return <>{isLoading && <LoadingOverlay />}</>;
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <>
          <AppContent />
          <HomePage />
        </>
      ),
    },
    {
      path: "login",
      element: (
        <>
          <AppContent />
          <LoginPage />
        </>
      ),
    },
    {
      path: "register",
      element: (
        <>
          <AppContent />
          <RegisterPage />
        </>
      ),
    },
    {
      path: "booking",
      element: (
        <>
          <AppContent />
          <BookingPage />
        </>
      ),
    },
    {
      path: "history",
      element: (
        <>
          <AppContent />
          <HistoryPage />
        </>
      ),
    },
    {
      path: "profile",
      element: (
        <>
          <AppContent />
          <ProfilePage />
        </>
      ),
    },
    {
      path: "change-password",
      element: (
        <>
          <AppContent />
          <ChangePasswordModal />
        </>
      ),
    },
    {
      path: "/booking",
      element: (
        <>
          <AppContent />
          <Booking />
        </>
      ),
    },
    {
      path: "/booking/successBooking",
      element: (
        <>
          <AppContent />
          <SuccessBookingPage />
        </>
      ),
    },
    {
      path: "/booking/catalog",
      element: (
        <>
          <AppContent />
          <CatalogSelection />
        </>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <>
          <AppContent />
          <DashboardPage />
        </>
      ),
    },
    {
      path: "/appointment-schedule",
      element: (
        <>
          <AppContent />
          <AdminAppointmentSchedulePage />
        </>
      ),
    },
    {
      path: "/users",
      element: (
        <>
          <AppContent />
          <AdminUsersPage />
        </>
      ),
    },
    {
      path: "/roles",
      element: (
        <>
          <AppContent />
          <AdminRolesPage />
        </>
      ),
    },
    {
      path: "/instruments",
      element: (
        <>
          <AppContent />
          <AdminInstrumentsPage />
        </>
      ),
    },
    {
      path: "/blogs",
      element: (
        <>
          <AppContent />
          <AdminBlogsPage />
        </>
      ),
    },
    {
      path: "/categories",
      element: (
        <>
          <AppContent />
          <AdminCategoriesPage />
        </>
      ),
    },
    {
      path: "/patients",
      element: (
        <>
          <AppContent />
          <AdminPatientsPage />
        </>
      ),
    },
    {
      path: "/test-orders",
      element: (
        <>
          <AppContent />
          <AdminTestOrdersPage />
        </>
      ),
    },
    {
      path: "/packages",
      element: (
        <>
          <AppContent />
          <AdminPackagesPage />
        </>
      ),
    },
    {
      path: "/catalogs",
      element: (
        <>
          <AppContent />
          <AdminCatalogsPage />
        </>
      ),
    },
    {
      path: "/parameter",
      element: (
        <>
          <AppContent />
          <AdminParameterPage />
        </>
      ),
    },
    {
      path: "/reports",
      element: (
        <>
          <AppContent />
          <AdminReportsPage />
        </>
      ),
    },
    {
      path: "medical-record",
      element: (
        <>
          <AppContent />
          <MedicalRecord />
        </>
      ),
    },
    {
      path: "forgot-password",
      element: (
        <>
          <AppContent />
          <ForgotPass />
        </>
      ),
    },
    {
      path: "reset-password",
      element: (
        <>
          <AppContent />
          <ResetPass />
        </>
      ),
    },
    {
      path: "lab-staff",
      element: (
        <>
          <AppContent />
          <LabStaffLanding />
        </>
      ),
    },
    {
      path: "lab-staff/dashboard",
      element: (
        <>
          <AppContent />
          <LabStaffDashboard />
        </>
      ),
    },
    {
      path: "lab-staff/appointment-schedule",
      element: (
        <>
          <AppContent />
          <AppointmentSchedule />
        </>
      ),
    },
    {
      path: "create-profile",
      element: (
        <>
          <AppContent />
          <CreatePatient />
        </>
      ),
    },
    {
      path: "blog",
      element: (
        <>
          <AppContent />
          <BlogPage />
        </>
      ),
    },
    {
      path: "blog/:id",
      element: (
        <>
          <AppContent />
          <BlogDetailPage />
        </>
      ),
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
