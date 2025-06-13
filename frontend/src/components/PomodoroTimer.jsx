import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../utils/notification';

const API_BASE = 'http://localhost:5001/api';

function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [pomodoroId, setPomodoroId] = useState(null);
  const [isBreak, setIsBreak] = useState(false);
  const [isAutoCycle, setIsAutoCycle] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef(null);

  // タイマー終了処理
  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (isBreak) {
      // 休憩終了 → 作業開始
      notificationService.notify('☕ 休憩終了！', '作業時間を開始しましょう', 'pomodoro');
      setIsBreak(false);
      if (isAutoCycle) {
        setTimeout(() => {
          setTimeLeft(25 * 60);
          startPomodoro();
        }, 2000);
      } else {
        setTimeLeft(25 * 60);
      }
    } else {
      // 作業終了 → 休憩開始
      notificationService.notifyPomodoroComplete();
      setCycleCount(prev => prev + 1);
      
      // バックエンドのポモドーロ終了処理
      if (pomodoroId) {
        try {
          await fetch(`${API_BASE}/pomodoro/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pomodoro_id: pomodoroId })
          });
          setPomodoroId(null);
        } catch (error) {
          console.error('ポモドーロ終了処理エラー:', error);
        }
      }
      
      setIsBreak(true);
      if (isAutoCycle) {
        setTimeout(() => {
          setTimeLeft(5 * 60);
          setIsRunning(true);
        }, 2000);
      } else {
        setTimeLeft(5 * 60);
      }
    }
  };

  // タイマーカウントダウン
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, isBreak, isAutoCycle, pomodoroId]);

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
    const totalTime = isBreak ? 5 * 60 : 25 * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const stopAllTimers = () => {
    setIsRunning(false);
    setIsAutoCycle(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
    setPomodoroId(null);
    setCycleCount(0);
    clearInterval(intervalRef.current);
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

        {/* 状態表示 */}
        <div className="mb-4 text-center">
          <div className="text-lg font-semibold text-gray-700">
            {isBreak ? '🧘 休憩時間' : '🍅 作業時間'}
          </div>
          {cycleCount > 0 && (
            <div className="text-sm text-gray-500">
              完了サイクル: {cycleCount}
            </div>
          )}
        </div>

        {/* 自動サイクル切り替え */}
        <div className="mb-4 flex items-center justify-center">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoCycle}
              onChange={(e) => setIsAutoCycle(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">自動サイクル</span>
          </label>
        </div>

        {/* 開始/停止ボタン */}
        <div className="space-y-3">
          {!isRunning ? (
            <button
              onClick={startPomodoro}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-pomo-red hover:opacity-90 transition-colors"
            >
              {isBreak ? '休憩開始' : 'ポモドーロ開始'}
            </button>
          ) : (
            <button
              onClick={stopPomodoro}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gray-600 hover:bg-gray-700 transition-colors"
            >
              一時停止
            </button>
          )}
          
          {(isRunning || isAutoCycle || cycleCount > 0) && (
            <button
              onClick={stopAllTimers}
              className="w-full py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              すべて停止・リセット
            </button>
          )}
        </div>

        {/* 説明 */}
        <p className="mt-4 text-sm text-gray-600 text-center">
          {isAutoCycle 
            ? '自動で作業⇄休憩を繰り返します' 
            : '25分作業 → 5分休憩のサイクル'}
        </p>
      </div>
    </div>
  );
}

export default PomodoroTimer;