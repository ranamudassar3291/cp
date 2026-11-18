import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, UserPlus, X } from 'lucide-react';
import { ManagedUserAccount } from '../../context/PlatformContext';

interface SearchableClientSelectProps {
  users: ManagedUserAccount[];
  valueEmail: string;
  onChange: (selection: {
    email: string;
    name: string;
    country: string;
    existingUser?: ManagedUserAccount;
  }) => void;
  placeholder?: string;
  label?: string;
  allowNewEmail?: boolean;
}

export const SearchableClientSelect: React.FC<SearchableClientSelectProps> = ({
  users,
  valueEmail,
  onChange,
  placeholder = 'Select client by name or email...',
  label,
  allowNewEmail = true,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    } else {
      setQuery('');
    }
  }, [open]);

  const sortedUsers = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const aClient = a.role === 'admin' ? 1 : 0;
      const bClient = b.role === 'admin' ? 1 : 0;
      if (aClient !== bClient) return aClient - bClient;
      return a.name.localeCompare(b.name);
    });
    return copy;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedUsers;
    return sortedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [sortedUsers, query]);

  const selectedUser = useMemo(() => {
    const lower = valueEmail.trim().toLowerCase();
    if (!lower) return undefined;
    return users.find((u) => u.email.toLowerCase() === lower);
  }, [users, valueEmail]);

  const trimmedQuery = query.trim();
  const queryLooksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedQuery);
  const queryExactMatch = sortedUsers.some(
    (u) => u.email.toLowerCase() === trimmedQuery.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full min-h-[42px] px-3 py-2 rounded-lg border text-left flex items-center justify-between gap-2 bg-white transition-colors cursor-pointer ${
          open
            ? 'border-[#0E6B63] ring-1 ring-[#0E6B63]'
            : 'border-[#CBD5E1] hover:border-slate-400'
        }`}
      >
        <div className="min-w-0 flex-1">
          {selectedUser ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-[#0F172A] truncate">
                {selectedUser.name}
              </span>
              <span className="font-mono text-[11px] text-slate-500 truncate">
                {selectedUser.email}
              </span>
            </div>
          ) : valueEmail.trim() ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-[#0E6B63] truncate">
                New Client:
              </span>
              <span className="font-mono text-[11px] text-[#0F172A] truncate">
                {valueEmail.trim()}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {valueEmail && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selected client"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ email: '', name: '', country: 'International' });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange({ email: '', name: '', country: 'International' });
                }
              }}
              className="p-0.5 rounded text-slate-400 hover:text-[#0F172A]"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1.5 bg-white border border-[#CBD5E1] rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-[#F8FAFC]">
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by client name or email..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                No matching accounts found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected =
                  u.email.toLowerCase() === valueEmail.trim().toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        email: u.email,
                        name: u.name,
                        country: u.country,
                        existingUser: u,
                      });
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#F4FAF9] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#F2FAF8]' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#0F172A] truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {u.role}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 truncate">
                        {u.email}
                      </div>
                    </div>
                    {isSelected && (
                      <Check
                        className="w-3.5 h-3.5 text-[#0E6B63] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })
            )}

            {allowNewEmail && queryLooksLikeEmail && !queryExactMatch && (
              <button
                type="button"
                onClick={() => {
                  onChange({
                    email: trimmedQuery.toLowerCase(),
                    name: trimmedQuery.split('@')[0] || 'Client',
                    country: 'International',
                  });
                  setOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left flex items-center gap-2 bg-[#F2FAF8] hover:bg-[#E6F5F2] text-xs font-semibold text-[#0E6B63] cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  Provision for new client: <span className="font-mono">{trimmedQuery}</span>
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
