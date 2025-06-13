import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5001/api';

function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [pomodoroId, setPomodoroId] = useState(null);
  const intervalRef = useRef(null);

  // タイマーカウントダウン
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // 終了音やアラート
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('ポモドーロタイマー終了！', {
                body: 'お疲れ様でした！',
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
  }, [isRunning, timeLeft]);

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
    return ((25 * 60 - timeLeft) / (25 * 60)) * 100;
  };

  const startPomodoro = async () => {
    try {
      const response = await fetch(`${API_BASE}/pomodoro/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        setPomodoroId(data.pomodoro_id);
        setIsRunning(true);
        setTimeLeft(25 * 60);
      } else {
        alert('ポモドーロ開始に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('ポモドーロ開始エラー:', error);
      alert('サーバーに接続できません');
    }
  };

  const stopPomodoro = async () => {
    try {
      if (pomodoroId) {
        await fetch(`${API_BASE}/pomodoro/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pomodoro_id: pomodoroId
          })
        });
      }
      
      setIsRunning(false);
      setPomodoroId(null);
      setTimeLeft(25 * 60);
    } catch (error) {
      console.error('ポモドーロ停止エラー:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* タイマー表示 */}
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto mb-6">
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
              className="text-pomo-red transition-all duration-1000"
              strokeDasharray={`${Math.PI * 2 * 64}`}
              strokeDashoffset={`${Math.PI * 2 * 64 * (1 - getProgressPercentage() / 100)}`}
            />
          </svg>
          
          {/* 時間表示 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-mono font-bold text-gray-800">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* 開始/停止ボタン */}
        <div className="space-y-4">
          {!isRunning ? (
            <button
              onClick={startPomodoro}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-pomo-red hover:opacity-90 transition-colors"
            >
              開始
            </button>
          ) : (
            <button
              onClick={stopPomodoro}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gray-600 hover:bg-gray-700 transition-colors"
            >
              停止
            </button>
          )}
        </div>

        {/* 説明 */}
        <p className="mt-4 text-sm text-gray-600">
          25分間集中して作業しましょう
        </p>
      </div>
    </div>
  );
}

export default PomodoroTimer;