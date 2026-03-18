export function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

/** Format a due date as "Dec 31" or "Dec 31, 2026" (omits year if current year). */
export function formatDueDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const isCurrentYear = date.getFullYear() === new Date().getFullYear();
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: isCurrentYear ? undefined : 'numeric',
    });
}

/** Returns 'overdue', 'soon' (within 3 days), or 'normal'. */
export function getDueDateStatus(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    if (date < now) return 'overdue';
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (date <= soon) return 'soon';
    return 'normal';
}

/** Convert an ISO date string to the YYYY-MM-DD format required by <input type="date">. */
export function toInputDateValue(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}
