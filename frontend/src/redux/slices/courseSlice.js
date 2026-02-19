import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/client";
import toast from "react-hot-toast";

const initialState = {
  courses: [],
  currentCourse: null,
  enrolledCourses: [],
  isLoading: false,
  error: null,
  filters: {
    category: "",
    level: "",
    courseType: "",
    search: "",
    sort: "newest",
  },
};

// Get all courses
export const getAllCourses = createAsyncThunk(
  "courses/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/courses");

      // console.log("<-----ADMIN ALL COURSES----->");
      // console.log(response.data.data);

      return response.data.data; // return only array
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Get single course
export const getCourse = createAsyncThunk(
  "courses/getOne",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${courseId}`);

      // console.log("<-----SINGEL COURSE----->");
      // console.log(response.data.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Create course (Admin)
export const createCourse = createAsyncThunk(
  "courses/create",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/courses", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Course created successfully!");

      // console.log("<-----COURSE CREATED----->");
      // console.log(response.data.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Update course (Admin)
export const updateCourse = createAsyncThunk(
  "courses/update",
  async ({ courseId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/courses/${courseId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Course updated successfully!");

      // console.log("<-----COURSE UPDATE----->");
      // console.log(response.data.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Delete course (Admin)
export const deleteCourse = createAsyncThunk(
  "courses/delete",
  async (courseId, { rejectWithValue }) => {
    try {
      await api.delete(`/courses/${courseId}`);
      toast.success("Course deleted successfully!");

      // console.log("<-----COURSE DELETE----->");

      return courseId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Toggle publish status (Admin)
export const togglePublishStatus = createAsyncThunk(
  "courses/togglePublish",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/courses/${courseId}/publish`);
      // toast.success("Course status updated!");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Get enrolled courses
export const getEnrolledCourses = createAsyncThunk(
  "courses/getEnrolled",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/enrollment/my-courses");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Enroll in free course
export const enrollFreeCourse = createAsyncThunk(
  "courses/enrollFree",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/enrollment/free/${courseId}`);
      toast.success("Successfully enrolled in course!");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const replyToComment = createAsyncThunk(
  "courses/replyToComment",
  async (
    { courseId, levelId, topicId, commentId, reply },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        `/topics/${courseId}/levels/${levelId}/topics/${topicId}/comments/${commentId}/reply`,
        { reply },
      );

      toast.success("Reply added successfully!");
      return { ...response.data, courseId, levelId, topicId, commentId };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const deleteComment = createAsyncThunk(
  "courses/deleteComment",
  async ({ courseId, levelId, topicId, commentId }, { rejectWithValue }) => {
    try {
      await api.delete(
        `/topics/${courseId}/levels/${levelId}/topics/${topicId}/comments/${commentId}`,
      );

      toast.success("Comment deleted!");
      return { courseId, levelId, topicId, commentId };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Courses
      .addCase(getAllCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(getAllCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch courses";
      })
      // Get Single Course
      .addCase(getCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload.data;
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch course";
      })
      // Create Course
      .addCase(createCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses.unshift(action.payload.data);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to create course";
      })
      // Update Course
      .addCase(updateCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.courses.findIndex(
          (c) => c._id === action.payload.data._id,
        );
        if (index !== -1) {
          state.courses[index] = action.payload.data;
        }
        if (state.currentCourse?._id === action.payload.data._id) {
          state.currentCourse = action.payload.data;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to update course";
      })
      // Delete Course
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter((c) => c._id !== action.payload);
      })
      // Toggle Publish
      .addCase(togglePublishStatus.fulfilled, (state, action) => {
        const index = state.courses.findIndex(
          (c) => c._id === action.payload.data._id,
        );
        if (index !== -1) {
          state.courses[index] = action.payload.data;
        }
      })
      // Get Enrolled Courses
      .addCase(getEnrolledCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEnrolledCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrolledCourses = action.payload.data;
      })
      .addCase(getEnrolledCourses.rejected, (state) => {
        state.isLoading = false;
      })
      // Enroll Free Course
      .addCase(enrollFreeCourse.fulfilled, (state, action) => {
        // The enrollment response returns updated user data
        // This will be handled by refetching user data via getMe in the component
      })
      .addCase(replyToComment.fulfilled, (state, action) => {
        const { levelId, topicId, commentId } = action.payload;

        const level = state.currentCourse.levels.find((l) => l._id === levelId);

        const topic = level?.topics.find((t) => t._id === topicId);

        const comment = topic?.comments.find((c) => c._id === commentId);

        if (comment) {
          comment.replies = action.payload.data.replies;
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { levelId, topicId, commentId } = action.payload;

        const level = state.currentCourse.levels.find((l) => l._id === levelId);

        const topic = level?.topics.find((t) => t._id === topicId);

        if (topic) {
          topic.comments = topic.comments.filter((c) => c._id !== commentId);
        }
      });
  },
});

export const { setFilters, clearFilters, clearCurrentCourse, clearError } =
  courseSlice.actions;

export default courseSlice.reducer;