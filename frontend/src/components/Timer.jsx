import React, { useState, useEffect, useRef } from 'react';
import VoiceInput from './VoiceInput';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

function Timer({ type }) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(type === 'pomo' ? 25 * 60 : 60 * 60);
  const [initialTime, setInitialTime] = useState(type === 'pomo' ? 25 * 60 : 60 * 60);
  const [taskName, setTaskName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [note, setNote] = useState('');
  const intervalRef = useRef(null);

  const title = type === 'pomo' ? 'ポモドーロタイマー' : 'タスクタイマー';
  const emoji = type === 'pomo' ? '🍅' : '⏰';
  const primaryColor = type === 'pomo' ? 'pomo-red' : 'pomo-blue';

  // タイマーカウントダウン
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // 終了音やアラート
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`${title}終了！`, {
                body: taskName || '作業完了',
                icon: '/pwa-192x192.png'
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, title, taskName]);

  // 通知許可をリクエスト
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((initialTime - timeLeft) / initialTime) * 100;
  };

  const startTimer = async () => {
    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          task: taskName
        })
      });

      const data = await response.json();
      if (data.success) {
        setSessionId(data.session_id);
        setIsRunning(true);
        setInitialTime(data.duration_minutes * 60);
        setTimeLeft(data.duration_minutes * 60);
      } else {
        alert('タイマー開始に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('タイマー開始エラー:', error);
      alert('サーバーに接続できません');
    }
  };

  const stopTimer = async () => {
    try {
      if (sessionId) {
        await fetch(`${API_BASE}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId
          })
        });
      }
      
      setIsRunning(false);
      setSessionId(null);
      setTimeLeft(type === 'pomo' ? 25 * 60 : 60 * 60);
      setInitialTime(type === 'pomo' ? 25 * 60 : 60 * 60);
    } catch (error) {
      console.error('タイマー停止エラー:', error);
    }
  };

  const addNote = async () => {
    if (!note.trim() || !sessionId) return;

    try {
      const response = await fetch(`${API_BASE}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
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

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {emoji} {title}
        </h2>
        {type === 'pomo' && (
          <p className="text-gray-600 text-sm">25分集中 + 5分休憩</p>
        )}
      </div>

      {/* タイマー表示 */}
      <div className="text-center mb-8">
        <div className="relative w-48 h-48 mx-auto mb-4">
          {/* プログレスバー（円形） */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={`text-${primaryColor} transition-all duration-1000`}
              strokeDasharray={`${Math.PI * 2 * 64}`}
              strokeDashoffset={`${Math.PI * 2 * 64 * (1 - getProgressPercentage() / 100)}`}
            />
          </svg>
          
          {/* 時間表示 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-mono font-bold text-gray-800">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* 開始/停止ボタン */}
        <div className="space-y-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={!taskName.trim()}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white 
                ${taskName.trim() 
                  ? `bg-${primaryColor} hover:opacity-90` 
                  : 'bg-gray-400 cursor-not-allowed'
                } transition-colors`}
            >
              開始
            </button>
          ) : (
            <button
              onClick={stopTimer}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              停止
            </button>
          )}
        </div>
      </div>

      {/* タスク名入力 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          タスク名
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="今日のタスクを入力..."
            disabled={isRunning}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          <VoiceInput onResult={handleVoiceResult} disabled={isRunning} />
        </div>
      </div>

      {/* メモ入力（実行中のみ） */}
      {isRunning && sessionId && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メモ
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="作業メモを入力..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      )}

      {/* 統計情報の表示エリア（今後拡張用） */}
      <div className="text-center text-sm text-gray-500">
        {isRunning ? (
          <p>作業中... 集中して頑張りましょう！</p>
        ) : (
          <p>タスクを入力して開始ボタンを押してください</p>
        )}
      </div>
    </div>
  );
}

export default Timer;