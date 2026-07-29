"""/share/encar_watcher/config.yaml 로드 및 검증."""

import yaml

DEFAULT_CONFIG_PATH = "/share/encar_watcher/config.yaml"
DEFAULT_POLL_INTERVAL_SEC = 300


class ConfigError(Exception):
    pass


def load_config(path=DEFAULT_CONFIG_PATH):
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f) or {}
    except FileNotFoundError:
        raise ConfigError(
            f"설정 파일을 찾을 수 없습니다: {path} "
            "(watcher/config.example.yaml을 참고해 이 경로에 파일을 만들어주세요)"
        )

    telegram = raw.get("telegram") or {}
    if not telegram.get("bot_token") or not telegram.get("chat_id"):
        raise ConfigError("telegram.bot_token / telegram.chat_id를 설정해야 합니다.")

    searches = raw.get("searches") or []
    if not searches:
        raise ConfigError("searches 항목이 최소 1개 이상 필요합니다.")
    for search in searches:
        if not search.get("name") or not search.get("url"):
            raise ConfigError(f"searches 항목에는 name과 url이 필요합니다: {search}")

    return {
        "telegram": telegram,
        "poll_interval_sec": raw.get("poll_interval_sec", DEFAULT_POLL_INTERVAL_SEC),
        "searches": searches,
    }
