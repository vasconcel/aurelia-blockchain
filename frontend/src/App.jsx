import { useState, useEffect } from 'react';
import Header from './components/Header';
import BlockStrip from './components/BlockStrip';
import MempoolView from './components/MempoolView';
import MiningPanel from './components/MiningPanel';
import MetricsDashboard from './components/MetricsDashboard';
import TransactionForm from './components/TransactionForm';
import socketService from './socket';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleConnectionChange = (connected) => {
      setIsConnected(connected);
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
        <div className="text-center glass-card p-8 rounded-2xl">
          <div className="animate-pulse text-aurelia-cyan text-2xl mb-4">Connecting to Aurelia Network...</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 btn-bioluminescent rounded-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        <BlockStrip />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MempoolView />
            <MetricsDashboard />
          </div>
          
          <div className="space-y-6">
            <MiningPanel />
            <TransactionForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;