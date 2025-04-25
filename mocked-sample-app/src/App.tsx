import { useState, useEffect, useCallback } from 'react';
import './App.css';

// Define interface for window.ethereum
interface Ethereum {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
  selectedAddress: string | null;
  chainId?: string;
  networkVersion?: string;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, callback: (...args: any[]) => void) => void;
  removeListener?: (eventName: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: Ethereum;
  }
}

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string>('0x1'); // Default to Ethereum mainnet
  const [networkName, setNetworkName] = useState<string>('Ethereum Mainnet');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txPending, setTxPending] = useState<boolean>(false);

  // Define network names mapping
  const networkNames: { [key: string]: string } = {
    '0x1': 'Ethereum Mainnet',
    '0x5': 'Goerli Testnet',
    '0x89': 'Polygon Mainnet',
    '0x13881': 'Polygon Mumbai',
    '0xaa36a7': 'Sepolia Testnet',
  };

  // Check if wallet is connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.ethereum?.selectedAddress) {
          setWalletAddress(window.ethereum.selectedAddress);
          setConnected(true);

          // Update chain ID if available
          if (window.ethereum.chainId) {
            setChainId(window.ethereum.chainId);
            setNetworkName(
              networkNames[window.ethereum.chainId] || `Chain ID: ${window.ethereum.chainId}`
            );
          }

          // Determine provider type
          if (window.ethereum.isMetaMask) {
            setWalletProvider('MetaMask');
          } else if (window.ethereum.isCoinbaseWallet) {
            setWalletProvider('Coinbase Wallet');
          } else if (window.ethereum.isWalletConnect) {
            setWalletProvider('WalletConnect');
          } else {
            setWalletProvider('Unknown Provider');
          }
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        setError('Error checking wallet connection. Please refresh and try again.');
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setConnected(true);
        setError(null);
      } else {
        setWalletAddress(null);
        setConnected(false);
      }
    };

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      setChainId(chainId);
      setNetworkName(networkNames[chainId] || `Chain ID: ${chainId}`);
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Clean up listeners on unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Get chain ID
      try {
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        if (chainId) {
          setChainId(chainId as string);
          setNetworkName(networkNames[chainId as string] || `Chain ID: ${chainId}`);
        }
      } catch (err) {
        console.warn('Could not get chain ID:', err);
      }

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setConnected(true);

        // Determine provider type
        if (window.ethereum.isMetaMask) {
          setWalletProvider('MetaMask');
        } else if (window.ethereum.isCoinbaseWallet) {
          setWalletProvider('Coinbase Wallet');
        } else if (window.ethereum.isWalletConnect) {
          setWalletProvider('WalletConnect');
        } else {
          setWalletProvider('Unknown Provider');
        }
      }
    } catch (err: any) {
      console.error('Connect error:', err);
      setError(`Failed to connect wallet: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send transaction
  const sendTransaction = useCallback(async () => {
    if (!window.ethereum || !window.ethereum.selectedAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setTxPending(true);
      setError(null);

      // Mock transaction parameters
      const txParams = {
        from: window.ethereum.selectedAddress,
        to: '0x1234567890123456789012345678901234567890',
        value: '0x38D7EA4C68000', // 0.001 ETH
        gas: '0x5208', // 21000 gas
      };

      // Send transaction
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      setTxHash(hash as string);
      console.log('Transaction hash:', hash);
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(`Transaction failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setTxPending(false);
    }
  }, [window.ethereum]);

  return (
    <div className="app">
      <header>
        <h1>Web3 Mock dApp</h1>
        <p className="subtitle">A simple dApp for testing Web3 Security Test Kit</p>
      </header>

      <main>
        <div className="card">
          <h2>Wallet Connection</h2>

          {!connected && (
            <button
              id="connect-button"
              className="connect-button"
              onClick={connectWallet}
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}

          {error && (
            <div id="error-message" className="error-message">
              {error}
            </div>
          )}

          {connected && walletAddress && (
            <div id="wallet-info" className="wallet-info">
              <h3>Connected Successfully</h3>
              <p>
                <strong>Provider:</strong> <span id="wallet-provider">{walletProvider}</span>
              </p>
              <p>
                <strong>Address:</strong> <span className="wallet-address">{walletAddress}</span>
              </p>
              <p>
                <strong>Network:</strong> <span id="network-name">{networkName}</span>
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Transaction Testing</h2>
          <button
            id="send-transaction-button"
            className="transaction-button"
            onClick={sendTransaction}
            disabled={!connected || isLoading || txPending}
          >
            {txPending ? 'Sending...' : 'Send Test Transaction'}
          </button>

          {txHash && (
            <div id="tx-confirmation" className="success-message">
              <h3>Transaction Sent!</h3>
              <p>
                <strong>Hash:</strong> <span id="tx-hash">{txHash}</span>
              </p>
            </div>
          )}

          <p className="note">
            This is a mock transaction that will request approval from your wallet. No actual funds
            will be transferred in test mode.
          </p>
        </div>
      </main>

      <footer>
        <p>Created for Web3 Security Test Kit</p>
      </footer>
    </div>
  );
}

export default App;
