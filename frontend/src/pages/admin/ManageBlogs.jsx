import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch, FiBarChart2, FiHeart, FiMessageSquare,
} from 'react-icons/fi';
import { adminFetchBlogs, deleteBlog } from '../../redux/slices/blogSlice';
import Loader from '../../components/common/Loader';
import styles from './styles/ManageBlogs.module.css';

const STATUS_COLORS = {
  published: styles.badgeGreen,
  draft: styles.badgeGray,
};

const ManageBlogs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminBlogs, adminPagination, loading } = useSelector((s) => s.blog);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    dispatch(adminFetchBlogs({ search, status, page }));
  }, [dispatch, search, status, page]);

  const handleDelete = async (id) => {
    await dispatch(deleteBlog(id));
    setConfirmDelete(null);
  };

  if (loading && !adminBlogs.length) return <Loader fullScreen />;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div>
            <h1 className={styles.pageTitle}>Blog Management</h1>
            <p className={styles.pageSubtitle}>
              {adminPagination?.total || 0} total posts
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/admin/blogs/analytics" className={styles.analyticsBtn}>
              <FiBarChart2 /> Analytics
            </Link>
            <Link to="/admin/blogs/new" className={styles.createBtn}>
              <FiPlus /> New Post
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search blogs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={styles.searchInput}
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className={styles.statusSelect}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Post</th>
                <th>Category</th>
                <th>Status</th>
                <th>Stats</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminBlogs.map((blog) => (
                <tr key={blog._id} className={styles.tableRow}>
                  <td className={styles.blogCell}>
                    {blog.featuredImage?.url && (
                      <img
                        src={blog.featuredImage.url}
                        alt={blog.title}
                        className={styles.thumbnail}
                      />
                    )}
                    <div className={styles.blogInfo}>
                      <p className={styles.blogTitle}>{blog.title}</p>
                      <p className={styles.blogAuthor}>
                        by {blog.author?.name}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>{blog.category}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${STATUS_COLORS[blog.status]}`}>
                      {blog.status}
                    </span>
                  </td>
                  
<td>
  <div className={styles.statsGroup}>
    <span className={styles.statCell}><FiEye className={styles.statIcon} /> {blog.views}</span>
    <span className={styles.statCell}><FiHeart className={styles.statIcon} /> {blog.likeCount || blog.likes?.length || 0}</span>
    <span className={styles.statCell}><FiMessageSquare className={styles.statIcon} /> {blog.commentCount || 0}</span>
  </div>
</td>
                  <td className={styles.dateCell}>
                    {blog.publishDate
                      ? new Date(blog.publishDate).toLocaleDateString()
                      : new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {blog.status === 'published' && (
                        <a
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionView}
                        >
                          <FiEye />
                        </a>
                      )}
                      <button
                        onClick={() => navigate(`/admin/blogs/edit/${blog._id}`)}
                        className={styles.actionEdit}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(blog._id)}
                        className={styles.actionDelete}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && adminBlogs.length === 0 && (
            <div className={styles.empty}>
              <p>No blogs found. <Link to="/admin/blogs/new">Create your first post →</Link></p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {adminPagination && adminPagination.pages > 1 && (
          <div className={styles.pagination}>
            {Array.from({ length: adminPagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Blog Post?</h3>
            <p>This will permanently delete the blog and all its comments.</p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirmDelete(null)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className={styles.deleteBtn}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBlogs;