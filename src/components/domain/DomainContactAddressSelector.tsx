import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  DomainContactAddress,
  usePlatform,
} from '../../context/PlatformContext';
import {
  findCountryOption,
  getStatesForCountry,
  WORLD_COUNTRIES,
} from '../../data/worldRegions';

interface DomainContactAddressSelectorProps {
  selectedContactId: string | null;
  onSelectContact: (contact: DomainContactAddress) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  onSaveNotice?: (msg: string) => void;
}

export const DomainContactAddressSelector: React.FC<
  DomainContactAddressSelectorProps
> = ({
  selectedContactId,
  onSelectContact,
  title = 'WHOIS Registrant & Billing Contact Address',
  subtitle = 'Required by ICANN / registry rules for domain ownership. Saved addresses are reused automatically across registrations and transfers.',
  compact = false,
  onSaveNotice,
}) => {
  const {
    currentUser,
    domainContactAddresses,
    saveDomainContactAddress,
    deleteDomainContactAddress,
    setDefaultDomainContactAddress,
  } = usePlatform();

  const [showAddForm, setShowAddForm] = useState(
    () => domainContactAddresses.length === 0
  );

  // Form state for adding a new WHOIS contact address
  const defaultCountry = findCountryOption(currentUser?.country || 'Pakistan');
  const [label, setLabel] = useState('');
  const [firstName, setFirstName] = useState(
    () => currentUser?.name?.split(' ')[0] || ''
  );
  const [lastName, setLastName] = useState(
    () => currentUser?.name?.split(' ').slice(1).join(' ') || ''
  );
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState(() => currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [countryCode, setCountryCode] = useState(defaultCountry.code);
  const [stateProvince, setStateProvince] = useState(
    defaultCountry.states[0] || ''
  );
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [formError, setFormError] = useState('');

  const availableStates = getStatesForCountry(countryCode);
  const activeCountryObj = findCountryOption(countryCode);

  // Automatically pre-select default or first saved address so user never re-types
  useEffect(() => {
    if (domainContactAddresses.length === 0) return;
    const stillValid = domainContactAddresses.find(
      (c) => c.id === selectedContactId
    );
    if (!stillValid) {
      const def =
        domainContactAddresses.find((c) => c.isDefault) ||
        domainContactAddresses[0];
      if (def) {
        onSelectContact(def);
      }
    }
  }, [domainContactAddresses, selectedContactId, onSelectContact]);

  useEffect(() => {
    if (domainContactAddresses.length > 0 && showAddForm && selectedContactId) {
      // keep user choice
    } else if (domainContactAddresses.length === 0) {
      setShowAddForm(true);
    }
  }, [domainContactAddresses.length, selectedContactId, showAddForm]);

  const handleCountryChange = (nextCode: string) => {
    setCountryCode(nextCode);
    const nextStates = getStatesForCountry(nextCode);
    setStateProvince(nextStates[0] || '');
    setFormError('');
  };

  const resetForm = () => {
    const matched = findCountryOption(currentUser?.country || 'Pakistan');
    setLabel('');
    setFirstName(currentUser?.name?.split(' ')[0] || '');
    setLastName(currentUser?.name?.split(' ').slice(1).join(' ') || '');
    setOrganization('');
    setEmail(currentUser?.email || '');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCountryCode(matched.code);
    setStateProvince(matched.states[0] || '');
    setCity('');
    setPostalCode('');
    setIsDefault(domainContactAddresses.length === 0);
    setFormError('');
  };

  const handleSaveNewAddress = () => {
    setFormError('');
    const result = saveDomainContactAddress({
      label: label || `${city.trim() || 'Primary'} Address`,
      firstName,
      lastName,
      organization,
      email,
      phone,
      addressLine1,
      addressLine2,
      countryCode: activeCountryObj.code,
      countryName: activeCountryObj.name,
      stateProvince,
      city,
      postalCode,
      isDefault,
    });
    if (!result.ok || !result.address) {
      setFormError(result.error || 'Please verify all required address fields.');
      return;
    }
    onSelectContact(result.address);
    setShowAddForm(false);
    resetForm();
    if (onSaveNotice) {
      onSaveNotice(`WHOIS address saved & selected (${result.address.city}, ${result.address.countryName})`);
    }
  };

  return (
    <div
      className={`border border-[#CBD5E1] rounded-2xl bg-[#F8FAFC] ${
        compact ? 'p-4' : 'p-5'
      } space-y-4`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setFormError('');
          }}
          className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            showAddForm
              ? 'border border-[#CBD5E1] bg-white text-slate-700 hover:border-[#0F172A]'
              : 'bg-[#0E6B63] hover:bg-[#0A534D] text-white'
          }`}
        >
          {showAddForm ? (
            <>
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Close Form</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {domainContactAddresses.length > 0 ? 'Add New Address' : 'Add Address'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Saved WHOIS Addresses (Auto-selected; never requires re-typing) */}
      {domainContactAddresses.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Saved WHOIS Addresses ({domainContactAddresses.length}) — click to assign
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {domainContactAddresses.map((addr) => {
              const isSelected = selectedContactId === addr.id;
              return (
                <div
                  key={addr.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectContact(addr)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectContact(addr);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                      : 'bg-white/85 border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#0E6B63]' : 'text-slate-300'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-display text-xs font-bold text-[#0F172A] truncate">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-[#0E6B63] uppercase tracking-wide shrink-0">
                          · Default
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            setDefaultDomainContactAddress(addr.id);
                            onSelectContact(addr);
                          }}
                          className="text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}
                      {domainContactAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteDomainContactAddress(addr.id)}
                          aria-label={`Delete ${addr.label}`}
                          className="text-slate-400 hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-600 pl-6">
                    <p className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>
                        {addr.firstName} {addr.lastName}
                      </span>
                    </p>
                    {addr.organization && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>{addr.organization}</span>
                      </p>
                    )}
                    <p className="text-[11px] leading-snug">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                    </p>
                    <p className="text-[11px] font-medium text-[#0F172A]">
                      {addr.city}, {addr.stateProvince}, {addr.countryName} · {addr.postalCode}
                    </p>
                    <div className="pt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" aria-hidden="true" />
                        {addr.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" aria-hidden="true" />
                        {addr.phone}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New WHOIS Contact Address Form */}
      {showAddForm && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
            <div>
              <h4 className="font-display text-sm font-bold text-[#0F172A]">
                Add WHOIS Contact Address
              </h4>
              <p className="text-[11px] text-slate-500">
                Select your country to load the state/province list automatically. Saved for instant reuse.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g. Mudassar"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g. Rana"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Organization / Company (Optional)
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Acme Cloud Ltd"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Address Label (Optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Primary Office, Personal"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                WHOIS Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="owner@company.com"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Phone Number ({activeCountryObj.dialCode}) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder={`${activeCountryObj.dialCode} 300 0000000`}
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg font-mono focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Street Address Line 1 *
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => {
                  setAddressLine1(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="House / Office No., Street Name, Sector"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Street Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Suite, Floor, Landmark"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Country *
              </label>
              <select
                value={countryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              >
                {WORLD_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                State / Province / Region *
              </label>
              <select
                value={stateProvince}
                onChange={(e) => {
                  setStateProvince(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g. Lahore, London, Dubai"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Postal / ZIP Code *
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g. 54660"
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg font-mono focus:outline-none focus:border-[#0E6B63]"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
            />
            <span>Save as default WHOIS address for future domain registrations &amp; transfers</span>
          </label>

          {formError && (
            <p role="alert" className="text-xs font-semibold text-[#DC2626]">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            {domainContactAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                }}
                className="min-h-[38px] px-4 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveNewAddress}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Save &amp; Select Address</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
