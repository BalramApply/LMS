import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiVideo,
  FiFileText,
  FiHelpCircle,
  FiTarget,
  FiUpload,
} from 'react-icons/fi';
import api from '../../api/client';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import TiptapEditor from '../../components/common/TiptapEditor';
import styles from './styles/CourseContent.module.css';

const CourseContent = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState({});
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showLevelForm, setShowLevelForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form states matching backend structure
  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    levelTitle: '',
    levelDescription: '',
    majorTask: {
      title: '',
      requirements: [],
    },
  });

  const [topicForm, setTopicForm] = useState({
    topicNumber: '',
    topicTitle: '',
    videoFile: null,
    readingMaterial: {
      title: '',
      content: '',
    },
    quiz: [],
    miniTask: {
      title: '',
      description: '',
      requirements: [],
    },
  });

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
      
      // Auto-expand first level
      if (response.data.data.levels?.length > 0) {
        setExpandedLevels({ [response.data.data.levels[0]._id]: true });
      }
    } catch (error) {
      toast.error('Failed to load course');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (levelId) => {
    setExpandedLevels(prev => ({
      ...prev,
      [levelId]: !prev[levelId],
    }));
  };

  const handleAddLevel = () => {
    const nextLevelNumber = course.levels?.length ? Math.max(...course.levels.map(l => l.levelNumber)) + 1 : 1;
    setLevelForm({
      levelNumber: nextLevelNumber,
      levelTitle: '',
      levelDescription: '',
      majorTask: {
        title: '',
        requirements: [],
      },
    });
    setEditingLevel(null);
    setShowLevelForm(true);
  };

  const handleEditLevel = (level) => {
    setLevelForm({
      levelNumber: level.levelNumber,
      levelTitle: level.levelTitle,
      levelDescription: level.levelDescription || '',
      majorTask: {
        title: level.majorTask?.title || '',
        requirements: level.majorTask?.requirements || [],
      },
    });
    setEditingLevel(level._id);
    setShowLevelForm(true);
  };

  const handleSaveLevel = async () => {
    if (!levelForm.levelTitle.trim()) {
      toast.error('Level title is required');
      return;
    }

    try {
      if (editingLevel) {
        await api.put(`/courses/${courseId}/levels/${editingLevel}`, levelForm);
        toast.success('Level updated!');
      } else {
        await api.post(`/courses/${courseId}/levels`, levelForm);
        toast.success('Level added!');
      }
      
      await loadCourse();
      setShowLevelForm(false);
      setLevelForm({
        levelNumber: 1,
        levelTitle: '',
        levelDescription: '',
        majorTask: {
          title: '',
          requirements: [],
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save level');
    }
  };

  const handleDeleteLevel = async (levelId) => {
    if (!window.confirm('Delete this level and all its topics?')) return;

    try {
      await api.delete(`/courses/${courseId}/levels/${levelId}`);
      toast.success('Level deleted!');
      await loadCourse();
    } catch (error) {
      toast.error('Failed to delete level');
    }
  };

  const handleAddTopic = (levelId) => {
    const level = course.levels.find(l => l._id === levelId);
    const nextTopicNumber = level?.topics?.length ? `${level.levelNumber}.${level.topics.length + 1}` : `${level.levelNumber}.1`;
    
    setTopicForm({
      topicNumber: nextTopicNumber,
      topicTitle: '',
      videoFile: null,
      readingMaterial: {
        title: '',
        content: '',
      },
      quiz: [],
      miniTask: {
        title: '',
        description: '',
        requirements: [],
      },
    });
    setSelectedLevelId(levelId);
    setEditingTopic(null);
    setShowTopicForm(true);
  };

  const handleEditTopic = (levelId, topic) => {
    setTopicForm({
      topicNumber: topic.topicNumber,
      topicTitle: topic.topicTitle,
      videoFile: null,
      existingVideo: topic.video,
      readingMaterial: {
        title: topic.readingMaterial?.title || '',
        content: topic.readingMaterial?.content || '',
      },
      quiz: topic.quiz || [],
      miniTask: topic.miniTask || {
        title: '',
        description: '',
        requirements: [],
      },
    });
    setSelectedLevelId(levelId);
    setEditingTopic(topic._id);
    setShowTopicForm(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.topicTitle.trim()) {
      toast.error('Topic title is required');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('topicNumber', topicForm.topicNumber);
      formData.append('topicTitle', topicForm.topicTitle);
      
      if (topicForm.quiz.length > 0) {
        formData.append('quiz', JSON.stringify(topicForm.quiz));
      }
      
      formData.append('miniTask', JSON.stringify(topicForm.miniTask));
      
      // Add reading material as JSON
      if (topicForm.readingMaterial.title || topicForm.readingMaterial.content) {
        formData.append('readingMaterial', JSON.stringify(topicForm.readingMaterial));
      }
      
      if (topicForm.videoFile) {
        formData.append('video', topicForm.videoFile);
      }

      if (editingTopic) {
        await api.put(`/topics/${courseId}/levels/${selectedLevelId}/topics/${editingTopic}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Topic updated!');
      } else {
        await api.post(`/topics/${courseId}/levels/${selectedLevelId}/topics`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Topic added!');
      }
      
      await loadCourse();
      setShowTopicForm(false);
      setTopicForm({
        topicNumber: '',
        topicTitle: '',
        videoFile: null,
        readingMaterial: {
          title: '',
          content: '',
        },
        quiz: [],
        miniTask: {
          title: '',
          description: '',
          requirements: [],
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save topic');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTopic = async (levelId, topicId) => {
    if (!window.confirm('Delete this topic?')) return;

    try {
      await api.delete(`/topics/${courseId}/levels/${levelId}/topics/${topicId}`);
      toast.success('Topic deleted!');
      await loadCourse();
    } catch (error) {
      toast.error('Failed to delete topic');
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file must be less than 100MB');
        return;
      }
      setTopicForm(prev => ({ ...prev, videoFile: file }));
      toast.success('Video selected');
    }
  };

  const addQuizQuestion = () => {
    setTopicForm(prev => ({
      ...prev,
      quiz: [
        ...prev.quiz,
        {
          question: '',
          questionType: 'MCQ',
          options: ['', ''],
          correctAnswer: '',
        },
      ],
    }));
  };

  const updateQuizQuestion = (index, field, value) => {
    setTopicForm(prev => ({
      ...prev,
      quiz: prev.quiz.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const updateQuizOption = (qIndex, oIndex, value) => {
    setTopicForm(prev => ({
      ...prev,
      quiz: prev.quiz.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((opt, j) => (j === oIndex ? value : opt)) }
          : q
      ),
    }));
  };

  const addQuizOption = (qIndex) => {
    setTopicForm(prev => ({
      ...prev,
      quiz: prev.quiz.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, ''] } : q
      ),
    }));
  };

  const removeQuizOption = (qIndex, oIndex) => {
    setTopicForm(prev => ({
      ...prev,
      quiz: prev.quiz.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q
      ),
    }));
  };

  const removeQuizQuestion = (index) => {
    setTopicForm(prev => ({
      ...prev,
      quiz: prev.quiz.filter((_, i) => i !== index),
    }));
  };

  if (loading) return <Loader fullScreen />;
  if (!course) return <div className={styles.emptyState}>Course not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Course Content</h1>
            <p>{course.title}</p>
          </div>
          <button onClick={() => navigate('/admin/courses')} className={`${styles.btn} ${styles.btnOutline}`}>
            <FiX className={styles.iconCyan} />
            Close
          </button>
        </div>

        {/* Add Level Button */}
        <div className={styles.mb6}>
          <button onClick={handleAddLevel} className={`${styles.btn} ${styles.btnPrimary}`}>
            <FiPlus />
            Add Level
          </button>
        </div>

        {/* Levels List */}
        <div className={`${styles.flex} ${styles.flexCol} ${styles.gap4}`}>
          {course.levels?.map((level) => (
            <div key={level._id} className={styles.card}>
              {/* Level Header */}
              <div className={styles.levelHeader}>
                <div className={styles.levelInfo}>
                  <button
                    onClick={() => toggleLevel(level._id)}
                    className={styles.toggleBtn}
                  >
                    {expandedLevels[level._id] ? (
                      <FiChevronDown className={styles.iconCyan} />
                    ) : (
                      <FiChevronRight className={styles.iconCyan} />
                    )}
                  </button>
                  <div>
                    <h3 className={styles.levelTitle}>
                      Level {level.levelNumber}: {level.levelTitle}
                    </h3>
                    <p className={styles.levelSubtitle}>
                      {level.topics?.length || 0} topics
                      {level.levelDescription && ` • ${level.levelDescription}`}
                    </p>
                  </div>
                </div>

                <div className={styles.levelActions}>
                  <button
                    onClick={() => handleAddTopic(level._id)}
                    className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}
                  >
                    <FiPlus className={styles.iconCyan} />
                    Add Topic
                  </button>
                  <button
                    onClick={() => handleEditLevel(level)}
                    className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}
                  >
                    <FiEdit className={styles.iconCyan} />
                  </button>
                  <button
                    onClick={() => handleDeleteLevel(level._id)}
                    className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                  >
                    <FiTrash2 className={styles.iconRed} />
                  </button>
                </div>
              </div>

              {/* Topics List */}
              <AnimatePresence>
                {expandedLevels[level._id] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className={`${styles.flex} ${styles.flexCol} ${styles.gap2}`} style={{ padding: '1rem' }}>
                      {level.topics?.map((topic) => (
                        <div key={topic._id} className={styles.topicItem}>
                          <div className={styles.topicContent}>
                            <div className={styles.topicInfo}>
                              <h4 className={styles.topicTitle}>
                                {topic.topicNumber}. {topic.topicTitle}
                              </h4>
                              <div className={styles.topicMeta}>
                                {topic.video && (
                                  <span className={styles.metaItem}>
                                    <FiVideo className={styles.iconCyan} />
                                    Video ({topic.video.duration}s)
                                  </span>
                                )}
                                {topic.readingMaterial?.content && (
                                  <span className={styles.metaItem}>
                                    <FiFileText className={styles.iconMagenta} />
                                    Reading Material
                                  </span>
                                )}
                                {topic.quiz?.length > 0 && (
                                  <span className={styles.metaItem}>
                                    <FiHelpCircle className={styles.iconGreen} />
                                    {topic.quiz.length} Questions
                                  </span>
                                )}
                                {topic.miniTask?.title && (
                                  <span className={styles.metaItem}>
                                    <FiTarget className={styles.iconMagenta} />
                                    Task
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className={styles.topicActions}>
                              <button
                                onClick={() => handleEditTopic(level._id, topic)}
                                className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}
                              >
                                <FiEdit className={styles.iconCyan} />
                              </button>
                              <button
                                onClick={() => handleDeleteTopic(level._id, topic._id)}
                                className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                              >
                                <FiTrash2 className={styles.iconRed} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!level.topics || level.topics.length === 0) && (
                        <p className={styles.emptyState}>
                          No topics yet. Click "Add Topic" to get started.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {(!course.levels || course.levels.length === 0) && (
            <div className={styles.card}>
              <p className={styles.emptyState}>No levels yet. Add a level to get started.</p>
            </div>
          )}
        </div>

        {/* Level Form Modal */}
        {showLevelForm && (
          <div className={styles.modal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.modalContent}
            >
              <h3 className={styles.modalTitle}>
                {editingLevel ? 'Edit Level' : 'Add Level'}
              </h3>

              <div className={`${styles.flex} ${styles.flexCol} ${styles.gap4}`}>
                <div>
                  <label className={styles.label}>Level Number *</label>
                  <input
                    type="number"
                    value={levelForm.levelNumber}
                    onChange={(e) => setLevelForm({ ...levelForm, levelNumber: parseInt(e.target.value) })}
                    className={styles.input}
                    min="1"
                  />
                </div>

                <div>
                  <label className={styles.label}>Level Title *</label>
                  <input
                    type="text"
                    value={levelForm.levelTitle}
                    onChange={(e) => setLevelForm({ ...levelForm, levelTitle: e.target.value })}
                    className={styles.input}
                    placeholder="e.g., JavaScript Basics"
                  />
                </div>

                <div>
                  <label className={styles.label}>Level Description</label>
                  <textarea
                    value={levelForm.levelDescription}
                    onChange={(e) => setLevelForm({ ...levelForm, levelDescription: e.target.value })}
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="Optional level description"
                  />
                </div>

                <div>
                  <label className={styles.label}>Major Task Title</label>
                  <input
                    type="text"
                    value={levelForm.majorTask.title}
                    onChange={(e) => setLevelForm({
                      ...levelForm,
                      majorTask: { ...levelForm.majorTask, title: e.target.value }
                    })}
                    className={styles.input}
                    placeholder="e.g., Build Calculator App"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button onClick={handleSaveLevel} className={`${styles.btn} ${styles.btnPrimary} ${styles.flex1}`}>
                  <FiSave />
                  Save
                </button>
                <button
                  onClick={() => setShowLevelForm(false)}
                  className={`${styles.btn} ${styles.btnOutline} ${styles.flex1}`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Topic Form Modal */}
        {showTopicForm && (
          <div className={styles.modal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.modalContent}
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h3 className={styles.modalTitle}>
                {editingTopic ? 'Edit Topic' : 'Add Topic'}
              </h3>

              <div className={styles.modalBody}>
                {/* Basic Info */}
                <div className={`${styles.grid2} ${styles.mb6}`}>
                  <div>
                    <label className={styles.label}>Topic Number *</label>
                    <input
                      type="text"
                      value={topicForm.topicNumber}
                      onChange={(e) => setTopicForm({ ...topicForm, topicNumber: e.target.value })}
                      className={styles.input}
                      placeholder="e.g., 1.1"
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Topic Title *</label>
                    <input
                      type="text"
                      value={topicForm.topicTitle}
                      onChange={(e) => setTopicForm({ ...topicForm, topicTitle: e.target.value })}
                      className={styles.input}
                      placeholder="e.g., Variables"
                    />
                  </div>
                </div>

                {/* Video Upload */}
                <div className={styles.fileUpload}>
                  <label className={styles.label}>Video Lesson</label>
                  {topicForm.existingVideo && !topicForm.videoFile && (
                    <div className={styles.fileInfo}>
                      <FiVideo className={styles.iconGreen} />
                      <span className={styles.fileText}>
                        Current video ({topicForm.existingVideo.duration}s)
                      </span>
                      <button
                        onClick={() => setTopicForm({ ...topicForm, existingVideo: null })}
                        className={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {topicForm.videoFile && (
                    <div className={styles.fileInfo}>
                      <FiVideo className={styles.iconGreen} />
                      <span className={styles.fileText}>{topicForm.videoFile.name}</span>
                      <button
                        onClick={() => setTopicForm({ ...topicForm, videoFile: null })}
                        className={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <label className={`${styles.btn} ${styles.btnOutline}`} style={{ cursor: 'pointer' }}>
                    <FiUpload className={styles.iconCyan} />
                    {topicForm.videoFile || topicForm.existingVideo ? 'Change Video' : 'Upload Video'}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Reading Material - Rich Text Editor */}
                <div className={styles.formSection}>
                  <label className={styles.label}>Reading Material</label>
                  <input
                    type="text"
                    value={topicForm.readingMaterial.title}
                    onChange={(e) =>
                      setTopicForm({
                        ...topicForm,
                        readingMaterial: { ...topicForm.readingMaterial, title: e.target.value },
                      })
                    }
                    className={styles.input}
                    placeholder="Reading Material Title"
                    style={{ marginBottom: '1rem' }}
                  />
                  <TiptapEditor
                    content={topicForm.readingMaterial.content}
                    onChange={(content) =>
                      setTopicForm({
                        ...topicForm,
                        readingMaterial: { ...topicForm.readingMaterial, content },
                      })
                    }
                  />
                </div>

                {/* Quiz Builder */}
                <div className={styles.formSection} style={{ marginTop: '2rem' }}>
                  <div className={styles.quizHeader}>
                    <label className={styles.label}>Quiz Questions</label>
                    <button onClick={addQuizQuestion} className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}>
                      <FiPlus className={styles.iconCyan} />
                      Add Question
                    </button>
                  </div>

                  {topicForm.quiz.map((question, qIndex) => (
                    <div key={qIndex} className={styles.quizQuestion}>
                      <div className={styles.questionHeader}>
                        <h4 className={styles.questionTitle}>Question {qIndex + 1}</h4>
                        <button
                          onClick={() => removeQuizQuestion(qIndex)}
                          className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                        >
                          <FiTrash2 className={styles.iconRed} />
                        </button>
                      </div>

                      <div className={styles.questionBody}>
                        <select
                          value={question.questionType}
                          onChange={(e) => updateQuizQuestion(qIndex, 'questionType', e.target.value)}
                          className={styles.select}
                        >
                          <option value="MCQ">Multiple Choice</option>
                          <option value="True/False">True/False</option>
                        </select>

                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                          className={styles.input}
                          placeholder="Question text"
                        />

                        <div>
                          <label className={`${styles.label} ${styles.mb2}`}>Options:</label>
                          <div className={styles.optionsList}>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className={styles.optionItem}>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                                  className={`${styles.input} ${styles.optionInput}`}
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                                {question.options.length > 2 && (
                                  <button
                                    onClick={() => removeQuizOption(qIndex, oIndex)}
                                    className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                                  >
                                    <FiX className={styles.iconRed} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => addQuizOption(qIndex)}
                            className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                          >
                            <FiPlus className={styles.iconCyan} />
                            Add Option
                          </button>
                        </div>

                        <input
                          type="text"
                          value={question.correctAnswer}
                          onChange={(e) => updateQuizQuestion(qIndex, 'correctAnswer', e.target.value)}
                          className={styles.input}
                          placeholder="Correct answer (must match one option exactly)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini Task */}
                <div className={styles.formSection}>
                  <label className={styles.label}>Mini Task</label>
                  <div className={`${styles.flex} ${styles.flexCol} ${styles.gap3}`}>
                    <input
                      type="text"
                      value={topicForm.miniTask.title}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          miniTask: { ...topicForm.miniTask, title: e.target.value },
                        })
                      }
                      className={styles.input}
                      placeholder="Task title"
                    />
                    <textarea
                      value={topicForm.miniTask.description}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          miniTask: { ...topicForm.miniTask, description: e.target.value },
                        })
                      }
                      className={`${styles.input} ${styles.textarea}`}
                      placeholder="Task description"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={handleSaveTopic}
                  disabled={uploading}
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.flex1}`}
                >
                  <FiSave />
                  {uploading ? 'Uploading...' : 'Save Topic'}
                </button>
                <button
                  onClick={() => setShowTopicForm(false)}
                  disabled={uploading}
                  className={`${styles.btn} ${styles.btnOutline} ${styles.flex1}`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;