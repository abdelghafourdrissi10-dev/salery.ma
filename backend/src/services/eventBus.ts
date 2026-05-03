import { EventEmitter } from 'events';

/**
 * Global EventBus for Salery.
 * Decouples system actions from notification/audit logic.
 */
class EventBus extends EventEmitter {
    private static instance: EventBus;

    private constructor() {
        super();
        this.setMaxListeners(50);
    }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Standardized emit method for Salery Events
     */
    emitEvent(name: string, data: any) {
        console.log(`[EVENT_BUS] Emitting: ${name}`, data);
        this.emit(name, data);
    }
}

export const eventBus = EventBus.getInstance();

// --- Event Names Constants ---
export const EVENTS = {
    ATTENDANCE: {
        CHECK_IN: 'attendance.check_in',
        CHECK_OUT: 'attendance.check_out',
        LATE: 'attendance.late',
        EARLY_OUT: 'attendance.early_out',
        OVERTIME: 'attendance.overtime',
        ABSENCE: 'attendance.absence'
    },
    EMPLOYEE: {
        CREATED: 'employee.created',
        UPDATED: 'employee.updated',
        DOCUMENT_UPLOADED: 'employee.document_uploaded',
        CONTRACT_EXPIRING: 'employee.contract_expiring'
    },
    PAYROLL: {
        SALARY_PROCESSED: 'payroll.salary_processed',
        BONUS_ADDED: 'payroll.bonus_added'
    },
    LEAVE: {
        SUBMITTED: 'leave.submitted',
        APPROVED: 'leave.approved',
        REJECTED: 'leave.rejected',
        LOW_BALANCE: 'leave.low_balance'
    },
    DOCUMENTS: {
        BULK_ZIP_READY: 'documents.bulk_zip_ready'
    }
};
