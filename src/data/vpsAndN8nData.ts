export interface ComputeHardwareTier {
  tierKey: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  cores: string;
  memory: string;
  storage: string;
  storageNote: string;
  snapshots: string;
  portSpeed: string;
  traffic: string;
  noSetupFee: boolean;
}

export interface ComputePlan extends ComputeHardwareTier {
  id: string;
  eyebrow: string;
  name: string;
  monthlyPrice: number;
  summary: string;
  recommended?: boolean;
}

export interface ComputePillarItem {
  id:
    | 'storage'
    | 'provision'
    | 'bandwidth'
    | 'sla'
    | 'root'
    | 'flexible'
    | 'docker'
    | 'webhook'
    | 'postgres'
    | 'workflows';
  title: string;
  description: string;
}

export interface ComputeFaqItem {
  question: string;
  answer: string;
}

export interface ComputeDatacenterOption {
  id: 'uk' | 'us' | 'sg' | 'eu';
  country: string;
  city: string;
  clusterLabel: string;
  latencyLabel: string;
  flagCode: string;
}

export interface ComputeOsTemplate {
  id: string;
  category: 'plain-os' | 'os-panel' | 'app-docker' | 'n8n-stack';
  categoryLabel: string;
  name: string;
  version: string;
  badgeText: string;
  shortTag: string;
  controlPanelOrStack: string;
  licenseNote: string;
  description: string;
  recommended?: boolean;
  defaultPortOrUrl?: string;
}

export interface ComputeOsFamily {
  familyKey: string;
  name: string;
  badgeText: string;
  category: ComputeOsTemplate['category'];
  versions: ComputeOsTemplate[];
}

export function groupComputeTemplatesByName(
  templates: ComputeOsTemplate[]
): ComputeOsFamily[] {
  const map = new Map<string, ComputeOsFamily>();
  templates.forEach((tpl) => {
    const key = `${tpl.category}::${tpl.name}`;
    const existing = map.get(key);
    if (existing) {
      existing.versions.push(tpl);
    } else {
      map.set(key, {
        familyKey: key,
        name: tpl.name,
        badgeText: tpl.badgeText,
        category: tpl.category,
        versions: [tpl],
      });
    }
  });
  return Array.from(map.values());
}

export interface ComputeAddonOption {
  id: 'none' | 'weekly-snapshots' | 'daily-backups';
  name: string;
  description: string;
  monthlyPriceUsd: number;
}

export const COMPUTE_DATACENTERS: ComputeDatacenterOption[] = [
  {
    id: 'uk',
    country: 'United Kingdom',
    city: 'London, UK',
    clusterLabel: 'UK KVM Edge Hub · London Tier-III+',
    latencyLabel: '4ms UK & Western EU',
    flagCode: 'UK',
  },
  {
    id: 'us',
    country: 'United States',
    city: 'Dallas, Texas',
    clusterLabel: 'US Central Compute · Dallas Multi-AZ',
    latencyLabel: '11ms North America',
    flagCode: 'US',
  },
  {
    id: 'eu',
    country: 'Germany (EU)',
    city: 'Frankfurt, DE',
    clusterLabel: 'EU Sovereign KVM · Frankfurt Tier-III+',
    latencyLabel: '7ms Central Europe',
    flagCode: 'DE',
  },
  {
    id: 'sg',
    country: 'Asia Pacific',
    city: 'Singapore',
    clusterLabel: 'APAC Fiber Node · Singapore Tier-III+',
    latencyLabel: '12ms Asia-Pacific',
    flagCode: 'SG',
  },
];

