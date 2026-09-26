import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../../context/CrmContext';
import { Search, X, Briefcase, Users, Target, Building2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { globalSearch } = useCrm();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = globalSearch(query);
  const hasResults =
    results.deals.length > 0 ||
    results.leads.length > 0 ||
    results.contacts.length > 0 ||
    results.companies.length > 0;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6 md:p-20 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-200 animate-fade-in">
          {/* Search Header Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search deals, leads, contacts, companies... (Type to search)"
              className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="ml-3 hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
            {!query && (
              <div className="py-8 text-center text-xs text-slate-400">
                Type keywords like company names, contacts, or opportunities to search across ZanCRM.
              </div>
            )}

            {query && !hasResults && (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No records found for "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">Try another keyword or filter.</p>
              </div>
            )}

            {/* Deals */}
            {results.deals.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Deals ({results.deals.length})
                </div>
                <div className="space-y-1">
                  {results.deals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => handleNavigate('/deals')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{deal.title}</div>
                        <div className="text-[11px] text-slate-500">{deal.companyName} • {formatCurrency(deal.value)}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leads */}
            {results.leads.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Leads ({results.leads.length})
                </div>
                <div className="space-y-1">
                  {results.leads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => handleNavigate('/leads')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{lead.name}</div>
                        <div className="text-[11px] text-slate-500">{lead.company} • Score: {lead.score}/100</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts */}
            {results.contacts.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Contacts ({results.contacts.length})
                </div>
                <div className="space-y-1">
                  {results.contacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => handleNavigate('/contacts')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{contact.name}</div>
                        <div className="text-[11px] text-slate-500">{contact.title} at {contact.companyName}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Companies */}
            {results.companies.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Companies ({results.companies.length})
                </div>
                <div className="space-y-1">
                  {results.companies.map(company => (
                    <div
                      key={company.id}
                      onClick={() => handleNavigate('/contacts')}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{company.name}</div>
                        <div className="text-[11px] text-slate-500">{company.industry} • {company.city}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
