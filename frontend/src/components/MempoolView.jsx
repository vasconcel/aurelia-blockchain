import { useState, useEffect } from 'react';
import { Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getTransactionPool } from '../api';
import socketService from '../socket';

export default function MempoolView() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPool();
    
    socketService.on('transaction_added', () => {
      loadPool();
    });

    socketService.on('block_mined', () => {
      loadPool();
    });
    
    return () => {
      socketService.off('transaction_added');
      socketService.off('block_mined');
    };
  }, []);

  const loadPool = async () => {
    try {
      const { data } = await getTransactionPool();
      setTransactions(data.pool || []);
    } catch (error) {
      console.error('Failed to load pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return '...';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="glass-card relative">
        <div className="step-badge">Step 2: Await Network</div>
        <h2 className="flex items-center gap-2">
          <Clock size={18} className="text-yellow-400" />
          Memory Pool
        </h2>
        <p className="text-slate-400 text-sm">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="glass-card relative">
      <div className="step-badge">Step 2: Await Network</div>
      
      <h2 className="flex items-center gap-2">
        <Clock size={18} className="text-yellow-400" />
        Memory Pool
        <span className="ml-2 text-xs text-slate-500 font-normal normal-case">({transactions.length} pending)</span>
      </h2>

      {transactions.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">No pending transactions</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
          {transactions.map((tx, index) => (
            <div key={index} className="tx-item">
              <div className="flex items-center gap-2">
                <ArrowDownRight size={14} className="text-green-400" />
                <span className="text-slate-400 font-mono text-xs">
                  {truncateHash(tx.senderWallet?.address)}
                </span>
                <ArrowUpRight size={14} className="text-red-400" />
                <span className="text-slate-400 font-mono text-xs">
                  {truncateHash(tx.recipient)}
                </span>
              </div>
              <div className="text-cyan-400 font-mono font-bold">
                {tx.amount?.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}