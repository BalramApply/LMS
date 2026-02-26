import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiEye, FiMousePointer, FiX, FiSave,
} from "react-icons/fi";
import {
  fetchAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from "../../redux/slices/bannerSlice";
import styles from "./styles/BannerManager.module.css";

const EMPTY_FORM = {
  title: "", subtitle: "", buttonText: "Learn More",
  buttonUrl: "/courses", type: "hero", isActive: true,
  displayOrder: 0, image: null,
};

const BannerManager = () => {
  const dispatch = useDispatch();
  const { allBanners, allBannersLoading, actionLoading } = useSelector(
    (state) => state.banners
  );

  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null); // null = create mode
  const [form, setForm]               = useState(EMPTY_FORM);
  const [preview, setPreview]         = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { dispatch(fetchAllBanners()); }, [dispatch]);

  // ── Helpers ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setPreview(null);
    setShowModal(true);
  };

  const openEdit = (banner) => {
    setEditTarget(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      buttonText: banner.buttonText || "Learn More",
      buttonUrl: banner.buttonUrl || "/courses",
      type: banner.type,
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
      image: null,
    });
    setPreview(banner.image?.url || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "image" && v) fd.append("image", v);
      else if (k !== "image") fd.append(k, v);
    });

    try {
      if (editTarget) {
        await dispatch(updateBanner({ id: editTarget._id, formData: fd })).unwrap();
        toast.success("Banner updated!");
      } else {
        await dispatch(createBanner(fd)).unwrap();
        toast.success("Banner created!");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteBanner(id)).unwrap();
      toast.success("Banner deleted");
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleToggle = async (id) => {
    try {
      await dispatch(toggleBannerStatus(id)).unwrap();
    } catch (err) {
      toast.error(err);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Banner Manager</h1>
          <p className={styles.subheading}>Manage hero & promotional banners</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>
          <FiPlus /> Add Banner
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      {allBannersLoading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Type</th>
                <th>Order</th>
                <th>Status</th>
                <th><FiEye /> Views</th>
                <th><FiMousePointer /> Clicks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allBanners.map((b, i) => (
                <tr key={b._id}>
                  <td>{i + 1}</td>
                  <td>
                    <img
                      src={b.image?.url}
                      alt={b.title}
                      className={styles.thumb}
                    />
                  </td>
                  <td>
                    <span className={styles.titleCell}>{b.title}</span>
                    {b.subtitle && (
                      <span className={styles.subCell}>{b.subtitle}</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${b.type}`]}`}>
                      {b.type}
                    </span>
                  </td>
                  <td>{b.displayOrder}</td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${b.isActive ? styles.active : styles.inactive}`}
                      onClick={() => handleToggle(b._id)}
                      title="Toggle active"
                    >
                      {b.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                      {b.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{b.viewCount ?? 0}</td>
                  <td>{b.clickCount ?? 0}</td>
                  <td className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => openEdit(b)} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(b._id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className={styles.modalHeader}>
                <h2>{editTarget ? "Edit Banner" : "Create Banner"}</h2>
                <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Image upload */}
                <div className={styles.imageUpload}>
                  {preview ? (
                    <img src={preview} alt="preview" className={styles.previewImg} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>Click to upload image</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={styles.fileInput}
                    required={!editTarget}
                  />
                </div>

                {/* Fields */}
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Title *</label>
                    <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                      required placeholder="e.g. Learn. Grow. Succeed." />
                  </div>
                  <div className={styles.field}>
                    <label>Subtitle</label>
                    <input value={form.subtitle} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
                      placeholder="Short supporting text" />
                  </div>
                  <div className={styles.field}>
                    <label>Button Text</label>
                    <input value={form.buttonText} onChange={(e) => setForm(f => ({ ...f, buttonText: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label>Button URL</label>
                    <input value={form.buttonUrl} onChange={(e) => setForm(f => ({ ...f, buttonUrl: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label>Type</label>
                    <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="hero">Hero</option>
                      <option value="offer">Offer</option>
                      <option value="announcement">Announcement</option>
                      <option value="festival">Festival</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Display Order</label>
                    <input type="number" min="0" value={form.displayOrder}
                      onChange={(e) => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
                  </div>
                </div>

                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Active (visible on site)
                </label>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={actionLoading}>
                    {actionLoading ? "Saving…" : <><FiSave /> {editTarget ? "Update" : "Create"}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ─────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.confirmBox}
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
            >
              <h3>Delete this banner?</h3>
              <p>This action will soft-delete the banner. It can be recovered from the database.</p>
              <div className={styles.confirmActions}>
                <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className={styles.deleteConfirmBtn} onClick={() => handleDelete(deleteConfirm)}
                  disabled={actionLoading}>
                  {actionLoading ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BannerManager;