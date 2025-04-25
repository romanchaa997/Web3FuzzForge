/**
 * Wallet Mocks
 *
 * Utility functions for mocking wallet behavior in tests.
 * Includes fake account connection, signing, and rejecting flows.
 */

export interface WalletMockOptions {
  address?: string;
  chainId?: string;
  autoApprove?: boolean;
  delayMs?: number;
}

const DEFAULT_OPTIONS: Required<WalletMockOptions> = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: '0x1', // Ethereum Mainnet
  autoApprove: true,
  delayMs: 500, // Simulate network delay
}

/**
 * Interface for Ethereum provider
 * This more closely matches the MetaMask provider shape
 */
interface EthereumProvider {
  isMetaMask?: boolean;
  selectedAddress: string | null;
  chainId: string;
  networkVersion: string;
  isConnected?: () => boolean;

  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, callback: (...args: any[]) => void) => any;
  removeListener: (eventName: string, callback: (...args: any[]) => void) => any;

  // Optional methods that may exist
  addListener?: (eventName: string, callback: (...args: any[]) => void) => any;
  once?: (eventName: string, callback: (...args: any[]) => void) => any;
  removeAllListeners?: (eventName?: string) => any;
  emit?: (eventName: string, ...args: any[]) => boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider & {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isPhantom?: boolean;
      isRabby?: boolean;
      isWalletConnect?: boolean;
    };
  }
}

/**
 * Injects a mock ethereum provider into a Playwright page
 */
export async function injectMockWallet(page: any, options: WalletMockOptions = {}) {
  await page.addInitScript(providerOptions => {
    const opts = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: '0x1',
      autoApprove: true,
      delayMs: 500,
      ...providerOptions,
    }

    const eventListeners = {}

    function triggerEvent(eventName, data) {
      if (eventListeners[eventName]) {
        for (const callback of eventListeners[eventName]) {
          callback(data)
        }
      }
    }

    window.ethereum = {
      isMetaMask: true,
      selectedAddress: null,
      chainId: opts.chainId,
      networkVersion: opts.chainId === '0x1' ? '1' : '0',

      request: async ({ method, params = [] }) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, opts.delayMs))

        console.log(`Mock wallet: ${method} called with params:`, params)

        switch (method) {
          case 'eth_requestAccounts':
            if (!opts.autoApprove) {
              throw new Error('User rejected the request')
            }
            window.ethereum.selectedAddress = opts.address
            triggerEvent('accountsChanged', [opts.address])
            triggerEvent('connect', { chainId: opts.chainId })
            return [opts.address]

          case 'eth_accounts':
            return window.ethereum.selectedAddress ? [window.ethereum.selectedAddress] : []

          case 'eth_chainId':
            return opts.chainId

          case 'personal_sign':
          case 'eth_sign':
            if (!opts.autoApprove) {
              throw new Error('User rejected the signature request')
            }
            // Generate mock signature (65 bytes)
            return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01'

          case 'eth_sendTransaction':
            if (!opts.autoApprove) {
              throw new Error('User rejected the transaction')
            }
            // Generate mock transaction hash
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

          case 'wallet_switchEthereumChain':
            if (!opts.autoApprove) {
              throw new Error('User rejected the chain switch request')
            }
            const newChainId = params[0]?.chainId
            if (newChainId) {
              window.ethereum.chainId = newChainId
              window.ethereum.networkVersion =
                newChainId === '0x1'
                  ? '1'
                  : newChainId === '0x3'
                    ? '3'
                    : newChainId === '0x4'
                      ? '4'
                      : newChainId === '0x5'
                        ? '5'
                        : '0'
              triggerEvent('chainChanged', newChainId)
            }
            return null

          default:
            console.warn(`Unhandled method: ${method}`)
            return null
        }
      },

      on: (eventName, callback) => {
        if (!eventListeners[eventName]) {
          eventListeners[eventName] = []
        }
        eventListeners[eventName].push(callback)
      },

      removeListener: (eventName, callback) => {
        if (eventListeners[eventName]) {
          eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback)
        }
      },
    }
  }, options)
}

/**
 * Helper to simulate a user rejecting wallet connection
 */
export async function setupRejectedConnection(page: any) {
  return injectMockWallet(page, { autoApprove: false })
}

/**
 * Helper to simulate a user rejecting transaction signing
 */
export async function setupRejectedSigning(page: any) {
  return injectMockWallet(page, { autoApprove: false })
}

/**
 * Helper to simulate network switching
 */
export async function setupNetworkSwitching(page: any, initialChainId: string = '0x1') {
  return injectMockWallet(page, { chainId: initialChainId })
}

/**
 * Helper to simulate wallet disconnection
 */
