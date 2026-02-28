import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiHeart,
  FiShare2,
  FiLink,
  FiClock,
  FiEye,
  FiMessageSquare,
  FiArrowLeft,
  FiUsers,
} from "react-icons/fi";
import {
  fetchBlogBySlug,
  toggleLike,
  fetchComments,
  addComment,
  editComment,
  deleteComment,
  clearCurrentBlog,
  setActiveViewers,
} from "../../../redux/slices/blogSlice";
import styles from "./styles/BlogDetail.module.css";
import toast from "react-hot-toast";

// ─── Comment Component (recursive for replies) ────────────────────────────────
const CommentItem = ({ comment, depth = 0, blogId, currentUser, dispatch }) => {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);

  const isOwner = currentUser && comment.user?._id === currentUser._id;
  const isAdmin = currentUser?.role === "admin";

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await dispatch(
      addComment({ blogId, content: replyText, parentId: comment._id }),
    );
    setReplyText("");
    setReplying(false);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await dispatch(editComment({ commentId: comment._id, content: editText }));
    setEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this comment?")) {
      dispatch(deleteComment({ commentId: comment._id, blogId }));
    }
  };

  return (
    <div
      className={`${styles.commentItem} ${depth > 0 ? styles.commentReply : ""}`}
    >
      <div className={styles.commentHeader}>
        {comment.user?.avatar?.url ? (
          <img
            src={comment.user.avatar.url}
            alt={comment.user.name}
            className={styles.commentAvatar}
          />
        ) : (
          <div className={styles.commentAvatarFallback}>
            {comment.user?.name?.[0] || "?"}
          </div>
        )}
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.user?.name}</span>
          <span className={styles.commentDate}>
            {new Date(comment.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {(isOwner || isAdmin) && !editing && (
          <div className={styles.commentActions}>
            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className={styles.commentActionBtn}
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className={`${styles.commentActionBtn} ${styles.deleteBtn}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className={styles.editArea}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className={styles.commentTextarea}
            rows={3}
          />
          <div className={styles.editActions}>
            <button
              onClick={() => setEditing(false)}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button onClick={handleEdit} className={styles.submitBtn}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.commentContent}>{comment.content}</p>
      )}

      {currentUser && depth === 0 && (
        <button
          onClick={() => setReplying(!replying)}
          className={styles.replyBtn}
        >
          ↩ Reply
        </button>
      )}

      {replying && (
        <div className={styles.replyArea}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className={styles.commentTextarea}
            rows={3}
            autoFocus
          />
          <div className={styles.replyActions}>
            <button
              onClick={() => setReplying(false)}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button onClick={handleReply} className={styles.submitBtn}>
              Reply
            </button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              blogId={blogId}
              currentUser={currentUser}
              dispatch={dispatch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── BlogDetail Page ──────────────────────────────────────────────────────────
const BlogDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    currentBlog,
    relatedBlogs,
    comments,
    commentLoading,
    loading,
    activeViewers,
  } = useSelector((s) => s.blog);
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const [newComment, setNewComment] = useState("");
  const [copied, setCopied] = useState(false);
  const sseRef = useRef(null);

  useEffect(() => {
    dispatch(fetchBlogBySlug(slug));
    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [slug, dispatch]);

  const blogId = currentBlog?._id;

  useEffect(() => {
    if (!blogId) return;

    dispatch(fetchComments(blogId));

    sseRef.current = new EventSource(
      `${process.env.REACT_APP_API_URL}/blogs/${blogId}/viewers`,
    );

    sseRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      dispatch(setActiveViewers(data.activeViewers));
    };

    return () => {
      sseRef.current?.close();
    };
  }, [blogId, dispatch]);

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }
    dispatch(toggleLike(currentBlog._id));
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }
    if (!newComment.trim()) return;
    await dispatch(
      addComment({ blogId: currentBlog._id, content: newComment }),
    );
    setNewComment("");
  };

  if (loading || !currentBlog) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingPulse} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back */}
      <div className={styles.backWrapper}>
        <button onClick={() => navigate("/blog")} className={styles.backBtn}>
          <FiArrowLeft /> Back to Blog
        </button>
      </div>

      <div className={styles.layout}>
        {/* Main Article */}
        <article className={styles.article}>
          {/* Featured Image */}
          {currentBlog.featuredImage?.url && (
            <div className={styles.heroImageWrapper}>
              <img
                src={currentBlog.featuredImage.url}
                alt={currentBlog.title}
                className={styles.heroImage}
              />
            </div>
          )}

          {/* Article Header */}
          <div className={styles.articleHeader}>
            <div className={styles.articleMeta}>
              <span className={styles.category}>{currentBlog.category}</span>
              <span className={styles.metaDot}>·</span>
              <span className={styles.readTime}>
                <FiClock size={13} /> {currentBlog.readTime} min read
              </span>
            </div>

            <h1 className={styles.articleTitle}>{currentBlog.title}</h1>
            <p className={styles.articleDesc}>{currentBlog.shortDescription}</p>

            {/* Author & Stats Row */}
            <div className={styles.authorRow}>
              <div className={styles.authorInfo}>
                {currentBlog.author?.avatar?.url ? (
                  <img
                    src={currentBlog.author.avatar.url}
                    alt={currentBlog.author.name}
                    className={styles.authorAvatar}
                  />
                ) : (
                  <div className={styles.authorAvatarFallback}>
                    {currentBlog.author?.name?.[0]}
                  </div>
                )}
                <div>
                  <p className={styles.authorName}>
                    {currentBlog.author?.name}
                  </p>
                  <p className={styles.publishDate}>
                    {new Date(
                      currentBlog.publishDate || currentBlog.createdAt,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className={styles.statsRow}>
                <span className={styles.stat}>
                  <FiEye size={14} /> {currentBlog.views}
                </span>
                <button
                  onClick={handleLike}
                  className={`${styles.likeBtn} ${currentBlog.isLiked ? styles.liked : ""}`}
                >
                  <FiHeart
                    size={14}
                    className={currentBlog.isLiked ? styles.heartFilled : ""}
                  />
                  {currentBlog.likeCount || 0}
                </button>
                <span className={styles.stat}>
                  <FiMessageSquare size={14} /> {currentBlog.commentCount || 0}
                </span>
                {/* 🔴 Live Viewers */}
                <span className={styles.liveViewers}>
                  <span className={styles.blink} />
                  <FiUsers size={13} />
                  {activeViewers} viewing
                </span>
              </div>
            </div>

            {/* Tags */}
            {currentBlog.tags?.length > 0 && (
              <div className={styles.tags}>
                {currentBlog.tags.map((t) => (
                  <Link key={t} to={`/blog?tag=${t}`} className={styles.tag}>
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Rich Text Content */}
          <div
            className={styles.articleContent}
            dangerouslySetInnerHTML={{ __html: currentBlog.content }}
          />

          {/* Share */}
          <div className={styles.shareBar}>
            <span className={styles.shareLabel}>Share this post:</span>
            <button onClick={handleShare} className={styles.shareBtn}>
              {copied ? (
                <>
                  <FiLink size={14} /> Copied!
                </>
              ) : (
                <>
                  <FiShare2 size={14} /> Copy Link
                </>
              )}
            </button>
          </div>

          {/* Comments */}
          <section className={styles.commentsSection}>
            <h2 className={styles.commentsTitle}>
              <FiMessageSquare /> {currentBlog.commentCount || 0} Comments
            </h2>

            {/* Add comment */}
            <div className={styles.addComment}>
              {isAuthenticated ? (
                <>
                  <div className={styles.commentAvatarFallback}>
                    {user?.name?.[0]}
                  </div>
                  <div className={styles.commentInputWrapper}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className={styles.commentTextarea}
                      rows={3}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className={styles.submitBtn}
                    >
                      Post Comment
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.loginPrompt}>
                  <Link to="/login">Login</Link> to join the conversation.
                </p>
              )}
            </div>

            {/* Comment List */}
            {commentLoading ? (
              <p className={styles.loadingText}>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className={styles.noComments}>
                No comments yet. Be the first!
              </p>
            ) : (
              <div className={styles.commentList}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    blogId={currentBlog._id}
                    currentUser={user}
                    dispatch={dispatch}
                  />
                ))}
              </div>
            )}
          </section>
        </article>

        {/* Sidebar: Related Posts */}
        {relatedBlogs.length > 0 && (
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Related Posts</h3>
            <div className={styles.relatedList}>
              {relatedBlogs.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className={styles.relatedCard}
                >
                  {post.featuredImage?.url && (
                    <img
                      src={post.featuredImage.url}
                      alt={post.title}
                      className={styles.relatedImage}
                    />
                  )}
                  <div className={styles.relatedInfo}>
                    <h4 className={styles.relatedTitle}>{post.title}</h4>
                    <span className={styles.relatedMeta}>
                      <FiClock size={11} /> {post.readTime} min ·{" "}
                      <FiEye size={11} /> {post.views}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default BlogDetail;
