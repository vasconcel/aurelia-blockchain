import { useEffect } from 'react';
import Header from './components/Header';
import BlockStrip from './components/BlockStrip';
import MempoolView from './components/MempoolView';
import MiningPanel from './components/MiningPanel';
import MetricsDashboard from './components/MetricsDashboard';
import TransactionForm from './components/TransactionForm';
import socketService from './socket';

function App() {
  useEffect(() => {
    socketService.connect();
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <main className="p-6 space-y-6">
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