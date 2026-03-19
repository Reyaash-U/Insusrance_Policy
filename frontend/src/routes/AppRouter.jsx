import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../store/authSlice.js";
import { getRoleHome } from "./RoleRoute.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute      from "./RoleRoute.jsx";

// ── Auth pages
import LoginPage       from "../pages/auth/LoginPage.jsx";
import RegisterPage    from "../pages/auth/RegisterPage.jsx";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage.jsx";

// ── Customer pages
import CustomerDashboard from "../pages/customer/CustomerDashboard.jsx";
import BrowsePolicies    from "../pages/customer/BrowsePolicies.jsx";
import MyPolicies        from "../pages/customer/MyPolicies.jsx";
import SubmitClaim       from "../pages/customer/SubmitClaim.jsx";
import MyClaims          from "../pages/customer/MyClaims.jsx";

// ── Agent pages
import AgentDashboard  from "../pages/agent/AgentDashboard.jsx";

// ── Adjuster pages
import AdjusterDashboard from "../pages/adjuster/AdjusterDashboard.jsx";
import ReviewClaims      from "../pages/adjuster/ReviewClaims.jsx";
import ClaimDetail       from "../pages/adjuster/ClaimDetail.jsx";

// ── Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import ManageUsers    from "../pages/admin/ManageUsers.jsx";
import AllClaims      from "../pages/admin/AllClaims.jsx";
import AllPolicies    from "../pages/admin/AllPolicies.jsx";
import FraudLogs      from "../pages/admin/FraudLogs.jsx";

import NotFoundPage from "../pages/NotFoundPage.jsx";

const AppRouter = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user            = useSelector(selectUser);

  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────── */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getRoleHome(user?.role)} replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to={getRoleHome(user?.role)} replace /> : <RegisterPage />}
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* ── Customer ───────────────────────────────────────── */}
      <Route path="/dashboard" element={
        <ProtectedRoute><RoleRoute roles={["customer"]}><CustomerDashboard /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/policies" element={
        <ProtectedRoute><RoleRoute roles={["customer"]}><BrowsePolicies /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/my-policies" element={
        <ProtectedRoute><RoleRoute roles={["customer"]}><MyPolicies /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/submit-claim" element={
        <ProtectedRoute><RoleRoute roles={["customer"]}><SubmitClaim /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/my-claims" element={
        <ProtectedRoute><RoleRoute roles={["customer"]}><MyClaims /></RoleRoute></ProtectedRoute>
      }/>

      {/* ── Agent ──────────────────────────────────────────── */}
      <Route path="/agent/dashboard" element={
        <ProtectedRoute><RoleRoute roles={["agent"]}><AgentDashboard /></RoleRoute></ProtectedRoute>
      }/>

      {/* ── Adjuster ───────────────────────────────────────── */}
      <Route path="/adjuster/dashboard" element={
        <ProtectedRoute><RoleRoute roles={["adjuster"]}><AdjusterDashboard /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/adjuster/claims" element={
        <ProtectedRoute><RoleRoute roles={["adjuster"]}><ReviewClaims /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/adjuster/claims/:claimId" element={
        <ProtectedRoute><RoleRoute roles={["adjuster", "admin"]}><ClaimDetail /></RoleRoute></ProtectedRoute>
      }/>

      {/* ── Admin ──────────────────────────────────────────── */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute><RoleRoute roles={["admin"]}><AdminDashboard /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/admin/users" element={
        <ProtectedRoute><RoleRoute roles={["admin"]}><ManageUsers /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/admin/claims" element={
        <ProtectedRoute><RoleRoute roles={["admin"]}><AllClaims /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/admin/policies" element={
        <ProtectedRoute><RoleRoute roles={["admin"]}><AllPolicies /></RoleRoute></ProtectedRoute>
      }/>
      <Route path="/admin/fraud" element={
        <ProtectedRoute><RoleRoute roles={["admin"]}><FraudLogs /></RoleRoute></ProtectedRoute>
      }/>

      {/* ── Root redirect ──────────────────────────────────── */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={getRoleHome(user?.role)} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* ── 404 ────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
