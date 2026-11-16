export interface WordPressPlan {
  id: 'wp-core' | 'wp-studio' | 'wp-flagship';
  brandSeries: string;
  name: string;
  audience: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  recommended?: boolean;
  resources: {
    key: 'wp-sites' | 'databases' | 'emails' | 'ssd';
    label: string;
  }[];
  features: string[];
}

export interface WordPressCoreFeature {
  id: 'staging' | 'manager' | 'updates' | 'cli' | 'checksum' | 'stackcache';
  title: string;
  description: string;
}

export interface WordPressFaqItem {
  question: string;
  answer: string;
}

export const WORDPRESS_PLANS: WordPressPlan[] = [
  {
    id: 'wp-core',
    brandSeries: 'StackCP Managed WordPress',
    name: 'WP Core',
    audience: 'For Blogs & Creators',
    tagline: 'Essential managed speed for single sites.',
    monthlyPrice: 2.5,
    annualPrice: 30.0,
    resources: [
      { key: 'wp-sites', label: '1 WP Website' },
      { key: 'databases', label: '1 Database' },
      { key: 'emails', label: 'Unlimited Emails' },
      { key: 'ssd', label: '10GB SSD' },
    ],
    features: [
      'Free SSL',
      'Free Malware Scanning',
      'Free Website Builder',
      'Free NGINX edge cache',
      'WordPress Staging Site',
      '1 Tbps+ DDoS Protection',
    ],
  },
  {
    id: 'wp-studio',
    brandSeries: 'StackCP Managed WordPress',
    name: 'WP Studio',
    audience: 'For Growing Brands',
    tagline: 'Tuned performance for multi-site businesses.',
    monthlyPrice: 3.49,
    annualPrice: 41.88,
    recommended: true,
    resources: [
      { key: 'wp-sites', label: '6 WP Websites' },
      { key: 'databases', label: '6 Databases' },
      { key: 'emails', label: 'Unlimited Emails' },
      { key: 'ssd', label: '20GB SSD' },
    ],
    features: [
      'Free SSL',
      'Free Malware Scanning',
      'Free Website Builder',
      'Free NGINX edge cache',
      'WordPress Staging Site',
      '1 Tbps+ DDoS Protection',
    ],
  },
  {
    id: 'wp-flagship',
    brandSeries: 'StackCP Managed WordPress',
    name: 'WP Flagship',
    audience: 'For Agencies & Commerce',
    tagline: 'Unrestricted capacity for high-volume fleets.',
    monthlyPrice: 4.49,
    annualPrice: 53.88,
    resources: [
      { key: 'wp-sites', label: 'Unlimited WP Websites' },
      { key: 'databases', label: 'Unlimited Databases' },
      { key: 'emails', label: 'Unlimited Emails' },
      { key: 'ssd', label: 'Unlimited SSD' },
    ],
    features: [
      'Free SSL',
      'Free Malware Scanning',
      'Free Website Builder',
      'Free NGINX edge cache',
      'WordPress Staging Site',
      '1 Tbps+ DDoS Protection',
    ],
  },
];

export const WORDPRESS_CORE_FEATURES: WordPressCoreFeature[] = [
  {
    id: 'staging',
    title: 'Sandboxed 1-Click Staging',
    description:
      'Spin up a private replica of your production site in seconds. Safely preview plugin updates, PHP 8.4 compatibility, or custom layout code before syncing live.',
  },
  {
    id: 'manager',
    title: 'Unified WordPress Manager',
    description:
      'Oversee all hosted WordPress themes, plugins, and admin accounts from one central view at cpcloudhost.com — activate, deactivate, or update in bulk effortlessly.',
  },
  {
    id: 'updates',
    title: 'Automated Core & Patch Rollouts',
    description:
      'Continuous upstream monitoring applies vetted WordPress core releases and critical security patches automatically, reducing manual maintenance overhead.',
  },
  {
    id: 'cli',
    title: 'Developer CLI & Runtime Suite',
    description:
      'Deploy faster with built-in WP-CLI commands, SSH access, SFTP/FTPS, phpMyAdmin, cron automation, and per-site PHP version switching up to PHP 8.4.',
  },
  {
    id: 'checksum',
    title: 'Core Checksum Integrity Guard',
    description:
      'Continuously verify active core WordPress files against official upstream signatures and receive immediate diagnostics if any unexpected file edits are detected.',
  },
  {
    id: 'stackcache',
    title: 'StackCache & Global CDN Layer',
    description:
      'Server-native page caching pairs directly with our worldwide Anycast CDN so visitors experience rapid time-to-first-byte without relying on bloated add-ons.',
  },
];

export const WORDPRESS_FAQS: WordPressFaqItem[] = [
  {
    question: 'What is Managed WordPress Cloud Hosting at cpcloudhost.com?',
    answer:
      'Unlike single-server shared plans, cpcloudhost.com runs WordPress inside StackCP autoscaling cloud containers natively tuned for PHP 8.4, MySQL optimization, NGINX edge caching, and automated core security.',
  },
  {
    question: 'How does it differ from generic shared web hosting?',
    answer:
      'Every tier on our Managed WordPress platform includes 1-click staging sandboxes, unified theme & plugin fleet management, WP-CLI, checksum malware verification, and StackCache pre-configured out of the box.',
  },
  {
    question: 'Can you migrate an existing WordPress site with zero downtime?',
    answer:
      'Yes. Our engineering team transfers unlimited WordPress files, databases, themes, SSL certificates, and mailboxes for free while keeping your live website online during DNS transition.',
  },
  {
    question: 'Is this environment built for high-traffic WooCommerce stores?',
    answer:
      'Yes. StackCache intelligently bypasses dynamic cart and checkout cookies while caching storefront catalog pages at the edge, ensuring fast checkouts even during major flash sales.',
  },
  {
    question: 'Do all WordPress plans include Wildcard SSL certificates?',
    answer:
      'Every Managed WordPress plan ships with complimentary auto-renewing Wildcard SSL protecting your root domain, staging domains, and unlimited subdomains.',
  },
  {
    question: 'Can I scale from WP Core up to WP Flagship later?',
    answer:
      'Anytime. Upgrade seamlessly inside your cpcloudhost.com client dashboard without rebuilding websites or experiencing migration downtime.',
  },
  {
    question: 'Which PHP versions and builders are supported?',
    answer:
      'We support instant per-site switching from PHP 5.6 through PHP 8.4, alongside seamless compatibility with Elementor, Gutenberg, Divi, Bricks, and headless setups.',
  },
  {
    question: 'Do you offer a 30-day risk-free evaluation?',
    answer:
      'Yes — test any Managed WordPress tier risk-free for 30 days on cpcloudhost.com, backed by Switch Credits for up to 6 months of unused time from your current provider.',
  },
];
