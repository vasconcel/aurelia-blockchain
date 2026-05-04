import { useState, useEffect } from 'react';
import { Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getTransactionPool } from '../api';
import socketService from '../socket';

export default function MempoolView() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPool();
    
    socketService.on('transaction_added', (data) => {
      loadPool();
    });
    
    return () => {
      socketService.off('transaction_added');
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
    return hash ? `${hash.slice(0, 8)}...` : '...';
  };

  if (loading) {
    return (
      <div className="glass-card rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-yellow-400" />
          Memory Pool
        </h2>
        <div className="text-white/50">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock size={20} className="text-yellow-400" />
        Memory Pool
        <span className="ml-2 text-sm text-white/50">({transactions.length} pending)</span>
      </h2>

      {transactions.length === 0 ? (
        <div className="text-white/50 text-sm py-4 text-center">
          No pending transactions
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
          {transactions.map((tx, index) => (
            <div
              key={index}
              className="flex items-center justify-between glass-card rounded-lg p-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <ArrowDownRight size={14} className="text-green-400" />
                <span className="text-white/70 font-mono">
                  {truncateHash(tx.senderWallet?.address)}
                </span>
                <ArrowUpRight size={14} className="text-red-400" />
                <span className="text-white/70 font-mono">
                  {truncateHash(tx.recipient)}
                </span>
              </div>
              <div className="text-aurelia-cyan font-bold">
                {tx.amount?.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}