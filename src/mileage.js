// 연식/주행거리 텍스트를 파싱해 "연간 주행거리"를 계산·표시 (API 호출 불필요)
window.EncarHelper = window.EncarHelper || {};

(() => {
  const YEAR_MONTH_RE = /(\d{2})\/(\d{2})/;

  function parseYearMonth(text) {
    const match = text.match(YEAR_MONTH_RE);
    if (!match) return null;
    const yy = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const currentYY = new Date().getFullYear() % 100;
    const year = yy <= currentYY ? 2000 + yy : 1900 + yy;
    return { year, month };
  }

  function parseMileage(text) {
    const digits = text.replace(/[^0-9]/g, "");
    return digits ? parseInt(digits, 10) : null;
  }

  function ageInMonths(year, month) {
    const now = new Date();
    const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
    return Math.max(months, 1);
  }

  function render(anchor) {
    const detail = anchor.querySelector(".detail");
    if (!detail || detail.querySelector(".eh-mileage-per-year")) return;

    const yerEl = detail.querySelector(".yer");
    const kmEl = detail.querySelector(".km");
    if (!yerEl || !kmEl) return;

    const yearMonth = parseYearMonth(yerEl.textContent);
    const mileage = parseMileage(kmEl.textContent);
    if (!yearMonth || mileage === null) return;

    const perYear = Math.round((mileage * 12) / ageInMonths(yearMonth.year, yearMonth.month));

    const span = document.createElement("span");
    span.className = "eh-mileage-per-year";
    span.textContent = `· 연 ${perYear.toLocaleString("ko-KR")}km`;
    kmEl.insertAdjacentElement("afterend", span);
  }

  window.EncarHelper.mileage = { render };
})();
