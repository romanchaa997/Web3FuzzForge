import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/overview">
            Get Started in 5 Minutes →
          </Link>
          <Link
            className="button button--secondary button--lg margin-horiz--sm"
            href="https://gitlab.com/romanchaa997/web3-security-test-kit"
            target="_blank"
            rel="noopener noreferrer">
            GitLab
          </Link>
          <Link
            className="button button--secondary button--lg margin-horiz--sm"
            href="https://github.com/romanchaa997/Web3FuzzForge"
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} Documentation`}
      description="Comprehensive testing toolkit for Web3 dApps">
      <HomepageHeader />
      <main>
        {/* What is Web3FuzzForge section with image */}
        <section className={styles.whatIsSection}>
          <div className="container">
            <div className="row">
              <div className="col col--7">
                <h2 className={styles.sectionTitle}>What is Web3FuzzForge?</h2>
                <p>
                  Web3FuzzForge is a security-first test kit designed to help Web3 developers identify 
                  vulnerabilities in wallet integration, transaction flows, and smart contract interactions, 
                  before they go live. With automated fuzzing, extensive browser compatibility, and 
                  detailed reporting, we empower teams to fortify their dApps against real-world threats.
                </p>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <span className={styles.checkmark}>✓</span> Wallet integration testing
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.checkmark}>✓</span> Transaction flow fuzzing
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.checkmark}>✓</span> Smart contract security validation
                  </div>
                </div>
              </div>
              <div className="col col--5">
                <div className={styles.imageContainer}>
                  <img 
                    src="/img/logo.svg" 
                    alt="Web3FuzzForge Logo" 
                    className={styles.heroImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section with icons */}
        <section className={styles.features}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Key Features</h2>
            <div className="row">
              <div className="col col--4">
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🔍</div>
                  <h3>Multi-Wallet Support</h3>
                  <p>Test with MetaMask, WalletConnect, Coinbase, Phantom, and more wallets</p>
                  <ul className={styles.featureCardList}>
                    <li>Automatic wallet extension control</li>
                    <li>Cross-browser compatibility</li>
                    <li>Session persistence</li>
                  </ul>
                </div>
              </div>
              <div className="col col--4">
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🛡️</div>
                  <h3>Security Testing</h3>
                  <p>Built-in fuzzing support and vulnerability detection</p>
                  <ul className={styles.featureCardList}>
                    <li>Unlimited approval detection</li>
                    <li>Transaction flow fuzzing</li>
                    <li>Malicious input testing</li>
                  </ul>
                </div>
              </div>
              <div className="col col--4">
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>📸</div>
                  <h3>Wallet Snapshots</h3>
                  <p>Save and restore wallet states for complex test scenarios</p>
                  <ul className={styles.featureCardList}>
                    <li>Deterministic test runs</li>
                    <li>Multiple account states</li>
                    <li>Cross-network testing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Quick Start section */}
        <section className={styles.quickStartSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Quick Start</h2>
            <div className="row">
              <div className="col col--6">
                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>Installation</div>
                  <pre className={styles.codeContent}>
                    <code>npm install web3fuzzforge</code>
                  </pre>
                </div>
              </div>
              <div className="col col--6">
                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>Basic Usage</div>
                  <pre className={styles.codeContent}>
                    <code>
                      {`# Generate a connection test
web3fuzzforge generate connect --wallet metamask

# Run tests with a browser UI
web3fuzzforge run --headed`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
            <div className={styles.ctaContainer}>
              <Link
                className="button button--primary button--lg margin-right--md"
                to="/docs/installation">
                Installation Guide
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/docs/quickstart">
                Quick Start Guide
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
