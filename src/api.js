// 엔카 내부 API 호출 및 캐싱 담당
window.EncarHelper = window.EncarHelper || {};

(() => {
  const API_BASE = "https://api.encar.com";
  const cache = new Map(); // listId -> Promise<result|null>
  const MAX_CONCURRENT = 4;
  let active = 0;
  const queue = [];

  function runQueued() {
    if (active >= MAX_CONCURRENT || queue.length === 0) return;
    const task = queue.shift();
    active += 1;
    task().finally(() => {
      active -= 1;
      runQueued();
    });
  }

  function enqueue(task) {
    return new Promise((resolve) => {
      queue.push(() => task().then(resolve, () => resolve(null)));
      runQueued();
    });
  }

  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "omit",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }

  async function fetchVehicleExtras(listId) {
    const vehicle = await fetchJson(`${API_BASE}/v1/readside/vehicle/${listId}`);
    const vehicleId = vehicle.vehicleId;
    if (!vehicleId) throw new Error("vehicleId not found");

    const [inspection, record] = await Promise.all([
      fetchJson(`${API_BASE}/v1/readside/inspection/vehicle/${vehicleId}`).catch(() => null),
      fetchJson(`${API_BASE}/v1/readside/record/vehicle/${vehicleId}/open`).catch(() => null),
    ]);

    const master = inspection && inspection.master ? inspection.master : null;
    const usageChangeTypes =
      master && master.detail && Array.isArray(master.detail.usageChangeTypes)
        ? master.detail.usageChangeTypes
        : [];

    return {
      hasUsageChange: usageChangeTypes.length > 0,
      hasAccident: master ? Boolean(master.accdient) : null,
      hasSimpleRepair: master ? Boolean(master.simpleRepair) : null,
      myAccidentCount: record ? record.myAccidentCnt : null,
      myAccidentCost: record ? record.myAccidentCost : null,
      otherAccidentCount: record ? record.otherAccidentCnt : null,
      otherAccidentCost: record ? record.otherAccidentCost : null,
      ownerChangeCount: record ? record.ownerChangeCnt : null,
    };
  }

  /** listId(매물 목록 상의 carid)로 상세 정보를 조회한다. 실패 시 null. 세션 내 결과는 캐시된다. */
  function getVehicleExtras(listId) {
    if (cache.has(listId)) return cache.get(listId);
    const promise = enqueue(() => fetchVehicleExtras(listId)).catch(() => null);
    cache.set(listId, promise);
    return promise;
  }

  window.EncarHelper.api = { getVehicleExtras };
})();
