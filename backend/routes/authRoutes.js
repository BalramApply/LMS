const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updateprofile', protect, upload.single('avatar'), updateProfile);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;