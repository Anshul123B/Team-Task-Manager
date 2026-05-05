const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, authorize('admin', 'member'), (req, res) => {
  res.status(200).json(req.user);
});

module.exports = router;
