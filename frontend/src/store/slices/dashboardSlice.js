import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as dashboardApi from "../../api/dashboardApi";
import { extractError } from "../../utils/errorHandler";

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async (params, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getDashboardSummary(params);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.dashboard.load"));
    }
  }
);

const initialState = {
  data: null,
  status: "idle",
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
