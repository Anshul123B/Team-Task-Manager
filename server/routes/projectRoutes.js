const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin', 'member'), createProject)
  .get(protect, authorize('admin', 'member'), getProjects);

router.route('/:id')
  .get(protect, authorize('admin', 'member'), getProjectById)
  .put(protect, authorize('admin', 'member'), updateProject)
  .delete(protect, authorize('admin'), deleteProject);

router.route('/:id/members')
  .post(protect, authorize('admin', 'member'), addMember);

module.exports = router;
