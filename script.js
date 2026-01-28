// script.js (reliable sendData + diagnostics)
// Compatible with inline onclick="toggleSelection('check_morning')" etc.

const tg = window.Telegram?.WebApp;
const inTelegram = !!tg;

// Selection state
const selectionState = {
  check_morning: false,
  check_ceremony: false,
  check_walk: false,
  check_party: false,
};

// Mapping to canonical values for n8n/Notion
const mapping = {
  check_morning: "Утро",
  check_ceremony: "Церемония",
  check_walk: "Прогулка",
  check_party: "Банкет",
};

function hasAnySelection() {
  return Object.values(selectionState).some(Boolean);
}

function updateMainButton() {
  if (!inTelegram) return;
  try {
    tg.MainButton.setText("Готово");
    tg.MainButton.show();
    if (hasAnySelection()) tg.MainButton.enable();
    else tg.MainButton.disable();
  } catch (e) {
    // Ignore UI errors on some clients
    console.warn("MainButton update failed:", e);
  }
}

// Expose for inline onclick in index.html
window.toggleSelection = function toggleSelection(id) {
  if (!(id in selectionState)) return;

  selectionState[id] = !selectionState[id];

  const card = document.getElementById(`card_${id}`);
  if (card) {
    card.classList.toggle("selected", selectionState[id]);
    card.setAttribute("aria-pressed", selectionState[id] ? "true" : "false");
  }

  // light haptic
  try {
    tg?.HapticFeedback?.selectionChanged?.();
  } catch {}

  updateMainButton();
};

function buildPayload() {
  const parts = Object.keys(selectionState)
    .filter((k) => selectionState[k])
    .map((k) => mapping[k]);

  return { parts, payload: JSON.stringify({ type: "day_parts", parts, v: 1 }) };
}

// Expose sendData for debugging / optional html button
window.sendData = function sendData() {
  const { parts, payload } = buildPayload();

  if (inTelegram) {
    if (!parts.length) {
      // Never close silently — show why nothing happens
      try { tg.showAlert("Выберите хотя бы один пункт 🙂"); } catch {}
      return;
    }

    try {
      tg.sendData(payload);
    } catch (e) {
      console.error("sendData failed:", e);
      try { tg.showAlert("Не получилось отправить выбор. Попробуйте ещё раз."); } catch {}
      return;
    }

    // Give Telegram time to form update with web_app_data (some clients need more)
    setTimeout(() => {
      try { tg.close(); } catch {}
    }, 900);

    return;
  }

  // Browser fallback
  alert(payload);
};

// Init
document.addEventListener("DOMContentLoaded", () => {
  if (inTelegram) {
    try {
      tg.ready();
      tg.expand();

      // Bind once
      tg.MainButton.onClick(() => window.sendData());

      // Hide any HTML "Готово" button inside Telegram (optional)
      const fallbackBtn =
        document.getElementById("fallback_done") ||
        [...document.querySelectorAll("button")].find(
          (b) => (b.textContent || "").trim().toLowerCase() === "готово"
        );
      if (fallbackBtn) fallbackBtn.style.display = "none";
    } catch (e) {
      console.warn("Telegram init failed:", e);
    }
  }

  updateMainButton();
});
