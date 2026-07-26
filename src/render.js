// 카드에 삽입할 뱃지 DOM 생성 담당
window.EncarHelper = window.EncarHelper || {};

(() => {
  function formatWon(amount) {
    if (amount === null || amount === undefined) return "정보없음";
    if (amount === 0) return "0원";
    const manwon = amount / 10000;
    const rounded = Number.isInteger(manwon) ? manwon : Math.round(manwon * 10) / 10;
    return `${rounded.toLocaleString("ko-KR")}만원`;
  }

  function yesNoBadge(label, value) {
    const state = value === null ? "unknown" : value ? "yes" : "no";
    const text = value === null ? "정보없음" : value ? "있음" : "없음";
    const span = document.createElement("span");
    span.className = `eh-badge eh-badge--${state}`;
    span.textContent = `${label} ${text}`;
    return span;
  }

  function countCostBadge(label, count, cost) {
    const state = count === null || count === undefined ? "unknown" : count > 0 ? "yes" : "no";
    const text =
      count === null || count === undefined
        ? "정보없음"
        : `${count}회 · ${formatWon(cost)}`;
    const span = document.createElement("span");
    span.className = `eh-badge eh-badge--${state}`;
    span.textContent = `${label} ${text}`;
    return span;
  }

  function countBadge(label, count) {
    const state = count === null || count === undefined ? "unknown" : count > 0 ? "yes" : "no";
    const text = count === null || count === undefined ? "정보없음" : `${count}회`;
    const span = document.createElement("span");
    span.className = `eh-badge eh-badge--${state}`;
    span.textContent = `${label} ${text}`;
    return span;
  }

  /** "202204~202407" -> "2022.04~2024.07" */
  function formatPeriod(period) {
    return period.replace(/(\d{4})(\d{2})/g, "$1.$2");
  }

  function notJoinPeriodBadge(periods) {
    const state = periods === null ? "unknown" : periods.length > 0 ? "yes" : "no";
    const text =
      periods === null ? "정보없음" : periods.length > 0 ? periods.map(formatPeriod).join(", ") : "없음";
    const span = document.createElement("span");
    span.className = `eh-badge eh-badge--${state}`;
    span.textContent = `정보제공 불가능기간 ${text}`;
    return span;
  }

  /** ratio: 신차가 대비 현재 판매가 비율(%). 예: 87.9 -> "신차대비 87.9%" (신차가의 87.9% 가격) */
  function newPriceRatioBadge(ratio) {
    const state = ratio === null || ratio === undefined ? "unknown" : "info";
    const text = ratio === null || ratio === undefined ? "정보없음" : `${ratio}%`;
    const span = document.createElement("span");
    span.className = `eh-badge eh-badge--${state}`;
    span.textContent = `신차대비 ${text}`;
    return span;
  }

  function buildBadgeContainer(extras) {
    const container = document.createElement("span");
    container.className = "eh-badges";
    container.append(
      yesNoBadge("용도변경", extras.hasUsageChange),
      yesNoBadge("사고이력", extras.hasAccident),
      yesNoBadge("단순수리", extras.hasSimpleRepair),
      countCostBadge("내차피해", extras.myAccidentCount, extras.myAccidentCost),
      countCostBadge("타차가해", extras.otherAccidentCount, extras.otherAccidentCost),
      countBadge("소유자변경", extras.ownerChangeCount),
      notJoinPeriodBadge(extras.notJoinPeriods),
      newPriceRatioBadge(extras.newPriceRatio)
    );
    return container;
  }

  function renderLoading() {
    const span = document.createElement("span");
    span.className = "eh-badges eh-badges--loading";
    span.textContent = "이력 조회 중...";
    return span;
  }

  function renderError() {
    const span = document.createElement("span");
    span.className = "eh-badges eh-badges--error";
    span.textContent = "이력 조회 실패";
    return span;
  }

  window.EncarHelper.render = { buildBadgeContainer, renderLoading, renderError };
})();
