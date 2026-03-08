import React from 'react';
import { Quotation } from '../types';

interface QuotationPDFProps {
  quotation: Quotation;
  onClose: () => void;
}

const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation, onClose }) => {
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
        return 'text-gray-600';
      case 'sent':
        return 'text-blue-600';
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'expired':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quotation - ${quotation.projectName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .quotation-title { font-size: 20px; margin: 10px 0; }
            .quotation-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .client-info, .quotation-info { flex: 1; }
            .section-title { font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; color: #374151; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            .table th { background-color: #f9fafb; font-weight: bold; }
            .cost-summary { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cost-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-row { border-top: 2px solid #2563eb; padding-top: 10px; font-weight: bold; font-size: 18px; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${document.getElementById('quotation-content')?.innerHTML || ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quotation Preview</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>

        <div id="quotation-content" className="p-6">
          {/* Header */}
          <div className="header">
            <div className="company-name">VOXTREE</div>
            <div className="quotation-title">Project Quotation</div>
            <div className="text-gray-600">Professional Development Services</div>
          </div>

          {/* Quotation Details */}
          <div className="quotation-details">
            <div className="client-info">
              <h3 className="font-semibold text-gray-900 mb-2">Client Information</h3>
              <p><strong>Client:</strong> {quotation.clientName}</p>
              <p><strong>Project:</strong> {quotation.projectName}</p>
              <p><strong>Type:</strong> {quotation.projectType}</p>
              <p><strong>Platform:</strong> {quotation.platform}</p>
              {quotation.description && (
                <p><strong>Description:</strong> {quotation.description}</p>
              )}
            </div>
            <div className="quotation-info">
              <h3 className="font-semibold text-gray-900 mb-2">Quotation Details</h3>
              <p><strong>Quotation #:</strong> Q{quotation.id.toString().padStart(4, '0')}</p>
              <p><strong>Date:</strong> {formatDate(quotation.createdAt)}</p>
              <p><strong>Status:</strong> <span className={getStatusColor(quotation.status)}>{quotation.status.toUpperCase()}</span></p>
              {quotation.validUntil && (
                <p><strong>Valid Until:</strong> {formatDate(quotation.validUntil)}</p>
              )}
            </div>
          </div>

          {/* Development Modules */}
          <div className="section-title">Development Modules</div>
          <table className="table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Developer Hours</th>
                <th>Designer Hours</th>
                <th>Tester Hours</th>
                <th>Developer Rate</th>
                <th>Designer Rate</th>
                <th>Tester Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.modules.map((module, index) => (
                <tr key={index}>
                  <td>{module.moduleName}</td>
                  <td>{module.developerHours}</td>
                  <td>{module.designerHours}</td>
                  <td>{module.testerHours}</td>
                  <td>{formatCurrency(module.developerRate)}/hr</td>
                  <td>{formatCurrency(module.designerRate)}/hr</td>
                  <td>{formatCurrency(module.testerRate)}/hr</td>
                  <td>{formatCurrency(module.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cost Summary */}
          <div className="cost-summary">
            <h3 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="cost-row">
                  <span>Developer Cost:</span>
                  <span>{formatCurrency(quotation.totalDeveloperCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Designer Cost:</span>
                  <span>{formatCurrency(quotation.totalDesignerCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Tester Cost:</span>
                  <span>{formatCurrency(quotation.totalTesterCost)}</span>
                </div>
                <div className="cost-row border-t pt-2 font-medium">
                  <span>Development Total:</span>
                  <span>{formatCurrency(quotation.totalDevelopmentCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Infrastructure:</span>
                  <span>{formatCurrency(quotation.infrastructureCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Design & Branding:</span>
                  <span>{formatCurrency(quotation.designBrandingCost)}</span>
                </div>
                <div className="cost-row border-t pt-2 font-medium">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
              </div>
              <div>
                <div className="cost-row">
                  <span>Project Management ({quotation.projectManagementPct}%):</span>
                  <span>{formatCurrency(quotation.projectManagementCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Commission ({quotation.commissionPct}%):</span>
                  <span>{formatCurrency(quotation.commissionCost)}</span>
                </div>
                <div className="cost-row">
                  <span>Profit Margin ({quotation.profitMarginPct}%):</span>
                  <span>{formatCurrency(quotation.profitMarginCost)}</span>
                </div>
                <div className="cost-row border-t pt-2">
                  <span>Before GST:</span>
                  <span>{formatCurrency(quotation.subtotal + quotation.projectManagementCost + quotation.commissionCost + quotation.profitMarginCost)}</span>
                </div>
                <div className="cost-row">
                  <span>GST ({quotation.gstPct}%):</span>
                  <span>{formatCurrency(quotation.gstAmount)}</span>
                </div>
                <div className="cost-row total-row">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(quotation.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="section-title">Terms & Conditions</div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Payment terms: 50% advance, 50% on completion</p>
            <p>• Development timeline: As per project requirements</p>
            <p>• Revisions: 2 rounds of revisions included</p>
            <p>• Support: 3 months free support after delivery</p>
            <p>• This quotation is valid for 30 days from the date of issue</p>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Thank you for considering VOXTREE for your project needs.</p>
            <p>For any queries, please contact us at info@voxtree.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPDF;



