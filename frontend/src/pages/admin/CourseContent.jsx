import React, { useEffect, useState, useCallback } from 'react';
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
  FiLink,
  FiImage,
} from 'react-icons/fi';
import api from '../../api/client';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import TiptapEditor from '../../components/common/TiptapEditor';
import styles from './styles/CourseContent.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isYoutubeUrl = (url) =>
  url && /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);

function extractYoutubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

// ─── Default form values ──────────────────────────────────────────────────────
const defaultQuizQuestion = () => ({
  question: '',
  questionType: 'MCQ',
  options: ['', ''],
  correctAnswer: '',
  explanation: '',
  // imageFile  → File object (new upload, not yet on server)
  // imageUrl   → string (already on Cloudinary / existing)
  imageFile: null,
  imageUrl: '',
});

const defaultTopicForm = {
  topicNumber: '',
  topicTitle: '',
  videoSourceType: 'upload',
  videoFile: null,
  youtubeUrl: '',
  existingVideo: null,
  readingMaterial: { title: '', content: '' },
  quiz: [],
  miniTask: { title: '', description: '', requirements: [] },
};

// ─── Component ────────────────────────────────────────────────────────────────
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

  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    levelTitle: '',
    levelDescription: '',
    majorTask: { title: '', requirements: [] },
  });

  const [topicForm, setTopicForm] = useState(defaultTopicForm);

  // ─── Load course ─────────────────────────────────────────────────────────────
  const loadCourse = useCallback(async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
      if (response.data.data.levels?.length > 0) {
        setExpandedLevels({ [response.data.data.levels[0]._id]: true });
      }
    } catch {
      toast.error('Failed to load course');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  // ─── Level handlers ───────────────────────────────────────────────────────────
  const toggleLevel = (id) =>
    setExpandedLevels((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAddLevel = () => {
    const next = course.levels?.length
      ? Math.max(...course.levels.map((l) => l.levelNumber)) + 1
      : 1;
    setLevelForm({ levelNumber: next, levelTitle: '', levelDescription: '', majorTask: { title: '', requirements: [] } });
    setEditingLevel(null);
    setShowLevelForm(true);
  };

  const handleEditLevel = (level) => {
    setLevelForm({
      levelNumber: level.levelNumber,
      levelTitle: level.levelTitle,
      levelDescription: level.levelDescription || '',
      majorTask: { title: level.majorTask?.title || '', requirements: level.majorTask?.requirements || [] },
    });
    setEditingLevel(level._id);
    setShowLevelForm(true);
  };

  const handleSaveLevel = async () => {
    if (!levelForm.levelTitle.trim()) { toast.error('Level title is required'); return; }
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
    } catch { toast.error('Failed to delete level'); }
  };

  // ─── Topic handlers ───────────────────────────────────────────────────────────
  const handleAddTopic = (levelId) => {
    const level = course.levels.find((l) => l._id === levelId);
    const next = level?.topics?.length
      ? `${level.levelNumber}.${level.topics.length + 1}`
      : `${level.levelNumber}.1`;
    setTopicForm({ ...defaultTopicForm, topicNumber: next });
    setSelectedLevelId(levelId);
    setEditingTopic(null);
    setShowTopicForm(true);
  };

  const handleEditTopic = (levelId, topic) => {
    const existingIsYoutube = isYoutubeUrl(topic.video?.url);
    setTopicForm({
      topicNumber: topic.topicNumber,
      topicTitle: topic.topicTitle,
      videoSourceType: existingIsYoutube ? 'youtube' : 'upload',
      videoFile: null,
      youtubeUrl: existingIsYoutube ? topic.video.url : '',
      existingVideo: !existingIsYoutube ? topic.video : null,
      readingMaterial: {
        title: topic.readingMaterial?.title || '',
        content: topic.readingMaterial?.content || '',
      },
      // Restore quiz — preserve existing imageUrl, clear any stale imageFile
      quiz: (topic.quiz || []).map((q) => ({
        ...defaultQuizQuestion(),
        question: q.question,
        questionType: q.questionType || 'MCQ',
        options: q.options || ['', ''],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        imageUrl: q.image?.url || '',   // existing Cloudinary URL
        imageFile: null,
      })),
      miniTask: topic.miniTask || { title: '', description: '', requirements: [] },
    });
    setSelectedLevelId(levelId);
    setEditingTopic(topic._id);
    setShowTopicForm(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.topicTitle.trim()) { toast.error('Topic title is required'); return; }
    if (topicForm.videoSourceType === 'youtube' && topicForm.youtubeUrl && !isYoutubeUrl(topicForm.youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL'); return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('topicNumber', topicForm.topicNumber);
      formData.append('topicTitle', topicForm.topicTitle);
      formData.append('miniTask', JSON.stringify(topicForm.miniTask));

      if (topicForm.readingMaterial.title || topicForm.readingMaterial.content) {
        formData.append('readingMaterial', JSON.stringify(topicForm.readingMaterial));
      }

      // Video
      if (topicForm.videoSourceType === 'youtube' && topicForm.youtubeUrl) {
        formData.append('youtubeUrl', topicForm.youtubeUrl);
      } else if (topicForm.videoSourceType === 'upload' && topicForm.videoFile) {
        formData.append('video', topicForm.videoFile);
      }

      // Quiz — send question data as JSON; images as separate fields quizImage_0, quizImage_1 …
      if (topicForm.quiz.length > 0) {
        // Strip File objects before serialising — backend will stitch images back in
        const quizPayload = topicForm.quiz.map((q) => ({
          question: q.question,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          // Tell backend to keep the existing image if no new file is uploaded
          existingImageUrl: q.imageUrl || '',
        }));
        formData.append('quiz', JSON.stringify(quizPayload));

        // Attach new image files with indexed field names
        topicForm.quiz.forEach((q, i) => {
          if (q.imageFile) {
            formData.append(`quizImage_${i}`, q.imageFile);
          }
        });
      }

      const url = editingTopic
        ? `/topics/${courseId}/levels/${selectedLevelId}/topics/${editingTopic}`
        : `/topics/${courseId}/levels/${selectedLevelId}/topics`;

      await api[editingTopic ? 'put' : 'post'](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(editingTopic ? 'Topic updated!' : 'Topic added!');
      await loadCourse();
      setShowTopicForm(false);
      setTopicForm(defaultTopicForm);
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
    } catch { toast.error('Failed to delete topic'); }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error('Video file must be less than 100MB'); return; }
    setTopicForm((prev) => ({ ...prev, videoFile: file }));
    toast.success('Video selected');
  };

  // ─── Quiz helpers ─────────────────────────────────────────────────────────────
  const addQuizQuestion = () =>
    setTopicForm((prev) => ({ ...prev, quiz: [...prev.quiz, defaultQuizQuestion()] }));

  const updateQuiz = (index, patch) =>
    setTopicForm((prev) => ({
      ...prev,
      quiz: prev.quiz.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));

  const updateQuizOption = (qIndex, oIndex, value) =>
    setTopicForm((prev) => ({
      ...prev,
      quiz: prev.quiz.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((opt, j) => (j === oIndex ? value : opt)) } : q
      ),
    }));

  const addQuizOption = (qIndex) =>
    setTopicForm((prev) => ({
      ...prev,
      quiz: prev.quiz.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, ''] } : q)),
    }));

  const removeQuizOption = (qIndex, oIndex) =>
    setTopicForm((prev) => ({
      ...prev,
      quiz: prev.quiz.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q
      ),
    }));

  const removeQuizQuestion = (index) =>
    setTopicForm((prev) => ({ ...prev, quiz: prev.quiz.filter((_, i) => i !== index) }));

  const handleQuizImageChange = (qIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }

    // Create a local preview URL so the admin can see it immediately
    const previewUrl = URL.createObjectURL(file);
    updateQuiz(qIndex, { imageFile: file, imagePreview: previewUrl });
  };

  const removeQuizImage = (qIndex) =>
    updateQuiz(qIndex, { imageFile: null, imagePreview: '', imageUrl: '' });

  // ─── Render ───────────────────────────────────────────────────────────────────
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
            <FiX className={styles.iconCyan} /> Close
          </button>
        </div>

        {/* Add Level */}
        <div className={styles.mb6}>
          <button onClick={handleAddLevel} className={`${styles.btn} ${styles.btnPrimary}`}>
            <FiPlus /> Add Level
          </button>
        </div>

        {/* Levels */}
        <div className={`${styles.flex} ${styles.flexCol} ${styles.gap4}`}>
          {course.levels?.map((level) => (
            <div key={level._id} className={styles.card}>
              <div className={styles.levelHeader}>
                <div className={styles.levelInfo}>
                  <button onClick={() => toggleLevel(level._id)} className={styles.toggleBtn}>
                    {expandedLevels[level._id]
                      ? <FiChevronDown className={styles.iconCyan} />
                      : <FiChevronRight className={styles.iconCyan} />}
                  </button>
                  <div>
                    <h3 className={styles.levelTitle}>Level {level.levelNumber}: {level.levelTitle}</h3>
                    <p className={styles.levelSubtitle}>
                      {level.topics?.length || 0} topics
                      {level.levelDescription && ` • ${level.levelDescription}`}
                    </p>
                  </div>
                </div>
                <div className={styles.levelActions}>
                  <button onClick={() => handleAddTopic(level._id)} className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}>
                    <FiPlus className={styles.iconCyan} /> Add Topic
                  </button>
                  <button onClick={() => handleEditLevel(level)} className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}>
                    <FiEdit className={styles.iconCyan} />
                  </button>
                  <button onClick={() => handleDeleteLevel(level._id)} className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}>
                    <FiTrash2 className={styles.iconRed} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedLevels[level._id] && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                    <div className={`${styles.flex} ${styles.flexCol} ${styles.gap2}`} style={{ padding: '1rem' }}>
                      {level.topics?.map((topic) => (
                        <div key={topic._id} className={styles.topicItem}>
                          <div className={styles.topicContent}>
                            <div className={styles.topicInfo}>
                              <h4 className={styles.topicTitle}>{topic.topicNumber}. {topic.topicTitle}</h4>
                              <div className={styles.topicMeta}>
                                {topic.video && (
                                  <span className={styles.metaItem}>
                                    {isYoutubeUrl(topic.video.url)
                                      ? <><FiLink className={styles.iconCyan} /> YouTube</>
                                      : <><FiVideo className={styles.iconCyan} /> Video ({topic.video.duration}s)</>}
                                  </span>
                                )}
                                {topic.readingMaterial?.content && (
                                  <span className={styles.metaItem}><FiFileText className={styles.iconMagenta} /> Reading Material</span>
                                )}
                                {topic.quiz?.length > 0 && (
                                  <span className={styles.metaItem}><FiHelpCircle className={styles.iconGreen} /> {topic.quiz.length} Questions</span>
                                )}
                                {topic.miniTask?.title && (
                                  <span className={styles.metaItem}><FiTarget className={styles.iconMagenta} /> Task</span>
                                )}
                              </div>
                            </div>
                            <div className={styles.topicActions}>
                              <button onClick={() => handleEditTopic(level._id, topic)} className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}>
                                <FiEdit className={styles.iconCyan} />
                              </button>
                              <button onClick={() => handleDeleteTopic(level._id, topic._id)} className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}>
                                <FiTrash2 className={styles.iconRed} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!level.topics || level.topics.length === 0) && (
                        <p className={styles.emptyState}>No topics yet. Click "Add Topic" to get started.</p>
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

        {/* ── Level Modal ──────────────────────────────────────────────────────── */}
        {showLevelForm && (
          <div className={styles.modal}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.modalContent}>
              <h3 className={styles.modalTitle}>{editingLevel ? 'Edit Level' : 'Add Level'}</h3>
              <div className={`${styles.flex} ${styles.flexCol} ${styles.gap4}`}>
                <div>
                  <label className={styles.label}>Level Number *</label>
                  <input type="number" value={levelForm.levelNumber}
                    onChange={(e) => setLevelForm({ ...levelForm, levelNumber: parseInt(e.target.value) })}
                    className={styles.input} min="1" />
                </div>
                <div>
                  <label className={styles.label}>Level Title *</label>
                  <input type="text" value={levelForm.levelTitle}
                    onChange={(e) => setLevelForm({ ...levelForm, levelTitle: e.target.value })}
                    className={styles.input} placeholder="e.g., JavaScript Basics" />
                </div>
                <div>
                  <label className={styles.label}>Level Description</label>
                  <textarea value={levelForm.levelDescription}
                    onChange={(e) => setLevelForm({ ...levelForm, levelDescription: e.target.value })}
                    className={`${styles.input} ${styles.textarea}`} placeholder="Optional level description" />
                </div>
                <div>
                  <label className={styles.label}>Major Task Title</label>
                  <input type="text" value={levelForm.majorTask.title}
                    onChange={(e) => setLevelForm({ ...levelForm, majorTask: { ...levelForm.majorTask, title: e.target.value } })}
                    className={styles.input} placeholder="e.g., Build Calculator App" />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button onClick={handleSaveLevel} className={`${styles.btn} ${styles.btnPrimary} ${styles.flex1}`}><FiSave /> Save</button>
                <button onClick={() => setShowLevelForm(false)} className={`${styles.btn} ${styles.btnOutline} ${styles.flex1}`}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Topic Modal ──────────────────────────────────────────────────────── */}
        {showTopicForm && (
          <div className={styles.modal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.modalContent}
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h3 className={styles.modalTitle}>{editingTopic ? 'Edit Topic' : 'Add Topic'}</h3>

              <div className={styles.modalBody}>

                {/* Basic info */}
                <div className={`${styles.grid2} ${styles.mb6}`}>
                  <div>
                    <label className={styles.label}>Topic Number *</label>
                    <input type="text" value={topicForm.topicNumber}
                      onChange={(e) => setTopicForm({ ...topicForm, topicNumber: e.target.value })}
                      className={styles.input} placeholder="e.g., 1.1" />
                  </div>
                  <div>
                    <label className={styles.label}>Topic Title *</label>
                    <input type="text" value={topicForm.topicTitle}
                      onChange={(e) => setTopicForm({ ...topicForm, topicTitle: e.target.value })}
                      className={styles.input} placeholder="e.g., Variables" />
                  </div>
                </div>

                {/* Video */}
                <div className={styles.formSection}>
                  <label className={styles.label}>Video Lesson</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                    {['upload', 'youtube'].map((type) => (
                      <button key={type} type="button"
                        onClick={() => setTopicForm((prev) => ({
                          ...prev,
                          videoSourceType: type,
                          videoFile: type === 'upload' ? prev.videoFile : null,
                          youtubeUrl: type === 'youtube' ? prev.youtubeUrl : '',
                        }))}
                        style={{
                          flex: 1, padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          fontWeight: 500, fontSize: '0.85rem', transition: 'all 0.2s',
                          background: topicForm.videoSourceType === type ? 'var(--color-cyan, #00f0ff)' : 'transparent',
                          color: topicForm.videoSourceType === type ? '#000' : 'var(--color-text, #ccc)',
                        }}>
                        {type === 'upload' ? <><FiUpload size={14} /> Upload File</> : <><FiLink size={14} /> YouTube Link</>}
                      </button>
                    ))}
                  </div>

                  {topicForm.videoSourceType === 'upload' && (
                    <div className={styles.fileUpload}>
                      {topicForm.existingVideo && !topicForm.videoFile && (
                        <div className={styles.fileInfo}>
                          <FiVideo className={styles.iconGreen} />
                          <span className={styles.fileText}>Current video ({topicForm.existingVideo.duration}s)</span>
                          <button type="button" onClick={() => setTopicForm((p) => ({ ...p, existingVideo: null }))} className={styles.removeBtn}>Remove</button>
                        </div>
                      )}
                      {topicForm.videoFile && (
                        <div className={styles.fileInfo}>
                          <FiVideo className={styles.iconGreen} />
                          <span className={styles.fileText}>{topicForm.videoFile.name}</span>
                          <button type="button" onClick={() => setTopicForm((p) => ({ ...p, videoFile: null }))} className={styles.removeBtn}>Remove</button>
                        </div>
                      )}
                      <label className={`${styles.btn} ${styles.btnOutline}`} style={{ cursor: 'pointer' }}>
                        <FiUpload className={styles.iconCyan} />
                        {topicForm.videoFile || topicForm.existingVideo ? 'Change Video' : 'Upload Video'}
                        <input type="file" accept="video/*" onChange={handleVideoChange} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}

                  {topicForm.videoSourceType === 'youtube' && (
                    <div>
                      <input type="url" value={topicForm.youtubeUrl}
                        onChange={(e) => setTopicForm((p) => ({ ...p, youtubeUrl: e.target.value }))}
                        className={styles.input} placeholder="https://www.youtube.com/watch?v=..." />
                      {isYoutubeUrl(topicForm.youtubeUrl) && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <img
                            src={`https://img.youtube.com/vi/${extractYoutubeId(topicForm.youtubeUrl)}/mqdefault.jpg`}
                            alt="YouTube preview"
                            style={{ width: '100%', maxWidth: '320px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-success, #4ade80)', marginTop: '0.4rem' }}>✓ Valid YouTube link detected</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reading Material */}
                <div className={styles.formSection}>
                  <label className={styles.label}>Reading Material</label>
                  <input type="text" value={topicForm.readingMaterial.title}
                    onChange={(e) => setTopicForm({ ...topicForm, readingMaterial: { ...topicForm.readingMaterial, title: e.target.value } })}
                    className={styles.input} placeholder="Reading Material Title" style={{ marginBottom: '1rem' }} />
                  <TiptapEditor
                    content={topicForm.readingMaterial.content}
                    onChange={(content) => setTopicForm({ ...topicForm, readingMaterial: { ...topicForm.readingMaterial, content } })}
                  />
                </div>

                {/* ── Quiz Builder ─────────────────────────────────────────────── */}
                <div className={styles.formSection} style={{ marginTop: '2rem' }}>
                  <div className={styles.quizHeader}>
                    <label className={styles.label}>Quiz Questions</label>
                    <button onClick={addQuizQuestion} className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}>
                      <FiPlus className={styles.iconCyan} /> Add Question
                    </button>
                  </div>

                  {topicForm.quiz.map((question, qIndex) => (
                    <div key={qIndex} className={styles.quizQuestion}>
                      <div className={styles.questionHeader}>
                        <h4 className={styles.questionTitle}>Question {qIndex + 1}</h4>
                        <button onClick={() => removeQuizQuestion(qIndex)} className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}>
                          <FiTrash2 className={styles.iconRed} />
                        </button>
                      </div>

                      <div className={styles.questionBody}>
                        {/* Type */}
                        <select value={question.questionType}
                          onChange={(e) => updateQuiz(qIndex, { questionType: e.target.value })}
                          className={styles.select}>
                          <option value="MCQ">Multiple Choice</option>
                          <option value="True/False">True/False</option>
                        </select>

                        {/* Question text */}
                        <input type="text" value={question.question}
                          onChange={(e) => updateQuiz(qIndex, { question: e.target.value })}
                          className={styles.input} placeholder="Question text" />

                        {/* ── Question Image ── */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label className={styles.label} style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FiImage size={14} /> Diagram / Image (optional)
                          </label>

                          {/* Preview — new file takes priority over existing URL */}
                          {(question.imagePreview || question.imageUrl) && (
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.5rem' }}>
                              <img
                                src={question.imagePreview || question.imageUrl}
                                alt={`Question ${qIndex + 1} diagram`}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '200px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  display: 'block',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeQuizImage(qIndex)}
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: 'rgba(0,0,0,0.7)',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ff4d4d',
                                }}
                              >
                                <FiX size={12} />
                              </button>
                            </div>
                          )}

                          {/* Upload button */}
                          {!question.imagePreview && !question.imageUrl && (
                            <label className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                              <FiUpload className={styles.iconCyan} size={13} />
                              Upload Image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleQuizImageChange(qIndex, e)}
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}

                          {/* Allow swapping when image already exists */}
                          {(question.imagePreview || question.imageUrl) && (
                            <label className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`} style={{ cursor: 'pointer', display: 'inline-flex', marginLeft: '0.5rem' }}>
                              <FiImage className={styles.iconCyan} size={13} />
                              Change Image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleQuizImageChange(qIndex, e)}
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Options */}
                        <div>
                          <label className={`${styles.label} ${styles.mb2}`}>Options:</label>
                          <div className={styles.optionsList}>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className={styles.optionItem}>
                                <input type="text" value={option}
                                  onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                                  className={`${styles.input} ${styles.optionInput}`}
                                  placeholder={`Option ${oIndex + 1}`} />
                                {question.options.length > 2 && (
                                  <button onClick={() => removeQuizOption(qIndex, oIndex)} className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}>
                                    <FiX className={styles.iconRed} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button onClick={() => addQuizOption(qIndex)}
                            className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`}
                            style={{ width: '100%', marginTop: '0.5rem' }}>
                            <FiPlus className={styles.iconCyan} /> Add Option
                          </button>
                        </div>

                        {/* Correct answer */}
                        <input type="text" value={question.correctAnswer}
                          onChange={(e) => updateQuiz(qIndex, { correctAnswer: e.target.value })}
                          className={styles.input} placeholder="Correct answer (must match one option exactly)" />

                        {/* Explanation */}
                        <input type="text" value={question.explanation}
                          onChange={(e) => updateQuiz(qIndex, { explanation: e.target.value })}
                          className={styles.input} placeholder="Explanation (optional — shown after submission)" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini Task */}
                <div className={styles.formSection}>
                  <label className={styles.label}>Mini Task</label>
                  <div className={`${styles.flex} ${styles.flexCol} ${styles.gap3}`}>
                    <input type="text" value={topicForm.miniTask.title}
                      onChange={(e) => setTopicForm({ ...topicForm, miniTask: { ...topicForm.miniTask, title: e.target.value } })}
                      className={styles.input} placeholder="Task title" />
                    <textarea value={topicForm.miniTask.description}
                      onChange={(e) => setTopicForm({ ...topicForm, miniTask: { ...topicForm.miniTask, description: e.target.value } })}
                      className={`${styles.input} ${styles.textarea}`} placeholder="Task description" rows="3" />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button onClick={handleSaveTopic} disabled={uploading} className={`${styles.btn} ${styles.btnPrimary} ${styles.flex1}`}>
                  <FiSave /> {uploading ? 'Uploading...' : 'Save Topic'}
                </button>
                <button onClick={() => setShowTopicForm(false)} disabled={uploading} className={`${styles.btn} ${styles.btnOutline} ${styles.flex1}`}>
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