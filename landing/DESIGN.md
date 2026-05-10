---
version: alpha
name: food-guides Landing
description: Neutral, classy hub that hosts multiple restaurant-guide map sites without competing with their accent colors.
colors:
  text: "#1A1A1A"
  muted: "#6C6F76"
  surface: "#FFFFFF"
  surfaceTint: "#FAF7F0"
  warm: "#FFF5E2"
  line: "#ECE4D3"
  lineStrong: "#D8CAAF"
  focus: "#E3A85A"
  accentGreen: "#17351F"
  accentGreenStrong: "#0F2716"
  accentRed: "#D8261D"
  accentRedStrong: "#A91812"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Inter"
    fontSize: 3.75rem
    fontWeight: 900
    letterSpacing: "-0.04em"
    lineHeight: 1.05
  body:
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontSize: 0.75rem
    fontWeight: 800
    letterSpacing: "0.05em"
rounded:
  md: 16px
  lg: 28px
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 56px
components:
  guide-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 32px
  about-panel:
    backgroundColor: "{colors.surfaceTint}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 32px
  focus-ring:
    backgroundColor: "{colors.focus}"
---

## Overview

food-guides 랜딩은 **N개의 가이드를 똑같이 존중하는 허브** 다. 자기만의 강한 색을 가지지 않고 따뜻한 크림 화이트 위에 카드별로 가이드의 액센트를 살짝 빌려서 노출한다 — 백년가게는 짙은 솔잎 녹색, 우체국 가이드는 우정 빨강. 랜딩 자체는 중립이라야 다음에 합류할 가이드의 톤과도 충돌하지 않는다.

핵심 흐름은 단 하나: 사용자가 자기 지역·관심에 맞는 카드를 골라 그 가이드 페이지로 이동한다.

## Colors

- **Surface (#FFFFFF) / Surface Tint (#FAF7F0):** 카드 / 페이지 바탕. 흰 카드를 따뜻한 베이지 위에 올려 종이 책자의 느낌.
- **Text (#1A1A1A) / Muted (#6C6F76):** 본문 위계.
- **Line (#ECE4D3):** 연한 베이지 경계. 검정 선을 피한다.
- **Accent Green / Red:** 가이드별 카드에 한정해서 사용. 랜딩 chrome (hero·about·footer) 에는 절대 등장하지 않음.
- **Focus (#E3A85A):** 골드 톤 포커스 링. 두 액센트(녹색·빨강)와 모두 충돌하지 않게.

## Typography

Pretendard 우선. Hero 제목은 -0.04em letter-spacing 으로 책 표지처럼. 본문은 16px / 1.6 line-height 로 읽기 부담 없이.

## Layout

- 모바일 우선, 단일 컬럼. App shell `max-width: 1080px`.
- 카드 그리드는 `auto-fit, minmax(360px, 1fr)` — 데스크톱은 자연스럽게 2열, 모바일은 1열.
- 섹션 사이 spacing 56px (xxl) — 책의 챕터 구분처럼 충분히.
- About 박스와 hero 의 lede 는 `max-width: 780px` 로 좁혀 가독성을 우선.

## Components

- **guide-card:** 카드 자체는 흰 surface, 카드별 accent 색은 카운트 라벨·CTA·hover border 에만 적용. 식당 자체 정보(이름·지역·출처)는 검정 텍스트.
- **about-panel:** 따뜻한 베이지 surface tint. "이 사이트는" 같은 메타 정보를 부드럽게.
- **footer:** 가벼운 1줄. 빌드 일자 + 기술 메모.

## Do's and Don'ts

Do:
- 새 가이드를 추가할 때는 `--accent-<name>` CSS variable + `guide-card--<name>` modifier 만 추가.
- hero 의 카피를 짧게 유지 (3줄 안).

Don't:
- 랜딩 자체가 강한 색을 갖지 않는다.
- hover 효과를 화려하게 만들지 않는다 — 4px translate + border 색 변경만.
- 카드 안에 식당 사진을 넣지 않는다 — 가이드의 정체성을 단어로 보여주는 게 카드의 역할.
