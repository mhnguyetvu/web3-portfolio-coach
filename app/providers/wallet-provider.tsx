'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
      on(event: string, handler: (...args: unknown[]) => void): void;
    };
  }
}

type WalletContextValue = {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet found. Install MetaMask or another Web3 wallet.');
      return;
    }
    setError(null);
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      if (accounts[0]) {
        setAddress(accounts[0]);
      }
    } catch (e) {
      const err = e as { code?: number; message?: string };
      if (err.code === 4001) {
        setError('Connection rejected');
      } else {
        setError(err.message ?? 'Failed to connect');
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Reconnect on mount if wallet was previously connected
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        const acc = (accounts as string[])[0];
        if (acc) setAddress(acc);
      })
      .catch(() => {});
  }, []);

  // Listen for account changes (e.g. user switches account in MetaMask)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const onAccountsChanged = (accounts: unknown) => {
      const acc = (accounts as string[])[0];
      setAddress(acc ?? null);
    };
    window.ethereum.on('accountsChanged', onAccountsChanged);
  }, []);

  const value: WalletContextValue = {
    address,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
