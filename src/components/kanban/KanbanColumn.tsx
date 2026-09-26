import React, { useState } from 'react';
import { Deal, DealStage } from '../../types/crm';
import { DealCard } from './DealCard';
import { formatCurrency } from '../../utils/formatters';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  stageId: DealStage;
  stageName: string;
  deals: Deal[];
  onDropDeal: (dealId: string, targetStage: DealStage) => void;
  onEditDeal: (deal: Deal) => void;
  onNewDealAtStage?: (stage: DealStage) => void;
  onMoveStage?: (dealId: string, nextStage: DealStage) => void;
  nextStage?: DealStage | null;
  accentColor: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stageId,
  stageName,
  deals,
  onDropDeal,
  onEditDeal,
  onNewDealAtStage,
  onMoveStage,
  nextStage,
  accentColor,
}) => {
  const [isOver, setIsOver] = useState(false);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) {
      onDropDeal(dealId, stageId);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[280px] max-w-[320px] w-full rounded-2xl p-3 bg-slate-100/75 border transition-all duration-150 ${
        isOver
          ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
          : 'border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {stageName}
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>

        {onNewDealAtStage && (
          <button
            onClick={() => onNewDealAtStage(stageId)}
            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-200 rounded transition-colors"
            title={`Add deal to ${stageName}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stage Sum summary */}
      <div className="text-[11px] font-semibold text-slate-500 px-1 mb-2.5 flex items-center justify-between">
        <span>Stage Value:</span>
        <span className="text-slate-800 font-mono font-bold">{formatCurrency(totalValue)}</span>
      </div>

      {/* Deals List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 min-h-[300px]">
        {deals.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            onEdit={onEditDeal}
            onMoveStage={onMoveStage}
            nextStage={nextStage}
          />
        ))}

        {deals.length === 0 && (
          <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-3 text-xs text-slate-400">
            Drag opportunities here
          </div>
        )}
      </div>
    </div>
  );
};
