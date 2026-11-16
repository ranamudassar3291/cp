export interface TrialDatacenter {
  id: 'uk' | 'us' | 'sg';
  country: string;
  city: string;
  clusterLabel: string;
}

export interface TrialEligiblePlan {
  id: 'cloud-ignite' | 'wp-core' | 'wincore-pro';
  eyebrow: string;
  name: string;
  audienceTag: string;
  highlightTone: 'amber' | 'cyan';
  monthlyAfterTrialUsd: number;
  serverPackageName: string;
  resources: {
    key: 'websites' | 'databases' | 'emails' | 'ssd';
    label: string;
  }[];
  features: {
    key:
      | 'ssl'
      | 'apps'
      | 'malware'
      | 'builder'
      | 'edge'
      | 'staging'
      | 'ddos'
      | 'ssh';
    label: string;
  }[];
}

export interface TrialIncludedCapability {
  title: string;
  description: string;
}

export interface TrialWorkflowStep {
  stepLabel: string;
  title: string;
  description: string;
  highlightNote?: string;
}

export interface TrialCustomerReview {
  quote: string;
  author: string;
  role: string;
  rating: string;
}

export const TRIAL_DATACENTERS: TrialDatacenter[] = [
  {
    id: 'uk',
    country: 'United Kingdom',
    city: 'London, UK',
    clusterLabel: 'UK Edge Cluster · London Tier-III+',
  },
  {
    id: 'us',
    country: 'United States',
    city: 'Dallas, Texas',
    clusterLabel: 'US Central Hub · Dallas Multi-AZ',
  },
  {
    id: 'sg',
    country: 'Asia Pacific',
    city: 'Singapore',
    clusterLabel: 'APAC Fiber Node · Singapore',
  },
];

export const TRIAL_ELIGIBLE_PLANS: TrialEligiblePlan[] = [
  {
    id: 'cloud-ignite',
    eyebrow: 'StackCP Linux Hosting',
    name: 'Cloud Ignite',
    audienceTag: 'For CMS & Web Apps',
    highlightTone: 'amber',
    monthlyAfterTrialUsd: 4.99,
    serverPackageName: 'stackcp_trial_ignite',
    resources: [
      { key: 'websites', label: '6 Linux Websites' },
      { key: 'databases', label: '18x Databases' },
      { key: 'emails', label: '24x Emails' },
      { key: 'ssd', label: '10GB SSD Space' },
    ],
    features: [
      { key: 'ssl', label: 'Free SSL' },
      { key: 'apps', label: '80+ App Installer' },
      { key: 'malware', label: 'Free Malware Scanning' },
      { key: 'builder', label: 'Free Website Builder' },
      { key: 'ddos', label: '1 Tbps+ DDoS Protection' },
    ],
  },
  {
    id: 'wp-core',
    eyebrow: 'StackCP WordPress Hosting',
    name: 'WP Core',
    audienceTag: 'For WordPress & Stores',
    highlightTone: 'cyan',
    monthlyAfterTrialUsd: 6.99,
    serverPackageName: 'stackcp_trial_wpcore',
    resources: [
      { key: 'websites', label: '1 WP Website' },
      { key: 'databases', label: '1 Database' },
      { key: 'emails', label: 'Unlimited Emails' },
      { key: 'ssd', label: '10GB SSD' },
    ],
    features: [
      { key: 'ssl', label: 'Free SSL' },
      { key: 'malware', label: 'Free Malware Scanning' },
      { key: 'builder', label: 'Free Website Builder' },
      { key: 'edge', label: 'Free NGINX edge cache' },
      { key: 'staging', label: 'WordPress Staging Site' },
      { key: 'ddos', label: '1 Tbps+ DDoS Protection' },
    ],
  },
  {
    id: 'wincore-pro',
    eyebrow: 'StackCP Windows Hosting',
    name: 'WinCore Pro',
    audienceTag: 'For ASP.NET & IIS Apps',
    highlightTone: 'cyan',
    monthlyAfterTrialUsd: 7.99,
    serverPackageName: 'stackcp_trial_wincore',
    resources: [
      { key: 'websites', label: '6 Windows Websites' },
      { key: 'databases', label: '18 MySQL Databases' },
      { key: 'emails', label: '24 Emails' },
      { key: 'ssd', label: '10GB SSD Space' },
    ],
    features: [
      { key: 'ssl', label: 'Free SSL' },
      { key: 'malware', label: 'Free Malware Scanning' },
      { key: 'ddos', label: '1 Tbps+ DDoS Protection' },
      { key: 'ssh', label: 'SSH & FTPS Access' },
    ],
  },
];

