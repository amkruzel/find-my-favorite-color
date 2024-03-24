export enum NotifyType {
    information = 'information',
    error = 'error',
}

export function notify(type: NotifyType, message: string) {
    const container = document.querySelector('.notification-container')

    if (!container) {
        return
    }

    const notification = _make('div', 'notification', type.toString())
    const coloredSection = _make('div')
    const messageSection = _make('div')

    messageSection.textContent = message

    notification.append(coloredSection, messageSection)
    container.appendChild(notification)

    setTimeout(() => {
        notification.style.opacity = '0'
        setTimeout(() => notification.remove(), 2500)
    }, 5000)
}

function _make(type: string, ...classes: string[]) {
    const elem = document.createElement(type)
    for (const cl of classes) {
        elem.classList.add(cl)
    }
    return elem
}
