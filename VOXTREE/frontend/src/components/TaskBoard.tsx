import React from 'react';
import { Task } from '../types';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  MoreVertical
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  projectId: number;
  onTaskClick?: (taskId: number) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, projectId, onTaskClick }) => {
  const columns = [
    {
      id: 'pending',
      title: 'To Do',
      color: 'bg-gray-100',
      textColor: 'text-gray-700',
      tasks: tasks.filter(task => task.status === 'pending'),
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: 'bg-blue-100',
      textColor: 'text-blue-700',
      tasks: tasks.filter(task => task.status === 'in_progress'),
    },
    {
      id: 'completed',
      title: 'Done',
      color: 'bg-green-100',
      textColor: 'text-green-700',
      tasks: tasks.filter(task => task.status === 'completed'),
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />;
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-medium ${column.textColor}`}>
              {column.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${column.color} ${column.textColor}`}>
              {column.tasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {column.tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onTaskClick?.(task.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {task.title}
                  </h4>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {task.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {getPriorityIcon(task.priority)}
                    <span className="ml-1 capitalize">{task.priority}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {task.estimateHours}h
                  </span>
                </div>

                {task.dueDate && (
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {task.assignedTo.slice(0, 3).map((user, index) => (
                        <div
                          key={user.id}
                          className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-medium text-primary-600 border-2 border-white"
                          title={user.name}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {task.assignedTo.length > 3 && (
                        <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                          +{task.assignedTo.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {task.comments.length} comments
                  </div>
                </div>
              </div>
            ))}

            {column.tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-sm">No tasks in this column</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;
