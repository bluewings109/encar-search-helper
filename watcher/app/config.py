"""Home Assistant 애드온 옵션(/data/options.json) 로드 및 검증."""

import json

DEFAULT_OPTIONS_PATH = "/data/options.json"
DEFAULT_POLL_INTERVAL_SEC = 300


class ConfigError(Exception):
    pass


def load_config(path=DEFAULT_OPTIONS_PATH):
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f) or {}
    except FileNotFoundError:
        raise ConfigError(
            f"애드온 옵션 파일을 찾을 수 없습니다: {path} "
            "(애드온 설정 화면에서 옵션을 저장한 뒤 시작했는지 확인하세요)"
        )

    telegram = raw.get("telegram") or {}
    if not telegram.get("bot_token") or not telegram.get("chat_id"):
        raise ConfigError("애드온 설정에서 telegram.bot_token / telegram.chat_id를 채워야 합니다.")

    searches = raw.get("searches") or []
    if not searches:
        raise ConfigError("애드온 설정의 searches 항목을 최소 1개 이상 추가해야 합니다.")
    for search in searches:
        if not search.get("name") or not search.get("url"):
            raise ConfigError(f"searches 항목에는 name과 url이 필요합니다: {search}")

    return {
        "telegram": telegram,
        "poll_interval_sec": raw.get("poll_interval_sec", DEFAULT_POLL_INTERVAL_SEC),
        "searches": searches,
    }
