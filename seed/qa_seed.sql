-- ============================================================================
-- seed/qa_seed.sql
-- 데모용 시드 데이터 — 3개 부서 × 10건 = 30건
-- embedding 컬럼은 INSERT 하지 않음 (n8n 워크플로우 B가 별도 적재)
-- ============================================================================

-- ── 부서 1: 모니모마케팅팀 (류원태, EMP_003) ─────────────────────────────
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '모니모 MAU 구하는 SQL 쿼리',
  '{"answer_text":"SC_MONIMO_USER_STAT 테이블에서 다음과 같이 조회합니다.\nSELECT COUNT(DISTINCT user_id) AS mau\n  FROM SC_MONIMO_USER_STAT\n WHERE base_dt BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) AND CURRENT_DATE\n   AND active_yn = ''Y'';","question_original":"모니모 MAU 구하는 SQL 쿼리 알려주세요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["MAU","SQL","모니모"],"archived_at":"2026-03-15"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '모니모 DAU 기준',
  '{"answer_text":"DAU는 ''당일 1회 이상 핵심 이벤트(송금/잔액조회/자산연결/카드결제)를 발생시킨 unique user_id'' 기준입니다. 단순 앱 실행은 제외합니다.","question_original":"모니모 DAU는 어떤 기준으로 잡나요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["DAU","지표정의"],"archived_at":"2026-03-12"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '모니모 30일 잔존율 계산 방법',
  '{"answer_text":"신규 가입자 코호트 기준 30일 잔존율은 (가입 후 30일째 active user 수) / (가입자 총 수). SC_USER_RETENTION 마트의 d30_retained_yn 컬럼을 합산하세요.","question_original":"잔존율은 어떻게 계산하나요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["Retention","코호트"],"archived_at":"2026-03-10"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '모니모 핵심 이벤트 정의',
  '{"answer_text":"송금(transfer), 잔액조회(balance_view), 자산연결(asset_link), 카드결제(card_payment) 4종이 핵심 이벤트입니다. event_master 테이블의 is_core=true 로 필터링 가능.","question_original":"핵심 이벤트 정의 알려주세요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["이벤트정의","핵심지표"],"archived_at":"2026-03-08"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  'OLAP 마트 테이블명',
  '{"answer_text":"주요 OLAP 마트:\n- SC_MONIMO_USER_STAT (일별 사용자 활동)\n- SC_USER_RETENTION (코호트 잔존)\n- SC_REVENUE_DAILY (매출)\n- SC_PUSH_CTR (푸시 오픈율)","question_original":"OLAP 마트 테이블 이름 정리 부탁드려요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["테이블","마트"],"archived_at":"2026-03-06"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '모니모 월별 MAU 집계 쿼리',
  '{"answer_text":"SELECT DATE_TRUNC(''month'', base_dt) AS mo, COUNT(DISTINCT user_id) AS mau\n  FROM SC_MONIMO_USER_STAT\n WHERE base_dt >= ''2025-01-01''\n GROUP BY 1 ORDER BY 1;","question_original":"월별 MAU 집계 쿼리 알려주세요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["MAU","월별","SQL"],"archived_at":"2026-03-04"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '신규 사용자 정의',
  '{"answer_text":"신규 사용자는 ''base_dt 기준 가입일이 동일한 달''인 user_id 입니다. user_master.signup_dt 컬럼 사용.","question_original":"신규 사용자 어떻게 정의하나요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["신규","지표정의"],"archived_at":"2026-03-02"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '재방문율 산정 쿼리',
  '{"answer_text":"WITH first_visit AS (SELECT user_id, MIN(base_dt) fd FROM SC_MONIMO_USER_STAT GROUP BY user_id)\nSELECT COUNT(DISTINCT s.user_id) FROM SC_MONIMO_USER_STAT s JOIN first_visit f USING(user_id) WHERE s.base_dt > f.fd;","question_original":"재방문율 쿼리 어떻게 짜요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["재방문","SQL"],"archived_at":"2026-02-28"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '앱 실행 기준',
  '{"answer_text":"앱 실행은 app_launch 이벤트로 측정합니다. 단, 백그라운드 복귀(<5분)는 동일 세션으로 묶이며 별도 카운트하지 않습니다.","question_original":"앱 실행 어떤 기준으로 잡나요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["앱실행","세션"],"archived_at":"2026-02-25"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '푸시 오픈율 집계',
  '{"answer_text":"SC_PUSH_CTR 마트의 (opened_cnt / sent_cnt) 으로 계산. campaign_id 별로 GROUP BY 하시면 됩니다.","question_original":"푸시 오픈율 어떻게 집계하나요","department":"모니모마케팅팀","responder_id":"EMP_003","responder_name":"류원태","tags":["푸시","CTR"],"archived_at":"2026-02-22"}'::jsonb
);

