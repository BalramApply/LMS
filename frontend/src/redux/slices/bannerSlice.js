import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from '../../api/client';

// ─────────────────────────────────────────────
// THUNKS — PUBLIC
// ─────────────────────────────────────────────

export const fetchActiveBanners = createAsyncThunk(
  "banners/fetchActive",
  async (type, { rejectWithValue }) => {  // no default
    try {
      const url = type ? `/banners/active?type=${type}` : `/banners/active`;
      const { data } = await api.get(url);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch banners");
    }
  }
);

export const trackBannerView = createAsyncThunk(
  "banners/trackView",
  async (id) => {
    await api.patch(`/banners/${id}/view`);
    return id;
  }
);

export const trackBannerClick = createAsyncThunk(
  "banners/trackClick",
  async (id) => {
    await api.patch(`/banners/${id}/click`);
    return id;
  }
);

// ─────────────────────────────────────────────
// THUNKS — ADMIN
// ─────────────────────────────────────────────

export const fetchAllBanners = createAsyncThunk(
  "banners/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/banners");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch banners");
    }
  }
);

export const createBanner = createAsyncThunk(
  "banners/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/admin/banners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create banner");
    }
  }
);

export const updateBanner = createAsyncThunk(
  "banners/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admin/banners/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update banner");
    }
  }
);

export const deleteBanner = createAsyncThunk(
  "banners/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/banners/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete banner");
    }
  }
);

export const toggleBannerStatus = createAsyncThunk(
  "banners/toggle",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/banners/${id}/toggle`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle banner");
    }
  }
);

// ─────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────

const bannerSlice = createSlice({
  name: "banners",
  initialState: {
    // Public hero slider
    activeBanners: [],
    activeBannersLoading: false,

    // Admin table
    allBanners: [],
    allBannersLoading: false,

    // Mutation state
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearBannerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchActiveBanners ──
    builder
      .addCase(fetchActiveBanners.pending, (state) => {
        state.activeBannersLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveBanners.fulfilled, (state, action) => {
        state.activeBannersLoading = false;
        state.activeBanners = action.payload;
      })
      .addCase(fetchActiveBanners.rejected, (state, action) => {
        state.activeBannersLoading = false;
        state.error = action.payload;
      });

    // ── fetchAllBanners (admin) ──
    builder
      .addCase(fetchAllBanners.pending, (state) => {
        state.allBannersLoading = true;
      })
      .addCase(fetchAllBanners.fulfilled, (state, action) => {
        state.allBannersLoading = false;
        state.allBanners = action.payload;
      })
      .addCase(fetchAllBanners.rejected, (state, action) => {
        state.allBannersLoading = false;
        state.error = action.payload;
      });

    // ── createBanner ──
    builder
      .addCase(createBanner.pending, (state) => { state.actionLoading = true; })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.allBanners.push(action.payload);
        // Re-sort by displayOrder
        state.allBanners.sort((a, b) => a.displayOrder - b.displayOrder);
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── updateBanner ──
    builder
      .addCase(updateBanner.pending, (state) => { state.actionLoading = true; })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.allBanners.findIndex(b => b._id === action.payload._id);
        if (idx !== -1) state.allBanners[idx] = action.payload;
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── deleteBanner ──
    builder
      .addCase(deleteBanner.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.allBanners = state.allBanners.filter(b => b._id !== action.payload);
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── toggleBannerStatus ──
    builder
      .addCase(toggleBannerStatus.fulfilled, (state, action) => {
        const idx = state.allBanners.findIndex(b => b._id === action.payload._id);
        if (idx !== -1) state.allBanners[idx] = action.payload;
      });
  },
});

export const { clearBannerError } = bannerSlice.actions;
export default bannerSlice.reducer;