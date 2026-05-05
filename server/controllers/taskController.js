const Task = require('../models/Task');
const Project = require('../models/Project');

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;

    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.includes(req.user._id);
    const isCreator = project.created_by.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for this project' });
    }

    if (assigned_to) {
      if (!project.members.includes(assigned_to) && project.created_by.toString() !== assigned_to) {
        return res.status(400).json({ message: 'Assigned user must be a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      due_date,
      project_id,
      assigned_to,
      created_by: req.user._id
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const { project_id, status, assigned_to } = req.query;
    
    let filter = {};
    if (project_id) filter.project_id = project_id;
    if (status) filter.status = status;
    if (assigned_to) filter.assigned_to = assigned_to;

    if (!project_id && req.user.role !== 'admin') {
      const projects = await Project.find({
        $or: [{ created_by: req.user._id }, { members: req.user._id }]
      });
      const projectIds = projects.map(p => p._id);
      filter.project_id = { $in: projectIds };
    }

    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email')
      .populate('project_id', 'name members created_by');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = task.project_id;
    const isMember = project.members.some(m => m.toString() === req.user._id.toString());
    const isCreator = project.created_by.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project_id);
    const isMember = project.members.includes(req.user._id);
    const isCreator = project.created_by.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { assigned_to } = req.body;
    if (assigned_to) {
      if (!project.members.includes(assigned_to) && project.created_by.toString() !== assigned_to) {
        return res.status(400).json({ message: 'Assigned user must be a project member' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project_id);
    if (!project.members.includes(req.user._id) && project.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = status;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only creator or admin can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ id: req.params.id, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask
};
