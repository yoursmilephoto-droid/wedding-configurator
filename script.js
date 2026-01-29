// script.js (production, no debug popups)
const tg = window.Telegram?.WebApp;
const inTelegram = !!tg;

const selectionState = {
  check_morning: false,
  check_ceremony: false,
  check_walk: false,
  check_party: false,
};

const mapping = {
  check_morning: "Утро",
  check_ceremony: "Церемония",
  check_walk: "Прогулка",
  check_party: "Банкет",
};

function updateMainButton() {
  const hasAny = Object.values(selectionState).some(Boolean);

  if (inTelegram) {
    tg.MainButton.setText("Готово");
    tg.MainButton.show();
    hasAny ? tg.MainButton.enable() : tg.MainButton.disable();
  }

  const fb = document.getElementById("fallback_done");
  if (fb) fb.disabled = !hasAny;
}

function toggleSelection(id) {
  if (!(id in selectionState)) return;

  selectionState[id] = !selectionState[id];

  const card = document.getElementById(`card_${id}`);
  if (card) card.classList.toggle("selected", selectionState[id]);

  if (inTelegram) tg.HapticFeedback?.selectionChanged?.();

  updateMainButton();
}

function buildPayload() {
  const selectedParts = Object.keys(selectionState)
    .filter((k) => selectionState[k])
    .map((k) => mapping[k]);

  return {
    selectedParts,
    payload: JSON.stringify({ type: "day_parts", parts: selectedParts, v: 1 }),
  };
}

function sendData() {
  const { selectedParts, payload } = buildPayload();

  if (!inTelegram) {
    if (selectedParts.length === 0) {
      alert("Выберите хотя бы один пункт 🙂");
      return;
    }
    console.log("Payload:", payload);
    alert(payload);
    return;
  }

  if (selectedParts.length === 0) {
    tg.showAlert("Выберите хотя бы один пункт 🙂");
    return;
  }

  try {
    tg.sendData(payload);
  } catch (e) {
    // редкая история, но лучше показать, чем молчать
    tg.showAlert("Не получилось отправить выбор. Попробуйте ещё раз 🙂");
    return;
  }

  // чуть подождём, чтобы Telegram успел сформировать update
  setTimeout(() => tg.close(), 900);
}

// ВАЖНО: делаем глобальными, потому что в HTML inline onclick
window.toggleSelection = toggleSelection;
window.sendData = sendData;

function bindMainButton() {
  if (!inTelegram) return;

  tg.ready();
  tg.expand();
  updateMainButton();

  // Два способа, чтобы работало на разных клиентах
  if (tg.MainButton?.onClick) tg.MainButton.onClick(() => sendData());
  if (tg.onEvent) tg.onEvent("mainButtonClicked", () => sendData());

  // Прячем HTML кнопку, если она есть
  const fallbackBtn = document.getElementById("fallback_done");
  if (fallbackBtn) fallbackBtn.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  bindMainButton();
  updateMainButton();
});
