import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsActionLoading,
  selectAuthError,
  clearError,
} from "../store/authSlice.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  const user             = useSelector(selectUser);
  const isAuthenticated  = useSelector(selectIsAuthenticated);
  const isLoading        = useSelector(selectIsLoading);
  const isActionLoading  = useSelector(selectIsActionLoading);
  const error            = useSelector(selectAuthError);

  // Restore session on app mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  const login    = (creds)  => dispatch(loginUser(creds));
  const register = (data)   => dispatch(registerUser(data));
  const logout   = ()       => dispatch(logoutUser());
  const clearErr = ()       => dispatch(clearError());

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      isActionLoading,
      error,
      login,
      register,
      logout,
      clearError: clearErr,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
};
