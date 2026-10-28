import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as accountsApi from "../../api/accountsApi";
import { extractError } from "../../utils/errorHandler";

export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountsApi.getAccounts();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.accounts.load"));
    }
  }
);

export const transferFunds = createAsyncThunk(
  "accounts/transferFunds",
  async ({ fromId, toId, amount, description }, { rejectWithValue }) => {
    try {
      const res = await accountsApi.transferFunds({
        fromId,
        toId,
        amount,
        description,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.accounts.transfer"));
    }
  }
);

export const createAccount = createAsyncThunk(
  "accounts/createAccount",
  async (account, { rejectWithValue }) => {
    try {
      const res = await accountsApi.createAccount(account);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.accounts.create"));
    }
  }
);

export const adjustBalance = createAsyncThunk(
  "accounts/adjustBalance",
  async ({ accountId, newBalance, notes }, { rejectWithValue }) => {
    try {
      const res = await accountsApi.adjustBalance({ accountId, newBalance, notes });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.accounts.adjust"));
    }
  }
);

export const toggleArchiveAccount = createAsyncThunk(
  "accounts/toggleArchive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await accountsApi.archiveAccountApi(id);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.accounts.archive"));
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  transferStatus: "idle",
  transferError: null,
  createStatus: "idle",
  createError: null,
  adjustStatus: "idle",
  adjustError: null,
};

const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    clearAccountsError(state) {
      state.error = null;
    },
    clearTransferError(state) {
      state.transferError = null;
    },
    resetTransferStatus(state) {
      state.transferStatus = "idle";
    },
    clearCreateAccountError(state) {
      state.createError = null;
    },
    resetCreateAccountStatus(state) {
      state.createStatus = "idle";
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(transferFunds.pending, (state) => {
        state.transferStatus = "loading";
        state.transferError = null;
      })
      .addCase(transferFunds.fulfilled, (state) => {
        state.transferStatus = "succeeded";
      })
      .addCase(transferFunds.rejected, (state, action) => {
        state.transferStatus = "failed";
        state.transferError = action.payload;
      })

      .addCase(createAccount.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload;
      })

      .addCase(adjustBalance.pending, (state) => {
        state.adjustStatus = "loading";
        state.adjustError = null;
      })
      .addCase(adjustBalance.fulfilled, (state, action) => {
        state.adjustStatus = "succeeded";
        const accountIndex = state.items.findIndex(
          (account) => account._id === action.payload._id
        );
        if (accountIndex !== -1) {
          state.items[accountIndex] = action.payload;
        }
      })
      .addCase(adjustBalance.rejected, (state, action) => {
        state.adjustStatus = "failed";
        state.adjustError = action.payload;
      })

      .addCase(toggleArchiveAccount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(toggleArchiveAccount.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedAccount = action.payload;
        const index = state.items.findIndex((acc) => acc._id === updatedAccount._id);
        if (index !== -1) {
          state.items[index] = updatedAccount;
        }
      })
      .addCase(toggleArchiveAccount.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  clearAccountsError,
  clearTransferError,
  resetTransferStatus,
  clearCreateAccountError,
  resetCreateAccountStatus,
} = accountsSlice.actions;

export default accountsSlice.reducer;