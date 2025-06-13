import React, { useState, useRef } from 'react';

function VoiceInput({ onResult, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Web Speech API対応チェック
  React.useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    if (!isSupported || disabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('音声認識エラー:', event.error);
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          alert('音声が検出されませんでした。もう一度お試しください。');
          break;
        case 'network':
          alert('ネットワークエラーが発生しました。');
          break;
        case 'not-allowed':
          alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
          break;
        default:
          alert('音声認識中にエラーが発生しました。');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  if (!isSupported) {
    return (
      <div className="text-gray-400 text-sm">
        <span title="お使いのブラウザは音声入力に対応していません">🎤❌</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={`
        px-3 py-2 rounded-md font-medium transition-colors
        ${disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : isListening
            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }
      `}
      title={isListening ? '音声入力中... クリックで停止' : '音声入力を開始'}
    >
      {isListening ? '🎤⏹️' : '🎤'}
    </button>
  );
}

export default VoiceInput;