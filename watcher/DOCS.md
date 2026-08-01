# 엔카 매물 알림 워처

모든 설정은 애드온의 **구성(Configuration)** 탭에서 합니다. 별도 파일 편집이 필요 없습니다.

## 설정 방법

1. 애드온 **구성** 탭에서 `telegram.bot_token`, `telegram.chat_id`를 채웁니다. 텔레그램 봇 만드는 법은 [README.md](README.md)를 참고하세요.
2. `searches` 목록에 감시하고 싶은 조건을 추가합니다.
   - `name`: 텔레그램 알림 메시지에 표시할 이름
   - `url`: encar.com(PC) 또는 모바일 웹(car.encar.com)에서 원하는 조건(제조사/모델/가격/연식/주행거리 등)으로 검색한 뒤 **브라우저 주소창의 URL을 그대로 복사**해서 붙여넣습니다.
   - `max_new_price_ratio`, `exclude_usage_change`, `exclude_simple_repair`, `exclude_not_join_period`는 선택 항목이며, 지정한 항목만 신규 매물 상세 조회 후 추가로 걸러냅니다.
3. `poll_interval_sec`(기본 300초)로 폴링 주기를 조정합니다. encar 서버 부담을 고려해 60초 미만은 설정할 수 없습니다.
4. 애드온을 시작(재시작)하면 설정한 주기로 신규 매물을 확인해 텔레그램으로 알려줍니다.

## 로그

애드온 로그 탭에서 폴링 결과와 오류를 확인할 수 있습니다.