export async function simulateDisconnect(page: any) {
  // Inject disconnection logic using separate script to avoid reference issues
  await page.evaluate(() => {
    if (window.ethereum) {
      // Set wallet as disconnected
      window.ethereum.selectedAddress = null

      // Manually dispatch events
      const accountsChanged = new CustomEvent('ethereum#accountsChanged', { detail: [] })
      window.dispatchEvent(accountsChanged)

      const disconnect = new CustomEvent('ethereum#disconnect', {
        detail: { code: 1000, reason: 'User disconnected' },
      })
      window.dispatchEvent(disconnect)
    }
  })
}

/**
 * Interface representing a captured wallet state
 */
export interface WalletState {
  address: string | null;
  chainId: string;
  networkVersion: string;
  isMetaMask?: boolean;
  isConnected?: boolean;
  methods?: string[];
  eventListeners?: Record<string, number>;
  permissions?: Array<string>;
  balance?: string;
  tokens?: Array<{ address: string; balance: string }>;
  transactions?: Array<any>;
  nonces?: Record<string, number>;
  customData?: Record<string, any>;
}

/**
 * Saves the current state of a wallet
 * Captures all injected window.ethereum methods, state, and event listeners
 *
 * @param page - Playwright page object
 * @param customData - Optional additional data to store with the state
 * @returns A promise that resolves to the captured wallet state
 */
export async function saveWalletState(
  page: any, customData: Record<string, any> = {}
): Promise<WalletState> {
  return await page.evaluate(userData => {
    if (!window.ethereum) {
      throw new Error('No ethereum provider found')
    }

    // Get all methods and properties from the provider
    const methods = Object.getOwnPropertyNames(window.ethereum)
      .filter(prop => typeof window.ethereum[prop] === 'function')
      .concat(
        Object.getOwnPropertyNames(Object.getPrototypeOf(window.ethereum)).filter(
          prop => typeof window.ethereum[prop] === 'function'
        )
      )

    // Count event listeners by type
    const eventListeners: Record<string, number> = {}
    const events = ['accountsChanged', 'chainChanged', 'connect', 'disconnect', 'message']
    for (const event of events) {
      // This is a heuristic since we can't directly access private listeners
      // Store the count of listeners for each event type
      try {
        const originalOn = window.ethereum.on
        let count = 0

        // Temporarily override 'on' to count listeners
        window.ethereum.on = function (eventName: string, cb: any) {
          if (eventName === event) count++
          return { eventName, cb }
        }

        // Try to trigger a dummy listener to see if there's any error
        // indicating existing listeners
        try {
          window.ethereum.on(event, () => {})
        } catch (e) {
          // Some providers throw errors if too many listeners
          // We can use this to estimate existing listeners
          const errorMatch = e.message?.match(/(\d+) listeners/)
          if (errorMatch) {
            count = parseInt(errorMatch[1], 10)
          }
        }

        // Restore original
        window.ethereum.on = originalOn
        eventListeners[event] = count
      } catch (e) {
        console.warn(`Could not detect listeners for ${event}:`, e)
        eventListeners[event] = 0
      }
    }

    // Get accounts
    let accounts = []
    try {
      accounts = window.ethereum.request({ method: 'eth_accounts' })
    } catch (e) {
      console.warn('Failed to get accounts:', e)
    }

    // Capture current chain data
    let chainId = window.ethereum.chainId
    if (!chainId) {
      try {
        chainId = window.ethereum.request({ method: 'eth_chainId' })
      } catch (e) {
        console.warn('Failed to get chainId:', e)
        chainId = '0x1' // Default to Ethereum mainnet
      }
    }

    // Capture isConnected state
    let isConnected = false
    try {
      if (typeof window.ethereum.isConnected === 'function') {
        isConnected = window.ethereum.isConnected()
      }
    } catch (e) {
      console.warn('Failed to check connection state:', e)
    }

    // Extract the current wallet state
    const state = {
      address: window.ethereum.selectedAddress || (accounts.length > 0 ? accounts[0] : null),
      chainId,
      networkVersion: window.ethereum.networkVersion || String(parseInt(chainId, 16)) || '1',
      isMetaMask: !!window.ethereum.isMetaMask,
      isConnected,
      methods,
      eventListeners,
      customData: userData,
    }

    console.log('Wallet state saved:', state)
    return state
  }, customData)
}

/**
 * Restores a previously saved wallet state
 * Reapplies mocks for the Ethereum provider based on the saved state
 *
 * @param page - Playwright page object
 * @param state - The wallet state to restore
 * @returns A promise that resolves when the state is restored
 */
