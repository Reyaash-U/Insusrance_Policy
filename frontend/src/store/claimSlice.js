import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { claimAPI } from "../api/claim.api.js";

export const fetchMyClaims = createAsyncThunk(
  "claim/fetchMine",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await claimAPI.getMine(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch claims.");
    }
  }
);

export const submitClaim = createAsyncThunk(
  "claim/submit",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await claimAPI.submit(formData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit claim.");
    }
  }
);

const claimSlice = createSlice({
  name: "claim",
  initialState: {
    claims:         [],
    selectedClaim:  null,
    meta:           null,
    isLoading:      false,
    isSubmitting:   false,
    error:          null,
  },
  reducers: {
    setSelectedClaim(state, action) { state.selectedClaim = action.payload; },
    clearClaimError(state)          { state.error = null; },
    updateClaimStatus(state, action) {
      const { claimId, status } = action.payload;
      const claim = state.claims.find((c) => c._id === claimId);
      if (claim) claim.status = status;
      if (state.selectedClaim?._id === claimId) state.selectedClaim.status = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyClaims.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchMyClaims.fulfilled, (s, a) => {
        s.isLoading = false;
        s.claims    = a.payload.data;
        s.meta      = a.payload.meta;
      })
      .addCase(fetchMyClaims.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(submitClaim.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(submitClaim.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.claims       = [a.payload, ...s.claims];
      })
      .addCase(submitClaim.rejected,  (s, a) => { s.isSubmitting = false; s.error = a.payload; });
  },
});

export const { setSelectedClaim, clearClaimError, updateClaimStatus } = claimSlice.actions;

export const selectClaims        = (s) => s.claim.claims;
export const selectSelectedClaim = (s) => s.claim.selectedClaim;
export const selectClaimMeta     = (s) => s.claim.meta;
export const selectClaimLoading  = (s) => s.claim.isLoading;
export const selectClaimError    = (s) => s.claim.error;

export default claimSlice.reducer;
