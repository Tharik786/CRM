import React from 'react';
import { Deal, DealStage } from '../../types/crm';
import { KanbanColumn } from './KanbanColumn';

interface DealKanbanBoardProps {
  deals: Deal[];
  onDropDeal: (dealId: string, targetStage: DealStage) => void;
  onEditDeal: (deal: Deal) => void;
  onNewDealAtStage?: (stage: DealStage) => void;
  onMoveStage?: (dealId: string, nextStage: DealStage) => void;
}

const PIPELINE_STAGES: { id: DealStage; label: string; accent: string; next?: DealStage }[] = [
  { id: 'qualification', label: 'Qualification', accent: 'bg-blue-500', next: 'needs_analysis' },
  { id: 'needs_analysis', label: 'Needs Analysis', accent: 'bg-indigo-500', next: 'proposal_sent' },
  { id: 'proposal_sent', label: 'Proposal Sent', accent: 'bg-amber-500', next: 'negotiation' },
  { id: 'negotiation', label: 'Negotiation', accent: 'bg-purple-500', next: 'closed_won' },
  { id: 'closed_won', label: 'Closed Won', accent: 'bg-emerald-500' },
  { id: 'closed_lost', label: 'Closed Lost', accent: 'bg-rose-500' },
];

export const DealKanbanBoard: React.FC<DealKanbanBoardProps> = ({
  deals,
  onDropDeal,
  onEditDeal,
  onNewDealAtStage,
  onMoveStage,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none">
      {PIPELINE_STAGES.map(stage => {
        const stageDeals = deals.filter(d => d.stage === stage.id);
        return (
          <KanbanColumn
            key={stage.id}
            stageId={stage.id}
            stageName={stage.label}
            accentColor={stage.accent}
            deals={stageDeals}
            onDropDeal={onDropDeal}
            onEditDeal={onEditDeal}
            onNewDealAtStage={onNewDealAtStage}
            onMoveStage={onMoveStage}
            nextStage={stage.next}
          />
        );
      })}
    </div>
  );
};
