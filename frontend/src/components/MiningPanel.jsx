import { useState } from 'react';
import { Play, Square, Settings } from 'lucide-react';
import { startMining, stopMining } from '../api';

export default function MiningPanel() {
  const [difficulty, setDifficulty] = useState(4);
  const [isMining, setIsMining] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartMining = async () => {
    setLoading(true);
    try {
      await startMining(difficulty);
      setIsMining(true);
    } catch (error) {
      console.error('Failed to start mining:', error);
      if (error.response?.status === 409) {
        setIsMining(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStopMining = async () => {
    setLoading(true);
    try {
      await stopMining();
      setIsMining(false);
    } catch (error) {
      console.error('Failed to stop mining:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings size={20} className="text-purple-400" />
        Mining Control
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Difficulty: <span className="text-purple-400 font-bold">{difficulty}</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            disabled={isMining}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Easy (1)</span>
            <span>Hard (5)</span>
          </div>
        </div>

        <button
          onClick={isMining ? handleStopMining : handleStartMining}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
            isMining
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <span>Processing...</span>
          ) : isMining ? (
            <>
              <Square size={18} />
              Stop Mining
            </>
          ) : (
            <>
              <Play size={18} />
              Start Mining
            </>
          )}
        </button>

        {isMining && (
          <div className="text-center text-sm text-green-400 animate-pulse">
            Mining in progress...
          </div>
        )}
      </div>
    </div>
  );
}