export const VPS_OS_CATALOG: ComputeOsTemplate[] = [
  {
    id: 'ubuntu-24-04',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'Ubuntu',
    version: '24.04 LTS',
    badgeText: 'UB',
    shortTag: 'Recommended · Minimal',
    controlPanelOrStack: 'Ubuntu 24.04 LTS',
    licenseNote: 'Free Open Source',
    description: 'Latest LTS release with kernel 6.8, cloud-init, and OpenSSH hardened out of the box.',
    recommended: true,
  },
  {
    id: 'ubuntu-22-04',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'Ubuntu',
    version: '22.04 LTS',
    badgeText: 'UB',
    shortTag: 'Stable LTS',
    controlPanelOrStack: 'Ubuntu 22.04 LTS',
    licenseNote: 'Free Open Source',
    description: 'Battle-tested LTS image for legacy runtimes, custom stacks, and enterprise packages.',
  },
  {
    id: 'ubuntu-20-04',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'Ubuntu',
    version: '20.04 LTS',
    badgeText: 'UB',
    shortTag: 'Extended LTS',
    controlPanelOrStack: 'Ubuntu 20.04 LTS',
    licenseNote: 'Free Open Source',
    description: 'Legacy LTS release for established production workloads.',
  },
  {
    id: 'debian-12',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'Debian',
    version: '12 (Bookworm)',
    badgeText: 'DB',
    shortTag: 'Ultra-Lightweight',
    controlPanelOrStack: 'Debian 12',
    licenseNote: 'Free Open Source',
    description: 'Low-overhead Debian base prized for stability, containers, and minimal memory footprint.',
  },
  {
    id: 'debian-11',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'Debian',
    version: '11 (Bullseye)',
    badgeText: 'DB',
    shortTag: 'Stable Minimal',
    controlPanelOrStack: 'Debian 11',
    licenseNote: 'Free Open Source',
    description: 'Minimal Debian 11 build for compatible server deployments.',
  },
  {
    id: 'almalinux-9',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'AlmaLinux',
    version: '9.4',
    badgeText: 'AL',
    shortTag: 'RHEL 9 Compatible',
    controlPanelOrStack: 'AlmaLinux 9.4',
    licenseNote: 'Free Open Source',
    description: '1:1 binary-compatible RHEL 9 Linux built for production workloads and control panels.',
  },
  {
    id: 'almalinux-8',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'AlmaLinux',
    version: '8.10',
    badgeText: 'AL',
    shortTag: 'RHEL 8 Compatible',
    controlPanelOrStack: 'AlmaLinux 8.10',
    licenseNote: 'Free Open Source',
    description: 'Long-term RHEL 8 compatible server image.',
  },
  {
    id: 'rocky-9',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'Rocky Linux',
    version: '9.4',
    badgeText: 'RK',
    shortTag: 'Enterprise Linux',
    controlPanelOrStack: 'Rocky Linux 9.4',
    licenseNote: 'Free Open Source',
    description: 'Community enterprise operating system engineered for critical long-term deployments.',
  },
  {
    id: 'rocky-8',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'Rocky Linux',
    version: '8.10',
    badgeText: 'RK',
    shortTag: 'Enterprise Linux',
    controlPanelOrStack: 'Rocky Linux 8.10',
    licenseNote: 'Free Open Source',
    description: 'Rocky Linux 8 enterprise release for legacy compatibility.',
  },
  {
    id: 'centos-stream-9',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'CentOS Stream',
    version: '9',
    badgeText: 'CS',
    shortTag: 'Upstream RHEL',
    controlPanelOrStack: 'CentOS Stream 9',
    licenseNote: 'Free Open Source',
    description: 'Continuous-delivery distribution tracking upstream Red Hat Enterprise Linux enhancements.',
  },
  {
    id: 'centos-stream-10',
    category: 'plain-os',
    categoryLabel: 'Plain OS',
    name: 'CentOS Stream',
    version: '10',
    badgeText: 'CS',
    shortTag: 'Latest Stream',
    controlPanelOrStack: 'CentOS Stream 10',
    licenseNote: 'Free Open Source',
    description: 'Next-generation upstream RHEL stream.',
  },
  {
    id: 'ubuntu-cyberpanel',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'CyberPanel',
    version: 'Ubuntu 24.04',
    badgeText: 'CP',
    shortTag: 'Free Web Panel',
    controlPanelOrStack: 'CyberPanel (Ubuntu 24.04)',
    licenseNote: 'Panel Included Free',
    description: 'High-speed OpenLiteSpeed web server with automated Let’s Encrypt SSL, DNS, and Mail.',
    recommended: true,
    defaultPortOrUrl: ':8090',
  },
  {
    id: 'ubuntu22-cyberpanel',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'CyberPanel',
    version: 'Ubuntu 22.04',
    badgeText: 'CP',
    shortTag: 'Free Web Panel',
    controlPanelOrStack: 'CyberPanel (Ubuntu 22.04)',
    licenseNote: 'Panel Included Free',
    description: 'CyberPanel with OpenLiteSpeed on Ubuntu 22.04 LTS.',
    defaultPortOrUrl: ':8090',
  },
  {
    id: 'ubuntu-cloudpanel',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'CloudPanel',
    version: 'v2 · Ubuntu 24.04',
    badgeText: 'CL',
    shortTag: 'Modern Panel',
    controlPanelOrStack: 'CloudPanel v2 (Ubuntu 24.04)',
    licenseNote: 'Panel Included Free',
    description: 'Lightweight server control panel built for PHP, WordPress, Node.js, and reverse proxies.',
    defaultPortOrUrl: ':8443',
  },
  {
    id: 'debian-cloudpanel',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'CloudPanel',
    version: 'v2 · Debian 12',
    badgeText: 'CL',
    shortTag: 'Modern Panel',
    controlPanelOrStack: 'CloudPanel v2 (Debian 12)',
    licenseNote: 'Panel Included Free',
    description: 'CloudPanel v2 running on Debian 12 Bookworm.',
    defaultPortOrUrl: ':8443',
  },
  {
    id: 'almalinux-cpanel',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'cPanel / WHM',
    version: 'AlmaLinux 9',
    badgeText: 'WH',
    shortTag: 'Industry Standard',
    controlPanelOrStack: 'cPanel & WHM (AlmaLinux 9)',
    licenseNote: '15-Day Trial / BYOL License',
    description: 'Pre-installed cPanel & WHM environment ready for multi-tenant hosting or agency billing.',
    defaultPortOrUrl: ':2087',
  },
  {
    id: 'almalinux8-cpanel',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'cPanel / WHM',
    version: 'AlmaLinux 8',
    badgeText: 'WH',
    shortTag: 'Industry Standard',
    controlPanelOrStack: 'cPanel & WHM (AlmaLinux 8)',
    licenseNote: '15-Day Trial / BYOL License',
    description: 'cPanel & WHM on AlmaLinux 8 LTS.',
    defaultPortOrUrl: ':2087',
  },
  {
    id: 'ubuntu-plesk',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'Plesk Obsidian',
    version: 'Ubuntu 24.04',
    badgeText: 'PL',
    shortTag: 'WP Toolkit Ready',
    controlPanelOrStack: 'Plesk Obsidian (Ubuntu 24.04)',
    licenseNote: 'Trial / BYOL License',
    description: 'Turnkey Plesk dashboard featuring WordPress Toolkit, Git deploy, and Docker extension.',
    defaultPortOrUrl: ':8443',
  },
  {
    id: 'debian-hestiacp',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'HestiaCP',
    version: 'Debian 12',
    badgeText: 'HC',
    shortTag: 'Low Footprint',
    controlPanelOrStack: 'HestiaCP (Debian 12)',
    licenseNote: 'Panel Included Free',
    description: 'Open-source control panel for websites, DNS zones, cron jobs, and business mailboxes.',
    defaultPortOrUrl: ':8083',
  },
  {
    id: 'ubuntu-hestiacp',
    category: 'os-panel',
    categoryLabel: 'OS + Control Panel',
    name: 'HestiaCP',
    version: 'Ubuntu 24.04',
    badgeText: 'HC',
    shortTag: 'Low Footprint',
    controlPanelOrStack: 'HestiaCP (Ubuntu 24.04)',
    licenseNote: 'Panel Included Free',
    description: 'HestiaCP running on Ubuntu 24.04 LTS.',
    defaultPortOrUrl: ':8083',
  },
  {
    id: 'ubuntu-docker',
    category: 'app-docker',
    categoryLabel: 'Apps & Docker',
    name: 'Docker CE',
    version: 'Compose v2 · Ubuntu 24.04',
    badgeText: 'DK',
    shortTag: 'Container Ready',
    controlPanelOrStack: 'Docker CE + Compose v2',
    licenseNote: 'Free Open Source',
    description: 'Clean container host pre-configured with Docker Engine, Compose plugin, and UFW rules.',
    recommended: true,
  },
  {
    id: 'debian-docker',
    category: 'app-docker',
    categoryLabel: 'Apps & Docker',
    name: 'Docker CE',
    version: 'Compose v2 · Debian 12',
    badgeText: 'DK',
    shortTag: 'Container Ready',
    controlPanelOrStack: 'Docker CE on Debian 12',
    licenseNote: 'Free Open Source',
    description: 'Docker Engine + Compose v2 on minimal Debian 12.',
  },
  {
    id: 'ubuntu-coolify',
    category: 'app-docker',
    categoryLabel: 'Apps & Docker',
    name: 'Coolify PaaS',
    version: 'v4 · Ubuntu 24.04',
    badgeText: 'CF',
    shortTag: 'Deploy Git Apps',
    controlPanelOrStack: 'Coolify v4 (Ubuntu 24.04)',
    licenseNote: 'Free Open Source',
    description: 'Push Next.js, Node, Python, PostgreSQL, and Redis stacks directly from Git repositories.',
    defaultPortOrUrl: ':8000',
  },
  {
    id: 'ubuntu-portainer',
    category: 'app-docker',
    categoryLabel: 'Apps & Docker',
    name: 'Portainer CE',
    version: 'Latest · Ubuntu 24.04',
    badgeText: 'PT',
    shortTag: 'Visual Containers',
    controlPanelOrStack: 'Portainer CE (Ubuntu 24.04)',
    licenseNote: 'Free Open Source',
    description: 'Manage Docker images, volumes, networks, and stacks through a browser GUI.',
    defaultPortOrUrl: ':9443',
  },
  {
    id: 'ubuntu-nodejs',
    category: 'app-docker',
    categoryLabel: 'Apps & Docker',
    name: 'Node.js LTS',
    version: 'v22 · Ubuntu 24.04',
    badgeText: 'JS',
    shortTag: 'API & SaaS Stack',
    controlPanelOrStack: 'Node.js 22 LTS + PM2',
    licenseNote: 'Free Open Source',
    description: 'Ready for Express, NestJS, and TypeScript backends with Certbot HTTPS proxy pre-tuned.',
  },
  {
    id: 'ubuntu-nodejs-20',
    category: 'app-docker',
    categoryLabel: 'Apps & Docker',
    name: 'Node.js LTS',
    version: 'v20 · Ubuntu 24.04',
    badgeText: 'JS',
    shortTag: 'API & SaaS Stack',
    controlPanelOrStack: 'Node.js 20 LTS + PM2',
    licenseNote: 'Free Open Source',
    description: 'Node.js 20 LTS stack with PM2 and NGINX reverse proxy.',
  },
];

