// 연식/주행거리 텍스트를 파싱해 "차량 경과기간"과 "연간 주행거리"를 계산·표시 (API 호출 불필요)
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

  function formatAge(months) {
    const years = Math.floor(months / 12);
    const remainMonths = months % 12;
    if (years === 0) return `${remainMonths}개월차`;
    if (remainMonths === 0) return `${years}년차`;
    return `${years}년 ${remainMonths}개월차`;
  }

  function buildBadge(text) {
    const span = document.createElement("span");
    span.className = "eh-badge eh-badge--info";
    span.textContent = text;
    return span;
  }

  // 기존 "yer · km · 연료 · 지역" 한 줄 안에 인라인으로 끼워 넣으면 그 줄의 폭 제약 때문에
  // 잘리거나 눈에 띄지 않을 수 있어, 사고이력 뱃지들과 같은 방식(자체 flex 줄)으로 표시한다.
  //
  // 사진형 카드는 .detail이 <a> 안에 있지만, 일반등록 표 형태는 .detail이 <a>의 형제
  // 요소(같은 <tr> 안)로 떨어져 있어 anchor 내부 검색만으로는 못 찾는다. cardRoot(보통
  // <tr> 또는 <li>)까지 넓혀서 찾는다.
  function render(anchor, cardRoot) {
    const root = cardRoot || anchor;
    const mount = anchor.querySelector(".detail") || root.querySelector(".detail");
    if (!mount || mount.querySelector(".eh-mileage-badges")) return;

    const yerEl = mount.querySelector(".yer");
    if (!yerEl) return;

    const yearMonth = parseYearMonth(yerEl.textContent);
    if (!yearMonth) return;

    const months = ageInMonths(yearMonth.year, yearMonth.month);

    const container = document.createElement("span");
    container.className = "eh-mileage-badges";
    container.appendChild(buildBadge(formatAge(months)));

    const kmEl = mount.querySelector(".km");
    const mileage = kmEl ? parseMileage(kmEl.textContent) : null;
    if (mileage !== null) {
      const perYear = Math.round((mileage * 12) / months);
      container.appendChild(buildBadge(`연 ${perYear.toLocaleString("ko-KR")}km`));
    }

    mount.appendChild(container);
  }

  window.EncarHelper.mileage = { render };
})();
