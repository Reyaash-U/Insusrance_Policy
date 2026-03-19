import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice.js";

const ROLE_HOME = {
  customer:  "/dashboard",
  agent:     "/agent/dashboard",
  adjuster:  "/adjuster/dashboard",
  admin:     "/admin/dashboard",
};

/**
 * Restricts a route to specific roles.
 * Usage: <RoleRoute roles={["admin","adjuster"]}> ... </RoleRoute>
 */
const RoleRoute = ({ children, roles = [] }) => {
  const user = useSelector(selectUser);

  if (!user) return <Navigate to="/login" replace />;

  if (!roles.includes(user.role)) {
    const fallback = ROLE_HOME[user.role] || "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default RoleRoute;

/** Utility: get the home route for a given role */
export const getRoleHome = (role) => ROLE_HOME[role] || "/dashboard";
