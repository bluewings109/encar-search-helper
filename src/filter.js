// 매물 속성(용도변경이력, 단순수리 등)에 따른 카드 표시/숨김 필터 UI 및 상태 관리
window.EncarHelper = window.EncarHelper || {};

(() => {
  const CATEGORIES = [
    {
      id: "usageChange",
      storageKey: "eh-usage-change-filter",
      title: "용도변경이력 표시",
      getValue: (extras) => (extras ? extras.hasUsageChange : null),
    },
    {
      id: "simpleRepair",
      storageKey: "eh-simple-repair-filter",
      title: "단순수리 표시",
      getValue: (extras) => (extras ? extras.hasSimpleRepair : null),
    },
  ];
  const DEFAULT_SETTINGS = { yes: true, no: true, unknown: true };
  const listeners = new Set();

  function loadSettings(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  const settingsByCategory = new Map(CATEGORIES.map((category) => [category.id, loadSettings(category.storageKey)]));

  function saveSettings(category) {
    localStorage.setItem(category.storageKey, JSON.stringify(settingsByCategory.get(category.id)));
  }

  function notify() {
    listeners.forEach((fn) => fn());
  }

  function onChange(fn) {
    listeners.add(fn);
  }

  function matchesCategory(category, value) {
    const settings = settingsByCategory.get(category.id);
    if (value === null || value === undefined) return settings.unknown;
    return value ? settings.yes : settings.no;
  }

  /** extras가 null(상세조회 실패)이면 모든 항목을 "정보없음"으로 취급한다. */
  function shouldShow(extras) {
    return CATEGORIES.every((category) => matchesCategory(category, category.getValue(extras)));
  }

  function buildCheckbox(category, key, label) {
    const wrapper = document.createElement("label");
    wrapper.className = "eh-filter-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settingsByCategory.get(category.id)[key];
    input.addEventListener("change", () => {
      const current = settingsByCategory.get(category.id);
      settingsByCategory.set(category.id, { ...current, [key]: input.checked });
      saveSettings(category);
      notify();
    });

    wrapper.append(input, document.createTextNode(label));
    return wrapper;
  }

  function buildSection(category) {
    const section = document.createElement("div");
    section.className = "eh-filter-section";

    const title = document.createElement("div");
    title.className = "eh-filter-title";
    title.textContent = category.title;
    section.appendChild(title);

    section.append(
      buildCheckbox(category, "yes", "있음"),
      buildCheckbox(category, "no", "없음"),
      buildCheckbox(category, "unknown", "정보없음")
    );

    return section;
  }

  function mountPanel() {
    if (document.getElementById("eh-filter-panel")) return;

    const panel = document.createElement("div");
    panel.id = "eh-filter-panel";
    panel.className = "eh-filter-panel";

    CATEGORIES.forEach((category) => panel.appendChild(buildSection(category)));

    document.body.appendChild(panel);
  }

  window.EncarHelper.filter = { mountPanel, shouldShow, onChange };
})();
