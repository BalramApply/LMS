import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiLayers,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiBook,
} from "react-icons/fi";
import { getAllCoursesAdmin, deleteCourse, togglePublishStatus } from "../../redux/slices/courseSlice";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import styles from './styles/ManageCourses.module.css';

const ManageCourses = () => {
  const dispatch = useDispatch();
  const { courses, isLoading } = useSelector((state) => state.courses);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(getAllCoursesAdmin());
  }, [dispatch]);

  // Stats
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.isPublished).length;

  // Filtering
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(search.toLowerCase()) ||
      course.category?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter
      ? course.category === categoryFilter
      : true;

    const matchesStatus =
      statusFilter === "published"
        ? course.isPublished
        : statusFilter === "draft"
        ? !course.isPublished
        : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(courses.map((c) => c.category))];

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await dispatch(deleteCourse(id)).unwrap();
      toast.success("Course deleted successfully");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await dispatch(togglePublishStatus(id)).unwrap();
      toast.success(
        currentStatus ? "Course Unpublished!" : "Course Published!"
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) return <Loader fullScreen />;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Manage Courses</h1>
          <p className={styles.pageStats}>
            Total: {totalCourses} | Published: {publishedCourses}
          </p>
        </div>
        <Link
          to="/admin/courses/new"
          className={styles.createButton}
        >
          <FiPlus className={styles.createIcon} /> Create Course
        </Link>
      </div>

      {/* Search + Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersContainer}>
          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr className={styles.tableHeadRow}>
                <th className={styles.tableHeader}>Course</th>
                <th className={styles.tableHeader}>Category</th>
                <th className={styles.tableHeader}>Price</th>
                <th className={styles.tableHeader}>Students</th>
                <th className={styles.tableHeader}>Status</th>
                <th className={styles.tableHeader}>Created</th>
                <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>Actions</th>
              </tr>
            </thead>

            <tbody className={styles.tableBody}>
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr key={course._id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <span className={styles.courseName}>{course.title}</span>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.courseCategory}>{course.category}</span>
                    </td>
                    <td className={styles.tableCell}>
                      {course.courseType === "Free" ? (
                        <span className={styles.priceFree}>Free</span>
                      ) : (
                        <span className={styles.pricePaid}>₹{course.price}</span>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.studentCount}>
                        {course.enrolledStudents || 0}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      {course.isPublished ? (
                        <span className={styles.statusPublished}>
                          Published
                        </span>
                      ) : (
                        <span className={styles.statusDraft}>
                          Draft
                        </span>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.dateText}>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className={styles.actionsCell}>
                      <div className={styles.actionsContainer}>
                        {/* Toggle Publish */}
                        <button
                          onClick={() =>
                            handleTogglePublish(
                              course._id,
                              course.isPublished
                            )
                          }
                          title={course.isPublished ? "Unpublish" : "Publish"}
                          className={styles.actionButton}
                        >
                          {course.isPublished ? (
                            <FiXCircle className={styles.iconUnpublish} />
                          ) : (
                            <FiCheckCircle className={styles.iconPublish} />
                          )}
                        </button>

                        {/* View */}
                        <Link
                          to={`/courses/${course._id}`}
                          title="View Course"
                          className={styles.actionLink}
                        >
                          <FiEye className={styles.iconView} />
                        </Link>

                        {/* Manage Content */}
                        <Link
                          to={`/admin/courses/${course._id}/content`}
                          title="Manage Content"
                          className={styles.actionLink}
                        >
                          <FiLayers className={styles.iconManage} />
                        </Link>

                        {/* Edit */}
                        <Link
                          to={`/admin/courses/edit/${course._id}`}
                          title="Edit"
                          className={styles.actionLink}
                        >
                          <FiEdit className={styles.iconEdit} />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(course._id)}
                          title="Delete"
                          className={styles.actionButton}
                        >
                          <FiTrash2 className={styles.iconDelete} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.emptyState}>
                    <FiBook className={styles.emptyStateIcon} />
                    <p className={styles.emptyStateText}>
                      No courses found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageCourses;