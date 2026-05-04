import { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import { getBlockchain } from '../api';
import socketService from '../socket';

export default function BlockStrip() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocks();
    
    socketService.on('block_mined', () => {
      loadBlocks();
    });
    
    return () => {
      socketService.off('block_mined');
    };
  }, []);

  const loadBlocks = async () => {
    try {
      const { data } = await getBlockchain();
      setBlocks(data.chain || []);
    } catch (error) {
      console.error('Failed to load blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash) => {
    if (!hash) return '-';
    return `${hash.substring(0, 6)}...${hash.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="glass-card relative">
        <div className="step-badge">Step 4: Analyze Chain</div>
        <h2 className="flex items-center gap-2">
          <Box size={18} className="text-cyan-400" />
          Tentacles
        </h2>
        <p className="text-slate-400 text-sm">Loading blocks...</p>
      </div>
    );
  }

  return (
    <div className="glass-card relative">
      <div className="step-badge">Step 4: Analyze Chain</div>
      
      {/* Static Title - NOT wrapped in floating animation */}
      <h2 className="flex items-center gap-2">
        <Box size={18} className="text-cyan-400" />
        Tentacles
        <span className="ml-2 text-xs text-slate-500 font-normal normal-case">({blocks.length} cells)</span>
      </h2>

      {/* Floating Container with breathing room */}
      <div className="floating-container overflow-x-auto">
        <div className="flex gap-4">
          {blocks.map((block, index) => (
            <div
              key={block.index}
              className="tentacle-cell flex-shrink-0 animate-floating"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="text-xs text-slate-400 font-semibold tracking-wider">
                #{block.index}
              </div>
              <div className="text-xs font-mono text-cyan-400 truncate" title={block.hash}>
                {truncateHash(block.hash)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {formatTimestamp(block.timestamp)}
              </div>
              <div className="flex justify-between pt-2 mt-1 border-t border-cyan-500/20 text-xs text-slate-500">
                <span>Diff: {block.difficulty || 4}</span>
                <span>Tx: {block.transactions?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}