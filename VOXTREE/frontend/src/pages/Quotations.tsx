import React, { useState, useEffect } from 'react';
import { Quotation, QuotationFilters, Pagination } from '../types';
import { apiClient } from '../services/api';
import QuotationForm from '../components/QuotationForm';
import QuotationFormTabs from '../components/QuotationFormTabsSimple';
import QuotationPDF from '../components/QuotationPDF';
// import QuotationPreview from './QuotationPreview';
// import { PDFService } from '../services/pdfService';
// import { EmailService } from '../services/emailService';

const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [useTabbedForm, setUseTabbedForm] = useState(true);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfQuotation, setPdfQuotation] = useState<Quotation | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [filters, setFilters] = useState<QuotationFilters>({
    page: 1,
    limit: 10,
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchQuotations();
  }, [filters]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getQuotations(filters);
      setQuotations(response.quotations);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuotation = () => {
    setEditingQuotation(null);
    setShowForm(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setShowForm(true);
  };

  const handleQuotationSaved = (quotation: Quotation) => {
    setShowForm(false);
    setEditingQuotation(null);
    fetchQuotations();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingQuotation(null);
  };

  const handleViewPDF = (quotation: Quotation) => {
    setPdfQuotation(quotation);
    setShowPDF(true);
  };

  const handleClosePDF = () => {
    setShowPDF(false);
    setPdfQuotation(null);
  };

  const handleViewPreview = (quotation: Quotation) => {
    setPreviewQuotation(quotation);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewQuotation(null);
  };

  const handleDownloadPDF = async () => {
    if (previewQuotation) {
      console.log('Download PDF for quotation:', previewQuotation.id);
      alert('PDF download functionality will be implemented');
    }
  };

  const handleShareEmail = async () => {
    if (previewQuotation) {
      console.log('Share via email for quotation:', previewQuotation.id);
      alert('Email sharing functionality will be implemented');
    }
  };

  const handleAttachToProject = () => {
    // Implement project attachment functionality
    console.log('Attach to project:', previewQuotation);
  };

  const handleDeleteQuotation = async (quotationId: number) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return;
    }

    try {
      await apiClient.deleteQuotation(quotationId);
      fetchQuotations();
    } catch (err) {
      console.error('Error deleting quotation:', err);
      setError('Failed to delete quotation');
    }
  };

  const handleDuplicateQuotation = async (quotationId: number) => {
    try {
      await apiClient.duplicateQuotation(quotationId);
      fetchQuotations();
    } catch (err) {
      console.error('Error duplicating quotation:', err);
      setError('Failed to duplicate quotation');
    }
  };

  const handleStatusChange = async (quotationId: number, newStatus: string) => {
    try {
      await apiClient.updateQuotation(quotationId, { status: newStatus as any });
      fetchQuotations();
    } catch (err) {
      console.error('Error updating quotation status:', err);
      setError('Failed to update quotation status');
    }
  };

  const handleFilterChange = (key: keyof QuotationFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'search' || key === 'status' ? { page: 1 } : {})
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (showForm) {
    return useTabbedForm ? (
      <QuotationFormTabs
        quotation={editingQuotation || undefined}
        onSave={handleQuotationSaved}
        onCancel={handleCancelForm}
      />
    ) : (
      <QuotationForm
        quotation={editingQuotation || undefined}
        onSave={handleQuotationSaved}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
            <p className="text-gray-600 mt-1">Manage project quotations and pricing</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setUseTabbedForm(!useTabbedForm)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {useTabbedForm ? 'Use Simple Form' : 'Use Tabbed Form'}
            </button>
            <button
              onClick={handleCreateQuotation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Quotation
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search projects or clients"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              value={filters.limit || 10}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ page: 1, limit: 10, status: '', search: '' })}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Quotations Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first quotation.</p>
          <button
            onClick={handleCreateQuotation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Quotation
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{quotation.projectName}</div>
                        <div className="text-sm text-gray-500">{quotation.projectType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quotation.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {quotation.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(quotation.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={quotation.status}
                        onChange={(e) => handleStatusChange(quotation.id, e.target.value)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quotation.status)} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quotation.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPreview(quotation)}
                          className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleViewPDF(quotation)}
                          className="text-purple-600 hover:text-purple-900 focus:outline-none"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleEditQuotation(quotation)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicateQuotation(quotation.id)}
                          className="text-green-600 hover:text-green-900 focus:outline-none"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDeleteQuotation(quotation.id)}
                          className="text-red-600 hover:text-red-900 focus:outline-none"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((pagination.page - 1) * pagination.limit) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.pages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF Modal */}
      {showPDF && pdfQuotation && (
        <QuotationPDF
          quotation={pdfQuotation}
          onClose={handleClosePDF}
        />
      )}

      {/* Preview Page */}
      {showPreview && previewQuotation && (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h1 className="text-2xl font-bold mb-4">Quotation Preview</h1>
              <p className="text-gray-600 mb-4">Preview functionality will be implemented here.</p>
              <button
                onClick={handleClosePreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;
