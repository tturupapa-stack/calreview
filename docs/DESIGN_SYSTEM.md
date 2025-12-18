# 🎨 Cally 디자인 시스템 (Cally Design System)

이 문서는 Cally 프로젝트의 UI/UX 일관성을 유지하기 위한 디자인 가이드라인입니다.

## 1. 타이포그래피 (Typography)

Cally는 가독성과 심미성을 위해 다음 두 가지 폰트를 사용합니다.

- **Main Font**: `Pretendard`
  - 한국어 가독성에 최적화된 본문용 폰트입니다.
  - Heading과 Body 모두에 적용하여 깔끔하고 현대적인 인상을 줍니다.
- **English/Number**: `Outfit`
  - 영문 헤딩이나 숫자에 포인트로 사용하여 세련된 느낌을 더합니다.

```tsx
// 사용 예시
<h1 className="font-heading text-4xl font-bold">Cally</h1>
<p className="font-sans text-base">체험단 리뷰 관리의 새로운 기준</p>
```

## 2. 색상 시스템 (Color System)

Tailwind CSS v4 변수 기반으로 정의되어 있으며, HSL 값을 사용하여 테마 확장이 용이합니다.

### 브랜드 컬러 선택 이유

Cally는 **활기차고 따뜻한** 브랜드 아이덴티티를 추구합니다. 핑크 40%가 가미된 오렌지톤을 메인 컬러로 선택한 이유:

- **활기찬 느낌**: 오렌지의 에너지와 핑크의 부드러움이 조화를 이룬 따뜻한 톤
- **친근하고 접근하기 쉬운**: 20-40대 여성 타겟에게 친근하고 긍정적인 인상
- **시각적 차별화**: 체험단 서비스 시장에서 독특하고 기억에 남는 브랜드 인식

### Primary (주요 색상) - Pink-Orange Theme
- **Primary**: `hsl(15 90% 60%)` (Pink-Orange)
  - 핑크 40%가 가미된 오렌지톤으로, 활기차고 따뜻한 느낌
  - 브랜드 아이덴티티, 주요 버튼, 강조 텍스트, 로고, 링크 등에 사용
  - 에너지 넘치는 동시에 부드러운 느낌을 주는 핵심 컬러
- **Primary Foreground**: `hsl(0 0% 100%)` (White)
  - Primary 컬러 위에 올라가는 텍스트 색상

### Secondary (보조 색상)
- **Secondary**: `hsl(0 0% 98%)` (Off White)
  - 배경색, 카드 배경, 부드러운 분위기 조성
  - Primary와 조화로운 중성 톤
- **Secondary Foreground**: `hsl(230 30% 12%)` (Dark Gray)
  - Secondary 배경 위의 텍스트 색상

### Semantic Colors (의미론적 색상)

상태나 의미를 나타내는 컬러들:

- **Success**: `hsl(145 65% 50%)` (Green)
  - 성공, 완료 상태 표시
- **Warning**: `hsl(45 100% 60%)` (Yellow)
  - 주의, 경고 메시지
- **Urgent**: `hsl(0 70% 65%)` (Coral Red)
  - 마감 임박, 긴급 알림
- **Premium**: `hsl(280 55% 68%)` (Lavender Purple)
  - 프리미엄 기능, 특별한 서비스
- **Info**: `hsl(200 90% 50%)` (Blue)
  - 정보, 알림 메시지
- **Destructive**: `hsl(0 84% 60%)` (Red)
  - 삭제, 위험한 작업

### Neutral (무채색)
- **Background**: `hsl(0 0% 100%)` (White)
  - 페이지 배경색
- **Foreground**: `hsl(222.2 84% 4.9%)` (Gray-950)
  - 주요 텍스트 색상
- **Muted**: `hsl(210 40% 96.1%)` (Gray-100)
  - 부드러운 배경, 비활성 상태
- **Muted Foreground**: `hsl(215.4 16.3% 46.9%)` (Gray-500)
  - 보조 텍스트, 설명 텍스트
- **Border**: `hsl(214.3 31.8% 91.4%)` (Gray-200)
  - 테두리, 구분선

### 컬러 사용 가이드라인

1. **Primary 컬러 사용**
   - 주요 CTA 버튼
   - 링크 및 호버 상태
   - 브랜드 로고 및 아이콘
   - 중요한 정보 강조

2. **Semantic Colors 사용**
   - 각 컬러의 의미에 맞게 일관되게 사용
   - 사용자에게 직관적인 피드백 제공

3. **접근성 고려**
   - 텍스트와 배경의 대비율은 WCAG AA 기준 준수
   - 색상만으로 정보를 전달하지 않고 아이콘이나 텍스트와 함께 사용

## 3. UI 컴포넌트 (UI Components)

### Button
`cva`(Class Variance Authority)를 사용하여 다양한 스타일을 지원합니다.

- **Variants**:
  - `default`: 배경색(Primary), 텍스트(White)
  - `outline`: 테두리(Border), 배경(Background)
  - `ghost`: 배경 없음, 호버 시 배경색 표시
  - `link`: 밑줄 스타일
- **Sizes**: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10)

```tsx
<Button variant="default" size="lg">시작하기</Button>
<Button variant="outline">자세히 보기</Button>
```

### Card
콘텐츠를 담는 컨테이너로, 부드러운 그림자와 테두리를 가집니다.

- **Structure**: `Card` > `CardHeader` > `CardTitle` + `CardDescription` > `CardContent` > `CardFooter`
- **Style**:
  - 둥근 모서리: `rounded-xl` (12px)
  - 효과: `hover:shadow-md`, `hover:-translate-y-1` (Hover Lift Effect)
  - 테두리: 미세한 `border`와 부드러운 `shadow-sm`

```tsx
<Card>
  <CardHeader>
    <CardTitle>카드 제목</CardTitle>
    <CardDescription>카드 설명</CardDescription>
  </CardHeader>
  <CardContent>
    콘텐츠 내용
  </CardContent>
</Card>
```

## 4. 레이아웃 & 그리드

### Container
- `max-w-7xl` (1280px)을 기준으로 중앙 정렬합니다.
- 모바일에서는 `px-4`, 데스크톱에서는 `px-8` 패딩을 기본으로 합니다.

### Grid
- 반응형 그리드를 기본으로 사용합니다.
- `grid-cols-1 md:grid-cols-3` 패턴을 주로 사용합니다.

```tsx
<div className="grid gap-6 md:grid-cols-3">
  {/* Items */}
</div>
```
