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

목록 + 무료 geocoding 일부 실행:

```bash
npm run fetch:data -- --geocode --geocode-limit=50
```

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
