export interface DomainWhoisDetails {
  domain: string;
  registered: boolean;
  registrar: string;
  registryId: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  statuses: string[];
  nameservers: string[];
  transferLocked: boolean;
  sixtyDayEligible: boolean;
  ageDays: number | null;
  source: 'RDAP + DNS' | 'DNS Live Lookup';
}

export interface DomainSearchResult {
  domain: string;
  tld: string;
  price: number;
  renewalPrice: number;
  available: boolean;
  minYears?: number;
  whois?: DomainWhoisDetails;
  isPrimary?: boolean;
  category: 'primary' | 'extension' | 'suggestion';
}

export const TLD_CATALOG: {
  tld: string;
  registerPrice: number;
  renewalPrice: number;
  transferPrice: number;
  description: string;
  popular?: boolean;
}[] = [
  {
    tld: '.co.uk',
    registerPrice: 6.99,
    renewalPrice: 9.99,
    transferPrice: 6.99,
    description:
      'Trusted British identity bundled with free cloud web starter, email routing, Wildcard SSL, and global CDN.',
    popular: true,
  },
  {
    tld: '.com',
    registerPrice: 9.99,
    renewalPrice: 14.99,
    transferPrice: 9.99,
    description:
      'Worldwide commercial standard backed by instant StackCP DNS, Wildcard SSL, WHOIS privacy, and edge caching.',
    popular: true,
  },
  {
    tld: '.uk',
    registerPrice: 7.99,
    renewalPrice: 10.99,
    transferPrice: 7.99,
    description:
      'Crisp, authoritative UK domain extension paired with free DNSSEC, email forwarding, and global Anycast edge.',
    popular: true,
  },
  {
    tld: '.xyz',
    registerPrice: 11.99,
    renewalPrice: 15.99,
    transferPrice: 11.99,
    description:
      'Flexible modern namespace tailored to SaaS founders, AI startups, and cross-border web applications.',
  },
  {
    tld: '.cloud',
    registerPrice: 15.99,
    renewalPrice: 21.99,
    transferPrice: 15.99,
    description:
      'Clean technology extension built for infrastructure teams, API endpoints, managed portals, and cloud projects.',
  },
  {
    tld: '.net',
    registerPrice: 11.99,
    renewalPrice: 14.99,
    transferPrice: 11.99,
    description:
      'Veteran networking extension delivering rock-solid credibility plus free SSL, DNS records, and starter hosting.',
  },
  {
    tld: '.org',
    registerPrice: 10.99,
    renewalPrice: 14.99,
    transferPrice: 10.99,
    description:
      'Community, foundation, and open-source namespace with full StackCP DNS zones and free TLS encryption.',
  },
  {
    tld: '.io',
    registerPrice: 34.99,
    renewalPrice: 44.99,
    transferPrice: 34.99,
    description:
      'Premier engineering and developer product extension featuring Anycast DNS routing and instant setup.',
  },
  {
    tld: '.ai',
    registerPrice: 69.99,
    renewalPrice: 79.99,
    transferPrice: 69.99,
    description:
      'Category-defining extension for machine learning platforms, automation workflows, and intelligent apps.',
  },
  {
    tld: '.dev',
    registerPrice: 13.99,
    renewalPrice: 16.99,
    transferPrice: 13.99,
    description:
      'HTTPS-enforced developer namespace engineered for software docs, open SDKs, and portfolios.',
  },
];

export function normalizeDomainInput(raw: string): {
  cleanDomain: string;
  baseLabel: string;
  tld: string;
} {
  let cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .replace(/[^a-z0-9.-]/g, '');

  if (!cleaned) {
    return { cleanDomain: '', baseLabel: '', tld: '.com' };
  }

  // Handle multi-part known ccTLDs like .co.uk
  if (cleaned.endsWith('.co.uk')) {
    const base = cleaned.slice(0, -6).replace(/\./g, '') || 'mybrand';
    return { cleanDomain: `${base}.co.uk`, baseLabel: base, tld: '.co.uk' };
  }

  const parts = cleaned.split('.').filter(Boolean);
  if (parts.length === 1) {
    const base = parts[0].replace(/[^a-z0-9-]/g, '');
    return { cleanDomain: `${base}.com`, baseLabel: base, tld: '.com' };
  }

  const ext = `.${parts[parts.length - 1]}`;
  const base = parts.slice(0, -1).join('-').replace(/[^a-z0-9-]/g, '') || parts[0];
  return { cleanDomain: `${base}${ext}`, baseLabel: base, tld: ext };
}

