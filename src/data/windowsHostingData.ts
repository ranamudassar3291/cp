export interface WindowsHostingPlan {
  id: 'wincore-pro' | 'winscale-business' | 'winenterprise';
  brandSeries: string;
  name: string;
  audience: string;
  tagline: string;
  annualBonus: string;
  monthlyPrice: number;
  recommended?: boolean;
  resources: {
    key: 'win-sites' | 'databases' | 'emails' | 'ssd';
    label: string;
  }[];
  features: string[];
}

export interface WindowsCoreFeature {
  id: 'migrations' | 'backups' | 'dotnet' | 'security' | 'cdn' | 'ddos';
  title: string;
  description: string;
}

export interface WindowsAdvantagePillar {
  id: 'cloud' | 'cdn' | 'ssl' | 'migrations' | 'iis' | 'mssql';
  title: string;
  description: string;
}

export interface WindowsFaqItem {
  question: string;
  answer: string;
}

export const WINDOWS_PLANS: WindowsHostingPlan[] = [
  {
    id: 'wincore-pro',
    brandSeries: 'StackCP Windows Cloud',
    name: 'WinCore Pro',
    audience: 'For 6 Websites',
    tagline: 'Streamlined Windows IIS hosting for modern ASP.NET web applications.',
    annualBonus: 'Includes Free .CO.UK / .COM Domain on Annual Billing',
    monthlyPrice: 2.5,
    resources: [
      { key: 'win-sites', label: '6 Windows Websites' },
      { key: 'databases', label: '18 MySQL Databases' },
      { key: 'emails', label: '24 Emails' },
      { key: 'ssd', label: '10GB SSD Space' },
    ],
    features: [
      'Free SSL',
      'Free Malware Scanning',
      '1 Tbps+ DDoS Protection',
      'SSH & FTPS Access',
    ],
  },
  {
    id: 'winscale-business',
    brandSeries: 'StackCP Windows Cloud',
    name: 'WinScale Business',
    audience: 'For 12 Websites',
    tagline: 'Built for growing agencies managing client IIS & database portals.',
    annualBonus: 'Includes Free .CO.UK / .COM Domain on Annual Billing',
    monthlyPrice: 3.49,
    recommended: true,
    resources: [
      { key: 'win-sites', label: '12 Windows Websites' },
      { key: 'databases', label: '36 MySQL Databases' },
      { key: 'emails', label: '48 Emails' },
      { key: 'ssd', label: '20GB SSD Space' },
    ],
    features: [
      'Free SSL',
      'Free Malware Scanning',
      '1 Tbps+ DDoS Protection',
      'SSH & FTPS Access',
    ],
  },
  {
    id: 'winenterprise',
    brandSeries: 'StackCP Windows Cloud',
    name: 'WinEnterprise',
    audience: 'For Unlimited Websites',
    tagline: 'Unrestricted Windows IIS headroom unified inside one control plane.',
    annualBonus: 'Includes Free .COM Domain on Annual Billing',
    monthlyPrice: 4.49,
    resources: [
      { key: 'win-sites', label: 'Unlimited Windows Websites' },
      { key: 'databases', label: 'Unlimited MySQL Databases' },
      { key: 'emails', label: 'Unlimited Emails' },
      { key: 'ssd', label: 'Unlimited SSD Space' },
    ],
    features: [
      'Free SSL',
      'Free Malware Scanning',
      '1 Tbps+ DDoS Protection',
      'SSH & FTPS Access',
    ],
  },
];

export const WINDOWS_CORE_FEATURES: WindowsCoreFeature[] = [
  {
    id: 'migrations',
    title: 'Seamless Panel & Site Transfers',
    description:
      'Migrate ASP.NET applications, database schemas, and domain records into cpcloudhost.com with scheduled DNS cutover and zero unexpected downtime.',
  },
  {
    id: 'backups',
    title: 'Automated Daily Snapshots',
    description:
      'Scheduled daily backups protect web roots, SQL records, and mailboxes cleanly inside StackCP — restore files or tables individually in seconds.',
  },
  {
    id: 'dotnet',
    title: '.NET & Classic ASP Compatibility',
    description:
      'Run modern ASP.NET Core applications alongside .NET Framework 4.x and Classic ASP inside isolated IIS 10 application pools built for consistent execution.',
  },
  {
    id: 'security',
    title: 'Hardened Windows Infrastructure',
    description:
      'Full access to SFTP/FTPS, Web Deploy publishing, MS SQL Server add-ons, MySQL databases, and isolated Windows Server firewall security rules.',
  },
  {
    id: 'cdn',
    title: 'Anycast Global Edge CDN',
    description:
      'Cache static scripts, stylesheets, and assets across worldwide routing PoPs so business portals stay responsive for teams in every timezone.',
  },
  {
    id: 'ddos',
    title: 'Always-On 1 Tbps+ Filtering',
    description:
      'Dedicated upstream DDoS mitigation filters volumetric flood traffic automatically before suspicious requests ever touch IIS worker pools.',
  },
];

