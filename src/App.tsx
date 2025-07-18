import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Timer } from 'lucide-react';

interface TimeState {
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC = () => {
  const [time, setTime] = useState<TimeState>({
    hours: 0,
    minutes: 5,
    seconds: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [inputValue, setInputValue] = useState('05:00');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const beepRef = useRef<{ play: () => void } | null>(null);

  useEffect(() => {
    const audioContext = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext)();

    const createBeepSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 1,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    };

    beepRef.current = { play: createBeepSound };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const { hours, minutes, seconds } = prevTime;

          if (hours === 0 && minutes === 0 && seconds === 0) {
            setIsRunning(false);
            setIsCompleted(true);
            setShowAlert(true);
            beepRef.current?.play?.();
            return prevTime;
          }

          if (seconds > 0) {
            return { ...prevTime, seconds: seconds - 1 };
          } else if (minutes > 0) {
            return { ...prevTime, minutes: minutes - 1, seconds: 59 };
          } else if (hours > 0) {
            return { hours: hours - 1, minutes: 59, seconds: 59 };
          }

          return prevTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isCompleted]);

  const parseTimeInput = (input: string): TimeState => {
    const parts = input.split(':').map((part) => parseInt(part.trim()) || 0);
    if (parts.length === 2) {
      return { hours: 0, minutes: parts[0], seconds: parts[1] };
    } else if (parts.length === 3) {
      return { hours: parts[0], minutes: parts[1], seconds: parts[2] };
    }
    return { hours: 0, minutes: 0, seconds: 0 };
  };

  const formatTime = (time: TimeState): string => {
    const { hours, minutes, seconds } = time;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (!isRunning) {
      const parsedTime = parseTimeInput(value);
      setTime(parsedTime);
      setIsCompleted(false);
    }
  };

  const handleStart = () => {
    if (time.hours === 0 && time.minutes === 0 && time.seconds === 0) return;
    setIsRunning(true);
    setIsCompleted(false);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setShowAlert(false);
    const parsedTime = parseTimeInput(inputValue);
    setTime(parsedTime);
  };

  const handlePreset = (minutes: number) => {
    if (!isRunning) {
      const newTime = { hours: 0, minutes, seconds: 0 };
      setTime(newTime);
      setInputValue(formatTime(newTime));
      setIsCompleted(false);
    }
  };

  const presetButtons = [
    { label: '1 Min', value: 1 },
    { label: '5 Min', value: 5 },
    { label: '10 Min', value: 10 },
    { label: '15 Min', value: 15 },
    { label: '30 Min', value: 30 },
    { label: '1 Hour', value: 60 },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <Timer className="w-8 h-8 mr-2 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Timer</h1>
          </div>
          <p className="text-gray-600">Set your timer and stay focused</p>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Enter Time (HH:MM:SS or MM:SS)
          </label>
          <div className="relative">
            <Clock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="05:00"
              className="w-full py-3 pl-10 pr-4 font-mono text-lg text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isRunning}
            />
          </div>
        </div>

        <div
          className={`text-center mb-8 p-6 rounded-xl transition-all duration-500 ${
            isCompleted
              ? 'bg-red-100 border-2 border-red-300 animate-pulse'
              : isRunning
                ? 'bg-green-100 border-2 border-green-300'
                : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          <div
            className={`text-5xl font-mono font-bold transition-colors duration-500 ${
              isCompleted
                ? 'text-red-600'
                : isRunning
                  ? 'text-green-600'
                  : 'text-gray-800'
            }`}
          >
            {formatTime(time)}
          </div>
          {isCompleted && (
            <div className="mt-2 font-semibold text-red-600 animate-bounce">
              ⏰ Time's Up!
            </div>
          )}
        </div>

        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={handleStart}
            disabled={
              isRunning ||
              (time.hours === 0 && time.minutes === 0 && time.seconds === 0)
            }
            className="flex items-center px-6 py-3 text-white transition-colors duration-200 bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </button>

          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="flex items-center px-6 py-3 text-white transition-colors duration-200 bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </button>

          <button
            onClick={handleReset}
            className="flex items-center px-6 py-3 text-white transition-colors duration-200 bg-red-600 rounded-lg hover:bg-red-700"
          >
            <Square className="w-5 h-5 mr-2" />
            Reset
          </button>
        </div>

        <div className="pt-6 border-t">
          <h3 className="mb-3 text-lg font-semibold text-center text-gray-700">
            Quick Presets
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {presetButtons.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePreset(preset.value)}
                disabled={isRunning}
                className="px-3 py-2 text-sm text-indigo-700 transition-colors duration-200 bg-indigo-100 rounded-lg hover:bg-indigo-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {showAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-w-sm p-6 mx-4 text-center bg-white rounded-xl animate-bounce">
              <div className="mb-4 text-6xl">⏰</div>
              <h2 className="mb-2 text-2xl font-bold text-gray-800">
                Time's Up!
              </h2>
              <p className="mb-4 text-gray-600">
                Your countdown timer has finished.
              </p>
              <button
                onClick={() => setShowAlert(false)}
                className="px-6 py-2 text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer;
