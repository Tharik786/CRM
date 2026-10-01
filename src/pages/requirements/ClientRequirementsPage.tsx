import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Company, ClientDeviceRequirement } from '../../types/crm';
import { ClientList } from '../../components/requirements/ClientList';
import { SelectedClientHeader } from '../../components/requirements/SelectedClientHeader';
import { RequirementsTable } from '../../components/requirements/RequirementsTable';
import { Card, CardBody } from '../../components/common/Card';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState';
import { calculateStillNeeded, calculateInstallationProgress } from '../../utils/clientRequirements';
import { AlertTriangle, Building2, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClientRequirementsPage: React.FC = () => {
  const {
    companies,
    clientRequirements,
    getClientRequirements,
    saveClientRequirements,
    isLoading: isCrmLoading,
    addToast,
  } = useCrm();

  // Selected Client ID
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Local editable requirements for the currently selected client
  const [activeRequirements, setActiveRequirements] = useState<ClientDeviceRequirement[]>([]);
  const [isLocalDirty, setIsLocalDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingReqs, setIsLoadingReqs] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When companies load, select the first company by default if none selected
  useEffect(() => {
    if (companies.length > 0 && !selectedClientId) {
      // Find Denver if exists, or pick the first company
      const defaultCompany =
        companies.find(c => c.id === 'comp_denver') || companies[0];
      setSelectedClientId(defaultCompany.id);
    }
  }, [companies, selectedClientId]);

  // Load requirements when selectedClientId changes
  useEffect(() => {
    if (!selectedClientId) {
      setActiveRequirements([]);
      setIsLocalDirty(false);
      return;
    }

    let isMounted = true;
    const fetchRequirements = async () => {
      setIsLoadingReqs(true);
      setErrorMsg(null);
      try {
        const reqs = await getClientRequirements(selectedClientId);
        if (isMounted) {
          // Clone to prevent mutating context directly until saved
          setActiveRequirements(JSON.parse(JSON.stringify(reqs)));
          setIsLocalDirty(false);
        }
      } catch (err) {
        console.error('Failed to load client requirements:', err);
        if (isMounted) {
          setErrorMsg('Failed to load device requirements for this client.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingReqs(false);
        }
      }
    };

    fetchRequirements();

    return () => {
      isMounted = false;
    };
  }, [selectedClientId, getClientRequirements]);

  // Current selected client object
  const selectedClient = useMemo<Company | undefined>(() => {
    return companies.find(c => c.id === selectedClientId);
  }, [companies, selectedClientId]);

  // Handle requirement edit
  const handleRequiredChange = useCallback((deviceKey: string, newValue: number) => {
    setActiveRequirements(prev =>
      prev.map(item => {
        if (item.deviceKey === deviceKey) {
          return {
            ...item,
            required: Math.max(0, newValue),
          };
        }
        return item;
      })
    );
    setIsLocalDirty(true);
  }, []);

  // Save current requirements
  const handleSave = async () => {
    if (!selectedClientId || !selectedClient) return;
    setIsSaving(true);
    try {
      await saveClientRequirements(selectedClientId, activeRequirements);
      setIsLocalDirty(false);
      addToast({
        type: 'success',
        title: 'Requirements Saved',
        message: `Updated device requirements for ${selectedClient.name}.`,
      });
    } catch (err) {
      console.error('Failed to save requirements:', err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save requirements. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset unsaved changes to context copy
  const handleReset = () => {
    if (selectedClientId && clientRequirements[selectedClientId]) {
      setActiveRequirements(
        JSON.parse(JSON.stringify(clientRequirements[selectedClientId]))
      );
      setIsLocalDirty(false);
      addToast({
        type: 'info',
        title: 'Changes Reset',
        message: 'Reverted to last saved requirements.',
      });
    }
  };

  // Switch client selection
  const handleSelectClient = (clientId: string) => {
    if (clientId === selectedClientId) return;
    setSelectedClientId(clientId);
  };

  // Calculate live totals for the active selected client
  const { totalRequired, totalInstalled, totalStillNeeded, progressPercentage, canFullySupply } =
    useMemo(() => {
      const totalReq = activeRequirements.reduce(
        (acc, r) => acc + (Number(r.required) || 0),
        0
      );
      const totalInst = activeRequirements.reduce(
        (acc, r) => acc + (Number(r.installed) || 0),
        0
      );
      const totalNeeded = activeRequirements.reduce(
        (acc, r) => acc + calculateStillNeeded(r.required, r.installed),
        0
      );
      const progress = calculateInstallationProgress(totalInst, totalReq);

      const shortages = activeRequirements.filter(
        r => calculateStillNeeded(r.required, r.installed) > r.indiaStock
      ).length;

      return {
        totalRequired: totalReq,
        totalInstalled: totalInst,
        totalStillNeeded: totalNeeded,
        progressPercentage: progress,
        canFullySupply: shortages === 0,
      };
    }, [activeRequirements]);

  // Combined requirements map for the client list, reflecting active live edits
  const liveRequirementsMap = useMemo(() => {
    const combined = { ...clientRequirements };
    if (selectedClientId) {
      combined[selectedClientId] = activeRequirements;
    }
    return combined;
  }, [clientRequirements, selectedClientId, activeRequirements]);

  return (
    <div className="space-y-2.5 animate-fade-in">
      {/* Page Title & Subtitle matching CRM header style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <Link
            to="/operations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs mb-2 transition-all w-fit group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-all" />
            <span>Back to Operations</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Client Requirements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose a client, then set how many devices of each type they need.
          </p>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      {isCrmLoading && companies.length === 0 ? (
        <LoadingSpinner label="Loading client requirements..." />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No Clients Found"
          description="There are no client accounts in the CRM yet. Create client companies to manage device requirements."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* LEFT PANEL: Client List (compact width) */}
          <div className="lg:col-span-3 w-full">
            <ClientList
              clients={companies}
              selectedClientId={selectedClientId}
              onSelectClient={handleSelectClient}
              requirementsMap={liveRequirementsMap}
              isLoading={isCrmLoading}
            />
          </div>

          {/* RIGHT PANEL: Selected Client Requirements (expanded width) */}
          <div className="lg:col-span-9 w-full">
            {errorMsg ? (
              <Card className="border-rose-200 bg-rose-50/50 p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-rose-900">Error Loading Requirements</h3>
                <p className="text-xs text-rose-600 mt-1">{errorMsg}</p>
                <button
                  onClick={() => selectedClientId && getClientRequirements(selectedClientId)}
                  className="mt-4 px-3 py-1.5 text-xs font-semibold bg-white border border-rose-300 text-rose-700 rounded-lg shadow-sm hover:bg-rose-50"
                >
                  Retry
                </button>
              </Card>
            ) : selectedClient ? (
              <Card className="overflow-hidden border-slate-200/90 shadow-subtle">
                {/* Selected Client Header */}
                <SelectedClientHeader
                  client={selectedClient}
                  totalRequired={totalRequired}
                  totalInstalled={totalInstalled}
                  totalStillNeeded={totalStillNeeded}
                  progressPercentage={progressPercentage}
                  canFullySupply={canFullySupply}
                  isSaving={isSaving}
                  isDirty={isLocalDirty}
                  onSave={handleSave}
                  onReset={handleReset}
                />

                {/* Requirements Table */}
                <CardBody className="p-0">
                  <RequirementsTable
                    requirements={activeRequirements}
                    onRequiredChange={handleRequiredChange}
                    isLoading={isLoadingReqs}
                  />
                </CardBody>
              </Card>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Client Selected</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Please select a client from the left panel to configure their IoT device requirements.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
