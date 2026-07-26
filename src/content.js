// 매물 목록 카드를 찾아 상세 이력 뱃지를 주입하고, 용도변경이력 필터를 적용하는 진입점
(() => {
  const { api, render, filter, mileage } = window.EncarHelper;
  const CARID_RE = /[?&]carid=(\d+)/;
  const cards = new Map(); // anchor -> { listId, cardRoot, extras }
  const processedListIds = new Set(); // 일반등록 표는 매물 하나당 <a carid=...>가 두 개라 중복 방지

  function extractListId(anchor) {
    const href = anchor.getAttribute("href") || "";
    const match = href.match(CARID_RE);
    return match ? match[1] : null;
  }

  function findCardRoot(anchor) {
    return anchor.closest("tr") || anchor.closest("li") || anchor;
  }

  function findInsertionPoint(anchor, cardRoot) {
    return anchor.querySelector(".detail") || cardRoot.querySelector(".detail") || anchor;
  }

  function applyVisibility(anchor) {
    const card = cards.get(anchor);
    if (!card || card.extras === undefined) return;
    const visible = filter.shouldShow(card.extras ? card.extras.hasUsageChange : null);
    card.cardRoot.style.display = visible ? "" : "none";
  }

  async function hydrateCard(anchor, listId) {
    const card = cards.get(anchor);
    const mount = findInsertionPoint(anchor, card.cardRoot);
    const loading = render.renderLoading();
    mount.appendChild(loading);

    const extras = await api.getVehicleExtras(listId);

    loading.remove();
    mount.appendChild(extras ? render.buildBadgeContainer(extras) : render.renderError());

    card.extras = extras;
    applyVisibility(anchor);
  }

  // anchor 자체가 아니라 cardRoot를 관찰한다. 표 형태 매물은 carid 앵커 중 하나가
  // (이미지 토글 등의 이유로) style="display:none"일 수 있는데, display:none 요소는
  // 레이아웃이 없어 IntersectionObserver가 절대 발동하지 않기 때문이다.
  function observeVisibility(anchor, listId, cardRoot) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();
        hydrateCard(anchor, listId);
      }
    });
    observer.observe(cardRoot);
    cards.get(anchor).observer = observer;
  }

  function processAnchor(anchor) {
    if (cards.has(anchor)) return;
    const listId = extractListId(anchor);
    if (!listId) return;
    // 일반등록 표는 매물 하나(<tr>)에 carid를 가진 <a>가 두 개(썸네일용/텍스트용) 있어
    // 뱃지가 중복 삽입되지 않도록 같은 listId는 한 번만 처리한다.
    if (processedListIds.has(listId)) return;
    processedListIds.add(listId);

    const cardRoot = findCardRoot(anchor);
    cards.set(anchor, { listId, cardRoot, extras: undefined });
    mileage.render(anchor, cardRoot);
    observeVisibility(anchor, listId, cardRoot);
  }

  function scan(root) {
    root.querySelectorAll('a[href*="carid="]').forEach(processAnchor);
  }

  function rehydrateAllForFilterChange() {
    cards.forEach((card, anchor) => {
      if (card.extras === undefined) {
        if (card.observer) card.observer.disconnect();
        hydrateCard(anchor, card.listId);
      } else {
        applyVisibility(anchor);
      }
    });
  }

  scan(document);
  filter.mountPanel();
  filter.onChange(rehydrateAllForFilterChange);

  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches && node.matches('a[href*="carid="]')) {
          processAnchor(node);
        }
        scan(node);
      });
    }
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
})();
