import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';
import toast from 'react-hot-toast';

const initialState = {
  progress: null,
  isLoading: false,
  error: null,
  quizResult: null,
  showCompletionAnimation: false,
  completedItem: null,
};

// Update video progress
export const updateVideoProgress = createAsyncThunk(
  'progress/updateVideo',
  async (progressData, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/video', progressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Submit quiz
export const submitQuiz = createAsyncThunk(
  'progress/submitQuiz',
  async (quizData, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/quiz', quizData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Submit task
export const submitTask = createAsyncThunk(
  'progress/submitTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/task', taskData);
      toast.success('Task submitted successfully!');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Complete topic
export const completeTopic = createAsyncThunk(
  'progress/completeTopic',
  async (topicData, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/complete-topic', topicData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Complete level
export const completeLevel = createAsyncThunk(
  'progress/completeLevel',
  async (levelData, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/complete-level', levelData);
      toast.success('🎉 Level completed! Next level unlocked!');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get progress
export const getProgress = createAsyncThunk(
  'progress/get',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/progress/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Add after the getProgress thunk (before the progressSlice definition)
export const markReadingComplete = createAsyncThunk(
  'progress/markReadingComplete',
  async ({ courseId, topicId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/reading', { courseId, topicId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearQuizResult: (state) => {
      state.quizResult = null;
    },
    showAnimation: (state, action) => {
      state.showCompletionAnimation = true;
      state.completedItem = action.payload;
    },
    hideAnimation: (state) => {
      state.showCompletionAnimation = false;
      state.completedItem = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update Video Progress
      .addCase(updateVideoProgress.fulfilled, (state, action) => {
        if (state.progress) {
          state.progress = action.payload.data;
        }
      })
      // Submit Quiz
      .addCase(submitQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizResult = action.payload.data;
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to submit quiz';
      })
      // Submit Task
      .addCase(submitTask.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitTask.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.progress) {
          state.progress = action.payload.data;
        }
      })
      .addCase(submitTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to submit task';
      })
      // Complete Topic
      .addCase(completeTopic.fulfilled, (state, action) => {
        if (state.progress) {
          state.progress = action.payload.data;
        }
        state.showCompletionAnimation = true;
        state.completedItem = { type: 'topic' };
      })
      // Complete Level
      .addCase(completeLevel.fulfilled, (state, action) => {
        if (state.progress) {
          state.progress = action.payload.data;
        }
        state.showCompletionAnimation = true;
        state.completedItem = { type: 'level' };
      })
      // Get Progress
      .addCase(getProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.progress = action.payload.data;
      })
      .addCase(getProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch progress';
      })
      // Add after the getProgress cases
.addCase(markReadingComplete.fulfilled, (state, action) => {
  if (state.progress) {
    state.progress = action.payload.data;
  }
})
.addCase(markReadingComplete.rejected, (state, action) => {
  state.error = action.payload?.message || 'Failed to mark reading complete';
});
  },
});

export const { clearQuizResult, showAnimation, hideAnimation, clearError } =
  progressSlice.actions;

export default progressSlice.reducer;