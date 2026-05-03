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
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity size={20} className="text-cyan-400" />
          Research Metrics
        </h2>
        <div className="text-slate-400">Loading metrics...</div>
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
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity size={20} className="text-cyan-400" />
        Research Metrics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-slate-700 rounded-lg p-3"
          >
            <div className={`text-xs ${stat.color} mb-1`}>
              {stat.label}
            </div>
            <div className="text-lg font-bold">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {metrics?.miningDurations?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm text-slate-400 mb-2">Recent Mining Durations</h3>
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
            {metrics.miningDurations.slice(-10).map((duration, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-12 bg-slate-700 rounded px-2 py-1 text-xs text-center"
              >
                <span className="text-purple-400">{duration}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}