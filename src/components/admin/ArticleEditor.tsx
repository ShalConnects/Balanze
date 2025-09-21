// src/components/admin/ArticleEditor.tsx
import { useState } from 'react';
import { KBArticle, TableOfContentsItem, ARTICLE_SECTIONS, TOC_TEMPLATES, buildArticleContent, getTOCByTemplate } from '../../data/articles';

interface ArticleEditorProps {
  article: KBArticle;
  onSave: (updatedArticle: KBArticle) => void;
}

export default function ArticleEditor({ article, onSave }: ArticleEditorProps) {
  const [editedArticle, setEditedArticle] = useState<KBArticle>(article);
  const [activeTab, setActiveTab] = useState<'basic' | 'toc' | 'content'>('basic');

  const handleSave = () => {
    onSave(editedArticle);
  };

  const handleTOCChange = (index: number, field: keyof TableOfContentsItem, value: any) => {
    const newTOC = [...(editedArticle.tableOfContents || [])];
    newTOC[index] = { ...newTOC[index], [field]: value };
    setEditedArticle({ ...editedArticle, tableOfContents: newTOC });
  };

  const addTOCItem = () => {
    const newTOC = [...(editedArticle.tableOfContents || [])];
    newTOC.push({
      id: `new-section-${Date.now()}`,
      title: 'New Section',
      level: 1
    });
    setEditedArticle({ ...editedArticle, tableOfContents: newTOC });
  };

  const removeTOCItem = (index: number) => {
    const newTOC = [...(editedArticle.tableOfContents || [])];
    newTOC.splice(index, 1);
    setEditedArticle({ ...editedArticle, tableOfContents: newTOC });
  };

  const applyTOCTemplate = (templateName: keyof typeof TOC_TEMPLATES) => {
    setEditedArticle({
      ...editedArticle,
      tableOfContents: getTOCByTemplate(templateName)
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'toc', label: 'Table of Contents' },
              { id: 'content', label: 'Content' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Article Title
                </label>
                <input
                  type="text"
                  value={editedArticle.title}
                  onChange={(e) => setEditedArticle({ ...editedArticle, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editedArticle.description}
                  onChange={(e) => setEditedArticle({ ...editedArticle, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editedArticle.category}
                    onChange={(e) => setEditedArticle({ ...editedArticle, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={editedArticle.difficulty}
                    onChange={(e) => setEditedArticle({ ...editedArticle, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editedArticle.tags.join(', ')}
                  onChange={(e) => setEditedArticle({ ...editedArticle, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'toc' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Table of Contents</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => applyTOCTemplate('gettingStarted')}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Getting Started Template
                  </button>
                  <button
                    onClick={() => applyTOCTemplate('plansAndPricing')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Plans & Pricing Template
                  </button>
                  <button
                    onClick={addTOCItem}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(editedArticle.tableOfContents || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleTOCChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Section title"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="text"
                        value={item.id}
                        onChange={(e) => handleTOCChange(index, 'id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        placeholder="ID"
                      />
                    </div>
                    <div className="w-16">
                      <select
                        value={item.level}
                        onChange={(e) => handleTOCChange(index, 'level', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={1}>Level 1</option>
                        <option value={2}>Level 2</option>
                        <option value={3}>Level 3</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeTOCItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Article Content (HTML)
                </label>
                <textarea
                  value={editedArticle.content}
                  onChange={(e) => setEditedArticle({ ...editedArticle, content: e.target.value })}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
