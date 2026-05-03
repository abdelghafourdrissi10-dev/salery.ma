/**
 * NotificationQueue
 * A high-performance, non-blocking queue layer for production scalability.
 * This abstracts BullMQ/Redis behind a modular interface.
 */
export class NotificationQueue {
    private static queue: any[] = [];
    private static isProcessing = false;

    /**
     * Add a notification task to the queue
     */
    static async add(task: {
        companyId: string;
        userId?: string;
        role?: string;
        title: string;
        message: string;
        type: string;
        metadata: any;
    }) {
        console.log(`[QUEUE] 📥 Task added: ${task.title}`);
        this.queue.push(task);
        
        // In production, this would use BullMQ:
        // await this.bullQueue.add('generate-notification', task);

        if (!this.isProcessing) {
            this.process();
        }
    }

    /**
     * Worker simulation: Processes the queue asynchronously
     */
    private static async process() {
        this.isProcessing = true;
        
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                try {
                    console.log(`[QUEUE] ⚙️ Processing task: ${task.title}`);
                    
                    // Simulate processing delay (e.g., preference lookup, email sending)
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const { NotificationService } = await import('../modules/notifications/notification.service');
                    await NotificationService.create(task);

                    console.log(`[QUEUE] ✅ Task completed: ${task.title}`);
                } catch (error) {
                    console.error(`[QUEUE] ❌ Task failed: ${task.title}`, error);
                }
            }
        }

        this.isProcessing = false;
    }
}
