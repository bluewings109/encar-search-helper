// 매물 목록 카드를 찾아 상세 이력 뱃지를 주입하고, 용도변경이력 필터를 적용하는 진입점
(() => {
  const { api, render, filter, mileage } = window.EncarHelper;
  const CARID_RE = /[?&]carid=(\d+)/;
  const cards = new Map(); // anchor -> { listId, cardRoot, extras }

  function extractListId(anchor) {
    const href = anchor.getAttribute("href") || "";
    const match = href.match(CARID_RE);
    return match ? match[1] : null;
  }

  function findInsertionPoint(anchor) {
    return anchor.querySelector(".detail") || anchor;
  }

  function applyVisibility(anchor) {
    const card = cards.get(anchor);
    if (!card || card.extras === undefined) return;
    const visible = filter.shouldShow(card.extras ? card.extras.hasUsageChange : null);
    card.cardRoot.style.display = visible ? "" : "none";
  }

  async function hydrateCard(anchor, listId) {
    const card = cards.get(anchor);
    const mount = findInsertionPoint(anchor);
    const loading = render.renderLoading();
    mount.appendChild(loading);

    const extras = await api.getVehicleExtras(listId);

    loading.remove();
    mount.appendChild(extras ? render.buildBadgeContainer(extras) : render.renderError());

    card.extras = extras;
    applyVisibility(anchor);
  }

  function observeVisibility(anchor, listId) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();
        hydrateCard(anchor, listId);
      }
    });
    observer.observe(anchor);
    cards.get(anchor).observer = observer;
  }

  function processAnchor(anchor) {
    if (cards.has(anchor)) return;
    const listId = extractListId(anchor);
    if (!listId) return;
    const cardRoot = anchor.closest("li") || anchor;
    cards.set(anchor, { listId, cardRoot, extras: undefined });
    mileage.render(anchor);
    observeVisibility(anchor, listId);
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
