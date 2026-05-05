// Team Task Manager — KanbanBoard component: renders task columns and cards
import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const STATUSES = ['todo', 'in-progress', 'done'];
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' };
const STATUS_COLORS = {
  'todo':       { header: 'bg-slate-100 border-slate-300 text-slate-700', dot: 'bg-slate-400', count: 'bg-slate-200 text-slate-600' },
  'in-progress':{ header: 'bg-blue-50 border-blue-300 text-blue-700',    dot: 'bg-blue-400',  count: 'bg-blue-100 text-blue-600'  },
  'done':       { header: 'bg-green-50 border-green-300 text-green-700', dot: 'bg-green-400', count: 'bg-green-100 text-green-600' }
};
const PRIORITY_BADGE = {
  low:    'bg-green-100 text-green-700 border border-green-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  high:   'bg-red-100   text-red-700   border border-red-200',
};
const PRIORITY_DOT = { low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-red-500' };

const KanbanBoard = ({ tasks, onStatusChange, onDeleteTask }) => {
  const { canDeleteTask } = useAuth();
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    await onStatusChange(taskId, newStatus);
    setUpdatingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const today = new Date();
    const isOverdue = d < today && d.toDateString() !== today.toDateString();
    return { formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue };
  };

  const getNextStatus = (current) => {
    const idx = STATUSES.indexOf(current);
    return STATUSES[(idx + 1) % STATUSES.length];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full">
      {STATUSES.map((status) => {
        const safeTasks = Array.isArray(tasks) ? tasks : [];
        const columnTasks = safeTasks.filter(t => (t && t.status) === status);
        const c = STATUS_COLORS[status];

        return (
          <div key={status} className="flex flex-col bg-gray-50 rounded-2xl border border-gray-200 min-h-96">
            {/* Column Header */}
            <div className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl border-b ${c.header}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`}></span>
              <span className="font-semibold text-sm">{STATUS_LABELS[status]}</span>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${c.count}`}>{columnTasks.length}</span>
            </div>

            {/* Task Cards */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {columnTasks.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">No tasks here</div>
              )}
              {columnTasks.map((task) => {
                const safeTask = task || {};
                const dueInfo = formatDate(safeTask.due_date);
                const showDelete = canDeleteTask(safeTask);

                return (
                  <div key={task._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 group">
                    {/* Priority + Delete */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[safeTask.priority || 'low']}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT[safeTask.priority || 'low']}`}></span>
                        {(safeTask.priority || 'low').charAt(0).toUpperCase() + (safeTask.priority || 'low').slice(1)}
                      </span>
                      {/* Only show delete if user has permission */}
                      {showDelete && (
                        <button
                          onClick={() => onDeleteTask(task._id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                          title="Delete task"
                        >&times;</button>
                      )}
                    </div>

                    {/* Title & Description */}
                    <p className="font-semibold text-gray-900 text-sm mb-1">{safeTask.title || 'Untitled task'}</p>
                    {safeTask.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{safeTask.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      {safeTask.assigned_to ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                            {safeTask.assigned_to.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-500">{safeTask.assigned_to.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}

                      {dueInfo && (
                        <span className={`text-xs font-medium ${dueInfo.isOverdue && status !== 'done' ? 'text-red-600' : 'text-gray-400'}`}>
                          {dueInfo.isOverdue && status !== 'done' ? '⚠ ' : ''}{dueInfo.formatted}
                        </span>
                      )}
                    </div>

                    {/* Advance status — available to all members */}
                    {status !== 'done' && (
                      <button
                        onClick={() => handleStatusChange(safeTask._id, getNextStatus(status))}
                        disabled={updatingId === safeTask._id}
                        className="mt-3 w-full text-xs text-indigo-600 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors disabled:opacity-50 font-medium"
                      >
                        {updatingId === safeTask._id ? 'Moving…' : `→ Move to ${STATUS_LABELS[getNextStatus(status)]}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
