import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlanningItem, PlanningType, PlanningPriority, PlanningStatus } from '../types';

interface PlanningState {
    items: PlanningItem[];

    // Actions
    setItems: (items: PlanningItem[]) => void;
    addItem: (item: PlanningItem) => void;
    updateItem: (id: string, updates: Partial<PlanningItem>) => void;
    deleteItem: (id: string) => void;

    // Helpers
    getItemsByDate: (date: string) => PlanningItem[];
    getOverdueTasks: (currentDate: string) => PlanningItem[];
}

export const usePlanningStore = create<PlanningState>()(
    persist(
        (set, get) => ({
            items: [],

            setItems: (items) => set({ items }),

            addItem: (item) => set((state) => ({
                items: [item, ...state.items]
            })),

            updateItem: (id, updates) => set((state) => ({
                items: state.items.map((item) =>
                    item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
                )
            })),

            deleteItem: (id) => set((state) => ({
                items: state.items.filter((item) => item.id !== id)
            })),

            getItemsByDate: (date) => {
                return get().items.filter((item) => item.date === date);
            },

            getOverdueTasks: (currentDate) => {
                return get().items.filter((item) =>
                    item.type === 'TASK' &&
                    item.status !== 'DONE' &&
                    item.date < currentDate
                );
            }
        }),
        {
            name: 'salery-planning-store',
        }
    )
);
