export type ServiceCategoryId =
  | 'shared'
  | 'wordpress'
  | 'windows'
  | 'reseller'
  | 'cpanel'
  | 'vps'
  | 'aws'
  | 'gcp'
  | 'domains'
  | 'migrations';

export type PortalTab = 'order' | 'login' | 'migration' | 'domain' | 'support';

export interface NavDropdownItem {
  label: string;
  description: string;
  portalTab?: PortalTab;
  planId?: string;
  scrollTo?: string;
  pageTarget?:
    | 'home'
    | 'shared-hosting'
    | 'wordpress-hosting'
    | 'windows-hosting'
    | 'free-trial'
    | 'vps-hosting'
    | 'n8n-hosting'
    | 'domain-registration'
    | 'domain-transfer'
    | 'knowledge-base'
    | 'about-us'
    | 'migration-free'
    | 'cpanel-hosting'
    | 'terms-conditions'
    | 'privacy-policy'
    | 'order-terms'
    | 'refund-policy'
    | 'abuse-policy';
}

export interface NavMenu {
  id: string;
  label: string;
  items: NavDropdownItem[];
}

export interface ServiceMatrixItem {
  id: ServiceCategoryId;
  title: string;
  subtitle: string;
  startingPrice: string;
  portalTab?: PortalTab;
  planId?: string;
  scrollTo?: string;
  pageTarget?:
    | 'home'
    | 'shared-hosting'
    | 'wordpress-hosting'
    | 'windows-hosting'
    | 'free-trial'
    | 'vps-hosting'
    | 'n8n-hosting'
    | 'domain-registration'
    | 'domain-transfer'
    | 'knowledge-base'
    | 'about-us'
    | 'migration-free'
    | 'cpanel-hosting'
    | 'terms-conditions'
    | 'privacy-policy'
    | 'order-terms'
    | 'refund-policy'
    | 'abuse-policy';
}

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  popular?: boolean;
  storage: string;
  bandwidth: string;
  ssl: string;
  backups: string;
  extras: string[];
}

export interface DatacenterLocation {
  id: string;
  label: string;
  country: string;
  city: string;
  provider: string;
  pingMs: number;
  tier: string;
  x: number;
  y: number;
}

