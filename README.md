# 엔카 매물 목록 상세정보 표시기

엔카(encar.com) 중고차 검색 결과 목록에서, 원래는 매물 상세페이지에 들어가야만 볼 수 있는 다음 정보를 카드에 바로 표시하는 Chrome 확장 프로그램입니다.

- 용도변경이력 유무
- 사고이력 유무
- 단순수리 유무
- 보험사고이력(내차피해) — 횟수 / 금액
- 보험사고이력(타차가해) — 횟수 / 금액
- 소유자변경 횟수

## 동작 원리

엔카 웹사이트가 내부적으로 사용하는 공개 API를 활용합니다.

1. `GET https://api.encar.com/v1/readside/vehicle/{listId}` — 목록의 매물 ID를 실제 `vehicleId`/`vehicleNo`로 변환
2. `GET https://api.encar.com/v1/readside/inspection/vehicle/{vehicleId}` — 성능점검기록부(`accdient`, `simpleRepair`, `usageChangeTypes`)
3. `GET https://api.encar.com/v1/readside/record/vehicle/{vehicleId}/open` — 보험 사고이력(`myAccidentCnt/Cost`, `otherAccidentCnt/Cost`)

이 API들은 `Access-Control-Allow-Origin: *`를 응답하므로 별도 인증이나 백엔드 없이 콘텐츠 스크립트에서 바로 호출할 수 있습니다.

목록에 보이는 카드만 `IntersectionObserver`로 감지해 필요한 만큼만 요청하고, 같은 세션 내에서는 캐시해 중복 요청을 방지합니다. 동시 요청 수는 4개로 제한합니다.

## 설치 (개발자 모드)

1. Chrome에서 `chrome://extensions` 접속
2. 우측 상단 "개발자 모드" 켜기
3. "압축해제된 확장 프로그램을 로드합니다" 클릭 후 이 프로젝트 폴더 선택
4. 엔카 국산/수입/친환경/화물 검색 결과 페이지(`*_carsearchlist.do`)에 접속하면 자동 적용됩니다.

## 파일 구조

```
manifest.json       확장 프로그램 설정 (Manifest V3)
src/api.js           엔카 API 호출, 동시성 제한, 세션 캐시
src/render.js         뱃지 DOM 생성
src/content.js        카드 탐색, 지연 로딩(IntersectionObserver), DOM 변경 감지(MutationObserver)
src/content.css        뱃지 스타일
```

## 참고 / 주의사항

- 위 API는 엔카가 공식 문서화한 API가 아니라 웹사이트가 내부적으로 사용하는 엔드포인트이므로, 엔카 측 변경에 따라 동작하지 않을 수 있습니다.
- 매물에 따라 성능점검/보험이력 정보가 아예 없는 경우(개인 판매 등) "정보없음"으로 표시됩니다.
- 요청 빈도가 지나치게 높아지지 않도록 동시 요청 수를 제한하고 있습니다. 사용 중 엔카 접속이 느려지거나 차단 징후가 보이면 사용을 중단하세요.