export const N8N_STACK_CATALOG: ComputeOsTemplate[] = [
  {
    id: 'n8n-postgres-redis',
    category: 'n8n-stack',
    categoryLabel: 'Production Queue Stack',
    name: 'n8n + PostgreSQL 16 + Redis',
    version: 'Latest · Ubuntu 24.04',
    badgeText: 'N8',
    shortTag: 'Recommended Production',
    controlPanelOrStack: 'n8n Latest + PostgreSQL 16 + Redis',
    licenseNote: 'Pre-Configured Stack',
    description: 'High-concurrency n8n deployment using PostgreSQL persistence and Redis background workers with automatic TLS.',
    recommended: true,
    defaultPortOrUrl: 'https:// (Auto-SSL)',
  },
  {
    id: 'n8n-postgres-redis-lts',
    category: 'n8n-stack',
    categoryLabel: 'Production Queue Stack',
    name: 'n8n + PostgreSQL 16 + Redis',
    version: '1.x LTS · Ubuntu 22.04',
    badgeText: 'N8',
    shortTag: 'Stable LTS',
    controlPanelOrStack: 'n8n LTS + PostgreSQL 16 + Redis',
    licenseNote: 'Pre-Configured Stack',
    description: 'Pinned LTS n8n queue mode image on Ubuntu 22.04 LTS.',
    defaultPortOrUrl: 'https:// (Auto-SSL)',
  },
  {
    id: 'n8n-caddy-ssl',
    category: 'n8n-stack',
    categoryLabel: 'Lightweight SSL Stack',
    name: 'n8n + Caddy Auto-HTTPS',
    version: 'Latest · Ubuntu 24.04',
    badgeText: 'CD',
    shortTag: 'Fast Single-Node',
    controlPanelOrStack: 'n8n Latest + Caddy TLS',
    licenseNote: 'Pre-Configured Stack',
    description: 'Clean single-container n8n setup with zero-config Caddy HTTPS webhook termination on your custom subdomain.',
    defaultPortOrUrl: 'https:// (Caddy TLS)',
  },
  {
    id: 'n8n-caddy-ssl-debian',
    category: 'n8n-stack',
    categoryLabel: 'Lightweight SSL Stack',
    name: 'n8n + Caddy Auto-HTTPS',
    version: 'Latest · Debian 12',
    badgeText: 'CD',
    shortTag: 'Minimal Debian',
    controlPanelOrStack: 'n8n + Caddy TLS (Debian 12)',
    licenseNote: 'Pre-Configured Stack',
    description: 'Single-node n8n with Caddy TLS on Debian 12.',
    defaultPortOrUrl: 'https:// (Caddy TLS)',
  },
  {
    id: 'n8n-ai-langchain',
    category: 'n8n-stack',
    categoryLabel: 'AI & Vector Stack',
    name: 'n8n + AI Agents & Qdrant',
    version: 'Latest · Ubuntu 24.04',
    badgeText: 'AI',
    shortTag: 'AI Pipelines',
    controlPanelOrStack: 'n8n AI + Qdrant Vector DB',
    licenseNote: 'Pre-Configured Stack',
    description: 'Optimized for LLM agents, RAG document indexing, webhook memory stores, and multi-model orchestration.',
    defaultPortOrUrl: 'https:// (AI Ready)',
  },
  {
    id: 'n8n-puppeteer-python',
    category: 'n8n-stack',
    categoryLabel: 'Worker & Scraper Stack',
    name: 'n8n + Python & Puppeteer',
    version: 'Latest · Ubuntu 24.04',
    badgeText: 'PY',
    shortTag: 'Browser & Scripts',
    controlPanelOrStack: 'n8n + Python 3.12 + Chromium',
    licenseNote: 'Pre-Configured Stack',
    description: 'Includes headless Chromium, FFmpeg, and Python 3.12 packages for custom data extraction and PDF automation.',
    defaultPortOrUrl: 'https:// (Worker Node)',
  },
];

