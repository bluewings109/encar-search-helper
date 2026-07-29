# 엔카 매물 알림 워처 (Home Assistant Add-on)

브라우저를 열지 않아도, 원하는 조건의 엔카 신규 매물이 올라오면 텔레그램으로 알려주는 Home Assistant 로컬 Add-on입니다.

- 검색 조건은 add-on 설정 UI가 아니라 `/share/encar_watcher/config.yaml` 파일로 직접 지정합니다.
- 조건 지정은 encar.com에서 원하는 대로 검색/필터링한 뒤 **주소창 URL을 그대로 복사**하는 방식이라 별도 문법을 배울 필요가 없습니다.
- 신차대비 비율 상한, 용도변경이력/단순수리 제외처럼 encar 검색 UI에 없는 조건은 설정 파일에서 추가로 지정할 수 있습니다([`config.example.yaml`](config.example.yaml) 참고).

## 1. 텔레그램 봇 만들기

1. 텔레그램에서 [@BotFather](https://t.me/BotFather)에게 `/newbot`을 보냅니다.
2. 봇 이름과 사용자명(반드시 `bot`으로 끝나야 함)을 입력하면 **API 토큰**을 줍니다. 이 값이 `telegram.bot_token`입니다.
3. 만든 봇과 대화를 시작합니다(아무 메시지나 하나 보내면 됩니다. 예: `/start`).
4. 브라우저에서 아래 주소에 접속해 `chat_id`를 확인합니다(토큰 부분을 실제 값으로 교체):
   ```
   https://api.telegram.org/bot<봇토큰>/getUpdates
   ```
   응답 JSON에서 `"message":{"chat":{"id":123456789, ...}}`의 `id` 값이 `telegram.chat_id`입니다.
   (아무 응답이 없다면 3번에서 봇에게 메시지를 먼저 보냈는지 확인하세요.)

## 2. Home Assistant에 로컬 Add-on으로 설치

1. Home Assistant 호스트의 `/addons` 폴더(Samba 공유 이름: `addons`)에 `local` 폴더가 없다면 만듭니다.
2. 이 `watcher/` 폴더 전체를 `/addons/local/encar_watcher`로 복사합니다.
3. Home Assistant에서 **설정 → 애드온 → 애드온 스토어**로 이동해 우측 상단 새로고침을 누르면 "로컬 애드온" 섹션에 "엔카 매물 알림 워처"가 나타납니다.
4. 설치 후 시작하기 전에 아래 3단계로 설정 파일부터 준비하세요.

## 3. 설정 파일 준비

1. `/share/encar_watcher/` 폴더를 만들고 [`config.example.yaml`](config.example.yaml)을 `/share/encar_watcher/config.yaml`로 복사합니다.
2. 1단계에서 얻은 `bot_token`, `chat_id`를 채웁니다.
3. `searches`에 감시할 조건을 추가합니다:
   - encar.com에서 국산/수입/친환경 등 원하는 카테고리로 이동해 제조사·모델·연식·가격·주행거리 등을 원하는 대로 필터링합니다.
   - 필터링이 끝난 상태의 **브라우저 주소창 URL 전체**를 복사해 `url` 필드에 붙여넣습니다.
   - 신차대비 비율 상한, 용도변경이력/단순수리/보험이력 정보제공 불가능기간 제외 등은 선택적으로 추가합니다.
4. Add-on을 시작합니다. 로그 탭에서 "encar-watcher 시작..." 메시지와 폴링 결과를 확인할 수 있습니다.

## 동작 원리

- 목록 조회: `https://api.encar.com/search/car/list/general` — 검색 URL의 `#!{...}` 프래그먼트에 담긴 조건(action/sort)을 그대로 재사용합니다.
- 신규 매물은 전부 크롬 익스텐션(`../extension`)과 동일한 상세 API 3종(`inspection`, `record`, `options/choice`)을 호출해 용도변경이력·사고이력·단순수리·내차피해/타차가해 횟수·금액·소유자변경 횟수·보험이력 정보제공 불가능기간·신차대비 비율을 조회하고, 알림 메시지에 전부 표시합니다. 차량 경과기간(X년 X개월차)·연간 주행거리는 목록 API의 연식/주행거리만으로 계산합니다(상세 조회 불필요).
- 위 항목 중 `exclude_*`/`max_new_price_ratio`로 지정한 조건은 알림 발송 여부를 걸러내는 데에도 쓰입니다(표시는 항상 되고, 필터는 선택적으로 추가 적용).
- 이미 알림을 보낸 매물 Id는 검색 항목별로 `/data/seen_ids.json`에 저장되어, Add-on을 재시작해도 중복 알림을 보내지 않습니다.

## 주의사항

- 이 API들은 encar가 공식 문서화한 API가 아니라 웹사이트가 내부적으로 사용하는 엔드포인트이므로, encar 측 변경에 따라 동작하지 않을 수 있습니다.
- 폴링 주기(`poll_interval_sec`)를 너무 짧게 잡지 마세요(5분 이상 권장). 요청이 지나치게 잦으면 차단될 수 있습니다.
