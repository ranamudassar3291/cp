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
