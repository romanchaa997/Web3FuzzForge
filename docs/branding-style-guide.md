# Web3FuzzForge Brand & Style Guide

This document outlines the visual identity and branding guidelines for Web3FuzzForge to ensure consistency across all platforms and communications.

## Logo

The Web3FuzzForge logo represents our focus on Web3 security testing with a shield design containing blockchain network lines and a security lock symbol.

### Logo Variants

| Variant | Usage |
|---------|-------|
| Standard | Primary logo for most applications |
| Dark | For use on dark backgrounds |
| Horizontal | For header bars and wider layouts |
| Icon | For favicon and small applications |

All logo files are available in the `docs-site/static/img/` directory.

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #3778FF | Main brand color, buttons, links |
| Secondary Purple | #6147FF | Accents, secondary buttons |
| Accent Pink | #B947FF | Highlights, gradient endpoints |
| Dark | #19191F | Dark mode backgrounds |
| Light | #F7F9FC | Light mode backgrounds |

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Success | #2ECC71 | Success messages, confirmations |
| Warning | #F39C12 | Warnings, cautions |
| Error | #E74C3C | Error messages, critical alerts |
| Info | #3498DB | Information messages, tips |

## Typography

### Web Interface

- Primary Font: System UI stack (system-ui, -apple-system, Segoe UI, Roboto, etc.)
- Headings: 600 weight (semi-bold)
- Body: 400 weight (regular)

### CLI Output

All CLI output should use the styling utilities from `src/utils/cli-styling.js` for consistency.

## UI Elements

### Containers & Cards

- Border Radius: 8px
- Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.1)
- Border Accents: 4px left border in brand colors

### Alerts & Notices

Use the semantic colors with appropriate icons:
- ✅ Success
- ⚠️ Warning
- ❌ Error
- ℹ️ Info

## CLI Styling

### Message Formatting

Always use the CLI styling utilities for consistent output:

```javascript
const cli = require('../src/utils/cli-styling');

console.log(cli.success('Operation completed successfully'));
console.log(cli.warning('Potential issue detected'));
console.log(cli.error('An error occurred'));
console.log(cli.info('Additional information'));
```

### Section Headers

Use section headers to organize CLI output:

```javascript
console.log(cli.sectionHeader('Test Results'));
```

### Progress Indicators

For long-running operations, use spinner and progress bar:

```javascript
const spinner = cli.spinner('Running tests...');
spinner.start();

// When operation completes
spinner.succeed('Tests completed successfully');

// For progress tracking
console.log(cli.progressBar(current, total));
```

## Documentation Style

### Headings

- Use sentence case for headings
- Maximum of 3 heading levels in documentation

### Code Blocks

- Use syntax highlighting for all code examples
- Include language identifier with code fences

### Callouts

Use the custom containers for important information:

```md
<div class="securityContainer">

**Security Note:** Important security information goes here.

</div>

<div class="quickStartContainer">

**Quick Tip:** Helpful tips go here.

</div>
```

## Brand Voice

- Professional but approachable
- Technical but clear
- Security-focused but encouraging
- Confident but not arrogant 