export const COMPUTE_BACKUP_ADDONS: ComputeAddonOption[] = [
  {
    id: 'none',
    name: 'Standard Snapshot Slots Only',
    description: 'Use manual hardware snapshots included in your tier.',
    monthlyPriceUsd: 0,
  },
  {
    id: 'weekly-snapshots',
    name: 'Automated Weekly Off-Site Snapshots',
    description: 'Scheduled weekly full-disk VM snapshots stored off-cluster with 4-week retention.',
    monthlyPriceUsd: 2.0,
  },
  {
    id: 'daily-backups',
    name: 'Automated Daily Cloud Backups',
    description: 'Daily incremental backups + PostgreSQL/volume dump safety with 14-day point-in-time restore.',
    monthlyPriceUsd: 5.0,
  },
];

export const SHARED_HARDWARE_TIERS: ComputeHardwareTier[] = [
  {
    tierKey: 'tier1',
    cores: '4 vCPU Cores',
    memory: '8 GB RAM',
    storage: '100 GB SSD',
    storageNote: 'More storage available',
    snapshots: '1 Snapshot',
    portSpeed: '200 Mbit/s Port',
    traffic: 'Unlimited Traffic*',
    noSetupFee: false,
  },
  {
    tierKey: 'tier2',
    cores: '6 vCPU Cores',
    memory: '12 GB RAM',
    storage: '200GB SSD / 100GB NVMe',
    storageNote: 'More storage available',
    snapshots: '2 Snapshots',
    portSpeed: '300 Mbit/s Port',
    traffic: 'Unlimited Traffic*',
    noSetupFee: true,
  },
  {
    tierKey: 'tier3',
    cores: '8 vCPU Cores',
    memory: '24 GB RAM',
    storage: '300GB SSD / 150GB NVMe',
    storageNote: 'More storage available',
    snapshots: '3 Snapshots',
    portSpeed: '600 Mbit/s Port',
    traffic: 'Unlimited Traffic*',
    noSetupFee: true,
  },
  {
    tierKey: 'tier4',
    cores: '12 vCPU Cores',
    memory: '48 GB RAM',
    storage: '400GB SSD / 200GB NVMe',
    storageNote: 'More storage available',
    snapshots: '3 Snapshots',
    portSpeed: '800 Mbit/s Port',
    traffic: 'Unlimited Traffic*',
    noSetupFee: true,
  },
];

