---
version: alpha
name: Postoffice Busan Restaurant Map
description: Korean Post identity — warm cream surface, postal red CTA, calm public-service tone for browsing 245 recommended restaurants by region and post office.
colors:
  primary: "#D8261D"
  primaryStrong: "#A91812"
  text: "#1A1A1A"
  muted: "#6C6F76"
  surface: "#FFFFFF"
  surfaceTint: "#FDFBF6"
  warm: "#FFF5E6"
  line: "#ECE4D3"
  lineStrong: "#D8CAAF"
  focus: "#FFA940"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Inter"
    fontSize: 3rem
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  h2:
    fontSize: 1.5rem
    fontWeight: 900
    letterSpacing: "-0.02em"
  body:
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.55
  label:
    fontSize: 0.875rem
    fontWeight: 800
    letterSpacing: "0.02em"
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
  hero-panel:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 32px 24px
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 16px
  ghost-button:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  selected-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
  marker-default:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    size: 32px
  focus-ring:
    backgroundColor: "{colors.focus}"
---

## Overview

부산지방우정청 우체국 추천 맛집가이드는 공공기관이 큐레이션한 245곳을 권역(부산/울산/경남) 단위로 빠르게 둘러보는 정적 지도다. 디자인은 **공공의 신뢰감**과 **노포·지역색의 따뜻함** 사이를 잡는다. 크림 화이트 바탕에 우정청을 상기시키는 빨강(#D8261D) CTA, 짙은 잉크 텍스트로 가독성을 우선한다.

핵심 화면은 두 단계다 — **검색·지역 선택** → **지도·식당 카드**. 한 화면에 한 가지 행동만 강조한다.

## Colors

- **Primary (#D8261D):** 우정 빨강. CTA, 강조 라벨(`{우체국명} 추천 N`), focus border.
- **Primary Strong (#A91812):** hover/pressed.
- **Surface (#FFFFFF):** 카드, 입력, 셀렉트 배경.
- **Surface Tint (#FDFBF6):** 페이지 바탕.
- **Warm (#FFF5E6):** hero, 비활성 select, 지도 panel 배경.
- **Line (#ECE4D3) / Line Strong (#D8CAAF):** 입력·카드 경계. 너무 강한 검정선 대신 따뜻한 베이지.
- **Focus (#FFA940):** 키보드 포커스 링. 기본 빨강 톤과 충돌하지 않게 골드/오렌지.

## Typography

Pretendard 우선, 시스템 한글 sans-serif fallback. 모바일에서 Hero 제목은 letter-spacing -0.04em 으로 간판처럼 또렷이. 본문 16px, 라벨 14px / 800 weight 로 공공자료 톤을 유지.

## Layout

- 모바일 우선. 단일 컬럼.
- App shell: `max-width: 920px`, 좌우 padding 클램프.
- Map view: 지도 높이 60vh, 식당 카드는 지도 아래에 카드 스택.
- 식당 카드의 hero 이미지는 16:9, 추가 갤러리는 1:1 grid.

## Components

- **Primary button:** 한 화면에 한 개의 우정 빨강 CTA. landing의 "전체 지도", picker의 "선택 지도 보기", card의 "전화"가 해당.
- **Region/Post-office selects:** 권역을 먼저 고르지 않으면 우체국 select와 CTA가 disabled. 반드시 시각적으로 비활성을 보여줄 것.
- **Selected card:** 추천 메타(`X우체국 추천 N`)를 빨강으로 작게, 식당명을 큰 굵은 헤딩으로. 메뉴/주소/시간은 라벨+값 패턴으로 스캔하기 쉽게.

## Do's and Don'ts

Do:
- "추천 N" 라벨을 빨강 + uppercase 느낌(letter-spacing 0.02em)으로 일관되게.
- focus-visible 시 골드 링을 명확히 노출.
- 좌표가 없는 식당은 카드 리스트로만 보여주고 지도 마커에서는 빠진다는 사실을 카운트로 표시.

Don't:
- 한 화면에 빨강 CTA 두 개 이상 경쟁시키지 않는다.
- 추천 번호(`N`)를 식당명보다 크게 하지 않는다 — 식당이 주인공.
- 마커 팝업에 모든 정보를 욱여넣지 않는다 — 상세는 별도 카드로.
