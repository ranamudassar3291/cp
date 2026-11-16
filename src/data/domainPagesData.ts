export interface DomainValuePillar {
  id:
    | 'hosting'
    | 'dns'
    | 'email'
    | 'migration'
    | 'ssl'
    | 'cdn'
    | 'lockcheck'
    | 'epp'
    | 'renewal'
    | 'privacy'
    | 'bulk'
    | 'support';
  title: string;
  description: string;
}

export interface DomainReasonBullet {
  title: string;
  description: string;
}

export interface DomainFaqItem {
  question: string;
  answer: string;
}

export const REGISTRATION_VALUE_PILLARS: DomainValuePillar[] = [
  {
    id: 'hosting',
    title: 'Complimentary Starter Hosting',
    description:
      'Launch clean static websites, landing pages, or coming-soon portals right away on included edge-cached web hosting with zero ads.',
  },
  {
    id: 'dns',
    title: 'Complete DNS Zone Control',
    description:
      'Manage A, AAAA, CNAME, MX, TXT, and SRV records cleanly inside StackCP with global Anycast nameservers built for rapid propagation.',
  },
  {
    id: 'email',
    title: 'Unlimited Email Forwarding',
    description:
      'Route custom addresses like hello@yourdomain.com straight to any personal or workspace inbox with SPF/DKIM hygiene tools.',
  },
  {
    id: 'migration',
    title: 'Zero-Downtime Domain Migration',
    description:
      'Point websites cleanly from external hosts or transfer live DNS records into cpcloudhost.com without breaking live site traffic or emails.',
  },
  {
    id: 'ssl',
    title: 'Free Wildcard SSL Security',
    description:
      'Protect primary domains and every subdomain automatically with auto-renewing HTTPS certificates provisioned inside your panel.',
  },
  {
    id: 'cdn',
    title: 'Worldwide Edge CDN Acceleration',
    description:
      'Cache assets automatically across global edge PoPs so visitors everywhere experience fast page rendering from day one.',
  },
];

export const REGISTRATION_WHY_BULLETS: DomainReasonBullet[] = [
  {
    title: 'Instant Checkout & Live Propagation',
    description: 'Register domains and publish DNS records live within minutes.',
  },
  {
    title: 'Unified StackCP Workspace',
    description:
      'Manage nameservers, forwarding rules, WHOIS privacy, and SSL in one view.',
  },
  {
    title: 'Transparent Local-Currency Pricing',
    description:
      'Clear registration and annual renewal rates automatically converted to your local currency.',
  },
  {
    title: 'Multi-Domain Portfolio Management',
    description:
      'Register, tag, lock, and renew your entire domain fleet cleanly together.',
  },
  {
    title: 'Hosting-Ready One-Click Linking',
    description:
      'Connect cleanly to Shared Cloud, Managed WordPress, Windows IIS, or VPS nodes anytime.',
  },
];

export const REGISTRATION_FAQS: DomainFaqItem[] = [
  {
    question: 'How does the live domain availability search check results?',
    answer:
      'Our search engine queries public RDAP registry directories and Google DNS-over-HTTPS root records simultaneously in real time to verify live registration status, nameservers, and WHOIS metadata.',
  },
  {
    question: 'What happens if the domain I searched is already registered?',
    answer:
      'You can immediately inspect live WHOIS/RDAP ownership dates and registrar details right inside the results card, launch a zero-downtime Transfer if you own the domain, or select available alternative extensions.',
  },
  {
    question: 'Is WHOIS privacy protection included with new registrations?',
    answer:
      'Yes. Eligible generic and country TLDs receive complimentary WHOIS registrant privacy masking at cpcloudhost.com to keep personal contact records off public lookups.',
  },
  {
    question: 'Do domain registrations include free DNS and email forwarding?',
    answer:
      'Every domain managed at cpcloudhost.com includes unlimited Anycast DNS record editing, email forwarding aliases, Wildcard SSL readiness, and basic starter hosting.',
  },
];

export const TRANSFER_VALUE_PILLARS: DomainValuePillar[] = [
  {
    id: 'lockcheck',
    title: 'Pre-Transfer Readiness Check',
    description:
      'Automatically verify Registrar Lock state, 60-day ICANN eligibility windows, and live DNS zones before submitting your authorization code.',
  },
  {
    id: 'renewal',
    title: 'Complimentary +1 Year Renewal',
    description:
      'Every eligible gTLD transfer adds one full year directly onto your existing expiration date — you never lose remaining months.',
  },
  {
    id: 'dns',
    title: 'Zero-Downtime DNS Preservation',
    description:
      'Import current zone records before nameserver cutover so websites, checkout APIs, and company mailboxes stay online uninterrupted.',
  },
  {
    id: 'epp',
    title: 'Encrypted EPP Authorization Flow',
    description:
      'Submit single or bulk EPP auth codes securely inside one unified transfer wizard with live status tracking.',
  },
  {
    id: 'privacy',
    title: 'Free Ongoing WHOIS Privacy',
    description:
      'Retain private WHOIS contact protection automatically after moving domains into your cpcloudhost.com StackCP portfolio.',
  },
  {
    id: 'support',
    title: '24/7 Registrar Transfer Engineers',
    description:
      'Stuck at an old registrar lock or missing IPS TAG? Our domain specialists guide .co.uk, .uk, and global transfers round the clock.',
  },
];

export const TRANSFER_WHY_BULLETS: DomainReasonBullet[] = [
  {
    title: 'No Lost Time Remaining',
    description:
      'Transferring adds 12 full months onto your domain’s current expiration date.',
  },
  {
    title: 'Keep Websites & Email Online',
    description:
      'Mirror A, MX, TXT, and DKIM records before cutover for zero downtime.',
  },
  {
    title: 'Bulk Portfolio Consolidation',
    description:
      'Move single domains or paste bulk lists together under transparent local-currency renewals.',
  },
  {
    title: 'Instant StackCP Auto-Renewal & Locking',
    description:
      'Protect domains with registrar transfer locks and consolidated billing.',
  },
  {
    title: 'Seamless Hosting Connection',
    description:
      'Attach transferred domains directly to any StackCP, WordPress, Windows, or KVM VPS cluster.',
  },
];

export const TRANSFER_FAQS: DomainFaqItem[] = [
  {
    question: 'What do I need before transferring a domain to cpcloudhost.com?',
    answer:
      'Ensure the domain is unlocked at your current registrar (no clientTransferProhibited lock), has passed the standard 60-day ICANN registration or prior-transfer cooldown, and have your EPP/Authorization Code ready.',
  },
  {
    question: 'Will my website or business email go offline during the transfer?',
    answer:
      'No. Selecting "Keep Existing Nameservers" or pre-importing your DNS zone into cpcloudhost.com ensures zero interruption to web hosting or incoming mail while the registrar handoff completes.',
  },
  {
    question: 'Do I lose remaining months already paid at my old registrar?',
    answer:
      'Never. For standard gTLDs like .com, .net, .org, .io, and .cloud, completing a transfer automatically adds 1 full year onto your existing expiration date.',
  },
  {
    question: 'How do .uk and .co.uk transfers work?',
    answer:
      'Nominet domains (.uk / .co.uk) transfer rapidly with zero fee once you update the IPS TAG at your losing registrar to cpcloudhost.com’s StackCP registrar tag.',
  },
];
