const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Web3FuzzForge extension is now active!');

    // Register the template generation command
    let generateTemplateCommand = vscode.commands.registerCommand('web3fuzzforge.generateTemplate', async function () {
        try {
            const templates = [
                { label: "Wallet Connection Test", type: "connection" },
                { label: "Transaction Signing Test", type: "transaction" },
                { label: "Network Switching Test", type: "network" },
                { label: "Security Test", type: "security" },
                { label: "Custom Test", type: "custom" }
            ];

            const selectedTemplate = await vscode.window.showQuickPick(templates, {
                placeHolder: "Select a test template type"
            });

            if (!selectedTemplate) return;

            const walletTypes = [
                { label: "MetaMask", value: "metamask" },
                { label: "Coinbase Wallet", value: "coinbase" },
                { label: "Phantom", value: "phantom" },
                { label: "Rabby", value: "rabby" },
                { label: "WalletConnect", value: "walletconnect" }
            ];

            const selectedWallet = await vscode.window.showQuickPick(walletTypes, {
                placeHolder: "Select a wallet type"
            });

            if (!selectedWallet) return;

            const targetDapp = await vscode.window.showInputBox({
                prompt: "Enter the dApp URL to test",
                placeHolder: "http://localhost:3000",
                value: vscode.workspace.getConfiguration('web3fuzzforge').get('defaultDappUrl')
            });

            if (!targetDapp) return;

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage("No workspace folder open");
                return;
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            let outputDir;

            try {
                // Check if tests directory exists, if not create it
                outputDir = path.join(rootPath, 'tests');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                // Create subdirectory based on template type
                let subDir;
                switch (selectedTemplate.type) {
                    case 'security':
                        subDir = path.join(outputDir, 'security');
                        break;
                    case 'connection':
                    case 'transaction':
                    case 'network':
                        subDir = path.join(outputDir, 'wallet-interactions');
                        break;
                    default:
                        subDir = outputDir;
                }

                if (!fs.existsSync(subDir)) {
                    fs.mkdirSync(subDir);
                }

                // Generate test file name
                const fileName = `${selectedWallet.value}-${selectedTemplate.type}-test.js`;
                const filePath = path.join(subDir, fileName);

                // Call the CLI to generate the template
                const terminal = vscode.window.createTerminal('Web3FuzzForge');
                terminal.sendText(`npx web3fuzzforge generate --type ${selectedTemplate.type} --wallet ${selectedWallet.value} --url "${targetDapp}" --output "${filePath}"`);
                terminal.show();

                // Open the generated file after a brief delay
                setTimeout(() => {
                    vscode.workspace.openTextDocument(filePath).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }, 2000);

            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate template: ${error.message}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Register the help command
    let showHelpCommand = vscode.commands.registerCommand('web3fuzzforge.showHelp', function () {
        const panel = vscode.window.createWebviewPanel(
            'web3fuzzforgeHelp',
            'Web3FuzzForge Help',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getHelpWebviewContent();
    });

    context.subscriptions.push(generateTemplateCommand, showHelpCommand);

    // Register hover provider for inline help
    const hoverProvider = vscode.languages.registerHoverProvider(['javascript', 'typescript'], {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            // Check if the word is a known Web3FuzzForge function or class
            if (isWeb3FuzzForgeKeyword(word)) {
                return new vscode.Hover(getKeywordDocumentation(word));
            }
            
            return null;
        }
    });

    context.subscriptions.push(hoverProvider);
}

function isWeb3FuzzForgeKeyword(word) {
    const keywords = [
        'connectWallet', 'approveTransaction', 'switchNetwork',
        'getWalletState', 'saveWalletState', 'loadWalletState',
        'expectWalletConnection', 'expectBalanceChange',
        'setupMetaMask', 'setupCoinbase', 'setupPhantom',
        'Web3FuzzForge', 'SecurityTest', 'WalletTest'
    ];
    
    return keywords.includes(word);
}

function getKeywordDocumentation(keyword) {
    const docs = {
        'connectWallet': 'Connects the specified wallet to the dApp.\n\n**Example:**\n```js\nawait connectWallet();\n```',
        'approveTransaction': 'Approves a transaction in the wallet.\n\n**Example:**\n```js\nawait approveTransaction();\n```',
        'switchNetwork': 'Switches the wallet to a different network.\n\n**Example:**\n```js\nawait switchNetwork("mainnet");\n```',
        'getWalletState': 'Returns the current state of the wallet.\n\n**Example:**\n```js\nconst state = await getWalletState();\n```',
        'saveWalletState': 'Saves the current wallet state for later use.\n\n**Example:**\n```js\nawait saveWalletState("myState");\n```',
        'loadWalletState': 'Loads a previously saved wallet state.\n\n**Example:**\n```js\nawait loadWalletState("myState");\n```',
        'expectWalletConnection': 'Expects that the wallet is connected to the dApp.\n\n**Example:**\n```js\nawait expectWalletConnection();\n```',
        'expectBalanceChange': 'Expects a balance change in the wallet.\n\n**Example:**\n```js\nawait expectBalanceChange(walletAddress, "-0.1");\n```',
        'setupMetaMask': 'Sets up MetaMask for testing.\n\n**Example:**\n```js\nawait setupMetaMask();\n```',
        'setupCoinbase': 'Sets up Coinbase Wallet for testing.\n\n**Example:**\n```js\nawait setupCoinbase();\n```',
        'setupPhantom': 'Sets up Phantom Wallet for testing.\n\n**Example:**\n```js\nawait setupPhantom();\n```',
        'Web3FuzzForge': 'Main class for the Web3FuzzForge framework.\n\n**Example:**\n```js\nconst forge = new Web3FuzzForge();\n```',
        'SecurityTest': 'Class for security-focused tests.\n\n**Example:**\n```js\nconst test = new SecurityTest();\n```',
        'WalletTest': 'Class for wallet interaction tests.\n\n**Example:**\n```js\nconst test = new WalletTest();\n```'
    };
    
    return docs[keyword] || `No documentation available for "${keyword}"`;
}

function getHelpWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Web3FuzzForge Help</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                margin: 20px;
            }
            h1 {
                border-bottom: 1px solid #eaecef;
                padding-bottom: 0.3em;
            }
            h2 {
                margin-top: 24px;
                margin-bottom: 16px;
                font-weight: 600;
                line-height: 1.25;
            }
            code {
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                background-color: rgba(27, 31, 35, 0.05);
                border-radius: 3px;
                padding: 0.2em 0.4em;
            }
            pre {
                background-color: #f6f8fa;
                border-radius: 3px;
                padding: 16px;
                overflow: auto;
            }
            pre code {
                background-color: transparent;
                padding: 0;
            }
            .command {
                font-weight: bold;
                color: #0366d6;
            }
            .shortcut {
                background-color: #e1e4e8;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <h1>Web3FuzzForge VS Code Extension Help</h1>
        
        <h2>Commands</h2>
        <ul>
            <li><span class="command">Web3FuzzForge: Generate Test Template</span> - Creates a new test file with a template based on the selected options</li>
            <li><span class="command">Web3FuzzForge: Show Help</span> - Shows this help page</li>
        </ul>
        
        <h2>Code Snippets</h2>
        <p>The following snippets are available when editing JavaScript/TypeScript files:</p>
        <ul>
            <li><code>w3ff-connect</code> - Insert a wallet connection test</li>
            <li><code>w3ff-tx</code> - Insert a transaction signing test</li>
            <li><code>w3ff-network</code> - Insert a network switching test</li>
            <li><code>w3ff-security</code> - Insert a security test template</li>
            <li><code>w3ff-expect</code> - Insert wallet state assertions</li>
        </ul>
        
        <h2>Inline Help</h2>
        <p>Hover over Web3FuzzForge functions and classes to see documentation and examples.</p>
        
        <h2>Examples</h2>
        <h3>Basic Wallet Connection Test</h3>
        <pre><code>const { test, expect } = require('@playwright/test');
const { setupMetaMask, connectWallet } = require('web3fuzzforge');

test('Connect MetaMask wallet to dApp', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Setup MetaMask with a testing account
  const metamask = await setupMetaMask();
  
  // Connect wallet to dApp
  await connectWallet(page, metamask);
  
  // Verify connection was successful
  await expect(page.locator('.wallet-address')).toBeVisible();
});</code></pre>
        
        <h3>Transaction Test</h3>
        <pre><code>const { test, expect } = require('@playwright/test');
const { setupMetaMask, connectWallet, approveTransaction } = require('web3fuzzforge');

test('Sign a transaction with MetaMask', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Setup and connect wallet
  const metamask = await setupMetaMask();
  await connectWallet(page, metamask);
  
  // Interact with dApp to trigger a transaction
  await page.locator('#send-tx-button').click();
  
  // Approve the transaction in MetaMask
  await approveTransaction(metamask);
  
  // Verify transaction was processed
  await expect(page.locator('.tx-success')).toBeVisible();
});</code></pre>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}; 