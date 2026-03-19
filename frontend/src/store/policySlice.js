import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { policyAPI } from "../api/policy.api.js";

export const fetchPolicies = createAsyncThunk(
  "policy/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await policyAPI.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch policies.");
    }
  }
);

export const fetchMyPolicies = createAsyncThunk(
  "policy/fetchMine",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await policyAPI.getMine(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch your policies.");
    }
  }
);

export const purchasePolicy = createAsyncThunk(
  "policy/purchase",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await policyAPI.purchase(payload);
      return data.data;
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors?.[0]?.message || err.response?.data?.message || "Purchase failed.";
      return rejectWithValue(msg);
    }
  }
);

const policySlice = createSlice({
  name: "policy",
  initialState: {
    policies:       [],
    myPolicies:     [],
    selectedPolicy: null,
    meta:           null,
    isLoading:      false,
    isSubmitting:   false,
    error:          null,
    premiumPreview: null,
  },
  reducers: {
    setSelectedPolicy(state, action) { state.selectedPolicy = action.payload; },
    setPremiumPreview(state, action) { state.premiumPreview = action.payload; },
    clearPolicyError(state)          { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicies.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchPolicies.fulfilled, (s, a) => {
        s.isLoading = false;
        s.policies  = a.payload.data;
        s.meta      = a.payload.meta;
      })
      .addCase(fetchPolicies.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(fetchMyPolicies.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchMyPolicies.fulfilled, (s, a) => {
        s.isLoading  = false;
        s.myPolicies = a.payload.data;
        s.meta       = a.payload.meta;
      })
      .addCase(fetchMyPolicies.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(purchasePolicy.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(purchasePolicy.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.myPolicies   = [a.payload, ...s.myPolicies];
      })
      .addCase(purchasePolicy.rejected,  (s, a) => { s.isSubmitting = false; s.error = a.payload; });
  },
});

export const { setSelectedPolicy, setPremiumPreview, clearPolicyError } = policySlice.actions;

export const selectPolicies       = (s) => s.policy.policies;
export const selectMyPolicies     = (s) => s.policy.myPolicies;
export const selectPolicyMeta     = (s) => s.policy.meta;
export const selectPolicyLoading  = (s) => s.policy.isLoading;
export const selectPolicyError    = (s) => s.policy.error;
export const selectPremiumPreview = (s) => s.policy.premiumPreview;

export default policySlice.reducer;
