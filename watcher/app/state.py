"""검색 항목별로 이미 알림을 보낸 매물 Id를 /data/seen_ids.json에 저장해
재시작 후에도 중복 알림을 방지한다."""

import json
import os

STATE_PATH = "/data/seen_ids.json"


def load_seen(path=STATE_PATH):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return {name: set(ids) for name, ids in json.load(f).items()}


def save_seen(seen_by_search, path=STATE_PATH):
    serializable = {name: sorted(ids) for name, ids in seen_by_search.items()}
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(serializable, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)
