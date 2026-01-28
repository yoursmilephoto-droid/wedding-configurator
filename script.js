// script.js
// Версия: Telegram Mini App (MainButton + sendData JSON) — фикс для inline onclick
// Главное: функции toggleSelection/sendData доступны глобально, чтобы работали onclick в index.html

// Безопасная инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
const inTelegram = !!tg;

// Хранилище состояний выбора
const selectionState = {
  check_morning: false,
  check_ceremony: false,
  check_walk: false,
  check_party: false,
};

// Сопоставление ID с названиями для Notion/n8n
const mapping = {
  check_morning: "Утро",
  check_ceremony: "Церемония",
  check_walk: "Прогулка",
  check_party: "Банкет",
};

// Инициализация интерфейса Telegram
if (inTelegram) {
  tg.ready();
  tg.expand();

  tg.MainButton.setText("Готово");
  tg.MainButton.show();
  tg.MainButton.disable(); // пока не выбрали

  // Вешаем один обработчик
  tg.MainButton.onClick(() => {
    // guard: если вдруг Telegram клиент позволил нажать disabled
    if (!Object.values(selectionState).some(Boolean)) {
      tg.showAlert("Выберите хотя бы один пункт 🙂");
      return;
    }
    sendData();
  });

  // Скрываем HTML fallback кнопку, если она есть
  const fallbackBtn = document.getElementById("fallback_done");
  if (fallbackBtn) fallbackBtn.style.display = "none";
}

/**
 * Обновление состояния кнопки "Готово"
 */
function updateMainButton() {
  const hasAny = Object.values(selectionState).some(Boolean);

  if (inTelegram) {
    if (hasAny) {
      tg.MainButton.enable();
      tg.MainButton.setParams({ is_active: true, color: "#007AFF" });
    } else {
      tg.MainButton.disable();
      tg.MainButton.setParams({ is_active: false, color: "#8E8E93" });
    }
  }

  // Fallback кнопка в браузере (если есть)
  const fb = document.getElementById("fallback_done");
  if (fb) {
    fb.disabled = !hasAny;
    fb.style.opacity = hasAny ? "1" : "0.6";
  }
}

/**
 * Переключение выбора карточки
 * Вызывается из inline onclick в index.html: toggleSelection('check_morning')
 */
function toggleSelection(id) {
  if (!(id in selectionState)) return;

  selectionState[id] = !selectionState[id];

  const card = document.getElementById(`card_${id}`);
  if (card) {
    card.classList.toggle("selected", selectionState[id]);
    card.setAttribute("aria-pressed", selectionState[id] ? "true" : "false");
  }

  // лёгкая тактильная отдача
  tg?.HapticFeedback?.selectionChanged?.();

  updateMainButton();
}

/**
 * Отправка данных боту в формате JSON
 */
function sendData() {
  const selectedParts = Object.keys(selectionState)
    .filter((key) => selectionState[key])
    .map((key) => mapping[key]);

  if (selectedParts.length === 0) {
    if (inTelegram) tg.showAlert("Выберите хотя бы один пункт 🙂");
    return;
  }

  const payload = JSON.stringify({
    type: "day_parts",
    parts: selectedParts,
    v: 1,
  });

  if (inTelegram) {
    tg.sendData(payload);

    // Маленькая пауза — чтобы Telegram успел сформировать update для бота
    setTimeout(() => tg.close(), 250);
    return;
  }

  // Fallback для браузера
  console.log("Payload:", payload);
  alert("Выбранные части дня (JSON):\n" + payload);
}

// Сделать функции доступными для inline onclick
window.toggleSelection = toggleSelection;
window.sendData = sendData;

// После загрузки DOM привести кнопку в корректное состояние
document.addEventListener("DOMContentLoaded", () => {
  updateMainButton();

  // Если есть fallback кнопка в браузере — подключаем
  const fb = document.getElementById("fallback_done");
  if (fb && !inTelegram) {
    fb.addEventListener("click", () => sendData());
    fb.disabled = true;
    fb.style.opacity = "0.6";
  }
});
