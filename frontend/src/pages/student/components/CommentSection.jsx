import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare,
  FiSend,
  FiShield,
  FiTrash2,
  FiCornerDownRight,
} from 'react-icons/fi';
import { getInitials, getAvatarColor, formatRelativeTime } from '../../../utils/formatters';
import { replyToComment, deleteComment } from '../../../redux/slices/courseSlice';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import styles from './styles/CommentSection.module.css';

const CommentSection = ({
  comments: initialComments,
  courseId,
  levelId,
  topicId,
  currentUser,
}) => {
  const dispatch = useDispatch();
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getId = (comment) => comment._id || comment.commentId || comment.id;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    setPosting(true);
    try {
      // FIX 1: Backend reads req.body.comment — must send `comment`, not `text`.
      // Previously { text: newComment } caused backend to save comment: undefined,
      // which is why comments were blank after a page refresh.
      const response = await api.post(
        `/topics/${courseId}/levels/${levelId}/topics/${topicId}/comments`,
        { comment: newComment }
      );

      // FIX 2: Backend returns the full course document (data: course), NOT just
      // the new comment. Navigate into it to find the last comment on this topic.
      const course = response.data.data;
      const lvl = course?.levels?.find((l) => l._id === levelId);
      const tpc = lvl?.topics?.find((t) => t._id === topicId);
      const savedComment = tpc?.comments?.[tpc.comments.length - 1];

      // Optimistic fallback — if we can't locate the saved doc in the response
      // (e.g. _id mismatch), build a local entry so the UI never goes blank.
      const newEntry = savedComment ?? {
        _id: Date.now().toString(),
        comment: newComment,
        student: { name: currentUser?.name, avatar: currentUser?.avatar },
        createdAt: new Date().toISOString(),
        replies: [],
      };

      setComments([newEntry, ...comments]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await dispatch(
        replyToComment({ courseId, levelId, topicId, commentId, reply: replyText })
      ).unwrap();
      toast.success('Reply posted!');
      setReplyingTo(null);
      setReplyText('');
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    dispatch(deleteComment({ courseId, levelId, topicId, commentId }));
    setComments((prev) => prev.filter((c) => getId(c) !== commentId));
    toast.success('Comment deleted');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>

      {/* Scanlines overlay */}
      <div className={styles.scanlines} aria-hidden="true" />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconWrap}>
            <FiMessageSquare className={styles.headerIcon} />
          </div>
          <div>
            <h3 className={styles.headerTitle}>DISCUSSION.LOG</h3>
            <p className={styles.headerSubtitle}>
              {comments.length} {comments.length === 1 ? 'ENTRY' : 'ENTRIES'}&nbsp;/&nbsp;OPEN_CHANNEL
            </p>
          </div>
        </div>
        <div className={styles.headerDecor} aria-hidden="true">
          <span className={styles.glitchBar} />
          <span className={styles.glitchBar} />
          <span className={styles.glitchBar} />
        </div>
      </div>

      {/* Compose Form */}
      <div className={styles.composeCard}>
        <div className={styles.composeInner}>
          {currentUser?.avatar?.url ? (
            <img
              src={currentUser.avatar.url}
              alt={currentUser.name}
              className={styles.commentAvatar}
            />
          ) : (
            <div
              className={styles.avatarFallback}
              style={{ background: getAvatarColor(currentUser?.name) }}
            >
              <span className={styles.avatarText}>{getInitials(currentUser?.name)}</span>
            </div>
          )}

          <div className={styles.composeContent}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="> INPUT_MESSAGE: share thoughts or ask a question..."
              className={styles.textarea}
              rows={3}
            />
            <div className={styles.composeFooter}>
              <span className={styles.charCount}>{newComment.length} CHARS</span>
              <button
                onClick={handlePostComment}
                disabled={posting || !newComment.trim()}
                className={styles.postButton}
              >
                {posting ? (
                  <><span className={styles.spinner} />POSTING...</>
                ) : (
                  <><FiSend className={styles.postIcon} />POST</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className={styles.commentsList}>
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.emptyState}
            >
              <FiMessageSquare className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>// NO_ENTRIES_FOUND</p>
              <p className={styles.emptySubtitle}>Be the first to open the channel.</p>
            </motion.div>
          ) : (
            comments.map((comment, index) => {
              const commentId = getId(comment);

              return (
                <motion.div
                  key={commentId}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 130 }}
                  className={styles.commentCard}
                >
                  <div className={styles.commentStrip} />

                  <div className={styles.commentInner}>

                    {/* Avatar */}
                    {comment.student?.avatar?.url ? (
                      <img
                        src={comment.student.avatar.url}
                        alt={comment.student?.name}
                        className={styles.commentAvatar}
                      />
                    ) : (
                      <div
                        className={styles.avatarFallback}
                        style={{ background: getAvatarColor(comment.student?.name) }}
                      >
                        <span className={styles.avatarText}>
                          {getInitials(comment.student?.name)}
                        </span>
                      </div>
                    )}

                    {/* Body */}
                    <div className={styles.commentBody}>

                      {/* Meta */}
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>
                          {comment.student?.name || 'Anonymous'}
                        </span>
                        <span className={styles.commentDivider}>//</span>
                        <span className={styles.commentTime}>
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>

                      {/* comment.comment — matches backend schema field name + CourseDetails.jsx */}
                      <p className={styles.commentText}>{comment.comment}</p>

                      {/* Replies */}
                      {comment.replies?.length > 0 && (
                        <div className={styles.repliesList}>
                          {comment.replies.map((reply) => (
                            <div key={reply._id || reply.id} className={styles.replyItem}>
                              <div className={styles.replyHeader}>
                                <FiShield className={styles.replyShieldIcon} />
                                <span className={styles.replyLabel}>
                                  {reply.admin?.name
                                    ? `${reply.admin.name.toUpperCase()}_REPLY`
                                    : 'INSTRUCTOR_REPLY'}
                                </span>
                                {reply.repliedAt && (
                                  <span className={styles.replyTime}>
                                    {formatRelativeTime(reply.repliedAt)}
                                  </span>
                                )}
                              </div>
                              <div className={styles.replyBody}>
                                <FiCornerDownRight className={styles.replyArrow} />
                                <p className={styles.replyText}>{reply.reply}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className={styles.commentActions}>
                          <button
                            className={styles.replyBtn}
                            onClick={() =>
                              setReplyingTo(replyingTo === commentId ? null : commentId)
                            }
                          >
                            <FiShield className={styles.actionIcon} />
                            {replyingTo === commentId ? 'CANCEL' : 'REPLY'}
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(commentId)}
                          >
                            <FiTrash2 className={styles.actionIcon} />
                            DELETE
                          </button>
                        </div>
                      )}

                      {/* Inline reply compose */}
                      <AnimatePresence>
                        {replyingTo === commentId && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={styles.replyCompose}
                          >
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="> ADMIN_REPLY: type response..."
                              className={styles.replyTextarea}
                              rows={2}
                            />
                            <div className={styles.replyComposeFooter}>
                              <button
                                onClick={() => handleReply(commentId)}
                                disabled={submittingReply || !replyText.trim()}
                                className={styles.replySubmitBtn}
                              >
                                {submittingReply ? (
                                  <><span className={styles.spinner} />SENDING...</>
                                ) : (
                                  <><FiSend className={styles.postIcon} />SEND_REPLY</>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {comments.length > 0 && comments.length % 10 === 0 && (
        <div className={styles.loadMoreWrapper}>
          <button className={styles.loadMoreButton}>LOAD_MORE ++</button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;