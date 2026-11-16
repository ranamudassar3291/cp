export interface SharedDatacenter {
  id: 'uk' | 'us' | 'sg';
  country: string;
  city: string;
  clusterLabel: string;
  latencyLabel: string;
}

export interface SharedHostingPlan {
  id: 'ignite' | 'velocity' | 'horizon';
  brandSeries: string;
  name: string;
  audience: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  recommended?: boolean;
  resources: {
    key: 'websites' | 'databases' | 'emails' | 'ssd';
    label: string;
  }[];
  features: string[];
}

export interface StackCpCoreFeature {
  id: 'migrations' | 'backup' | 'speed' | 'security' | 'cdn' | 'ddos';
  title: string;
  description: string;
}

export interface WebAppItem {
  id: string;
  name: string;
  category: 'CMS' | 'E-Commerce' | 'Community' | 'Business';
}

export interface WorldwideRegionColumn {
  region: string;
  cities: string[];
}

export const SHARED_DATACENTERS: SharedDatacenter[] = [
  {
    id: 'uk',
    country: 'United Kingdom',
    city: 'London, UK',
    clusterLabel: 'UK Edge Cluster (London Tier-III+)',
    latencyLabel: '4ms UK & EU Peering',
  },
  {
    id: 'us',
    country: 'United States',
    city: 'Dallas, Texas',
    clusterLabel: 'US Central Hub (Dallas Multi-AZ)',
    latencyLabel: '11ms North America',
  },
  {
    id: 'sg',
    country: 'Asia Pacific',
    city: 'Singapore',
    clusterLabel: 'APAC Fiber Node (Singapore)',
    latencyLabel: '12ms Asia-Pacific',
  },
];

export const SHARED_PLANS: SharedHostingPlan[] = [
  {
    id: 'ignite',
    brandSeries: 'StackCP Cloud Suite',
    name: 'Cloud Ignite',
    audience: 'For Creators & Startups',
    tagline: 'Essential NVMe cloud capacity for new launches.',
    monthlyPrice: 2.5,
    annualPrice: 30.0,
    resources: [
      { key: 'websites', label: '6 Linux Websites' },
      { key: 'databases', label: '18x Databases' },
      { key: 'emails', label: '24x Emails' },
      { key: 'ssd', label: '10GB SSD Space' },
    ],
    features: [
      'Free SSL',
      '80+ App Installer',
      'Free Malware Scanning',
      'Free Website Builder',
      '1 Tbps+ DDoS Protection',
    ],
  },
  {
    id: 'velocity',
    brandSeries: 'StackCP Cloud Suite',
    name: 'Cloud Velocity',
    audience: 'For Growing Brands',
    tagline: 'High-throughput NGINX caching for busy sites & stores.',
    monthlyPrice: 3.49,
    annualPrice: 41.88,
    recommended: true,
    resources: [
      { key: 'websites', label: '12 Linux Websites' },
      { key: 'databases', label: '36x 1GB Databases' },
      { key: 'emails', label: '48x Emails' },
      { key: 'ssd', label: '20GB SSD Space' },
    ],
    features: [
      'Free SSL',
      '80+ App Installer',
      'Free Malware Scanning',
      'Free Website Builder',
      'Free NGINX edge cache',
      '1 Tbps+ DDoS Protection',
    ],
  },
  {
    id: 'horizon',
    brandSeries: 'StackCP Cloud Suite',
    name: 'Cloud Horizon',
    audience: 'For Agencies & Studios',
    tagline: 'Unrestricted multi-site headroom for client fleets.',
    monthlyPrice: 4.49,
    annualPrice: 53.88,
    resources: [
      { key: 'websites', label: 'Unlimited Linux Websites' },
      { key: 'databases', label: 'Unlimited 1GB Databases' },
      { key: 'emails', label: 'Unlimited Emails' },
      { key: 'ssd', label: 'Unlimited SSD Space' },
    ],
    features: [
      'Free SSL',
      '80+ App Installer',
      'Free Malware Scanning',
      'Free Website Builder',
      'Free NGINX edge cache',
      '1 Tbps+ DDoS Protection',
    ],
  },
];