export const VPS_PLANS: ComputePlan[] = [
  {
    ...SHARED_HARDWARE_TIERS[0],
    id: 'vps-core-4',
    eyebrow: 'Unmanaged KVM VPS',
    name: 'VPS Core 4',
    monthlyPrice: 12.99,
    summary: 'Save 1 month free when billed on an annual cycle.',
  },
  {
    ...SHARED_HARDWARE_TIERS[1],
    id: 'vps-pro-6',
    eyebrow: 'Unmanaged KVM VPS',
    name: 'VPS Pro 6',
    monthlyPrice: 19.99,
    summary: 'Zero setup cost plus 1 month free on yearly billing.',
    recommended: true,
  },
  {
    ...SHARED_HARDWARE_TIERS[2],
    id: 'vps-scale-8',
    eyebrow: 'Unmanaged KVM VPS',
    name: 'VPS Scale 8',
    monthlyPrice: 34.99,
    summary: 'High-memory KVM compute with zero setup cost.',
  },
  {
    ...SHARED_HARDWARE_TIERS[3],
    id: 'vps-max-12',
    eyebrow: 'Unmanaged KVM VPS',
    name: 'VPS Max 12',
    monthlyPrice: 59.99,
    summary: 'Dedicated 12-core power built for heavy applications.',
  },
];

