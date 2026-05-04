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
    <div className="glass-card relative">
      <div className="step-badge">Step 1: Create Data</div>
      
      <h2 className="flex items-center gap-2">
        <Send size={18} className="text-green-400" />
        Send Transaction
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label>Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <label>Fee</label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0.5"
              step="0.1"
              min="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !recipient || !amount}
          className="btn-bioluminescent w-full flex items-center justify-center gap-2"
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
          <p className="text-center text-sm text-green-400 animate-pulse">
            Transaction broadcasted successfully!
          </p>
        )}
      </form>
    </div>
  );
}