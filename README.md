# encar-search-helper

엔카(encar.com) 중고차 매물을 더 편하게 찾기 위한 두 개의 독립적인 프로젝트를 담은 레포입니다.

## [`extension/`](extension/README.md) — 엔카 매물 목록 상세정보 표시기 (크롬 확장)

엔카 검색 결과 목록에서 원래 상세페이지에 들어가야만 보이는 사고이력·보험이력·용도변경이력·신차대비 비율 등을 카드에 바로 표시하고, 조건에 따라 매물을 필터링하는 크롬 확장 프로그램입니다. 자세한 내용은 [extension/README.md](extension/README.md) 참고.

## [`watcher/`](watcher/README.md) — 엔카 매물 알림 워처 (Home Assistant Add-on)

브라우저를 열지 않아도, 원하는 조건의 신규 매물이 올라오면 텔레그램으로 알림을 보내주는 Home Assistant 로컬 Add-on입니다. 검색 조건은 encar.com에서 필터링한 뒤 주소창 URL을 그대로 복사해 설정 파일에 붙여넣는 방식으로 지정합니다. 설치 방법과 텔레그램 봇 만드는 법은 [watcher/README.md](watcher/README.md) 참고.
