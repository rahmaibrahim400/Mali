import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { TOKEN_KEY } from "../../api/axiosClient";
import * as authApi from "../../api/authApi";
import * as settingsApi from "../../api/settingsApi";
import i18n from "../../i18n/i18n";
import { extractError } from "../../utils/errorHandler";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const res = await authApi.register({ name, email, password });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        extractError(err, "errors.auth.register")
      );
    }
  }
);

export const loginAccount = createAsyncThunk(
  "auth/loginAccount",
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const res = await authApi.login({ email, password, rememberMe });
      return res.data.data;
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 403 && message === "ACCOUNT_SUSPENDED") {
        return rejectWithValue(i18n.t("auth.login.accountSuspended"));
      }
      if (status === 400 || status === 401) return rejectWithValue(i18n.t("auth.login.invalidCredentials"));
      if (status === 429) return rejectWithValue(i18n.t("auth.login.tooManyAttempts"));
      return rejectWithValue(i18n.t("auth.login.genericError"));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await authApi.forgotPassword({ email });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(
        extractError(err, "errors.auth.forgot")
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await authApi.resetPassword({ token, password });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(
        extractError(err, "errors.auth.reset")
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.fetchMe();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Unauthorized");
    }
  }
);

// Login and /auth/me come without the photo (it can be large); it is loaded on its own.
export const fetchAvatar = createAsyncThunk("auth/fetchAvatar", async () => {
  const res = await authApi.fetchAvatar();
  return res.data.data.avatar;
});

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ name, phone }, { rejectWithValue }) => {
    try {
      const res = await settingsApi.updateProfile({ name, phone });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.auth.profile"));
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "auth/uploadAvatar",
  async (avatar, { rejectWithValue }) => {
    try {
      const res = await settingsApi.uploadPhoto(avatar);
      return res.data.data.avatar;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.auth.avatarUpload"));
    }
  }
);

export const deleteAvatar = createAsyncThunk(
  "auth/deleteAvatar",
  async (_, { rejectWithValue }) => {
    try {
      await settingsApi.deletePhoto();
      return true;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.auth.avatarDelete"));
    }
  }
);

export const requestEmailChange = createAsyncThunk(
  "auth/requestEmailChange",
  async (email, { rejectWithValue }) => {
    try {
      const res = await settingsApi.requestEmailChange(email);
      return res.data.message;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.auth.emailCode"));
    }
  }
);

export const confirmEmailChange = createAsyncThunk(
  "auth/confirmEmailChange",
  async (code, { rejectWithValue }) => {
    try {
      const res = await settingsApi.confirmEmailChange(code);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.auth.emailConfirm"));
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const res = await settingsApi.changePassword({ currentPassword, newPassword, confirmPassword });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.auth.password"));
    }
  }
);

export const saveLocale = createAsyncThunk(
  "auth/saveLocale",
  async (locale, { rejectWithValue }) => {
    try {
      const res = await settingsApi.saveLocale(locale);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractError(err, "errors.auth.locale"));
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  status: "idle",
  error: null,
  authChecked: false,
  profileStatus: "idle",
  profileError: null,
  emailRequestStatus: "idle",
  emailRequestError: null,
  emailConfirmStatus: "idle",
  emailConfirmError: null,
  passwordStatus: "idle",
  passwordError: null,
  localeStatus: "idle",
  localeError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      state.authChecked = true;
      localStorage.removeItem(TOKEN_KEY);
    },
    clearAuthError(state) {
      state.error = null;
    },
    markAuthChecked(state) {
      state.authChecked = true;
    },
    clearProfileError(state) {
      state.profileError = null;
    },
    resetEmailChangeState(state) {
      state.emailRequestStatus = "idle";
      state.emailRequestError = null;
      state.emailConfirmStatus = "idle";
      state.emailConfirmError = null;
    },
    resetPasswordChangeState(state) {
      state.passwordStatus = "idle";
      state.passwordError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loginAccount.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginAccount.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.accountType === "admin") {
          state.user = null;
          state.token = null;
          localStorage.removeItem(TOKEN_KEY);
          return;
        }
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem(TOKEN_KEY, action.payload.token);
      })
      .addCase(loginAccount.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = { ...action.payload, avatar: action.payload.avatar ?? state.user?.avatar };
        state.authChecked = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.authChecked = true;
        localStorage.removeItem(TOKEN_KEY);
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileStatus = "loading";
        state.profileError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileStatus = "succeeded";
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileStatus = "failed";
        state.profileError = action.payload;
      })
      .addCase(fetchAvatar.fulfilled, (state, action) => {
        if (state.user) state.user.avatar = action.payload;
      })
      .addCase(fetchAvatar.rejected, (state) => {
        if (state.user && state.user.avatar === undefined) state.user.avatar = "";
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.user) state.user.avatar = action.payload;
      })
      .addCase(deleteAvatar.fulfilled, (state) => {
        if (state.user) state.user.avatar = "";
      })
      .addCase(requestEmailChange.pending, (state) => {
        state.emailRequestStatus = "loading";
        state.emailRequestError = null;
      })
      .addCase(requestEmailChange.fulfilled, (state) => {
        state.emailRequestStatus = "succeeded";
      })
      .addCase(requestEmailChange.rejected, (state, action) => {
        state.emailRequestStatus = "failed";
        state.emailRequestError = action.payload;
      })
      .addCase(confirmEmailChange.pending, (state) => {
        state.emailConfirmStatus = "loading";
        state.emailConfirmError = null;
      })
      .addCase(confirmEmailChange.fulfilled, (state, action) => {
        state.emailConfirmStatus = "succeeded";
        state.user = action.payload;
      })
      .addCase(confirmEmailChange.rejected, (state, action) => {
        state.emailConfirmStatus = "failed";
        state.emailConfirmError = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.passwordStatus = "loading";
        state.passwordError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordStatus = "succeeded";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordStatus = "failed";
        state.passwordError = action.payload;
      })
      .addCase(saveLocale.pending, (state) => {
        state.localeStatus = "loading";
        state.localeError = null;
      })
      .addCase(saveLocale.fulfilled, (state, action) => {
        state.localeStatus = "succeeded";
        state.user = action.payload;
      })
      .addCase(saveLocale.rejected, (state, action) => {
        state.localeStatus = "failed";
        state.localeError = action.payload;
      });
  },
});

export const {
  logout,
  clearAuthError,
  markAuthChecked,
  clearProfileError,
  resetEmailChangeState,
  resetPasswordChangeState,
} = authSlice.actions;
export default authSlice.reducer;
