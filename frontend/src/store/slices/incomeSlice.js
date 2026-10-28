import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as incomeApi from "../../api/incomeApi";
import { extractError } from "../../utils/errorHandler";

export const fetchIncomes = createAsyncThunk(
  "incomes/fetchIncomes",
  async (_, { rejectWithValue }) => {
    try {
      const res = await incomeApi.getIncomes();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.income.load"));
    }
  }
);

export const createIncomeEntry = createAsyncThunk(
  "incomes/createIncomeEntry",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await incomeApi.createIncome(payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.income.create"));
    }
  }
);

export const deleteIncome = createAsyncThunk(
  "incomes/deleteIncome",
  async (id, { rejectWithValue }) => {
    try {
      await incomeApi.deleteIncome(id);
      return id;
    } catch (error) {
      return rejectWithValue(extractError(error, "errors.income.delete"));
    }
  }
);

export const fetchIncomeSummary = createAsyncThunk(
  "incomes/fetchIncomeSummary",
  async (params, { rejectWithValue }) => {
    try {
      const res = await incomeApi.getIncomeSummary(params);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.income.summary"));
    }
  }
);

export const updateIncomeEntry = createAsyncThunk(
  "incomes/updateIncomeEntry",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await incomeApi.updateIncome(id, payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.income.update"));
    }
  }
);

export const toggleIncomeRecurrence = createAsyncThunk(
  "incomes/toggleRecurrence",
  async (id, { rejectWithValue }) => {
    try {
      const res = await incomeApi.toggleIncomeRecurrenceApi(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.income.recurring"));
    }
  }
);

const initialState = {
  items: [],
  summary: null,
  summaryStatus: "idle",
  summaryError: null,
  status: "idle",
  error: null,
  createStatus: "idle",
  createError: null,
  updateStatus: "idle",
  updateError: null,
};

const incomeSlice = createSlice({
  name: "incomes",
  initialState,
  reducers: {
    clearIncomeError(state) {
      state.error = null;
    },
    clearIncomeCreateState(state) {
      state.createStatus = "idle";
      state.createError = null;
    },
    clearIncomeUpdateError(state) {
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchIncomes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchIncomes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createIncomeEntry.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createIncomeEntry.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.items = [action.payload, ...state.items];
      })
      .addCase(createIncomeEntry.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload;
      })
      .addCase(deleteIncome.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteIncome.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
        state.status = "succeeded";
      })
      .addCase(deleteIncome.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchIncomeSummary.pending, (state) => {
        state.summaryStatus = "loading";
        state.summaryError = null;
      })
      .addCase(fetchIncomeSummary.fulfilled, (state, action) => {
        state.summaryStatus = "succeeded";
        state.summary = action.payload;
      })
      .addCase(fetchIncomeSummary.rejected, (state, action) => {
        state.summaryStatus = "failed";
        state.summaryError = action.payload;
      })
      .addCase(updateIncomeEntry.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateIncomeEntry.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateIncomeEntry.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload;
      })
      .addCase(toggleIncomeRecurrence.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { clearIncomeError, clearIncomeCreateState, clearIncomeUpdateError } =
  incomeSlice.actions;

export default incomeSlice.reducer;
