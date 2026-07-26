// 용도변경이력 유무에 따른 카드 표시/숨김 필터 UI 및 상태 관리
window.EncarHelper = window.EncarHelper || {};

(() => {
  const STORAGE_KEY = "eh-usage-change-filter";
  const DEFAULT_SETTINGS = { yes: true, no: true, unknown: true };
  const listeners = new Set();

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  let settings = loadSettings();

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function notify() {
    listeners.forEach((fn) => fn(settings));
  }

  function onChange(fn) {
    listeners.add(fn);
  }

  /** hasUsageChange: true(있음) / false(없음) / null(정보없음) */
  function shouldShow(hasUsageChange) {
    if (hasUsageChange === null || hasUsageChange === undefined) return settings.unknown;
    return hasUsageChange ? settings.yes : settings.no;
  }

  function buildCheckbox(key, label) {
    const wrapper = document.createElement("label");
    wrapper.className = "eh-filter-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settings[key];
    input.addEventListener("change", () => {
      settings = { ...settings, [key]: input.checked };
      saveSettings();
      notify();
    });

    wrapper.append(input, document.createTextNode(label));
    return wrapper;
  }

  function mountPanel() {
    if (document.getElementById("eh-filter-panel")) return;

    const panel = document.createElement("div");
    panel.id = "eh-filter-panel";
    panel.className = "eh-filter-panel";

    const title = document.createElement("div");
    title.className = "eh-filter-title";
    title.textContent = "용도변경이력 표시";
    panel.appendChild(title);

    panel.append(
      buildCheckbox("yes", "있음"),
      buildCheckbox("no", "없음"),
      buildCheckbox("unknown", "정보없음")
    );

    document.body.appendChild(panel);
  }

  window.EncarHelper.filter = { mountPanel, shouldShow, onChange };
})();
