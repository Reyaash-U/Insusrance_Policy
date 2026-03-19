import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../api/auth.api.js";

// ─── Thunks ───────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.login(credentials);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed.");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.register(formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Registration failed.");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.getMe();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Session expired.");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:             null,
    token:            localStorage.getItem("token") || null,
    isAuthenticated:  false,
    // Start as true when a token exists so ProtectedRoute shows a Loader
    // while fetchCurrentUser validates the session, instead of immediately
    // redirecting to /login and losing the intended destination URL.
    isLoading:        !!localStorage.getItem("token"),
    isActionLoading:  false,       // login/register button
    error:            null,
    registrationDone: false,
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem("token", action.payload);
      } else {
        localStorage.removeItem("token");
      }
    },
    setUser(state, action) {
      state.user            = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearAuth(state) {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      state.error           = null;
      localStorage.removeItem("token");
    },
    clearError(state) {
      state.error = null;
    },
    clearRegistrationDone(state) {
      state.registrationDone = false;
    },
    updateAvatar(state, action) {
      if (state.user) state.user.avatar = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── Login ──────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.isActionLoading = true;
        state.error           = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isActionLoading  = false;
        state.user             = action.payload.user;
        state.token            = action.payload.token;
        state.isAuthenticated  = true;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error           = action.payload;
      });

    // ── Register ───────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.isActionLoading = true;
        state.error           = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isActionLoading  = false;
        state.registrationDone = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error           = action.payload;
      });

    // ── Fetch current user (session restore) ───────────────
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.user            = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading       = false;
        state.isAuthenticated = false;
        state.user            = null;
        state.token           = null;
        localStorage.removeItem("token");
      });

    // ── Logout ─────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user            = null;
        state.token           = null;
        state.isAuthenticated = false;
        localStorage.removeItem("token");
      });
  },
});

export const {
  setToken,
  setUser,
  clearAuth,
  clearError,
  clearRegistrationDone,
  updateAvatar,
} = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────
export const selectAuth            = (s) => s.auth;
export const selectUser            = (s) => s.auth.user;
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated;
export const selectIsLoading       = (s) => s.auth.isLoading;
export const selectIsActionLoading = (s) => s.auth.isActionLoading;
export const selectAuthError       = (s) => s.auth.error;
export const selectUserRole        = (s) => s.auth.user?.role;

export default authSlice.reducer;
