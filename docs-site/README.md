# Web3FuzzForge Documentation Site

This directory contains the centralized documentation for the Web3FuzzForge project, built with [Docusaurus](https://docusaurus.io/).

## 📚 Documentation Overview

Our documentation is organized into the following sections:

- **Introduction** - Overview of Web3FuzzForge and its capabilities
- **Installation Guide** - Get started with Web3FuzzForge
- **Quickstart Tutorial** - Create your first tests
- **Security Testing** - Learn about the security testing capabilities
- **Wallet Integration** - Connect with real wallets
- **Mobile Testing** - Test mobile wallet interactions
- **Cross-Chain Testing** - Test dApps across multiple chains
- **Vulnerability Categorization** - Understand vulnerability types
- **Reporting** - Generate and interpret test reports

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16.x or higher)
- npm (version 7.x or higher)

### Installation

From the main project directory:

```bash
# Install documentation site dependencies
cd docs-site
npm install
```

### Running the Documentation Site Locally

```bash
# From the main project directory
npm run docs

# Or from the docs-site directory
npm start
```

The documentation site will be available at [http://localhost:3000](http://localhost:3000).

## 🛠️ Adding or Modifying Documentation

### Directory Structure

- `/docs` - Main documentation content
- `/blog` - Blog posts and announcements
- `/src/pages` - Static pages
- `/static` - Static assets like images
- `/sidebars.js` - Configuration for the documentation sidebar

### Adding a New Documentation Page

1. Create a new Markdown file in the appropriate directory under `/docs`
2. Add frontmatter at the top of the file:

```markdown
---
id: page-id
title: Page Title
sidebar_label: Menu Label
slug: /url-path
---

# Your Content Here
```

3. Update `sidebars.js` if needed to include your new page

### Adding Images

1. Place images in the `/static/img` directory
2. Reference them in your Markdown:

```markdown
![Alt Text](/img/your-image.png)
```

## 🏗️ Building for Production

To build the documentation site for production:

```bash
# From the main project directory
npm run docs:build

# Or from the docs-site directory
npm run build
```

The build artifacts will be in the `/docs-site/build` directory.

## 🚀 Deployment

### Serving the Built Site Locally

```bash
# From the main project directory
npm run docs:serve

# Or from the docs-site directory
npm run serve
```

### Deploying to GitHub Pages

```bash
# From the main project directory
npm run docs:deploy

# Or from the docs-site directory
npm run deploy
```

## ✨ Customization

### Styling

- Edit `/src/css/custom.css` to customize the site appearance
- Modify theme configuration in `docusaurus.config.js`

### Navigation

- Edit navbar and footer links in `docusaurus.config.js`
- Modify sidebar structure in `sidebars.js`

## 🤝 Contributing to Documentation

1. Create a feature branch for your changes
2. Make your updates to the documentation
3. Test locally to ensure everything looks correct
4. Submit a pull request with your changes

## 📝 Documentation Style Guide

- Use clear, concise language
- Include code examples when relevant
- Use headings to organize content
- Include screenshots for visual elements
- Link to related documentation pages

## 🔍 Search

The documentation site includes search functionality powered by the browser's local search index. For production deployment, consider configuring Algolia DocSearch in `docusaurus.config.js`.

## 🚨 Need Help?

If you need assistance with the documentation site, please:

1. Check the [Docusaurus documentation](https://docusaurus.io/docs)
2. Open an issue in the main repository
3. Reach out on our community channels
