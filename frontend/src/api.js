import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
console.log('Frontend initialized. Connecting to API at:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const getHealth = () => api.get('/health');
export const getBlockchain = () => api.get('/blockchain');
export const getBlock = (index) => api.get(`/blockchain/${index}`);
export const getBalance = (address) => api.get(`/balance/${address}`);
export const getTransactionPool = () => api.get('/transaction-pool');
export const getMetrics = () => api.get('/metrics');
export const getPeers = () => api.get('/peers');
export const getWallet = () => api.get('/wallet');

export const createTransaction = (data) => api.post('/transaction', data);
export const startMining = (difficulty) => api.post('/mine', { difficulty });
export const stopMining = () => api.post('/mine/stop');
export const exportMetrics = () => api.post('/metrics/export');

export default api;