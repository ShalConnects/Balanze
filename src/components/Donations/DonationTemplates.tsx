import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, Copy, Heart, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface DonationTemplate {
  id: string;
  name: string;
  amount: number;
  currency: string;
  note: string;
  mode: 'fixed' | 'percent';
  modeValue?: number;
  created_at: string;
  usage_count: number;
}

interface DonationTemplatesProps {
  onUseTemplate: (template: DonationTemplate) => void;
  userCurrency: string;
}

export const DonationTemplates: React.FC<DonationTemplatesProps> = ({
  onUseTemplate,
  userCurrency
}) => {
  const [templates, setTemplates] = useState<DonationTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DonationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: userCurrency,
    note: '',
    mode: 'fixed' as 'fixed' | 'percent',
    modeValue: ''
  });

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('donationTemplates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (error) {

      }
    }
  }, []);

  // Save templates to localStorage
  const saveTemplatesToStorage = (newTemplates: DonationTemplate[]) => {
    localStorage.setItem('donationTemplates', JSON.stringify(newTemplates));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: userCurrency,
      note: '',
      mode: 'fixed',
      modeValue: ''
    });
  };

  // Create new template
  const handleCreateTemplate = () => {
    if (!formData.name.trim() || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTemplate: DonationTemplate = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      note: formData.note.trim(),
      mode: formData.mode,
      modeValue: formData.modeValue ? parseFloat(formData.modeValue) : undefined,
      created_at: new Date().toISOString(),
      usage_count: 0
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    
    resetForm();
    setShowCreateModal(false);
    toast.success('Template created successfully!');
  };

  // Edit template
  const handleEditTemplate = () => {
    if (!editingTemplate || !formData.name.trim() || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedTemplate: DonationTemplate = {
      ...editingTemplate,
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      note: formData.note.trim(),
      mode: formData.mode,
      modeValue: formData.modeValue ? parseFloat(formData.modeValue) : undefined
    };

    const updatedTemplates = templates.map(t => 
      t.id === editingTemplate.id ? updatedTemplate : t
    );
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    
    resetForm();
    setShowEditModal(false);
    setEditingTemplate(null);
    toast.success('Template updated successfully!');
  };

  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    toast.success('Template deleted successfully!');
  };

  // Use template
  const handleUseTemplate = (template: DonationTemplate) => {
    // Increment usage count
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, usage_count: t.usage_count + 1 } : t
    );
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    
    onUseTemplate(template);
    toast.success(`Using template: ${template.name}`);
  };

  // Duplicate template
  const handleDuplicateTemplate = (template: DonationTemplate) => {
    const duplicatedTemplate: DonationTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      usage_count: 0
    };

    const updatedTemplates = [...templates, duplicatedTemplate];
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    toast.success('Template duplicated successfully!');
  };

  // Open edit modal
  const openEditModal = (template: DonationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      amount: template.amount.toString(),
      currency: template.currency,
      note: template.note,
      mode: template.mode,
      modeValue: template.modeValue?.toString() || ''
    });
    setShowEditModal(true);
  };

  // Sort templates by usage count and creation date
  const sortedTemplates = [...templates].sort((a, b) => {
    if (b.usage_count !== a.usage_count) {
      return b.usage_count - a.usage_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Donation Templates</h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {sortedTemplates.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates yet</h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create donation templates to quickly add common donations
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{template.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-3 h-3" />
                    <span>{template.amount} {template.currency}</span>
                    {template.mode === 'percent' && template.modeValue && (
                      <span>({template.modeValue}%)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    title="Use template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Edit template"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                    title="Duplicate template"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {template.note && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {template.note}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Used {template.usage_count} times</span>
                <span>{new Date(template.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Donation Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Charity Donation"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="BDT">BDT</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mode
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value as 'fixed' | 'percent' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </div>

              {formData.mode === 'percent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Percentage Value
                  </label>
                  <input
                    type="number"
                    value={formData.modeValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, modeValue: e.target.value }))}
                    placeholder="5"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add any notes about this donation template..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Template
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Donation Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Charity Donation"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="BDT">BDT</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mode
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value as 'fixed' | 'percent' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </div>

              {formData.mode === 'percent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Percentage Value
                  </label>
                  <input
                    type="number"
                    value={formData.modeValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, modeValue: e.target.value }))}
                    placeholder="5"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add any notes about this donation template..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleEditTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Update Template
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

