import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as expenseApi from "../../api/expenseApi";
import { extractError } from "../../utils/errorHandler";

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async (filters, { rejectWithValue }) => {
    try {
      const res = await expenseApi.getExpenses(filters);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.expenses.load"));
    }
  }
);

export const createExpenseEntry = createAsyncThunk(
  "expenses/createExpenseEntry",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await expenseApi.createExpense(payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.expenses.create"));
    }
  }
);

// Fix #5 — Add missing update thunk
export const updateExpenseEntry = createAsyncThunk(
  "expenses/updateExpenseEntry",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await expenseApi.updateExpense(id, payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.expenses.update"));
    }
  }
);

// Fix #5 — Add missing delete thunk
export const deleteExpenseEntry = createAsyncThunk(
  "expenses/deleteExpenseEntry",
  async (id, { rejectWithValue }) => {
    try {
      await expenseApi.deleteExpense(id);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.expenses.delete"));
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  createStatus: "idle",
  createError: null,
  updateStatus: "idle",
  updateError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    clearExpenseError(state) {
      state.error = null;
    },
    clearExpenseCreateError(state) {
      state.createError = null;
    },
    resetExpenseCreateStatus(state) {
      state.createStatus = "idle";
      state.createError = null;
    },
    resetExpenseUpdateStatus(state) {
      state.updateStatus = "idle";
      state.updateError = null;
    },
    resetExpenseDeleteStatus(state) {
      state.deleteStatus = "idle";
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchExpenses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // create
      .addCase(createExpenseEntry.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createExpenseEntry.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(createExpenseEntry.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload;
      })
      // update
      .addCase(updateExpenseEntry.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateExpenseEntry.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const idx = state.items.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateExpenseEntry.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload;
      })
      // delete
      .addCase(deleteExpenseEntry.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteExpenseEntry.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.items = state.items.filter((e) => e._id !== action.payload);
      })
      .addCase(deleteExpenseEntry.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload;
      });
  },
});

export const {
  clearExpenseError,
  clearExpenseCreateError,
  resetExpenseCreateStatus,
  resetExpenseUpdateStatus,
  resetExpenseDeleteStatus,
} = expensesSlice.actions;

export default expensesSlice.reducer;
