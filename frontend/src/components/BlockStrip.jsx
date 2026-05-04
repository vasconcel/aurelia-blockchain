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
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash, length = 12) => {
    return hash ? `${hash.slice(0, length)}...` : '';
  };

  if (loading) {
    return (
      <div className="glass-card rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Box size={20} className="text-aurelia-cyan" />
          Tentacles
        </h2>
        <div className="text-white/50">Loading blocks...</div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Box size={20} className="text-aurelia-cyan animate-float" />
        Tentacles
        <span className="ml-2 text-sm text-white/50">({blocks.length} blocks)</span>
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {blocks.map((block, index) => (
          <div
            key={block.index}
            className="flex-shrink-0 w-36 rounded-lg p-3 transition-all animate-float hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(192, 132, 252, 0.1))',
              border: '1px solid',
              borderImage: 'linear-gradient(135deg, #22d3ee, #c084fc) 1',
              filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))',
            }}
          >
            <div className="text-xs text-white/60 mb-1">Block #{block.index}</div>
            <div className="text-xs font-mono text-aurelia-cyan mb-1">
              {truncateHash(block.hash)}
            </div>
            <div className="text-xs text-white/50">
              {formatTimestamp(block.timestamp)}
            </div>
            <div className="text-xs text-white/50 mt-1">
              Diff: {block.difficulty || 4}
            </div>
            <div className="text-xs text-white/50">
              Txs: {block.transactions?.length || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}