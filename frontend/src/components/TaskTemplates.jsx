import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TaskTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category_id: ''
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3b82f6'
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/task-templates`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('テンプレート取得エラー:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.name.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/task-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate)
      });

      const data = await response.json();
      if (data.success) {
        setNewTemplate({ name: '', category_id: '' });
        setShowAddForm(false);
        fetchTemplates();
      }
    } catch (error) {
      console.error('テンプレート追加エラー:', error);
    }
  };

  const addCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory)
      });

      const data = await response.json();
      if (data.success) {
        setNewCategory({ name: '', color: '#3b82f6' });
        setShowCategoryForm(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      const response = await fetch(`${API_BASE}/api/task-templates/${templateId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('テンプレート削除エラー:', error);
    }
  };

  const startTaskFromTemplate = async (template) => {
    try {
      const response = await fetch(`${API_BASE}/api/task/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: template.name,
          category_id: template.category_id,
          template_id: template.id
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`タスク「${template.name}」を開始しました`);
      }
    } catch (error) {
      console.error('タスク開始エラー:', error);
    }
  };

  // フィルタリングされたテンプレート
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category_id == selectedCategory);

  // カテゴリ別にグループ化されたテンプレート
  const groupedTemplates = categories.reduce((acc, category) => {
    acc[category.id] = templates.filter(template => template.category_id == category.id);
    return acc;
  }, {});
  
  // カテゴリなしのテンプレート
  const uncategorizedTemplates = templates.filter(template => !template.category_id);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">タスクテンプレート</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            {showCategoryForm ? 'キャンセル' : 'カテゴリ追加'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            {showAddForm ? 'キャンセル' : 'テンプレート追加'}
          </button>
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリで絞り込み
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">すべて表示</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* カテゴリ追加フォーム */}
      {showCategoryForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-blue-50">
          <h3 className="text-lg font-medium text-gray-800 mb-3">新しいカテゴリを追加</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ名
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：営業、開発、企画"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ色
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{newCategory.color}</span>
            </div>
          </div>

          <button
            onClick={addCategory}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            カテゴリを追加
          </button>
        </div>
      )}

      {/* テンプレート追加フォーム */}
      {showAddForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-green-50">
          <h3 className="text-lg font-medium text-gray-800 mb-3">新しいテンプレートを追加</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タスク名
            </label>
            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="タスク名を入力"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              value={newTemplate.category_id}
              onChange={(e) => setNewTemplate({...newTemplate, category_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">カテゴリを選択（任意）</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={addTemplate}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            テンプレートを追加
          </button>
        </div>
      )}

      {/* カテゴリ別グループ表示 */}
      {selectedCategory === 'all' ? (
        <div className="space-y-6">
          {/* カテゴリなしのテンプレート */}
          {uncategorizedTemplates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                カテゴリなし
              </h3>
              <div className="space-y-2">
                {uncategorizedTemplates.map(template => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{template.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startTaskFromTemplate(template)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        開始
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* カテゴリ別のテンプレート */}
          {categories.map(category => {
            const categoryTemplates = groupedTemplates[category.id] || [];
            if (categoryTemplates.length === 0) return null;

            return (
              <div key={category.id}>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  {category.name} ({categoryTemplates.length})
                </h3>
                <div className="space-y-2">
                  {categoryTemplates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{template.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startTaskFromTemplate(template)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          開始
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {templates.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              登録されたタスクテンプレートがありません
            </p>
          )}
        </div>
      ) : (
        /* フィルタ表示 */
        <div className="space-y-2">
          {filteredTemplates.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              このカテゴリにはテンプレートがありません
            </p>
          ) : (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">{template.name}</span>
                    {template.category_name && (
                      <span
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: template.category_color }}
                      >
                        {template.category_name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => startTaskFromTemplate(template)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    開始
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TaskTemplates;