import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Input';
import { exportToCSV, parseCSV, formatCurrency } from '../../utils/formatters';
import {
  Database,
  Upload,
  Download,
  CheckCircle2,
  Search,
  Briefcase,
  Users,
  Target,
  Building2,
} from 'lucide-react';

export const DataManagementPage: React.FC = () => {
  const { leads, deals, contacts, companies, createLead, createContact, addToast, globalSearch } = useCrm();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = globalSearch(searchQuery);

  // Import state
  const [importTarget, setImportTarget] = useState<'leads' | 'contacts'>('leads');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const rows = parseCSV(content);
        setParsedRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);

    try {
      let count = 0;
      for (const row of parsedRows) {
        if (importTarget === 'leads') {
          await createLead({
            name: row['Contact Name'] || row['name'] || 'Imported Lead',
            company: row['Company'] || row['company'] || 'Unspecified Corp',
            email: row['Email'] || row['email'] || 'contact@example.com',
            phone: row['Phone'] || row['phone'] || '',
            source: 'website',
            status: 'new',
            score: 75,
            estimatedValue: Number(row['Estimated Value'] || row['value'] || 30000),
            assignedTo: 'usr_01',
            notes: 'Imported via CSV batch tool',
          });
          count++;
        } else if (importTarget === 'contacts') {
          await createContact({
            name: row['Contact Name'] || row['name'] || 'Imported Contact',
            title: row['Job Title'] || row['title'] || 'Stakeholder',
            companyName: row['Company'] || row['company'] || 'Partner Org',
            email: row['Email'] || row['email'] || 'contact@example.com',
            phone: row['Phone'] || row['phone'] || '',
            lifecycleStage: 'lead',
            assignedTo: 'usr_01',
          });
          count++;
        }
      }

      addToast({
        type: 'success',
        title: 'Batch Import Complete',
        message: `Successfully imported ${count} records into ${importTarget}.`,
      });
      setParsedRows([]);
      setFileName('');
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: 'Could not parse some rows. Please verify CSV column headers.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportFullJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      leads,
      deals,
      contacts,
      companies,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute('download', `ZanCRM_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Search, Import & Export Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform multi-entity queries, export formatted CSVs, and bulk import contacts and leads
        </p>
      </div>

      {/* Global Comprehensive Search */}
      <Card>
        <CardHeader
          title="Universal CRM Search"
          subtitle="Query contacts, deals, companies, and leads simultaneously"
        />
        <CardBody className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across all records (e.g. 'Vertex', 'Sarah', 'Agreement', 'Fintech')..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
            />
          </div>

          {searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Deals results */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-brand-600" /> Deals ({searchResults.deals.length})
                </div>
                <div className="space-y-2">
                  {searchResults.deals.map(d => (
                    <div key={d.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{d.title}</div>
                      <div className="text-slate-500">{formatCurrency(d.value)} • {d.stage}</div>
                    </div>
                  ))}
                  {searchResults.deals.length === 0 && (
                    <div className="text-xs text-slate-400 py-2">No matching deals</div>
                  )}
                </div>
              </div>

              {/* Leads results */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Target className="w-3.5 h-3.5 text-amber-600" /> Leads ({searchResults.leads.length})
                </div>
                <div className="space-y-2">
                  {searchResults.leads.map(l => (
                    <div key={l.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{l.name}</div>
                      <div className="text-slate-500">{l.company} • Score: {l.score}</div>
                    </div>
                  ))}
                  {searchResults.leads.length === 0 && (
                    <div className="text-xs text-slate-400 py-2">No matching leads</div>
                  )}
                </div>
              </div>

              {/* Contacts results */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> Contacts ({searchResults.contacts.length})
                </div>
                <div className="space-y-2">
                  {searchResults.contacts.map(c => (
                    <div key={c.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-slate-500">{c.companyName} • {c.title}</div>
                    </div>
                  ))}
                  {searchResults.contacts.length === 0 && (
                    <div className="text-xs text-slate-400 py-2">No matching contacts</div>
                  )}
                </div>
              </div>

              {/* Companies results */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" /> Companies ({searchResults.companies.length})
                </div>
                <div className="space-y-2">
                  {searchResults.companies.map(comp => (
                    <div key={comp.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{comp.name}</div>
                      <div className="text-slate-500">{comp.industry} • {comp.city}</div>
                    </div>
                  ))}
                  {searchResults.companies.length === 0 && (
                    <div className="text-xs text-slate-400 py-2">No matching companies</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Grid: Bulk CSV Import vs Bulk Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Import */}
        <Card>
          <CardHeader
            title="Import Records via CSV"
            subtitle="Upload and append spreadsheet data into your CRM database"
          />
          <CardBody className="space-y-4">
            <Select
              label="Select Target Module"
              value={importTarget}
              onChange={e => setImportTarget(e.target.value as 'leads' | 'contacts')}
              options={[
                { value: 'leads', label: 'Sales Leads Directory' },
                { value: 'contacts', label: 'Customer Contacts Directory' },
              ]}
            />

            {/* Drag & Drop File Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-brand-500 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800">
                {fileName ? fileName : 'Upload your CSV File'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                CSV should contain headers like "Contact Name", "Company", "Email", "Phone"
              </p>
              <label className="mt-3 inline-block">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs">
                  Choose File
                </span>
              </label>
            </div>

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Parsed {parsedRows.length} rows ready for import
                  </span>
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Clear
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs space-y-1">
                  {parsedRows.slice(0, 4).map((r, i) => (
                    <div key={i} className="p-1.5 bg-white rounded border border-slate-100 flex justify-between">
                      <span className="font-medium text-slate-800">{r['Contact Name'] || r['name'] || `Row #${i + 1}`}</span>
                      <span className="text-slate-500">{r['Company'] || r['company']}</span>
                    </div>
                  ))}
                  {parsedRows.length > 4 && (
                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      + {parsedRows.length - 4} more rows
                    </p>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExecuteImport}
                  isLoading={isImporting}
                  className="w-full"
                >
                  Import {parsedRows.length} Records Now
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Data Exports */}
        <Card>
          <CardHeader
            title="Export Records & Backup"
            subtitle="Download production datasets in standard CSV or structured JSON"
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Leads */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-500" /> Sales Leads CSV
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{leads.length} records</p>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      exportToCSV('ZanCRM_Leads', leads, [
                        { key: 'name', label: 'Contact Name' },
                        { key: 'company', label: 'Company' },
                        { key: 'email', label: 'Email' },
                        { key: 'score', label: 'Score' },
                        { key: 'estimatedValue', label: 'Est Value' },
                        { key: 'status', label: 'Status' },
                      ])
                    }
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download CSV
                  </Button>
                </div>
              </div>

              {/* Export Deals */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-brand-600" /> Opportunities CSV
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{deals.length} records</p>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      exportToCSV('ZanCRM_Deals', deals, [
                        { key: 'title', label: 'Deal Title' },
                        { key: 'companyName', label: 'Company' },
                        { key: 'value', label: 'Value ($)' },
                        { key: 'stage', label: 'Stage' },
                        { key: 'probability', label: 'Probability (%)' },
                      ])
                    }
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download CSV
                  </Button>
                </div>
              </div>

              {/* Export Contacts */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-500" /> Contacts Directory CSV
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{contacts.length} records</p>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      exportToCSV('ZanCRM_Contacts', contacts, [
                        { key: 'name', label: 'Name' },
                        { key: 'companyName', label: 'Company' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Phone' },
                      ])
                    }
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download CSV
                  </Button>
                </div>
              </div>

              {/* Export Companies */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-500" /> Companies CSV
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{companies.length} records</p>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      exportToCSV('ZanCRM_Companies', companies, [
                        { key: 'name', label: 'Company' },
                        { key: 'domain', label: 'Domain' },
                        { key: 'industry', label: 'Industry' },
                        { key: 'totalRevenue', label: 'Revenue' },
                      ])
                    }
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Complete JSON Snapshot */}
            <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-brand-900">Complete CRM Backup Archive</h4>
                <p className="text-[11px] text-brand-700 mt-0.5">
                  Full dump of leads, pipeline deals, contacts, and account parameters
                </p>
              </div>
              <Button variant="primary" size="xs" onClick={handleExportFullJSON} icon={<Database className="w-3.5 h-3.5" />}>
                Export JSON
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
