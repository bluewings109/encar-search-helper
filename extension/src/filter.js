// 매물 속성(용도변경이력, 단순수리, 신차대비 비율 등)에 따른 카드 표시/숨김 필터 UI 및 상태 관리
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

  // 신차대비 비율: 최댓값만 지정해 "신차가의 N% 이하 가격인 매물만 보기" 형태로 걸러낸다.
  const MAX_RATIO_STORAGE_KEY = "eh-max-price-ratio-filter";
  const MAX_RATIO_DEFAULT = { max: null, includeUnknown: true };

  function loadMaxRatioSettings() {
    try {
      const raw = localStorage.getItem(MAX_RATIO_STORAGE_KEY);
      if (!raw) return { ...MAX_RATIO_DEFAULT };
      return { ...MAX_RATIO_DEFAULT, ...JSON.parse(raw) };
    } catch {
      return { ...MAX_RATIO_DEFAULT };
    }
  }

  let maxRatioSettings = loadMaxRatioSettings();

  function saveMaxRatioSettings() {
    localStorage.setItem(MAX_RATIO_STORAGE_KEY, JSON.stringify(maxRatioSettings));
  }

  function matchesMaxRatio(ratio) {
    if (ratio === null || ratio === undefined) return maxRatioSettings.includeUnknown;
    if (maxRatioSettings.max === null) return true;
    return ratio <= maxRatioSettings.max;
  }

  /** extras가 null(상세조회 실패)이면 모든 항목을 "정보없음"으로 취급한다. */
  function shouldShow(extras) {
    const categoriesMatch = CATEGORIES.every((category) => matchesCategory(category, category.getValue(extras)));
    if (!categoriesMatch) return false;
    return matchesMaxRatio(extras ? extras.newPriceRatio : null);
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

  function buildMaxRatioSection() {
    const section = document.createElement("div");
    section.className = "eh-filter-section";

    const title = document.createElement("div");
    title.className = "eh-filter-title";
    title.textContent = "신차대비 비율 필터";
    section.appendChild(title);

    const row = document.createElement("label");
    row.className = "eh-filter-row";

    const maxInput = document.createElement("input");
    maxInput.type = "number";
    maxInput.className = "eh-filter-range-input";
    maxInput.placeholder = "제한없음";
    maxInput.min = "0";
    maxInput.value = maxRatioSettings.max === null ? "" : maxRatioSettings.max;
    maxInput.addEventListener("change", () => {
      const parsed = maxInput.value === "" ? null : Number(maxInput.value);
      maxRatioSettings = { ...maxRatioSettings, max: Number.isFinite(parsed) ? parsed : null };
      saveMaxRatioSettings();
      notify();
    });

    row.append(maxInput, document.createTextNode("% 이하만 보기"));
    section.appendChild(row);

    const unknownCheckbox = document.createElement("label");
    unknownCheckbox.className = "eh-filter-row";
    const unknownInput = document.createElement("input");
    unknownInput.type = "checkbox";
    unknownInput.checked = maxRatioSettings.includeUnknown;
    unknownInput.addEventListener("change", () => {
      maxRatioSettings = { ...maxRatioSettings, includeUnknown: unknownInput.checked };
      saveMaxRatioSettings();
      notify();
    });
    unknownCheckbox.append(unknownInput, document.createTextNode("정보없음 포함"));
    section.appendChild(unknownCheckbox);

    return section;
  }

  function mountPanel() {
    if (document.getElementById("eh-filter-panel")) return;

    const panel = document.createElement("div");
    panel.id = "eh-filter-panel";
    panel.className = "eh-filter-panel";

    CATEGORIES.forEach((category) => panel.appendChild(buildSection(category)));
    panel.appendChild(buildMaxRatioSection());

    document.body.appendChild(panel);
  }

  window.EncarHelper.filter = { mountPanel, shouldShow, onChange };
})();
