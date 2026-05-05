const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin', 'member'), createTask)
  .get(protect, authorize('admin', 'member'), getTasks);

router.route('/:id')
  .get(protect, authorize('admin', 'member'), getTaskById)
  .put(protect, authorize('admin', 'member'), updateTask)
  .delete(protect, authorize('admin', 'member'), deleteTask);

router.route('/:id/status')
  .patch(protect, authorize('admin', 'member'), updateTaskStatus);

module.exports = router;
