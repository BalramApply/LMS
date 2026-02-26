const express = require("express");
const router  = express.Router();
const {
  getActiveBanners,
  trackView,
  trackClick,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  hardDeleteBanner,
  toggleBannerStatus,
} = require("../controllers/bannerController");

const upload = require("../middleware/upload");
const { protect, authorize } = require("../middleware/auth"); // ← authorize, not adminOnly

// ─── PUBLIC ROUTES ────────────────────────────────────────────
router.get   ("/banners/active",           getActiveBanners);
router.patch ("/banners/:id/view",         trackView);
router.patch ("/banners/:id/click",        trackClick);

// ─── ADMIN ROUTES ─────────────────────────────────────────────
router.get   ("/admin/banners",            protect, authorize("admin"), getAllBanners);
router.post  ("/admin/banners",            protect, authorize("admin"), upload.single("image"), createBanner);
router.put   ("/admin/banners/:id",        protect, authorize("admin"), upload.single("image"), updateBanner);
router.delete("/admin/banners/:id",        protect, authorize("admin"), deleteBanner);        // soft
router.delete("/admin/banners/:id/hard",   protect, authorize("admin"), hardDeleteBanner);   // hard
router.patch ("/admin/banners/:id/toggle", protect, authorize("admin"), toggleBannerStatus);

module.exports = router;