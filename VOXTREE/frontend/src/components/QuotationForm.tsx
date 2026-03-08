import React, { useState, useEffect } from 'react';
import { CreateQuotationData, QuotationModule, Quotation } from '../types';
import { apiClient } from '../services/api';

interface QuotationFormProps {
  quotation?: Quotation;
  onSave: (quotation: Quotation) => void;
  onCancel: () => void;
}

const QuotationForm: React.FC<QuotationFormProps> = ({ quotation, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CreateQuotationData>({
    projectName: '',
    clientName: '',
    platform: 'Web',
    projectType: 'Website',
    description: '',
    developmentModules: [],
    infrastructureCost: 0,
    designBrandingCost: 0,
    projectManagementPct: 0,
    commissionPct: 0,
    profitMarginPct: 0,
    gstPct: 18,
    validUntil: ''
  });

  const [calculations, setCalculations] = useState({
    totalDeveloperCost: 0,
    totalDesignerCost: 0,
    totalTesterCost: 0,
    totalDevelopmentCost: 0,
    subtotal: 0,
    projectManagementCost: 0,
    commissionCost: 0,
    profitMarginCost: 0,
    gstAmount: 0,
    totalAmount: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (quotation) {
      setFormData({
        projectName: quotation.projectName,
        clientName: quotation.clientName,
        platform: quotation.platform,
        projectType: quotation.projectType,
        description: quotation.description || '',
        developmentModules: quotation.modules || [],
        infrastructureCost: quotation.infrastructureCost,
        designBrandingCost: quotation.designBrandingCost,
        projectManagementPct: quotation.projectManagementPct,
        commissionPct: quotation.commissionPct,
        profitMarginPct: quotation.profitMarginPct,
        gstPct: quotation.gstPct,
        validUntil: quotation.validUntil || ''
      });
    }
  }, [quotation]);

  // Calculate totals whenever form data changes
  useEffect(() => {
    calculateTotals();
  }, [formData]);

  const calculateTotals = () => {
    const { developmentModules, infrastructureCost = 0, designBrandingCost = 0, projectManagementPct = 0, commissionPct = 0, profitMarginPct = 0, gstPct = 18 } = formData;

    // Calculate development costs
    const totalDeveloperCost = developmentModules.reduce((sum, module) => sum + (module.developerHours * module.developerRate), 0);
    const totalDesignerCost = developmentModules.reduce((sum, module) => sum + (module.designerHours * module.designerRate), 0);
    const totalTesterCost = developmentModules.reduce((sum, module) => sum + (module.testerHours * module.testerRate), 0);
    const totalDevelopmentCost = totalDeveloperCost + totalDesignerCost + totalTesterCost;

    // Calculate subtotal
    const subtotal = totalDevelopmentCost + infrastructureCost + designBrandingCost;

    // Calculate percentage-based costs
    const projectManagementCost = (subtotal * projectManagementPct) / 100;
    const commissionCost = (subtotal * commissionPct) / 100;
    const profitMarginCost = (subtotal * profitMarginPct) / 100;

    const beforeGstTotal = subtotal + projectManagementCost + commissionCost + profitMarginCost;
    const gstAmount = (beforeGstTotal * gstPct) / 100;
    const totalAmount = beforeGstTotal + gstAmount;

    setCalculations({
      totalDeveloperCost,
      totalDesignerCost,
      totalTesterCost,
      totalDevelopmentCost,
      subtotal,
      projectManagementCost,
      commissionCost,
      profitMarginCost,
      gstAmount,
      totalAmount
    });
  };

  const addModule = () => {
    const newModule: QuotationModule = {
      moduleName: '',
      developerHours: 0,
      designerHours: 0,
      testerHours: 0,
      developerRate: 1000,
      designerRate: 800,
      testerRate: 600,
      total: 0
    };

    setFormData(prev => ({
      ...prev,
      developmentModules: [...prev.developmentModules, newModule]
    }));
  };

  const removeModule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      developmentModules: prev.developmentModules.filter((_, i) => i !== index)
    }));
  };

  const updateModule = (index: number, field: keyof QuotationModule, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      developmentModules: prev.developmentModules.map((module, i) => {
        if (i === index) {
          const updatedModule = { ...module, [field]: value };
          // Recalculate module total
          const total = (updatedModule.developerHours * updatedModule.developerRate) +
                      (updatedModule.designerHours * updatedModule.designerRate) +
                      (updatedModule.testerHours * updatedModule.testerRate);
          return { ...updatedModule, total };
        }
        return module;
      })
    }));
  };

  const handleInputChange = (field: keyof CreateQuotationData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (formData.developmentModules.length === 0) {
      newErrors.developmentModules = 'At least one development module is required';
    }

    formData.developmentModules.forEach((module, index) => {
      if (!module.moduleName.trim()) {
        newErrors[`module_${index}_name`] = 'Module name is required';
      }
      if (module.developerHours < 0 || module.designerHours < 0 || module.testerHours < 0) {
        newErrors[`module_${index}_hours`] = 'Hours cannot be negative';
      }
      if (module.developerRate < 0 || module.designerRate < 0 || module.testerRate < 0) {
        newErrors[`module_${index}_rates`] = 'Rates cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let savedQuotation: Quotation;
      
      if (quotation) {
        savedQuotation = await apiClient.updateQuotation(quotation.id, formData);
      } else {
        savedQuotation = await apiClient.createQuotation(formData);
      }
      
      onSave(savedQuotation);
    } catch (error) {
      console.error('Error saving quotation:', error);
      setErrors({ submit: 'Failed to save quotation. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {quotation ? 'Edit Quotation' : 'Create New Quotation'}
        </h2>
        <p className="text-gray-600 mt-1">
          Create a detailed project quotation with cost breakdown
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.projectName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter project name"
              />
              {errors.projectName && (
                <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clientName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter client name"
              />
              {errors.clientName && (
                <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform *
              </label>
              <select
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Web">Web</option>
                <option value="Android">Android</option>
                <option value="iOS">iOS</option>
                <option value="All">All</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type *
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => handleInputChange('projectType', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Website">Website</option>
                <option value="Mobile App">Mobile App</option>
                <option value="CRM">CRM</option>
                <option value="LMS">LMS</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
              />
            </div>
          </div>
        </div>

        {/* Development Modules */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Development Modules</h3>
            <button
              type="button"
              onClick={addModule}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Module
            </button>
          </div>

          {errors.developmentModules && (
            <p className="text-red-500 text-sm mb-4">{errors.developmentModules}</p>
          )}

          <div className="space-y-4">
            {formData.developmentModules.map((module, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Module {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeModule(index)}
                    className="text-red-600 hover:text-red-800 focus:outline-none"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module Name *
                    </label>
                    <input
                      type="text"
                      value={module.moduleName}
                      onChange={(e) => updateModule(index, 'moduleName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`module_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., User Authentication"
                    />
                    {errors[`module_${index}_name`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`module_${index}_name`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Developer Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={module.developerHours}
                      onChange={(e) => updateModule(index, 'developerHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designer Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={module.designerHours}
                      onChange={(e) => updateModule(index, 'designerHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tester Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={module.testerHours}
                      onChange={(e) => updateModule(index, 'testerHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Developer Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={module.developerRate}
                      onChange={(e) => updateModule(index, 'developerRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designer Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={module.designerRate}
                      onChange={(e) => updateModule(index, 'designerRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tester Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={module.testerRate}
                      onChange={(e) => updateModule(index, 'testerRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Cost
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 font-medium">
                      {formatCurrency(module.total)}
                    </div>
                  </div>
                </div>

                {errors[`module_${index}_hours`] && (
                  <p className="text-red-500 text-xs mt-2">{errors[`module_${index}_hours`]}</p>
                )}
                {errors[`module_${index}_rates`] && (
                  <p className="text-red-500 text-xs mt-2">{errors[`module_${index}_rates`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Costs */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Costs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Infrastructure Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.infrastructureCost || 0}
                onChange={(e) => handleInputChange('infrastructureCost', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hosting, domain, API costs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Design & Branding Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.designBrandingCost || 0}
                onChange={(e) => handleInputChange('designBrandingCost', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Logo, UI kit, branding"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Management (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.projectManagementPct || 0}
                onChange={(e) => handleInputChange('projectManagementPct', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Overhead percentage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commissionPct || 0}
                onChange={(e) => handleInputChange('commissionPct', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Platform fee percentage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profit Margin (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.profitMarginPct || 0}
                onChange={(e) => handleInputChange('profitMarginPct', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Profit margin percentage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.gstPct || 18}
                onChange={(e) => handleInputChange('gstPct', parseFloat(e.target.value) || 18)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="GST percentage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil || ''}
                onChange={(e) => handleInputChange('validUntil', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Developer Cost:</span>
                <span className="font-medium">{formatCurrency(calculations.totalDeveloperCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Designer Cost:</span>
                <span className="font-medium">{formatCurrency(calculations.totalDesignerCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tester Cost:</span>
                <span className="font-medium">{formatCurrency(calculations.totalTesterCost)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">Development Total:</span>
                <span className="font-medium">{formatCurrency(calculations.totalDevelopmentCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Infrastructure:</span>
                <span className="font-medium">{formatCurrency(formData.infrastructureCost || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Design & Branding:</span>
                <span className="font-medium">{formatCurrency(formData.designBrandingCost || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Project Management:</span>
                <span className="font-medium">{formatCurrency(calculations.projectManagementCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission:</span>
                <span className="font-medium">{formatCurrency(calculations.commissionCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit Margin:</span>
                <span className="font-medium">{formatCurrency(calculations.profitMarginCost)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Before GST:</span>
                <span className="font-medium">{formatCurrency(calculations.subtotal + calculations.projectManagementCost + calculations.commissionCost + calculations.profitMarginCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST ({formData.gstPct || 18}%):</span>
                <span className="font-medium">{formatCurrency(calculations.gstAmount)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-blue-500 pt-2">
                <span className="text-gray-900 font-bold text-lg">Total Amount:</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(calculations.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Preview Table */}
        {showPreview && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Preview</h3>
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
                      {formatCurrency(calculations.totalDevelopmentCost)}
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
                      {formatCurrency(formData.infrastructureCost || 0)}
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
                      {formatCurrency(formData.designBrandingCost || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Management Overhead
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formData.projectManagementPct || 0}% of subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(calculations.projectManagementCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Commission
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formData.commissionPct || 0}% of subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(calculations.commissionCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Profit
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formData.profitMarginPct || 0}% of subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(calculations.profitMarginCost)}
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
                      {formatCurrency(calculations.subtotal + calculations.projectManagementCost + calculations.commissionCost + calculations.profitMarginCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      GST ({formData.gstPct || 18}%)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Tax on subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(calculations.gstAmount)}
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
                      {formatCurrency(calculations.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (quotation ? 'Update Quotation' : 'Create Quotation')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
