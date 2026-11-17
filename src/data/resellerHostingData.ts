export interface ResellerPlanPreset {
  id: string;
  name: string;
  audience: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  renewalPrice: number;
  cpanelAccounts: string;
  storage: string;
  bandwidth: string;
  ssl: string;
  backups: string;
  features: string[];
  popular?: boolean;
  serverPackageName: string;
}

export type ResellerHostingPlan = ResellerPlanPreset;

export interface ResellerBenefitItem {
  id:
    | 'whitelabel'
    | 'lve'
    | 'whmcs'
    | 'security'
    | 'migrations'
    | 'margins';
  title: string;
  description: string;
  metricBadge: string;
}

export interface ResellerFaqItem {
  question: string;
  answer: string;
}

export const RESELLER_HOSTING_PLANS: ResellerPlanPreset[] = [
  {
    id: 'plan-reseller-launch',
    name: 'Reseller Launch',
    audience: 'Freelancers & Boutique Studios',
    tagline:
      'Start hosting client websites under your own brand with full WHM, white-label nameservers, and Gen4 NVMe speed.',
    monthlyPrice: 14.99,
    yearlyPrice: 149.0,
    renewalPrice: 149.0,
    cpanelAccounts: '25 cPanel Accounts',
    storage: '60 GB Gen4 NVMe SSD',
    bandwidth: 'Unmetered Tier-1 Bandwidth',
    ssl: 'Unlimited Free AutoSSL & Wildcard TLS',
    backups: 'Daily JetBackup Off-Site Snapshots',
    features: [
      '25 Isolated cPanel Client Accounts',
      '60 GB Gen4 NVMe RAID-10 Storage',
      'Full WHM Control & Package Creator',
      'Private White-Label Nameservers (ns1/ns2)',
      'CloudLinux OS+ & CageFS Account Isolation',
      'Free LiteSpeed Web Server + LSCache',
    ],
    popular: false,
    serverPackageName: 'whm_reseller_launch_25',
  },
  {
    id: 'plan-reseller-agency',
    name: 'Reseller Agency Pro',
    audience: 'Growing Agencies & MSPs',
    tagline:
      'Scale recurring client hosting revenue with 60 isolated cPanel accounts, WHMCS automation hooks, and Imunify360 defense.',
    monthlyPrice: 29.99,
    yearlyPrice: 299.0,
    renewalPrice: 299.0,
    cpanelAccounts: '60 cPanel Accounts',
    storage: '150 GB Gen4 NVMe SSD',
    bandwidth: 'Unmetered Tier-1 Bandwidth',
    ssl: 'Unlimited Free AutoSSL & Wildcard TLS',
    backups: 'Twice-Daily JetBackup + 30-Day Retention',
    features: [
      '60 Isolated cPanel Client Accounts',
      '150 GB Gen4 NVMe RAID-10 Storage',
      'Higher LVE Per-Account CPU & RAM Bursts',
      '1 Free Dedicated IPv4 Address Included',
      'Automated WHMCS / Upmind Provisioning API',
      'Zero-Downtime White-Glove Client Migrations',
    ],
    popular: true,
    serverPackageName: 'whm_reseller_agency_60',
  },
  {
    id: 'plan-reseller-enterprise',
    name: 'Reseller Enterprise Cluster',
    audience: 'High-Volume Hosting Brands',
    tagline:
      'Maximum account density and unthrottled enterprise throughput engineered for multi-region reseller brands.',
    monthlyPrice: 54.99,
    yearlyPrice: 549.0,
    renewalPrice: 549.0,
    cpanelAccounts: '150 cPanel Accounts',
    storage: '350 GB Gen4 NVMe SSD',
    bandwidth: 'Unmetered 10 Gbps Redundant Port',
    ssl: 'Unlimited Free AutoSSL & Wildcard TLS',
    backups: 'Hourly & Daily Off-Site Snapshot Vault',
    features: [
      '150 Isolated cPanel Client Accounts',
      '350 GB Gen4 NVMe RAID-10 Storage',
      '2 Dedicated IPv4 Addresses Included',
      'Imunify360 Proactive Malware Shield',
      'Priority 24/7 Partner Escalation Desk',
      'Custom Branded Webmail & DNS Cluster',
    ],
    popular: false,
    serverPackageName: 'whm_reseller_ent_150',
  },
];

