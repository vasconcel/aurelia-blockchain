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
    <div className={`glass-card relative ${isMining ? 'animate-breathe-neon neon-border-cyan' : ''}`}>
      <div className="step-badge">Step 3: Process Block</div>
      
      <h2 className="flex items-center gap-2">
        <Settings size={18} className={isMining ? 'animate-pulse-glow text-cyan-400' : 'text-purple-400'} />
        Mining Control
      </h2>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label>Difficulty</label>
            <span className="text-cyan-400 font-mono font-bold">{difficulty}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            disabled={isMining}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>1 (Easy)</span>
            <span>5 (Hard)</span>
          </div>
        </div>

        <button
          onClick={isMining ? handleStopMining : handleStartMining}
          disabled={loading}
          className={`btn-bioluminescent w-full flex items-center justify-center gap-2 ${
            isMining ? 'bg-red-500/80 hover:bg-red-600' : ''
          }`}
        >
          {loading ? (
            <span>Processing...</span>
          ) : isMining ? (
            <>
              <Square size={16} />
              Stop Mining
            </>
          ) : (
            <>
              <Play size={16} />
              Start Mining
            </>
          )}
        </button>

        {isMining && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/30">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm text-cyan-400 font-mono">Mining in progress...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}