# 🎨 캘리뷰 디자인 시스템 (Calreview Design System)

이 문서는 캘리뷰 프로젝트의 UI/UX 일관성을 유지하기 위한 디자인 가이드라인입니다.

## 1. 타이포그래피 (Typography)

캘리뷰는 가독성과 심미성을 위해 다음 두 가지 폰트를 사용합니다.

- **Main Font**: `Pretendard`
  - 한국어 가독성에 최적화된 본문용 폰트입니다.
  - Heading과 Body 모두에 적용하여 깔끔하고 현대적인 인상을 줍니다.
- **English/Number**: `Outfit`
  - 영문 헤딩이나 숫자에 포인트로 사용하여 세련된 느낌을 더합니다.

```tsx
// 사용 예시
<h1 className="font-heading text-4xl font-bold">Calreview</h1>
<p className="font-sans text-base">체험단 리뷰 관리의 새로운 기준</p>
```

## 2. 색상 시스템 (Color System)

Tailwind CSS v4 변수 기반으로 정의되어 있으며, HSL 값을 사용하여 테마 확장이 용이합니다.

### Primary (주요 색상) - Rose Coral Theme
- **Primary**: `hsl(350 89% 60%)` (Rose Coral)
  - 브랜드 아이덴티티, 주요 버튼, 강조 텍스트
  - 20-40대 여성 타겟의 생동감 있고 따뜻한 분위기
- **Primary Foreground**: `hsl(0 0% 100%)` (White)

### Secondary (보조 색상)
- **Secondary**: `hsl(30 33% 98%)` (Warm Cream)
  - 배경색, 카드 배경, 부드러운 분위기 조성

### Neutral (무채색)
- **Background**: `hsl(0 0% 100%)` (White)
- **Foreground**: `hsl(222.2 84% 4.9%)` (Gray-950)
- **Muted**: `hsl(210 40% 96.1%)` (Gray-100)
- **Muted Foreground**: `hsl(215.4 16.3% 46.9%)` (Gray-500)
- **Border**: `hsl(214.3 31.8% 91.4%)` (Gray-200)

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