export const STACKCP_CORE_FEATURES: StackCpCoreFeature[] = [
  {
    id: 'migrations',
    title: 'Automated Zero-Downtime Transfers',
    description:
      'Bring existing sites into cpcloudhost.com without manual exports. Our StackCP transfer wizard moves web files, SQL databases, and mailboxes smoothly from your old host.',
  },
  {
    id: 'backup',
    title: 'Daily Timeline Snapshots & Restore',
    description:
      'Roll back individual files, directories, or entire SQL databases in a single click. Scheduled off-site recovery ensures every site update stays reversible.',
  },
  {
    id: 'speed',
    title: 'NVMe Compute & Edge Acceleration',
    description:
      'Pure enterprise NVMe storage paired with tuned Linux containers and NGINX edge caching lowers server response times from the very first request.',
  },
  {
    id: 'security',
    title: 'Hardened Developer Infrastructure',
    description:
      'Work inside isolated cloud containers equipped with SSH keys, SFTP/FTPS, WP-CLI, phpMyAdmin, cron scheduling, and instant PHP switching up to PHP 8.4.',
  },
  {
    id: 'cdn',
    title: 'Worldwide Anycast Edge Delivery',
    description:
      'Serve images, scripts, and static assets through globally distributed PoPs so international visitors consistently load pages from their closest routing hub.',
  },
  {
    id: 'ddos',
    title: 'Always-On DDoS & Firewall Scrubbing',
    description:
      'Dedicated 1 Tbps+ upstream mitigation filters malicious flood traffic automatically while keeping legitimate visitor checkouts and API requests responsive.',
  },
];

export const POPULAR_WEB_APPS: WebAppItem[] = [
  { id: 'wordpress', name: 'WordPress', category: 'CMS' },
  { id: 'moodle', name: 'Moodle', category: 'CMS' },
  { id: 'roundcube', name: 'Roundcube', category: 'Business' },
  { id: 'piwigo', name: 'Piwigo', category: 'CMS' },
  { id: 'suitecrm', name: 'SuiteCRM', category: 'Business' },
  { id: 'sugarcrm', name: 'Sugar CRM', category: 'Business' },
  { id: 'magento', name: 'Magento', category: 'E-Commerce' },
  { id: 'zencart', name: 'Zencart', category: 'E-Commerce' },
  { id: 'osticket', name: 'osTicket', category: 'Business' },
  { id: 'phpbb', name: 'phpBB', category: 'Community' },
  { id: 'phpform', name: 'PHP Form Generator', category: 'Business' },
  { id: 'abantecart', name: 'AbanteCart', category: 'E-Commerce' },
  { id: 'concrete', name: 'Concrete CMS', category: 'CMS' },
  { id: 'oscommerce', name: 'osCommerce', category: 'E-Commerce' },
  { id: 'fengoffice', name: 'Feng Office', category: 'Business' },
  { id: 'buddypress', name: 'BuddyPress', category: 'Community' },
  { id: 'formtools', name: 'Form Tools', category: 'Business' },
  { id: 'vanilla', name: 'Vanilla Forums', category: 'Community' },
];

export const EXTRA_ONE_CLICK_APPS: { group: string; apps: string[] }[] = [
  {
    group: 'CMS & Publishing',
    apps: ['Joomla', 'Drupal', 'Ghost', 'Grav CMS', 'October CMS', 'TYPO3', 'Backdrop CMS'],
  },
  {
    group: 'E-Commerce & Billing',
    apps: ['WooCommerce', 'PrestaShop', 'OpenCart', 'Invoice Ninja', 'BoxBilling'],
  },
  {
    group: 'Frameworks & Utilities',
    apps: ['Laravel', 'CodeIgniter', 'Symfony', 'Nextcloud', 'Matomo Analytics', 'LimeSurvey'],
  },
];

export const WORLDWIDE_HUB_COLUMNS: WorldwideRegionColumn[] = [
  {
    region: 'Europe',
    cities: [
      'London, UK',
      'Dublin, Ireland',
      'Paris, France',
      'Frankfurt, Germany',
      'Milan, Italy',
      'Zurich, Switzerland',
      'Stockholm, Sweden',
      'Warsaw, Poland',
      'Marseille, France',
      'Madrid, Spain',
      'Helsinki, Finland',
      'Saint-Ghislain, Belgium',
      'Netherlands',
      'Eemshaven, Netherlands',
    ],
  },
  {
    region: 'North America',
    cities: [
      'North Virginia, USA',
      'Iowa, USA',
      'Oregon, USA',
      'Ohio, USA',
      'South Carolina, USA',
      'Virginia, USA',
      'Texas, USA',
      'Dallas TX, USA',
      'Silicon Valley, USA',
      'Utah, USA',
      'Los Angeles, USA',
      'Las Vegas, USA',
      'Montreal, Quebec',
      'Toronto, Ontario',
    ],
  },
  {
    region: 'Asia & Oceania',
    cities: [
      'Mumbai, India',
      'Delhi, India',
      'Hong Kong, APAC',
      'Singapore, APAC',
      'Tokyo, Japan',
      'Osaka, Japan',
      'Seoul, South Korea',
      'Taiwan, Asia-Pacific',
      'Jakarta, Indonesia',
      'Sydney, Australia',
      'Melbourne, Australia',
    ],
  },
  {
    region: 'Middle East',
    cities: ['Bahrain, Middle East', 'Dubai, UAE', 'Doha, Qatar'],
  },
  {
    region: 'South America',
    cities: ['São Paulo, Brazil', 'Santiago, Chile'],
  },
  {
    region: 'Africa',
    cities: ['Cape Town, SA', 'Johannesburg, SA'],
  },
];
