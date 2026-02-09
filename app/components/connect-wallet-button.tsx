'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@/app/providers/wallet-provider';
import { AlertCircle, Wallet01, XClose } from '@untitledui/icons';

function truncateAddress(addr: string) {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnecting, error, connect, disconnect, clearError } = useWallet();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (error) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [error]);

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
          title={address}
        >
          {truncateAddress(address)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
      >
        <Wallet01 size={18} />
        {isConnecting ? 'Connecting…' : 'Connect wallet'}
      </button>

      <dialog
        ref={dialogRef}
        onCancel={clearError}
        className="fixed left-1/2 top-1/2 m-0 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-0 shadow-lg backdrop:bg-black/20 dark:border-white/10 dark:bg-zinc-900 dark:backdrop:bg-black/40"
        aria-labelledby="wallet-error-title"
        aria-describedby="wallet-error-desc"
      >
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <AlertCircle size={20} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="wallet-error-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Connection failed
            </h2>
            <p id="wallet-error-desc" className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {error}
            </p>
            <button
              type="button"
              onClick={clearError}
              className="mt-4 w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Dismiss
            </button>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="absolute right-3 top-3 rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <XClose size={18} />
          </button>
        </div>
      </dialog>
    </>
  );
}