-- ── 부서 2: 정보보호실 (김보안, EMP_001) ─────────────────────────────────
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '보안성 검토 일정',
  '{"answer_text":"보안성 검토는 매주 화·목 정기 진행됩니다. 신청 후 평균 영업일 3일 내 검토 시작, 1주일 내 결과 회신이 표준 SLA입니다.","question_original":"보안성 검토 일정이 어떻게 되나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["보안성검토","일정"],"archived_at":"2026-03-14"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '보안성 검토 키 발급 방법',
  '{"answer_text":"사내 보안포털(security.internal) 접속 → [보안성검토] → [신규 신청] 클릭 시 신청서 상단에 REVIEW-KEY가 자동 생성됩니다. 발급된 키를 결재 문서와 PR 설명에 첨부하세요.","question_original":"보안성 검토 키 값은 어디서 발급받나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["보안성검토","키발급"],"archived_at":"2026-03-13"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '방화벽 신청 절차',
  '{"answer_text":"FW 신청은 ITSM → [네트워크] → [방화벽 정책 변경] 메뉴에서 진행합니다. 출발지/목적지 IP, 포트, 사유, 만료일을 명시하세요.","question_original":"방화벽 신청은 어떻게 하나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["방화벽","ITSM"],"archived_at":"2026-03-11"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '취약점 점검 주기',
  '{"answer_text":"정기 취약점 점검은 분기 1회(외부 자산은 월 1회). 신규 시스템 오픈 전에는 반드시 모의해킹을 선행합니다.","question_original":"취약점 점검은 얼마나 자주 하나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["취약점","점검주기"],"archived_at":"2026-03-09"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '이관 전 보안 체크리스트',
  '{"answer_text":"운영 이관 전 체크리스트: ①시크릿 분리 ②로그 마스킹 ③권한 최소화 ④의존성 취약점 0건 ⑤보안성 검토 승인. 5개 항목 모두 통과 시 이관 가능합니다.","question_original":"이관 전에 보안적으로 뭘 확인해야 하나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["이관","체크리스트"],"archived_at":"2026-03-07"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '외부 API 사용 승인',
  '{"answer_text":"외부 API 사용은 보안성 검토 + 데이터 분류 결과에 따라 승인이 분기됩니다. PII 미포함은 표준 프로세스, PII 포함은 CISO 결재 필요.","question_original":"외부 API 사용 승인 어떻게 받나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["외부API","승인"],"archived_at":"2026-03-05"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '개인정보 처리 기준',
  '{"answer_text":"개인정보는 수집 시 동의 → 암호화 저장(AES-256) → 접근 로그 기록 → 보관기한 만료 시 자동 파기. 마스킹 정책은 별첨 가이드 참고.","question_original":"개인정보 처리 어떻게 해야 하나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["개인정보","처리기준"],"archived_at":"2026-03-03"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '보안 솔루션 설치 방법',
  '{"answer_text":"사내 표준 보안 솔루션(EDR, DLP) 은 노트북 수령 시 자동 설치됩니다. 신규 PC 사용 전 IT보안팀에 에이전트 상태 점검을 요청하세요.","question_original":"보안 솔루션 어떻게 설치하나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["EDR","DLP","설치"],"archived_at":"2026-03-01"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '망분리 정책',
  '{"answer_text":"업무망과 인터넷망은 물리적으로 분리되어 있으며, 파일 이동은 자료반출시스템을 통해서만 가능합니다. 클라우드 접근은 인터넷망에서만 허용됩니다.","question_original":"망분리 정책이 어떻게 되어 있나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["망분리","정책"],"archived_at":"2026-02-27"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '보안 패치 적용 절차',
  '{"answer_text":"CVSS 9.0 이상은 24시간 내, 7.0~8.9는 7일 내, 그 외는 월간 정기 패치로 적용. 적용 결과는 보안포털에 자동 리포팅됩니다.","question_original":"보안 패치 어떻게 적용하나요","department":"정보보호실","responder_id":"EMP_001","responder_name":"김보안","tags":["패치","CVSS"],"archived_at":"2026-02-24"}'::jsonb
);

