import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiEye, FiHeart, FiMessageSquare, FiBook, FiTrendingUp,
  FiArrowLeft, FiFileText, FiCheckCircle,
} from 'react-icons/fi';
import { fetchBlogAnalytics } from '../../redux/slices/blogSlice';
import Loader from '../../components/common/Loader';
import styles from './styles/BlogAnalytics.module.css';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={styles.statCard}
  >
    <div className={`${styles.statIcon} ${color}`}>
      <Icon className={styles.statIconSvg} />
    </div>
    <div className={styles.statInfo}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value?.toLocaleString() ?? 0}</p>
    </div>
  </motion.div>
);

const BlogAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, loading } = useSelector((s) => s.blog);

  useEffect(() => {
    dispatch(fetchBlogAnalytics());
  }, [dispatch]);

  if (loading && !analytics) return <Loader fullScreen />;
  if (!analytics) return null;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <Link to="/admin/blogs" className={styles.backBtn}>
            <FiArrowLeft /> Blog Manager
          </Link>
          <h1 className={styles.pageTitle}>Blog Analytics</h1>
        </motion.div>

        {/* Summary Stats */}
        <div className={styles.statsGrid}>
          <StatCard icon={FiBook} label="Total Blogs" value={analytics.totalBlogs} color={styles.purple} delay={0.1} />
          <StatCard icon={FiCheckCircle} label="Published" value={analytics.published} color={styles.green} delay={0.2} />
          <StatCard icon={FiFileText} label="Drafts" value={analytics.drafts} color={styles.gray} delay={0.3} />
          <StatCard icon={FiEye} label="Total Views" value={analytics.totalViews} color={styles.blue} delay={0.4} />
          <StatCard icon={FiHeart} label="Total Likes" value={analytics.totalLikes} color={styles.red} delay={0.5} />
          <StatCard icon={FiMessageSquare} label="Total Comments" value={analytics.totalComments} color={styles.orange} delay={0.6} />
        </div>

        <div className={styles.tablesGrid}>
          {/* Most Viewed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className={styles.tableCard}
          >
            <div className={styles.tableHeader}>
              <FiTrendingUp className={styles.tableHeaderIcon} />
              <h2 className={styles.tableTitle}>Most Viewed</h2>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th><FiEye /></th>
                  <th><FiHeart /></th>
                  <th><FiMessageSquare /></th>
                </tr>
              </thead>
              <tbody>
                {analytics.topViewed.map((blog, i) => (
                  <tr key={blog._id}>
                    <td className={styles.rankCell}>
                      <span className={`${styles.rank} ${i < 3 ? styles[`rank${i + 1}`] : ''}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <Link to={`/blog/${blog.slug}`} className={styles.blogLink}>
                        {blog.title}
                      </Link>
                    </td>
                    <td className={styles.numCell}>{blog.views?.toLocaleString()}</td>
                    <td className={styles.numCell}>{blog.likes?.length || 0}</td>
                    <td className={styles.numCell}>{blog.commentCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Most Liked */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className={styles.tableCard}
          >
            <div className={styles.tableHeader}>
              <FiHeart className={styles.tableHeaderIcon} />
              <h2 className={styles.tableTitle}>Most Liked</h2>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th><FiHeart /></th>
                  <th><FiEye /></th>
                </tr>
              </thead>
              <tbody>
                {analytics.topLiked.map((blog, i) => (
                  <tr key={blog._id}>
                    <td className={styles.rankCell}>
                      <span className={`${styles.rank} ${i < 3 ? styles[`rank${i + 1}`] : ''}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <Link to={`/blog/${blog.slug}`} className={styles.blogLink}>
                        {blog.title}
                      </Link>
                    </td>
                    <td className={styles.numCell}>{blog.likeCount}</td>
                    <td className={styles.numCell}>{blog.views?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BlogAnalytics;