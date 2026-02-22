import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiCheckCircle,
  FiCircle,
  FiLock,
  FiPlay,
  FiFileText,
  FiAward,
  FiMessageSquare,
} from "react-icons/fi";
import { getCourse } from "../../redux/slices/courseSlice";
import {
  getProgress,
  completeTopic,
  markReadingComplete,
} from "../../redux/slices/progressSlice";
import VideoPlayer from "../../pages/student/components/VideoPlayer";
import ReadingMaterial from "../../pages/student/components/ReadingMaterial";
import QuizComponent from "../../pages/student/components/QuizComponent";
import TaskSubmission from "../../pages/student/components/TaskSubmission";
import CommentSection from "../../pages/student/components/CommentSection";
import Loader from "../../components/common/Loader";
import {
  isLevelUnlocked,
  isLevelCompleted,
  isTopicCompleted,
  getVideoProgress,
  getQuizResult,
  getTaskSubmission,
} from "../../utils/progressCalculator";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import styles from "./styles/LearningView.module.css";

const LearningView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentCourse: course, isLoading: courseLoading } = useSelector(
    (state) => state.courses,
  );
  const {
    progress,
    isLoading: progressLoading,
    showCompletionAnimation,
  } = useSelector((state) => state.progress);
  const { user } = useSelector((state) => state.auth);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("video");
  const [showCelebration, setShowCelebration] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(false);

  // Fetch course and progress on mount
  useEffect(() => {
    dispatch(getCourse(courseId));
    dispatch(getProgress(courseId));
  }, [dispatch, courseId]);

  // Handle completion animation
  useEffect(() => {
    if (showCompletionAnimation) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [showCompletionAnimation]);

  // Refetch progress when needed
  const refetchProgress = () => {
    dispatch(getProgress(courseId));
  };

  if (courseLoading || progressLoading) {
    return <Loader fullScreen />;
  }

  if (!course) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundContent}>
          <h2 className={styles.notFoundTitle}>Course not found</h2>
          <button
            onClick={() => navigate("/courses")}
            className={styles.notFoundButton}
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  const currentLevel = course.levels?.[currentLevelIndex];
  const currentTopic = currentLevel?.topics?.[currentTopicIndex];

  if (!currentLevel || !currentTopic) {
    return (
      <div className={styles.notFound}>
        <p>No content available</p>
      </div>
    );
  }

  const enrollment = progress;
  const videoProgressData = enrollment
    ? getVideoProgress(currentTopic._id, enrollment.videoProgress)
    : { watchedPercentage: 0, lastWatchedTimestamp: 0 };
  const quizResult = enrollment
    ? getQuizResult(currentTopic._id, enrollment.quizResults)
    : null;
  const miniTask = enrollment
    ? getTaskSubmission(currentTopic._id, "mini", enrollment.taskSubmissions)
    : null;

  const majorTask = enrollment
    ? getTaskSubmission(currentLevel._id, "major", enrollment.taskSubmissions)
    : null;

  const topicCompleted = enrollment
    ? isTopicCompleted(currentTopic._id, enrollment.completedTopics)
    : false;
  const levelCompleted = enrollment
    ? isLevelCompleted(currentLevel._id, enrollment.completedLevels)
    : false;

  const handleTopicChange = (levelIndex, topicIndex) => {
    setCurrentLevelIndex(levelIndex);
    setCurrentTopicIndex(topicIndex);
    setActiveTab("video");
    setSidebarOpen(false);
  };

  // Check if topic completion conditions are met
  const checkTopicCompletion = async () => {
    if (topicCompleted || checkingCompletion) return;

    setCheckingCompletion(true);

    try {
      // Refetch latest progress first
      const latestProgress = await dispatch(getProgress(courseId)).unwrap();

      const progressData = latestProgress.data;

      const latestVideoProgress = getVideoProgress(
        currentTopic._id,
        progressData.videoProgress || [],
      );

      const latestQuizResult = getQuizResult(
        currentTopic._id,
        progressData.quizResults || [],
      );

      const latestMiniTask = getTaskSubmission(
        currentTopic._id,
        "mini",
        progressData.taskSubmissions || [],
      );

      // Check if all required components are completed
      const hasQuiz = currentTopic.quiz && currentTopic.quiz.length > 0;
      const hasMiniTask = currentTopic.miniTask && currentTopic.miniTask.title;

      const videoComplete = latestVideoProgress.watchedPercentage >= 90;
      const quizComplete =
        !hasQuiz || (latestQuizResult && latestQuizResult.attempted);
      const taskComplete =
        !hasMiniTask || (latestMiniTask && latestMiniTask.completed);

      // If all conditions met, mark topic as complete
      if (videoComplete && quizComplete && taskComplete) {
        const alreadyCompleted = latestProgress.completedTopics.some(
          (ct) => ct.toString() === currentTopic._id.toString(),
        );

        if (!alreadyCompleted) {
          await dispatch(
            completeTopic({ courseId, topicId: currentTopic._id }),
          ).unwrap();
          toast.success("🎉 Topic completed!");

          // Refetch progress to update UI
          await dispatch(getProgress(courseId));
        }
      }
    } catch (error) {
      console.error("Error checking topic completion:", error);
    } finally {
      setCheckingCompletion(false);
    }
  };

  const handleVideoComplete = async () => {
    // Check if topic can be completed after video finishes
    await checkTopicCompletion();
  };

  const handleQuizComplete = async () => {
    // Refetch progress and check completion
    await refetchProgress();
    await checkTopicCompletion();
  };

  const handleTaskComplete = async () => {
    // Refetch progress and check completion
    await refetchProgress();
    await checkTopicCompletion();
  };

  // Add this handler
  const handleReadingView = async () => {
    try {
      await dispatch(
        markReadingComplete({ courseId, topicId: currentTopic._id }),
      );
      await refetchProgress();
      await checkTopicCompletion();
    } catch (error) {
      console.error("Error marking reading complete:", error);
    }
  };

  const handleNext = () => {
    if (currentTopicIndex < currentLevel.topics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
      setActiveTab("video");
    } else if (currentLevelIndex < course.levels.length - 1) {
      if (
        isLevelUnlocked(
          currentLevelIndex + 1,
          enrollment?.completedLevels || [],
          course.levels,
        )
      ) {
        setCurrentLevelIndex(currentLevelIndex + 1);
        setCurrentTopicIndex(0);
        setActiveTab("video");
      } else {
        toast.error("Complete current level to unlock next level");
      }
    } else {
      toast.success("Course completed! Check your certificates.");
    }
  };

  const handlePrevious = () => {
    if (currentTopicIndex > 0) {
      setCurrentTopicIndex(currentTopicIndex - 1);
      setActiveTab("video");
    } else if (currentLevelIndex > 0) {
      setCurrentLevelIndex(currentLevelIndex - 1);
      const prevLevel = course.levels[currentLevelIndex - 1];
      setCurrentTopicIndex(prevLevel.topics.length - 1);
      setActiveTab("video");
    }
  };

  return (
    <div className={styles.container}>
      {showCelebration && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={styles.sidebar}
          >
            {/* Sidebar Header */}
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarHeaderTop}>
                <h2 className={styles.sidebarTitle}>{course.title}</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={styles.sidebarClose}
                >
                  <FiX className={styles.icon} />
                </button>
              </div>
              {/* Progress Bar */}
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>Progress</span>
                  <span className={styles.progressValue}>
                    {enrollment?.progress || 0}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${enrollment?.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className={styles.sidebarContent}>
              {course.levels.map((level, levelIndex) => {
                const unlocked = isLevelUnlocked(
                  levelIndex,
                  enrollment?.completedLevels || [],
                  course.levels,
                );
                const completed = enrollment
                  ? isLevelCompleted(level._id, enrollment.completedLevels)
                  : false;

                return (
                  <div key={level._id} className={styles.levelSection}>
                    {/* Level Header */}
                    <div
                      className={`${styles.levelHeader} ${levelIndex === currentLevelIndex ? styles.levelActive : ""}`}
                    >
                      {completed ? (
                        <FiCheckCircle
                          className={`${styles.levelIcon} ${styles.levelIconCompleted}`}
                        />
                      ) : unlocked ? (
                        <FiCircle
                          className={`${styles.levelIcon} ${styles.levelIconUnlocked}`}
                        />
                      ) : (
                        <FiLock
                          className={`${styles.levelIcon} ${styles.levelIconLocked}`}
                        />
                      )}
                      <span className={styles.levelTitle}>
                        Level {levelIndex + 1}
                      </span>
                    </div>

                    {/* Topics */}
                    {/* Topics */}
                    {unlocked && (
                      <div className={styles.topicsList}>
                        {level.topics.map((topic, topicIndex) => {
                          const topicDone = enrollment
                            ? isTopicCompleted(
                                topic._id,
                                enrollment.completedTopics,
                              )
                            : false;
                          const isCurrent =
                            levelIndex === currentLevelIndex &&
                            topicIndex === currentTopicIndex;

                          return (
                            <button
                              key={topic._id}
                              onClick={() =>
                                handleTopicChange(levelIndex, topicIndex)
                              }
                              className={`${styles.topicItem} ${isCurrent ? styles.topicActive : ""}`}
                            >
                              {topicDone ? (
                                <FiCheckCircle
                                  className={`${styles.topicIcon} ${styles.topicIconCompleted}`}
                                />
                              ) : (
                                <FiPlay
                                  className={`${styles.topicIcon} ${styles.topicIconPlay}`}
                                />
                              )}
                              <span className={styles.topicTitle}>
                                {topic.topicTitle}
                              </span>
                            </button>
                          );
                        })}

                        {/* ✅ Major Task after all topics */}
                        {level.majorTask?.title && (
                          <button
                            onClick={() => {
                              setCurrentLevelIndex(levelIndex);
                              setActiveTab("majorTask");
                              setSidebarOpen(false);
                            }}
                            className={`${styles.topicItem} ${
                              activeTab === "majorTask" &&
                              levelIndex === currentLevelIndex
                                ? styles.topicActive
                                : ""
                            }`}
                          >
                            {enrollment &&
                            getTaskSubmission(
                              level._id,
                              "major",
                              enrollment.taskSubmissions,
                            )?.completed ? (
                              <FiCheckCircle
                                className={`${styles.topicIcon} ${styles.topicIconCompleted}`}
                              />
                            ) : (
                              <FiAward
                                className={`${styles.topicIcon} ${styles.topicIconPlay}`}
                              />
                            )}
                            <span className={styles.topicTitle}>
                              🏆 Major Task
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarContent}>
            <div className={styles.topBarLeft}>
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={styles.menuButton}
                >
                  <FiMenu className={styles.icon} />
                </button>
              )}
              <div>
                <h1 className={styles.topBarTitle}>
                  {currentTopic.topicTitle}
                </h1>
                <p className={styles.topBarSubtitle}>
                  Level {currentLevelIndex + 1} • Topic {currentTopicIndex + 1}
                </p>
              </div>
            </div>

            {topicCompleted && (
              <span className={styles.completedBadge}>
                <FiCheckCircle className={styles.badgeIcon} />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            {currentTopic.video?.url && (
              <button
                onClick={() => setActiveTab("video")}
                className={`${styles.tab} ${activeTab === "video" ? styles.tabActive : ""}`}
              >
                <FiPlay className={styles.tabIcon} />
                Video Lesson
              </button>
            )}
            {currentTopic.readingMaterial?.content && (
              <button
                onClick={() => {
                  setActiveTab("reading");
                  handleReadingView(); // ← fire when tab is clicked
                }}
                className={`${styles.tab} ${activeTab === "reading" ? styles.tabActive : ""}`}
              >
                <FiFileText className={styles.tabIcon} />
                Reading Material
              </button>
            )}
            {currentTopic.quiz && currentTopic.quiz.length > 0 && (
              <button
                onClick={() => setActiveTab("quiz")}
                className={`${styles.tab} ${activeTab === "quiz" ? styles.tabActive : ""}`}
              >
                <FiFileText className={styles.tabIcon} />
                Quiz
                {quizResult && (
                  <FiCheckCircle className={styles.tabCheckIcon} />
                )}
              </button>
            )}
            {currentTopic.miniTask?.title && (
              <button
                onClick={() => setActiveTab("task")}
                className={`${styles.tab} ${activeTab === "task" ? styles.tabActive : ""}`}
              >
                <FiAward className={styles.tabIcon} />
                Task
                {miniTask?.completed && (
                  <FiCheckCircle className={styles.tabCheckIcon} />
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("comments")}
              className={`${styles.tab} ${activeTab === "comments" ? styles.tabActive : ""}`}
            >
              <FiMessageSquare className={styles.tabIcon} />
              Discussion
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "video" && currentTopic.video?.url && (
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.tabContent}
              >
                <VideoPlayer
                  videoUrl={currentTopic.video.url}
                  courseId={courseId}
                  topicId={currentTopic._id}
                  lastTimestamp={videoProgressData.lastWatchedTimestamp}
                  onComplete={handleVideoComplete}
                />
              </motion.div>
            )}

            {activeTab === "reading" &&
              currentTopic.readingMaterial?.content && (
                <motion.div
                  key="reading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={styles.tabContent}
                >
                  <ReadingMaterial
                    title={
                      currentTopic.readingMaterial.title || "Reading Material"
                    }
                    content={currentTopic.readingMaterial.content}
                  />
                </motion.div>
              )}

            {activeTab === "quiz" &&
              currentTopic.quiz &&
              currentTopic.quiz.length > 0 && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <QuizComponent
                    quiz={currentTopic.quiz}
                    courseId={courseId}
                    topicId={currentTopic._id}
                    onComplete={handleQuizComplete}
                  />
                </motion.div>
              )}

            {activeTab === "task" && currentTopic.miniTask?.title && (
              <motion.div
                key="task"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TaskSubmission
                  task={currentTopic.miniTask}
                  courseId={courseId}
                  taskId={currentTopic._id}
                  taskType="mini"
                  existingSubmission={miniTask}
                  onComplete={handleTaskComplete}
                />
              </motion.div>
            )}
            {/* ✅ Major Task panel — standalone, outside mini task */}
            {activeTab === "majorTask" && currentLevel.majorTask?.title && (
              <motion.div
                key="majorTask"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {!levelCompleted ? (
                  <div className={styles.majorTaskLocked}>
                    <FiLock size={40} />
                    <h3>Major Task Locked</h3>
                    <p>
                      Complete all topics in this level to unlock the Major Task
                    </p>
                  </div>
                ) : (
                  <div className={styles.majorTaskWrapper}>
                    <div className={styles.majorTaskHeader}>
                      {/* <FiAward size={28} /> */}
                      {/* <div>
                        <h2>{currentLevel.majorTask.title}</h2>
                        <span className={styles.majorTaskBadge}>
                          Level {currentLevelIndex + 1} — Major Taskss
                        </span>
                      </div> */}
                      {/* {majorTask?.completed && (
                        <span className={styles.completedBadge}>
                          <FiCheckCircle /> Submitted
                        </span>
                      )} */}
                    </div>

                    <p className={styles.majorTaskDescription}>
                      {currentLevel.majorTask.description}
                    </p>

                    {currentLevel.majorTask.requirements?.length > 0 && (
                      <div className={styles.majorTaskRequirements}>
                        <h4>Requirements</h4>
                        <ul>
                          {currentLevel.majorTask.requirements.map((req, i) => (
                            <li key={i}>
                              <FiCheckCircle className={styles.reqIcon} />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentLevel.majorTask.estimatedTime && (
                      <p className={styles.majorTaskTime}>
                        ⏱ Estimated time: {currentLevel.majorTask.estimatedTime}
                      </p>
                    )}

                    <TaskSubmission
                      task={currentLevel.majorTask}
                      courseId={courseId}
                      taskId={currentLevel._id}
                      taskType="major"
                      existingSubmission={majorTask}
                      onComplete={refetchProgress}
                    />
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "comments" && (
              <motion.div
                key="comments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CommentSection
                  comments={currentTopic.comments || []}
                  courseId={courseId}
                  levelId={currentLevel._id}
                  topicId={currentTopic._id}
                  currentUser={user}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className={styles.navButtons}>
            <button
              onClick={handlePrevious}
              disabled={currentLevelIndex === 0 && currentTopicIndex === 0}
              className={`${styles.navButton} ${styles.navButtonPrev}`}
            >
              ← Previous
            </button>

            <button
              onClick={handleNext}
              className={`${styles.navButton} ${styles.navButtonNext}`}
            >
              {currentTopicIndex === currentLevel.topics.length - 1 &&
              currentLevelIndex === course.levels.length - 1
                ? "Finish Course"
                : "Next →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearningView;
