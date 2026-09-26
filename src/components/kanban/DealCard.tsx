import React from 'react';
import { Deal, DealStage } from '../../types/crm';
import { Badge } from '../common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Calendar, Building2, User, ArrowRight } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onMoveStage?: (dealId: string, nextStage: DealStage) => void;
  nextStage?: DealStage | null;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onEdit,
  onMoveStage,
  nextStage,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const priorityVariants: Record<string, 'rose' | 'amber' | 'green'> = {
    high: 'rose',
    medium: 'amber',
    low: 'green',
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onEdit(deal)}
      className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-brand-300 transition-all cursor-grab active:cursor-grabbing group relative select-none"
    >
      {/* Card Header: Value & Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">
          {formatCurrency(deal.value, deal.currency)}
        </span>
        <Badge variant={priorityVariants[deal.priority]} size="sm">
          {deal.priority}
        </Badge>
      </div>

      {/* Deal Title */}
      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
        {deal.title}
      </h4>

      {/* Meta Information: Company & Contact */}
      <div className="mt-2.5 space-y-1 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium text-slate-600">{deal.companyName}</span>
        </div>
        {deal.contactName && (
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{deal.contactName}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {deal.tags && deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {deal.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Probability, Date, Quick Advance */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(deal.expectedCloseDate)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 font-mono text-[10px]">
            {deal.probability}% prob
          </span>

          {nextStage && onMoveStage && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onMoveStage(deal.id, nextStage);
              }}
              title={`Advance to ${nextStage.replace('_', ' ')}`}
              className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
