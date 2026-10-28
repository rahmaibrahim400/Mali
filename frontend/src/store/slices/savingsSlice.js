import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as savingsApi from "../../api/savingsApi";
import { extractError } from "../../utils/errorHandler";

export const fetchGoals = createAsyncThunk(
  "savings/fetchGoals",
  async (_, { rejectWithValue }) => {
    try {
      const res = await savingsApi.getGoals();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.load"));
    }
  }
);

export const createGoalThunk = createAsyncThunk(
  "savings/createGoal",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await savingsApi.createGoal(payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.create"));
    }
  }
);

export const updateGoalThunk = createAsyncThunk(
  "savings/updateGoal",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await savingsApi.updateGoal(id, payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.update"));
    }
  }
);

export const deleteGoalThunk = createAsyncThunk(
  "savings/deleteGoal",
  async ({ id, accountId }, { rejectWithValue }) => {
    try {
      await savingsApi.deleteGoal(id, accountId ? { accountId } : undefined);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.delete"));
    }
  }
);

export const depositToGoalThunk = createAsyncThunk(
  "savings/deposit",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await savingsApi.depositToGoal(id, payload);
      return res.data.data.goal;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.deposit"));
    }
  }
);

export const withdrawFromGoalThunk = createAsyncThunk(
  "savings/withdraw",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await savingsApi.withdrawFromGoal(id, payload);
      return res.data.data.goal;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.withdraw"));
    }
  }
);

export const completeGoalThunk = createAsyncThunk(
  "savings/complete",
  async ({ id, accountId }, { rejectWithValue }) => {
    try {
      const res = await savingsApi.completeGoal(id, accountId ? { accountId } : undefined);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.complete"));
    }
  }
);

export const archiveGoalThunk = createAsyncThunk(
  "savings/archive",
  async ({ id, accountId }, { rejectWithValue }) => {
    try {
      const res = await savingsApi.archiveGoal(id, accountId ? { accountId } : undefined);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.archive"));
    }
  }
);

export const fetchGoalTransactionsThunk = createAsyncThunk(
  "savings/fetchTransactions",
  async (id, { rejectWithValue }) => {
    try {
      const res = await savingsApi.getGoalTransactions(id);
      return { id, transactions: res.data.data };
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.savings.transactions"));
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  transactionsByGoal: {},
  transactionsStatus: "idle",
};

const savingsSlice = createSlice({
  name: "savings",
  initialState,
  reducers: {
    clearSavingsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload || [];
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(createGoalThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      .addCase(updateGoalThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })

      .addCase(deleteGoalThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g._id !== action.payload);
      })

      .addCase(depositToGoalThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })

      .addCase(withdrawFromGoalThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })

      .addCase(completeGoalThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })

      .addCase(archiveGoalThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })

      .addCase(fetchGoalTransactionsThunk.pending, (state) => {
        state.transactionsStatus = "loading";
      })
      .addCase(fetchGoalTransactionsThunk.fulfilled, (state, action) => {
        state.transactionsStatus = "succeeded";
        state.transactionsByGoal[action.payload.id] = action.payload.transactions;
      })
      .addCase(fetchGoalTransactionsThunk.rejected, (state, action) => {
        state.transactionsStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearSavingsError } = savingsSlice.actions;
export default savingsSlice.reducer;
