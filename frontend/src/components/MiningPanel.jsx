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
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings size={20} className="text-aurelia-purple" />
        Mining Control
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-2">
            Difficulty: <span className="text-aurelia-purple font-bold">{difficulty}</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full h-2 glass-card rounded-lg appearance-none cursor-pointer"
            disabled={isMining}
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>Easy (1)</span>
            <span>Hard (5)</span>
          </div>
        </div>

        <button
          onClick={isMining ? handleStopMining : handleStartMining}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            isMining
              ? 'bg-red-600/80 hover:bg-red-600 text-white animate-breathe-neon'
              : 'btn-bioluminescent hover:scale-[1.02]'
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