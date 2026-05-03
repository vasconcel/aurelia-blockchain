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

  if (loading) {
    return (
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-cyan-400">Aurelia Explorer</h1>
          <div className="text-slate-400">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link className="text-cyan-400" size={24} />
          <h1 className="text-xl font-bold text-cyan-400">Aurelia Explorer</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
            <Wallet size={18} className="text-green-400" />
            <span className="text-sm text-slate-300">Miner:</span>
            <span className="text-sm font-mono text-green-400 truncate max-w-[120px]">
              {wallet?.address?.slice(0, 10)}...
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
            <TrendingUp size={18} className="text-cyan-400" />
            <span className="text-sm text-slate-300">Balance:</span>
            <span className="text-sm font-bold text-cyan-400">
              {wallet?.balance?.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
            <Activity size={18} className="text-green-400 animate-pulse" />
            <span className="text-sm text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}