# Darwin 2040 세미나 관리 시스템

## 프로젝트 개요
한국의 창업가/중소기업 경영자를 위한 비즈니스 커뮤니티 "Darwin 2040"의 세미나 관리 웹앱.
세미나 신청/결제/출석/연사관리/정부보고서를 통합 관리한다.
운영 법인: XP2

## 기술 스택
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma ORM
- NextAuth.js (카카오 로그인 + Credentials)
- 토스페이먼츠 SDK (결제)
- TanStack Query (React Query)
- AWS S3 (파일 저장, 로컬 fallback)

## 컨벤션
- 모든 UI 텍스트는 **한국어**
- shadcn/ui 컴포넌트 우선 사용
- API는 /api/ 디렉토리에 Route Handler로 구현
- 브랜드 컬러: Navy(#1B2A4A), Gold(#C49A2A)
- 모바일 퍼스트 반응형
- 폰트: 한국어 기본 시스템 폰트

## DB
- Prisma ORM 사용, prisma/schema.prisma 참고
- migration: npx prisma migrate dev
- 주요 모델: User, Seminar, Speaker, SpeakerCompany, LectureContent, SpeakerContract, Registration, Payment, Attendance, Survey, SurveyResponse, Evidence, Promotion

## 회원 등급 체계
- REGULAR (정회원): 월 50,000원, 본 게임 무료, 20% 할인
- VIP: 월 100,000원, 우선석, 40% 할인
- ASSOCIATE (준회원): 회비 없음, 건당 결제
- GUEST: 초대 시 참석

## 세미나 유형
- MAIN_GAME (본 게임): 격주 전체 세미나 90~120분
- SPINUP_GAME (스핀업 게임): 월 1회 소그룹 8~12명
- SPECIAL (특별 세미나): 분기별 심층 행사

## 콘텐츠 카테고리
- STRATEGY: 비즈니스 전략 및 경제 인사이트
- NETWORKING: 인적 네트워킹 및 비즈니스 연결
- AI_TECH: AI 및 기술 트렌드
- LIFESTYLE: 라이프스타일 및 자기개발

## 연사 셀프서비스 포털
- 토큰 기반 접속 (별도 회원가입 불필요)
- 4단계: 기본 프로필 → 사업 정보 → 강의 콘텐츠 → 첨부자료
- 임시저장 지원
- 운영팀 검토 → 승인 워크플로우

## 강의 콘텐츠 구조 (LectureContent)
엑셀 '강의 요약과 학습' 양식 기반:
- 강의 제목
- 사업 시작 동기
- 사업 환경과 기회
- 핵심 성공 요인 (3~5개)
- 비즈니스 모델
- 창업/성장 스토리
- 학습 핵심 메시지 (3~5개)

## 환불 정책
- 48시간 전: 전액 환불
- 48~24시간: 50% 환불
- 24시간 이내: 환불 불가 (관리자 예외 처리 가능)

## 현재 완료된 기능
- [x] Phase 0: 프로젝트 초기화 + DB 스키마
- [x] Step 1: 카카오 로그인 + 인증
- [x] Step 2: 세미나 CRUD (관리자)
- [x] Step 3: 세미나 목록/상세 (회원)
- [x] Step 4: 신청/취소 플로우
- [x] Step 5: 토스페이먼츠 결제 연동
- [x] Step 6: QR 출석 체크
- [ ] Step 7: 연사 관리 + 셀프서비스 포털
- [ ] Step 8: 만족도 설문 + 보조금 보고서

## 주의사항
- 에러 수정 시 기존 작동하는 코드를 깨뜨리지 말 것
- 새 기능 추가 시 반드시 npm run build로 빌드 확인
- 한국 사용자 대상이므로 날짜 형식은 YYYY년 MM월 DD일, 통화는 원(₩)
