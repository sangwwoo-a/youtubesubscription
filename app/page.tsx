'use client';

import React, { useState, useEffect, useRef } from 'react';

const ACCENT = "#FF6B47";

const CATEGORY_COLORS: Record<string, string> = {
  "음악":       "#FF6B47",
  "K-pop":      "#F8A48B",
  "게임":       "#D4A857",
  "코딩/IT":    "#8FA68E",
  "요리/살림":  "#C97B63",
  "자기계발":   "#A89BB8",
  "홈트/운동":  "#7AA1C4",
  "AI/테크":    "#E6B450",
  "엔터/예능":  "#B47D8E",
  "영화/리뷰":  "#9B8A6B",
  "기타":       "#666",
};

// ── Types ──────────────────────────────────────────────────────────────────
type AnalyzedData = {
  totalSubs: number;
  yearsOnYoutube: number;
  deadChannelPercent: number;
  lazinessScore: number;
  oldestSubscription: { channel: string; subscribedYear: number; diedYear: number };
  totalWatchTime: { years: number; months: number };
  categoryDistribution: { name: string; count: number; pct: number }[];
  yearlyInterests: {
    year: number; age: string; categories: string[]; comment: string;
    channels: { name: string; cat: string; status: string }[];
  }[];
  forgottenInterests: string[];
};

type SubItem = {
  snippet: {
    title: string;
    publishedAt: string;
    resourceId: { channelId: string };
  };
};

type ChannelItem = {
  id: string;
  snippet: { title: string; publishedAt: string };
  statistics: { videoCount: string; subscriberCount: string; viewCount: string };
};

// ── Demo data ───────────────────────────────────────────────────────────────
const sampleData: AnalyzedData = {
  totalSubs: 287,
  yearsOnYoutube: 17,
  deadChannelPercent: 78,
  lazinessScore: 73,
  oldestSubscription: { channel: "구이엠TV", subscribedYear: 2009, diedYear: 2014 },
  totalWatchTime: { years: 42, months: 8 },
  categoryDistribution: [
    { name: "음악",       count: 52, pct: 18.1 },
    { name: "K-pop",      count: 41, pct: 14.3 },
    { name: "게임",       count: 38, pct: 13.2 },
    { name: "코딩/IT",    count: 31, pct: 10.8 },
    { name: "요리/살림",  count: 27, pct: 9.4 },
    { name: "자기계발",   count: 24, pct: 8.4 },
    { name: "AI/테크",    count: 21, pct: 7.3 },
    { name: "홈트/운동",  count: 18, pct: 6.3 },
    { name: "엔터/예능",  count: 17, pct: 5.9 },
    { name: "영화/리뷰",  count: 18, pct: 6.3 },
  ],
  yearlyInterests: [
    { year: 2009, age: "처음 가입한 해", categories: ["음악", "K-pop"], comment: "그땐 아이돌에 빠져있었네",
      channels: [
        { name: "구이엠TV",        cat: "K-pop",   status: "dead" },
        { name: "1theK (원더케이)", cat: "K-pop",   status: "alive" },
        { name: "MnetK-POP",       cat: "음악",    status: "alive" },
        { name: "DingoMusic",      cat: "음악",    status: "alive" },
      ]},
    { year: 2012, age: "3년차", categories: ["요리/살림"], comment: "자취 시작했지",
      channels: [
        { name: "백종원의 요리비책", cat: "요리/살림", status: "alive" },
        { name: "자취남",           cat: "요리/살림", status: "alive" },
        { name: "심방골주부",        cat: "요리/살림", status: "dead" },
      ]},
    { year: 2015, age: "6년차", categories: ["게임", "코딩/IT"], comment: "취직 준비?",
      channels: [
        { name: "김성회의 G식백과", cat: "게임",    status: "alive" },
        { name: "잘잘잘",          cat: "게임",    status: "dead" },
        { name: "생활코딩",        cat: "코딩/IT", status: "alive" },
        { name: "노마드 코더",      cat: "코딩/IT", status: "alive" },
        { name: "동빈나",          cat: "코딩/IT", status: "alive" },
      ]},
    { year: 2017, age: "8년차", categories: ["자기계발"], comment: "번아웃 직전",
      channels: [
        { name: "체인지그라운드",   cat: "자기계발", status: "alive" },
        { name: "신사임당",         cat: "자기계발", status: "dead" },
        { name: "드로우앤드류",     cat: "자기계발", status: "alive" },
      ]},
    { year: 2020, age: "11년차", categories: ["홈트/운동", "요리/살림"], comment: "COVID 락다운",
      channels: [
        { name: "땅끄부부",       cat: "홈트/운동", status: "alive" },
        { name: "ThankyouBubu",  cat: "홈트/운동", status: "dead" },
        { name: "주부탱이",       cat: "요리/살림", status: "dead" },
        { name: "심으뜸",         cat: "홈트/운동", status: "alive" },
      ]},
    { year: 2024, age: "지금", categories: ["AI/테크"], comment: "지금의 나",
      channels: [
        { name: "조코딩 JoCoding", cat: "AI/테크", status: "alive" },
        { name: "안될공학",        cat: "AI/테크", status: "alive" },
        { name: "Anthropic",      cat: "AI/테크", status: "alive" },
        { name: "노가다 가능",     cat: "AI/테크", status: "alive" },
      ]},
  ],
  forgottenInterests: ["목공", "한국요리", "비건", "인디게임 개발", "사진", "독서", "필름카메라", "캘리그라피", "재즈"],
};