export const WINDOWS_ADVANTAGE_PILLARS: WindowsAdvantagePillar[] = [
  {
    id: 'cloud',
    title: 'Elastic Cloud Scaling',
    description:
      'Operate Windows workloads on true multi-node cloud compute at cpcloudhost.com rather than a single hardware-bound VPS server.',
  },
  {
    id: 'cdn',
    title: 'Anycast Edge CDN',
    description:
      'Our integrated global CDN routes assets dynamically from edge PoPs close to every user for rapid enterprise portal loading.',
  },
  {
    id: 'ssl',
    title: 'Wildcard TLS Security',
    description:
      'Every included free SSL certificate issues wildcard coverage automatically across your primary domain and unlimited subdomains.',
  },
  {
    id: 'migrations',
    title: 'Zero-Downtime Onboarding',
    description:
      'Move Windows web apps, SQL databases, and company mailboxes smoothly into cpcloudhost.com in minutes without disrupting live operations.',
  },
  {
    id: 'iis',
    title: 'Optimised IIS 10 Architecture',
    description:
      'Purpose-tuned Microsoft IIS 10 pipelines deliver crisp page speeds and reliable runtime isolation for ASP and ASP.NET applications.',
  },
  {
    id: 'mssql',
    title: 'Microsoft SQL Server Ready',
    description:
      'Add dedicated MS SQL Server database instances starting from $15.99/mo per database whenever your application demands native T-SQL workloads.',
  },
];

export const WINDOWS_FAQS: WindowsFaqItem[] = [
  {
    question: 'What is StackCP Windows Web Hosting at cpcloudhost.com?',
    answer:
      'StackCP Windows Web Hosting provides dedicated Microsoft IIS 10 application pools, ASP.NET / .NET Core runtime support, MySQL & optional MS SQL databases, and enterprise Anycast CDN managed from our cloud control panel.',
  },
  {
    question: 'Which ASP.NET and .NET versions are supported?',
    answer:
      'Our Windows environment supports classic ASP, .NET Framework 2.0–4.8, and modern ASP.NET Core LTS releases, allowing mixed legacy and current web apps per domain.',
  },
  {
    question: 'How do Microsoft SQL Server (MS SQL) databases work?',
    answer:
      'Every plan includes generous MySQL databases by default, and dedicated Microsoft SQL Server instances can be attached cleanly to any plan starting from $15.99/mo per database.',
  },
  {
    question: 'Can you migrate my Windows website from Plesk or another host?',
    answer:
      'Yes. Our engineering team handles zero-downtime Windows transfers — verifying web.config rules, connection strings, SSL certificates, and mailboxes prior to DNS switchover.',
  },
  {
    question: 'Do I get Free Wildcard SSL & Malware Protection?',
    answer:
      'Yes. Every cpcloudhost.com Windows plan ships with auto-renewing Wildcard SSL certificates, automated malware scanning, and 1 Tbps+ network DDoS scrubbing.',
  },
  {
    question: 'Can I lock in multi-year pricing with the 5-Year Package?',
    answer:
      'Yes — our Exclusive 5-Year WinCore Pro plan locks in full 6-site Windows hosting for a one-off $75.00 payment, shielding your budget from renewal increases.',
  },
  {
    question: 'Is publishing via Visual Studio Web Deploy or FTPS supported?',
    answer:
      'Yes. Deploy directly from Visual Studio, Git pipelines, or encrypted SFTP/FTPS endpoints straight to your isolated Windows application folder.',
  },
  {
    question: 'Do you include a 30-day risk-free guarantee?',
    answer:
      'Yes — test any StackCP Windows plan risk-free for 30 days on cpcloudhost.com with responsive 24/7 engineering support included.',
  },
];
