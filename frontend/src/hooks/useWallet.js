import { useState, useCallback } from 'react';
import { getWalletClient } from '../contracts/config';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useWallet() {
  const [account, setAccount]       = useState(null);
  const [user, setUser]             = useState(null);
  const [token, setToken]           = useState(() => localStorage.getItem('auth_token'));
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]           = useState(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // 1. Connect Rabby and get address
      const walletClient = await getWalletClient();
      const [address] = await walletClient.requestAddresses();
      setAccount(address);

      // 2. Fetch nonce from backend
      const nonceRes = await fetch(`${API}/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!nonceRes.ok) throw new Error('Failed to get auth nonce from server');
      const { message } = await nonceRes.json();

      // 3. Sign the message with Rabby
      const signature = await walletClient.signMessage({ account: address, message });

      // 4. Verify signature on backend → receive JWT
      const verifyRes = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });
      if (!verifyRes.ok) {
        const { error: err } = await verifyRes.json();
        throw new Error(err || 'Backend authentication failed');
      }
      const { token: jwt, user: authUser } = await verifyRes.json();

      localStorage.setItem('auth_token', jwt);
      setToken(jwt);
      setUser(authUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  }, []);

  return { account, user, token, connect, disconnect, isConnecting, error };
}
