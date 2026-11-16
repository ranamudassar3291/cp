import React from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Cloud,
  Cpu,
  Database,
  Globe,
  Layers,
  LayoutGrid,
  RefreshCw,
  Server,
  Shield,
  Workflow,
} from 'lucide-react';
import {
  SERVICE_MATRIX,
  ServiceCategoryId,
  ServiceMatrixItem,
} from '../data/hostingData';
import { useCurrency } from '../context/CurrencyContext';

interface ServiceMatrixProps {
  onSelectService: (item: ServiceMatrixItem) => void;
  onSelectPlatform: (sectionSelector: string) => void;
}

const SERVICE_ICONS: Record<
  ServiceCategoryId,
  React.ComponentType<{ className?: string }>
> = {
  shared: Server,
  wordpress: LayoutGrid,
  windows: Layers,
  reseller: Database,
  cpanel: Shield,
  vps: Cpu,
  aws: Workflow,
  gcp: ArrowLeftRight,
  domains: Globe,
  migrations: RefreshCw,
};

export const ServiceMatrix: React.FC<ServiceMatrixProps> = ({
  onSelectService,
  onSelectPlatform,
}) => {
  const { formatPriceString } = useCurrency();
  const techPartners = [
    {
      name: 'cPanel',
      planId: 'cpanel-nvme',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" aria-hidden="true">
          <path
            d="M7.5 16.5C5.01472 16.5 3 14.4853 3 12C3 9.51472 5.01472 7.5 7.5 7.5H11L9.6 12H7.8C6.97157 12 6.3 12.6716 6.3 13.5C6.3 14.3284 6.97157 15 7.8 15H10.5L9.9 16.5H7.5ZM13.5 7.5H16.8C19.1196 7.5 21 9.3804 21 11.7C21 14.0196 19.1196 15.9 16.8 15.9H14.5L13.6 18.5H10.8L13.5 7.5Z"
            fill="#FF6C2C"
          />
        </svg>
      ),
    },
    {
      name: 'AWS',
      planId: 'aws-server',
      icon: <Cloud className="w-4 h-4 text-[#FF9900] shrink-0" aria-hidden="true" />,
    },
    {
      name: 'Google Cloud',
      planId: 'gcp-server',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" aria-hidden="true">
          <path
            d="M7.5 16.5H16.8C18.5673 16.5 20 15.0673 20 13.3C20 11.63 18.72 10.26 17.09 10.11C16.52 7.75 14.4 6 11.88 6C8.92 6 6.53 8.4 6.53 11.35C6.53 11.51 6.54 11.67 6.55 11.83C4.83 12.1 3.5 13.59 3.5 15.38C3.5 16.01 3.99 16.5 4.62 16.5H7.5Z"
            stroke="#4285F4"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
    {
      name: 'WordPress',
      planId: 'pro-business',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#21759B" strokeWidth="1.8" />
          <path
            d="M6.8 9L10 17.5M12 8.5L15.2 17.5M17.2 9.5L15.2 17.5"
            stroke="#21759B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      name: 'Linux',
      planId: 'unmanaged-vps',
      icon: <Cpu className="w-4 h-4 text-[#0F172A] shrink-0" aria-hidden="true" />,
    },
    {
      name: 'Windows',
      planId: 'windows-cloud',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" fill="#0078D4" />
          <rect x="13" y="4" width="7" height="7" fill="#0078D4" />
          <rect x="4" y="13" width="7" height="7" fill="#0078D4" />
          <rect x="13" y="13" width="7" height="7" fill="#0078D4" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="services"
      className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-[#0E6B63] mb-2">
            10 Core Infrastructure Services
          </p>
          <h2
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
            style={{ textWrap: 'balance' }}
          >
            Choose the Web Hosting That Fits Your Needs
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            Explore shared NVMe hosting, managed WordPress, Windows IIS,
            reseller plans, cPanel, KVM VPS, AWS, Google Cloud, domains, and
            unlimited migrations.
          </p>
        </div>

        {/* 2x5 Bordered Service Matrix Grid (10 Services) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-t border-l border-[#E2E8F0] rounded-xl overflow-hidden">
          {SERVICE_MATRIX.map((item) => {
            const Icon = SERVICE_ICONS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectService(item)}
                className="group relative text-left p-5 sm:p-6 bg-white hover:bg-[#0F172A] border-r border-b border-[#E2E8F0] transition-colors duration-150 flex flex-col justify-between min-h-[188px] cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0E6B63]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-9 h-9 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] group-hover:bg-[#0E6B63] group-hover:border-[#0E6B63] text-[#0E6B63] group-hover:text-white flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <ArrowUpRight
                      className="w-4 h-4 text-slate-400 group-hover:text-[#10B981] transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-display text-[15px] font-bold text-[#0F172A] group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 group-hover:text-slate-300 mt-1.5 leading-relaxed transition-colors">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E8F0] group-hover:border-slate-700 flex items-center justify-between text-xs transition-colors">
                  <span className="text-slate-500 group-hover:text-slate-400">
                    From
                  </span>
                  <span className="font-mono-num font-semibold text-[#0F172A] group-hover:text-[#10B981]">
                    {formatPriceString(item.startingPrice)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tech Logo Strip */}
        <div className="mt-12 pt-10 border-t border-[#E2E8F0]">
          <p className="text-center text-xs font-semibold tracking-wide text-slate-500 mb-6">
            Powered by Industry-Standard Control Panels &amp; Multi-Cloud
            Partners
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
            {techPartners.map((partner) => (
              <button
                key={partner.name}
                type="button"
                onClick={() => onSelectPlatform('#infrastructure')}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0E6B63] hover:bg-white text-slate-800 hover:text-[#0E6B63] transition-colors cursor-pointer whitespace-nowrap"
              >
                {partner.icon}
                <span className="font-display text-sm font-bold tracking-tight">
                  {partner.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