export const VPS_FEATURE_PILLARS: ComputePillarItem[] = [
  {
    id: 'storage',
    title: 'High-Speed SSD & NVMe Storage',
    description:
      'Every virtual server runs over redundant enterprise SSD and NVMe arrays engineered for low disk latency and sustained throughput.',
  },
  {
    id: 'provision',
    title: 'Instant KVM Deployment',
    description:
      'Spin up Linux distributions — Ubuntu, Debian, AlmaLinux, or Rocky Linux — inside isolated KVM instances in under two minutes.',
  },
  {
    id: 'bandwidth',
    title: 'Unlimited Unthrottled Traffic',
    description:
      'Operate APIs, containers, and busy web workloads with unlimited bandwidth and dedicated 200 to 800 Mbit/s virtual network uplinks.',
  },
  {
    id: 'sla',
    title: '99.99% Infrastructure SLA',
    description:
      'Backed by dual power feeds, multi-homed BGP carriers, and redundant rack switches at cpcloudhost.com Tier-III+ facilities.',
  },
  {
    id: 'root',
    title: 'Complete Root SSH & Kernel Freedom',
    description:
      'Install custom runtimes, Docker engines, firewalls, or control panels freely with full root privileges and out-of-band VNC console access.',
  },
  {
    id: 'flexible',
    title: 'Transparent Billing & Snapshot Rollbacks',
    description:
      'Scale compute tiers seamlessly on month-to-month terms with zero long-term contracts and up to 3 on-demand instant VM snapshots.',
  },
];

export const VPS_FAQS: ComputeFaqItem[] = [
  {
    question: 'What operating systems can I deploy on cpcloudhost.com VPS plans?',
    answer:
      'Choose instantly during setup between Ubuntu LTS, Debian, AlmaLinux, Rocky Linux, or CentOS Stream. Custom ISO images and optional cPanel/WHM or Plesk licenses can also be added cleanly.',
  },
  {
    question: 'What is the difference between SSD and NVMe options on Tiers 2 to 4?',
    answer:
      'You can provision larger raw SSD capacity (200GB–400GB) for bulk files or pick high-IOPS NVMe storage (100GB–200GB) for latency-sensitive databases and containerized services, with storage extensions available anytime.',
  },
  {
    question: 'Do VPS Pro 6, Scale 8, and Max 12 really have no setup fee?',
    answer:
      'Yes — all plans from 6 vCPU / 12 GB RAM upward deploy immediately with zero setup or provisioning surcharges.',
  },
  {
    question: 'Do I receive full root access and dedicated IP addresses?',
    answer:
      'Yes. Every cpcloudhost.com KVM node delivers full root SSH control, out-of-band emergency web VNC access, a dedicated IPv4 address, and /64 IPv6 subnet routing.',
  },
  {
    question: 'How do hardware snapshots work?',
    answer:
      'Capture clean point-in-time VM state snapshots directly from your client dashboard prior to kernel patches or software upgrades — with 1 to 3 snapshot slots included by tier.',
  },
  {
    question: 'Can I upgrade my vCPU cores and RAM without rebuilding?',
    answer:
      'Yes. Scale up smoothly from VPS Core 4 through VPS Max 12 with minimal reboot time while preserving your IP address, SSH keys, and filesystem volumes.',
  },
];

