import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ADMIN_TOKEN_KEY } from "../../api/adminClient";
import * as adminAuthApi from "../../api/adminAuthApi";
import { loginAccount } from "./authSlice";
import i18n from "../../i18n/i18n";

// وقت انتهاء التوكن (ms) من الـ JWT payload — للعرض بس، السيرفر هو اللي بيتحقق فعلًا
export function getAdminTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

function loadStoredToken() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token && getAdminTokenExpiry(token) > Date.now()) return token;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  return null;
}

export const loginAdmin = createAsyncThunk(
  "adminAuth/loginAdmin",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await adminAuthApi.login({ email, password });
      return res.data.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) return rejectWithValue(i18n.t("admin.login.tooManyAttempts"));
      if (status === 401) return rejectWithValue(i18n.t("admin.login.invalidCredentials"));
      if (status === 400) return rejectWithValue(i18n.t("admin.login.invalidInput"));
      return rejectWithValue(i18n.t("admin.login.genericError"));
    }
  }
);

export const fetchAdmin = createAsyncThunk(
  "adminAuth/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminAuthApi.fetchMe();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.status ?? 0);
    }
  }
);

// Login and /me come without the photo (it can be large); it is loaded on its own.
export const fetchAdminAvatar = createAsyncThunk("adminAuth/fetchAdminAvatar", async () => {
  const res = await adminAuthApi.fetchAvatar();
  return res.data.data.avatar;
});

const initialState = {
  admin: null,
  token: loadStoredToken(),
  status: "idle",
  error: null,
  checked: false,
  sessionExpired: false,
};

function clearSession(state) {
  state.admin = null;
  state.token = null;
  state.checked = false;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    adminLogout(state) {
      clearSession(state);
      state.status = "idle";
      state.error = null;
      state.sessionExpired = false;
    },
    adminSessionExpired(state) {
      if (!state.token) return;
      clearSession(state);
      state.sessionExpired = true;
    },
    // After the admin edits their own settings (name, photo, email).
    setAdminProfile(state, action) {
      state.admin = { ...state.admin, ...action.payload };
    },
    clearAdminError(state) {
      state.error = null;
      state.sessionExpired = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.token;
        state.admin = action.payload.admin;
        state.checked = true;
        localStorage.setItem(ADMIN_TOKEN_KEY, action.payload.token);
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(loginAccount.fulfilled, (state, action) => {
        state.status = "idle";
        state.error = null;
        state.sessionExpired = false;
        if (action.payload.accountType !== "admin") {
          clearSession(state);
          return;
        }
        state.token = action.payload.token;
        state.admin = action.payload.admin;
        state.checked = true;
        localStorage.setItem(ADMIN_TOKEN_KEY, action.payload.token);
      })
      .addCase(fetchAdmin.fulfilled, (state, action) => {
        state.admin = { ...action.payload, avatar: action.payload.avatar ?? state.admin?.avatar };
        state.checked = true;
      })
      .addCase(fetchAdminAvatar.fulfilled, (state, action) => {
        if (state.admin) state.admin.avatar = action.payload;
      })
      .addCase(fetchAdminAvatar.rejected, (state) => {
        if (state.admin && state.admin.avatar === undefined) state.admin.avatar = "";
      })
      .addCase(fetchAdmin.rejected, (state, action) => {
        // 401 بيتعامل معاه الـ interceptor (adminSessionExpired)؛ 403 = توكن مش أدمن
        if (action.payload === 403) clearSession(state);
        else if (action.payload !== 401) state.checked = true;
      });
  },
});

export const { adminLogout, adminSessionExpired, clearAdminError, setAdminProfile } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
