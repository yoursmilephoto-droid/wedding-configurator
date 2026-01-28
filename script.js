// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Расширяем объект Telegram для совместимости с дизайном Antigravity
tg.ready();
tg.expand();

// Хранилище состояний выбора
const selectionState = {
    check_morning: false,
    check_ceremony: false,
    check_walk: false,
    check_party: false
};

/**
 * Переключение выбора карточки
 * @param {string} id - ID элемента
 */
function toggleSelection(id) {
    selectionState[id] = !selectionState[id];

    const card = document.getElementById(`card_${id}`);
    if (selectionState[id]) {
        card.classList.add('selected');
        // Легкая вибрация при выборе (если поддерживается)
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    } else {
        card.classList.remove('selected');
    }
}

/**
 * Отправка данных боту
 */
function sendData() {
    const states = [
        { id: 'check_morning', name: 'Утро в отеле' },
        { id: 'check_ceremony', name: 'Церемония' },
        { id: 'check_walk', name: 'Прогулка' },
        { id: 'check_party', name: 'Ресторан' }
    ];

    const selectedNames = states
        .filter(item => selectionState[item.id])
        .map(item => item.name);

    if (selectedNames.length > 0) {
        // Отправляем строку боту: "Отель, Прогулка"
        const resultString = selectedNames.join(', ');

        // В продакшене Telegram WebApp закрывается после sendData
        try {
            tg.sendData(resultString);
        } catch (e) {
            console.log('SendData error (likely running outside Telegram):', resultString);
            alert('Выбрано: ' + resultString);
        }
    } else {
        // Если ничего не выбрано - закрываем
        try {
            tg.close();
        } catch (e) {
            console.log('Close error (likely running outside Telegram)');
        }
    }
}

// Настройка основной кнопки Telegram (опционально, используем кастомную в UI по ТЗ)
// Но для лучшего UX можем продублировать или использовать только её.
// В ТЗ указана кнопка "Готово" в UI, так что оставляем как есть.
