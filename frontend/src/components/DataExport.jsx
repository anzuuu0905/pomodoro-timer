import React, { useState } from 'react';

const API_BASE = 'http://localhost:5001';

const DataExport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        date: selectedDate
      });
      
      const response = await fetch(`${API_BASE}/api/export/data?${params}`);
      
      if (exportFormat === 'json') {
        const data = await response.json();
        if (data.success) {
          // JSONファイルとしてダウンロード
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pomo-hub-data-${selectedDate}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('データをJSONファイルでエクスポートしました');
        } else {
          alert('データのエクスポートに失敗しました');
        }
      } else {
        // CSV/Markdownの場合はテキストファイルとしてダウンロード
        const text = await response.text();
        const mimeType = exportFormat === 'csv' ? 'text/csv' : 'text/markdown';
        const extension = exportFormat === 'csv' ? 'csv' : 'md';
        
        const blob = new Blob([text], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pomo-hub-data-${selectedDate}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`データを${exportFormat.toUpperCase()}ファイルでエクスポートしました`);
      }
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポート中にエラーが発生しました');
    } finally {
      setIsExporting(false);
    }
  };

  const openDatabaseLocation = () => {
    alert(`データベースファイルの場所:\n/backend/pomo_hub.db\n\nSQLiteブラウザなどのツールで直接開くことができます。`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">データエクスポート</h2>
      
      <div className="space-y-4">
        {/* 日付選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            エクスポートする日付
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* フォーマット選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            エクスポート形式
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="json">JSON（データ処理用）</option>
            <option value="csv">CSV（表計算ソフト用）</option>
            <option value="markdown">Markdown（Obsidian用）</option>
          </select>
        </div>

        {/* エクスポートボタン */}
        <button
          onClick={exportData}
          disabled={isExporting}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
            isExporting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isExporting ? 'エクスポート中...' : 'データをエクスポート'}
        </button>

        {/* データベース情報 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-2">データ保存場所</h3>
          <p className="text-sm text-gray-600 mb-3">
            すべてのデータはSQLiteデータベースに保存されています：
          </p>
          <code className="block text-sm bg-white p-2 rounded border text-gray-800">
            /backend/pomo_hub.db
          </code>
          <button
            onClick={openDatabaseLocation}
            className="mt-3 text-blue-500 hover:text-blue-600 text-sm underline"
          >
            データベースファイルについて
          </button>
        </div>

        {/* データ構造説明 */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-2">保存されるデータ</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>ポモドーロ記録</strong>: 25分タイマーの開始・終了時刻</li>
            <li>• <strong>タスク記録</strong>: 作業内容と時間計測</li>
            <li>• <strong>カテゴリ</strong>: タスクの分類情報</li>
            <li>• <strong>テンプレート</strong>: よく使うタスクの事前登録</li>
            <li>• <strong>メモ</strong>: タスクに関する記録</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataExport;