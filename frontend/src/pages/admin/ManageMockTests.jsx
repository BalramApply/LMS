import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff,
  FiUsers, FiBarChart2, FiX, FiCheck, FiAlertCircle,
} from 'react-icons/fi';
import {
  fetchAllMockTestsAdmin,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  togglePublishTest,
} from '../../redux/slices/mockSlice';
import MockTestQuestions from './MockTestQuestions';
import MockTestAttemptsList from './MockTestAttemptsList';
import styles from './styles/ManageMockTests.module.css';

const INITIAL_FORM = {
  title: '',
  description: '',
  duration: 30,
  markPerQuestion: 1,
  negativeMarking: false,
  negativeMarkValue: 0,
  accessType: 'Free',
  price: 0,
  isPublished: false,
};

const ManageMockTests = () => {
  const dispatch = useDispatch();
  const { adminTests, isLoading } = useSelector((s) => s.mock);

  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('list'); // list | questions | attempts
  const [selectedTest, setSelectedTest] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    dispatch(fetchAllMockTestsAdmin());
  }, [dispatch]);

  const handleOpenCreate = () => {
    setEditingTest(null);
    setFormData(INITIAL_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      description: test.description,
      duration: test.duration,
      markPerQuestion: test.markPerQuestion,
      negativeMarking: test.negativeMarking,
      negativeMarkValue: test.negativeMarkValue,
      accessType: test.accessType,
      price: test.price,
      isPublished: test.isPublished,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingTest) {
      await dispatch(updateMockTest({ id: editingTest._id, testData: formData }));
    } else {
      await dispatch(createMockTest(formData));
    }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await dispatch(deleteMockTest(id));
    setDeleteConfirm(null);
  };

  const handleTogglePublish = (id) => dispatch(togglePublishTest(id));

  const handleManageQuestions = (test) => {
    setSelectedTest(test);
    setActiveTab('questions');
  };

  const handleViewAttempts = (test) => {
    setSelectedTest(test);
    setActiveTab('attempts');
  };

  if (activeTab === 'questions' && selectedTest) {
    return (
      <MockTestQuestions
        test={selectedTest}
        onBack={() => { setActiveTab('list'); setSelectedTest(null); }}
      />
    );
  }

  if (activeTab === 'attempts' && selectedTest) {
    return (
      <MockTestAttemptsList
        test={selectedTest}
        onBack={() => { setActiveTab('list'); setSelectedTest(null); }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mock Tests</h1>
          <p className={styles.subtitle}>Create and manage practice tests for students</p>
        </div>
        <button onClick={handleOpenCreate} className={styles.createBtn}>
          <FiPlus /> Create Test
        </button>
      </div>

      {/* Tests Grid */}
      {isLoading ? (
        <div className={styles.loadingGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : (
        <div className={styles.testsGrid}>
          {adminTests.length === 0 ? (
            <div className={styles.empty}>
              <FiBarChart2 className={styles.emptyIcon} />
              <p>No mock tests yet. Create your first one!</p>
            </div>
          ) : (
            adminTests.map((test) => (
              <motion.div
                key={test._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.testCard}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.badge} ${test.accessType === 'Paid' ? styles.badgePaid : styles.badgeFree}`}>
                      {test.accessType}
                    </span>
                    <span className={`${styles.badge} ${test.isPublished ? styles.badgePublished : styles.badgeDraft}`}>
                      {test.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => handleTogglePublish(test._id)}
                      title={test.isPublished ? 'Unpublish' : 'Publish'}
                      className={styles.iconBtn}
                    >
                      {test.isPublished ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button onClick={() => handleOpenEdit(test)} className={styles.iconBtn}>
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(test._id)}
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <h3 className={styles.testTitle}>{test.title}</h3>
                <p className={styles.testDesc}>{test.description}</p>

                <div className={styles.statsRow}>
                  <span>⏱ {test.duration} min</span>
                  <span>❓ {test.questions?.length || 0} questions</span>
                  <span>⭐ {test.markPerQuestion} mark/q</span>
                  {test.negativeMarking && <span>➖ -{test.negativeMarkValue}</span>}
                </div>

                <div className={styles.cardFooter}>
                  <button
                    onClick={() => handleManageQuestions(test)}
                    className={styles.footerBtn}
                  >
                    <FiEdit2 /> Manage Questions
                  </button>
                  <button
                    onClick={() => handleViewAttempts(test)}
                    className={`${styles.footerBtn} ${styles.footerBtnSecondary}`}
                  >
                    <FiUsers /> View Attempts ({test.totalAttempts || 0})
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={styles.modal}
            >
              <div className={styles.modalHeader}>
                <h2>{editingTest ? 'Edit Test' : 'Create Mock Test'}</h2>
                <button onClick={() => setShowForm(false)} className={styles.closeBtn}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Test Title *</label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. JavaScript Fundamentals Test"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this test covers"
                    rows={3}
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label>Duration (minutes) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Marks per Question *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.markPerQuestion}
                      onChange={(e) => setFormData({ ...formData, markPerQuestion: Number(e.target.value) })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Access Type</label>
                    <select
                      value={formData.accessType}
                      onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                      className={styles.select}
                    >
                      <option value="Free">Free</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>

                {formData.accessType === 'Paid' && (
                  <div className={styles.formGroup}>
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.negativeSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.negativeMarking}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          negativeMarking: e.target.checked,
                          negativeMarkValue: e.target.checked ? 0.25 : 0,
                        })
                      }
                    />
                    Enable Negative Marking
                  </label>

                  {formData.negativeMarking && (
                    <div className={styles.formGroup}>
                      <label>Marks Deducted per Wrong Answer *</label>
                      <input
                        type="number"
                        min={0.25}
                        step={0.25}
                        required
                        value={formData.negativeMarkValue}
                        onChange={(e) =>
                          setFormData({ ...formData, negativeMarkValue: Number(e.target.value) })
                        }
                        className={styles.input}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    <FiCheck /> {editingTest ? 'Update Test' : 'Create Test'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={styles.confirmModal}
            >
              <FiAlertCircle className={styles.alertIcon} />
              <h3>Delete Mock Test?</h3>
              <p>This will permanently delete the test and all student attempts. This action cannot be undone.</p>
              <div className={styles.confirmActions}>
                <button onClick={() => setDeleteConfirm(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageMockTests;