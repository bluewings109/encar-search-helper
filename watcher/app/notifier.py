"""텔레그램 Bot API로 알림을 보낸다. 외부 라이브러리 없이 표준 라이브러리 HTTP만 사용.
메시지에 담는 항목/문구는 크롬 익스텐션(extension/src/render.js)과 맞췄다."""

import json
import logging
from urllib.request import Request, urlopen

import mileage

log = logging.getLogger(__name__)


def send(telegram_config, text):
    bot_token = telegram_config["bot_token"]
    chat_id = telegram_config["chat_id"]
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = json.dumps(
        {"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": False}
    ).encode("utf-8")
    req = Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(req, timeout=10) as res:
            if res.status != 200:
                log.error("텔레그램 전송 실패: HTTP %s", res.status)
    except Exception:
        log.exception("텔레그램 전송 중 오류")


def _format_won(amount):
    if amount is None:
        return "정보없음"
    if amount == 0:
        return "0원"
    manwon = amount / 10000
    rounded = round(manwon, 1)
    return f"{rounded:,.0f}만원" if rounded == int(rounded) else f"{rounded:,.1f}만원"


def _yes_no(value):
    if value is None:
        return "정보없음"
    return "있음" if value else "없음"


def _count_cost(count, cost):
    if count is None:
        return "정보없음"
    return f"{count}회 · {_format_won(cost)}"


def _count(value):
    if value is None:
        return "정보없음"
    return f"{value}회"


def _format_not_join_periods(periods):
    if periods is None:
        return "정보없음"
    if not periods:
        return "없음"
    return ", ".join(p[:4] + "." + p[4:] for p in periods)


def _extras_lines(extras):
    if extras is None:
        return ["상세 이력: 조회 실패"]
    return [
        f"용도변경이력 {_yes_no(extras.get('hasUsageChange'))}",
        f"사고이력 {_yes_no(extras.get('hasAccident'))}",
        f"단순수리 {_yes_no(extras.get('hasSimpleRepair'))}",
        f"내차피해 {_count_cost(extras.get('myAccidentCount'), extras.get('myAccidentCost'))}",
        f"타차가해 {_count_cost(extras.get('otherAccidentCount'), extras.get('otherAccidentCost'))}",
        f"소유자변경 {_count(extras.get('ownerChangeCount'))}",
        f"정보제공 불가능기간 {_format_not_join_periods(extras.get('notJoinPeriods'))}",
        f"신차대비 {extras['newPriceRatio']}%" if extras.get("newPriceRatio") is not None else "신차대비 정보없음",
    ]


def format_listing_message(search_name, listing, detail_url, extras=None):
    price_man = listing.get("Price")
    price_text = f"{price_man:,.0f}만원" if price_man is not None else "가격 정보없음"
    title = " ".join(filter(None, [listing.get("Manufacturer"), listing.get("Model"), listing.get("Badge")]))
    year = listing.get("FormYear", "?")
    raw_mileage = listing.get("Mileage")
    mileage_text = f"{raw_mileage:,.0f}km" if raw_mileage is not None else "주행거리 정보없음"

    age_text = None
    annual_mileage_text = None
    if listing.get("Year"):
        months = mileage.age_in_months(listing["Year"])
        age_text = mileage.format_age(months)
        annual = mileage.annual_mileage(raw_mileage, months)
        annual_mileage_text = f"연 {annual:,}km" if annual is not None else None

    summary = f"{year}년식 · {mileage_text} · {price_text}"
    if age_text:
        summary += f" · {age_text}"
    if annual_mileage_text:
        summary += f" · {annual_mileage_text}"

    lines = [f"🚗 [{search_name}] 신규 매물", title, summary, *_extras_lines(extras), detail_url]
    return "\n".join(lines)