export const RESELLER_BENEFITS: ResellerBenefitItem[] = [
  {
    id: 'whitelabel',
    title: '100% White-Label Brand Identity',
    description:
      'Present your own brand name across private nameservers (ns1/ns2.yourdomain.com), branded cPanel login portals, and custom webmail URLs — cpcloudhost.com remains invisible to your clients.',
    metricBadge: 'Zero Vendor Branding',
  },
  {
    id: 'lve',
    title: 'CloudLinux LVE Resource Isolation',
    description:
      'Every client cPanel account operates inside its own hardened CageFS container with dedicated CPU, RAM, and I/O limits so one busy store never slows down neighboring client websites.',
    metricBadge: 'CageFS + LVE Protection',
  },
  {
    id: 'whmcs',
    title: 'WHM & Automated Billing API Ready',
    description:
      'Create custom hosting packages, automate instant provisioning, suspend overdue accounts, and reset passwords cleanly through WHM or your preferred client billing automation.',
    metricBadge: 'Instant API Provisioning',
  },
  {
    id: 'security',
    title: 'Automated SSL & Imunify360 Security',
    description:
      'Every addon domain and subdomain receives automatic Let’s Encrypt SSL certificates, paired with hardware 1 Tbps+ DDoS mitigation and real-time malware quarantine.',
    metricBadge: '1 Tbps+ DDoS Shield',
  },
  {
    id: 'migrations',
    title: 'Free Bulk cPanel & WordPress Migrations',
    description:
      'Moving your existing reseller portfolio? Our migration engineers transfer full cPanel accounts, databases, cron jobs, and IMAP mailboxes cleanly with zero client downtime.',
    metricBadge: 'Unlimited Free Moves',
  },
  {
    id: 'margins',
    title: 'Predictable Wholesale Profit Margins',
    description:
      'Lock in transparent wholesale pricing with zero hidden per-account renewal shocks, enabling 60–80% recurring margins whether you bundle maintenance retainers or sell standalone hosting.',
    metricBadge: 'High Recurring Margin',
  },
];

export const RESELLER_WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Pick Your Reseller Tier',
    description:
      'Select 25, 60, or 150 isolated cPanel accounts matched to your current client portfolio and NVMe storage targets.',
  },
  {
    step: '02',
    title: 'Configure White-Label DNS',
    description:
      'Attach your agency domain and set custom ns1/ns2 private nameservers so every client DNS record carries your brand.',
  },
  {
    step: '03',
    title: 'Define Packages in WHM',
    description:
      'Create your own starter, business, and eCommerce hosting tiers inside WHM and provision new client sites in 10 seconds.',
  },
  {
    step: '04',
    title: 'Scale With Full Engineering Backup',
    description:
      'Upgrade from Launch to Agency Pro or Enterprise Cluster smoothly anytime without migrating accounts or changing IPs.',
  },
];

export const RESELLER_FAQS: ResellerFaqItem[] = [
  {
    question: 'Do my clients ever see cpcloudhost.com on cPanel, DNS, or Webmail?',
    answer:
      'No. All Reseller Hosting plans are 100% white-label. You receive custom private nameserver records (ns1/ns2.yourdomain.com), white-label server hostnames, and branded WHM/cPanel entry points so your agency owns the entire client relationship.',
  },
  {
    question: 'Can I set my own pricing, disk quotas, and bandwidth limits per client?',
    answer:
      'Yes. Inside WHM (Web Host Manager), you control your own package definitions, disk allocations, email limits, database counts, and feature sets while charging clients whatever pricing and retainers work best for your business.',
  },
  {
    question: 'Are WHM, cPanel, and CloudLinux licenses included in the monthly price?',
    answer:
      'Yes. Full WHM reseller access, individual cPanel licenses up to your tier account limit, LiteSpeed Enterprise Web Server, CloudLinux LVE isolation, and JetBackup daily snapshots are all included at zero extra license cost.',
  },
  {
    question: 'Will you migrate my existing cPanel reseller accounts from another provider?',
    answer:
      'Absolutely. Our engineering team handles unlimited cPanel-to-cPanel and WordPress migrations free of charge, transferring full websites, databases, SSLs, and IMAP mailboxes without interrupting live traffic.',
  },
  {
    question: 'Can I upgrade from Reseller Launch (25 accounts) to Agency Pro (60 accounts) later?',
    answer:
      'Yes. Plan upgrades from your Client Dashboard apply instantly with exact balance pricing — your existing paid amount is credited in full and only the plan difference is billed, with zero account downtime or IP changes.',
  },
  {
    question: 'Is Overselling enabled on WHM Reseller packages?',
    answer:
      'Overselling is enabled for allocated disk and bandwidth quotas within your NVMe pool so you can design generous client packages cleanly while only consuming storage actually used by active websites.',
  },
];
