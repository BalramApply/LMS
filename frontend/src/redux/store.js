import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import progressReducer from './slices/progressSlice';
import mockReducer from './slices/mockSlice';
import bannerReducer from './slices/bannerSlice';
import blogReducer from './slices/blogSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    progress: progressReducer,
    mock: mockReducer,
    banners: bannerReducer,
    blog: blogReducer,          // ← ADD THIS
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;