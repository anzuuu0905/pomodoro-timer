import React from 'react';
import ReactDOM from 'react-dom/client';
import PomodoroTimer from './components/PomodoroTimer';
import TaskManager from './components/TaskManager';
import TodaySummary from './components/TodaySummary';
import TaskTemplates from './components/TaskTemplates';
import DataExport from './components/DataExport';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🍅 PomoHub
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* ポモドーロタイマー */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ポモドーロタイマー</h2>
            <PomodoroTimer />
          </div>

          {/* タスク管理 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">タスク管理</h2>
            <TaskManager />
          </div>

          {/* タスクテンプレート */}
          <div className="lg:col-span-2 xl:col-span-1">
            <TaskTemplates />
          </div>

          {/* 今日のサマリー */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">今日の記録</h2>
            <TodaySummary />
          </div>

          {/* データエクスポート */}
          <div className="xl:col-span-1">
            <DataExport />
          </div>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);