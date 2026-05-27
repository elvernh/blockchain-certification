import { useState, useCallback } from 'react';
import { getWalletClient } from '../contracts/config';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const walletClient = await getWalletClient();
      const [address] = await walletClient.requestAddresses();
      setAccount(address);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
  }, []);

  return { account, connect, disconnect, isConnecting, error };
}