export async function restoreWalletState(page: any, state: WalletState): Promise<void> {
  await page.evaluate(savedState => {
    // Create event listener storage
    const eventListeners = {}

    // Utility to create a mock provider
    function createMockProvider() {
      return {
        isMetaMask: savedState.isMetaMask || true,
        selectedAddress: savedState.address,
        chainId: savedState.chainId,
        networkVersion: savedState.networkVersion,

        // Core RPC methods
        request: async function ({ method, params = [] }) {
          console.log(`Mock wallet: ${method} called with params:`, params)

          switch (method) {
            case 'eth_requestAccounts':
              return savedState.address ? [savedState.address] : []

            case 'eth_accounts':
              return savedState.address ? [savedState.address] : []

            case 'eth_chainId':
              return savedState.chainId

            case 'net_version':
              return savedState.networkVersion

            case 'personal_sign':
            case 'eth_sign':
              // Generate mock signature (65 bytes)
              return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01'

            case 'eth_sendTransaction':
              // Generate mock transaction hash
              return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

            case 'wallet_switchEthereumChain':
              const newChainId = params[0]?.chainId
              if (newChainId) {
                this.chainId = newChainId
                this.networkVersion = String(parseInt(newChainId, 16))
                this.emitEvent('chainChanged', newChainId)
              }
              return null

            default:
              console.warn(`Unhandled method: ${method}`)
              return null
          }
        },

        // Event handling methods
        on: function (eventName, callback) {
          if (!eventListeners[eventName]) {
            eventListeners[eventName] = []
          }
          eventListeners[eventName].push(callback)
          return this // Chainable API
        },

        addListener: function (eventName, callback) {
          return this.on(eventName, callback)
        },

        once: function (eventName, callback) {
          const wrappedCallback = (...args) => {
            this.removeListener(eventName, wrappedCallback)
            callback(...args)
          }
          return this.on(eventName, wrappedCallback)
        },

        removeListener: function (eventName, callback) {
          if (eventListeners[eventName]) {
            eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback)
          }
          return this // Chainable API
        },

        removeAllListeners: function (eventName) {
          if (eventName) {
            eventListeners[eventName] = []
          } else {
            Object.keys(eventListeners).forEach(key => {
              eventListeners[key] = []
            })
          }
          return this // Chainable API
        },

        // Helper methods from MetaMask provider
        isConnected: function () {
          return savedState.isConnected || !!savedState.address
        },

        // Event emitter helper
        emitEvent: function (eventName, ...args) {
          if (eventListeners[eventName]) {
            for (const callback of eventListeners[eventName]) {
              callback(...args)
            }
            return true
          }
          return false
        },
      }
    }

    if (!window.ethereum) {
      console.warn('No ethereum provider found, creating a mock one')
      // Create a new ethereum provider
      window.ethereum = createMockProvider()
    } else {
      // Update existing provider with saved state
      window.ethereum.selectedAddress = savedState.address
      window.ethereum.chainId = savedState.chainId
      window.ethereum.networkVersion = savedState.networkVersion

      // Try to apply methods if they don't exist
      try {
        if (typeof window.ethereum.isConnected !== 'function') {
          window.ethereum.isConnected = function () {
            return savedState.isConnected || !!savedState.address
          }
        }
      } catch (e) {
        console.warn('Could not add isConnected method:', e)
      }
    }

    // Helper to safely emit events
    function safeEmit(eventName, ...args) {
      setTimeout(() => {
        try {
          // Try direct emit if available
          if (typeof window.ethereum.emit === 'function') {
            window.ethereum.emit(eventName, ...args)
          } else if (typeof window.ethereum.emitEvent === 'function') {
            window.ethereum.emitEvent(eventName, ...args)
          } else {
            // Use dispatchEvent as fallback
            const event = new CustomEvent(`ethereum#${eventName}`, {
              detail: args.length === 1 ? args[0] : args,
            })
            window.dispatchEvent(event)
          }
        } catch (e) {
          console.warn(`Failed to emit ${eventName} event:`, e)
        }
      }, 0)
    }

    // Trigger events to notify listeners of state change
    if (savedState.address) {
      safeEmit('accountsChanged', [savedState.address])
      safeEmit('connect', { chainId: savedState.chainId })
    }

    // Trigger chainChanged event
    safeEmit('chainChanged', savedState.chainId)

    console.log('Wallet state restored:', savedState)
  }, state)
}

/**
 * Helper to create a fresh testing state with specific characteristics
 * @param page - Playwright page object
 * @param options - Options to configure the wallet state
 * @returns A promise that resolves when the state is set up
 */
export async function setupWalletState(
  page: any, options: WalletMockOptions = {}
): Promise<WalletState> {
  // First set up the wallet with the desired configuration
  await injectMockWallet(page, options)

  // Force connection so we have a valid state
  await page.evaluate(async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
    }
  })

  // Capture and return the state
  return await saveWalletState(page)
}