// ── Tiers & scoring ────────────────────────────────────────────────────────
const tiers = [
  {
    range: [0, 30], code: "minimalist", accent: "#8FA68E", accentSoft: "#B5C5B4",
    tag: "관망형", title: "디지털 미니멀리스트", body: "구독 폴더가 깔끔하시네요. 자랑하실 만 합니다.",
    badge: "✨", shareTone: "achievement",
    shareText: (s: number) => `내 분석 점수 ${s}/100 — 디지털 미니멀리스트 ✨\n구독함이 정갈한 사람, 손!`,
  },
  {
    range: [31, 50], code: "collector", accent: "#D4A857", accentSoft: "#E8C982",
    tag: "수집형", title: "취미 수집가", body: "관심사가 다양하셨군요. 살짝 흩어져있긴 해도요.",
    badge: "🎭", shareTone: "neutral",
    shareText: (s: number) => `내 분석 점수 ${s}/100 — 취미 수집가 🎭\n관심사가 부지런했던 시절이 있었지`,
  },
  {
    range: [51, 70], code: "novice-hoarder", accent: "#FF6B47", accentSoft: "#F8A48B",
    tag: "방치형", title: "구독 중독 — 입문", body: "구독 알림은 끄셨죠? 이미 보지 않는 채널이 절반을 넘습니다.",
    badge: "🪦", shareTone: "self-deprecate",
    shareText: (s: number) => `내 분석 점수 ${s}/100 — 구독 중독 입문 🪦\n다같이 부끄러우면 그건 그냥 평균이지`,
  },
  {
    range: [71, 89], code: "expert-hoarder", accent: "#E63946", accentSoft: "#F08585",
    tag: "중독형", title: "구독 중독 — 고수", body: "구독 채널 대부분이 무덤 상태예요. 정리할 때가 한참 지났습니다.",
    badge: "💀", shareTone: "competitive",
    shareText: (s: number) => `내 분석 점수 ${s}/100 받음 ㅋㅋ 💀\n구독 중독 고수 등급. 이제 진짜 정리해야지`,
  },
  {
    range: [90, 100], code: "legend", accent: "#E6B450", accentSoft: "#F2D27A",
    tag: "전설급", title: "디지털 고고학자 — 전설", body: "당신의 구독함은 그 자체로 한 시대의 박물관입니다. 큐레이터 자격증 드려야겠어요.",
    badge: "👑", shareTone: "legendary",
    shareText: (s: number) => `내 분석 점수 ${s}/100 — 디지털 고고학자 👑\n전설각 떴다`,
  },
];

const edgeCases: Record<number, { title: string; body: string; badge: string; shareText: () => string }> = {
  100: { title: "박물관장", body: "100/100. 이 정도면 큐레이터 자격증을 정말 드려야 해요.", badge: "🏛️", shareText: () => `100/100 만점 받음 ㅎㅎ 🏛️\n박물관장 칭호 획득` },
  0:   { title: "수도승",   body: "0/100. 한국적 미니멀리즘의 정수. 어떻게 사신 거죠?",   badge: "🧘", shareText: () => `0/100 받음 🧘 수도승급 미니멀리즘` },
};

function getTier(score: number) {
  return tiers.find(t => score >= t.range[0] && score <= t.range[1]) || tiers[0];
}

function getVerdict(score: number) {
  const tier = getTier(score);
  const edge = edgeCases[score];
  return {
    ...tier,
    title: edge?.title || tier.title,
    body: edge?.body || tier.body,
    badge: edge?.badge || tier.badge,
    shareText: edge ? edge.shareText() : tier.shareText(score),
    isEdgeCase: !!edge,
  };
}

// ── YouTube API ─────────────────────────────────────────────────────────────
function classifyChannel(title: string): string {
  const t = title.toLowerCase();
  if (/게임|gaming|lol|롤|리그|오버워치|valorant|마인크래프트|스팀|플레이/.test(t)) return "게임";
  if (/요리|쿠킹|cooking|레시피|chef|먹방|음식|자취|살림/.test(t)) return "요리/살림";
  if (/k-?pop|kpop|아이돌|idol|bts|blackpink|뉴진스|에스파|걸그룹|보이그룹/.test(t)) return "K-pop";
  if (/음악|music|뮤직|노래|song|뮤지션|band|밴드|힙합|재즈|클래식/.test(t)) return "음악";
  if (/ai|인공지능|chatgpt|gpt|llm|머신러닝|딥러닝/.test(t)) return "AI/테크";
  if (/코딩|coding|개발|developer|dev|programmer|프로그래밍|소프트웨어|it강의/.test(t)) return "코딩/IT";
  if (/테크|tech|technology|gadget|언박싱|리뷰.*기기|전자/.test(t)) return "AI/테크";
  if (/운동|fitness|gym|헬스|workout|홈트|필라테스|크로스핏|pt|트레이닝/.test(t)) return "홈트/운동";
  if (/영화|movie|cinema|film|드라마|review|리뷰|평론/.test(t)) return "영화/리뷰";
  if (/예능|entertainment|방송|유머|개그|vlog|브이로그|일상|먹방/.test(t)) return "엔터/예능";
  if (/자기계발|성장|성공|mindset|motivation|독서|책|공부|습관/.test(t)) return "자기계발";
  return "기타";
}

function generateYearComment(cats: string[], year: number): string {
  if (year === 2020 || year === 2021) return "COVID 락다운의 흔적";
  const lines: Record<string, string> = {
    "음악": "노래에 빠져있던 시절",
    "K-pop": "아이돌에 빠져있던 시절",
    "게임": "게임이 한창이었군",
    "코딩/IT": "코딩 배우던 시절",
    "AI/테크": "AI에 눈뜬 시절",
    "요리/살림": "자취 시작했나?",
    "자기계발": "뭔가 열심히 하려 했던 시절",
    "홈트/운동": "운동 결심했던 시절",
    "엔터/예능": "예능 삼매경",
    "영화/리뷰": "영화에 빠진 시절",
    "기타": "이것저것 구경하던 시절",
  };
  return lines[cats[0]] || "이것저것 구경하던 시절";
}

