# 엔카 매물 알림 워처

이 애드온은 add-on 설정 UI에 옵션을 두지 않습니다. 모든 설정은 `/share/encar_watcher/config.yaml` 파일 하나로 합니다.

## 설정 방법

1. `/share/encar_watcher/config.yaml` 파일을 만듭니다(같이 배포된 `config.example.yaml`을 복사해서 시작하세요). `/share` 폴더는 Samba, File editor 애드온 등으로 접근할 수 있습니다.
2. `telegram.bot_token`, `telegram.chat_id`를 채웁니다. 텔레그램 봇 만드는 법은 [README.md](README.md)를 참고하세요.
3. `searches` 아래에 감시하고 싶은 조건을 추가합니다. `url`은 encar.com에서 원하는 조건(제조사/모델/가격/연식/주행거리 등)으로 검색한 뒤 **브라우저 주소창의 URL을 그대로 복사**해서 붙여넣으면 됩니다.
4. 애드온을 시작(재시작)하면 `poll_interval_sec` 주기로 신규 매물을 확인해 텔레그램으로 알려줍니다.

## 로그

애드온 로그 탭에서 폴링 결과와 오류를 확인할 수 있습니다.
