// 매물 목록 카드를 찾아 상세 이력 뱃지를 주입하는 진입점
(() => {
  const { api, render } = window.EncarHelper;
  const CARID_RE = /[?&]carid=(\d+)/;
  const processed = new WeakSet();

  function extractListId(anchor) {
    const href = anchor.getAttribute("href") || "";
    const match = href.match(CARID_RE);
    return match ? match[1] : null;
  }

  function findInsertionPoint(anchor) {
    return anchor.querySelector(".detail") || anchor;
  }

  async function hydrateCard(anchor, listId) {
    const mount = findInsertionPoint(anchor);
    const loading = render.renderLoading();
    mount.appendChild(loading);

    const extras = await api.getVehicleExtras(listId);

    loading.remove();
    mount.appendChild(extras ? render.buildBadgeContainer(extras) : render.renderError());
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
  }

  function processAnchor(anchor) {
    if (processed.has(anchor)) return;
    const listId = extractListId(anchor);
    if (!listId) return;
    processed.add(anchor);
    observeVisibility(anchor, listId);
  }

  function scan(root) {
    root.querySelectorAll('a[href*="carid="]').forEach(processAnchor);
  }

  scan(document);

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