export const TRIAL_INCLUDED_CAPABILITIES: TrialIncludedCapability[] = [
  {
    title: 'Full StackCP Control Plane',
    description:
      'Administer domains, mailboxes, SFTP credentials, SQL databases, and staging sandboxes inside one streamlined dashboard.',
  },
  {
    title: 'Wildcard SSL Certificates',
    description:
      'Every domain and unlimited subdomain automatically provisions trusted TLS encryption with zero renewal fees.',
  },
  {
    title: 'Worldwide Anycast CDN',
    description:
      'Accelerate images, stylesheets, and static bundles from edge PoPs geographically closest to your global audience.',
  },
  {
    title: '80+ One-Click Applications',
    description:
      'Launch WordPress and over eighty verified scripts instantaneously without command-line setup delays.',
  },
  {
    title: 'Twice-Daily Offsite Backups',
    description:
      'Restore individual files, web roots, or complete SQL tables cleanly in one click whenever an update needs rolling back.',
  },
  {
    title: 'Hardware-Level Cloud Defense',
    description:
      'Automated malware scanning pairs with 1 Tbps+ upstream DDoS mitigation to protect production tests continuously.',
  },
];

export const TRIAL_WORKFLOW_STEPS: TrialWorkflowStep[] = [
  {
    stepLabel: 'Step 1 — Select Your Platform:',
    title: 'Choose Cloud Ignite, WP Core, or WinCore Pro',
    description:
      'Pick the Linux, Managed WordPress, or Windows IIS architecture matched to your application and select your closest regional datacentre.',
  },
  {
    stepLabel: 'Step 2 — Quick Account Verification:',
    title: 'Verify Your Workspace With $0.00 Billed Today',
    description:
      'Create your cpcloudhost.com client account and apply promo code STARTFREE to pass spam verification with $0.00 due today.',
  },
  {
    stepLabel: 'Step 3 — Immediate Deployment:',
    title: 'Provision Your Isolated Container in Seconds',
    description:
      'Receive immediate access to StackCP so you can transfer live sites, deploy WordPress staging builds, or push clean ASP.NET apps.',
  },
  {
    stepLabel: 'Step 4 — Stay or Cancel Anytime on Day 30:',
    title: 'Full Control Before Billing Begins',
    description:
      'Love the NVMe speed? Keep running seamlessly with zero re-setup. Not the right fit? Cancel in one click inside StackCP before Day 30 and owe nothing.',
  },
];

export const TRIAL_REVIEWS: TrialCustomerReview[] = [
  {
    quote:
      'Testing Cloud Ignite with STARTFREE gave our agency time to verify real-world TTFB improvements before moving 14 client sites over.',
    author: 'Daniel Carter',
    role: 'Technical Director, Northgate Digital',
    rating: '5.0 / 5 Verified Deployment',
  },
  {
    quote:
      'WP Core edge caching dropped checkout latency on our storefront immediately during the 30-day evaluation.',
    author: 'Hannah Patel',
    role: 'Operations Lead, Loom & Linen Studio',
    rating: '5.0 / 5 Verified Migration',
  },
  {
    quote:
      'Smooth IIS 10 setup on WinCore Pro with SFTP ready out of the box and responsive support responses under five minutes.',
    author: 'Marcus Gallagher',
    role: 'Principal Systems Architect, ClearLedger',
    rating: '5.0 / 5 Verified Workspace',
  },
];
