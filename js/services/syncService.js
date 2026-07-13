import { handleError } from './errorService.js';

const pendingWrites = [];

async function queueWrite(operation) {
    pendingWrites.push(operation);
    return operation;
}

async function flushWrites() {
    while (pendingWrites.length) {
        const operation = pendingWrites.shift();
        try {
            await operation();
        } catch (error) {
            handleError(error, 'sync');
        }
    }
}

function getPendingWrites() {
    return pendingWrites.slice();
}

export { queueWrite, flushWrites, getPendingWrites };
export default { queueWrite, flushWrites, getPendingWrites };