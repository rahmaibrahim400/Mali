import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as debtsApi from "../../api/debtsApi";
import { extractError } from "../../utils/errorHandler";

export const fetchDebts = createAsyncThunk(
  "debts/fetchDebts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await debtsApi.getDebts();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.debts.load"));
    }
  }
);

export const createDebtThunk = createAsyncThunk(
  "debts/createDebt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await debtsApi.createDebt(payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.debts.create"));
    }
  }
);

export const updateDebtThunk = createAsyncThunk(
  "debts/updateDebt",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await debtsApi.updateDebt(id, payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.debts.update"));
    }
  }
);

export const deleteDebtThunk = createAsyncThunk(
  "debts/deleteDebt",
  async (id, { rejectWithValue }) => {
    try {
      await debtsApi.deleteDebt(id);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.debts.delete"));
    }
  }
);

export const markDebtPaidThunk = createAsyncThunk(
  "debts/markPaid",
  async (id, { rejectWithValue }) => {
    try {
      const res = await debtsApi.markDebtPaid(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.debts.status"));
    }
  }
);

export const addDebtPaymentThunk = createAsyncThunk(
  "debts/addPayment",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await debtsApi.addDebtPayment(id, payload);
      return res.data.data; // { debt, payment }
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.debts.payment"));
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  markPaidStatus: "idle",
};

const debtsSlice = createSlice({
  name: "debts",
  initialState,
  reducers: {
    setDebtsItems(state, action) {
      state.items = action.payload;
    },
    clearDebtsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDebts
      .addCase(fetchDebts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDebts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload || [];
      })
      .addCase(fetchDebts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // createDebt
      .addCase(createDebtThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // updateDebt
      .addCase(updateDebtThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })

      // deleteDebt
      .addCase(deleteDebtThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d._id !== action.payload);
      })

      // markDebtPaid
      .addCase(markDebtPaidThunk.pending, (state) => {
        state.markPaidStatus = "loading";
      })
      .addCase(markDebtPaidThunk.fulfilled, (state, action) => {
        state.markPaidStatus = "succeeded";
        const updated = action.payload;
        const index = state.items.findIndex((d) => d._id === updated._id);
        if (index !== -1) {
          state.items[index] = updated;
        }
      })
      .addCase(markDebtPaidThunk.rejected, (state, action) => {
        state.markPaidStatus = "failed";
        state.error = action.payload;
      })

      // addDebtPayment
      .addCase(addDebtPaymentThunk.fulfilled, (state, action) => {
        const { debt } = action.payload;
        if (debt) {
          const index = state.items.findIndex((d) => d._id === debt._id);
          if (index !== -1) {
            state.items[index] = debt;
          }
        }
      });
  },
});

export const { setDebtsItems, clearDebtsError } = debtsSlice.actions;
export default debtsSlice.reducer;
