import React from 'react';
import { PlanningItem, PlanningType, PlanningPriority } from '../../types';
import { CheckCircle2, Circle, AlertCircle, Calendar as CalendarIcon, StickyNote } from 'lucide-react';

interface Props {
    item: PlanningItem;
    onClick: (item: PlanningItem) => void;
}

const TaskCard: React.FC<Props> = ({ item, onClick }) => {
    const typeStyles: Record<PlanningType, string> = {
        TASK: 'bg-blue-50 text-blue-700 border-blue-100',
        NOTE: 'bg-gray-50 text-gray-700 border-gray-100',
        ALERT: 'bg-rose-50 text-rose-700 border-rose-100',
        EVENT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };

    const priorityColors: Record<PlanningPriority, string> = {
        LOW: 'bg-gray-400',
        MEDIUM: 'bg-amber-400',
        HIGH: 'bg-rose-500',
    };

    const Icon = item.type === 'TASK' ? (item.status === 'DONE' ? CheckCircle2 : Circle) :
        item.type === 'ALERT' ? AlertCircle :
            item.type === 'EVENT' ? CalendarIcon : StickyNote;

    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClick(item); }}
            className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-[6px] border text-[9px] font-bold truncate transition-all hover:shadow-md cursor-pointer ${typeStyles[item.type]}`}
        >
            <div className={`w-1 h-1 rounded-full shrink-0 ${priorityColors[item.priority]}`} />
            <Icon size={10} className="shrink-0" />
            <span className="truncate">{item.title}</span>

            {item.status === 'DONE' && (
                <div className="absolute inset-0 bg-white/40 pointer-events-none" />
            )}
        </div>
    );
};

export default TaskCard;
