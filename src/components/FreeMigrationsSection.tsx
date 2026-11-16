import React, { useState } from 'react';
import { CheckCircle2, Server } from 'lucide-react';
import migrationServersImg from '../assets/images/migration_isometric_servers_1794556019724.jpg';

export const FreeMigrationsSection: React.FC = () => {
  const [requested, setRequested] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      id="free-migrations"
      className="bg-white py-16 lg:py-22 border-b border-[#E2E8F0] overflow-x-clip"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Copy & CTA */}
          <div className="lg:col-span-5 min-w-0">
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[#0F172A] leading-[1.16]"
              style={{ textWrap: 'balance' }}
            >
              Free Migrations + Switch Credits
            </h2>

            <div className="mt-5 space-y-4 text-sm sm:text-[15px] text-slate-600 leading-relaxed max-w-xl">
              <p>
                Unlimited free migrations from cPanel, Plesk, DirectAdmin,
                WordPress, Cloudways, WP Engine, or another StackCP provider.
              </p>
              <p>
                Already hosting elsewhere? Our systems engineers migrate your
                entire environment for free &mdash; including websites,
                databases, email boxes, DNS, and SSL &mdash; with zero downtime.
              </p>
              <p className="font-bold text-[#0F172A] pt-1">
                Still have months left at your old host?
              </p>
            </div>

            <ul className="mt-3 space-y-2 text-sm sm:text-[15px] text-slate-600">
              <li className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-[#0F172A] mt-2 shrink-0"
                />
                <span>
                  We credit up to 6 months of unused time, so you don&rsquo;t
                  pay twice.
                </span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setRequested(true)}
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
              >
                Request Free Migration
              </button>

              {requested && (
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0E6B63]">
                  <CheckCircle2
                    className="w-4 h-4 text-[#10B981] shrink-0"
                    aria-hidden="true"
                  />
                  Migration desk ready — message us on WhatsApp or email
                  support@cpcloudhost.com
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Full-Color Dark 3D Isometric Server Illustration + Flanking Migration Capsules */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-end min-w-0">
            <div className="relative w-full max-w-[560px] select-none pointer-events-none flex items-center justify-center">
              {/* Main 3D Isometric Dark Glowing Server Cluster Image */}
              {!imgFailed ? (
                <img
                  src={migrationServersImg}
                  alt="3D isometric dark cloud server cluster with glowing cyan and blue server racks"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-auto object-contain mix-blend-multiply"
                />
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <Server className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                  <div className="font-display text-sm font-bold text-[#0F172A]">
                    StackCP &amp; cPanel Cloud Migration Cluster
                  </div>
                </div>
              )}

              {/* Crisp Overlay Labels: StackCP & cPanel */}
              <div className="hidden sm:block absolute top-[2%] left-1/2 -translate-x-1/2 font-display text-sm font-extrabold tracking-tight text-[#0F172A]">
                StackCP<sup className="text-[9px] ml-0.5">&reg;</sup>
              </div>
              <div className="hidden sm:block absolute top-[17%] left-[19%] font-display text-sm font-extrabold italic tracking-tight text-[#0F172A]">
                cPanel
              </div>

              {/* Left Floating Migration Source Pill Capsule */}
              <div className="hidden sm:flex flex-col items-center justify-between py-4 px-2.5 w-[64px] h-[168px] rounded-full bg-white border border-[#E2E8F0] shadow-[0_14px_34px_-10px_rgba(15,23,42,0.16)] absolute left-1 sm:left-3 top-[18%]">
                {/* Krystal */}
                <div className="flex flex-col items-center gap-1">
                  <svg viewBox="0 0 24 20" className="w-5 h-4" fill="none" aria-hidden="true">
                    <polygon points="12,1 21,8 12,19 3,8" fill="#0F172A" />
                    <polyline points="3,8 12,11 21,8" stroke="#FFFFFF" strokeWidth="1.2" />
                  </svg>
                  <span className="text-[9px] font-bold text-[#0F172A] leading-none">
                    Krystal
                  </span>
                </div>

                {/* Plesk */}
                <div className="flex flex-col items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
                    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#0F172A" />
                    <text
                      x="12"
                      y="15.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="800"
                      fontFamily="sans-serif"
                    >
                      P
                    </text>
                  </svg>
                  <span className="text-[8.5px] font-bold text-[#0F172A] leading-none">
                    Plesk
                  </span>
                </div>

                {/* WordPress */}
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 26 26" className="w-6 h-6" fill="none" aria-hidden="true">
                    <circle cx="13" cy="13" r="10.5" stroke="#0F172A" strokeWidth="1.8" />
                    <path
                      d="M7.5 9L10.8 18.5L13 12.2L15.2 18.5L18.5 9"
                      stroke="#0F172A"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Right Floating Migration Source Pill Capsule */}
              <div className="hidden sm:flex flex-col items-center justify-between py-4 px-2.5 w-[64px] h-[176px] rounded-full bg-white border border-[#E2E8F0] shadow-[0_14px_34px_-10px_rgba(15,23,42,0.16)] absolute right-1 sm:right-3 top-[12%]">
                {/* Cloudways */}
                <div className="flex flex-col items-center gap-1">
                  <svg viewBox="0 0 26 18" className="w-6 h-4" fill="none" aria-hidden="true">
                    <path
                      d="M6.5 14H19.5C21.9853 14 24 11.9853 24 9.5C24 7.185 22.25 5.28 20.01 5.03C19.21 2.13 16.56 0 13.4 0C9.64 0 6.6 3.04 6.6 6.8C6.6 6.97 6.61 7.14 6.62 7.3C4.3 7.64 2.5 9.64 2.5 12.05C2.5 13.13 3.37 14 4.45 14H6.5Z"
                      fill="#0F172A"
                    />
                  </svg>
                  <span className="text-[7px] font-bold tracking-tight text-[#0F172A] leading-none">
                    CLOUDWAYS
                  </span>
                </div>

                {/* WP Engine */}
                <div className="flex flex-col items-center gap-1">
                  <svg viewBox="0 0 22 22" className="w-5 h-5" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="18" height="18" rx="3" fill="#0F172A" />
                    <rect x="5" y="5" width="4.5" height="4.5" fill="#FFFFFF" />
                    <rect x="12.5" y="5" width="4.5" height="4.5" fill="#FFFFFF" />
                    <rect x="5" y="12.5" width="4.5" height="4.5" fill="#FFFFFF" />
                    <rect x="12.5" y="12.5" width="4.5" height="4.5" fill="#10B981" />
                  </svg>
                  <span className="text-[7.5px] font-bold text-[#0F172A] leading-none">
                    WP Engine
                  </span>
                </div>

                {/* DirectAdmin */}
                <div className="flex flex-col items-center gap-1">
                  <svg viewBox="0 0 26 14" className="w-6 h-3.5" fill="none" aria-hidden="true">
                    <circle cx="9" cy="7" r="4.5" stroke="#0F172A" strokeWidth="2" />
                    <circle cx="17" cy="7" r="4.5" stroke="#0E6B63" strokeWidth="2" />
                  </svg>
                  <span className="text-[7px] font-bold text-[#0F172A] leading-none text-center">
                    DirectAdmin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
