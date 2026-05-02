# 백년가게 식당 지도

소상공인시장진흥공단 백년가게 목록에서 **음식점업**만 추려 지도에 표시하는 0원 운영 정적 웹앱입니다.

- 데이터 출처: https://www.sbiz.or.kr/hdst/main/ohndMarketList.do
- 음식점업 코드: `HPTC006`
- 지도: Leaflet + OpenStreetMap
- 배포: GitHub Pages
- 백엔드/DB: 없음

## 개발

```bash
npm install
npm run dev
```

## 데이터 갱신

목록만 갱신:

```bash
npm run fetch:data
```

목록 + 무료 geocoding 일부 실행(Nominatim, 느리고 한국 주소 성공률 낮음):

```bash
npm run fetch:data -- --geocode --geocode-limit=50
```

목록 + 카카오 주소 좌표 변환 실행(권장, 로컬 1회 배치용):

```bash
KAKAO_REST_API_KEY=발급받은_REST_API_키 npm run fetch:data -- --geocode --geocode-provider=kakao --geocode-limit=905 --delay-ms=100
```

카카오 앱에서 `OPEN_MAP_AND_LOCAL service`가 비활성화되어 있으면 403 오류가 납니다. Kakao Developers의 해당 앱에서 카카오맵/로컬 API 제품을 활성화한 뒤 다시 실행합니다.

목록 + 공공 도로명주소 좌표 변환 실행(대안, 로컬 배치용):

```bash
JUSO_CONFIRM_KEY=발급받은_승인키 npm run fetch:data -- --geocode --geocode-provider=juso --geocode-limit=905 --delay-ms=100
```

도로명주소 방식은 `business.juso.go.kr`의 주소검색/좌표제공 API 승인키가 필요합니다. 카카오/도로명주소 API는 사이트 런타임에서 호출하지 않고 로컬 데이터 생성 시에만 사용합니다. 생성된 좌표는 `data/geocode-cache.json`에 누적 저장되고, 지도 앱은 최종 정적 파일인 `public/data/restaurants.json`만 읽으므로 GitHub Pages 운영 비용은 0원입니다.

전체 geocoding은 OpenStreetMap Nominatim 정책상 1초 이상 간격으로 천천히 실행해야 합니다. 스크립트는 주소별 캐시를 `data/geocode-cache.json`에 저장하고, 좌표가 있는 항목만 `public/data/restaurants.json`으로 내보냅니다.

생성 파일:

```text
data/raw/sbiz-restaurants.json      # sbiz 음식점업 raw 목록
data/geocode-cache.json             # 주소 -> 좌표 캐시
public/data/restaurants.json        # 앱에서 사용하는 정적 데이터
```

## 검증

```bash
npm run lint
npm test
npm run build
```

## GitHub Pages 배포

`.github/workflows/pages.yml`이 main 브랜치 push 시 자동으로 다음을 수행합니다.

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `dist`를 GitHub Pages로 배포

GitHub Pages 프로젝트 사이트 경로(`/repo-name/`)는 workflow에서 `VITE_BASE_PATH`로 자동 주입됩니다.

## 수동 배포 전 로컬 확인

```bash
VITE_BASE_PATH=/baeknyeon-restaurant-map/ npm run build
npm run preview
```
