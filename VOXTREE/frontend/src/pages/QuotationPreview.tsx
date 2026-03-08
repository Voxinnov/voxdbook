import React from 'react';
import { Quotation } from '../types';

interface QuotationPreviewProps {
  quotation: Quotation;
  onClose: () => void;
  onDownloadPDF: () => void;
  onShareEmail: () => void;
  onAttachToProject: () => void;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  quotation,
  onClose,
  onDownloadPDF,
  onShareEmail,
  onAttachToProject
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Actions */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={onClose}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Quotations
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onDownloadPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Download PDF
            </button>
            <button
              onClick={onShareEmail}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Share via Email
            </button>
            <button
              onClick={onAttachToProject}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Attach to Project
            </button>
          </div>
        </div>

        {/* Quotation Document */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Company Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold text-xl">V</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">VOXTREE</h1>
                    <p className="text-blue-100">Professional Development Services</p>
                  </div>
                </div>
                <div className="text-blue-100">
                  <p>Email: info@voxtree.com</p>
                  <p>Phone: +91 98765 43210</p>
                  <p>Website: www.voxtree.com</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold mb-2">QUOTATION</h2>
                <p className="text-blue-100">Quotation #: Q{quotation.id.toString().padStart(4, '0')}</p>
                <p className="text-blue-100">Date: {formatDate(quotation.createdAt)}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quotation.status)}`}>
                    {quotation.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
                <div className="text-gray-700">
                  <p className="font-medium">{quotation.clientName}</p>
                  <p>Project: {quotation.projectName}</p>
                  <p>Type: {quotation.projectType}</p>
                  <p>Platform: {quotation.platform}</p>
                  {quotation.description && (
                    <p className="mt-2 text-sm text-gray-600">{quotation.description}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Details:</h3>
                <div className="text-gray-700">
                  <p><strong>Quotation ID:</strong> Q{quotation.id.toString().padStart(4, '0')}</p>
                  <p><strong>Created:</strong> {formatDate(quotation.createdAt)}</p>
                  {quotation.validUntil && (
                    <p><strong>Valid Until:</strong> {formatDate(quotation.validUntil)}</p>
                  )}
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                      {quotation.status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Development Modules */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Modules</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Developer Hours
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designer Hours
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tester Hours
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotation.modules.map((module, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {module.moduleName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {module.developerHours}h @ {formatCurrency(module.developerRate)}/h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {module.designerHours}h @ {formatCurrency(module.designerRate)}/h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {module.testerHours}h @ {formatCurrency(module.testerRate)}/h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(module.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Development Cost
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Total developer hours × rate
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(quotation.totalDevelopmentCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Infrastructure
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Hosting, domain, etc.
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(quotation.infrastructureCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Design/Branding
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Logo, UI Kit
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(quotation.designBrandingCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Management Overhead
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {quotation.projectManagementPct}% of subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(quotation.projectManagementCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Commission
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {quotation.commissionPct}% of subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(quotation.commissionCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Profit
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {quotation.profitMarginPct}% of subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(quotation.profitMarginCost)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Subtotal
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Before GST
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(quotation.subtotal + quotation.projectManagementCost + quotation.commissionCost + quotation.profitMarginCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      GST ({quotation.gstPct}%)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Tax on subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(quotation.gstAmount)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-blue-500 bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-blue-900">
                      Final Total
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-700">
                      Total amount including all costs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-blue-900 text-right">
                      {formatCurrency(quotation.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="p-8 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Payment terms: 50% advance, 50% on completion</p>
              <p>• Development timeline: As per project requirements</p>
              <p>• Revisions: 2 rounds of revisions included</p>
              <p>• Support: 3 months free support after delivery</p>
              <p>• This quotation is valid for 30 days from the date of issue</p>
              <p>• All prices are in Indian Rupees (INR) and exclude applicable taxes</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 text-center text-gray-500 text-sm">
            <p>Thank you for considering VOXTREE for your project needs.</p>
            <p>For any queries, please contact us at info@voxtree.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;



