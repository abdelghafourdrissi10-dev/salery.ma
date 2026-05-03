import React from 'react';
import { PlanningItem } from '../../types';
import TaskCard from './TaskCard';

interface Props {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    items: PlanningItem[];
    onDateClick: (date: Date) => void;
    onItemClick: (item: PlanningItem) => void;
}

const DayCell: React.FC<Props> = ({
    date,
    isCurrentMonth,
    isToday,
    items,
    onDateClick,
    onItemClick
}) => {
    const displayedItems = items.slice(0, 2);
    const remainingCount = items.length - 2;

    return (
        <div
            onClick={() => onDateClick(date)}
            className={`min-h-[120px] p-2 border-r border-b border-[#E5E7EB] transition-all cursor-pointer group hover:bg-[#F5F7FA]/30 ${!isCurrentMonth ? 'bg-[#F9FAFB] opacity-40' : 'bg-white'}`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`flex items-center justify-center w-6 h-6 text-[11px] font-black rounded-full transition-all ${isToday ? 'bg-[#0078D4] text-white shadow-md scale-110' : 'text-[#111827] group-hover:text-[#0078D4]'}`}>
                    {date.getDate()}
                </span>

                {items.length > 0 && (
                    <div className="flex -space-x-1">
                        {items.some(i => i.type === 'ALERT') && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 border border-white" />}
                        {items.some(i => i.type === 'TASK' && i.priority === 'HIGH') && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 border border-white" />}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                {displayedItems.map((item) => (
                    <TaskCard key={item.id} item={item} onClick={onItemClick} />
                ))}

                {remainingCount > 0 && (
                    <p className="text-[7px] font-black text-[#6B7280] text-center uppercase tracking-widest pt-1 border-t border-gray-50 bg-gray-50/30 rounded py-0.5">
                        + {remainingCount} more
                    </p>
                )}
            </div>

            {/* Overdue Indicator */}
            {items.some(i => i.type === 'TASK' && i.status !== 'DONE' && new Date(i.date) < new Date()) && (
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
        </div>
    );
};

export default DayCell;
