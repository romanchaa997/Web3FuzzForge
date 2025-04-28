# Branding Implementation Guide

This guide provides practical instructions for implementing the Web3FuzzForge brand identity across the codebase.

## Getting Started

1. Read the [Brand & Style Guide](./branding-style-guide.md) first to understand the principles
2. For questions about branding usage, contact the project lead

## Logo Implementation

### Adding the Logo to New Areas

The logo is available in several formats in `docs-site/static/img/`:

- `logo.svg` - Standard logo for light backgrounds
- `logo-dark.svg` - Variant for dark backgrounds
- `logo-horizontal.svg` - Horizontal variant for headers
- `favicon.svg` - Icon for browser tabs

Example of adding the logo in HTML:

```html
<img src="/img/logo.svg" alt="Web3FuzzForge" class="logo" />
```

Example in Markdown:

```md
# <img src="docs-site/static/img/logo.svg" width="28" height="28" alt="Web3FuzzForge"> Web3FuzzForge
```

## Color Usage

### Importing Brand Colors in CSS

```css
:root {
  --web3-primary: #3778FF;
  --web3-secondary: #6147FF;
  --web3-accent: #b947ff;
  --web3-dark: #19191F;
  --web3-light: #f7f9fc;
}
```

### Using Colors in JavaScript

```javascript
const COLORS = {
  primary: '#3778FF',
  secondary: '#6147FF',
  accent: '#b947ff',
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
}
```

## CLI Styling

### Integrating the CLI Styling Utility

```javascript
const cli = require('../src/utils/cli-styling');

// Success message
console.log(cli.success('Operation completed successfully'));

// Section headers
console.log(cli.sectionHeader('Test Results'));

// Progress tracking
console.log(cli.progressBar(currentStep, totalSteps));
```

### Adding to New Commands

When adding new commands to the CLI tool, always use the CLI styling utility:

```javascript
program
  .command('new-command')
  .description('Description of new command')
  .action(async () => {
    console.log(cli.BRAND_HEADER);
    console.log(cli.info('Starting the process...'));
    
    // Show spinner for long operations
    const spinner = cli.spinner('Processing...');
    spinner.start();
    
    try {
      // Do work here
      spinner.succeed('Process completed successfully');
    } catch (error) {
      spinner.fail('Process failed');
      console.log(cli.error(error.message));
    }
  });
```

## Documentation Components

### Alerts and Callouts

Use these custom containers in Markdown:

```md
<div class="securityContainer">

**Security Note:** Important security information.

</div>

<div class="quickStartContainer">

**Quick Tip:** Helpful tip for users.

</div>
```

### Code Blocks

Always use syntax highlighting with code blocks:

````md
```javascript
// Code with correct syntax highlighting
const example = "value";
```
````

## Updating Existing Code

### Checklist for Brand Consistency

When updating existing code, check for these items:

- [ ] Replace any custom colors with brand color variables
- [ ] Update any terminal output to use cli-styling.js
- [ ] Make sure all logos are current versions
- [ ] Ensure fonts match the system UI stack
- [ ] Check dark mode compatibility

## NPM Package Branding

When updating the NPM package:

1. Use the logo in the README.md
2. Include brand colors in the package.json metadata
3. Update screenshot images to show the current branding

## Questions and Support

For questions about implementing the branding, please:

1. Review the style guide first
2. Check existing implementations for reference
3. Contact the project lead for clarification if needed 