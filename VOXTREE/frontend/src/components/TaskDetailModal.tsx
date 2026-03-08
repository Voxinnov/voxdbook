import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Clock, 
  Play, 
  Pause, 
  User, 
  MessageSquare, 
  Paperclip, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  MoreVertical,
  Upload,
  Download,
  File,
  Activity,
  Plus,
  Trash2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { Task, Comment, TimeEntry, File as FileType, Activity as ActivityType } from '../types';
import { useAuth } from '../hooks/useAuth';

interface TaskDetailModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CommentForm {
  content: string;
}

interface ManualTimeForm {
  startTime: string;
  endTime: string;
  notes: string;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showManualTime, setShowManualTime] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: () => apiClient.get(`/tasks/${taskId}`),
    enabled: !!taskId && isOpen,
  });

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ['task-comments', taskId],
    queryFn: () => apiClient.get(`/tasks/${taskId}/comments`),
    enabled: !!taskId && isOpen,
  });

  const { data: timeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['task-time-entries', taskId],
    queryFn: () => apiClient.get(`/users/${user?.id}/time-entries?taskId=${taskId}`),
    enabled: !!taskId && isOpen && !!user,
  });

  const { data: files } = useQuery<FileType[]>({
    queryKey: ['task-files', taskId],
    queryFn: () => apiClient.get(`/tasks/${taskId}/files`),
    enabled: !!taskId && isOpen,
  });

  const { data: activities } = useQuery<ActivityType[]>({
    queryKey: ['task-activities', taskId],
    queryFn: () => apiClient.get(`/tasks/${taskId}/activities`),
    enabled: !!taskId && isOpen,
  });

  const { data: runningEntry } = useQuery<TimeEntry | null>({
    queryKey: ['running-time-entry'],
    queryFn: async () => {
      try {
        return await apiClient.get('/time-entries/running');
      } catch {
        return null;
      }
    },
    refetchInterval: (data) => {
      // Only poll if there's a running entry, otherwise poll less frequently
      return data ? 10000 : 60000; // 10 seconds if running, 60 seconds if not
    },
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: true, // Only refetch on mount
    enabled: isOpen, // Only poll when modal is open
  });

  const commentMutation = useMutation({
    mutationFn: (data: CommentForm) => apiClient.post(`/tasks/${taskId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      toast.success('Comment added successfully');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const startTimerMutation = useMutation({
    mutationFn: () => apiClient.post('/time-entries/start', { taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['running-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['task-time-entries', taskId] });
      toast.success('Timer started');
    },
    onError: () => toast.error('Failed to start timer'),
  });

  const stopTimerMutation = useMutation({
    mutationFn: (entryId: number) => apiClient.post('/time-entries/stop', { entryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['running-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['task-time-entries', taskId] });
      toast.success('Timer stopped');
    },
    onError: () => toast.error('Failed to stop timer'),
  });

  const manualTimeMutation = useMutation({
    mutationFn: (data: ManualTimeForm) => apiClient.post('/time-entries', {
      taskId,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-time-entries', taskId] });
      setShowManualTime(false);
      toast.success('Time entry created');
    },
    onError: () => toast.error('Failed to create time entry'),
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(`/api/tasks/${taskId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.getAccessToken()}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-files', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-activities', taskId] });
      toast.success('Files uploaded successfully');
    },
    onError: () => toast.error('Failed to upload files'),
  });

  const { register: registerComment, handleSubmit: handleCommentSubmit, reset: resetComment } = useForm<CommentForm>();
  const { register: registerManual, handleSubmit: handleManualSubmit, reset: resetManual } = useForm<ManualTimeForm>();

  const canStartTimer = task && user && (
    task.assignedTo.some(assignee => assignee.id === user.id) ||
    user.role.name === 'ProjectManager' ||
    user.role.name === 'Founder'
  );

  const isCurrentlyRunning = runningEntry?.taskId === taskId;

  const onSubmitComment = (data: CommentForm) => {
    commentMutation.mutate(data);
    resetComment();
  };

  const onSubmitManualTime = (data: ManualTimeForm) => {
    manualTimeMutation.mutate(data);
    resetManual();
  };

  const handleStartTimer = () => {
    if (isCurrentlyRunning) {
      stopTimerMutation.mutate(runningEntry!.id);
    } else {
      startTimerMutation.mutate();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadingFiles(true);
      fileUploadMutation.mutate(files, {
        onSettled: () => setUploadingFiles(false),
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    return '📁';
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !taskId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ) : task ? (
            <>
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      {task.dueDate && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700">{task.description}</p>
                    </div>

                    {/* Time Tracking */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Time Tracking</h4>
                        <div className="flex space-x-2">
                          {canStartTimer && (
                            <button
                              onClick={handleStartTimer}
                              disabled={startTimerMutation.isPending || stopTimerMutation.isPending}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                                isCurrentlyRunning
                                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                  : 'text-white bg-primary-600 hover:bg-primary-700'
                              } disabled:opacity-50`}
                            >
                              {isCurrentlyRunning ? (
                                <>
                                  <Pause className="h-4 w-4 mr-1" />
                                  Stop Timer
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  Start Timer
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setShowManualTime(!showManualTime)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Log Time
                          </button>
                        </div>
                      </div>

                      {/* Manual Time Form */}
                      {showManualTime && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <form onSubmit={handleManualSubmit(onSubmitManualTime)} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                                <input
                                  {...registerManual('startTime', { required: true })}
                                  type="datetime-local"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                                <input
                                  {...registerManual('endTime', { required: true })}
                                  type="datetime-local"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                {...registerManual('notes')}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Optional notes about this time entry"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowManualTime(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={manualTimeMutation.isPending}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                              >
                                {manualTimeMutation.isPending ? 'Creating...' : 'Create Entry'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Time Entries List */}
                      <div className="space-y-2">
                        {timeEntries?.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(entry.startTime).toLocaleString()}
                                  {entry.endTime && ` - ${new Date(entry.endTime).toLocaleString()}`}
                                </p>
                                {entry.notes && (
                                  <p className="text-xs text-gray-500">{entry.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.durationMins ? `${Math.floor(entry.durationMins / 60)}h ${entry.durationMins % 60}m` : 'Running...'}
                            </div>
                          </div>
                        ))}
                        {timeEntries?.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No time entries yet</p>
                        )}
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Comments</h4>
                        <button
                          onClick={() => setShowComments(!showComments)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {showComments ? 'Hide' : 'Show'} Comments ({comments?.length || 0})
                        </button>
                      </div>

                      {showComments && (
                        <div className="space-y-4">
                          {/* Add Comment Form */}
                          <form onSubmit={handleCommentSubmit(onSubmitComment)} className="space-y-3">
                            <textarea
                              {...registerComment('content', { required: true })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Add a comment..."
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                disabled={commentMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                              >
                                {commentMutation.isPending ? 'Adding...' : 'Add Comment'}
                              </button>
                            </div>
                          </form>

                          {/* Comments List */}
                          <div className="space-y-3">
                            {comments?.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium text-gray-900">{comment.user.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                            {comments?.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Files */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Files</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowFiles(!showFiles)}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {showFiles ? 'Hide' : 'Show'} Files ({files?.length || 0})
                          </button>
                          <label className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              disabled={uploadingFiles}
                            />
                          </label>
                        </div>
                      </div>

                      {showFiles && (
                        <div className="space-y-3">
                          {uploadingFiles && (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                              <span className="ml-2 text-sm text-gray-600">Uploading files...</span>
                            </div>
                          )}
                          
                          {files?.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => window.open(`/api/tasks/${taskId}/files/${file.id}/download`, '_blank')}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {files?.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No files uploaded yet</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Activity Timeline */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Activity</h4>
                        <button
                          onClick={() => setShowActivity(!showActivity)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {showActivity ? 'Hide' : 'Show'} Activity ({activities?.length || 0})
                        </button>
                      </div>

                      {showActivity && (
                        <div className="space-y-3">
                          {activities?.map((activity, index) => (
                            <div key={activity.id} className="flex space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <Activity className="h-4 w-4 text-gray-600" />
                                </div>
                                {index < (activities?.length || 0) - 1 && (
                                  <div className="w-px h-8 bg-gray-200 ml-4 mt-2"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-gray-900">{activity.user.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(activity.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                                {activity.metadata && (
                                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(activity.metadata, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {activities?.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Assignees */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Assigned To</h4>
                      <div className="space-y-2">
                        {task.assignedTo.map((assignee) => (
                          <div key={assignee.id} className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {assignee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{assignee.name}</p>
                              <p className="text-xs text-gray-500">{assignee.role.name}</p>
                            </div>
                          </div>
                        ))}
                        {task.assignedTo.length === 0 && (
                          <p className="text-sm text-gray-500">No one assigned</p>
                        )}
                      </div>
                    </div>

                    {/* Task Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Task Details</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Estimated Hours</dt>
                          <dd className="text-sm text-gray-900">{task.estimateHours}h</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Created</dt>
                          <dd className="text-sm text-gray-900">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Last Updated</dt>
                          <dd className="text-sm text-gray-900">
                            {new Date(task.updatedAt).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">Task not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