export const NAV_MENUS: NavMenu[] = [
  {
    id: 'web-hosting',
    label: 'Web Hosting',
    items: [
      {
        label: 'Shared Web Hosting',
        description: 'Autoscaling StackCP & NVMe cloud hosting with Free SSL',
        scrollTo: '#top',
        pageTarget: 'shared-hosting',
      },
      {
        label: 'WordPress Hosting',
        description: 'LiteSpeed & Redis edge-cached hosting for WordPress',
        scrollTo: '#top',
        pageTarget: 'wordpress-hosting',
      },
      {
        label: 'Windows Web Hosting',
        description: 'ASP.NET Core 8, IIS 10, and MSSQL enterprise hosting',
        scrollTo: '#top',
        pageTarget: 'windows-hosting',
      },
      {
        label: 'Reseller Program',
        description: 'White-label cPanel & StackCP suites for web agencies',
        scrollTo: '#services',
      },
      {
        label: 'cPanel Web Hosting',
        description: 'NVMe Gen4 cPanel hosting with 1 Free .com Domain & Node.js',
        scrollTo: '#top',
        pageTarget: 'cpanel-hosting',
      },
      {
        label: '30-Day Free Trial',
        description: 'Launch Cloud Ignite, WP Core, or WinCore Pro free for 30 days',
        scrollTo: '#top',
        pageTarget: 'free-trial',
      },
    ],
  },
  {
    id: 'vps-hosting',
    label: 'VPS Hosting',
    items: [
      {
        label: 'Unmanaged VPS',
        description: 'Full root SSH, KVM hypervisor, and NVMe/SSD block storage',
        scrollTo: '#top',
        pageTarget: 'vps-hosting',
      },
      {
        label: 'n8n',
        description: 'Pre-configured n8n workflow automation on NVMe cloud nodes',
        scrollTo: '#top',
        pageTarget: 'n8n-hosting',
      },
    ],
  },
  {
    id: 'domain',
    label: 'Domain',
    items: [
      {
        label: 'Domain Registration',
        description: 'Instant availability lookup with free WHOIS privacy',
        scrollTo: '#top',
        pageTarget: 'domain-registration',
      },
      {
        label: 'Domain Transfer',
        description: 'Zero-downtime registrar transfers & DNS migration',
        scrollTo: '#top',
        pageTarget: 'domain-transfer',
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      {
        label: 'Knowledge Base',
        description: 'Step-by-step guides for domains, hosting, VPS & error fixes',
        scrollTo: '#top',
        pageTarget: 'knowledge-base',
      },
      {
        label: 'Contact Us',
        description: 'Open an engineering support ticket or reach our 24/7 desk',
        scrollTo: '#kb-contact-support',
        pageTarget: 'knowledge-base',
      },
      {
        label: 'About Us',
        description: 'Our global leadership, data centers & 99.99% uptime SLA',
        scrollTo: '#top',
        pageTarget: 'about-us',
      },
      {
        label: 'Migration Free',
        description: 'Zero-downtime cPanel, StackCP & WordPress migrations',
        scrollTo: '#top',
        pageTarget: 'migration-free',
      },
      {
        label: 'Report Abuse & Legal',
        description: 'Submit network abuse reports or review Terms, Privacy & Refunds',
        scrollTo: '#top',
        pageTarget: 'abuse-policy',
      },
    ],
  },
];

export const SERVICE_MATRIX: ServiceMatrixItem[] = [
  {
    id: 'shared',
    title: 'Shared Web Hosting',
    subtitle: 'Fast, autoscaling Linux hosting for any website.',
    startingPrice: '$2.50/mo',
    scrollTo: '#top',
    pageTarget: 'shared-hosting',
  },
  {
    id: 'wordpress',
    title: 'Managed WordPress Hosting',
    subtitle: 'Pre-optimised LiteSpeed stack for WordPress & WooCommerce.',
    startingPrice: '$2.50/mo',
    scrollTo: '#top',
    pageTarget: 'wordpress-hosting',
  },
  {
    id: 'windows',
    title: 'Windows Web Hosting',
    subtitle: 'ASP.NET, MSSQL & .NET Core applications on IIS.',
    startingPrice: '$2.50/mo',
    scrollTo: '#top',
    pageTarget: 'windows-hosting',
  },
  {
    id: 'reseller',
    title: 'Reseller Program',
    subtitle: 'White-label client portals for freelancers and agencies.',
    startingPrice: '$14.99/mo',
    scrollTo: '#infrastructure',
  },
  {
    id: 'cpanel',
    title: 'cPanel Web Hosting',
    subtitle: 'Classic cPanel hosting with NVMe SSD & 1 Free .com Domain.',
    startingPrice: '$11.99/mo',
    scrollTo: '#top',
    pageTarget: 'cpanel-hosting',
  },
  {
    id: 'vps',
    title: 'Unmanaged VPS Hosting',
    subtitle: 'Full root access KVM servers for developers & sysadmins.',
    startingPrice: '$12.99/mo',
    scrollTo: '#top',
    pageTarget: 'vps-hosting',
  },
  {
    id: 'aws',
    title: 'n8n Hosting',
    subtitle: 'Dedicated workflow automation nodes with Redis & PostgreSQL.',
    startingPrice: '$12.99/mo',
    scrollTo: '#top',
    pageTarget: 'n8n-hosting',
  },
  {
    id: 'gcp',
    title: 'Domain Transfer',
    subtitle: 'Zero-downtime registrar transfers with free DNS migration.',
    startingPrice: '$9.99/yr',
    scrollTo: '#top',
    pageTarget: 'domain-transfer',
  },
  {
    id: 'domains',
    title: 'Domains',
    subtitle: 'Competitive domain pricing with free privacy & Wildcard SSL.',
    startingPrice: '$6.99/yr',
    scrollTo: '#top',
    pageTarget: 'domain-registration',
  },
  {
    id: 'migrations',
    title: 'Unlimited Migrations',
    subtitle: 'Zero-downtime transfers from cPanel, Plesk & DirectAdmin.',
    startingPrice: 'Free',
    scrollTo: '#top',
    pageTarget: 'migration-free',
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter-cloud',
    name: 'Starter Cloud',
    tagline: 'Ideal for personal websites, portfolios, and early-stage projects.',
    monthlyPrice: 3.1,
    yearlyMonthlyPrice: 2.5,
    storage: '50 GB NVMe Gen4 SSD',
    bandwidth: 'Unmetered Bandwidth',
    ssl: 'Free Wildcard SSL & CDN',
    backups: 'Automated Daily Backups',
    extras: ['StackCP Control Panel', '10 Custom Email Accounts', '1-Click WordPress Installer'],
  },
  {
    id: 'pro-business',
    name: 'Pro Business',
    tagline: 'Built for growing businesses, agencies, and WooCommerce stores.',
    monthlyPrice: 7.49,
    yearlyMonthlyPrice: 5.99,
    popular: true,
    storage: '150 GB NVMe Gen4 SSD',
    bandwidth: 'Unmetered High-Speed Bandwidth',
    ssl: 'Free Wildcard SSL & Global CDN',
    backups: 'Daily Off-Site Snapshots (30d)',
    extras: ['LiteSpeed + Redis Cache', '1-Click Staging Environment', 'Imunify360 Malware Defense'],
  },
  {
    id: 'agency-reseller',
    name: 'Agency Reseller',
    tagline: 'White-label multi-client hosting engineered for studios & freelancers.',
    monthlyPrice: 18.99,
    yearlyMonthlyPrice: 14.99,
    storage: '350 GB NVMe Gen4 SSD',
    bandwidth: 'Unmetered Agency Bandwidth',
    ssl: 'Free Unlimited Wildcard SSLs',
    backups: 'Hourly & Daily Client Backups',
    extras: ['Up to 60 Isolated Client Accounts', 'White-Label WHMCS Billing', 'Dedicated Migration Engineer'],
  },
  {
    id: 'managed-vps',
    name: 'VPS Core 4',
    tagline: 'Dedicated KVM compute resources with full root SSH control.',
    monthlyPrice: 12.99,
    yearlyMonthlyPrice: 11.9,
    storage: '100 GB SSD (Extension Available)',
    bandwidth: 'Unlimited Traffic* (200 Mbit/s Port)',
    ssl: 'Free Wildcard SSL & Firewall',
    backups: '1 Hardware Snapshot Included',
    extras: ['4 vCPU Cores', '8 GB RAM', 'Full Root SSH + VNC Console'],
  },
];

export const ALL_MODAL_PLANS = [
  ...PRICING_TIERS.map((t) => ({
    id: t.id,
    name: t.name,
    monthlyPrice: t.monthlyPrice,
    yearlyMonthlyPrice: t.yearlyMonthlyPrice,
  })),
  {
    id: 'windows-cloud',
    name: 'Windows Web Hosting',
    monthlyPrice: 8.99,
    yearlyMonthlyPrice: 6.99,
  },
  {
    id: 'cpanel-nvme',
    name: 'cPanel Web Hosting',
    monthlyPrice: 18.99,
    yearlyMonthlyPrice: 14.99,
  },
  {
    id: 'unmanaged-vps',
    name: 'Unmanaged VPS Hosting',
    monthlyPrice: 12.99,
    yearlyMonthlyPrice: 11.9,
  },
  {
    id: 'storage-vps',
    name: 'Storage VPS (2 TB RAID-10)',
    monthlyPrice: 21.99,
    yearlyMonthlyPrice: 17.99,
  },
  {
    id: 'aws-server',
    name: 'Amazon AWS Server',
    monthlyPrice: 35.0,
    yearlyMonthlyPrice: 29.0,
  },
  {
    id: 'gcp-server',
    name: 'Google Cloud Server',
    monthlyPrice: 35.0,
    yearlyMonthlyPrice: 29.0,
  },
];

export const TLD_PRICES = [
  { tld: '.com', price: '$9.99' },
  { tld: '.net', price: '$11.99' },
  { tld: '.org', price: '$10.99' },
  { tld: '.io', price: '$34.99' },
  { tld: '.co.uk', price: '$6.99' },
];

export const DATACENTER_LOCATIONS: DatacenterLocation[] = [
  {
    id: 'lhr',
    label: 'UK London',
    country: 'United Kingdom',
    city: 'London',
    provider: 'cpcloudhost.com Tier-III Core',
    pingMs: 8,
    tier: 'Tier-III+ NVMe Cluster',
    x: 46.5,
    y: 26.5,
  },
  {
    id: 'nyc',
    label: 'USA New York',
    country: 'United States',
    city: 'New York',
    provider: 'cpcloudhost.com + AWS Edge',
    pingMs: 11,
    tier: 'Multi-AZ NVMe Fabric',
    x: 27.5,
    y: 36,
  },
  {
    id: 'fra',
    label: 'Germany Frankfurt',
    country: 'Germany',
    city: 'Frankfurt',
    provider: 'EU GDPR Sovereign Core',
    pingMs: 10,
    tier: 'ISO 27001 Tier-III+',
    x: 52.5,
    y: 30,
  },
  {
    id: 'sin',
    label: 'Singapore',
    country: 'Singapore',
    city: 'Singapore',
    provider: 'APAC Google Cloud Fiber',
    pingMs: 12,
    tier: 'Anycast APAC Hub',
    x: 76.5,
    y: 60.5,
  },
  {
    id: 'bom',
    label: 'India Mumbai',
    country: 'India',
    city: 'Mumbai',
    provider: 'AWS + cpcloudhost.com Edge',
    pingMs: 16,
    tier: 'High-Throughput South Asia',
    x: 68,
    y: 49,
  },
];
