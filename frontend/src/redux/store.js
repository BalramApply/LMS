import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import progressReducer from './slices/progressSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    progress: progressReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;