import { useState } from 'react';
import { Send } from 'lucide-react';
import { createTransaction } from '../api';

export default function TransactionForm() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await createTransaction({
        recipient,
        amount: parseFloat(amount),
        fee: parseFloat(fee),
      });
      setSuccess(true);
      setRecipient('');
      setAmount('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert(error.response?.data?.error || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Send size={20} className="text-green-400" />
        Send Transaction
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-white/70 mb-1">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full glass-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aurelia-cyan/50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/70 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full glass-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aurelia-cyan/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Fee</label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0.5"
              step="0.1"
              min="0"
              className="w-full glass-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aurelia-cyan/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !recipient || !amount}
          className="w-full flex items-center justify-center gap-2 btn-bioluminescent disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-2 rounded-lg transition-all"
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              <Send size={16} />
              Send Tokens
            </>
          )}
        </button>

        {success && (
          <div className="text-center text-sm text-green-400 animate-pulse">
            Transaction broadcasted successfully!
          </div>
        )}
      </form>
    </div>
  );
}