import { configureStore } from "@reduxjs/toolkit";
import authReducer         from "./authSlice.js";
import policyReducer       from "./policySlice.js";
import claimReducer        from "./claimSlice.js";

const store = configureStore({
  reducer: {
    auth:   authReducer,
    policy: policyReducer,
    claim:  claimReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
  devTools: import.meta.env.DEV,
});

export default store;
