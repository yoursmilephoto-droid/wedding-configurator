// Инициализация Telegram WebApp с проверкой доступности
const tg = window.Telegram?.WebApp;
const inTelegram = !!(tg && tg.initData);

// Хранилище состояний выбора
const selectionState = {
    check_morning: false,
    check_ceremony: false,
    check_walk: false,
    check_party: false
};

// Инициализация интерфейса
if (inTelegram) {
    tg.ready();
    tg.expand();

    // Настройка нативной кнопки Telegram
    tg.MainButton.setText("Готово");
    tg.MainButton.show();
    tg.MainButton.disable(); // Изначально выключена, пока ничего не выбрано

    // Устанавливаем обработчик один раз
    tg.MainButton.onClick(() => sendData());

    // Скрываем HTML кнопку, если мы внутри Telegram
    const fallbackBtn = document.getElementById('fallback_done');
    if (fallbackBtn) fallbackBtn.style.display = 'none';
}

/**
 * Переключение выбора карточки
 */
function toggleSelection(id) {
    selectionState[id] = !selectionState[id];

    const card = document.getElementById(`card_${id}`);
    if (selectionState[id]) {
        card.classList.add('selected');
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    } else {
        card.classList.remove('selected');
    }

    updateMainButton();
}

/**
 * Обновление состояния кнопки (MainButton или Fallback)
 */
function updateMainButton() {
    const hasAny = Object.values(selectionState).some(Boolean);

    if (inTelegram) {
        if (hasAny) {
            tg.MainButton.enable();
            tg.MainButton.setParams({
                is_active: true,
                color: '#007AFF' // Стандартный синий Apple/Telegram
            });
        } else {
            tg.MainButton.disable();
            tg.MainButton.setParams({
                is_active: false,
                color: '#8E8E93' // Серый для disabled состояния
            });
        }
    }
}

/**
 * Отправка данных боту в формате JSON
 */
function sendData() {
    // Сопоставление ID с названиями для Notion/n8n
    const mapping = {
        check_morning: 'Утро',
        check_ceremony: 'Церемония',
        check_walk: 'Прогулка',
        check_party: 'Банкет'
    };

    const selectedParts = Object.keys(selectionState)
        .filter(key => selectionState[key])
        .map(key => mapping[key]);

    const payload = JSON.stringify({
        type: "day_parts",
        parts: selectedParts,
        v: 1
    });

    if (inTelegram && selectedParts.length > 0) {
        tg.sendData(payload);
        tg.close();
    } else if (selectedParts.length > 0) {
        // Fallback для браузера
        console.log('Payload:', payload);
        alert('Выбранные части дня (JSON):\n' + payload);
    } else if (inTelegram) {
        tg.close();
    }
}