export function getPricingForTld(tld: string): {
  registerPrice: number;
  renewalPrice: number;
  transferPrice: number;
} {
  const found = TLD_CATALOG.find((item) => item.tld === tld);
  if (found) {
    return {
      registerPrice: found.registerPrice,
      renewalPrice: found.renewalPrice,
      transferPrice: found.transferPrice,
    };
  }
  return {
    registerPrice: 14.99,
    renewalPrice: 18.99,
    transferPrice: 14.99,
  };
}

function formatDateReadable(iso?: string): string {
  if (!iso) return 'Not disclosed by registry';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function parseRegistrarName(rdapData: Record<string, unknown>): string {
  const entities = rdapData.entities as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(entities)) return 'Accredited ICANN Registrar';

  for (const entity of entities) {
    const roles = entity.roles as string[] | undefined;
    if (roles?.includes('registrar')) {
      const vcard = entity.vcardArray as unknown[] | undefined;
      if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
        for (const prop of vcard[1] as unknown[][]) {
          if (Array.isArray(prop) && prop[0] === 'fn' && typeof prop[3] === 'string') {
            return prop[3];
          }
        }
      }
      if (typeof entity.handle === 'string') return `Registrar ID #${entity.handle}`;
    }
  }
  return 'Accredited Registry Registrar';
}