function estimateWatchTime(totalSubs: number): { years: number; months: number } {
  // avg channel: ~500 videos × 12 min = 6000 min = 100 hours
  const totalHours = totalSubs * 100;
  const years = Math.floor(totalHours / 8760);
  const months = Math.floor((totalHours % 8760) / 730);
  return { years: Math.max(1, years), months };
}

async function fetchAllSubscriptions(
  token: string,
  onProgress?: (n: number) => void,
): Promise<SubItem[]> {
  const items: SubItem[] = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/subscriptions');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('mine', 'true');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`subscriptions.list ${res.status}`);
    const json = await res.json();
    items.push(...(json.items || []));
    pageToken = json.nextPageToken || '';
    onProgress?.(items.length);
  } while (pageToken);
  return items;
}

async function fetchChannelsInBatches(
  ids: string[],
  token: string,
): Promise<Map<string, ChannelItem>> {
  const map = new Map<string, ChannelItem>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('id', batch.join(','));
    url.searchParams.set('maxResults', '50');
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`channels.list ${res.status}`);
    const json = await res.json();
    for (const ch of (json.items || []) as ChannelItem[]) {
      map.set(ch.id, ch);
    }
  }
  return map;
}

function isDeadChannel(ch: ChannelItem | undefined): boolean {
  if (!ch) return true;
  const videos = parseInt(ch.statistics.videoCount || '0');
  const subs = parseInt(ch.statistics.subscriberCount || '0');
  if (videos === 0) return true;
  if (subs < 50 && videos < 3) return true;
  return false;
}

