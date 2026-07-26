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

  /** 배열 안에 서로 다른 값이 2개 이상이면 그 항목의 값이 변경된 이력이 있다는 뜻이다. */
  function hasVariance(arr) {
    return Array.isArray(arr) && new Set(arr).size > 1;
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

    // 용도변경이력은 성능점검기록부(usageChangeTypes)뿐 아니라 보험이력의 용도 코드
    // 변경 내역(carInfoUse1s/2s에 서로 다른 값이 남아 있는 경우, 예: 렌트→자가용)으로도
    // 나타난다. 실제 상세페이지의 "특이 사항: 렌트 이력" 표시는 후자로만 확인되는
    // 경우가 있어 두 소스를 모두 반영한다.
    const usageChangedByInspection = usageChangeTypes.length > 0;
    const usageChangedByRecord =
      !!record && (hasVariance(record.carInfoUse1s) || hasVariance(record.carInfoUse2s));

    // 보험이력 정보제공 불가능기간(notJoinDate1~5): 보험사에 정보 제공 미동의 등으로
    // 해당 기간의 사고이력을 조회할 수 없다는 뜻이라 사고이력 "없음"과는 다른 의미다.
    const notJoinPeriods = record
      ? [record.notJoinDate1, record.notJoinDate2, record.notJoinDate3, record.notJoinDate4, record.notJoinDate5].filter(
          Boolean
        )
      : null;

    return {
      hasUsageChange: !master && !record ? null : usageChangedByInspection || usageChangedByRecord,
      hasAccident: master ? Boolean(master.accdient) : null,
      hasSimpleRepair: master ? Boolean(master.simpleRepair) : null,
      myAccidentCount: record ? record.myAccidentCnt : null,
      myAccidentCost: record ? record.myAccidentCost : null,
      otherAccidentCount: record ? record.otherAccidentCnt : null,
      otherAccidentCost: record ? record.otherAccidentCost : null,
      ownerChangeCount: record ? record.ownerChangeCnt : null,
      notJoinPeriods,
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
