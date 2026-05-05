const Task = require('../models/Task');
const Project = require('../models/Project');

const getDashboard = async (req, res) => {
  try {
    const now = new Date();

    const projects = await Project.find({
      $or: [{ created_by: req.user._id }, { members: req.user._id }]
    });
    const projectIds = projects.map(p => p._id);

    const baseFilter = { project_id: { $in: projectIds } };

    const [counts] = await Task.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          total:     { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          pending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'done'] },
                    {
                      $or: [
                        { $eq: ['$due_date', null] },
                        { $gte: ['$due_date', now] }
                      ]
                    }
                  ]
                },
                1, 0
              ]
            }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'done'] },
                    { $ne: ['$due_date', null] },
                    { $lt: ['$due_date', now] }
                  ]
                },
                1, 0
              ]
            }
          },
          highPriority:   { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          lowPriority:    { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
          todo:       { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        }
      }
    ]);

    const assignedToMe = await Task.countDocuments({
      ...baseFilter,
      assigned_to: req.user._id
    });

    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const upcomingTasks = await Task.find({
      ...baseFilter,
      status: { $ne: 'done' },
      due_date: { $gte: now, $lte: sevenDaysLater }
    })
      .sort({ due_date: 1 })
      .limit(5)
      .populate('assigned_to', 'name')
      .populate('project_id', 'name');

    const projectStats = await Task.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$project_id',
          total:     { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
        }
      }
    ]);

    const projectMap = Object.fromEntries(projects.map(p => [p._id.toString(), p.name]));
    const projectBreakdown = projectStats.map(s => ({
      projectId:  s._id,
      name:       projectMap[s._id.toString()] || 'Unknown',
      total:      s.total,
      completed:  s.completed,
    }));

    const stats = counts || {
      total: 0, completed: 0, pending: 0, overdue: 0,
      highPriority: 0, mediumPriority: 0, lowPriority: 0,
      todo: 0, inProgress: 0
    };

    res.status(200).json({
      summary: {
        total:      stats.total,
        completed:  stats.completed,
        pending:    stats.pending,
        overdue:    stats.overdue,
        assignedToMe
      },
      statusBreakdown: {
        todo:       stats.todo,
        inProgress: stats.inProgress,
        done:       stats.completed
      },
      priorityBreakdown: {
        high:   stats.highPriority,
        medium: stats.mediumPriority,
        low:    stats.lowPriority
      },
      projectBreakdown,
      upcomingTasks
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
