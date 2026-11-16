export type LegalPolicyId =
  | 'terms-conditions'
  | 'privacy-policy'
  | 'order-terms'
  | 'refund-policy'
  | 'abuse-policy';

export interface PolicyClause {
  id: string;
  number: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface PolicyMatrixRow {
  col1: string;
  col2: string;
  col3: string;
}

export interface LegalPolicyDocument {
  id: LegalPolicyId;
  shortLabel: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  jurisdictionBadge: string;
  contactEmail: string;
  seoTitle: string;
  seoDescription: string;
  summaryPoints: { label: string; value: string }[];
  matrixHeading?: string;
  matrixHeaders?: [string, string, string];
  matrixRows?: PolicyMatrixRow[];
  clauses: PolicyClause[];
}

export const LEGAL_POLICY_ORDER: LegalPolicyId[] = [
  'terms-conditions',
  'privacy-policy',
  'order-terms',
  'refund-policy',
  'abuse-policy',
];

export const LEGAL_POLICIES: Record<LegalPolicyId, LegalPolicyDocument> = {
  'terms-conditions': {
    id: 'terms-conditions',
    shortLabel: 'Terms & Conditions',
    title: 'Master Terms & Conditions of Service',
    subtitle:
      'Governing rules, service-level commitments, acceptable use standards, and contractual obligations for all cpcloudhost.com hosting, cloud compute, VPS, automation, and domain services worldwide.',
    effectiveDate: 'January 1, 2026',
    lastUpdated: 'November 1, 2026',
    jurisdictionBadge: 'Global Service Agreement · Commercial & ICANN Compliant',
    contactEmail: 'legal@cpcloudhost.com',
    seoTitle: 'Terms & Conditions — Master Service Agreement | cpcloudhost.com',
    seoDescription:
      'Read the official cpcloudhost.com Terms & Conditions covering shared cloud, cPanel, WordPress, Windows IIS, unmanaged KVM VPS, n8n hosting, domain registration, and 99.99% uptime SLA.',
    summaryPoints: [
      { label: 'Scope', value: 'Hosting, KVM VPS, n8n, Domains & SSL' },
      { label: 'Uptime Commitment', value: '99.99% Monthly Network SLA' },
      { label: 'Minimum Age', value: '18+ Commercial Eligibility' },
      { label: 'Legal Contact', value: 'legal@cpcloudhost.com' },
    ],
    matrixHeading: 'Service Responsibility & Management Boundary',
    matrixHeaders: ['Service Tier', 'Platform Scope', 'Client Security Responsibility'],
    matrixRows: [
      {
        col1: 'Shared, WordPress, Windows & cPanel Hosting',
        col2: 'Managed OS, patched kernel, firewall, NVMe storage, and daily backup engine',
        col3: 'CMS themes/plugins, application code, mailbox passwords, and DNS records',
      },
      {
        col1: 'Unmanaged KVM VPS & n8n Cloud Nodes',
        col2: 'Dedicated vCPU, RAM, NVMe/SSD block volume, hypervisor, and Layer-3/4 DDoS filter',
        col3: 'Root SSH access, OS updates, firewall rules, Docker containers, and local backups',
      },
      {
        col1: 'Domain Registration & Transfers',
        col2: 'ICANN/Registry DNS delegation, EPP locks, WHOIS/RDAP privacy, and DNSSEC keys',
        col3: 'Valid registrant contact details, timely renewals, and trademark compliance',
      },
    ],
    clauses: [
      {
        id: 'tc-acceptance',
        number: '01.',
        title: 'Definitions, Acceptance & Contractual Capacity',
        paragraphs: [
          'These Master Terms & Conditions ("Agreement") constitute a legally binding contract between cpcloudhost.com ("Company", "We", "Us") and any individual, sole proprietor, partnership, corporation, or organization ("Client", "You") accessing our websites, ordering cloud infrastructure, or utilizing any managed or unmanaged service.',
          'By registering an account, submitting an electronic order, initiating a domain transfer, applying a promotional code such as STARTFREE, or accessing StackCP, cPanel/WHM, Plesk/IIS, or SSH consoles, You represent that You are at least eighteen (18) years of age, possess full legal authority to bind Your organization, and unconditionally accept these Terms along with our Privacy Policy, Order Terms, Refund Policy, and Acceptable Use & Abuse Policy.',
        ],
      },
      {
        id: 'tc-scope',
        number: '02.',
        title: 'Scope of Infrastructure & Service Categories',
        paragraphs: [
          'cpcloudhost.com provides multi-region cloud web hosting (StackCP Shared Cloud, Managed WordPress, Windows IIS 10 ASP.NET Core, and cPanel/WHM NVMe plans), bare-metal virtualized Unmanaged KVM VPS nodes, pre-configured n8n automation environments, and accredited domain registration and transfer services.',
          'Managed shared, WordPress, Windows, and cPanel plans include automated underlying operating system patching, web server tuning, and container isolation. Unmanaged KVM VPS and standalone n8n compute plans provide full root administrative privileges; Client is solely responsible for guest operating system hardening, SSH key management, third-party package security, and snapshot retention.',
        ],
      },
      {
        id: 'tc-fair-use',
        number: '03.',
        title: 'Fair Resource Utilization & Shared Node Stability',
        paragraphs: [
          'Plans advertised with "Unlimited Bandwidth" or "Unlimited SSD/NVMe" operate under a good-faith website and web-application fair-usage policy designed to ensure consistently fast I/O across shared cloud clusters.',
        ],
        bullets: [
          'Shared, WordPress, Windows, and cPanel hosting storage is allocated exclusively for active website files, databases, and business email—never for cold archival file lockers, raw media CDN mirrors, torrent seeding, or off-site personal backups.',
          'Sustained consumption exceeding node LVE/CloudLinux thresholds, runaway cron loops, or unindexed query floods that degrade neighboring tenants may trigger temporary throttling with technical notification.',
          'Dedicated KVM VPS and n8n nodes guarantee isolated vCPU, ECC RAM, and NVMe/SSD IOPS allocations up to each plan’s hardware matrix ceiling.',
        ],
      },
      {
        id: 'tc-aup',
        number: '04.',
        title: 'Prohibited Activities & Compliance Standards',
        paragraphs: [
          'Client agrees not to deploy, transmit, or host any content or process violating applicable international law, ICANN regulations, or network security standards:',
        ],
        bullets: [
          'Child Sexual Abuse Material (CSAM), human exploitation, or non-consensual intimate media results in immediate permanent termination and mandatory reporting to international law enforcement authorities.',
          'Phishing portals, credential harvesters, banking impersonation pages, botnet command-and-control (C2) endpoints, ransomware distribution, and malware payloads are strictly prohibited.',
          'Outbound DDoS attacks, amplification floods, open DNS/NTP/SMTP relays, SSH/RDP brute-force scanners, and unauthorized cryptocurrency mining are banned across all shared and VPS nodes.',
          'Unsolicited bulk email (spam) violating CAN-SPAM, GDPR ePrivacy rules, or Spamhaus policies is grounds for immediate SMTP port suspension.',
        ],
      },
      {
        id: 'tc-domains',
        number: '05.',
        title: 'Domain Names, ICANN UDRP & WHOIS Accuracy',
        paragraphs: [
          'Domain registrations, renewals, and EPP transfers are governed jointly by this Agreement and policies established by the Internet Corporation for Assigned Names and Numbers (ICANN) and the relevant Top-Level Domain registry (such as Verisign for .com/.net or Nominet for .uk/.co.uk).',
          'Client must maintain truthful, verified WHOIS/RDAP contact information at all times and respond within fifteen (15) calendar days to registrar verification notices. Providing inaccurate registrant records or failing to verify email ownership permits mandatory domain suspension. All domain disputes remain subject to ICANN’s Uniform Domain-Name Dispute-Resolution Policy (UDRP).',
        ],
      },
      {
        id: 'tc-billing',
        number: '06.',
        title: 'Fees, Multi-Currency Display, Auto-Renewal & Non-Payment',
        paragraphs: [
          'Service fees are anchored in US Dollars (USD) and dynamically displayed in Your detected local currency using live mid-market exchange feeds for convenience. Payment obligations, renewal schedules, tax handling, and promotional discounts are governed in full by our Order Terms.',
          'Unless auto-renewal is cancelled inside the client portal prior to the invoice due date, recurring hosting, VPS, and domain services renew automatically to prevent service interruption. Past-due invoices trigger temporary suspension after five (5) days and permanent workspace deletion after thirty (30) days.',
        ],
      },
      {
        id: 'tc-sla',
        number: '07.',
        title: '99.99% Uptime Service Level Agreement (SLA)',
        paragraphs: [
          'cpcloudhost.com guarantees 99.99% monthly network, power, and core virtualization uptime across our London, New York, Dallas, Frankfurt, and Singapore cloud regions. Scheduled maintenance announced at least 48 hours ahead, upstream DDoS events exceeding mitigation capacity, and client misconfigurations are excluded from downtime calculations.',
          'If verified unscheduled outage drops monthly availability below 99.99%, Client may claim a billing service credit within 14 days via our support portal: 10% credit for 99.90%–99.98% uptime, 25% credit for 99.00%–99.89% uptime, and 50% credit below 99.00% uptime, capped at one month’s recurring fee per billing cycle.',
        ],
      },
      {
        id: 'tc-backups',
        number: '08.',
        title: 'Automated Backups & Client Data Duty',
        paragraphs: [
          'While Shared, WordPress, Windows, and cPanel plans include automated daily or weekly backup snapshots as a resilience safeguard, Client retains primary responsibility for maintaining independent off-site backups of mission-critical files, MySQL/MSSQL databases, and IMAP mailboxes prior to major software updates or migrations.',
          'Unmanaged KVM VPS customers may utilize snapshot slots defined in their tier (1 to 3 snapshots), which should be combined with off-server replication for regulated production workloads.',
        ],
      },
      {
        id: 'tc-ip',
        number: '09.',
        title: 'Intellectual Property & Third-Party Software Licenses',
        paragraphs: [
          'All cpcloudhost.com trademarks, portal dashboards, architectural documentation, and knowledge base articles remain exclusive intellectual property of cpcloudhost.com. Third-party software provisioned onto Client instances—including cPanel/WHM, LiteSpeed Enterprise, Windows Server, Docker, and n8n—remains licensed under each respective vendor’s EULA.',
        ],
      },
      {
        id: 'tc-liability',
        number: '10.',
        title: 'Limitation of Liability & Indemnification',
        paragraphs: [
          'To the maximum extent permitted by applicable law, cpcloudhost.com shall not be liable for indirect, incidental, consequential, punitive, or lost-profit damages arising out of website downtime, data loss, domain expiration, or third-party security compromises. In all circumstances, our total cumulative liability shall not exceed the aggregate fees actually paid by Client during the three (3) months immediately preceding the claim.',
          'Client agrees to indemnify and hold harmless cpcloudhost.com, its officers, engineers, and upstream datacenter partners from all claims, regulatory fines, or legal costs resulting from Client-hosted content, trademark infringement, or AUP breaches.',
        ],
      },
      {
        id: 'tc-termination',
        number: '11.',
        title: 'Suspension, Termination & Force Majeure',
        paragraphs: [
          'Either party may terminate recurring services upon notice ahead of the next billing date. cpcloudhost.com may immediately suspend or terminate accounts involved in illegal content, unpatched security outbreaks risking host stability, repeated non-payment, or abusive conduct toward support staff.',
          'Neither party shall be held liable for performance delays caused by Force Majeure events beyond reasonable control, including fiber-optic submarine cable cuts, sovereign regulatory embargoes, power grid blackouts, war, or natural disasters.',
        ],
      },
      {
        id: 'tc-governing',
        number: '12.',
        title: 'Amendments & Governing Law',
        paragraphs: [
          'We may update these Terms from time to time to reflect regulatory shifts, registry rules, or infrastructure upgrades, posting revised versions with updated dates. Material changes affecting active contracts are communicated via registered account email at least 15 days before taking effect. Disputes not resolved informally by support escalation shall be submitted to binding commercial arbitration under internationally recognized rules (ICC / LCIA framework), except where mandatory local consumer protections prevail.',
        ],
      },
    ],
  },

  'privacy-policy': {
    id: 'privacy-policy',
    shortLabel: 'Privacy Policy',
    title: 'Global Privacy & Data Protection Policy',
    subtitle:
      'Transparent international data governance aligned with EU/UK GDPR, California CCPA/CPRA, PIPEDA, PDPA, and global privacy standards for all visitors, hosting clients, and domain registrants.',
    effectiveDate: 'January 1, 2026',
    lastUpdated: 'November 1, 2026',
    jurisdictionBadge: 'GDPR · UK DPA · CCPA/CPRA · ISO-Aligned Controls',
    contactEmail: 'privacy@cpcloudhost.com',
    seoTitle: 'Privacy Policy — GDPR & Global Data Protection | cpcloudhost.com',
    seoDescription:
      'How cpcloudhost.com collects, secures, transfers, and protects personal data across hosting accounts, WHOIS/RDAP domains, payments, and global cloud infrastructure.',
    summaryPoints: [
      { label: 'GDPR / CCPA', value: 'Full DSAR & Erasure Rights' },
      { label: 'Payment Storage', value: 'PCI-DSS Tokenized (Zero Raw PAN)' },
      { label: 'Security Breach SLA', value: '72-Hour Supervisory Notice' },
      { label: 'Privacy Officer', value: 'privacy@cpcloudhost.com' },
    ],
    matrixHeading: 'Personal Data Categories & Statutory Retention Schedule',
    matrixHeaders: ['Data Category', 'Primary Processing Purpose', 'Retention Duration'],
    matrixRows: [
      {
        col1: 'Account, Billing & KYC Identity',
        col2: 'Provision services, prevent payment fraud, and issue tax-compliant invoices',
        col3: 'Active term + 7 years per statutory accounting laws',
      },
      {
        col1: 'Domain WHOIS / RDAP Registrant Records',
        col2: 'ICANN accreditation, TLD ownership escrow, and optional privacy redaction',
        col3: 'Duration of registration + mandatory ICANN escrow window',
      },
      {
        col1: 'Access Telemetry & Firewall Security Logs',
        col2: 'DDoS mitigation, intrusion detection, and RFC 2142 abuse forensics',
        col3: '90 days rolling (extended only for active security/legal holds)',
      },
      {
        col1: 'Support Tickets & Live Chat Logs',
        col2: 'Engineering troubleshooting, free site migrations, and SLA audit trail',
        col3: '36 months post-ticket closure unless deletion requested earlier',
      },
    ],
    clauses: [
      {
        id: 'pp-controller',
        number: '01.',
        title: 'Data Controller Scope & Commitment',
        paragraphs: [
          'cpcloudhost.com ("Controller") respects the privacy of every website visitor, trial registrant, enterprise client, and domain contact worldwide. This Privacy Policy explains how we collect, process, safeguard, transfer, and erase personal information across our website, StackCP/cPanel portals, APIs, and support channels.',
          'When You host your own websites, databases, or customer applications on cpcloudhost.com infrastructure, You act as the Data Controller for your end-users’ personal data and cpcloudhost.com acts strictly as Your technical Data Processor under GDPR Article 28 safeguards.',
        ],
      },
      {
        id: 'pp-collected',
        number: '02.',
        title: 'Categories of Information We Collect',
        paragraphs: [
          'We follow strict data minimization principles and only collect information objectively required to deliver, bill, and secure cloud services:',
        ],
        bullets: [
          'Identity & Contact Data: Full name, company name, billing address, country, primary email, and support phone/WhatsApp number.',
          'Financial & Tax Metadata: Billing currency, VAT/GST registration identifiers, transaction references, and tokenized card last-4 digits from our PCI-DSS Level-1 payment gateways. We never store raw card numbers (PAN) or CVV security codes on cpcloudhost.com servers.',
          'Domain Registry Contact Data: Registrant, administrative, and technical contact fields required by ICANN and country-code registries, shielded automatically behind WHOIS privacy where eligible.',
          'Technical & Security Telemetry: IPv4/IPv6 addresses, Geo-IP country lookup for automatic local currency localization, HTTP user-agent headers, login audit trails, and firewall events.',
        ],
      },
      {
        id: 'pp-lawful-bases',
        number: '03.',
        title: 'Lawful Bases for Processing (GDPR Article 6)',
        paragraphs: [
          'Where EU GDPR, UK GDPR, or equivalent privacy legislation applies, every processing activity relies on a documented legal ground:',
        ],
        bullets: [
          'Contractual Necessity (Art. 6(1)(b)): Provisioning servers, executing free migrations, registering domains, delivering 24/7 support, and processing payments.',
          'Legal Obligation (Art. 6(1)(c)): Retaining tax invoices, fulfilling KYC anti-fraud compliance, and complying with lawful court orders or ICANN policies.',
          'Legitimate Interest (Art. 6(1)(f)): Protecting cloud clusters against DDoS floods, brute-force attacks, phishing, and abuse incidents.',
          'Explicit Consent (Art. 6(1)(a)): Optional promotional announcements or manually triggered support outreach, withdrawable at any time.',
        ],
      },
      {
        id: 'pp-cookies',
        number: '04.',
        title: 'Functional Storage, Geo-IP Localization & Cookies',
        paragraphs: [
          'cpcloudhost.com uses strictly necessary browser storage and session identifiers to preserve portal authentication, cart state, security CSRF tokens, and Your selected local display currency (automatically detected via Geo-IP or chosen manually via the top navigation bar).',
          'We do not sell visitor browsing profiles to third-party advertising networks or run invasive cross-site ad trackers.',
        ],
      },
      {
        id: 'pp-sharing',
        number: '05.',
        title: 'Sub-Processors, Registries & Legal Disclosures',
        paragraphs: [
          'We never sell, rent, or monetize Client personal data. Personal information is shared strictly on a need-to-know basis with vetted infrastructure partners bound by Data Processing Agreements:',
        ],
        bullets: [
          'Accredited TLD registries (Verisign, Nominet, PIR, CentralNic) and ICANN data escrow agents exclusively for domain registration.',
          'Tier-4 colocation datacenter partners and upstream DDoS scrubbing carriers across the UK, USA, Germany, and Singapore.',
          'Certified payment processors and anti-fraud verification engines during checkout.',
          'Competent law enforcement or judicial authorities strictly upon receipt of a valid, legally binding subpoena, warrant, or court order.',
        ],
      },
      {
        id: 'pp-transfers',
        number: '06.',
        title: 'International Cross-Border Data Transfers',
        paragraphs: [
          'Because cpcloudhost.com operates cloud hubs in London, New York, Dallas, Frankfurt, and Singapore, data may traverse borders when routing traffic or fulfilling multi-region support. Whenever personal data originating in the EEA, UK, or Switzerland is processed outside adequacy jurisdictions, transfers are safeguarded through European Commission Standard Contractual Clauses (SCCs) and the UK International Data Transfer Addendum (IDTA).',
        ],
      },
      {
        id: 'pp-rights',
        number: '07.',
        title: 'Your Global Privacy Rights (DSAR, Erasure & Opt-Out)',
        paragraphs: [
          'Depending on Your jurisdiction (EEA, UK, California, Canada, Brazil, UAE, Singapore, and others), You may exercise the following rights free of charge by emailing privacy@cpcloudhost.com:',
        ],
        bullets: [
          'Right of Access & Data Portability: Request an electronic copy of personal account records held on Your profile.',
          'Right to Rectification: Correct inaccurate billing, corporate VAT, or domain WHOIS records.',
          'Right to Erasure ("Right to be Forgotten"): Request account and backup deletion once active services conclude and mandatory tax/abuse holds expire.',
          'Right to Restrict or Object: Challenge processing grounded in legitimate interest or opt out of non-essential communications.',
          'CCPA/CPRA Notice: California residents have the right to know categories collected, request deletion, and receive equal service pricing without discrimination. We do not "sell" or "share" personal data as defined under CCPA.',
        ],
      },
      {
        id: 'pp-security',
        number: '08.',
        title: 'Technical Security & 72-Hour Breach Notification',
        paragraphs: [
          'All portals, API endpoints, and billing workflows enforce TLS 1.3 transport encryption, strict HSTS policies, hashed credential storage, hardware-isolated LVE/KVM virtualization, and continuous malware scanning.',
          'In the event of a confirmed personal data breach presenting material risk to individuals, cpcloudhost.com triggers forensic containment immediately and notifies relevant supervisory authorities and impacted Clients within seventy-two (72) hours of confirmation.',
        ],
      },
      {
        id: 'pp-children',
        number: '09.',
        title: 'Children’s Privacy & DPO Contact',
        paragraphs: [
          'Our services are commercial infrastructure offerings intended strictly for adults aged 18 years or older. We do not knowingly collect data from minors. Questions, Data Processing Addendum (DPA) requests, or supervisory complaints can be addressed directly to our Data Protection Lead at privacy@cpcloudhost.com.',
        ],
      },
    ],
  },

  'order-terms': {
    id: 'order-terms',
    shortLabel: 'Order Terms',
    title: 'International Order, Billing & Tax Terms',
    subtitle:
      'Complete worldwide order fulfillment, automated multi-currency conversion, country-specific VAT/GST taxation, promotional bundle conditions, and billing lifecycle policies for every supported country.',
    effectiveDate: 'January 1, 2026',
    lastUpdated: 'November 1, 2026',
    jurisdictionBadge: 'Worldwide Multi-Currency & Cross-Border Tax Rules',
    contactEmail: 'billing@cpcloudhost.com',
    seoTitle: 'Order Terms — International Billing, Multi-Currency & Taxes | cpcloudhost.com',
    seoDescription:
      'Official cpcloudhost.com Order Terms explaining Geo-IP local currency pricing, global VAT/GST invoicing rules, instant provisioning, Free .com bundle terms, and renewal schedules.',
    summaryPoints: [
      { label: 'Currency Engine', value: '50+ Currencies · Live Mid-Market FX' },
      { label: 'Provisioning', value: 'Instant Cloud / VPS Activation' },
      { label: 'Free .com Rule', value: 'Year-1 Included on Eligible Annual Plans' },
      { label: 'Billing Desk', value: 'billing@cpcloudhost.com' },
    ],
    matrixHeading: 'Country & Regional Tax, Currency & Compliance Rules',
    matrixHeaders: ['Country / Region', 'Local Display Currency & Settlement', 'Tax, VAT / GST & Invoicing Rule'],
    matrixRows: [
      {
        col1: 'United Kingdom & European Union (UK / EU)',
        col2: 'GBP (£) or EUR (€) live mid-market pricing at checkout',
        col3: 'Statutory VAT applies to consumers; 0% B2B Reverse Charge applied with verified EU/UK VAT ID',
      },
      {
        col1: 'United States & Canada (US / CA)',
        col2: 'USD ($) or CAD (C$) transparent settlement',
        col3: 'State/provincial digital services sales tax or GST/HST applied where nexus thresholds apply',
      },
      {
        col1: 'Pakistan, India & Bangladesh (South Asia)',
        col2: 'PKR (Rs), INR (₹), or BDT (৳) localized rate display',
        col3: 'Export/cross-border cloud settlement; Indian corporate entities may supply GSTIN for reverse-charge records',
      },
      {
        col1: 'UAE, Saudi Arabia & GCC (Middle East)',
        col2: 'AED, SAR, QAR, KWD localized pricing',
        col3: 'Standard GCC VAT invoices generated electronically with TRN/TIN details upon request',
      },
      {
        col1: 'Asia-Pacific, LATAM & Africa (Global)',
        col2: 'SGD, AUD, JPY, MYR, TRY, NGN, ZAR & 40+ ISO currencies',
        col3: 'Card issuer settles local equivalent cleanly; tax-exempt corporate certificates honored globally',
      },
    ],
    clauses: [
      {
        id: 'ot-placement',
        number: '01.',
        title: 'Order Placement, Acceptance & Fraud Verification',
        paragraphs: [
          'Every order submitted through cpcloudhost.com represents an offer to purchase cloud infrastructure or domain registration subject to automated anti-fraud scoring (IP reputation, billing country verification, and sanction-list screening). An order becomes binding only once accepted by our billing system and an invoice confirmation is issued.',
          'Orders flagged for mismatched geolocation, proxy/VPN obfuscation during card checkout, or unverified payment instruments may require secondary identity verification before node provisioning.',
        ],
      },
      {
        id: 'ot-currency',
        number: '02.',
        title: 'Geo-IP Currency Display & Foreign Exchange Settlement',
        paragraphs: [
          'For clarity across international markets, cpcloudhost.com automatically detects visitor country via IP and converts baseline USD ($) pricing into Your local currency (such as PKR, GBP, EUR, AED, SAR, INR, CAD, AUD, or SGD) using live mid-market exchange rates updated continuously.',
          'When processing cards or international wallets, minor variance (typically 0.5%–2%) may occur if Your issuing bank applies a cross-border FX spread or international transaction fee. Any bank-imposed foreign transaction fee remains solely between You and Your card issuer.',
        ],
      },
      {
        id: 'ot-taxes',
        number: '03.',
        title: 'International Taxation, VAT, GST & Withholding Rules',
        paragraphs: [
          'Displayed catalog prices exclude applicable Value Added Tax (VAT), Goods and Services Tax (GST), or regional digital service levies unless explicitly noted at the final checkout summary:',
        ],
        bullets: [
          'UK & EU B2B Customers: Provide a valid VAT Registration Number prior to invoice payment to qualify for 0% VAT Reverse-Charge accounting where applicable.',
          'Pakistan, GCC & APAC Corporate Accounts: Electronic PDF tax invoices displaying entity name, registration number, and itemized plan descriptions are downloadable directly from your client portal.',
          'Local bank withholding taxes, if applicable in Client’s domestic jurisdiction, may not be deducted from cpcloudhost.com net invoice totals; full gross invoice settlement is required.',
        ],
      },
      {
        id: 'ot-provisioning',
        number: '04.',
        title: 'Activation & Provisioning Timelines',
        paragraphs: [
          'Shared Cloud, Managed WordPress, Windows IIS, cPanel Web Hosting, Unmanaged KVM VPS, and n8n nodes provision automatically within 60 seconds to 5 minutes of cleared payment confirmation.',
          'New generic TLD domain registrations propagate across root DNS within 5–30 minutes. Inbound Domain Transfers require manual authorization (EPP Auth Code + Registrant Email approval) and complete in 5 to 7 calendar days depending on the losing registrar’s ICANN release schedule.',
        ],
      },
      {
        id: 'ot-promos',
        number: '05.',
        title: 'Promotional Discounts, Free Trial & Free .com Domain Rules',
        paragraphs: [
          'Introductory discounts (including first-term savings, Switch Credits up to 12 months, and the 30-day promo code STARTFREE) apply exclusively to the initial billing period specified at checkout. Subsequent renewals occur at prevailing standard catalog rates unless an explicit multi-year lock—such as our Exclusive 5-Year plan—was selected.',
          'Plans advertising "1 Free .com Domain (With Yearly)" grant one (1) complimentary first-year .com registration when purchased on a qualifying 12-month or longer Shared, WordPress, Windows, or cPanel billing term. Year-two and subsequent renewals bill at standard .com pricing.',
        ],
      },
      {
        id: 'ot-renewals',
        number: '06.',
        title: 'Auto-Renewal, Invoicing Timeline & Late Suspension',
        paragraphs: [
          'To protect live client websites and email inboxes from accidental expiry, renewal invoices generate fourteen (14) days ahead of expiration and charge saved payment methods on the due date:',
        ],
        bullets: [
          'Day 0 (Due Date): Primary auto-charge attempt and invoice notice.',
          'Day +3: Automated overdue warning notice via registered billing email.',
          'Day +5: Temporary service suspension (web/control panel access paused; domain DNS may enter registrar hold).',
          'Day +30: Permanent account termination and irreversible cryptographic purge of shared files and VPS block volumes.',
          'Expired domains entering Registry Redemption Grace Period incur mandatory upstream registry restoration surcharges beyond standard renewal fees.',
        ],
      },
      {
        id: 'ot-changes',
        number: '07.',
        title: 'Upgrades, Downgrades & Cancellation Notice',
        paragraphs: [
          'You may upgrade hosting, storage, or KVM VPS tiers anytime inside the billing portal with automated pro-rata credit calculation for unused days on your current cycle. Plan downgrades take effect cleanly at the next renewal date.',
          'To prevent automatic renewal billing, submit an online cancellation request through your client portal at least forty-eight (48) hours prior to the invoice renewal timestamp.',
        ],
      },
    ],
  },

  'refund-policy': {
    id: 'refund-policy',
    shortLabel: 'Refund Policy',
    title: 'Global Refund Policy & 30-Day Money-Back Guarantee',
    subtitle:
      'Transparent refund eligibility, prorated domain bundle rules, third-party registry pass-through exclusions, and rapid payment-rail reversal timelines across all currencies.',
    effectiveDate: 'January 1, 2026',
    lastUpdated: 'November 1, 2026',
    jurisdictionBadge: '30-Day Hosting Guarantee · Transparent Exclusions',
    contactEmail: 'billing@cpcloudhost.com',
    seoTitle: 'Refund Policy — 30-Day Money-Back Guarantee | cpcloudhost.com',
    seoDescription:
      'Official cpcloudhost.com Refund Policy detailing our 30-day unconditional money-back guarantee on shared, WordPress, cPanel & Windows hosting, plus VPS and domain refund rules.',
    summaryPoints: [
      { label: 'Core Hosting Window', value: '30-Day Money-Back Guarantee' },
      { label: 'Card / Bank Processing', value: '5–10 Business Days' },
      { label: 'Account Credit Option', value: 'Instant Wallet Credit' },
      { label: 'Refund Support', value: 'billing@cpcloudhost.com' },
    ],
    matrixHeading: 'Product-by-Product Refund Eligibility Matrix',
    matrixHeaders: ['Service / Product Type', 'Refund Eligibility Window', 'Special Conditions & Deductions'],
    matrixRows: [
      {
        col1: 'Shared, WordPress, Windows IIS & cPanel Hosting',
        col2: '30-Day Full Money-Back Guarantee',
        col3: 'Applies to initial order only; includes annual plans minus $9.99 if a Free .com was registered',
      },
      {
        col1: 'Unmanaged KVM VPS & n8n Cloud Nodes',
        col2: '7-Day Technical SLA Guarantee',
        col3: 'Full refund if verified hardware/network SLA fault cannot be resolved by engineering',
      },
      {
        col1: 'Domain Registrations, Renewals & Transfers',
        col2: 'Non-Refundable (Registry Pass-Through)',
        col3: 'ICANN/Registry fees finalize immediately upon creation; domain ownership remains 100% yours',
      },
      {
        col1: 'Dedicated IPs, Paid SSL & Custom Migrations',
        col2: 'Non-Refundable Once Issued',
        col3: 'Third-party CA issuance or completed manual engineering work cannot be reversed',
      },
    ],
    clauses: [
      {
        id: 'rp-guarantee',
        number: '01.',
        title: '30-Day Unconditional Money-Back Guarantee (Core Hosting)',
        paragraphs: [
          'First-time orders for Shared Web Hosting, Managed WordPress Hosting, Windows Web Hosting (excluding non-promotional custom hardware), and cPanel Web Hosting are protected by an unconditional thirty (30) calendar-day money-back guarantee starting from the exact date of initial service activation.',
          'If our platform performance, speed, or support does not satisfy Your expectations within those first 30 days, simply request a cancellation and refund through your client portal or email billing@cpcloudhost.com—no complex hurdles required.',
        ],
      },
      {
        id: 'rp-free-domain',
        number: '02.',
        title: 'Refund Rules for Annual Bundles With a "Free .com Domain"',
        paragraphs: [
          'Because ICANN and top-level domain registries charge non-reversible wholesale fees the instant a domain name is minted, promotional free domain registrations included with annual hosting plans follow a fair deduction policy if cancelled within 30 days:',
        ],
        bullets: [
          'When You cancel an eligible annual hosting plan within 30 days after registering a complimentary .com domain, cpcloudhost.com deducts our standard 1-year .com domain fee ($9.99) from your refund total.',
          'You retain 100% legal ownership and full DNS/EPP control of the domain name for the remainder of the year—nothing is lost or confiscated.',
          'If no domain name was registered under the promotional voucher before cancelling, 100% of your hosting payment is refunded.',
        ],
      },
      {
        id: 'rp-non-refundable',
        number: '03.',
        title: 'Strict Non-Refundable Items & Exceptions',
        paragraphs: [
          'In line with international hosting and registrar standards, the following services cannot be refunded once provisioned or renewed:',
        ],
        bullets: [
          'All Domain Name Registrations, Auto-Renewals, Inbound Transfers, and Expired Redemption Fees once transmitted to the registry.',
          'Renewal billing cycles processed automatically after the initial 30-day new-customer guarantee window has passed.',
          'Dedicated IPv4 allocations, third-party commercial SSL certificates, cPanel/Windows enterprise add-on licenses already provisioned, and bespoke engineering consultations.',
          'Accounts suspended or terminated for confirmed violations of our Terms & Conditions or Acceptable Use / Abuse Policy (including phishing, spam, CSAM, malware hosting, or DDoS attacks).',
          'Duplicate trial or promotional accounts created to abuse the 30-day guarantee repeatedly.',
        ],
      },
      {
        id: 'rp-vps',
        number: '04.',
        title: 'Unmanaged KVM VPS & n8n Server Refund Policy',
        paragraphs: [
          'Unmanaged KVM VPS and n8n automation instances dedicate physical vCPU, RAM, NVMe/SSD capacity, and clean IPv4 addresses exclusively to your node upon boot. Accordingly, VPS and n8n plans do not carry a blanket discretionary 30-day trial guarantee.',
          'However, every new KVM VPS or n8n node carries a 7-Day Hardware & Network Guarantee: if the provisioned server experiences unresolvable hypervisor instability, packet loss, or failure to meet advertised vCPU/RAM/NVMe specs within 7 days of activation, You qualify for a 100% refund upon verification by our infrastructure engineers.',
        ],
      },
      {
        id: 'rp-timelines',
        number: '05.',
        title: 'Refund Method, Multi-Currency Rules & Processing Speed',
        paragraphs: [
          'Approved refunds are credited exclusively back to the original payment method (Visa, Mastercard, PayPal, local bank rail, or digital wallet) used during purchase, or applied instantly to Your cpcloudhost.com Account Wallet Credit at Your election.',
          'Internal refund authorization completes within 24–48 business hours. Card networks and international banks typically post the funds to Your statement within five (5) to ten (10) business days. Refunds settle strictly in the exact currency amount originally captured by the payment gateway; cpcloudhost.com is not responsible for exchange rate fluctuations occurring between checkout and refund dates.',
        ],
      },
      {
        id: 'rp-how-to',
        number: '06.',
        title: 'How to Request a Refund Safely',
        paragraphs: [
          'To receive immediate processing without cancellation delays:',
        ],
        bullets: [
          'Ensure You have downloaded all personal website backups, databases, and emails beforehand—cancellation triggers permanent workspace purging upon refund issuance.',
          'Submit a "Cancellation Request — Immediate" inside your client dashboard or email billing@cpcloudhost.com from your registered account email quoting your Invoice ID.',
          'Please contact Billing Support prior to initiating any bank chargeback. Unannounced chargebacks trigger automatic payment-gateway dispute holds across attached domains and servers until the dispute resolves.',
        ],
      },
    ],
  },

  'abuse-policy': {
    id: 'abuse-policy',
    shortLabel: 'Abuse Policy & Report',
    title: 'International Abuse Policy & Official Complaint Portal',
    subtitle:
      'RFC 2142, DMCA, EU Digital Services Act (DSA) & CERT-compliant network abuse governance. Review enforcement response SLAs or file an official technical abuse complaint worldwide.',
    effectiveDate: 'January 1, 2026',
    lastUpdated: 'November 1, 2026',
    jurisdictionBadge: 'RFC 2142 · DMCA 17 U.S.C. § 512 · EU DSA Notice-and-Action',
    contactEmail: 'abuse@cpcloudhost.com',
    seoTitle: 'Abuse Policy & Report Network Abuse | cpcloudhost.com',
    seoDescription:
      'Report phishing, malware, spam, DDoS, DMCA copyright infringement, or security abuse originating from cpcloudhost.com infrastructure via our international Abuse Complaint Portal.',
    summaryPoints: [
      { label: 'Abuse Desk Email', value: 'abuse@cpcloudhost.com' },
      { label: 'P0 Critical SLA', value: '< 2 Hours Containment' },
      { label: 'DMCA / DSA Notice', value: '24–48 Hours Review' },
      { label: 'CSAM / Botnets', value: 'Zero-Tolerance Immediate Drop' },
    ],
    matrixHeading: 'Global Abuse Severity Classification & Enforcement SLAs',
    matrixHeaders: ['Severity Level', 'Incident Category', 'Action & Client Remediation Window'],
    matrixRows: [
      {
        col1: 'Critical (P0)',
        col2: 'CSAM, Ransomware C2, Active Banking Phishing, Outbound DDoS Floods',
        col3: 'Immediate null-route / suspension (< 2 hrs); zero notice period & authority escalation',
      },
      {
        col1: 'High (P1)',
        col2: 'Compromised WordPress Malware, Spam Relay, SSH/RDP Brute-Force Scanners',
        col3: 'Emergency network/SMTP isolation (< 12 hrs); 24-hour cure deadline for verified cleanups',
      },
      {
        col1: 'Legal Notice (P2)',
        col2: 'DMCA 17 U.S.C. § 512 Copyright, EU DSA Takedown, Brand Trademark Disputes',
        col3: 'Reviewed in 24–48 hrs; statutory counter-notice & content removal workflow enforced',
      },
    ],
    clauses: [
      {
        id: 'ab-purpose',
        number: '01.',
        title: 'Zero-Tolerance Network Integrity Mandate (RFC 2142)',
        paragraphs: [
          'cpcloudhost.com maintains strict automated telemetry and a dedicated 24/7 Trust & Safety Abuse Desk (abuse@cpcloudhost.com) conforming to IETF RFC 2142, Messaging Malware Mobile Anti-Abuse Working Group (M3AAWG) guidelines, and Tier-1 transit carrier peering policies.',
          'Whether a violation stems from deliberate malicious deployment or an unpatched third-party plugin on a client account, our engineering team acts decisively to isolate offending workloads and protect global Internet stability.',
        ],
      },
      {
        id: 'ab-prohibited',
        number: '02.',
        title: 'Strict Prohibited Conduct Categories',
        paragraphs: [
          'Any IP address, domain, shared container, or KVM VPS assigned to cpcloudhost.com is strictly prohibited from hosting or originating:',
        ],
        bullets: [
          'Phishing & Fraudulent Credential Capture: Fake login pages impersonating banks, payment gateways, government agencies, SaaS providers, or courier services.',
          'Malware, Exploits & Botnets: Hosting trojans, exploit kits, cryptojackers, or Command-and-Control (C2) servers.',
          'DDoS & Network Disruption: Originating SYN/UDP/HTTP floods, DNS/NTP amplification, IP spoofing, or automated vulnerability/port scanning against external hosts.',
          'Spam & Unsolicited Bulk Messaging: Operating bulk mailers, purchased mailing lists, or unauthenticated open relays triggering Spamhaus SBL/XBL or AbuseIPDB listings.',
          'Illegal Material: Zero tolerance for Child Sexual Abuse Material (CSAM), violent extremism, or illegal narcotics/weapons marketplaces.',
        ],
      },
      {
        id: 'ab-dmca',
        number: '03.',
        title: 'DMCA & EU Digital Services Act (DSA) Takedown Process',
        paragraphs: [
          'Rights holders reporting copyright or trademark infringement must submit a valid notice including: (a) physical or electronic signature of the rights holder or authorized agent; (b) clear identification of the copyrighted work or registered mark; (c) exact infringing URLs hosted on our network; (d) contact telephone/email details; and (e) a good-faith statement under penalty of perjury that the disputed use is unauthorized.',
          'Clients who believe a DMCA notice was filed erroneously may submit a formal counter-notification under 17 U.S.C. § 512(g) to legal@cpcloudhost.com.',
        ],
      },
      {
        id: 'ab-evidence',
        number: '04.',
        title: 'Evidence Required for Rapid International Investigation',
        paragraphs: [
          'To allow our engineering team to validate and neutralize incidents swiftly without false positives, please attach concrete technical proof inside the complaint portal below:',
        ],
        bullets: [
          'Exact offending URL(s), domain name, or IPv4/IPv6 address.',
          'Full UTC timestamp including timezone offset matching Your firewall or mail-server logs.',
          'Relevant excerpt of raw SMTP headers (for spam), web server logs (for brute-force/scraping), or traceroute/PCAP summaries (for network floods).',
        ],
      },
      {
        id: 'ab-repeat',
        number: '05.',
        title: 'Repeat Offender & Law Enforcement Cooperation',
        paragraphs: [
          'Repeated unresolved security compromises, ignoring abuse cure tickets beyond 24 hours, or attempting to re-register suspended malicious workloads results in permanent account bans across all cpcloudhost.com regions without refund eligibility.',
          'We cooperate fully with recognized Computer Emergency Response Teams (CERTs), NCMEC, Interpol, and duly authorized judicial authorities worldwide.',
        ],
      },
    ],
  },
};
