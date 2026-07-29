"""텔레그램 Bot API로 알림을 보낸다. 외부 라이브러리 없이 표준 라이브러리 HTTP만 사용."""

import json
import logging
from urllib.request import Request, urlopen

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


def format_listing_message(search_name, listing, detail_url, extras=None):
    price_man = listing.get("Price")
    price_text = f"{price_man:,.0f}만원" if price_man is not None else "가격 정보없음"
    title = " ".join(filter(None, [listing.get("Manufacturer"), listing.get("Model"), listing.get("Badge")]))
    year = listing.get("FormYear", "?")
    mileage = listing.get("Mileage")
    mileage_text = f"{mileage:,.0f}km" if mileage is not None else "주행거리 정보없음"

    lines = [
        f"🚗 [{search_name}] 신규 매물",
        title,
        f"{year}년식 · {mileage_text} · {price_text}",
    ]
    if extras and extras.get("newPriceRatio") is not None:
        lines.append(f"신차대비 {extras['newPriceRatio']}%")
    lines.append(detail_url)
    return "\n".join(lines)
