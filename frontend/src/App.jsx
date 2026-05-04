import { useState, useEffect } from 'react';
import Header from './components/Header';
import BlockStrip from './components/BlockStrip';
import MempoolView from './components/MempoolView';
import MiningPanel from './components/MiningPanel';
import MetricsDashboard from './components/MetricsDashboard';
import TransactionForm from './components/TransactionForm';
import socketService from './socket';

function App() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleConnectionChange = (connected) => {
      if (!connected) {
        setError('Connecting to Aurelia Network...');
      } else {
        setError(null);
      }
    };

    socketService.on('connection_change', handleConnectionChange);
    socketService.connect();

    return () => {
      socketService.off('connection_change', handleConnectionChange);
      socketService.disconnect();
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="animate-pulse text-cyan-400 text-2xl mb-6 font-semibold tracking-widest uppercase">
            Connecting to Aurelia Network...
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="btn-bioluminescent"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-8 w-full flex justify-center">
      <div className="w-full max-w-7xl flex flex-col gap-12">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8 min-w-0">
            <BlockStrip />
            <MempoolView />
            <MetricsDashboard />
          </div>
          
          <div className="flex flex-col gap-8">
            <MiningPanel />
            <TransactionForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;