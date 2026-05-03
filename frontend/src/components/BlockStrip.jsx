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
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Box size={20} className="text-cyan-400" />
          Blockchain
        </h2>
        <div className="text-slate-400">Loading blocks...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Cube size={20} className="text-cyan-400" />
        Blockchain
        <span className="ml-2 text-sm text-slate-400">({blocks.length} blocks)</span>
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {blocks.map((block, index) => (
          <div
            key={block.index}
            className="flex-shrink-0 w-36 bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors"
          >
            <div className="text-xs text-slate-400 mb-1">Block #{block.index}</div>
            <div className="text-xs font-mono text-cyan-400 mb-1">
              {truncateHash(block.hash)}
            </div>
            <div className="text-xs text-slate-500">
              {formatTimestamp(block.timestamp)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Diff: {block.difficulty || 4}
            </div>
            <div className="text-xs text-slate-500">
              Txs: {block.transactions?.length || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}