-- ── 부서 3: 서비스개발팀 (박개발, EMP_005) ───────────────────────────────
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '개발 서버 접속 방법',
  '{"answer_text":"개발 서버는 사내 VPN 접속 후 dev-bastion.internal 을 통해서만 접근 가능합니다. SSH 키는 GitLab → [Settings] → [SSH Keys] 에 등록.","question_original":"개발 서버 어떻게 접속하나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["dev","접속"],"archived_at":"2026-03-14"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '배포 프로세스',
  '{"answer_text":"main 브랜치 머지 → CI 자동 빌드 → 스테이징 자동 배포 → QA 통과 → 운영 배포(수동 승인). 운영 배포는 매주 화·목 14시 표준 윈도우.","question_original":"배포 프로세스 어떻게 되나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["배포","CICD"],"archived_at":"2026-03-12"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  'Git 브랜치 전략',
  '{"answer_text":"GitHub Flow 기반. feature/* → PR → main 머지. release 브랜치는 핫픽스 시에만 한시적 사용. squash merge 권장.","question_original":"Git 브랜치 전략이 어떻게 되나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["Git","브랜치"],"archived_at":"2026-03-10"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '코드 리뷰 절차',
  '{"answer_text":"PR 생성 시 자동으로 CODEOWNERS 기준 2명 리뷰어 지정. 최소 1명 승인 + CI 통과 후 머지 가능. 24시간 무응답 시 자동 핑.","question_original":"코드 리뷰 어떻게 진행되나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["코드리뷰","PR"],"archived_at":"2026-03-08"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  'API 문서 위치',
  '{"answer_text":"OpenAPI 스펙은 docs.internal/api 에서 확인 가능. 각 서비스별로 /swagger 엔드포인트도 제공합니다.","question_original":"API 문서는 어디 있나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["API문서","Swagger"],"archived_at":"2026-03-06"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '테스트 환경 설정',
  '{"answer_text":"로컬은 docker-compose up 으로 통합 환경 기동. 통합 테스트는 GitHub Actions 의 test job 으로 자동 실행됩니다.","question_original":"테스트 환경 어떻게 셋업하나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["테스트","Docker"],"archived_at":"2026-03-04"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '빌드 오류 대처',
  '{"answer_text":"우선 ./gradlew clean build --refresh-dependencies 시도. 캐시 문제면 ~/.gradle/caches 삭제 후 재시도. 그래도 안 되면 #dev-help 채널 문의.","question_original":"빌드가 자꾸 깨져요. 어떻게 해야 하나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["빌드","트러블슈팅"],"archived_at":"2026-03-02"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '스테이징 서버 URL',
  '{"answer_text":"스테이징: https://stg.monimo.internal / API: https://api-stg.monimo.internal. 사내망에서만 접근 가능.","question_original":"스테이징 URL 알려주세요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["스테이징","URL"],"archived_at":"2026-02-28"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  'DB 접근 권한 신청',
  '{"answer_text":"DB 접근은 ITSM → [DB 권한 신청] 에서 사유 + 조회/수정 구분 + 만료일을 명시해 신청. 운영 DB 는 DBA 결재 필수.","question_original":"DB 접근 권한 어떻게 받나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["DB","권한"],"archived_at":"2026-02-26"}'::jsonb
);
INSERT INTO public.qa_pairs (content, metadata) VALUES (
  '신규 라이브러리 도입 절차',
  '{"answer_text":"신규 OSS 도입은 ①라이선스 확인 ②보안 취약점 스캔 ③아키텍처팀 리뷰 순. depcheck.internal 에 라이브러리명 입력 시 자동 검토 결과 반환.","question_original":"새 라이브러리 도입은 어떻게 하나요","department":"서비스개발팀","responder_id":"EMP_005","responder_name":"박개발","tags":["라이브러리","OSS"],"archived_at":"2026-02-23"}'::jsonb
);

-- ============================================================================
-- 시드 30건 적재 완료. embedding 컬럼은 n8n 워크플로우 B 가 별도로 채웁니다.
-- ============================================================================
