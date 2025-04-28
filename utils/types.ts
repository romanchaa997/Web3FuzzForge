/**
 * Web3 Wallet Provider Types
 *
 * This file contains type definitions for various web3 wallet providers
 * to be used across the testing framework.
 */

/**
 * Common Ethereum Provider Interface
 * Base interface that all wallet providers implement
 */
export interface EthereumProvider {
  selectedAddress: string | null;
  chainId: string;
  networkVersion?: string;
  isConnected?: () => boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, callback: (params?: unknown) => void) => void;
  removeListener?: (eventName: string, callback: (params?: unknown) => void) => void;
}

/**
 * MetaMask Provider Interface
 */
export interface MetaMaskProvider extends EthereumProvider {
  isMetaMask: boolean;
}

/**
 * Coinbase Wallet Provider Interface
 */
export interface CoinbaseWalletProvider extends EthereumProvider {
  isCoinbaseWallet: boolean;
}

/**
 * Phantom Wallet Provider Interface
 */
export interface PhantomProvider extends EthereumProvider {
  isPhantom: boolean;
  publicKey?: string;
}

/**
 * Rabby Wallet Provider Interface
 */
export interface RabbyProvider extends EthereumProvider {
  isRabby: boolean;
}

/**
 * WalletConnect Provider Interface
 */
export interface WalletConnectProvider extends EthereumProvider {
  isWalletConnect: boolean;
  disconnect: () => Promise<boolean>;
  triggerQRCode?: () => void;
}

/**
 * Wallet Transaction Type
 */
export interface Transaction {
  from: string;
  to: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: string;
  chainId?: string;
}

/**
 * Wallet State Interface
 */
export interface WalletState {
  address: string | null;
  chainId: string;
  networkVersion: string;
  isConnected?: boolean;
  methods?: string[];
  eventListeners?: Record<string, number>;
  permissions?: string[];
  balance?: string;
  tokens?: Array<{ address: string; balance: string }>;
  transactions?: Transaction[];
  nonces?: Record<string, number>;
  customData?: Record<string, unknown>;
}

/**
 * Mock Options Interface
 */
export interface WalletMockOptions {
  address?: string;
  chainId?: string;
  autoApprove?: boolean;
  delayMs?: number;
}

/**
 * Global Window Typing Extension
 */
declare global {
  interface Window {
    ethereum?: EthereumProvider & {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isPhantom?: boolean;
      isRabby?: boolean;
      isWalletConnect?: boolean;
    };
    web3?: {
      eth: {
        defaultAccount: string;
        accounts: string[];
        getAccounts: () => Promise<string[]>;
        net: {
          getId: () => Promise<number>;
        };
      };
    };
  }
}
