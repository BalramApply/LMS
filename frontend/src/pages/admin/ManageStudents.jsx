import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiTrash2, FiEye, FiSearch, FiX } from 'react-icons/fi';
import api from '../../api/client';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import styles from './styles/ManageStudents.module.css';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data.data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  let filtered = [...students];

  if (search) {
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter((s) =>
      statusFilter === 'active' ? s.isActive : !s.isActive
    );
  }

  setFilteredStudents(filtered);
}, [students, search, statusFilter]);

  const handleToggleStatus = async (studentId) => {
    try {
      await api.patch(`/admin/students/${studentId}/toggle-status`);
      toast.success('Student status updated');
      fetchStudents();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/admin/students/${studentId}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const handleViewDetails = async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}`);
      setSelectedStudent(response.data.data.student);
    } catch {
      toast.error('Failed to load student details');
    }
  };

  if (isLoading) return <Loader fullScreen />;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.title}>Manage Students</h1>
          <p className={styles.subtitle}>Search, filter, view and manage students</p>
        </motion.div>

        {/* Search + Filter */}
        <div className={styles.filterSection}>
          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Students Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.th}>Student</th>
                  <th className={styles.th}>Courses</th>
                  <th className={styles.th}>Joined</th>
                  <th className={styles.th}>Status</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filteredStudents.map((student) => (
                  <tr key={student._id} className={styles.tableRow}>
                    <td className={styles.td}>
                      <div className={styles.studentInfo}>
                        {student.avatar?.url ? (
                          <img 
                            src={student.avatar.url} 
                            alt="avatar" 
                            className={styles.avatar} 
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            <FiUser className={styles.avatarIcon} />
                          </div>
                        )}
                        <div>
                          <div className={styles.studentName}>{student.name}</div>
                          <div className={styles.studentEmail}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.coursesCount}>
                        {student.enrolledCourses?.length || 0} courses
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.dateText}>
                        {formatDate(student.createdAt, 'PP')}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={student.isActive ? styles.badgeActive : styles.badgeInactive}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdActions}`}>
                      <button 
                        onClick={() => handleViewDetails(student._id)} 
                        className={styles.btnView}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(student._id)} 
                        className={styles.btnToggle}
                      >
                        {student.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student._id)} 
                        className={styles.btnDelete}
                        title="Delete Student"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className={styles.emptyState}>
                <FiUser className={styles.emptyIcon} />
                <p className={styles.emptyText}>No students found</p>
              </div>
            )}
          </div>
        </div>

        {/* Student Details Modal */}
        {selectedStudent && (
          <div
    className={styles.modalOverlay}
    onClick={() => setSelectedStudent(null)}   // 👈 Close when clicking overlay
  >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}     // 👈 Prevent close when clicking inside modal
            >
              <button 
                className={styles.modalClose} 
                onClick={() => setSelectedStudent(null)}
                aria-label="Close modal"
              >
                <FiX />
              </button>

              <div className={styles.modalHeader}>
                {selectedStudent.avatar?.url && (
                  <img 
                    src={selectedStudent.avatar.url} 
                    alt="avatar" 
                    className={styles.modalAvatar} 
                  />
                )}
                <h2 className={styles.modalTitle}>{selectedStudent.name}</h2>
                <p className={styles.modalEmail}>{selectedStudent.email}</p>
              </div>

              <div className={styles.modalInfo}>
                <p>
                  <strong>Status:</strong> 
                  <span className={selectedStudent.isActive ? styles.statusActive : styles.statusInactive}>
                    {selectedStudent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <p>
                  <strong>Joined:</strong> {formatDate(selectedStudent.createdAt, 'PPpp')}
                </p>
                <p>
                  <strong>Total Courses:</strong> {selectedStudent.enrolledCourses?.length || 0}
                </p>
              </div>

              {/* Courses Details */}
              {selectedStudent.enrolledCourses?.length > 0 && (
                <div className={styles.coursesList}>
                  <h3 className={styles.coursesTitle}>Enrolled Courses</h3>
                  <div className={styles.coursesScroll}>
                    {selectedStudent.enrolledCourses.map((enrollment) => (
                      <div key={enrollment._id} className={styles.courseCard}>
                        <div className={styles.courseHeader}>
                          {enrollment.course.thumbnail?.url && (
                            <img 
                              src={enrollment.course.thumbnail.url} 
                              alt="course" 
                              className={styles.courseThumbnail} 
                            />
                          )}
                          <div>
                            <p className={styles.courseTitle}>{enrollment.course.title}</p>
                            <p className={styles.courseMeta}>
                              {enrollment.course.category} | {enrollment.course.level}
                            </p>
                          </div>
                        </div>
                        <div className={styles.courseDetails}>
                          <p>Enrolled At: {formatDate(enrollment.enrolledAt, 'PP')}</p>
                          <p>Progress: <span className={styles.progressText}>{enrollment.progress}%</span></p>
                          <p>
                            Certificate: 
                            <span className={enrollment.certificateIssued ? styles.certIssued : styles.certNotIssued}>
                              {enrollment.certificateIssued ? ' Issued' : ' Not Issued'}
                            </span>
                          </p>
                          {enrollment.taskSubmissions?.length > 0 && (
                            <p>Tasks Submitted: {enrollment.taskSubmissions.length}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManageStudents;