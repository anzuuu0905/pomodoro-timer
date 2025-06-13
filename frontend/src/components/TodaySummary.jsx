import React, { useState, useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

function TodaySummary() {
  const [summary, setSummary] = useState({ pomodoros: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaySummary();
    // 30秒ごとに自動更新
    const interval = setInterval(fetchTodaySummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodaySummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/today`);
      const data = await response.json();
      setSummary(data);
      setLoading(false);
    } catch (error) {
      console.error('サマリー取得エラー:', error);
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '進行中';
    const startTime = new Date(start);
    const endTime = new Date(end);
    const duration = Math.floor((endTime - startTime) / 1000 / 60); // 分単位
    
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}時間${minutes}分`;
    }
    return `${duration}分`;
  };

  const getCompletedPomodoros = () => {
    return summary.pomodoros.filter(p => p.completed).length;
  };

  const getTotalPomodoroTime = () => {
    return getCompletedPomodoros() * 25;
  };

  const getTotalTaskTime = () => {
    return summary.tasks.reduce((total, task) => {
      if (task.start_at && task.end_at) {
        const duration = new Date(task.end_at) - new Date(task.start_at);
        return total + Math.floor(duration / 1000 / 60);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今日の統計</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-pomo-red">{getCompletedPomodoros()}</p>
            <p className="text-sm text-gray-600">ポモドーロ</p>
            <p className="text-xs text-gray-500">{getTotalPomodoroTime()}分</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-500">{summary.tasks.length}</p>
            <p className="text-sm text-gray-600">タスク</p>
            <p className="text-xs text-gray-500">{getTotalTaskTime()}分</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">
              {Math.floor((getTotalPomodoroTime() + getTotalTaskTime()) / 60)}
            </p>
            <p className="text-sm text-gray-600">総作業時間</p>
            <p className="text-xs text-gray-500">時間</p>
          </div>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今日のタスク</h3>
        {summary.tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">まだタスクがありません</p>
        ) : (
          <div className="space-y-3">
            {summary.tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {task.category_name && (
                      <div className="flex items-center mb-1">
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: task.category_color || '#3b82f6' }}
                        ></span>
                        <span className="text-xs text-gray-500">{task.category_name}</span>
                      </div>
                    )}
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatTime(task.start_at)} - {task.end_at ? formatTime(task.end_at) : '進行中'}
                      <span className="ml-2 text-gray-500">
                        ({calculateDuration(task.start_at, task.end_at)})
                      </span>
                    </p>
                    {/* メモ表示 */}
                    {task.notes && task.notes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">メモ:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {task.notes.map((note) => (
                            <li key={note.id} className="ml-2">• {note.body}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.status === 'active' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {task.status === 'active' ? '進行中' : '完了'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ポモドーロ履歴 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ポモドーロ履歴</h3>
        {summary.pomodoros.length === 0 ? (
          <p className="text-gray-500 text-center py-4">まだポモドーロがありません</p>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {summary.pomodoros.map((pomo) => (
              <div
                key={pomo.id}
                className={`aspect-square rounded-lg flex items-center justify-center ${
                  pomo.completed 
                    ? 'bg-pomo-red text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
                title={`${formatTime(pomo.start_at)} - ${pomo.end_at ? formatTime(pomo.end_at) : '進行中'}`}
              >
                🍅
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TodaySummary;