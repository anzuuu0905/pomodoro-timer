import React, { useState, useEffect } from 'react';
import VoiceInput from './VoiceInput';

const API_BASE = 'http://localhost:5001/api';

function TaskManager() {
  const [taskName, setTaskName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [note, setNote] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // カテゴリと現在のタスクを取得
  useEffect(() => {
    fetchCategories();
    fetchCurrentTask();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
    }
  };

  const fetchCurrentTask = async () => {
    try {
      const response = await fetch(`${API_BASE}/task/current`);
      const data = await response.json();
      
      if (data.success && data.task) {
        setCurrentTask(data.task);
      } else {
        setCurrentTask(null);
      }
    } catch (error) {
      console.error('現在のタスク取得エラー:', error);
    }
  };

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          color: getRandomColor()
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        fetchCategories(); // カテゴリ一覧を再取得
      } else {
        alert('カテゴリ追加に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
      alert('サーバーに接続できません');
    }
  };

  const getRandomColor = () => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const startTask = async () => {
    if (!taskName.trim()) {
      alert('タスク名を入力してください');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/task/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskName,
          category_id: selectedCategory || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentTask({
          id: data.task_id,
          name: data.task_name,
          start_at: data.start_time,
          category_id: selectedCategory,
          category_name: categories.find(c => c.id == selectedCategory)?.name
        });
        setTaskName('');
        setSelectedCategory('');
      } else {
        alert('タスク開始に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('タスク開始エラー:', error);
      alert('サーバーに接続できません');
    }
  };

  const stopTask = async () => {
    try {
      const response = await fetch(`${API_BASE}/task/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      if (data.success) {
        setCurrentTask(null);
      } else {
        alert('タスク終了に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('タスク終了エラー:', error);
      alert('サーバーに接続できません');
    }
  };

  const addNote = async () => {
    if (!note.trim() || !currentTask) return;

    try {
      const response = await fetch(`${API_BASE}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: note
        })
      });

      const data = await response.json();
      if (data.success) {
        setNote('');
        alert('メモを追加しました');
      } else {
        alert('メモ追加に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('メモ追加エラー:', error);
      alert('サーバーに接続できません');
    }
  };

  const handleVoiceResult = (transcript) => {
    setTaskName(transcript);
  };

  const formatStartTime = (startTime) => {
    const date = new Date(startTime);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* タスク入力エリア */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* カテゴリ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ
          </label>
          <div className="flex space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={currentTask !== null}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">カテゴリを選択...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
              disabled={currentTask !== null}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              追加
            </button>
          </div>

          {/* 新カテゴリ入力 */}
          {showNewCategoryInput && (
            <div className="mt-2 flex space-x-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="新しいカテゴリ名..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addNewCategory()}
              />
              <button
                onClick={addNewCategory}
                disabled={!newCategoryName.trim()}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                作成
              </button>
            </div>
          )}
        </div>

        {/* タスク名入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タスク名
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="タスクを入力..."
              disabled={currentTask !== null}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && startTask()}
            />
            <VoiceInput onResult={handleVoiceResult} disabled={currentTask !== null} />
          </div>
        </div>

        {/* タスク開始/終了ボタン */}
        <div>
          {!currentTask ? (
            <button
              onClick={startTask}
              disabled={!taskName.trim()}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white 
                ${taskName.trim() 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-400 cursor-not-allowed'
                } transition-colors`}
            >
              タスク開始
            </button>
          ) : (
            <button
              onClick={stopTask}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors"
            >
              タスク終了
            </button>
          )}
        </div>
      </div>

      {/* 現在のタスク表示 */}
      {currentTask && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">現在のタスク</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            {currentTask.category_name && (
              <div className="flex items-center mb-2">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: categories.find(c => c.id == currentTask.category_id)?.color || '#3b82f6' }}
                ></span>
                <span className="text-sm text-gray-600">{currentTask.category_name}</span>
              </div>
            )}
            <p className="font-medium text-gray-900">{currentTask.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              開始時刻: {formatStartTime(currentTask.start_at)}〜
            </p>
          </div>

          {/* メモ入力 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業メモ
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="メモを入力..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addNote()}
              />
              <button
                onClick={addNote}
                disabled={!note.trim()}
                className={`px-4 py-2 rounded-md font-medium text-white
                  ${note.trim() 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-400 cursor-not-allowed'
                  } transition-colors`}
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskManager;