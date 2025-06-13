import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5001';

const TaskTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category_id: ''
  });

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">タスクテンプレート</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          {showAddForm ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
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
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            追加
          </button>
        </div>
      )}

      <div className="space-y-2">
        {templates.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            登録されたタスクテンプレートがありません
          </p>
        ) : (
          templates.map(template => (
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
    </div>
  );
};

export default TaskTemplates;