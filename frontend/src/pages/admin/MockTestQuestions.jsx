import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiCheck } from 'react-icons/fi';
import { addQuestion, updateQuestion, deleteQuestion } from '../../redux/slices/mockSlice';
import styles from './styles/MockTestQuestions.module.css';

const BLANK_Q = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
};

const MockTestQuestions = ({ test, onBack }) => {
  const dispatch = useDispatch();
  const { adminTests } = useSelector((s) => s.mock);
  // Get latest version of this test from store
  const currentTest = adminTests.find((t) => t._id === test._id) || test;

  const [showForm, setShowForm] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [formData, setFormData] = useState(BLANK_Q);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const openAdd = () => {
    setEditingQ(null);
    setFormData(BLANK_Q);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (q) => {
    setEditingQ(q);
    setFormData({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
    });
    setImagePreview(q.image?.url || null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleOptionChange = (idx, val) => {
    const opts = [...formData.options];
    opts[idx] = val;
    setFormData({ ...formData, options: opts });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({ ...formData, options: [...formData.options, ''] });
    }
  };

  const removeOption = (idx) => {
    if (formData.options.length <= 2) return;
    const opts = formData.options.filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      options: opts,
      correctAnswer: formData.correctAnswer === formData.options[idx] ? '' : formData.correctAnswer,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('question', formData.question);
    fd.append('correctAnswer', formData.correctAnswer);
    fd.append('explanation', formData.explanation);
    formData.options.forEach((opt) => fd.append('options[]', opt));
    if (imageFile) fd.append('questionImage', imageFile);

    if (editingQ) {
      await dispatch(updateQuestion({ testId: currentTest._id, questionId: editingQ._id, formData: fd }));
    } else {
      await dispatch(addQuestion({ testId: currentTest._id, formData: fd }));
    }
    setShowForm(false);
  };

  const handleDelete = async (questionId) => {
    await dispatch(deleteQuestion({ testId: currentTest._id, questionId }));
    setDeleteConfirm(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <FiArrowLeft /> Back to Tests
        </button>
        <div>
          <h1 className={styles.title}>{currentTest.title}</h1>
          <p className={styles.subtitle}>
            {currentTest.questions?.length || 0} questions · {currentTest.markPerQuestion} mark/q ·
            Total: {(currentTest.questions?.length || 0) * currentTest.markPerQuestion} marks
            {currentTest.negativeMarking && ` · Negative: -${currentTest.negativeMarkValue}`}
          </p>
        </div>
        <button onClick={openAdd} className={styles.addBtn}>
          <FiPlus /> Add Question
        </button>
      </div>

      {/* Questions List */}
      <div className={styles.questionsList}>
        {currentTest.questions?.length === 0 ? (
          <div className={styles.empty}>
            <p>No questions yet. Add your first question!</p>
          </div>
        ) : (
          currentTest.questions?.map((q, idx) => (
            <motion.div
              key={q._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.questionCard}
            >
              <div className={styles.qHeader}>
                <span className={styles.qNumber}>Q{idx + 1}</span>
                <div className={styles.qActions}>
                  <button onClick={() => openEdit(q)} className={styles.iconBtn}>
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(q._id)}
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {q.image?.url && (
                <img src={q.image.url} alt="Question" className={styles.qImage} />
              )}

              <p className={styles.qText}>{q.question}</p>

              <div className={styles.optionsList}>
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`${styles.option} ${opt === q.correctAnswer ? styles.optionCorrect : ''}`}
                  >
                    <span className={styles.optionLabel}>{String.fromCharCode(65 + oi)}</span>
                    <span>{opt}</span>
                    {opt === q.correctAnswer && <FiCheck className={styles.checkIcon} />}
                  </div>
                ))}
              </div>

              {q.explanation && (
                <p className={styles.explanation}>
                  <strong>Explanation:</strong> {q.explanation}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={styles.modal}
            >
              <div className={styles.modalHeader}>
                <h2>{editingQ ? 'Edit Question' : 'Add Question'}</h2>
                <button onClick={() => setShowForm(false)} className={styles.closeBtn}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Question Text *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter question..."
                    className={styles.textarea}
                  />
                </div>

                {/* Image Upload */}
                <div className={styles.formGroup}>
                  <label>Question Image (optional)</label>
                  <label className={styles.imageUpload}>
                    <FiImage /> {imagePreview ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={handleImageChange}
                    />
                  </label>
                  {imagePreview && (
                    <div className={styles.imagePreviewWrap}>
                      <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className={styles.removeImageBtn}
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className={styles.formGroup}>
                  <label>Options *</label>
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className={styles.optionInput}>
                      <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                      <input
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className={styles.removeOptBtn}
                        disabled={formData.options.length <= 2}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  {formData.options.length < 6 && (
                    <button type="button" onClick={addOption} className={styles.addOptBtn}>
                      <FiPlus /> Add Option
                    </button>
                  )}
                </div>

                {/* Correct Answer */}
                <div className={styles.formGroup}>
                  <label>Correct Answer *</label>
                  <select
                    required
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Select correct answer</option>
                    {formData.options.filter(Boolean).map((opt, idx) => (
                      <option key={idx} value={opt}>{String.fromCharCode(65 + idx)}: {opt}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Explanation (optional)</label>
                  <textarea
                    rows={2}
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Explain the correct answer..."
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    <FiCheck /> {editingQ ? 'Update Question' : 'Add Question'}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={styles.overlay}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className={styles.confirmModal}
            >
              <h3>Delete this question?</h3>
              <p>This action cannot be undone.</p>
              <div className={styles.confirmActions}>
                <button onClick={() => setDeleteConfirm(null)} className={styles.cancelBtn}>Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className={styles.deleteBtn}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockTestQuestions;