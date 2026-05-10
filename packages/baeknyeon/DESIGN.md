---
version: alpha
name: Baeknyeon Restaurant Map
description: Warm Korean heritage map UI for finding certified long-running restaurants.
colors:
  primary: "#17351F"
  primaryStrong: "#0F2716"
  secondary: "#4B5A4E"
  tertiary: "#B86714"
  tertiaryStrong: "#8C4A0A"
  neutral: "#F5F0E7"
  neutralWarm: "#FFF7EA"
  surface: "#FFFFFF"
  surfaceTint: "#FCFAF6"
  line: "#DDD3C3"
  mapWash: "#DDE8D9"
  focus: "#F3A33A"
typography:
  display:
    fontFamily: Inter
    fontSize: 4.75rem
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.07em"
  h2:
    fontFamily: Inter
    fontSize: 2.5rem
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.05em"
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.01em"
rounded:
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  app-background:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.primaryStrong}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 14px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 14px
  panel:
    backgroundColor: "{colors.surfaceTint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 24px
  muted-panel:
    backgroundColor: "{colors.neutralWarm}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 16px
  map-panel:
    backgroundColor: "{colors.mapWash}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 0px
  detail-card:
    backgroundColor: "{colors.neutralWarm}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  marker-default:
    backgroundColor: "{colors.tertiary}"
    textColor: "#000000"
    rounded: "{rounded.xl}"
    size: 32px
  marker-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    size: 36px
  focus-ring:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.primaryStrong}"
  warning-chip:
    backgroundColor: "{colors.neutralWarm}"
    textColor: "{colors.tertiaryStrong}"
    rounded: "{rounded.sm}"
    padding: 8px
  divider:
    backgroundColor: "{colors.line}"
    textColor: "{colors.primary}"
---

## Overview

백년가게 식당 지도는 오래된 지역 식당을 빠르게 찾는 생활형 지도 서비스다. 디자인은 "따뜻한 노포 탐방"과 "신뢰할 수 있는 공공 데이터" 사이에 있어야 한다. 베이지 종이 질감, 짙은 솔잎 녹색, 절제된 주황 포인트로 향토성과 길찾기 맥락을 동시에 만든다.

핵심 사용 흐름은 한 가지다: 검색하거나 지역을 고른 뒤 지도에서 식당 이름을 확인한다. 랜딩 화면은 검색과 전체 지도 보기를 가장 강하게, 지역 선택은 두 번째 경로로 제공한다.

## Colors

- **Primary (#17351F):** 주요 CTA, 제목, 선택된 지도 마커. 신뢰감 있는 진한 녹색.
- **Primary Strong (#0F2716):** hover/pressed 상태. CTA가 더 명확히 눌리는 느낌을 준다.
- **Secondary (#4B5A4E):** 보조 문장, 주소, 설명 텍스트. 본문 대비를 유지하되 제목보다 낮은 위계.
- **Tertiary (#B86714):** 마커, 카운트, 작은 강조. 음식/노포의 따뜻함을 주지만 CTA 색으로 남용하지 않는다.
- **Neutral (#F5F0E7):** 전체 배경. 흰색 카드와 구분되는 따뜻한 바탕.
- **Neutral Warm (#FFF7EA):** 선택 상세 카드, 안내 박스. 식당 정보가 지도 위에서 떠 보이게 한다.
- **Line (#DDD3C3):** 입력/카드 경계. 너무 진한 테두리를 피하고 촉각적 구분만 준다.

## Typography

Inter와 시스템 sans-serif를 사용한다. 제목은 강한 letter-spacing으로 지도 앱의 간판처럼 보이게 하되, 모바일에서는 2줄을 넘지 않도록 크기를 줄인다. 본문과 라벨은 16px 안팎을 유지해 터치 환경에서 읽기 쉽게 한다.

## Layout

- 모바일 우선: 검색, 전체 보기, 지역 선택 폼은 세로로 쌓는다.
- 데스크톱: 히어로는 텍스트와 작은 지도 카드의 2열 구성을 사용한다.
- 한 화면에서 첫 행동이 보이도록 히어로 높이는 과하게 키우지 않는다.
- 지도 화면에서는 지도 자체를 우선하고 선택한 식당 상세는 하단/우측의 떠 있는 카드처럼 보이게 한다.

## Elevation & Depth

카드는 큰 그림자를 쓰되 투명도를 낮춰 정보형 서비스의 신뢰감을 해치지 않는다. 지도 상세 카드와 검색 패널은 `0 20px 60px rgba(45, 35, 18, 0.10)` 수준의 부드러운 그림자를 사용한다.

## Shapes

기본 카드 반경은 24px, 주요 랜딩 히어로는 28~32px까지 허용한다. 입력과 버튼은 16px로 통일한다. 지도 마커는 원형이며 선택 상태는 1.14배 확대한다.

## Components

- **Primary button:** 한 화면에 하나의 주 행동만 진한 녹색으로 표시한다. 랜딩에서는 "전체 식당 지도 보기", 지역 폼에서는 "선택 지역 지도 보기"가 해당된다.
- **Search field:** 버튼과 같은 카드 안에 배치하고 label을 항상 노출한다. placeholder만으로 의미를 전달하지 않는다.
- **Region selects:** `시·도` 선택 전에는 시·군·구와 지도 버튼 disabled 상태가 명확해야 한다.
- **Map marker popup:** 팝업에는 식당 이름만 간결하게 보여준다. 자세한 정보는 별도 상세 카드로 분리한다.
- **Selected detail card:** 전화, 주소 복사, 외부 지도 링크를 한 줄 액션으로 묶고 지도보다 더 강한 위계를 갖지 않게 한다.

## Do's and Don'ts

Do:
- CTA 문구는 행동 중심으로 쓴다: "전체 식당 지도 보기", "선택 지역 지도 보기".
- 검색 전/후 카운트는 버튼 문구 안에서 보조 정보로만 보여준다.
- 지도, 검색, 지역 선택의 역할을 짧은 설명 문장으로 보강한다.
- focus-visible 상태는 주황 링으로 분명히 표시한다.

Don't:
- 한 화면에 진한 녹색 CTA를 여러 개 경쟁시키지 않는다.
- "곳"처럼 모호한 카운트 단위보다 "식당"을 사용한다.
- 지도 위에 너무 많은 설명이나 리스트를 올리지 않는다.
- 마커 팝업에 주소/전화/링크를 모두 넣어 작은 화면을 가리지 않는다.
