import React, { useState } from 'react';
import {
  Database,
  FileCode2,
  FolderOpen,
  Gauge,
  Globe,
  HardDrive,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react';

/**
 * Clean overlapping browser windows comparing cPanel Tools and StackCP Cloud
 * inside orbital geometry accents, replacing low-res raster mockups.
 */
export const CpanelVsStackCpVisual: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'email' | 'edge' | 'files' | 'security'>('edge');

  return (
    <div className="relative py-6 px-3 sm:px-6 flex items-center justify-center min-h-[380px] select-none">
      {/* Orbital background geometry rings */}
      <div className="relative w-full max-w-[540px]">
        <div
          className="absolute -top-6 left-1/4 w-44 h-44 rounded-full bg-[#DCEFED] opacity-85 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-6 right-12 w-36 h-36 rounded-full bg-[#F5EDE2] opacity-80 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-2 rounded-full border border-dashed border-slate-300/80 pointer-events-none"
          aria-hidden="true"
        />

        {/* Back Browser Card: cPanel Tools */}
        <div className="relative z-10 w-[86%] rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-[0_18px_40px_-18px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            </div>
            <span className="text-[11px] font-medium text-slate-500">cPanel® Tools — cpcloudhost.com</span>
            <span className="w-8" />
          </div>

          <div className="grid grid-cols-12 min-h-[210px]">
            <div className="col-span-4 bg-[#162032] text-white p-3.5 space-y-2.5">
              <div className="text-sm font-display font-bold tracking-tight text-[#FF6C2C]">
                cP<span className="text-white font-semibold">anel</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                <div className="flex items-center gap-2 font-medium text-white bg-white/10 rounded px-2 py-1">
                  <SlidersHorizontal className="w-3 h-3 text-[#34D399]" />
                  <span>Tools</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1">
                  <FolderOpen className="w-3 h-3 text-slate-400" />
                  <span>File Manager</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1">
                  <Terminal className="w-3 h-3 text-slate-400" />
                  <span>Node.js Apps</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1">
                  <Database className="w-3 h-3 text-slate-400" />
                  <span>MySQL® DB</span>
                </div>
              </div>
            </div>

            <div className="col-span-8 p-4 bg-white">
              <p className="text-xs font-bold text-[#0F172A] mb-2.5">Developer &amp; Domain Suite</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div className="p-2 rounded border border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#0E6B63]" />
                  <span>Email Accounts</span>
                </div>
                <div className="p-2 rounded border border-slate-100 bg-slate-50 flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-[#0E6B63]" />
                  <span>Python Selector</span>
                </div>
                <div className="p-2 rounded border border-slate-100 bg-slate-50 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0E6B63]" />
                  <span>AutoSSL Certs</span>
                </div>
                <div className="p-2 rounded border border-slate-100 bg-slate-50 flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-[#0E6B63]" />
                  <span>NVMe Backups</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foreground Offset Window: StackCP Dashboard */}
        <div className="relative z-20 ml-auto -mt-20 w-[78%] rounded-xl overflow-hidden bg-white border border-[#CBD5E1] shadow-[0_24px_50px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
            <span className="text-[11px] font-semibold text-[#0F172A]">StackCP Cloud Panel</span>
            <span className="text-[10px] font-semibold text-[#0E6B63]">Autoscaling</span>
          </div>

          <div className="p-3.5 bg-white">
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
              <span className="text-[11px] font-bold text-[#0F172A]">Performance &amp; Web Files</span>
              <span className="text-[10px] text-slate-500">Click module to preview</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'edge', label: 'Edge Cache', icon: Gauge },
                { key: 'files', label: 'File Manager', icon: FolderOpen },
                { key: 'email', label: 'Mailboxes', icon: Mail },
                { key: 'security', label: 'DDoS Shield', icon: Lock },
              ].map((mod) => {
                const Icon = mod.icon;
                const active = activeTool === mod.key;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => setActiveTool(mod.key as typeof activeTool)}
                    className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F2FAF8] border-[#0E6B63] text-[#0E6B63]'
                        : 'bg-[#F8FAFC] border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="block text-[10px] font-semibold leading-tight">
                      {mod.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 px-2.5 py-2 rounded-lg bg-[#F8FAFC] border border-slate-100 text-[11px] text-slate-600">
              {activeTool === 'edge' && 'NVMe Edge Cache & compression active across edge nodes.'}
              {activeTool === 'files' && 'Direct cloud browser file manager with WebFTP access.'}
              {activeTool === 'email' && 'Authenticated IMAP/SMTP accounts managed in one place.'}
              {activeTool === 'security' && 'Automated malware scanner and perimeter DDoS filtering.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Clean overlapping browser mockup illustrating Softaculous App Installer
 * and Managed WordPress Toolkit inside concentric dashed geometric rings.
 */
export const WpToolkitVisual: React.FC = () => {
  return (
    <div className="relative py-6 px-3 sm:px-6 flex items-center justify-center min-h-[380px] select-none">
      <div className="relative w-full max-w-[540px]">
        <div
          className="absolute -top-4 right-1/4 w-44 h-44 rounded-full bg-[#DCEFED] opacity-85 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-5 left-12 w-36 h-36 rounded-full bg-[#F5EDE2] opacity-80 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-2 rounded-full border border-dashed border-slate-300/80 pointer-events-none"
          aria-hidden="true"
        />

        {/* Back Frame: Softaculous & App Runtimes */}
        <div className="relative z-10 w-[86%] rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-[0_18px_40px_-18px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#162032] text-white">
            <span className="text-[11px] font-semibold">Softaculous® · 300+ Apps</span>
            <span className="text-[10px] text-[#34D399]">PHP · Node.js · Python</span>
          </div>

          <div className="grid grid-cols-12 min-h-[200px]">
            <div className="col-span-4 bg-[#1E293B] text-slate-300 p-3 text-[11px] space-y-1.5">
              <div className="text-white font-semibold bg-[#0E6B63] px-2 py-1 rounded">WordPress</div>
              <div className="px-2 py-0.5">WooCommerce</div>
              <div className="px-2 py-0.5">Laravel PHP</div>
              <div className="px-2 py-0.5">Node.js App</div>
              <div className="px-2 py-0.5">Python WSGI</div>
            </div>
            <div className="col-span-8 p-4 bg-white">
              <p className="text-xs font-bold text-[#0F172A]">One-Click Installer Ready</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Install Managed WordPress, setup databases, and isolate site runtimes directly inside cPanel.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-[#F2FAF8] border border-[#0E6B63]/15 font-semibold text-[#0E6B63]">
                  Auto SSL Active
                </div>
                <div className="p-2 rounded bg-[#F8FAFC] border border-slate-200 font-semibold text-slate-700">
                  PHP 8.3 Ready
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foreground Window: WordPress Staging & Backups */}
        <div className="relative z-20 ml-auto -mt-20 w-[78%] rounded-xl overflow-hidden bg-white border border-[#CBD5E1] shadow-[0_24px_50px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#0F172A]">WordPress Staging &amp; Backups</span>
            <Globe className="w-3.5 h-3.5 text-[#0E6B63]" />
          </div>
          <div className="p-3.5 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[#F8FAFC] border border-slate-100">
                <RefreshCw className="w-4 h-4 text-[#0E6B63] mx-auto mb-1" />
                <span className="block text-[10px] font-semibold text-[#0F172A]">Auto Backups</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F8FAFC] border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-[#0E6B63] mx-auto mb-1" />
                <span className="block text-[10px] font-semibold text-[#0F172A]">Malware Scan</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F8FAFC] border border-slate-100">
                <Terminal className="w-4 h-4 text-[#0E6B63] mx-auto mb-1" />
                <span className="block text-[10px] font-semibold text-[#0F172A]">WP-CLI Ready</span>
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#0F172A] text-white flex items-center justify-between text-[11px]">
              <span>NVMe Database &amp; Object Storage</span>
              <span className="font-semibold text-[#34D399]">99.99% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
