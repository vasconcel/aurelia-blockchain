import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Activity, Link } from 'lucide-react';
import { getWallet } from '../api';

export default function Header() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
    const interval = setInterval(loadWallet, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadWallet = async () => {
    try {
      const { data } = await getWallet();
      setWallet(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="glass-card rounded-b-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse-glow" />
          <h1 className="text-xl font-bold text-cyan-400">Aurelia Explorer</h1>
        </div>

        <div className="flex items-center gap-6 pb-1">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-cyan-400" />
            <span className="text-sm text-slate-300">Miner:</span>
            <span className="text-sm font-mono text-cyan-400 truncate max-w-[120px]">
              {wallet?.address?.slice(0, 10)}...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" />
            <span className="text-sm text-slate-300">Balance:</span>
            <span className="text-sm font-bold text-purple-400">
              {wallet?.balance?.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 connection-dot" />
            <Activity size={18} className="text-green-400" />
            <span className="text-sm text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}