export async function inspectDomainLive(
  domain: string,
  fetchFullWhois = false
): Promise<{ available: boolean; whois?: DomainWhoisDetails }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);

  try {
    const [dnsNsRes, rdapRes] = await Promise.allSettled([
      fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`,
        { signal: controller.signal }
      ),
      fetchFullWhois ||
      domain.endsWith('.com') ||
      domain.endsWith('.net') ||
      domain.endsWith('.org') ||
      domain.endsWith('.io') ||
      domain.endsWith('.xyz') ||
      domain.endsWith('.cloud') ||
      domain.endsWith('.dev') ||
      domain.endsWith('.ai')
        ? fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
            signal: controller.signal,
            headers: { Accept: 'application/rdap+json, application/json' },
          })
        : Promise.reject(new Error('Skip RDAP for quick check')),
    ]);

    let dnsRegistered = false;
    let dnsNameservers: string[] = [];

    if (dnsNsRes.status === 'fulfilled' && dnsNsRes.value.ok) {
      const dnsJson = (await dnsNsRes.value.json()) as {
        Status?: number;
        Answer?: Array<{ data?: string }>;
        Authority?: Array<{ type?: number; data?: string }>;
      };

      if (dnsJson.Status === 0 && Array.isArray(dnsJson.Answer) && dnsJson.Answer.length > 0) {
        dnsRegistered = true;
        dnsNameservers = dnsJson.Answer.map((a) =>
          (a.data || '').replace(/\.$/, '').toLowerCase()
        ).filter(Boolean);
      } else if (
        dnsJson.Status === 0 &&
        Array.isArray(dnsJson.Authority) &&
        dnsJson.Authority.some((a) => a.type === 2)
      ) {
        dnsRegistered = true;
      } else if (dnsJson.Status === 3) {
        // NXDOMAIN returned from DNS; verify with RDAP if registered without active DNS
        dnsRegistered = false;
      }
    }

    if (rdapRes.status === 'fulfilled') {
      if (rdapRes.value.status === 200) {
        const rdapJson = (await rdapRes.value.json()) as Record<string, unknown>;
        const events = (rdapJson.events as Array<{ eventAction?: string; eventDate?: string }>) || [];
        const regEvent = events.find((e) => e.eventAction === 'registration');
        const expEvent = events.find((e) => e.eventAction === 'expiration');
        const updEvent = events.find((e) => e.eventAction === 'last changed');

        const statuses = Array.isArray(rdapJson.status)
          ? (rdapJson.status as string[])
          : ['active'];

        const rdapNameservers = Array.isArray(rdapJson.nameservers)
          ? (rdapJson.nameservers as Array<{ ldhName?: string }>)
              .map((ns) => (ns.ldhName || '').toLowerCase())
              .filter(Boolean)
          : [];

        const createdDateObj = regEvent?.eventDate ? new Date(regEvent.eventDate) : null;
        const ageDays =
          createdDateObj && !Number.isNaN(createdDateObj.getTime())
            ? Math.floor((Date.now() - createdDateObj.getTime()) / (1000 * 60 * 60 * 24))
            : null;

        const transferLocked = statuses.some((s) =>
          s.toLowerCase().includes('transferprohibited')
        );

        return {
          available: false,
          whois: {
            domain,
            registered: true,
            registrar: parseRegistrarName(rdapJson),
            registryId: typeof rdapJson.handle === 'string' ? rdapJson.handle : 'N/A',
            createdAt: formatDateReadable(regEvent?.eventDate),
            expiresAt: formatDateReadable(expEvent?.eventDate),
            updatedAt: formatDateReadable(updEvent?.eventDate),
            statuses,
            nameservers: rdapNameservers.length > 0 ? rdapNameservers : dnsNameservers,
            transferLocked,
            sixtyDayEligible: ageDays === null ? true : ageDays >= 60,
            ageDays,
            source: 'RDAP + DNS',
          },
        };
      }

      if (rdapRes.value.status === 404 && !dnsRegistered) {
        return { available: true };
      }
    }

    if (dnsRegistered) {
      return {
        available: false,
        whois: {
          domain,
          registered: true,
          registrar: 'Active Registry Domain (WHOIS Protected)',
          registryId: 'Live DNS Delegated',
          createdAt: 'Verified active in global DNS root',
          expiresAt: 'Active registration cycle',
          updatedAt: 'Active DNS records present',
          statuses: ['active', 'dnsDelegated'],
          nameservers: dnsNameservers,
          transferLocked: false,
          sixtyDayEligible: true,
          ageDays: null,
          source: 'DNS Live Lookup',
        },
      };
    }

    // Fallback check on A record for parked domains without direct NS answer
    const aRes = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
      { signal: controller.signal }
    );
    if (aRes.ok) {
      const aJson = (await aRes.json()) as { Answer?: unknown[] };
      if (Array.isArray(aJson.Answer) && aJson.Answer.length > 0) {
        return {
          available: false,
          whois: {
            domain,
            registered: true,
            registrar: 'Active Registry Domain',
            registryId: 'DNS A Record Active',
            createdAt: 'Registered',
            expiresAt: 'Active registration',
            updatedAt: 'Active',
            statuses: ['active'],
            nameservers: dnsNameservers,
            transferLocked: false,
            sixtyDayEligible: true,
            ageDays: null,
            source: 'DNS Live Lookup',
          },
        };
      }
    }

    return { available: true };
  } catch {
    return { available: true };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runFullDomainSearch(rawQuery: string): Promise<{
  primary: DomainSearchResult;
  extensions: DomainSearchResult[];
  suggestions: DomainSearchResult[];
}> {
  const { cleanDomain, baseLabel, tld } = normalizeDomainInput(rawQuery);
  const primaryDomain = cleanDomain || 'mybrand.com';
  const cleanSlug = baseLabel || 'mybrand';

  const extensionTlds = ['.com', '.co.uk', '.uk', '.net', '.io', '.cloud', '.xyz', '.org']
    .filter((ext) => ext !== tld)
    .slice(0, 5);

  const brandIdeas = [
    `get${cleanSlug}.com`,
    `${cleanSlug}hq.com`,
    `${cleanSlug}cloud.com`,
    `try${cleanSlug}.io`,
  ];

  const primaryPricing = getPricingForTld(tld);

  const [primaryCheck, extChecks, ideaChecks] = await Promise.all([
    inspectDomainLive(primaryDomain, true),
    Promise.all(
      extensionTlds.map(async (ext) => {
        const d = `${cleanSlug}${ext}`;
        const res = await inspectDomainLive(d, false);
        const p = getPricingForTld(ext);
        return {
          domain: d,
          tld: ext,
          price: p.registerPrice,
          renewalPrice: p.renewalPrice,
          available: res.available,
          whois: res.whois,
          category: 'extension' as const,
        };
      })
    ),
    Promise.all(
      brandIdeas.map(async (ideaDomain) => {
        const ext = ideaDomain.endsWith('.io') ? '.io' : '.com';
        const res = await inspectDomainLive(ideaDomain, false);
        const p = getPricingForTld(ext);
        return {
          domain: ideaDomain,
          tld: ext,
          price: p.registerPrice,
          renewalPrice: p.renewalPrice,
          available: res.available,
          whois: res.whois,
          category: 'suggestion' as const,
        };
      })
    ),
  ]);

  return {
    primary: {
      domain: primaryDomain,
      tld,
      price: primaryPricing.registerPrice,
      renewalPrice: primaryPricing.renewalPrice,
      available: primaryCheck.available,
      whois: primaryCheck.whois,
      isPrimary: true,
      category: 'primary',
    },
    extensions: extChecks,
    suggestions: ideaChecks,
  };
}
