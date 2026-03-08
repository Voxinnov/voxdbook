import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  MessageSquare, 
  Download, 
  Trash2, 
  Edit3,
  User,
  Calendar,
  Eye,
  Lock,
  Globe,
  Users,
  Paperclip,
  Image,
  File,
  Volume2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';

interface DocumentDetail {
  id: number;
  title: string;
  type: 'initial_discussion' | 'minutes_of_meeting' | 'general';
  body?: string;
  visibility: 'public' | 'internal' | 'private';
  createdBy: number;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  files: DocumentFile[];
  comments: DocumentComment[];
  createdAt: string;
  updatedAt: string;
  _count: {
    files: number;
    comments: number;
  };
}

interface DocumentFile {
  id: number;
  filename: string;
  path: string;
  mime: string;
  size: number;
  uploadedBy: number;
  uploader: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface DocumentComment {
  id: number;
  body: string;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  editedAt?: string;
  deleted: boolean;
}

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch document details
  const { data: document, isLoading, error } = useQuery<DocumentDetail>({
    queryKey: ['document', id],
    queryFn: () => apiClient.getDocument(parseInt(id!)),
    enabled: !!id
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (body: string) => apiClient.addComment(parseInt(id!), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      setNewComment('');
      toast.success('Comment added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    }
  });

  // Upload files mutation
  const uploadFilesMutation = useMutation({
    mutationFn: (files: File[]) => apiClient.uploadFiles(parseInt(id!), files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      setSelectedFiles([]);
      toast.success('Files uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload files');
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId: number) => apiClient.deleteFile(parseInt(id!), fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('File deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete file');
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      await uploadFilesMutation.mutateAsync(selectedFiles);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Volume2 className="h-4 w-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'initial_discussion': return 'Initial Discussion';
      case 'minutes_of_meeting': return 'Minutes of Meeting';
      case 'general': return 'General';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'initial_discussion': return 'bg-blue-100 text-blue-800';
      case 'minutes_of_meeting': return 'bg-green-100 text-green-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'internal': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Public';
      case 'internal': return 'Internal';
      case 'private': return 'Private';
      default: return visibility;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading document</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error.message || 'Failed to load document details'}
            </p>
            <button
              onClick={() => navigate('/documentation')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documentation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Document not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The document you're looking for doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => navigate('/documentation')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documentation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/documentation')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{document?.title || 'Loading...'}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(document?.type || 'general')}`}>
                  {getTypeLabel(document?.type || 'general')}
                </span>
                <div className="flex items-center gap-1 text-gray-500">
                  {getVisibilityIcon(document?.visibility || 'public')}
                  <span className="text-xs">{getVisibilityLabel(document?.visibility || 'public')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Created by {document?.creator?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{document?.createdAt ? formatDate(document.createdAt) : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Body */}
            {document?.body && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{document.body}</p>
                </div>
              </div>
            )}

            {/* Files Section */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Files ({document?.files?.length || 0})
                </h3>
              </div>

              {/* File Upload */}
              <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-3">Upload files (documents, images, audio)</p>
                  
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.avi"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </label>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files:</h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <button
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                  </div>
                )}
              </div>

              {/* Files List */}
              {document?.files && document.files.length > 0 ? (
                <div className="space-y-3">
                  {document.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.mime)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • Uploaded by {file.uploader.name} • {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // In a real app, you'd implement file download
                            toast.info('Download functionality would be implemented here');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {file.uploadedBy === user?.id && (
                          <button
                            onClick={() => deleteFileMutation.mutate(file.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No files uploaded yet</p>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({document?.comments?.length || 0})
              </h3>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              {document?.comments && document.comments.length > 0 ? (
                <div className="space-y-4">
                  {document.comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        {comment.editedAt && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{comment.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Document Info</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Type</span>
                  <p className="text-sm text-gray-900">{getTypeLabel(document?.type || 'general')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Visibility</span>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    {getVisibilityIcon(document?.visibility || 'public')}
                    {getVisibilityLabel(document?.visibility || 'public')}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <p className="text-sm text-gray-900">{document?.createdAt ? formatDate(document.createdAt) : 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <p className="text-sm text-gray-900">{document?.updatedAt ? formatDate(document.updatedAt) : 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Files</span>
                  <span className="text-sm font-medium text-gray-900">{document?._count?.files || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Comments</span>
                  <span className="text-sm font-medium text-gray-900">{document?._count?.comments || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
