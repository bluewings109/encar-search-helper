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

  function buildBadgeContainer(extras) {
    const container = document.createElement("span");
    container.className = "eh-badges";
    container.append(
      yesNoBadge("용도변경", extras.hasUsageChange),
      yesNoBadge("사고이력", extras.hasAccident),
      yesNoBadge("단순수리", extras.hasSimpleRepair),
      countCostBadge("내차피해", extras.myAccidentCount, extras.myAccidentCost),
      countCostBadge("타차가해", extras.otherAccidentCount, extras.otherAccidentCost),
      countBadge("소유자변경", extras.ownerChangeCount)
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
