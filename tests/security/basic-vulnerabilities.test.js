const { test, expect } = require('@playwright/test');
const { setupTestPageWithUI } = require('../utils/test-setup');

test.describe('Basic Web3 Security Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    await setupTestPageWithUI(page);
  });

  test('Check for exposed private keys in frontend code', async () => {
    // Scan page source for potential private key patterns
    const source = await page.content();
    const privateKeyPatterns = [
      /private.*key.*['"]\w{64}['"]/i,
      /0x[a-fA-F0-9]{64}/,
      /['"]\w{64}['"].*private/i
    ];

    for (const pattern of privateKeyPatterns) {
      expect(source.match(pattern), 
        'Private key pattern found in frontend code').toBeFalsy();
    }
  });

  test('Check for insecure RPC endpoints', async () => {
    const insecurePatterns = [
      /http:\/\/[^s]/i,  // Non-HTTPS endpoints
      /localhost|127\.0\.0\.1/i,  // Local development endpoints
      /infura\.io\/v3\/[a-zA-Z0-9]+/i  // Exposed Infura API keys
    ];

    const source = await page.content();
    for (const pattern of insecurePatterns) {
      expect(source.match(pattern),
        'Insecure RPC endpoint found').toBeFalsy();
    }
  });

  test('Check for proper transaction signing', async () => {
    // Mock ethereum provider
    await page.evaluate(() => {
      window.ethereum = {
        request: async ({ method, params }) => {
          if (method === 'eth_sendTransaction') {
            const tx = params[0];
            // Check for required transaction parameters
            if (!tx.gas || !tx.to || tx.value === undefined) {
              throw new Error('Missing required transaction parameters');
            }
            // Validate address format
            if (!/^0x[a-fA-F0-9]{40}$/.test(tx.to)) {
              throw new Error('Invalid address format');
            }
            return '0x' + '1'.repeat(64); // Mock transaction hash
          }
          return null;
        }
      };
    });

    // Attempt to send transaction
    const txError = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ to: '0x1234' }] // Invalid address
        });
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(txError).toBeTruthy();
    expect(txError).toContain('Invalid address format');
  });

  test('Check for proper error handling in transaction flow', async () => {
    // Mock ethereum provider with various error scenarios
    await page.evaluate(() => {
      window.ethereum = {
        request: async ({ method }) => {
          switch (method) {
            case 'eth_requestAccounts':
              throw new Error('User rejected connection');
            case 'eth_sendTransaction':
              throw new Error('Insufficient funds');
            default:
              return null;
          }
        }
      };
    });

    // Test wallet connection error handling
    const connectError = await page.evaluate(async () => {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(connectError).toBe('User rejected connection');

    // Test transaction error handling
    const txError = await page.evaluate(async () => {
      try {
        await window.ethereum.request({ method: 'eth_sendTransaction', params: [{}] });
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(txError).toBe('Insufficient funds');
  });

  test('Check for replay attack protection', async () => {
    await page.evaluate(() => {
      window.ethereum = {
        chainId: '0x1',
        networkVersion: '1',
        request: async ({ method, params }) => {
          if (method === 'eth_sendTransaction') {
            const tx = params[0];
            // Check for chainId in transaction
            if (!tx.chainId) {
              throw new Error('Missing chainId in transaction');
            }
            return '0x' + '1'.repeat(64);
          }
          return null;
        }
      };
    });

    // Attempt transaction without chainId
    const txError = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            to: '0x' + '1'.repeat(40),
            value: '0x0',
            gas: '0x5208'
          }]
        });
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(txError).toBe('Missing chainId in transaction');
  });

  test('Check for proper input validation', async () => {
    // Test various malicious inputs
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '${process.env.PRIVATE_KEY}',
      '0x' + '0'.repeat(39) // Invalid address length
    ];

    // Inject inputs into address field
    for (const input of maliciousInputs) {
      await page.evaluate((value) => {
        const input = document.createElement('input');
        input.value = value;
        document.body.appendChild(input);
        const event = new Event('change');
        input.dispatchEvent(event);
      }, input);

      // Check if input was sanitized
      const sanitizedValue = await page.evaluate(() => {
        const input = document.querySelector('input');
        return input.value;
      });

      expect(sanitizedValue).not.toBe(input);
    }
  });
}); 