export const N8N_PLANS: ComputePlan[] = [
  {
    ...SHARED_HARDWARE_TIERS[0],
    id: 'n8n-starter-4',
    eyebrow: 'Dedicated n8n Cloud Node',
    name: 'n8n Starter 4',
    monthlyPrice: 12.99,
    summary: 'Save 1 month free when billed on an annual cycle.',
  },
  {
    ...SHARED_HARDWARE_TIERS[1],
    id: 'n8n-growth-6',
    eyebrow: 'Dedicated n8n Cloud Node',
    name: 'n8n Growth 6',
    monthlyPrice: 19.99,
    summary: 'Zero setup cost plus 1 month free on yearly billing.',
    recommended: true,
  },
  {
    ...SHARED_HARDWARE_TIERS[2],
    id: 'n8n-scale-8',
    eyebrow: 'Dedicated n8n Cloud Node',
    name: 'n8n Scale 8',
    monthlyPrice: 34.99,
    summary: 'Zero setup cost · High-memory n8n & Redis queue compute.',
  },
  {
    ...SHARED_HARDWARE_TIERS[3],
    id: 'n8n-enterprise-12',
    eyebrow: 'Dedicated n8n Cloud Node',
    name: 'n8n Enterprise 12',
    monthlyPrice: 59.99,
    summary: 'Zero setup cost · Dedicated 12-core power for heavy pipelines.',
  },
];

export const N8N_FEATURE_PILLARS: ComputePillarItem[] = [
  {
    id: 'docker',
    title: 'Pre-Configured Docker Compose Stack',
    description:
      'Every n8n server at cpcloudhost.com ships ready with isolated Docker services, automated container restarts, and custom environment variables.',
  },
  {
    id: 'workflows',
    title: 'Unlimited Workflows & Executions',
    description:
      'Avoid per-task or per-step SaaS meter overages — execute thousands of multi-step webhooks, cron jobs, and AI chains at flat monthly pricing.',
  },
  {
    id: 'postgres',
    title: 'Tuned PostgreSQL & Redis Queue Mode',
    description:
      'Eliminate SQLite lock bottlenecks using production PostgreSQL persistence paired with Redis background worker queues on multi-core nodes.',
  },
  {
    id: 'webhook',
    title: 'Automatic Reverse Proxy & Free SSL',
    description:
      'Point your custom subdomain to receive instant auto-renewing Let’s Encrypt TLS certificates ready for Stripe, Slack, CRM, and API webhooks.',
  },
  {
    id: 'storage',
    title: 'Dedicated SSD / NVMe Execution History',
    description:
      'Retain detailed JSON payload logs, binary file transforms, and local filesystem storage on fast enterprise SSD or NVMe arrays.',
  },
  {
    id: 'provision',
    title: 'Private Snapshot Rollbacks & Root SSH',
    description:
      'Update n8n releases safely with up to 3 hardware VM snapshots plus full SSH access to install community nodes and Python tools.',
  },
];

export const N8N_FAQS: ComputeFaqItem[] = [
  {
    question: 'Does cpcloudhost.com charge per workflow execution or active trigger?',
    answer:
      'No. Because your n8n instance runs on your own private KVM node, you get completely unlimited workflows, triggers, and node executions bounded only by your dedicated RAM and CPU.',
  },
  {
    question: 'How is n8n pre-installed on these servers?',
    answer:
      'Each node launches with an official Docker Compose deployment backed by Traefik/Caddy automatic HTTPS SSL termination, persistent volumes, and clean PostgreSQL + Redis configuration options.',
  },
  {
    question: 'Can I install third-party npm packages or n8n community nodes?',
    answer:
      'Yes. You retain full root SSH and Docker access to add verified n8n community nodes, Python utilities, Puppeteer browsers, or custom internal scripts.',
  },
  {
    question: 'Which tier should I pick for AI agents and high-volume webhooks?',
    answer:
      'n8n Starter 4 (8 GB RAM) handles standard CRM syncs smoothly, while n8n Growth 6 (12 GB RAM) and n8n Scale 8 (24 GB RAM) give generous concurrency headroom for LangChain pipelines and parallel queue workers with zero setup fee.',
  },
  {
    question: 'Do I get automatic HTTPS URLs for webhooks?',
    answer:
      'Yes — every n8n node supports automatic TLS certificate provisioning on your custom domain (e.g., flows.yourdomain.com) so external webhook providers connect securely right away.',
  },
  {
    question: 'Can I protect live automations before updating n8n?',
    answer:
      'Yes. Take a full hardware snapshot inside StackCP / client panel before upgrading your Docker image tags, with 1 to 3 snapshot slots included by plan tier.',
  },
];
