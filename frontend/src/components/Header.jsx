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
      <header className="glass-card rounded-b-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-aurelia-cyan animate-pulse-glow" />
            <h1 className="text-xl font-bold text-aurelia-cyan">Aurelia Explorer</h1>
          </div>
          <div className="text-aurelia-purple/70">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="glass-card rounded-b-xl px-6 py-4 border-b border-aurelia-cyan/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-aurelia-cyan animate-pulse-glow" />
          <h1 className="text-xl font-bold text-aurelia-cyan">Aurelia Explorer</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg">
            <Wallet size={18} className="text-aurelia-cyan" />
            <span className="text-sm text-white/70">Miner:</span>
            <span className="text-sm font-mono text-aurelia-cyan truncate max-w-[120px]">
              {wallet?.address?.slice(0, 10)}...
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg">
            <TrendingUp size={18} className="text-aurelia-purple" />
            <span className="text-sm text-white/70">Balance:</span>
            <span className="text-sm font-bold text-aurelia-purple">
              {wallet?.balance?.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 glass-card rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
            <Activity size={18} className="text-green-400" />
            <span className="text-sm text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}