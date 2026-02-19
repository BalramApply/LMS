import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMessageSquare, FiTrash2, FiSend, FiX } from "react-icons/fi";
import api from "../../api/client";
import Loader from "../../components/common/Loader";
import { formatRelativeTime } from "../../utils/formatters";
import toast from "react-hot-toast";
import styles from "./styles/CommentModeration.module.css";

const CommentModeration = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await api.get("/admin/comments");
      setComments(response.data.data);
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE COMMENT ================= */
  const handleDelete = async (comment) => {
    if (!window.confirm("Delete this comment permanently?")) return;

    try {
      await api.delete(
        `/topics/${comment.courseId}/levels/${comment.levelId}/topics/${comment.topicId}/comments/${comment.commentId}`
      );

      // Remove from UI instantly
      setComments((prev) =>
        prev.filter((c) => c.commentId !== comment.commentId)
      );

      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  /* ================= REPLY COMMENT ================= */
  const handleReply = async (comment) => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      const response = await api.post(
        `/topics/${comment.courseId}/levels/${comment.levelId}/topics/${comment.topicId}/comments/${comment.commentId}/reply`,
        { reply: replyText }
      );

      const newReply = response.data?.data;

      // Update UI instantly
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === comment.commentId
            ? {
                ...c,
                replies: [...(c.replies || []), newReply],
              }
            : c
        )
      );

      toast.success("Reply added");
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.title}>Comment Moderation</h1>
          <p className={styles.subtitle}>
            Manage and respond to student comments
          </p>
        </motion.div>

        <div className={styles.commentsList}>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <motion.div
                key={comment.commentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.commentCard}
              >
                {/* Header */}
                <div className={styles.commentHeader}>
                  <div className={styles.studentInfo}>
                    {comment.student?.avatar?.url ? (
                      <img
                        src={comment.student.avatar.url}
                        alt={comment.student.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {comment.student?.name?.charAt(0)}
                      </div>
                    )}

                    <div className={styles.studentDetails}>
                      <div className={styles.studentName}>
                        {comment.student?.name}
                      </div>
                      <div className={styles.commentMeta}>
                        <span className={styles.timestamp}>
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                        <span className={styles.separator}>•</span>
                        <span className={styles.location}>
                          {comment.courseName}
                        </span>
                        <span className={styles.separator}>→</span>
                        <span className={styles.location}>
                          {comment.levelTitle}
                        </span>
                        <span className={styles.separator}>→</span>
                        <span className={styles.location}>
                          {comment.topicTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment Text */}
                <p className={styles.commentText}>{comment.comment}</p>

                {/* Replies */}
                {comment.replies?.length > 0 && (
                  <div className={styles.repliesSection}>
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className={styles.replyCard}>
                        <div className={styles.replyLabel}>Admin Reply</div>
                        <p className={styles.replyText}>
                          {reply.text || reply.reply}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Box */}
                {replyingTo === comment.commentId && (
                  <div className={styles.replyBox}>
                    <textarea
                      className={styles.replyInput}
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                    />
                    <div className={styles.replyActions}>
                      <button
                        onClick={() => handleReply(comment)}
                        className={styles.btnSend}
                      >
                        <FiSend />
                        Send Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        className={styles.btnCancel}
                      >
                        <FiX />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.commentActions}>
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.commentId
                          ? null
                          : comment.commentId
                      )
                    }
                    className={styles.btnReply}
                  >
                    <FiSend />
                    {replyingTo === comment.commentId ? "Hide Reply" : "Reply"}
                  </button>

                  <button
                    onClick={() => handleDelete(comment)}
                    className={styles.btnDelete}
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <FiMessageSquare className={styles.emptyIcon} />
              <p className={styles.emptyText}>No comments available</p>
              <p className={styles.emptySubtext}>
                Student comments will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentModeration;