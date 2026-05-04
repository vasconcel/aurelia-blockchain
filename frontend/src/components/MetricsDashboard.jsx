import { useState, useEffect } from 'react';
import { Activity, Clock, Zap } from 'lucide-react';
import { getMetrics } from '../api';

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const { data } = await getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card">
        <h2 className="flex items-center gap-2">
          <Activity size={18} className="text-cyan-400" />
          Research Metrics
        </h2>
        <p className="text-slate-400 text-sm">Loading metrics...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Transactions',
      value: metrics?.transactionCount || 0,
      icon: Activity,
      color: 'text-green-400',
    },
    {
      label: 'Blocks Mined',
      value: metrics?.blocksMined || 0,
      icon: Clock,
      color: 'text-cyan-400',
    },
    {
      label: 'Avg Mining Time',
      value: `${metrics?.averageMiningDuration || 0}ms`,
      icon: Clock,
      color: 'text-purple-400',
    },
    {
      label: 'Avg Propagation',
      value: `${metrics?.averagePropagationDelay || 0}ms`,
      icon: Zap,
      color: 'text-yellow-400',
    },
    {
      label: 'TPS',
      value: metrics?.tps || 0,
      icon: Activity,
      color: 'text-orange-400',
    },
  ];

  return (
    <div className="glass-card">
      <h2 className="flex items-center gap-2">
        <Activity size={18} className="text-cyan-400" />
        Research Metrics
      </h2>

      <div className="metrics-subgrid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`text-xs mb-2 ${stat.color}`}>
              {stat.label}
            </div>
            <div className="stat-value">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {metrics?.miningDurations?.length > 0 && (
        <div className="mt-6 pt-4 border-t border-cyan-500/20">
          <h3 className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Recent Mining Durations</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {metrics.miningDurations.slice(-10).map((duration, index) => (
              <div
                key={index}
                className="flex-shrink-0 px-3 py-2 bg-slate-800/50 rounded text-center min-w-[60px]"
              >
                <span className="text-sm text-purple-400 font-mono">{duration}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}