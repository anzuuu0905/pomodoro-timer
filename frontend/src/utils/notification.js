// 音声通知とブラウザ通知のユーティリティ

class NotificationService {
  constructor() {
    this.audioContext = null;
    this.notificationPermission = 'default';
    this.init();
  }

  async init() {
    // ブラウザ通知の権限をリクエスト
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }

    // Web Audio Contextの初期化（ユーザー操作後に実行される）
    document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio APIが利用できません:', error);
    }
  }

  // ビープ音を生成・再生
  playBeep(frequency = 800, duration = 500, volume = 0.3) {
    if (!this.audioContext) {
      // フォールバック: HTMLオーディオ要素を使用
      this.playFallbackSound();
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('ビープ音の再生に失敗:', error);
      this.playFallbackSound();
    }
  }

  // フォールバック音声再生
  playFallbackSound() {
    try {
      // データURIを使用して短いビープ音を生成
      const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OMRS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDOR2O/PfS0EIXbE8+OM=';
      const audio = new Audio(audioData);
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.warn('フォールバック音声の再生に失敗:', error);
      });
    } catch (error) {
      console.warn('フォールバック音声の再生に失敗:', error);
    }
  }

  // ポモドーロ完了時の音声パターン
  playPomodoroComplete() {
    // 3回のビープ音
    this.playBeep(800, 200, 0.4);
    setTimeout(() => this.playBeep(1000, 200, 0.4), 300);
    setTimeout(() => this.playBeep(1200, 400, 0.4), 600);
  }

  // タスク完了時の音声パターン
  playTaskComplete() {
    // 2回のビープ音
    this.playBeep(600, 150, 0.3);
    setTimeout(() => this.playBeep(800, 300, 0.3), 200);
  }

  // ブラウザ通知を表示
  showNotification(title, message, icon = null) {
    if (this.notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'pomodoro-timer',
          requireInteraction: true, // ユーザーが明示的に閉じるまで表示
          vibrate: [200, 100, 200] // バイブレーション（モバイル対応）
        });

        // 5秒後に自動で閉じる
        setTimeout(() => {
          notification.close();
        }, 5000);

        // クリック時にウィンドウをフォーカス
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.warn('ブラウザ通知の表示に失敗:', error);
      }
    } else {
      console.warn('ブラウザ通知の権限がありません');
    }
    return null;
  }

  // ポモドーロ完了通知
  notifyPomodoroComplete() {
    this.playPomodoroComplete();
    this.showNotification(
      '🍅 ポモドーロ完了！',
      '25分間お疲れ様でした！5分間の休憩を取りましょう。'
    );
  }

  // タスク完了通知
  notifyTaskComplete(taskName) {
    this.playTaskComplete();
    this.showNotification(
      '✅ タスク完了！',
      `「${taskName}」が完了しました。`
    );
  }

  // 一般的な通知
  notify(title, message, soundType = 'default') {
    if (soundType === 'pomodoro') {
      this.playPomodoroComplete();
    } else if (soundType === 'task') {
      this.playTaskComplete();
    } else {
      this.playBeep();
    }
    
    this.showNotification(title, message);
  }

  // 通知権限の状態を取得
  getNotificationPermission() {
    return this.notificationPermission;
  }

  // 手動で通知権限をリクエスト
  async requestNotificationPermission() {
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
      return this.notificationPermission;
    }
    return 'unsupported';
  }
}

// シングルトンインスタンスを作成
const notificationService = new NotificationService();

export default notificationService;