import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  FiSave, FiEye, FiArrowLeft, FiUpload, FiX,
  FiBold, FiItalic, FiUnderline, FiList,
  FiAlignLeft, FiAlignCenter, FiAlignRight, FiLink,
} from 'react-icons/fi';
import api from '../../api/client';
import { createBlog, updateBlog } from '../../redux/slices/blogSlice';
import toast from 'react-hot-toast';
import styles from './styles/BlogForm.module.css';

// ─── Tiptap Toolbar ───────────────────────────────────────────────────────────
const Toolbar = ({ editor }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const buttons = [
    { action: () => editor.chain().focus().toggleBold().run(), icon: <FiBold />, mark: 'bold' },
    { action: () => editor.chain().focus().toggleItalic().run(), icon: <FiItalic />, mark: 'italic' },
    { action: () => editor.chain().focus().toggleUnderline().run(), icon: <FiUnderline />, mark: 'underline' },
    { action: () => editor.chain().focus().toggleBulletList().run(), icon: <FiList />, mark: 'bulletList' },
    { action: () => editor.chain().focus().setTextAlign('left').run(), icon: <FiAlignLeft />, mark: null },
    { action: () => editor.chain().focus().setTextAlign('center').run(), icon: <FiAlignCenter />, mark: null },
    { action: () => editor.chain().focus().setTextAlign('right').run(), icon: <FiAlignRight />, mark: null },
    { action: addLink, icon: <FiLink />, mark: null },
  ];

  const headings = [1, 2, 3];

  return (
    <div className={styles.toolbar}>
      {headings.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: h }).run()}
          className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: h }) ? styles.toolbarBtnActive : ''}`}
        >
          H{h}
        </button>
      ))}
      <div className={styles.toolbarDivider} />
      {buttons.map((btn, i) => (
        <button
          key={i}
          type="button"
          onClick={btn.action}
          className={`${styles.toolbarBtn} ${btn.mark && editor.isActive(btn.mark) ? styles.toolbarBtnActive : ''}`}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
};

// ─── BlogForm ─────────────────────────────────────────────────────────────────
const BlogForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.blog);

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    category: '',
    tags: '',
    status: 'draft',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [fetching, setFetching] = useState(isEdit);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Write your blog content here...' }),
    ],
    content: '',
  });

  // Load existing blog for edit
  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          setFetching(true);
          // Fetch by ID directly from admin endpoint
          const blogRes = await api.get(`/blogs/admin/all`);
          const blog = blogRes.data.data.find((b) => b._id === id);
          if (blog) {
            setForm({
              title: blog.title,
              shortDescription: blog.shortDescription,
              category: blog.category,
              tags: blog.tags.join(', '),
              status: blog.status,
            });
            editor?.commands.setContent(blog.content);
            if (blog.featuredImage?.url) setExistingImage(blog.featuredImage.url);
          }
        } catch (err) {
          toast.error('Failed to load blog');
        } finally {
          setFetching(false);
        }
      })();
    }
  }, [id, isEdit, editor]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (statusOverride) => {
    const content = editor?.getHTML();
    if (!form.title.trim() || !form.shortDescription.trim() || !content || content === '<p></p>') {
      toast.error('Please fill all required fields');
      return;
    }

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('shortDescription', form.shortDescription);
    fd.append('category', form.category);
    fd.append('content', content);
    fd.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)));
    fd.append('status', statusOverride || form.status);
    if (imageFile) fd.append('image', imageFile);

    let result;
    if (isEdit) {
      result = await dispatch(updateBlog({ id, formData: fd }));
    } else {
      result = await dispatch(createBlog(fd));
    }

    if (!result.error) {
      toast.success(isEdit ? 'Blog updated!' : 'Blog created!');
      navigate('/admin/blogs');
    }
  };

  if (fetching) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <button onClick={() => navigate('/admin/blogs')} className={styles.backBtn}>
            <FiArrowLeft /> Back
          </button>
          <h1 className={styles.pageTitle}>{isEdit ? 'Edit Blog Post' : 'New Blog Post'}</h1>
          <div className={styles.headerActions}>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className={styles.draftBtn}
            >
              <FiSave /> Save Draft
            </button>
            <button
              onClick={() => handleSubmit('published')}
              disabled={loading}
              className={styles.publishBtn}
            >
              <FiEye /> Publish
            </button>
          </div>
        </motion.div>

        <div className={styles.grid}>
          {/* Main Content */}
          <div className={styles.mainCol}>
            {/* Title */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter blog title"
                className={styles.input}
              />
            </div>

            {/* Short Description */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Short Description *</label>
              <textarea
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Brief summary shown in listing pages..."
                className={styles.textarea}
              />
            </div>

            {/* Rich Text Editor */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Content *</label>
              <div className={styles.editorWrapper}>
                <Toolbar editor={editor} />
                <EditorContent editor={editor} className={styles.editorContent} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Featured Image */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Featured Image</h3>
              {(imagePreview || existingImage) ? (
                <div className={styles.imagePreviewWrapper}>
                  <img
                    src={imagePreview || existingImage}
                    alt="Preview"
                    className={styles.imagePreview}
                  />
                  <button onClick={removeImage} className={styles.removeImageBtn}>
                    <FiX />
                  </button>
                </div>
              ) : (
                <label className={styles.uploadArea}>
                  <FiUpload className={styles.uploadIcon} />
                  <span>Click to upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={styles.hidden}
                  />
                </label>
              )}
            </div>

            {/* Category */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Category *</h3>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Technology, Design..."
                className={styles.input}
              />
            </div>

            {/* Tags */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Tags</h3>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Comma separated: react, nodejs, css"
                className={styles.input}
              />
              {form.tags && (
                <div className={styles.tagsPreview}>
                  {form.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className={styles.tagBadge}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Status</h3>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogForm;