// script.js

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

// Инициализация интерфейса
if (inTelegram) {
  tg.ready();
  tg.expand();

  // Нативная кнопка Telegram
  tg.MainButton.setText("Готово");
  tg.MainButton.show();
  tg.MainButton.disable(); // пока ничего не выбрано

  // Важно: обработчик вешаем один раз
  tg.MainButton.onClick(() => sendData());

  // Скрываем HTML fallback кнопку, если она есть
  const fallbackBtn = document.getElementById("fallback_done");
  if (fallbackBtn) fallbackBtn.style.display = "none";
}

/**
 * Переключение выбора карточки
 */
function toggleSelection(id) {
  if (!(id in selectionState)) return;

  selectionState[id] = !selectionState[id];

  const card =
    document.getElementById(`card_${id}`) ||
    document.querySelector(`[data-card-id="${id}"]`);

  if (card) {
    if (selectionState[id]) {
      card.classList.add("selected");
      tg?.HapticFeedback?.impactOccurred?.("light");
    } else {
      card.classList.remove("selected");
    }
  }

  updateMainButton();
}

/**
 * Обновление состояния кнопки
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

  // Для теста в браузере можно включать/выключать fallback кнопку
  const fb = document.getElementById("fallback_done");
  if (fb) fb.disabled = !hasAny;
}

/**
 * Отправка данных боту в формате JSON
 */
function sendData() {
  const selectedParts = Object.keys(selectionState)
    .filter((key) => selectionState[key])
    .map((key) => mapping[key]);

  if (selectedParts.length === 0) {
    if (inTelegram) {
      tg.showAlert("Выберите хотя бы один пункт 🙂");
    }
    return; // НЕ закрываем и НЕ молчим
  }

  const payload = JSON.stringify({
    type: "day_parts",
    parts: selectedParts,
    v: 1,
  });

  if (inTelegram) {
    tg.sendData(payload);
    // Даем Telegram время сформировать update с web_app_data
    setTimeout(() => tg.close(), 300);
    return;
  }

  // Fallback для браузера
  console.log("Payload:", payload);
  alert("Выбранные части дня (JSON):\n" + payload);
}

/**
 * Привязка кликов к карточкам без inline onclick
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1) если есть элементы с id card_check_...
  Object.keys(selectionState).forEach((id) => {
    const el =
      document.getElementById(`card_${id}`) ||
      document.querySelector(`[data-card-id="${id}"]`);
    if (el && !el.getAttribute('onclick')) el.addEventListener("click", () => toggleSelection(id));
  });

  // 2) если есть fallback кнопка в браузере
  const fb = document.getElementById("fallback_done");
  if (fb && !inTelegram) fb.addEventListener("click", () => sendData());

  updateMainButton();
});
