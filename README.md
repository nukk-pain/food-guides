# food-guides

식당 추천 자료를 각각 정적 지도 페이지로 만들고, 그 페이지들을 묶어주는 상위 페이지(landing)로 배포하는 monorepo.

```
food-guides/
├── landing/                  /  → 카드 허브
└── packages/
    ├── baeknyeon/            /baeknyeon/        백년가게 음식점업 905곳
    └── postoffice-busan/     /postoffice-busan/ 부산지방우정청 추천 245곳 (2025)
```

배포는 단일 GitHub Pages 사이트, 각 가이드는 subpath로 노출됩니다.
