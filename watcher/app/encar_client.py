"""엔카 공개 API 호출. 목록 검색 및 매물 상세 조건(신차대비 비율, 단순수리,
용도변경이력, 보험이력 정보제공 불가능기간) 조회. 로직은 크롬 익스텐션의
extension/src/api.js를 그대로 포팅했다."""

import json
import logging
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote, unquote
from urllib.request import Request, urlopen

API_BASE = "https://api.encar.com"
LIST_BASE = "https://www.encar.com/dc/dc_cardetailview.do"
USER_AGENT = "Mozilla/5.0 (encar-watcher)"
MAX_CONCURRENT_DETAIL_REQUESTS = 4
LIST_PAGE_SIZE = 50

log = logging.getLogger(__name__)


def _fetch_json(url):
    req = Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
    with urlopen(req, timeout=10) as res:
        return json.loads(res.read().decode("utf-8"))


def parse_search_url(url):
    """encar.com에서 필터링 후 복사한 검색결과 URL에서 목록 API 호출에 필요한
    action(query DSL)과 sort를 추출한다. URL의 `#!{...}` 프래그먼트가 JSON이다."""
    if "#!" not in url:
        raise ValueError("검색 URL에 '#!' 프래그먼트가 없습니다. encar.com에서 필터를 적용한 뒤 주소창 URL을 복사했는지 확인하세요.")
    fragment = url.split("#!", 1)[1]
    data = json.loads(unquote(fragment))
    action = data.get("action")
    if not action:
        raise ValueError("검색 URL에서 action 조건을 찾을 수 없습니다.")
    sort = data.get("sort", "ModifiedDate")
    return action, sort


def fetch_listing_ids(action, sort, limit=LIST_PAGE_SIZE):
    """검색 조건에 맞는 매물 Id 목록(가격/모델 등 요약 정보 포함)을 최신순으로 가져온다."""
    sr_value = f"|{sort}|0|{limit}"
    url = f"{API_BASE}/search/car/list/general?count=true&q={quote(action, safe='().,_')}&sr={quote(sr_value, safe='')}"
    data = _fetch_json(url)
    return data.get("SearchResults", [])


def detail_url(list_id):
    return f"{LIST_BASE}?carid={list_id}"


def _has_variance(arr):
    return isinstance(arr, list) and len(set(arr)) > 1


def _calc_new_price_ratio(vehicle, option_catalog):
    category = vehicle.get("category") or {}
    advertisement = vehicle.get("advertisement") or {}
    origin_price = category.get("originPrice")
    current_price = advertisement.get("price")
    if not origin_price or current_price is None:
        return None

    selected_codes = ((vehicle.get("options") or {}).get("choice")) or []
    options_total = sum(
        option.get("price", 0) for option in (option_catalog or []) if option.get("optionCd") in selected_codes
    )

    full_new_price = origin_price + options_total
    if full_new_price <= 0:
        return None
    return round(current_price / full_new_price * 1000) / 10


def fetch_vehicle_extras(list_id):
    """매물 하나의 상세 조건(신차대비 비율, 단순수리, 용도변경이력, 보험이력
    정보제공 불가능기간)을 조회한다. 실패 시 None."""
    try:
        vehicle = _fetch_json(f"{API_BASE}/v1/readside/vehicle/{list_id}")
        vehicle_id = vehicle.get("vehicleId")
        if not vehicle_id:
            return None

        def safe_fetch(url):
            try:
                return _fetch_json(url)
            except Exception:
                return None

        with ThreadPoolExecutor(max_workers=3) as pool:
            inspection_f = pool.submit(safe_fetch, f"{API_BASE}/v1/readside/inspection/vehicle/{vehicle_id}")
            record_f = pool.submit(safe_fetch, f"{API_BASE}/v1/readside/record/vehicle/{vehicle_id}/open")
            options_f = pool.submit(safe_fetch, f"{API_BASE}/v1/readside/vehicles/car/{vehicle_id}/options/choice")
            inspection, record, option_catalog = inspection_f.result(), record_f.result(), options_f.result()

        master = (inspection or {}).get("master")
        usage_change_types = ((master or {}).get("detail") or {}).get("usageChangeTypes") or []
        usage_changed_by_inspection = len(usage_change_types) > 0
        usage_changed_by_record = bool(record) and (
            _has_variance(record.get("carInfoUse1s")) or _has_variance(record.get("carInfoUse2s"))
        )

        not_join_periods = None
        if record:
            not_join_periods = [
                record.get(f"notJoinDate{i}") for i in range(1, 6) if record.get(f"notJoinDate{i}")
            ]

        return {
            "hasUsageChange": None if not master and not record else (usage_changed_by_inspection or usage_changed_by_record),
            "hasSimpleRepair": bool(master.get("simpleRepair")) if master else None,
            "notJoinPeriods": not_join_periods,
            "newPriceRatio": _calc_new_price_ratio(vehicle, option_catalog),
        }
    except Exception:
        log.exception("매물 상세 조회 실패: %s", list_id)
        return None


def fetch_vehicle_extras_bulk(list_ids):
    """여러 매물의 상세 조건을 동시성 제한을 두고 조회한다."""
    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_DETAIL_REQUESTS) as pool:
        results = pool.map(fetch_vehicle_extras, list_ids)
    return dict(zip(list_ids, results))
