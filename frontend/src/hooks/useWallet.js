import { useState, useCallback } from 'react';
import { getWalletClient } from '../contracts/config';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function getAuthToken() {
  return localStorage.getItem('cert_token');
}

export function useWallet() {
  const [account, setAccount] = useState(() => {
    // Restore session if token still valid
    const token = getAuthToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) return payload.address;
    } catch {}
    return null;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const walletClient = await getWalletClient();
      const [address] = await walletClient.requestAddresses();


      // 1. Get challenge nonce from backend
      const nonceRes = await fetch(`${API}/auth/nonce/${address}`);
      if (!nonceRes.ok) throw new Error('Failed to get auth nonce');
      const { message } = await nonceRes.json();

      // 2. Sign with Rabby Wallet
      const signature = await walletClient.signMessage({ account: address, message });

      // 3. Verify signature → receive JWT
      const authRes = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });
      if (!authRes.ok) throw new Error('Backend authentication failed');
      const { token } = await authRes.json();

      localStorage.setItem('cert_token', token);
      setAccount(address);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('cert_token');
    setAccount(null);
  }, []);

  return { account, connect, disconnect, isConnecting, error };
}
