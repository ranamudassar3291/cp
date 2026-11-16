export type KbCategoryId =
  | 'errors'
  | 'domains'
  | 'hosting'
  | 'vps'
  | 'email-ssl';

export interface KbCategory {
  id: KbCategoryId;
  label: string;
  shortDesc: string;
}

export interface KbCodeBlock {
  language: string;
  filename?: string;
  code: string;
}

export interface KbStep {
  stepTitle: string;
  explanation: string;
  clientShortcut?: string;
  codeSnippet?: KbCodeBlock;
}

export interface KbFaqItem {
  question: string;
  answer: string;
}

export interface KbArticle {
  slug: string;
  categoryId: KbCategoryId;
  categoryLabel: string;
  title: string;
  seoDescription: string;
  keywords: string[];
  readTime: string;
  updatedDate: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  appliesTo: string;
  featured?: boolean;
  summary: string;
  plainLanguageSummary?: string;
  rootCauses: string[];
  steps: KbStep[];
  verificationChecklist: string[];
  faqItems: KbFaqItem[];
}

export const KB_CATEGORIES: KbCategory[] = [
  {
    id: 'errors',
    label: 'Errors & Fixes',
    shortDesc: 'Resolve 502, 500, 403, database connection, and SSL protocol failures fast.',
  },
  {
    id: 'domains',
    label: 'Domains & DNS',
    shortDesc: 'Nameservers, A/CNAME/TXT DNS zones, registrar locks, and EPP transfers.',
  },
  {
    id: 'hosting',
    label: 'Web Hosting & WordPress',
    shortDesc: 'PHP workers, OPcache, LiteSpeed/StackCache tuning, and .htaccess rules.',
  },
  {
    id: 'vps',
    label: 'VPS & n8n Automation',
    shortDesc: 'SSH key hardening, UFW firewall, Dockerized n8n webhooks, and swap setup.',
  },
  {
    id: 'email-ssl',
    label: 'Email, SSL & Migrations',
    shortDesc: 'SPF/DKIM/DMARC deliverability, AutoSSL renewal, and hosts-file migrations.',
  },
];