function buildAnalyzedData(subs: SubItem[], channels: Map<string, ChannelItem>): AnalyzedData {
  const now = new Date().getFullYear();

  const totalSubs = subs.length;

  // oldest subscription
  const sorted = [...subs].sort(
    (a, b) => new Date(a.snippet.publishedAt).getTime() - new Date(b.snippet.publishedAt).getTime(),
  );
  const oldest = sorted[0];
  const oldestYear = new Date(oldest.snippet.publishedAt).getFullYear();
  const yearsOnYoutube = now - oldestYear;

  // dead channel %
  let deadCount = 0;
  for (const sub of subs) {
    if (isDeadChannel(channels.get(sub.snippet.resourceId.channelId))) deadCount++;
  }
  const deadChannelPercent = Math.round((deadCount / totalSubs) * 100);

  // score: dead % weighted 70%, size normalized to 300 subs weighted 30%
  const sizeScore = Math.min((totalSubs / 300) * 100, 100);
  const lazinessScore = Math.max(0, Math.min(100, Math.round(deadChannelPercent * 0.7 + sizeScore * 0.3)));

  // oldest channel info
  const oldestCh = channels.get(oldest.snippet.resourceId.channelId);
  const oldestTitle = oldestCh?.snippet.title || oldest.snippet.title;
  const oldestDead = isDeadChannel(oldestCh);
  // estimate diedYear: if dead, roughly 2 years after subscription; clamp to plausible range
  const diedYear = oldestDead
    ? Math.min(oldestYear + 3, now - 1)
    : now;

  // category distribution
  const catCount: Record<string, number> = {};
  for (const sub of subs) {
    const ch = channels.get(sub.snippet.resourceId.channelId);
    const title = ch?.snippet.title || sub.snippet.title;
    const cat = classifyChannel(title);
    catCount[cat] = (catCount[cat] || 0) + 1;
  }
  const catEntries = Object.entries(catCount)
    .filter(([name]) => name !== '기타')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9);
  // add 기타 if significant
  if (catCount['기타'] > 0) catEntries.push(['기타', catCount['기타']]);
  const categoryDistribution = catEntries.map(([name, count]) => ({
    name,
    count,
    pct: parseFloat(((count / totalSubs) * 100).toFixed(1)),
  }));

  // yearly interests: group by subscription year, pick 7 most active years
  const byYear: Record<number, SubItem[]> = {};
  for (const sub of subs) {
    const year = new Date(sub.snippet.publishedAt).getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(sub);
  }

  const selectedYears = Object.entries(byYear)
    .map(([year, items]) => ({ year: parseInt(year), count: items.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .sort((a, b) => a.year - b.year)
    .map(y => y.year);

  const yearlyInterests = selectedYears.map(year => {
    const items = byYear[year];
    const yearCats: Record<string, number> = {};
    const channelList = items.slice(0, 5).map(sub => {
      const ch = channels.get(sub.snippet.resourceId.channelId);
      const title = ch?.snippet.title || sub.snippet.title;
      const cat = classifyChannel(title);
      yearCats[cat] = (yearCats[cat] || 0) + 1;
      return { name: title, cat, status: isDeadChannel(ch) ? 'dead' : 'alive' };
    });
    const topCats = Object.entries(yearCats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([c]) => c);
    const age = year === oldestYear ? '처음 가입한 해' : `${year - oldestYear}년차`;
    return { year, age, categories: topCats, comment: generateYearComment(topCats, year), channels: channelList };
  });

  // forgotten interests: dead channels from the first half of history
  const midYear = oldestYear + Math.floor(yearsOnYoutube / 2);
  const earlyDeadTitles = subs
    .filter(sub => {
      const yr = new Date(sub.snippet.publishedAt).getFullYear();
      return yr <= midYear && isDeadChannel(channels.get(sub.snippet.resourceId.channelId));
    })
    .map(sub => {
      const ch = channels.get(sub.snippet.resourceId.channelId);
      return ch?.snippet.title || sub.snippet.title;
    })
    .slice(0, 12);

  const forgottenInterests = earlyDeadTitles.length >= 5
    ? earlyDeadTitles
    : ["목공", "한국요리", "비건", "인디게임 개발", "사진", "독서", "필름카메라", "캘리그라피", "재즈"];

  return {
    totalSubs,
    yearsOnYoutube,
    deadChannelPercent,
    lazinessScore,
    oldestSubscription: { channel: oldestTitle, subscribedYear: oldestYear, diedYear },
    totalWatchTime: estimateWatchTime(totalSubs),
    categoryDistribution,
    yearlyInterests,
    forgottenInterests,
  };
}

// ── Hooks ───────────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

function useCountUp(target: number, duration = 2400, start = 0): [number, React.RefObject<HTMLDivElement | null>] {
  const [v, setV] = useState(start);
  const startedRef = useRef(false);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ringRef.current;
    if (!node) return;
    const begin = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setV(Math.round(start + (target - start) * e));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) { begin(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { begin(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration, start]);

  return [v, ringRef];
}

// ── UI Components ────────────────────────────────────────────────────────────
function Chrome() {
  return (
    <header className="chrome">
      <div className="crest">구독 분석기<span className="dot"></span>v1.0</div>
      <div className="crest-r">2009 — 2026</div>
    </header>
  );
}

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const [val, ref] = useCountUp(score, 2400);
  const r = 86;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - val / 100);
  const ticks = Array.from({ length: 40 }).map((_, i) => {
    const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
    const inner = 96, outer = i % 5 === 0 ? 105 : 101;
    return (
      <line key={i}
        x1={100 + Math.cos(a) * inner} y1={100 + Math.sin(a) * inner}
        x2={100 + Math.cos(a) * outer} y2={100 + Math.sin(a) * outer}
        className="ring-tick" opacity={i % 5 === 0 ? .6 : .25}
      />
    );
  });
  return (
    <div className="ring-wrap" ref={ref}>
      <svg className="ring" viewBox="0 0 200 200">
        {ticks}
        <circle className="ring-bg" cx="100" cy="100" r={r} strokeWidth="6" />
        <circle className="ring-fg" cx="100" cy="100" r={r} strokeWidth="6"
          stroke={accent} strokeDasharray={C} strokeDashoffset={offset} />
      </svg>
      <div className="ring-center">
        <div className="ring-label-top">분석 점수</div>
        <div className="ring-num">{val}<span className="denom">/100</span></div>
        <div className="ring-cap">Score · 종합 평가</div>
      </div>
    </div>
  );
}

function Hero({ data, accent }: { data: AnalyzedData; accent: string }) {
  return (
    <section className="hero">
      <div className="hero-tag reveal">YouTube Subscription Analyzer · v1.0</div>
      <h1 className="hero-title reveal d1">유튜브 <span className="accent">구독 목록</span><br />분석기</h1>
      <p className="hero-sub reveal d2">{data.yearsOnYoutube}년의 구독 여정을 돌아보다</p>
      <div className="archive-card reveal d3">
        <div className="archive-head">
          <span>SPECIMEN №{data.totalSubs}</span>
          <span className="id">archived 2026</span>
        </div>
        <div className="archive-grid">
          <div className="ag"><div className="ag-num">{data.totalSubs}</div><div className="ag-lbl">구독 채널</div></div>
          <div className="ag"><div className="ag-num">{data.yearsOnYoutube}<span className="u">년</span></div><div className="ag-lbl">기록된 시간</div></div>
          <div className="ag"><div className="ag-num">{data.deadChannelPercent}<span className="u">%</span></div><div className="ag-lbl">무덤 상태</div></div>
        </div>
        <div className="archive-foot"><em>지금부터 당신의 구독함을<br />한 권의 책처럼 펼쳐볼게요.</em></div>
      </div>
      <div className="scroll-cue reveal d4"><span>scroll</span><span className="l"></span></div>
    </section>
  );
}

function CategoryDonut({ data, totalSubs, accent }: { data: AnalyzedData['categoryDistribution']; totalSubs: number; accent: string }) {
  const [active, setActive] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let started = false;
    const begin = () => {
      if (started) return; started = true;
      const t0 = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        setAnimProgress(e);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { begin(); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const total = data.reduce((s, d) => s + d.pct, 0);
  const cx = 100, cy = 100, R = 78, r = 50;
  let cum = 0;
  const segs = data.map((d) => {
    const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
    cum += d.pct * animProgress;
    const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
    const large = (end - start) > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
    const x3 = cx + r * Math.cos(end),   y3 = cy + r * Math.sin(end);
    const x4 = cx + r * Math.cos(start), y4 = cy + r * Math.sin(start);
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
    return { ...d, path, color: CATEGORY_COLORS[d.name] || accent };
  });

  const focused = active != null ? data[active] : null;

  return (
    <div className="donut-wrap reveal d2" ref={ref}>
      <div className="donut">
        <svg viewBox="0 0 200 200">
          {segs.map((s, i) => (
            <path key={s.name} d={s.path} fill={s.color}
              className={`donut-seg ${active === i ? 'on' : ''} ${active != null && active !== i ? 'off' : ''}`}
              onClick={() => setActive(active === i ? null : i)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="donut-center">
          {focused ? (
            <>
              <div className="donut-c-pct">{focused.pct.toFixed(1)}<span>%</span></div>
              <div className="donut-c-name">{focused.name}</div>
              <div className="donut-c-sub">{focused.count}개 채널</div>
            </>
          ) : (
            <>
              <div className="donut-c-pct" style={{ fontSize: 32 }}>{data.length}</div>
              <div className="donut-c-name" style={{ color: 'var(--paper-mute)', fontStyle: 'italic', fontSize: 12 }}>분야</div>
              <div className="donut-c-sub">총 {totalSubs}개</div>
            </>
          )}
        </div>
      </div>
      <ul className="legend">
        {segs.map((s, i) => (
          <li key={s.name}
            className={`leg ${active === i ? 'on' : ''} ${active != null && active !== i ? 'off' : ''}`}
            onClick={() => setActive(active === i ? null : i)}>
            <span className="dot" style={{ background: s.color }}></span>
            <span className="ln">{s.name}</span>
            <span className="pct">{s.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Distribution({ data, accent }: { data: AnalyzedData; accent: string }) {
  return (
    <section>
      <div className="eyebrow reveal"><span className="num">i.</span><span>관심사 분포</span><span className="line"></span></div>
      <h2 className="title reveal d1">{data.yearsOnYoutube}년 동안 내가 본 것들의<br /><em>지도</em></h2>
      <p className="lede reveal d2">{data.totalSubs}개 구독 채널을 카테고리로 묶었어요. 어디에 가장 많이 머물렀을까요.</p>
      <CategoryDonut data={data.categoryDistribution} totalSubs={data.totalSubs} accent={accent} />
    </section>
  );
}

function Timeline({ data }: { data: AnalyzedData }) {
  return (
    <section>
      <div className="eyebrow reveal"><span className="num">ii.</span><span>연도별 구독 기록</span><span className="line"></span></div>
      <h2 className="title reveal d1">{data.yearsOnYoutube}년의 <em>나</em>들이<br />지나간다</h2>
      <p className="lede reveal d2">매해 나는 다른 사람이었어요. 그때 구독한 채널이 그 시절을 기억하고 있죠.</p>
      <div className="timeline" style={{ marginTop: 32 }}>
        {data.yearlyInterests.map((y, i) => (
          <div key={y.year} className={`tl-item reveal ${i === data.yearlyInterests.length - 1 ? 'now' : ''}`}>
            <div className="tl-year">{y.year}<span className="age">— {y.age}</span></div>
            <div className="tl-cats">
              {y.categories.map(c => (
                <span key={c} style={{ borderColor: (CATEGORY_COLORS[c] || 'var(--rule)') + '66', color: CATEGORY_COLORS[c] || 'var(--paper-dim)' }}>{c}</span>
              ))}
            </div>
            <div className="tl-comment">{y.comment}</div>
            <ul className="tl-channels">
              {y.channels.map(ch => (
                <li key={ch.name} className={`tl-ch ${ch.status === 'dead' ? 'dead' : ''}`}>
                  <span className="ch-thumb" style={{
                    background: ch.status === 'dead' ? 'linear-gradient(135deg,#1c1a18,#0f0d0c)' : `linear-gradient(135deg, ${(CATEGORY_COLORS[ch.cat] || '#888')}33, #0f0d0c)`,
                    borderColor: ch.status === 'dead' ? 'var(--rule)' : (CATEGORY_COLORS[ch.cat] || 'var(--rule)') + '55'
                  }}>{ch.name.charAt(0)}</span>
                  <span className="ch-name">{ch.name}</span>
                  <span className="ch-cat" style={{ color: CATEGORY_COLORS[ch.cat] }}>{ch.cat}</span>
                  {ch.status === 'dead' && <span className="ch-rip" title="활동 멈춤">🪦</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Analysis({ data }: { data: AnalyzedData }) {
  return (
    <section>
      <div className="eyebrow reveal"><span className="num">iii.</span><span>구독목록 분석</span><span className="line"></span></div>
      <h2 className="title reveal d1">숫자로 보는 <em>현실</em></h2>
      <p className="lede reveal d2">지나간 시간을 보고 나니, 이제 숫자가 좀 더 무겁게 다가올 거예요.</p>
      <div style={{ marginTop: 24 }}>
        <div className="stat reveal">
          <div className="stat-num">{data.deadChannelPercent}<span className="u">%</span></div>
          <h3 className="stat-h">구독 채널의 {data.deadChannelPercent}%가 <em style={{ color: 'var(--coral)', fontStyle: 'italic' }}>무덤 상태</em></h3>
          <p className="stat-p">업로드가 없거나 구독자가 거의 없는 채널의 비율. {Math.round(data.totalSubs * data.deadChannelPercent / 100)}개의 유령이 당신의 구독함에 살고 있어요.</p>
        </div>
        <div className="stat reveal d1">
          <div className="stat-num">{data.totalWatchTime.years}<span className="u">년</span></div>
          <h3 className="stat-h">이 영상 다 보려면 <em style={{ color: 'var(--coral)', fontStyle: 'italic' }}>{data.totalWatchTime.years}년 {data.totalWatchTime.months}개월</em></h3>
          <p className="stat-p">구독 채널의 모든 영상을 1배속으로 본다면. 잠도 안 자고요. 진심으로요.</p>
        </div>
        <div className="stat reveal d2">
          <div className="stat-num">{data.yearsOnYoutube}<span className="u">년</span></div>
          <h3 className="stat-h">당신의 첫 구독: <em style={{ color: 'var(--coral)', fontStyle: 'italic' }}>{data.oldestSubscription.subscribedYear}년</em></h3>
          <p className="stat-p">{data.yearsOnYoutube}년 전. 그때 당신은 무얼 보고 있었을까요. 위에서 이미 만나보셨죠.</p>
        </div>
      </div>
    </section>
  );
}

function OldestGrave({ data }: { data: AnalyzedData }) {
  const o = data.oldestSubscription;
  const lifespan = o.diedYear - o.subscribedYear;
  return (
    <>
      <section className="grave-section">
        <div className="eyebrow reveal"><span className="num">iv.</span><span>가장 오래된 시체</span><span className="line"></span></div>
        <h2 className="title reveal d1">첫 번째로 사랑했고,<br /><em>가장 먼저 잊었습니다</em></h2>
        <div className="grave reveal d2">
          <div className="grave-eyebrow">in loving memory of</div>
          <div className="grave-rip">R · I · P</div>
          <h3 className="grave-name"><em>{o.channel}</em></h3>
          <p className="grave-dates">{o.subscribedYear}<span className="dash">—</span>{o.diedYear}</p>
          <p className="grave-eulogy">{lifespan}년의 동행 후 마지막 영상을 끝으로 침묵.<br />하지만 당신의 구독함에는 아직 살아있습니다.</p>
        </div>
      </section>
      <div className="ground"><div className="ground-line"></div></div>
    </>
  );
}

function Forgotten({ data }: { data: AnalyzedData }) {
  const [live, setLive] = useState(new Set<string>());
  const toggle = (t: string) => {
    setLive(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };
  return (
    <section>
      <div className="eyebrow reveal"><span className="num">v.</span><span>잊혀진 채널들</span><span className="line"></span></div>
      <h2 className="title reveal d1"><em>기억나?</em></h2>
      <p className="lede reveal d2">한때 당신의 알고리즘을 가득 채웠지만,<br />지금은 영상도 없이 구독함에 남아있는 채널들.</p>
      <div className="forgotten-cloud reveal d3">
        {data.forgottenInterests.map(t => (
          <button key={t} className={`ftag ${live.has(t) ? 'live' : ''}`} onClick={() => toggle(t)} type="button">
            <span className="x">{live.has(t) ? '✦' : '×'}</span>{t}
          </button>
        ))}
      </div>
      <p className="forgotten-q reveal d4">다시 돌아간 채널이 있나요?<br />— 가끔은 그게 나를 살리기도 해요.</p>
    </section>
  );
}

function Verdict({ data }: { data: AnalyzedData }) {
  const v = getVerdict(data.lazinessScore);
  const ringStyle = v.isEdgeCase ? { filter: `drop-shadow(0 0 24px ${v.accent}88)` } : {};
  return (
    <section className="verdict-section" style={{ background: `radial-gradient(120% 80% at 50% 30%, ${v.accent}15, transparent 60%)` }}>
      <div className="eyebrow reveal"><span className="num">vi.</span><span>최종 분석 점수</span><span className="line"></span></div>
      <h2 className="title reveal d1">자, 그래서<br />당신의 <em style={{ color: v.accent }}>점수는</em></h2>
      <p className="lede reveal d2">{data.yearsOnYoutube}년의 발자취를 종합해서 매긴 한 줄 평가예요.<br />지나치게 진지하게 받아들이지는 마세요.</p>
      <div className="specimen reveal d3" style={{ marginTop: 28, ...ringStyle }}>
        <div className="specimen-head"><span>FINAL VERDICT</span><span className="id">archived 2026</span></div>
        <ScoreRing score={data.lazinessScore} accent={v.accent} />
        <div className="verdict" style={{ background: `${v.accent}10`, borderColor: `${v.accent}33` }}>
          <div className="verdict-tag" style={{ color: v.accent, borderRightColor: `${v.accent}33` }}>{v.tag}</div>
          <div className="verdict-body">
            <p className="verdict-h"><span className="em" style={{ color: v.accent }}>{v.title}</span> {v.badge}</p>
            <p className="verdict-p">{v.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Share({ data }: { data: AnalyzedData }) {
  const v = getVerdict(data.lazinessScore);
  const shareText = v.shareText;

  const onKakao = () => alert("카카오 공유 (실제 SDK 연동 예정)");
  const tryNative = async (label: string) => {
    if (navigator.share) {
      try { await navigator.share({ title: "유튜브 구독 목록 분석기 v1.0", text: shareText, url: location.href }); }
      catch { /* user cancelled */ }
    } else {
      alert(`${label} 공유 (브라우저 미지원 — 링크 복사로 대체)`);
    }
  };
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${location.href}`);
      alert("링크 복사 완료!");
    } catch { alert("링크 복사 실패. 수동으로 복사해 주세요."); }
  };

  const lede = ({
    "achievement":   "이 정도면 자랑해도 됩니다. 친구들 부끄럽게 만들어줘요.",
    "neutral":       "친구도 비슷한 점수일까요? 한번 물어봐요.",
    "self-deprecate": `분석 점수 ${data.lazinessScore}점이 부끄럽다고요? 다 같이 부끄러우면 그건 그냥 인류의 평균이에요.`,
    "competitive":   "이 점수, 친구가 깰 수 있을까요? 도전장 던져봐요.",
    "legendary":     "이런 점수 흔하지 않아요. 자랑할 자격 충분합니다.",
  } as Record<string, string>)[v.shareTone] || "";

  return (
    <section className="share-section">
      <div className="eyebrow reveal"><span className="num">vii.</span><span>친구에게 보여주기</span><span className="line"></span></div>
      <h2 className="title reveal d1">친구의 <em style={{ color: v.accent }}>점수는</em><br />어떨까?</h2>
      <p className="lede reveal d2">{lede}</p>
      <div className="share-card reveal d3">
        <div className="share-preview" style={{ borderColor: `${v.accent}55` }}>
          <div className="pn" style={{ color: v.accent }}>{data.lazinessScore}<span className="pd">/100</span></div>
          <div className="pl">분석 점수 · {v.title} {v.badge}</div>
          <div className="pt">&quot;{shareText.split('\n')[1] || '내 유튜브가 박물관이 됐어'}&quot;</div>
        </div>
        <button className="kakao-btn" onClick={onKakao} type="button">
          <svg className="bub" viewBox="0 0 22 20" fill="currentColor"><path d="M11 0C4.92 0 0 3.86 0 8.6c0 3.05 2.04 5.72 5.1 7.21l-1.3 4.74c-.11.4.34.72.7.5l5.62-3.7c.29.03.58.05.88.05 6.08 0 11-3.86 11-8.6S17.08 0 11 0z" /></svg>
          카카오톡으로 자랑하기
        </button>
        <div className="share-row">
          <button className="share-mini" onClick={() => tryNative("X")} type="button">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            X / 트위터
          </button>
          <button className="share-mini" onClick={() => tryNative("인스타")} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
            스토리
          </button>
          <button className="share-mini" onClick={onCopy} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11.5 4.43" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 1 0 0 7.07 7.07L12.5 19.57" /></svg>
            링크복사
          </button>
        </div>
      </div>
      <p className="share-quote reveal d4">&quot;다들 어떻게든 살고 있구나&quot; 라는 안도감,<br />그게 우리가 이걸 만든 이유예요.</p>
    </section>
  );
}

function CTA({ data }: { data: AnalyzedData }) {
  return (
    <>
      <section className="cta-section">
        <div className="cta-eyebrow reveal">— epilogue —</div>
        <h2 className="cta-h reveal d1">이제 진짜<br /><em>정리해볼까요?</em></h2>
        <p className="cta-p reveal d2">{data.yearsOnYoutube}년치 무덤을 손가락 하나로.<br />무료로 만들었어요. 광고도 없습니다.</p>
        <a className="play-btn reveal d3"
          href="https://play.google.com/store/apps/details?id=com.sangwwoo.youtubesubcleaner"
          target="_blank" rel="noopener noreferrer">
          <svg className="play-icon" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="pl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF6B47" /><stop offset="1" stopColor="#D4A857" />
              </linearGradient>
            </defs>
            <path fill="url(#pl)" d="M5.5 3.2c-.4.3-.6.8-.6 1.4v22.8c0 .6.2 1.1.6 1.4l11.7-12.6L5.5 3.2z" />
            <path fill="#FF6B47" d="M22.6 19.5l-3.7-4 3.7-4 4.4 2.5c1.4.8 1.4 2.2 0 3l-4.4 2.5z" opacity=".95" />
            <path fill="#FFC857" d="M5.5 28.8c.5.4 1.2.4 2 0l13.4-7.6-3.7-4L5.5 28.8z" />
            <path fill="#E63946" d="M17.2 16l3.7-4L7.5 4.4c-.8-.4-1.5-.4-2-.1L17.2 16z" opacity=".9" />
          </svg>
          <div className="play-text">
            <div className="small">GET IT ON</div>
            <div className="big">Google Play</div>
          </div>
        </a>
        <div>
          <button className="cta-rerun" onClick={() => location.reload()} type="button">↻  다시 분석하기</button>
        </div>
      </section>
      <div className="colophon">
        <span className="em">— colophon —</span>
        유튜브 구독 목록 분석기 · v1.0<br />
        {data.totalSubs}개 채널, {data.yearsOnYoutube}년의 발자국, 한 번의 정리.<br />
        만든 사람: <span style={{ color: 'var(--coral-soft)' }}>sangwwoo</span> · 2026
      </div>
    </>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing">
      <div className="landing-spacer"></div>
      <div className="landing-tag">YouTube Subscription Analyzer · v1.0</div>
      <h1 className="landing-title">17년의 구독 여정을<br /><em>한 권의 책</em>으로</h1>
      <p className="landing-sub">당신의 유튜브 구독 채널을 박물관처럼 큐레이션해드려요.<br />잊고 있던 채널을 다시 만나보세요.</p>
      <div className="landing-promise">
        <div className="promise-h">— 시작 전 약속 —</div>
        <ul className="promise-list">
          <li><span className="ck">✓</span><span>모든 분석은 <strong>당신의 브라우저</strong>에서만 진행됩니다.</span></li>
          <li><span className="ck">✓</span><span>저희는 <strong>서버도, 데이터베이스도 없습니다.</strong></span></li>
          <li><span className="ck">✓</span><span>구독 목록만 읽고, 그 외 어떤 데이터도 건드리지 않아요.</span></li>
          <li><span className="ck">✓</span><span>창을 닫으면 모든 정보가 함께 사라집니다.</span></li>
        </ul>
      </div>
      <button className="google-btn" onClick={onStart} type="button">
        <svg className="g-icon" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.63z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.36 0-4.36-1.59-5.07-3.74H.96v2.33C2.44 15.98 5.48 18 9 18z" />
          <path fill="#FBBC05" d="M3.93 10.68c-.18-.54-.29-1.12-.29-1.71 0-.6.1-1.18.29-1.71V4.93H.96C.35 6.18 0 7.55 0 9c0 1.45.35 2.82.96 4.07l2.97-2.39z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.45 1.35l2.59-2.59C13.46.91 11.43 0 9 0 5.48 0 2.44 2.02.96 4.93l2.97 2.39C4.64 5.17 6.64 3.58 9 3.58z" />
        </svg>
        Google 로그인으로 분석 시작
      </button>
      <p className="landing-fineprint">Google 계정 로그인 시 <strong>구독 목록 읽기 권한</strong>만 요청합니다.<br />언제든 권한을 철회할 수 있어요.</p>
      <div className="landing-foot">무료 · 광고 없음 · 회원가입 없음</div>
    </div>
  );
}

function Loading({ msg }: { msg: string }) {
  return (
    <div className="loading">
      <div className="loading-orb"></div>
      <h2 className="loading-h">당신의 구독함을<br /><em>들춰보고 있어요</em></h2>
      <div className="loading-step">{msg}</div>
    </div>
  );
}

function ErrorScreen({ onRetry, errorMsg }: { onRetry: () => void; errorMsg?: string }) {
  return (
    <div className="loading">
      <div className="loading-orb" style={{ background: 'var(--coral)' }}></div>
      <h2 className="loading-h">분석에 <em>실패했어요</em></h2>
      <div className="loading-step">
        {errorMsg || 'Google 권한 오류 또는 네트워크 오류가 발생했어요.'}
      </div>
      <button className="cta-rerun" style={{ marginTop: 32 }} onClick={onRetry} type="button">← 처음으로</button>
    </div>
  );
}

function CardDeck({ cards }: { cards: React.ReactNode[] }) {
  const [cur, setCur] = useState(0);
  const total = cards.length;
  const deckRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const cardEls = deck.querySelectorAll('.card');
    const card = cardEls[cur] as HTMLElement | undefined;
    if (!card) return;
    const id = setTimeout(() => {
      card.querySelectorAll<HTMLElement>('.reveal').forEach(el => el.classList.add('in'));
    }, 360);
    return () => clearTimeout(id);
  }, [cur]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(cur + 1);
      if (e.key === 'ArrowLeft') go(cur - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const go = (n: number) => setCur(Math.max(0, Math.min(total - 1, n)));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 48 && Math.abs(dx) > dy) go(cur + (dx > 0 ? 1 : -1));
  };

  return (
    <div className="card-deck" ref={deckRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="card-track" style={{ transform: `translateX(-${cur * 100}%)` }}>
        {cards.map((child, i) => (
          <div key={i} className="card">{child}</div>
        ))}
      </div>
      <div className="card-dots">
        {cards.map((_, i) => (
          <button key={i} className={`card-dot${i === cur ? ' active' : ''}`} onClick={() => go(i)} type="button" aria-label={`${i + 1}번 카드`} />
        ))}
      </div>
      {cur > 0 && <button className="card-arrow card-arrow-l" onClick={() => go(cur - 1)} type="button">‹</button>}
      {cur < total - 1 && <button className="card-arrow card-arrow-r" onClick={() => go(cur + 1)} type="button">›</button>}
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<'landing' | 'loading' | 'result' | 'error'>('landing');
  const [data, setData] = useState<AnalyzedData>(sampleData);
  const [loadingMsg, setLoadingMsg] = useState("구독 목록 불러오는 중...");
  const [errorMsg, setErrorMsg] = useState<string | undefined>();

  const onStart = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const gis = (window as any).google?.accounts?.oauth2;

    if (!clientId || !gis) {
      // GIS not available — show demo
      setPhase('loading');
      setLoadingMsg("데모 데이터 불러오는 중...");
      setTimeout(() => { setData(sampleData); setPhase('result'); }, 2500);
      return;
    }

    const tokenClient = gis.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      callback: async (resp: { access_token?: string; error?: string }) => {
        if (!resp.access_token) {
          console.error('[GIS error]', resp.error, resp);
          const silent = ['access_denied', 'popup_closed_by_user', 'popup_failed_to_open'];
          if (!silent.includes(resp.error || '')) {
            setErrorMsg(`OAuth 오류: ${resp.error || 'unknown'}`);
            setPhase('error');
          }
          return;
        }
        setPhase('loading');
        try {
          setLoadingMsg("구독 목록 불러오는 중...");
          const subs = await fetchAllSubscriptions(resp.access_token, (n) => {
            setLoadingMsg(`구독 목록 불러오는 중... (${n}개)`);
          });

          setLoadingMsg(`${subs.length}개 채널 활동 분석 중...`);
          const channelIds = subs.map(s => s.snippet.resourceId.channelId);
          const channels = await fetchChannelsInBatches(channelIds, resp.access_token);

          setLoadingMsg("카테고리 분류 중...");
          await new Promise(r => setTimeout(r, 300));

          setLoadingMsg("분석 점수 계산 중...");
          const analyzed = buildAnalyzedData(subs, channels);
          await new Promise(r => setTimeout(r, 600));

          setData(analyzed);
          setPhase('result');
        } catch (e) {
          setErrorMsg(`API 오류: ${e instanceof Error ? e.message : String(e)}`);
          setPhase('error');
        }
      },
    });
    tokenClient.requestAccessToken();
  };

  if (phase === 'landing') return <div className="stage"><Landing onStart={onStart} /></div>;
  if (phase === 'loading') return <div className="stage"><Loading msg={loadingMsg} /></div>;
  if (phase === 'error') return <div className="stage"><ErrorScreen onRetry={() => setPhase('landing')} errorMsg={errorMsg} /></div>;

  const cards: React.ReactNode[] = [
    <Hero data={data} accent={ACCENT} />,
    <Distribution data={data} accent={ACCENT} />,
    <Timeline data={data} />,
    <Analysis data={data} />,
    <OldestGrave data={data} />,
    <Forgotten data={data} />,
    <Verdict data={data} />,
    <Share data={data} />,
    <CTA data={data} />,
  ];

  return (
    <div className="stage">
      <Chrome />
      <CardDeck cards={cards} />
    </div>
  );
}
