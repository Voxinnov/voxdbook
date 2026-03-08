import React, { useState, useEffect } from 'react';
import { Quotation, QuotationModule, CreateQuotationData, UpdateQuotationData } from '../types';
import { apiClient } from '../services/api';

interface QuotationFormTabsProps {
  quotation?: Quotation;
  onSave: (quotation: Quotation) => void;
  onCancel: () => void;
}


const QuotationFormTabs: React.FC<QuotationFormTabsProps> = ({
  quotation,
  onSave,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'modules' | 'summary'>('details');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateQuotationData>({
    projectName: '',
    clientName: '',
    platform: 'Web',
    projectType: 'Website',
    description: '',
    developmentModules: [
      {
        moduleName: '',
        developerHours: 0,
        designerHours: 0,
        testerHours: 0,
        developerRate: 1000,
        designerRate: 800,
        testerRate: 600,
        total: 0
      }
    ],
    infrastructureCost: 0,
    designBrandingCost: 0,
    projectManagementPct: 10,
    commissionPct: 5,
    profitMarginPct: 20,
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

  useEffect(() => {
    if (quotation) {
      setFormData({
        projectName: quotation.projectName,
        clientName: quotation.clientName,
        platform: quotation.platform,
        projectType: quotation.projectType,
        description: quotation.description || '',
        developmentModules: quotation.modules.map(module => ({
          moduleName: module.moduleName,
          developerHours: module.developerHours,
          designerHours: module.designerHours,
          testerHours: module.testerHours,
          developerRate: module.developerRate,
          designerRate: module.designerRate,
          testerRate: module.testerRate,
          total: module.total
        })),
        infrastructureCost: quotation.infrastructureCost,
        designBrandingCost: quotation.designBrandingCost,
        projectManagementPct: quotation.projectManagementPct,
        commissionPct: quotation.commissionPct,
        profitMarginPct: quotation.profitMarginPct,
        gstPct: quotation.gstPct,
        validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : ''
      });
    }
  }, [quotation]);

  // Real-time calculations
  useEffect(() => {
    calculateCosts();
  }, [formData]);

  const calculateCosts = () => {
    const modules = formData.developmentModules;
    
    const totalDeveloperCost = modules.reduce((sum, module) => 
      sum + (module.developerHours * module.developerRate), 0);
    
    const totalDesignerCost = modules.reduce((sum, module) => 
      sum + (module.designerHours * module.designerRate), 0);
    
    const totalTesterCost = modules.reduce((sum, module) => 
      sum + (module.testerHours * module.testerRate), 0);
    
    const totalDevelopmentCost = totalDeveloperCost + totalDesignerCost + totalTesterCost;
    
    const subtotal = totalDevelopmentCost + (formData.infrastructureCost || 0) + (formData.designBrandingCost || 0);
    
    const projectManagementCost = (subtotal * (formData.projectManagementPct || 0)) / 100;
    const commissionCost = (subtotal * (formData.commissionPct || 0)) / 100;
    const profitMarginCost = (subtotal * (formData.profitMarginPct || 0)) / 100;
    
    const subtotalWithOverheads = subtotal + projectManagementCost + commissionCost + profitMarginCost;
    const gstAmount = (subtotalWithOverheads * (formData.gstPct || 18)) / 100;
    const totalAmount = subtotalWithOverheads + gstAmount;

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleInputChange = (field: keyof CreateQuotationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleModuleChange = (index: number, field: keyof QuotationModule, value: any) => {
    const updatedModules = [...formData.developmentModules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    
    // Recalculate module total
    const module = updatedModules[index];
    const total = (module.developerHours * module.developerRate) + 
                  (module.designerHours * module.designerRate) + 
                  (module.testerHours * module.testerRate);
    updatedModules[index].total = total;
    
    handleInputChange('developmentModules', updatedModules);
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
    handleInputChange('developmentModules', [...formData.developmentModules, newModule]);
  };

  const removeModule = (index: number) => {
    if (formData.developmentModules.length > 1) {
      const updatedModules = formData.developmentModules.filter((_, i) => i !== index);
      handleInputChange('developmentModules', updatedModules);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    if (formData.developmentModules.some(module => !module.moduleName.trim())) {
      newErrors.modules = 'All modules must have a name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrors(prev => ({ ...prev, submit: 'Please fix the errors above' }));
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let savedQuotation: Quotation;
      
      if (quotation) {
        const updateData: UpdateQuotationData = {
          projectName: formData.projectName,
          clientName: formData.clientName,
          platform: formData.platform,
          projectType: formData.projectType,
          description: formData.description,
          developmentModules: formData.developmentModules,
          infrastructureCost: formData.infrastructureCost,
          designBrandingCost: formData.designBrandingCost,
          projectManagementPct: formData.projectManagementPct,
          commissionPct: formData.commissionPct,
          profitMarginPct: formData.profitMarginPct,
          gstPct: formData.gstPct,
          validUntil: formData.validUntil
        };
        savedQuotation = await apiClient.updateQuotation(quotation.id, updateData);
      } else {
        savedQuotation = await apiClient.createQuotation(formData);
      }
      
      onSave(savedQuotation);
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      setErrors({ submit: error.response?.data?.error || 'Failed to save quotation' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'details', name: 'Details', icon: '📋' },
    { id: 'modules', name: 'Modules', icon: '⚙️' },
    { id: 'summary', name: 'Summary & Preview', icon: '📊' }
  ] as const;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
              
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
                      errors.projectName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter project name"
                  />
                  {errors.projectName && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
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
                      errors.clientName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter client name"
                  />
                  {errors.clientName && (
                    <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => handleInputChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Web">Web</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                    <option value="All">All Platforms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => handleInputChange('projectType', e.target.value)}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Development Modules</h3>
                <button
                  type="button"
                  onClick={addModule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Module
                </button>
              </div>

              {errors.modules && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{errors.modules}</p>
                </div>
              )}

              <div className="space-y-4">
                {formData.developmentModules.map((module, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">Module {index + 1}</h4>
                      {formData.developmentModules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModule(index)}
                          className="text-red-600 hover:text-red-800 focus:outline-none"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Module Name
                        </label>
                        <input
                          type="text"
                          value={module.moduleName}
                          onChange={(e) => handleModuleChange(index, 'moduleName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., User Authentication"
                        />
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
                          onChange={(e) => handleModuleChange(index, 'developerHours', parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => handleModuleChange(index, 'designerHours', parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => handleModuleChange(index, 'testerHours', parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => handleModuleChange(index, 'developerRate', parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => handleModuleChange(index, 'designerRate', parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => handleModuleChange(index, 'testerRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Cost
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right font-medium">
                          {formatCurrency(module.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary & Preview Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown & Additional Costs</h3>
              
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
                    placeholder="Hosting, domain, etc."
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
                    placeholder="Logo, UI Kit, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Management & Overhead (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.projectManagementPct || 0}
                    onChange={(e) => handleInputChange('projectManagementPct', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission or Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commissionPct || 0}
                    onChange={(e) => handleInputChange('commissionPct', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  />
                </div>
              </div>

              {/* Live Cost Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Cost Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Development Cost:</span>
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Management Overhead:</span>
                      <span className="font-medium">{formatCurrency(calculations.projectManagementCost)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-medium">{formatCurrency(calculations.commissionCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className="font-medium">{formatCurrency(calculations.profitMarginCost)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 font-medium">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(calculations.subtotal + calculations.projectManagementCost + calculations.commissionCost + calculations.profitMarginCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST ({formData.gstPct}%):</span>
                      <span className="font-medium">{formatCurrency(calculations.gstAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-blue-500 pt-2">
                      <span className="text-blue-900 font-bold text-lg">Total Amount:</span>
                      <span className="text-blue-900 font-bold text-lg">{formatCurrency(calculations.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'details' ? 'modules' : activeTab === 'modules' ? 'summary' : 'details')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {activeTab === 'details' ? 'Next: Modules' : activeTab === 'modules' ? 'Next: Summary' : 'Back to Details'}
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
    </div>
  );
};

export default QuotationFormTabs;
