  import React, { useState, useEffect, useCallback } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { motion } from 'framer-motion';
  import { FiSave, FiX, FiUpload } from 'react-icons/fi';
  import api from '../../api/client';
  import toast from 'react-hot-toast';
  import styles from './styles/CourseForm.module.css';

  const CourseForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
      title: '',
      shortDescription: '',
      fullDescription: '',
      category: 'Web Development',
      level: 'Beginner',
      language: 'English',
      courseType: 'Free',
      price: 0,
      discountPrice: 0,
      discountValidTill: '',
      batchType: 'Recorded',
      accessType: 'Lifetime',
      accessDuration: null,
      instructorName: '',
      instructorBio: '',
      isPublished: false,
    });

    const [roadmapInput, setRoadmapInput] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [loading, setLoading] = useState(false);
  
    const loadCourse = useCallback(async () => {
  try {
    const response = await api.get(`/courses/${id}`);
    const course = response.data.data;

    setFormData({
      title: course.title || '',
      shortDescription: course.shortDescription || '',
      fullDescription: course.fullDescription || '',
      category: course.category || 'Web Development',
      level: course.level || 'Beginner',
      language: course.language || 'English',
      courseType: course.courseType || 'Free',
      price: course.price || 0,
      discountPrice: course.discountPrice || 0,
      discountValidTill: course.discountValidTill ? course.discountValidTill.split('T')[0] : '',
      batchType: course.batchType || 'Recorded',
      accessType: course.accessType || 'Lifetime',
      accessDuration: course.accessDuration || null,
      instructorName: course.instructorName || '',
      instructorBio: course.instructorBio || '',
      isPublished: course.isPublished || false,
    });

    if (course.thumbnail?.url) {
      setThumbnailPreview(course.thumbnail.url);
    }

    if (course.roadmap?.length > 0) {
      const roadmapText = course.roadmap.map(item => item.title || item).join('\n');
      setRoadmapInput(roadmapText);
    }
  } catch (error) {
    toast.error('Failed to load course');
    navigate('/admin/courses');
  }
}, [id, navigate]);

 useEffect(() => {
  if (isEditMode) {
    loadCourse();
  }
}, [isEditMode, loadCourse]);

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    };

    const handleRoadmapChange = (e) => {
      setRoadmapInput(e.target.value);
    };

    const handleThumbnailChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }
        
        setThumbnailFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        toast.success('Thumbnail selected');
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!formData.title.trim()) {
        toast.error('Course title is required');
        return;
      }

      if (!formData.shortDescription.trim()) {
        toast.error('Short description is required');
        return;
      }

      if (!formData.fullDescription.trim()) {
        toast.error('Full description is required');
        return;
      }

      if (!formData.instructorName.trim()) {
        toast.error('Instructor name is required');
        return;
      }

      if (!formData.instructorBio.trim()) {
        toast.error('Instructor bio is required');
        return;
      }

      if (!isEditMode && !thumbnailFile) {
        toast.error('Course thumbnail is required');
        return;
      }

      if (formData.courseType === 'Paid' && formData.price <= 0) {
        toast.error('Price must be greater than 0 for paid courses');
        return;
      }

      if (formData.discountPrice > formData.price) {
        toast.error('Discount price cannot be greater than actual price');
        return;
      }

      setLoading(true);

      try {
        const submitData = new FormData();

        submitData.append('title', formData.title.trim());
        submitData.append('shortDescription', formData.shortDescription.trim());
        submitData.append('fullDescription', formData.fullDescription.trim());
        submitData.append('category', formData.category);
        submitData.append('level', formData.level);
        submitData.append('language', formData.language);
        submitData.append('courseType', formData.courseType);
        submitData.append('price', formData.price);
        submitData.append('discountPrice', formData.discountPrice);
        submitData.append('batchType', formData.batchType);
        submitData.append('accessType', formData.accessType);
        submitData.append('instructorName', formData.instructorName.trim());
        submitData.append('instructorBio', formData.instructorBio.trim());
        submitData.append('isPublished', formData.isPublished);

        if (formData.discountValidTill) {
          submitData.append('discountValidTill', formData.discountValidTill);
        }

        if (formData.accessType === 'Limited' && formData.accessDuration) {
          submitData.append('accessDuration', formData.accessDuration);
        }

        const roadmapLines = roadmapInput.split('\n').filter(line => line.trim());
        if (roadmapLines.length > 0) {
          const roadmapArray = roadmapLines.map(line => ({ title: line.trim() }));
          submitData.append('roadmap', JSON.stringify(roadmapArray));
        }

        if (thumbnailFile) {
          submitData.append('thumbnail', thumbnailFile);
        }

        let response;
        if (isEditMode) {
          response = await api.put(`/courses/${id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success('Course updated successfully!');
        } else {
          response = await api.post('/courses', submitData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success('Course created successfully!');
        }

        if (!isEditMode && response.data.data._id) {
          navigate(`/admin/courses/${response.data.data._id}/content`);
        } else {
          navigate('/admin/courses');
        }
      } catch (error) {
        console.error('Course save error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save course';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    const categories = [
      'Web Development',
      'Mobile Development',
      'Data Science',
      'Machine Learning',
      'AI',
      'Cloud Computing',
      'Cybersecurity',
      'DevOps',
      'Blockchain',
      'Game Development',
      'UI/UX Design',
      'Digital Marketing',
      'Other',
    ];

    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const batchTypes = ['Live', 'Live + Recorded', 'Recorded'];
    const accessTypes = ['Lifetime', 'Limited'];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.pageTitle}>
            {isEditMode ? 'Edit Course' : 'Create New Course'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isEditMode ? 'Update course information' : 'Fill in the details to create a new course'}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Information */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., Complete Web Development Bootcamp"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Short Description * (Max 200 characters)
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Brief one-line description"
                  maxLength={200}
                  required
                />
                <p className={styles.charCount}>
                  {formData.shortDescription.length}/200 characters
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Full Description *
                </label>
                <textarea
                  name="fullDescription"
                  value={formData.fullDescription}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.textareaLong}`}
                  placeholder="Detailed course description..."
                  required
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Level *
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Language *
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Thumbnail */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              Course Thumbnail *
            </h2>
            
            <div className={styles.formContent}>
              {thumbnailPreview && (
                <div className={styles.thumbnailPreview}>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className={styles.thumbnailImage}
                  />
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.uploadButton}>
                  <FiUpload className={styles.uploadIcon} />
                  {thumbnailFile ? 'Change Thumbnail' : 'Upload Thumbnail'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className={styles.hiddenFileInput}
                  />
                </label>
                <p className={styles.helpText}>
                  Recommended: 1280x720px, Max 5MB (JPG, PNG, GIF, WEBP)
                </p>
                {thumbnailFile && (
                  <p className={styles.successText}>
                    Selected: {thumbnailFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instructor Information */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              Instructor Information
            </h2>
            
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Instructor Name *
                </label>
                <input
                  type="text"
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Instructor Bio * (Max 500 characters)
                </label>
                <textarea
                  name="instructorBio"
                  value={formData.instructorBio}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.textareaShort}`}
                  placeholder="Brief bio about the instructor..."
                  maxLength={500}
                  required
                />
                <p className={styles.charCount}>
                  {formData.instructorBio.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Pricing</h2>
            
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Course Type *
                </label>
                <select
                  name="courseType"
                  value={formData.courseType}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {formData.courseType === 'Paid' && (
                <>
                  <div className={styles.gridTwo}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className={styles.input}
                        min="1"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Discount Price (₹)
                      </label>
                      <input
                        type="number"
                        name="discountPrice"
                        value={formData.discountPrice}
                        onChange={handleChange}
                        className={styles.input}
                        min="0"
                      />
                    </div>
                  </div>

                  {formData.discountPrice > 0 && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Discount Valid Till
                      </label>
                      <input
                        type="date"
                        name="discountValidTill"
                        value={formData.discountValidTill}
                        onChange={handleChange}
                        className={styles.input}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Course Settings */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              Course Settings
            </h2>
            
            <div className={styles.formContent}>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Batch Type *
                  </label>
                  <select
                    name="batchType"
                    value={formData.batchType}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    {batchTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Access Type *
                  </label>
                  <select
                    name="accessType"
                    value={formData.accessType}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    {accessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.accessType === 'Limited' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Access Duration (months) *
                  </label>
                  <input
                    type="number"
                    name="accessDuration"
                    value={formData.accessDuration || ''}
                    onChange={handleChange}
                    className={styles.input}
                    min="1"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Learning Path (Roadmap) */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              Learning Path (Roadmap)
            </h2>
            
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Course Roadmap (one item per line)
                </label>
                <textarea
                  value={roadmapInput}
                  onChange={handleRoadmapChange}
                  className={`${styles.input} ${styles.textareaLong}`}
                  placeholder="Learn HTML basics&#10;Master CSS layouts&#10;Build responsive websites&#10;JavaScript fundamentals"
                />
                <p className={styles.helpText}>
                  Each line will be a separate learning objective
                </p>
              </div>
            </div>
          </div>

          {/* Publish Status */}
          <div className={styles.card}>
            <label className={styles.publishCheckbox}>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <div className={styles.checkboxLabel}>
                <p className={styles.checkboxTitle}>Publish this course</p>
                <p className={styles.checkboxDescription}>
                  Make this course visible to students
                </p>
              </div>
            </label>
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className={styles.cancelButton}
              disabled={loading}
            >
              <FiX className={styles.buttonIcon} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              <FiSave className={styles.buttonIcon} />
              {loading ? 'Saving...' : isEditMode ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;