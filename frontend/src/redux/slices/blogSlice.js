import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchBlogs = createAsyncThunk(
  'blog/fetchBlogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/blogs?${query}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch blogs');
    }
  }
);

export const fetchBlogBySlug = createAsyncThunk(
  'blog/fetchBlogBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const res = await api.get(`/blogs/${slug}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Blog not found');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'blog/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/blogs/categories');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchTags = createAsyncThunk(
  'blog/fetchTags',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/blogs/tags');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const toggleLike = createAsyncThunk(
  'blog/toggleLike',
  async (blogId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/blogs/${blogId}/like`);
      return { blogId, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// ─── Admin Thunks ─────────────────────────────────────────────────────────────

export const adminFetchBlogs = createAsyncThunk(
  'blog/adminFetchBlogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/blogs/admin/all?${query}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const createBlog = createAsyncThunk(
  'blog/createBlog',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/blogs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create blog');
    }
  }
);

export const updateBlog = createAsyncThunk(
  'blog/updateBlog',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/blogs/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update blog');
    }
  }
);

export const deleteBlog = createAsyncThunk(
  'blog/deleteBlog',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/blogs/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchBlogAnalytics = createAsyncThunk(
  'blog/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/blogs/admin/analytics');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// ─── Comment Thunks ───────────────────────────────────────────────────────────

export const fetchComments = createAsyncThunk(
  'blog/fetchComments',
  async (blogId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/blogs/${blogId}/comments`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'blog/addComment',
  async ({ blogId, content, parentId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/blogs/${blogId}/comments`, { content, parentId });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const editComment = createAsyncThunk(
  'blog/editComment',
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/blogs/comments/${commentId}`, { content });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'blog/deleteComment',
  async ({ commentId, blogId }, { rejectWithValue }) => {
    try {
      await api.delete(`/blogs/comments/${commentId}`);
      return { commentId, blogId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  // Public list
  blogs: [],
  pagination: null,
  // Admin list
  adminBlogs: [],
  adminPagination: null,
  // Single blog detail
  currentBlog: null,
  relatedBlogs: [],
  // Metadata
  categories: [],
  tags: [],
  // Comments
  comments: [],
  // Analytics
  analytics: null,
  // UI
  loading: false,
  commentLoading: false,
  error: null,
  activeViewers: 0,
};

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
      state.relatedBlogs = [];
      state.comments = [];
    },
    clearError: (state) => { state.error = null; },
    setActiveViewers: (state, action) => {
      state.activeViewers = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── fetchBlogs
    builder
      .addCase(fetchBlogs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── fetchBlogBySlug
    builder
      .addCase(fetchBlogBySlug.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload.data;
        state.relatedBlogs = action.payload.related || [];
      })
      .addCase(fetchBlogBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── categories & tags
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; })
      .addCase(fetchTags.fulfilled, (state, action) => { state.tags = action.payload; });

    // ── toggleLike (optimistic handled in component, confirm from server)
    builder.addCase(toggleLike.fulfilled, (state, action) => {
      const { blogId, liked, likeCount } = action.payload;
      const updateLike = (arr) => arr.map((b) => b._id === blogId ? { ...b, isLiked: liked, likeCount } : b);
      state.blogs = updateLike(state.blogs);
      state.adminBlogs = updateLike(state.adminBlogs);
      if (state.currentBlog?._id === blogId) {
        state.currentBlog = { ...state.currentBlog, isLiked: liked, likeCount };
      }
    });

    // ── adminFetchBlogs
    builder
      .addCase(adminFetchBlogs.pending, (state) => { state.loading = true; })
      .addCase(adminFetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.adminBlogs = action.payload.data;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(adminFetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── createBlog
    builder
      .addCase(createBlog.pending, (state) => { state.loading = true; })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.adminBlogs.unshift(action.payload);
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── updateBlog
    builder
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.adminBlogs = state.adminBlogs.map((b) =>
          b._id === action.payload._id ? action.payload : b
        );
        if (state.currentBlog?._id === action.payload._id) {
          state.currentBlog = action.payload;
        }
      });

    // ── deleteBlog
    builder.addCase(deleteBlog.fulfilled, (state, action) => {
      state.adminBlogs = state.adminBlogs.filter((b) => b._id !== action.payload);
    });

    // ── analytics
    builder.addCase(fetchBlogAnalytics.fulfilled, (state, action) => {
      state.analytics = action.payload;
    });

    // ── comments
    builder
      .addCase(fetchComments.pending, (state) => { state.commentLoading = true; })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentLoading = false;
        state.comments = action.payload;
      });

    builder.addCase(addComment.fulfilled, (state, action) => {
      const comment = action.payload;
      if (comment.parent) {
        const parent = state.comments.find((c) => c._id === comment.parent);
        if (parent) parent.replies.push(comment);
      } else {
        state.comments.unshift({ ...comment, replies: [] });
      }
    });

    builder.addCase(editComment.fulfilled, (state, action) => {
      const updated = action.payload;
      state.comments = state.comments.map((c) => {
        if (c._id === updated._id) return { ...c, content: updated.content };
        c.replies = (c.replies || []).map((r) =>
          r._id === updated._id ? { ...r, content: updated.content } : r
        );
        return c;
      });
    });

    builder.addCase(deleteComment.fulfilled, (state, action) => {
      const { commentId } = action.payload;
      state.comments = state.comments.filter((c) => {
        c.replies = (c.replies || []).filter((r) => r._id !== commentId);
        return c._id !== commentId;
      });
    });
  },
});

export const { clearCurrentBlog, clearError, setActiveViewers } = blogSlice.actions;
export default blogSlice.reducer;