import { getNotifications, markAllRead, getUnreadCount } from '../services/notificationService.js';

export function createNotificationCenter(container) {
    if (!container) {
        return null;
    }

    const render = () => {
        const notifications = getNotifications();
        const unreadCount = getUnreadCount();
        container.innerHTML = `
            <section class="sword-notification-center" aria-label="Notification center">
                <header>
                    <strong>Notifications</strong>
                    <button type="button" data-action="mark-read">${unreadCount ? 'Mark all read' : 'All caught up'}</button>
                </header>
                <ul>
                    ${notifications.map((item) => `
                        <li class="${item.unread ? 'is-unread' : ''}">
                            <strong>${item.title}</strong>
                            <p>${item.message}</p>
                        </li>
                    `).join('')}
                </ul>
            </section>
        `;
    };

    container.addEventListener('click', (event) => {
        if (event.target.matches('[data-action="mark-read"]')) {
            markAllRead();
            render();
        }
    });

    render();
    return { render };
}

export default createNotificationCenter;
