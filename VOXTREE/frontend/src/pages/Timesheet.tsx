import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Filter, 
  Download, 
  FileText, 
  DollarSign,
  Clock,
  User,
  Building,
  Plus,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { Project, TimesheetEntry, Invoice } from '../types';

interface TimesheetFilters {
  projectId: number | null;
  fromDate: string;
  toDate: string;
}

interface InvoiceForm {
  clientInfo: {
    name: string;
    email: string;
    address: string;
    phone: string;
  };
  dueDate: string;
  currency: string;
}

const Timesheet: React.FC = () => {
  const [filters, setFilters] = useState<TimesheetFilters>({
    projectId: null,
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    toDate: new Date().toISOString().split('T')[0], // today
  });
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects'),
  });

  const { data: timesheetData, isLoading } = useQuery<TimesheetEntry[]>({
    queryKey: ['timesheet', filters.projectId, filters.fromDate, filters.toDate],
    queryFn: () => {
      if (!filters.projectId) return Promise.resolve([]);
      return apiClient.get(`/projects/${filters.projectId}/timesheet?from=${filters.fromDate}&to=${filters.toDate}`);
    },
    enabled: !!filters.projectId,
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => apiClient.get('/invoices'),
  });

  const invoiceMutation = useMutation({
    mutationFn: (data: InvoiceForm) => apiClient.post('/invoices', {
      projectId: filters.projectId,
      from: filters.fromDate,
      to: filters.toDate,
      clientInfo: data.clientInfo,
      dueDate: data.dueDate,
      currency: data.currency,
    }),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowInvoiceForm(false);
      setSelectedInvoice(invoice);
      toast.success('Invoice created successfully');
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: (invoiceId: number) => apiClient.post(`/invoices/${invoiceId}/send`, {
      email: selectedInvoice?.clientJson ? JSON.parse(selectedInvoice.clientJson).email : '',
      message: 'Please find attached invoice for your review.',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice sent successfully');
    },
    onError: () => toast.error('Failed to send invoice'),
  });

  const { register, handleSubmit, reset, setValue } = useForm<InvoiceForm>();

  const totalHours = timesheetData?.reduce((sum, entry) => sum + entry.totalMinutes, 0) / 60 || 0;
  const totalAmount = timesheetData?.reduce((sum, entry) => sum + entry.totalAmount, 0) || 0;

  const onSubmitInvoice = (data: InvoiceForm) => {
    invoiceMutation.mutate(data);
  };

  const handleSendInvoice = () => {
    if (selectedInvoice) {
      sendInvoiceMutation.mutate(selectedInvoice.id);
    }
  };

  const openInvoicePreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Timesheet & Invoicing</h1>
        <p className="mt-2 text-gray-600">
          Generate timesheets and create invoices for your projects.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Timesheet Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={filters.projectId || ''}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a project</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Timesheet Data */}
      {filters.projectId && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Timesheet Summary</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Total Hours: <span className="font-medium">{totalHours.toFixed(1)}h</span>
                </div>
                <div className="text-sm text-gray-600">
                  Total Amount: <span className="font-medium">${totalAmount.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowInvoiceForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : timesheetData && timesheetData.length > 0 ? (
              <div className="space-y-4">
                {timesheetData.map((entry) => (
                  <div key={entry.userId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.userName}</p>
                        <p className="text-xs text-gray-500">{entry.userEmail}</p>
                        {entry.isFreelancer && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Freelancer
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{entry.totalMinutes / 60}h</p>
                          <p className="text-gray-500">${entry.hourlyRate}/hr</p>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">${entry.totalAmount.toFixed(2)}</p>
                          <p className="text-gray-500">Total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No time entries found for the selected project and date range.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Invoice History</h2>
        </div>
        <div className="p-6">
          {invoices && invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Invoice #{invoice.id}</p>
                      <p className="text-xs text-gray-500">
                        {invoice.project?.name} • {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${invoice.amount.toFixed(2)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1 capitalize">{invoice.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openInvoicePreview(invoice)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Preview Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            sendInvoiceMutation.mutate(invoice.id);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Send Invoice"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate your first invoice from the timesheet above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInvoiceForm(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Generate Invoice</h3>
                  <button
                    onClick={() => setShowInvoiceForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmitInvoice)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                      <input
                        {...register('clientInfo.name', { required: true })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Client Company Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                      <input
                        {...register('clientInfo.email', { required: true })}
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="client@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
                    <textarea
                      {...register('clientInfo.address')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Client address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        {...register('clientInfo.phone')}
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        {...register('dueDate', { required: true })}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      {...register('currency', { required: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Invoice Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Hours:</span>
                        <span className="font-medium">{totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-medium">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={invoiceMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {invoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedInvoice(null)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Preview</h3>
                  <div className="flex items-center space-x-2">
                    {selectedInvoice.status === 'draft' && (
                      <button
                        onClick={handleSendInvoice}
                        disabled={sendInvoiceMutation.isPending}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sendInvoiceMutation.isPending ? 'Sending...' : 'Send Invoice'}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                    <p className="text-gray-600">#{selectedInvoice.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">From:</h3>
                      <p className="text-sm text-gray-600">VOXTREE Development</p>
                      <p className="text-sm text-gray-600">contact@voxtree.com</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">To:</h3>
                      {selectedInvoice.clientJson && (
                        <div className="text-sm text-gray-600">
                          <p>{JSON.parse(selectedInvoice.clientJson).name}</p>
                          <p>{JSON.parse(selectedInvoice.clientJson).email}</p>
                          {JSON.parse(selectedInvoice.clientJson).address && (
                            <p>{JSON.parse(selectedInvoice.clientJson).address}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Invoice Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">${selectedInvoice.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Currency:</span>
                        <span className="font-medium">{selectedInvoice.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span className="font-medium">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${getStatusColor(selectedInvoice.status)}`}>
                          {selectedInvoice.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;
