"""폴링 루프 진입점. 각 search 조건을 주기적으로 확인해 신규 매물을 텔레그램으로 알린다."""

import logging
import sys
import time

import encar_client
import notifier
from config import ConfigError, load_config
from state import load_seen, save_seen

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def _passes_detail_filters(search, extras):
    if extras is None:
        # 상세 조회 실패 시 필터링 없이 통과시킨다(알림을 놓치는 것보다 낫다).
        return True
    max_ratio = search.get("max_new_price_ratio")
    if max_ratio is not None and extras.get("newPriceRatio") is not None and extras["newPriceRatio"] > max_ratio:
        return False
    if search.get("exclude_usage_change") and extras.get("hasUsageChange"):
        return False
    if search.get("exclude_simple_repair") and extras.get("hasSimpleRepair"):
        return False
    if search.get("exclude_not_join_period") and extras.get("notJoinPeriods"):
        return False
    return True


def run_once(config, seen_by_search):
    for search in config["searches"]:
        name = search["name"]
        seen = seen_by_search.setdefault(name, set())
        try:
            action, sort = encar_client.parse_search_url(search["url"])
            listings = encar_client.fetch_listing_ids(action, sort)
        except Exception:
            log.exception("검색 '%s' 목록 조회 실패", name)
            continue

        new_listings = [item for item in listings if item.get("Id") and item["Id"] not in seen]
        if not new_listings:
            log.info("검색 '%s': 확인 완료(전체 %d건), 신규 0건", name, len(listings))
            continue
        log.info("검색 '%s': 신규 매물 %d건 발견(전체 %d건)", name, len(new_listings), len(listings))

        # 알림 메시지에 항상 상세 이력을 표시하므로 신규 매물은 전부 상세 조회한다.
        extras_by_id = encar_client.fetch_vehicle_extras_bulk([item["Id"] for item in new_listings])

        for listing in new_listings:
            list_id = listing["Id"]
            extras = extras_by_id.get(list_id)
            if _passes_detail_filters(search, extras):
                message = notifier.format_listing_message(name, listing, encar_client.detail_url(list_id), extras)
                notifier.send(config["telegram"], message)
            seen.add(list_id)


def main():
    try:
        config = load_config()
    except ConfigError as e:
        log.error(str(e))
        sys.exit(1)

    seen_by_search = load_seen()
    poll_interval = config["poll_interval_sec"]
    log.info("encar-watcher 시작. 검색 %d건, 주기 %d초", len(config["searches"]), poll_interval)

    while True:
        try:
            run_once(config, seen_by_search)
            save_seen(seen_by_search)
        except Exception:
            log.exception("폴링 중 예기치 못한 오류")
        time.sleep(poll_interval)


if __name__ == "__main__":
    main()
