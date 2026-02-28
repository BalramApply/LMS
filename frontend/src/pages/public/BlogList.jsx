import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiSearch, FiClock, FiEye, FiHeart, FiMessageSquare, FiTag, FiX } from 'react-icons/fi';
import { fetchBlogs, fetchCategories, fetchTags, toggleLike } from '../../redux/slices/blogSlice';
import styles from './styles/BlogList.module.css';

const BlogCard = ({ blog, onLike, isAuthenticated }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={styles.card}
  >
    <Link to={`/blog/${blog.slug}`} className={styles.cardImageLink}>
      {blog.featuredImage?.url ? (
        <img src={blog.featuredImage.url} alt={blog.title} className={styles.cardImage} />
      ) : (
        <div className={styles.cardImagePlaceholder}>
          <span>{blog.category}</span>
        </div>
      )}
    </Link>

    <div className={styles.cardBody}>
      <div className={styles.cardMeta}>
        <span className={styles.category}>{blog.category}</span>
        <span className={styles.readTime}>
          <FiClock size={12} /> {blog.readTime} min read
        </span>
      </div>

      <Link to={`/blog/${blog.slug}`}>
        <h2 className={styles.cardTitle}>{blog.title}</h2>
      </Link>

      <p className={styles.cardDesc}>{blog.shortDescription}</p>

      <div className={styles.cardFooter}>
        <div className={styles.authorInfo}>
          {blog.author?.avatar?.url ? (
            <img src={blog.author.avatar.url} alt={blog.author.name} className={styles.authorAvatar} />
          ) : (
            <div className={styles.authorAvatarFallback}>
              {blog.author?.name?.[0] || 'A'}
            </div>
          )}
          <span className={styles.authorName}>{blog.author?.name}</span>
        </div>

        <div className={styles.stats}>
  <span className={styles.stat}>
    <FiEye size={13} /> {blog.views}
  </span>
  <button
    onClick={() => isAuthenticated && onLike(blog._id)}
    className={`${styles.likeBtn} ${blog.isLiked ? styles.liked : ''}`}
    title={isAuthenticated ? 'Like' : 'Login to like'}
  >
    <FiHeart size={13} className={blog.isLiked ? styles.heartFilled : ''} />
    {blog.likeCount || 0}
  </button>
  <span className={styles.stat}>
    <FiMessageSquare size={13} /> {blog.commentCount || 0}
  </span>
</div>
      </div>
    </div>
  </motion.article>
);

const BlogList = () => {
  const dispatch = useDispatch();
  const { blogs, pagination, categories, tags, loading } = useSelector((s) => s.blog);
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);

  const loadBlogs = useCallback(() => {
    dispatch(fetchBlogs({ search, category, tag, sort, page }));
  }, [dispatch, search, category, tag, sort, page]);

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTags());
  }, [dispatch]);

  const handleLike = (blogId) => {
    dispatch(toggleLike(blogId));
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setTag('');
    setSort('latest');
    setPage(1);
  };

  const hasFilters = search || category || tag || sort !== 'latest';

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.heroTitle}
        >
          Our Blog
        </motion.h1>
        <p className={styles.heroSubtitle}>
          Insights, tutorials, and updates from our team.
        </p>
      </div>

      <div className={styles.content}>
        {/* Search & Filters */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={styles.searchInput}
            />
          </div>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className={styles.select}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className={styles.select}
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className={styles.clearBtn}>
              <FiX /> Clear
            </button>
          )}
        </div>

        {/* Tag Cloud */}
        {tags.length > 0 && (
          <div className={styles.tagCloud}>
            <FiTag className={styles.tagIcon} />
            {tags.slice(0, 15).map((t) => (
              <button
                key={t}
                onClick={() => { setTag(tag === t ? '' : t); setPage(1); }}
                className={`${styles.tagPill} ${tag === t ? styles.tagPillActive : ''}`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading && !blogs.length ? (
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className={styles.empty}>
            <p>No posts found.</p>
            {hasFilters && <button onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {blogs.map((blog) => (
              <BlogCard
                key={blog._id}
                blog={blog}
                onLike={handleLike}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={styles.pageNav}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className={styles.pageNav}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;