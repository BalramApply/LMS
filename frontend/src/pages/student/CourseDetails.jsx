import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiUsers,
  FiBookOpen,
  FiStar,
  FiPlay,
  FiFileText,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";
import {
  getCourse,
  enrollFreeCourse,
  replyToComment,
  deleteComment,
} from "../../redux/slices/courseSlice";
import { getMe } from "../../redux/slices/authSlice";
import { displayRazorpay, formatCurrency } from "../../utils/razorpayHelper";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import styles from "./styles/CourseDetails.module.css";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentCourse: course, isLoading } = useSelector(
    (state) => state.courses,
  );
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    dispatch(getCourse(id));
  }, [dispatch, id]);

  // Check if user is enrolled - handle both string ID and populated object
  const isEnrolled = user?.enrolledCourses?.some((e) => {
    const courseId = typeof e.course === 'string' ? e.course : (e.course?._id || e.course?.id);
    return courseId === id;
  });

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    // If already enrolled, go to learning view
    if (isEnrolled) {
      navigate(`/learning/${id}`);
      return;
    }

    setEnrolling(true);

    try {
      if (course.courseType === "Free") {
        await dispatch(enrollFreeCourse(id)).unwrap();
        // Refresh user data to update enrolledCourses
        await dispatch(getMe()).unwrap();
        navigate(`/learning/${id}`);
      } else {
        await displayRazorpay(id, user);
      }
    } catch (error) {
      toast.error(error?.message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) return <Loader fullScreen />;
  if (!course) return <div className={styles.notFound}>Course not found</div>;

  return (
    <div className={styles.container}>
      {/* ================= HERO SECTION ================= */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1>{course.title}</h1>
            <p>{course.shortDescription}</p>

            <div className={styles.heroStats}>
              <span className={styles.statItem}>
                <FiUsers /> {course.enrolledStudents || 0} Students
              </span>
              <span className={styles.statItem}>
                <FiBookOpen /> {course.levels?.length || 0} Levels
              </span>
              <span className={styles.statItem}>
                <FiStar /> {course.averageRating || 0} Rating
              </span>
            </div>
          </div>

          {course.thumbnail?.url && (
            <img
              src={course.thumbnail.url}
              alt={course.title}
              className={styles.heroImage}
            />
          )}
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className={styles.mainContent}>
        {/* LEFT CONTENT */}
        <div className={styles.leftContent}>
          {/* About */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>About this course</h2>
            <p className={styles.cardText}>{course.fullDescription}</p>
          </div>

          {/* Instructor */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Instructor</h2>
            <p className={styles.instructorName}>{course.instructorName}</p>
            <p className={styles.instructorBio}>{course.instructorBio}</p>
          </div>

          {/* Roadmap */}
          {course.roadmap?.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Course Roadmap</h2>
              <ul className={styles.roadmapList}>
                {course.roadmap.map((item) => (
                  <li key={item._id} className={styles.roadmapItem}>
                    <FiCheckCircle />
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Levels */}
          {course.levels?.map((level) => (
            <div key={level._id} className={styles.levelCard}>
              <h3 className={styles.levelTitle}>
                Level {level.levelNumber}: {level.levelTitle}
              </h3>
              <p className={styles.levelDescription}>{level.levelDescription}</p>

              {/* Major Task */}
              {level.majorTask?.title && (
                <div className={styles.majorTask}>
                  <strong>Major Task:</strong> {level.majorTask.title}
                </div>
              )}

              {/* Topics */}
              {level.topics?.map((topic) => (
                <div key={topic._id} className={styles.topicCard}>
                  <h4 className={styles.topicTitle}>
                    {topic.topicNumber} - {topic.topicTitle}
                  </h4>

                  {/* Video */}
                  {topic.video?.url && (
                    <>
                      {isEnrolled ? (
                        <a
                          href={topic.video.url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.topicLink}
                        >
                          <FiPlay /> Watch Video ({topic.video.duration} min)
                        </a>
                      ) : (
                        <div className={`${styles.topicLink} ${styles.lockedLink}`}>
                          <FiLock /> Watch Video ({topic.video.duration} min) - Enroll to access
                        </div>
                      )}
                    </>
                  )}

                  {/* Reading Material */}
                  {topic.readingMaterial?.url && (
                    <>
                      {isEnrolled ? (
                        <a
                          href={topic.readingMaterial.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`${styles.topicLink} ${styles.pdfLink}`}
                        >
                          <FiFileText /> {topic.readingMaterial.title}
                        </a>
                      ) : (
                        <div className={`${styles.topicLink} ${styles.pdfLink} ${styles.lockedLink}`}>
                          <FiLock /> {topic.readingMaterial.title} - Enroll to access
                        </div>
                      )}
                    </>
                  )}

                  {/* Quiz */}
                  {topic.quiz?.length > 0 && (
                    <div className={styles.quizSection}>
                      <strong>Quiz:</strong>
                      <ul className={styles.quizList}>
                        {topic.quiz.map((q) => (
                          <li key={q._id}>{q.question}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Comments */}
                  {topic.comments?.length > 0 && (
                    <div className={styles.commentsSection}>
                      <strong>Student Comments:</strong>

                      <ul className={styles.commentsList}>
                        {topic.comments.map((comment) => (
                          <li key={comment._id} className={styles.commentItem}>
                            {/* Student Info */}
                            <div className={styles.commentHeader}>
                              <img
                                src={comment.student?.avatar?.url}
                                alt="avatar"
                                className={styles.commentAvatar}
                              />
                              <span className={styles.commentAuthor}>
                                {comment.student?.name}
                              </span>
                            </div>

                            {/* Student Comment */}
                            <p className={styles.commentText}>{comment.comment}</p>

                            {/* Admin Replies */}
                            {comment.replies?.length > 0 && (
                              <div className={styles.repliesList}>
                                {comment.replies.map((reply) => (
                                  <div key={reply._id} className={styles.replyItem}>
                                    <span className={styles.replyLabel}>
                                      Admin:
                                    </span>{" "}
                                    {reply.reply}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Admin Buttons */}
                            {user?.role === "admin" && (
                              <div className={styles.commentActions}>
                                <button
                                  className={styles.replyBtn}
                                  onClick={() => {
                                    const replyText = prompt("Enter reply");
                                    if (replyText) {
                                      dispatch(
                                        replyToComment({
                                          courseId: course._id,
                                          levelId: level._id,
                                          topicId: topic._id,
                                          commentId: comment._id,
                                          reply: replyText,
                                        }),
                                      );
                                    }
                                  }}
                                >
                                  Reply
                                </button>

                                <button
                                  className={styles.deleteBtn}
                                  onClick={() =>
                                    dispatch(
                                      deleteComment({
                                        courseId: course._id,
                                        levelId: level._id,
                                        topicId: topic._id,
                                        commentId: comment._id,
                                      }),
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className={styles.sidebar}>
          <p className={styles.price}>
            {course.courseType === "Free"
              ? "Free"
              : formatCurrency(course.effectivePrice || course.price)}
          </p>

          {user?.role !== "admin" && (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className={`${styles.enrollBtn} ${enrolling ? styles.disabledBtn : ""}`}
            >
              {isEnrolled
                ? "Continue Learning"
                : enrolling
                ? "Processing..."
                : "Enroll Now"}
            </button>
          )}


          <div className={styles.courseInfo}>
            <p><strong>Category:</strong> {course.category}</p>
            <p><strong>Level:</strong> {course.level}</p>
            <p><strong>Language:</strong> {course.language}</p>
            <p><strong>Access:</strong> {course.accessType}</p>
            <p><strong>Batch:</strong> {course.batchType}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;