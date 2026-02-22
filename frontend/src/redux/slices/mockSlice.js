import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../api/client";
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN THUNKS
// ─────────────────────────────────────────────────────────────────────────────

export const fetchAllMockTestsAdmin = createAsyncThunk(
  'mock/fetchAllAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/mock-tests/admin');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tests');
    }
  }
);

export const createMockTest = createAsyncThunk(
  'mock/createTest',
  async (testData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/mock-tests', testData);
      toast.success('Mock test created successfully!');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create test');
    }
  }
);

export const updateMockTest = createAsyncThunk(
  'mock/updateTest',
  async ({ id, testData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/mock-tests/${id}`, testData);
      toast.success('Test updated successfully!');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update test');
    }
  }
);

export const deleteMockTest = createAsyncThunk(
  'mock/deleteTest',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/mock-tests/${id}`);
      toast.success('Test deleted successfully!');
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete test');
    }
  }
);

export const togglePublishTest = createAsyncThunk(
  'mock/togglePublish',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/mock-tests/${id}/publish`);
      toast.success(data.message);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle publish');
    }
  }
);

export const addQuestion = createAsyncThunk(
  'mock/addQuestion',
  async ({ testId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/mock-tests/${testId}/questions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Question added!');
      return { testId, question: data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add question');
    }
  }
);

export const updateQuestion = createAsyncThunk(
  'mock/updateQuestion',
  async ({ testId, questionId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/mock-tests/${testId}/questions/${questionId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success('Question updated!');
      return { testId, question: data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update question');
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  'mock/deleteQuestion',
  async ({ testId, questionId }, { rejectWithValue }) => {
    try {
      await api.delete(`/mock-tests/${testId}/questions/${questionId}`);
      toast.success('Question deleted!');
      return { testId, questionId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete question');
    }
  }
);

export const fetchTestAttempts = createAsyncThunk(
  'mock/fetchAttempts',
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/mock-tests/${testId}/attempts`);
      return { testId, attempts: data.data, stats: data.stats };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch attempts');
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT THUNKS
// ─────────────────────────────────────────────────────────────────────────────

export const fetchPublishedTests = createAsyncThunk(
  'mock/fetchPublished',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/mock-tests');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tests');
    }
  }
);

export const startTestAttempt = createAsyncThunk(
  'mock/startAttempt',
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/mock-tests/${testId}/start`);
      return data.data; // { attempt, test }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to start test');
    }
  }
);

export const submitTestAttempt = createAsyncThunk(
  'mock/submitAttempt',
  async ({ attemptId, answers }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/mock-tests/attempts/${attemptId}/submit`, { answers });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit test');
    }
  }
);

export const fetchAttemptResult = createAsyncThunk(
  'mock/fetchResult',
  async (attemptId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/mock-tests/attempts/${attemptId}/result`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch result');
    }
  }
);

export const fetchMyAttempts = createAsyncThunk(
  'mock/fetchMyAttempts',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/mock-tests/my-attempts');
      return { attempts: data.data, stats: data.stats };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch your attempts');
    }
  }
);

export const createTestOrder = createAsyncThunk(
  'mock/createOrder',
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/mock-tests/${testId}/create-order`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create order');
    }
  }
);

export const verifyTestPayment = createAsyncThunk(
  'mock/verifyPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/mock-tests/verify-payment', paymentData);
      toast.success('Payment successful! You can now take the test.');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Payment verification failed');
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  // Admin
  adminTests: [],
  testAttempts: [],
  testAttemptsStats: null,

  // Student
  publishedTests: [],
  myAttempts: [],
  myStats: null,

  // Active test session
  activeTest: null,       // test questions (no answers)
  activeAttempt: null,    // current attempt doc
  currentResult: null,    // result after submission

  isLoading: false,
  isSubmitting: false,
  error: null,
};

const mockSlice = createSlice({
  name: 'mock',
  initialState,
  reducers: {
    clearActiveTest: (state) => {
      state.activeTest = null;
      state.activeAttempt = null;
    },
    clearResult: (state) => {
      state.currentResult = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const loading = (state) => { state.isLoading = true; state.error = null; };
    const failed = (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      toast.error(action.payload);
    };

    builder
      // ── Admin ────────────────────────────────────────────────────────────────
      .addCase(fetchAllMockTestsAdmin.pending, loading)
      .addCase(fetchAllMockTestsAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminTests = action.payload;
      })
      .addCase(fetchAllMockTestsAdmin.rejected, failed)

      .addCase(createMockTest.pending, loading)
      .addCase(createMockTest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminTests.unshift(action.payload);
      })
      .addCase(createMockTest.rejected, failed)

      .addCase(updateMockTest.pending, loading)
      .addCase(updateMockTest.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.adminTests.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.adminTests[idx] = action.payload;
      })
      .addCase(updateMockTest.rejected, failed)

      .addCase(deleteMockTest.pending, loading)
      .addCase(deleteMockTest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminTests = state.adminTests.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteMockTest.rejected, failed)

      .addCase(togglePublishTest.fulfilled, (state, action) => {
        const idx = state.adminTests.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.adminTests[idx] = action.payload;
      })

      .addCase(addQuestion.fulfilled, (state, action) => {
        const test = state.adminTests.find((t) => t._id === action.payload.testId);
        if (test) test.questions.push(action.payload.question);
      })

      .addCase(updateQuestion.fulfilled, (state, action) => {
        const test = state.adminTests.find((t) => t._id === action.payload.testId);
        if (test) {
          const idx = test.questions.findIndex(
            (q) => q._id === action.payload.question._id
          );
          if (idx !== -1) test.questions[idx] = action.payload.question;
        }
      })

      .addCase(deleteQuestion.fulfilled, (state, action) => {
        const test = state.adminTests.find((t) => t._id === action.payload.testId);
        if (test) {
          test.questions = test.questions.filter(
            (q) => q._id !== action.payload.questionId
          );
        }
      })

      .addCase(fetchTestAttempts.pending, loading)
      .addCase(fetchTestAttempts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.testAttempts = action.payload.attempts;
        state.testAttemptsStats = action.payload.stats;
      })
      .addCase(fetchTestAttempts.rejected, failed)

      // ── Student ──────────────────────────────────────────────────────────────
      .addCase(fetchPublishedTests.pending, loading)
      .addCase(fetchPublishedTests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publishedTests = action.payload;
      })
      .addCase(fetchPublishedTests.rejected, failed)

      .addCase(startTestAttempt.pending, loading)
      .addCase(startTestAttempt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeTest = action.payload.test;
        state.activeAttempt = action.payload.attempt;
      })
      .addCase(startTestAttempt.rejected, failed)

      .addCase(submitTestAttempt.pending, (state) => { state.isSubmitting = true; })
      .addCase(submitTestAttempt.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentResult = action.payload;
        state.activeTest = null;
        state.activeAttempt = null;
      })
      .addCase(submitTestAttempt.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      .addCase(fetchAttemptResult.pending, loading)
      .addCase(fetchAttemptResult.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentResult = action.payload;
      })
      .addCase(fetchAttemptResult.rejected, failed)

      .addCase(fetchMyAttempts.pending, loading)
      .addCase(fetchMyAttempts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myAttempts = action.payload.attempts;
        state.myStats = action.payload.stats;
      })
      .addCase(fetchMyAttempts.rejected, failed);
  },
});

export const { clearActiveTest, clearResult, clearError } = mockSlice.actions;
export default mockSlice.reducer;