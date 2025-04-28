# Web3FuzzForge Landing Page Deployment Guide

This guide will help you deploy the Web3FuzzForge landing page using various free hosting options while maintaining brand consistency.

## Prerequisites

Before deploying, make sure:
1. Your `assets` folder contains all the necessary images:
   - `logo.png` - Matches the official Web3FuzzForge logo style
   - `favicon.png` - Matches favicon.svg from docs-site
   - `web3fuzzforge-banner.png` - Uses official brand colors
   - `demo.gif` - Shows the tool in action with CLI styling
2. You've updated the GitHub links in the HTML file to point to your actual repository.
3. All brand colors match the official palette (#3778FF, #6147FF, #B947FF).

## Brand Guidelines Compliance

Ensure your deployment maintains brand consistency:

1. **Colors**: All colors should match the brand palette defined in `docs/branding-style-guide.md`.
2. **Typography**: Use the system UI font stack specified in the brand guidelines.
3. **Logo**: Use the official logo with correct proportions and colors.
4. **Voice & Tone**: All content should follow the "professional but approachable, technical but clear" voice.

## Option 1: GitHub Pages

GitHub Pages is the simplest option if you're already hosting your code on GitHub.

### Steps:

1. **Push your files to GitHub:**
   - Make sure `index.html` has the correct paths to assets
   - Push your repository including the `index.html` and `assets` folder

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Source," select "main" branch
   - Save the changes
   - Your site will be available at `https://yourusername.github.io/web3fuzzforge/`

3. **Connect with Documentation:**
   - If you're using GitHub Pages for your documentation site, ensure links between the landing page and docs work correctly

## Option 2: Netlify

Netlify offers a user-friendly deployment with additional features like forms and serverless functions.

### Steps:

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Deploy your site:**
   - Click "New site from Git"
   - Connect to your GitHub repository
   - Select the repository
   - Deploy settings: leave as default
   - Click "Deploy site"

3. **Custom domain (optional):**
   - Go to Site settings > Domain management
   - Add your custom domain and follow the instructions

4. **Environment Variables:**
   - If your landing page needs to connect to the documentation site, set up environment variables for the documentation URL

## Option 3: Vercel

Vercel is optimized for frontend frameworks but works great with static sites too.

### Steps:

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Deploy your site:**
   - Click "New Project"
   - Import your GitHub repository
   - Configure project: leave defaults
   - Click "Deploy"

3. **Custom domain (optional):**
   - Go to Project settings > Domains
   - Add your domain and follow the verification steps

4. **Integrations:**
   - Consider connecting with your documentation site through Vercel's integrations

## Customizing Your Domain

For all options above, you can use a custom domain:

1. **Purchase a domain** from registrars like Namecheap, GoDaddy, or Google Domains

2. **Set up DNS records** according to the instructions provided by your hosting platform

3. **Wait for DNS propagation** (can take up to 48 hours, but usually much faster)

4. **Add Analytics:**
   - Consider adding Google Analytics or Plausible for tracking visitor data
   - This will help measure landing page effectiveness

## Launch Checklist

Before sharing your site:

- [x] Test all links work correctly
- [x] Verify images load properly
- [x] Check mobile responsiveness
- [x] Validate HTML for errors
- [x] Update social media metadata (OpenGraph and Twitter cards)
- [x] Replace "your-username" with your actual GitHub username in all links
- [x] Ensure colors match the brand guidelines
- [x] Verify documentation links are correct
- [x] Test all interactive elements work as expected

## Integration with Documentation Site

To ensure seamless integration between your landing page and documentation:

1. **Consistent Navigation:** Make sure links to documentation sections are correct
2. **Unified Style:** Apply the same styling to both sites where appropriate
3. **Cross-Linking:** Include a "Back to Home" link in your documentation site
4. **Shared Assets:** Consider sharing the assets folder between both sites

## Promotion Tips

To get more visibility:
- Share on Twitter/X with #Web3 #Security #Developers hashtags
- Post on LinkedIn targeting Web3 developers
- Submit to [Product Hunt](https://producthunt.com)
- Share in relevant Discord communities
- Add to your GitHub profile
- Create a brief demo video for YouTube
- Share in Web3 security forums and communities
- Consider writing a blog post about the security improvements 