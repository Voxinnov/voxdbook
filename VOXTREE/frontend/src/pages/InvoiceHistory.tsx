import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Send, 
  Eye, 
  Download, 
  DollarSign,
  Calendar,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Plus,
  MoreVertical,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { Invoice, Payment } from '../types';

interface PaymentForm {
  amount: number;
  method: string;
  notes?: string;
}

const InvoiceHistory: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => apiClient.get('/invoices'),
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: () => apiClient.get('/payments'),
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

  const recordPaymentMutation = useMutation({
    mutationFn: (data: PaymentForm) => apiClient.post(`/invoices/${selectedInvoice?.id}/pay`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowPaymentForm(false);
      toast.success('Payment recorded successfully');
    },
    onError: () => toast.error('Failed to record payment'),
  });

  const { register, handleSubmit, reset } = useForm<PaymentForm>();

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = invoice.id.toString().includes(searchTerm) || 
                         invoice.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getTotalPaid = (invoice: Invoice) => {
    return invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  };

  const getRemainingAmount = (invoice: Invoice) => {
    return invoice.amount - getTotalPaid(invoice);
  };

  const onSubmitPayment = (data: PaymentForm) => {
    if (selectedInvoice) {
      recordPaymentMutation.mutate(data);
    }
  };

  const handleSendInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    sendInvoiceMutation.mutate(invoice.id);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const openInvoicePreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
        <p className="mt-2 text-gray-600">
          Manage and track all your invoices and payments.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-semibold text-gray-900">{invoices?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-semibold text-gray-900">
                {invoices?.filter(i => i.status === 'paid').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {invoices?.filter(i => ['sent', 'partial'].includes(i.status)).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {invoices?.filter(i => i.status === 'overdue').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Invoices</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : filteredInvoices && filteredInvoices.length > 0 ? (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => {
                const totalPaid = getTotalPaid(invoice);
                const remainingAmount = getRemainingAmount(invoice);
                const clientInfo = invoice.clientJson ? JSON.parse(invoice.clientJson) : {};

                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">Invoice #{invoice.id}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusIcon(invoice.status)}
                              <span className="ml-1 capitalize">{invoice.status}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{invoice.project?.name}</p>
                          <p className="text-xs text-gray-400">
                            {clientInfo.name} • {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">${invoice.amount.toFixed(2)}</p>
                          {totalPaid > 0 && (
                            <p className="text-xs text-gray-500">
                              Paid: ${totalPaid.toFixed(2)} • Remaining: ${remainingAmount.toFixed(2)}
                            </p>
                          )}
                          {invoice.dueDate && (
                            <p className="text-xs text-gray-400">
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          )}
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
                              onClick={() => handleSendInvoice(invoice)}
                              className="text-gray-400 hover:text-blue-600"
                              title="Send Invoice"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}

                          {['sent', 'partial'].includes(invoice.status) && remainingAmount > 0 && (
                            <button
                              onClick={() => handleRecordPayment(invoice)}
                              className="text-gray-400 hover:text-green-600"
                              title="Record Payment"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => window.open(`/api/invoices/${invoice.id}/download`, '_blank')}
                            className="text-gray-400 hover:text-gray-600"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Payment History</h4>
                        <div className="space-y-2">
                          {invoice.payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-gray-600">{payment.method}</span>
                                <span className="text-gray-400">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">${payment.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No invoices match your current filters.'
                  : 'Get started by creating your first invoice from the timesheet page.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPaymentForm(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Record Payment</h3>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Invoice #{selectedInvoice.id}</h4>
                  <div className="text-sm text-gray-600">
                    <p>Total Amount: ${selectedInvoice.amount.toFixed(2)}</p>
                    <p>Remaining: ${getRemainingAmount(selectedInvoice).toFixed(2)}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmitPayment)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                    <input
                      {...register('amount', { required: true, min: 0.01, max: getRemainingAmount(selectedInvoice) })}
                      type="number"
                      step="0.01"
                      max={getRemainingAmount(selectedInvoice)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      {...register('method', { required: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select payment method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="check">Check</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Additional notes about this payment"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={recordPaymentMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && !showPaymentForm && (
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
                        onClick={() => handleSendInvoice(selectedInvoice)}
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

export default InvoiceHistory;
