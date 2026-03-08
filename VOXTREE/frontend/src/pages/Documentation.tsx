import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Users, Lock, Globe, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';

interface Document {
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

interface Project {
  id: number;
  name: string;
  description?: string;
}

const Documentation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: 'general' as 'initial_discussion' | 'minutes_of_meeting' | 'general',
    body: '',
    visibility: 'public' as 'public' | 'internal' | 'private'
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects()
  });

  // Fetch documents for selected project
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents', selectedProject],
    queryFn: () => apiClient.getDocuments(selectedProject!),
    enabled: !!selectedProject
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: (data: typeof newDocument) => apiClient.createDocument({
      ...data,
      projectId: selectedProject!
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedProject] });
      setShowCreateModal(false);
      setNewDocument({
        title: '',
        type: 'general',
        body: '',
        visibility: 'public'
      });
      toast.success('Document created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create document');
    }
  });

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.body?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesVisibility = filterVisibility === 'all' || doc.visibility === filterVisibility;
    
    return matchesSearch && matchesType && matchesVisibility;
  });

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

  if (!selectedProject) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Project Selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please select a project to view its documentation.
            </p>
            <div className="mt-6">
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(Number(e.target.value))}
                className="block w-full max-w-xs mx-auto rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage project documents, files, and discussions
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </button>
          </div>
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="initial_discussion">Initial Discussion</option>
              <option value="minutes_of_meeting">Minutes of Meeting</option>
              <option value="general">General</option>
            </select>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new document.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDocuments.map((document) => (
              <div 
                key={document.id} 
                className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/documentation/${document.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {document.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(document.type)}`}>
                          {getTypeLabel(document.type)}
                        </span>
                        <div className="flex items-center gap-1 text-gray-500">
                          {getVisibilityIcon(document.visibility)}
                          <span className="text-xs">{getVisibilityLabel(document.visibility)}</span>
                        </div>
                      </div>
                      
                      {document.body && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {document.body}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created by {document.creator.name}</span>
                        <span>•</span>
                        <span>{formatDate(document.createdAt)}</span>
                        <span>•</span>
                        <span>{document._count.files} files</span>
                        <span>•</span>
                        <span>{document._count.comments} comments</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Files Preview */}
                  {document.files.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Files</h4>
                      <div className="flex flex-wrap gap-2">
                        {document.files.slice(0, 3).map((file) => (
                          <div key={file.id} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md text-sm">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{file.filename}</span>
                            <span className="text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                        ))}
                        {document.files.length > 3 && (
                          <div className="flex items-center px-3 py-1 bg-gray-50 rounded-md text-sm text-gray-500">
                            +{document.files.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Comments Preview */}
                  {document.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Comments</h4>
                      <div className="space-y-2">
                        {document.comments.slice(0, 2).map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{comment.user.name}</span>
                              <span className="text-gray-500">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-gray-600 mt-1">{comment.body}</p>
                          </div>
                        ))}
                        {document.comments.length > 2 && (
                          <p className="text-sm text-gray-500">
                            +{document.comments.length - 2} more comments
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Document</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                createDocumentMutation.mutate(newDocument);
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter document title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({...newDocument, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="general">General</option>
                    <option value="initial_discussion">Initial Discussion</option>
                    <option value="minutes_of_meeting">Minutes of Meeting</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility *
                  </label>
                  <select
                    value={newDocument.visibility}
                    onChange={(e) => setNewDocument({...newDocument, visibility: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newDocument.body}
                    onChange={(e) => setNewDocument({...newDocument, body: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter document description (optional)"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDocumentMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {createDocumentMutation.isPending ? 'Creating...' : 'Create Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentation;
