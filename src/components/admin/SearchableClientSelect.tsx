import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, UserCheck, X } from 'lucide-react';
import { ManagedUserAccount } from '../../context/PlatformContext';

interface SearchableClientSelectProps {
  users: ManagedUserAccount[];
  selectedUserId?: string;
  selectedEmail?: string;
  onSelect: (user: ManagedUserAccount) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  excludeEmail?: string;
}

export const SearchableClientSelect: React.FC<SearchableClientSelectProps> = ({
  users,
  selectedUserId,
  selectedEmail,
  onSelect,
  placeholder = 'Search client by full name, email, or company...',
  label = 'Select Client Account',
  required = false,
  excludeEmail,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const clientList = useMemo(() => {
    const cleanExclude = excludeEmail?.trim().toLowerCase();
    return users.filter((u) => {
      if (cleanExclude && u.email.toLowerCase() === cleanExclude) return false;
      return true;
    });
  }, [users, excludeEmail]);

  const selectedUser = useMemo(() => {
    if (selectedUserId) {
      const byId = clientList.find((u) => u.id === selectedUserId);
      if (byId) return byId;
    }
    if (selectedEmail) {
      const lower = selectedEmail.trim().toLowerCase();
      return clientList.find((u) => u.email.toLowerCase() === lower);
    }
    return undefined;
  }, [clientList, selectedUserId, selectedEmail]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientList;
    return clientList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [clientList, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border text-left transition-colors bg-white cursor-pointer ${
          open
            ? 'border-[#0E6B63] ring-2 ring-[#0E6B63]/15'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {selectedUser ? (
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-[#E6F4F1] text-[#0E6B63] flex items-center justify-center text-xs font-bold shrink-0">
              {selectedUser.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                <span>{selectedUser.name}</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  ({selectedUser.id})
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {selectedUser.email}
                {selectedUser.company ? ` · ${selectedUser.company}` : ''}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs sm:text-sm text-slate-400 truncate">
            {placeholder}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type name, email, or company..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Clear client search"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No registered clients match &ldquo;{query}&rdquo;.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedUser?.id === client.id;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onSelect(client);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#E6F4F1]/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#0E6B63] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-2">
                          <span>{client.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                            {client.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {client.email}
                          {client.company ? ` · ${client.company}` : ''}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check
                        className="w-4 h-4 text-[#0E6B63] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