export const KB_ARTICLES: KbArticle[] = [
  {
    slug: 'fix-502-bad-gateway-nginx-php-fpm',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix 502 Bad Gateway Errors on Nginx, PHP-FPM & Cloud Nodes',
    seoDescription:
      'Step-by-step guide to diagnose and fix 502 Bad Gateway HTTP errors across Nginx reverse proxies, PHP-FPM pools, and upstream app containers on cpcloudhost.com.',
    keywords: [
      '502 Bad Gateway fix',
      'Nginx upstream timeout',
      'PHP-FPM socket error',
      'upstream prematurely closed connection',
      'cloud hosting 502 error',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-10',
    difficulty: 'Intermediate',
    appliesTo: 'Shared Cloud, VPS & n8n Nodes',
    featured: true,
    summary:
      'A 502 Bad Gateway response occurs when your edge proxy receives an invalid or terminated response from an upstream backend such as PHP-FPM, Node.js, or Docker. Pinpointing whether the socket crashed, hit memory limits, or timed out resolves the outage within minutes.',
    rootCauses: [
      'PHP-FPM worker pool exhausted (`pm.max_children` reached during traffic spikes)',
      'Mismatch between Nginx `fastcgi_pass` socket path and actual PHP-FPM listen socket',
      'Upstream backend container (Node.js, Python, or n8n) stopped listening on its target port',
      'FastCGI / Proxy response headers exceeded Nginx buffer sizes during large cookie/JWT payloads',
    ],
    steps: [
      {
        stepTitle: 'Inspect live Nginx error logs for the exact upstream failure',
        explanation:
          'Check the most recent upstream errors rather than guessing. Look for "connect() failed (111: Connection refused)" or "upstream prematurely closed connection".',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'sudo tail -n 60 /var/log/nginx/error.log | grep -E "upstream|connect\\(\\)|recv\\(\\)"',
        },
      },
      {
        stepTitle: 'Verify PHP-FPM or application service status',
        explanation:
          'Confirm that the backend process manager is active and listening on its expected Unix socket or localhost TCP port.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'sudo systemctl status php8.3-fpm --no-pager\nss -tulpn | grep -E "9000|5678|3000"',
        },
      },
      {
        stepTitle: 'Increase upstream buffer and timeout directives safely',
        explanation:
          'If authenticated headers or heavy WordPress/WooCommerce queries trigger buffer overflows, expand FastCGI/Proxy buffers inside your server block and reload Nginx.',
        codeSnippet: {
          language: 'nginx',
          filename: '/etc/nginx/conf.d/upstream-tuning.conf',
          code: `proxy_buffer_size          128k;
proxy_buffers              4 256k;
proxy_busy_buffers_size    256k;
proxy_read_timeout         180s;

fastcgi_buffers            16 16k;
fastcgi_buffer_size        32k;
fastcgi_read_timeout       180s;`,
        },
      },
      {
        stepTitle: 'Test configuration syntax and perform a zero-drop reload',
        explanation:
          'Always validate Nginx syntax before reloading so active connections are never interrupted.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'sudo nginx -t && sudo systemctl reload nginx',
        },
      },
    ],
    verificationChecklist: [
      'Running `curl -I https://yourdomain.com` returns `HTTP/2 200` (or expected redirect).',
      'New entries stop appearing in `/var/log/nginx/error.log` for 5 consecutive minutes.',
      'PHP-FPM pool shows available idle workers with `pm.status_path` or `systemctl status`.',
    ],
    faqItems: [
      {
        question: 'Why does a 502 error appear only in wp-admin or checkout pages?',
        answer:
          'Admin and checkout routes bypass page caching and trigger larger cookies plus uncached PHP queries, frequently hitting either `fastcgi_buffer_size` limits or PHP worker timeouts first.',
      },
      {
        question: 'Can CDN caching cause stale 502 pages after I fix the backend?',
        answer:
          'Yes. If a downstream cache stored an error response briefly, purge your StackCache / Edge CDN cache immediately after restarting the upstream service.',
      },
    ],
  },
  {
    slug: 'fix-wordpress-error-establishing-database-connection',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Resolve WordPress "Error Establishing a Database Connection"',
    seoDescription:
      'Fix WordPress Error Establishing a Database Connection on cpcloudhost.com by verifying wp-config.php credentials, MariaDB/MySQL hostnames, and corrupt tables.',
    keywords: [
      'Error establishing a database connection',
      'WordPress database fix',
      'wp-config.php DB_HOST',
      'MySQL repair WordPress',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-09',
    difficulty: 'Beginner',
    appliesTo: 'Shared Hosting, Managed WordPress & cPanel',
    featured: true,
    summary:
      'When WordPress cannot authenticate or reach its MariaDB/MySQL server, visitors see a plain "Error establishing a database connection" notice. Most incidents stem from rotated database passwords, wrong `DB_HOST` socket names after migration, or crashed InnoDB/MyISAM tables.',
    rootCauses: [
      'Mismatched `DB_NAME`, `DB_USER`, or `DB_PASSWORD` inside `wp-config.php`',
      'Outdated `DB_HOST` string (`localhost` vs dedicated cluster endpoint hostname)',
      'MariaDB service stopped on a self-managed VPS due to out-of-memory kill (OOM)',
      'Corrupted WordPress options or user meta table following an interrupted update',
    ],
    steps: [
      {
        stepTitle: 'Compare wp-config.php constants against your control panel database',
        explanation:
          'Open File Manager or SSH and inspect the four database constants in `public_html/wp-config.php`. Confirm exact spelling and trailing spaces.',
        codeSnippet: {
          language: 'php',
          filename: 'wp-config.php',
          code: `define( 'DB_NAME',     'cpch_wp_production' );
define( 'DB_USER',     'cpch_wp_user' );
define( 'DB_PASSWORD', 'YourStrongGeneratedPassword!' );
define( 'DB_HOST',     'localhost' ); // Use cluster host if StackCP MySQL is external`,
        },
      },
      {
        stepTitle: 'Test direct database authentication using WP-CLI or mysql client',
        explanation:
          'Run a non-destructive read check via WP-CLI or MariaDB CLI to confirm whether credentials succeed independently of PHP plugins.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'wp db check --path=/var/www/html\n# Or check service health on VPS:\nsudo systemctl status mariadb --no-pager',
        },
      },
      {
        stepTitle: 'Run safe table repair when wp-admin reports corrupted tables',
        explanation:
          'If the front end fails or wp-admin suggests database repair, temporarily add `WP_ALLOW_REPAIR` or run WP-CLI repair, then remove the line immediately afterward.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'wp db repair --path=/var/www/html',
        },
      },
    ],
    verificationChecklist: [
      '`wp db check` reports `Success: Database checked` with zero corrupted tables.',
      'Both frontend URLs and `/wp-admin/` load cleanly without database warnings.',
      'Temporary `WP_ALLOW_REPAIR` constant (if added) is removed from `wp-config.php`.',
    ],
    faqItems: [
      {
        question: 'Should DB_HOST always be localhost on cpcloudhost.com?',
        answer:
          'On cPanel and single-node VPS servers, `localhost` works directly via Unix socket. On autoscaling StackCP clusters, use the exact MySQL server hostname listed under Manage Databases.',
      },
      {
        question: 'Will repairing database tables delete posts or WooCommerce orders?',
        answer:
          'No. Standard `REPAIR TABLE` operations rebuild indexes and recover consistent rows without wiping published posts or order records.',
      },
    ],
  },
  {
    slug: 'fix-err-ssl-protocol-error-and-mixed-content',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix ERR_SSL_PROTOCOL_ERROR & HTTPS Mixed Content Warnings',
    seoDescription:
      'Eliminate ERR_SSL_PROTOCOL_ERROR, certificate mismatch, and HTTPS mixed-content browser blocks with Free Wildcard SSL and clean redirect rules.',
    keywords: [
      'ERR_SSL_PROTOCOL_ERROR fix',
      'SSL certificate mismatch',
      'HTTPS mixed content WordPress',
      'AutoSSL renewal failed',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-08',
    difficulty: 'Beginner',
    appliesTo: 'All Hosting Plans & Domains',
    featured: true,
    summary:
      'Browsers display `ERR_SSL_PROTOCOL_ERROR` or padlock warnings when TLS negotiation fails, a domain still points to an unprovisioned IP, or hardcoded `http://` assets load inside an `https://` document. Synchronizing DNS A records with TLS certificates eliminates both.',
    rootCauses: [
      'Domain A or AAAA record recently changed and HTTPS SSL issuance has not yet validated',
      'IPv6 `AAAA` record points to a legacy host while IPv4 `A` record points to cpcloudhost.com',
      'TLS listener missing on port `443` inside Nginx/Apache virtual host configuration',
      'Database URLs or stylesheet assets still reference `http://` instead of `https://`',
    ],
    steps: [
      {
        stepTitle: 'Verify DNS A and AAAA records point to the exact origin IP',
        explanation:
          'Certificate authorities fail HTTP-01 validation if an old IPv6 AAAA record hijacks traffic. Confirm both A and AAAA match your server.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'dig +short A yourdomain.com\ndig +short AAAA yourdomain.com',
        },
      },
      {
        stepTitle: 'Inspect live TLS handshake and certificate chain via OpenSSL',
        explanation:
          'Check which certificate subject and issuer are being served on port 443 right now.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'openssl s_client -connect yourdomain.com:443 -servername yourdomain.com </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates',
        },
      },
      {
        stepTitle: 'Enforce single-hop HTTPS redirect and replace http:// asset URLs',
        explanation:
          'Use clean `.htaccess` rules on Apache/LiteSpeed without double-redirect loops, and run WP-CLI search-replace for mixed-content images.',
        codeSnippet: {
          language: 'apacheconf',
          filename: '.htaccess',
          code: `RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
        },
      },
    ],
    verificationChecklist: [
      '`openssl s_client` shows a valid non-expired Let’s Encrypt or Wildcard SSL certificate.',
      'No yellow mixed-content warnings appear in browser DevTools Console.',
      'Redirect checker confirms a single `301` hop from `http://` to `https://`.',
    ],
    faqItems: [
      {
        question: 'Why does AutoSSL fail when Cloudflare proxy is orange-clouded?',
        answer:
          'Full (Strict) mode works once an origin certificate is present, or temporarily pause proxy (DNS Only) for 3 minutes during initial Free Wildcard SSL issuance.',
      },
    ],
  },
  {
    slug: 'fix-500-internal-server-error-and-htaccess',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Troubleshoot 500 Internal Server Error, .htaccess & PHP Fatal Crashes',
    seoDescription:
      'Diagnose and resolve 500 Internal Server Errors caused by broken .htaccess directives, incompatible PHP versions, or plugin memory exhaustion.',
    keywords: [
      '500 Internal Server Error',
      '.htaccess syntax fix',
      'PHP fatal error debug',
      'WordPress white screen fix',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-06',
    difficulty: 'Beginner',
    appliesTo: 'Shared Hosting, WordPress & cPanel',
    summary:
      'An HTTP 500 Internal Server Error signals an unhandled server exception—most often malformed `.htaccess` rules, a PHP runtime version mismatch with an outdated plugin, or exhausted `memory_limit`. Enabling structured logging exposes the failing line immediately.',
    rootCauses: [
      'Invalid rewrite flag or unsupported directive inside `.htaccess`',
      'Theme or plugin calling deprecated PHP 7.x functions under PHP 8.2/8.3',
      'Incorrect directory (`755`) or file (`644`) ownership/permissions',
      'Exhausted PHP `memory_limit` (`64M` or `128M` default on heavy stores)',
    ],
    steps: [
      {
        stepTitle: 'Temporarily test a clean .htaccess rewrite block',
        explanation:
          'Rename your existing `.htaccess` to `.htaccess.bak` and restore the minimal standard WordPress/Apache rewrite rules to isolate rewrite syntax errors.',
        codeSnippet: {
          language: 'apacheconf',
          filename: '.htaccess',
          code: `# Standard Clean Rewrite Block
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>`,
        },
      },
      {
        stepTitle: 'Log PHP fatal errors silently to debug.log (without exposing publicly)',
        explanation:
          'Keep `WP_DEBUG_DISPLAY` set to `false` on production sites while logging fatal stack traces safely to `wp-content/debug.log`.',
        codeSnippet: {
          language: 'php',
          filename: 'wp-config.php',
          code: `define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );`,
        },
      },
      {
        stepTitle: 'Isolate faulty plugins or revert PHP version via StackCP / cPanel',
        explanation:
          'Rename the suspected plugin folder via SSH/File Manager (`plugins/suspected-plugin` -> `plugins/suspected-plugin.disabled`) or switch PHP version cleanly in your control panel.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'wp plugin status --path=/var/www/html\ntail -n 40 /var/www/html/wp-content/debug.log',
        },
      },
    ],
    verificationChecklist: [
      'Site renders HTTP 200 without blank white screens.',
      '`WP_DEBUG` and `WP_DEBUG_LOG` turned back off after tracing is complete.',
      'Standard permissions enforced: `755` for directories, `644` for files.',
    ],
    faqItems: [
      {
        question: 'What PHP version should I run for modern WordPress sites?',
        answer:
          'PHP 8.2 or 8.3 delivers the highest throughput and active security patches. Always update all plugins before switching upward from PHP 7.4 or 8.0.',
      },
    ],
  },
  {
    slug: 'fix-403-forbidden-permissions-and-waf-rules',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix 403 Forbidden Errors: File Permissions, Index Files & WAF Blocks',
    seoDescription:
      'Clear 403 Forbidden access denied responses by correcting Unix permissions (755/644), missing index.php/index.html files, and ModSecurity false positives.',
    keywords: [
      '403 Forbidden fix',
      'file permissions 755 644',
      'directory index forbidden',
      'ModSecurity 403 fix',
    ],
    readTime: '4 min read',
    updatedDate: '2026-11-05',
    difficulty: 'Beginner',
    appliesTo: 'Shared, cPanel, Windows IIS & VPS',
    summary:
      'HTTP 403 Forbidden means the server understood the request but refused authorization. Common culprits are missing `index.php`/`index.html` files with directory indexing disabled, overly restrictive `000`/`600` file modes, or IP/WAF security blocks.',
    rootCauses: [
      'Document root lacks `index.php` or `index.html` while `Options -Indexes` is enabled',
      'Uploaded files received `600` or directories received `644` permissions during SFTP extract',
      'Corrupted `.htaccess` `Deny from all` / `Require all denied` rule blocking visitors',
    ],
    steps: [
      {
        stepTitle: 'Normalize directory and file permissions safely',
        explanation:
          'Web servers require execute bit (`+x`, i.e., `755`) on directories to traverse paths, and `644` on PHP/HTML assets.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'find /var/www/html -type d -exec chmod 755 {} +\nfind /var/www/html -type f -exec chmod 644 {} +',
        },
      },
      {
        stepTitle: 'Confirm index entry file and VirtualHost DocumentRoot',
        explanation:
          'Ensure `public_html` (or your VirtualHost root) actually holds `index.php` or `index.html` with matching casing on Linux filesystems.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'ls -la /var/www/html | grep -E "index\\.php|index\\.html|\\.htaccess"',
        },
      },
    ],
    verificationChecklist: [
      'Root path serves `200 OK` without exposing raw directory listings.',
      'Directories show `drwxr-xr-x (0755)` and files show `-rw-r--r-- (0644)`.',
    ],
    faqItems: [
      {
        question: 'Is chmod 777 ever safe to fix a 403 error?',
        answer:
          'Never use `777` on shared or VPS web roots—it exposes writable files to arbitrary execution and often triggers suPHP/ModSecurity to deliberately throw 500 or 403 blocks.',
      },
    ],
  },
  {
    slug: 'configure-nameservers-dns-a-cname-txt-records',
    categoryId: 'domains',
    categoryLabel: 'Domains & DNS',
    title: 'Configure Anycast Nameservers & DNS Records (A, CNAME, MX, TXT)',
    seoDescription:
      'Complete DNS zone setup guide on cpcloudhost.com covering Anycast nameservers, A/AAAA IPv4/IPv6 mapping, CNAME aliases, and TXT domain verification.',
    keywords: [
      'nameservers configuration',
      'DNS A record setup',
      'CNAME www redirect',
      'DNS propagation check',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-11',
    difficulty: 'Beginner',
    appliesTo: 'Domains & Anycast DNS',
    summary:
      'Clean DNS routing ensures visitors reach your origin cloud server at ultra-low latency while email, SSL verification, and subdomains resolve reliably worldwide. Follow this blueprint to point domains to cpcloudhost.com without breaking active mail.',
    rootCauses: [
      'Domain still points to previous registrar nameservers after migration',
      'Root apex `@` uses CNAME instead of valid A/ALIAS record',
      'Conflicting duplicate `A` records causing intermittent half-working traffic',
    ],
    steps: [
      {
        stepTitle: 'Point your domain registrar to cpcloudhost.com Anycast nameservers',
        explanation:
          'Update nameservers inside your domain control panel (or existing registrar) to our resilient global pair.',
        codeSnippet: {
          language: 'dns',
          filename: 'Nameserver Pair',
          code: `ns1.cpcloudhost.com
ns2.cpcloudhost.com
ns3.cpcloudhost.com
ns4.cpcloudhost.com`,
        },
      },
      {
        stepTitle: 'Verify core A, CNAME, and CAA zone entries',
        explanation:
          'Ensure only ONE authoritative `A` record exists for `@` pointing to your hosting node IP, with `www` aliased via CNAME.',
        codeSnippet: {
          language: 'dns',
          filename: 'DNS Zone Example',
          code: `@       300   IN  A      203.0.113.45
www     300   IN  CNAME  yourdomain.com.
@       3600  IN  CAA    0 issue "letsencrypt.org"`,
        },
      },
      {
        stepTitle: 'Flush local DNS cache and confirm global resolution',
        explanation:
          'Query an external recursive resolver (`1.1.1.1` or `8.8.8.8`) to bypass ISP cache lag during cutovers.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'dig @1.1.1.1 +short A yourdomain.com\ndig @8.8.8.8 +short NS yourdomain.com',
        },
      },
    ],
    verificationChecklist: [
      'External `dig @1.1.1.1 NS` returns your configured nameservers cleanly.',
      'Only a single IPv4 `A` record answers for `@` (no stale legacy IPs left behind).',
    ],
    faqItems: [
      {
        question: 'How long does DNS propagation really take?',
        answer:
          'Lowering TTL to `300` seconds 24 hours before switching ensures most resolvers pick up changes within 5–15 minutes, while full root-NS switches propagate globally within 2–24 hours.',
      },
    ],
  },
  {
    slug: 'domain-transfer-epp-unlock-checklist',
    categoryId: 'domains',
    categoryLabel: 'Domains & DNS',
    title: 'Zero-Downtime Domain Transfer Checklist: Registrar Lock & EPP Code',
    seoDescription:
      'Prepare any domain for an uninterrupted registrar transfer to cpcloudhost.com: unlock clientTransferProhibited, obtain EPP auth codes, and preserve live DNS.',
    keywords: [
      'domain transfer checklist',
      'EPP authorization code',
      'clientTransferProhibited unlock',
      'zero downtime domain transfer',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-11',
    difficulty: 'Beginner',
    appliesTo: 'Domain Transfers',
    summary:
      'Moving a domain between registrars does not interrupt your live website or email as long as you replicate DNS records first and clear ICANN’s transfer locks cleanly. Most failed transfers are caused by an active registrar lock or a 60-day WHOIS cooldown.',
    rootCauses: [
      'Domain status contains `clientTransferProhibited` lock at the outgoing registrar',
      'ICANN 60-day lock active following initial registration or recent registrant change',
      'Domain nameservers were reset instead of preserving existing active DNS zones',
    ],
    steps: [
      {
        stepTitle: 'Run live transfer eligibility & lock check before submitting',
        explanation:
          'Inspect RDAP status flags to verify the domain is unlocked (`ok` or missing `clientTransferProhibited`) and past the 60-day ICANN window.',
        codeSnippet: {
          language: 'bash',
          filename: 'WHOIS / RDAP Check',
          code: 'whois yourdomain.com | grep -iE "Registrar:|Domain Status:|Creation Date:"',
        },
      },
      {
        stepTitle: 'Disable Registrar Lock and request your EPP / Auth Code',
        explanation:
          'Inside your current registrar dashboard, turn off Transfer Lock (`clientTransferProhibited`), disable WHOIS privacy temporarily ONLY if required by that specific registrar for email verification, and copy the case-sensitive EPP string.',
      },
      {
        stepTitle: 'Choose "Keep Current Nameservers" during cutover',
        explanation:
          'Maintaining your existing DNS host throughout the 5-to-7 day registry transfer guarantees zero email bounces or website downtime. Every qualifying transfer adds +1 full year to your current expiry.',
      },
    ],
    verificationChecklist: [
      'Registrar status is unlocked and EPP Auth Code copied without trailing spaces.',
      'Pre-existing MX, A, and TXT records backed up or mirrored inside cpcloudhost.com DNS.',
      'Approval link clicked in FOA confirmation email (or fast-tracked at outgoing registrar).',
    ],
    faqItems: [
      {
        question: 'Will I lose remaining months when transferring my domain early?',
        answer:
          'No. ICANN adds 12 months on top of your existing expiration date (up to the maximum 10-year registry cap).',
      },
    ],
  },
  {
    slug: 'optimize-wordpress-litespeed-stackcache-php-workers',
    categoryId: 'hosting',
    categoryLabel: 'Web Hosting & WordPress',
    title: 'Boost WordPress Speed: StackCache, Redis Object Cache & PHP Memory',
    seoDescription:
      'Tune WordPress Time-to-First-Byte under 200ms using edge StackCache page caching, Redis object caching, and optimal PHP memory limits.',
    keywords: [
      'WordPress speed optimization',
      'Redis object cache WordPress',
      'PHP memory_limit wp-config',
      'reduce TTFB WordPress',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-07',
    difficulty: 'Intermediate',
    appliesTo: 'Shared Hosting & Managed WordPress',
    summary:
      'Heavy database queries and uncached PHP execution slow WooCommerce checkouts and editorial blogs alike. Pairing full-page edge caching with persistent Redis object caching and proper PHP limits slashes Time-to-First-Byte (TTFB) dramatically.',
    rootCauses: [
      'Every visitor hitting PHP workers instead of serving edge-cached static HTML',
      'WooCommerce cart/session queries hammering MariaDB without Redis object caching',
      'Default WordPress `WP_MEMORY_LIMIT` capped at 40MB inside `wp-config.php`',
    ],
    steps: [
      {
        stepTitle: 'Raise WP_MEMORY_LIMIT for modern builders and WooCommerce',
        explanation:
          'Add memory limits right above the `That’s all, stop editing!` line in `wp-config.php` to prevent worker stalls.',
        codeSnippet: {
          language: 'php',
          filename: 'wp-config.php',
          code: `define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );`,
        },
      },
      {
        stepTitle: 'Offload wp-cron.php to real system cron jobs',
        explanation:
          'Disable visitor-triggered `wp-cron.php` so page loads stay fast, then schedule a clean cron run every 15 minutes.',
        codeSnippet: {
          language: 'php',
          filename: 'wp-config.php + Cron',
          code: `// In wp-config.php:
define( 'DISABLE_WP_CRON', true );

// System Cron (runs every 15 mins):
// */15 * * * * wp cron event run --due-now --path=/var/www/html >/dev/null 2>&1`,
        },
      },
      {
        stepTitle: 'Verify cache HIT headers via curl',
        explanation:
          'Confirm anonymous requests serve directly from cache (`HIT`) with sub-200ms TTFB.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'curl -s -o /dev/null -D - https://yourdomain.com | grep -iE "cache|x-litespeed|x-stackcache|http/"',
        },
      },
    ],
    verificationChecklist: [
      'Anonymous homepage fetches show `Cache: HIT` status.',
      'WooCommerce `/cart/`, `/checkout/`, and `/my-account/` stay excluded from static cache.',
      'System cron executes scheduled emails and WooCommerce hooks cleanly.',
    ],
    faqItems: [
      {
        question: 'Should I run two different page-cache plugins together?',
        answer:
          'No. Running two full-page caching plugins simultaneously creates stale HTML conflicts and broken minification. Use one edge cache layer paired with Redis object caching.',
      },
    ],
  },
  {
    slug: 'harden-ubuntu-vps-ssh-keys-ufw-fail2ban',
    categoryId: 'vps',
    categoryLabel: 'VPS & n8n Automation',
    title: 'Harden Your Unmanaged KVM VPS: SSH Keys, UFW Firewall & Fail2Ban',
    seoDescription:
      'Essential first-boot security hardening for Ubuntu/Debian KVM VPS instances: configure Ed25519 SSH keys, UFW firewall rules, and Fail2Ban brute-force blocking.',
    keywords: [
      'VPS security hardening',
      'Ubuntu SSH key setup',
      'UFW firewall rules VPS',
      'Fail2Ban Linux server',
    ],
    readTime: '7 min read',
    updatedDate: '2026-11-10',
    difficulty: 'Intermediate',
    appliesTo: 'Unmanaged VPS & n8n Cloud',
    summary:
      'Freshly provisioned Linux VPS servers receive automated SSH brute-force probes within minutes of going online. Implementing Ed25519 key authentication, disabling password logins, and locking inbound ports with UFW protects your workloads immediately.',
    rootCauses: [
      'Default password-based SSH authentication exposed to internet credential stuffing',
      'Unrestricted database/Docker ports (`3306`, `5432`, `6379`) listening on public interfaces',
      'No automated ban threshold for repeated invalid authentication attempts',
    ],
    steps: [
      {
        stepTitle: 'Generate an Ed25519 SSH key pair locally and deploy it to your VPS',
        explanation:
          'Run `ssh-keygen` on your workstation and copy the public key using `ssh-copy-id` before disabling passwords.',
        codeSnippet: {
          language: 'bash',
          filename: 'Local Workstation',
          code: `ssh-keygen -t ed25519 -C "ops@yourdomain.com"
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@YOUR_VPS_IP`,
        },
      },
      {
        stepTitle: 'Enable UFW firewall allowing only SSH, HTTP, and HTTPS',
        explanation:
          'Always allow SSH (`OpenSSH`) BEFORE running `ufw enable` so you do not lock yourself out of the active session.',
        codeSnippet: {
          language: 'bash',
          filename: 'VPS Terminal',
          code: `sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose`,
        },
      },
      {
        stepTitle: 'Disable root password login once key auth is tested in a second window',
        explanation:
          'Keep your original SSH terminal open, verify login with the new key in a second tab, then harden `sshd_config`.',
        codeSnippet: {
          language: 'bash',
          filename: '/etc/ssh/sshd_config.d/99-hardening.conf',
          code: `PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin prohibit-password
MaxAuthTries 4`,
        },
      },
    ],
    verificationChecklist: [
      'New SSH session connects cleanly using your Ed25519 private key without a password prompt.',
      '`ufw status` lists only necessary public ports (`22`, `80`, `443`).',
      '`sudo systemctl reload ssh` applied after validating `sshd -t`.',
    ],
    faqItems: [
      {
        question: 'What if I lose my private SSH key or lock out SSH via UFW?',
        answer:
          'Use the built-in HTML5 noVNC Emergency Console inside your cpcloudhost.com VPS portal—it attaches directly at the hypervisor level independently of network rules.',
      },
    ],
  },
  {
    slug: 'n8n-docker-reverse-proxy-webhook-ssl-setup',
    categoryId: 'vps',
    categoryLabel: 'VPS & n8n Automation',
    title: 'Configure n8n Webhooks, HTTPS Reverse Proxy & Queue Workers',
    seoDescription:
      'Deploy production n8n automation nodes with HTTPS webhook endpoints, WebSocket streaming support, and persistent PostgreSQL storage behind Nginx.',
    keywords: [
      'n8n webhook URL SSL',
      'n8n Nginx reverse proxy',
      'n8n WebSocket connection lost',
      'n8n Docker Compose production',
    ],
    readTime: '7 min read',
    updatedDate: '2026-11-11',
    difficulty: 'Advanced',
    appliesTo: 'n8n Hosting & Unmanaged VPS',
    summary:
      'Running n8n behind a reverse proxy requires setting `WEBHOOK_URL`, enabling WebSocket upgrade headers (`Upgrade` and `Connection`), and backing workflows with PostgreSQL rather than single-file SQLite so parallel webhook bursts never lock.',
    rootCauses: [
      'n8n webhooks register `http://localhost:5678/...` instead of your public `https://` domain',
      'Editor UI shows "Connection lost" because Nginx strips WebSocket `Upgrade` headers',
      'Container updates wipe credentials when `./n8n_data` volume is not mounted persistently',
    ],
    steps: [
      {
        stepTitle: 'Configure production n8n environment variables in Docker Compose',
        explanation:
          'Explicitly declare `WEBHOOK_URL`, `N8N_HOST`, `N8N_PROTOCOL=https`, and `N8N_PROXY_HOPS=1` so OAuth callbacks and webhooks resolve cleanly.',
        codeSnippet: {
          language: 'yaml',
          filename: 'docker-compose.yml',
          code: `services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    restart: always
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - N8N_PROXY_HOPS=1
      - GENERIC_TIMEZONE=UTC
    volumes:
      - n8n_storage:/home/node/.n8n`,
        },
      },
      {
        stepTitle: 'Enable WebSocket proxy headers inside Nginx server block',
        explanation:
          'n8n uses live push streams for execution status inside the editor canvas. Forward HTTP/1.1 Upgrade headers cleanly.',
        codeSnippet: {
          language: 'nginx',
          filename: '/etc/nginx/sites-available/n8n.yourdomain.com',
          code: `location / {
    proxy_pass http://127.0.0.1:5678;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    chunked_transfer_encoding off;
    proxy_buffering off;
}`,
        },
      },
    ],
    verificationChecklist: [
      'Production Webhook node URL begins with `https://n8n.yourdomain.com/webhook/...`.',
      'No "Connection lost" banner appears inside the workflow canvas.',
      'Slack, Stripe, or Google OAuth2 redirect URIs match `https://n8n.yourdomain.com/rest/oauth2-credential/callback`.',
    ],
    faqItems: [
      {
        question: 'Can I scale n8n workers with Redis on high-volume webhook traffic?',
        answer:
          'Yes. Setting `EXECUTIONS_MODE=queue` with `QUEUE_BULL_REDIS_HOST` lets dedicated worker containers process thousands of concurrent runs cleanly.',
      },
    ],
  },
  {
    slug: 'email-deliverability-spf-dkim-dmarc-dns-setup',
    categoryId: 'email-ssl',
    categoryLabel: 'Email, SSL & Migrations',
    title: 'Fix Email Spam Issues: Configure SPF, DKIM & DMARC Authentication',
    seoDescription:
      'Prevent outgoing emails from landing in Gmail or Outlook spam folders by publishing accurate SPF, DKIM, and DMARC TXT records on your domain DNS.',
    keywords: [
      'SPF DKIM DMARC setup',
      'fix email going to spam',
      'DMARC policy TXT record',
      'email authentication cpcloudhost',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-09',
    difficulty: 'Beginner',
    appliesTo: 'Email Hosting, Domains & WordPress SMTP',
    summary:
      'Major inbox providers reject or quarantine unauthenticated mail that lacks aligned SPF, cryptographic DKIM signatures, and a valid DMARC record. Publishing these three TXT entries establishes sender reputation cleanly.',
    rootCauses: [
      'Two separate `v=spf1` TXT records exist on `@` (RFC permits strictly ONE SPF record)',
      'DKIM public key missing or truncated in DNS zone',
      'No `_dmarc` TXT policy published for Google/Yahoo bulk sender compliance',
    ],
    steps: [
      {
        stepTitle: 'Publish a single consolidated SPF record on root apex (@)',
        explanation:
          'Never create two SPF records. Combine authorized mail relays into a single TXT line ending with `~all` or `-all`.',
        codeSnippet: {
          language: 'dns',
          filename: 'DNS TXT (@)',
          code: `@   300   IN  TXT  "v=spf1 include:_spf.cpcloudhost.com ~all"`,
        },
      },
      {
        stepTitle: 'Publish DKIM selector key and starter DMARC policy',
        explanation:
          'Copy the generated DKIM key from StackCP / cPanel Email Deliverability and start with DMARC `p=none` monitoring before moving to `p=quarantine`.',
        codeSnippet: {
          language: 'dns',
          filename: 'DNS TXT (_dmarc)',
          code: `_dmarc   300   IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100; adkim=r; aspf=r"`,
        },
      },
    ],
    verificationChecklist: [
      '`dig +short TXT yourdomain.com` returns exactly ONE `v=spf1` string.',
      '`dig +short TXT _dmarc.yourdomain.com` returns valid DMARC policy.',
      'Sent test message headers show `spf=pass`, `dkim=pass`, and `dmarc=pass`.',
    ],
    faqItems: [
      {
        question: 'Can WordPress PHP mail() pass DKIM & SPF reliably?',
        answer:
          'Configuring authenticated SMTP (via FluentSMTP or WP Mail SMTP) on port `587` STARTTLS guarantees proper envelope alignment and dramatically higher inbox placement than raw PHP `mail()`.',
      },
    ],
  },
  {
    slug: 'zero-downtime-website-migration-hosts-file-checklist',
    categoryId: 'email-ssl',
    categoryLabel: 'Email, SSL & Migrations',
    title: 'Zero-Downtime Website Migration & Local Hosts File Verification Guide',
    seoDescription:
      'Migrate WordPress, cPanel, PHP, or Windows IIS sites to cpcloudhost.com without a second of downtime using database sync and local hosts-file testing.',
    keywords: [
      'zero downtime website migration',
      'hosts file preview website',
      'free website migration checklist',
      'cPanel to StackCP migration',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-12',
    difficulty: 'Beginner',
    appliesTo: 'All Migrations & Hosting Transfers',
    summary:
      'A clean migration verifies the entire site on your new server BEFORE updating public DNS nameservers. Using a temporary local `/etc/hosts` override lets you inspect every checkout, permalink, and form live on the new node while visitors still browse the old host seamlessly.',
    rootCauses: [
      'Switching DNS before files, databases, and SSL are verified on the destination host',
      'High previous DNS TTL (`86400s`) causing split traffic during final cutover',
      'E-commerce orders arriving on the old database while syncing',
    ],
    steps: [
      {
        stepTitle: 'Lower DNS TTL to 300 seconds one day prior to cutover',
        explanation:
          'Reducing TTL ensures global recursive resolvers drop stale IPs within 5 minutes when you switch `A` or `NS` records.',
      },
      {
        stepTitle: 'Preview your migrated site safely using local hosts mapping',
        explanation:
          'Append your new server IP and domain to your workstation hosts file to test the new server privately over HTTPS without affecting public DNS.',
        codeSnippet: {
          language: 'bash',
          filename: '/etc/hosts (macOS/Linux) or C:\\Windows\\System32\\drivers\\etc\\hosts',
          code: `203.0.113.45   yourdomain.com www.yourdomain.com`,
        },
      },
      {
        stepTitle: 'Remove the hosts entry and switch live DNS after verification',
        explanation:
          'Once navigation, SSL, uploads, and contact forms pass QA, delete the temporary hosts line and update your DNS `A` record or nameservers.',
      },
    ],
    verificationChecklist: [
      'Local hosts preview loads the live site cleanly with valid SSL and database writes.',
      'Email MX records remain intact throughout DNS transition.',
      'Temporary `/etc/hosts` line removed immediately after testing.',
    ],
    faqItems: [
      {
        question: 'Does cpcloudhost.com perform unlimited migrations for free?',
        answer:
          'Yes. Our migration engineers handle cPanel, StackCP, Plesk, and manual WordPress/VPS transfers free with zero downtime, plus Switch Credits when moving from an annual contract.',
      },
    ],
  },
  {
    slug: 'fix-wordpress-critical-error-there-has-been-a-critical-error',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix "There Has Been a Critical Error on This Website" in WordPress',
    seoDescription:
      'Step-by-step guide to fix the WordPress Critical Error screen safely using File Manager, Recovery Mode emails, PHP debug logs, and plugin isolation.',
    keywords: [
      'there has been a critical error on this website',
      'WordPress critical error fix',
      'WordPress fatal error recovery mode',
      'disable WordPress plugins FTP File Manager',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-12',
    difficulty: 'Beginner',
    appliesTo: 'Shared Hosting, Managed WordPress & cPanel',
    featured: true,
    summary:
      'WordPress shows "There has been a critical error on this website" when PHP encounters a fatal crash inside a plugin, theme, or outdated PHP function. You can isolate and restore the site in under 5 minutes without losing any posts, pages, or WooCommerce orders.',
    plainLanguageSummary:
      'Think of this screen as WordPress putting up a safety shield instead of showing raw error code to your visitors. Almost 90% of the time, one plugin or theme failed right after an automatic update—and turning off that one folder brings the entire site back online immediately.',
    rootCauses: [
      'A plugin or active theme updated to a version incompatible with your current PHP runtime (e.g., PHP 7.4 vs PHP 8.2/8.3)',
      'Memory exhaustion during WooCommerce checkout, page builder save, or media import',
      'Syntax typo inside the child theme `functions.php` file',
      'Incomplete WordPress core file upload leaving missing PHP class definitions',
    ],
    steps: [
      {
        stepTitle: 'Check your site administrator inbox for the WordPress Recovery Mode email',
        explanation:
          'When the crash happens, WordPress automatically sends an email titled "Your Site is Experiencing a Technical Issue" containing both the exact culprit filename and a special Recovery Mode login link.',
        clientShortcut:
          'Check Spam/Promotions in your WordPress admin email address first—clicking the Recovery Mode link inside lets you log into wp-admin while the broken plugin is temporarily paused.',
      },
      {
        stepTitle: 'Temporarily pause the plugins folder via File Manager or SSH',
        explanation:
          'If you do not have access to the email link, open StackCP / cPanel File Manager -> `public_html/wp-content/` and rename `plugins` to `plugins.off`. Reload your homepage; if the site returns, rename `plugins.off` back to `plugins`, then rename each plugin subfolder one by one to find the exact culprit.',
        clientShortcut:
          'In File Manager (no coding needed): right-click `wp-content/plugins` -> Rename to `plugins_hold`. Reload your website tab. Your website should load immediately.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal / WP-CLI Alternative',
          code: 'wp plugin deactivate --all --path=/var/www/html\n# Re-enable clean plugins one at a time:\nwp plugin activate woocommerce --path=/var/www/html',
        },
      },
      {
        stepTitle: 'Reveal the exact crashing file silently in debug.log',
        explanation:
          'Instead of guessing across 25 plugins, enable silent file logging in `wp-config.php` for two minutes, trigger the failing URL once, and read the last 20 lines of `wp-content/debug.log`.',
        codeSnippet: {
          language: 'php',
          filename: 'wp-config.php',
          code: `define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );`,
        },
      },
    ],
    verificationChecklist: [
      'Frontend URLs and `/wp-admin/` dashboard load normally with HTTP 200.',
      'Faulty plugin updated, replaced, or matched with a compatible PHP version.',
      '`WP_DEBUG` set back to `false` and `wp-content/debug.log` deleted after verification.',
    ],
    faqItems: [
      {
        question: 'Will renaming the plugins folder delete my plugin settings or WooCommerce data?',
        answer:
          'No. Renaming folders only pauses execution. All plugin settings, pages, forms, and store orders remain safely stored inside your WordPress database.',
      },
      {
        question: 'Can changing the PHP version fix a Critical Error immediately?',
        answer:
          'Yes—if a legacy theme breaks after moving from PHP 7.4 to PHP 8.3, temporarily switching back one minor PHP version in StackCP/cPanel restores the site while you update the theme.',
      },
    ],
  },
  {
    slug: 'fix-wordpress-404-not-found-permalinks-nginx-apache',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix 404 Page Not Found Errors in WordPress, Apache, Nginx & IIS',
    seoDescription:
      'Fix 404 Not Found errors when published WordPress posts, WooCommerce products, or subpages stop loading due to broken permalinks, .htaccess, or Nginx rewrite rules.',
    keywords: [
      '404 Page Not Found fix',
      'WordPress posts returning 404',
      'WordPress permalinks .htaccess fix',
      'Nginx try_files WordPress 404',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-12',
    difficulty: 'Beginner',
    appliesTo: 'Shared Hosting, WordPress, VPS & Windows',
    featured: true,
    summary:
      'Seeing a 404 Page Not Found error even though the page clearly exists in WordPress usually means your web server is failing to pass "pretty URLs" (like `/about-us/` or `/shop/item/`) back to `index.php`. Rebuilding permalink rewrite rules resolves it in seconds.',
    plainLanguageSummary:
      'If your homepage works fine, `/wp-admin/` opens, yet clicking any sub-page or product gives "404 Not Found", your pages are NOT deleted—the web server simply lost its URL map (rewrite rules). Saving Permalinks once rebuilds that map.',
    rootCauses: [
      'Missing or overwritten `.htaccess` rewrite block after a site migration or restore',
      'Nginx server block missing `try_files $uri $uri/ /index.php?$args;` on VPS nodes',
      'Apache `AllowOverride` set to `None` instead of `All`, causing `.htaccess` to be ignored',
      'Custom post type (WooCommerce products, Elementor templates, portfolio) registered without flushing permalinks',
    ],
    steps: [
      {
        stepTitle: 'Re-save Permalinks inside WordPress Dashboard (Fixes 80% of cases)',
        explanation:
          'Log into `/wp-admin/`, open **Settings -> Permalinks**, do not change anything (or ensure **Post name** is selected), and click **Save Changes** twice. WordPress automatically regenerates clean rewrite rules.',
        clientShortcut:
          'Inside WordPress Admin: Settings -> Permalinks -> scroll down -> click "Save Changes". Clear any page cache plugin afterward.',
      },
      {
        stepTitle: 'Restore clean Apache / LiteSpeed .htaccess rewrite rules',
        explanation:
          'If File Manager shows `.htaccess` is empty (`0 bytes`) or corrupted after a manual upload, replace its core routing section with standard WordPress directives.',
        codeSnippet: {
          language: 'apacheconf',
          filename: '.htaccess',
          code: `# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress`,
        },
      },
      {
        stepTitle: 'Add try_files directive on Nginx VPS servers',
        explanation:
          'Nginx ignores `.htaccess` files by design. When running WordPress or Laravel on an Unmanaged VPS with Nginx, explicitly include `try_files` inside your `location /` block.',
        codeSnippet: {
          language: 'nginx',
          filename: '/etc/nginx/sites-available/yourdomain.conf',
          code: `location / {
    try_files $uri $uri/ /index.php?$args;
}`,
        },
      },
    ],
    verificationChecklist: [
      'Homepage, category pages, blog posts, and WooCommerce product URLs return `200 OK`.',
      'No typo or uppercase letter mismatch in Linux static asset paths (e.g., `/images/Logo.png` vs `logo.png`).',
    ],
    faqItems: [
      {
        question: 'Why did only my blog posts return 404 right after moving to a VPS?',
        answer:
          'Your previous shared host used Apache/LiteSpeed (`.htaccess`), while your new VPS likely uses Nginx, which requires the `try_files $uri $uri/ /index.php?$args;` directive in your server config.',
      },
      {
        question: 'Can a caching plugin show old 404 errors even after I save permalinks?',
        answer:
          'Yes. Purge your browser cache plus StackCache / Edge CDN after regenerating permalinks so visitors immediately get the updated routes.',
      },
    ],
  },
  {
    slug: 'fix-white-blank-page-wsod-wordpress-php',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix White Blank Page (White Screen of Death) on WordPress & PHP Sites',
    seoDescription:
      'Diagnose and resolve completely blank white browser screens on WordPress and PHP applications by clearing PHP memory limits, broken themes, and OPcache stalls.',
    keywords: [
      'white blank page WordPress fix',
      'WordPress White Screen of Death',
      'blank white screen PHP fix',
      'wp_memory_limit white screen',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-12',
    difficulty: 'Beginner',
    appliesTo: 'Shared Hosting, Managed WordPress & cPanel',
    featured: true,
    summary:
      'A completely blank white screen with zero error text (often called the White Screen of Death or WSOD) means PHP terminated early while production error display (`display_errors`) is switched off for security. Isolating theme, plugin, and memory limits brings the page back cleanly.',
    plainLanguageSummary:
      'For security, live websites hide raw PHP errors from the public—so when PHP hits a memory limit or broken theme file before any HTML renders, the browser draws a totally blank white page. Turning on private logging or pausing the active theme reveals and fixes the block quickly.',
    rootCauses: [
      'PHP ran out of allocated `memory_limit` while building an Elementor/Divi page or WooCommerce report',
      'Corrupt active theme or accidental whitespace/BOM characters before `<?php` in `functions.php` or `wp-config.php`',
      'Stale PHP OPcache holding an old pre-upgrade file path after a core or plugin deployment',
      'Broken output buffer from a conflicting compression/minification plugin',
    ],
    steps: [
      {
        stepTitle: 'Increase PHP memory_limit to 256M or 512M',
        explanation:
          'Heavy visual builders and WooCommerce stores routinely exceed the default 64M/128M ceiling. Raise limits in StackCP/cPanel PHP Options AND inside `wp-config.php`.',
        clientShortcut:
          'In StackCP / cPanel: open PHP Configuration -> change `memory_limit` to `512M` -> Save, then refresh your site.',
        codeSnippet: {
          language: 'php',
          filename: 'wp-config.php',
          code: `define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );`,
        },
      },
      {
        stepTitle: 'Test with a default WordPress theme without deleting your custom theme',
        explanation:
          'If pausing plugins did not remove the white screen, navigate to `wp-content/themes/` and temporarily rename your active theme folder (e.g., `astra` -> `astra.bak`). WordPress automatically falls back to a default Twenty-Twenty theme.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal / WP-CLI',
          code: 'wp theme list --path=/var/www/html\nwp theme activate twentytwentyfive --path=/var/www/html',
        },
      },
      {
        stepTitle: 'Flush PHP OPcache and Edge Page Cache',
        explanation:
          'Right after fixing a broken file or running updates, clear server cache and PHP OPcache so the server stops serving a stale empty buffer.',
      },
    ],
    verificationChecklist: [
      'Opening an Incognito browser window loads full page markup and styles cleanly.',
      'Checking page source (`Ctrl+U`) shows complete closing `</html>` tags instead of empty output.',
      'Any edited PHP file has zero spaces or blank lines before its opening `<?php` tag.',
    ],
    faqItems: [
      {
        question: 'Why does the white screen only appear on /wp-admin/ while the homepage works?',
        answer:
          'Admin-only WSOD is frequently caused by extra blank spaces at the top/bottom of `wp-config.php` or `functions.php` ("headers already sent") or an admin dashboard widget plugin consuming PHP memory.',
      },
    ],
  },
  {
    slug: 'fix-err-too-many-redirects-cloudflare-ssl-loop',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix ERR_TOO_MANY_REDIRECTS: Resolve Infinite HTTPS & Cloudflare Loops',
    seoDescription:
      'Stop Chrome and Safari ERR_TOO_MANY_REDIRECTS loops caused by Cloudflare Flexible SSL mode, mismatched WordPress URLs, or conflicting http-to-https rules.',
    keywords: [
      'ERR_TOO_MANY_REDIRECTS fix',
      'Cloudflare Flexible SSL redirect loop',
      'WordPress HTTPS loop fix',
      'redirect loop hosting',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-11',
    difficulty: 'Beginner',
    appliesTo: 'All Hosting Plans, WordPress & Cloudflare CDN',
    summary:
      'An infinite redirect loop (`ERR_TOO_MANY_REDIRECTS`) happens when two layers disagree on the final URL: for example, Cloudflare speaks HTTP to your origin server while your origin tries to redirect every HTTP visitor back to HTTPS endlessly.',
    plainLanguageSummary:
      'Imagine two traffic officers waving visitors back and forth across a bridge forever. On websites using Cloudflare, this happens almost every time SSL is set to "Flexible" instead of "Full (Strict)" while WordPress enforces HTTPS.',
    rootCauses: [
      'Cloudflare SSL/TLS encryption mode set to **Flexible** while origin hosting enforces HTTPS redirects',
      'WordPress `WP_HOME` uses `https://www.` while `.htaccess` forces non-`www`',
      'Cached browser cookies holding an outdated redirect target after migration',
    ],
    steps: [
      {
        stepTitle: 'Switch Cloudflare SSL/TLS encryption mode to Full (Strict)',
        explanation:
          'Every cpcloudhost.com hosting package includes a valid Free SSL certificate on the origin server. Set Cloudflare -> **SSL/TLS -> Overview** to **Full (Strict)** so encrypted traffic never bounces.',
        clientShortcut:
          'Log into Cloudflare -> choose your domain -> SSL/TLS -> click "Full (Strict)". Wait 60 seconds and test in an Incognito browser window.',
      },
      {
        stepTitle: 'Align WordPress Site URL and Home URL identically',
        explanation:
          'Both `WP_HOME` and `WP_SITEURL` must share the exact same `https://` scheme and `www` preference as your `.htaccess` canonical redirect.',
        codeSnippet: {
          language: 'php',
          filename: 'wp-config.php',
          code: `define( 'WP_HOME', 'https://yourdomain.com' );
define( 'WP_SITEURL', 'https://yourdomain.com' );`,
        },
      },
      {
        stepTitle: 'Verify single-hop redirect chain cleanly via curl',
        explanation:
          'Confirm HTTP redirects once (`301`) straight to HTTPS `200 OK` rather than hopping multiple times.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'curl -sIL https://yourdomain.com | grep -iE "^HTTP/|^location:"',
        },
      },
    ],
    verificationChecklist: [
      '`curl -IL http://yourdomain.com` completes in at most ONE `301` redirect to `200 OK`.',
      'Site loads cleanly in Chrome Incognito without clearing cookies repeatedly.',
    ],
    faqItems: [
      {
        question: 'Should I test redirect fixes in normal tabs or Incognito?',
        answer:
          'Always test in Incognito or `curl -IL`, because standard browsers aggressively cache `301` permanent redirects locally even after you fix the server rule.',
      },
    ],
  },
  {
    slug: 'fix-504-gateway-timeout-and-508-resource-limit',
    categoryId: 'errors',
    categoryLabel: 'Errors & Fixes',
    title: 'Fix 504 Gateway Timeout & 508 Resource Limit Reached Errors',
    seoDescription:
      'Diagnose slow PHP scripts, stalled remote API calls, bloated wp_options autoload tables, and bot crawl spikes causing 504 Timeout and 508 Limit Reached outages.',
    keywords: [
      '504 Gateway Timeout fix',
      '508 Resource Limit Reached',
      'wp_options autoload optimization',
      'slow WordPress admin timeout',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-11',
    difficulty: 'Intermediate',
    appliesTo: 'Shared Hosting, cPanel, WordPress & VPS',
    summary:
      'A 504 Gateway Timeout occurs when an upstream PHP script or proxy takes longer than the gateway’s allowed response window (typically 60–120s). A 508 Resource Limit Reached notice occurs on shared cloud nodes when concurrent PHP workers or automated bot scrapers saturate allowed entry processes.',
    plainLanguageSummary:
      'A `504` means a page waited too long for a slow background task (like a backup plugin or broken remote API call). A `508` means too many visitors or automated bots hit dynamic PHP pages at the exact same second and filled your concurrent worker slots.',
    rootCauses: [
      'Stalled external HTTP webhook/license check timing out inside PHP `curl_exec()`',
      'Unoptimized `wp_options` table loading megabytes of stale transients on every single request',
      'Aggressive scraper bots bypassing page cache via random query strings (`?s=...` or `/?add-to-cart=...`)',
      'Large XML/CSV product import running via web browser instead of CLI',
    ],
    steps: [
      {
        stepTitle: 'Check wp_options autoload total size (Keep under 1 MB)',
        explanation:
          'Expired plugin transients set to `autoload = yes` slow every WordPress request down drastically. Measure autoload weight and prune expired transients cleanly.',
        codeSnippet: {
          language: 'sql',
          filename: 'MySQL / phpMyAdmin Diagnostic',
          code: `SELECT ROUND(SUM(LENGTH(option_value))/1024/1024, 2) AS autoload_mb
FROM wp_options
WHERE autoload IN ('yes', 'on', 'auto');`,
        },
      },
      {
        stepTitle: 'Run heavy imports via WP-CLI or background cron instead of browser HTTP',
        explanation:
          'Browser requests face gateway HTTP timeouts, whereas terminal WP-CLI commands run straight against PHP without HTTP timeout limits.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal / SSH',
          code: 'wp transient delete --expired --path=/var/www/html\nwp cache flush --path=/var/www/html',
        },
      },
      {
        stepTitle: 'Enable Full-Page Caching & Bot Rate Rules',
        explanation:
          'Serving 95% of anonymous traffic directly from StackCache or LiteSpeed static memory prevents PHP worker queues from ever filling to 508 limits.',
      },
    ],
    verificationChecklist: [
      'Total `autoload` size inside `wp_options` stays under `1 MB`.',
      'Anonymous pages return cached responses in under `200ms` without hitting PHP workers.',
    ],
    faqItems: [
      {
        question: 'Does upgrading to a VPS or StackCP autoscaling tier prevent 508 limits?',
        answer:
          'Yes. Dedicated KVM VPS instances assign dedicated vCPU and RAM pools exclusively to your server without shared entry-process caps, while StackCache reduces dynamic worker load by over 80%.',
      },
    ],
  },
  {
    slug: 'fix-413-request-entity-too-large-and-php-upload-limits',
    categoryId: 'hosting',
    categoryLabel: 'Web Hosting & WordPress',
    title: 'Fix "Exceeds Maximum Upload Size" & 413 Request Entity Too Large',
    seoDescription:
      'Raise WordPress, PHP, and Nginx upload limits cleanly by synchronizing upload_max_filesize, post_max_size, memory_limit, and client_max_body_size.',
    keywords: [
      '413 Request Entity Too Large fix',
      'exceeds upload_max_filesize WordPress',
      'increase PHP max upload size',
      'Nginx client_max_body_size',
    ],
    readTime: '4 min read',
    updatedDate: '2026-11-10',
    difficulty: 'Beginner',
    appliesTo: 'Shared Hosting, WordPress, cPanel & VPS',
    summary:
      'When uploading large WordPress themes, backup archives, or high-resolution media, uploads fail unless BOTH your web server proxy (Nginx/Apache) AND PHP configuration allow the larger request body.',
    plainLanguageSummary:
      'Think of two doorways in a row: even if you widen the PHP doorway (`upload_max_filesize`), the Nginx/Edge doorway (`client_max_body_size`) will reject the file with a `413` error unless both are raised together.',
    rootCauses: [
      'PHP `post_max_size` kept smaller than `upload_max_filesize`',
      'Nginx `client_max_body_size` still at its `1M` default on a VPS',
      'Slow upload interrupted by default `max_execution_time = 30` or `max_input_time = 60`',
    ],
    steps: [
      {
        stepTitle: 'Update PHP upload directives via StackCP / cPanel or .user.ini',
        explanation:
          'Keep `memory_limit >= post_max_size >= upload_max_filesize`. For 256MB uploads, set `post_max_size` to `256M` and `memory_limit` to `512M`.',
        clientShortcut:
          'In StackCP / cPanel -> PHP Options: update `upload_max_filesize` to `256M`, `post_max_size` to `256M`, and `max_execution_time` to `300`.',
        codeSnippet: {
          language: 'ini',
          filename: '.user.ini (inside public_html)',
          code: `upload_max_filesize = 256M
post_max_size = 256M
memory_limit = 512M
max_execution_time = 300
max_input_time = 300`,
        },
      },
      {
        stepTitle: 'Set client_max_body_size inside Nginx server or http block (VPS)',
        explanation:
          'Reload Nginx after adding `client_max_body_size 256M;` so `413 Request Entity Too Large` disappears.',
        codeSnippet: {
          language: 'nginx',
          filename: '/etc/nginx/conf.d/uploads.conf',
          code: `client_max_body_size 256M;`,
        },
      },
    ],
    verificationChecklist: [
      'WordPress **Media -> Add New** displays your updated `Maximum upload file size: 256 MB` notice.',
      'Large `.zip` theme or plugin uploads finish cleanly without 413 or 504 errors.',
    ],
    faqItems: [
      {
        question: 'Can I upload a 2GB backup archive via browser without touching PHP limits?',
        answer:
          'For files larger than `500MB`, SFTP or SSH upload directly into `wp-content/` is significantly faster and immune to browser connection drops.',
      },
    ],
  },
  {
    slug: 'setup-subdomains-staging-sites-cname-dns-routing',
    categoryId: 'domains',
    categoryLabel: 'Domains & DNS',
    title: 'Connect Subdomains (app., shop., staging.) with Clean A & CNAME DNS',
    seoDescription:
      'Step-by-step client guide to point subdomains like staging., api., or n8n.yourdomain.com to separate cloud servers or Vercel/VPS IPs cleanly with SSL.',
    keywords: [
      'setup subdomain DNS record',
      'CNAME vs A record subdomain',
      'point subdomain to VPS IP',
      'staging subdomain SSL setup',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-11',
    difficulty: 'Beginner',
    appliesTo: 'Domains, Anycast DNS & Cloud Hosting',
    summary:
      'Subdomains let you host a store (`shop.`), automation server (`n8n.`), client portal (`app.`), or staging site (`staging.`) on completely different IP addresses without affecting your primary website or email.',
    plainLanguageSummary:
      'Using a subdomain does NOT disrupt your main website or email as long as you add its specific `A` or `CNAME` record instead of touching your `@` root or `MX` records.',
    rootCauses: [
      'Existing wildcard `*` DNS record overriding newly created subdomains until explicitly defined',
      'Adding a full URL `https://staging.yourdomain.com` instead of just `staging` in the Host field',
      'Forgetting to add the subdomain to the target server virtual host & Free AutoSSL certificate',
    ],
    steps: [
      {
        stepTitle: 'Choose an A record (for an IP address) or CNAME (for a hostname)',
        explanation:
          'In cpcloudhost.com Manage DNS: use an **A record** when pointing to a dedicated KVM VPS IPv4 address, or a **CNAME record** when pointing to an external SaaS/CDN endpoint.',
        codeSnippet: {
          language: 'dns',
          filename: 'Subdomain Zone Records',
          code: `; Point n8n.yourdomain.com to a KVM VPS IP:
n8n       300   IN  A      203.0.113.88

; Point shop.yourdomain.com to an external store endpoint:
shop      300   IN  CNAME  stores.examplecdn.net.`,
        },
      },
      {
        stepTitle: 'Verify DNS propagation and issue subdomain SSL immediately',
        explanation:
          'Once `dig` returns the target IP, bind the subdomain inside your control panel or run Certbot on VPS to issue a trusted HTTPS certificate.',
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal',
          code: 'dig @1.1.1.1 +short n8n.yourdomain.com',
        },
      },
    ],
    verificationChecklist: [
      '`dig` answers only the intended target IP/hostname for the subdomain.',
      'Primary domain `@` and email `MX` records remain unchanged and verified.',
    ],
    faqItems: [
      {
        question: 'Can I host my main WordPress site on shared hosting and n8n on a VPS under the same domain?',
        answer:
          'Yes! Keep `@` and `www` pointing to your shared hosting node while creating an `A` record for `n8n` pointing to your VPS IP address.',
      },
    ],
  },
  {
    slug: 'fix-vps-out-of-memory-oom-killer-nvme-swap',
    categoryId: 'vps',
    categoryLabel: 'VPS & n8n Automation',
    title: 'Prevent VPS OOM Crashes: Configure NVMe Swap Space & Check Disk Usage',
    seoDescription:
      'Stop Linux KVM VPS services like MariaDB, Docker, and Node.js from crashing unexpectedly by inspecting dmesg OOM logs and creating a clean NVMe swapfile.',
    keywords: [
      'Linux OOM killer MariaDB crash',
      'create swapfile Ubuntu VPS',
      'VPS ran out of memory fix',
      'Docker Node build OOM fix',
    ],
    readTime: '6 min read',
    updatedDate: '2026-11-11',
    difficulty: 'Intermediate',
    appliesTo: 'Unmanaged VPS & n8n Cloud Nodes',
    summary:
      'When RAM hits 100% during a heavy Docker build, Node compilation, or sudden database spike, the Linux kernel OOM-Killer terminates the largest active process (frequently `mysqld` or `n8n`), producing sudden 502/database outages. Adding a fast NVMe swap cushion prevents abrupt crashes.',
    plainLanguageSummary:
      'Even fast servers hit brief 2-second memory spikes during backups or builds. Adding an NVMe swap file gives Linux extra overflow space on fast SSD/NVMe storage instead of forcing the system to kill your database mid-request.',
    rootCauses: [
      'VPS provisioned with zero swap space configured by default',
      'Unbounded `npm run build`, Composer install, or Docker image builds exhausting 8GB RAM',
      'MariaDB `innodb_buffer_pool_size` tuned higher than 70% of physical RAM',
    ],
    steps: [
      {
        stepTitle: 'Check kernel logs for recent Out-Of-Memory process kills',
        explanation:
          'Confirm whether `Out of memory: Killed process` terminated your database or web server recently.',
        codeSnippet: {
          language: 'bash',
          filename: 'VPS Terminal',
          code: 'sudo dmesg -T | grep -iE "killed process|out of memory"\nfree -h',
        },
      },
      {
        stepTitle: 'Create a persistent 4 GB NVMe swapfile cleanly',
        explanation:
          'Allocate a secure root-only `600` swapfile, activate it immediately, and persist it across reboots inside `/etc/fstab`.',
        codeSnippet: {
          language: 'bash',
          filename: 'VPS Terminal',
          code: `sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10`,
        },
      },
    ],
    verificationChecklist: [
      '`free -h` displays active `4.0Gi` Swap alongside physical memory.',
      '`/etc/fstab` includes `/swapfile` so swap auto-attaches cleanly after reboots.',
    ],
    faqItems: [
      {
        question: 'Does adding an NVMe swap file slow down normal website speed?',
        answer:
          'With `vm.swappiness=10`, Linux keeps active runtime processes in fast RAM and only uses the NVMe swap file as an emergency overflow buffer during brief memory peaks.',
      },
    ],
  },
  {
    slug: 'troubleshoot-windows-iis-500-19-web-config-dotnet',
    categoryId: 'hosting',
    categoryLabel: 'Web Hosting & WordPress',
    title: 'Fix Windows Hosting IIS 500.19 Errors, web.config XML & .NET App Pools',
    seoDescription:
      'Resolve IIS HTTP Error 500.19 invalid configuration data, missing URL Rewrite rules, and ASP.NET Core 8 app pool startup failures on Windows Web Hosting.',
    keywords: [
      'IIS 500.19 web.config fix',
      'Windows Web Hosting ASP.NET Core error',
      'web.config duplicate rewrite rule',
      'IIS App Pool permissions fix',
    ],
    readTime: '5 min read',
    updatedDate: '2026-11-10',
    difficulty: 'Intermediate',
    appliesTo: 'Windows Web Hosting (IIS 10)',
    summary:
      'On Windows IIS 10 web hosting, `HTTP Error 500.19 – Internal Server Error` indicates that IIS cannot parse your `web.config` XML file—caused by a malformed tag, duplicate rewrite rule names, or calling an unregistered IIS module.',
    plainLanguageSummary:
      'On Windows hosting, `web.config` works just like `.htaccess` does on Linux. Even a single missing closing `</rule>` tag or duplicate rule name stops the entire site with a `500.19` notice.',
    rootCauses: [
      'Unclosed XML element or invalid character inside `web.config`',
      'Two WordPress or ASP.NET plugins both writing a `<rule name="WordPress">` block with the same `name` attribute',
      'Uploading a `.NET Core` app targeting a version without recycling or matching runtime inside the Windows control panel',
    ],
    steps: [
      {
        stepTitle: 'Validate web.config XML syntax and unique rule names',
        explanation:
          'Ensure every `<rule>` inside `<rewrite><rules>` has a unique `name=""` attribute and clean closing XML structure.',
        clientShortcut:
          'In Windows File Manager: download `web.config` as a backup, remove duplicate `<rule>` blocks cleanly, save, and refresh the site.',
        codeSnippet: {
          language: 'xml',
          filename: 'web.config (Clean URL Rewrite)',
          code: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="cpcloudhost Canonical Rewrite" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.php" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`,
        },
      },
      {
        stepTitle: 'Recycle the IIS Application Pool after ASP.NET deployments',
        explanation:
          'Deploying updated `.dll` assemblies while the IIS worker locks them triggers startup failures. Upload an empty `app_offline.htm` briefly or trigger an Application Pool Recycle from your hosting panel.',
      },
    ],
    verificationChecklist: [
      'Site serves clean HTTP 200 without `0x8007000d` or `0x800700b7` IIS configuration codes.',
      '`app_offline.htm` removed cleanly after `.dll` deployment finishes.',
    ],
    faqItems: [
      {
        question: 'Why does IIS show 0x800700b7 "Cannot add duplicate collection entry"?',
        answer:
          'Two blocks inside `web.config` share the exact same key/name attribute (often two identical MIME type extensions or rewrite rule names). Rename or remove the duplicate entry to clear it.',
      },
    ],
  },
];

export const KB_POPULAR_TAGS = [
  'Critical Error',
  '404 Not Found',
  'White Blank Page',
  '502 Bad Gateway',
  'Database Connection',
  'TOO_MANY_REDIRECTS',
  'SPF DKIM DMARC',
  'n8n Webhook',
];
