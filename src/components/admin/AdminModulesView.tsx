import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  PlugZap,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  ProvisioningModuleRecord,
  ProvisioningModuleType,
  usePlatform,
} from '../../context/PlatformContext';

interface AdminModulesViewProps {
  onShowToast: (msg: string) => void;
}

export const AdminModulesView: React.FC<AdminModulesViewProps> = ({
  onShowToast,
}) => {
  const {
    provisioningModules,
    saveProvisioningModule,
    createProvisioningModule,
    deleteProvisioningModule,
  } = usePlatform();

  const [selectedId, setSelectedId] = useState<string>(
    provisioningModules[0]?.id ?? ''
  );
  const [creatingNew, setCreatingNew] = useState(false);

  const activeModule =
    provisioningModules.find((m) => m.id === selectedId) ??
    provisioningModules[0] ??
    null;

  // Editor State
  const [name, setName] = useState(activeModule?.name ?? '');
  const [moduleType, setModuleType] = useState<ProvisioningModuleType>(
    activeModule?.moduleType ?? 'whm'
  );
  const [hostname, setHostname] = useState(activeModule?.hostname ?? '');
  const [port, setPort] = useState(String(activeModule?.port ?? 2087));
  const [useSsl, setUseSsl] = useState(activeModule?.useSsl ?? true);
  const [username, setUsername] = useState(activeModule?.username ?? 'root');
  const [apiToken, setApiToken] = useState(activeModule?.apiToken ?? '');
  const [showToken, setShowToken] = useState(false);
  const [ignoreSslErrors, setIgnoreSslErrors] = useState(
    activeModule?.ignoreSslErrors ?? false
  );
  const [ns1, setNs1] = useState(
    activeModule?.nameservers[0] ?? 'ns1.cpcloudhost.com'
  );
  const [ns2, setNs2] = useState(
    activeModule?.nameservers[1] ?? 'ns2.cpcloudhost.com'
  );
  const [autoProvisionEnabled, setAutoProvisionEnabled] = useState(
    activeModule?.autoProvisionEnabled ?? true
  );
  const [enabled, setEnabled] = useState(activeModule?.enabled ?? true);
  const [packagesText, setPackagesText] = useState(
    (activeModule?.packages ?? []).join(', ')
  );

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testDiagnostic, setTestDiagnostic] = useState<{
    ok: boolean;
    status: 'Success' | 'Fail';
    code?: string;
    message: string;
    version?: string;
    latencyMs?: number;
    packagesFound?: string[];
    checkedAtUtc?: string;
  } | null>(null);
  const [formError, setFormError] = useState('');

  const loadModuleIntoForm = (mod: ProvisioningModuleRecord) => {
    setCreatingNew(false);
    setSelectedId(mod.id);
    setName(mod.name);
    setModuleType(mod.moduleType);
    setHostname(mod.hostname);
    setPort(String(mod.port));
    setUseSsl(mod.useSsl);
    setUsername(mod.username);
    setApiToken(mod.apiToken);
    setIgnoreSslErrors(mod.ignoreSslErrors);
    setNs1(mod.nameservers[0]);
    setNs2(mod.nameservers[1]);
    setAutoProvisionEnabled(mod.autoProvisionEnabled);
    setEnabled(mod.enabled);
    setPackagesText(mod.packages.join(', '));
    setFormError('');
    setTestDiagnostic(null);
  };

  const openCreateForm = () => {
    setCreatingNew(true);
    setName('New WHM / cPanel Server');
    setModuleType('whm');
    setHostname('');
    setPort('2087');
    setUseSsl(true);
    setUsername('root');
    setApiToken('');
    setIgnoreSslErrors(false);
    setNs1('ns1.cpcloudhost.com');
    setNs2('ns2.cpcloudhost.com');
    setAutoProvisionEnabled(true);
    setEnabled(true);
    setPackagesText('cpcloud_ignite, cpcloud_velocity');
    setFormError('');
    setTestDiagnostic(null);
  };

  const parsePackages = (raw: string): string[] =>
    Array.from(
      new Set(
        raw
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPort = parseInt(port, 10) || 2087;
    if (!name.trim() || !hostname.trim()) {
      setFormError('Server Name and Hostname/IP are required.');
      return;
    }

    const pkgs = parsePackages(packagesText);

    if (creatingNew) {
      const res = createProvisioningModule({
        name: name.trim(),
        moduleType,
        hostname: hostname.trim(),
        port: parsedPort,
        useSsl,
        username: username.trim() || 'root',
        apiToken: apiToken.trim(),
        ignoreSslErrors,
        nameservers: [
          ns1.trim() || 'ns1.cpcloudhost.com',
          ns2.trim() || 'ns2.cpcloudhost.com',
        ],
        autoProvisionEnabled,
        packages: pkgs,
      });
      if (!res.ok || !res.module) {
        setFormError(res.error || 'Could not add module.');
        return;
      }
      setCreatingNew(false);
      setSelectedId(res.module.id);
      setFormError('');
      onShowToast(`Added server module ${res.module.name}`);
      return;
    }

    if (!activeModule) return;
    const res = saveProvisioningModule(activeModule.id, {
      name: name.trim(),
      moduleType,
      hostname: hostname.trim(),
      port: parsedPort,
      useSsl,
      username: username.trim() || 'root',
      apiToken: apiToken.trim(),
      ignoreSslErrors,
      nameservers: [
        ns1.trim() || 'ns1.cpcloudhost.com',
        ns2.trim() || 'ns2.cpcloudhost.com',
      ],
      autoProvisionEnabled,
      enabled,
      packages: pkgs,
    });
    if (!res.ok) {
      setFormError(res.error || 'Unable to save module.');
      return;
    }
    setFormError('');
    onShowToast(`Saved ${name.trim()} module configuration`);
  };

  const handleRealWhmConnectionTest = async () => {
    const cleanHost = hostname.trim();
    const cleanUser = username.trim() || 'root';
    const cleanToken = apiToken.trim();
    const parsedPort = parseInt(port, 10) || 2087;

    if (!cleanHost) {
      setFormError('Enter your WHM server hostname or IP before testing.');
      return;
    }
    if (!cleanToken) {
      setFormError('Enter your WHM API Token (generated in WHM -> Manage API Tokens).');
      return;
    }

    setFormError('');
    const targetId = activeModule?.id || 'draft';
    setTestingId(targetId);
    setTestDiagnostic(null);

    try {
      const response = await fetch('/api/modules/whm/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: cleanHost,
          port: parsedPort,
          useSsl,
          username: cleanUser,
          apiToken: cleanToken,
          ignoreSslErrors,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        status?: 'Success' | 'Fail';
        code?: string;
        version?: string;
        packages?: string[];
        latencyMs?: number;
        checkedAtUtc?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        const errMsg =
          payload.error ||
          `WHM HTTP ${response.status} connection failed. Verify hostname, username, and API token.`;
        setTestDiagnostic({
          ok: false,
          status: 'Fail',
          code: payload.code || `HTTP_${response.status}`,
          latencyMs: payload.latencyMs,
          checkedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          message: errMsg,
        });
        if (!creatingNew && activeModule) {
          saveProvisioningModule(activeModule.id, {
            hostname: cleanHost,
            port: parsedPort,
            useSsl,
            username: cleanUser,
            apiToken: cleanToken,
            ignoreSslErrors,
            lastConnectionStatus: 'error',
            lastConnectionMessage: errMsg,
            lastTestedAtUtc:
              payload.checkedAtUtc ||
              new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          });
        }
        return;
      }

      const fetchedPackages = payload.packages ?? [];
      const mergedPackages =
        fetchedPackages.length > 0 ? fetchedPackages : parsePackages(packagesText);
      if (fetchedPackages.length > 0) {
        setPackagesText(fetchedPackages.join(', '));
      }

      setTestDiagnostic({
        ok: true,
        status: 'Success',
        code: 'HTTP_200',
        message: `Connected cleanly to WHM ${payload.version || 'API'}${
          fetchedPackages.length > 0
            ? ` · Synced ${fetchedPackages.length} server packages`
            : ''
        }`,
        version: payload.version,
        latencyMs: payload.latencyMs,
        packagesFound: fetchedPackages,
        checkedAtUtc: payload.checkedAtUtc,
      });

      if (!creatingNew && activeModule) {
        saveProvisioningModule(activeModule.id, {
          name: name.trim() || activeModule.name,
          hostname: cleanHost,
          port: parsedPort,
          useSsl,
          username: cleanUser,
          apiToken: cleanToken,
          ignoreSslErrors,
          packages: mergedPackages,
          lastConnectionStatus: 'connected',
          lastWhmVersion: payload.version || 'WHM JSON API',
          lastConnectionMessage: `Success (${payload.latencyMs ?? 0} ms) · ${mergedPackages.length} packages`,
          lastTestedAtUtc:
            payload.checkedAtUtc ||
            new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        });
      }
      onShowToast('WHM Server connection verified (Success)');
    } catch (err) {
      setTestDiagnostic({
        ok: false,
        status: 'Fail',
        code: 'NETWORK_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'Network error reaching backend WHM connector.',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#0F172A]">
            Server &amp; Provisioning Modules (WHM / cPanel / StackCP / KVM)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect your real WHM server with an API Token, verify live connectivity, and sync server packages into Hosting Plans.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add Server Module</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left List of Modules */}
        <div className="xl:col-span-4 space-y-3">
          {provisioningModules.map((mod) => {
            const isSelected = !creatingNew && activeModule?.id === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => loadModuleIntoForm(mod)}
                className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#F2FAF8] border-[#0E6B63]'
                    : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-block font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 mb-1.5">
                      {mod.moduleType}
                    </span>
                    <h3 className="font-display text-sm font-bold text-[#0F172A] truncate">
                      {mod.name}
                    </h3>
                    <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                      {mod.hostname}:{mod.port}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                      mod.lastConnectionStatus === 'connected'
                        ? 'bg-[#16A34A]/10 text-[#16A34A]'
                        : mod.lastConnectionStatus === 'error'
                        ? 'bg-[#DC2626]/10 text-[#DC2626]'
                        : 'bg-amber-50 text-[#D97706]'
                    }`}
                  >
                    {mod.lastConnectionStatus === 'connected'
                      ? 'CONNECTED'
                      : mod.lastConnectionStatus === 'error'
                      ? 'ERROR'
                      : 'UNTESTED'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{mod.packages.length} packages synced</span>
                  <span className="font-semibold text-[#0E6B63]">
                    {mod.autoProvisionEnabled ? 'Auto-Provision ON' : 'Manual'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Module Config & Real WHM Test Connection */}
        <div className="xl:col-span-8">
          <form
            onSubmit={handleSaveModule}
            className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#0E6B63]/10 text-[#0E6B63] flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    {creatingNew
                      ? 'Configure New Provisioning Module'
                      : name || activeModule?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {moduleType === 'whm'
                      ? 'Live WHM JSON-API v1 connector (port 2087 · /json-api/version & /json-api/listpkgs)'
                      : 'Infrastructure provisioning endpoint configuration'}
                  </p>
                </div>
              </div>

              {!creatingNew && activeModule && provisioningModules.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const res = deleteProvisioningModule(activeModule.id);
                    if (res.ok) {
                      onShowToast(`Removed ${activeModule.name}`);
                      const remaining = provisioningModules.find(
                        (m) => m.id !== activeModule.id
                      );
                      if (remaining) loadModuleIntoForm(remaining);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#DC2626] border border-red-200 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Delete Module</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Server Display Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="London WHM / cPanel Node (UK-01)"
                  className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Module Type
                </label>
                <select
                  value={moduleType}
                  onChange={(e) => {
                    const next = e.target.value as ProvisioningModuleType;
                    setModuleType(next);
                    if (next === 'whm') setPort('2087');
                    else if (next === 'proxmox') setPort('8006');
                    else setPort('443');
                  }}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                >
                  <option value="whm">WHM / cPanel (Real API)</option>
                  <option value="stackcp">StackCP Cloud Cluster</option>
                  <option value="proxmox">Proxmox KVM Node</option>
                  <option value="registrar">Domain Registrar EPP</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  WHM Hostname or Server IP *
                </label>
                <input
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="server1.yourdomain.com or 192.0.2.10"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  API Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  WHM / Root Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="root"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  WHM API Token *
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Paste your WHM API Token here"
                    className="w-full pr-10 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                  >
                    {showToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Primary Nameserver (NS1)
                </label>
                <input
                  type="text"
                  value={ns1}
                  onChange={(e) => setNs1(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Secondary Nameserver (NS2)
                </label>
                <input
                  type="text"
                  value={ns2}
                  onChange={(e) => setNs2(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div className="flex flex-col justify-end gap-1.5">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSsl}
                    onChange={(e) => setUseSsl(e.target.checked)}
                    className="rounded border-slate-300 text-[#0E6B63]"
                  />
                  <span>Use HTTPS SSL (Port 2087)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ignoreSslErrors}
                    onChange={(e) => setIgnoreSslErrors(e.target.checked)}
                    className="rounded border-slate-300 text-[#0E6B63]"
                  />
                  <span>Ignore Self-Signed SSL Cert</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Server Hosting Packages (Comma-separated · Automatically updated on Test WHM Connection)
              </label>
              <textarea
                rows={2}
                value={packagesText}
                onChange={(e) => setPackagesText(e.target.value)}
                placeholder="cpcloud_ignite, cpcloud_velocity, cpcloud_zenith"
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoProvisionEnabled}
                  onChange={(e) => setAutoProvisionEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Enable Automated Account Provisioning</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Module Active</span>
              </label>
            </div>

            {/* Live Connection Test Box */}
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">
                      Real WHM Server Connection Diagnostics
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Executes live WHM API authentication check and fetches available cPanel packages.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={testingId !== null}
                  onClick={handleRealWhmConnectionTest}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] disabled:opacity-60 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {testingId !== null ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Pinging WHM Server...</span>
                    </>
                  ) : (
                    <>
                      <PlugZap className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
              </div>

              {testDiagnostic && (
                <div
                  role="status"
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                    testDiagnostic.ok
                      ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                      : 'bg-red-50 border-red-200 text-[#DC2626]'
                  }`}
                >
                  {testDiagnostic.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          testDiagnostic.ok
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-[#DC2626] text-white'
                        }`}
                      >
                        Status: {testDiagnostic.status}
                      </span>
                      {testDiagnostic.code && (
                        <span className="font-mono text-[11px] font-semibold">
                          [{testDiagnostic.code}]
                        </span>
                      )}
                      {testDiagnostic.latencyMs !== undefined && (
                        <span className="font-mono tabular-nums text-[11px]">
                          {testDiagnostic.latencyMs} ms
                        </span>
                      )}
                    </div>
                    <p className="font-semibold leading-relaxed">
                      {testDiagnostic.message}
                    </p>
                    {testDiagnostic.packagesFound &&
                      testDiagnostic.packagesFound.length > 0 && (
                        <p className="font-mono text-[11px]">
                          Packages synced: {testDiagnostic.packagesFound.join(', ')}
                        </p>
                      )}
                  </div>
                </div>
              )}

              {!testDiagnostic && activeModule && !creatingNew && (
                <div className="text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                  <span>
                    Last status:{' '}
                    <strong className="uppercase">{activeModule.lastConnectionStatus}</strong>
                    {activeModule.lastWhmVersion ? ` · ${activeModule.lastWhmVersion}` : ''}
                    {activeModule.lastConnectionMessage
                      ? ` · ${activeModule.lastConnectionMessage}`
                      : ''}
                  </span>
                </div>
              )}
            </div>

            {formError && (
              <p className="text-xs font-semibold text-[#DC2626]">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {creatingNew && (
                <button
                  type="button"
                  onClick={() => {
                    setCreatingNew(false);
                    if (activeModule) loadModuleIntoForm(activeModule);
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
              >
                {creatingNew ? 'Save New Module' : 'Save Module Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
