/**
 * Test case description: Network Switch Race Condition Test
 * Vulnerability/edge case: Race conditions during rapid network switching that could lead to transaction on wrong networks
 * Manual reproduction steps:
 *   1. Connect to a dApp that supports multiple networks
 *   2. Rapidly switch between networks multiple times
 *   3. Immediately attempt to send a transaction during network transition
 * Security impact: Could result in transactions being sent on unintended networks, potentially losing funds
 */

const { test, expect } = require('@playwright/test')
const { connectWallet, setupWalletState } = require('../../utils/wallet-helpers')
const { recordContribution } = require('../../utils/contributor-tracker')

test.describe('Network Switch Race Condition Tests', () => {
  test.afterAll(async ({}, testInfo) => {
    // Record this contribution to the Hall of Fame if tests pass
    if (testInfo.status === 'passed') {
      await recordContribution(__filename, {
        type: 'Wallet Connection',
        description: 'Tests for race conditions during network switching',
        impactScore: 2, // Higher impact due to potential fund loss
      })
    }
  })

  test.beforeEach(async ({ page }) => {
    // Setup wallet state for testing with multiple networks
    await setupWalletState(page, {
      chainId: '0x1',
      networkName: 'Ethereum Mainnet',
      accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
    })

    // Mock the network switching behavior
    await page.evaluate(() => {
      // Track network switch requests
      window._networkSwitches = []
      window._pendingNetworkSwitch = false
      window._currentNetwork = '0x1'

      // Add delay to simulate real network switching
      const originalRequest = window.ethereum.request
      window.ethereum.request = async args => {
        if (args.method === 'wallet_switchEthereumChain') {
          const targetChain = args.params[0].chainId
          window._networkSwitches.push({
            timestamp: Date.now(),
            from: window._currentNetwork,
            to: targetChain,
          })

          // Set flag indicating network switch in progress
          window._pendingNetworkSwitch = true

          // Add artificial delay to simulate real switching behavior
          await new Promise(resolve => setTimeout(resolve, 500))

          // Now actually execute the switch
          const result = await originalRequest.call(window.ethereum, args)
          window._currentNetwork = targetChain
          window._pendingNetworkSwitch = false

          return result
        }

        // For transaction requests, log if we're in a pending state
        if (args.method === 'eth_sendTransaction') {
          args.params[0]._sentDuringNetworkSwitch = window._pendingNetworkSwitch
        }

        return originalRequest.call(window.ethereum, args)
      }

      // Add helper to check if network is in transition
      window.isNetworkSwitchPending = () => window._pendingNetworkSwitch
    })

    // Navigate to a dApp
    await page.goto('https://app.uniswap.org')
  })

  test('should detect rapid network switching race condition', async ({ page }) => {
    // Create array to track chainId at each step
    const chainIdLog = []

    // Get initial chainId
    const initialChainId = await page.evaluate(() => window.ethereum.chainId)
    chainIdLog.push({ step: 'initial', chainId: initialChainId })

    // Trigger multiple rapid network switches
    const switchesToExecute = [
      { name: 'to Polygon', chainId: '0x89' },
      { name: 'to Arbitrum', chainId: '0xa4b1' },
      { name: 'back to Ethereum', chainId: '0x1' },
    ]

    // Execute the rapid network switches (not waiting for completion)
    for (const networkSwitch of switchesToExecute) {
      await page.evaluate(chainId => {
        window.ethereum.request({
          method: 'wallet_switchEthereumChain', params: [{ chainId }],
        })

        // Don't wait - we want to trigger them rapidly
      }, networkSwitch.chainId)

      // Just wait a very short time between requests
      await page.waitForTimeout(50)
    }

    // Now immediately try to execute a transaction while networks are switching
    const txPromise = page.evaluate(() => {
      return window.ethereum
        .request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: window.ethereum.selectedAddress,
              to: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
              value: '0x1', // minimal value
              gas: '0x5208', // 21000 gas
            },
          ],
        })
        .catch(e => ({ error: e.message }))
    })

    // Wait a moment for all operations to settle
    await page.waitForTimeout(2000)

    // Get final chainId
    const finalChainId = await page.evaluate(() => window.ethereum.chainId)
    chainIdLog.push({ step: 'final', chainId: finalChainId })

    // Get network switch log
    const networkSwitches = await page.evaluate(() => window._networkSwitches)

    // Check results
    console.log('Network switches detected:', networkSwitches.length)
    expect(networkSwitches.length).toBeGreaterThan(0)

    // Get transaction result
    const txResult = await txPromise

    // Verify race condition detection
    const wasSentDuringSwitch = await page.evaluate(() => {
      // Check the last transaction in the logs
      const events = window.ethereum._eventsLog || []
      const lastTx = events.find(e => e.method === 'eth_sendTransaction')
      return lastTx?.params?.[0]?._sentDuringNetworkSwitch || false
    })

    // Now test for the actual vulnerability
    // In a real implementation, we would also check if the transaction
    // was attempted on an unexpected network
    expect(wasSentDuringSwitch).toBeTruthy()
  })

  test('should handle sequential (safe) network switching', async ({ page }) => {
    // First switch to Polygon
    await page.evaluate(() => {
      return window.ethereum.request({
        method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }],
      })
    })

    // Wait for the switch to complete
    await page.waitForTimeout(1000)

    // Now switch to Arbitrum
    await page.evaluate(() => {
      return window.ethereum.request({
        method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa4b1' }],
      })
    })

    // Wait for this switch to complete as well
    await page.waitForTimeout(1000)

    // Get network switch log
    const networkSwitches = await page.evaluate(() => window._networkSwitches)

    // Verify sequential switching worked
    expect(networkSwitches.length).toBe(2)

    // Send a transaction now that networks are stable
    const txResult = await page.evaluate(() => {
      return window.ethereum
        .request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: window.ethereum.selectedAddress,
              to: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
              value: '0x1', // minimal value
              gas: '0x5208', // 21000 gas
            },
          ],
        })
        .catch(e => ({ error: e.message }))
    })

    // Verify transaction wasn't during a switch
    const wasSentDuringSwitch = await page.evaluate(() => {
      // Check the last transaction in the logs
      const events = window.ethereum._eventsLog || []
      const lastTx = events.find(e => e.method === 'eth_sendTransaction')
      return lastTx?.params?.[0]?._sentDuringNetworkSwitch || false
    })

    // This should be false since we waited for network switches to complete
    expect(wasSentDuringSwitch).toBeFalsy()
  })
})
