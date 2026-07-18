// React는 index.html에서 전역으로 로드
const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;

// ===== 뒤로가기 공용 — 페이지·단계·팝업을 하나의 스택으로 관리 =====
const __nav = { stack: [], guard: false, suppress: false };

// 화면 상태(페이지/단계)를 뒤로가기에 연결: 값이 '앞으로' 바뀌면 한 칸 쌓고, 뒤로가기 때 이전 값으로 되돌린다
function useHistoryNav(value, setValue) {
  const ref = useRef(value);
  useEffect(() => {
    if (__nav.guard) { __nav.guard = false; ref.current = value; return; } // 뒤로가기로 바뀐 거면 기록 안 함
    let changed;
    try { changed = JSON.stringify(value) !== JSON.stringify(ref.current); }
    catch (e) { changed = value !== ref.current; }
    if (changed) {
      const prev = ref.current;
      ref.current = value;
      __nav.stack.push({ undo: () => { __nav.guard = true; setValue(prev); } });
      window.history.pushState({ d: __nav.stack.length }, ""); // 앞으로 갈 때 히스토리 한 칸
    }
  }, [value]);
}

// 팝업/모달을 뒤로가기로 닫기 (같은 스택 사용)
function useBackClose(isOpen, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const layer = { undo: close, closing: false };
    ref.current = layer;
    __nav.stack.push(layer);
    window.history.pushState({ d: __nav.stack.length }, ""); // 팝업 열림 = 히스토리 한 칸
    return () => {
      const L = ref.current; ref.current = null;
      const i = __nav.stack.indexOf(L);
      if (i !== -1) __nav.stack.splice(i, 1);
      // 뒤로가기가 아니라 버튼/배경탭으로 닫혔으면, 우리가 쌓은 히스토리 칸을 회수
      if (L && !L.closing) { __nav.suppress = true; window.history.back(); }
    };
  }, [isOpen]);
}

// ──────────────────────────────────────────────
// 마음 곳간 — 통합 앱 (홈 + 쪽쪽이 마음 코치)
// 페이지 전환: App의 page 상태. world(세계지도)·기질테스트는 다음 단계에서 합류 예정
// ──────────────────────────────────────────────
// 홈 배경음악 (song.mp3) — 버튼 누를 때만 로드/재생. 로딩엔 영향 없음.
// ⚠️ 깃허브 저장소의 index.html과 같은 위치에 song.mp3 를 올려주세요.
var MAUM_BGM_SRC = "./song.mp3";
var MAUM_BGM = null;
function getBgm() {
  if (typeof window === "undefined") return null;
  if (!MAUM_BGM) {
    try {
      MAUM_BGM = new Audio(MAUM_BGM_SRC);
      MAUM_BGM.loop = true;
      MAUM_BGM.volume = 0.5;
      MAUM_BGM.preload = "none";
    } catch (e) {
      MAUM_BGM = null;
    }
  }
  return MAUM_BGM;
}

function App() {
  const [page, setPage] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false); // 💌 마음 서랍

  // ===== 뒤로가기(브라우저 ← / 폰 뒤로가기 버튼) → 이전 화면 =====
  useHistoryNav(page, setPage); // 페이지(홈·진단·코치·세계지도) 단위 뒤로가기
  useEffect(() => {
    const onPop = () => {
      if (__nav.suppress) { __nav.suppress = false; return; } // 정리용 back은 무시
      const top = __nav.stack.pop();
      if (top) { top.closing = true; top.undo(); } // 이전 단계 복원 또는 팝업 닫기
      // 스택이 비어있으면 → 브라우저가 자연스레 앱을 빠져나감
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useBackClose(drawerOpen, () => setDrawerOpen(false)); // 💌 서랍을 뒤로가기로 닫기

  if (page === "coach") return /*#__PURE__*/React.createElement(CoachPage, {
    onHome: () => setPage("home"),
    onTest: () => setPage("test"),
    onDrawer: () => {
      setDrawerOpen(true);
      setPage("home");
    }
  });
  if (page === "test") return /*#__PURE__*/React.createElement(TestPage, {
    onHome: () => setPage("home"),
    onCoach: () => setPage("coach"),
    onWorld: () => setPage("world")
  });
  if (page === "world") return /*#__PURE__*/React.createElement(WorldPage, {
    onHome: () => setPage("home"),
    onCoach: () => setPage("coach"),
    onTest: () => setPage("test")
  });
  return /*#__PURE__*/React.createElement(HomePage, {
    onCoach: () => setPage("coach"),
    onTest: () => setPage("test"),
    onWorld: () => setPage("world"),
    drawerOpen: drawerOpen,
    setDrawerOpen: setDrawerOpen
  });
}

// 앱 정체성 제목 (고정) + 시간대별 고문님 제로섬 어록(검증된 것만)

// 세 자매 대사 — 고문님 철학(좋은 점·제로섬)이 스며든 아이들의 입말
const LINES = {
  jjuk: ["엄마, 오늘도 잘하고 계세요!", "부족한 건 안 봐도 괜찮아요. 좋은 점만 봐요!", "우리 엄마가 보는 좋은 점, 그게 저희를 키워요.", "혼내지 않아도 돼요. 칭찬이 더 힘이 세요!"],
  jjok: ["히히, 오늘 좋은 점 하나 찾으셨어요?", "윙크! 좋은 점을 보면 좋은 점이 자라요.", "지적보다 칭찬! 그게 마법이에요.", "엄마 마음 곳간, 오늘도 채워볼까요?"],
  jjaek: ["오늘은 무슨 좋은 일이 있었어요?", "음… 우리 아이의 어떤 점이 예뻤어요?", "좋은 점을 넓히면 아쉬운 점은 쏙 숨는대요!", "엄마가 발견해 주면, 그게 진짜 좋은 점이 돼요."]
};

// 오늘의 고문님 말씀 — 모두 검증된 어록 (토씨 그대로, 지어내거나 의역하지 않음)
// 출처: 2025~2026 고문님 기록 + 「이재훈 고문 어록 정리」
const QUOTES = ["칭찬하세요, 꾸짖지 마시고ᆢ 마음에 안 드는 점 고치는 방법입니다.", "방법은 지적이 아니라 \u201c제로섬\u201d입니다.", "매일 좋은 점 칭찬해서 늘려주기입니다. 관찰하시다 보면 아이들 스스로 변합니다.", "관리란ᆢ 칭찬하면서 한 발씩 앞으로 나아가게 하는 것이랍니다.", "부족한 점 절대 지적하지 마시고 조금이라도 좋아진 점 열심히 찾아서 과장되게 칭찬해 주세요ᆢ", "칭찬이 급소입니다. 조금만 좋아져도 격하게 칭찬해 주세요.", "교육의 본질이 어머니의 관찰입니다."];
const APP_TITLE = "좋은 점으로 채우는\n마음 곳간";

// 제로섬 상세 — '더 보기'로 펼치는 검증된 고문님 어록 (토씨 그대로, 지어내지 않음)
const ZEROSUM_TEACHINGS = [{
  t: "제로섬·땅따먹기",
  d: "2026.03.08",
  body: "제로섬! 땅따먹기ᆢ 어린아이는 대부분 좋은 점 5개와 안좋은 점 5개 상태죠.\n나쁜 점 5개를 고쳐주려고 지적을 하면ᆢ 대부분의 아이들은 그것이 고쳐지기는커녕 지적당한 사실에 자신감을 잃고 좋은 점 5개마저 나빠져서 나쁜 점 6개, 좋은 점 4개로 역효과가 납니다.\n지적은ᆢ 9개가 좋은데ᆢ 딱 하나가 아쉬운 아이, 말귀도 알아듣고 자기성찰능력이 생긴 성숙한 아이에게 하셔야 합니다."
}, {
  t: "방법은 지적이 아니라 제로섬",
  d: "2026.03.07",
  body: "자녀의 기질을 이제라도 아셨으니 서서히 교정을 시작해 주세요. 방법은 지적이 아니라 \u201c제로섬\u201d입니다."
}, {
  t: "좋은 점을 칭찬해 늘려주기",
  d: "2025~2026",
  body: "매일 좋은 점 칭찬해서 늘려주기입니다. 관찰하시다 보면 아이들 스스로 변합니다. (2025.04.21)\n관리란ᆢ 칭찬하면서 한 발씩 앞으로 나아가게 하는 것이랍니다. (2025.03.27)\n부족한 점 절대 지적하지 마시고 조금이라도 좋아진 점 열심히 찾아서 과장되게 칭찬해 주세요ᆢ (2025.05.28)\n칭찬이 급소입니다. 조금만 좋아져도 격하게 칭찬해 주세요. (2026.02.01)\n격하게 칭찬해 주세요! 그래야 의욕이 점점 더 뜨거워집니다. (2026.01.13)"
}, {
  t: "꾸짖지 말고 칭찬하세요",
  d: "2026.05.24",
  body: "칭찬하세요, 꾸짖지 마시고ᆢ\n마음에 안 드는 점 고치는 방법입니다."
}, {
  t: "버릇은 말로 고쳐지지 않는다 — 탈출구",
  d: "2026.03.08",
  body: "아이를 기르는 일은 두렵고 두려운 일입니다. 틱이 있는 아이에게 틱 하지 말라고 꾸짖으면 틱이 더 심해집니다.\n주의하세요. 말로 버릇이 고쳐지지 않습니다. 중요한 건ᆢ 돌파구를 열어주는 일이죠.\n그 행동의 원인을 찾아서 그 행동을 하지 않아도 되는 다른 문을 열어주는 일입니다."
}, {
  t: "기질을 아셔야 합니다",
  d: "2026.01.13",
  body: "아이 기질에 따라 칭찬하는 방법도 달라져야 해요. 자녀가 새같은 아이인지 하늘같은 아이인지ᆢ 땅같은 아이인지ᆢ 뿌리같은 아이인지ᆢ 기질을 아셔야 해요."
}, {
  t: "교육의 본질은 어머니의 관찰",
  d: "2026.01.31",
  body: "교육의 본질이 어머니의 관찰입니다.\n관찰 과정에서 아이의 기질과 장점 단점을 보완해주고ᆢ 무엇보다도 글을 정확히 읽고 이해하는지 관찰이 중요합니다. 그래야 수재로 만드실 수 있습니다."
}];
function subOf(h) {
  // 시간대별 — 모두 고문님 검증 어록을 토씨 그대로 인용 (의역·창작 금지)
  if (h < 5) return "\u201c칭찬하세요, 꾸짖지 마시고ᆢ 마음에 안 드는 점 고치는 방법입니다.\u201d";
  if (h < 11) return "\u201c방법은 지적이 아니라 \u2018제로섬\u2019입니다.\u201d";
  if (h < 16) return "\u201c매일 좋은 점 칭찬해서 늘려주기입니다. 관찰하시다 보면 아이들 스스로 변합니다.\u201d";
  if (h < 19) return "\u201c칭찬이 급소입니다.\n조금만 좋아져도 격하게 칭찬해 주세요.\u201d";
  return "\u201c교육의 본질이 어머니의 관찰입니다.\u201d";
}
function HomePage({
  onCoach,
  onTest,
  onWorld,
  drawerOpen,
  setDrawerOpen
}) {
  const [now] = useState(new Date());
  const h = now.getHours();
  const sub = useMemo(() => subOf(h), [h]);
  const [stock, setStock] = useState(0);
  const [bubble, setBubble] = useState(null); // {who, text} 클릭된 새 말풍선
  const [showZero, setShowZero] = useState(false); // 제로섬 더 보기 패널
  const [showBackup, setShowBackup] = useState(false); // 💾 백업/복원 시트
  const [showHelp, setShowHelp] = useState(false); // 📖 사용법 펼침
  useBackClose(showZero, () => setShowZero(false));     // 제로섬 패널 뒤로가기로 닫기
  useBackClose(showBackup, () => setShowBackup(false)); // 백업 시트 뒤로가기로 닫기
  const [bkNick, setBkNick] = useState(""); // 백업 코드 (자동 생성, 폰에 저장)
  const [bkLabel, setBkLabel] = useState(""); // 찾기용 별명 (대표가 구제 시 단서)
  const [bkNewCode, setBkNewCode] = useState(""); // 새 폰에서 코드 직접 입력
  const [bkMsg, setBkMsg] = useState(null); // 백업 상태 메시지
  const [bkBusy, setBkBusy] = useState(false);
  const [musicOn, setMusicOn] = useState(false); // 🎵 배경음악 (버튼으로만 켜고 끔)
  function toggleMusic() {
    const a = getBgm();
    if (!a) return;
    if (musicOn) {
      a.pause();
      setMusicOn(false);
    } else {
      a.play().then(() => setMusicOn(true)).catch(() => {});
    }
  }
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_backup_nick");
        if (r && r.value) {
          setBkNick(r.value);
        } else {
          // 처음이면: 진단한 아이 정보(이름-년월)로 아이디 제안, 없으면 랜덤 코드
          let code = "";
          try {
            const c = await store.get("cheji:children:v1");
            if (c && c.value) {
              const kids = JSON.parse(c.value).filter(x => !x.isParent);
              const k = kids.find(x => x.byear) || kids[0];
              if (k && k.name) {
                const ym = k.byear ? k.byear + (k.bmonth ? String(k.bmonth).padStart(2, "0") : "") : "";
                code = "maum-" + k.name + (ym ? "-" + ym : "-" + Math.floor(100 + Math.random() * 900));
              }
            }
          } catch (e) {}
          if (!code) code = genBackupCode();
          setBkNick(code);
          try {
            await store.set("maum_backup_nick", code);
          } catch (e) {}
        }
        const l = await store.get("maum_backup_label");
        if (l && l.value) {
          setBkLabel(l.value);
        } else {
          try {
            const w = await store.get("maum_world5");
            if (w && w.value) {
              const o = JSON.parse(w.value);
              if (o.profile && o.profile.nick) setBkLabel(o.profile.nick);
            }
          } catch (e) {}
        }
      } catch (e) {}
    })();
  }, []);
  // 📲 앱 설치 (PWA) — 설치 가능 시점 포착
  const [installEvt, setInstallEvt] = useState(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onBip = e => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    } catch (e) {}
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  async function doInstall() {
    if (!installEvt) {
      setBkMsg({
        ok: false,
        t: "이 브라우저에선 메뉴의 '홈 화면에 추가'로 설치할 수 있어요. (아이폰 사파리: 공유 → 홈 화면에 추가)"
      });
      return;
    }
    installEvt.prompt();
    try {
      const {
        outcome
      } = await installEvt.userChoice;
      if (outcome === "accepted") setBkMsg({
        ok: true,
        t: "설치를 시작했어요!"
      });
    } catch (e) {}
    setInstallEvt(null);
  }
  async function doShare() {
    const url = typeof window !== "undefined" && window.location && window.location.origin && window.location.pathname ? window.location.origin + window.location.pathname : "";
    const shareData = {
      title: "마음 곳간 · 마더클럽",
      text: "제로섬과 땅따먹기 — 아이의 좋은 점을 발견하는 엄마의 자리",
      url
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
        setBkMsg({
          ok: true,
          t: "링크를 복사했어요. 어디든 붙여넣어 공유하세요."
        });
        return;
      }
      setBkMsg({
        ok: true,
        t: url || "공유 링크를 가져오지 못했어요."
      });
    } catch (e) {}
  }

  // 📱 반응형 — 폰(폭 520 이하)에서는 새를 키우고 카드를 컴팩트하게
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 400);
  useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener("resize", onR);
    try {
      const vp = document.querySelector('meta[name="viewport"]');
      if (vp && !/interactive-widget/.test(vp.content)) vp.content += ", interactive-widget=resizes-content";
    } catch (e) {}
    return () => window.removeEventListener("resize", onR);
  }, []);
  const mobile = vw <= 520;
  const bk = 1; // 새 크기 배율 — 원래 크기. 키우고 싶으면 이 숫자만 (예: 1.1)

  function chirp(who) {
    const arr = LINES[who];
    const text = arr[Math.floor(Math.random() * arr.length)];
    setBubble({
      who,
      text,
      t: Date.now()
    });
  }
  useEffect(() => {
    if (!bubble || bubble.quote) return; // 오늘의 말씀은 탭해야 닫힘
    const id = setTimeout(() => setBubble(null), 4000);
    return () => clearTimeout(id);
  }, [bubble]);

  // 매일 자동 인사 — 날짜 기준으로 새와 어록이 정해짐 (오늘의 고문님 말씀)
  // 닫은 뒤 1시간 안에는 다시 안 뜸 (maum_quote_seen에 닫은 시각 저장)
  useEffect(() => {
    let id = null,
      alive = true;
    (async () => {
      try {
        const r = await store.get("maum_quote_seen");
        if (r && r.value && Date.now() - parseInt(r.value, 10) < 3600000) return;
      } catch (e) {}
      if (!alive) return;
      const day = Math.floor(Date.now() / 86400000); // 날짜 인덱스
      const who = ["jjuk", "jjok", "jjaek"][day % 3];
      const quote = QUOTES[day % QUOTES.length];
      id = setTimeout(() => {
        if (alive) setBubble({
          who,
          text: quote,
          quote: true,
          t: Date.now()
        });
      }, 1500);
    })();
    return () => {
      alive = false;
      if (id) clearTimeout(id);
    };
  }, []);

  // 기질 버튼 — 진단 전: 테스트하기 / 후: 결과 기질 보러가기
  const [homeTemper, setHomeTemper] = useState(null); // 새/하늘/땅/뿌리
  const [tested, setTested] = useState(false);
  const [kidCount, setKidCount] = useState(0);
  useEffect(() => {
    (async () => {
      let n = 0;
      try {
        const r2 = await store.get("cheji:children:v1");
        if (r2 && r2.value) {
          n = JSON.parse(r2.value).filter(c => !c.isParent && c.scores).length;
          setKidCount(n);
          if (n > 0) setTested(true);
        }
      } catch (e) {}
      if (n <= 1) {
        try {
          const r = await store.get("maum_temper");
          if (r && r.value) {
            setHomeTemper(r.value);
            setTested(true);
          }
        } catch (e) {}
      }
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_world5");
        if (r && r.value) {
          const o = JSON.parse(r.value);
          setStock((o.lights || []).length + (o.gems || []).length);
        }
      } catch (e) {}
    })();
  }, []);
  const petals = useMemo(() => Array.from({
    length: 12
  }, (_, i) => ({
    x: Math.random() * 100,
    size: 5 + Math.random() * 5,
    rot: Math.random() * 360,
    dur: 7 + Math.random() * 6,
    delay: -Math.random() * 12,
    type: i % 3
  })), []);

  // 하늘 전환 — 분 단위 부드러운 보간 (밤 0~1, 노을·아침놀 0~1)
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const t = h + now.getMinutes() / 60;
  const nightAmt = clamp01(t >= 20 || t < 4.5 ? 1 : t >= 18.5 ? (t - 18.5) / 1.5 : t < 6 ? (6 - t) / 1.5 : 0);
  const warmAmt = clamp01(t >= 5 && t < 8 ? 1 - Math.abs(t - 6.5) / 1.5 : t >= 16 && t < 19 ? 1 - Math.abs(t - 17.5) / 1.5 : 0);

  // 밤하늘 색 — 세계지도(maum_world)와 맞추는 지점. v18 팔레트 확인되면 이 세 줄만 교체
  const NIGHT_TOP = "#0A1028",
    NIGHT_MID = "#0C1230",
    NIGHT_BOT = "#141C3C"; // 세계지도(v18) 팔레트와 일치: sea·night·night2

  // 삼청동 밤하늘 — 고정 시드라 별자리가 매번 같은 자리 (새로고침해도 안 흔들림)
  const sky = useMemo(() => {
    let s = 20260611;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const tint = () => {
      const v = rnd();
      return v < 0.62 ? "#FFFFFF" : v < 0.84 ? "#FFE9C4" : "#CFE4FF";
    };
    // 먼지별 — 아주 작고 희미한 별이 하늘 전체에 깔려 깊이를 만듦
    const dust = Array.from({
      length: 170
    }, () => ({
      x: rnd() * 400,
      y: rnd() * 455,
      r: 0.18 + rnd() * 0.3,
      c: tint(),
      g: Math.floor(rnd() * 3)
    }));
    // 잔별 들판 — 하늘 전체에 흩뿌림
    const field = Array.from({
      length: 250
    }, () => ({
      x: rnd() * 400,
      y: rnd() * 450,
      r: 0.32 + rnd() * 0.8,
      c: tint(),
      g: Math.floor(rnd() * 3)
    }));
    // 은하수 띠 — 빽빽한 심지 + 넓게 퍼진 가장자리, 왼쪽 아래에서 오른쪽 위로
    const bandCore = Array.from({
      length: 135
    }, () => {
      const u = rnd();
      const spread = (rnd() + rnd() - 1) * 30;
      return {
        x: -10 + u * 420,
        y: 330 - u * 265 + spread,
        r: 0.25 + rnd() * 0.6,
        c: tint(),
        g: Math.floor(rnd() * 3)
      };
    });
    const bandEdge = Array.from({
      length: 110
    }, () => {
      const u = rnd();
      const spread = (rnd() + rnd() - 1) * 75;
      return {
        x: -10 + u * 420,
        y: 330 - u * 265 + spread,
        r: 0.25 + rnd() * 0.65,
        c: tint(),
        g: Math.floor(rnd() * 3)
      };
    });
    const band = bandCore.concat(bandEdge);
    // 밝은 별 — 또렷하게 각자 깜빡임
    const bright = Array.from({
      length: 20
    }, () => ({
      x: rnd() * 400,
      y: rnd() * 430,
      r: 1.2 + rnd() * 0.9,
      c: tint(),
      dur: 2.2 + rnd() * 2.6,
      delay: rnd() * 4
    }));
    return {
      dust,
      field,
      band,
      bright
    };
  }, []);
  function go(where) {
    if (where === "coach") {
      onCoach();
      return;
    }
    if (where === "test") {
      onTest();
      return;
    }
    if (where === "world") {
      onWorld();
      return;
    }
    window.alert(where + " 화면으로 연결됩니다 (다음 단계에서 통합).");
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "homeRoot",
    style: {
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      backgroundColor: "#C9A8C0"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 400 720",
    preserveAspectRatio: "xMidYMid slice",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "blossom"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#FFE0EC"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#F5B8D0"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "bShadow"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#3A2A18",
    stopOpacity: "0.38"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "70%",
    stopColor: "#3A2A18",
    stopOpacity: "0.16"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#3A2A18",
    stopOpacity: "0"
  })), /*#__PURE__*/React.createElement("mask", {
    id: "moonM"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "338",
    cy: "76",
    r: "15.5",
    fill: "#fff"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "345",
    cy: "71",
    r: "13",
    fill: "#000"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "nightSky",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: NIGHT_TOP
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "55%",
    stopColor: NIGHT_MID
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: NIGHT_BOT
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "neb"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#E8E4FF",
    stopOpacity: "0.9"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#E8E4FF",
    stopOpacity: "0"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "nebW"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#FFF8E8",
    stopOpacity: "0.9"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#FFF8E8",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("image", {
    href: BG,
    x: "0",
    y: "0",
    width: "400",
    height: "720",
    preserveAspectRatio: "xMidYMid slice"
  }), warmAmt > 0 && /*#__PURE__*/React.createElement("rect", {
    width: "400",
    height: "720",
    fill: "#FF9A5A",
    opacity: 0.14 * warmAmt
  }), nightAmt > 0 && /*#__PURE__*/React.createElement("rect", {
    width: "400",
    height: "720",
    fill: "url(#nightSky)",
    opacity: 0.93 * nightAmt
  }), nightAmt > 0.05 && /*#__PURE__*/React.createElement("g", {
    opacity: nightAmt
  }, /*#__PURE__*/React.createElement("g", {
    opacity: "0.65"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "80",
    cy: "290",
    rx: "95",
    ry: "42",
    fill: "url(#nebW)",
    opacity: "0.11",
    transform: "rotate(-32 80 290)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "190",
    cy: "210",
    rx: "120",
    ry: "50",
    fill: "url(#neb)",
    opacity: "0.13",
    transform: "rotate(-32 190 210)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "300",
    cy: "130",
    rx: "100",
    ry: "40",
    fill: "url(#nebW)",
    opacity: "0.11",
    transform: "rotate(-32 300 130)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "245",
    cy: "170",
    rx: "60",
    ry: "26",
    fill: "url(#neb)",
    opacity: "0.15",
    transform: "rotate(-32 245 170)"
  })), [0, 1, 2].map(g => /*#__PURE__*/React.createElement("g", {
    key: g,
    style: {
      animation: `tw${g} ${3.4 + g * 1.2}s ease-in-out infinite`
    }
  }, sky.dust.filter(st => st.g === g).map((st, i) => /*#__PURE__*/React.createElement("circle", {
    key: `d${i}`,
    cx: st.x,
    cy: st.y,
    r: st.r,
    fill: st.c,
    opacity: "0.7"
  })), sky.field.filter(st => st.g === g).map((st, i) => /*#__PURE__*/React.createElement("circle", {
    key: `f${i}`,
    cx: st.x,
    cy: st.y,
    r: st.r,
    fill: st.c
  })), sky.band.filter(st => st.g === g).map((st, i) => /*#__PURE__*/React.createElement("circle", {
    key: `b${i}`,
    cx: st.x,
    cy: st.y,
    r: st.r,
    fill: st.c
  })))), sky.bright.map((st, i) => /*#__PURE__*/React.createElement("g", {
    key: `s${i}`
  }, /*#__PURE__*/React.createElement("circle", {
    cx: st.x,
    cy: st.y,
    r: st.r + 2.8,
    fill: st.c,
    opacity: "0.14"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: st.x,
    cy: st.y,
    r: st.r,
    fill: st.c,
    style: {
      animation: `twinkle ${st.dur}s ${st.delay}s ease-in-out infinite`
    }
  }))), /*#__PURE__*/React.createElement("g", {
    style: {
      animation: "shoot1 11s linear infinite"
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: "0",
    y1: "0",
    x2: "26",
    y2: "-13",
    stroke: "#FFF",
    strokeWidth: "1.2",
    strokeLinecap: "round",
    opacity: "0.9",
    transform: "translate(330 60)"
  })), /*#__PURE__*/React.createElement("g", {
    style: {
      animation: "shoot2 17s linear infinite"
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: "0",
    y1: "0",
    x2: "22",
    y2: "-9",
    stroke: "#FFE9C4",
    strokeWidth: "1",
    strokeLinecap: "round",
    opacity: "0.9",
    transform: "translate(150 110)"
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "338",
    cy: "76",
    r: "26",
    fill: "#FFF1C9",
    opacity: "0.16"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "338",
    cy: "76",
    r: "15.5",
    fill: "#FFF1C9",
    mask: "url(#moonM)"
  })), /*#__PURE__*/React.createElement("ellipse", {
    cx: "131",
    cy: "590",
    rx: 33 * bk,
    ry: 6 * bk,
    fill: "url(#bShadow)",
    style: {
      transformBox: "fill-box",
      transformOrigin: "center",
      animation: "shJjaek 3.5s ease-in-out infinite"
    }
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "268",
    cy: "592",
    rx: 31 * bk,
    ry: 5.5 * bk,
    fill: "url(#bShadow)",
    style: {
      transformBox: "fill-box",
      transformOrigin: "center",
      animation: "shJjuk 3.2s ease-in-out infinite"
    }
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "201",
    cy: "594",
    rx: 33 * bk,
    ry: 6 * bk,
    fill: "url(#bShadow)",
    style: {
      transformBox: "fill-box",
      transformOrigin: "center",
      animation: "shJjok 3.8s ease-in-out infinite"
    }
  }), /*#__PURE__*/React.createElement("g", {
    transform: `translate(131 589) scale(${bk}) translate(-131 -589)`
  }, /*#__PURE__*/React.createElement("g", {
    onClick: () => chirp("jjuk"),
    style: {
      transformBox: "fill-box",
      transformOrigin: "bottom center",
      animation: "mFront 3.5s ease-in-out infinite",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("image", {
    href: JJUK,
    x: "94",
    y: "474",
    width: "74",
    height: "115"
  }))), /*#__PURE__*/React.createElement("g", {
    transform: `translate(268 591) scale(${bk}) translate(-268 -591)`
  }, /*#__PURE__*/React.createElement("g", {
    onClick: () => chirp("jjaek"),
    style: {
      transformBox: "fill-box",
      transformOrigin: "50% 35%",
      animation: "mTilt 3.2s ease-in-out infinite",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("image", {
    href: JJAEK,
    x: "232",
    y: "483",
    width: "72",
    height: "108"
  }))), /*#__PURE__*/React.createElement("g", {
    transform: `translate(201 592) scale(${bk}) translate(-201 -592)`
  }, /*#__PURE__*/React.createElement("g", {
    onClick: () => chirp("jjok"),
    style: {
      transformBox: "fill-box",
      transformOrigin: "bottom center",
      animation: "mJjok 3.8s ease-in-out infinite",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("image", {
    href: JJOK,
    x: "165",
    y: "470",
    width: "72",
    height: "122"
  }))), petals.map((p, i) => /*#__PURE__*/React.createElement("g", {
    key: i,
    style: {
      animation: `pf${p.type} ${p.dur}s ${p.delay}s linear infinite`
    }
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: p.x * 4,
    cy: -20,
    rx: p.size,
    ry: p.size * 0.6,
    fill: "url(#blossom)",
    opacity: "0.85",
    transform: `rotate(${p.rot} ${p.x * 4} -20)`
  })))), /*#__PURE__*/React.createElement("div", {
    className: "homeCol",
    style: {
      position: "relative",
      maxWidth: 440,
      margin: "0 auto",
      padding: mobile ? "26px 20px 0" : "44px 24px 0",
      minHeight: "100vh",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      position: "relative",
      pointerEvents: "auto",
      padding: mobile ? "13px 14px 15px" : "20px 18px 22px",
      borderRadius: 24,
      background: "radial-gradient(120% 90% at 50% 38%, rgba(60,24,44,0.42) 0%, rgba(60,24,44,0.22) 55%, rgba(60,24,44,0) 100%)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#fff",
      fontSize: mobile ? 27 : 31,
      fontWeight: 800,
      letterSpacing: -0.5,
      lineHeight: 1.32,
      whiteSpace: "pre-line",
      textShadow: "0 2px 20px rgba(40,15,30,0.9), 0 1px 4px rgba(0,0,0,0.55)"
    }
  }, APP_TITLE), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 2,
      background: "rgba(255,255,255,0.55)",
      margin: mobile ? "10px auto 8px" : "14px auto 12px",
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#fff",
      fontSize: mobile ? 15 : 16,
      fontWeight: 500,
      lineHeight: 1.6,
      whiteSpace: "pre-line",
      textShadow: "0 1px 14px rgba(40,15,30,0.95), 0 1px 4px rgba(0,0,0,0.55)",
      maxWidth: 350,
      margin: "0 auto"
    }
  }, sub), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 12.5,
      marginTop: 8,
      textShadow: "0 1px 8px rgba(110,50,80,0.8)"
    }
  }, "\u2014 \uC774\uC7AC\uD6C8 \uACE0\uBB38\uB2D8"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowZero(true),
    style: {
      marginTop: 9,
      background: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.25)",
      color: "#fff",
      fontSize: 11,
      borderRadius: 14,
      padding: "5px 13px",
      cursor: "pointer",
      fontFamily: "inherit",
      backdropFilter: "blur(4px)"
    }
  }, "\uC81C\uB85C\uC12C\uC774 \uBB50\uC608\uC694? \u203A"), /*#__PURE__*/React.createElement("button", {
    onClick: toggleMusic,
    style: {
      marginTop: 9,
      marginLeft: 7,
      background: musicOn ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.25)",
      color: "#fff",
      fontSize: 11,
      borderRadius: 14,
      padding: "5px 13px",
      cursor: "pointer",
      fontFamily: "inherit",
      backdropFilter: "blur(4px)"
    }
  }, musicOn ? "\u266A \uC7AC\uC0DD \uC911" : "\u266A \uB9C8\uB354\uD074\uB7FD \uC8FC\uC81C\uACE1")), mobile ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      gap: 9,
      alignItems: "stretch",
      pointerEvents: "auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go("world"),
    style: {
      ...S.mainCard,
      flex: 1.12,
      display: "flex",
      flexDirection: "column",
      padding: "12px 13px",
      borderRadius: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement(GlobeIcon, {
    size: 30
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.stockBadge,
      fontSize: 10.5,
      padding: "2px 9px"
    }
  }, stock > 0 ? `${stock}개` : "시작하기")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#fff",
      fontSize: 15,
      fontWeight: 800,
      textAlign: "left",
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uC624\uB298\uC758 \uBC1C\uACAC"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.92)",
      fontSize: 10.5,
      lineHeight: 1.45,
      margin: "3px 0 9px",
      textAlign: "left",
      textShadow: "0 1px 3px rgba(110,50,80,0.5)"
    }
  }, "\uC88B\uC740 \uC810\uC744 \uBC1C\uACAC\uD574 \uC138\uACC4\uB97C \uBC1D\uD600\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.barTrack,
      height: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.barFill,
      width: `${Math.max(4, Math.min(100, stock / TOTAL * 100))}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 10,
      textShadow: "0 1px 3px rgba(110,50,80,0.5)"
    }
  }, stock > 0 ? `${stock}/${TOTAL}` : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 11.5,
      fontWeight: 800,
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uB2F4\uC73C\uB7EC \u2192")))), /*#__PURE__*/React.createElement("button", {
    onClick: () => go("coach"),
    style: {
      ...S.coachCard,
      flex: 1,
      marginTop: 0,
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 0,
      padding: "12px 13px",
      borderRadius: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: COACH_AV,
    alt: "\uCABD\uCABD\uC774",
    style: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      border: "1.5px solid rgba(255,255,255,0.6)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 13.5,
      fontWeight: 800,
      marginTop: 8,
      textAlign: "left",
      whiteSpace: "pre-line",
      lineHeight: 1.3,
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uCABD\uCABD\uC774", "\n", "\uB9C8\uC74C \uCF54\uCE58"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.92)",
      fontSize: 10.5,
      lineHeight: 1.45,
      marginTop: 3,
      textAlign: "left",
      textShadow: "0 1px 3px rgba(110,50,80,0.5)"
    }
  }, "\uB9C9\uB9C9\uD558\uACE0 \uD654\uB0A0 \uB54C \uB300\uD654\uD574\uC694"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 11.5,
      fontWeight: 800,
      marginTop: "auto",
      alignSelf: "flex-end",
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uB300\uD654\uD558\uB7EC \u2192"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 30,
      pointerEvents: "auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go("world"),
    style: S.mainCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(GlobeIcon, {
    size: 38
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "#fff",
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uC624\uB298\uC758 \uBC1C\uACAC")), /*#__PURE__*/React.createElement("span", {
    style: S.stockBadge
  }, stock > 0 ? `${stock}개 모음` : "시작하기")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.95)",
      fontSize: 13,
      lineHeight: 1.5,
      marginBottom: 12,
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 \uBC1C\uACAC\uD574 \uC138\uACC4\uB97C \uBC1D\uD600\uC694"), /*#__PURE__*/React.createElement("div", {
    style: S.barTrack
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.barFill,
      width: `${Math.max(4, Math.min(100, stock / TOTAL * 100))}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 11.5,
      textShadow: "0 1px 3px rgba(110,50,80,0.5)"
    }
  }, stock > 0 ? `${stock} / ${TOTAL} 나라` : "첫 번째 좋은 점을 담아 보세요"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 13.5,
      fontWeight: 800,
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uC88B\uC740 \uC810 \uB2F4\uC73C\uB7EC \u2192"))), /*#__PURE__*/React.createElement("button", {
    style: S.coachCard,
    onClick: () => go("coach")
  }, /*#__PURE__*/React.createElement("img", {
    src: COACH_AV,
    alt: "\uCABD\uCABD\uC774",
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      border: "1.5px solid rgba(255,255,255,0.6)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      color: "#fff",
      fontSize: 15.5,
      fontWeight: 800,
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\uCABD\uCABD\uC774 \uB9C8\uC74C \uCF54\uCE58"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      color: "rgba(255,255,255,0.92)",
      fontSize: 12,
      marginTop: 3,
      textShadow: "0 1px 3px rgba(110,50,80,0.5)"
    }
  }, "\uB9C9\uB9C9\uD558\uACE0 \uD654\uB0A0 \uB54C, \uCABD\uCABD\uC774\uC640 \uB300\uD654 \uB098\uB204\uAE30")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 20,
      fontWeight: 700,
      flexShrink: 0,
      textShadow: "0 1px 4px rgba(110,50,80,0.5)"
    }
  }, "\u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "center",
      marginBottom: 8,
      pointerEvents: "auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDrawerOpen(true),
    style: S.pill
  }, "\uD83D\uDC8C \uB9C8\uC74C \uC11C\uB78D"), /*#__PURE__*/React.createElement("button", {
    onClick: () => go("test"),
    style: S.pill
  }, tested ? kidCount > 1 ? "🧭 아이들 기질 보러가기" : homeTemper ? `${{
    새: "🐦",
    하늘: "☁️",
    땅: "🏔️",
    뿌리: "🌱"
  }[homeTemper] || "🧭"} ${homeTemper} 기질 보러가기` : "🧭 우리 아이 기질 보러가기" : "🧭 기질 테스트하기"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setBkMsg(null);
      setShowBackup(true);
    },
    style: S.pill
  }, "\u2699 \uC124\uC815")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      paddingTop: 10,
      paddingBottom: 14,
      pointerEvents: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.55)",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.3,
      textShadow: "0 1px 3px rgba(0,0,0,0.4)"
    }
  }, "\xA9 2026 ", /*#__PURE__*/React.createElement("a", {
    href: "https://youtube.com/@pagodream",
    target: "_blank",
    rel: "noopener",
    style: {
      color: "rgba(255,255,255,0.7)",
      textDecoration: "underline",
      textUnderlineOffset: 2
    }
  }, "\uD30C\uACE0\uB4DC\uB9BC")))), showBackup && /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowBackup(false),
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,10,30,0.62)",
      zIndex: 60,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 440,
      background: "#15183A",
      borderRadius: "22px 22px 0 0",
      padding: "20px 20px 30px",
      boxShadow: "0 -10px 40px rgba(0,0,0,0.4)",
      maxHeight: "85vh",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 16,
      fontWeight: 800
    }
  }, "\u2699 \uC124\uC815"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowBackup(false),
    style: {
      background: "none",
      border: "none",
      color: "#9AA3C7",
      fontSize: 18,
      cursor: "pointer"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "12px 14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowHelp(!showHelp),
    style: {
      width: "100%",
      background: "none",
      border: "none",
      color: "#9FE1CB",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCD6 \uB9C8\uC74C \uACF3\uAC04 \uC0AC\uC6A9\uBC95"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#9AA3C7",
      fontSize: 12
    }
  }, showHelp ? "접기 ▲" : "펼치기 ▼")), showHelp && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#E8E2D5",
      fontSize: 12.5,
      lineHeight: 1.85,
      marginTop: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#F2C16B"
    }
  }, "\uD83C\uDF0D \uC624\uB298\uC758 \uBC1C\uACAC"), /*#__PURE__*/React.createElement("br", null), "\uB9E4\uC77C \uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 \uD558\uB098\uC529 \uCC3E\uC544, \uC138\uACC4 \uC9C0\uB3C4\uC5D0 \uBD88\uC744 \uCF1C\uC694. \uB098\uB77C\uB97C \uACE0\uB974\uACE0 \uD55C \uC904\uC744 \uC801\uC73C\uBA74 \uADF8 \uB098\uB77C\uAC00 \uBC1D\uC544\uC9C0\uACE0, \uBCF4\uC11D\uC774 \uBAA8\uC5EC\uC694. \uD558\uB8E8\uC5D0 \uC0C8 \uB098\uB77C \uD558\uB098\uC529 \u2014 \uCC9C\uCC9C\uD788, \uB9E4\uC77C\uC774 \uC911\uC694\uD574\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#F2C16B"
    }
  }, "\uD83C\uDF3F \uCABD\uCABD\uC774 \uB9C8\uC74C \uCF54\uCE58"), /*#__PURE__*/React.createElement("br", null), "\uC544\uC774\uC5D0\uAC8C \uC6B1\uD558\uAC70\uB098 \uB9C9\uB9C9\uD560 \uB54C \uCABD\uCABD\uC774\uC640 \uC774\uC57C\uAE30\uD574\uC694. \uB2F5\uC744 \uC8FC\uB294 \uAC8C \uC544\uB2C8\uB77C, \uD55C \uAC78\uC74C\uC529 \uB418\uBB3C\uC73C\uBA70 \uC5C4\uB9C8\uAC00 \uC2A4\uC2A4\uB85C \uB2F5\uC5D0 \uB2FF\uAC8C \uB3C4\uC640\uC694. \uB450 \uAC00\uC9C0 \uAE38\uC774 \uC788\uC5B4\uC694 \u2014 \uBC14\uB85C \uC2DC\uC791\uB418\uB294 ", /*#__PURE__*/React.createElement("b", null, "\uCABD\uCABD\uC774 \uCF54\uCE6D"), ", \uADF8\uB9AC\uACE0 \uB354 \uAE4A\uC740 ", /*#__PURE__*/React.createElement("b", null, "AI \uCABD\uCABD\uC774"), "."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#F2C16B"
    }
  }, "\uD83E\uDDED \uAE30\uC9C8 \uC9C4\uB2E8"), /*#__PURE__*/React.createElement("br", null), "\uC544\uC774\uB9C8\uB2E4 \uD0C0\uACE0\uB09C \uACB0(\uAE30\uC9C8)\uC744 \uC54C\uC544\uBD10\uC694 \u2014 \uC0C8\xB7\uD558\uB298\xB7\uB545\xB7\uBFCC\uB9AC. \uADF8 \uC544\uC774\uC5D0\uAC8C \uB9DE\uB294 \uCE6D\uCC2C\uBC95\xB7\uACF5\uBD80\uBC95\uC758 \uC2E4\uB9C8\uB9AC\uB97C \uC5BB\uC5B4\uC694. \uC544\uC774\uB97C \uC5EC\uB7EC \uBA85 \uB4F1\uB85D\uD574 \uAC01\uC790 \uC9C4\uB2E8\uD560 \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#F2C16B"
    }
  }, "\uD83C\uDF38 \uD568\uAED8 \uAD11\uC7A5 \xB7 \uADF8\uB8F9"), /*#__PURE__*/React.createElement("br", null), "\uB2E4\uB978 \uC5C4\uB9C8\uB4E4\uACFC \uC88B\uC740 \uC810\uC744 \uB098\uB204\uACE0 \uC751\uC6D0\uD574\uC694. \uADF8\uB8F9\uC744 \uB9CC\uB4E4\uBA74(\uC6B4\uC601\uC790 \uC2B9\uC778) \uC6B0\uB9AC\uB07C\uB9AC \uB530\uB85C \uBAA8\uC5EC \uB2F5\uAE00\uB85C \uBA58\uD1A0\uB9C1\uB3C4 \uD560 \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#F2C16B"
    }
  }, "\uD83D\uDCBE \uAE30\uB85D \uBCF4\uAD00"), /*#__PURE__*/React.createElement("br", null), "\uAE30\uB85D\uC740 \uC774 \uAE30\uAE30\uC5D0 \uC800\uC7A5\uB3FC\uC694. \uAE30\uAE30\uB97C \uBC14\uAFD4\uB3C4 \uC783\uC9C0 \uC54A\uB3C4\uB85D, \uC124\uC815\uC5D0\uC11C ", /*#__PURE__*/React.createElement("b", null, "\uBC31\uC5C5 \uCF54\uB4DC"), "\uB97C \uBCF5\uC0AC\uD574 \uC548\uC804\uD55C \uACF3(\uCE74\uD1A1 \uB098\uC5D0\uAC8C \uBCF4\uB0B4\uAE30)\uC5D0 \uBCF4\uAD00\uD558\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11.5,
      lineHeight: 1.7,
      paddingTop: 8,
      borderTop: "1px solid rgba(255,255,255,0.08)"
    }
  }, "\uD83D\uDC9B \uD575\uC2EC\uC740 \uD558\uB098\uC608\uC694 \u2014 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#E8E2D5"
    }
  }, "\uC9C0\uC801\uC774 \uC544\uB2C8\uB77C \uC88B\uC740 \uC810\uC744 \uB298\uB824\uC8FC\uB294 \uAC83."), " \uB9E4\uC77C \uD55C \uAC00\uC9C0\uC529, \uC88B\uC740 \uC810\uC744 \uBC1C\uACAC\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9FE1CB",
      fontSize: 12.5,
      fontWeight: 800,
      margin: "14px 0 8px"
    }
  }, "\u2753 \uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38"), [{
    q: "기록이 사라질까 봐 걱정돼요.",
    a: "설정에서 백업 코드를 복사해 보관하면, 기기를 바꿔도 그 코드로 되살릴 수 있어요. 같은 기기에선 자동으로 이어져요. 가끔 '지금 저장'을 눌러 최신 상태를 보관해 주세요."
  }, {
    q: "휴대폰을 바꿨어요. 어떻게 가져오나요?",
    a: "새 기기 설정 → '다른 기기에서 가져오기' → 예전에 보관해둔 백업 코드를 입력하면 기록이 돌아와요."
  }, {
    q: "백업 코드를 잃어버렸어요.",
    a: "보관해둔 곳(카톡 등)을 먼저 찾아보세요. 정 못 찾으면, 백업할 때 적은 '찾기용 별명'으로 운영자에게 도움을 요청할 수 있어요."
  }, {
    q: "아이가 여러 명이에요.",
    a: "기질 진단에서 아이를 여러 명 등록할 수 있어요. 세계 지도도 처음에 '아이별로 각자 지도 / 다같이 한 지도'를 고를 수 있어요. (설정에서 바꿀 수 있어요)"
  }, {
    q: "AI 쪽쪽이가 안 열려요.",
    a: "AI 대화는 새 창에서 열리고, 무료 클로드 계정 로그인이 필요해요. 카카오톡 안에서 열면 안 되니, 크롬·사파리 같은 브라우저로 열어주세요."
  }, {
    q: "지적하지 말라는데, 정말 효과가 있나요?",
    a: "고문님의 '제로섬'이에요. 좋은 점 5·아쉬운 점 5인 아이에게 아쉬운 점을 지적하면, 자신감을 잃어 좋은 점까지 줄어들어요. 반대로 좋은 점을 칭찬하면 좋은 점이 늘어요. 관찰하다 보면 아이 스스로 변해요."
  }, {
    q: "그룹은 어떻게 만드나요?",
    a: "함께 광장 → '그룹 찾기·만들기'에서 그룹 이름·인원을 적어 요청하면, 운영자가 확인해 열어줘요. 그 뒤 팀원들이 이름으로 검색해 가입해요."
  }].map((f, i) => /*#__PURE__*/React.createElement("details", {
    key: i,
    style: {
      background: "rgba(0,0,0,0.18)",
      borderRadius: 10,
      padding: "9px 12px",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      color: "#E8E2D5",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, f.q), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11.5,
      lineHeight: 1.7,
      marginTop: 7
    }
  }, f.a))))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#C9A0E0",
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 8
    }
  }, "\uD83D\uDCF2 \uC571 \uC124\uCE58 \xB7 \uACF5\uC720"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: doInstall,
    style: {
      flex: 1,
      background: installed ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#9F7AEA,#7A5BC8)",
      color: installed ? "#9AA3C7" : "#fff",
      border: installed ? "1px solid rgba(255,255,255,0.14)" : "none",
      borderRadius: 10,
      padding: "11px 0",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, installed ? "✓ 설치됨" : "📲 앱 설치"), /*#__PURE__*/React.createElement("button", {
    onClick: doShare,
    style: {
      flex: 1,
      background: "rgba(255,255,255,0.07)",
      color: "#F3EEE3",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 10,
      padding: "11px 0",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDD17 \uACF5\uC720\uD558\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11,
      lineHeight: 1.6,
      marginTop: 8
    }
  }, "\uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00\uD558\uBA74 \uC571\uCC98\uB7FC \uC804\uCCB4\uD654\uBA74\uC73C\uB85C \uC5F4\uB824\uC694. \uCE5C\uAD6C\uC5D0\uAC8C \uB9C1\uD06C\uB97C \uACF5\uC720\uD574 \uBCF4\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9FE1CB",
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 8
    }
  }, "\uD83C\uDF3F \uB9C8\uB354\uD074\uB7FD \uAC00\uC871 \uB9C1\uD06C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, [{
    t: "📺 마더클럽 유튜브",
    u: "https://youtube.com/channel/UCCC3K-S3XU15AfrAgt8Qobw"
  }, {
    t: "☕ 마더클럽 카페",
    u: "https://naver.me/xWIVgVOx"
  }, {
    t: "🎵 마더클럽 밴드",
    u: "https://band.us/n/a1a5b8CeEbu00"
  }, {
    t: "🕊️ 이재훈 고문님 · W라운지",
    u: "https://kkoyomam-del.github.io/w-lounge/"
  }, {
    t: "🎼 고문님이 사랑한 음악 모음집",
    u: "https://pagodream.github.io/hismusic/"
  }].map(lk => /*#__PURE__*/React.createElement("a", {
    key: lk.u,
    href: lk.u,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 11,
      padding: "12px 14px",
      color: "#F3EEE3",
      fontSize: 13,
      fontWeight: 600,
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("span", null, lk.t), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#9AA3C7",
      fontSize: 12
    }
  }, "\u2197")))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F2C16B",
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 4
    }
  }, "\uD83D\uDCBE \uBC31\uC5C5 \xB7 \uBCF5\uC6D0"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 12.5,
      lineHeight: 1.6,
      marginBottom: 12
    }
  }, "\uC138\uACC4\uC9C0\uB3C4\xB7\uAE30\uC9C8 \uC9C4\uB2E8\xB7\uB9C8\uC74C \uC11C\uB78D\xB7\uC124\uC815\uAE4C\uC9C0 \u2014 \uC774 \uC571\uC758 \uBAA8\uB4E0 \uAE30\uB85D\uC744 \uD55C \uBC88\uC5D0 \uB2F4\uC544\uC694. \uAE30\uAE30\uB97C \uBC14\uAFD4\uB3C4 \uBCC4\uBA85\uC73C\uB85C \uB418\uC0B4\uB9B4 \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F2C16B",
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 6
    }
  }, "\u2601\uFE0F \uD074\uB77C\uC6B0\uB4DC\uC5D0 \uC800\uC7A5 (\uCD94\uCC9C)"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11.5,
      lineHeight: 1.6,
      marginBottom: 10
    }
  }, "\uC774 \uAE30\uAE30\uC5D0\uC120 \uC790\uB3D9\uC73C\uB85C \uC800\uC7A5\uB3FC\uC694. \uAE30\uAE30\uB97C \uBC14\uAFC0 \uB54C\uB97C \uC704\uD574, \uC544\uB798 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#F2C16B"
    }
  }, "\uB0B4 \uBC31\uC5C5 \uCF54\uB4DC"), "\uB97C \uBCF5\uC0AC\uD574 \uC548\uC804\uD55C \uACF3(\uCE74\uD1A1 \uB098\uC5D0\uAC8C \uBCF4\uB0B4\uAE30 \uB4F1)\uC5D0 \uBCF4\uAD00\uD558\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(242,193,107,0.3)",
      borderRadius: 10,
      padding: "10px 12px",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 10.5,
      marginBottom: 2
    }
  }, "\uB0B4 \uBC31\uC5C5 \uCF54\uB4DC"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 0.3
    }
  }, bkNick || "…")), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        await navigator.clipboard.writeText(bkNick);
        setBkMsg({
          ok: true,
          t: "백업 코드를 복사했어요. 안전한 곳에 보관하세요."
        });
      } catch (e) {
        setBkMsg({
          ok: true,
          t: bkNick
        });
      }
    },
    style: {
      background: "rgba(242,193,107,0.15)",
      border: "1px solid rgba(242,193,107,0.4)",
      color: "#F2C16B",
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 9,
      padding: "8px 12px",
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    }
  }, "\uBCF5\uC0AC")), /*#__PURE__*/React.createElement("input", {
    value: bkLabel,
    onChange: e => setBkLabel(e.target.value),
    placeholder: "\uCC3E\uAE30\uC6A9 \uBCC4\uBA85 (\uAD11\uC7A5 \uB2C9\uB124\uC784 \uB610\uB294 \uC774\uB984)",
    maxLength: 20,
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 10,
      padding: "10px 12px",
      color: "#F3EEE3",
      fontSize: 13,
      fontFamily: "inherit",
      marginBottom: 6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 10.5,
      lineHeight: 1.5,
      marginBottom: 10
    }
  }, "\uAD11\uC7A5 \uBCC4\uBA85\uC774 \uC788\uC73C\uBA74 \uC790\uB3D9\uC73C\uB85C \uCC44\uC6CC\uC838\uC694. \uCF54\uB4DC\uB97C \uC783\uC5B4\uBC84\uB824 \uC6B4\uC601\uC790\uC5D0\uAC8C \uB3C4\uC6C0\uC744 \uC694\uCCAD\uD560 \uB54C \uBCF8\uC778\uC744 \uCC3E\uB294 \uB2E8\uC11C\uAC00 \uB3FC\uC694."), /*#__PURE__*/React.createElement("button", {
    disabled: bkBusy || !bkNick,
    onClick: async () => {
      setBkBusy(true);
      setBkMsg(null);
      const nick = bkNick;
      const label = bkLabel.trim();
      // 겹침 확인: 이 아이디로 내가 저장한 적 없는데(=처음) 시트에 이미 있으면 → 다른 사람 것일 수 있음
      let mine = false;
      try {
        const s = await store.get("maum_backup_saved");
        if (s && s.value === nick) mine = true;
      } catch (e) {}
      if (!mine) {
        const existing = await cloudBackupCount(nick); // -1이면 없음, 0이상이면 이미 존재
        if (existing >= 0) {
          setBkBusy(false);
          setBkMsg({
            ok: false,
            t: `'${nick}' 아이디는 이미 쓰이고 있어요. 다른 아이거나 처음이라면, 아이 이름 뒤에 숫자를 붙여(예: ${nick}2) 새로 만들어 주세요. 같은 아이디면 기록이 섞일 수 있어요.`
          });
          return;
        }
      }
      try {
        await store.set("maum_backup_nick", nick);
        await store.set("maum_backup_label", label);
      } catch (e) {}
      const prevCount = await cloudBackupCount(nick);
      const nowSnap = await gatherBackup();
      const nowCount = countRecords(nowSnap);
      if (prevCount > nowCount) {
        const proceed = window.confirm(`이 코드에는 이미 기록 ${prevCount}개가 저장돼 있어요.\n지금 기기에는 ${nowCount}개뿐이에요.\n\n그대로 저장하면 ${prevCount}개가 ${nowCount}개로 줄어들어요.\n\n혹시 새 기기라면 먼저 아래 '다른 기기에서 가져오기'를 해주세요.\n\n정말 지금 상태로 저장할까요?`);
        if (!proceed) {
          setBkBusy(false);
          setBkMsg({
            ok: false,
            t: "저장을 멈췄어요. 새 기기라면 '가져오기'를 먼저 해보세요."
          });
          return;
        }
      }
      const r = await cloudBackup(nick, label);
      setBkBusy(false);
      if (r.ok) {
        try {
          await store.set("maum_backup_saved", nick);
        } catch (e) {}
      }
      setBkMsg(r.ok ? {
        ok: true,
        t: "☁️ 저장했어요. 이 기기에선 다음에도 자동으로 이어져요."
      } : {
        ok: false,
        t: "저장에 실패했어요. 잠시 후 다시 시도해 주세요."
      });
    },
    style: {
      width: "100%",
      background: bkNick ? "linear-gradient(135deg,#F2C16B,#FF9E6D)" : "rgba(255,255,255,0.1)",
      color: bkNick ? "#3A2410" : "#9AA3C7",
      border: "none",
      borderRadius: 10,
      padding: "12px 0",
      fontSize: 13.5,
      fontWeight: 800,
      cursor: bkNick ? "pointer" : "default",
      fontFamily: "inherit"
    }
  }, bkBusy ? "저장 중…" : "지금 저장")), /*#__PURE__*/React.createElement("details", {
    style: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "12px 14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      color: "#9FE1CB",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, "\uD83D\uDCE5 \uB2E4\uB978 \uAE30\uAE30\uC5D0\uC11C \uAC00\uC838\uC624\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11.5,
      lineHeight: 1.6,
      margin: "10px 0"
    }
  }, "\uC0C8 \uAE30\uAE30\uC778\uAC00\uC694? \uC608\uC804 \uAE30\uAE30\uC5D0\uC11C \uBCF4\uAD00\uD574\uB454 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#9FE1CB"
    }
  }, "\uBC31\uC5C5 \uCF54\uB4DC"), "\uB97C \uB123\uACE0 \uAC00\uC838\uC624\uC138\uC694."), /*#__PURE__*/React.createElement("input", {
    value: bkNewCode,
    onChange: e => setBkNewCode(e.target.value),
    placeholder: "\uBC31\uC5C5 \uCF54\uB4DC (\uC608: maum-\uD3EC\uADFC\uD55C\uCC38\uC0C8-482)",
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 10,
      padding: "10px 12px",
      color: "#F3EEE3",
      fontSize: 13,
      fontFamily: "inherit",
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("button", {
    disabled: bkBusy || !bkNewCode.trim(),
    onClick: async () => {
      if (!window.confirm("이 코드의 백업을 가져올까요?\n지금 기기의 기록은 백업 내용으로 덮어써져요.")) return;
      setBkBusy(true);
      setBkMsg(null);
      const code = bkNewCode.trim();
      const r = await cloudRestore(code);
      setBkBusy(false);
      if (r.ok) {
        try {
          await store.set("maum_backup_nick", code);
          await store.set("maum_backup_saved", code);
        } catch (e) {}
        setBkMsg({
          ok: true,
          t: "가져왔어요! 잠시 후 새로고침돼요."
        });
        setTimeout(() => window.location.reload(), 1400);
      } else setBkMsg({
        ok: false,
        t: r.reason === "not-found" ? "그 코드로 저장된 백업이 없어요. 코드를 다시 확인해 주세요." : "가져오기에 실패했어요. 다시 시도해 주세요."
      });
    },
    style: {
      width: "100%",
      background: "rgba(159,225,203,0.15)",
      color: "#9FE1CB",
      border: "1px solid rgba(159,225,203,0.4)",
      borderRadius: 10,
      padding: "11px 0",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, bkBusy ? "가져오는 중…" : "이 코드로 가져오기")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9FE1CB",
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 8
    }
  }, "\uD83D\uDCC1 \uD30C\uC77C\uB85C \uC800\uC7A5 \xB7 \uBD88\uB7EC\uC624\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      const snap = await gatherBackup();
      const blob = new Blob([JSON.stringify(snap, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      a.href = url;
      a.download = `마음곳간_백업_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBkMsg({
        ok: true,
        t: "파일을 내려받았어요. 안전한 곳에 보관하세요."
      });
    },
    style: {
      flex: 1,
      background: "rgba(255,255,255,0.07)",
      color: "#F3EEE3",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 10,
      padding: "11px 0",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD30C\uC77C \uC800\uC7A5"), /*#__PURE__*/React.createElement("label", {
    style: {
      flex: 1,
      background: "rgba(255,255,255,0.07)",
      color: "#F3EEE3",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 10,
      padding: "11px 0",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "center"
    }
  }, "\uD30C\uC77C \uBD88\uB7EC\uC624\uAE30", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "application/json,.json",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = async () => {
        try {
          await applyBackup(JSON.parse(rd.result));
          setBkMsg({
            ok: true,
            t: "불러왔어요! 잠시 후 새로고침돼요."
          });
          setTimeout(() => window.location.reload(), 1400);
        } catch (err) {
          setBkMsg({
            ok: false,
            t: "파일을 읽지 못했어요. 백업 파일이 맞는지 확인해 주세요."
          });
        }
      };
      rd.readAsText(f);
      e.target.value = "";
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 16,
      paddingTop: 14,
      borderTop: "1px solid rgba(255,255,255,0.08)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11,
      lineHeight: 1.7
    }
  }, "\uB9C8\uC74C \uACF3\uAC04 \xB7 v1.0"), /*#__PURE__*/React.createElement("a", {
    href: "https://youtube.com/@pagodream",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "rgba(255,255,255,0.5)",
      fontSize: 11,
      textDecoration: "none"
    }
  }, "made by \uD30C\uACE0\uB4DC\uB9BC \xB7 \uB9C8\uB354\uD074\uB7FD"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#6b74a0",
      fontSize: 10,
      lineHeight: 1.6,
      marginTop: 5
    }
  }, "\u6545 \uC774\uC7AC\uD6C8 \uACE0\uBB38\uB2D8\uC758 \uAC00\uB974\uCE68\uC744 \uAE30\uB9AC\uBA70")), bkMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 13,
      color: bkMsg.ok ? "#9FE1CB" : "#FF9E9E",
      fontSize: 12.5,
      lineHeight: 1.6,
      textAlign: "center"
    }
  }, bkMsg.t))), bubble && /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 400 720",
    preserveAspectRatio: "xMidYMid slice",
    onClick: () => {
      if (bubble && bubble.quote) {
        try {
          store.set("maum_quote_seen", String(Date.now()));
        } catch (e) {}
      }
      setBubble(null);
    },
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      zIndex: 50,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(SpeechBubble, {
    who: bubble.who,
    text: bubble.text,
    quote: bubble.quote,
    k: bk,
    key: bubble.t
  })), drawerOpen && /*#__PURE__*/React.createElement(MindDrawer, {
    onClose: () => setDrawerOpen(false),
    onCoach: () => {
      setDrawerOpen(false);
      onCoach();
    }
  }), showZero && /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowZero(false),
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 60,
      background: "rgba(40,18,30,0.55)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 360,
      maxHeight: "82%",
      overflowY: "auto",
      background: "linear-gradient(180deg,#FFF6EE,#FBEAE0)",
      borderRadius: 22,
      padding: "20px 18px",
      boxShadow: "0 16px 50px rgba(80,30,50,0.4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "#7A3B52"
    }
  }, "\uC81C\uB85C\uC12C \uC721\uC544\uB780?"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowZero(false),
    style: {
      background: "none",
      border: "none",
      fontSize: 18,
      cursor: "pointer",
      color: "#A87186"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#A87186",
      lineHeight: 1.6,
      marginBottom: 16
    }
  }, "\uB098\uC05C \uC810\uC744 \uACE0\uCE58\uB824 \uB4E4\uBA74 \uC88B\uC740 \uC810\uB9C8\uC800 \uC904\uC5B4\uC694. \uC88B\uC740 \uC810\uC744 \uCE6D\uCC2C\uD574 \uB298\uB9AC\uBA74, \uC544\uC26C\uC6B4 \uC810\uC740 \uC790\uC5F0\uD788 \uBC00\uB824\uB098\uC694. \u6545 \uC774\uC7AC\uD6C8 \uACE0\uBB38\uB2D8\uC758 \uAC00\uB974\uCE68\uC774\uC5D0\uC694."), ZEROSUM_TEACHINGS.map((z, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "rgba(255,255,255,0.7)",
      border: "1px solid rgba(122,59,82,0.12)",
      borderRadius: 14,
      padding: "13px 15px",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "#7A3B52"
    }
  }, z.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#BD8AA0"
    }
  }, z.d)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      lineHeight: 1.75,
      color: "#5A4048",
      whiteSpace: "pre-line"
    }
  }, z.body))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#BD8AA0",
      textAlign: "center",
      marginTop: 6,
      lineHeight: 1.6
    }
  }, "\uBAA8\uB450 \uACE0\uBB38\uB2D8\uAED8\uC11C \uB0A8\uAE30\uC2E0 \uB9D0\uC500 \uADF8\uB300\uB85C\uC608\uC694."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowZero(false);
      go("test");
    },
    style: {
      display: "block",
      width: "100%",
      marginTop: 10,
      background: "rgba(122,59,82,0.07)",
      border: "1px solid rgba(122,59,82,0.22)",
      borderRadius: 12,
      padding: "11px 12px",
      color: "#7A3B52",
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1.55,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, tested ? kidCount > 1 ? "우리 아이들의 기질 다시 보러가기 →" : homeTemper ? `${{
    새: "🐦",
    하늘: "☁️",
    땅: "🏔️",
    뿌리: "🌱"
  }[homeTemper] || "🧭"} 우리 아이의 '${homeTemper}' 기질 보러가기 →` : "우리 아이의 기질 보러가기 →" : "아이의 기질이 더 궁금하다면 — 고문님이 권하신 송재희 선생 『사상체질 학습법』 기반 기질 테스트 해보기 →"))), /*#__PURE__*/React.createElement("style", null, `
        .homeRoot{min-height:100dvh !important}
        .homeCol{min-height:100dvh !important}
        @media (min-width: 521px){
          html,body{background:#241826;}
          .homeRoot{max-width:min(92vw, 1200px) !important; margin:0 auto !important; box-shadow:0 0 70px rgba(0,0,0,0.45);}
          .homeCol{max-width:min(92vw, 1200px) !important;}
        }
        @media (min-width: 1024px){
          .homeRoot{max-width:1200px !important;}
          .homeCol{max-width:1200px !important;}
        }
        @keyframes mFront { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-4px) rotate(2deg)} }
        @keyframes mTilt { 0%,20%{transform:rotate(0deg)} 45%,65%{transform:rotate(-6deg)} 90%,100%{transform:rotate(0deg)} }
        @keyframes mJjok { 0%,100%{transform:translateY(0) scaleX(1)} 25%{transform:translateY(-5px) scaleX(1.05)} 50%{transform:translateY(-2px) scaleX(0.98)} 75%{transform:translateY(-4px) scaleX(1.04)} }
        @keyframes shJjaek { 0%,100%{opacity:0.9;transform:scale(1)} 50%{opacity:0.66;transform:scale(0.9)} }
        @keyframes shJjuk { 0%,100%{opacity:0.9;transform:scale(1)} 45%{opacity:0.72;transform:scale(0.93)} }
        @keyframes shJjok { 0%,100%{opacity:0.92;transform:scale(1)} 25%{opacity:0.58;transform:scale(0.85)} 75%{opacity:0.6;transform:scale(0.87)} }
        @keyframes pf0 { 0%{transform:translateY(-30px) translateX(0) rotate(0deg)} 100%{transform:translateY(770px) translateX(50px) rotate(180deg)} }
        @keyframes pf1 { 0%{transform:translateY(-30px) translateX(0) rotate(0deg)} 100%{transform:translateY(770px) translateX(-40px) rotate(-160deg)} }
        @keyframes pf2 { 0%{transform:translateY(-30px) translateX(0) rotate(0deg)} 100%{transform:translateY(770px) translateX(25px) rotate(120deg)} }
        @keyframes popIn { 0%{opacity:0;transform:scale(0.6) translateY(8px)} 60%{opacity:1;transform:scale(1.06) translateY(-2px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes drawerUp { 0%{transform:translateY(40px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes twinkle { 0%,100%{opacity:0.35} 50%{opacity:1} }
        @keyframes tw0 { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes tw1 { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes tw2 { 0%,100%{opacity:0.7} 35%{opacity:1} 70%{opacity:0.45} }
        @keyframes shoot1 { 0%,88%{opacity:0;transform:translate(0,0)} 89%{opacity:1;transform:translate(-12px,6px)} 96%{opacity:0;transform:translate(-150px,75px)} 100%{opacity:0;transform:translate(-150px,75px)} }
        @keyframes shoot2 { 0%,91%{opacity:0;transform:translate(0,0)} 92%{opacity:1;transform:translate(-10px,4px)} 98%{opacity:0;transform:translate(-120px,50px)} 100%{opacity:0;transform:translate(-120px,50px)} }
      `));
}

// ── 💌 마음 서랍 — 코칭 기록 저장·열람 ──
// 기록 저장 (정적 코칭·AI 대화 공용). store는 클로드/깃허브 양쪽에서 동작
async function saveDrawerItem(item) {
  try {
    const r = await store.get("maum_drawer");
    const list = r && r.value ? JSON.parse(r.value) : [];
    list.unshift(item);
    await store.set("maum_drawer", JSON.stringify(list.slice(0, 100)));
  } catch (e) {}
}
// 코칭을 마치면 세계지도 '마음 곳간'에 마음의 보석 하나를 놓는다 (sos 배열, 지도 저장과 공존)
async function addSosGem(child, good) {
  try {
    const r = await store.get("maum_world5");
    const o = r && r.value ? JSON.parse(r.value) : {};
    const list = o.sos || [];
    list.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      child: child || null,
      good: good || ""
    });
    await store.set("maum_world5", JSON.stringify({
      ...o,
      sos: list.slice(0, 200)
    }));
  } catch (e) {}
}
function fmtDrawerItem(it) {
  const d = new Date(it.id);
  const head = `[마음 서랍] ${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}` + (it.child ? ` · ${it.child}` : "") + (it.situLabel ? ` · ${it.situLabel}` : "") + (it.temper ? ` · ${it.temper} 기질` : "");
  if (it.kind === "ai") {
    return head + "\n\n" + (it.msgs || []).map(m => (m.role === "user" ? "나: " : "쪽쪽이: ") + m.content).join("\n");
  }
  let s = head;
  if (it.write) s += `\n\n그날의 일: ${it.write}`;
  if (it.emotion) s += `\n마음: ${it.emotion}`;
  const who = it.child ? withName(it.child) : "아이";
  if (it.signal) s += `\n${who}의 신호: ${it.signal}`;
  if (it.good) s += `\n${who}의 좋은 점: ${it.good}`;
  if (it.doors && it.doors.length) s += `\n\n열어둔 문:\n` + it.doors.map(x => `- ${x}`).join("\n");
  if (it.quote) s += `\n\n\u201c${it.quote.t}\u201d — ${it.quote.d}`;
  return s;
}
function MindDrawer({
  onClose,
  onCoach
}) {
  const [items, setItems] = useState(null);
  const [openId, setOpenId] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_drawer");
        setItems(r && r.value ? JSON.parse(r.value) : []);
      } catch (e) {
        setItems([]);
      }
    })();
  }, []);
  const persist = async list => {
    setItems(list);
    try {
      await store.set("maum_drawer", JSON.stringify(list));
    } catch (e) {}
  };
  const del = id => {
    if (window.confirm("이 기록을 지울까요?")) persist(items.filter(x => x.id !== id));
  };
  const copy = async it => {
    try {
      await navigator.clipboard.writeText(fmtDrawerItem(it));
      window.alert("복사됐어요! 메모장에 붙여넣어 간직하세요.");
    } catch (e) {
      window.alert("이 환경에선 자동 복사가 안 돼요. 화면을 캡처해 주세요.");
    }
  };
  const dateStr = id => {
    const d = new Date(id);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 80,
      background: "rgba(20,10,18,0.55)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 480,
      margin: "0 auto",
      maxHeight: "86%",
      overflowY: "auto",
      background: "linear-gradient(180deg,#FFF6EE,#FBEAE0)",
      borderRadius: "22px 22px 0 0",
      padding: "16px 18px 26px",
      boxShadow: "0 -10px 40px rgba(80,30,50,0.35)",
      animation: "drawerUp 0.3s ease-out"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 4,
      background: "rgba(122,59,82,0.25)",
      borderRadius: 4,
      margin: "0 auto 12px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "#7A3B52"
    }
  }, "\uD83D\uDC8C \uB9C8\uC74C \uC11C\uB78D"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      fontSize: 18,
      cursor: "pointer",
      color: "#A87186"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#A87186",
      lineHeight: 1.6,
      marginBottom: 14
    }
  }, "\uCF54\uCE6D\uC744 \uB9C8\uCE60 \uB54C\uB9C8\uB2E4 \uC5EC\uAE30 \uCC28\uACE1\uCC28\uACE1 \uC313\uC5EC\uC694. \uD754\uB4E4\uB9AC\uB294 \uB0A0, \uC5B8\uC81C\uB4E0 \uAEBC\uB0B4 \uBCF4\uC138\uC694."), items === null && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#BD8AA0",
      fontSize: 13,
      textAlign: "center",
      padding: 20
    }
  }, "\uC5EC\uB294 \uC911\u2026"), items && items.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#A87186",
      fontSize: 13,
      textAlign: "center",
      padding: "26px 10px",
      lineHeight: 1.7
    }
  }, "\uC544\uC9C1 \uBE44\uC5B4 \uC788\uC5B4\uC694.", /*#__PURE__*/React.createElement("br", null), "\uCABD\uCABD\uC774\uC640 \uCF54\uCE6D\uC744 \uB9C8\uCE58\uBA74 \uCCAB \uAE30\uB85D\uC774 \uB2F4\uACA8\uC694. \uD83C\uDF31"), items !== null && /*#__PURE__*/React.createElement("button", {
    onClick: onCoach,
    style: {
      display: "block",
      width: "100%",
      background: "rgba(122,59,82,0.06)",
      border: "1px dashed rgba(122,59,82,0.3)",
      borderRadius: 12,
      padding: "11px 0",
      color: "#7A3B52",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 12
    }
  }, "\uC9C0\uAE08 \uB9C8\uC74C\uC774 \uBB34\uAC81\uB2E4\uBA74 \u2014 \uCABD\uCABD\uC774 \uCF54\uCE58 \u2192"), items && items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    style: {
      background: "rgba(255,255,255,0.75)",
      border: "1px solid rgba(122,59,82,0.12)",
      borderRadius: 14,
      padding: "12px 14px",
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenId(openId === it.id ? null : it.id),
    style: {
      width: "100%",
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "#7A3B52"
    }
  }, it.kind === "ai" ? "✨ AI 쪽쪽이와 대화" : it.situLabel || "코칭"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#BD8AA0"
    }
  }, dateStr(it.id), it.child ? ` · ${it.child}` : "", it.temper ? ` · ${it.temper}` : "")), it.good && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A4048",
      marginTop: 5,
      lineHeight: 1.5
    }
  }, "\uD83C\uDF31 ", it.good)), openId === it.id && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      borderTop: "1px dashed rgba(122,59,82,0.18)",
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      lineHeight: 1.75,
      color: "#5A4048",
      whiteSpace: "pre-line"
    }
  }, fmtDrawerItem(it).split("\n").slice(1).join("\n").trim()), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 11
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => copy(it),
    style: {
      flex: 1,
      background: "rgba(122,59,82,0.08)",
      border: "1px solid rgba(122,59,82,0.25)",
      borderRadius: 10,
      padding: "8px 0",
      color: "#7A3B52",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDCCB \uBCF5\uC0AC\uD558\uAE30"), /*#__PURE__*/React.createElement("button", {
    onClick: () => del(it.id),
    style: {
      background: "none",
      border: "1px solid rgba(122,59,82,0.15)",
      borderRadius: 10,
      padding: "8px 13px",
      color: "#BD8AA0",
      fontSize: 12.5,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uC9C0\uC6B0\uAE30")))))));
}
function GlobeIcon({
  size = 38
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    width: size,
    height: size,
    style: {
      flexShrink: 0,
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "oc",
    cx: "38%",
    cy: "34%",
    r: "70%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#3A7BC8"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: "#1E5CA8"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#0E3A78"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "hl",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: "#9ED8F5",
    stopOpacity: "0"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#9ED8F5",
    stopOpacity: "0.6"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "lg"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#FFE9A8",
    stopOpacity: "0.9"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#FFE9A8",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "48",
    fill: "url(#hl)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "40",
    fill: "url(#oc)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "#5BA85C",
    opacity: "0.92"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 30 28 Q 40 24 46 30 Q 50 36 44 42 Q 36 46 30 40 Q 26 34 30 28 Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 52 22 Q 62 24 64 32 Q 62 38 56 36 Q 50 30 52 22 Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 34 50 Q 44 48 48 56 Q 50 66 42 70 Q 34 68 32 60 Q 30 54 34 50 Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 58 48 Q 68 46 70 54 Q 70 62 62 62 Q 56 56 58 48 Z"
  })), /*#__PURE__*/React.createElement("g", {
    fill: "#FFE9A8"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "38",
    cy: "34",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "58",
    cy: "30",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "40",
    cy: "58",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "63",
    cy: "54",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "48",
    r: "1.2"
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "38",
    cy: "34",
    r: "4",
    fill: "url(#lg)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "63",
    cy: "54",
    r: "4",
    fill: "url(#lg)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "38",
    cy: "36",
    rx: "12",
    ry: "9",
    fill: "#fff",
    opacity: "0.12"
  }));
}
function SpeechBubble({
  who,
  text,
  quote,
  k = 1
}) {
  // 새 머리 꼭대기 좌표 (SVG 400x720 기준 — 배경·새와 동일 좌표계라 정확)
  // foot = 발끝 y. 폰에서 새가 발 고정으로 k배 커지면 머리는 foot - (foot-head)*k 로 올라감
  const base = {
    jjuk: {
      cx: 131,
      headY: 476,
      foot: 589
    },
    // 왼쪽
    jjok: {
      cx: 201,
      headY: 470,
      foot: 592
    },
    // 가운데
    jjaek: {
      cx: 268,
      headY: 484,
      foot: 591
    } // 오른쪽
  }[who];
  const pos = {
    cx: base.cx,
    headY: base.foot - (base.foot - base.headY) * k
  };
  const W = quote ? 196 : 140;
  const H = quote ? 76 : 42;
  let bx = pos.cx - W / 2;
  bx = Math.max(6, Math.min(400 - W - 6, bx)); // 화면 밖 방지
  const tailTip = pos.headY - 4; // 꼬리 끝 = 머리 바로 위
  const by = tailTip - 10 - H; // 풍선 본체
  return /*#__PURE__*/React.createElement("g", {
    style: {
      animation: "popIn 0.3s ease-out",
      transformBox: "fill-box",
      transformOrigin: `${pos.cx}px ${tailTip}px`
    }
  }, /*#__PURE__*/React.createElement("rect", {
    x: bx,
    y: by,
    width: W,
    height: H,
    rx: "15",
    fill: "#fff",
    style: {
      filter: "drop-shadow(0 4px 10px rgba(110,50,80,0.3))"
    }
  }), quote && /*#__PURE__*/React.createElement("rect", {
    x: bx + 1,
    y: by + 1,
    width: W - 2,
    height: H - 2,
    rx: "14",
    fill: "none",
    stroke: "#F2C16B",
    strokeWidth: "1.5",
    opacity: "0.85"
  }), /*#__PURE__*/React.createElement("path", {
    d: `M ${pos.cx - 9} ${by + H - 1} L ${pos.cx} ${tailTip} L ${pos.cx + 9} ${by + H - 1} Z`,
    fill: "#fff"
  }), /*#__PURE__*/React.createElement("foreignObject", {
    x: bx + 8,
    y: by + 4,
    width: W - 16,
    height: H - 8
  }, /*#__PURE__*/React.createElement("div", {
    xmlns: "http://www.w3.org/1999/xhtml",
    style: {
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: 2
    }
  }, quote && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontWeight: 800,
      color: "#C89A4A",
      letterSpacing: 0.4
    }
  }, "\uD83C\uDF3F \uC624\uB298\uC758 \uACE0\uBB38\uB2D8 \uB9D0\uC500"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: quote ? 10 : 10.5,
      fontWeight: 600,
      color: "#5A3A48",
      lineHeight: 1.38,
      textAlign: "center"
    }
  }, quote ? `\u201c${text}\u201d` : text), quote && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#A88598"
    }
  }, "\u2014 \uC774\uC7AC\uD6C8 \uACE0\uBB38\uB2D8"))));
}
const S = {
  mainCard: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "linear-gradient(150deg, rgba(225,120,155,0.6), rgba(200,100,150,0.5))",
    backdropFilter: "blur(10px)",
    border: "1.5px solid rgba(255,255,255,0.6)",
    borderRadius: 22,
    padding: "18px 19px",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 8px 26px rgba(140,60,95,0.4)"
  },
  pill: {
    background: "rgba(40,18,30,0.4)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 99,
    padding: "8px 15px",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
    fontFamily: "inherit"
  },
  stockBadge: {
    color: "#fff",
    fontSize: 11.5,
    fontWeight: 700,
    background: "rgba(255,255,255,0.28)",
    borderRadius: 20,
    padding: "3px 11px",
    whiteSpace: "nowrap"
  },
  barTrack: {
    width: "100%",
    height: 7,
    background: "rgba(255,255,255,0.28)",
    borderRadius: 10,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #FFE9A8, #FFC368)",
    borderRadius: 10,
    transition: "width 0.6s ease"
  },
  coachCard: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    width: "100%",
    marginTop: 11,
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: 18,
    padding: "14px 16px",
    background: "rgba(255,255,255,0.24)",
    backdropFilter: "blur(10px)",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 5px 16px rgba(140,60,95,0.22)"
  }
};

// ════════════════ 쪽쪽이 마음 코치 ════════════════


const C = {
  night: "#0B1026",
  night2: "#16203F",
  deep: "#070A1C",
  gold: "#F2C16B",
  peach: "#FF9E6D",
  cream: "#F4EFE6",
  mute: "#98A2C8",
  calm: "#8FD0BC",
  sci: "#86B6E8",
  coachB: "#19233F",
  momB: "#2C3D6B"
};

// 기질 칩 — 기질 진단(새·하늘·땅·뿌리)과 같은 체계. t는 진단 TYPES의 키
const TEMPERS = [{
  k: "새",
  t: "bird"
}, {
  k: "하늘",
  t: "sky"
}, {
  k: "땅",
  t: "earth"
}, {
  k: "뿌리",
  t: "seed"
}];
const EMOJI_T = {
  새: "🐦",
  하늘: "☁️",
  땅: "🏔️",
  뿌리: "🌱"
};

// ★ 게시된 클로드 아티팩트 링크 — 앱을 게시한 뒤 그 주소를 여기 붙여넣으면, 깃허브에서 'AI 대화'가 이 링크로 열려요
const COACH_CHAT_URL = "https://claude.ai/public/artifacts/9ff84209-e3a2-44f0-98fe-ecc5fc754eb9";
// 클로드 아티팩트 환경 감지 (클로드 안: AI 즉시 / 밖: 링크 연결 또는 정적 코칭)
const IN_CLAUDE = typeof window !== "undefined" && !!(window.claude || window.storage);

// ── 정적 코칭 — 감정 이름 붙이기 ──
const EMOTIONS = [{
  k: "화남",
  ack: "화는 엄마가 그만큼 애쓰고 있다는 증거예요. 그 마음, 잘못이 아니에요.",
  lens: "그 화 밑엔 보통 '잘 됐으면' 하는 바람이 깔려 있어요. 미워서가 아니라요."
}, {
  k: "서운함",
  ack: "마음을 쏟은 만큼 서운한 거예요. 그만큼 사랑이 컸다는 뜻이고요.",
  lens: "서운함은 기대가 컸던 자리예요 — 그 기대도 결국 아이를 향한 마음이고요."
}, {
  k: "불안",
  ack: "불안은 멀리 보는 엄마들이 치르는 값이에요. 혼자 끌어안고 계셨네요.",
  lens: "불안은 대개 '아직 오지 않은 일'을 향해요. 지금 이 순간으로 잠깐만 돌아와 볼까요."
}, {
  k: "막막함",
  ack: "어디서부터 손대야 할지 모를 때가 제일 힘들죠. 같이 한 걸음만 떼 봐요.",
  lens: "막막할 땐 전부 풀려고 하지 않아도 돼요. 가장 작은 한 조각만 봐도 충분해요."
}, {
  k: "지침",
  ack: "오래 버티셨어요. 지친 건 약해서가 아니라, 멈추지 않아서예요.",
  lens: "지칠 땐 더 잘하기보다 덜 혼내는 쪽이 아이에겐 더 커요. 오늘은 그거면 돼요."
}];

// 코칭 연결 문구 — 매번 다르게 골라 식상함을 줄인다 (어록·핵심 메시지는 그대로 유지)
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const COACHLINES = {
  intro: ["안녕하세요, 쪽쪽이예요. 무슨 이야기든 좋아요.\n방금 어떤 일이 있었나요?", "잠깐 앉았다 가세요. 같이 천천히 들여다봐요.\n어떤 일이었어요?", "어서 오세요. 마음에 떠오르는 대로 편하게 적어 주세요.\n어떤 일이 있었나요?", "오늘 하루는 어떠셨어요? 무슨 일이든 같이 봐요.\n어떤 일이었나요?"],
  write: ["무슨 일이 있었는지 한 줄이면 돼요. 쓰다 보면 화가 한 김 식어요.", "있었던 일을 한 줄만 적어볼까요. 글로 옮기는 사이 마음이 조금 가라앉아요.", "길게 안 쓰셔도 돼요. 한 줄이면 충분해요 — 적는 동안 마음이 정리돼요."],
  emoLead: ["그 마음, 그럴 만해요.\n지금 어느 쪽에 가장 가까우세요?", "충분히 그럴 수 있어요.\n지금 엄마 마음은 어느 쪽에 가까워요?", "그랬군요. 마음이 많이 일렁였겠어요.\n지금은 어느 쪽에 가장 가까우세요?"],
  goodLead: ["그 좋은 점을 넓혀 주세요. 좋은 점이 자라면, 아쉬운 점은 자리를 잃어요.", "그거예요. 그 좋은 점에 햇볕을 쬐어 주세요 — 자라는 쪽이 이겨요.", "바로 그 한 조각을 키워 주세요. 좋은 점이 넓어지면 아쉬운 점은 설 자리가 줄어요."],
  doorLead: ["혼내는 대신 열어줄 만한 '다른 문'을 몇 개 놓아둘게요. 끌리는 게 있는지 천천히 보세요.", "다그치는 문 말고, 열어줄 만한 '다른 문' 몇 개를 둘게요. 마음 가는 걸로 골라보세요.", "닫힌 문 앞에서 실랑이하는 대신 — 열어줄 만한 '다른 문'을 놓아둘게요. 천천히 보세요."],
  closing: ["오늘은 여기까지로 충분해요. 혼내는 대신, 멈췄으니까요.", "여기까지 온 것만으로 충분해요. 다그치기 전에 멈춰 주셨잖아요.", "오늘 이 멈춤이, 아이에겐 큰 거예요. 충분히 잘하고 계세요."]
};

// 기질별 '행동 재해석' 통찰 — 되묻기 자리에서 그 아이의 결로 행동을 다시 읽어준다 (TYPES 심리 기반)
const TINSIGHT = {
  bird: "새 기질 아이라, 오래 붙잡으면 금세 싫증을 내요 — 게으른 게 아니라 짧고 굵게 타는 결이에요. 감정이 솔직해서 마음이 그대로 드러나는 만큼, 잘했을 때 그 자리에서 바로 알아주면 확 살아나요.",
  sky: "하늘 기질 아이는 '왜 이걸 해야 하는지'가 안 풀리면 거기서 멈춰 서요 — 반항이 아니라, 의미가 있어야 움직이는 결이에요. 그 '왜?'를 막지 말고 같이 궁금해해 주면, 누가 시키지 않아도 스스로 달려가요.",
  earth: "땅 기질 아이는 겉은 무던해도 속엔 생각과 걱정이 많고, 분위기를 많이 타요 — 닦달하면 오히려 더 미뤄요. 몰아붙이기보다 곁에서 분위기를 만들어 주면, 끈기 있게 끝까지 가는 아이예요.",
  seed: "뿌리 기질 아이는 하나를 완전히 이해해야 다음으로 가요 — 느린 게 아니라 신중한 결이에요. 자존심이 강해서 서두르게 하거나 남과 비교하면 그 자리에서 위축돼요. 작은 걸 정확히 알아주는 게 가장 큰 힘이에요."
};
const SITUATIONS = [{
  k: "study",
  label: "📚 공부·숙제",
  empathy: "공부 때문에 속 끓는 날이 제일 많죠. 다그치고 나면 엄마 마음이 더 무겁고요.",
  ask1: "아이가 못 하는 게 아니라, 아직 길이 안 열린 것일 수 있어요. 오늘 아이가 막힌 건 — 하기 싫어서였을까요, 몰라서 막막해서였을까요?",
  bridge: "그렇게 보면 아이의 행동이 '신호'로 읽히기 시작해요.",
  doors: ["다그치는 대신 멍석을 — \u201c엄마한테 설명해 줘봐, 네가 선생님이야.\u201d 가르치는 자리에 서면 아이가 달라져요.", "오늘 양을 확 줄여 \u201c이것만 끝내고 놀자\u201d — 끝나면 그 약속은 무슨 일이 있어도 지켜주세요.", "\u201c일단 한 문제만, 안 되면 말고\u201d — 부담을 완전히 내려놓으면 아이는 오히려 더 가요."],
  tDoors: {
    bird: "짧게 끊어 \u201c이것만 하고 놀자\u201d — 끝나면 약속을 칼같이 지켜주세요. 새의 세계는 명분으로 돌아가요. 그리고 \u201c엄마한테 설명해 줘봐, 네가 선생님이야\u201d 무대를 깔아주면 신이 나서 해요.",
    sky: "문제풀이 전에 '왜 이걸 배우는지' 큰 그림과 의미부터 — 의미가 붙는 순간 스스로 달려가는 아이예요. 아이의 '왜?'엔 답 대신 \u201c넌 어떻게 생각해?\u201d로 받아주세요.",
    earth: "\u201c공부 안 하니?\u201d 한마디를 오늘은 참아주세요 — 막 하려던 참의 자연스러움이 그 말에 깨져요. 대신 엄마가 먼저 책을 펴서 분위기를 만들고, 끝난 뒤 가볍게 물어봐 주는 '테스트'로만 확인해 주세요.",
    seed: "양을 늘리지 말고 단계를 — 하나를 완전히 이해해야 다음으로 가는 아이예요. 계획은 아이가 세우게 두고, \u201c3단원까지 끝낸 거 엄마가 알아\u201d처럼 정확하게 알아주세요."
  },
  quote: {
    t: "매일 좋은 점 칭찬해서 늘려주기입니다. 관찰하시다 보면 아이들 스스로 변합니다.",
    d: "이재훈 고문님"
  }
}, {
  k: "lie",
  label: "🤫 거짓말",
  empathy: "거짓말은 엄마 가슴이 철렁하는 일이죠. 그런데 그 행동도 하나의 '신호'일 수 있어요.",
  ask1: "아이가 사실대로 말했다면 무슨 일이 생길 거라 생각했을까요 — 혼날까 봐였을까요, 엄마를 실망시키기 싫어서였을까요?",
  bridge: "거짓말 자체보다, '사실을 말해도 안전하다'는 믿음이 먼저예요.",
  doors: ["혼내는 문 대신 — 사실을 털어놓는 순간엔 \u201c말해줘서 고마워\u201d가 먼저 나가게 해보세요. 그 문이 열려 있어야 다음에도 와요.", "\u201c다음엔 어떻게 하면 좋을까?\u201d — 답은 아이가 내게 두세요. 스스로 낸 답은 지켜져요.", "잘못보다 솔직함을 칭찬하기 — 좋은 점이 자라면 숨을 일이 줄어요."],
  tDoors: {
    bird: "솔직함이 본성인 아이라 거짓말은 보통 '혼남 회피'예요. 톡 까놓고 — \u201c혼 안 낼게, 진짜 얘기해 줘\u201d 약속하면 의외로 술술 나와요. 그 약속은 꼭 지키시고요.",
    sky: "이 아이의 거짓말엔 자기만의 이유와 논리가 있을 때가 많아요. 다그치기 전에 \u201c네 생각엔 그게 왜 괜찮았어?\u201d를 물어보세요 — 본질을 이야기할 자리가 열리면 대화가 풀려요.",
    earth: "속을 잘 안 드러내는 결이라, 추궁할수록 더 깊이 숨어요. 잠자리에서 손잡고 조용히 — 분위기가 풀려야 말이 나오는 아이예요.",
    seed: "자존심 때문에 잘못 인정이 가장 어려운 아이예요. 여럿 앞에선 절대 묻지 마시고 단둘이 — \u201c네가 일부러 그럴 애가 아닌 거 알아\u201d로 시작해 주세요."
  },
  quote: {
    t: "칭찬하세요, 꾸짖지 마시고ᆢ 마음에 안 드는 점 고치는 방법입니다.",
    d: "이재훈 고문님 · 2026.05.24"
  }
}, {
  k: "tantrum",
  label: "😤 떼·고집",
  empathy: "떼가 길어지면 엄마 진이 다 빠지죠. 그런데 고집은 '자기 뜻'이 생겼다는 신호이기도 해요.",
  ask1: "아이가 그렇게까지 지키고 싶었던 건 뭐였을까요 — 그 물건·그 일 자체였을까요, 아니면 '내 마음대로 해보고 싶다'는 마음이었을까요?",
  bridge: "원인이 보이면, 그 행동을 하지 않아도 되는 '다른 문'이 보여요.",
  doors: ["그 행동의 원인을 찾아, 그 행동을 하지 않아도 되는 다른 문을 열어주기. 떼 대신 선택지를 두 개 주고 아이가 고르게 해보세요.", "맞서 누르기보다 김 빼기 — \u201c그래, 그게 그렇게 하고 싶었구나\u201d 한 번 받아주고 나서 이야기하면 절반은 풀려요.", "고집이 꺾인 순간이 아니라, 스스로 마음을 바꾼 순간을 크게 칭찬해 주세요."],
  tDoors: {
    bird: "정면으로 누르면 더 타올라요. 기분을 먼저 띄우고(\u201c그래, 얼마나 하고 싶었으면\u201d) 다른 재밌는 것으로 시선을 옮겨주세요 — 회복이 가장 빠른 결이에요.",
    sky: "겉보기엔 떼 같아도 자기 '이유'가 있는 아이예요. \u201c왜 그렇게까지 하고 싶어?\u201d를 진심으로 물어보세요. 이유를 말로 풀어내면 고집이 녹아요.",
    earth: "억지로는 죽어도 안 하는 결이에요. 맞서지 말고 시간을 주세요 — 푹 가라앉았다가 자연스럽게 풀려요. 풀린 다음에 이야기해도 늦지 않아요.",
    seed: "고집의 뿌리는 '내 기준'이에요. 꺾으려 들면 깊게 다쳐요. \u201c네 기준이 뭔지 말해줄래?\u201d — 기준을 존중받으면 스스로 조정하는 아이예요."
  },
  quote: {
    t: "주의하세요. 말로 버릇이 고쳐지지 않습니다. 중요한 건ᆢ 돌파구를 열어주는 일이죠.",
    d: "이재훈 고문님 · 2026.03.08"
  }
}, {
  k: "sibling",
  label: "👧👦 형제·자매 다툼",
  empathy: "둘 다 내 새끼라 더 힘든 게 형제 싸움이죠. 누가 먼저였는지는 늘 미궁이고요.",
  ask1: "혹시 둘 중 하나가, 싸움보다 엄마의 눈길을 더 원하고 있던 건 아닐까요? 요즘 누가 더 허전해 보였어요?",
  bridge: "싸움의 모양보다, 그 밑의 허기를 보면 풀 곳이 보여요.",
  doors: ["재판관을 내려놓기 — 잘잘못 대신 \u201c둘 다 많이 속상했구나\u201d로 닫고, 각자 따로 1:1로 10분씩만 온전히 함께해 보세요.", "둘이 '함께' 잘한 순간을 찾아 둘 다에게 칭찬하기 — 편이 갈리지 않는 칭찬이 싸움의 김을 빼요.", "비교는 어떤 모양이라도 멀리 — 각자의 좋은 점을 따로따로 넓혀주세요."],
  tDoors: {
    bird: "주목받고 싶은 마음이 싸움이 됐을 수 있어요. 형제 말고 이 아이만의 '무대'(발표 놀이, 역할 하나)를 따로 만들어 주세요.",
    sky: "공정함에 가장 예민한 결이에요. \u201c뭐가 불공평했어?\u201d를 먼저 물어보세요 — 시시비비 판정보다 그 마음을 알아주는 게 먼저예요.",
    earth: "겉은 무던해도 속으로 오래 담아두는 아이예요. 싸움 뒤 따로 불러 손잡고 — \u201c네가 양보한 거 엄마가 봤어\u201d 한마디면 풀려요.",
    seed: "'누가 맞는지'가 이 아이에겐 전부예요. 두루뭉술 덮으면 더 다쳐요. \u201c네 말이 맞는 부분이 있어\u201d를 정확히 짚어준 다음에 화해로 가세요."
  },
  quote: {
    t: "부족한 점 절대 지적하지 마시고 조금이라도 좋아진 점 열심히 찾아서 과장되게 칭찬해 주세요ᆢ",
    d: "이재훈 고문님"
  }
}, {
  k: "media",
  label: "📱 게임·영상",
  empathy: "화면 앞에서 멈춘 아이를 보면 속이 타죠. 뺏자니 전쟁이고, 두자니 불안하고요.",
  ask1: "게임이 아이에게 채워주는 게 뭘까요 — 순수한 재미일까요, 아니면 뭔가로부터 도망갈 곳일까요?",
  bridge: "채워주는 게 보이면, 같은 걸 채워줄 더 좋은 문이 보여요.",
  doors: ["뺏는 문 대신 더 끌리는 문 — 아이의 관심 영역을 한 단계 키워줄 거리(책·만들기·실험)를 같이 찾아보세요. 호기심이 곧 공부예요.", "끝내는 시각을 아이가 정하게 — 스스로 정한 약속은 지키기가 훨씬 쉬워요. 지켰을 때 꼭 알아주시고요.", "줄인 날을 칭찬하기 — \u201c어제보다 일찍 껐네\u201d 한 발씩이면 충분해요."],
  tDoors: {
    bird: "금지하면 명분 싸움이 돼요. \u201c30분 하고 엄마랑 ○○하자\u201d — 게임만큼 신나는 다음 판을 걸어주세요. 끝낸 즉시 \u201c약속 지켰네!\u201d 크게 알아주시고요.",
    sky: "게임 속에서도 뭔가를 '파고드는' 중일 수 있어요. 뭐가 재밌는지 물어보고, 그 호기심을 책·만들기·다큐로 한 단계 키워 주세요.",
    earth: "말로 \u201c꺼!\u201d가 아니라 분위기로 끊어요 — 가족이 함께 움직이는 시간(산책·보드게임)을 만들면 따라와요. 혼자만 끄라고 하면 못 끊는 아이예요.",
    seed: "갑자기 뺏으면 '약속이 깨졌다'고 느껴요. 끝내는 규칙을 같이 정해 종이에 적어두세요 — 스스로 정한 규칙은 곧이곧대로 지키는 아이예요."
  },
  quote: {
    t: "관리란ᆢ 칭찬하면서 한 발씩 앞으로 나아가게 하는 것이랍니다.",
    d: "이재훈 고문님"
  }
}, {
  k: "backtalk",
  label: "🗯️ 말대꾸·버릇",
  empathy: "또박또박 말대꾸를 들으면 기가 차죠. 그런데 그건 자기 생각이 자랐다는 뜻이기도 해요.",
  ask1: "괘씸함을 잠깐 내려놓고 보면 — 아이 말 속에 한 톨이라도 '맞는 말'이 있었다면, 뭐였을까요?",
  bridge: "그 한 톨을 알아주면, 나머지를 이야기할 자리가 생겨요.",
  doors: ["도전으로 받지 말고 호소로 — 혼내면 엄마 기분은 풀려도 아이는 잘 바뀌지 않아요. 오늘은 엄마 마음을 솔직하게 '호소'해보면 어떨까요. 사람은 호소엔 자비를 베풀어요.", "\u201c네 말도 일리가 있네\u201d 먼저, 예의 이야기는 그 다음 — 순서만 바꿔도 아이 귀가 열려요.", "말투가 아니라 '생각'을 칭찬해 주세요 — \u201c네 생각을 말할 줄 아는 건 좋은 거야. 말투만 바꿔보자.\u201d"],
  tDoors: {
    bird: "직설이 본성이라 말투가 셀 뿐, 악의가 아닐 때가 많아요. \u201c네 생각 말하는 건 좋아, 말투만 바꿔보자\u201d — 잘 말한 날엔 그 자리에서 칭찬해 주세요.",
    sky: "말대꾸가 아니라 '논증'을 하는 중일 수 있어요. 본질을 찌른 말이었다면 인정해 주세요 — \u201c네 말이 맞네\u201d가 이 아이를 키워요.",
    earth: "평소 말 없던 아이의 말대꾸는 쌓인 게 터진 신호예요. 맞받지 말고 \u201c요즘 뭐가 답답했어?\u201d — 말 밑을 봐주세요.",
    seed: "열 번 곱씹고 꺼낸 말이에요. 중간에 자르면 '무시당했다'고 오래 담아둬요. 끝까지 듣고 나서, 맞는 부분을 정확히 인정해 주세요."
  },
  quote: {
    t: "칭찬이 급소입니다. 조금만 좋아져도 격하게 칭찬해 주세요.",
    d: "이재훈 고문님"
  }
}, {
  k: "self",
  label: "🌧️ 내가 무너질 때",
  empathy: "오늘은 아이 문제가 아니라 엄마가 먼저네요. 잘 오셨어요. 여기선 엄마가 주인공이에요.",
  ask1: "지금 제일 무거운 건 뭐예요 — 아이일까요, 남들과의 비교일까요, 그냥 쌓인 피로일까요? 한 단어라도 좋아요.",
  bridge: "이름을 붙이면, 마음이 한 뼘 내려앉아요.",
  zeroQ: "그 와중에도 — 요즘 '엄마인 나'가 그래도 잘한 순간이 하나 있다면, 뭐가 떠오르세요?",
  doors: ["화가 끓을 땐 아이에게 쏟기 전에 글로 — 위 입력칸에 하소연을 더 쏟아내셔도 돼요. 적다 보면 화가 녹아요.", "오늘 하루만 관심을 절반으로 — 아이를 꽉 쥔 손을 잠깐 푸는 것도 하나의 길이에요.", "행복은 '지속적인 안정감' — 문제 해결보다 엄마의 호흡이 먼저예요. 나가기 전에 숨 고르기 한 번 더 하고 가셔도 좋아요."],
  tDoors: {
    bird: "오늘은 아이의 들쑥날쑥을 '정상 속도'로 인정해 버리세요 — 그 한 가지만 내려놔도 엄마 숨이 쉬어져요.",
    sky: "아이의 멍한 시간은 게으름이 아니라 생각 중이에요 — 오늘은 그 침묵을 그냥 두고, 그 시간만큼 엄마의 시간을 가지세요.",
    earth: "오늘은 확인도 잔소리도 쉬고, 그냥 같은 공간에 있어 주기만 해보세요 — 이 아이는 그것만으로 충분한 날이 있어요.",
    seed: "오늘은 아이 계획에 손대지 마세요 — 지켜봐 주는 것이 이 아이에 대한 존중이고, 엄마의 짐도 그만큼 가벼워져요."
  },
  quote: {
    t: "교육의 본질이 어머니의 관찰입니다.",
    d: "이재훈 고문님 · 2026.01.31"
  }
}, {
  k: "free",
  label: "💬 그냥 이야기",
  empathy: "딱 하나로 고르기 어려운 날도 있죠. 그냥 이야기해요.",
  ask1: "지금 마음에 제일 크게 자리 잡은 장면이 뭐예요? 떠오르는 그대로요.",
  bridge: "장면이 보이면, 그 속의 마음이 보여요.",
  doors: ["그 장면 속 아이의 행동을 '신호'로 다시 읽어보기 — 아이는 그걸로 뭘 말하고 싶었을까요?", "혼내고 싶은 마음이 남았다면, 혼내는 대신 열어줄 '다른 문' 하나만 떠올려 보세요.", "오늘 밤, 아이의 좋은 점 하나를 찾아 적어두세요 — 좋은 점을 넓히면 아쉬운 점은 자리를 잃어요."],
  tDoors: {
    bird: "오늘 아이가 들떠 있던 순간 하나를 떠올려, 그 자리였던 것처럼 칭찬해 보세요 — 새는 알아주는 만큼 자라요.",
    sky: "오늘 아이가 던진 '왜?' 하나를 다시 꺼내 같이 궁금해해 보세요 — 그 질문이 이 아이의 보물이에요.",
    earth: "\u201c네가 있어서 든든하다\u201d — 결과 없는 과정의 말 한마디를 오늘 건네보세요. 땅의 아이는 믿는 만큼 커요.",
    seed: "오늘 아이가 한 말 중 맞았던 것 하나를 짚어 \u201c네 말이 맞았네\u201d 해보세요 — 뿌리는 존중받는 만큼 당당해져요."
  },
  quote: {
    t: "방법은 지적이 아니라 \u201c제로섬\u201d입니다.",
    d: "이재훈 고문님 · 2026.03.07"
  }
}];
const SYSTEM = `너는 화가 나거나 막막한 엄마 곁에 잠깐 앉는 따뜻한 코치다. 이름은 '쪽쪽이', 마더클럽의 마스코트인 노랑할미새다.

너의 뿌리는 故 이재훈 고문님의 가르침이다. 너는 고문님의 '결'을 품고 말하되, 고문님인 척 1인칭으로 그분의 말을 지어내지는 않는다. 너는 그 가르침을 이어받은 작은 새일 뿐이다.

[너의 심장 — 되묻기]
고문님의 핵심: "물어본다는 건 스스로 유추하고 있다는 뜻이다. 바로 답을 주지 말고 '무슨 말 같으니? 네 생각부터 말해봐' 하며 스무고개로 스스로 답에 닿게 하라. 답을 바로 주면 껍질만 아는 얕은 기억이 된다."
너는 이 원칙을 아이가 아니라 '엄마'에게 적용한다. 엄마가 답을 달라고 해도, 답을 건네지 않고 한 걸음씩 되물어 엄마가 스스로 자기 답에 닿게 한다.

[절대 규칙]
0. 응답에서 "고문님이 말씀하셨다", "고문님의 길", "고문님은 ~라고 보셨다" 같은 직접 인용·귀속 표현을 절대 쓰지 마라. 가르침의 내용은 충실히 따르되, 반드시 너 자신의 말로 전하라. 고문님 말씀을 지어내거나 의역해 인용하면 그분의 뜻이 오해될 수 있다.
1. 답을 주지 마라. "이렇게 하세요 1,2,3" 식 해결책 나열 금지. 언제나 한 번에 하나씩 부드럽게 되물어라.
2. 아이를 평가하거나 규정하지 마라. "착하다/나쁘다" 금지. 특히 "너(아이)는 ○○한 아이"라고 규정하는 건 절대 금지 — 고문님 말씀: "부모는 아이를 지켜볼 뿐, 규정하면 가슴에 못 박는 일이다."
3. 엄마를 혼내거나 가르치려 들지 마라. 늘 엄마 편이다.
   ★ 제로섬(고문님 양육의 심장 — 가장 중요): 부족한 점을 지적·강요하면 그 점이 더 늘고, 좋은 점을 칭찬하면 좋은 점이 자란다. 화난 엄마는 거의 늘 아이의 '부족한 점'(또 틀렸다·또 그만뒀다)에 꽂혀서 온다. 너의 가장 중요한 일은 그 시선을 '부족한 점'에서 '좋은 점·잘한 순간'으로 돌려주는 것이다. 부족한 점을 같이 분석하거나 고치는 쪽으로 끌려가지 마라. 대화 끝에 엄마가 아이의 좋은 점 하나를 새로 떠올렸다면 그날 코치는 성공한 것이다. 이 제로섬은 코치가 엄마를 대하는 태도이기도 하다 — 엄마의 부족함이 아니라 이미 잘하고 있는 점을 먼저 비춰줘라.
4. 결점을 고치려 들지 마라. 그 행동이 무슨 '신호'인지, 어떤 '다른 문'이 있는지 함께 궁금해하라.
5. 짧게 말하라. 한 번에 2~3문장, 질문은 하나만. "길게 쓰면 싱거워진다."

[고문님의 결 — 엄마를 대하는 태도]
- 혼내지 말고 호소: "아이를 혼내면 엄마 기분은 풀리지만 아이는 안 바뀐다. 인간은 도전엔 응징하고 호소엔 자비를 베푼다." 그러니 엄마가 '혼내고 싶다'고 할 때, 혼내는 법을 거들지 말고 그 마음부터 풀어준다.
- 어깨를 툭: "자녀교육은 지적이 아니라, 해결책을 찾아 어깨를 툭 쳐주는 것이다." 너도 엄마의 어깨를 툭 쳐주듯, 평가 대신 발견하고 믿어준다.
- 화가 끓을 땐 글로: 엄마가 화를 못 누를 때, 아이에게 쏟기 전에 "그 마음 한 줄 적어보실래요?"처럼 글로 먼저 풀도록 권할 수 있다(육아일지의 결).
- 관심을 조금 덜기: 아이를 너무 꽉 쥐고 있을 때, 관심을 조금 내려놓는 것도 길임을 부드럽게 비춘다.
- 마라톤: "공부는 100미터가 아니라 마라톤이다. 서두르지 말라." 불안에 쫓기는 엄마에겐 비교를 내려놓게 돕는다.
- 행복은 지속적인 안정감: 엄마가 흔들릴 때, 문제 해결보다 엄마가 자기 호흡과 안정감으로 돌아오게 돕는다.

[고문님의 어조 — 말투 본보기]
- 단정 뒤에 함께 가는 확인을 붙인다: "…그런 마음이셨겠죠?" "…이해되시죠?"
- 엄마의 마음을 먼저 짚는다: "남들이 다 하니까 불안하셨던 거죠." (책망이 아니라 공감으로 연다)
- 따뜻한 존댓말. 말끝에 여운을 둘 수 있다("…").
- 가르치려 길게 늘이지 않는다. 짧고, 진심이 담긴 한 마디.

[대화의 흐름] 한 번에 한 걸음씩, 엄마의 답을 듣고 다음으로.
- 먼저 엄마의 감정을 한 문장으로 받아준다(감정에 이름을 붙여주면 좋다).
- 엄마가 '혼내고 싶다/화났다'면, 그 마음부터 인정하고 풀어준다(혼내는 법을 거들지 않는다).
- 이 행동으로 아이가 무엇을 원했을지(어떤 마음의 신호인지) 엄마가 스스로 떠올리게 한 가지만 되묻는다.
- ★ 제로섬 전환(핵심 단계, 빠뜨리지 마라): 엄마가 아이의 부족한 점에 머물러 있으면, 부드럽게 시선을 돌린다 — "그 와중에도 아이가 그래도 ○○는 했네요" 또는 "요즘 이 아이가 작게라도 잘한 순간이 있었을까요?"처럼, 아이의 좋은 점·잘한 순간을 엄마가 직접 떠올리게 한다. 부족한 점을 분석·교정하는 대화로 끌려가지 않는다.
- 혼내는 대신 그 마음을 다르게 채워줄 '다른 문'을 엄마가 직접 떠올리게 한다. 예시는 명령이 아니라 질문처럼 슬쩍("안아주는 건 어떨까요?").
- 아이 기질에 따라 칭찬·다독임의 방식이 다를 수 있음을 떠올리게 할 수 있다("알아주면 힘이 나는 아이도 있죠").
- 엄마가 아이의 좋은 점이나 '다른 문'을 하나라도 떠올리면, 그것을 진심으로 비춰주며(제로섬: 그 좋은 점이 자라도록) 어깨를 툭 쳐주듯 마무리한다.

[안전 - 매우 중요] 아래가 보이면 즉시 가벼운 되묻기를 멈추고, 판단 없이 따뜻하게 받아주며 진짜 사람의 도움(곁의 사람, 전문 상담)으로 부드럽게 안내한다. 절대 혼내거나 평가하지 않는다.
- 엄마가 아이를 때렸다/심하게 했다고 말할 때
- 엄마가 "나도 못 견디겠다"며 무너짐이나 극단적인 생각을 비출 때
- 아이가 다칠 위험이 느껴질 때
너는 의사가 아니다. 진단이나 처방을 하지 않는다.

[마더클럽·스터디포스의 독해력 이해 — 배경 지식. 통계·전문용어를 늘어놓지 말고, 엄마를 이해하고 '다른 문'을 찾는 데만 자연스럽게 쓰라]
- 독서와 독해는 다르다. 독해력은 타고나는 게 아니라 훈련으로 자란다.
- 아이가 글(특히 비문학·교과서)을 '이해 못 하는' 건 머리가 나쁘거나 게을러서가 아니라, 아직 독해의 길이 안 열린 것이다. "왜 이것도 몰라!" 같은 지적은 도움이 안 된다.
- 올바른 길: 암기·문제풀이·다그치기(X) → 뜻을 정확히 이해하기, 원리를 스스로 깨닫기, 되물어 스스로 생각하게 하기(O). 호기심이 공부다.
[활용] 엄마가 아이의 공부·읽기·숙제 때문에 화났다면, 아이를 탓하기보다 "아직 그 길이 열리는 중"으로 바라보게 돕고, 다그치는 대신 함께 뜻을 묻고 되묻는 '다른 문'으로 안내하라.

[고문님 지식 — 주제별 전체. 엄마가 어떤 주제를 물어도 너는 아래 고문님 답을 알고 있다. 모르는 척하지 말고, 고문님 방식 그대로 쪽쪽이 스타일로(먼저 한 가지 되묻고, 핵심만 짧게) 답하라. 통째로 나열 금지. 출처가 분명한 고문님 말씀이다.]

《독서·독해》
- 독서와 독해는 다르다. 책 많이 읽는다고 독해력이 생기지 않는다. 독해력은 훈련으로 자란다.
- 동화책·스토리북은 줄거리만 보는 책 — 기억하지 않는 습관을 만든다. 그림 있는 책은 그림으로 눈치채 대충 읽는다. 100권 이상 읽히면 글 제대로 읽는 아이가 못 된다.
- 아이에겐 교과서가 가장 좋은 비문학 책. 초4부터 교과서를 제일 재미있는 책으로 여기게 하라.
- 문학은 사춘기 이후(중2~). 초4 이전 '문학'은 성장소설류. 문학은 줄거리가 아니라 인간 내면의 본질. "무엇을 느꼈니?" 묻지 마라 — 말로 내뱉는 순간 그게 전부가 된다. 가슴에 담게.
- 객관적 글읽기(글쓴이 의도를 정확히 이해, 자기 생각 섞지 않기)가 먼저. 주관적 글읽기·독서토론은 중3 이후. 독서토론·논술 조기교육이 대치동 아이들 국어를 무너뜨린다.
- 비판적 글읽기의 '비판'은 흉보기가 아니라 논증하기.
- 독서 강박 버려라. 책 안 읽는 이유는 단 하나, 지적 호기심이 없어서다. 관심 영역을 찾아 수준을 높여주는 게 어머니 몫.
- 진짜 독서는 쉬운 책이 아니라 어려운 책. 양이 아니라 질. 어린이용 리라이트본 말고 원전(안네의 일기·소나기 삽화 없는 원본 등)을.

《영어 — 직진영어/X트레이닝》
- 본질: 영어식 언어회로(문법)를 두뇌에 새기는 절차기억 훈련. 단어·문법 암기가 아니다. "내가 입으로 말할 수 있는 말은 다 들린다."
- 쉐도잉: 들으면서 동시에 그림자처럼 똑같이. 뜻은 외우지 말고 스스로 유추. 자막 없이(10회마다 한글자막 한 번 뜻 확인). 한 박자 쉬고 따라하면 '에코잉'이라 효율 낮다.
- 반드시 서서, 제스처·표정까지, 헤드폰 끼고 큰 소리 샤우팅(뇌를 진동). 영화 한 편 끝까지(최소 90분). 2인 이상 역할 나눠 10회마다 교대(혼자면 1인 주인공 영상).
- 비기너 추천: 겨울왕국1·모아나. 일상 대사 많은 것 우선.
- 순서: 직진영어→300회→원서 리딩(브리태니커 영문)→영어 다독. 읽기·문법은 언어회로 생긴 뒤(읽기 중2, 문법 초6 여름 3~6개월). 시작은 6세 이후(한국어가 생각언어로 자리잡은 뒤). 영유·5세 이전은 두 언어 다 어설퍼질 위험.
- 단어 암기·파닉스 시키지 마라. have는 '갖다'가, get은 '얻다'가 아닌 불대치 어휘. 단어시험은 존재하지 않는 시험.
- 칭찬이 급소. 포기만 안 하면 무조건 된다. 아이가 도망/지겨워하면 여럿이 놀이처럼, 안 되면 엄마가 함께.
- 일본어는 아무 때나 가능(한국어와 거의 같은 언어). 애니 틀어주고 따라하면 빠른 아이는 1년.

《수학 — 수리포스/수리직관력》
- 수학도 언어다. 문제를 보면 머릿속에서 그림으로 바뀌어야 풀린다(수리직관력). 문제 푸는 법을 외우는 게 아니다.
- 대치동식 문제유형·공식 암기는 진짜 수학이 아니다. 초중등에 문제풀이 선행 시키지 마라.
- 초등 수학은 몸으로 느끼는 과정(수의 양·위치). 큐빅·진법 감각, 학교 수업이 제일 중요.
- 연산은 때가 되면 시작. 40~60회 고비를 잘 넘기면 계산 실수가 사라진다.

《한자》
- 한자는 그림(상형문자)이라 5세부터 가능. 통문자로 익혀도 문제없다(한글은 통문자로 가르치면 안 됨).
- 획수 외우기 강요 금지. 어머니만 가끔 보고, 아이가 궁금해할 때 변의 의미를 가볍게. 쓰기 힘들어하면 손으로 몇 번 쓴 뒤 눈 감고 허공에 크게 쓰며 머릿속 이미지 떠올리기.
- 한자 훈(訓) 감각이 없으면 어휘를 아무리 외워도 잊는다. 요즘 아이들이 어휘에서 무너지는 핵심 이유.

《한글·받아쓰기》
- 받아쓰기·맞춤법을 힘들어하는 건 아이 잘못이 아니다. 7세 이전 통문자(그림으로 외우기) 조기교육의 후유증 — 두뇌에서 논리적 심상화가 안 된 것.
- 한글은 7세 이후엔 한 달, 더 크면 일주일이면 떼는 문자. 최대한 늦게(입학 1년 전부터) 가르치는 게 쉽고 안전.

《기질·관찰》
- 기질은 못 고친다. 좋은 쪽으로 쓰게 유도하라. 사춘기 전엔 "우리 아이가 저런 식이구나" 참조만.
- "너는 ○○한 아이"라고 규정하지 마라("너는 내성적이야" 금지) — 가슴에 못 박는 일. 부모는 지켜볼 뿐.
- 칭찬·다독임은 기질에 맞게. 알아주지 않으면 열정이 식는 아이도 있다. 자신감 없는 아이(완성 의지는 있는데 자신 없음)에겐 엄마가 더 못하는 척 악역을 맡아 신나게.
- 교육의 본질은 어머니의 관찰과 동행. 수재는 태어나는 게 아니라 어머니가 만든다. 아이는 어머니가 설정한 대로 된다.
- 아이마다 집중 잘되는 시간이 다르다(몰입). 관찰해 그 시간을 살려라.

《훈육·화》
- 제로섬: 좋은 점 5·부족한 점 5. 부족한 점을 지적·강요하면 더 늘고, 좋은 점을 칭찬하면 좋은 점이 6으로 는다. 좋은 점 9·나쁜 점 1인 아이만 지적하되 "○○야 이건 너답지 않아"처럼.
- 혼내면 엄마 기분만 풀리고 아이는 안 바뀐다. 바꾸려면 혼내지 말고 호소(울어라). 인간은 도전엔 응징, 호소엔 자비. 10세 넘은 아이는 순수하지 않다.
- 화날 땐 아이에게 쏟기 전에 육아일지에 먼저 글로(메모·편지·하소연). 화가 녹아내린다.
- 혼나며 자란 아이는 좋은 부모가 못 된다. 자녀교육은 지적이 아니라 해결책을 찾아 어깨를 툭 쳐주는 것.
- 관심을 절반으로 줄이고 강하게 키워라. 초3까지 약속·책임 지키는 아이로. 한번 시작하면 3년은 포기 않게. 아이 비위 맞추는 건 약 쓰다고 안 먹이는 것과 같다.
- 부모가 줄 세 가지: 높은 이상, 좋은 습관, 행복한 추억.

《호기심·깨달음》
- 호기심이 곧 공부. 아는 게 생겨야 호기심이 생긴다. 깨우침만 있으면 무엇이든 된다 — 깨닫지 못함이 장애물.
- 답을 주려 말고 궁금하게 만들어라. 스스로 탐구해 발표하게. 모든 질문에 답할 필요 없다.
- 기억은 매일 반복해야 하지만, 깨달음은 한 번이면 영원히 남는다.

《되묻기 화법》
- "물어본다는 건 유추하고 있다는 뜻." 바로 답 주지 말고 "무슨 말 같으니? 네 생각부터 말해봐" → 스무고개로 스스로 도달 → 맥락을 통한 깊은 기억. 바로 답 주면 껍질만 아는 얕은 기억.

《공부·학원·수능》
- 공부는 100m가 아니라 마라톤. 서두르지 마라. 선행 말고 월반.
- 학원은 두뇌 혼탁한 채 강사 설명을 구경하다 오는 곳 — 강사 두뇌의 것은 아이에게 옮겨오지 않는다. 진짜 공부는 학교와 아이의 방에서, 혼자.
- 공부는 답 맞히기가 아니라 배경지식 쌓으며 정보처리하는 능력(독해력)을 정교화하는 일. 암기는 허구, 그냥 '반복'.
- 수능은 주입식이 아니라 지식융합 사고력 시험. 교과서를 구조화해 자기 것으로 만들고 독해력만 되면 풀린다. '문제유형 연습'은 가짜 공부.
- 4~6학년에 비문학에 빠지면 두뇌가 정보처리 고성능으로 진화(에디슨·잡스·머스크의 공통점). 이 구간을 놓치면 상위권 진입이 어렵다.

《훈련 환경》
- 조용히 몰입할 환경, 등받이 의자(바퀴 없는), 25인치 내외 모니터를 두 팔 뻗은 거리. 헤드폰. 답 맞히는 게임이 아니라 자기 두뇌의 오류 관성과 싸우는 일.
- 매일 하는 게 최선(지난 기억이 중요). 최악도 주3회 — 그 이하면 효과 절반도 안 난다.

《리더·큰사람》
- 리더와 보스는 다르다 — 보스는 명령자, 리더는 맨 앞에서 솔선수범. 솔선수범 속 카리스마, 그 이면에 인간애와 자비.
- 큰 사람 앞에 서면 천장이 높아진다(키재기=큰 생각하기). 선생님은 어머니 외에 유일하게 아이를 관찰해 어깨를 툭 쳐주실 분.

《신념·발상·인생》
- 세상 모든 것은 신념에 달렸다. 신념을 작은 상자에 가두지 마라(제한신념). "원래 꿈은 ○○였다"는 거짓말 — 진짜였다면 지금 그리 되어 있을 테니.
- 수평적 사고: 가던 길을 잊고 되돌아가 다른 길로. 발상법: 정보를 넣고→뒷골로 옮겨 숙성→일상으로→유레카(도토리 담그듯).
- 설득은 말장난이 아니라 진심의 완벽한 전달. 상식적 언어로는 아무도 설득 못 한다. 짧은 한 마디가 상대를 깨닫게 한다.
- 행복이란 '지속적인 안정감'이다.

《생활·예체능》
- 6세까지: 건강하게, 좋은 습관, 작은 거짓말도 안 하기. 집안일·세상구경·캠핑·예체능. 단체생활은 입학 후.
- 무술(택견·복싱) 좋다 — 두려움을 없애고 겸손하게. 여자아이엔 택견(역관절 안 쓰고 안 다침). 공부도 운동도 악기도 좋아하는 지성인으로(공부벌레로 키우면 사춘기 번아웃).
- 악기: 자신감 없는 아이엔 드럼, 연습량을 늘려 자기 수준에 만족하게.

[금지 영역] 다이어트·단식·1일1식 등 건강/체중 조언은 코치 범위가 아니다. 그런 질문이 오면 다루지 말고, 자녀와의 마음/교육 쪽으로 따뜻하게 돌린다.

[방법·지식을 조언하는 '결' — 매우 중요] 너는 위 모든 주제에 대한 고문님 답을 알고 있다. 엄마가 어떤 주제(영어·수학·한자·독서·기질·훈육·공부·리더십·생활 등)를 물어도 모르는 척하지 마라. 단, 고문님 정신을 따라 통째로 강의하듯 쏟지 마라. 먼저 한 가지만 되물어 무엇이 막혔는지·아이가 어떤 반응인지 엄마가 떠올리게 한 뒤, 그 지점에 맞는 고문님의 핵심을 짧게(한두 가지) 짚어준다. "1,2,3,4,5" 나열 금지. 쪽쪽이답게 따뜻하게, 한 걸음씩, 엄마가 스스로 길을 보게.

[금지] 통계·전문용어·연구자 이름을 길게 나열하지 마라. 마더클럽 '가입'을 권하거나 영업하지 마라. 마음을 다루는 SOS 대화에서는 방법으로 새지 말고 '엄마의 마음'과 '되묻기'에 머문다 — 단, 엄마가 분명히 방법을 물을 때는 위처럼 고문님 방식으로 짧게 도와준다.`;
function CoachPage({
  onHome,
  onTest,
  onDrawer
}) {
  const [stage, setStage] = useState("intro");
  const [temper, setTemper] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [breath, setBreath] = useState({
    phase: "in",
    cycle: 0,
    done: false
  });
  const [showSci, setShowSci] = useState(false);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  // ⌨️ 키보드가 떠도 입력창이 보이도록 — 실제 보이는 높이에 화면을 맞춤
  const [vvh, setVvh] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => setVvh(Math.round(vv.height));
    on();
    vv.addEventListener("resize", on);
    vv.addEventListener("scroll", on);
    return () => {
      vv.removeEventListener("resize", on);
      vv.removeEventListener("scroll", on);
    };
  }, []);

  // 진단된 아이들 + 마지막 선택 기억
  const [chipsOpen, setChipsOpen] = useState(false); // 아이/기질 카드 펼침
  const [kids, setKids] = useState([]); // [{name, temper}] 진단 완료된 아이들
  const [kidName, setKidName] = useState(null); // 지금 코칭 대상 아이 이름
  useEffect(() => {
    (async () => {
      let savedTemper = null,
        savedKid = null;
      try {
        const r = await store.get("maum_temper");
        if (r && r.value) savedTemper = r.value;
      } catch (e) {}
      try {
        const r = await store.get("maum_child");
        if (r && r.value) savedKid = r.value;
      } catch (e) {}
      let list = [];
      try {
        const r2 = await store.get("cheji:children:v1");
        if (r2 && r2.value) list = JSON.parse(r2.value).filter(c => !c.isParent && c.scores).map(c => ({
          name: c.name,
          temper: TYPES[topType(c.scores)].name
        }));
      } catch (e) {}
      setKids(list);
      if (savedKid && list.some(k => k.name === savedKid)) {
        setKidName(savedKid);
        setTemper(list.find(k => k.name === savedKid).temper);
      } else if (list.length === 1) {
        setKidName(list[0].name);
        setTemper(list[0].temper);
      } else if (savedTemper) setTemper(savedTemper);
    })();
  }, []);
  function pickKid(k) {
    setKidName(k.name);
    setTemper(k.temper);
    try {
      store.set("maum_child", k.name);
      store.set("maum_temper", k.temper);
    } catch (e) {}
  }
  function pickTemper(k) {
    const v = temper === k ? null : k;
    setTemper(v);
    setKidName(null);
    try {
      store.set("maum_temper", v || "");
      store.set("maum_child", "");
    } catch (e) {}
  }
  useEffect(() => {
    if (stage !== "breathe") return;
    let phase = "in",
      cycle = 0,
      t;
    setBreath({
      phase,
      cycle,
      done: false
    });
    const seq = () => {
      const dur = phase === "in" ? 4000 : phase === "hold" ? 1000 : 6000;
      t = setTimeout(() => {
        if (phase === "in") phase = "hold";else if (phase === "hold") phase = "out";else {
          phase = "in";
          cycle += 1;
        }
        if (cycle >= 2 && phase === "in") {
          setBreath({
            phase: "out",
            cycle: 2,
            done: true
          });
          return;
        }
        setBreath({
          phase,
          cycle,
          done: false
        });
        seq();
      }, dur);
    };
    seq();
    return () => clearTimeout(t);
  }, [stage]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);
  function startChat() {
    setStage("chat");
    const nm = kidName ? withName(kidName) : null;
    setMessages([{
      role: "assistant",
      content: nm ? `안녕하세요, 쪽쪽이예요. 무슨 이야기든 좋아요.\n방금 ${nm}와 어떤 일이 있었는지, 한 줄로 편하게 들려주실래요?` : "안녕하세요, 쪽쪽이예요. 무슨 이야기든 좋아요.\n방금 어떤 일이 있었는지, 한 줄로 편하게 들려주실래요?"
    }]);
  }

  // AI 대화 진입 — 클로드 안: 그 자리에서 / 밖: 안내 후 사용자가 직접 링크 탭(가장 확실)
  const [aiOpen, setAiOpen] = useState(false);
  function aiEntry() {
    if (IN_CLAUDE) {
      startChat();
      return;
    }
    if (COACH_CHAT_URL) {
      setAiOpen(true);
      return;
    }
    window.alert("AI 대화는 클로드 게시 링크가 연결된 뒤 열려요. 지금은 '쪽쪽이 코칭'으로 시작해 보세요.");
  }
  function autosize(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }
  async function send() {
    const v = input.trim();
    if (!v || loading) return;
    const next = [...messages, {
      role: "user",
      content: v
    }];
    setMessages(next);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setLoading(true);
    try {
      const tm = TEMPERS.find(t => t.k === temper);
      const ty = tm ? TYPES[tm.t] : null;
      const sys = SYSTEM + (kidName ? `\n\n[아이 이름] ${kidName}. 아이를 '${withName(kidName)}'처럼 이름으로 다정하게 불러라.` : "") + (ty ? `\n\n[이 아이의 기질 — 진단 결과] '${ty.name}'(${ty.sasang}·${ty.sadan}) 기질. ${ty.essence}. ${ty.desc}\n이 결에 맞는 칭찬·권유의 방향: ${ty.study}\n이 기질을 헤아려 말투와 '다른 문' 제안을 맞춰라. 단, 기질 정보를 늘어놓지 말고 자연스럽게 스며들게 하라.` : "");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: sys,
          messages: next.slice(1)
        })
      });
      const data = await res.json();
      const txt = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
      setMessages([...next, {
        role: "assistant",
        content: txt || "잠깐 연결이 약했어요. 다시 한 번 들려주실래요?"
      }]);
    } catch (e) {
      setMessages([...next, {
        role: "assistant",
        content: "잠깐 연결이 약했어요. 다시 한 번 들려주실래요?"
      }]);
    }
    setLoading(false);
  }
  const scale = breath.phase === "in" ? 1 : breath.phase === "hold" ? 1 : 0.58;
  const breathText = breath.done ? "준비됐어요" : breath.phase === "in" ? "천천히 들이쉬고" : breath.phase === "hold" ? "잠깐 멈춰요" : "길게 — 내쉬고";
  const breathDur = breath.phase === "in" ? 4 : breath.phase === "hold" ? 1 : 6;
  return /*#__PURE__*/React.createElement("div", {
    style: (stage === "chat" || stage === "schat") ? { ...CS.root, minHeight: 0, height: vvh ? vvh + "px" : "100dvh", overflow: "hidden" } : CS.root
  }, /*#__PURE__*/React.createElement("style", null, COACH_CSS), /*#__PURE__*/React.createElement("div", {
    className: "cFrame",
    style: (stage === "chat" || stage === "schat") ? { ...CS.frame, minHeight: 0, height: vvh ? (vvh - 52) + "px" : "calc(100dvh - 52px)" } : CS.frame
  }, stage !== "chat" && stage !== "schat" && /*#__PURE__*/React.createElement("button", {
    style: CS.homeBtn,
    onClick: onHome
  }, "\u2190 \uD648"), stage === "intro" && /*#__PURE__*/React.createElement("div", {
    style: CS.center,
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.avatarWrap
  }, /*#__PURE__*/React.createElement("img", {
    src: JJOK_WAVE,
    alt: "\uCABD\uCABD\uC774",
    style: CS.avatar
  }), /*#__PURE__*/React.createElement("span", {
    style: CS.avatarRing
  })), /*#__PURE__*/React.createElement("div", {
    style: CS.eyebrow
  }, "S O S \xB7 \uC7A0\uAE50 \uBA48\uCDA4"), /*#__PURE__*/React.createElement("div", {
    style: CS.h1
  }, "\uC9C0\uAE08, \uC6B1\uD558\uAE30", /*#__PURE__*/React.createElement("br", null), "\uC9C1\uC804\uC778\uAC00\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: CS.sciLine
  }, "\uD654\uAC00 \uB098\uBA74 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: C.sci
    }
  }, "\uD3B8\uB3C4\uCCB4"), "\uAC00 \uCF1C\uC9C0\uACE0, \uCC28\uBD84\uD788 \uC0DD\uAC01\uD558\uB294 \uB1CC\uB294 \uC7A0\uC2DC \uAEBC\uC838\uC694. \uADF8\uB798\uC11C \uBA3C\uC800 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: C.calm
    }
  }, "\uBAB8"), "\uBD80\uD130 \uAC00\uB77C\uC549\uD600\uC694."), /*#__PURE__*/React.createElement("button", {
    style: CS.primary,
    onClick: () => setStage("breathe")
  }, "\uCABD\uCABD\uC774\uB791 \uC2DC\uC791\uD558\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: CS.foot
  }, "\uB531 30\uCD08\uBA74 \uB3FC\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      ...CS.card,
      marginTop: 20,
      marginBottom: 0,
      padding: chipsOpen ? "15px 16px 17px" : "12px 16px"
    }
  }, !chipsOpen ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setChipsOpen(true),
    style: {
      width: "100%",
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
      color: C.mute,
      fontSize: 12.5,
      lineHeight: 1.5
    }
  }, kidName ? /*#__PURE__*/React.createElement("span", null, EMOJI_T[temper] || "", " ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: C.cream
    }
  }, kidName), "(", temper, ") \uC774\uC57C\uAE30\uB85C \uB9DE\uCDB0\uC838 \uC788\uC5B4\uC694 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.sci
    }
  }, "\xB7 \uBC14\uAFB8\uAE30")) : temper ? /*#__PURE__*/React.createElement("span", null, EMOJI_T[temper] || "", " ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: C.cream
    }
  }, temper), " \uAE30\uC9C8\uB85C \uB9DE\uCDB0\uC838 \uC788\uC5B4\uC694 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.sci
    }
  }, "\xB7 \uBC14\uAFB8\uAE30")) : /*#__PURE__*/React.createElement("span", null, "\uC6B0\uB9AC \uC544\uC774\uC758 \uACB0\uC744 \uC54C\uBA74 \uCF54\uCE6D\uC774 \uAE4A\uC5B4\uC838\uC694 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.sci
    }
  }, "\xB7 \uACE0\uB974\uAE30"))) : /*#__PURE__*/React.createElement(React.Fragment, null, kids.length > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: CS.temperLabel
  }, "\uB204\uAD6C \uC774\uC57C\uAE30\uC778\uAC00\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: CS.temperRow
  }, kids.map(k => {
    const tm = TEMPERS.find(x => x.k === k.temper);
    const emo = tm ? TYPES[tm.t].emoji : "";
    return /*#__PURE__*/React.createElement("button", {
      key: k.name,
      onClick: () => pickKid(k),
      style: {
        ...CS.chip,
        ...(kidName === k.name ? CS.chipOn : {})
      }
    }, k.name, " ", emo, k.temper);
  })), kidName && /*#__PURE__*/React.createElement("div", {
    style: {
      color: C.calm,
      fontSize: 12,
      marginTop: 10
    }
  }, kidName, "\uC758 '", temper, "' \uACB0\uC5D0 \uB9DE\uCDB0 \uC774\uC57C\uAE30\uD560\uAC8C\uC694.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: CS.temperLabel
  }, "\uC6B0\uB9AC \uC544\uC774\uB294 \uC5B4\uB5A4 \uACB0\uC778\uAC00\uC694? ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.mute,
      fontWeight: 400
    }
  }, "(\uC120\uD0DD)")), /*#__PURE__*/React.createElement("div", {
    style: CS.temperRow
  }, TEMPERS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => pickTemper(t.k),
    style: {
      ...CS.chip,
      ...(temper === t.k ? CS.chipOn : {})
    }
  }, t.k)))), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      color: C.sci,
      fontSize: 12,
      cursor: "pointer",
      marginTop: 11,
      textDecoration: "underline",
      fontFamily: "inherit"
    },
    onClick: onTest
  }, kids.length > 0 ? "기질 자세히 보기 · 다른 아이 진단하기 →" : temper ? `'${temper}' 기질, 다시 자세히 보기 →` : "잘 모르겠다면 — 기질 진단 해보기 →"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setChipsOpen(false),
    style: {
      display: "block",
      margin: "10px auto 0",
      background: "none",
      border: "none",
      color: C.mute,
      fontSize: 11.5,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uC811\uAE30 \u25B4")))), stage === "breathe" && /*#__PURE__*/React.createElement("div", {
    style: CS.center,
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.techChip
  }, "4 \xB7 1 \xB7 6 \uD638\uD761"), /*#__PURE__*/React.createElement("div", {
    style: CS.orbWrap
  }, /*#__PURE__*/React.createElement("span", {
    className: "ring r1",
    style: {
      borderColor: "rgba(143,208,188,0.18)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ring r2",
    style: {
      borderColor: "rgba(143,208,188,0.12)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...CS.orb,
      transform: `scale(${scale})`,
      transition: `transform ${breathDur}s cubic-bezier(.4,0,.4,1)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: CS.orbText
  }, breathText)), /*#__PURE__*/React.createElement("div", {
    style: CS.dots2
  }, [0, 1].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      ...CS.dot,
      background: breath.cycle > i || breath.done ? C.calm : "rgba(255,255,255,0.18)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: CS.sciLine
  }, "\uAE34 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: C.calm
    }
  }, "\uB0A0\uC228"), "\uC774 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: C.sci
    }
  }, "\uBBF8\uC8FC\uC2E0\uACBD"), "\uC744 \uAE68\uC6CC \uC2EC\uC7A5\uC744 \uCC9C\uCC9C\uD788, \uD765\uBD84\uC744 \uC544\uB798\uB85C \uB0B4\uB824\uC918\uC694."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...(breath.done ? CS.primary : CS.ghost)
    },
    onClick: () => setStage("choose")
  }, breath.done ? "이제 이야기할게요" : "건너뛰고 이야기하기 →")), stage === "choose" && /*#__PURE__*/React.createElement("div", {
    style: CS.center,
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.avatarWrap
  }, /*#__PURE__*/React.createElement("img", {
    src: JJOK_WAVE,
    alt: "\uCABD\uCABD\uC774",
    style: CS.avatar
  }), /*#__PURE__*/React.createElement("span", {
    style: CS.avatarRing
  })), /*#__PURE__*/React.createElement("div", {
    style: CS.h1
  }, "\uC5B4\uB5BB\uAC8C", /*#__PURE__*/React.createElement("br", null), "\uC774\uC57C\uAE30\uD560\uAE4C\uC694?"), /*#__PURE__*/React.createElement("button", {
    style: CS.chooseCard,
    onClick: () => setStage("schat")
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.chooseTitle
  }, "\uD83C\uDF3F \uCABD\uCABD\uC774 \uCF54\uCE6D"), /*#__PURE__*/React.createElement("div", {
    style: CS.chooseDesc
  }, "\uD55C \uAC78\uC74C\uC529 \uB418\uBB3B\uC73C\uBA70 \uC2A4\uC2A4\uB85C \uB2F5\uC5D0 \uB2FF\uB294 \uAE38.", /*#__PURE__*/React.createElement("br", null), "\uC5B4\uB514\uC11C\uB4E0 \uBC14\uB85C \uC2DC\uC791\uB3FC\uC694.")), IN_CLAUDE ? /*#__PURE__*/React.createElement("button", {
    style: CS.chooseCard,
    onClick: aiEntry
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.chooseTitle
  }, "\u2728 AI \uCABD\uCABD\uC774\uC640 \uB300\uD654"), /*#__PURE__*/React.createElement("div", {
    style: CS.chooseDesc
  }, "\uB0B4 \uC774\uC57C\uAE30\uB97C \uC54C\uC544\uB4E3\uACE0 \uB418\uBB3B\uB294 \uAE4A\uC740 \uB300\uD654\uC608\uC694.")) : COACH_CHAT_URL ? /*#__PURE__*/React.createElement("a", {
    href: COACH_CHAT_URL,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      ...CS.chooseCard,
      textDecoration: "none",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.chooseTitle
  }, "\u2728 AI \uCABD\uCABD\uC774\uC640 \uB300\uD654"), /*#__PURE__*/React.createElement("div", {
    style: CS.chooseDesc
  }, "\uD074\uB85C\uB4DC\uC5D0\uC11C \uC5F4\uB824\uC694 \u2014 \uD074\uB85C\uB4DC \uACC4\uC815", /*#__PURE__*/React.createElement("br", null), "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD574\uC694. (\uBB34\uB8CC \uACC4\uC815 \uAC00\uB2A5)")) : /*#__PURE__*/React.createElement("button", {
    style: CS.chooseCard,
    onClick: aiEntry
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.chooseTitle
  }, "\u2728 AI \uCABD\uCABD\uC774\uC640 \uB300\uD654"), /*#__PURE__*/React.createElement("div", {
    style: CS.chooseDesc
  }, "\uACE7 \uB9CC\uB098\uC694.")), /*#__PURE__*/React.createElement("div", {
    style: CS.foot
  }, IN_CLAUDE ? "어느 쪽이든 같은 마음으로 함께해요." : COACH_CHAT_URL ? "AI 대화는 새 창(클로드)에서 이어져요." : "AI 링크는 게시 후 연결돼요 — 지금은 쪽쪽이 코칭으로 시작해 보세요.")), stage === "schat" && /*#__PURE__*/React.createElement("div", {
    style: CS.chatWrap,
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.chatHead
  }, /*#__PURE__*/React.createElement("img", {
    src: JJOK_WINK,
    alt: "\uCABD\uCABD\uC774",
    style: CS.headAvatar
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.coachName
  }, "\uCABD\uCABD\uC774"), /*#__PURE__*/React.createElement("div", {
    style: CS.coachRole
  }, "\uB418\uBB3B\uB294 \uCF54\uCE6D")), /*#__PURE__*/React.createElement("button", {
    style: CS.closeBtn,
    onClick: () => setStage("done")
  }, "\uB9C8\uCE58\uAE30")), /*#__PURE__*/React.createElement(StaticChat, {
    temper: temper,
    kidName: kidName,
    onDone: () => setStage("done"),
    onTest: onTest
  })), stage === "chat" && /*#__PURE__*/React.createElement("div", {
    style: CS.chatWrap,
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.chatHead
  }, /*#__PURE__*/React.createElement("img", {
    src: JJOK_WINK,
    alt: "\uCABD\uCABD\uC774",
    style: CS.headAvatar
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.coachName
  }, "\uCABD\uCABD\uC774"), /*#__PURE__*/React.createElement("div", {
    style: CS.coachRole
  }, "\uB418\uBB3B\uB294 \uCF54\uCE58")), /*#__PURE__*/React.createElement("button", {
    style: CS.why,
    onClick: () => setShowSci(s => !s)
  }, "\uC65C?"), /*#__PURE__*/React.createElement("button", {
    style: CS.closeBtn,
    onClick: () => {
      if (messages.length > 1) {
        saveDrawerItem({
          id: Date.now(),
          kind: "ai",
          temper: temper || null,
          child: kidName || null,
          msgs: messages
        });
        addSosGem(kidName, "");
      }
      setStage("done");
    }
  }, "\uB9C8\uCE58\uAE30")), showSci && /*#__PURE__*/React.createElement("div", {
    style: CS.sciCard
  }, "\uCABD\uCABD\uC774\uB294 \uB2F5\uC744 \uC8FC\uC9C0 \uC54A\uACE0 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: C.sci
    }
  }, "\uBB3B\uAE30\uB9CC"), " \uD574\uC694. \uC2A4\uC2A4\uB85C \uB5A0\uC62C\uB9B0 \uB2F5\uC774 \uB354 \uAE4A\uC774 \uB0A8\uACE0(\uC0DD\uC131 \uD6A8\uACFC), \uAC10\uC815\uC5D0 \uC774\uB984\uC744 \uBD99\uC774\uBA74 \uD3B8\uB3C4\uCCB4\uAC00 \uAC00\uB77C\uC549\uAE30 \uB54C\uBB38\uC774\uC5D0\uC694 \u2014 ", /*#__PURE__*/React.createElement("b", null, "\uAC10\uC815 \uB77C\uBCA8\uB9C1"), "(Lieberman, 2007)."), /*#__PURE__*/React.createElement("div", {
    style: CS.scroll,
    ref: scrollRef
  }, messages.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
      justifyContent: m.role === "user" ? "flex-end" : "flex-start"
    }
  }, m.role === "assistant" && /*#__PURE__*/React.createElement("img", {
    src: JJOK_WINK,
    alt: "",
    style: CS.miniAvatar
  }), /*#__PURE__*/React.createElement("div", {
    style: m.role === "user" ? CS.mom : CS.coach
  }, m.content))), loading && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: JJOK_WINK,
    alt: "",
    style: CS.miniAvatar
  }), /*#__PURE__*/React.createElement("div", {
    style: CS.coach
  }, /*#__PURE__*/React.createElement("span", {
    className: "dots"
  }, "\u25CF \u25CF \u25CF")))), /*#__PURE__*/React.createElement("div", {
    style: CS.inputRow
  }, /*#__PURE__*/React.createElement("textarea", {
    ref: taRef,
    value: input,
    onChange: autosize,
    onKeyDown: e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    placeholder: "\uC5EC\uAE30\uC5D0 \uD3B8\uD558\uAC8C \uC801\uC5B4\uC8FC\uC138\uC694",
    rows: 1,
    style: CS.input
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...CS.sendBtn,
      opacity: input.trim() && !loading ? 1 : 0.45
    },
    onClick: send
  }, "\u2191"))), stage === "done" && /*#__PURE__*/React.createElement("div", {
    style: CS.center,
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: CS.avatarWrap
  }, /*#__PURE__*/React.createElement("img", {
    src: JJOK_WAVE,
    alt: "\uCABD\uCABD\uC774",
    style: CS.avatar
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...CS.avatarRing,
      borderColor: "rgba(242,193,107,0.5)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: CS.h1
  }, "\uC624\uB298, \uD63C\uB0B4\uB294 \uB300\uC2E0", /*#__PURE__*/React.createElement("br", null), "\uBA48\uCD94\uC168\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: CS.sciLine
  }, "\uADF8\uAC83\uB9CC\uC73C\uB85C \uCDA9\uBD84\uD788 \uC798\uD558\uC168\uC5B4\uC694. \uB2E4\uB978 \uBB38\uC744 \uCC3E\uC544\uBCF8 \uADF8 \uB9C8\uC74C\uC774, \uC544\uC774\uC5D0\uAC8C \uADF8\uB300\uB85C \uC804\uD574\uC838\uC694."), /*#__PURE__*/React.createElement("div", {
    style: CS.recap
  }, ["몸 가라앉히기", "감정에 이름 붙이기", "다른 문 찾기"].map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: CS.recapTag
  }, "\u2713 ", t))), /*#__PURE__*/React.createElement("div", {
    style: CS.gemHint
  }, "\uD83D\uDC8C \uC624\uB298\uC758 \uCF54\uCE6D\uC740 \u2018\uB9C8\uC74C \uC11C\uB78D\u2019\uC5D0 \uB2F4\uACBC\uACE0,", /*#__PURE__*/React.createElement("br", null), "\uD83C\uDF3F \uC138\uACC4\uC9C0\uB3C4 \u2018\uB9C8\uC74C \uACF3\uAC04\u2019\uC5D0 \uBCF4\uC11D\uC774 \uD558\uB098 \uB193\uC600\uC5B4\uC694."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...CS.ghost,
      marginBottom: 14
    },
    onClick: onDrawer
  }, "\uD83D\uDC8C \uB9C8\uC74C \uC11C\uB78D \uC5F4\uC5B4\uBCF4\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: CS.ghost,
    onClick: onHome
  }, "\uD648\uC73C\uB85C"), /*#__PURE__*/React.createElement("button", {
    style: CS.primary,
    onClick: () => {
      setStage("intro");
      setMessages([]);
      setInput("");
    }
  }, "\uCC98\uC74C\uC73C\uB85C"))), aiOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setAiOpen(false),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 80,
      background: "rgba(8,10,30,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 26
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 360,
      background: "#15183A",
      borderRadius: 20,
      padding: "26px 22px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 12
    }
  }, "\u2728"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 17,
      fontWeight: 800,
      marginBottom: 8
    }
  }, "AI \uCABD\uCABD\uC774\uC640 \uB300\uD654"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 13,
      lineHeight: 1.7,
      marginBottom: 20
    }
  }, "\uC544\uB798 \uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uCABD\uCABD\uC774\uC640\uC758 \uB300\uD654\uCC3D\uC774 \uC5F4\uB824\uC694.", /*#__PURE__*/React.createElement("br", null), "(\uD074\uB85C\uB4DC \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD574\uC694 \u2014 \uBB34\uB8CC \uACC4\uC815 \uAC00\uB2A5)"), /*#__PURE__*/React.createElement("a", {
    href: COACH_CHAT_URL,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: () => setAiOpen(false),
    style: {
      display: "block",
      background: "linear-gradient(135deg,#9F7AEA,#7A5BC8)",
      color: "#fff",
      fontSize: 15,
      fontWeight: 800,
      borderRadius: 13,
      padding: "14px 0",
      textDecoration: "none",
      marginBottom: 10
    }
  }, "\uCABD\uCABD\uC774\uC640 \uB300\uD654 \uC2DC\uC791\uD558\uAE30 \u2192"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAiOpen(false),
    style: {
      background: "none",
      border: "none",
      color: "#9AA3C7",
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      padding: "6px 0"
    }
  }, "\uB2EB\uAE30")))));
}

// 코칭 문장의 '아이'를 아이 이름으로 (예: 아이가 → 민준이가). 고문님 어록에는 쓰지 않는다.
function nameize(s, name) {
  if (!name || !s) return s;
  const nm = withName(name);
  return s.replace(/우리 아이/g, "우리 " + nm).replace(/[이그저] 아이/g, nm).replace(/아이(?!들|마다|디)/g, nm);
}

// ── 정적 코칭 — AI 없이 고문님의 되묻기 길을 따라가는 대화 ──
function StaticChat({
  temper,
  kidName,
  onDone,
  onTest
}) {
  const [msgs, setMsgs] = useState(() => [{
    role: "a",
    content: pickOne(COACHLINES.intro)
  }]);
  const [step, setStep] = useState("situ"); // situ → write → emo → ask1 → zerosum → doors → end
  const [situ, setSitu] = useState(null);
  const [input, setInput] = useState("");
  const ans = useRef({}); // 엄마의 답 모음 — 서랍 저장용
  const scRef = useRef(null);
  const taRef = useRef(null);
  useEffect(() => {
    if (scRef.current) scRef.current.scrollTop = scRef.current.scrollHeight;
  }, [msgs, step]);
  // 지난 코칭 기억하기 — 이 아이로 상담한 적이 있으면 인사에 이어붙인다
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!kidName) return;
        const r = await store.get("maum_drawer");
        const list = r && r.value ? JSON.parse(r.value) : [];
        const last = Array.isArray(list) ? list.find(x => x && x.kind === "coaching" && x.child === kidName && x.situLabel) : null;
        if (alive && last) {
          setMsgs([{
            role: "a",
            content: "지난번엔 '" + last.situLabel + "'로 마음 쓰셨죠. 그 뒤로 좀 어떠셨어요?\n오늘은 어떤 일이었나요?"
          }]);
        }
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, []);
  const push = (role, content) => setMsgs(m => [...m, {
    role,
    content
  }]);
  const N = s => nameize(s, kidName); // 아이 이름 입히기
  const needInput = step === "write" || step === "ask1" || step === "zerosum";
  function autosize(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }
  function pickSitu(s) {
    setSitu(s);
    push("u", s.label);
    push("a", N(s.empathy) + "\n\n" + pickOne(COACHLINES.write));
    setStep("write");
  }
  function pickEmo(e) {
    ans.current.emotion = e.k;
    push("u", e.k);
    push("a", e.ack + (e.lens ? "\n\n" + N(e.lens) : "") + "\n\n" + N(situ.ask1));
    setStep("ask1");
  }
  function send() {
    const v = input.trim();
    if (!v) return;
    push("u", v);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    if (step === "write") ans.current.write = v;else if (step === "ask1") ans.current.signal = v;else if (step === "zerosum") ans.current.good = v;
    if (step === "write") {
      push("a", pickOne(COACHLINES.emoLead));
      setStep("emo");
    } else if (step === "ask1") {
      const tmB = TEMPERS.find(x => x.k === temper);
      const tIns = tmB && TINSIGHT[tmB.t] ? "\n\n" + N(TINSIGHT[tmB.t]) : "";
      push("a", N(situ.bridge) + tIns + "\n\n" + N(situ.zeroQ || "그 와중에도 — 요즘 아이가 작게라도 잘한 순간이 하나 있다면, 뭐가 떠오르세요?"));
      setStep("zerosum");
    } else if (step === "zerosum") {
      const PRAISE = {
        bird: "새 기질은 잘한 그 즉시, 들리게 칭찬해 주면 힘이 나요.",
        sky: "하늘 기질은 \u201c어떻게 그런 생각을 했어?\u201d — 생각을 알아주는 칭찬에 힘이 나요.",
        earth: "땅 기질은 결과보다 과정을 — \u201c네가 공부하니까 든든하다\u201d 같은 말에 힘이 나요.",
        seed: "뿌리 기질은 정확하게 알아주는 칭찬 — 부풀리지도 줄이지도 않은 한마디에 힘이 나요."
      };
      const tm = TEMPERS.find(x => x.k === temper);
      const tip = tm ? "\n\n" + PRAISE[tm.t] : "";
      push("a", pickOne(COACHLINES.goodLead) + tip + "\n\n" + pickOne(COACHLINES.doorLead));
      setStep("doors");
    }
  }
  function finish() {
    push("a", pickOne(COACHLINES.closing) + "\n\n\u201c" + situ.quote.t + "\u201d\n— " + situ.quote.d + "\n\n💌 오늘의 코칭은 '마음 서랍'에 담아둘게요. 홈 아래에서 언제든 꺼내 보세요.");
    const tm = TEMPERS.find(x => x.k === temper);
    const tDoor = tm && situ.tDoors ? situ.tDoors[tm.t] : null;
    saveDrawerItem({
      id: Date.now(),
      kind: "coaching",
      situLabel: situ.label,
      temper: temper || null,
      child: kidName || null,
      write: ans.current.write || "",
      emotion: ans.current.emotion || "",
      signal: ans.current.signal || "",
      good: ans.current.good || "",
      doors: [...(tDoor ? [tDoor] : []), ...situ.doors.slice(0, tDoor ? 2 : 3)].map(x => nameize(x, kidName)),
      quote: situ.quote
    });
    addSosGem(kidName, ans.current.good || "");
    setStep("end");
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: CS.scroll,
    ref: scRef
  }, msgs.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
      justifyContent: m.role === "u" ? "flex-end" : "flex-start"
    }
  }, m.role === "a" && /*#__PURE__*/React.createElement("img", {
    src: JJOK_WINK,
    alt: "",
    style: CS.miniAvatar
  }), /*#__PURE__*/React.createElement("div", {
    style: m.role === "u" ? CS.mom : CS.coach
  }, m.content))), step === "situ" && /*#__PURE__*/React.createElement("div", {
    style: SC.chipWrap
  }, SITUATIONS.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.k,
    style: SC.chip,
    onClick: () => pickSitu(s)
  }, s.label))), step === "emo" && /*#__PURE__*/React.createElement("div", {
    style: SC.chipWrap
  }, EMOTIONS.map(e => /*#__PURE__*/React.createElement("button", {
    key: e.k,
    style: SC.chip,
    onClick: () => pickEmo(e)
  }, e.k))), step === "doors" && (() => {
    const tm = TEMPERS.find(x => x.k === temper);
    const tDoor = tm && situ.tDoors ? situ.tDoors[tm.t] : null;
    const tColor = tm ? TYPES[tm.t].color : null;
    return /*#__PURE__*/React.createElement("div", {
      style: SC.doorWrap
    }, tDoor && /*#__PURE__*/React.createElement("div", {
      style: {
        ...SC.door,
        border: `1.5px solid ${tColor}`,
        background: "rgba(255,255,255,0.05)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...SC.doorNum,
        color: tColor
      }
    }, TYPES[tm.t].emoji, " ", temper, " \uAE30\uC9C8 \uB9DE\uCDA4 \uBB38"), N(tDoor), /*#__PURE__*/React.createElement("button", {
      onClick: onTest,
      style: {
        display: "block",
        background: "none",
        border: "none",
        padding: 0,
        marginTop: 8,
        color: tColor,
        fontSize: 11.5,
        cursor: "pointer",
        textDecoration: "underline",
        fontFamily: "inherit"
      }
    }, "'", temper, "' \uAE30\uC9C8 \uB354 \uC54C\uC544\uBCF4\uAE30 \u2192")), situ.doors.slice(0, tDoor ? 2 : 3).map((d, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: SC.door
    }, /*#__PURE__*/React.createElement("span", {
      style: SC.doorNum
    }, "\uBB38 ", i + (tDoor ? 2 : 1)), N(d))), !tDoor && /*#__PURE__*/React.createElement("div", {
      style: {
        color: C.mute,
        fontSize: 12,
        textAlign: "center",
        lineHeight: 1.6,
        padding: "2px 6px"
      }
    }, "\uCC98\uC74C \uD654\uBA74\uC5D0\uC11C \uAE30\uC9C8\uC744 \uC124\uC815\uD558\uBA74, \uC6B0\uB9AC \uC544\uC774 \uACB0(\uC0C8\xB7\uD558\uB298\xB7\uB545\xB7\uBFCC\uB9AC)\uC5D0 \uB531 \uB9DE\uCD98 \uBB38\uC774 \uD568\uAED8 \uC5F4\uB824\uC694."), /*#__PURE__*/React.createElement("button", {
      style: {
        ...CS.primary,
        padding: "13px 28px",
        fontSize: 14.5,
        alignSelf: "center",
        marginTop: 4
      },
      onClick: finish
    }, "\uB9C8\uC74C\uC5D0 \uB2F4\uC558\uC5B4\uC694"));
  })(), step === "end" && /*#__PURE__*/React.createElement("button", {
    style: {
      ...CS.primary,
      padding: "13px 28px",
      fontSize: 14.5,
      alignSelf: "center"
    },
    onClick: onDone
  }, "\uB9C8\uBB34\uB9AC\uD558\uAE30")), needInput && /*#__PURE__*/React.createElement("div", {
    style: CS.inputRow
  }, /*#__PURE__*/React.createElement("textarea", {
    ref: taRef,
    value: input,
    onChange: autosize,
    onKeyDown: e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    placeholder: "\uC5EC\uAE30\uC5D0 \uD3B8\uD558\uAC8C \uC801\uC5B4\uC8FC\uC138\uC694",
    rows: 1,
    style: CS.input
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...CS.sendBtn,
      opacity: input.trim() ? 1 : 0.45
    },
    onClick: send
  }, "\u2191")));
}
const SC = {
  chipWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    padding: "4px 0 8px"
  },
  chip: {
    background: "rgba(242,193,107,0.1)",
    border: "1px solid rgba(242,193,107,0.4)",
    color: C.gold,
    fontSize: 13.5,
    fontWeight: 600,
    borderRadius: 99,
    padding: "10px 16px",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  doorWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: "2px 0 8px"
  },
  door: {
    background: "rgba(143,208,188,0.08)",
    border: "1px solid rgba(143,208,188,0.28)",
    borderRadius: 14,
    padding: "12px 14px",
    color: C.cream,
    fontSize: 13.5,
    lineHeight: 1.65
  },
  doorNum: {
    display: "block",
    color: C.calm,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    marginBottom: 5
  }
};
const COACH_CSS = `
*{box-sizing:border-box;}
@keyframes fadeK{0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);}}
.fade{animation:fadeK .55s ease-out;}
@keyframes ringK{0%,100%{transform:scale(.85);opacity:.5;}50%{transform:scale(1.12);opacity:1;}}
.ring{position:absolute;border-radius:50%;border-width:1px;border-style:solid;}
.ring.r1{width:248px;height:248px;animation:ringK 5.5s ease-in-out infinite;}
.ring.r2{width:300px;height:300px;animation:ringK 5.5s ease-in-out infinite .4s;}
@keyframes dotsK{0%,100%{opacity:.3;}50%{opacity:.9;}}
.dots{letter-spacing:3px;font-size:9px;animation:dotsK 1.1s ease-in-out infinite;color:${C.mute};}
@media (prefers-reduced-motion: reduce){.fade,.ring{animation:none;}}
textarea::placeholder{color:#6b74a0;}
textarea{font-family:inherit;}
@media (min-width: 521px){ .cFrame{ max-width:min(92vw, 1200px) !important; } }
`;
const CS = {
  root: {
    minHeight: "100vh",
    width: "100%",
    background: `radial-gradient(130% 80% at 50% -10%, ${C.night2} 0%, ${C.night} 50%, ${C.deep} 100%)`,
    display: "flex",
    justifyContent: "center",
    padding: "22px 16px 30px",
    boxSizing: "border-box",
    fontFamily: "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,sans-serif"
  },
  frame: {
    width: "100%",
    maxWidth: 440,
    display: "flex",
    flexDirection: "column",
    minHeight: "calc(100vh - 52px)"
  },
  homeBtn: {
    position: "fixed",
    top: 16,
    left: 16,
    zIndex: 10,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: C.cream,
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 12,
    padding: "8px 14px",
    cursor: "pointer",
    backdropFilter: "blur(4px)"
  },
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  },
  avatarWrap: {
    position: "relative",
    width: 132,
    height: 132,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    objectPosition: "50% 50%",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)"
  },
  avatarRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "1.5px solid rgba(242,193,107,0.35)"
  },
  eyebrow: {
    color: C.peach,
    fontSize: 11.5,
    letterSpacing: 6,
    fontWeight: 700,
    marginBottom: 16
  },
  h1: {
    color: C.cream,
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.32,
    marginBottom: 16,
    letterSpacing: -0.3
  },
  sciLine: {
    color: C.mute,
    fontSize: 13.5,
    lineHeight: 1.72,
    maxWidth: 330,
    marginBottom: 22
  },
  card: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    padding: "16px 16px 18px",
    marginBottom: 22,
    backdropFilter: "blur(8px)"
  },
  chooseCard: {
    width: "100%",
    maxWidth: 340,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(242,193,107,0.3)",
    borderRadius: 18,
    padding: "17px 18px",
    marginBottom: 13,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    backdropFilter: "blur(8px)"
  },
  chooseTitle: {
    color: C.cream,
    fontSize: 16.5,
    fontWeight: 800,
    marginBottom: 6
  },
  chooseDesc: {
    color: C.mute,
    fontSize: 12.8,
    lineHeight: 1.6
  },
  temperLabel: {
    color: C.cream,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12
  },
  temperRow: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap"
  },
  chip: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: C.mute,
    fontSize: 13,
    borderRadius: 99,
    padding: "9px 18px",
    cursor: "pointer",
    transition: "all .15s"
  },
  chipOn: {
    background: "rgba(242,193,107,0.16)",
    border: "1px solid rgba(242,193,107,0.55)",
    color: C.gold,
    fontWeight: 700
  },
  primary: {
    background: `linear-gradient(135deg, ${C.gold}, ${C.peach})`,
    color: "#3a2410",
    border: "none",
    borderRadius: 15,
    padding: "16px 40px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(242,193,107,0.22)"
  },
  ghost: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: C.cream,
    borderRadius: 15,
    padding: "14px 28px",
    fontSize: 14.5,
    cursor: "pointer"
  },
  foot: {
    color: C.mute,
    fontSize: 12,
    marginTop: 16,
    opacity: 0.7
  },
  techChip: {
    color: C.calm,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    border: "1px solid rgba(143,208,188,0.3)",
    borderRadius: 99,
    padding: "6px 16px",
    marginBottom: 30
  },
  orbWrap: {
    position: "relative",
    width: 300,
    height: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  orb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "radial-gradient(circle at 42% 36%, rgba(143,208,188,0.62), rgba(143,208,188,0.10) 70%)",
    border: "1px solid rgba(143,208,188,0.42)",
    boxShadow: "0 0 70px rgba(143,208,188,0.3)"
  },
  orbText: {
    position: "relative",
    color: C.cream,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 1
  },
  dots2: {
    display: "flex",
    gap: 8,
    margin: "24px 0 22px"
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    transition: "background .4s"
  },
  chatWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0
  },
  chatHead: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2px 2px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.07)"
  },
  headAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
    objectPosition: "50% 50%",
    border: "1px solid rgba(242,193,107,0.3)"
  },
  coachName: {
    color: C.cream,
    fontSize: 15.5,
    fontWeight: 800
  },
  coachRole: {
    color: C.mute,
    fontSize: 11.5,
    marginTop: 1
  },
  why: {
    background: "rgba(134,182,232,0.12)",
    border: "1px solid rgba(134,182,232,0.3)",
    color: C.sci,
    fontSize: 13,
    borderRadius: 10,
    padding: "7px 12px",
    cursor: "pointer",
    fontWeight: 600
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: C.mute,
    fontSize: 13,
    borderRadius: 10,
    padding: "7px 13px",
    cursor: "pointer"
  },
  sciCard: {
    background: "rgba(134,182,232,0.08)",
    border: "1px solid rgba(134,182,232,0.22)",
    borderRadius: 13,
    padding: "12px 14px",
    color: C.cream,
    fontSize: 12.8,
    lineHeight: 1.65,
    marginTop: 12
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 13,
    padding: "16px 2px"
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    objectFit: "cover",
    objectPosition: "50% 50%",
    flexShrink: 0,
    marginBottom: 2
  },
  coach: {
    background: C.coachB,
    color: C.cream,
    fontSize: 14.5,
    lineHeight: 1.62,
    borderRadius: "4px 16px 16px 16px",
    padding: "12px 15px",
    maxWidth: "78%",
    whiteSpace: "pre-line",
    border: "1px solid rgba(255,255,255,0.06)"
  },
  mom: {
    background: `linear-gradient(135deg, ${C.momB}, #344a86)`,
    color: C.cream,
    fontSize: 14.5,
    lineHeight: 1.62,
    borderRadius: "16px 16px 4px 16px",
    padding: "12px 15px",
    maxWidth: "78%",
    whiteSpace: "pre-line"
  },
  inputRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.07)"
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: "13px 16px",
    color: C.cream,
    fontSize: 15,
    outline: "none",
    resize: "none",
    height: 48,
    lineHeight: 1.45
  },
  sendBtn: {
    width: 48,
    height: 48,
    flexShrink: 0,
    background: `linear-gradient(135deg, ${C.gold}, ${C.peach})`,
    color: "#3a2410",
    border: "none",
    borderRadius: "50%",
    fontSize: 22,
    fontWeight: 800,
    cursor: "pointer"
  },
  recap: {
    display: "flex",
    gap: 7,
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20
  },
  recapTag: {
    background: "rgba(143,208,188,0.12)",
    border: "1px solid rgba(143,208,188,0.3)",
    color: C.calm,
    fontSize: 12.5,
    borderRadius: 99,
    padding: "7px 13px",
    fontWeight: 600
  },
  gemHint: {
    color: C.calm,
    fontSize: 13,
    marginBottom: 24,
    lineHeight: 1.6
  }
};

// ════════════════ 기질 진단 (새·하늘·땅·뿌리) ════════════════

/* 송재희 「몸이 즐거운 체질 학습법」(사상체질 기반) 디지털 진단
   네 유형: 새(소양인·수오지심) / 하늘(태양인·측은지심) / 땅(태음인·사양지심) / 뿌리(소음인·시비지심)
   책의 방식: 유형별 문항 중 해당 개수 ÷ 유형 문항수 × 100 = 백분율, 가장 높은 유형이 그 아이의 체질. (참고용) */

const TC = {
  night: "#0C1230",
  night2: "#16213F",
  deep: "#080C20",
  gold: "#F2C16B",
  cream: "#F4EFE6",
  mute: "#98A2C8",
  line: "rgba(255,255,255,0.09)"
};
const TYPES = {
  bird: {
    name: "새",
    sasang: "소양인",
    sadan: "수오지심",
    emoji: "🐦",
    color: "#FF9E6D",
    essence: "순발력과 순간 집중의 자유로운 새",
    desc: "생각이 빠르고 기발하며, 마음먹으면 짧고 굵게 확 집중해요. 흥미로 확 빠지지만 싫증도 빨라요. 감정이 솔직하게 드러나고, 칭찬과 인정에 크게 힘이 나요. 오래 차분히 앉아 있는 건 잘 못 견뎌요.",
    study: "짧게 끊어 변화를 주며 공부시키세요. 길게 늘이면 싫증 냅니다. 즉시·공개적으로 칭찬하고, 기발한 생각은 “그래, 기발하네!”로 인정해주세요. 단기 집중이 강하니 짧은 목표·벼락치기도 잘 통합니다.",
    doIt: ["짧게 끊어, 자주 변화를 주기", "잘한 즉시 알아주고 칭찬하기", "솔직하게 ‘톡 까놓고’ 대하기", "기발함을 살려주기"],
    avoid: ["오래 앉혀 두고 차분함만 강요", "은근히 떠보거나 숨기는 분위기", "변덕을 두고 다그치기"]
  },
  sky: {
    name: "하늘",
    sasang: "태양인",
    sadan: "측은지심",
    emoji: "☁️",
    color: "#7FB2E8",
    essence: "원리와 의미를 좇는 직관형 몽상가",
    rare: true,
    desc: "‘왜?’가 유난히 많고 큰 질문을 던져요. 세세한 암기보다 전체 원리와 의미를 먼저 알고 싶어 합니다. 직관이 빠르고 상상·공상이 풍부하며, 약한 존재를 아파하는 마음이 깊어요. 아주 드문 유형이에요.",
    study: "암기·반복보다 ‘왜, 원리, 큰 그림’으로 동기를 주세요. 호기심 질문을 반기고, 배우는 것에 의미를 붙여주면 스스로 달려갑니다. 세부 반복은 약하니 다그치기보다 큰 그림부터 보여주세요.",
    doIt: ["‘왜?’ 질문을 환영하고 함께 궁금해하기", "원리·의미·큰 그림 먼저 보여주기", "큰 꿈과 상상을 존중하기"],
    avoid: ["의미 없는 반복 암기 강요", "사소한 현실로 잔소리·다그치기", "엉뚱하다고 면박 주기"]
  },
  earth: {
    name: "땅",
    sasang: "태음인",
    sadan: "사양지심",
    emoji: "🏔️",
    color: "#D2A85C",
    essence: "분위기를 타고 끈기로 가는 현실가",
    desc: "주변 분위기를 잘 타서, 다들 하면 따라 하고 끈기 있게 오래 해냅니다. 겉은 무던해도 속엔 걱정과 생각이 많아요. 꼼꼼히 안 보고 ‘대충대충’ 넘어가 아는 것도 틀릴 때가 있고, 미루는 편이에요.",
    study: "책의 처방은 세 가지예요. ① 산만함과 ② 게으름은 ‘자연스러움’으로 — 공부하는 분위기를 만들고, 새벽에 손잡고 조용히 이야기하듯 이끌기. ③ 대충대충은 ‘테스트’로 — 반드시 옆에서 물어봐 주고 확인해 주세요.",
    doIt: ["공부하는 분위기를 만들어 주기", "옆에서 물어보고 점검(테스트)해 주기", "‘이걸 왜 하는지’ 실용적 이유 주기"],
    avoid: ["닦달하고 몰아붙이기", "점검 없이 방치(대충이 굳어져요)", "분위기 없이 혼자 하라고만 하기"]
  },
  seed: {
    name: "뿌리",
    sasang: "소음인",
    sadan: "시비지심",
    emoji: "🌱",
    color: "#8FD0AC",
    essence: "차근차근 완벽히 쌓는 신중한 씨앗",
    desc: "한 번에 하나씩 완전히 이해해야 넘어가고, 제대로 이해한 건 좀처럼 잊지 않아요. 정리·단계·완성을 중요하게 여기는 신중한 아이예요. 자존심이 강해 한번 상처받으면 오래가고, 서두르게 하면 위축돼요.",
    study: "서두르지 말고 천천히, 확실하고 자세하게 가르치세요. 단계별 완전 학습이 맞고, 한번 이해하면 안 잊는 기억력이 강점입니다. 무엇보다 자신감·자존심을 지켜주는 게 관건 — 인정과 존중이 곧 학습 동기예요.",
    doIt: ["천천히, 하나씩 확실하게", "작은 성취도 알아주며 자존심 지켜주기", "정리·단계를 존중해 주기"],
    avoid: ["서두르게 하거나 비교하기", "많은 양을 한꺼번에 주기", "남들 앞에서 면박 주기"]
  }
};
const ORDER = ["bird", "earth", "seed", "sky"];

// 부모가 아이를 관찰해 체크하는 문항. core=true는 간편판 포함.
const ITEMS = [
// 새 (소양인)
{ t: "bird", c: true, s: "해야 할 일이 생각나면 잘 미루지 못한다. 그래서 부지런하다거나 분주하다는 소리를 듣는 편이다." },
{ t: "bird", c: false, s: "이성보다 감정이 앞서는 편이다. 그렇다고 비현실적인 건 아니어서, 남들은 아니라고 해도 스스로는 상당히 합리적이라고 여긴다." },
{ t: "bird", c: true, s: "마음이 쉽게 변한다. 그러나 일관성을 잃어버리는 것은 아니다." },
{ t: "bird", c: false, s: "한 말이 있더라도 상황이 바뀌면 그 상황에 맞게 생각도 바뀐다. 그래서 변덕스럽다는 소리를 듣기도 한다." },
{ t: "bird", c: false, s: "합리화를 잘한다는 소리를 자주 듣는 편이다." },
{ t: "bird", c: false, s: "무엇이 잘못되면 상황 탓을 많이 하기 때문에, 핑계를 댄다는 소리를 많이 듣는 편이다." },
{ t: "bird", c: true, s: "어떤 일에 쉽게 흥미를 느껴 빠져드는데, 그런 만큼 싫증도 쉽게 내는 편이다." },
{ t: "bird", c: false, s: "자료를 중심으로 생각하기보다, 스스로 생각을 만들어내는 것이 좋다." },
{ t: "bird", c: true, s: "기발한 생각을 한다거나 머리가 좋다는 소리를 많이 듣는 편이다." },
{ t: "bird", c: false, s: "주장을 펼 때는 가상의 예를 많이 들어 이야기한다." },
{ t: "bird", c: false, s: "혼자 있으면 불안하거나 심심해서 사람들을 많이 만나러 다닌다. 친구들도 지금 하는 일과 관련된 사람이 많은 편이다." },
{ t: "bird", c: false, s: "너무 빨리 속단한다는 말을 많이 듣는다. 반대로 지나치게 신중해 상황 판단이 굼뜨거나 소심해서 판단을 유보하는 사람을 보면 정말 답답하다." },
{ t: "bird", c: false, s: "중후함이나 진중함이 없는 것 같아서, 그 부분에 대해 가끔 열등감을 느끼는 편이다." },
{ t: "bird", c: true, s: "대체로 집중력이나 의지력은 약하다. 그러나 순간적인 집중력은 뛰어나서, 하기로 마음먹는 순간 다른 생각은 하나도 하지 않고 그 일만 해 순식간에 끝내버린다. 결국 장기전에는 약해도 단기전에는 강한 편이다." },
{ t: "bird", c: false, s: "시험공부도 벼락치기를 하면 효과가 있는 편이다." },
{ t: "bird", c: true, s: "속으로 느끼는 감정이 겉으로 쉽게 드러난다. 싫은 사람과 있으면 싫은 표정이 금방 나타나고, 좋은 사람과 있으면 좋은 감정이 쉽게 드러난다. 표정이나 목소리에 드러나는 감정을 감추려 애써도 쉽지 않다." },
{ t: "bird", c: true, s: "솔직한 편이다. 툭 터놓고 이야기하는 것을 좋아하고 직설적이다." },
{ t: "bird", c: true, s: "당차다, 잘난 체한다, 잘 나선다, 용감하다는 소리를 많이 듣는 편이다." },
{ t: "bird", c: false, s: "나이를 먹어도 여전히 철이 없다는 소리를, 혹은 젊게 산다는 소리를 듣는 편이다." },
{ t: "bird", c: true, s: "정의롭고 투사의 기질을 타고난 것 같다. 나와 상관없는 일이라도 부당한 것을 보면 쉽게 흥분하고 나서는 편이다." },
{ t: "bird", c: false, s: "때로 경박해 보일 때도 있지만, 대체로 총기 있고 명랑하며 활달한 편이다." },
{ t: "bird", c: true, s: "무대 체질인 것 같다. 사람들에게 끼가 많다는 소리를 듣는 편이다." },
{ t: "bird", c: false, s: "과거에 일어난 사건은 분명하게 기억하는데 그때의 느낌은 잘 기억하지 못한다. 그래서 친구와 심하게 싸웠어도 집에 와 다른 일을 하면 곧 잊고, 다음 날 친구 얼굴을 봐야 다시 생각난다." },
{ t: "bird", c: false, s: "'왜 사람들은 나만 못살게 굴까' 하는 생각을 자주 한다." },
{ t: "bird", c: false, s: "입바른 소리를 잘하지만 뒤끝은 없다." },
{ t: "bird", c: false, s: "사람들에게 리더로 인정받으면 기분이 좋다. 그래서 성적이 별로 좋지 않아도 반장이 되면 '반장의 체면'을 생각해 성적에 신경 쓰고 공부도 하게 된다." },
// 땅 (태음인)
{ t: "earth", c: true, s: "자연스러움을 아주 중요하게 여겨 주변 분위기를 따라가는 편이다. 열심히 공부하려 갔어도 다들 놀고 있으면 함께 놀고, 신나게 놀려고 갔어도 다들 공부하고 있으면 조용히 공부한다." },
{ t: "earth", c: false, s: "분위기 파악을 잘하는 편이다. 그래서 낯선 상황도 처음엔 어색해하지만, 그 분위기에 맞추려 노력하고 대부분 잘 어울린다." },
{ t: "earth", c: false, s: "누군가 나를 믿어주면 상당히 부담을 느끼고, 대체로 그 믿음에 부응하려 애쓰는 편이다. 그래서 부모의 기대가 느껴지면 일단은 공부하려 한다." },
{ t: "earth", c: false, s: "일에 대한 부담감이 많다. 남들은 그것을 책임감이라고 부른다." },
{ t: "earth", c: true, s: "체력이 좋아서(운동신경과는 별개다) 밤을 꼬박 새워도 남들보다 크게 표가 나지 않고 무리도 없다. 그래서 할 일이 많아도 가끔은 미룬다. 밤새워 하면 되기 때문이다." },
{ t: "earth", c: false, s: "원칙과 규칙 중에서 규칙보다 원칙을 중요하게 여긴다. 원칙에 어긋나지만 않는다면, 그것을 지키기 위한 세세한 규칙은 필요에 따라 유연하게 대처할 수 있다고 생각한다." },
{ t: "earth", c: false, s: "일을 할 때 미룰 수 있는 데까지 미루는 경우가 많아, 게으르다는 소리를 많이 듣는 편이다." },
{ t: "earth", c: false, s: "약속은 융통성 있게 지킨다. 5시에 만나기로 했어도, 30분쯤 늦게 가는 것이 자연스러운 자리인지, 30분쯤 먼저 가서 준비하는 것이 좋은 자리인지를 가늠한다." },
{ t: "earth", c: false, s: "여럿이서 일할 때, 내가 맡은 일뿐 아니라 남이 하는 일에도 관심이 많다. 또 가끔은 남의 일까지 떠맡기도 한다." },
{ t: "earth", c: true, s: "내 장점이라면, 성격이 좋고 주변에 사람이 많다는 점이다." },
{ t: "earth", c: true, s: "삶과 인간관계에서 얻은 경험으로 사리를 판단한다. 경험하지 않은 것은 아무리 논리적으로 완벽해도 쉽게 믿지 않는다. 그래서 상대의 말이 일리가 있어도 일단 어떻게 하는지 두고 본다." },
{ t: "earth", c: false, s: "여러 번 약속을 어긴 적 있는 아이가 어느 날 크게 결심하고 \"정말 열심히 할게, 맹세해!\" 해도, 겉으론 수긍하되 속으론 '두고 보면 안다'고 생각한다. 직장 동료나 상사·아랫사람에 대해서도 마찬가지다." },
{ t: "earth", c: true, s: "생각이 비교적 현실적이다. 내게 중요한 것은 현실적으로 쓸모가 있느냐 없느냐라서, 실용적이지 않은 것에는 별로 흥미가 없다. 그래서 '쓸데없는 과목'이라는 생각이 들면 그 과목은 공부하기가 정말 싫어진다." },
{ t: "earth", c: false, s: "한번 공부에 취미를 잃으면 여간해선 다시 흥미를 붙이기 어렵다. 부모의 기대를 생각하면 억지로라도 하게 되지만, 부담 때문에 억지로 하면 죽도록 노력해도 그 과목 성적은 잘 오르지 않는다." },
{ t: "earth", c: false, s: "무언가 하기 싫어지면, 꼬치꼬치 이유를 대며 고집부리는 것이 아니라 그냥 하지 않고 버틴다." },
{ t: "earth", c: false, s: "잘못한 사람이 사과하면 이런 생각이 든다. '어쩌겠어, 내가 이해해야지. 다 나름의 사정이 있겠지. 먹고살자고 한 일인데 아웅다웅해봤자 서로 상처만 주지.'" },
{ t: "earth", c: false, s: "여행을 가면 아름다운 풍경도 좋지만, 그곳 사람들이 사는 모습이 더 재미있어서 동네 집이나 시장 구경을 더 좋아한다." },
{ t: "earth", c: false, s: "솔직하지 못한 편이다. 그래서 가끔은 다른 사람을 배려하느라 거짓말을 하기도 한다." },
{ t: "earth", c: false, s: "내 경험을 잣대로 사물을 판단하는 성향 때문인지, 어지간한 것은 마음속으로 미리 단정해버리는 경향이 있다. 물론 그것을 남 앞에서 드러내지는 않는다." },
{ t: "earth", c: true, s: "머릿속에 온갖 생각이 두서없이 끊임없이 일어난다. 생각이 많아도 헷갈리지는 않고, 다만 복잡해서 정리가 안 될 뿐이다. 성적이 조금 떨어지면 '어떻게 올리지'부터 다음 시험·고등학교·대학·앞날 걱정까지, 답도 없는 생각이 꼬리에 꼬리를 문다." },
{ t: "earth", c: true, s: "동시에 두 가지 이상의 일이나 생각을 할 수 있다. 전화하면서 TV를 보고, 강의를 들으며 집안일을 생각하는 식이다. 하나씩 빠르게 옮겨 다니는 사람들과 달리, 나는 진짜로 한꺼번에 동시에 한다." },
{ t: "earth", c: true, s: "어찌 보면 묵직하고 중후하며 심지가 깊어 보이지만, 또 어찌 보면 우유부단하고 무거워 보이기도 한다. 우유부단해 보이는 것은, 이 사람 저 사람이 걸리고 이런저런 생각이 많아서다." },
{ t: "earth", c: true, s: "남들은 내가 속으로 무슨 생각을 하는지 잘 모르는 것 같다. 한마디로 내 속마음은 겉으로 잘 드러나지 않는 편이다." },
{ t: "earth", c: false, s: "사고방식이 멀티형이다. 한 가지를 생각하려 하면 그와 얽힌 여러 문제가 함께 떠오른다. 이런 생각을 말하면 누구는 대단하다 하고, 누구는 지나친 걱정이라 한다. 그래서 전화 한 통 거는 데도 '상대가 지금 자거나 바빠 받기 어려우면 어쩌지' 싶어 한참을 고민한다." },
{ t: "earth", c: true, s: "무언가 결정해야 할 때 너무 많은 것이 떠올라 걱정이다. 그래서 결론을 쉽게 내리지 못하는 편이다." },
{ t: "earth", c: false, s: "시험을 볼 때 출제 의도를 너무 깊이 파고들다 틀리는 경우가 많다. '5점짜리가 왜 이렇게 쉽지?' '왜 1번 답이 연달아 다섯 개나 나오지?' 같은 의심이 들기 때문이다." },
// 뿌리 (소음인)
{ t: "seed", c: true, s: "고집이 센 편이다." },
{ t: "seed", c: false, s: "관심 있는 일에 깊이 몰두할 때는, 다른 것은 거의 생각나지 않는 편이다." },
{ t: "seed", c: true, s: "두 가지 일을 한꺼번에 하지 못한다. 한 번에 하나씩 해야 헷갈리지 않는다." },
{ t: "seed", c: true, s: "정리를 좋아한다기보다, 정리하지 않으면 마음이 어수선해서 귀찮아도 늘 정리한다. 단 관심 있는 것만 그렇다. 책에 관심 가면 책만, 옷에 관심 가면 옷만 정리하고, 그 밖의 것은 아무렇게나 쌓아둔다." },
{ t: "seed", c: false, s: "어떤 일이든 시작 전에 반드시 스스로를 정리해야 한다. 정리가 안 된 채로 시작하면, 도중에 내가 뭘 하고 있는지 모를 때가 있다." },
{ t: "seed", c: false, s: "한 가지 관심에 집중하는 편이라, 관심 있는 일에 몰두할 수 있다면 혼자여도 즐겁다." },
{ t: "seed", c: false, s: "가끔 이기적이라는 소리를 듣기도 하고, 그런 소리를 들을까 봐 신경이 쓰인다." },
{ t: "seed", c: true, s: "사람을 사귈 때, 적은 수를 깊이 있게 사귀는 편이다." },
{ t: "seed", c: false, s: "처음 만나거나 친하지 않은 사람과는 어색해서 어떻게 대해야 할지 잘 모르겠다. 그러나 평소 조용해도 아주 친한 사이에는 수다스러워진다." },
{ t: "seed", c: true, s: "'나는 왜 이럴까, 왜 그때 그런 생각을 못 했을까, 왜 그렇게 행동했을까, 내가 뭘 잘못한 거지, 뭘 고쳐야 하지' 하는 생각을 많이 한다. 후회라기보다 자기 성찰과 반성에 가깝다." },
{ t: "seed", c: false, s: "관심 있는 분야에 대해서는 마니아 기질이 있다는 소리를 듣는 편이다." },
{ t: "seed", c: false, s: "답답하다거나 융통성이 없다는 소리를 자주 듣는다." },
{ t: "seed", c: false, s: "끊임없이 자신을 돌아본다. 많은 시간을 나 자신에 대해 생각한다." },
{ t: "seed", c: true, s: "한번 받은 상처나 두려움은 여간해선 잊히지 않는다. 잊으려 애써 이제는 잊은 줄 알았는데도, 어느 순간 과거의 악몽이 유령처럼 되살아난다." },
{ t: "seed", c: false, s: "신중하려는 내 모습을, 경우에 따라 소심하다고 보는 사람도 있다." },
{ t: "seed", c: true, s: "잘 긴장하는 편이고, 긴장하면 아무 일도 못 한다." },
{ t: "seed", c: true, s: "새로운 것을 배울 때, 완전히 익혀야만 배웠다고 느끼고 처음부터 차근차근 단계별로 배워야 한다." },
{ t: "seed", c: true, s: "낯선 곳에 가는 것이 어색하고 싫다. 특히 아는 사람이 한 명도 없는 낯선 모임은 되도록 가지 않으려 한다. 그러나 내가 할 일이 분명한 곳이라면 괜찮다." },
{ t: "seed", c: false, s: "'작은 규칙을 성실히 지켜 나갈 때 큰 원칙도 지켜지는 것이 아닐까' 하고 생각한다." },
{ t: "seed", c: false, s: "남(나를 뺀 모든 사람)에게 피해를 주고 싶지도, 피해를 받고 싶지도 않다." },
{ t: "seed", c: true, s: "약속한 것은 곧이곧대로, 융통성이나 변명의 여지 없이 다 지키려 한다. 그래서 맡은 책임은 반드시 완수하고, 완수하지 못하면 심한 자책감을 느낀다." },
{ t: "seed", c: false, s: "충분히 이해하고 소화한 것은 절대 잊어버리지 않는다." },
{ t: "seed", c: false, s: "여행을 가서 좋은 풍경을 만나면, 5분이고 10분이고 풍경만 바라보는 경우가 많다." },
{ t: "seed", c: false, s: "사람들에게 꿈이 소박하다는 소리를 자주 듣는 편이다." },
{ t: "seed", c: false, s: "인사치레를 잘 못 하는 편이다. '언제 술 한잔, 차 한잔 하자' 같은 말을 쉽게 못 하는데, 말했으면 진짜로 그 자리를 만들어야 한다고 여겨서, 내키지 않는 사람에게는 그런 빈말을 못 한다." },
// 하늘 (태양인)
{ t: "sky", c: true, s: "정말 모든 일에 관심이 많다. 세상에서 일어나는 일은 물론, 저 먼 우주에서 일어나는 일, 땅속에서 일어나는 일까지도." },
{ t: "sky", c: false, s: "아주 작은 일부터 큰일까지, 모든 일에 대한 원리적 호기심이 왕성하다." },
{ t: "sky", c: true, s: "내가 하는 말을 이상하게도 사람들이 잘 못 알아듣는다. 그럴 때는 답답하기보다 슬프다." },
{ t: "sky", c: false, s: "사람들이 내 말을 주의 깊게 들어주지 않으면 슬퍼진다." },
{ t: "sky", c: false, s: "머리가 좋은 것 같다. 심지어 내가 천재가 아닐까 하는 생각도 자주 한다." },
{ t: "sky", c: true, s: "사태를 논리적으로 추론하기보다, 직관으로 인식하는 것 같다." },
{ t: "sky", c: false, s: "현학적이라는 소리를 많이 듣는다." },
{ t: "sky", c: false, s: "사물의 본질을 한눈에 파악할 수 있다." },
{ t: "sky", c: true, s: "가끔 귀신이나 우주인 같은 정신적인 존재와 대화를 나눈다. 그런 신비한 힘을 실제로 믿고 잘 이해하고 있다. 이런 나를 사람들은 두려운 눈으로 보거나, 이상하다는 듯 바라보며 당황해하기도 한다." },
{ t: "sky", c: false, s: "차별하는 것이 제일 싫다. 사람도 바이러스도 똑같이 소중한 생명체다." },
{ t: "sky", c: true, s: "길거리에 굴러다니는 비닐봉지를 보면 슬퍼진다. 지구의 미래, 또는 인류의 미래가 걱정되기 때문이다." },
{ t: "sky", c: false, s: "TV 다큐멘터리에서 남극의 펭귄 같은 동물이 잔혹하게 죽임당하는 장면을 보면, 너무 슬퍼서 눈물이 난다." },
{ t: "sky", c: false, s: "언제나 책임감 있게 일을 하는데도, 다른 사람들은 내게 책임감이 없다고 한다." },
{ t: "sky", c: true, s: "늘 슬픔을 간직하고 사는 것 같다." },
{ t: "sky", c: true, s: "내게는 한국 사람과 미국 사람이 크게 다르지 않다. 나는 세계인이기 때문이다." },
{ t: "sky", c: true, s: "나는 어딘가 외계에서 온 사람이 아닐까 하는 생각이 든다." },
{ t: "sky", c: true, s: "사람들이 왜 사소한 것에 연연하는지 잘 이해가 안 간다. 그래서 세상 사람들의 말을 잘 못 알아듣는다." },
{ t: "sky", c: false, s: "세상 모든 사람이 다 불쌍하다. 내게는 용서 못 할 사람이 없다." },
{ t: "sky", c: false, s: "지금까지 살면서 한 번도 폭력을 쓴 적이 없다." },
{ t: "sky", c: false, s: "판단을 영감에 많이 의존한다." },
{ t: "sky", c: false, s: "나는 본질적으로 철학자의 운명을 타고난 것 같다." },
{ t: "sky", c: true, s: "나를 몽상가라고 말하는 사람이 많다." },
{ t: "sky", c: false, s: "하고 싶은 일이 무척 많고, 하고 싶은 일이 떠오르면 그냥 해버린다." },
{ t: "sky", c: false, s: "낯선 곳에서도 겁이 나지 않는다." },
{ t: "sky", c: false, s: "연애와 친구의 경계가 없다." },
];

// 결정 문항 — 같은 상황에서 네 결이 갈리는 장면 (변별력 높음, 점수 가중 큼)
const CHOICES = [{
  q: "다들 노는데(혹은 다들 공부하는데) 우리 아이는?",
  opts: [{
    t: "earth",
    s: "그냥 분위기를 따라가요. 혼자 튀지 못해요."
  }, {
    t: "bird",
    s: "“지금 뭐 해, 같이 ○○하자!” 분위기를 바꿔요."
  }, {
    t: "seed",
    s: "남들이 와주길 바라며 혼자 조용히 해요."
  }, {
    t: "sky",
    s: "분위기와 상관없이 자기 생각에 빠져 있어요."
  }]
}, {
  q: "“이거 왜 배워?”에 “대학 가려고”라고 답하면?",
  opts: [{
    t: "earth",
    s: "“그럼 이거 어디다 써먹어?” 납득 안 되면 손 놔요."
  }, {
    t: "bird",
    s: "“아~” 하고 별 생각 없이 넘어가요."
  }, {
    t: "seed",
    s: "납득되면 차근차근, 안 되면 끝까지 따져요."
  }, {
    t: "sky",
    s: "“근데 애초에 왜 대학을 가?” 본질을 물어요."
  }]
}, {
  q: "평소보다 시험을 못 봤는데 “그래도 잘했어” 하면?",
  opts: [{
    t: "seed",
    s: "속으로 ‘날 우습게 보나’ 하고 상처받아요."
  }, {
    t: "bird",
    s: "“엄마가 날 잘 모르네” 하고 금방 잊어요."
  }, {
    t: "earth",
    s: "이런저런 걱정이 한꺼번에 밀려와 막막해해요."
  }, {
    t: "sky",
    s: "점수 자체엔 별 관심이 없어요."
  }]
}, {
  q: "혼자 공부하는 모습은?",
  opts: [{
    t: "earth",
    s: "느슨하게(딴짓 섞어) 하지만 결국 끝까지 해내요."
  }, {
    t: "seed",
    s: "방문 닫고 계획표대로 차근차근 해요."
  }, {
    t: "bird",
    s: "짧고 굵게 집중하고 바로 놀아요. 오래는 못 앉아요."
  }, {
    t: "sky",
    s: "한 가지 큰 의문에 꽂히면 시간 가는 줄 몰라요."
  }]
}, {
  q: "잘 안 풀려 좌절했을 때 회복하는 법은?",
  opts: [{
    t: "seed",
    s: "왜 틀렸는지 논리적으로 납득시켜야 해요."
  }, {
    t: "bird",
    s: "기분만 띄워주면 금방 다시 신나요."
  }, {
    t: "earth",
    s: "푹 가라앉아서, 시간을 두고 자연스럽게 풀려요."
  }, {
    t: "sky",
    s: "의미·이유를 찾아주면 다시 움직여요."
  }]
}, {
  q: "가장 힘이 나는 말은?",
  opts: [{
    t: "earth",
    s: "“믿어. 네가 하려는 그 마음이 중요해.”"
  }, {
    t: "bird",
    s: "“넌 정말 멋지다, 대단해!”"
  }, {
    t: "seed",
    s: "“네 실력 내가 알아. 네 말이 맞아.”"
  }, {
    t: "sky",
    s: "“어떻게 그런 생각을 다 했어?”"
  }]
}, {
  q: "무언가를 시키면?",
  opts: [{
    t: "seed",
    s: "단계·규칙이 분명해야 안심하고 따라요."
  }, {
    t: "bird",
    s: "시키는 대로는 싫고 자기 방식대로 하려 해요."
  }, {
    t: "earth",
    s: "분위기 따라 하지만, 억지로는 죽어도 안 해요."
  }, {
    t: "sky",
    s: "시키는 것 자체에 “왜?”를 먼저 물어요."
  }]
}, {
  q: "여럿 앞에 나서는 상황에서?",
  opts: [{
    t: "bird",
    s: "나서서 설명하고 주목받는 걸 즐겨요."
  }, {
    t: "seed",
    s: "나서기보다 조용히 인정받고 싶어 해요."
  }, {
    t: "earth",
    s: "분위기 봐서 맞추고 튀지 않으려 해요."
  }, {
    t: "sky",
    s: "엉뚱하지만 본질을 찌르는 말을 해요."
  }]
}];

// 오늘부터 한 가지 — 결과를 행동으로 잇는 첫 걸음
const TODAY = {
  earth: {
    main: "오늘은 “공부 안 하니?” 한마디를 참아 보세요. 아이의 자연스러움이 살아나요.",
    more: ["공부하는 모습을 보면 “네가 공부하니까 든든하다” 한 번.", "공부한 다음엔 가볍게 한 번 물어봐 주세요(대충대충은 테스트로만 잡혀요)."]
  },
  seed: {
    main: "오늘 아이가 하는 말 한마디를, 끊지 말고 끝까지 진지하게 들어 주세요.",
    more: ["‘정확히 알아주는’ 칭찬 한 번 — “네 실력 엄마가 알아.”", "내일 계획 한 줄을 아이와 같이 세워 보세요."]
  },
  bird: {
    main: "오늘은 “이것만 하고 놀자” — 아주 짧게 끊어 주세요. 끝나면 약속대로 놀게요.",
    more: ["“엄마한테 문제 두 개만 내봐” 하고 멍석을 깔아 주세요.", "잘난 척 한 번을 그대로 받아 주세요 — “그래, 너 멋지다!”"]
  },
  sky: {
    main: "오늘 아이의 ‘왜?’에 답을 주지 말고 “넌 어떻게 생각해?” 하고 되물어 보세요.",
    more: ["엉뚱한 생각에 “어떻게 그런 생각을 다 했어?” 한 번.", "세부보다 큰 그림부터 — 무엇을 배우는지 ‘의미’를 먼저 이야기해 주세요."]
  }
};

// 부모 결 × 아이 결 — 영향(잘 맞는 점·부딪히는 점)과 방법까지 (책의 부모 묘사 × 아이 챕터 교차)
const COMBO = {
  seed_earth: {
    fit: "엄마의 꼼꼼함은 이 아이의 최대 약점인 ‘대충대충’을 잡아줄 최고의 자산이에요. 책이 권하는 ‘공부 뒤 물어봐주는 테스트’에 가장 잘 맞는 부모예요.",
    clash: "책의 실제 사례가 바로 이 조합이에요 — 상황과 분위기로 사는 아이를 논리로 조목조목 따지면(“약속했잖아, 앞뒤가 맞아야지”) 아이는 숨이 막혀요. 엄마의 시간표·규칙을 강요하면 아이의 ‘자연스러움’이 깨지고, 아이는 다 알면서도 못 하는 상태가 돼요.",
    how: ["따지고 싶을 때 한 박자 멈추세요. ‘오늘 할 양’(원칙)만 정하고, 언제·어떤 순서로 할지(규칙)는 아이에게 맡겨요.", "엄마의 꼼꼼함은 ‘확인’에 쓰세요 — 공부가 끝나면 시험 보듯 가볍게 물어봐 주기. 대충 넘어간 구멍이 거기서 잡혀요.", "책의 그 사례처럼, 일주일만 잔소리 대신 “네가 하려는 마음을 믿어”를 실험해 보세요. 그 믿음이 성적을 올렸어요."]
  },
  seed_seed: {
    fit: "서로를 가장 깊이 이해할 수 있는 짝이에요. 계획 세우기·단계 밟기를 같이 하면 둘 다 안정감을 느껴요.",
    clash: "둘 다 기준과 자존심이 분명해서, ‘누가 맞는지’를 가리기 시작하면 서로 깊게 다쳐요. 엄마의 기준으로 아이의 기준을 누르면, 아이는 절대 말로 표현하지 않고 속으로만 삭여요 — 그게 더 위험해요.",
    how: ["하루 한 번 “네 말이 맞네”를 일부러 만드세요. 이 아이에겐 백 마디 계획보다 커요.", "칭찬은 ‘정확하게’만 — 과대평가(“넌 100점 맞을 애야”)도 과소평가(“80점도 잘했어”)도 이 아이에겐 독이에요.", "계획은 아이가 세우게 하고, 엄마는 지키도록 곁에서 돕기만 하세요."]
  },
  seed_bird: {
    fit: "엄마의 형식·마무리 능력이 새의 약점(시작은 화려, 끝이 흐림)을 정확히 보완해요.",
    clash: "촘촘한 계획표와 규칙으로 묶으면 날개가 꺾여요. 아이의 즉흥 아이디어를 “쓸데없는 짓”으로 자르는 순간, 책이 말한 창의·실험정신이 죽어요.",
    how: ["큰 틀 하나만(“오늘 이것만 끝내자”) — 방법과 순서는 아이 멋대로 하게 두세요.", "엉뚱한 시도엔 “어떻게 그런 생각을 했어?”가 먼저, 교정은 그 다음에요.", "짧게 끝나면 약속대로 놀게 해주세요. 그 약속을 지키는 일만큼은 엄마의 엄격함을 쓰세요 — 새에겐 그게 ‘명분’이에요."]
  },
  seed_sky: {
    fit: "엄마의 단계·세부 능력이 이 아이의 가장 약한 부분(현실·디테일)을 받쳐줄 수 있어요.",
    clash: "현실 기준으로 몽상을 재단하면(“그게 말이 되니?”) 아이의 가장 큰 재산인 ‘본질을 보는 직관’이 닫혀요.",
    how: ["아이의 ‘왜?’에 논리로 반박하지 말고 같이 궁금해해 주세요.", "역할을 나누세요 — 큰 그림은 아이가, 일정·준비물은 엄마가.", "비현실적인 꿈도 일단 “재밌다, 더 말해봐”. 평가는 한참 뒤에요."]
  },
  earth_seed: {
    fit: "엄마의 느긋함은 예민하고 긴장 많은 이 아이에게 좋은 안전기지가 돼요.",
    clash: "아이의 꼬치꼬치 질문과 세세한 말이 피곤해서 흘려듣기 쉬워요. 그 순간 아이는 ‘무시당했다’고 느끼고 깊게 다쳐요 — 이 아이는 한마디를 열 번 곱씹고 꺼내거든요. 두루뭉술한 칭찬도 이 아이에겐 독이에요.",
    how: ["아이가 말할 땐 하던 일을 멈추고, 눈을 보며 끝까지 들어 주세요. 그게 이 아이의 ‘존중’이에요.", "계획표는 같이 앉아서 구체적으로 — “알아서 해” 하면 이 아이는 오히려 불안해요.", "칭찬은 사실 그대로, 정확하게. “네 실력 엄마가 알아” 한마디면 충분해요."]
  },
  earth_earth: {
    fit: "분위기로 통하는 짝이에요. 말하지 않아도 서로의 마음을 읽어요 — 그 자체가 큰 자산이에요.",
    clash: "책이 정확히 짚어요 — 태음 엄마는 아이와 똑같이 걱정만 한다고요(‘과외를 해야 하나, 학원을 옮겨야 하나…’). 걱정이 둘이 되면 늪이에요. 해결은 안 하고 미루기도 둘이서 해요.",
    how: ["걱정을 입 밖에 내는 대신 분위기 하나를 바꾸세요 — 거실에 공부등 켜기, 같이 책 읽는 30분. 이 아이(그리고 엄마)는 분위기로 움직여요.", "결과 이야기 대신 “네가 공부하니까 든든하다” — 과정의 말을 쓰세요.", "확인은 잔소리가 아니라 ‘물어봐주기 테스트’로 — 대충대충은 그렇게만 잡혀요."]
  },
  earth_bird: {
    fit: "느긋한 엄마라 새를 억압하지 않는 것 — 그게 이 조합의 최고 장점이에요. 새에게 억압은 독이거든요.",
    clash: "진득함을 기대하면 서로 답답해요. 아이의 들쑥날쑥이 걱정거리가 되어 한숨이 늘면, 분위기에 민감한 새는 그걸 금방 느끼고 기가 죽어요.",
    how: ["‘짧고 굵게’를 이 아이의 정상 속도로 인정하세요. 끝낸 만큼 그 자리에서 바로 인정해 주고요.", "걱정 대신 무대를 깔아 주세요 — “엄마한테 설명해 줘봐, 네가 선생님이야.”", "아플 땐 공부를 접으세요. 새는 참을성이 가장 약한 결이라, 버티게 하기보다 빨리 낫게 돕는 게 상책이에요."]
  },
  earth_sky: {
    fit: "엄마의 느긋함이 몽상가 아이에게 숨 쉴 틈을 줘요. 다그치지 않는 것만으로 절반은 성공이에요.",
    clash: "현실적인 엄마의 “그게 어디에 쓰여?”가 아이의 큰 그림을 꺾어요. 걱정스러운 눈빛도 아이는 다 느껴요.",
    how: ["쓸모를 묻기 전에, 아이가 보는 그림을 끝까지 들어 주세요.", "세부(준비물·시간·일정)는 묻지 말고 조용히 챙겨 주세요 — 이 아이의 빈 곳이에요.", "“네 생각 참 크다” — 이 한마디를 자주요."]
  },
  bird_seed: {
    fit: "엄마의 밝은 에너지가 긴장 많은 아이의 공기를 풀어줄 수 있어요.",
    clash: "즉흥적인 농담·과장 칭찬이 이 아이에겐 오래 남는 상처나 부담이 돼요(“넌 천재야”는 격려가 아니라 불안이에요). 엄마의 변덕이 아이가 기대는 ‘형식과 약속’을 흔들어요.",
    how: ["칭찬 전에 한 박자 — 부풀리지 말고 정확하게요.", "약속과 일정은 적어서 지키세요. 이 아이의 안정은 거기서 나와요.", "아이 말을 중간에 자르지 말고 끝까지 — 열 번 곱씹고 꺼낸 말이에요."]
  },
  bird_earth: {
    fit: "분위기 메이커 엄마 — 집안에 ‘공부하는 분위기’를 만들 수 있는 최고 적임자예요. 이 아이는 분위기로 공부하거든요.",
    clash: "신나서 던진 “공부 안 하니?” 한마디가 막 공부하려던 아이의 자연스러움을 깨요(책의 장면 그대로요). 즉흥적으로 방식을 자주 바꾸면 경험으로 사는 이 아이는 적응을 못 해요.",
    how: ["그 한마디를 참고, 대신 거실 분위기를 만드세요 — 엄마가 먼저 책을 펴는 식으로요.", "한번 정한 방식은 며칠은 유지하세요. 자주 바꾸면 아이는 어색해져요.", "결과에 호들갑 떨기보다 과정을 담백하게 인정해 주세요 — “든든하다” 정도가 딱 좋아요."]
  },
  bird_bird: {
    fit: "세상에서 제일 신나는 짝이에요! 같이 무대 만들고, 같이 발표 놀이하고 — 이 아이의 ‘멍석’을 깔아줄 수 있는 엄마예요.",
    clash: "시작은 화려한데 마무리가 둘 다 약해요. 둘 다 변덕이면 약속이 증발하고, 새에게 약속(명분)이 무너지면 다음이 없어요.",
    how: ["‘끝났다’를 선언하는 의식을 만드세요 — 체크판에 도장 하나라도요.", "약속한 보상은 무슨 일이 있어도 지키세요. 새의 세계는 명분으로 돌아가요.", "경쟁보다 응원 — 서로 추켜세우는 짝이 되면 둘 다 날아올라요."]
  },
  bird_sky: {
    fit: "감각 있는 엄마라 아이의 엉뚱함을 재미있어해 줄 수 있어요 — 이 아이에게 그건 귀한 선물이에요.",
    clash: "엄마의 빠른 템포로 재촉하기 쉬운데, 아이는 멍한 게 아니라 본질을 보는 중이에요. 농담으로 몽상을 놀리면 입을 닫아요.",
    how: ["아이의 느린 생각을 기다려 주세요 — 침묵이 일이에요.", "“어떻게 그런 생각을 다 했어?”를 농담이 아니라 진심으로요.", "‘아이의 이론을 들어주는 밤’을 만들어 보세요 — 무대가 아니라 청중이 필요한 아이예요."]
  },
  sky_earth: {
    fit: "원리를 보는 엄마라 아이에게 ‘왜 배우는지’를 이야기해줄 수 있어요 — 이 아이에게 꼭 필요한 부분이에요.",
    clash: "다만 이 아이는 원리보다 ‘쓸모’를 물어요. 엄마의 큰 이야기가 아이에겐 막연하게 들릴 수 있어요.",
    how: ["원리보다 ‘어디에 쓰이는지’부터 — 수학사 같은 주변 이야기에서 핵심으로요.", "큰 이야기 뒤엔 반드시 ‘오늘 할 일 하나’로 착지시켜 주세요.", "결과보다 과정을 인정하는 말 한마디를 잊지 마세요."]
  },
  sky_seed: {
    fit: "‘왜?’를 아는 엄마라, 아이의 깊은 질문을 귀하게 여겨줄 수 있어요.",
    clash: "큰 그림만 던지면 단계가 필요한 이 아이는 불안해요. 추상적인 요구(“본질을 봐”)는 이 아이에겐 막막함이에요.",
    how: ["계획표를 같이, 구체적으로 짜 주세요 — 단계가 이 아이의 안정이에요.", "질문엔 구체적으로 답하거나, 같이 찾아 주세요. 얼버무림은 ‘무시’로 느껴져요.", "인정은 정확하게 — “네가 3단원까지 끝낸 거 알아.”"]
  },
  sky_bird: {
    fit: "이상을 보는 엄마와 무대를 사는 아이 — 아이의 도전을 크게 응원해줄 수 있는 짝이에요.",
    clash: "이상을 이야기하면 아이는 듣다 날아가요. 새에겐 멀리 있는 별보다 눈앞의 무대가 필요해요.",
    how: ["작게 끊어 무대를 만드세요 — “이것만 하고 발표해 줘.”", "칭찬은 화끈하게, 그 자리에서요.", "할 동안만 옆에 있어 주세요(몸의 통제). 길게 말고 짧게요."]
  },
  sky_sky: {
    fit: "둘 다 아주 드문 결 — 서로의 ‘왜?’를 알아듣는, 세상에 흔치 않은 귀한 짝이에요.",
    clash: "둘 다 세부가 증발해요. 준비물·일정·마감 같은 현실이 같이 무너질 수 있어요.",
    how: ["현실은 사람 말고 시스템에 맡기세요 — 달력·알림·체크리스트.", "일주일에 한 번 ‘현실 점검 10분’을 같이 하세요.", "둘의 깊은 대화 시간은 이 조합의 보물이에요 — 그 시간만은 꼭 지키세요."]
  }
};
function parentize(s) {
  return s.split("우리 아이").join("나");
}

// 대문 — 네 결이 한 풍경에 사는 장면
const HERO_LINES = {
  sky: "단번에 본질을 보는, 가장 드문 아이",
  bird: "짧고 빛나게 — 무대에서 크는 아이",
  earth: "분위기로 공부하는, 믿는 만큼 크는 아이",
  seed: "존중받을 때 당당해지는, 꼼꼼한 아이"
};
const HERO_POS = {
  bird: {
    cx: 23.5,
    cy: 27,
    r: 14
  },
  sky: {
    cx: 72,
    cy: 27,
    r: 14
  },
  earth: {
    cx: 35,
    cy: 65,
    r: 14
  },
  seed: {
    cx: 54,
    cy: 62,
    r: 10
  }
};
function HeroScene({
  onStart
}) {
  const cycle = ["sky", "bird", "earth", "seed"];
  const [focus, setFocus] = useState("earth");
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (locked) return;
    const t = setInterval(() => setFocus(f => cycle[(cycle.indexOf(f) + 1) % 4]), 3000);
    return () => clearInterval(t);
  }, [locked]);
  const pick = t => {
    setFocus(t);
    setLocked(true);
  };
  const F = TYPES[focus];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: TS.heroBox
  }, /*#__PURE__*/React.createElement("img", {
    src: HERO_BG,
    alt: "\uB124 \uAC00\uC9C0 \uACB0\uC774 \uC0AC\uB294 \uBC24 \uD48D\uACBD",
    style: TS.heroBg
  }), cycle.map(t => {
    const p = HERO_POS[t],
      on = focus === t;
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => pick(t),
      "aria-label": TYPES[t].name,
      style: {
        position: "absolute",
        left: p.cx + "%",
        top: p.cy + "%",
        width: p.r * 2 + "%",
        aspectRatio: "1",
        transform: "translate(-50%,-50%)",
        borderRadius: "50%",
        border: on ? `2px solid ${TYPES[t].color}` : "2px solid transparent",
        background: on ? `radial-gradient(circle, ${TYPES[t].color}33 0%, ${TYPES[t].color}14 45%, transparent 70%)` : "transparent",
        boxShadow: on ? `0 0 22px ${TYPES[t].color}aa` : "none",
        cursor: "pointer",
        transition: "all .5s ease",
        padding: 0
      }
    });
  })), /*#__PURE__*/React.createElement("div", {
    key: focus,
    className: "fade",
    style: TS.heroLine
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: F.color,
      fontWeight: 800,
      fontSize: 15.5,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Cico, {
    type: focus,
    size: 22
  }), " \u2018", F.name, "\u2019 \uAC19\uC740 \uC544\uC774"), /*#__PURE__*/React.createElement("div", {
    style: TS.heroLineTxt
  }, HERO_LINES[focus])), /*#__PURE__*/React.createElement("div", {
    style: TS.heroTapHint
  }, "\uD48D\uACBD \uC18D \uB124 \uAC00\uC9C0 \uACB0\uC744 \uB20C\uB7EC \uC0B4\uD3B4\uBCF4\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4"), /*#__PURE__*/React.createElement("button", {
    style: TS.heroCta,
    onClick: onStart
  }, "\uC6B0\uB9AC \uC544\uC774 \uACB0 \uC54C\uC544\uBCF4\uAE30"));
}

// 부모×아이 조합 — 영향(잘 맞아요/부딪혀요) + 방법
function ComboBlock({
  p,
  c,
  pName,
  cName
}) {
  const D = COMBO[`${p}_${c}`];
  if (!D) return null;
  const PT = TYPES[p],
    CT = TYPES[c];
  return /*#__PURE__*/React.createElement("div", {
    style: TS.comboCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.comboHead,
      display: "flex",
      alignItems: "center",
      gap: 4,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Cico, {
    type: p,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6
    }
  }, "\xD7"), /*#__PURE__*/React.createElement(Cico, {
    type: c,
    size: 20
  }), " ", /*#__PURE__*/React.createElement("span", null, pName, "(", PT.name, ") \xD7 ", withName(cName), "(", CT.name, ")")), /*#__PURE__*/React.createElement("div", {
    style: TS.comboSecH
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#8FD0AC"
    }
  }, "\u2713 \uC798 \uB9DE\uC544\uC694")), /*#__PURE__*/React.createElement("div", {
    style: TS.comboBody
  }, D.fit), /*#__PURE__*/React.createElement("div", {
    style: TS.comboSecH
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#FF9E6D"
    }
  }, "\u26A1 \uC5EC\uAE30\uC11C \uBD80\uB52A\uD600\uC694")), /*#__PURE__*/React.createElement("div", {
    style: TS.comboBody
  }, D.clash), /*#__PURE__*/React.createElement("div", {
    style: TS.comboSecH
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: TC.gold
    }
  }, "\uD83C\uDF31 \uC774\uB807\uAC8C \uD574\uBCF4\uC138\uC694")), D.how.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: TS.comboHow
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: TC.gold
    }
  }, i + 1, "."), " ", h)));
}
const GOMUN = [{
  d: "2026.01.13",
  t: "포상이 루틴이 되는 건 바람직하지 않지만, 아이들 기질에 따라서는 엄마가 알아주지 않으면 열정이 사라지는 아이들도 있으니 자녀 기질에 맞도록 조절하세요. 자녀가 새 같은 아이인지, 하늘 같은 아이인지, 땅 같은 아이인지, 뿌리 같은 아이인지… 기질을 아셔야 해요."
}, {
  d: "2026.03.08",
  t: "이 지적과 충고, 칭찬도 아이마다 기질이 다르므로, 자녀의 기질에 따라 칭찬하는 방법도 충고하는 방법도 다릅니다. 송재희 선생의 사상체질 학습법 책을 보시면 많은 도움이 되십니다."
}, {
  d: "2026.05.28",
  t: "기질이 아이들마다 다를 뿐이니, 기질에 따라 권유 방법과 활동 분위기를 조성해 주세요. 사상체질 학습법… 아시죠? 하늘 같은 애, 새 같은 애, 땅 같은 애, 뿌리 같은 애…"
}];
function Intro({
  onStart,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fade"
  }, /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onBack
  }, "\u2039 \uD648"), /*#__PURE__*/React.createElement("div", {
    style: TS.gomunCard
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.gomunTitle
  }, "\u201C\uAE30\uC9C8\uC744 \uC544\uC154\uC57C \uD574\uC694.\u201D"), /*#__PURE__*/React.createElement("div", {
    style: TS.gomunWho
  }, "\u2014 \uC774\uC7AC\uD6C8 \uACE0\uBB38\uB2D8\uC774 \uC5B4\uBA38\uB2C8\uB4E4\uAED8"), /*#__PURE__*/React.createElement("div", {
    style: TS.gomunQuotes
  }, GOMUN.map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: TS.gomunQ
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.gomunDate
  }, g.d), /*#__PURE__*/React.createElement("div", {
    style: TS.gomunText
  }, g.t)))), /*#__PURE__*/React.createElement("div", {
    style: TS.gomunFoot
  }, "\uACE0\uBB38\uB2D8\uC740 \uC138 \uBC88\uC5D0 \uAC78\uCCD0 \uAC19\uC740 \uB9D0\uC500\uC744 \uD558\uC168\uC2B5\uB2C8\uB2E4. \uC544\uC774\uC758 \uAE30\uC9C8\uC744 \uC544\uB294 \uAC83 \u2014 \uADF8\uAC83\uC774 \uCE6D\uCC2C\uACFC \uCDA9\uACE0, \uACF5\uBD80\uBC95\uC758 \uCD9C\uBC1C\uC810\uC774\uB77C\uACE0\uC694.")), /*#__PURE__*/React.createElement(IntroSec, {
    n: "01",
    title: "\uC65C \uC774 \uC9C4\uB2E8\uC744 \uD558\uB098\uC694?"
  }, "\uAC19\uC740 \uCE6D\uCC2C\uB3C4, \uAC19\uC740 \uACF5\uBD80\uBC95\uB3C4 \uC544\uC774\uB9C8\uB2E4 \uB2E4\uB974\uAC8C \uC791\uC6A9\uD569\uB2C8\uB2E4. \uC5B4\uB5A4 \uC544\uC774\uB294 \uC54C\uC544\uC8FC\uC9C0 \uC54A\uC73C\uBA74 \uC5F4\uC815\uC774 \uC2DD\uACE0, \uC5B4\uB5A4 \uC544\uC774\uB294 \uB2E4\uADF8\uCE58\uBA74 \uB354 \uC6C0\uCE20\uB7EC\uB4ED\uB2C8\uB2E4. \uC544\uC774\uC758 \u2018\uACB0(\uAE30\uC9C8)\u2019\uC744 \uBA3C\uC800 \uC774\uD574\uD574\uC57C, \uCE6D\uCC2C\uB3C4 \uCDA9\uACE0\uB3C4 \uACF5\uBD80\uBC95\uB3C4 \uADF8 \uC544\uC774\uC5D0\uAC8C \uB9DE\uAC8C \uAC74\uB12C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC774 \uC9C4\uB2E8\uC740 \uC6B0\uB9AC \uC544\uC774\uAC00 \uC0C8\xB7\uD558\uB298\xB7\uB545\xB7\uBFCC\uB9AC \uAC00\uC6B4\uB370 \uC5B4\uB5A4 \uACB0\uC778\uC9C0 \uC0B4\uD3B4\uBCF4\uB294 \uCD9C\uBC1C\uC810\uC785\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(IntroSec, {
    n: "02",
    title: "\uC774 \uCC45\uC5D0 \uB300\uD558\uC5EC"
  }, "\uC774 \uC9C4\uB2E8\uC740 \uC1A1\uC7AC\uD76C \uC120\uC0DD\uC758 \u300E\uC0AC\uC0C1\uCCB4\uC9C8 \uD559\uC2B5\uBC95\u300F(\uC6D0\uC81C \u300C\uBAB8\uC774 \uC990\uAC70\uC6B4 \uCCB4\uC9C8 \uD559\uC2B5\uBC95\u300D)\uC744 \uBC14\uD0D5\uC73C\uB85C \uD569\uB2C8\uB2E4. \uC774\uB984\uC740 \u2018\uC0AC\uC0C1\uCCB4\uC9C8\u2019\uC774\uC9C0\uB9CC \uD55C\uBC29\uC758 \uCCB4\uC9C8\uC758\uD559\uACFC\uB294 \uB2EC\uB77C\uC694 \u2014 \uBAB8\uC774 \uC544\uB2C8\uB77C \uC544\uC774\uC758 \uD0C0\uACE0\uB09C \u2018\uAE30\uC9C8\u2019\uC744 \uC77D\uB294 \uD2C0\uC785\uB2C8\uB2E4. \uD55C \uC5B4\uBA38\uB2C8\uC758 \uB9D0\uCC98\uB7FC \u201C\uCCB4\uC9C8\uC774 \uC544\uB2C8\uB77C \uAE30\uC9C8\u201D\uC774\uC9C0\uC694. \uACE0\uBB38\uB2D8\uC774 \uC5EC\uB7EC \uCC28\uB840 \uC9C1\uC811 \uAD8C\uD558\uC2E0 \uCC45\uC774\uACE0, \u201C\uC77D\uACE0 \uC544\uC774\uC640 \uB300\uD654\uD574\uBCF4\uB2C8 \uB3C4\uC6C0\uC774 \uB418\uC5C8\uB2E4\u201D\uB294 \uC5B4\uBA38\uB2C8\uB4E4\uC774 \uB9CE\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(IntroSec, {
    n: "03",
    title: "\uB124 \uAC00\uC9C0 \uACB0"
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.fourRow
  }, ["bird", "sky", "earth", "seed"].map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      ...TS.fourItem,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    type: t,
    size: 34
  }), " ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: TYPES[t].color
    }
  }, TYPES[t].name), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: TC.mute
    }
  }, "\xB7 ", TYPES[t].essence))))), /*#__PURE__*/React.createElement(IntroSec, {
    n: "04",
    title: "\uC81C\uB85C\uC12C\uC744 \uB118\uC5B4, \uB545\uB530\uBA39\uAE30\uB85C"
  }, "\uACE0\uBB38\uB2D8\uC758 \uC591\uC721 \uCCA0\uD559\uACFC \uBC14\uB85C \uC774\uC5B4\uC9D1\uB2C8\uB2E4. \uC544\uC774\uC758 \uACB0\uC810\uC744 \uC9C0\uC801\uD574 \uAE4E\uC544\uB0B4\uB9AC\uB294 \u2018\uC81C\uB85C\uC12C\u2019\uC774 \uC544\uB2C8\uB77C, \uC544\uC774\uC758 \uD0C0\uACE0\uB09C \uACB0\uC744 \uC54C\uACE0 \uADF8 \uACB0\uB300\uB85C \u2018\uB2E4\uB978 \uBB38\u2019\uC744 \uC5F4\uC5B4\uC8FC\uB294 \u2018\uB545\uB530\uBA39\uAE30\u2019. \uAE30\uC9C8\uC744 \uC54C\uBA74 \u2014 \uC5B4\uB514\uB97C \uCE6D\uCC2C\uD558\uACE0, \uC5B4\uB5BB\uAC8C \uAD8C\uD558\uACE0, \uC5B4\uB5A4 \uBB38\uC744 \uC5F4\uC9C0\uAC00 \uBCF4\uC785\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(IntroSec, {
    n: "05",
    title: "\uC5B4\uB5BB\uAC8C \uC4F0\uB098\uC694"
  }, "\uC544\uC774\uB97C \uB5A0\uC62C\uB9AC\uBA70 \u2018\uADF8\uB807\uB2E4\u2019 \uC2F6\uC740 \uD56D\uBAA9\uC744 \uC120\uD0DD\uD558\uC2DC\uBA74, \uB124 \uACB0\uC758 \uBE44\uC728\uACFC \uD568\uAED8 \uADF8 \uC544\uC774\uC5D0 \uB9DE\uB294 \uACF5\uBD80\uBC95\xB7\uBD80\uBAA8 \uAC00\uC774\uB4DC\uAC00 \uC81C\uACF5\uB429\uB2C8\uB2E4. \uB2E4\uB9CC \uACB0\uACFC\uB294 \uB2E8\uC815\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uACE0\uBB38\uB2D8\uAED8\uC11C\uB3C4 \u201C\uAE30\uC9C8\uC744 \uC544\uC154\uC57C \uD55C\uB2E4\u201D\uACE0 \uD558\uC2DC\uBA74\uC11C\uB3C4 \uD55C \uAC00\uC9C0\uB85C \uBABB\uBC15\uC9C0\uB294 \uC54A\uC73C\uC168\uC2B5\uB2C8\uB2E4. \uC544\uC774\uB97C \uB354 \uAE4A\uC774 \uAD00\uCC30\uD558\uB294 \uB80C\uC988\uB85C \uD65C\uC6A9\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/React.createElement(IntroSec, { n: "06", title: "시작하기 전에 — 지켜 주세요" }, "한 아이의 기질을 제대로 알려면 오래 곁에서 지켜보는 것이 가장 좋겠지만, 현실적으로 그러기 어렵기에 이 체크 문항을 마련했습니다. 문항 가운데는 다소 추상적이거나 모호하게 느껴지는 것도 있습니다. 그러나 이는 기질을 가려내기 위해 아이의 ‘마음의 상태’를 읽으려고 만든 것이니, 그 점을 헤아리며 아래 다섯 가지를 지켜 주세요.", /*#__PURE__*/React.createElement("div", { style: { marginTop: 12 } }, [["하나", "어떤 문항도 아이에게 100퍼센트 딱 들어맞는 경우는 드뭅니다. 그러니 완벽히 맞아야만 ‘그렇다’를 고르려 하지 마세요 — 절반 넘게 맞다 싶으면 ‘그렇다’(아주 그러면 ‘매우’)를, 어중간하면 ‘보통’을, 맞지 않으면 ‘아니다·전혀’를 골라 주세요."], ["둘", "‘이랬으면 좋겠다’는 바람이 아니라, 아이가 실제로 살고 있는 모습 그대로 골라 주세요. (아이가 직접 답한다면, 되고 싶은 모습이 아니라 지금의 모습을요.) 왜곡 없이 있는 그대로 바라보는 지혜로운 눈이 필요합니다."], ["셋", "잘 모르겠는 항목은, 아이를 가장 잘 알면서도 객관적으로 봐 줄 수 있는 분(다른 가족, 할머니, 선생님 등)께 여쭤보세요. 다만 의견은 참고하되 선택은 직접 하시는 편이 좋습니다 — 아이를 가장 잘 아는 사람은 결국 곁에서 지켜본 분이니까요."], ["넷", "이 과정을 ‘아이를, 그리고 나를 새로 알아가는 여행’이라 여겨 주세요. 바쁜 일상에 아이를, 또 자신을 차분히 들여다볼 겨를이 없었을지 모릅니다. 잊고 있던 본래의 모습을 다시 찾는다는 마음으로요."], ["다섯", "결국 가장 중요한 것은 머리로 따진 판단보다 느낌과 마음입니다. 너무 골똘히 재면 솔직한 느낌이 오히려 흐려집니다. 어느 정도는 과감하게, 느낌이 가는 대로 골라 주세요."]].map((r, i) => /*#__PURE__*/React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginTop: i ? 9 : 0 } }, /*#__PURE__*/React.createElement("b", { style: { color: TC.gold, flexShrink: 0 } }, r[0]), /*#__PURE__*/React.createElement("span", null, r[1])))), /*#__PURE__*/React.createElement("div", { style: { marginTop: 12, color: TC.mute } }, "우선 한번 답해 보세요. 결과를 읽어가며 다시 가늠해 볼 수도 있고, 그래도 애매하면 유형별 설명을 더 찬찬히 살펴보며 확인하시면 됩니다. 한 번의 결과로 단정 짓기보다, 아이를 오래 지켜보는 긴 여정의 한 출발점으로 삼아 주세요.")), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.primary,
      marginTop: 22
    },
    onClick: onStart
  }, "\uC9C4\uB2E8 \uC2DC\uC791\uD558\uAE30"), /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onBack
  }, "\uD648\uC73C\uB85C"));
}
function IntroSec({
  n,
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: TS.introSec
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.introHead
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.introNum
  }, n), " ", title), /*#__PURE__*/React.createElement("div", {
    style: TS.introBody
  }, children));
}
const DEEP = {
  earth: {
    parts: [{
      n: "01",
      t: "믿어주는 만큼 보답하는 아이 — 학습 동기",
      b: ["땅의 아이가 공부하는 진짜 동기는 \u2018부모님께 도움이 되고 싶다\u2019는 마음이에요. 사양지심이라, 자기 때문에 부모가 애쓰는 걸 알고 그것을 부담으로 느낍니다. 그래서 무엇보다 중요한 건 부모의 \u2018태도\u2019예요. 성적이라는 결과보다, 공부하려는 과정\u00b7태도\u00b7노력을 인정해 주어야 해요.", "이 아이에게는 \u201c성적 올릴 자신은 없어도, 열심히 할 자신은 있는 사람\u201d이라는 말이 잘 맞아요. 그러니 결과에 집착하지 말고 과정에 의미를 붙여 주세요. \u201c네가 공부하니까 든든하다\u201d \u201c엄마가 보기엔 넌 대기만성형인 것 같아\u201d 처럼요.", "단, 겉으로만 변한 척하면 아이는 압니다. 부모가 진짜로 결과 집착을 내려놓을 때 비로소 아이의 \u2018억지로\u2019가 풀려요. 책은 말해요 \u2014 부모가 마음을 고치면 문제의 절반은 이미 해결된 것이라고."]
    }, {
      n: "02",
      t: "게으른 경험주의자 — 걱정과 부자연스러움",
      b: ["땅의 게으름은 늦잠 자고 빈둥대는 그런 게으름이 아니에요. 두 가지에서 와요. 하나는 \u2018생각이 많아 느려지는 것\u2019, 또 하나는 \u2018걱정\u2019이에요. 지금 성적, 고등학교, 대학, 부모의 기대까지 모든 걱정을 동시에\u00b7복합적으로 떠올리다 \u201c답이 없어요\u201d라는 막막함에 빠져요. 그 걱정을 잊으려고 게임\u00b7만화\u00b7잠으로 달아나는 것 \u2014 이것이 땅의 게으름이에요.", "그래서 \u201c쉬운 것부터 해, 그렇게 앉아만 있으면 되니?\u201d 같은 충고는 소용이 없어요. 몰라서가 아니라, 다 아는데도 안 되는 거니까요.", "땅의 아이는 \u2018경험주의자\u2019예요. 분위기는 논리가 아니라 경험으로만 파악되거든요. 그래서 경험과 \u2018첫 단추\u2019가 결정적이에요. 한번 절망(나쁜 경험)을 하면 그게 총체적으로 와서 회복이 쉽지 않아요. 말로 설득해도(소음인식), 기분만 띄워줘도(소양인식) 잘 안 통해요 \u2014 시간을 갖고 \u2018자연스럽지 못한 원인\u2019 자체를 고쳐 줘야 합니다."]
    }, {
      n: "03",
      t: "이유 많은 실용주의자 — \u2018왜 필요한지\u2019를 알아야",
      b: ["사양지심은 사람\u00b7관계 중심이라, 땅의 아이는 대단히 실용적이에요. \u201c이걸 왜 배워야 하는지\u201d 납득되지 않으면 진짜로 하기 싫어집니다. \u201c대학 가려고\u201d라는 말은 다른 결엔 통해도, 땅의 아이는 \u201c그럼 이걸 어디다 써먹지?\u201d 하며 식어버려요. 그 순간 모든 과목이 재미없어지고 책상에 앉기조차 싫어져요.", "그래서 핵심은 \u2018그 과목이 왜 필요하고 어디에 쓸모가 있는지\u2019를 먼저 알려주는 거예요. 원리만 설명하면 다른 아이는 재미있어해도, 땅의 아이는 \u2018쓸모\u2019를 알아야 재미를 느껴요. 문제풀이부터 들어가지 말고, 수학사처럼 \u2018왜 이게 생겨났는지\u2019 같은 주변 이야기에서 핵심으로 접근하세요.", "사람에 관심이 많아 선생님과의 관계도 학습에 큰 영향을 줘요. 한 가지 팁 \u2014 땅의 아이가 중학교 때 수학을 잘하면 이해가 아니라 암기일 수 있으니 살펴보세요. 문과\u00b7이과도 \u2018사람에 대한 관심\u2019으로 가늠할 수 있어요."]
    }, {
      n: "04",
      t: "자연스럽게 — 땅의 학습법, 그 처음이자 끝",
      b: ["땅의 학습법은 한 단어로 \u2018자연스럽게\u2019예요. 어깨에 힘이 들어가 \u201c해야지, 해야지\u201d 할수록 오히려 못 합니다. 부자연스러우면 불편하고, 불편하면 안 하게 되니까요.", "분위기로 공부해요. 저장 용량이 커서 \u2018다\u2019 외우려 드니, 무엇을 안 외워도 되는지 골라 주는 게 중요해요. 공부하는 분위기에 두면 자연히 따라 합니다(스스로 분위기를 깨진 못해요).", "원칙은 \u2018형식은 여유 있게, 내용은 엄격하게\u2019. 10분 영어\u00b710분 수학, 드라마 보며 문제 풀어도 좋되 \u2014 할 양은 끝까지 채우게요. 엄마의 \u201c너 공부 안 하니?\u201d 한마디가 자연스러움을 깹니다. 막 들어가려던 참에 그 말을 들으면, 기분이 나빠서가 아니라 \u2018어색해져서\u2019 못 해요.", "미루기를 끊는 법 \u2014 \u201c20문제 풀어야 하지만, 일단 한 문제만. 안 되면 말고.\u201d 부담을 완전히 내려놓으면 오히려 40문제도 풀어요.", "조심할 것은 \u2018잘못된 책임감\u2019이에요. 땅의 아이는 책임감이 강해서, 안 되는 줄 알면서도 책상에 버티며 자기를 학대해요 \u2014 \u201c그렇게라도 안 하면 엄마 볼 면목이 없어서\u201d. 효과 없는 비싼 과외로 자기만족하는 부모와 똑같은 자기학대죠. 이건 성적에 도움이 안 될뿐더러 삶의 희망을 갉아먹어요. 그래서 자연스러움이 더더욱 중요합니다."]
    }, {
      n: "05",
      t: "도와주자 — 책의 결론",
      b: ["책의 결론은 분명해요. 땅의 아이 공부는 세 가지만 확실히 고쳐 주면 됩니다.", "\u2460 산만함 \u2014 자연스럽지 못함과 걱정에서 와요. 해결은 \u2018자연스러움\u2019. \u2461 게으름 \u2014 마찬가지예요. 새벽에 손을 잡고 조용히 이야기하듯, 자연스럽게 이끌어 주세요. \u2462 대충대충 \u2014 천성이라 야단으로는 안 고쳐져요. 오직 \u2018테스트\u2019뿐이에요. 공부한 뒤 반드시 물어봐 주고(어머니가 직접 물어봐 주는 게 문제집보다 좋아요), 틀린 곳은 반복해 최소 세 번 확인하세요.", "한 문장으로 \u2014 \u201c결과에 집착하지 말고 과정에 의미를, 성적보다 아이의 의도와 태도를 높이 사 주세요.\u201d 이 부모의 변화가 있으면 땅의 아이는 틀림없이 잘합니다."]
    }],
    close: "이 모든 것의 바탕은 \u2018믿음\u2019이에요. 어머니의 기준으로 아이를 재단하지 말고 믿어 주면 \u2014 땅의 아이는 반드시 그 믿음에 보답합니다."
  },
  seed: {
    parts: [{
      n: "01",
      t: "존중해주는 만큼 행복한 아이 — 학습 동기",
      b: ["뿌리의 아이가 공부하는 동기는 ‘존중받고 싶다’는 마음이에요. 시비지심 — 맞고 틀림을 가리는 기준이 자기 안에 있어, 자존심이 무엇보다 중요합니다. 그래서 한번 자존심에 상처를 입으면 그 좌절에서 좀처럼 헤어나지 못해요.", "태음(땅)이 ‘믿어주는 만큼’, 소양(새)이 ‘예뻐해주는 만큼’ 행복하다면, 뿌리는 ‘존중해주는 만큼’ 행복한 아이예요. 그런데 이 ‘존중’이 참 어렵습니다."]
    }, {
      n: "02",
      t: "눈치보기에서 자기당당함으로 — 자신감이 먼저",
      b: ["뿌리의 학습법 자체는 의외로 간단해요(이해될 때까지 질문하기 + 계획적으로 공부하기). 하지만 그보다 먼저 ‘자기당당함(자신감)’을 찾아줘야 해요. 기가 죽은 뿌리는 아무리 좋은 방법도 소용없고, 자신감을 찾으면 멋지고 당당한 아이로 변하면서 성적도 따라 올라요.", "조심할 게 있어요. 90점 맞을 수 있었는데 80점을 맞은 아이에게 “80점도 잘했어, 엄마는 70점일 줄 알았는데”라고 위로하면 오히려 상처예요(‘내가 그렇게 우습게 보였나’). 차라리 “90점 맞을 너인데 왜 80점이야?”가 존중으로 느껴져요 — ‘내 진짜 실력을 알아주는구나’.", "더 위험한 건 섣부른 격려예요. 자신 없는 아이에게 “넌 할 수 있어”를 반복하면, 어머니가 나를 과대평가한다 여겨 ‘실망시킬까’ 평생 불안에 떨 수도 있어요. 칭찬도 ‘정확히 알아주는’ 칭찬이어야 약이 됩니다 — 뿌리의 아이는 정작 중요한 속내를 입 밖에 내지 않고 그냥 알아주길 바라거든요.", "환경의 삼박자를 갖춰주세요 — 자신감, 익숙한 분위기, 그리고 실력 있고 인격적인 선생님."]
    }, {
      n: "03",
      t: "질문만이 살길이다",
      b: ["뿌리의 핵심 학습법 하나는 ‘이해될 때까지 질문하기’예요. 한 번에 하나씩, 완전히 이해해야 다음으로 넘어가요. 이해 안 된 채 쌓으면 한 문제에 20분씩 걸리며 무너져요. 그러니 마음 편히 질문할 수 있는 분위기와 선생님이 중요해요.", "뿌리의 아이는 한마디도 여러 번 곱씹어 말해요. 그 말을 흘려들으면 ‘무시당했다’고 느껴 화가 나요. 아이의 말을 진지하게 들어주세요(소음 아이에겐 육아일기를 권할 만큼요)."]
    }, {
      n: "04",
      t: "성적은 형식의 엄격함에 비례한다",
      b: ["또 하나는 ‘계획적·규칙적으로’ 공부하기예요. 태음(땅)이 형식은 여유롭게여야 하는 것과 정반대로, 뿌리는 형식을 엄격하게 — 자기 방에서 문 닫고, 계획을 세워 규칙적으로 할 때 가장 잘해요. 정리와 단계가 갖춰져야 마음이 놓이는 아이니까요."]
    }, {
      n: "05",
      t: "도와주자 — 책의 결론",
      b: ["책의 정리는 다섯 가지예요. ① 자신감 갖게 하기(핵심은 ‘존중’) ② 이해될 때까지 질문하게 하기 ③ 규칙적인 생활(부모가 함께) ④ 철저하게 계획 세우기 ⑤ ‘나만 어려운 게 아니다’라고 생각하게 하기. 여기에 하나 더 — 아주 친절하고 객관적인 대화.", "한마디로, 뿌리의 학습법은 ‘아이에게 자신감을 갖게 하는 모든 방법’이라고 해도 지나치지 않아요."]
    }],
    close: "뿌리의 아이를 키우는 건 아주 섬세한 분 한 명을 더 모시는 것과 비슷해요. 많은 인내심이 필요하지만, 존중과 자신감만 지켜주면 성적이 오르는 건 시간 문제예요."
  },
  bird: {
    parts: [{
      n: "01",
      t: "예뻐해주는 만큼 행복한 아이 — 학습 동기",
      b: ["새의 아이가 공부하는 동기는 ‘예뻐해주는’ 마음에서 와요. 잘난 척을 다 받아주고 먼저 높이 날게 해준 뒤에 공부로 이끄는 게 순서예요. “넌 정말 멋진 아이야, 그런데 왜 공부를 안 하지?”와 “네가 그렇게 잘났어? 공부나 하고 말해”는 하늘과 땅 차이예요."]
    }, {
      n: "02",
      t: "폼생폼사 — 근사하고 멋지게, 그리고 둥지의 믿음",
      b: ["새에게는 명분과 체면이 중요해요. “네가 어떤 짓을 해도 나는 네 편이다”라는 든든한 둥지를 믿을 때, 새는 여유롭게 날고 잘못해도 둥지로 돌아와요. 새는 담백하고 가책이 없어서, 잘못이 분명하면 금방 인정하고 그 안에서 최선을 다합니다."]
    }, {
      n: "03",
      t: "공부, 짧고 굵게 — 그러나 빛나게",
      b: ["순간 집중력이 강점이에요. 아주 짧게 끊어 “이것만 해, 그리고 놀아”라고 하고, 할 때까지는 옆에서 딴짓 못 하게 몸을 잡아주세요. 끝나면 약속대로 놀게 해줘야(약속보다 ‘명분’ 때문에) 다음에도 또 시킬 수 있어요. 길게 늘이면 못 견뎌요."]
    }, {
      n: "04",
      t: "공부에도 왕도가 있다 — 억압은 금물, 멍석을 깔자",
      b: ["새는 시키는 대로를 싫어해요. 자유·호기심·창의·실험정신 때문이죠. “왜 시키지도 않은 짓을 해?” 대신 “어떻게 그런 생각을 다 했어? 새롭다!”로 받아주면 창의력이 살아나요. 억압은 금물 — 몸이 아파도 참고 공부하라 강요하지 마세요.", "새는 ‘주인공’이 되면 기가 살아요. “친구들한테 직접 설명해봐, 네가 선생님이야”, “네가 문제를 만들어 풀어와, 딱 세 문제만!”, “엄마한테 두 문제 내봐”처럼 멍석을 깔아주세요. 무대체질이라 말하면서 기억하고(자아가 밖에 있어 관계 속에 저장돼요), 발표식 수업에 특히 강해요.", "리더를 하면 더 큰 새가 돼요. 성적이 좀 부족해도 반장을 하겠다면 밀어주세요 — 똑똑하고 정의롭고 솔직해 금방 인정받으니까요."]
    }, {
      n: "05",
      t: "도와주자 — 책의 결론",
      b: ["정리하면 — 먼저 인정하고 예뻐해 높이 날게 하기, 순간 집중을 살려 ‘짧고 굵게’(끝나면 꼭 놀게), 억압하지 않기, 멍석을 깔아 주인공·발표·리더로 세우기."]
    }],
    close: "새에게 가장 큰 힘은 “네가 어떤 짓을 해도 나는 네 편”이라는 둥지예요. 그 믿음만 있으면 새는 마음껏 날고, 반드시 둥지로 돌아옵니다."
  },
  sky: {
    parts: [{
      n: "01",
      t: "가장 드문 결, 하늘 같은 아이",
      b: ["하늘의 아이는 네 결 중 압도적으로 드물어요. 책의 저자도 평생 서너 명, 상담한 아이 중엔 딱 한 명을 만났을 뿐이라고 고백해요(100만 명에 한 명 꼴이라고요). 그래서 저자조차 “태양인 이야기는 최소한으로 줄였다”고 밝혀요 — 이 결의 분석이 다른 셋보다 짧은 건 바로 그 때문이에요. 아이가 덜 또렷해서가 아니라요."]
    }, {
      n: "02",
      t: "측은지심 — 약한 것을 끌어안는 마음",
      b: ["측은지심이 깊어, 약하고 아픈 것을 그냥 지나치지 못해요. 동물의 고통, 길에 버려진 것에도 마음 아파하고, 모든 사람을 불쌍히 여기기도 해요. 옳고 그름·공정함 같은 큰 가치에 마음이 향해요."]
    }, {
      n: "03",
      t: "단번에 본질을 보는 아이 — 직관",
      b: ["하늘이 땅의 모든 것을 내려다보듯, 이 아이는 전체를 한눈에 직관으로 파악해요. 지식을 쌓거나 논리로 따져서가 아니라 ‘단번에’ 본질을 알아채죠. 그래서 구체적인 사실·세부엔 관심이 적어요(좁은 영역을 구체적으로 보는 새와는 달라요).", "자아가 자기 안이 아니라 ‘밖(관계)’에 있어서, 책은 폭죽이나 은하수에 비유해요 — 안에 있을 땐 조용하다가 밖에서 터질 때 화려하죠. 그래서 세상 모든 일이 관심사라, 처음 본 영화·음악도 오래 공부한 듯 이야기하기도 해요."]
    }, {
      n: "04",
      t: "슬픈 몽상가",
      b: ["상징과 공상의 세계가 생생해, 책은 돈키호테에 비유해요(풍차를 정말 괴물로 보듯). 머리가 먼저 크는 어린아이처럼 꿈과 현실의 경계가 옅고, 또래가 자기 말을 못 알아들어 외로워하거나 슬퍼할 수 있어요. 그러나 그 안엔 본질을 꿰뚫는 천재성이 있어요."]
    }, {
      n: "05",
      t: "어떻게 도와줄까 — 원리·의미·큰 그림",
      b: ["암기와 세세한 반복은 약해요. ‘왜, 원리, 큰 그림, 의미’로 다가가면 스스로 달려가요. ‘왜?’라는 큰 질문을 막지 말고 함께 궁금해하며, 배우는 것에 의미를 붙여주세요. 세부는 곁에서 가볍게 채워주고, 큰 꿈과 이상은 비현실적으로 들려도 존중해 주세요."]
    }, {
      n: "06",
      t: "솔직한 안내",
      b: ["다시 말하지만 하늘은 극히 드물어요. 책은 ‘소양(새) 중 강건한 아이’나 ‘태음(땅) 중 열이 많은 아이’를 태양인으로 잘못 보는 경우가 많다고 경고해요. 그러니 결과가 하늘로 나왔어도 단정하지 말고, 두 번째로 높게 나온 결과 함께 더 깊이 관찰해 주세요."]
    }],
    close: "하늘의 아이에게 가장 큰 선물은 ‘이상하다’는 말 대신 “어떻게 그런 생각을 했어?”라는 눈빛이에요. 큰 질문과 깊은 마음을 품어주면, 이 드문 아이는 자기답게 빛납니다."
  }
};
const PORTRAIT = {
  bird: ["소양인을 알려면 어린아이를 떠올리면 됩니다. 산만하고, 속이 빤히 들여다보이고, 금방 잊어버리고, 이기적이진 않아도 늘 자기를 중심에 두고 생각하고, 이성보다 감정이 앞서고, 아픈 걸 잘 못 참고, 깊이가 없고, 잠시도 가만히 있지 못하고, 화제가 순식간에 이리저리 옮겨 가고, 이것저것 관심이 많다가도 금방 싫증을 내고, 끈기나 인내와는 거리가 멀고, 철이 없고, 대화의 중심이 자기일 때 신이 나고, 순수하고 솔직하며, 재미있는 일에는 놀라운 집중력을 보이고, 상상력이 풍부해 가끔 기막히게 기발한 발상을 하고, 누구와도 쉽게 친해지고, 사람들을 적극적으로 만나고, 인정 많고 정의로우며, 자유·평화·인류애 같은 거창한 가치에 뭉클해하고 그것에 목숨을 걸 수도 있다고 말하는 — 이 모든 것이 소양인의 모습입니다.", "소양인은 '새 같은' 사람입니다. 새라고 하면 창공을 자유롭게 나는 멋진 모습이 떠오르지만, 새에게는 어이없을 만큼 부산한 면도 있지요. 머리를 까딱이고 날개를 파닥이며 사방을 쉼 없이 돌아다니고, 늘 주변을 경계하다 조금만 이상해도 금방 날아오릅니다. 그만큼 상황 판단이 굉장히 빠르고, 빠른 만큼 실수도 많아요. 묵직함·중후함·진중함 같은 것과는 거리가 멉니다. 물론 창공을 높이 나는 독수리처럼 멋질 때도 있지만, 그건 일부분일 뿐이에요.", "소양인은 정말 잠시도 가만히 있지 못합니다. 강의를 듣든 영화나 TV를 보든 남의 말을 듣든 책을 읽든 밥을 먹든 길을 걷든 차를 타든, 다리를 떨거나 얼굴을 찡그렸다 펴거나 머리를 만지거나 볼펜을 딸깍이거나 무언가를 먹지요. 잠을 자면서도 이리 뒹굴 저리 뒹굴 온 방을 운동장처럼 돌아다닙니다. 이건 어린아이에게 흔한 모습이라, 소양인을 어린아이 같다고 하는 거예요. 태음인이나 소음인은 누운 자세 그대로 일어나는 경우가 많지만, 소양인은 나이를 먹어도 잠버릇이 험한 사람이 비교적 많습니다.", "새는 하늘을 날기에 세상 모든 것을 눈으로 봅니다. 그래서 소양인은 TV·영화·광고처럼 무언가 '보는' 것을 무척 좋아하지요. 그런데 더 중요한 것이 있어요. 새가 지상을 내려다본다는 건, 거꾸로 지상의 모든 것도 하늘의 새를 올려다볼 수 있다는 뜻입니다. 태음인은 땅이라 그 속에 무엇이 들었는지 알기 어렵고, 소음인은 씨앗이라 대개 땅속에 있어 정체를 알려면 시간이 걸리지요. 하지만 하늘을 나는 소양인은 어디로 어떻게 움직이는지 누구나 쉽게 알아볼 수 있습니다. 그래서 소양인은 '속이 빤히 보이는' 사람, 달리 말하면 맑고 투명한 사람입니다.", "그런 만큼 소양인은 감정을 잘 감추지 못합니다. 불편한 자리에 있으면 금방 얼굴에 드러나고, 하기 싫은 일을 시키면 곧장 표정이 변하지요. 거의 모든 감정이 얼굴과 몸짓에 그대로 비치고, 아무리 고치려 해도 잘 고쳐지지 않습니다. 정작 본인은 그렇게 다 보이는 자신을 그리 좋아하지 않아요. 경쟁하는 사회에서는 불리하다고 느끼거든요. '치열한 경쟁에서 살아남으려면 속을 얼마쯤 숨겨야 하는데, 상대 속은 모르는데 내 속만 빤히 보이면 그 게임은 이미 진 것 아니냐'며 답답해하기도 합니다.", "하지만 새는 빤히 보이는 데서 먹이를 향해 달려가도 먹이가 좀처럼 피하지 못합니다. 그 비결은 속도와 순발력, 그리고 순간의 집중력이에요. 지상에서 새보다 빨리 움직이거나 방향을 트는 생명체는 없으니까요. 그래서 소양인은 공명정대한 것을 좋아합니다. 무언가를 숨기고 넘겨짚고 은근히 떠보는 분위기에는 익숙하지 않고, '톡 까놓고' 이야기하는 걸 좋아하지요. 모든 것이 공개된 상황에서는, 속도와 순발력과 순간 집중력이 뛰어난 소양인을 당할 사람이 없으니까요.", "소양인의 생각하는 속도와 방향 전환은 태음인이나 소음인이 상상하기 어려울 정도입니다. 그래서 '너 지금 무슨 얘기야, 왜 갑자기 딴소리냐'는 핀잔을 듣기도 하지만, 좋게 보면 '기발하다, 어떻게 그 생각을 했지, 발상의 전환이다' 하는 감탄이 되지요. 정리하면 소양인은 새처럼 속이 빤히 보이고 어린아이처럼 순수하면서, 동시에 놀라운 속도의 생각과 방향 전환으로 제가 원하는 바를 이뤄내는 사람입니다.", "소양인 아이는 어제 한 약속을 오늘 지키지 않기도 합니다. 어제 '내일은 영어 공부할게' 해 놓고, 오늘은 TV 앞에 앉아 '영어는 내일 해도 돼, 시험 보려면 아직 멀었거든' 하며 태평하지요. 부모로서는 약속을 안 지키는 것 같고, 한 말을 자꾸 바꿔 가벼워 보이고, '저래서 사회생활은 어떻게 하나' 싶어 환장할 노릇입니다. 그래서 '어제 약속했잖아, 빨리 TV 끄고 공부해!' 하고 야단치면, 무서워서 들어가긴 해도 그 꾸지람을 진심으로 받아들이는 건 아니에요. 어머니도 그걸 알기에 한숨을 쉬지요.", "그러나 이건 무책임이 아니라, 차라리 변덕이라 해야 맞습니다. 소양인 아이는 어제 약속할 때의 상황과 오늘의 상황이 다르다고 진심으로 느끼고, 상황이 달라졌으면 약속도 얼마든지 바뀔 수 있다고 여기거든요. 이것이 바로 소양인의 생각의 속도이자 순발력이에요. 그러니 '무책임하다, 한 말은 지켜야지, 왜 이랬다저랬다 하냐'는 식의 일반적인 꾸지람은 별 도움이 되지 못합니다. 소양인에게는 상황이 바뀐 사실이 중요하지, 어제 무슨 약속을 했는지가 중요한 게 아니니까요. 그래서 소양인의 변덕을 줏대 없음으로만 봐선 안 됩니다. 남들이 미처 못 느끼는 상황 변화를 너무 빨리, 너무 정확히 알아채기에 쉽게 입장을 바꾸는 것이고, 그 변덕을 탓하기 시작하면 순발력과 놀라운 생각의 속도, 기발한 상상력까지 함께 잃어버리기 쉽습니다.", "소양인이 어제 한 약속을 오늘 스스럼없이 바꾸고 또 까먹기까지 하는 까닭은, 차곡차곡 쌓아 두는 저장 장치가 — 특히 논리적인 저장 장치가 — 약하기 때문입니다. 그래서 쉽게 외우는 만큼 쉽게 잊지요. 참고로 이런 소양인에게는 짧게 몰아치는 벼락치기가 의외로 효과가 있습니다."],
  sky: ["태양인은 네 기질 가운데 가장 드뭅니다. 어떤 이는 강건한 소양인이나 열이 많은 태음인을 보고 섣불리 태양인이라 단정하지만, 실제 태양인은 거의 없다 할 만큼 희귀해서 100만 명에 한 명 있을까 말까 하지요. 워낙 드물어 직접 겪어 말하기조차 어려운 기질이라, 태양인에 대한 이야기는 늘 조심스럽고 단편적일 수밖에 없습니다.", "태양인의 상징은 '하늘'입니다. 하늘은 땅 위 모든 것을 내려다보지요. 다만 태양인은 하늘 그 자체가 아니라 '하늘 같은' 사람인지라, 내려다보는 것들의 구체적인 사실까지 다 알지는 못하고 직관적인 느낌으로 알아챕니다. 그래서 태양인은 직관력이 대단히 발달한 사람이에요. 같은 양인이라도 소양인은 새의 눈처럼 좁은 영역을 보며 그 대상에 대한 구체적인 감수성을 갖지만, 태양인은 그야말로 '단번에' 본질을 꿰뚫습니다. 그 앎은 지식을 쌓거나 논리로 따지거나 경험을 거듭해 얻은 것이 아니에요. 그러니 구체적인 내용 자체는 잘 모르고 신경도 쓰지 않습니다. 무언가를 알고 싶어 한다면, 그것은 오직 '본래 왜 그러한가'라는 본질이 궁금해서지요.", "태양인의 자아는 자기 속이 아니라 바깥, 세상과 맺는 관계에 있습니다. 그래서 마치 자아가 없는 사람처럼 보이기도 해요. 태양인의 자아는 발사통 안에 있을 땐 아무 의미가 없다가 하늘에서 터져 퍼질 때 비로소 빛나는 불꽃, 혹은 하늘에 점점이 박힌 별이나 은하수 같습니다. 지나온 기억이 별처럼 흩뿌려져 있으니, 세상 모든 일이 다 관심거리가 되지요. 그래서 곁에서 누가 영화 이야기를 하면 수십 년 공부한 사람처럼 말하고, 음악 이야기가 나오면 또 그렇게 말합니다. 실제로 본 영화는 몇 편, 들은 음악은 몇 곡뿐이어도 말이지요. 처음 듣는 이야기도 조금만 들으면 이미 잘 아는 듯 이어 갑니다. 어린아이가 그러면 귀엽지만 나이 든 사람이 그러면 허풍처럼 비치기도 하고, 곁에서 보면 정신없어 보이기도 합니다.", "사상의학의 이제마 선생은 태양인은 들어서 안다고 했습니다. 별처럼 흩어진 것을 한꺼번에 알아채려면 보는 것보다 '듣는' 감각이 어울리기 때문이지요. 그만큼 다양함이 본성이라, 생각의 단위가 한 사람이나 한 나라가 아니라 지구와 세계로 뻗어 갑니다. 하나를 보아도 그것을 단순한 기호로 받아들이지 않고, 그 안에 담긴 온갖 상징과 가능성으로 끝없이 번져 나가지요. 갓 태어난 아이가 손발이나 몸통보다 머리부터 자라듯, 태양인은 그 시절의 성질을 닮아 꿈과 현실의 경계가 옅은, 타고난 몽상가입니다.", "태양인은 슬픈 몽상가이기도 합니다. 구체적인 근거나 개념보다, 상징에서 상징으로 이어지는 끝없는 공상 속에 살지요. 돈키호테가 풍차를 정말로 괴물로 보았듯, 태양인의 눈에는 그 상징이 진짜로 그렇게 보입니다. 정신이 나가서도, 일부러 그러는 것도 아니에요. 정말 그렇게 보이는 거지요. 그렇게 가공의 상상과 싸우는 돈키호테가 그러하듯, 태양인의 본성에는 '슬픔이 멀리 흩어지는' 결이 있습니다. 사람들이 한쪽으로 치우친 생각을 전부인 양 주고받으면, 태양인에게는 그것이 서로를 속이는 일처럼 보여 마음이 슬퍼져요. 거짓말하는 사람들이 가엾고, 그 치우침이 곧 사람들이 살아가는 모습이라는 생각에 '가련한 인생들'이라 여기지요.", "그래서 태양인은 한마디로 규정하기 어려운 사람입니다. 어떤 때는 미친 것 같고, 어떤 때는 세상 모든 진리를 다 아는 것 같고, 건달이나 허풍쟁이 같다가도, 건방지거나 한심하거나 무책임해 보이고, 그러다 문득 번득이는 천재적 영감을 내비칩니다. 우리가 눈앞의 현실을 이야기할 때, 우주와 하늘 저 깊은 심연을 들려줄 수 있는 — 그렇게 귀하고 소중한 사람입니다."],
  earth: ["태음인은 네 기질 가운데 가장 흔한 사람으로, 세상에는 태음인이 절반쯤, 소양인이 셋 중 하나쯤, 소음인이 다섯 중 하나쯤 있다고 합니다. 태음인은 '땅 같은' 사람이에요. 땅은 가만히 멈춰 있는 듯 보여도 그 속은 끊임없이 움직이지요(판이 아주 천천히 움직이는 것처럼요). 태음인도 겉으로는 묵직해 움직임이 없어 보이지만, 그 속은 쉴 새 없이 움직입니다.", "태음인의 머릿속에는 이런 생각 저런 생각이 끊임없이 일어나는데, 그것도 논리도 두서도 없습니다. 친구 생각을 하다 집안일로 옮겨 가고, 집안일을 생각하다 TV에 눈이 가고, 그러다 아이 문제가 떠오르고, 다시 친구 생각으로 돌아와 아까 접어 두었던 생각을 이어 가지요. 태음인이 아닌 사람 눈에는 이게 참 신기합니다. 그렇게 많은 생각을 하면서도 어떻게 헷갈리지 않을까 싶거든요. 특히 한 가지 생각이 끝나야 다음으로 넘어가는 소음인에게는 더욱 신기하게 보입니다.", "더 신기한 것은, 그렇게 생각이 많으면서도 겉으로는 전혀 드러나지 않는다는 점이에요. 표정도 행동도 말투도, 근심 걱정이라곤 없는 사람처럼 보이니까요. 이런 사고방식은 태음인만의 독특한 것입니다. 소양인도 생각이 끊임없이 일어나기는 하지만, 그것은 주변에 대한 걱정이라기보다 새로운 생각을 자꾸 만들어내는 쪽이라 근심보다는 공상에 가깝지요. 소음인은 하나의 생각을 끝낼 때까지 붙들고 가서, 한 가지만 한두 주, 길게는 한두 해씩 물고 늘어지기도 합니다.", "그래서 사람들은 태음인을 보고 '저 사람은 별 신경도 걱정도 없이 태평하게 사나 보다' 여기지만, 막상 이야기를 나눠 보면 가능한 모든 경우의 수를 이미 다 헤아려 두었다는 걸 알게 됩니다. 그를 좋게 보는 사람은 '보기와 달리 생각이 참 깊다'고 하고, 그렇지 않은 사람은 '언제 그런 생각을 다 했나, 속을 알 수 없다'고도 하지요. 움직임이 느리고 이런저런 상황을 다 살피느라 더러 욕을 먹기도 하지만, 그래도 크게 개의치 않고 느긋하고 여유롭습니다.", "태음인은 무언가를 쉽게 결정하지 못합니다. 아예 못 하는 건 아니지만, 결정한다는 일이 참 어렵지요. 땅 위에 무엇을 심을지는 땅이 정하는 게 아니듯, 결정은 태음인의 본성이 아니에요. 남들은 쉽게쉽게 정하는 일도, 막상 본인이 정해야 하면 이것저것이 다 마음에 걸립니다. 태음인은 누군가 정한 것을 든든히 받쳐 주는 사람이지, 앞장서서 사람들을 이끌고 나가는 대장은 아닙니다.", "이를테면 가족과 여행을 가서 식사 때가 되어 남편이 '뭐 먹을까?' 하고 물으면, 태음인은 선뜻 '이건 어때' 하고 답하지 못합니다. 그 순간 머릿속에 수많은 생각이 거의 동시에 떠오르거든요. '나는 저게 먹고 싶지만 남편은 이런 걸 좋아하는데, 아이들은 또 다른 걸 원하겠지. 그걸 다 만족시킬 식당이 있을까? 저기 보이는 곳이 그럴 듯도 한데 막상 들어갔다 아니면 어쩌지, 남편은 짜증 내고 아이들은 투덜대겠지. 조금 더 가면 더 좋은 데가 나올까? 그런데 더 갔다가 지금만 못한 곳이면 어떡하지?' 이건 생각이라기보다 차라리 걱정에 가깝습니다. 그래서 결국 결정을 내리지 못하지요. 이 사람 저 사람이 다 걸리니까요.", "만약 남편이 소양인이라면 망설이는 아내를 답답해하며 그냥 정해 버릴 텐데, 태음인은 웬만하면 그 결정을 마다하지 않습니다. 쉽게 정하지 못한다는 것은, 뒤집어 보면 어떤 결정이든 받아들일 수 있다는 뜻이기도 하니까요. 속으로 백 퍼센트 만족하진 않아도, 아쉬운 대로 따라가는 것이지요.", "공부할 때도 마찬가지예요. 영어를 펴면 수학이 생각나고, 수학을 펴면 과학이, 과학을 펴면 사회가 떠올라 지금 무엇부터 해야 할지 쉽게 정하지 못합니다. 이를 스스로 다스리는 태음인 아이는 '이러다간 죽도 밥도 안 되겠다, 오늘은 무조건 수학부터' 하고 결단을 내리지만, 대부분의 아이는 그 무수한 걱정 속에서 이 책 저 책 뒤적이다 시간을 흘려보내기 쉽습니다.", "그런 아이를 '산만하다'고 야단치면 아이는 어쩔 줄을 몰라 합니다. 겁이 나 뭔가 해 보려 하면 졸음이 쏟아지지요. 태음인은 억지로 집중하려 하면 잠이 밀려오지만, 자연스럽게 몰입할 때는 결코 졸지 않습니다. 그러니까 태음인에게 가장 중요한 것은 바로 이 '자연스러움'이에요. 자연스럽지 못한 일은 미치도록 하기 싫어하거든요. 억지로 시키거나 졸 때 야단치면, 아이는 반항하거나 스스로를 한심하게 여겨 자신감을 잃고 맙니다. 그래서 다그쳐 끌고 가기보다, 자연스럽게 집중할 수 있도록 곁에서 도와주는 것이 무엇보다 중요합니다.", "태음인은 무엇보다 관계를 아낍니다. 마뜩잖은 사람이 있어도 '그래도 대충 같이 가지 뭐' 하고 넘기고, 공부하는 분위기에서는 그 자연스러운 분위기를 깨고 싶지 않아 함께 공부하지만, 노는 분위기에서는 혼자 공부하지 못합니다. 어디 놀러 갈 때도 '어디로 가요?'보다 '누구누구 가요?'를 먼저 묻지요. 내가 끼어도 편안한 자리인지, 불편한 자리는 아닌지를 살피는 거예요. 남들 앞에 나서는 일은 '그렇게 튀는 건 무지 민망하다'며 어색해합니다. 이 모든 바탕에, 남에게 자리를 내어주고 배려하는 사양지심의 마음이 있습니다."],
  seed: ["소음인은 '씨앗 같은' 사람입니다. 씨앗 속에는 한 생명이 나고 자라고 시드는 모든 에너지가 맹아의 형태로 응축되어 있지요. 사람의 씨앗인 정자와 난자, 그 둘이 만난 수정란을 떠올려 보세요. 눈에도 보이지 않는 그 작은 유전자 다발 안에, 장차 몸을 이룰 온갖 기관의 정보는 물론 얼굴 생김새와 성격의 일부까지 담겨 있습니다. 이렇게 거대한 생명의 에너지가 작은 내면에 단단히 응축되어 있는 것 — 그것이 씨앗이에요.", "그래서 소음인은 자아가 자기 안에 깊이 응축된 사람이라고 할 수 있습니다. 언젠가 밖으로 생명의 기운을 뿜어 싹을 틔우고, 맑은 햇살과 물을 만나 제 에너지를 펼칠 날을 기다리는 씨앗 같은 사람이지요. 그 자아는 그 자체로 하나의 완결된 작은 우주와 같아서, 소음인은 자아가 대단히 강합니다. 그러다 보니 남보다 자기 자신에게 관심이 향하고, 남에게 있는 것도 다 자기 속에 있는 듯 느끼거나 남의 기질마저 자기 안으로 끌어들이고 싶어 합니다. 자연히 남과 잘 어울리기보다, 인간관계의 모든 면을 자기를 중심으로 헤아리는 생활 방식이 자리잡지요.", "같은 이야기를 겨울에 빗대 볼 수도 있어요. 흔히 씨앗은 봄에 싹 트고 가을에 열매 맺는다고 여기지만, 사실 씨앗은 겨울을 거치지 않으면 완성되지 않습니다. 봄여름이 생명력을 땅 위로 펼치고 흩뿌리는 때라면, 가을겨울은 그것을 거두어 씨앗 속으로 갈무리하는 때예요. 겨울의 찬 기운을 받지 못하면 씨앗 속 양기가 단단히 뭉치지 못하고, 그렇게 겨울을 제대로 나지 못한 씨앗은 봄에 싹을 잘 틔우지 못합니다. 생명력이 없는 게 아니라, 안으로 응축되어 있는 것이지요.", "그래서 소음인은 밖으로 잘 드러나지 않습니다. 늘 자기 내면에서 일어나는 일을 들여다보고, 밖을 보거나 주변을 살필 때도 언제나 자기 내면에서 시작하거나 그것을 중심에 두지요. 무슨 일이든 먼저 자기 내면이 정리되어야 비로소 마음의 안정을 얻고, 그래야 평안하고 즐겁게 일을 밀고 나갈 수 있습니다. 자신이 먼저 정리되어야 한다는 것 — 그것이 소음인의 본성에 맞는 길이에요.", "소음인은 하나하나 천천히 정리해 완전히 소화하여 제 것으로 만들 때 비로소 다음 단계로 넘어갑니다. (정리되지 않으면 않은 대로 일을 벌이며 그 가운데 정리하는 소양인, 정리하고 싶어도 고려할 게 너무 많아 끝내 정리가 안 되는 태음인, 정리한다고 하지만 겉으로는 전혀 정리되지 않는 태양인과는 다르지요.) 그래서 가르치는 아이가 소음인이라면 조심해야 합니다. 내면이 정리되지 않으면 다른 일은 시작조차 못 하는데, 소화할 틈도 주지 않고 피아노·바둑·수학·영어로 이리저리 끌고 다니면 아이는 무척 괴롭거든요. 서두르지 말고 천천히, 필요한 것을 확실하고 자세히 가르치는 것이 가장 중요합니다. 그렇게 더디 가는 대신, 한번 제대로 이해한 것은 절대 잊지 않는 놀라운 기억력을 지녔습니다.", "소음인은 늘 자기 자신을 돌아보며 '나는 왜 이럴까' 하는 반성을 많이 합니다. 좀 과장하면 모든 일을 '내 탓이오' 하는 셈이에요. 일이 잘 안 되면 남이나 상황을 탓하기보다 '내가 뭘 잘못했지, 어떻게 했어야 했지' 하며 자기 안에서 답을 찾지요. 그래서 별 반성 없이 또 새 일을 벌이는 소양인이나 태양인을 보면, 자기반성이라곤 눈곱만큼도 없는 사람들이라며 짜증을 내기도 합니다. 그렇게 자기 안에서 답을 찾는 모습은 어떨 땐 멍해 보이지만, 사실은 깊이 몰입해 꼼꼼히 들여다보는 중이에요. 멍한 얼굴과 곰곰이 생각하는 얼굴은 겉보기에 닮았으니까요.", "소음인은 자기 내면이 관심을 두는 분야에 한해 대단한 집중력을 발휘합니다. 반대로 내면이 관심을 두지 못하는 일에는 다른 체질보다 오히려 더 둔하게 굴지요. 자기 안에 들어오지 않는 것은 별로 중요하게 여기지 않으니까요. '신선놀음에 도끼 자루 썩는 줄 모른다'는 말은 아마 소음인을 두고 만든 듯합니다. 좋아하는 일에 빠지면 밥 먹는 것도 잊을 만큼 몰두하거든요. 한 가지에만 파고들기에 다양함이나 변화에는 약하지만, '깊이'에서는 따라올 사람이 없습니다. 그 깊이로 자신감을 얻고 자연스러워질 때, 비로소 넓이와 크기도 생각하게 되지요.", "이렇게 강한 자아가 자기 안의 '나'를 그릇되게 확신하면 독단에 빠지기 쉽습니다 — 정치로 치면 독재자가 되는 셈이지요. 그러나 자신을 올바로 대하게 되면, 주변에 좋은 씨앗을 나누어 주는 사람이 됩니다. 젊은이처럼 활동적으로 일하진 못해도 오랜 경험과 시간으로 함축된 지혜를 지닌 노인처럼요. 그 지혜가 주변에 가닿을 때, 사람들 마음에는 미래에 대한 희망이라는 씨앗이 심깁니다. 그래서 이런 말이 있어요. 소음인이 자기 자신을 용서할 수 있다면, 그는 세상 모든 사람을 다 용서할 수 있다고요."],
};
function DeepView({
  child,
  type,
  onBack
}) {
  const top = type || topType(child.scores),
    T = TYPES[top],
    D = DEEP[top];
  useEffect(() => { try { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch (e) {} }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "fade"
  }, /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onBack
  }, "\u2039 \uACB0\uACFC\uB85C"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    type: top,
    size: 64
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.deepTitle,
      color: T.color
    }
  }, "\uCC45\uC774 \uB9D0\uD558\uB294 \u2018", T.name, "\u2019 \uAC19\uC740 \uC544\uC774"), /*#__PURE__*/React.createElement("div", {
    style: TS.deepSub
  }, T.sasang, " \xB7 ", T.sadan, " \xB7 \uC1A1\uC7AC\uD76C \u300E\uC0AC\uC0C1\uCCB4\uC9C8 \uD559\uC2B5\uBC95\u300F \uC815\uBC00 \uBD84\uC11D")), /*#__PURE__*/React.createElement("div", {
    style: TS.deepLead
  }, withName(child.name), "\uB294 \uB124 \uACB0 \uAC00\uC6B4\uB370 \u2018", T.name, "\u2019\uC758 \uACB0\uC785\uB2C8\uB2E4. ", T.sadan, "\uC758 \uB9C8\uC74C \u2014 ", sadanDesc[top], ". \u300E\uC0AC\uC0C1\uCCB4\uC9C8 \uD559\uC2B5\uBC95\u300F\uC774 \u2018", T.name, " \uAC19\uC740 \uC544\uC774\u2019\uB97C \uD480\uC5B4\uAC00\uB294 \uC21C\uC11C \uADF8\uB300\uB85C, ", withName(child.name), "\uC5D0 \uB9DE\uCD94\uC5B4 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4.", child.isParent ? " (아이를 기준으로 쓰인 글이지만, 부모님 자신의 결을 이해하는 데에도 그대로 적용됩니다.)" : ""), !D ? /*#__PURE__*/React.createElement("div", {
    style: TS.deepSoon
  }, "\uC774 \uACB0\uC758 \uC815\uBC00 \uBD84\uC11D\uC740 \uACE7 \u2018", T.name, "\u2019 \uCC55\uD130\uB97C \uAC19\uC740 \uAE4A\uC774\uB85C \uBD84\uC11D\uD574 \uCC44\uC6B8\uAC8C\uC694. \uC9C0\uAE08\uC740 \uACB0\uACFC\uC9C0\uC758 \uC694\uC57D\uC744 \uCC38\uACE0\uD574 \uC8FC\uC138\uC694.") : /*#__PURE__*/React.createElement(React.Fragment, null, D.parts.map((sec, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: TS.deepSec
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.deepH,
      color: T.color
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...TS.introNum,
      borderColor: T.color + "66",
      color: T.color
    }
  }, sec.n), " ", sec.t), sec.b.map((p, j) => /*#__PURE__*/React.createElement("p", {
    key: j,
    style: TS.deepP
  }, p)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.deepClose,
      borderColor: T.color + "55"
    }
  }, D.close), /*#__PURE__*/React.createElement("div", {
    style: TS.deepParentNote
  }, "\uD55C \uAC00\uC9C0 \uB354 \u2014 \uC774 \uCC45\uC740 \uB9C8\uC9C0\uB9C9\uC5D0 \uC774\uB807\uAC8C \uB2F9\uBD80\uD574\uC694. \uC544\uC774\uC758 \uACB0\uB9CC \uB9DE\uCD94\uB824 \uB4E4\uBA74 \uBD80\uBAA8\uAC00 \uC9C0\uCCD0\uC694. \uBD80\uBAA8\uB2D8 \uC790\uC2E0\uC758 \uACB0\uC744 \uBA3C\uC800 \uC54C\uACE0 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uB300\uD560 \uB54C, \uBE44\uB85C\uC18C \uC544\uC774\uC758 \uACB0\uB3C4 \uC788\uB294 \uADF8\uB300\uB85C \uD488\uC744 \uC218 \uC788\uB2E4\uACE0\uC694.")), /*#__PURE__*/React.createElement("div", { style: TS.deepSec }, /*#__PURE__*/React.createElement("div", { style: { ...TS.deepH, color: T.color } }, /*#__PURE__*/React.createElement("span", { style: { ...TS.introNum, borderColor: T.color + "66", color: T.color } }, "❖"), " 책이 그린 ‘", T.name, "’의 모습"), PORTRAIT[top].map((p, i) => /*#__PURE__*/React.createElement("p", { key: "pt" + i, style: TS.deepP }, p))), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.primary,
      marginTop: 22
    },
    onClick: onBack
  }, "\uACB0\uACFC\uB85C \uB3CC\uC544\uAC00\uAE30"));
}
function DeepAll({
  child,
  onBack
}) {
  const scores = child.scores || {};
  const ordered = ORDER.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  useEffect(() => { try { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch (e) {} }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "fade"
  }, /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onBack
  }, "\u2039 \uACB0\uACFC\uB85C"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.deepTitle,
      color: TC.gold
    }
  }, "\uCC45\uC774 \uADF8\uB9B0 \uB124 \uAC00\uC9C0 \uACB0"), /*#__PURE__*/React.createElement("div", {
    style: TS.deepSub
  }, "\uC1A1\uC7AC\uD76C \u300E\uC0AC\uC0C1\uCCB4\uC9C8 \uD559\uC2B5\uBC95\u300F \xB7 \uB124 \uC720\uD615 \uBAA8\uB450 \uBCF4\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.deepLead,
      background: "rgba(212,168,67,0.08)",
      border: "1px solid rgba(212,168,67,0.22)",
      borderRadius: 14,
      padding: "14px 16px"
    }
  }, "\uAC80\uC0AC \uACB0\uACFC\uAC00 \uB610\uB837\uD558\uC9C0 \uC54A\uAC70\uB098 \uB354 \uAE4A\uC774 \uC0B4\uD3B4\uBCF4\uACE0 \uC2F6\uC744 \uB54C \u2014 \uB124 \uC720\uD615\uC758 \uBAA8\uC2B5\uC744 \uBAA8\uB450 \uC77D\uACE0, ", withName(child.name), "\uC5D0\uAC8C \uAC00\uC7A5 \uAC00\uAE4C\uC6B4 \uACB0\uC744 \uC9C1\uC811 \uCC3E\uC544\uBCF4\uC138\uC694. \uAC80\uC0AC \uACB0\uACFC\uB294 \uCC38\uACE0\uC77C \uBFD0, \uB9C8\uC9C0\uB9C9 \uD310\uB2E8\uC740 \uACC1\uC5D0\uC11C \uC9C0\uCF1C\uBCF8 \uBD84\uC758 \uBABE\uC774\uC5D0\uC694."), ordered.map((t, i) => {
    const T = TYPES[t];
    const ps = PORTRAIT[t] || [];
    return /*#__PURE__*/React.createElement("div", {
      key: t,
      style: {
        marginTop: 18,
        padding: "16px 16px 6px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid " + T.color + "44"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      type: t,
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 800,
        fontSize: 17,
        color: T.color
      }
    }, T.name, " \xB7 ", T.sasang), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: TC.mute
      }
    }, T.sadan)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 800,
        fontSize: 18,
        color: T.color
      }
    }, Math.round(scores[t] || 0), "%")), ps.map((p, j) => /*#__PURE__*/React.createElement("p", {
      key: j,
      style: TS.deepP
    }, p)));
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.primary,
      marginTop: 22
    },
    onClick: onBack
  }, "\uACB0\uACFC\uB85C \uB3CC\uC544\uAC00\uAE30"));
}

const sadanDesc = {
  earth: "불편함을 견디지 못해 양보하고, 사람들 사이의 원만함과 자연스러움을 가장 소중히 여기는 마음이에요",
  bird: "옳고 그름을 못 견디는, 정의롭고 순발력 있는 마음이에요",
  seed: "맞고 틀림을 가리는, 신중하고 깊이 따지는 마음이에요",
  sky: "약한 것을 불쌍히 여기는, 원리와 이상을 좇는 마음이에요"
};
const KEY = "cheji:children:v1";
const SITE_URL = "https://pagodream.github.io/maum/"; // 배포 주소

// 받침 있는 이름엔 '이'를 붙여 조사가 자연스럽게: 다다→다다, 드림→드림이
function withName(name) {
  if (!name) return name || "";
  const c = name.charCodeAt(name.length - 1);
  const batchim = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return batchim ? name + "이" : name;
}
function subjName(child) {
  const n = child && child.name ? child.name : "";
  if (!n) return n;
  const c = n.charCodeAt(n.length - 1);
  const batchim = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  if (child && child.isParent) return n + (batchim ? "은" : "는");
  return (batchim ? n + "이" : n) + "는";
}

// 깃허브(크롬)에선 localStorage, 클로드 환경에선 window.storage 사용
const store = {
  async get(k) {
    try {
      if (typeof window !== "undefined" && window.storage) return await window.storage.get(k);
      const v = localStorage.getItem(k);
      return v ? {
        value: v
      } : null;
    } catch (e) {
      return null;
    }
  },
  async set(k, v) {
    try {
      if (typeof window !== "undefined" && window.storage) return await window.storage.set(k, v);
      localStorage.setItem(k, v);
    } catch (e) {}
  }
};

// ── 전체 앱 백업/복원 (모든 저장 키를 한 번에) ──
const BACKUP_KEYS = ["maum_world5", "cheji:children:v1", "maum_drawer", "maum_temper", "maum_child", "maum_quote_seen", "maum_map_mode", "maum_group"];
// 기억하기 쉬운 백업 코드 자동 생성 (예: maum-포근한참새-482)
const BK_WORDS_A = ["포근한", "다정한", "씩씩한", "반짝이는", "따뜻한", "용감한", "상냥한", "노래하는", "행복한", "슬기로운"];
const BK_WORDS_B = ["참새", "고양이", "햇살", "구름", "별빛", "민들레", "토끼", "단풍", "물결", "나무"];
function genBackupCode() {
  const a = BK_WORDS_A[Math.floor(Math.random() * BK_WORDS_A.length)];
  const b = BK_WORDS_B[Math.floor(Math.random() * BK_WORDS_B.length)];
  const n = Math.floor(100 + Math.random() * 900);
  return `maum-${a}${b}-${n}`;
}
const BACKUP_SHEET = "https://script.google.com/macros/s/AKfycbxkpIeb9FmErkwE1nDvnBa4F9L3hBg295hYd-UWksPAkYwO-MRkjHiojRFfH7thuuPY/exec";
async function gatherBackup() {
  const data = {};
  for (const k of BACKUP_KEYS) {
    try {
      const r = await store.get(k);
      if (r && r.value != null) data[k] = r.value;
    } catch (e) {}
  }
  return {
    app: "마음곳간",
    v: 1,
    exportedAt: new Date().toISOString(),
    data
  };
}
async function applyBackup(obj) {
  const data = obj && obj.data ? obj.data : obj; // 신형/구형 모두 허용
  if (!data || typeof data !== "object") throw new Error("형식 오류");
  for (const k of BACKUP_KEYS) {
    if (data[k] != null) {
      try {
        await store.set(k, data[k]);
      } catch (e) {}
    }
  }
}
// 구글시트 자동 백업 — 별명(nick)으로 묶어 한 줄 저장 (덮어쓰기)
async function cloudBackup(nick, label) {
  if (!nick) return {
    ok: false,
    reason: "no-nick"
  };
  try {
    const snap = await gatherBackup();
    const res = await fetch(BACKUP_SHEET, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        source: "backup",
        nick: nick,
        찾기별명: label || "",
        payload: JSON.stringify(snap)
      })
    });
    const j = await res.json().catch(() => null);
    return j && j.ok ? {
      ok: true
    } : {
      ok: false,
      reason: "server"
    };
  } catch (e) {
    return {
      ok: false,
      reason: "network"
    };
  }
}
// 백업 데이터 안의 '기록 개수' (빛+보석+마음의보석+서랍) — 안전장치용 비교 기준
function countRecords(snap) {
  try {
    const data = snap && snap.data ? snap.data : snap;
    if (!data) return 0;
    let n = 0;
    if (data["maum_world5"]) {
      const w = JSON.parse(data["maum_world5"]);
      n += (w.lights || []).length + (w.gems || []).length + (w.sos || []).length;
    }
    if (data["maum_drawer"]) {
      n += (JSON.parse(data["maum_drawer"]) || []).length;
    }
    return n;
  } catch (e) {
    return 0;
  }
}
// 시트에 저장된 기존 백업의 기록 개수 조회 (없으면 -1)
// 시트에서 그 별명의 가장 최근 백업 payload를 찾는다 (행이 여러 개면 마지막 것)
async function fetchBackupPayload(nick) {
  const res = await fetch(BACKUP_SHEET, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      source: "backup",
      action: "load"
    })
  });
  const j = await res.json().catch(() => null);
  if (!j || !j.ok || !Array.isArray(j.rows)) return null;
  let found = null;
  for (const row of j.rows) {
    if (String(row.nick) === String(nick) && row.payload) found = row.payload;
  }
  return found; // 마지막으로 일치한 행 = 최신
}
async function cloudBackupCount(nick) {
  if (!nick) return -1;
  try {
    const payload = await fetchBackupPayload(nick);
    if (payload) return countRecords(JSON.parse(payload));
    return -1;
  } catch (e) {
    return -1;
  }
}
async function cloudRestore(nick) {
  if (!nick) return {
    ok: false,
    reason: "no-nick"
  };
  try {
    const payload = await fetchBackupPayload(nick);
    if (payload) {
      await applyBackup(JSON.parse(payload));
      return {
        ok: true
      };
    }
    return {
      ok: false,
      reason: "not-found"
    };
  } catch (e) {
    return {
      ok: false,
      reason: "network"
    };
  }
}

// 구글시트(Apps Script 웹앱) 주소 — 배포 후 …/exec URL 붙여넣기 (양쪽 앱 동일하게)
const SHEET_API = "https://script.google.com/macros/s/AKfycbxkpIeb9FmErkwE1nDvnBa4F9L3hBg295hYd-UWksPAkYwO-MRkjHiojRFfH7thuuPY/exec";
function deviceId() {
  try {
    let id = localStorage.getItem("mc:uid");
    if (!id) {
      id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      localStorage.setItem("mc:uid", id);
    }
    return id;
  } catch (e) {
    return "u0";
  }
}
async function postSheet(obj) {
  if (!SHEET_API) return;
  try {
    await fetch(SHEET_API, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(obj)
    });
  } catch (e) {}
}
function postCheji(child) {
  if (!child || !child.scores) return;
  const t = TYPES[topType(child.scores)];
  postSheet({
    source: "cheji",
    userId: deviceId(),
    아이이름: child.name,
    역할: child.isParent ? "부모" : "아이",
    결과: t.name,
    사상: t.sasang,
    새: child.scores.bird,
    하늘: child.scores.sky,
    땅: child.scores.earth,
    뿌리: child.scores.seed,
    방식: child.mode === "easy" ? "간편" : "정밀",
    응답수: child.done || "",
    전체: child.total || ""
  });
}
function TestPage({
  onHome,
  onCoach,
  onWorld
}) {
  const [children, setChildren] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({
    s: "home"
  }); // home | add | mode | test | result
  useHistoryNav(view, setView); // 진단 단계(이름→모드→검사→결과) 단계별 뒤로가기
  const [name, setName] = useState("");
  const [byear, setByear] = useState(""); // 생년 4자리
  const [bmonth, setBmonth] = useState(""); // 생월

  useEffect(() => {
    (async () => {
      try {
        const r = await store.get(KEY);
        if (r && r.value) setChildren(JSON.parse(r.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);
  const save = async list => {
    setChildren(list);
    try {
      await store.set(KEY, JSON.stringify(list));
    } catch (e) {}
  };
  // ✏️ 아이 이름 바꾸기 — 모든 기록(빛·보석·서랍·코치 기억)의 꼬리표도 함께 따라간다
  const renameChild = async c => {
    const nn = window.prompt(`'${c.name}'의 새 이름(별명)을 적어주세요.`, c.name);
    if (nn == null) return;
    const v = nn.trim();
    if (!v || v === c.name) return;
    if (children.some(x => x.id !== c.id && x.name === v)) {
      window.alert("같은 이름이 이미 있어요. 다른 이름으로 해주세요.");
      return;
    }
    const oldName = c.name;
    save(children.map(x => x.id === c.id ? {
      ...x,
      name: v
    } : x));
    try {
      const w = await store.get("maum_world5");
      if (w && w.value) {
        const o = JSON.parse(w.value);
        ["lights", "gems", "sos"].forEach(k => {
          if (Array.isArray(o[k])) o[k].forEach(e => {
            if (e && e.child === oldName) e.child = v;
          });
        });
        await store.set("maum_world5", JSON.stringify(o));
      }
    } catch (e) {}
    try {
      const d = await store.get("maum_drawer");
      if (d && d.value) {
        const list = JSON.parse(d.value);
        if (Array.isArray(list)) {
          list.forEach(e => {
            if (e && e.child === oldName) e.child = v;
          });
          await store.set("maum_drawer", JSON.stringify(list));
        }
      }
    } catch (e) {}
    try {
      const mc = await store.get("maum_child");
      if (mc && mc.value === oldName) await store.set("maum_child", v);
    } catch (e) {}
    window.alert(`'${oldName}' → '${v}'(으)로 바꿨어요.\n빛·보석·마음 서랍의 기록도 함께 따라갔어요.`);
  };
  const removeChild = async c => {
    save(children.filter(x => x.id !== c.id));
    try {
      await store.set(`cheji:prog:${c.id}:easy`, "");
      await store.set(`cheji:prog:${c.id}:full`, "");
    } catch (e) {}
  };
  return /*#__PURE__*/React.createElement("div", {
    style: TS.root
  }, /*#__PURE__*/React.createElement("style", null, TEST_CSS), /*#__PURE__*/React.createElement("div", {
    className: "tFrame",
    style: TS.frame
  }, view.s !== "home" ? /*#__PURE__*/React.createElement("button", {
    style: TS.topHome,
    onClick: () => setView({
      s: "home"
    }),
    "aria-label": "\uC9C4\uB2E8 \uD648\uC73C\uB85C"
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.topHomeIcon
  }, "\u2302"), " \uC9C4\uB2E8 \uD648") : /*#__PURE__*/React.createElement("button", {
    style: TS.topHome,
    onClick: onHome,
    "aria-label": "\uC571 \uD648\uC73C\uB85C"
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.topHomeIcon
  }, "\u2039"), " \uD648"), view.s === "home" && /*#__PURE__*/React.createElement(ChejiHome, {
    children: children,
    loaded: loaded,
    onIntro: () => setView({
      s: "intro"
    }),
    onAdd: () => {
      setName("");
      setByear("");
      setBmonth("");
      setView({
        s: "add"
      });
    },
    onAddParent: () => {
      setName("");
      setByear("");
      setBmonth("");
      setView({
        s: "add",
        parent: true
      });
    },
    onDelete: removeChild,
    onRename: renameChild,
    onPick: id => {
      const ch = children.find(c => c.id === id);
      ch && ch.scores ? setView({
        s: "result",
        id
      }) : setView({
        s: "mode",
        id
      });
    }
  }), view.s === "intro" && /*#__PURE__*/React.createElement(Intro, {
    onBack: () => setView({
      s: "home"
    }),
    onStart: () => setView(children.length ? {
      s: "home"
    } : {
      s: "add"
    })
  }), view.s === "add" && /*#__PURE__*/React.createElement(AddChild, {
    parent: view.parent,
    name: name,
    setName: setName,
    byear: byear,
    setByear: setByear,
    bmonth: bmonth,
    setBmonth: setBmonth,
    onBack: () => setView({
      s: "home"
    }),
    onSave: () => {
      if (!name.trim()) return;
      const id = Date.now();
      save([...children, {
        id,
        name: name.trim(),
        isParent: !!view.parent,
        byear: byear.trim(),
        bmonth: bmonth.trim()
      }]);
      setView({
        s: "mode",
        id
      });
    }
  }), view.s === "mode" && /*#__PURE__*/React.createElement(ModePick, {
    child: children.find(c => c.id === view.id),
    onBack: () => setView({
      s: "home"
    }),
    onPick: mode => setView({
      s: "test",
      id: view.id,
      mode
    })
  }), view.s === "test" && /*#__PURE__*/React.createElement(Test, {
    child: children.find(c => c.id === view.id),
    mode: view.mode,
    onBack: () => setView({
      s: "home"
    }),
    onDone: (scores, answers, done, total) => {
      const list = children.map(c => c.id === view.id ? {
        ...c,
        scores,
        answers,
        done,
        total,
        mode: view.mode,
        date: new Date().toISOString()
      } : c);
      save(list);
      const ch = list.find(c => c.id === view.id);
      if (ch && !ch.isParent) {
        try {
          store.set("maum_temper", TYPES[topType(scores)].name);
        } catch (e) {}
      }
      postCheji(ch);
      setView({
        s: "result",
        id: view.id
      });
    }
  }), view.s === "result" && /*#__PURE__*/React.createElement(Result, {
    child: children.find(c => c.id === view.id),
    parent: children.find(c => c.isParent && c.scores),
    kids: children.filter(c => !c.isParent && c.scores),
    onHome: () => setView({
      s: "home"
    }),
    onCoach: onCoach,
    onWorld: onWorld,
    onDeep: t => setView({
      s: "deep",
      id: view.id,
      type: t
    }),
    onDeepAll: () => setView({
      s: "deepall",
      id: view.id
    }),
    onRetake: () => setView({
      s: "mode",
      id: view.id
    })
  }), view.s === "deep" && /*#__PURE__*/React.createElement(DeepView, {
    child: children.find(c => c.id === view.id),
    type: view.type,
    onBack: () => setView({
      s: "result",
      id: view.id
    })
  }), view.s === "deepall" && /*#__PURE__*/React.createElement(DeepAll, {
    child: children.find(c => c.id === view.id),
    onBack: () => setView({
      s: "result",
      id: view.id
    })
  })));
}
function ChejiHome({
  children,
  loaded,
  onAdd,
  onAddParent,
  onPick,
  onDelete,
  onRename,
  onIntro
}) {
  const parent = children.find(c => c.isParent);
  const kids = children.filter(c => !c.isParent);
  const fresh = loaded && children.length === 0; // 첫 방문
  if (!loaded) return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 240
    }
  }); // 저장소 읽는 동안은 빈 화면 (잘못된 화면 깜빡임 방지)
  const askDelete = c => {
    const label = c.scores ? `'${c.name}'의 검사 결과를 지울까요?` : `'${c.name}'의 하던 검사를 지울까요?`;
    if (window.confirm(label + "\n(이 작업은 되돌릴 수 없어요.)")) onDelete(c);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.eyebrow
  }, "\uB9C8\uB354\uD074\uB7FD \xB7 \uCCB4\uC9C8 \uD559\uC2B5 \uC9C4\uB2E8"), fresh ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: TS.heroH1
  }, "\uAC19\uC740 \uCE6D\uCC2C\uC778\uB370,", /*#__PURE__*/React.createElement("br", null), "\uC65C \uC6B0\uB9AC \uC544\uC774\uC5D0\uAC90", /*#__PURE__*/React.createElement("br", null), "\uC548 \uD1B5\uD560\uAE4C\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: TS.heroAns
  }, "\uC544\uC774\uB9C8\uB2E4 \uD0C0\uACE0\uB09C \u2018\uACB0\u2019\uC774 \uB2E4\uB974\uAE30 \uB54C\uBB38\uC774\uC5D0\uC694.", /*#__PURE__*/React.createElement("br", null), "\uD558\uB298\uCC98\uB7FC, \uC0C8\uCC98\uB7FC, \uB545\uCC98\uB7FC, \uBFCC\uB9AC\uCC98\uB7FC \u2014")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: TS.h1
  }, "\uC6B0\uB9AC \uC544\uC774\uC758 \uACB0, \uB2E4\uC2DC \uBCFC\uAE4C\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: TS.sub
  }, "\uD48D\uACBD \uC18D \uB124 \uACB0\uC744 \uB20C\uB7EC\uBCF4\uAC70\uB098, \uC544\uB798\uC5D0\uC11C \uC544\uC774\uB97C \uACE8\uB77C \uC2DC\uC791\uD574\uC694.")), /*#__PURE__*/React.createElement(HeroScene, {
    onStart: onAdd
  }), fresh && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: TS.orn
  }, "\xB7\xA0\xA0\u2726\xA0\xA0\xB7"), /*#__PURE__*/React.createElement("button", {
    style: TS.quoteWrap,
    onClick: onIntro
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.quoteMark
  }, "\u201C"), /*#__PURE__*/React.createElement("div", {
    style: TS.quoteTxt
  }, "\uC6B0\uB9AC \uC544\uC774\uAC00 \uC0C8 \uAC19\uC740 \uC544\uC774\uC778\uC9C0, \uD558\uB298 \uAC19\uC740 \uC544\uC774\uC778\uC9C0, \uB545 \uAC19\uC740 \uC544\uC774\uC778\uC9C0, \uBFCC\uB9AC \uAC19\uC740 \uC544\uC774\uC778\uC9C0\u2026 \uAE30\uC9C8\uC744 \uC544\uC154\uC57C \uD574\uC694."), /*#__PURE__*/React.createElement("div", {
    style: TS.quoteWho
  }, "\u2014 \uC774\uC7AC\uD6C8 \uACE0\uBB38\uB2D8"), /*#__PURE__*/React.createElement("div", {
    style: TS.quoteLink
  }, "\uC65C \uC774 \uC9C4\uB2E8\uC744 \uD558\uB098\uC694 \u203A")), /*#__PURE__*/React.createElement("div", {
    style: TS.secLabelWrap
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.secLine
  }), /*#__PURE__*/React.createElement("span", {
    style: TS.secLabel
  }, "\uC9C4\uD589"), /*#__PURE__*/React.createElement("span", {
    style: TS.secLine
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: TS.tlRow
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.tlCol
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.tlDot
  }), /*#__PURE__*/React.createElement("span", {
    style: TS.tlLine
  })), /*#__PURE__*/React.createElement("div", {
    style: TS.tlTxt
  }, "\uC544\uC774\uB97C \uB5A0\uC62C\uB9AC\uBA70 \uB2F5\uD574\uC694.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: TS.tlSub
  }, "\uAC04\uD3B8 3\uBD84 \xB7 \uC815\uBC00 7\uBD84"))), /*#__PURE__*/React.createElement("div", {
    style: TS.tlRow
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.tlCol
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.tlDot
  }), /*#__PURE__*/React.createElement("span", {
    style: TS.tlLine
  })), /*#__PURE__*/React.createElement("div", {
    style: TS.tlTxt
  }, "\uC544\uC774\uC758 \uACB0\uACFC \uACF5\uBD80\uBC95, \u2018\uC624\uB298\uBD80\uD130 \uD55C \uAC00\uC9C0\u2019\uB97C \uBC1B\uC544\uC694.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: TS.tlSub
  }, "\uCC45 \uD55C \uAD8C \uAE4A\uC774\uC758 \uC815\uBC00 \uBD84\uC11D \uD3EC\uD568"))), /*#__PURE__*/React.createElement("div", {
    style: TS.tlRow
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.tlCol
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.tlDot
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.tlTxt,
      paddingBottom: 0
    }
  }, "\uBD80\uBAA8\uB2D8 \uACB0\uAE4C\uC9C0 \uC54C\uBA74, \uBD80\uBAA8\xD7\uC544\uC774 \uC870\uD569 \uC548\uB0B4\uAC00 \uC5F4\uB824\uC694.")))), !fresh && /*#__PURE__*/React.createElement("div", {
    style: TS.secLabelWrap
  }, /*#__PURE__*/React.createElement("span", {
    style: TS.secLine
  }), /*#__PURE__*/React.createElement("span", {
    style: TS.secLabel
  }, "\uC6B0\uB9AC \uAC00\uC871"), /*#__PURE__*/React.createElement("span", {
    style: TS.secLine
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: fresh ? 8 : 26
    }
  }, kids.map(c => {
    const top = c.scores ? topType(c.scores) : null;
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      style: TS.childRow
    }, /*#__PURE__*/React.createElement("button", {
      style: TS.childMain,
      onClick: () => onPick(c.id)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      type: top,
      size: 44
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "left"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: TS.childName
    }, c.name), /*#__PURE__*/React.createElement("div", {
      style: TS.childMeta
    }, top ? `${TYPES[top].name} · ${TYPES[top].sasang}` : "검사 전 — 눌러서 시작"))), /*#__PURE__*/React.createElement("span", {
      style: TS.chev
    }, c.scores ? "결과 ›" : "검사 ›")), /*#__PURE__*/React.createElement("button", {
      style: {
        ...TS.delBtn,
        fontSize: 13
      },
      onClick: () => onRename(c),
      "aria-label": `${c.name} 이름 바꾸기`
    }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
      style: TS.delBtn,
      onClick: () => askDelete(c),
      "aria-label": `${c.name} 삭제`
    }, "\u2715"));
  })), !fresh && /*#__PURE__*/React.createElement("button", {
    style: TS.addBtn,
    onClick: onAdd
  }, "+ \uC544\uC774 \uCD94\uAC00"), /*#__PURE__*/React.createElement("div", {
    style: TS.parentSec
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.parentHead
  }, "\uBD80\uBAA8\uB2D8\uC758 \uACB0, \uBA3C\uC800 \uC54C\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: TS.parentSub
  }, "\uBD80\uBAA8\uAC00 \uC790\uC2E0\uC758 \uACB0\uC744 \uBA3C\uC800 \uC774\uD574\uD560 \uB54C, \uC544\uC774\uC758 \uACB0\uB3C4 \uC788\uB294 \uADF8\uB300\uB85C \uD488\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBD80\uBAA8\uB2D8\uC758 \uACB0\uAE4C\uC9C0 \uC9C4\uB2E8\uD558\uC2DC\uBA74, \uC544\uC774 \uACB0\uACFC\uC5D0 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: TC.gold
    }
  }, "\uBD80\uBAA8\u2013\uC544\uC774 \uC870\uD569 \uBD84\uC11D"), "\uC774 \uD568\uAED8 \uC81C\uACF5\uB429\uB2C8\uB2E4."), parent ? /*#__PURE__*/React.createElement("div", {
    style: TS.childRow
  }, /*#__PURE__*/React.createElement("button", {
    style: TS.childMain,
    onClick: () => onPick(parent.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    type: parent.scores ? topType(parent.scores) : null,
    size: 44,
    fallback: "\uD83D\uDC69"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.childName
  }, parent.name), /*#__PURE__*/React.createElement("div", {
    style: TS.childMeta
  }, parent.scores ? `${TYPES[topType(parent.scores)].name} · ${TYPES[topType(parent.scores)].sasang}` : "검사 전 — 눌러서 시작"))), /*#__PURE__*/React.createElement("span", {
    style: TS.chev
  }, parent.scores ? "결과 ›" : "검사 ›")), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.delBtn,
      fontSize: 13
    },
    onClick: () => onRename(parent),
    "aria-label": "\uC774\uB984 \uBC14\uAFB8\uAE30"
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    style: TS.delBtn,
    onClick: () => askDelete(parent),
    "aria-label": "\uC0AD\uC81C"
  }, "\u2715")) : /*#__PURE__*/React.createElement("button", {
    style: TS.parentBtn,
    onClick: onAddParent
  }, "\uB0B4 \uACB0 \uC54C\uC544\uBCF4\uAE30 \u203A")), /*#__PURE__*/React.createElement("div", {
    style: TS.footer
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.footNote
  }, "\u203B \uC5EC\uAE30\uC11C \uB9D0\uD558\uB294 \u2018\uCCB4\uC9C8\u2019\uC740 \uD55C\uBC29 \uCCB4\uC9C8\uC758\uD559\uC774 \uC544\uB2C8\uB77C, \uC544\uC774\uAC00 \uD0C0\uACE0\uB09C \u2018\uAE30\uC9C8\u2019\uC744 \uB73B\uD569\uB2C8\uB2E4.", /*#__PURE__*/React.createElement("br", null), "\uACB0\uACFC\uB294 \uC544\uC774\uB97C \uADDC\uC815\uD558\uB294 \uD310\uC815\uC774 \uC544\uB2C8\uB77C, \uC774\uD574\uB97C \uB3D5\uB294 \uCD9C\uBC1C\uC810\uC73C\uB85C \uBCF4\uC544 \uC8FC\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: TS.refTxt
  }, "\uCC38\uACE0\uBB38\uD5CC \xB7 \uC1A1\uC7AC\uD76C \u300E\uC0AC\uC0C1\uCCB4\uC9C8 \uD559\uC2B5\uBC95\u300F"), /*#__PURE__*/React.createElement("div", {
    style: TS.linkLabel
  }, "\uD568\uAED8 \uBCF4\uBA74 \uC88B\uC544\uC694"), /*#__PURE__*/React.createElement("div", {
    style: TS.linkRow
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://youtube.com/@studyforce_lab",
    target: "_blank",
    rel: "noopener noreferrer",
    style: TS.footLink
  }, "\uC5B8\uC5B4\uACFC\uD559\uC5F0\uAD6C\uC18C \u2197"), /*#__PURE__*/React.createElement("a", {
    href: "https://youtube.com/channel/UCCC3K-S3XU15AfrAgt8Qobw",
    target: "_blank",
    rel: "noopener noreferrer",
    style: TS.footLink
  }, "\uB9C8\uB354\uD074\uB7FD \u2197"), /*#__PURE__*/React.createElement("a", {
    href: "https://youtube.com/@pagodream",
    target: "_blank",
    rel: "noopener noreferrer",
    style: TS.footLink
  }, "\uD30C\uACE0\uB4DC\uB9BC \u2197")), /*#__PURE__*/React.createElement("div", {
    style: TS.madeBy
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://youtube.com/@pagodream",
    target: "_blank",
    rel: "noopener noreferrer",
    style: TS.madeByLink
  }, "made by \uD30C\uACE0\uB4DC\uB9BC"), /*#__PURE__*/React.createElement("div", {
    style: TS.madeByDesc
  }, "\uB9E4\uC8FC \uB2E4\uB978 \uD1A0\uB07C\uAD74\uC5D0 \uBE60\uC9C0\uB294 INTP \uC5C4\uB9C8, AI\uC640 \uD568\uAED8"))));
}
function AddChild({
  parent,
  name,
  setName,
  byear,
  setByear,
  bmonth,
  setBmonth,
  onSave,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fade",
    style: TS.center
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.h2
  }, parent ? "어떻게 불러드릴까요?" : "아이 이름을 알려주세요"), /*#__PURE__*/React.createElement("div", {
    style: TS.sub2
  }, parent ? "부모님 자신의 결을 진단합니다. 같은 문항을 ‘나 자신’을 떠올리며 답해 주세요." : "아이마다 따로 진단하여 저장됩니다."), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: name,
    onChange: e => setName(e.target.value),
    onKeyDown: e => e.key === "Enter" && onSave(),
    placeholder: parent ? "예) 엄마, 아빠, 지우맘" : "예) 지우",
    style: { ...TS.input, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }
  }), !parent && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      width: "100%",
      maxWidth: 320,
      margin: "0 auto 18px"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: byear,
    onChange: e => setByear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4)),
    inputMode: "numeric",
    placeholder: "\uD0DC\uC5B4\uB09C \uD574 4\uC790\uB9AC (\uC608: 2018)",
    style: {
      ...TS.input,
      flex: 1.4,
      marginBottom: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: bmonth,
    onChange: e => setBmonth(e.target.value.replace(/[^0-9]/g, "").slice(0, 2)),
    inputMode: "numeric",
    placeholder: "\uC6D4 1~2\uC790\uB9AC (\uC608: 3)",
    style: {
      ...TS.input,
      flex: 1,
      marginBottom: 0
    }
  }))), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.primary,
      maxWidth: 320,
      margin: "10px auto 0",
      opacity: name.trim() ? 1 : 0.5
    },
    onClick: onSave
  }, "\uB2E4\uC74C"), /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onBack
  }, "\uB4A4\uB85C"));
}
function ModePick({
  child,
  onPick,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fade",
    style: TS.center
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.h2
  }, child?.name, " — 시작하기 전에"), /*#__PURE__*/React.createElement("div", {
    style: TS.sub2
  }, "아래 다섯 가지를 지키며, ‘그렇다’ 싶은 항목을 골라 주세요."), /*#__PURE__*/React.createElement("div", { style: { textAlign: "left", maxWidth: 560, margin: "4px auto 20px", lineHeight: 1.65 } }, [["하나", "어떤 문항도 나에게 100퍼센트 딱 맞는 경우는 드물어요. 절반 넘게 맞다 싶으면 ‘그렇다’(아주 그러면 ‘매우’)를, 어중간하면 ‘보통’을, 맞지 않으면 ‘아니다·전혀’를 골라 주세요."], ["둘", "‘이랬으면 좋겠다’는 바람이 아니라, 지금 실제로 살고 있는 모습 그대로 골라 주세요. 있는 그대로 바라보는 눈이 필요해요."], ["셋", "잘 모르겠는 항목은, 나를 잘 알면서도 객관적으로 봐 줄 수 있는 사람에게 물어보되, 선택은 직접 하는 편이 좋아요."], ["넷", "이 과정을 ‘나를 새로 알아가는 여행’이라 여겨 주세요."], ["다섯", "머리로 너무 골똘히 재면 솔직한 느낌이 흐려져요. 어느 정도는 과감하게, 느낌이 가는 대로 골라 주세요."]].map((r, i) => /*#__PURE__*/React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginTop: i ? 11 : 0 } }, /*#__PURE__*/React.createElement("b", { style: { color: TC.gold, flexShrink: 0 } }, r[0]), /*#__PURE__*/React.createElement("span", { style: { color: TC.mute } }, r[1])))), /*#__PURE__*/React.createElement("div", { style: { maxWidth: 560, margin: "2px auto 18px", padding: "11px 14px", borderRadius: 12, background: "rgba(212,168,67,0.10)", border: "1px solid rgba(212,168,67,0.28)", color: TC.gold, fontSize: 14, lineHeight: 1.6, textAlign: "left" } }, "초등학생 이하 아이는, 엄마가 아이를 떠올리며 대신 골라 주셔도 돼요."), /*#__PURE__*/React.createElement("button", {
    style: TS.modeCard,
    onClick: () => onPick("full")
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.modeTitle
  }, "기질 진단 시작하기"), /*#__PURE__*/React.createElement("div", {
    style: TS.modeDesc
  }, "전체 102문항 · 천천히 골라 주세요.")), /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onBack
  }, "뒤로"));
}
function Test({
  child,
  mode,
  onDone,
  onBack
}) {
  const isP = !!(child && child.isParent);
  const items = (mode === "easy" ? ITEMS.filter(i => i.c) : ITEMS).map((it, idx) => ({
    ...it,
    idx
  }));
  const [shuffled] = useState(() => [...items].sort(() => Math.random() - 0.5));
  // 결정 문항도 보기 순서를 섞어 위치 편향 제거
  const [choices] = useState(() => CHOICES.map(c => ({
    ...c,
    opts: [...c.opts].sort(() => Math.random() - 0.5)
  })));
  const [ans, setAns] = useState({}); // idx -> 0~4
  const [cAns, setCAns] = useState({}); // 결정문항 qi -> type
  const [resumed, setResumed] = useState(false);
  const PKEY = `cheji:prog:${child ? child.id : "x"}:${mode}`;
  // 진행 복원 — 중간에 나가도 이어서
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get(PKEY);
        if (r && r.value) {
          const p = JSON.parse(r.value);
          if (p && (Object.keys(p.ans || {}).length || Object.keys(p.cAns || {}).length)) {
            setAns(p.ans || {});
            setCAns(p.cAns || {});
            setResumed(true);
          }
        }
      } catch (e) {}
    })();
  }, []);
  // 진행 자동저장
  useEffect(() => {
    if (Object.keys(ans).length || Object.keys(cAns).length) store.set(PKEY, JSON.stringify({
      ans,
      cAns
    }));
  }, [ans, cAns]);
  const setVal = (idx, v) => setAns(a => ({
    ...a,
    [idx]: v
  }));
  const setChoice = (qi, t) => setCAns(a => ({
    ...a,
    [qi]: t
  }));
  const done = Object.keys(ans).length;
  const cDone = Object.keys(cAns).length;
  const pct = Math.round((done + cDone) / (items.length + choices.length) * 100);
  const allReq = items.length + choices.length;
  const allDone = done + cDone >= allReq;
  const remain = allReq - done - cDone;
  const finish = () => {
    if (!allDone) {
      window.alert("아직 안 고른 문항이 있어요. 모두 골라 주셔야 결과를 볼 수 있어요.");
      return;
    }
    // 1) 리커트 점수(유형별 %)
    const lik = {};
    for (const t of ORDER) {
      const its = items.filter(i => i.t === t);
      const sum = its.reduce((s, i) => s + (ans[i.idx] || 0), 0);
      lik[t] = its.length ? sum / (4 * its.length) * 100 : 0;
    }
    // 2) 결정 문항 득표(유형별 %)
    const votes = {};
    ORDER.forEach(t => votes[t] = 0);
    Object.values(cAns).forEach(t => {
      if (t in votes) votes[t] += 1;
    });
    // 3) 블렌딩 — 결정 문항을 답했으면 50:50, 아니면 리커트만
    const wC = cDone ? 0.5 : 0;
    const scores = {};
    for (const t of ORDER) {
      const ch = cDone ? votes[t] / cDone * 100 : 0;
      scores[t] = Math.round((1 - wC) * lik[t] + wC * ch);
    }
    store.set(PKEY, ""); // 진행 기록 비우기
    onDone(scores, {
      ans,
      cAns
    }, done, items.length);
  };
  const LV = [["전혀", 0], ["아니다", 1], ["보통", 2], ["그렇다", 3], ["매우", 4]];
  return /*#__PURE__*/React.createElement("div", {
    className: "fade",
    style: {
      display: "flex",
      flexDirection: "column",
      minHeight: "calc(100vh - 52px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.testHead
  }, /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onBack
  }, "\uB098\uAC00\uAE30"), /*#__PURE__*/React.createElement("span", {
    style: TS.testCount
  }, child?.name, " \xB7 ", done, "/", items.length)), /*#__PURE__*/React.createElement("div", {
    style: TS.progBg
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.progFill,
      width: `${pct}%`
    }
  })), resumed && /*#__PURE__*/React.createElement("div", {
    style: TS.resumeNote
  }, "\uC774\uC804\uC5D0 \uD558\uB358 \uAC80\uC0AC\uB97C \uC774\uC5B4\uC11C \uC9C4\uD589\uD574\uC694. \uB2F5\uC740 \uADF8\uB300\uB85C \uC800\uC7A5\uB3FC \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: TS.testHint
  }, "각 문장이 지금의 나와 얼마나 맞는지 골라 주세요.", " \uB9DD\uC124\uC5EC\uC9C0\uBA74 \uAC00\uC6B4\uB370 \u2018\uBCF4\uD1B5\u2019, \uB9DE\uC9C0 \uC54A\uC73C\uBA74 \u2018\uC804\uD600\u2019\uB97C \uC120\uD0DD\uD558\uC154\uB3C4 \uB429\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, shuffled.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.idx,
    style: TS.qRow2
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.qText
  }, isP ? parentize(it.s) : it.s), /*#__PURE__*/React.createElement("div", {
    style: TS.lvRow
  }, LV.map(([lab, v]) => {
    const on = ans[it.idx] === v;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: () => setVal(it.idx, v),
      style: {
        ...TS.lvBtn,
        ...(on ? TS.lvOn : {})
      }
    }, lab);
  })))), /*#__PURE__*/React.createElement("div", {
    style: TS.cSecHead
  }, "\uB9C8\uC9C0\uB9C9 \u2014 \uB531 \uD558\uB098\uB9CC \uACE8\uB77C\uC694"), /*#__PURE__*/React.createElement("div", {
    style: TS.cSecSub
  }, "\uAC00\uC7A5 \uBE44\uC2B7\uD55C \uBAA8\uC2B5 \uD558\uB098\uB97C \uACE0\uB974\uBA74 \uACB0\uACFC\uAC00 \uD6E8\uC52C \uB610\uB837\uD574\uC838\uC694. (", cDone, "/", choices.length, ")"), choices.map((c, qi) => /*#__PURE__*/React.createElement("div", {
    key: qi,
    style: TS.cCard
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.cQ
  }, isP ? parentize(c.q) : c.q), c.opts.map(o => {
    const on = cAns[qi] === o.t;
    return /*#__PURE__*/React.createElement("button", {
      key: o.t,
      onClick: () => setChoice(qi, o.t),
      style: {
        ...TS.cOpt,
        ...(on ? {
          borderColor: TYPES[o.t].color,
          background: TYPES[o.t].color + "22",
          color: TC.cream
        } : {})
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...TS.cDot,
        background: on ? TYPES[o.t].color : "transparent",
        borderColor: TYPES[o.t].color
      }
    }), /*#__PURE__*/React.createElement("span", null, o.s));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 30,
      paddingBottom: 18
    }
  }, !allDone && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      color: TC.mute,
      fontSize: 13.5,
      lineHeight: 1.6,
      marginBottom: 11
    }
  }, "아직 ", remain, "개 안 골랐어요. 모두 골라야 결과를 볼 수 있어요."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.primary,
      opacity: allDone ? 1 : 0.38,
      cursor: allDone ? "pointer" : "not-allowed"
    },
    disabled: !allDone,
    onClick: finish
  }, allDone ? "결과 보기" : "결과 보기 (" + (done + cDone) + "/" + allReq + ")")));
}
function Result({
  child,
  parent,
  kids,
  onHome,
  onRetake,
  onDeep,
  onDeepAll,
  onCoach,
  onWorld
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  async function share() {
    if (!child || !child.scores) return;
    const tt = TYPES[topType(child.scores)];
    const txt = child.isParent ? `나는 ‘${tt.name}’ 결의 부모래요 ${tt.emoji}\n부모와 아이의 ‘결’을 알면 칭찬법·공부법이 달라져요. 마음 곳간:\n${SITE_URL}` : `「${withName(child.name)}」는 ‘${tt.name}’ 같은 아이래요 ${tt.emoji}\n아이마다 공부하는 ‘결’이 달라요. 마음 곳간에서 무료 진단:\n${SITE_URL}`;
    try {
      const blob = await buildCardBlob();
      if (blob && navigator.canShare) {
        const file = new File([blob], `마음곳간_${child.name}.png`, {
          type: "image/png"
        });
        if (navigator.canShare({
          files: [file]
        })) {
          await navigator.share({
            files: [file],
            title: "마음 곳간 — 우리 아이의 결",
            text: txt
          });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({
          title: "마음 곳간",
          text: txt,
          url: SITE_URL
        });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(txt);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  async function saveCard() {
    const blob = await buildCardBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `마음곳간_${child.name}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }
  // ⑥ 결과 이미지 카드 (1080×1350 PNG) — blob 반환
  async function buildCardBlob() {
    if (!child || !child.scores) return null;
    const tt = TYPES[topType(child.scores)];
    const topKey = topType(child.scores);
    // 캐릭터 이미지 미리 로드
    const charImg = await new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = CHAR_IMG[topKey];
    });
    const W = 1080,
      H = 1700,
      cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const x = cv.getContext("2d");
    x.fillStyle = "#0C1230";
    x.fillRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(242,193,107,0.10)");
    g.addColorStop(0.4, "rgba(242,193,107,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(242,193,107,0.5)";
    x.lineWidth = 4;
    x.strokeRect(36, 36, W - 72, H - 72);
    x.textAlign = "center";
    x.font = "44px sans-serif";
    x.fillStyle = "#F2C16B";
    x.fillText("체질 학습 진단", W / 2, 150);
    // 캐릭터(색 원 + 그림)
    const cyAv = 330,
      rAv = 130;
    x.fillStyle = tt.color + "33";
    x.beginPath();
    x.arc(W / 2, cyAv, rAv, 0, Math.PI * 2);
    x.fill();
    if (charImg) {
      const iw = charImg.width,
        ih = charImg.height,
        sc = rAv * 1.7 / Math.max(iw, ih);
      x.drawImage(charImg, W / 2 - iw * sc / 2, cyAv - ih * sc / 2, iw * sc, ih * sc);
    } else {
      x.font = "150px serif";
      x.fillText(tt.emoji, W / 2, cyAv + 52);
    }
    x.font = "bold 76px sans-serif";
    x.fillStyle = tt.color;
    x.fillText(`${subjName(child)} ‘${tt.name}’의 결`, W / 2, 540);
    x.font = "40px sans-serif";
    x.fillStyle = "rgba(244,239,230,0.75)";
    x.fillText(`${tt.sasang} · ${tt.sadan}`, W / 2, 600);
    // 본질 한 줄 (수동 줄바꿈)
    x.font = "italic 42px sans-serif";
    x.fillStyle = "#F4EFE6";
    const words = tt.essence.split(" ");
    let line = "",
      lines = [];
    for (const w of words) {
      const t2 = line ? line + " " + w : w;
      if (x.measureText(t2).width > W - 220) {
        lines.push(line);
        line = w;
      } else line = t2;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((l, i) => x.fillText(l, W / 2, 690 + i * 60));
    // 이 아이의 결 — 설명
    const essLines = Math.min(lines.length, 3);
    let dy = 690 + essLines * 62 + 76;
    const PAD = 96,
      maxW = W - PAD * 2;
    const wrapL = (text, f) => {
      x.font = f;
      const ws = text.split(" ");
      let ln = "",
        out = [];
      for (const w of ws) {
        const t2 = ln ? ln + " " + w : w;
        if (x.measureText(t2).width > maxW) {
          if (ln) out.push(ln);
          ln = w;
        } else ln = t2;
      }
      if (ln) out.push(ln);
      return out;
    };
    x.textAlign = "left";
    x.fillStyle = "rgba(244,239,230,0.92)";
    const dl = wrapL(tt.desc, "39px sans-serif").slice(0, 6);
    dl.forEach((l, i) => x.fillText(l, PAD, dy + i * 56));
    dy += dl.length * 56 + 52;
    x.strokeStyle = "rgba(242,193,107,0.3)";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(PAD, dy);
    x.lineTo(W - PAD, dy);
    x.stroke();
    dy += 58;
    x.fillStyle = "#F2C16B";
    const ql = wrapL("\u201C부족한 점 절대 지적하지 마시고, 조금이라도 좋아진 점 열심히 찾아서 과장되게 칭찬해 주세요.\u201D", "italic 37px sans-serif").slice(0, 5);
    x.font = "italic 37px sans-serif";
    ql.forEach((l, i) => x.fillText(l, PAD, dy + i * 52));
    dy += ql.length * 52 + 16;
    x.fillStyle = "rgba(244,239,230,0.62)";
    x.font = "31px sans-serif";
    x.fillText("\u2014 이재훈 고문님", PAD, dy);
    x.textAlign = "center";
    x.font = "34px sans-serif";
    x.fillStyle = "rgba(244,239,230,0.6)";
    x.fillText("마음 곳간 · 우리 아이 결 무료 진단", W / 2, H - 110);
    x.fillStyle = "#F2C16B";
    x.fillText(SITE_URL.replace("https://", ""), W / 2, H - 60);
    return await new Promise(res => cv.toBlob(res, "image/png"));
  }
  if (!child || !child.scores) return null;
  const ranked = ORDER.map(t => ({
    t,
    v: child.scores[t]
  })).sort((a, b) => b.v - a.v);
  const top = ranked[0].t,
    second = ranked[1].t;
  const T = TYPES[top],
    T2 = TYPES[second];
  const gap = ranked[0].v - ranked[1].v;
  const close = gap <= 12;
  const total = child.total || 0,
    done = child.done || 0;
  const weak = ranked[0].v < 25;
  const sparse = total > 0 && done < total * 0.4;
  return /*#__PURE__*/React.createElement("div", {
    className: "fade"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    type: top,
    size: 92,
    ring: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.resName,
      color: T.color
    }
  }, subjName(child), " \u2018", T.name, "\u2019\uC758 \uACB0"), /*#__PURE__*/React.createElement("div", {
    style: TS.resSub
  }, T.sasang, " \xB7 ", T.sadan, T.rare ? " · 아주 드문 유형" : ""), /*#__PURE__*/React.createElement("div", {
    style: TS.resEss
  }, T.essence)), /*#__PURE__*/React.createElement("div", {
    style: TS.bars
  }, ranked.map(({
    t,
    v
  }) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.barTop
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(Cico, {
    type: t,
    size: 20
  }), " ", TYPES[t].name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: TC.mute
    }
  }, "(", TYPES[t].sasang, ")")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: TYPES[t].color,
      fontWeight: 700
    }
  }, v, "%")), /*#__PURE__*/React.createElement("div", {
    style: TS.barBg
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.barFill,
      width: `${v}%`,
      background: TYPES[t].color
    }
  }))))), /*#__PURE__*/React.createElement(Section, {
    title: "\uC774 \uC544\uC774\uC758 \uACB0"
  }, T.desc), /*#__PURE__*/React.createElement("button", { style: { width: "100%", marginTop: 14, padding: "15px 18px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6E9BFF, #9B86FF)", color: "#0A0E20", fontWeight: 800, fontSize: 15.5, boxShadow: "0 8px 22px rgba(120,150,255,0.28)" }, onClick: onDeepAll }, "📖 네 기질, 책으로 다시 보기"), /*#__PURE__*/React.createElement("div", { style: { fontSize: 12.5, color: TC.mute, textAlign: "center", marginTop: 8, marginBottom: 4, lineHeight: 1.5 } }, "결이 또렷하지 않을 때 — 네 유형을 모두 읽고 다시 판단해 보세요"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.deepBtn,
      borderColor: T.color + "66",
      color: T.color
    },
    onClick: () => onDeep(top)
  }, "\uD83D\uDCD6 \uCC45\uC774 \uB9D0\uD558\uB294 \u2018", T.name, "\u2019 \uAC19\uC740 \uC544\uC774 \u2014 \uC815\uBC00 \uBD84\uC11D \uC77D\uAE30 \u203A"), close && /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.deepBtn,
      marginTop: 8,
      borderColor: T2.color + "66",
      color: T2.color
    },
    onClick: () => onDeep(second)
  }, "\uD83D\uDCD6 \uB450 \uBC88\uC9F8 \uACB0 \u2018", T2.name, "\u2019 \uC815\uBC00 \uBD84\uC11D\uB3C4 \uC77D\uAE30 \u203A"), /*#__PURE__*/React.createElement(Section, {
    title: "\uC774\uB807\uAC8C \uACF5\uBD80\uD560 \uB54C \uC990\uAC70\uC6CC\uC694"
  }, T.study), /*#__PURE__*/React.createElement(Section, {
    title: "이렇게 키워 주세요",
    bare: true
  }, /*#__PURE__*/React.createElement("div", {
    style: TS.guideRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.guideCol,
      borderColor: "rgba(143,208,172,0.3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.guideH,
      color: "#8FD0AC"
    }
  }, "\uC774\uB807\uAC8C \uD574\uC8FC\uC138\uC694"), T.doIt.map((x, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: TS.guideItem
  }, "\u2713 ", x))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.guideCol,
      borderColor: "rgba(255,158,109,0.3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.guideH,
      color: "#FF9E6D"
    }
  }, "\uC774\uAC74 \uD53C\uD574\uC8FC\uC138\uC694"), T.avoid.map((x, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: TS.guideItem
  }, "\u2715 ", x))))), (sparse || weak) && /*#__PURE__*/React.createElement("div", {
    style: TS.warnNote
  }, "\uC751\uB2F5\uC774 \uC801\uAC70\uB098 \uC57D\uD558\uAC8C \uB098\uC640\uC11C \uACB0\uACFC\uAC00 \uB610\uB837\uD558\uC9C0 \uC54A\uC744 \uC218 \uC788\uC5B4\uC694. \u2018\uC815\uBC00 \uC9C4\uB2E8\u2019\uC73C\uB85C \uB2E4\uC2DC \uD574\uBCF4\uBA74 \uD6E8\uC52C \uC815\uD655\uD574\uC838\uC694."), close && /*#__PURE__*/React.createElement("div", {
    style: TS.mixNote
  }, "\u2018", T.name, "\u2019\uACFC \u2018", T2.name, "\u2019\uC758 \uACB0\uC774 ", gap, "%p \uCC28\uC774\uB85C \uAC00\uAE5D\uAC8C \uB098\uD0C0\uB0AC\uC2B5\uB2C8\uB2E4. \uC544\uC774\uB294 \uD55C \uAC00\uC9C0 \uACB0\uB85C\uB9CC \uB098\uB258\uC9C0 \uC54A\uC73C\uB2C8, \uB450 \uACB0\uC744 ", /*#__PURE__*/React.createElement("b", null, "\uD568\uAED8"), " \uC0B4\uD3B4\uBD10 \uC8FC\uC138\uC694. \uC544\uB798\uC5D0 \uB450 \uBC88\uC9F8 \uACB0\uB3C4 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4."), close && /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.secondCard,
      borderColor: T2.color + "55"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.secondHead,
      color: T2.color,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Cico, {
    type: second,
    size: 20
  }), " \uB450 \uBC88\uC9F8 \uACB0 \xB7 \u2018", T2.name, "\u2019 (", T2.sasang, ")"), /*#__PURE__*/React.createElement("div", {
    style: TS.secondEss
  }, T2.essence), /*#__PURE__*/React.createElement("div", {
    style: TS.secondBody
  }, T2.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.secondBody,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: T2.color
    }
  }, "\uACF5\uBD80"), " \xB7 ", T2.study)), !child.isParent && /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.todayCard,
      borderColor: T.color + "55"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.todayHead,
      color: TC.gold
    }
  }, "\uD83C\uDF31 \uC624\uB298\uBD80\uD130 \uD55C \uAC00\uC9C0"), /*#__PURE__*/React.createElement("div", {
    style: TS.todayMain
  }, TODAY[top].main), TODAY[top].more.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: TS.todayMore
  }, "\xB7 ", m))), !child.isParent && parent && parent.scores && /*#__PURE__*/React.createElement(ComboBlock, {
    p: topType(parent.scores),
    c: top,
    pName: parent.name,
    cName: child.name
  }), child.isParent && kids && kids.length > 0 && kids.map(k => /*#__PURE__*/React.createElement(ComboBlock, {
    key: k.id,
    p: top,
    c: topType(k.scores),
    pName: child.name,
    cName: k.name
  })), !child.isParent && (!parent || !parent.scores) && /*#__PURE__*/React.createElement("div", {
    style: TS.comboHint
  }, "\uD648\uC5D0\uC11C ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: TC.gold
    }
  }, "\uBD80\uBAA8\uB2D8\uC758 \uACB0"), "\uAE4C\uC9C0 \uC9C4\uB2E8\uD558\uC2DC\uBA74, \uC774 \uC790\uB9AC\uC5D0 \uBD80\uBAA8\u2013\uC544\uC774 \uC870\uD569 \uBD84\uC11D\uC774 \uD568\uAED8 \uC81C\uACF5\uB429\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: TS.coachHook
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, "\uD83D\uDC26"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: TC.cream
    }
  }, "\uCABD\uCABD\uC774 \uCF54\uCE58"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: TC.mute,
      fontSize: 12.5,
      marginTop: 2
    }
  }, "\uC774 \uACB0\uACFC\uB294 \uCABD\uCABD\uC774\uAC00 ", withName(child.name), "\uC640\uC758 \uB300\uD654\uC5D0\uC11C \uB9D0\uD22C\uC640 \u2018\uB2E4\uB978 \uBB38\u2019 \uC81C\uC548\uC5D0 \uC4F0\uC5EC\uC694."))), /*#__PURE__*/React.createElement("button", {
    style: TS.shareBtn,
    onClick: share
  }, "\uD83D\uDCE4 \uACB0\uACFC \uACF5\uC720\uD558\uAE30"), /*#__PURE__*/React.createElement("button", {
    style: TS.cardBtn,
    onClick: saveCard
  }, "\uD83D\uDDBC \uACB0\uACFC \uCE74\uB4DC \uC774\uBBF8\uC9C0 \uC800\uC7A5"), copied && /*#__PURE__*/React.createElement("div", {
    style: TS.toast
  }, "\uBCF5\uC0AC\uB410\uC5B4\uC694! \uBD99\uC5EC\uB123\uC5B4 \uACF5\uC720\uD558\uC138\uC694 \uD83D\uDC26"), saved && /*#__PURE__*/React.createElement("div", {
    style: TS.toast
  }, "\uCE74\uB4DC \uC774\uBBF8\uC9C0\uAC00 \uC800\uC7A5\uB410\uC5B4\uC694 \uD83D\uDDBC"), onWorld && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      paddingTop: 20,
      borderTop: `1px solid ${TC.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: TC.cream,
      fontSize: 13.5,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 10,
      lineHeight: 1.55
    }
  }, child.isParent ? "이제 우리 가족의 땅을 넓혀볼까요" : "이제 매일 한 걸음씩, " + withName(child.name) + "의 좋은 점을 찾아볼까요"), /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: `linear-gradient(135deg, ${TC.gold}, #FF9E6D)`,
      color: "#3a2410",
      border: "none",
      borderRadius: 14,
      padding: "16px",
      fontSize: 16,
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 10px 26px rgba(242,193,107,0.30)"
    },
    onClick: onWorld
  }, "🌍 세계지도에서 우리 땅 넓히기 →")), !child.isParent && onCoach && /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      marginTop: 10,
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${TC.line}`,
      borderRadius: 14,
      padding: "14px",
      fontSize: 14.5,
      fontWeight: 700,
      color: TC.cream,
      cursor: "pointer"
    },
    onClick: onCoach
  }, "이 결을 아는 채로 — 쪽쪽이 코칭 →"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...TS.text,
      marginTop: 10
    },
    onClick: onHome
  }, "완료"), /*#__PURE__*/React.createElement("button", {
    style: TS.text,
    onClick: onRetake
  }, "\uB2E4\uC2DC \uAC80\uC0AC\uD558\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: TS.note
  }, "\u203B \uCC38\uACE0\uC6A9 \uC790\uB8CC\uC785\uB2C8\uB2E4. \uB2E8\uC815\uD558\uAE30\uBCF4\uB2E4, \uC544\uC774\uB97C \uB354 \uAE4A\uC774 \uAD00\uCC30\uD558\uB294 \uB80C\uC988\uB85C \uD65C\uC6A9\uD574 \uC8FC\uC138\uC694."));
}
function Section({
  title,
  children,
  accent,
  bare
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: TS.section
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...TS.sectionH,
      color: accent || TC.gold
    }
  }, title), bare ? children : /*#__PURE__*/React.createElement("div", {
    style: TS.sectionB
  }, children));
}
function topType(scores) {
  return ORDER.map(t => ({
    t,
    v: scores[t]
  })).sort((a, b) => b.v - a.v)[0].t;
}
// 캐릭터 아바타 — 색 원 안에 캐릭터 전신(이모지 대체)
function Avatar({
  type,
  size = 44,
  ring = false,
  fallback = "👶"
}) {
  if (!type) return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.5,
      background: "rgba(255,255,255,0.06)",
      flexShrink: 0
    }
  }, fallback);
  const c = TYPES[type].color;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: `radial-gradient(circle at 50% 38%, ${c}3a, ${c}14)`,
      border: ring ? `2px solid ${c}55` : "none",
      flexShrink: 0,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: CHAR_IMG[type],
    alt: TYPES[type].name,
    style: {
      width: "88%",
      height: "88%",
      objectFit: "contain",
      display: "block"
    }
  }));
}
// 인라인 작은 캐릭터(텍스트 옆)
function Cico({
  type,
  size = 20
}) {
  return /*#__PURE__*/React.createElement("img", {
    src: CHAR_IMG[type],
    alt: TYPES[type].name,
    style: {
      height: size,
      width: size,
      objectFit: "contain",
      verticalAlign: "-0.28em",
      margin: "0 1px"
    }
  });
}
const TEST_CSS = `*{box-sizing:border-box;}
@keyframes fadeK{0%{opacity:0;transform:translateY(8px);}100%{opacity:1;}}
.fade{animation:fadeK .45s ease-out;}
@keyframes birdK{0%,100%{transform:translate(0,0);}50%{transform:translate(7px,-8px);}}
.heroBird{animation:birdK 4.5s ease-in-out infinite;transform-origin:center;}
@keyframes twinkK{0%,100%{opacity:.25;}50%{opacity:.9;}}
.tw1{animation:twinkK 3.2s ease-in-out infinite;}
.tw2{animation:twinkK 4.1s ease-in-out 1.2s infinite;}
.tw3{animation:twinkK 5s ease-in-out 2s infinite;}
.heroZone{transition:opacity .6s ease, filter .6s ease;cursor:pointer;}
@media (prefers-reduced-motion: reduce){.heroBird,.tw1,.tw2,.tw3{animation:none;}.fade{animation:none;}}
::-webkit-scrollbar{width:0;}
input::placeholder{color:#6b74a0;}
@media (min-width: 521px){ .tFrame{ max-width:min(92vw, 1200px) !important; } }`;
const TS = {
  root: {
    minHeight: "100vh",
    width: "100%",
    background: `radial-gradient(130% 80% at 50% -10%, ${TC.night2} 0%, ${TC.night} 50%, ${TC.deep} 100%)`,
    display: "flex",
    justifyContent: "center",
    padding: "22px 16px 34px",
    fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif"
  },
  frame: {
    width: "100%",
    maxWidth: 460
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    paddingTop: 40
  },
  eyebrow: {
    color: "#FF9E6D",
    fontSize: 11.5,
    letterSpacing: 5,
    fontWeight: 700,
    marginBottom: 14
  },
  h1: {
    color: TC.cream,
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.32,
    marginBottom: 14,
    letterSpacing: -0.3
  },
  h2: {
    color: TC.cream,
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 8,
    lineHeight: 1.35
  },
  sub: {
    color: TC.mute,
    fontSize: 14,
    lineHeight: 1.7
  },
  sub2: {
    color: TC.mute,
    fontSize: 13.5,
    lineHeight: 1.6,
    marginBottom: 22
  },
  empty: {
    color: TC.mute,
    fontSize: 13.5,
    lineHeight: 1.7,
    textAlign: "center",
    padding: "26px 0"
  },
  childCard: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${TC.line}`,
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 10,
    cursor: "pointer"
  },
  childRow: {
    display: "flex",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 10
  },
  childMain: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${TC.line}`,
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
    minWidth: 0
  },
  delBtn: {
    flexShrink: 0,
    width: 40,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${TC.line}`,
    borderRadius: 14,
    color: "rgba(244,239,230,0.45)",
    fontSize: 15,
    cursor: "pointer"
  },
  childAv: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22
  },
  childName: {
    color: TC.cream,
    fontSize: 16,
    fontWeight: 700
  },
  childMeta: {
    color: TC.mute,
    fontSize: 12.5,
    marginTop: 2
  },
  chev: {
    color: TC.gold,
    fontSize: 13,
    fontWeight: 600
  },
  addBtn: {
    width: "100%",
    marginTop: 6,
    background: "rgba(242,193,107,0.12)",
    border: "1px dashed rgba(242,193,107,0.45)",
    color: TC.gold,
    borderRadius: 16,
    padding: "14px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer"
  },
  note: {
    color: TC.mute,
    fontSize: 11.5,
    lineHeight: 1.6,
    marginTop: 18,
    opacity: 0.85
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${TC.line}`,
    borderRadius: 14,
    padding: "14px 16px",
    color: TC.cream,
    fontSize: 16,
    outline: "none",
    marginBottom: 18,
    textAlign: "center"
  },
  primary: {
    width: "100%",
    background: `linear-gradient(135deg, ${TC.gold}, #FF9E6D)`,
    color: "#3a2410",
    border: "none",
    borderRadius: 14,
    padding: "15px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer"
  },
  text: {
    background: "none",
    border: "none",
    color: TC.mute,
    fontSize: 13.5,
    cursor: "pointer",
    padding: "12px",
    display: "block",
    margin: "4px auto 0"
  },
  modeCard: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${TC.line}`,
    borderRadius: 16,
    padding: "16px",
    marginBottom: 12,
    cursor: "pointer",
    textAlign: "left"
  },
  modeTitle: {
    color: TC.cream,
    fontSize: 16.5,
    fontWeight: 800,
    marginBottom: 5
  },
  modeDesc: {
    color: TC.mute,
    fontSize: 13,
    lineHeight: 1.55
  },
  testHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4
  },
  testCount: {
    color: TC.gold,
    fontSize: 13,
    fontWeight: 700
  },
  testHint: {
    color: TC.mute,
    fontSize: 12.5,
    lineHeight: 1.5,
    padding: "0 2px 14px",
    borderBottom: `1px solid ${TC.line}`
  },
  qRow: {
    width: "100%",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${TC.line}`,
    padding: "15px 4px",
    cursor: "pointer",
    textAlign: "left"
  },
  qOn: {
    background: "rgba(242,193,107,0.07)"
  },
  qBox: {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: 7,
    border: "1.5px solid rgba(255,255,255,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3a2410",
    fontSize: 15,
    fontWeight: 800,
    marginTop: 1
  },
  qBoxOn: {
    background: TC.gold,
    border: "1.5px solid " + TC.gold
  },
  qText: {
    color: TC.cream,
    fontSize: 14.5,
    lineHeight: 1.5
  },
  qRow2: {
    borderBottom: `1px solid ${TC.line}`,
    padding: "14px 2px"
  },
  lvRow: {
    display: "flex",
    gap: 5,
    marginTop: 10
  },
  lvBtn: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.13)",
    color: TC.mute,
    fontSize: 11.5,
    borderRadius: 9,
    padding: "9px 0",
    cursor: "pointer",
    textAlign: "center"
  },
  lvOn: {
    background: "rgba(242,193,107,0.18)",
    border: "1px solid rgba(242,193,107,0.55)",
    color: TC.gold,
    fontWeight: 700
  },
  cSecHead: {
    marginTop: 30,
    color: TC.gold,
    fontSize: 17,
    fontWeight: 800,
    textAlign: "center"
  },
  cSecSub: {
    color: TC.mute,
    fontSize: 12.5,
    textAlign: "center",
    margin: "6px 0 14px",
    lineHeight: 1.5
  },
  cCard: {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${TC.line}`,
    borderRadius: 14,
    padding: "15px 14px",
    marginBottom: 12
  },
  cQ: {
    color: TC.cream,
    fontSize: 14.5,
    fontWeight: 700,
    marginBottom: 11,
    lineHeight: 1.45
  },
  cOpt: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    textAlign: "left",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: TC.mute,
    borderRadius: 11,
    padding: "11px 12px",
    marginBottom: 7,
    fontSize: 13.5,
    lineHeight: 1.5,
    cursor: "pointer"
  },
  cDot: {
    flexShrink: 0,
    width: 15,
    height: 15,
    borderRadius: "50%",
    border: "2px solid",
    marginTop: 1
  },
  warnNote: {
    marginTop: 14,
    background: "rgba(255,158,109,0.1)",
    border: "1px solid rgba(255,158,109,0.3)",
    borderRadius: 12,
    padding: "12px 14px",
    color: "#FFC4A3",
    fontSize: 13,
    lineHeight: 1.6
  },
  secondCard: {
    marginTop: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderRadius: 14,
    padding: "15px 16px"
  },
  secondHead: {
    fontSize: 16.5,
    fontWeight: 800,
    marginBottom: 11
  },
  topHome: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${TC.line}`,
    color: TC.cream,
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 6
  },
  topHomeIcon: {
    fontSize: 15,
    lineHeight: 1
  },
  secondEss: {
    color: TC.cream,
    fontSize: 13.5,
    fontStyle: "italic",
    opacity: 0.9,
    marginBottom: 9
  },
  secondBody: {
    color: TC.cream,
    fontSize: 13.5,
    lineHeight: 1.7,
    opacity: 0.95
  },
  testFootWrap: {
    position: "sticky",
    bottom: 0,
    paddingTop: 14,
    paddingBottom: 4,
    background: `linear-gradient(to top, ${TC.night} 70%, transparent)`
  },
  resName: {
    fontSize: 24,
    fontWeight: 800,
    marginTop: 10
  },
  resSub: {
    color: TC.mute,
    fontSize: 13.5,
    marginTop: 5
  },
  resEss: {
    color: TC.cream,
    fontSize: 15,
    marginTop: 10,
    fontStyle: "italic",
    opacity: 0.92
  },
  bars: {
    marginTop: 24,
    marginBottom: 8
  },
  barTop: {
    display: "flex",
    justifyContent: "space-between",
    color: TC.cream,
    fontSize: 13.5,
    marginBottom: 5
  },
  barBg: {
    height: 9,
    background: "rgba(255,255,255,0.07)",
    borderRadius: 99,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width .6s ease"
  },
  section: {
    marginTop: 26
  },
  sectionH: {
    fontSize: 16.5,
    fontWeight: 800,
    marginBottom: 12,
    borderLeft: "3px solid",
    paddingLeft: 11,
    lineHeight: 1.3,
    letterSpacing: "-0.01em"
  },
  sectionB: {
    color: TC.cream,
    fontSize: 14,
    lineHeight: 1.72,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${TC.line}`,
    borderRadius: 13,
    padding: "13px 15px"
  },
  guideRow: {
    display: "flex",
    gap: 10,
    marginTop: 2
  },
  guideCol: {
    flex: 1,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderRadius: 13,
    padding: "13px"
  },
  guideH: {
    fontSize: 12.5,
    fontWeight: 800,
    marginBottom: 9
  },
  guideItem: {
    color: TC.cream,
    fontSize: 12.8,
    lineHeight: 1.5,
    marginBottom: 7
  },
  mixNote: {
    marginTop: 24,
    marginBottom: 6,
    color: TC.mute,
    fontSize: 13,
    lineHeight: 1.6,
    paddingLeft: 13
  },
  coachHook: {
    marginTop: 16,
    display: "flex",
    gap: 11,
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${TC.line}`,
    borderRadius: 14,
    padding: "13px 15px"
  },
  gomunBanner: {
    width: "100%",
    textAlign: "left",
    marginTop: 18,
    background: "linear-gradient(135deg, rgba(242,193,107,0.10), rgba(242,193,107,0.03))",
    border: "1px solid rgba(242,193,107,0.3)",
    borderRadius: 16,
    padding: "15px 16px",
    cursor: "pointer"
  },
  gomunBannerQ: {
    color: TC.cream,
    fontSize: 13.5,
    lineHeight: 1.65,
    fontStyle: "italic"
  },
  gomunBannerW: {
    color: TC.mute,
    fontSize: 12,
    marginTop: 9,
    fontWeight: 600
  },
  gomunCard: {
    marginTop: 12,
    background: "linear-gradient(160deg, rgba(242,193,107,0.10), rgba(255,255,255,0.02))",
    border: "1px solid rgba(242,193,107,0.32)",
    borderRadius: 18,
    padding: "20px 18px"
  },
  gomunTitle: {
    color: TC.gold,
    fontSize: 22,
    fontWeight: 800,
    textAlign: "center",
    lineHeight: 1.4
  },
  gomunWho: {
    color: TC.mute,
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16
  },
  gomunQuotes: {
    display: "flex",
    flexDirection: "column",
    gap: 13
  },
  gomunQ: {
    borderLeft: "2px solid rgba(242,193,107,0.4)",
    paddingLeft: 13
  },
  gomunDate: {
    color: TC.gold,
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.8,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  gomunText: {
    color: TC.cream,
    fontSize: 13.5,
    lineHeight: 1.7
  },
  gomunFoot: {
    color: TC.mute,
    fontSize: 12.5,
    lineHeight: 1.65,
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid rgba(242,193,107,0.18)"
  },
  introSec: {
    marginTop: 18
  },
  introHead: {
    color: TC.cream,
    fontSize: 15.5,
    fontWeight: 800,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  introNum: {
    color: TC.gold,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid rgba(242,193,107,0.4)",
    borderRadius: 7,
    padding: "3px 7px",
    letterSpacing: 0.5
  },
  introBody: {
    color: TC.cream,
    fontSize: 14,
    lineHeight: 1.78,
    opacity: 0.95
  },
  fourRow: {
    display: "flex",
    flexDirection: "column",
    gap: 9
  },
  fourItem: {
    fontSize: 13.5,
    lineHeight: 1.5
  },
  deepBtn: {
    width: "100%",
    marginTop: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid",
    borderRadius: 14,
    padding: "15px 16px",
    fontSize: 14.5,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    lineHeight: 1.4
  },
  deepTitle: {
    fontSize: 22,
    fontWeight: 800,
    marginTop: 10,
    lineHeight: 1.35
  },
  deepSub: {
    color: TC.mute,
    fontSize: 12,
    marginTop: 6
  },
  deepLead: {
    color: TC.cream,
    fontSize: 14,
    lineHeight: 1.8,
    marginTop: 20,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${TC.line}`,
    borderRadius: 14,
    padding: "15px 16px"
  },
  deepSoon: {
    color: TC.mute,
    fontSize: 13.5,
    lineHeight: 1.7,
    marginTop: 18,
    textAlign: "center",
    padding: "20px"
  },
  deepSec: {
    marginTop: 22
  },
  deepH: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 11,
    display: "flex",
    alignItems: "center",
    gap: 9,
    lineHeight: 1.35
  },
  deepP: {
    color: TC.cream,
    fontSize: 14,
    lineHeight: 1.85,
    margin: "0 0 11px",
    opacity: 0.95
  },
  deepClose: {
    marginTop: 22,
    borderLeft: "2px solid",
    paddingLeft: 14,
    color: TC.cream,
    fontSize: 14,
    lineHeight: 1.8,
    fontStyle: "italic"
  },
  deepParentNote: {
    marginTop: 16,
    background: "rgba(242,193,107,0.08)",
    border: "1px solid rgba(242,193,107,0.22)",
    borderRadius: 12,
    padding: "13px 15px",
    color: TC.cream,
    fontSize: 13,
    lineHeight: 1.7
  },
  shareBtn: {
    width: "100%",
    marginTop: 18,
    background: "linear-gradient(135deg, #8FD0AC, #7FB2E8)",
    color: "#0C1230",
    border: "none",
    borderRadius: 14,
    padding: "15px",
    fontSize: 15.5,
    fontWeight: 800,
    cursor: "pointer"
  },
  toast: {
    marginTop: 10,
    textAlign: "center",
    color: "#8FD0AC",
    fontSize: 13,
    fontWeight: 600
  },
  progBg: {
    height: 5,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    margin: "10px 0 4px",
    overflow: "hidden"
  },
  progFill: {
    height: "100%",
    background: "linear-gradient(90deg, #F2C16B, #FF9E6D)",
    borderRadius: 3,
    transition: "width 0.25s"
  },
  resumeNote: {
    marginTop: 8,
    background: "rgba(143,208,172,0.1)",
    border: "1px solid rgba(143,208,172,0.3)",
    borderRadius: 10,
    padding: "9px 12px",
    color: "#8FD0AC",
    fontSize: 12.5,
    lineHeight: 1.5
  },
  parentSec: {
    marginTop: 48,
    background: "rgba(242,193,107,0.05)",
    border: "1px solid rgba(242,193,107,0.22)",
    borderRadius: 18,
    padding: "20px 18px"
  },
  parentHead: {
    color: TC.gold,
    fontSize: 15.5,
    fontWeight: 800
  },
  parentSub: {
    color: TC.mute,
    fontSize: 12.5,
    lineHeight: 1.65,
    margin: "8px 0 12px"
  },
  parentBtn: {
    width: "100%",
    background: "rgba(242,193,107,0.14)",
    border: "1px solid rgba(242,193,107,0.45)",
    color: TC.gold,
    borderRadius: 12,
    padding: "13px",
    fontSize: 14.5,
    fontWeight: 700,
    cursor: "pointer"
  },
  todayCard: {
    marginTop: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderRadius: 14,
    padding: "15px 16px"
  },
  todayHead: {
    fontSize: 16.5,
    fontWeight: 800,
    marginBottom: 11
  },
  todayMain: {
    color: TC.cream,
    fontSize: 14.5,
    lineHeight: 1.7,
    fontWeight: 600,
    marginBottom: 8
  },
  todayMore: {
    color: TC.mute,
    fontSize: 13,
    lineHeight: 1.65
  },
  comboCard: {
    marginTop: 12,
    background: "rgba(242,193,107,0.06)",
    border: "1px solid rgba(242,193,107,0.28)",
    borderRadius: 14,
    padding: "15px 16px"
  },
  comboHead: {
    color: TC.gold,
    fontSize: 14.5,
    fontWeight: 800,
    marginBottom: 8
  },
  comboSecH: {
    fontSize: 13,
    fontWeight: 800,
    margin: "12px 0 5px"
  },
  comboHow: {
    color: TC.cream,
    fontSize: 13.5,
    lineHeight: 1.75,
    opacity: 0.95,
    marginBottom: 7
  },
  comboKid: {
    fontSize: 13.5,
    fontWeight: 800,
    marginBottom: 4
  },
  comboBody: {
    color: TC.cream,
    fontSize: 13.5,
    lineHeight: 1.75,
    opacity: 0.95
  },
  comboHint: {
    marginTop: 12,
    color: TC.mute,
    fontSize: 12.5,
    lineHeight: 1.65,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${TC.line}`,
    borderRadius: 12,
    padding: "12px 14px"
  },
  cardBtn: {
    width: "100%",
    marginTop: 9,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: TC.cream,
    borderRadius: 14,
    padding: "14px",
    fontSize: 14.5,
    fontWeight: 700,
    cursor: "pointer"
  },
  heroH1: {
    fontFamily: "'Gowun Batang','Noto Serif KR',serif",
    color: TC.cream,
    fontSize: 30,
    lineHeight: 1.48,
    fontWeight: 700,
    marginTop: 20,
    letterSpacing: "-0.3px"
  },
  heroAns: {
    color: TC.gold,
    fontSize: 15,
    lineHeight: 1.75,
    marginTop: 16,
    fontWeight: 600
  },
  heroLine: {
    marginTop: 12,
    textAlign: "center",
    minHeight: 56
  },
  heroBox: {
    position: "relative",
    width: "100%",
    aspectRatio: "1200 / 896",
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  heroFallback: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    padding: 16,
    background: "radial-gradient(120% 90% at 50% 0%, #1a2350, #0C1230)"
  },
  heroChip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    background: "rgba(12,18,48,0.6)",
    border: "1.5px solid",
    borderRadius: 14,
    padding: "10px 12px",
    cursor: "pointer",
    transition: "opacity .4s"
  },
  heroLineTxt: {
    color: TC.cream,
    opacity: 0.82,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 1.5
  },
  heroTapHint: {
    color: "rgba(159,166,200,0.7)",
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 10
  },
  heroCta: {
    width: "100%",
    marginTop: 26,
    background: "linear-gradient(135deg, #F2C16B, #FF9E6D)",
    color: "#0C1230",
    border: "none",
    borderRadius: 16,
    padding: "18px",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 28px rgba(242,193,107,0.28)"
  },
  orn: {
    textAlign: "center",
    color: "rgba(242,193,107,0.55)",
    fontSize: 12,
    margin: "52px 0 0",
    letterSpacing: 4
  },
  quoteWrap: {
    width: "100%",
    background: "transparent",
    border: "none",
    marginTop: 18,
    textAlign: "center",
    padding: "0 10px",
    cursor: "pointer"
  },
  quoteMark: {
    fontFamily: "'Gowun Batang',serif",
    fontSize: 50,
    color: TC.gold,
    lineHeight: 0.6,
    opacity: 0.85
  },
  quoteTxt: {
    fontFamily: "'Gowun Batang','Noto Serif KR',serif",
    fontSize: 16.5,
    lineHeight: 1.9,
    color: TC.cream,
    marginTop: 6
  },
  quoteWho: {
    marginTop: 16,
    color: TC.mute,
    fontSize: 12.5,
    letterSpacing: 1.5
  },
  quoteLink: {
    marginTop: 10,
    color: TC.gold,
    fontSize: 13.5,
    fontWeight: 700
  },
  secLabelWrap: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    margin: "56px 0 24px"
  },
  secLine: {
    flex: 1,
    height: 1,
    background: "rgba(244,239,230,0.12)"
  },
  secLabel: {
    color: TC.gold,
    fontSize: 12.5,
    fontWeight: 800,
    letterSpacing: 5
  },
  tlRow: {
    display: "flex",
    gap: 15
  },
  tlCol: {
    width: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  tlDot: {
    flexShrink: 0,
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: TC.gold,
    boxShadow: "0 0 9px rgba(242,193,107,0.7)",
    marginTop: 7
  },
  tlLine: {
    width: 1,
    flex: 1,
    background: "rgba(242,193,107,0.22)"
  },
  tlTxt: {
    flex: 1,
    color: TC.cream,
    fontSize: 14.5,
    lineHeight: 1.65,
    paddingBottom: 26,
    opacity: 0.94
  },
  tlSub: {
    color: TC.mute,
    fontSize: 12.5
  },
  footer: {
    marginTop: 60,
    paddingTop: 24,
    borderTop: "1px solid rgba(244,239,230,0.1)",
    textAlign: "center"
  },
  footNote: {
    color: TC.mute,
    fontSize: 12,
    lineHeight: 1.75
  },
  refTxt: {
    marginTop: 16,
    color: "rgba(244,239,230,0.42)",
    fontSize: 11.5,
    letterSpacing: 0.5
  },
  linkLabel: {
    marginTop: 26,
    color: TC.mute,
    fontSize: 11.5,
    letterSpacing: 1,
    fontWeight: 700
  },
  linkRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "8px 16px",
    marginTop: 12
  },
  footLink: {
    color: TC.gold,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    borderBottom: "1px solid transparent",
    paddingBottom: 1
  },
  madeBy: {
    marginTop: 26,
    paddingTop: 18,
    borderTop: "1px solid rgba(244,239,230,0.08)"
  },
  madeByLink: {
    color: "rgba(244,239,230,0.7)",
    fontSize: 12.5,
    fontWeight: 700,
    textDecoration: "none"
  },
  madeByDesc: {
    marginTop: 5,
    color: "rgba(244,239,230,0.4)",
    fontSize: 11,
    lineHeight: 1.6
  }
};

// ════════════════ 세계지도 (오늘의 발견) ════════════════

// ===== 정적 데이터: 나라 소개 =====
// 나라 소개 정적 데이터 — 초등 눈높이 한국어
// 키: 영문 국가명(en) — id 중복("-99") 회피를 위해 en 사용
// 구조: NARA[en] = { brief: "2~3문장 소개", story: "3~4문장 이야기\n💬 이렇게 물어보세요: ..." }

const NARA = {
  // ===== 아프리카 (1/2) =====
  "Ghana": {
    adult: {
      summary: "서아프리카 기니만에 면한 공화국으로 수도는 아크라입니다. 1957년 사하라 이남 아프리카 최초로 독립했습니다.",
      geo: "해안 평야에서 북부 사바나까지 이어지며, 볼타강과 거대한 인공 호수 볼타호가 있습니다.",
      history: "옛 가나·아샨티 왕국의 터전으로, '황금 해안'이라 불렸습니다. 콰메 은크루마의 지도로 독립해 아프리카 독립운동의 상징이 되었습니다.",
      culture: "카카오와 금의 산지이며, 켄테 직물과 다채로운 축제 문화가 있습니다. 평화로운 민주주의로 평가받습니다.",
      people: "초대 대통령 콰메 은크루마, 전 유엔 사무총장 코피 아난이 대표적입니다."
    },
    brief: "가나는 서아프리카에 있는 나라로, 초콜릿의 원료인 카카오를 세계에서 손꼽히게 많이 기르는 곳이에요. 옛날에는 금이 많이 나서 '황금 해안'이라고 불렸어요.",
    story: "우리가 먹는 초콜릿의 시작이 바로 가나예요. 카카오 열매는 나무 줄기에 럭비공처럼 매달려 자라는데, 그 속의 씨앗을 말리고 볶아야 초콜릿 향이 나요. 가나 사람들은 '켄테'라는 알록달록한 천을 손으로 짜는데, 색마다 뜻이 담겨 있대요.\n💬 이렇게 물어보세요: 달콤한 초콜릿이 처음엔 어떤 모습일까? 나무 어디에 열릴 것 같아?"
  },
  "Gabon": {
    brief: "가봉은 적도가 지나가는 나라로, 국토의 대부분이 울창한 숲이에요. 고릴라와 숲코끼리가 사는 자연의 보물창고예요.",
    story: "가봉은 나라의 거의 전부가 빽빽한 열대 숲이에요. 그 숲속에는 고릴라, 침팬지, 그리고 숲속에 사는 작은 코끼리가 숨어 살아요. 심지어 바닷가 모래사장까지 코끼리가 산책하러 나오기도 한대요.\n💬 이렇게 물어보세요: 코끼리가 바닷가에 나오면 뭘 하러 온 걸까?"
  },
  "Gambia": {
    brief: "감비아는 아프리카 본토에서 가장 작은 나라예요. 감비아강을 따라 가늘고 길게 생겨서, 지도에서 보면 꼭 강처럼 보여요.",
    story: "감비아는 나라 모양이 아주 특이해요. 감비아강 양쪽으로만 가늘고 길게 뻗어 있어서, 나라 전체가 강을 감싸고 있는 모양이에요. 강에는 하마와 악어가 살고, 강가 숲에는 원숭이들이 뛰어다녀요.\n💬 이렇게 물어보세요: 나라 모양이 왜 강을 따라 길쭉하게 생겼을까?"
  },
  "Guinea": {
    brief: "기니는 서아프리카의 큰 강들이 시작되는 나라예요. 그래서 '서아프리카의 물탱크'라고 불려요. 알루미늄의 원료인 보크사이트도 아주 많아요.",
    story: "서아프리카를 흐르는 큰 강들, 니제르강과 감비아강이 모두 기니의 산에서 시작돼요. 비가 아주 많이 와서 산과 폭포가 많거든요. 그리고 기니 땅속에는 비행기와 음료수 캔을 만드는 알루미늄의 원료가 잔뜩 묻혀 있어요.\n💬 이렇게 물어보세요: 큰 강의 맨 처음, 시작점은 어떤 모습일까?"
  },
  "Guinea Bissau": {
    brief: "기니비사우는 대서양에 접한 작은 나라로, 바다에 88개의 섬이 모인 비자고스 제도가 있어요. 캐슈너트를 많이 길러요.",
    story: "기니비사우 앞바다에는 88개의 섬이 옹기종기 모여 있어요. 어떤 섬에는 바닷물에서 헤엄치는 하마가 살아요. 보통 하마는 강에 사는데, 여기 하마들은 짠 바닷물도 아무렇지 않대요.\n💬 이렇게 물어보세요: 강에 사는 하마가 바다에서 살려면 뭐가 달라야 할까?"
  },
  "Namibia": {
    brief: "나미비아에는 세계에서 가장 오래된 사막으로 알려진 나미브 사막이 있어요. 붉은 모래언덕이 300미터 높이까지 솟아 있어요.",
    story: "나미브 사막의 모래언덕은 빨갛게 빛나요. 모래 속 철이 오랜 세월 녹슬어서 그래요. 어떤 언덕은 아파트 100층만큼 높아요. 신기하게도 이 사막은 바다 바로 옆에 있어서, 안개가 사막으로 흘러 들어와 곤충과 도마뱀이 그 안개를 마시며 살아요.\n💬 이렇게 물어보세요: 비가 거의 안 오는 사막에서 동물들은 물을 어디서 구할까?"
  },
  "Nigeria": {
    brief: "나이지리아는 아프리카에서 인구가 가장 많은 나라예요. 2억 명이 넘는 사람들이 살고, 500개가 넘는 언어가 쓰여요.",
    story: "나이지리아에는 아프리카에서 가장 많은 사람이 살아요. 무려 2억 명이 넘어요! 영화도 아주 많이 만들어서, 나이지리아 영화 산업을 '놀리우드'라고 불러요. 미국 할리우드보다 영화 편수가 더 많을 때도 있대요.\n💬 이렇게 물어보세요: 한 나라에서 500개가 넘는 말이 쓰이면 사람들은 어떻게 대화할까?"
  },
  "South Sudan": {
    brief: "남수단은 2011년에 독립한, 세계에서 가장 새로 생긴 나라예요. 세계에서 손꼽히게 큰 습지인 수드 습지가 있어요.",
    story: "남수단은 세계에서 가장 어린 나라예요. 2011년에야 독립했으니 이제 갓 태어난 셈이죠. 나일강이 이 나라를 지나며 '수드'라는 어마어마하게 큰 습지를 만들었는데, 우기에는 남한 면적만큼 커지기도 해요.\n💬 이렇게 물어보세요: 새 나라가 생기면 제일 먼저 뭘 정해야 할까? 이름? 국기?"
  },
  "South Africa": {
    brief: "남아프리카는 수도가 세 개나 있는 특별한 나라예요. 넬슨 만델라가 태어난 곳이고, 바닷가에 펭귄이 사는 나라이기도 해요.",
    story: "남아프리카에는 수도가 무려 세 개 있어요. 일을 나눠서 세 도시가 맡고 있거든요. 그리고 따뜻한 아프리카인데도 바닷가에 펭귄이 살아요! 케이프타운 근처 해변에 가면 진짜 야생 펭귄들이 뒤뚱뒤뚱 걸어 다녀요.\n💬 이렇게 물어보세요: 펭귄은 추운 곳에만 살 것 같은데, 어떻게 아프리카에 살까?"
  },
  "Niger": {
    brief: "니제르는 국토의 대부분이 사하라 사막인 나라예요. 사막 한가운데 '세상에서 가장 외로운 나무'가 서 있던 것으로 유명해요.",
    story: "니제르의 테네레 사막 한가운데에는 옛날에 나무 한 그루가 홀로 서 있었어요. 주변 400킬로미터 안에 나무가 그것뿐이라 '세상에서 가장 외로운 나무'라고 불렸죠. 사막을 건너는 사람들에게 등대 같은 존재였어요. 뿌리가 땅속 30미터가 넘는 깊은 물까지 닿아 있었대요.\n💬 이렇게 물어보세요: 비도 안 오는 사막에서 나무 한 그루가 어떻게 살아남았을까?"
  },
  "Liberia": {
    brief: "라이베리아는 아프리카에서 가장 오래된 공화국이에요. 자유를 찾은 사람들이 세운 나라라서 이름도 '자유의 땅'이라는 뜻이에요.",
    story: "라이베리아라는 이름은 '자유'라는 말에서 왔어요. 미국에서 노예 생활을 하다 자유를 얻은 사람들이 바다를 건너와 1847년에 세운 나라거든요. 그리고 아프리카에서 처음으로 여성 대통령을 뽑은 나라이기도 해요.\n💬 이렇게 물어보세요: 나라 이름에 '자유'를 넣은 사람들의 마음은 어땠을까?"
  },
  "Lesotho": {
    brief: "레소토는 나라 전체가 남아프리카 공화국 안에 쏙 들어가 있는 나라예요. 온 국토가 높은 산지라서 '하늘의 왕국'이라고 불려요.",
    story: "레소토는 세계에서 보기 드물게, 나라 전체가 다른 한 나라에 완전히 둘러싸여 있어요. 게다가 나라에서 가장 낮은 땅도 해발 1,400미터가 넘어요. 한라산 중턱보다 높죠! 그래서 아프리카인데도 겨울엔 눈이 내리고 스키장도 있어요.\n💬 이렇게 물어보세요: 나라가 통째로 다른 나라 안에 있으면, 바다에 가고 싶을 땐 어떻게 할까?"
  },
  "Rwanda": {
    brief: "르완다는 '천 개의 언덕의 나라'라고 불릴 만큼 언덕이 많아요. 산속에는 귀한 마운틴고릴라가 살아요.",
    story: "르완다는 온 나라가 초록 언덕으로 덮여 있어서 '천 개의 언덕의 나라'라고 불려요. 안개 낀 화산 숲에는 세계에 천 마리 정도밖에 없는 마운틴고릴라가 살아요. 그리고 르완다는 비닐봉지 사용을 금지해서, 수도 키갈리는 아프리카에서 가장 깨끗한 도시로 꼽혀요.\n💬 이렇게 물어보세요: 비닐봉지가 없으면 사람들은 장 볼 때 뭘 쓸까?"
  },
  "Libya": {
    brief: "리비아는 국토의 90퍼센트가 사막인 나라예요. 지중해 바닷가에는 2천 년 전 로마 시대의 거대한 도시 유적이 남아 있어요.",
    story: "리비아의 렙티스 마그나에는 2천 년 전 로마 사람들이 만든 도시가 거의 그대로 남아 있어요. 사막의 모래가 도시를 덮어서 오히려 잘 보존됐대요. 그리고 사막 깊은 땅속에는 아주 옛날에 고인 거대한 지하수가 잠들어 있어서, 사람들이 긴 파이프로 그 물을 끌어와 마셔요.\n💬 이렇게 물어보세요: 모래가 덮으면 부서질 것 같은데, 왜 오히려 유적이 잘 보존됐을까?"
  },
  "Madagascar": {
    brief: "마다가스카르는 세계에서 네 번째로 큰 섬나라예요. 여우원숭이처럼 이 섬에만 사는 동물이 아주 많아요.",
    story: "마다가스카르는 아주 오래전에 큰 대륙에서 떨어져 나온 섬이에요. 그래서 동물과 식물 대부분이 세상 어디에도 없고 오직 여기에만 살아요. 폴짝폴짝 옆으로 뛰는 여우원숭이도, 뿌리가 하늘로 솟은 것 같은 거대한 바오바브나무도 이 섬의 보물이에요.\n💬 이렇게 물어보세요: 섬이 대륙에서 떨어져 나가면, 그 안의 동물들은 어떻게 변해갈까?"
  },
  "Malawi": {
    brief: "말라위는 '아프리카의 따뜻한 심장'이라고 불리는 나라예요. 말라위 호수에는 세계에서 가장 다양한 민물고기가 살아요.",
    story: "말라위 호수는 바다처럼 넓은데, 그 안에 사는 물고기 종류가 세계의 호수 중에서 가장 많아요. 알록달록한 시클리드라는 물고기만 800종이 넘는대요. 거의 다 이 호수에만 사는 물고기예요. 사람들이 친절해서 나라 별명이 '아프리카의 따뜻한 심장'이에요.\n💬 이렇게 물어보세요: 한 호수 안에서 물고기가 어떻게 800가지나 되도록 갈라졌을까?"
  },
  "Mali": {
    brief: "말리에는 옛날 황금과 책으로 유명했던 도시 팀북투가 있어요. 진흙으로 지은 세계에서 가장 큰 건물도 있어요.",
    story: "옛날 말리의 왕 만사 무사는 역사상 가장 큰 부자로 꼽혀요. 금을 너무 많이 갖고 있어서, 여행하며 금을 나눠주자 지나간 도시마다 금값이 떨어졌다는 이야기가 전해져요. 그리고 젠네라는 도시에는 진흙으로 지은 세계에서 가장 큰 건물이 있는데, 해마다 마을 사람들이 다 같이 새 진흙을 발라 고쳐요.\n💬 이렇게 물어보세요: 진흙으로 지은 큰 건물이 비에 안 무너지려면 어떻게 해야 할까?"
  },
  "Morocco": {
    brief: "모로코에는 온 마을이 파란색으로 칠해진 셰프샤우엔이 있어요. 사하라 사막의 입구이고, 달콤한 민트차로 유명해요.",
    story: "모로코의 셰프샤우엔이라는 마을은 골목도 벽도 계단도 온통 파란색이에요. 마을 전체가 하늘 속에 들어온 것 같죠. 미로처럼 얽힌 옛 시장 '메디나'에서는 길을 잃는 게 오히려 재미예요. 손님이 오면 달콤한 민트차를 높이높이 따라주는 게 모로코의 인사래요.\n💬 이렇게 물어보세요: 마을 사람들은 왜 온 동네를 파란색으로 칠했을까?"
  },
  "Mauritania": {
    brief: "모리타니는 국토 대부분이 사하라 사막이에요. 사막을 가로지르는 세계에서 가장 긴 기차 중 하나가 달려요.",
    story: "모리타니에는 철광석을 실어 나르는 기차가 있는데, 길이가 2킬로미터가 넘어요. 기차 칸이 200개도 넘게 이어져서, 기차 머리가 보이고 한참 지나야 꼬리가 와요. 사람들은 철광석 더미 위에 올라타고 사막을 건너기도 한대요.\n💬 이렇게 물어보세요: 기차가 2킬로미터면, 건널목에서 다 지나가길 기다리는 데 얼마나 걸릴까?"
  },
  "Mozambique": {
    brief: "모잠비크는 인도양을 따라 2,500킬로미터나 되는 긴 해안을 가진 나라예요. 바다에는 세상에서 가장 큰 물고기인 고래상어가 찾아와요.",
    story: "모잠비크 바다에는 세상에서 가장 큰 물고기, 고래상어가 살아요. 버스만큼 크지만 이빨로 무는 게 아니라 작은 플랑크톤을 걸러 먹는 순한 거인이에요. 모잠비크 국기에는 특이하게 책이 그려져 있는데, 배움이 그만큼 소중하다는 뜻이래요.\n💬 이렇게 물어보세요: 세상에서 가장 큰 물고기가 왜 제일 작은 먹이를 먹고 살까?"
  },
  "Benin": {
    brief: "베냉은 옛 다호메이 왕국이 있던 곳이에요. 여성 전사 부대가 실제로 있었던 나라로 유명해요.",
    story: "옛날 베냉 땅의 다호메이 왕국에는 여성으로만 이루어진 전사 부대가 진짜로 있었어요. 어찌나 용맹했는지 다른 나라 사람들이 전설 속 '아마존 전사'라고 불렀대요. 영화 속 여전사 이야기들이 바로 이 역사에서 영감을 받았어요.\n💬 이렇게 물어보세요: 그 시절에 여성 전사 부대가 있었다는 건 어떤 의미였을까?"
  },
  "Botswana": {
    brief: "보츠와나에는 바다로 가지 못하고 사막에서 끝나는 신기한 강, 오카방고 델타가 있어요. 코끼리가 세계에서 가장 많은 나라예요.",
    story: "강은 보통 바다로 흘러가는데, 보츠와나의 오카방고강은 사막 한가운데서 끝나요. 강물이 사막에 퍼지면서 거대한 물의 미로를 만들고, 그곳에 코끼리·하마·사자가 모여들어요. 보츠와나에는 코끼리가 13만 마리나 살아서 세계에서 가장 많아요.\n💬 이렇게 물어보세요: 바다에 못 간 강물은 마지막에 다 어디로 갈까?"
  },
  "Burundi": {
    brief: "부룬디는 세계에서 두 번째로 깊은 탕가니카 호수 곁에 있는 나라예요. 왕실의 북 연주가 유네스코 문화유산이에요.",
    story: "부룬디의 북 연주는 아주 특별해요. 커다란 북을 머리에 이고 두드리며 춤추는데, 옛날에는 왕 앞에서만 연주할 수 있는 신성한 소리였대요. 지금은 유네스코가 지정한 인류의 문화유산이 되었어요. 그 북소리는 심장 뛰는 소리를 닮았어요.\n💬 이렇게 물어보세요: 북소리가 왜 사람 심장 소리처럼 느껴질까?"
  },
  "Burkina Faso": {
    brief: "부르키나파소는 나라 이름이 '정직한 사람들의 땅'이라는 뜻이에요. 서아프리카 한가운데 있는 나라예요.",
    story: "부르키나파소라는 긴 이름에는 멋진 뜻이 숨어 있어요. 두 가지 말을 합쳐 '정직한 사람들의 땅'이라고 지었거든요. 나라 이름에 정직을 담은 나라는 세계에서도 드물어요. 해마다 아프리카에서 가장 큰 영화 축제가 이곳에서 열려요.\n💬 이렇게 물어보세요: 우리가 새 나라를 만든다면 이름에 어떤 마음을 담고 싶어?"
  },
  "Western Sahara": {
    brief: "서사하라는 사하라 사막이 대서양 바다와 만나는 땅이에요. 아직 어느 나라의 땅인지 정해지지 않은 특별한 곳이에요.",
    story: "서사하라는 지도에서 보기 드문 곳이에요. 아직 세계가 '여기는 어느 나라'라고 다 함께 정하지 못한 땅이거든요. 끝없는 모래사막이 그대로 바다와 만나서, 모래언덕 너머로 파도가 치는 신기한 풍경이 펼쳐져요.\n💬 이렇게 물어보세요: 사막과 바다가 바로 붙어 있으면 그 경계는 어떤 모습일까?"
  },
  "Senegal": {
    brief: "세네갈에는 물이 분홍색인 신기한 호수가 있어요. 서아프리카 문화와 음악의 중심지로 꼽히는 나라예요.",
    story: "세네갈의 레트바 호수는 물이 진짜 분홍색이에요! 소금기가 아주 많은 물에 사는 작은 미생물이 분홍 빛깔을 만들어내거든요. 호수의 소금기는 바다의 열 배나 돼서, 사람이 누우면 둥둥 떠요. 사람들은 이 호수에서 소금을 캐며 살아가요.\n💬 이렇게 물어보세요: 물이 분홍색이 되려면 물속에 뭐가 있어야 할까?"
  },
  "Somalia": {
    brief: "소말리아는 아프리카 본토에서 해안선이 가장 긴 나라예요. 낙타가 아주 많고, 시를 사랑해서 '시인의 나라'라고 불려요.",
    story: "소말리아는 낙타의 나라예요. 세계에서 낙타가 가장 많은 나라로 꼽히고, 낙타는 재산이자 친구예요. 그리고 소말리아 사람들은 시를 아주 사랑해서, 중요한 이야기나 뉴스도 시로 지어 전하는 전통이 있어요.\n💬 이렇게 물어보세요: 글이 아니라 시로 소식을 전하면 뭐가 좋을까?"
  },
  "Sudan": {
    brief: "수단에는 이집트보다 피라미드가 더 많아요! 작고 뾰족한 피라미드 200개가 사막에 줄지어 서 있어요.",
    story: "피라미드 하면 이집트를 떠올리지만, 사실 피라미드가 더 많은 나라는 수단이에요. 옛 쿠시 왕국 사람들이 세운 뾰족한 피라미드가 200개도 넘게 사막에 남아 있어요. 이집트 것보다 작지만 더 가파르고 날렵하게 생겼어요.\n💬 이렇게 물어보세요: 이웃 나라끼리 피라미드 모양이 왜 달라졌을까?"
  },
  "Sierra Leone": {
    brief: "시에라리온은 '사자 산'이라는 뜻의 이름을 가진 나라예요. 수도 이름은 프리타운, '자유의 마을'이에요.",
    story: "옛날 뱃사람들이 이 땅의 산을 보고 사자가 웅크린 모습 같다며 '사자 산'이라는 이름을 붙였어요. 천둥소리가 사자 울음 같았다는 이야기도 있어요. 수도 프리타운은 자유를 찾은 사람들이 새 삶을 시작한 곳이라 '자유의 마을'이라는 이름이 붙었어요.\n💬 이렇게 물어보세요: 산 모양을 보고 이름을 짓는다면, 우리 동네 산은 뭐라고 부를까?"
  },
  "Algeria": {
    brief: "알제리는 아프리카에서 면적이 가장 큰 나라예요. 사하라 사막의 바위에는 아주 먼 옛날의 그림이 남아 있어요.",
    story: "알제리는 아프리카에서 가장 큰 나라예요. 사막 깊은 곳 타실리 바위산에는 수천 년 전 사람들이 그린 그림이 가득해요. 그림 속에는 소 떼, 기린, 헤엄치는 사람들이 있어요. 지금은 모래뿐인 사하라가 옛날엔 풀과 물이 가득한 초원이었다는 증거예요.\n💬 이렇게 물어보세요: 초원이 어떻게 사막으로 변했을까? 그때 살던 동물들은 어디로 갔을까?"
  },
  "Angola": {
    brief: "앙골라는 대서양에 접한 나라로, 아프리카에서 손꼽히게 큰 칼란둘라 폭포가 있어요. 포르투갈어를 쓰는 나라예요.",
    story: "앙골라의 칼란둘라 폭포는 폭이 400미터나 되는 거대한 물의 커튼이에요. 그리고 앙골라에만 사는 자이언트 세이블이라는 영양은 길고 휘어진 뿔이 멋져서 나라의 자랑이에요. 한때 사라진 줄 알았는데 깊은 숲에서 다시 발견됐어요.\n💬 이렇게 물어보세요: 사라진 줄 알았던 동물이 다시 나타나면 사람들은 뭘 해야 할까?"
  },
  "Eritrea": {
    brief: "에리트레아의 수도 아스마라는 도시 전체가 유네스코 세계유산이에요. 홍해 바닷가에 있는 나라예요.",
    story: "에리트레아의 수도 아스마라는 거리 전체가 박물관 같아요. 100년 전 지어진 멋진 건물들이 도시에 그대로 남아서, 도시 통째로 유네스코 세계유산이 되었어요. 비행기 모양으로 지은 주유소 건물도 있답니다.\n💬 이렇게 물어보세요: 건물 하나가 아니라 도시 전체가 유산이 되려면 뭐가 필요할까?"
  },
  "Swaziland": {
    brief: "에스와티니는 아프리카에 남은 왕이 직접 다스리는 나라예요. 작지만 전통 축제가 살아 있는 나라예요.",
    story: "에스와티니는 지금도 왕이 직접 다스리는, 세계에서 드문 왕국이에요. 해마다 갈대 축제가 열리면 수만 명이 전통 옷을 입고 모여 춤추고 노래해요. 나라는 작아도 코뿔소와 사자가 사는 자연 보호구역이 있어요.\n💬 이렇게 물어보세요: 왕이 다스리는 나라와 대통령을 뽑는 나라는 뭐가 다를까?"
  },
  "Ethiopia": {
    brief: "에티오피아는 커피가 처음 발견된 커피의 고향이에요. 1년이 13개월인 독특한 달력을 써요.",
    story: "전해오는 이야기로, 옛날 에티오피아의 염소치기 칼디가 염소들이 빨간 열매를 먹고 팔짝팔짝 뛰는 걸 보고 커피를 발견했대요. 에티오피아는 지금도 손님이 오면 커피 끓이는 의식을 정성껏 해요. 그리고 1년을 13개월로 나누는 자기만의 달력을 써서, 우리와 해가 7년쯤 달라요.\n💬 이렇게 물어보세요: 염소가 열매 먹고 뛰는 걸 보고, 칼디는 무슨 생각을 했을까?"
  },
  "Uganda": {
    brief: "우간다는 적도가 지나가는 나라예요. 세계에서 가장 긴 강인 나일강이 이 나라의 빅토리아 호수에서 시작돼요.",
    story: "세계에서 가장 긴 나일강의 출발점이 바로 우간다에 있어요. 바다처럼 넓은 빅토리아 호수에서 강물이 흘러나와 6,600킬로미터를 달려 이집트 바다까지 가요. 우간다 산속 안개 숲에는 마운틴고릴라 가족들이 살아요.\n💬 이렇게 물어보세요: 호수에서 출발한 물 한 방울이 바다까지 가는 데 얼마나 걸릴까?"
  },
  "Egypt": {
    adult: {
      summary: "아프리카 북동부의 나라로 수도는 카이로입니다. 나일강이 기른 인류 최초의 문명 중 하나가 시작된 곳입니다.",
      geo: "국토 대부분이 사막이지만 나일강 유역에 인구 대부분이 모여 삽니다. 수에즈 운하가 지중해와 홍해를 잇습니다.",
      history: "약 5천 년 전 파라오의 고대 이집트 문명이 피라미드와 상형문자를 남겼습니다. 이후 로마·이슬람 제국을 거쳐 1922년 독립했습니다.",
      culture: "이슬람교가 중심이며, 고대 유적과 현대 아랍 문화가 공존합니다. 기자의 피라미드와 스핑크스가 상징입니다.",
      people: "고대의 파라오 투탕카멘과 클레오파트라, 전 유엔 사무총장 부트로스 갈리 등이 있습니다."
    },
    brief: "이집트는 피라미드와 파라오의 나라예요. 4,500년 전에 만든 거대한 피라미드가 아직도 서 있어요.",
    story: "이집트의 쿠푸 피라미드는 4,500년 전에 지어졌는데, 돌 230만 개를 쌓아 만들었어요. 돌 하나가 자동차보다 무거워요. 기계도 없던 시절에 어떻게 이걸 만들었는지 지금도 다 풀리지 않은 수수께끼예요. 나일강이 사막 가운데 긴 초록 띠를 만들어 사람들이 살 수 있게 해줘요.\n💬 이렇게 물어보세요: 기중기도 트럭도 없던 옛날에 그 무거운 돌을 어떻게 올렸을까?"
  },
  "Zambia": {
    brief: "잠비아에는 빅토리아 폭포가 있어요. 현지 말로는 '천둥 치는 연기'라고 불러요.",
    story: "잠비아의 빅토리아 폭포는 폭이 1.7킬로미터나 되는 거대한 폭포예요. 물이 떨어지는 소리가 천둥 같고 물보라가 연기처럼 하늘로 솟아서, 옛날부터 이곳 사람들은 '모시 오아 툰야', 천둥 치는 연기라고 불렀어요. 물보라는 수십 킬로미터 밖에서도 보여요.\n💬 이렇게 물어보세요: 폭포에서 연기처럼 보이는 건 사실 뭘까?"
  },
  "Equatorial Guinea": {
    brief: "적도 기니는 아프리카에서 유일하게 스페인어를 쓰는 나라예요. 본토와 화산섬으로 이루어져 있어요.",
    story: "적도 기니는 아프리카에서 딱 하나뿐인 스페인어 나라예요. 이름에 '적도'가 들어가지만 재미있게도 적도선은 본토 땅을 살짝 비껴가요. 수도는 본토가 아니라 바다 건너 화산섬 위에 있어요.\n💬 이렇게 물어보세요: 이름에 적도가 있는데 적도가 안 지나간다니, 이름은 어떻게 지어졌을까?"
  },
  "Central African Republic": {
    brief: "중앙아프리카 공화국은 아프리카 대륙의 한가운데 있는 나라예요. 숲속 늪에 코끼리들이 모여드는 신비한 곳이 있어요.",
    story: "이 나라의 깊은 숲속에는 '장가 바이'라는 신기한 늪 공터가 있어요. 흙 속에 소금기와 미네랄이 많아서, 숲코끼리 수십 마리가 가족과 함께 모여들어요. 코끼리들의 광장인 셈이죠. 고릴라와 숲물소도 찾아와요.\n💬 이렇게 물어보세요: 코끼리들은 그 늪에 소금이 있다는 걸 어떻게 알았을까?"
  },
  "Djibouti": {
    brief: "지부티에는 아프리카에서 가장 낮은 땅인 아살 호수가 있어요. 바다보다 훨씬 짠 소금 호수예요.",
    story: "지부티의 아살 호수는 바다 표면보다 155미터나 낮은 곳에 있어요. 아프리카에서 가장 낮은 땅이죠. 물은 바다보다 열 배 가까이 짜서 몸이 저절로 둥둥 떠요. 호수 둘레는 하얀 소금밭이 눈처럼 펼쳐져 있어요.\n💬 이렇게 물어보세요: 물이 아주 짜면 왜 몸이 잘 뜰까?"
  },
  "Zimbabwe": {
    brief: "짐바브웨라는 이름은 '돌의 집'이라는 뜻이에요. 옛날 사람들이 돌만 쌓아 만든 거대한 유적이 남아 있어요.",
    story: "짐바브웨에는 '그레이트 짐바브웨'라는 거대한 돌 유적이 있어요. 신기한 건 시멘트나 접착제 없이 돌만 차곡차곡 쌓아 11미터 높이의 성벽을 만들었다는 거예요. 900년이 지난 지금도 무너지지 않고 서 있어요. 나라 이름이 바로 이 '돌의 집'에서 왔어요.\n💬 이렇게 물어보세요: 풀로 붙이지도 않았는데 돌담이 어떻게 900년을 버틸까?"
  },
  "Chad": {
    brief: "차드는 사하라 사막과 초원이 만나는 나라예요. 한가운데에는 옛날에 바다처럼 컸던 차드 호수가 있어요.",
    story: "차드 호수는 옛날에는 바다처럼 거대했는데, 점점 줄어들어 지금은 옛 크기의 10분의 1도 안 돼요. 네 나라 사람들이 이 호수에 기대어 살아요. 사막 쪽 에네디 산맥의 바위에는 수천 년 전 사람들이 그린 소와 낙타 그림이 남아 있어요.\n💬 이렇게 물어보세요: 그 큰 호수의 물이 다 어디로 갔을까?"
  },
  "Cameroon": {
    brief: "카메룬은 사막, 초원, 열대우림, 화산까지 다 있어서 '아프리카의 축소판'이라고 불려요. 축구를 아주 사랑하는 나라예요.",
    story: "카메룬 한 나라 안에는 아프리카의 모든 풍경이 다 들어 있어요. 북쪽은 건조한 사바나, 남쪽은 빽빽한 열대우림, 바닷가엔 활화산까지 있죠. 그래서 '아프리카의 축소판'이라 불려요. 나라 이름은 옛날 뱃사람들이 강에서 새우를 잔뜩 보고 '새우의 강'이라 부른 데서 왔대요.\n💬 이렇게 물어보세요: 새우 때문에 나라 이름이 생겼다니, 우리나라 이름은 어디서 왔을까?"
  },
  "Kenya": {
    brief: "케냐는 사바나 초원의 나라예요. 해마다 수백만 마리의 누 떼가 강을 건너는 대이동이 펼쳐져요.",
    story: "케냐의 마사이마라 초원에서는 해마다 지구에서 가장 큰 동물 이동이 펼쳐져요. 누와 얼룩말 수백만 마리가 풀을 찾아 강을 건너는데, 악어가 기다리는 강물에 첫 번째로 뛰어드는 용감한 누가 있어야 모두가 건너요. 적도가 지나는 더운 나라인데 케냐산 꼭대기에는 눈이 쌓여 있어요.\n💬 이렇게 물어보세요: 악어가 있는 걸 알면서도 누는 왜 강을 건널까?"
  },
  "Ivory Coast": {
    brief: "코트디부아르는 '상아 해안'이라는 뜻의 이름을 가진 나라예요. 초콜릿 원료인 카카오를 세계에서 가장 많이 길러요.",
    story: "세계 초콜릿의 시작점을 따라가면 코트디부아르에 닿아요. 카카오를 세계에서 가장 많이 기르는 나라거든요. 전 세계 초콜릿 셋 중 하나는 이 나라 카카오로 만들어진대요. 그런데 카카오 농부 중에는 정작 초콜릿을 한 번도 못 먹어본 사람도 많대요.\n💬 이렇게 물어보세요: 카카오를 기르는 사람이 왜 초콜릿을 못 먹어봤을까?"
  },
  "Republic of the Congo": {
    brief: "콩고는 세계에서 두 번째로 큰 열대우림인 콩고 숲에 안겨 있는 나라예요. 고릴라와 침팬지의 보금자리예요.",
    story: "콩고의 숲은 아마존 다음으로 큰 지구의 허파예요. 이 숲에는 고릴라 가족들이 살고 있는데, 고릴라 아빠는 등이 은색이라 '실버백'이라고 불려요. 가슴을 두드리는 건 화가 나서가 아니라 '나 여기 있어'라고 알리는 인사에 가깝대요.\n💬 이렇게 물어보세요: 고릴라가 가슴을 두드리는 소리는 숲에서 얼마나 멀리까지 들릴까?"
  },
  "Democratic Republic of the Congo": {
    brief: "콩고 민주 공화국은 아프리카에서 두 번째로 큰 나라예요. 세계에서 가장 깊은 강인 콩고강이 흘러요.",
    story: "콩고강은 세계에서 가장 깊은 강이에요. 깊은 곳은 220미터나 돼서 63빌딩이 잠겨요. 그리고 이 나라 숲에만 사는 오카피라는 동물이 있는데, 기린의 친척인데 다리에는 얼룩말 무늬가 있어요. 너무 수줍어서 20세기가 되어서야 세상에 알려졌어요.\n💬 이렇게 물어보세요: 강이 220미터나 깊으면 그 바닥엔 어떤 물고기가 살까?"
  },
  "United Republic of Tanzania": {
    brief: "탄자니아에는 아프리카에서 가장 높은 킬리만자로산이 있어요. 더운 적도 근처인데 산꼭대기에는 눈이 쌓여 있어요.",
    story: "킬리만자로는 높이 5,895미터, 아프리카의 지붕이에요. 산 아래는 더운 초원인데 꼭대기에는 만년설이 빛나요. 한 산을 오르며 여름에서 겨울까지 다 지나는 셈이죠. 산 아래 세렝게티 초원에는 사자, 코끼리, 기린이 어우러져 살아요.\n💬 이렇게 물어보세요: 더운 나라의 산꼭대기에 어떻게 눈이 안 녹고 쌓여 있을까?"
  },
  "Togo": {
    brief: "토고는 폭이 좁고 위아래로 길쭉한 나라예요. 작은 나라 안에 바다, 호수, 산, 초원이 다 있어요.",
    story: "토고는 폭이 100킬로미터도 안 되는데 위아래로는 길게 뻗어 있어요. 그래서 하루 만에 바닷가에서 출발해 호수를 지나 산과 초원까지 갈 수 있어요. 작은 나라지만 풍경 부자인 셈이죠. 흙으로 지은 탑 모양 집 '타키엔타'는 유네스코 유산이에요.\n💬 이렇게 물어보세요: 나라가 좁고 길면 좋은 점과 불편한 점이 뭘까?"
  },
  "Tunisia": {
    brief: "튀니지는 지중해의 나라로, 고대 카르타고의 유적이 남아 있어요. 영화 스타워즈를 찍은 사막 마을도 있어요.",
    story: "튀니지의 마트마타 마을 사람들은 옛날부터 땅을 파서 그 안에 집을 짓고 살았어요. 사막의 더위와 추위를 피하는 지혜죠. 이 신기한 땅속 집들이 영화 스타워즈의 배경이 되었어요. 2천 년 전엔 로마와 겨루던 강한 나라 카르타고가 바로 여기 있었어요.\n💬 이렇게 물어보세요: 땅속 집은 여름에 시원하고 겨울에 따뜻하대. 왜 그럴까?"
  },
  // ===== 아시아 (1/2) =====
  "Nepal": {
    brief: "네팔에는 세계에서 가장 높은 산, 에베레스트가 있어요. 국기가 네모가 아닌 세계 유일의 나라이기도 해요.",
    story: "네팔의 에베레스트는 높이 8,849미터, 하늘에 가장 가까운 땅이에요. 산이 너무 높아 꼭대기에는 공기가 적어서 숨쉬기도 힘들어요. 그리고 네팔 국기는 세계에서 유일하게 네모가 아니에요. 삼각형 두 개를 포개 놓은 모양인데, 히말라야 산봉우리를 닮았어요.\n💬 이렇게 물어보세요: 산꼭대기로 올라갈수록 왜 숨쉬기가 힘들어질까?"
  },
  "Taiwan": {
    brief: "대만은 버블티가 처음 만들어진 곳이에요. 밤마다 열리는 야시장과 높은 타이베이101 빌딩으로 유명해요.",
    story: "쫀득한 펄이 든 버블티는 대만에서 태어났어요. 한 찻집에서 차에 떡 같은 타피오카 알갱이를 넣어본 게 시작이었대요. 대만의 밤은 야시장으로 들썩여요. 골목마다 맛있는 냄새가 가득하고, 타이베이101 빌딩은 한때 세계에서 가장 높은 건물이었어요.\n💬 이렇게 물어보세요: 차에 쫀득한 알갱이를 처음 넣어본 사람은 무슨 생각이었을까?"
  },
  "East Timor": {
    brief: "동티모르는 21세기에 처음으로 독립한 나라예요. 향이 좋은 커피를 기르는 작은 섬나라예요.",
    story: "동티모르는 2002년에 독립한, 21세기가 낳은 첫 번째 새 나라예요. 산비탈에서 정성껏 기른 커피가 이 나라의 자랑이고, 바다는 세계 다이버들이 사랑할 만큼 맑아요. 고래들이 지나다니는 깊은 바다가 섬 바로 옆에 있어요.\n💬 이렇게 물어보세요: 새로 독립한 나라의 첫날, 사람들은 어떤 기분이었을까?"
  },
  "Laos": {
    brief: "라오스는 바다가 없는 대신 메콩강이 흐르는 나라예요. 아침마다 스님들이 줄지어 걷는 탁발 행렬이 유명해요.",
    story: "라오스의 루앙프라방에서는 해 뜰 무렵 주황색 옷을 입은 스님들이 길게 줄지어 걸어요. 사람들은 길가에 앉아 밥을 나눠 드리죠. 천 년 넘게 이어온 아침 풍경이에요. 바다가 없는 라오스에서 메콩강은 길이자 시장이자 놀이터예요.\n💬 이렇게 물어보세요: 바다가 없는 나라에서 강은 어떤 역할을 할까?"
  },
  "Lebanon": {
    brief: "레바논 국기에는 나무가 그려져 있어요. 수천 년을 사는 백향목이라는 나무예요. 아주 오래된 항구 도시들이 있는 나라예요.",
    story: "레바논의 백향목은 수천 년을 사는 크고 향기로운 나무예요. 옛날 사람들은 이 나무로 배와 궁전을 지었고, 지금은 국기 한가운데 자리 잡았어요. 항구 도시 비블로스는 7천 년 넘게 사람이 살아온, 세계에서 가장 오래된 도시 중 하나예요.\n💬 이렇게 물어보세요: 나라의 국기에 나무를 그려 넣은 마음은 뭘까?"
  },
  "Malaysia": {
    brief: "말레이시아에는 쌍둥이처럼 나란히 선 페트로나스 트윈타워가 있어요. 숲에는 오랑우탄과 세계에서 가장 큰 꽃이 살아요.",
    story: "말레이시아 보르네오 숲에는 '숲의 사람'이라는 뜻의 오랑우탄이 살아요. 그리고 라플레시아라는 세계에서 가장 큰 꽃도 피는데, 지름이 1미터나 돼요. 그런데 향기 대신 고약한 냄새를 풍겨요. 파리를 불러서 꽃가루를 옮기려는 작전이래요.\n💬 이렇게 물어보세요: 꽃이 좋은 향기 대신 고약한 냄새를 풍기면 뭐가 좋을까?"
  },
  "Mongolia": {
    brief: "몽골은 끝없는 초원의 나라예요. 사람들은 게르라는 둥근 집을 짓고, 말과 함께 살아가요.",
    story: "몽골 사람들은 게르라는 둥근 천막집에 살아요. 신기한 건 가족이 다 함께 한두 시간이면 집을 통째로 접어서 이사할 수 있다는 거예요. 풀을 찾아 계절마다 옮겨 다니거든요. 도시 불빛이 없는 초원의 밤하늘에는 별이 쏟아질 듯 가득해요.\n💬 이렇게 물어보세요: 집을 접어서 들고 다닌다면, 우리 집에서 꼭 가져갈 것 세 가지는 뭘까?"
  },
  "Myanmar": {
    brief: "미얀마에는 금으로 덮인 거대한 탑 쉐다곤 파고다가 있어요. 바간 평원에는 천 년 된 탑이 수천 개 서 있어요.",
    story: "미얀마의 쉐다곤 파고다는 진짜 금판으로 뒤덮여 있고 꼭대기에는 다이아몬드가 박혀 있어요. 해 질 녘이면 온 탑이 황금빛으로 타올라요. 바간이라는 옛 도시 평원에는 천 년 전에 세운 탑과 절이 2천 개 넘게 남아 있어서, 새벽안개 속 풍경이 꿈결 같아요.\n💬 이렇게 물어보세요: 옛날 사람들은 왜 탑을 2천 개나 세웠을까?"
  },
  "Bangladesh": {
    brief: "방글라데시는 큰 강들이 바다와 만나며 만든 강의 나라예요. 비가 아주 많이 오고, 알록달록한 릭샤가 거리를 달려요.",
    story: "방글라데시는 히말라야에서 내려온 큰 강들이 모여 바다로 나가는 길목에 있어요. 그래서 나라의 많은 부분이 강과 물길이에요. 거리에는 그림과 장식으로 꾸민 자전거 택시 '릭샤'가 수십만 대 달리는데, 한 대 한 대가 움직이는 미술 작품 같아요.\n💬 이렇게 물어보세요: 강이 많은 나라에서 학교 가는 길은 어떤 모습일까?"
  },
  "Vietnam": {
    brief: "베트남의 하롱베이에는 바다 위에 바위섬 수천 개가 솟아 있어요. 따끈한 쌀국수의 고향이기도 해요.",
    story: "베트남 하롱베이에는 에메랄드빛 바다 위로 바위섬이 1,600개 넘게 솟아 있어요. 전설에는 용이 내려와 보석을 뿌렸는데 그게 섬이 되었다고 해요. '하롱'이 바로 '용이 내려온 곳'이라는 뜻이에요. 아침이면 사람들이 김이 모락모락 나는 쌀국수로 하루를 시작해요.\n💬 이렇게 물어보세요: 바다 한가운데 바위섬 수천 개는 진짜로 어떻게 만들어졌을까?"
  },
  "Bhutan": {
    brief: "부탄은 돈보다 국민의 행복을 나라의 목표로 삼은 나라예요. 절벽에 매달린 듯한 신비한 사원이 있어요.",
    story: "부탄은 세계에서 처음으로 '국민이 얼마나 행복한가'를 나라의 가장 중요한 목표로 삼았어요. 깊은 산속 절벽 900미터 높이에는 탁상 사원이 새 둥지처럼 붙어 있어요. 수도에는 신호등이 하나도 없고, 경찰이 춤추듯 손짓으로 차를 안내해요.\n💬 이렇게 물어보세요: 나라가 부자가 되는 것과 사람들이 행복한 것, 뭐가 다를까?"
  },
  "Brunei": {
    brief: "브루나이는 작지만 부유한 술탄의 나라예요. 물 위에 지은 마을, 캄퐁 아예르가 유명해요.",
    story: "브루나이의 캄퐁 아예르는 바다 같은 강 위에 통째로 지어진 마을이에요. 집도 학교도 소방서도 모두 기둥 위에 떠 있고, 사람들은 배를 타고 등교해요. 천 년 넘게 이어진 세계에서 가장 큰 수상 마을이에요.\n💬 이렇게 물어보세요: 물 위 마을에서는 뭐가 편하고 뭐가 불편할까?"
  },
  "Saudi Arabia": {
    brief: "사우디아라비아는 거대한 사막의 나라예요. 전 세계 무슬림들이 평생 한 번은 찾아오고 싶어 하는 도시 메카가 있어요.",
    story: "사우디아라비아의 룹알할리 사막은 '빈 땅'이라는 뜻인데, 프랑스보다 넓은 모래의 바다예요. 메카라는 도시에는 해마다 전 세계에서 수백만 명이 순례를 와요. 모두 같은 흰옷을 입고 한곳을 향해 도는 모습은 하늘에서 보면 거대한 물결 같아요.\n💬 이렇게 물어보세요: 수백만 명이 똑같은 흰옷을 입는 건 어떤 의미일까?"
  },
  "Sri Lanka": {
    brief: "스리랑카는 인도양의 눈물방울 모양 섬나라예요. 실론티라는 홍차와 코끼리로 유명해요.",
    story: "스리랑카의 시기리야에는 200미터 바위 꼭대기에 지은 궁전 터가 있어요. 1,500년 전 왕이 사자 모양 입구를 지나야 오를 수 있는 하늘 요새를 만든 거예요. 산비탈 초록 차밭에서 따는 찻잎은 '실론티'라는 이름으로 전 세계로 떠나요.\n💬 이렇게 물어보세요: 왕은 왜 하필 바위 꼭대기에 궁전을 지었을까?"
  },
  "Syria": {
    brief: "시리아의 수도 다마스쿠스는 세계에서 가장 오래 사람이 살아온 도시 중 하나예요. 장미와 재스민 향기의 도시예요.",
    story: "다마스쿠스에는 수천 년 동안 끊이지 않고 사람이 살아왔어요. 골목을 걸으면 그 긴 세월이 켜켜이 쌓여 있죠. 다마스쿠스 장미는 향이 깊어서 세계의 향수가 이 꽃을 찾아요. 오래된 시장 골목엔 재스민 향이 흘러요.\n💬 이렇게 물어보세요: 한 도시에 수천 년 동안 사람이 산다는 건 어떤 걸까?"
  },
  "United Arab Emirates": {
    brief: "아랍에미리트에는 세계에서 가장 높은 빌딩, 부르즈 할리파가 있어요. 사막 위에 세운 미래 도시 두바이가 있는 나라예요.",
    story: "두바이의 부르즈 할리파는 높이 828미터로 세계에서 가장 높은 건물이에요. 너무 높아서 꼭대기와 아래층의 해 지는 시간이 몇 분이나 달라요. 50년 전만 해도 사막과 작은 어촌이던 곳이 이렇게 변했다는 게 더 놀라운 이야기죠.\n💬 이렇게 물어보세요: 건물 꼭대기에서는 해가 더 늦게 진대. 왜 그럴까?"
  },
  "Armenia": {
    brief: "아르메니아는 세계에서 가장 먼저 기독교를 나라의 종교로 받아들인 나라예요. 달콤한 살구의 고향으로도 불려요.",
    story: "아르메니아는 1,700여 년 전, 세계에서 처음으로 기독교를 나라의 종교로 정했어요. 산골짜기마다 천 년 넘은 돌 수도원이 숨어 있죠. 살구는 아르메니아가 고향이라고 전해져서, 살구의 학명에도 아르메니아라는 이름이 들어 있어요.\n💬 이렇게 물어보세요: 과일 이름에 나라 이름이 들어가려면 어떤 사연이 있어야 할까?"
  },
  "Azerbaijan": {
    brief: "아제르바이잔은 '불의 나라'라고 불려요. 땅에서 새어 나온 가스에 붙은 불이 수천 년째 꺼지지 않는 언덕이 있어요.",
    story: "아제르바이잔의 야나르다그 언덕에는 꺼지지 않는 불이 있어요. 땅속 천연가스가 새어 나오며 타는 건데, 비가 와도 눈이 와도 계속 타올라요. 옛날 사람들은 이 신비한 불을 신성하게 여겼고, 그래서 이 나라는 '불의 나라'라는 별명을 얻었어요.\n💬 이렇게 물어보세요: 비가 와도 꺼지지 않는 불, 비밀이 뭘까?"
  },
  "Afghanistan": {
    brief: "아프가니스탄은 높은 산맥 힌두쿠시의 나라예요. 수천 년 전부터 파란 보석 라피스라줄리를 캐온 곳이에요.",
    story: "아프가니스탄 산속에서는 수천 년 전부터 라피스라줄리라는 새파란 보석이 나와요. 이집트 파라오의 황금 가면에 박힌 파란 돌도, 유럽 명화의 깊은 파란 물감도 이 땅의 돌에서 왔어요. 그리고 이곳 아이들은 연날리기를 아주 사랑해요.\n💬 이렇게 물어보세요: 옛날 화가들은 파란 물감을 어떻게 만들었을까?"
  },
  "Yemen": {
    brief: "예멘의 소코트라섬에는 우산처럼 생긴 용혈수 나무가 자라요. 다른 행성에 온 것 같은 풍경의 섬이에요.",
    story: "예멘의 소코트라섬은 '인도양의 갈라파고스'라고 불려요. 우산을 펼친 듯한 용혈수 나무에서는 빨간 수액이 나오는데, 옛날 사람들은 용의 피라고 믿었대요. 이 섬 식물의 3분의 1은 세상 어디에도 없고 오직 여기에만 살아요.\n💬 이렇게 물어보세요: 섬의 나무들은 왜 우산 모양으로 자랐을까?"
  },
  "Oman": {
    brief: "오만은 유향이라는 귀한 향료의 나라예요. 바닷가 모래밭에는 바다거북이 알을 낳으러 찾아와요.",
    story: "오만의 나무에서 나오는 유향은 태우면 좋은 향이 나는 귀한 수액이에요. 옛날에는 금만큼 비싸서, 낙타 대상들이 사막을 건너 세계로 실어 날랐어요. 오만의 해변에는 해마다 수만 마리 바다거북이 찾아와 모래에 알을 낳고 떠나요.\n💬 이렇게 물어보세요: 아기 거북은 태어나자마자 바다를 어떻게 찾아갈까?"
  },
  "Jordan": {
    brief: "요르단에는 바위산을 통째로 깎아 만든 도시 페트라가 있어요. 몸이 둥둥 뜨는 사해도 있어요.",
    story: "요르단의 페트라는 2천 년 전 사람들이 장밋빛 바위산을 깎아서 만든 도시예요. 좁은 바위 틈을 한참 걸어 들어가면 갑자기 거대한 신전이 나타나는데, 그 순간은 누구나 숨을 멈춰요. 사해에서는 몸이 저절로 떠서 물에 누워 책을 읽을 수도 있어요.\n💬 이렇게 물어보세요: 건물을 짓는 것과 바위를 깎아내는 것, 뭐가 더 어려울까?"
  },
  "Uzbekistan": {
    brief: "우즈베키스탄에는 실크로드의 보석, 사마르칸트가 있어요. 푸른 타일로 덮인 돔이 하늘처럼 빛나요.",
    story: "옛날 비단길을 오가던 상인들이 사막을 건너 사마르칸트에 닿으면, 하늘색 돔이 빛나는 도시가 신기루처럼 나타났어요. 레기스탄 광장의 건물들은 수십만 장의 푸른 타일로 덮여 있어서, 해가 비치면 도시가 하늘을 입은 것 같아요.\n💬 이렇게 물어보세요: 사막을 건너온 상인이 푸른 도시를 처음 봤을 때 기분이 어땠을까?"
  },
  "Iraq": {
    brief: "이라크는 인류 최초의 문명이 태어난 메소포타미아 땅이에요. 글자와 바퀴가 처음 만들어진 곳이에요.",
    story: "이라크의 티그리스강과 유프라테스강 사이 땅에서 인류 최초의 문명이 시작됐어요. 5천 년 전 이곳 사람들은 진흙판에 쐐기 모양 글자를 새겼는데, 그게 인류가 처음 쓴 글자예요. 바퀴도, 60분이 1시간이 된 것도 이 땅의 발명이에요.\n💬 이렇게 물어보세요: 글자가 없던 시절, 사람들은 중요한 약속을 어떻게 기억했을까?"
  },
  "Iran": {
    brief: "이란은 옛 페르시아 제국의 나라예요. '세상의 절반'이라 불린 아름다운 도시 이스파한이 있어요.",
    story: "이란의 이스파한은 광장과 푸른 모스크가 어찌나 아름다웠는지 '이스파한은 세상의 절반'이라는 말이 생겼어요. 페르시아 사람들은 더운 사막에서 '바람탑'이라는 자연 에어컨을 발명했어요. 높은 탑이 바람을 잡아 집 안으로 시원하게 내려보내는 거죠.\n💬 이렇게 물어보세요: 전기 없이 집을 시원하게 하려면 어떤 방법이 있을까?"
  },
  "Israel": {
    brief: "이스라엘에는 지구에서 가장 낮은 땅, 사해가 있어요. 예루살렘은 세 종교가 모두 소중히 여기는 오래된 도시예요.",
    story: "이스라엘과 요르단 사이의 사해는 바다 표면보다 430미터나 낮은, 지구 육지에서 가장 낮은 곳이에요. 물이 너무 짜서 물고기가 못 살아 '죽은 바다'라는 이름이 붙었지만, 사람은 가만히 있어도 둥둥 떠요. 예루살렘의 오래된 골목은 수천 년의 이야기를 품고 있어요.\n💬 이렇게 물어보세요: 물고기가 못 사는 바다인데 왜 사람들은 사해를 좋아할까?"
  },
  "India": {
    brief: "인도는 세계에서 인구가 가장 많은 나라예요. 새하얀 타지마할이 있고, 숫자 0이 태어난 곳이에요.",
    story: "인도의 타지마할은 한 왕이 사랑하는 왕비를 그리워하며 22년에 걸쳐 지은 새하얀 대리석 건물이에요. 아침, 낮, 노을마다 색이 다르게 빛나요. 그리고 우리가 매일 쓰는 숫자 '0'을 처음 생각해낸 것도 인도 사람들이에요. 0이 없었다면 수학도 컴퓨터도 없었을 거예요.\n💬 이렇게 물어보세요: '아무것도 없음'을 숫자로 만든다는 건 왜 대단한 생각일까?"
  },
  "Indonesia": {
    brief: "인도네시아는 17,000개가 넘는 섬으로 이루어진 세계 최대의 섬나라예요. 거대한 코모도왕도마뱀이 살아요.",
    story: "인도네시아는 섬이 17,000개가 넘어서, 매일 섬 하나씩 가도 다 도는 데 46년이 걸려요. 코모도섬에는 길이 3미터의 코모도왕도마뱀이 사는데, 지구에 남은 가장 큰 도마뱀이에요. 꼭 공룡 시대에서 온 손님 같죠.\n💬 이렇게 물어보세요: 섬마다 동물이 조금씩 다른 이유가 뭘까?"
  },
  "Japan": {
    adult: {
      summary: "동아시아의 섬나라로 수도는 도쿄입니다. 전통과 첨단 기술이 공존하며, 세계적 산업국으로 성장했습니다.",
      geo: "네 개의 큰 섬과 수천 개의 섬으로 이루어져 있고, 화산과 지진이 잦은 환태평양 조산대에 위치합니다. 후지산이 상징입니다.",
      history: "고대 야마토 정권에서 무사(사무라이)가 다스린 막부 시대를 거쳐, 1868년 메이지 유신으로 근대화했습니다. 2차 대전 패전 후 경제대국으로 재건했습니다.",
      culture: "신토와 불교가 공존하며, 다도·정원·애니메이션·장인정신(모노즈쿠리)이 두드러집니다.",
      people: "애니메이션 감독 미야자키 하야오, 작가 무라카미 하루키, 노벨상 과학자들이 잘 알려져 있습니다."
    },
    brief: "일본은 후지산과 벚꽃의 나라예요. 시속 300킬로미터로 달리는 신칸센 기차가 있어요.",
    story: "일본의 신칸센은 시속 300킬로미터로 달리는데도 도착 시간이 초 단위로 정확해요. 평균 지연이 1분도 안 된대요. 봄이면 벚꽃이 남쪽에서 북쪽으로 파도처럼 피어 올라가서, 뉴스에서 '벚꽃 전선'을 일기예보처럼 알려줘요.\n💬 이렇게 물어보세요: 벚꽃은 왜 남쪽부터 피기 시작할까?"
  },
  "North Korea": {
    brief: "조선은 한반도의 북쪽 땅이에요. 백두산 꼭대기에는 하늘 호수라 불리는 천지가 있어요.",
    story: "한반도에서 가장 높은 백두산 꼭대기에는 천지라는 거대한 호수가 있어요. 화산이 폭발한 자리에 물이 고여 만들어진 하늘 호수예요. 우리와 같은 말을 쓰고 같은 역사를 나눈 땅이라, 지도에서 보면 더 많은 생각이 들어요.\n💬 이렇게 물어보세요: 산꼭대기에 어떻게 그렇게 큰 호수가 생겼을까?"
  },
  "Georgia": {
    brief: "조지아는 와인이 처음 만들어진 나라예요. 8천 년 전부터 큰 항아리를 땅에 묻어 포도를 익혀왔어요.",
    story: "조지아 사람들은 8천 년 전부터 와인을 만들어왔어요. 인류 역사상 가장 오래된 와인의 흔적이 이곳에서 발견됐죠. 지금도 '크베브리'라는 큰 진흙 항아리를 땅속에 묻어 포도를 익히는 옛 방식 그대로예요. 코카서스 산맥의 마을들은 돌탑 집으로 유명해요.\n💬 이렇게 물어보세요: 항아리를 왜 땅속에 묻었을까? 땅속은 뭐가 다를까?"
  },
  "China": {
    brief: "중국에는 수천 킬로미터 이어진 만리장성이 있어요. 판다의 고향이고, 종이와 나침반을 발명한 나라예요.",
    story: "만리장성은 산등성이를 따라 수천 킬로미터 이어진 거대한 성벽이에요. 2천 년 넘게 수많은 사람이 쌓고 또 쌓았죠. 중국은 종이, 나침반, 화약, 인쇄술을 발명해 세계 역사를 바꿨어요. 대나무 숲에는 하루 종일 대나무만 먹는 판다가 뒹굴뒹굴 살아요.\n💬 이렇게 물어보세요: 종이가 발명되기 전에 사람들은 어디에 글을 썼을까?"
  },
  "Kazakhstan": {
    brief: "카자흐스탄은 바다가 없는 나라 중 세계에서 가장 큰 나라예요. 사과의 고향이고, 우주선이 떠나는 우주기지가 있어요.",
    story: "우리가 먹는 사과의 조상은 카자흐스탄 산속 야생 사과예요. 옛 수도 알마티는 이름 자체가 '사과의 도시'라는 뜻이에요. 그리고 이 나라의 바이코누르 우주기지에서 인류 최초의 우주인 가가린이 우주로 떠났어요. 지금도 우주선이 이곳에서 발사돼요.\n💬 이렇게 물어보세요: 산속 작은 야생 사과가 어떻게 온 세계로 퍼졌을까?"
  },
  "Qatar": {
    brief: "카타르는 작지만 아주 부유한 사막 나라예요. 옛날에는 바다에서 진주를 캐며 살았어요.",
    story: "카타르 사람들은 옛날에 바닷속 깊이 잠수해 진주조개를 캐며 살았어요. 숨을 참고 바다 밑까지 내려가는 위험한 일이었죠. 지금은 땅속 가스 덕분에 부유한 나라가 되어, 사막 위에 미래 도시를 세우고 월드컵도 열었어요.\n💬 이렇게 물어보세요: 잠수부들은 기계 없이 어떻게 숨을 오래 참았을까?"
  },
  "Cambodia": {
    brief: "캄보디아에는 세계에서 가장 큰 사원 유적, 앙코르와트가 있어요. 물이 거꾸로 흐르는 신기한 호수도 있어요.",
    story: "캄보디아의 앙코르와트는 900년 전 지어진 세계 최대의 사원이에요. 한때 정글에 묻혀 잊혔다가 다시 발견됐죠. 나무뿌리가 건물을 끌어안은 모습이 신비로워요. 톤레사프 호수는 우기가 되면 강물이 거꾸로 흘러들어 호수가 다섯 배나 커져요.\n💬 이렇게 물어보세요: 강물이 거꾸로 흐른다니, 어떻게 그럴 수 있을까?"
  },
  "Kuwait": {
    brief: "쿠웨이트는 사막과 바다가 만나는 작은 나라예요. 땅속에 석유가 아주 많아요.",
    story: "쿠웨이트는 경기도만 한 작은 나라인데 땅속에 석유가 어마어마하게 묻혀 있어요. 옛날에는 배 만들기와 진주잡이로 살던 어촌이었는데, 석유가 발견되며 나라의 운명이 바뀌었죠. 바닷가에는 공처럼 둥근 급수탑 '쿠웨이트 타워'가 서 있어요.\n💬 이렇게 물어보세요: 땅속의 석유는 아주 먼 옛날 무엇이었을까?"
  },
  "Kyrgyzstan": {
    brief: "키르기스스탄은 국토 대부분이 높은 산인 나라예요. 한겨울에도 얼지 않는 큰 산속 호수, 이식쿨이 있어요.",
    story: "키르기스스탄의 이식쿨 호수는 해발 1,600미터 산속에 있는데, 한겨울에도 얼지 않아요. 그래서 이름도 '따뜻한 호수'라는 뜻이에요. 이곳 사람들은 독수리를 길들여 함께 사냥하는 오랜 전통이 있어요. 독수리와 사람이 한 팀이 되는 거죠.\n💬 이렇게 물어보세요: 그 추운 산속 호수가 왜 얼지 않을까?"
  },
  "Tajikistan": {
    brief: "타지키스탄은 국토의 90퍼센트가 산이에요. '세계의 지붕'이라 불리는 파미르 고원이 있어요.",
    story: "타지키스탄의 파미르 고원은 '세계의 지붕'이라고 불려요. 히말라야, 톈산 같은 거대한 산맥들이 모두 이곳에서 만나거든요. 이 높은 길을 따라 옛 비단길 상인들이 낙타를 끌고 넘어 다녔어요. 빙하가 녹은 물은 아시아의 큰 강이 되어 흘러요.\n💬 이렇게 물어보세요: 산꼭대기 빙하가 녹은 물 한 방울은 어디까지 여행할까?"
  },
  "Thailand": {
    brief: "태국은 코끼리를 사랑하는 미소의 나라예요. 새해에는 온 나라가 물놀이 축제를 벌여요.",
    story: "태국의 새해 축제 송끄란에는 온 나라 사람들이 거리로 나와 서로에게 물을 뿌려요. 물이 나쁜 기운을 씻어주고 복을 가져온다고 믿거든요. 나라 전체가 거대한 물놀이장이 되는 셈이죠. 코끼리는 태국의 상징이라 옛 국기에도 그려져 있었어요.\n💬 이렇게 물어보세요: 새해에 물을 뿌려주는 인사에는 어떤 마음이 담겨 있을까?"
  },
  "Turkey": {
    brief: "터키의 카파도키아에는 버섯 모양 바위 마을이 있어요. 이스탄불은 두 대륙에 걸쳐 있는 세계 유일의 도시예요.",
    story: "터키의 이스탄불은 도시 한가운데로 아시아와 유럽의 경계가 지나가요. 다리만 건너면 대륙이 바뀌는 세계 유일의 도시죠. 카파도키아에서는 새벽마다 열기구 수십 개가 버섯 바위 계곡 위로 떠올라요. 옛날 사람들은 그 바위 속을 파서 집과 교회, 심지어 지하 도시까지 만들었어요.\n💬 이렇게 물어보세요: 아침은 아시아에서, 저녁은 유럽에서 먹을 수 있는 도시라니, 어떤 기분일까?"
  },
  "Turkmenistan": {
    brief: "투르크메니스탄 사막에는 '지옥의 문'이라 불리는, 수십 년째 불타는 구덩이가 있어요. 아름다운 명마의 나라예요.",
    story: "투르크메니스탄의 카라쿰 사막에는 50년 넘게 불타고 있는 거대한 구덩이가 있어요. 땅속 가스가 새어 나와 붙은 불이 꺼지지 않아 '지옥의 문'이라 불리죠. 밤이 되면 사막 한가운데서 주황빛으로 이글거려요. 이 나라의 아할테케 말은 털이 금속처럼 반짝여서 '황금 말'이라 불려요.\n💬 이렇게 물어보세요: 50년 동안 타려면 땅속에 뭐가 얼마나 있는 걸까?"
  },
  "Pakistan": {
    brief: "파키스탄에는 세계에서 두 번째로 높은 산 K2가 있어요. 트럭을 그림으로 가득 꾸미는 트럭 아트의 나라예요.",
    story: "파키스탄의 K2는 에베레스트보다 낮지만 오르기는 더 어렵다고 알려진 산이에요. 그리고 이 나라의 트럭들은 달리는 미술관이에요. 운전사들이 트럭을 꽃, 새, 시 구절로 빈틈없이 꾸미거든요. 더 아름다운 트럭이 자랑이래요.\n💬 이렇게 물어보세요: 운전사들은 왜 트럭을 그렇게 정성껏 꾸밀까?"
  },
  "West Bank": {
    brief: "팔레스타인 땅에는 세계에서 가장 오래된 도시 중 하나인 예리코가 있어요. 수천 년 된 올리브나무가 자라요.",
    story: "팔레스타인의 예리코는 1만 년 전부터 사람이 살았다고 알려진, 세계에서 가장 오래된 도시 중 하나예요. 이 땅의 올리브나무들은 수백 년, 어떤 나무는 천 년 넘게 살며 해마다 열매를 내어줘요. 올리브 가지는 평화의 상징이기도 해요.\n💬 이렇게 물어보세요: 천 년을 산 나무는 그동안 어떤 일들을 지켜봤을까?"
  },
  "Philippines": {
    brief: "필리핀은 7,000개가 넘는 섬의 나라예요. 손바닥만 한 안경원숭이와 초콜릿색 언덕들이 있어요.",
    story: "필리핀 보홀섬에는 '초콜릿 힐스'라는 둥근 언덕이 1,200개 넘게 펼쳐져 있어요. 건기에 풀이 마르면 온 언덕이 초콜릿색이 되거든요. 그 숲에는 손바닥에 올라가는 작은 안경원숭이 타르시어가 사는데, 눈이 뇌만큼 커서 밤에도 잘 봐요.\n💬 이렇게 물어보세요: 둥근 언덕 1,200개가 어떻게 나란히 생겨났을까?"
  },
  "South Korea": {
    adult: {
      summary: "동아시아 한반도 남쪽의 공화국으로, 수도는 서울입니다. 20세기 중반의 전쟁과 가난을 딛고 한 세대 만에 산업화와 민주화를 함께 이룬 드문 나라로 꼽힙니다.",
      geo: "국토의 약 70%가 산지이며, 동쪽이 높고 서·남쪽이 낮아 큰 강들이 서해와 남해로 흐릅니다. 삼면이 바다로 둘러싸여 사계절이 뚜렷합니다.",
      history: "고조선에서 삼국시대, 통일신라와 고려, 조선으로 이어졌고, 일제강점기와 6·25 전쟁을 거쳐 1948년 대한민국 정부가 수립되었습니다. 이후 빠른 경제성장과 1987년 민주화를 이뤘습니다.",
      culture: "한글이라는 독창적 문자를 가졌고, 김치·발효음식의 식문화, 그리고 K-팝·영화·드라마로 대표되는 한류가 세계로 퍼졌습니다.",
      people: "한글을 창제한 세종대왕, 임진왜란의 이순신 장군, 영화 '기생충'의 봉준호 감독, 그룹 BTS 등이 세계적으로 알려져 있습니다."
    },
    brief: "한국은 우리가 사는 나라예요. 만든 사람과 만든 원리가 알려진 세계에서 드문 문자, 한글을 써요.",
    story: "우리가 쓰는 한글은 세계에서 아주 특별한 문자예요. 누가, 언제, 왜, 어떤 원리로 만들었는지가 기록으로 남아 있는 문자는 드물거든요. 세종대왕은 입과 혀의 모양을 본떠 글자를 만들었어요. 'ㄱ'은 혀뿌리가 목구멍을 막는 모양이래요.\n💬 이렇게 물어보세요: 'ㅁ'은 입 모양을 본떴대. 그럼 다른 글자들은 뭘 본떴을까?"
  },
  // ===== 유럽 (1/2) =====
  "Greece": {
    brief: "그리스는 올림픽이 처음 시작된 나라예요. 하얀 집과 파란 지붕의 섬마을, 그리고 수천 년 된 신전이 있어요.",
    story: "올림픽은 2,800년 전 그리스의 올림피아에서 시작됐어요. 4년마다 도시들이 전쟁도 멈추고 달리기와 씨름을 겨뤘대요. 아테네 언덕 위 파르테논 신전은 2,500년이 지난 지금도 서 있고, 산토리니섬의 하얀 집과 파란 지붕은 그리스 국기 색과 닮았어요.\n💬 이렇게 물어보세요: 경기를 위해 전쟁을 멈췄다니, 그게 왜 가능했을까?"
  },
  "Netherlands": {
    brief: "네덜란드는 땅의 4분의 1이 바다보다 낮은 나라예요. 풍차와 튤립, 그리고 사람 수보다 많은 자전거로 유명해요.",
    story: "네덜란드 사람들은 바다를 막고 물을 퍼내서 땅을 만들었어요. 그 물 퍼내는 일을 옛날엔 풍차가 했죠. 그래서 '세상은 신이 만들었지만 네덜란드는 네덜란드인이 만들었다'는 말이 있어요. 자전거가 사람 수보다 많아서, 왕도 자전거로 출근한 적이 있대요.\n💬 이렇게 물어보세요: 바다보다 낮은 땅에서는 비가 오면 물이 어디로 갈까?"
  },
  "Norway": {
    brief: "노르웨이는 빙하가 깎아 만든 좁고 깊은 바다 골짜기, 피오르의 나라예요. 여름엔 밤에도 해가 지지 않아요.",
    story: "노르웨이의 피오르는 빙하가 수만 년 동안 산을 깎아 만든 좁고 깊은 바닷길이에요. 양쪽 절벽이 1,000미터 넘게 솟아 있죠. 북쪽 마을에서는 여름엔 한밤중에도 해가 떠 있는 백야가, 겨울엔 하늘에 초록 커튼 같은 오로라가 펼쳐져요.\n💬 이렇게 물어보세요: 밤에도 해가 떠 있으면 잠은 언제 잘까?"
  },
  "Denmark": {
    brief: "덴마크는 레고 블록이 태어난 나라예요. 인어공주를 쓴 동화 작가 안데르센의 고향이기도 해요.",
    story: "레고는 덴마크의 작은 목수 아저씨가 만들기 시작했어요. 레고라는 이름은 덴마크 말로 '재미있게 놀아라'에서 왔대요. 인어공주, 미운 오리 새끼, 성냥팔이 소녀를 쓴 안데르센도 덴마크 사람이에요. 코펜하겐 바닷가에는 인어공주 동상이 바다를 바라보고 앉아 있어요.\n💬 이렇게 물어보세요: 똑같은 블록 몇 개로 다른 모양을 몇 가지나 만들 수 있을까?"
  },
  "Germany": {
    brief: "독일에는 디즈니 성의 모델이 된 노이슈반슈타인 성이 있어요. 빵 종류가 3천 가지가 넘는 빵의 나라예요.",
    story: "독일 알프스 기슭의 노이슈반슈타인 성은 너무 동화 같아서 디즈니 성의 모델이 되었어요. 꿈꾸기를 좋아한 왕이 지은 성이거든요. 독일은 빵의 나라이기도 해요. 등록된 빵 종류만 3천 가지가 넘어서, 매일 다른 빵을 먹어도 10년 가까이 걸려요.\n💬 이렇게 물어보세요: 한 나라에서 빵이 3천 가지나 되려면 어떤 일이 있었을까?"
  },
  "Latvia": {
    brief: "라트비아는 국토의 절반이 숲인 발트해의 나라예요. 수만 명이 함께 노래하는 큰 노래 축제가 열려요.",
    story: "라트비아에서는 몇 년에 한 번, 수만 명이 한 무대에 올라 함께 노래하는 축제가 열려요. 온 나라가 하나의 합창단이 되는 거죠. 노래로 마음을 모아 자유를 찾은 역사가 있어서, 이들에게 노래는 보물이에요. 수도 리가의 옛 건물들은 장식이 아름답기로 유명해요.\n💬 이렇게 물어보세요: 수만 명이 같은 노래를 부르면 어떤 힘이 생길까?"
  },
  "Russia": {
    brief: "러시아는 세계에서 가장 큰 나라예요. 한쪽 끝과 반대쪽 끝의 시간이 10시간이나 차이 나요.",
    story: "러시아는 너무 넓어서 나라 안에 시간대가 11개나 있어요. 동쪽 끝에서 새해 폭죽이 터질 때 서쪽 끝은 아직 한낮이죠. 시베리아 횡단열차는 9,288킬로미터를 일주일 동안 달리는 세계에서 가장 긴 기차 여행이에요. 바이칼 호수는 세계에서 가장 깊은 호수로, 지구 민물의 5분의 1이 담겨 있어요.\n💬 이렇게 물어보세요: 한 나라 안에서 새해가 11번 시작된다면 어떤 일이 벌어질까?"
  },
  "Romania": {
    brief: "루마니아에는 드라큘라 이야기로 유명한 브란 성이 있어요. 카르파티아 산맥에는 유럽에서 가장 많은 불곰이 살아요.",
    story: "루마니아의 브란 성은 뾰족한 탑과 안개 낀 산 때문에 드라큘라 소설의 배경으로 유명해졌어요. 물론 진짜 드라큘라는 없고, 성은 오히려 아늑하답니다. 카르파티아 산맥 숲에는 유럽 불곰의 절반 가까이가 살고 있어서, 유럽의 야생이 가장 잘 남은 곳으로 꼽혀요.\n💬 이렇게 물어보세요: 무서운 이야기의 배경이 된 성은 좋을까, 억울할까?"
  },
  "Luxembourg": {
    brief: "룩셈부르크는 작지만 매우 부유한 나라예요. 세계에서 처음으로 나라 전체의 버스와 기차를 공짜로 만들었어요.",
    story: "룩셈부르크는 서울 두 배 정도 크기의 작은 나라인데, 2020년 세계 최초로 전국의 버스, 기차, 트램을 모두 공짜로 만들었어요. 누구든 표 없이 타면 돼요. 수도는 깊은 골짜기 위에 세워져서 다리와 절벽이 어우러진 풍경이 멋져요.\n💬 이렇게 물어보세요: 버스가 공짜가 되면 사람들의 생활이 어떻게 달라질까?"
  },
  "Lithuania": {
    brief: "리투아니아에는 수십만 개의 십자가가 모인 언덕이 있어요. 노래와 손잡기로 자유를 찾은 역사가 있는 나라예요.",
    story: "1989년, 리투아니아와 이웃 두 나라 사람들 200만 명이 손에 손을 잡고 600킬로미터가 넘는 인간 사슬을 만들었어요. 자유를 바라는 마음을 온 세계에 보여준 거예요. 이를 '발트의 길'이라고 불러요. 무기가 아니라 손잡기로 역사를 바꾼 이야기예요.\n💬 이렇게 물어보세요: 손을 잡는 것만으로 어떻게 세상을 바꿀 수 있었을까?"
  },
  "Montenegro": {
    brief: "몬테네그로는 '검은 산'이라는 뜻의 이름을 가진 나라예요. 유럽에서 가장 아름다운 만으로 꼽히는 코토르 만이 있어요.",
    story: "몬테네그로의 코토르 만은 산이 바다를 깊숙이 끌어안은 모양이라, 배를 타고 들어가면 산속 호수에 들어온 것 같아요. 만 안쪽 옛 도시 코토르는 성벽이 산비탈을 따라 지그재그로 올라가요. 나라 이름은 어두운 숲으로 덮인 산에서 왔어요.\n💬 이렇게 물어보세요: 바다가 산속 깊이 들어와 있으면 파도는 어떨까?"
  },
  "Moldova": {
    brief: "몰도바는 포도와 와인의 나라예요. 땅속에 길이 200킬로미터가 넘는 세계 최대의 와인 저장 터널이 있어요.",
    story: "몰도바의 밀레스티 미치라는 곳에는 땅속 터널이 200킬로미터 넘게 뚫려 있어요. 서울에서 대전보다 먼 거리의 지하 길에 와인 수백만 병이 잠들어 있죠. 너무 길어서 사람들이 차를 타고 지하 길을 다녀요. 기네스북에 오른 세계 최대 와인 저장고예요.\n💬 이렇게 물어보세요: 와인을 왜 땅속에 보관할까? 땅속은 뭐가 좋을까?"
  },
  "Belgium": {
    brief: "벨기에는 초콜릿과 와플의 나라예요. 스머프와 틴틴 같은 만화 주인공들이 태어난 곳이기도 해요.",
    story: "벨기에 사람들은 초콜릿에 진심이에요. 작은 나라에 초콜릿 가게가 2천 개가 넘고, 공항에서 세계에서 초콜릿이 가장 많이 팔린대요. 파란 요정 스머프도, 모험가 틴틴도 벨기에 만화가가 그렸어요. 수도 브뤼셀의 건물 벽에는 만화 벽화가 가득해요.\n💬 이렇게 물어보세요: 감자튀김도 벨기에가 원조라는데, 왜 '프렌치'프라이라고 불릴까?"
  },
  "Belarus": {
    brief: "벨라루스에는 유럽에 마지막으로 남은 아주 오래된 원시 숲이 있어요. 그 숲에는 유럽들소가 살아요.",
    story: "벨라루스의 벨로베슈 숲은 수천 년 동안 거의 사람 손이 닿지 않은, 유럽 최후의 원시림이에요. 이 숲에는 유럽에서 가장 큰 육지 동물인 유럽들소가 살아요. 한때 거의 사라질 뻔했는데, 사람들이 정성껏 보호해서 다시 숲을 누비게 됐어요.\n💬 이렇게 물어보세요: 숲을 수천 년 동안 그대로 두면 어떤 모습이 될까?"
  },
  "Bosnia and Herzegovina": {
    brief: "보스니아 헤르체고비나에는 모스타르라는 도시의 아름다운 옛 다리가 있어요. 다리에서 강으로 뛰어내리는 다이빙 전통이 있어요.",
    story: "모스타르의 '스타리 모스트'는 400년 넘은 하얀 돌다리예요. 이 도시 젊은이들에게는 다리 위 24미터 높이에서 강으로 뛰어내리는 용기의 전통이 있어요. 다리가 전쟁으로 무너졌을 때 온 세계가 함께 슬퍼했고, 똑같이 다시 지어 올렸어요.\n💬 이렇게 물어보세요: 다리 하나가 무너졌을 때 사람들은 왜 그렇게 슬퍼했을까?"
  },
  "Macedonia": {
    brief: "북마케도니아에는 유럽에서 가장 오래된 호수 중 하나인 오흐리드 호수가 있어요. 물이 아주 맑고 깊어요.",
    story: "오흐리드 호수는 100만 년이 넘은, 유럽에서 가장 오래된 호수 중 하나예요. 물이 워낙 맑아 깊은 곳까지 들여다보여요. 이 호수에만 사는 물고기도 있어요. 호숫가 언덕의 오래된 교회와 마을은 호수와 함께 통째로 세계유산이 되었어요.\n💬 이렇게 물어보세요: 호수도 나이를 먹는다면, 오래된 호수는 뭐가 다를까?"
  },
  "Bulgaria": {
    brief: "불가리아에는 장미의 계곡이 있어요. 세계의 향수에 들어가는 장미 오일을 가장 많이 만드는 나라예요.",
    story: "불가리아의 장미 계곡에서는 5월이면 온 계곡이 장미 향으로 가득 차요. 사람들은 해 뜨기 전 새벽에 장미꽃을 따요. 향이 가장 진할 때거든요. 장미 오일 한 방울을 만들려면 꽃잎이 수천 장 필요해서, 장미 오일은 금보다 귀하게 여겨지기도 해요.\n💬 이렇게 물어보세요: 장미꽃은 왜 새벽에 향기가 제일 진할까?"
  },
  "Republic of Serbia": {
    brief: "세르비아의 수도 베오그라드는 '하얀 도시'라는 뜻이에요. 두 개의 큰 강이 도시에서 만나요.",
    story: "베오그라드에서는 사바강과 다뉴브강, 두 큰 강이 만나요. 강이 만나는 자리 언덕 위에는 오래된 요새가 서서 두 강을 내려다보고 있어요. 세르비아는 라즈베리를 세계에서 손꼽히게 많이 길러서, 우리가 먹는 라즈베리잼이 이 나라에서 왔을 수도 있어요.\n💬 이렇게 물어보세요: 두 강이 만나는 곳에 옛날 사람들은 왜 도시를 세웠을까?"
  },
  "Sweden": {
    brief: "스웨덴은 노벨상을 주는 나라예요. 호수가 10만 개나 있고, 겨울엔 얼음으로 지은 호텔이 문을 열어요.",
    story: "해마다 12월, 스웨덴 스톡홀름에서는 세계에서 가장 유명한 상인 노벨상 시상식이 열려요. 다이너마이트를 발명한 노벨이 남긴 유산으로 시작됐죠. 북쪽 마을에서는 겨울마다 얼음과 눈으로 호텔을 통째로 지어요. 침대도 의자도 얼음인데, 봄이 오면 녹아서 강으로 돌아가요.\n💬 이렇게 물어보세요: 얼음 침대에서 자려면 뭐가 필요할까?"
  },
  "Switzerland": {
    brief: "스위스는 알프스의 나라예요. 정확한 시계로 유명하고, 산 밑으로 세계에서 가장 긴 기차 터널이 뚫려 있어요.",
    story: "스위스 사람들은 알프스산이 가로막자 산 밑으로 길을 뚫었어요. 고타르 기차 터널은 길이 57킬로미터, 세계에서 가장 긴 기차 터널이에요. 뚫는 데만 17년이 걸렸죠. 스위스 기차는 시계처럼 정확하기로 유명한데, 시계의 나라다운 일이에요.\n💬 이렇게 물어보세요: 산을 넘어가는 것과 뚫고 가는 것, 뭐가 더 어려울까?"
  },
  "Spain": {
    brief: "스페인에는 140년 넘게 짓고 있는 성당, 사그라다 파밀리아가 있어요. 낮잠 시간 시에스타와 플라멩코 춤의 나라예요.",
    story: "스페인 바르셀로나의 사그라다 파밀리아 성당은 1882년부터 짓기 시작해 지금도 짓고 있어요. 천재 건축가 가우디는 숲과 나무에서 영감을 받아 성당 기둥을 나무처럼 설계했죠. 안에 들어가면 돌로 만든 숲속에 서 있는 기분이 들어요.\n💬 이렇게 물어보세요: 140년 동안 한 건물을 짓는다면, 처음 지은 사람과 지금 짓는 사람은 어떤 사이일까?"
  },
  "Slovakia": {
    brief: "슬로바키아는 성이 많은 나라예요. 산꼭대기 폐허가 된 성들이 동화처럼 서 있어요.",
    story: "슬로바키아에는 성과 성터가 수백 개나 있어요. 그중 스피시 성은 유럽에서 가장 큰 성터 중 하나로, 언덕 위에 하얗게 펼쳐진 모습이 장관이에요. 타트라 산맥에는 알프스 못지않은 뾰족한 봉우리와 맑은 산정 호수들이 숨어 있어요.\n💬 이렇게 물어보세요: 옛날 사람들은 왜 성을 꼭 높은 곳에 지었을까?"
  },
  "Slovenia": {
    brief: "슬로베니아에는 호수 한가운데 작은 섬이 떠 있는 블레드 호수가 있어요. 나라의 절반이 숲이에요.",
    story: "슬로베니아의 블레드 호수에는 동화 그림 같은 작은 섬이 떠 있고, 섬에는 교회가 한 채 서 있어요. 사람들은 전통 나룻배를 타고 섬으로 건너가죠. 땅속에는 포스토이나 동굴이라는 거대한 지하 세계가 있는데, 동굴 속을 기차 타고 들어가요.\n💬 이렇게 물어보세요: 호수 가운데 섬은 어떻게 생겨났을까?"
  },
  "Iceland": {
    brief: "아이슬란드는 얼음과 불이 함께 있는 섬나라예요. 화산과 빙하, 온천과 오로라를 한꺼번에 볼 수 있어요.",
    story: "아이슬란드는 '얼음의 땅'이라는 이름인데, 사실 활화산이 30개가 넘는 불의 나라이기도 해요. 빙하 옆에서 땅이 끓고, 뜨거운 물이 솟구치는 간헐천이 하늘로 치솟죠. 사람들은 화산이 데운 물로 집을 따뜻하게 하고 한겨울에도 노천 온천을 즐겨요.\n💬 이렇게 물어보세요: 얼음과 불이 한 섬에 같이 있는 비밀이 뭘까?"
  },
  "Ireland": {
    brief: "아일랜드는 온 나라가 초록빛이라 '에메랄드 섬'이라고 불려요. 거인이 만들었다는 전설의 바위 길이 있어요.",
    story: "아일랜드는 비가 자주 와서 일 년 내내 들판이 초록이에요. 그래서 별명이 '에메랄드 섬'이죠. 무지개 끝에 황금 단지를 숨겨둔 요정 레프러콘 이야기처럼, 이야기와 음악을 사랑하는 나라예요. 펍에서는 밤마다 바이올린과 플루트 연주가 울려요.\n💬 이렇게 물어보세요: 비가 자주 오는 나라에 사는 건 어떤 기분일까?"
  },
  "Albania": {
    brief: "알바니아는 '독수리의 나라'라고 불려요. 국기에도 머리 둘 달린 검은 독수리가 그려져 있어요.",
    story: "알바니아 사람들은 자기 나라를 '슈치퍼리아', 독수리의 땅이라고 불러요. 국기에는 머리가 둘 달린 검은 독수리가 날개를 펴고 있죠. 산이 많은 이 나라에는 둥근 돔 지붕의 오래된 돌집 마을들이 있고, 남쪽 해안은 물빛이 맑아 '알바니아의 리비에라'라고 불려요.\n💬 이렇게 물어보세요: 나라를 동물에 비유한다면 우리는 어떤 동물일까?"
  },
  "Estonia": {
    brief: "에스토니아는 세계에서 손꼽히는 디지털 나라예요. 투표도 세금도 인터넷으로 할 수 있어요.",
    story: "에스토니아 사람들은 거의 모든 나랏일을 인터넷으로 해요. 세계 최초로 인터넷 투표를 도입했고, 회사도 컴퓨터 앞에서 몇 분 만에 만들 수 있죠. 그러면서도 국토의 절반이 숲이라, 사람들은 숲에서 버섯과 베리를 따는 걸 사랑해요. 첨단과 자연이 함께 있는 나라예요.\n💬 이렇게 물어보세요: 투표를 인터넷으로 하면 좋은 점과 걱정되는 점이 뭘까?"
  },
  "United Kingdom": {
    brief: "영국에는 5천 년 전 세워진 거대한 돌 유적, 스톤헨지가 있어요. 빨간 이층버스와 큰 시계탑 빅벤의 나라예요.",
    story: "영국의 스톤헨지는 5천 년 전 사람들이 거대한 돌을 세워 만든 수수께끼의 유적이에요. 돌 하나가 코끼리 몇 마리 무게인데, 수백 킬로미터 밖에서 옮겨온 것도 있대요. 왜, 어떻게 만들었는지 아직도 다 풀리지 않았어요. 런던에서는 빨간 이층버스가 도시의 상징이에요.\n💬 이렇게 물어보세요: 5천 년 전 사람들은 그 무거운 돌을 어떻게 옮겼을까?"
  },
  "Austria": {
    brief: "오스트리아는 음악의 나라예요. 모차르트가 태어났고, 해마다 새해 첫날 세계로 울려 퍼지는 음악회가 열려요.",
    story: "오스트리아 잘츠부르크에서 태어난 모차르트는 다섯 살에 작곡을 시작한 음악 신동이었어요. 수도 빈은 모차르트, 베토벤, 슈베르트가 살았던 음악의 수도예요. 해마다 1월 1일이면 빈에서 신년 음악회가 열려 전 세계 90여 개 나라로 생중계돼요.\n💬 이렇게 물어보세요: 다섯 살 모차르트는 머릿속에 어떻게 음악이 떠올랐을까?"
  },
  "Ukraine": {
    brief: "우크라이나는 끝없는 밀밭의 나라예요. 국기의 파란색은 하늘, 노란색은 밀밭을 뜻해요.",
    story: "우크라이나의 국기를 보면 위는 파랗고 아래는 노래요. 끝없이 펼쳐진 노란 밀밭 위에 파란 하늘이 닿은 풍경 그대로죠. 땅이 기름져서 '유럽의 빵 바구니'라고 불려요. 해바라기도 세계에서 가장 많이 길러서, 여름엔 해바라기 들판이 지평선까지 이어져요.\n💬 이렇게 물어보세요: 나라의 풍경을 국기에 담는다면 우리는 무슨 색을 고를까?"
  },
  "Italy": {
    brief: "이탈리아는 피자와 파스타의 고향이에요. 물 위에 세운 도시 베네치아와 기울어진 피사의 탑이 있어요.",
    story: "이탈리아의 베네치아는 바다 위 작은 섬들에 세운 도시예요. 길 대신 물길이 있어서 버스도 택시도 다 배예요. 피사의 탑은 짓는 도중에 땅이 가라앉아 기울었는데, 800년 넘게 넘어지지 않고 비스듬히 서 있어요. 피자는 나폴리에서 태어나 온 세계인의 음식이 됐죠.\n💬 이렇게 물어보세요: 기울어진 탑이 800년 동안 왜 안 넘어졌을까?"
  },
  "Czech Republic": {
    brief: "체코의 프라하는 '백 개의 탑이 있는 도시'라고 불려요. 600년 넘게 움직이는 신기한 천문시계가 있어요.",
    story: "프라하 광장의 천문시계는 600년 동안 시간을 알려온 세계에서 가장 오래된 작동 천문시계예요. 정시가 되면 창문이 열리고 인형들이 행진하죠. 시계는 시간뿐 아니라 해와 달의 위치까지 보여줘요. 옛날 사람들이 만든 우주 시계인 셈이에요.\n💬 이렇게 물어보세요: 600년 전 사람들은 해와 달의 움직임을 어떻게 알았을까?"
  },
  "Croatia": {
    brief: "크로아티아에는 16개의 호수가 폭포로 이어지는 플리트비체 국립공원이 있어요. 성벽으로 둘러싸인 바닷가 도시 두브로브니크도 유명해요.",
    story: "크로아티아의 플리트비체에는 에메랄드빛 호수 16개가 계단처럼 이어져 있고, 호수와 호수 사이를 크고 작은 폭포가 연결해요. 물빛이 비현실적으로 푸른 건 물속 미네랄 때문이에요. 두브로브니크는 도시 전체가 중세 성벽으로 둘러싸여 '아드리아해의 진주'라 불려요.\n💬 이렇게 물어보세요: 호수가 계단처럼 층층이 생기려면 무슨 일이 있어야 할까?"
  },
  "Cyprus": {
    brief: "키프로스는 지중해의 햇살 가득한 섬나라예요. 일 년에 맑은 날이 300일이 넘어요.",
    story: "키프로스는 일 년 중 300일 넘게 해가 쨍쨍한 태양의 섬이에요. 전설에는 아름다움의 여신이 이 섬 바다 거품에서 태어났다고 해요. 바닷가에는 그 전설이 깃든 바위가 있죠. 여름엔 바다에서 수영하고, 겨울엔 산에서 눈썰매를 탈 수 있는 섬이에요.\n💬 이렇게 물어보세요: 한 섬에서 같은 날 수영과 눈놀이가 가능하려면 뭐가 필요할까?"
  },
  "Portugal": {
    brief: "포르투갈은 대항해 시대를 연 뱃사람들의 나라예요. 건물 벽을 파란 타일 그림으로 꾸미는 전통이 있어요.",
    story: "500년 전 포르투갈 뱃사람들은 지도에 없는 바다로 처음 나아간 사람들이에요. 세계 곳곳에 뱃길을 열었죠. 포르투갈 거리를 걸으면 '아줄레주'라는 파란 타일 그림이 건물 벽마다 가득해요. 역사와 이야기를 타일에 그려 벽에 남긴 거예요.\n💬 이렇게 물어보세요: 지도에 없는 바다로 처음 떠난 사람들은 무슨 마음이었을까?"
  },
  "Poland": {
    brief: "폴란드에는 700년 동안 소금을 캐낸 거대한 지하 소금 광산이 있어요. 천문학자 코페르니쿠스의 고향이에요.",
    story: "폴란드의 비엘리치카 소금 광산은 지하 327미터까지 내려가는 거대한 지하 세계예요. 광부들이 700년 동안 소금을 캐며 지하에 소금으로 예배당과 조각상, 샹들리에까지 만들었어요. 모두 소금 덩어리를 깎아 만든 거예요. 지구가 돈다고 처음 주장한 코페르니쿠스도 폴란드 사람이에요.\n💬 이렇게 물어보세요: 땅속 깊은 곳에 어떻게 소금이 산처럼 쌓여 있을까?"
  },
  "France": {
    adult: {
      summary: "서유럽의 공화국으로 수도는 파리입니다. 계몽주의와 프랑스 혁명의 무대였으며, '자유·평등·박애'를 국가 이념으로 삼습니다.",
      geo: "서유럽에서 가장 넓은 나라로, 북쪽 평야부터 남쪽 지중해, 동쪽 알프스까지 다양한 지형을 가집니다. 센강이 파리를 가로지릅니다.",
      history: "중세 왕국에서 1789년 혁명으로 공화정의 길을 열었고, 나폴레옹 시대를 거쳐 두 차례 세계대전의 중심에 섰습니다. 현재 제5공화국입니다.",
      culture: "미식·와인·패션·예술의 나라로, 루브르 박물관과 인상주의 미술, 그리고 똘레랑스(관용)의 사회 전통으로 유명합니다.",
      people: "계몽사상가 볼테르와 루소, 화가 모네, 과학자 마리 퀴리(프랑스에서 활동), 작가 빅토르 위고 등이 있습니다."
    },
    brief: "프랑스에는 에펠탑과 세계에서 가장 큰 미술관 루브르가 있어요. 마을마다 다른 치즈가 있는 미식의 나라예요.",
    story: "파리의 에펠탑은 처음 세워졌을 때 '흉물'이라고 미움받았어요. 20년만 세웠다 철거할 계획이었는데, 지금은 프랑스의 상징이 되었죠. 여름엔 더위에 철이 늘어나 탑이 15센티미터쯤 더 커져요. 프랑스에는 치즈 종류가 1,000가지가 넘어서 매일 다른 치즈를 먹어도 3년 가까이 걸려요.\n💬 이렇게 물어보세요: 철탑이 여름에 키가 커진다니, 왜 그럴까?"
  },
  "Finland": {
    brief: "핀란드는 호수가 18만 개가 넘는 숲과 호수의 나라예요. 사우나가 태어난 곳이고, 산타 마을이 있어요.",
    story: "핀란드 사람들에게 사우나는 생활의 일부예요. 인구보다 사우나가 많다는 말이 있을 정도죠. 뜨거운 사우나에서 몸을 데우고 차가운 호수에 풍덩 뛰어들어요. 북쪽 로바니에미에는 산타클로스 마을이 있어서, 전 세계 아이들의 편지가 해마다 50만 통 넘게 도착해요.\n💬 이렇게 물어보세요: 전 세계에서 온 편지 50만 통에는 어떤 이야기들이 담겨 있을까?"
  },
  "Hungary": {
    brief: "헝가리의 수도 부다페스트는 온천 위에 세워진 도시예요. 큐브 퍼즐을 발명한 루비크의 나라이기도 해요.",
    story: "부다페스트 땅 밑에는 뜨거운 온천물이 흐르고 있어서, 도시 곳곳에 100년 넘은 온천 목욕탕이 있어요. 궁전처럼 아름다운 온천에서 사람들이 물에 몸을 담그고 체스를 둬요. 전 세계 아이들이 돌리는 루빅스 큐브도 헝가리의 루비크 아저씨가 발명했어요.\n💬 이렇게 물어보세요: 도시 땅 밑에 뜨거운 물이 흐른다는 걸 사람들은 어떻게 알았을까?"
  },
  // ===== 북아메리카 =====
  "Guatemala": {
    brief: "과테말라는 옛 마야 문명의 땅이에요. 정글 속에 거대한 피라미드 도시 티칼이 숨어 있어요.",
    story: "과테말라의 정글 깊은 곳에는 마야 사람들이 세운 도시 티칼이 있어요. 나무 위로 솟은 거대한 피라미드 꼭대기에 오르면 끝없는 초록 정글이 펼쳐지죠. 이 나라의 돈 이름은 '케찰'인데, 초록 꼬리가 긴 아름다운 새의 이름이에요. 마야 사람들이 신성하게 여긴 새죠.\n💬 이렇게 물어보세요: 정글 속 거대한 도시가 어떻게 잊혀졌다가 다시 발견됐을까?"
  },
  "Greenland": {
    brief: "그린란드는 세계에서 가장 큰 섬이에요. 이름은 '초록 땅'인데 사실 대부분이 두꺼운 얼음으로 덮여 있어요.",
    story: "그린란드는 80퍼센트가 얼음인데 이름은 '초록 땅'이에요. 천 년 전 바이킹이 사람들을 데려오려고 일부러 멋진 이름을 붙였다는 이야기가 전해져요. 섬을 덮은 얼음은 두께가 3킬로미터나 되는 곳도 있어요. 한라산보다 더 두꺼운 얼음이죠.\n💬 이렇게 물어보세요: 얼음 땅에 '초록 땅'이라는 이름을 붙인 사람의 속마음은 뭐였을까?"
  },
  "Nicaragua": {
    brief: "니카라과는 호수와 화산의 나라예요. 큰 호수 한가운데 화산 두 개로 이루어진 섬이 떠 있어요.",
    story: "니카라과 호수에는 오메테페라는 신기한 섬이 있어요. 화산 두 개가 나란히 솟아 만들어진 섬이라 하늘에서 보면 숫자 8 모양이에요. 더 신기한 건 이 민물 호수에 상어가 산다는 거예요. 강을 거슬러 바다에서 올라온 상어들이래요.\n💬 이렇게 물어보세요: 바다 상어가 어떻게 민물 호수까지 올라왔을까?"
  },
  "Dominican Republic": {
    brief: "도미니카 공화국은 카리브해의 섬나라예요. 신나는 메렝게 춤의 고향이고, 호박 보석 속에 옛 곤충이 잠들어 있어요.",
    story: "도미니카 공화국에서는 '앰버'라고 부르는 호박 보석이 나와요. 수천만 년 전 나무 수액이 굳은 건데, 그 안에 옛날 곤충이 그대로 갇혀 있기도 해요. 영화 쥬라기 공원의 모기 이야기가 여기서 영감을 받았죠. 거리에서는 메렝게 음악이 흥겹게 울려요.\n💬 이렇게 물어보세요: 수천만 년 전 모기가 어떻게 지금까지 그대로 남아 있을까?"
  },
  "Mexico": {
    brief: "멕시코는 옛 마야와 아스테카 문명의 나라예요. 일 년에 두 번, 피라미드에 뱀 그림자가 나타나는 신기한 날이 있어요.",
    story: "멕시코의 치첸이트사 피라미드에는 놀라운 비밀이 있어요. 봄과 가을, 낮과 밤의 길이가 같아지는 날이면 계단에 거대한 뱀 모양 그림자가 스르르 나타나 내려와요. 천 년 전 마야 사람들이 해의 움직임을 계산해 일부러 그렇게 지은 거예요.\n💬 이렇게 물어보세요: 옛날 사람들은 컴퓨터도 없이 해의 움직임을 어떻게 그렇게 정확히 알았을까?"
  },
  "United States of America": {
    brief: "미국에는 그랜드캐니언이라는 거대한 협곡이 있어요. 세계 최초의 국립공원 옐로스톤도 이 나라에 있어요.",
    story: "미국의 그랜드캐니언은 콜로라도강이 수백만 년 동안 땅을 깎아 만든 거대한 협곡이에요. 깊이가 1.6킬로미터나 돼서, 절벽의 줄무늬 한 층 한 층이 지구의 역사책이에요. 옐로스톤은 세계에서 처음으로 '자연을 그대로 지키자'며 만든 국립공원이에요. 땅속 열기로 뜨거운 물이 하늘로 치솟아요.\n💬 이렇게 물어보세요: 강물이 어떻게 그 단단한 바위를 그렇게 깊게 깎았을까?"
  },
  "The Bahamas": {
    brief: "바하마는 700개의 섬으로 이루어진 카리브해의 나라예요. 돼지들이 바다에서 헤엄치는 신기한 섬이 있어요.",
    story: "바하마의 어느 무인도에는 돼지들이 살아요. 그런데 이 돼지들은 에메랄드빛 바다에서 헤엄을 쳐요! 배가 다가오면 먹이를 얻으러 바다로 첨벙 뛰어들어 헤엄쳐 오죠. 그리고 바하마에는 모래가 분홍색인 해변도 있어요. 분홍 산호 조각이 모래에 섞여 있거든요.\n💬 이렇게 물어보세요: 돼지들은 어쩌다 무인도에서 헤엄치며 살게 됐을까?"
  },
  "Belize": {
    brief: "벨리즈 바다에는 '그레이트 블루홀'이라는 거대하고 둥근 파란 구멍이 있어요. 산호초가 아름다운 나라예요.",
    story: "벨리즈 앞바다에는 지름 300미터의 완벽하게 둥근, 짙푸른 구멍이 있어요. 그레이트 블루홀이라고 불리는데, 아주 옛날 육지의 동굴이었다가 바다에 잠긴 거예요. 하늘에서 보면 바다에 뚫린 거대한 눈동자 같아요. 다이버들의 꿈의 장소죠.\n💬 이렇게 물어보세요: 바다 한가운데 둥근 구멍은 옛날에 뭐였을까?"
  },
  "Haiti": {
    brief: "아이티는 세계 최초로 노예였던 사람들이 스스로 독립을 이뤄낸 나라예요. 카리브해의 산 많은 섬나라예요.",
    story: "1804년, 아이티에서 세계 역사에 남을 일이 일어났어요. 노예로 살던 사람들이 스스로 일어나 싸워 독립을 이루고 나라를 세운 거예요. 세계 최초의 일이었죠. 아이티라는 이름은 원주민 말로 '산이 많은 땅'이라는 뜻이에요.\n💬 이렇게 물어보세요: 자유를 한 번도 가져본 적 없는 사람들이 어떻게 자유를 꿈꿨을까?"
  },
  "El Salvador": {
    brief: "엘살바도르는 중앙아메리카에서 가장 작은 나라지만 화산이 20개가 넘어요. '화산의 땅'이라고 불려요.",
    story: "엘살바도르는 작은 나라에 화산이 줄지어 있어 '화산의 땅'이라 불려요. 화산재가 쌓인 땅은 기름져서 맛있는 커피가 자라요. 이 나라의 대표 음식 푸푸사는 옥수수 반죽에 치즈와 콩을 넣어 구운 두툼한 전 같은 음식인데, 온 국민의 소울푸드예요.\n💬 이렇게 물어보세요: 무서운 화산이 왜 농사에는 도움이 될까?"
  },
  "Honduras": {
    brief: "온두라스에는 마야 문명의 아름다운 조각이 남은 코판 유적이 있어요. 알록달록한 마코앵무새의 나라예요.",
    story: "온두라스의 코판은 마야 문명의 '예술 수도'라고 불려요. 돌에 새긴 조각이 어찌나 정교한지, 마야의 왕들과 글자가 돌계단 가득 새겨져 있어요. 계단 하나가 통째로 책인 셈이죠. 숲에는 빨강·파랑·노랑 깃털의 스칼렛 마코앵무새가 날아다녀요.\n💬 이렇게 물어보세요: 종이가 귀하던 시절, 돌에 글을 새긴 이유는 뭘까?"
  },
  "Jamaica": {
    brief: "자메이카는 레게 음악의 고향이에요. 세계에서 가장 빠른 달리기 선수 우사인 볼트의 나라이기도 해요.",
    story: "자메이카는 작은 섬나라인데 세계에서 가장 빠른 사람들을 길러내요. 우사인 볼트는 100미터를 9.58초에 달려 아직 깨지지 않는 세계기록을 세웠죠. 그리고 밥 말리가 만든 레게 음악은 이 섬에서 출발해 온 세계의 마음을 움직였어요.\n💬 이렇게 물어보세요: 작은 섬나라에서 어떻게 세계에서 가장 빠른 선수들이 계속 나올까?"
  },
  "Canada": {
    brief: "캐나다는 세계에서 호수가 가장 많은 나라예요. 팬케이크에 뿌리는 메이플 시럽 대부분이 이 나라에서 와요.",
    story: "캐나다에는 호수가 200만 개나 있어요. 세계 호수의 절반이 캐나다에 있는 셈이죠. 그리고 세계 메이플 시럽의 70퍼센트가 캐나다산이에요. 이른 봄 단풍나무에 꼭지를 꽂아 수액을 받는데, 시럽 1리터를 만들려면 수액 40리터가 필요해요. 국기에도 단풍잎이 그려져 있죠.\n💬 이렇게 물어보세요: 나무에서 어떻게 달콤한 물이 나올까?"
  },
  "Costa Rica": {
    brief: "코스타리카는 군대가 없는 나라예요. 그 돈으로 학교와 자연을 지켜서, 나무늘보와 형형색색 개구리들이 살아요.",
    story: "코스타리카는 1948년에 군대를 없앴어요. 군대에 쓸 돈을 학교와 병원, 자연 지키기에 쓰기로 한 거죠. 그 덕분에 국토의 4분의 1이 보호구역이고, 숲에는 나무늘보가 일주일에 한 번만 나무에서 내려오며 느긋하게 살아요. 이 나라 인사말 '푸라 비다'는 '순수한 삶'이라는 뜻이에요.\n💬 이렇게 물어보세요: 군대를 없앤 돈으로 학교를 지으면 나라는 어떻게 달라질까?"
  },
  "Cuba": {
    brief: "쿠바의 거리에는 60년이 넘은 클래식 자동차들이 아직도 쌩쌩 달려요. 음악과 춤이 흐르는 카리브해의 섬나라예요.",
    story: "쿠바의 수도 아바나 거리는 움직이는 자동차 박물관이에요. 1950년대의 알록달록한 클래식 카들이 지금도 택시로 달리거든요. 새 차를 구하기 어려웠던 시절, 사람들이 고치고 또 고치며 60년 넘게 차를 살려온 거예요. 골목마다 살사 음악이 흘러나와요.\n💬 이렇게 물어보세요: 한 자동차를 60년 동안 고쳐 타려면 어떤 마음이 필요할까?"
  },
  "Trinidad and Tobago": {
    brief: "트리니다드 토바고는 드럼통으로 만든 악기, 스틸팬이 태어난 나라예요. 카리브해 최대의 카니발이 열려요.",
    story: "트리니다드 사람들은 버려진 기름 드럼통을 두드려 악기를 만들었어요. 드럼통 바닥을 망치로 두드려 음을 만든 '스틸팬'이라는 악기인데, 맑고 영롱한 소리가 나요. 쓰레기가 될 뻔한 것이 한 나라의 보물 악기가 된 거죠. 카니발 때면 온 나라가 스틸팬 소리로 가득해요.\n💬 이렇게 물어보세요: 버려진 드럼통에서 악기를 떠올린 사람은 어떤 사람이었을까?"
  },
  "Panama": {
    brief: "파나마에는 태평양과 대서양, 두 큰 바다를 잇는 파나마 운하가 있어요. 배가 계단을 오르듯 산을 넘어요.",
    story: "파나마 운하에서는 거대한 배가 산을 넘어요. 운하 중간이 바다보다 26미터 높거든요. 그래서 물 계단인 '갑문'에 배를 넣고 물을 채워 한 칸씩 들어 올려요. 배가 엘리베이터를 타는 셈이죠. 이 운하 덕분에 배들은 남미를 빙 돌지 않고 두 바다를 오가요.\n💬 이렇게 물어보세요: 물로 배를 들어 올린다니, 어떻게 가능한 걸까?"
  },
  "Puerto Rico": {
    brief: "푸에르토리코에는 밤이 되면 바닷물이 반짝반짝 빛나는 만이 있어요. '코키'라고 우는 작은 개구리의 섬이에요.",
    story: "푸에르토리코의 모스키토 만에서는 밤에 물을 휘저으면 바다가 파랗게 빛나요. 물속에 사는 아주 작은 플랑크톤이 건드리면 빛을 내거든요. 노를 저으면 배 뒤로 빛의 길이 생겨요. 밤이면 섬 곳곳에서 '코키! 코키!' 하는 작은 개구리 울음소리가 자장가처럼 들려요.\n💬 이렇게 물어보세요: 작은 생물은 왜 건드리면 빛을 낼까? 빛이 무기가 될 수 있을까?"
  },
  // ===== 남아메리카 =====
  "Guyana": {
    brief: "가이아나에는 한 번에 떨어지는 폭포로는 세계에서 손꼽히게 큰 카이에투르 폭포가 있어요. 국토 대부분이 숲이에요.",
    story: "가이아나의 카이에투르 폭포는 한 번에 226미터를 떨어지는데, 나이아가라 폭포의 다섯 배 높이예요. 폭포 물보라 속 절벽에는 작은 황금 개구리가 사는데, 평생 그 폭포 곁을 떠나지 않아요. 가이아나는 남아메리카에서 유일하게 영어를 쓰는 나라예요.\n💬 이렇게 물어보세요: 작은 개구리는 왜 시끄러운 폭포 옆을 떠나지 않을까?"
  },
  "Venezuela": {
    brief: "베네수엘라에는 세계에서 가장 높은 폭포, 엔젤 폭포가 있어요. 꼭대기가 평평한 신비한 탁자 산도 있어요.",
    story: "베네수엘라의 엔젤 폭포는 높이가 979미터! 물이 너무 높은 곳에서 떨어져서, 바닥에 닿기 전에 안개로 흩어져 버려요. 이 폭포는 꼭대기가 평평한 '테푸이'라는 탁자 모양 산에서 떨어지는데, 그 위에는 세상과 떨어져 사는 신기한 동식물이 살아요.\n💬 이렇게 물어보세요: 물이 너무 높은 데서 떨어지면 왜 안개가 되어 사라질까?"
  },
  "Bolivia": {
    brief: "볼리비아에는 세계에서 가장 큰 거울 같은 우유니 소금사막이 있어요. 비가 오면 하늘이 땅에 그대로 비쳐요.",
    story: "볼리비아의 우유니 소금사막은 옛날 호수가 마른 자리예요. 끝없이 펼쳐진 새하얀 소금밭에 얇게 비가 고이면, 하늘이 땅에 그대로 비쳐서 구름 위를 걷는 것 같아요. 어디가 하늘이고 어디가 땅인지 알 수 없는 거대한 거울이 되는 거죠.\n💬 이렇게 물어보세요: 땅이 거울이 되려면 무슨 일이 있어야 할까?"
  },
  "Brazil": {
    adult: {
      summary: "남아메리카에서 가장 크고 인구가 많은 나라로 수도는 브라질리아입니다. 포르투갈어를 쓰는 유일한 대국입니다.",
      geo: "대륙 면적의 절반 가까이를 차지하며, 지구 산소와 생물다양성의 보고인 아마존 열대우림의 대부분이 있습니다.",
      history: "포르투갈 식민지였다가 1822년 독립했습니다. 다양한 인종이 어우러진 사회를 이루어 왔습니다.",
      culture: "삼바와 카니발, 축구가 국민 정서를 대표하며, 커피·대두의 주요 생산국입니다.",
      people: "축구 황제 펠레, 건축가 오스카 니마이어, 작가 파울로 코엘료 등이 있습니다."
    },
    brief: "브라질에는 지구의 허파라 불리는 아마존 열대우림이 있어요. 리우의 카니발과 거대한 예수상으로 유명해요.",
    story: "브라질의 아마존은 지구에서 가장 큰 열대우림이에요. 지구 산소의 많은 부분을 만들어 '지구의 허파'라 불리죠. 이 숲에는 아직 사람이 다 못 센 동식물이 가득해요. 리우데자네이루 언덕 위에는 38미터 높이의 거대한 예수상이 두 팔 벌려 도시를 안고 있어요.\n💬 이렇게 물어보세요: 멀리 있는 아마존 숲이 왜 우리 숨쉬기와 관계가 있을까?"
  },
  "Suriname": {
    brief: "수리남은 남아메리카에서 가장 작은 나라예요. 국토의 90퍼센트가 숲이라, 세계에서 가장 숲이 많은 나라예요.",
    story: "수리남은 남아메리카에서 가장 작지만, 나라의 90퍼센트가 원시림으로 덮여 있어요. 비율로는 세계에서 숲이 가장 많은 나라죠. 여러 대륙에서 온 사람들이 함께 살아서, 한 거리에 모스크와 사원이 나란히 서 있기도 해요. 네덜란드어를 쓰는 유일한 남미 나라예요.\n💬 이렇게 물어보세요: 나라가 거의 다 숲이면 사람들은 어떻게 살아갈까?"
  },
  "Argentina": {
    brief: "아르헨티나는 탱고 춤의 고향이에요. 거대한 이구아수 폭포와 펭귄이 사는 파타고니아가 있어요.",
    story: "아르헨티나에서 태어난 탱고는 처음엔 항구 노동자들의 춤이었는데 지금은 세계가 사랑하는 춤이 됐어요. 이구아수 폭포는 폭포 275개가 줄지어 쏟아지는 거대한 물의 벽이에요. 남쪽 파타고니아에는 살아 움직이는 거대한 빙하가 있어서, 가끔 얼음 절벽이 와르르 무너져 내려요.\n💬 이렇게 물어보세요: 빙하가 살아 움직인다는 건 무슨 뜻일까?"
  },
  "Ecuador": {
    brief: "에콰도르는 이름이 '적도'라는 뜻이에요. 적도선 위에 두 발을 딛고 양쪽 반구에 동시에 설 수 있어요.",
    story: "에콰도르는 나라 이름부터 '적도'예요. 적도 기념비에 가면 선 하나를 두고 한 발은 북반구, 한 발은 남반구에 딛고 설 수 있죠. 적도에서는 몸무게가 살짝 가벼워지기도 해요. 이 나라 갈라파고스 제도는 다윈이 진화를 깨달은, 신기한 동물들의 섬이에요.\n💬 이렇게 물어보세요: 적도에서 몸무게가 가벼워진다니, 왜 그럴까?"
  },
  "Uruguay": {
    brief: "우루과이는 소가 사람보다 많은 나라예요. 마테차를 들고 다니며 마시는 게 일상이에요.",
    story: "우루과이에는 소가 사람보다 네 배나 많아요. 그래서 소를 한 마리 한 마리 번호로 관리하는, 세계에서 손꼽히는 나라예요. 사람들은 '마테'라는 차를 보온병에 담아 들고 다니며 하루 종일 빨대로 나눠 마셔요. 친구끼리 같은 잔을 돌려 마시는 게 우정의 표시래요.\n💬 이렇게 물어보세요: 같은 잔을 나눠 마시는 건 어떤 마음을 표현하는 걸까?"
  },
  "Chile": {
    brief: "칠레는 위아래로 4,300킬로미터나 되는 가늘고 긴 나라예요. 세계에서 가장 건조한 아타카마 사막이 있어요.",
    story: "칠레는 폭이 좁고 위아래로 아주 긴 나라예요. 북쪽 끝과 남쪽 끝이 서울에서 베트남까지 거리만큼 멀죠. 북쪽 아타카마 사막은 수백 년 동안 비가 한 방울도 안 온 곳이 있을 만큼 건조해서, 밤하늘 별이 가장 잘 보여 세계의 천문대가 모여 있어요.\n💬 이렇게 물어보세요: 비가 안 오는 사막이 별 보기에는 왜 좋을까?"
  },
  "Colombia": {
    brief: "콜롬비아는 향 좋은 커피의 나라예요. 다섯 가지 색으로 물드는 '무지개 강'이 있어요.",
    story: "콜롬비아에는 카뇨크리스탈레스라는 '무지개 강'이 있어요. 특정 계절이 되면 강바닥 식물이 빨강·노랑·초록·파랑으로 물들어 강 전체가 무지개처럼 흘러요. '세상에서 가장 아름다운 강'이라 불리죠. 산비탈에서 정성껏 기른 콜롬비아 커피는 부드럽고 향이 좋기로 유명해요.\n💬 이렇게 물어보세요: 강물이 무지개색이 되려면 강 속에 뭐가 있어야 할까?"
  },
  "Paraguay": {
    brief: "파라과이는 두 가지 말을 함께 쓰는 나라예요. 원주민 말 과라니어와 스페인어를 둘 다 공용어로 써요.",
    story: "파라과이는 원주민 언어인 과라니어를 스페인어와 똑같이 나라말로 쓰는, 남미에서 드문 나라예요. 거의 모든 사람이 두 언어를 자유롭게 오가요. 그리고 파라과이강 위에는 세계에서 손꼽히게 큰 이타이푸 댐이 있어서, 나라에 필요한 전기를 거의 다 만들어내요.\n💬 이렇게 물어보세요: 두 가지 말을 똑같이 쓰면 어떤 점이 좋을까?"
  },
  "Peru": {
    brief: "페루에는 구름 위 잉카의 도시 마추픽추가 있어요. 하늘에서만 보이는 거대한 나스카 그림도 있어요.",
    story: "페루의 마추픽추는 산꼭대기 2,400미터에 잉카 사람들이 돌로 지은 도시예요. 구름 위에 떠 있는 것 같아 '잃어버린 공중 도시'라 불려요. 나스카 사막에는 벌새, 원숭이 같은 거대한 그림이 땅에 새겨져 있는데, 너무 커서 하늘에서만 전체가 보여요. 2천 년 전 사람들이 왜 그렸는지는 아직 수수께끼예요.\n💬 이렇게 물어보세요: 하늘에서만 보이는 그림을 땅에서 어떻게 그렸을까?"
  },
  "Falkland Islands": {
    brief: "포클랜드 제도는 사람보다 펭귄이 훨씬 많은 섬이에요. 남대서양의 바람 부는 외딴 섬들이에요.",
    story: "포클랜드 제도에는 사람이 약 3천 명 사는데, 펭귄은 100만 마리가 넘어요. 사람 한 명당 펭귄이 300마리가 넘는 셈이죠. 다섯 종류의 펭귄이 해변을 가득 메우고, 양도 사람보다 훨씬 많아서 온 섬이 동물들의 천국이에요.\n💬 이렇게 물어보세요: 사람보다 동물이 훨씬 많은 섬에서 산다면 어떤 기분일까?"
  },
  "French Guiana": {
    brief: "프랑스령 기아나에는 유럽의 로켓이 우주로 떠나는 발사기지가 있어요. 국토 대부분이 아마존 정글이에요.",
    story: "프랑스령 기아나는 남아메리카에 있지만 프랑스 땅이에요. 이곳 쿠루에는 유럽의 로켓이 우주로 떠나는 발사기지가 있어요. 적도와 가까워서 지구의 자전 힘을 더 받아 로켓을 쏘기에 유리하거든요. 정글 바로 옆에서 우주로 로켓이 솟아오르는 신기한 곳이에요.\n💬 이렇게 물어보세요: 적도 근처에서 로켓을 쏘면 왜 더 유리할까?"
  },
  // ===== 오세아니아 · 기타 =====
  "New Caledonia": {
    brief: "누벨칼레도니에는 세계에서 가장 큰 산호 호수가 있어요. 하늘에서 보면 초록 하트 모양 숲도 보여요.",
    story: "누벨칼레도니를 둘러싼 산호초 안쪽 바다는 세계에서 가장 큰 산호 호수예요. 너무 커서 우주에서도 보이고, 통째로 세계자연유산이에요. 이 섬에는 하늘에서 봐야 보이는 초록 하트 모양 맹그로브 숲도 있어요. 자연이 만든 하트죠.\n💬 이렇게 물어보세요: 산호는 작은 생물인데 어떻게 우주에서 보이는 큰 것을 만들까?"
  },
  "New Zealand": {
    brief: "뉴질랜드에는 날지 못하는 새 키위가 살아요. 사람보다 양이 훨씬 많고, 반딧불이 빛나는 동굴이 있어요.",
    story: "뉴질랜드의 와이토모 동굴 천장에는 작은 빛벌레 수천 마리가 별처럼 빛나요. 배를 타고 동굴을 지나면 머리 위로 은하수가 펼쳐진 것 같죠. 이 나라의 상징인 키위 새는 날개가 거의 없어 날지 못하고 땅에서만 살아요. 천적이 없던 섬에서 날 필요가 없어졌거든요.\n💬 이렇게 물어보세요: 새인데 날 필요가 없어지면 날개는 어떻게 될까?"
  },
  "Vanuatu": {
    brief: "바누아투에는 가까이 다가가 들여다볼 수 있는 활화산이 있어요. 83개의 섬으로 이루어진 남태평양의 나라예요.",
    story: "바누아투의 야수르 화산은 세계에서 가장 가까이 다가갈 수 있는 활화산이에요. 분화구 가장자리에 서면 땅속에서 용암이 붉게 끓어오르며 쾅쾅 터지는 걸 볼 수 있죠. 천 년 넘게 쉬지 않고 활동해서 '세계의 등대'라고도 불려요.\n💬 이렇게 물어보세요: 화산 속 붉은 용암은 얼마나 뜨거울까? 그 열은 어디서 올까?"
  },
  "Solomon Islands": {
    brief: "솔로몬 제도는 거의 천 개의 섬으로 이루어진 남태평양 나라예요. 바닷속에 옛날 비행기와 배가 잠들어 있어요.",
    story: "솔로몬 제도의 맑은 바다 밑에는 옛날에 가라앉은 배와 비행기가 잠들어 있어요. 지금은 산호와 물고기의 집이 되어, 다이버들이 찾는 신비한 수중 박물관이 됐죠. 이 나라 어떤 섬 사람들은 머리카락이 자연적으로 금발이라 신기해요.\n💬 이렇게 물어보세요: 가라앉은 배가 물고기의 집이 된다니, 어떻게 그럴까?"
  },
  "Papua New Guinea": {
    brief: "파푸아뉴기니에는 세계에서 가장 많은 800개가 넘는 언어가 있어요. 화려한 극락조가 사는 나라예요.",
    story: "파푸아뉴기니에는 언어가 800개가 넘어요. 세계 언어의 열에 하나가 이 한 나라에 있는 셈이죠. 높은 산과 깊은 골짜기로 마을들이 떨어져 살다 보니 저마다 다른 말이 생긴 거예요. 숲에는 깃털이 환상적으로 아름다운 극락조가 살아서, 국기에도 그려져 있어요.\n💬 이렇게 물어보세요: 옆 마을인데 말이 안 통하면 사람들은 어떻게 지냈을까?"
  },
  "Fiji": {
    brief: "피지는 333개의 섬으로 이루어진 남태평양의 나라예요. 만나면 '불라!'라고 밝게 인사해요.",
    story: "피지 사람들은 누구를 만나든 '불라!'라고 환하게 인사해요. '안녕'이자 '건강하길'이라는 뜻이 담긴 따뜻한 말이죠. 333개 섬 둘레의 바다는 산호초로 가득해서 '세계 연산호의 수도'라 불려요. 물이 어찌나 맑은지 배가 물 위에 떠 있는 게 아니라 공중에 뜬 것처럼 보여요.\n💬 이렇게 물어보세요: 만나는 사람마다 밝게 인사하면 하루가 어떻게 달라질까?"
  },
  "Australia": {
    adult: {
      summary: "남반구의 대륙이자 국가로 수도는 캔버라입니다. 한 대륙 전체가 하나의 나라인 유일한 경우입니다.",
      geo: "오래되고 평탄한 대륙으로, 내륙은 광대한 사막(아웃백)이고 북동 해안에는 세계 최대 산호초인 그레이트배리어리프가 있습니다.",
      history: "수만 년 전부터 원주민(애버리지니)이 살아온 땅으로, 18세기 영국 정착 이후 1901년 연방으로 독립했습니다.",
      culture: "다문화 이민 사회이며, 캥거루·코알라 등 고유 동물과 야외·해양 문화가 특징입니다.",
      people: "배우 휴 잭맨과 니콜 키드먼, 노벨상 과학자들이 있습니다."
    },
    brief: "호주에는 캥거루와 코알라처럼 이곳에만 사는 동물이 많아요. 우주에서도 보이는 거대한 산호초가 있어요.",
    story: "호주는 아주 오래전 다른 대륙에서 떨어져 나온 섬 대륙이라, 캥거루·코알라·오리너구리처럼 세상 어디에도 없는 동물이 살아요. 동쪽 바다의 그레이트 배리어 리프는 산호초가 2,300킬로미터나 이어진, 우주에서도 보이는 세계 최대의 산호 군락이에요. 수많은 작은 산호 생물이 만든 거죠.\n💬 이렇게 물어보세요: 대륙이 외따로 떨어져 있으면 동물들은 어떻게 달라질까?"
  },
  "Kosovo": {
    brief: "코소보는 2008년에 독립한, 유럽에서 가장 어린 나라 중 하나예요. 젊은 사람이 많은 나라예요.",
    story: "코소보는 2008년에 독립을 선언한, 유럽에서 가장 새로운 나라 중 하나예요. 그래서 국민 평균 나이가 유럽에서 가장 어린 축에 들어요. 거리에 젊은이가 많고 활기차죠. 수도 프리슈티나에는 알파벳 모양으로 지은 독특한 기념물 'NEWBORN'이 있어요.\n💬 이렇게 물어보세요: 나라에 젊은 사람이 많으면 어떤 점이 좋을까?"
  },
  "Northern Cyprus": {
    brief: "북키프로스는 키프로스섬의 북쪽 땅이에요. 바닷가에 모래사장과 오래된 성이 함께 있어요.",
    story: "북키프로스는 지중해 키프로스섬의 북쪽에 있어요. 따뜻한 바다와 황금빛 모래사장, 그리고 산 위의 오래된 성이 어우러진 곳이죠. 바닷가에는 바다거북이 알을 낳으러 찾아와서, 사람들이 거북 둥지를 정성껏 지켜줘요.\n💬 이렇게 물어보세요: 사람들은 왜 바다거북의 알을 지켜주려고 할까?"
  },
  "Somaliland": {
    brief: "소말릴란드에는 5천 년 전 사람들이 그린 동굴 벽화가 있어요. 아프리카 동쪽 끝의 땅이에요.",
    story: "소말릴란드의 라스 길 동굴에는 5천 년 전 사람들이 그린 그림이 놀랍도록 선명하게 남아 있어요. 소 떼와 사람들이 빨강·하양·노랑으로 생생하게 그려져 있죠. 아프리카에서 가장 잘 보존된 옛 그림 중 하나예요. 오랜 세월 동굴이 그림을 지켜준 거예요.\n💬 이렇게 물어보세요: 5천 년 전 그림이 어떻게 색까지 그대로 남아 있을까?"
  },
  "French Southern and Antarctic Lands": {
    brief: "프랑스령 남부와 남극 지역은 남극 근처의 외딴 섬들이에요. 사람은 연구원만 살고, 펭귄과 물개가 가득해요.",
    story: "이곳은 지구에서 가장 외딴 곳 중 하나예요. 남극 가까운 차가운 바다에 흩어진 섬들로, 사람은 자연을 연구하는 과학자만 잠깐씩 살아요. 대신 킹펭귄 수십만 마리가 모여 거대한 무리를 이루고, 물개와 바닷새가 주인처럼 살아가요.\n💬 이렇게 물어보세요: 사람이 거의 없는 섬에서 동물들은 어떻게 살아갈까?"
  }
};

// ===== 정적 데이터: 덕담 번역 =====
// 덕담 번역 데이터 — 주요 언어별 (정확성 검증된 것만)
// 구조: VTRANS[언어키][덕담] = {word, pron(한국어발음), sentence(현지어 한마디), spron(문장 한국어발음), bcp47}
// 덕담 13개: 사랑 감사 기쁨 용기 겸손 오래참음 친절 믿음 인내 소망 평화 온유 절제

const VTRANS = {
  English: {
    "사랑": {
      word: "Love",
      pron: "러브",
      sentence: "I love you.",
      spron: "아이 러브 유",
      bcp47: "en-US"
    },
    "감사": {
      word: "Thanks",
      pron: "땡스",
      sentence: "Thank you so much.",
      spron: "땡큐 쏘 머치",
      bcp47: "en-US"
    },
    "기쁨": {
      word: "Joy",
      pron: "조이",
      sentence: "What a joy!",
      spron: "왓 어 조이",
      bcp47: "en-US"
    },
    "용기": {
      word: "Courage",
      pron: "커리지",
      sentence: "Be brave.",
      spron: "비 브레이브",
      bcp47: "en-US"
    },
    "겸손": {
      word: "Humility",
      pron: "휴밀리티",
      sentence: "Stay humble.",
      spron: "스테이 험블",
      bcp47: "en-US"
    },
    "오래참음": {
      word: "Patience",
      pron: "페이션스",
      sentence: "Take your time.",
      spron: "테이크 유어 타임",
      bcp47: "en-US"
    },
    "친절": {
      word: "Kindness",
      pron: "카인드니스",
      sentence: "Be kind.",
      spron: "비 카인드",
      bcp47: "en-US"
    },
    "믿음": {
      word: "Faith",
      pron: "페이스",
      sentence: "I believe in you.",
      spron: "아이 빌리브 인 유",
      bcp47: "en-US"
    },
    "인내": {
      word: "Perseverance",
      pron: "퍼서비어런스",
      sentence: "Never give up.",
      spron: "네버 기브 업",
      bcp47: "en-US"
    },
    "소망": {
      word: "Hope",
      pron: "호프",
      sentence: "Never lose hope.",
      spron: "네버 루즈 호프",
      bcp47: "en-US"
    },
    "평화": {
      word: "Peace",
      pron: "피스",
      sentence: "Peace be with you.",
      spron: "피스 비 위드 유",
      bcp47: "en-US"
    },
    "온유": {
      word: "Gentleness",
      pron: "젠틀니스",
      sentence: "Be gentle.",
      spron: "비 젠틀",
      bcp47: "en-US"
    },
    "절제": {
      word: "Self-control",
      pron: "셀프 컨트롤",
      sentence: "Stay in control.",
      spron: "스테이 인 컨트롤",
      bcp47: "en-US"
    }
  },
  Spanish: {
    "사랑": {
      word: "Amor",
      pron: "아모르",
      sentence: "Te quiero.",
      spron: "테 끼에로",
      bcp47: "es-ES"
    },
    "감사": {
      word: "Gracias",
      pron: "그라시아스",
      sentence: "Muchas gracias.",
      spron: "무차스 그라시아스",
      bcp47: "es-ES"
    },
    "기쁨": {
      word: "Alegría",
      pron: "알레그리아",
      sentence: "¡Qué alegría!",
      spron: "께 알레그리아",
      bcp47: "es-ES"
    },
    "용기": {
      word: "Valor",
      pron: "발로르",
      sentence: "Sé valiente.",
      spron: "쎄 발리엔테",
      bcp47: "es-ES"
    },
    "겸손": {
      word: "Humildad",
      pron: "우밀닫",
      sentence: "Sé humilde.",
      spron: "쎄 우밀데",
      bcp47: "es-ES"
    },
    "오래참음": {
      word: "Paciencia",
      pron: "빠시엔시아",
      sentence: "Ten paciencia.",
      spron: "뗀 빠시엔시아",
      bcp47: "es-ES"
    },
    "친절": {
      word: "Amabilidad",
      pron: "아마빌리닫",
      sentence: "Sé amable.",
      spron: "쎄 아마블레",
      bcp47: "es-ES"
    },
    "믿음": {
      word: "Fe",
      pron: "페",
      sentence: "Creo en ti.",
      spron: "끄레오 엔 띠",
      bcp47: "es-ES"
    },
    "인내": {
      word: "Perseverancia",
      pron: "뻬르세베란시아",
      sentence: "Nunca te rindas.",
      spron: "눈까 떼 린다스",
      bcp47: "es-ES"
    },
    "소망": {
      word: "Esperanza",
      pron: "에스뻬란사",
      sentence: "Nunca pierdas la esperanza.",
      spron: "눈까 삐에르다스 라 에스뻬란사",
      bcp47: "es-ES"
    },
    "평화": {
      word: "Paz",
      pron: "빠스",
      sentence: "Que tengas paz.",
      spron: "께 뗑가스 빠스",
      bcp47: "es-ES"
    },
    "온유": {
      word: "Ternura",
      pron: "떼르누라",
      sentence: "Sé tierno.",
      spron: "쎄 띠에르노",
      bcp47: "es-ES"
    },
    "절제": {
      word: "Autocontrol",
      pron: "아우또꼰뜨롤",
      sentence: "Ten autocontrol.",
      spron: "뗀 아우또꼰뜨롤",
      bcp47: "es-ES"
    }
  },
  French: {
    "사랑": {
      word: "Amour",
      pron: "아무르",
      sentence: "Je t'aime.",
      spron: "쥬 뗌",
      bcp47: "fr-FR"
    },
    "감사": {
      word: "Merci",
      pron: "메르시",
      sentence: "Merci beaucoup.",
      spron: "메르시 보꾸",
      bcp47: "fr-FR"
    },
    "기쁨": {
      word: "Joie",
      pron: "쥬아",
      sentence: "Quelle joie!",
      spron: "껠 쥬아",
      bcp47: "fr-FR"
    },
    "용기": {
      word: "Courage",
      pron: "꾸라쥬",
      sentence: "Sois courageux.",
      spron: "쑤아 꾸라죄",
      bcp47: "fr-FR"
    },
    "겸손": {
      word: "Humilité",
      pron: "위밀리떼",
      sentence: "Reste humble.",
      spron: "레스뜨 엉블",
      bcp47: "fr-FR"
    },
    "오래참음": {
      word: "Patience",
      pron: "빠시앙스",
      sentence: "Prends ton temps.",
      spron: "프랑 똥 땅",
      bcp47: "fr-FR"
    },
    "친절": {
      word: "Gentillesse",
      pron: "쟝띠예스",
      sentence: "Sois gentil.",
      spron: "쑤아 쟝띠",
      bcp47: "fr-FR"
    },
    "믿음": {
      word: "Foi",
      pron: "푸아",
      sentence: "Je crois en toi.",
      spron: "쥬 끄루아 앙 뚜아",
      bcp47: "fr-FR"
    },
    "인내": {
      word: "Persévérance",
      pron: "뻬르세베랑스",
      sentence: "N'abandonne jamais.",
      spron: "나방돈 쟈메",
      bcp47: "fr-FR"
    },
    "소망": {
      word: "Espoir",
      pron: "에스뿌아르",
      sentence: "Garde espoir.",
      spron: "갸르드 에스뿌아르",
      bcp47: "fr-FR"
    },
    "평화": {
      word: "Paix",
      pron: "뻬",
      sentence: "La paix soit avec toi.",
      spron: "라 뻬 쑤아 아벡 뚜아",
      bcp47: "fr-FR"
    },
    "온유": {
      word: "Douceur",
      pron: "두쇠르",
      sentence: "Sois doux.",
      spron: "쑤아 두",
      bcp47: "fr-FR"
    },
    "절제": {
      word: "Maîtrise de soi",
      pron: "메뜨리즈 드 쑤아",
      sentence: "Garde le contrôle.",
      spron: "갸르드 르 꽁트롤",
      bcp47: "fr-FR"
    }
  },
  Arabic: {
    "사랑": {
      word: "حب",
      pron: "후브",
      sentence: "أحبك",
      spron: "우힙부카",
      bcp47: "ar-SA"
    },
    "감사": {
      word: "شكرا",
      pron: "슈크란",
      sentence: "شكرا جزيلا",
      spron: "슈크란 자질란",
      bcp47: "ar-SA"
    },
    "기쁨": {
      word: "فرح",
      pron: "파라흐",
      sentence: "يا للفرح",
      spron: "야 릴파라흐",
      bcp47: "ar-SA"
    },
    "용기": {
      word: "شجاعة",
      pron: "슈자아",
      sentence: "كن شجاعا",
      spron: "쿤 슈자안",
      bcp47: "ar-SA"
    },
    "겸손": {
      word: "تواضع",
      pron: "타와두",
      sentence: "كن متواضعا",
      spron: "쿤 무타와디안",
      bcp47: "ar-SA"
    },
    "오래참음": {
      word: "صبر",
      pron: "사브르",
      sentence: "تحلى بالصبر",
      spron: "타할라 빌사브르",
      bcp47: "ar-SA"
    },
    "친절": {
      word: "لطف",
      pron: "루트프",
      sentence: "كن لطيفا",
      spron: "쿤 라티판",
      bcp47: "ar-SA"
    },
    "믿음": {
      word: "إيمان",
      pron: "이만",
      sentence: "أؤمن بك",
      spron: "우으미누 비카",
      bcp47: "ar-SA"
    },
    "인내": {
      word: "مثابرة",
      pron: "무사바라",
      sentence: "لا تستسلم",
      spron: "라 타스타슬림",
      bcp47: "ar-SA"
    },
    "소망": {
      word: "أمل",
      pron: "아말",
      sentence: "لا تفقد الأمل",
      spron: "라 타프키딜 아말",
      bcp47: "ar-SA"
    },
    "평화": {
      word: "سلام",
      pron: "살람",
      sentence: "السلام عليكم",
      spron: "앗살라무 알라이쿰",
      bcp47: "ar-SA"
    },
    "온유": {
      word: "لين",
      pron: "린",
      sentence: "كن لينا",
      spron: "쿤 라이이난",
      bcp47: "ar-SA"
    },
    "절제": {
      word: "ضبط النفس",
      pron: "다브트 안나프스",
      sentence: "تحكم بنفسك",
      spron: "타하캄 비나프시카",
      bcp47: "ar-SA"
    }
  },
  Chinese: {
    "사랑": {
      word: "爱",
      pron: "아이",
      sentence: "我爱你",
      spron: "워 아이 니",
      bcp47: "zh-CN"
    },
    "감사": {
      word: "感谢",
      pron: "간셰",
      sentence: "非常感谢",
      spron: "페이창 간셰",
      bcp47: "zh-CN"
    },
    "기쁨": {
      word: "喜悦",
      pron: "시위에",
      sentence: "真开心",
      spron: "전 카이신",
      bcp47: "zh-CN"
    },
    "용기": {
      word: "勇气",
      pron: "융치",
      sentence: "要勇敢",
      spron: "야오 융간",
      bcp47: "zh-CN"
    },
    "겸손": {
      word: "谦虚",
      pron: "첸쉬",
      sentence: "要谦虚",
      spron: "야오 첸쉬",
      bcp47: "zh-CN"
    },
    "오래참음": {
      word: "耐心",
      pron: "나이신",
      sentence: "要有耐心",
      spron: "야오 여우 나이신",
      bcp47: "zh-CN"
    },
    "친절": {
      word: "善良",
      pron: "산량",
      sentence: "要善良",
      spron: "야오 산량",
      bcp47: "zh-CN"
    },
    "믿음": {
      word: "信任",
      pron: "신런",
      sentence: "我相信你",
      spron: "워 샹신 니",
      bcp47: "zh-CN"
    },
    "인내": {
      word: "坚持",
      pron: "졘츠",
      sentence: "永不放弃",
      spron: "융 부 팡치",
      bcp47: "zh-CN"
    },
    "소망": {
      word: "希望",
      pron: "시왕",
      sentence: "别失去希望",
      spron: "비에 스취 시왕",
      bcp47: "zh-CN"
    },
    "평화": {
      word: "和平",
      pron: "허핑",
      sentence: "愿你平安",
      spron: "위안 니 핑안",
      bcp47: "zh-CN"
    },
    "온유": {
      word: "温柔",
      pron: "원러우",
      sentence: "要温柔",
      spron: "야오 원러우",
      bcp47: "zh-CN"
    },
    "절제": {
      word: "自制",
      pron: "쯔즈",
      sentence: "要自制",
      spron: "야오 쯔즈",
      bcp47: "zh-CN"
    }
  },
  Japanese: {
    "사랑": {
      word: "愛",
      pron: "아이",
      sentence: "愛してる",
      spron: "아이시테루",
      bcp47: "ja-JP"
    },
    "감사": {
      word: "感謝",
      pron: "칸샤",
      sentence: "ありがとう",
      spron: "아리가토",
      bcp47: "ja-JP"
    },
    "기쁨": {
      word: "喜び",
      pron: "요로코비",
      sentence: "うれしい",
      spron: "우레시이",
      bcp47: "ja-JP"
    },
    "용기": {
      word: "勇気",
      pron: "유우키",
      sentence: "勇気を出して",
      spron: "유우키오 다시테",
      bcp47: "ja-JP"
    },
    "겸손": {
      word: "謙虚",
      pron: "켄쿄",
      sentence: "謙虚でいよう",
      spron: "켄쿄데 이요",
      bcp47: "ja-JP"
    },
    "오래참음": {
      word: "忍耐",
      pron: "닌타이",
      sentence: "焦らないで",
      spron: "아세라나이데",
      bcp47: "ja-JP"
    },
    "친절": {
      word: "親切",
      pron: "신세츠",
      sentence: "優しくね",
      spron: "야사시쿠네",
      bcp47: "ja-JP"
    },
    "믿음": {
      word: "信頼",
      pron: "신라이",
      sentence: "信じてるよ",
      spron: "신지테루요",
      bcp47: "ja-JP"
    },
    "인내": {
      word: "忍耐",
      pron: "닌타이",
      sentence: "あきらめないで",
      spron: "아키라메나이데",
      bcp47: "ja-JP"
    },
    "소망": {
      word: "希望",
      pron: "키보우",
      sentence: "希望を持って",
      spron: "키보오 못테",
      bcp47: "ja-JP"
    },
    "평화": {
      word: "平和",
      pron: "헤이와",
      sentence: "平和でありますように",
      spron: "헤이와데 아리마스요니",
      bcp47: "ja-JP"
    },
    "온유": {
      word: "優しさ",
      pron: "야사시사",
      sentence: "優しくしよう",
      spron: "야사시쿠 시요",
      bcp47: "ja-JP"
    },
    "절제": {
      word: "節制",
      pron: "셋세이",
      sentence: "自分を抑えて",
      spron: "지분오 오사에테",
      bcp47: "ja-JP"
    }
  },
  German: {
    "사랑": {
      word: "Liebe",
      pron: "리베",
      sentence: "Ich liebe dich.",
      spron: "이히 리베 디히",
      bcp47: "de-DE"
    },
    "감사": {
      word: "Danke",
      pron: "당케",
      sentence: "Vielen Dank.",
      spron: "필렌 당크",
      bcp47: "de-DE"
    },
    "기쁨": {
      word: "Freude",
      pron: "프로이데",
      sentence: "Welche Freude!",
      spron: "벨헤 프로이데",
      bcp47: "de-DE"
    },
    "용기": {
      word: "Mut",
      pron: "무트",
      sentence: "Sei mutig.",
      spron: "자이 무티히",
      bcp47: "de-DE"
    },
    "겸손": {
      word: "Demut",
      pron: "데무트",
      sentence: "Bleib bescheiden.",
      spron: "블라이프 베샤이덴",
      bcp47: "de-DE"
    },
    "오래참음": {
      word: "Geduld",
      pron: "게둘트",
      sentence: "Hab Geduld.",
      spron: "합 게둘트",
      bcp47: "de-DE"
    },
    "친절": {
      word: "Freundlichkeit",
      pron: "프로인틀리히카이트",
      sentence: "Sei nett.",
      spron: "자이 넷",
      bcp47: "de-DE"
    },
    "믿음": {
      word: "Vertrauen",
      pron: "페어트라우엔",
      sentence: "Ich glaube an dich.",
      spron: "이히 글라우베 안 디히",
      bcp47: "de-DE"
    },
    "인내": {
      word: "Ausdauer",
      pron: "아우스다우어",
      sentence: "Gib nicht auf.",
      spron: "깁 니히트 아우프",
      bcp47: "de-DE"
    },
    "소망": {
      word: "Hoffnung",
      pron: "호프눙",
      sentence: "Verliere die Hoffnung nicht.",
      spron: "페어리레 디 호프눙 니히트",
      bcp47: "de-DE"
    },
    "평화": {
      word: "Frieden",
      pron: "프리덴",
      sentence: "Friede sei mit dir.",
      spron: "프리데 자이 밋 디어",
      bcp47: "de-DE"
    },
    "온유": {
      word: "Sanftmut",
      pron: "잔프트무트",
      sentence: "Sei sanft.",
      spron: "자이 잔프트",
      bcp47: "de-DE"
    },
    "절제": {
      word: "Selbstbeherrschung",
      pron: "젤프스트베헤어슝",
      sentence: "Beherrsche dich.",
      spron: "베헤어셰 디히",
      bcp47: "de-DE"
    }
  },
  Portuguese: {
    "사랑": {
      word: "Amor",
      pron: "아모르",
      sentence: "Eu te amo.",
      spron: "에우 치 아무",
      bcp47: "pt-BR"
    },
    "감사": {
      word: "Obrigado",
      pron: "오브리가두",
      sentence: "Muito obrigado.",
      spron: "무이투 오브리가두",
      bcp47: "pt-BR"
    },
    "기쁨": {
      word: "Alegria",
      pron: "알레그리아",
      sentence: "Que alegria!",
      spron: "케 알레그리아",
      bcp47: "pt-BR"
    },
    "용기": {
      word: "Coragem",
      pron: "코라젱",
      sentence: "Seja corajoso.",
      spron: "세자 코라조주",
      bcp47: "pt-BR"
    },
    "겸손": {
      word: "Humildade",
      pron: "우밀다지",
      sentence: "Seja humilde.",
      spron: "세자 우밀지",
      bcp47: "pt-BR"
    },
    "오래참음": {
      word: "Paciência",
      pron: "파시엔시아",
      sentence: "Tenha paciência.",
      spron: "테냐 파시엔시아",
      bcp47: "pt-BR"
    },
    "친절": {
      word: "Gentileza",
      pron: "젠칠레자",
      sentence: "Seja gentil.",
      spron: "세자 젠치우",
      bcp47: "pt-BR"
    },
    "믿음": {
      word: "Fé",
      pron: "페",
      sentence: "Eu acredito em você.",
      spron: "에우 아크레지투 잉 보세",
      bcp47: "pt-BR"
    },
    "인내": {
      word: "Perseverança",
      pron: "페르세베란사",
      sentence: "Nunca desista.",
      spron: "눙카 데지스타",
      bcp47: "pt-BR"
    },
    "소망": {
      word: "Esperança",
      pron: "에스페란사",
      sentence: "Não perca a esperança.",
      spron: "나웅 페르카 아 에스페란사",
      bcp47: "pt-BR"
    },
    "평화": {
      word: "Paz",
      pron: "파스",
      sentence: "A paz esteja com você.",
      spron: "아 파스 에스테자 콩 보세",
      bcp47: "pt-BR"
    },
    "온유": {
      word: "Mansidão",
      pron: "만시다웅",
      sentence: "Seja gentil.",
      spron: "세자 젠치우",
      bcp47: "pt-BR"
    },
    "절제": {
      word: "Autocontrole",
      pron: "아우토콘트롤리",
      sentence: "Tenha autocontrole.",
      spron: "테냐 아우토콘트롤리",
      bcp47: "pt-BR"
    }
  },
  Russian: {
    "사랑": {
      word: "Любовь",
      pron: "류보피",
      sentence: "Я тебя люблю.",
      spron: "야 치뱌 류블류",
      bcp47: "ru-RU"
    },
    "감사": {
      word: "Спасибо",
      pron: "스파시바",
      sentence: "Большое спасибо.",
      spron: "발쇼예 스파시바",
      bcp47: "ru-RU"
    },
    "기쁨": {
      word: "Радость",
      pron: "라다스치",
      sentence: "Какая радость!",
      spron: "카카야 라다스치",
      bcp47: "ru-RU"
    },
    "용기": {
      word: "Смелость",
      pron: "스몔라스치",
      sentence: "Будь смелым.",
      spron: "부치 스몔림",
      bcp47: "ru-RU"
    },
    "겸손": {
      word: "Скромность",
      pron: "스크롬나스치",
      sentence: "Будь скромным.",
      spron: "부치 스크롬님",
      bcp47: "ru-RU"
    },
    "오래참음": {
      word: "Терпение",
      pron: "치르페니예",
      sentence: "Имей терпение.",
      spron: "이몌이 치르페니예",
      bcp47: "ru-RU"
    },
    "친절": {
      word: "Доброта",
      pron: "다브라타",
      sentence: "Будь добрым.",
      spron: "부치 도브림",
      bcp47: "ru-RU"
    },
    "믿음": {
      word: "Вера",
      pron: "볘라",
      sentence: "Я верю в тебя.",
      spron: "야 볘류 프 치뱌",
      bcp47: "ru-RU"
    },
    "인내": {
      word: "Настойчивость",
      pron: "나스토이치바스치",
      sentence: "Не сдавайся.",
      spron: "녜 즈다바이샤",
      bcp47: "ru-RU"
    },
    "소망": {
      word: "Надежда",
      pron: "나졔즈다",
      sentence: "Не теряй надежду.",
      spron: "녜 치랴이 나졔즈두",
      bcp47: "ru-RU"
    },
    "평화": {
      word: "Мир",
      pron: "미르",
      sentence: "Мир тебе.",
      spron: "미르 치볘",
      bcp47: "ru-RU"
    },
    "온유": {
      word: "Кротость",
      pron: "크로타스치",
      sentence: "Будь нежным.",
      spron: "부치 녜즈님",
      bcp47: "ru-RU"
    },
    "절제": {
      word: "Самоконтроль",
      pron: "사마칸트롤",
      sentence: "Держи себя в руках.",
      spron: "졔르지 시뱌 브 루카흐",
      bcp47: "ru-RU"
    }
  },
  Italian: {
    "사랑": {
      word: "Amore",
      pron: "아모레",
      sentence: "Ti amo.",
      spron: "티 아모",
      bcp47: "it-IT"
    },
    "감사": {
      word: "Grazie",
      pron: "그라치에",
      sentence: "Grazie mille.",
      spron: "그라치에 밀레",
      bcp47: "it-IT"
    },
    "기쁨": {
      word: "Gioia",
      pron: "조이아",
      sentence: "Che gioia!",
      spron: "케 조이아",
      bcp47: "it-IT"
    },
    "용기": {
      word: "Coraggio",
      pron: "코라조",
      sentence: "Sii coraggioso.",
      spron: "시 코라조조",
      bcp47: "it-IT"
    },
    "겸손": {
      word: "Umiltà",
      pron: "우밀타",
      sentence: "Sii umile.",
      spron: "시 우밀레",
      bcp47: "it-IT"
    },
    "오래참음": {
      word: "Pazienza",
      pron: "파치엔차",
      sentence: "Abbi pazienza.",
      spron: "압비 파치엔차",
      bcp47: "it-IT"
    },
    "친절": {
      word: "Gentilezza",
      pron: "젠틸레차",
      sentence: "Sii gentile.",
      spron: "시 젠틸레",
      bcp47: "it-IT"
    },
    "믿음": {
      word: "Fede",
      pron: "페데",
      sentence: "Credo in te.",
      spron: "크레도 인 테",
      bcp47: "it-IT"
    },
    "인내": {
      word: "Perseveranza",
      pron: "페르세베란차",
      sentence: "Non arrenderti.",
      spron: "논 아렌데르티",
      bcp47: "it-IT"
    },
    "소망": {
      word: "Speranza",
      pron: "스페란차",
      sentence: "Non perdere la speranza.",
      spron: "논 페르데레 라 스페란차",
      bcp47: "it-IT"
    },
    "평화": {
      word: "Pace",
      pron: "파체",
      sentence: "La pace sia con te.",
      spron: "라 파체 시아 콘 테",
      bcp47: "it-IT"
    },
    "온유": {
      word: "Dolcezza",
      pron: "돌체차",
      sentence: "Sii dolce.",
      spron: "시 돌체",
      bcp47: "it-IT"
    },
    "절제": {
      word: "Autocontrollo",
      pron: "아우토콘트롤로",
      sentence: "Mantieni il controllo.",
      spron: "만티에니 일 콘트롤로",
      bcp47: "it-IT"
    }
  },
  Dutch: {
    "사랑": {
      word: "Liefde",
      pron: "리프더",
      sentence: "Ik hou van je.",
      spron: "익 하우 판 여",
      bcp47: "nl-NL"
    },
    "감사": {
      word: "Dank",
      pron: "당크",
      sentence: "Hartelijk dank.",
      spron: "하르털레익 당크",
      bcp47: "nl-NL"
    },
    "기쁨": {
      word: "Vreugde",
      pron: "프뢰흐더",
      sentence: "Wat een vreugde!",
      spron: "밧 언 프뢰흐더",
      bcp47: "nl-NL"
    },
    "용기": {
      word: "Moed",
      pron: "무트",
      sentence: "Wees moedig.",
      spron: "베이스 무디흐",
      bcp47: "nl-NL"
    },
    "겸손": {
      word: "Nederigheid",
      pron: "네더리흐헤이트",
      sentence: "Wees nederig.",
      spron: "베이스 네더리흐",
      bcp47: "nl-NL"
    },
    "오래참음": {
      word: "Geduld",
      pron: "흐둘트",
      sentence: "Heb geduld.",
      spron: "헵 흐둘트",
      bcp47: "nl-NL"
    },
    "친절": {
      word: "Vriendelijkheid",
      pron: "프린덜레익헤이트",
      sentence: "Wees aardig.",
      spron: "베이스 아르디흐",
      bcp47: "nl-NL"
    },
    "믿음": {
      word: "Vertrouwen",
      pron: "퍼트라우언",
      sentence: "Ik geloof in je.",
      spron: "익 흘로프 인 여",
      bcp47: "nl-NL"
    },
    "인내": {
      word: "Doorzettingsvermogen",
      pron: "도르제팅스퍼모헌",
      sentence: "Geef niet op.",
      spron: "헤프 닛 옵",
      bcp47: "nl-NL"
    },
    "소망": {
      word: "Hoop",
      pron: "호프",
      sentence: "Verlies de hoop niet.",
      spron: "퍼리스 더 호프 닛",
      bcp47: "nl-NL"
    },
    "평화": {
      word: "Vrede",
      pron: "프레더",
      sentence: "Vrede zij met je.",
      spron: "프레더 제이 멧 여",
      bcp47: "nl-NL"
    },
    "온유": {
      word: "Zachtmoedigheid",
      pron: "자흐트무디흐헤이트",
      sentence: "Wees zacht.",
      spron: "베이스 자흐트",
      bcp47: "nl-NL"
    },
    "절제": {
      word: "Zelfbeheersing",
      pron: "젤프버헤이르싱",
      sentence: "Beheers jezelf.",
      spron: "버헤이르스 여젤프",
      bcp47: "nl-NL"
    }
  },
  Korean: {
    "사랑": {
      word: "사랑",
      pron: "사랑",
      sentence: "사랑해요.",
      spron: "사랑해요",
      bcp47: "ko-KR"
    },
    "감사": {
      word: "감사",
      pron: "감사",
      sentence: "고맙습니다.",
      spron: "고맙습니다",
      bcp47: "ko-KR"
    },
    "기쁨": {
      word: "기쁨",
      pron: "기쁨",
      sentence: "정말 기뻐요.",
      spron: "정말 기뻐요",
      bcp47: "ko-KR"
    },
    "용기": {
      word: "용기",
      pron: "용기",
      sentence: "용기를 내요.",
      spron: "용기를 내요",
      bcp47: "ko-KR"
    },
    "겸손": {
      word: "겸손",
      pron: "겸손",
      sentence: "겸손해요.",
      spron: "겸손해요",
      bcp47: "ko-KR"
    },
    "오래참음": {
      word: "인내",
      pron: "인내",
      sentence: "조금만 참아요.",
      spron: "조금만 참아요",
      bcp47: "ko-KR"
    },
    "친절": {
      word: "친절",
      pron: "친절",
      sentence: "친절하게.",
      spron: "친절하게",
      bcp47: "ko-KR"
    },
    "믿음": {
      word: "믿음",
      pron: "믿음",
      sentence: "너를 믿어.",
      spron: "너를 믿어",
      bcp47: "ko-KR"
    },
    "인내": {
      word: "끈기",
      pron: "끈기",
      sentence: "포기하지 마요.",
      spron: "포기하지 마요",
      bcp47: "ko-KR"
    },
    "소망": {
      word: "소망",
      pron: "소망",
      sentence: "희망을 잃지 마요.",
      spron: "희망을 잃지 마요",
      bcp47: "ko-KR"
    },
    "평화": {
      word: "평화",
      pron: "평화",
      sentence: "평안하길.",
      spron: "평안하길",
      bcp47: "ko-KR"
    },
    "온유": {
      word: "온유",
      pron: "온유",
      sentence: "부드럽게.",
      spron: "부드럽게",
      bcp47: "ko-KR"
    },
    "절제": {
      word: "절제",
      pron: "절제",
      sentence: "스스로 다스려요.",
      spron: "스스로 다스려요",
      bcp47: "ko-KR"
    }
  },
  Vietnamese: {
    "사랑": {
      word: "Tình yêu",
      pron: "띤 이에우",
      sentence: "Tôi yêu bạn.",
      spron: "또이 이에우 반",
      bcp47: "vi-VN"
    },
    "감사": {
      word: "Cảm ơn",
      pron: "깜 언",
      sentence: "Cảm ơn nhiều.",
      spron: "깜 언 니에우",
      bcp47: "vi-VN"
    },
    "기쁨": {
      word: "Niềm vui",
      pron: "니엠 부이",
      sentence: "Vui quá!",
      spron: "부이 꽈",
      bcp47: "vi-VN"
    },
    "용기": {
      word: "Can đảm",
      pron: "깐 담",
      sentence: "Hãy dũng cảm.",
      spron: "하이 중 깜",
      bcp47: "vi-VN"
    },
    "겸손": {
      word: "Khiêm tốn",
      pron: "키엠 똔",
      sentence: "Hãy khiêm tốn.",
      spron: "하이 키엠 똔",
      bcp47: "vi-VN"
    },
    "오래참음": {
      word: "Kiên nhẫn",
      pron: "끼엔 년",
      sentence: "Hãy kiên nhẫn.",
      spron: "하이 끼엔 년",
      bcp47: "vi-VN"
    },
    "친절": {
      word: "Tử tế",
      pron: "뜨 떼",
      sentence: "Hãy tử tế.",
      spron: "하이 뜨 떼",
      bcp47: "vi-VN"
    },
    "믿음": {
      word: "Niềm tin",
      pron: "니엠 띤",
      sentence: "Tôi tin bạn.",
      spron: "또이 띤 반",
      bcp47: "vi-VN"
    },
    "인내": {
      word: "Bền bỉ",
      pron: "벤 비",
      sentence: "Đừng bỏ cuộc.",
      spron: "등 보 꾸옥",
      bcp47: "vi-VN"
    },
    "소망": {
      word: "Hy vọng",
      pron: "히 봉",
      sentence: "Đừng mất hy vọng.",
      spron: "등 멋 히 봉",
      bcp47: "vi-VN"
    },
    "평화": {
      word: "Hòa bình",
      pron: "호아 빈",
      sentence: "Bình an nhé.",
      spron: "빈 안 녜",
      bcp47: "vi-VN"
    },
    "온유": {
      word: "Dịu dàng",
      pron: "지우 장",
      sentence: "Hãy dịu dàng.",
      spron: "하이 지우 장",
      bcp47: "vi-VN"
    },
    "절제": {
      word: "Tự chủ",
      pron: "뜨 추",
      sentence: "Hãy tự chủ.",
      spron: "하이 뜨 추",
      bcp47: "vi-VN"
    }
  },
  Thai: {
    "사랑": {
      word: "ความรัก",
      pron: "쾀 락",
      sentence: "ฉันรักคุณ",
      spron: "찬 락 쿤",
      bcp47: "th-TH"
    },
    "감사": {
      word: "ขอบคุณ",
      pron: "컵 쿤",
      sentence: "ขอบคุณมาก",
      spron: "컵 쿤 막",
      bcp47: "th-TH"
    },
    "기쁨": {
      word: "ความสุข",
      pron: "쾀 숙",
      sentence: "มีความสุข",
      spron: "미 쾀 숙",
      bcp47: "th-TH"
    },
    "용기": {
      word: "ความกล้าหาญ",
      pron: "쾀 끌라 한",
      sentence: "จงกล้าหาญ",
      spron: "쫑 끌라 한",
      bcp47: "th-TH"
    },
    "겸손": {
      word: "ความถ่อมตน",
      pron: "쾀 텀 똔",
      sentence: "จงถ่อมตน",
      spron: "쫑 텀 똔",
      bcp47: "th-TH"
    },
    "오래참음": {
      word: "ความอดทน",
      pron: "쾀 옫 톤",
      sentence: "จงอดทน",
      spron: "쫑 옫 톤",
      bcp47: "th-TH"
    },
    "친절": {
      word: "ความเมตตา",
      pron: "쾀 멛 따",
      sentence: "จงเมตตา",
      spron: "쫑 멛 따",
      bcp47: "th-TH"
    },
    "믿음": {
      word: "ความเชื่อ",
      pron: "쾀 츠어",
      sentence: "ฉันเชื่อในตัวคุณ",
      spron: "찬 츠어 나이 뚜아 쿤",
      bcp47: "th-TH"
    },
    "인내": {
      word: "ความพากเพียร",
      pron: "쾀 팍 피언",
      sentence: "อย่ายอมแพ้",
      spron: "야 염 패",
      bcp47: "th-TH"
    },
    "소망": {
      word: "ความหวัง",
      pron: "쾀 왕",
      sentence: "อย่าสิ้นหวัง",
      spron: "야 신 왕",
      bcp47: "th-TH"
    },
    "평화": {
      word: "สันติภาพ",
      pron: "산띠팝",
      sentence: "ขอให้สงบสุข",
      spron: "커 하이 사응옵 숙",
      bcp47: "th-TH"
    },
    "온유": {
      word: "ความอ่อนโยน",
      pron: "쾀 언 욘",
      sentence: "จงอ่อนโยน",
      spron: "쫑 언 욘",
      bcp47: "th-TH"
    },
    "절제": {
      word: "การควบคุมตน",
      pron: "깐 쿠압 쿰 똔",
      sentence: "จงควบคุมตนเอง",
      spron: "쫑 쿠압 쿰 똔 엥",
      bcp47: "th-TH"
    }
  },
  Greek: {
    "사랑": {
      word: "Αγάπη",
      pron: "아가피",
      sentence: "Σ'αγαπώ.",
      spron: "사가포",
      bcp47: "el-GR"
    },
    "감사": {
      word: "Ευχαριστώ",
      pron: "에프하리스토",
      sentence: "Ευχαριστώ πολύ.",
      spron: "에프하리스토 폴리",
      bcp47: "el-GR"
    },
    "기쁨": {
      word: "Χαρά",
      pron: "하라",
      sentence: "Τι χαρά!",
      spron: "티 하라",
      bcp47: "el-GR"
    },
    "용기": {
      word: "Θάρρος",
      pron: "사로스",
      sentence: "Να είσαι θαρραλέος.",
      spron: "나 이세 사랄레오스",
      bcp47: "el-GR"
    },
    "겸손": {
      word: "Ταπεινότητα",
      pron: "타피노티타",
      sentence: "Να είσαι ταπεινός.",
      spron: "나 이세 타피노스",
      bcp47: "el-GR"
    },
    "오래참음": {
      word: "Υπομονή",
      pron: "이포모니",
      sentence: "Κάνε υπομονή.",
      spron: "카네 이포모니",
      bcp47: "el-GR"
    },
    "친절": {
      word: "Καλοσύνη",
      pron: "칼로시니",
      sentence: "Να είσαι καλός.",
      spron: "나 이세 칼로스",
      bcp47: "el-GR"
    },
    "믿음": {
      word: "Πίστη",
      pron: "피스티",
      sentence: "Πιστεύω σε σένα.",
      spron: "피스테보 세 세나",
      bcp47: "el-GR"
    },
    "인내": {
      word: "Επιμονή",
      pron: "에피모니",
      sentence: "Μην τα παρατάς.",
      spron: "민 타 파라타스",
      bcp47: "el-GR"
    },
    "소망": {
      word: "Ελπίδα",
      pron: "엘피다",
      sentence: "Μη χάνεις την ελπίδα.",
      spron: "미 하니스 틴 엘피다",
      bcp47: "el-GR"
    },
    "평화": {
      word: "Ειρήνη",
      pron: "이리니",
      sentence: "Ειρήνη σε σένα.",
      spron: "이리니 세 세나",
      bcp47: "el-GR"
    },
    "온유": {
      word: "Πραότητα",
      pron: "프라오티타",
      sentence: "Να είσαι ήπιος.",
      spron: "나 이세 이피오스",
      bcp47: "el-GR"
    },
    "절제": {
      word: "Αυτοέλεγχος",
      pron: "아프토엘렝호스",
      sentence: "Έλεγξε τον εαυτό σου.",
      spron: "엘렝크세 톤 에아프토 수",
      bcp47: "el-GR"
    }
  },
  Swedish: {
    "사랑": {
      word: "Kärlek",
      pron: "셰를레크",
      sentence: "Jag älskar dig.",
      spron: "야 엘스카르 데이",
      bcp47: "sv-SE"
    },
    "감사": {
      word: "Tack",
      pron: "탁",
      sentence: "Tack så mycket.",
      spron: "탁 소 뮈케",
      bcp47: "sv-SE"
    },
    "기쁨": {
      word: "Glädje",
      pron: "글레드예",
      sentence: "Vilken glädje!",
      spron: "빌켄 글레드예",
      bcp47: "sv-SE"
    },
    "용기": {
      word: "Mod",
      pron: "무드",
      sentence: "Var modig.",
      spron: "바르 무디",
      bcp47: "sv-SE"
    },
    "겸손": {
      word: "Ödmjukhet",
      pron: "외드뮤크헤트",
      sentence: "Var ödmjuk.",
      spron: "바르 외드뮤크",
      bcp47: "sv-SE"
    },
    "오래참음": {
      word: "Tålamod",
      pron: "톨라무드",
      sentence: "Ha tålamod.",
      spron: "하 톨라무드",
      bcp47: "sv-SE"
    },
    "친절": {
      word: "Vänlighet",
      pron: "벤리헤트",
      sentence: "Var snäll.",
      spron: "바르 스넬",
      bcp47: "sv-SE"
    },
    "믿음": {
      word: "Tro",
      pron: "트루",
      sentence: "Jag tror på dig.",
      spron: "야 트루르 포 데이",
      bcp47: "sv-SE"
    },
    "인내": {
      word: "Uthållighet",
      pron: "우트홀리헤트",
      sentence: "Ge inte upp.",
      spron: "예 인테 업",
      bcp47: "sv-SE"
    },
    "소망": {
      word: "Hopp",
      pron: "홉",
      sentence: "Förlora inte hoppet.",
      spron: "푀를루라 인테 호페트",
      bcp47: "sv-SE"
    },
    "평화": {
      word: "Fred",
      pron: "프레드",
      sentence: "Frid vare med dig.",
      spron: "프리드 바레 메드 데이",
      bcp47: "sv-SE"
    },
    "온유": {
      word: "Mildhet",
      pron: "밀드헤트",
      sentence: "Var mild.",
      spron: "바르 밀드",
      bcp47: "sv-SE"
    },
    "절제": {
      word: "Självbehärskning",
      pron: "셸브베헤르스크닝",
      sentence: "Behärska dig.",
      spron: "베헤르스카 데이",
      bcp47: "sv-SE"
    }
  },
  Indonesian: {
    "사랑": {
      word: "Cinta",
      pron: "찐따",
      sentence: "Aku cinta kamu.",
      spron: "아꾸 찐따 까무",
      bcp47: "id-ID"
    },
    "감사": {
      word: "Terima kasih",
      pron: "뜨리마 까시",
      sentence: "Terima kasih banyak.",
      spron: "뜨리마 까시 바냑",
      bcp47: "id-ID"
    },
    "기쁨": {
      word: "Sukacita",
      pron: "수까찌따",
      sentence: "Betapa gembiranya!",
      spron: "브따빠 금비라냐",
      bcp47: "id-ID"
    },
    "용기": {
      word: "Keberanian",
      pron: "끄브라니안",
      sentence: "Beranilah.",
      spron: "브라니라",
      bcp47: "id-ID"
    },
    "겸손": {
      word: "Kerendahan hati",
      pron: "끄른다한 하띠",
      sentence: "Rendah hatilah.",
      spron: "른다 하띠라",
      bcp47: "id-ID"
    },
    "오래참음": {
      word: "Kesabaran",
      pron: "끄사바란",
      sentence: "Bersabarlah.",
      spron: "브르사바를라",
      bcp47: "id-ID"
    },
    "친절": {
      word: "Kebaikan",
      pron: "끄바이깐",
      sentence: "Berbaik hatilah.",
      spron: "브르바익 하띠라",
      bcp47: "id-ID"
    },
    "믿음": {
      word: "Iman",
      pron: "이만",
      sentence: "Aku percaya padamu.",
      spron: "아꾸 쁘르짜야 빠다무",
      bcp47: "id-ID"
    },
    "인내": {
      word: "Ketekunan",
      pron: "끄뜨꾸난",
      sentence: "Jangan menyerah.",
      spron: "장안 므녀라",
      bcp47: "id-ID"
    },
    "소망": {
      word: "Harapan",
      pron: "하라빤",
      sentence: "Jangan kehilangan harapan.",
      spron: "장안 끄힐랑안 하라빤",
      bcp47: "id-ID"
    },
    "평화": {
      word: "Damai",
      pron: "다마이",
      sentence: "Damai besertamu.",
      spron: "다마이 브스르따무",
      bcp47: "id-ID"
    },
    "온유": {
      word: "Kelembutan",
      pron: "끌름부딴",
      sentence: "Lembutlah.",
      spron: "름부뜨라",
      bcp47: "id-ID"
    },
    "절제": {
      word: "Pengendalian diri",
      pron: "쁭은달리안 디리",
      sentence: "Kendalikan dirimu.",
      spron: "끈달리깐 디리무",
      bcp47: "id-ID"
    }
  },
  Turkish: {
    "사랑": {
      word: "Sevgi",
      pron: "세브기",
      sentence: "Seni seviyorum.",
      spron: "세니 세비요룸",
      bcp47: "tr-TR"
    },
    "감사": {
      word: "Teşekkür",
      pron: "테셰퀴르",
      sentence: "Çok teşekkürler.",
      spron: "촉 테셰퀴를레르",
      bcp47: "tr-TR"
    },
    "기쁨": {
      word: "Sevinç",
      pron: "세빈치",
      sentence: "Ne sevinç!",
      spron: "네 세빈치",
      bcp47: "tr-TR"
    },
    "용기": {
      word: "Cesaret",
      pron: "제사렛",
      sentence: "Cesur ol.",
      spron: "제수르 올",
      bcp47: "tr-TR"
    },
    "겸손": {
      word: "Alçakgönüllülük",
      pron: "알착괴뉠뤼륙",
      sentence: "Mütevazı ol.",
      spron: "뮈테바즈 올",
      bcp47: "tr-TR"
    },
    "오래참음": {
      word: "Sabır",
      pron: "사브르",
      sentence: "Sabırlı ol.",
      spron: "사브를르 올",
      bcp47: "tr-TR"
    },
    "친절": {
      word: "Nezaket",
      pron: "네자켓",
      sentence: "Nazik ol.",
      spron: "나직 올",
      bcp47: "tr-TR"
    },
    "믿음": {
      word: "İnanç",
      pron: "이난치",
      sentence: "Sana inanıyorum.",
      spron: "사나 이나느요룸",
      bcp47: "tr-TR"
    },
    "인내": {
      word: "Azim",
      pron: "아짐",
      sentence: "Asla pes etme.",
      spron: "아슬라 페스 에트메",
      bcp47: "tr-TR"
    },
    "소망": {
      word: "Umut",
      pron: "우뭇",
      sentence: "Umudunu kaybetme.",
      spron: "우무두누 카이베트메",
      bcp47: "tr-TR"
    },
    "평화": {
      word: "Barış",
      pron: "바르시",
      sentence: "Selam sana.",
      spron: "셀람 사나",
      bcp47: "tr-TR"
    },
    "온유": {
      word: "Yumuşaklık",
      pron: "유무샤클르크",
      sentence: "Yumuşak ol.",
      spron: "유무샤크 올",
      bcp47: "tr-TR"
    },
    "절제": {
      word: "Öz denetim",
      pron: "외즈 데네팀",
      sentence: "Kendini kontrol et.",
      spron: "켄디니 콘트롤 엣",
      bcp47: "tr-TR"
    }
  },
  Polish: {
    "사랑": {
      word: "Miłość",
      pron: "미워시치",
      sentence: "Kocham cię.",
      spron: "코함 치에",
      bcp47: "pl-PL"
    },
    "감사": {
      word: "Dziękuję",
      pron: "지엥쿠예",
      sentence: "Dziękuję bardzo.",
      spron: "지엥쿠예 바르조",
      bcp47: "pl-PL"
    },
    "기쁨": {
      word: "Radość",
      pron: "라도시치",
      sentence: "Co za radość!",
      spron: "초 자 라도시치",
      bcp47: "pl-PL"
    },
    "용기": {
      word: "Odwaga",
      pron: "오드바가",
      sentence: "Bądź odważny.",
      spron: "본지 오드바주니",
      bcp47: "pl-PL"
    },
    "겸손": {
      word: "Pokora",
      pron: "포코라",
      sentence: "Bądź pokorny.",
      spron: "본지 포코르니",
      bcp47: "pl-PL"
    },
    "오래참음": {
      word: "Cierpliwość",
      pron: "치에르플리보시치",
      sentence: "Bądź cierpliwy.",
      spron: "본지 치에르플리비",
      bcp47: "pl-PL"
    },
    "친절": {
      word: "Życzliwość",
      pron: "지치플리보시치",
      sentence: "Bądź miły.",
      spron: "본지 미위",
      bcp47: "pl-PL"
    },
    "믿음": {
      word: "Wiara",
      pron: "비아라",
      sentence: "Wierzę w ciebie.",
      spron: "비에제 프 치에비에",
      bcp47: "pl-PL"
    },
    "인내": {
      word: "Wytrwałość",
      pron: "비트르바워시치",
      sentence: "Nie poddawaj się.",
      spron: "니에 포다바이 시에",
      bcp47: "pl-PL"
    },
    "소망": {
      word: "Nadzieja",
      pron: "나지에야",
      sentence: "Nie trać nadziei.",
      spron: "니에 트라치 나지에이",
      bcp47: "pl-PL"
    },
    "평화": {
      word: "Pokój",
      pron: "포쿠이",
      sentence: "Pokój z tobą.",
      spron: "포쿠이 즈 토봉",
      bcp47: "pl-PL"
    },
    "온유": {
      word: "Łagodność",
      pron: "와고드노시치",
      sentence: "Bądź łagodny.",
      spron: "본지 와고드니",
      bcp47: "pl-PL"
    },
    "절제": {
      word: "Samokontrola",
      pron: "사모콘트롤라",
      sentence: "Panuj nad sobą.",
      spron: "파누이 나드 소봉",
      bcp47: "pl-PL"
    }
  },
  Ukrainian: {
    "사랑": {
      word: "Любов",
      pron: "류보우",
      sentence: "Я тебе люблю.",
      spron: "야 테베 류블류",
      bcp47: "uk-UA"
    },
    "감사": {
      word: "Дякую",
      pron: "댜쿠유",
      sentence: "Дуже дякую.",
      spron: "두제 댜쿠유",
      bcp47: "uk-UA"
    },
    "기쁨": {
      word: "Радість",
      pron: "라디스치",
      sentence: "Яка радість!",
      spron: "야카 라디스치",
      bcp47: "uk-UA"
    },
    "용기": {
      word: "Мужність",
      pron: "무즈니스치",
      sentence: "Будь сміливим.",
      spron: "부지 스밀리윔",
      bcp47: "uk-UA"
    },
    "겸손": {
      word: "Смиренність",
      pron: "스미렌니스치",
      sentence: "Будь скромним.",
      spron: "부지 스크롬님",
      bcp47: "uk-UA"
    },
    "오래참음": {
      word: "Терпіння",
      pron: "테르핀냐",
      sentence: "Май терпіння.",
      spron: "마이 테르핀냐",
      bcp47: "uk-UA"
    },
    "친절": {
      word: "Доброта",
      pron: "도브로타",
      sentence: "Будь добрим.",
      spron: "부지 도브림",
      bcp47: "uk-UA"
    },
    "믿음": {
      word: "Віра",
      pron: "비라",
      sentence: "Я вірю в тебе.",
      spron: "야 비류 우 테베",
      bcp47: "uk-UA"
    },
    "인내": {
      word: "Наполегливість",
      pron: "나폴레흘리비스치",
      sentence: "Не здавайся.",
      spron: "네 즈다바이샤",
      bcp47: "uk-UA"
    },
    "소망": {
      word: "Надія",
      pron: "나디야",
      sentence: "Не втрачай надії.",
      spron: "네 우트라차이 나디이",
      bcp47: "uk-UA"
    },
    "평화": {
      word: "Мир",
      pron: "미르",
      sentence: "Мир тобі.",
      spron: "미르 토비",
      bcp47: "uk-UA"
    },
    "온유": {
      word: "Лагідність",
      pron: "라히드니스치",
      sentence: "Будь лагідним.",
      spron: "부지 라히드님",
      bcp47: "uk-UA"
    },
    "절제": {
      word: "Самовладання",
      pron: "사모블라단냐",
      sentence: "Володій собою.",
      spron: "볼로디 소보유",
      bcp47: "uk-UA"
    }
  },
  Czech: {
    "사랑": {
      word: "Láska",
      pron: "라스카",
      sentence: "Miluji tě.",
      spron: "밀루이 테",
      bcp47: "cs-CZ"
    },
    "감사": {
      word: "Děkuji",
      pron: "뎨쿠이",
      sentence: "Děkuji moc.",
      spron: "뎨쿠이 모츠",
      bcp47: "cs-CZ"
    },
    "기쁨": {
      word: "Radost",
      pron: "라도스트",
      sentence: "Jaká radost!",
      spron: "야카 라도스트",
      bcp47: "cs-CZ"
    },
    "용기": {
      word: "Odvaha",
      pron: "오드바하",
      sentence: "Buď statečný.",
      spron: "부지 스타테치니",
      bcp47: "cs-CZ"
    },
    "겸손": {
      word: "Pokora",
      pron: "포코라",
      sentence: "Buď pokorný.",
      spron: "부지 포코르니",
      bcp47: "cs-CZ"
    },
    "오래참음": {
      word: "Trpělivost",
      pron: "트르펠리보스트",
      sentence: "Buď trpělivý.",
      spron: "부지 트르펠리비",
      bcp47: "cs-CZ"
    },
    "친절": {
      word: "Laskavost",
      pron: "라스카보스트",
      sentence: "Buď laskavý.",
      spron: "부지 라스카비",
      bcp47: "cs-CZ"
    },
    "믿음": {
      word: "Víra",
      pron: "비라",
      sentence: "Věřím ti.",
      spron: "베르짐 티",
      bcp47: "cs-CZ"
    },
    "인내": {
      word: "Vytrvalost",
      pron: "비트르발로스트",
      sentence: "Nevzdávej se.",
      spron: "네브즈다베이 세",
      bcp47: "cs-CZ"
    },
    "소망": {
      word: "Naděje",
      pron: "나뎨예",
      sentence: "Neztrácej naději.",
      spron: "네즈트라체이 나뎨이",
      bcp47: "cs-CZ"
    },
    "평화": {
      word: "Mír",
      pron: "미르",
      sentence: "Mír s tebou.",
      spron: "미르 스 테보우",
      bcp47: "cs-CZ"
    },
    "온유": {
      word: "Mírnost",
      pron: "미르노스트",
      sentence: "Buď jemný.",
      spron: "부지 옘니",
      bcp47: "cs-CZ"
    },
    "절제": {
      word: "Sebeovládání",
      pron: "세베오블라다니",
      sentence: "Ovládej se.",
      spron: "오블라데이 세",
      bcp47: "cs-CZ"
    }
  },
  Norwegian: {
    "사랑": {
      word: "Kjærlighet",
      pron: "셰를리헤트",
      sentence: "Jeg er glad i deg.",
      spron: "야이 에르 글라 이 다이",
      bcp47: "nb-NO"
    },
    "감사": {
      word: "Takk",
      pron: "탁",
      sentence: "Tusen takk.",
      spron: "투센 탁",
      bcp47: "nb-NO"
    },
    "기쁨": {
      word: "Glede",
      pron: "글레데",
      sentence: "For en glede!",
      spron: "포르 엔 글레데",
      bcp47: "nb-NO"
    },
    "용기": {
      word: "Mot",
      pron: "무트",
      sentence: "Vær modig.",
      spron: "베르 무디",
      bcp47: "nb-NO"
    },
    "겸손": {
      word: "Ydmykhet",
      pron: "위드뮈크헤트",
      sentence: "Vær ydmyk.",
      spron: "베르 위드뮈크",
      bcp47: "nb-NO"
    },
    "오래참음": {
      word: "Tålmodighet",
      pron: "톨모디헤트",
      sentence: "Ha tålmodighet.",
      spron: "하 톨모디헤트",
      bcp47: "nb-NO"
    },
    "친절": {
      word: "Vennlighet",
      pron: "벤리헤트",
      sentence: "Vær snill.",
      spron: "베르 스닐",
      bcp47: "nb-NO"
    },
    "믿음": {
      word: "Tro",
      pron: "트루",
      sentence: "Jeg tror på deg.",
      spron: "야이 트루르 포 다이",
      bcp47: "nb-NO"
    },
    "인내": {
      word: "Utholdenhet",
      pron: "우트홀덴헤트",
      sentence: "Ikke gi opp.",
      spron: "이케 이 옵",
      bcp47: "nb-NO"
    },
    "소망": {
      word: "Håp",
      pron: "홉",
      sentence: "Mist ikke håpet.",
      spron: "미스트 이케 호페트",
      bcp47: "nb-NO"
    },
    "평화": {
      word: "Fred",
      pron: "프레드",
      sentence: "Fred være med deg.",
      spron: "프레드 베레 메 다이",
      bcp47: "nb-NO"
    },
    "온유": {
      word: "Mildhet",
      pron: "밀헤트",
      sentence: "Vær mild.",
      spron: "베르 밀",
      bcp47: "nb-NO"
    },
    "절제": {
      word: "Selvkontroll",
      pron: "셀브콘트롤",
      sentence: "Behersk deg.",
      spron: "베헤르스크 다이",
      bcp47: "nb-NO"
    }
  },
  Danish: {
    "사랑": {
      word: "Kærlighed",
      pron: "케를리헤드",
      sentence: "Jeg elsker dig.",
      spron: "야이 엘스커 다이",
      bcp47: "da-DK"
    },
    "감사": {
      word: "Tak",
      pron: "탁",
      sentence: "Mange tak.",
      spron: "망에 탁",
      bcp47: "da-DK"
    },
    "기쁨": {
      word: "Glæde",
      pron: "글레데",
      sentence: "Sikke en glæde!",
      spron: "시케 엔 글레데",
      bcp47: "da-DK"
    },
    "용기": {
      word: "Mod",
      pron: "모드",
      sentence: "Vær modig.",
      spron: "베르 모디",
      bcp47: "da-DK"
    },
    "겸손": {
      word: "Ydmyghed",
      pron: "위드뮈헤드",
      sentence: "Vær ydmyg.",
      spron: "베르 위드뮈",
      bcp47: "da-DK"
    },
    "오래참음": {
      word: "Tålmodighed",
      pron: "톨모디헤드",
      sentence: "Hav tålmodighed.",
      spron: "하우 톨모디헤드",
      bcp47: "da-DK"
    },
    "친절": {
      word: "Venlighed",
      pron: "벤리헤드",
      sentence: "Vær venlig.",
      spron: "베르 벤리",
      bcp47: "da-DK"
    },
    "믿음": {
      word: "Tro",
      pron: "트로",
      sentence: "Jeg tror på dig.",
      spron: "야이 트로르 포 다이",
      bcp47: "da-DK"
    },
    "인내": {
      word: "Udholdenhed",
      pron: "우드홀덴헤드",
      sentence: "Giv ikke op.",
      spron: "기우 이케 옵",
      bcp47: "da-DK"
    },
    "소망": {
      word: "Håb",
      pron: "호브",
      sentence: "Mist ikke håbet.",
      spron: "미스트 이케 호베트",
      bcp47: "da-DK"
    },
    "평화": {
      word: "Fred",
      pron: "프레드",
      sentence: "Fred være med dig.",
      spron: "프레드 베레 메 다이",
      bcp47: "da-DK"
    },
    "온유": {
      word: "Mildhed",
      pron: "밀헤드",
      sentence: "Vær mild.",
      spron: "베르 밀",
      bcp47: "da-DK"
    },
    "절제": {
      word: "Selvkontrol",
      pron: "셀브콘트롤",
      sentence: "Behersk dig.",
      spron: "베헤르스크 다이",
      bcp47: "da-DK"
    }
  },
  Romanian: {
    "사랑": {
      word: "Iubire",
      pron: "이우비레",
      sentence: "Te iubesc.",
      spron: "테 이우베스크",
      bcp47: "ro-RO"
    },
    "감사": {
      word: "Mulțumesc",
      pron: "물추메스크",
      sentence: "Mulțumesc mult.",
      spron: "물추메스크 물트",
      bcp47: "ro-RO"
    },
    "기쁨": {
      word: "Bucurie",
      pron: "부쿠리에",
      sentence: "Ce bucurie!",
      spron: "체 부쿠리에",
      bcp47: "ro-RO"
    },
    "용기": {
      word: "Curaj",
      pron: "쿠라지",
      sentence: "Fii curajos.",
      spron: "피 쿠라조스",
      bcp47: "ro-RO"
    },
    "겸손": {
      word: "Smerenie",
      pron: "스메레니에",
      sentence: "Fii modest.",
      spron: "피 모데스트",
      bcp47: "ro-RO"
    },
    "오래참음": {
      word: "Răbdare",
      pron: "르브다레",
      sentence: "Ai răbdare.",
      spron: "아이 르브다레",
      bcp47: "ro-RO"
    },
    "친절": {
      word: "Bunătate",
      pron: "부너타테",
      sentence: "Fii bun.",
      spron: "피 분",
      bcp47: "ro-RO"
    },
    "믿음": {
      word: "Credință",
      pron: "크레딘처",
      sentence: "Cred în tine.",
      spron: "크레드 은 티네",
      bcp47: "ro-RO"
    },
    "인내": {
      word: "Perseverență",
      pron: "페르세베렌처",
      sentence: "Nu renunța.",
      spron: "누 레눈차",
      bcp47: "ro-RO"
    },
    "소망": {
      word: "Speranță",
      pron: "스페란처",
      sentence: "Nu-ți pierde speranța.",
      spron: "누치 피에르데 스페란차",
      bcp47: "ro-RO"
    },
    "평화": {
      word: "Pace",
      pron: "파체",
      sentence: "Pace ție.",
      spron: "파체 치에",
      bcp47: "ro-RO"
    },
    "온유": {
      word: "Blândețe",
      pron: "블른데체",
      sentence: "Fii blând.",
      spron: "피 블른드",
      bcp47: "ro-RO"
    },
    "절제": {
      word: "Autocontrol",
      pron: "아우토콘트롤",
      sentence: "Stăpânește-te.",
      spron: "스트파네슈테테",
      bcp47: "ro-RO"
    }
  },
  Hungarian: {
    "사랑": {
      word: "Szeretet",
      pron: "세레테트",
      sentence: "Szeretlek.",
      spron: "세레틀레크",
      bcp47: "hu-HU"
    },
    "감사": {
      word: "Köszönöm",
      pron: "쾨쇠뇜",
      sentence: "Nagyon köszönöm.",
      spron: "너존 쾨쇠뇜",
      bcp47: "hu-HU"
    },
    "기쁨": {
      word: "Öröm",
      pron: "외뢲",
      sentence: "Micsoda öröm!",
      spron: "미초더 외뢲",
      bcp47: "hu-HU"
    },
    "용기": {
      word: "Bátorság",
      pron: "바토르샤그",
      sentence: "Légy bátor.",
      spron: "레지 바토르",
      bcp47: "hu-HU"
    },
    "겸손": {
      word: "Alázat",
      pron: "얼라저트",
      sentence: "Légy szerény.",
      spron: "레지 세레니",
      bcp47: "hu-HU"
    },
    "오래참음": {
      word: "Türelem",
      pron: "튀렐렘",
      sentence: "Légy türelmes.",
      spron: "레지 튀렐메시",
      bcp47: "hu-HU"
    },
    "친절": {
      word: "Kedvesség",
      pron: "케드베슈셰그",
      sentence: "Légy kedves.",
      spron: "레지 케드베시",
      bcp47: "hu-HU"
    },
    "믿음": {
      word: "Hit",
      pron: "히트",
      sentence: "Hiszek benned.",
      spron: "히세크 벤네드",
      bcp47: "hu-HU"
    },
    "인내": {
      word: "Kitartás",
      pron: "키터르타시",
      sentence: "Ne add fel.",
      spron: "네 어드 펠",
      bcp47: "hu-HU"
    },
    "소망": {
      word: "Remény",
      pron: "레메니",
      sentence: "Ne veszítsd el a reményt.",
      spron: "네 베시츠드 엘 어 레메니트",
      bcp47: "hu-HU"
    },
    "평화": {
      word: "Béke",
      pron: "베케",
      sentence: "Béke veled.",
      spron: "베케 벨레드",
      bcp47: "hu-HU"
    },
    "온유": {
      word: "Szelídség",
      pron: "셀리드셰그",
      sentence: "Légy szelíd.",
      spron: "레지 셀리드",
      bcp47: "hu-HU"
    },
    "절제": {
      word: "Önuralom",
      pron: "외누럴롬",
      sentence: "Uralkodj magadon.",
      spron: "우럴코지 머거돈",
      bcp47: "hu-HU"
    }
  },
  "Persian (Farsi)": {
    "사랑": {
      word: "عشق",
      pron: "에슈크",
      sentence: "دوستت دارم",
      spron: "두스테트 다람",
      bcp47: "fa-IR"
    },
    "감사": {
      word: "تشکر",
      pron: "타샤코르",
      sentence: "خیلی ممنون",
      spron: "킬리 맘눈",
      bcp47: "fa-IR"
    },
    "기쁨": {
      word: "شادی",
      pron: "샤디",
      sentence: "چه شادی‌ای!",
      spron: "체 샤디이",
      bcp47: "fa-IR"
    },
    "용기": {
      word: "شجاعت",
      pron: "쇼자아트",
      sentence: "شجاع باش",
      spron: "쇼자 바슈",
      bcp47: "fa-IR"
    },
    "겸손": {
      word: "فروتنی",
      pron: "포루타니",
      sentence: "فروتن باش",
      spron: "포루탄 바슈",
      bcp47: "fa-IR"
    },
    "오래참음": {
      word: "صبر",
      pron: "사브르",
      sentence: "صبور باش",
      spron: "사부르 바슈",
      bcp47: "fa-IR"
    },
    "친절": {
      word: "مهربانی",
      pron: "메흐라바니",
      sentence: "مهربان باش",
      spron: "메흐라반 바슈",
      bcp47: "fa-IR"
    },
    "믿음": {
      word: "ایمان",
      pron: "이만",
      sentence: "به تو ایمان دارم",
      spron: "베 토 이만 다람",
      bcp47: "fa-IR"
    },
    "인내": {
      word: "استقامت",
      pron: "에스테가마트",
      sentence: "تسلیم نشو",
      spron: "타슬림 나쇼",
      bcp47: "fa-IR"
    },
    "소망": {
      word: "امید",
      pron: "오미드",
      sentence: "امیدت را از دست نده",
      spron: "오미데트 라 아즈 다스트 나데",
      bcp47: "fa-IR"
    },
    "평화": {
      word: "صلح",
      pron: "솔흐",
      sentence: "صلح بر تو",
      spron: "솔흐 바르 토",
      bcp47: "fa-IR"
    },
    "온유": {
      word: "ملایمت",
      pron: "몰라예마트",
      sentence: "ملایم باش",
      spron: "몰라옘 바슈",
      bcp47: "fa-IR"
    },
    "절제": {
      word: "خویشتن‌داری",
      pron: "코이슈탄다리",
      sentence: "خودت را کنترل کن",
      spron: "코다트 라 콘트롤 콘",
      bcp47: "fa-IR"
    }
  }
};

// 나라의 주요 언어(lang)를 보고 VTRANS에서 쓸 언어 키를 찾는다.
// 못 찾으면 null → "함께 찾아봐요" 처리.
const VLANG_HAVE = ["Korean", "English", "Spanish", "French", "Arabic", "Chinese", "Japanese", "German", "Portuguese", "Russian", "Italian", "Dutch", "Vietnamese", "Thai", "Greek", "Swedish", "Indonesian", "Turkish", "Polish", "Ukrainian", "Czech", "Norwegian", "Danish", "Romanian", "Hungarian", "Persian (Farsi)"];
function matchVLang(lang) {
  if (!lang || lang === "—") return null;
  for (const h of VLANG_HAVE) {
    if (lang.indexOf(h) >= 0) return h;
  }
  // 남미 원주민어 표기 나라(페루·볼리비아 등)는 실제 스페인어 통용 → 보정
  if (/Quechua|Aymara|Guaran/.test(lang)) return "Spanish";
  return null;
}
function getVirtueData(c, virtue) {
  const key = matchVLang(c.lang);
  if (key && VTRANS[key] && VTRANS[key][virtue]) return VTRANS[key][virtue];
  return null;
}
const COUNTRIES = [{
  "i": "CS-KM",
  "en": "Kosovo",
  "d": "M557.7,133.2 557.5,133.8 557.2,133.7 557.0,132.7 556.3,132.4 555.8,131.7 556.3,131.1 556.9,130.9 557.3,130.0 557.8,129.8 558.2,130.2 558.7,130.4 559.1,130.8 559.6,130.9 560.1,131.5 560.5,131.4 560.2,132.1 559.8,132.4 559.9,132.7 559.3,132.8 557.7,133.2Z",
  "cx": 558.2,
  "cy": 131.8,
  "n": "Kosovo",
  "ct": "유럽",
  "cap": "—",
  "fl": "",
  "lang": "—",
  "cur": "—",
  "bb": [555.8, 129.8, 560.5, 133.8],
  "ci": [],
  "lat": null,
  "lng": null,
  "area": null,
  "areaR": null,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "-99",
  "en": "Northern Cyprus",
  "d": "M590.9,152.4 591.1,152.4 591.5,151.7 593.5,151.7 596.0,150.9 594.2,152.1 594.4,152.6 594.1,152.5 593.5,152.7 593.1,152.7 593.0,152.8 592.9,152.5 592.7,152.3 592.2,152.3 591.4,152.5 590.9,152.4Z",
  "cx": 592.8,
  "cy": 152.3,
  "n": "Northern Cyprus",
  "ct": "유럽",
  "cap": "—",
  "fl": "",
  "lang": "—",
  "cur": "—",
  "bb": [590.9, 150.9, 596.0, 152.8],
  "ci": [],
  "lat": null,
  "lng": null,
  "area": null,
  "areaR": null,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "-99",
  "en": "Somaliland",
  "d": "M635.9,223.7 634.7,225.5 632.7,227.8 630.4,227.8 621.3,224.5 620.3,223.5 619.2,222.2 618.2,220.6 618.8,219.6 619.8,218.2 620.8,218.7 621.3,219.8 622.5,221.0 623.9,221.0 626.5,220.3 629.6,220.0 632.0,219.1 633.4,218.9 634.4,218.4 636.0,218.3 635.9,219.5 635.9,222.3 635.9,223.7Z",
  "cx": 627.8,
  "cy": 221.5,
  "n": "Somaliland",
  "ct": "아프리카",
  "cap": "—",
  "fl": "",
  "lang": "—",
  "cur": "—",
  "bb": [618.2, 218.2, 636.0, 227.8],
  "ci": [],
  "lat": null,
  "lng": null,
  "area": null,
  "areaR": null,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "GHA",
  "en": "Ghana",
  "d": "M502.9,233.5 498.6,235.2 497.0,236.1 494.5,236.9 492.1,236.1 492.2,235.0 491.0,232.6 491.7,229.5 492.9,227.2 492.1,223.2 491.8,221.1 491.8,219.5 496.7,219.4 497.9,219.6 498.8,219.2 500.1,219.4 499.9,220.3 501.0,221.7 501.0,223.7 501.3,225.9 502.0,226.9 501.4,229.4 501.6,230.8 502.3,232.6 502.9,233.5Z",
  "cx": 497.4,
  "cy": 227.5,
  "n": "가나",
  "ct": "아프리카",
  "cap": "Accra",
  "fl": "🇬🇭",
  "lang": "English",
  "cur": "Ghanaian cedi",
  "bb": [491.0, 219.2, 502.9, 236.9],
  "ci": [{
    "n": "Accra",
    "x": 499.4,
    "y": 234.6,
    "c": 1
  }, {
    "n": "Kumasi",
    "x": 495.5,
    "y": 231.4,
    "c": 0
  }, {
    "n": "Tamale",
    "x": 497.7,
    "y": 223.9,
    "c": 0
  }, {
    "n": "Takoradi",
    "x": 495.1,
    "y": 236.4,
    "c": 0
  }, {
    "n": "Achiaman",
    "x": 499.1,
    "y": 234.2,
    "c": 0
  }, {
    "n": "Tema",
    "x": 500.0,
    "y": 234.4,
    "c": 0
  }, {
    "n": "Teshi",
    "x": 499.7,
    "y": 234.5,
    "c": 0
  }, {
    "n": "Cape Coast",
    "x": 496.5,
    "y": 235.8,
    "c": 0
  }, {
    "n": "Sekondi",
    "x": 495.3,
    "y": 236.3,
    "c": 0
  }],
  "lat": 8,
  "lng": -2,
  "area": 238533,
  "areaR": 83,
  "pop": 34427414,
  "popR": 47,
  "gdp": 76370394412,
  "gdpR": 83,
  "pc": 2218,
  "lvl": "중하위 소득"
}, {
  "i": "GAB",
  "en": "Gabon",
  "d": "M530.8,261.1 528.0,258.2 526.1,256.0 524.4,253.1 524.5,252.2 525.1,251.3 525.8,249.3 526.4,247.2 527.3,247.0 531.3,247.1 531.3,243.7 532.6,243.5 534.3,243.9 536.0,243.6 536.3,243.7 536.1,244.9 536.9,246.3 539.0,246.1 539.7,246.7 538.5,249.9 539.8,251.5 540.1,253.7 539.7,255.6 538.9,256.9 536.4,256.7 534.9,255.4 534.7,256.6 532.8,257.0 531.9,257.7 532.9,259.5 530.8,261.1Z",
  "cx": 533.0,
  "cy": 251.5,
  "n": "가봉",
  "ct": "아프리카",
  "cap": "Libreville",
  "fl": "🇬🇦",
  "lang": "French",
  "cur": "Central African CFA franc",
  "bb": [524.4, 243.5, 540.1, 261.1],
  "ci": [{
    "n": "Libreville",
    "x": 526.2,
    "y": 248.9,
    "c": 1
  }, {
    "n": "Port-Gentil",
    "x": 524.4,
    "y": 252.0,
    "c": 0
  }, {
    "n": "Franceville",
    "x": 537.7,
    "y": 254.5,
    "c": 0
  }, {
    "n": "Oyem",
    "x": 532.2,
    "y": 245.5,
    "c": 0
  }, {
    "n": "Moanda",
    "x": 536.7,
    "y": 254.4,
    "c": 0
  }, {
    "n": "Mouila",
    "x": 530.6,
    "y": 255.2,
    "c": 0
  }, {
    "n": "Lambarene",
    "x": 528.4,
    "y": 251.9,
    "c": 0
  }, {
    "n": "Tchibanga",
    "x": 530.6,
    "y": 257.9,
    "c": 0
  }, {
    "n": "Koulamoutou",
    "x": 534.7,
    "y": 253.1,
    "c": 0
  }],
  "lat": -1,
  "lng": 11.8,
  "area": 267668,
  "areaR": 78,
  "pop": 2538952,
  "popR": 142,
  "gdp": 20516134389,
  "gdpR": 123,
  "pc": 8081,
  "lvl": "중상위 소득"
}, {
  "i": "GUY",
  "en": "Guyana",
  "d": "M334.0,226.8 335.8,227.8 337.5,229.6 337.6,231.0 338.7,231.1 340.2,232.4 341.3,233.4 340.8,235.9 339.1,236.6 339.3,237.3 338.8,238.7 340.0,240.7 340.9,240.7 341.2,242.3 342.9,244.7 342.3,244.8 340.7,244.6 339.8,245.3 338.6,245.8 337.7,245.9 337.4,246.5 336.0,246.3 334.3,245.0 334.1,243.8 333.4,242.3 333.8,240.0 334.6,239.0 334.0,237.7 333.0,237.3 333.4,236.1 332.7,235.4 331.3,235.6 329.4,233.4 330.2,232.7 330.1,231.4 331.8,231.0 332.5,230.4 331.6,229.4 331.8,228.4 334.0,226.8Z",
  "cx": 336.2,
  "cy": 237.1,
  "n": "가이아나",
  "ct": "남아메리카",
  "cap": "Georgetown",
  "fl": "🇬🇾",
  "lang": "English",
  "cur": "Guyanese dollar",
  "bb": [329.4, 226.8, 342.9, 246.5],
  "ci": [{
    "n": "Georgetown",
    "x": 338.4,
    "y": 231.1,
    "c": 1
  }, {
    "n": "Linden",
    "x": 338.1,
    "y": 233.3,
    "c": 0
  }, {
    "n": "New Amsterdam",
    "x": 340.2,
    "y": 232.6,
    "c": 0
  }, {
    "n": "Bartica",
    "x": 337.2,
    "y": 232.2,
    "c": 0
  }, {
    "n": "Skeldon",
    "x": 341.3,
    "y": 233.7,
    "c": 0
  }, {
    "n": "Rosignol",
    "x": 340.2,
    "y": 232.5,
    "c": 0
  }, {
    "n": "Mahaica Village",
    "x": 339.1,
    "y": 231.4,
    "c": 0
  }, {
    "n": "Vreed en Hoop",
    "x": 338.4,
    "y": 231.1,
    "c": 0
  }, {
    "n": "Fort Wellington",
    "x": 340.0,
    "y": 232.2,
    "c": 0
  }],
  "lat": 5,
  "lng": -59,
  "area": 214969,
  "areaR": 86,
  "pop": 831087,
  "popR": 162,
  "gdp": 16786302158,
  "gdpR": 133,
  "pc": 20198,
  "lvl": "고소득"
}, {
  "i": "GMB",
  "en": "Gambia",
  "d": "M453.2,213.5 453.6,212.2 456.6,212.2 457.2,211.5 458.1,211.5 459.2,212.1 460.1,212.2 461.0,211.7 461.5,212.5 460.3,213.1 459.1,213.1 457.9,212.5 456.9,213.1 456.4,213.1 455.7,213.5 453.2,213.5Z",
  "cx": 457.5,
  "cy": 212.6,
  "n": "감비아",
  "ct": "아프리카",
  "cap": "Banjul",
  "fl": "🇬🇲",
  "lang": "English",
  "cur": "dalasi",
  "bb": [453.2, 211.5, 461.5, 213.5],
  "ci": [{
    "n": "Brikama",
    "x": 453.8,
    "y": 213.1,
    "c": 0
  }, {
    "n": "Bakau",
    "x": 453.7,
    "y": 212.6,
    "c": 0
  }, {
    "n": "Banjul",
    "x": 453.9,
    "y": 212.6,
    "c": 1
  }, {
    "n": "Farafenni",
    "x": 456.7,
    "y": 212.3,
    "c": 0
  }, {
    "n": "Lamin",
    "x": 454.4,
    "y": 212.9,
    "c": 0
  }, {
    "n": "Sukuta",
    "x": 453.6,
    "y": 212.7,
    "c": 0
  }, {
    "n": "Basse Santa Su",
    "x": 460.5,
    "y": 213.0,
    "c": 0
  }, {
    "n": "Gunjur",
    "x": 453.5,
    "y": 213.3,
    "c": 0
  }, {
    "n": "Soma",
    "x": 456.9,
    "y": 212.7,
    "c": 0
  }],
  "lat": 13.5,
  "lng": -16.6,
  "area": 10689,
  "areaR": 168,
  "pop": 2759988,
  "popR": 141,
  "gdp": 2339904157,
  "gdpR": 184,
  "pc": 848,
  "lvl": "저소득"
}, {
  "i": "GTM",
  "en": "Guatemala",
  "d": "M249.7,211.8 248.3,211.4 246.6,211.3 245.3,210.8 243.8,209.6 243.9,208.8 244.2,208.2 243.8,207.6 245.1,205.4 248.7,205.4 248.8,204.4 248.3,204.2 248.0,203.6 247.0,203.0 246.0,202.1 247.2,202.1 247.2,200.5 249.8,200.5 252.4,200.5 252.4,202.7 252.1,205.9 253.0,205.9 253.9,206.4 254.1,206.0 254.9,206.3 253.7,207.4 252.3,208.1 252.2,208.7 252.4,209.2 251.8,209.9 251.1,210.1 251.3,210.4 250.8,210.7 249.8,211.4 249.7,211.8Z",
  "cx": 249.4,
  "cy": 206.9,
  "n": "과테말라",
  "ct": "북아메리카",
  "cap": "Guatemala City",
  "fl": "🇬🇹",
  "lang": "Spanish",
  "cur": "Guatemalan quetzal",
  "bb": [243.8, 200.5, 254.9, 211.8],
  "ci": [{
    "n": "Guatemala City",
    "x": 248.5,
    "y": 209.4,
    "c": 1
  }, {
    "n": "Mixco",
    "x": 248.3,
    "y": 209.4,
    "c": 0
  }, {
    "n": "Villa Nueva",
    "x": 248.4,
    "y": 209.6,
    "c": 0
  }, {
    "n": "Petapa",
    "x": 248.5,
    "y": 209.7,
    "c": 0
  }, {
    "n": "San Juan Sacatepequez",
    "x": 248.2,
    "y": 209.1,
    "c": 0
  }, {
    "n": "Quetzaltenango",
    "x": 245.8,
    "y": 208.8,
    "c": 0
  }, {
    "n": "Villa Canales",
    "x": 248.5,
    "y": 209.8,
    "c": 0
  }, {
    "n": "Escuintla",
    "x": 247.8,
    "y": 210.3,
    "c": 0
  }, {
    "n": "Chinautla",
    "x": 248.6,
    "y": 209.1,
    "c": 0
  }],
  "lat": 15.5,
  "lng": -90.2,
  "area": 108889,
  "areaR": 108,
  "pop": 18406359,
  "popR": 69,
  "gdp": 102050473864,
  "gdpR": 70,
  "pc": 5544,
  "lvl": "중상위 소득"
}, {
  "i": "GRC",
  "en": "Greece",
  "d": "M565.8,150.8 567.4,151.8 569.5,151.6 571.6,151.8 571.5,152.3 573.0,151.9 572.7,152.8 568.7,153.0 568.7,152.5 565.3,152.0 565.8,150.8Z M573.9,134.5 573.0,136.3 572.4,136.6 570.7,136.5 569.2,136.3 565.9,137.0 567.8,138.5 566.4,139.0 564.8,139.0 563.4,137.6 562.9,138.2 563.5,139.8 564.9,141.1 563.8,141.7 565.4,143.0 566.7,143.8 566.8,145.4 564.2,144.7 565.0,146.1 563.3,146.4 564.3,148.8 562.5,148.9 560.2,147.7 559.2,145.4 558.7,143.6 557.6,142.3 556.2,140.7 556.0,139.9 557.3,138.6 557.4,137.7 558.3,137.3 558.4,136.5 560.2,136.3 561.3,135.7 562.8,135.7 563.2,135.3 563.8,135.2 565.8,135.3 568.0,134.5 570.0,135.5 572.5,135.2 572.5,133.8 573.9,134.5Z",
  "cx": 565.4,
  "cy": 142.0,
  "n": "그리스",
  "ct": "유럽",
  "cap": "Athens",
  "fl": "🇬🇷",
  "lang": "Greek",
  "cur": "Euro",
  "bb": [556.0, 133.8, 573.9, 153.0],
  "ci": [{
    "n": "Athens",
    "x": 565.9,
    "y": 144.5,
    "c": 1
  }, {
    "n": "Thessaloniki",
    "x": 563.7,
    "y": 137.1,
    "c": 0
  }, {
    "n": "Piraeus",
    "x": 565.7,
    "y": 144.6,
    "c": 0
  }, {
    "n": "Patrai",
    "x": 560.4,
    "y": 143.8,
    "c": 0
  }, {
    "n": "Peristerion",
    "x": 565.8,
    "y": 144.4,
    "c": 0
  }, {
    "n": "Irakleion",
    "x": 569.8,
    "y": 151.9,
    "c": 0
  }, {
    "n": "Larisa",
    "x": 562.3,
    "y": 139.9,
    "c": 0
  }, {
    "n": "Kallithea",
    "x": 565.8,
    "y": 144.6,
    "c": 0
  }, {
    "n": "Nikaia",
    "x": 565.7,
    "y": 144.5,
    "c": 0
  }],
  "lat": 39,
  "lng": 22,
  "area": 131990,
  "areaR": 98,
  "pop": 10405134,
  "popR": 93,
  "gdp": 238206312633,
  "gdpR": 55,
  "pc": 22893,
  "lvl": "고소득"
}, {
  "i": "GRL",
  "en": "Greenland",
  "d": "M370.1,20.5 379.4,18.8 389.2,18.9 392.7,17.9 402.5,17.7 424.7,18.0 442.1,20.2 437.0,21.3 426.3,21.4 411.4,21.7 412.8,22.2 422.6,21.9 431.0,22.8 436.4,22.0 438.7,23.0 435.6,24.6 442.7,23.5 456.2,22.5 464.5,23.0 466.1,24.2 454.8,26.2 453.2,26.8 444.3,27.3 450.7,27.4 447.5,29.4 445.3,31.2 445.4,34.3 448.7,36.2 444.3,36.3 439.8,37.1 444.9,38.6 445.6,41.0 442.6,41.2 446.2,43.6 440.0,43.8 443.2,45.0 442.3,45.9 438.4,46.4 434.5,46.4 438.0,48.3 438.1,49.5 432.6,48.3 431.1,49.1 434.9,49.8 438.5,51.5 439.6,53.7 434.6,54.2 432.5,53.2 429.0,51.6 430.0,53.5 426.8,54.9 434.1,55.0 437.9,55.2 430.5,57.6 422.9,59.8 414.8,60.8 411.7,60.8 408.9,61.8 405.0,64.8 399.0,66.7 397.1,66.8 393.4,67.5 389.4,68.2 387.0,69.9 387.0,71.8 385.6,73.7 381.1,75.9 382.2,78.1 380.9,80.3 379.5,83.1 375.6,83.2 371.5,81.0 365.9,80.9 363.2,79.4 361.4,76.7 356.6,73.3 355.2,71.4 354.8,69.0 350.9,66.4 351.9,64.3 350.1,63.4 352.8,60.1 357.0,59.1 358.1,57.9 358.7,55.8 355.5,56.7 354.0,57.1 351.5,57.5 348.1,56.6 347.9,54.8 349.0,53.3 351.6,53.2 357.2,54.0 352.5,52.2 350.0,51.3 347.2,51.6 344.9,51.0 348.0,48.4 346.3,47.3 344.1,45.4 340.8,42.5 337.2,41.4 337.3,40.2 329.8,38.6 323.9,38.4 316.5,38.5 309.7,38.7 306.5,37.8 301.7,36.1 309.0,35.2 314.5,35.1 302.7,34.3 296.4,33.2 296.8,32.1 307.3,30.8 317.5,29.5 318.5,28.4 311.0,27.5 313.5,26.3 323.1,24.4 327.1,24.1 326.0,22.9 332.5,22.1 341.1,21.7 349.6,21.7 352.7,22.5 360.0,21.0 366.7,22.0 370.6,22.3 376.3,23.2 369.7,21.7 370.1,20.5Z",
  "cx": 386.0,
  "cy": 44.0,
  "n": "그린란드",
  "ct": "북아메리카",
  "cap": "Nuuk",
  "fl": "🇬🇱",
  "lang": "Greenlandic",
  "cur": "krone",
  "bb": [296.4, 17.7, 466.1, 83.2],
  "ci": [],
  "lat": 72,
  "lng": -40,
  "area": 2166086,
  "areaR": 13,
  "pop": 56836,
  "popR": 199,
  "gdp": 3235809504,
  "gdpR": 177,
  "pc": 56932,
  "lvl": "고소득"
}, {
  "i": "GIN",
  "en": "Guinea",
  "d": "M476.6,228.6 475.8,228.6 475.2,229.7 474.4,229.7 473.9,229.1 474.1,228.0 472.9,226.3 472.2,226.6 471.6,226.6 470.8,226.8 470.8,225.8 470.4,225.1 470.5,224.3 469.9,223.1 469.1,222.1 466.9,222.1 466.2,222.6 465.5,222.7 465.0,223.3 464.7,224.0 463.2,225.3 462.0,223.6 460.9,222.5 460.2,222.2 459.5,221.6 459.2,220.4 458.8,219.8 458.0,219.3 459.2,218.0 460.0,218.0 460.8,217.6 461.4,217.6 461.8,217.2 461.6,216.3 461.9,216.0 461.9,215.0 463.3,215.1 465.3,215.7 465.9,215.7 466.1,215.4 467.6,215.6 468.0,215.4 468.2,216.5 468.6,216.5 469.3,216.1 469.8,216.2 470.6,216.9 471.8,217.1 472.5,216.5 473.4,216.1 474.1,215.7 474.6,215.8 475.3,216.4 475.6,217.2 476.7,218.4 476.2,219.1 476.1,220.0 476.6,219.7 477.0,220.0 476.8,220.8 477.7,221.6 477.1,221.9 476.9,222.8 477.6,224.0 478.2,226.2 477.2,226.5 476.9,226.9 477.2,227.4 477.0,228.6 476.6,228.6Z",
  "cx": 469.7,
  "cy": 221.3,
  "n": "기니",
  "ct": "아프리카",
  "cap": "Conakry",
  "fl": "🇬🇳",
  "lang": "French",
  "cur": "Guinean franc",
  "bb": [458.0, 215.0, 478.2, 229.7],
  "ci": [],
  "lat": 11,
  "lng": -10,
  "area": 245857,
  "areaR": 80,
  "pop": 14754785,
  "popR": 74,
  "gdp": 23612295818,
  "gdpR": 116,
  "pc": 1600,
  "lvl": "중하위 소득"
}, {
  "i": "GNB",
  "en": "Guinea Bissau",
  "d": "M458.0,219.3 456.5,218.2 455.3,218.0 454.7,217.2 454.7,216.8 453.9,216.2 453.7,215.6 455.1,215.1 456.1,215.2 456.8,214.9 461.9,215.0 461.9,216.0 461.6,216.3 461.8,217.2 461.4,217.6 460.8,217.6 460.0,218.0 459.2,218.0 458.0,219.3Z",
  "cx": 458.0,
  "cy": 216.9,
  "n": "기니비사우",
  "ct": "아프리카",
  "cap": "Bissau",
  "fl": "🇬🇼",
  "lang": "Portuguese, Upper Guinea Creole",
  "cur": "West African CFA franc",
  "bb": [453.7, 214.9, 461.9, 219.3],
  "ci": [],
  "lat": 12,
  "lng": -15,
  "area": 36125,
  "areaR": 139,
  "pop": 2201352,
  "popR": 147,
  "gdp": 1966461400,
  "gdpR": 190,
  "pc": 893,
  "lvl": "저소득"
}, {
  "i": "NAM",
  "en": "Namibia",
  "d": "M545.4,329.4 543.3,327.3 542.3,325.3 541.6,322.5 541.0,320.5 540.0,316.3 540.0,312.9 539.6,311.4 538.5,310.3 537.1,308.0 535.6,304.6 535.0,302.9 532.8,300.2 532.6,298.1 533.9,297.5 535.6,297.1 537.4,297.1 539.1,298.4 539.5,298.2 550.7,298.1 552.7,299.4 559.4,299.8 564.5,298.7 566.8,298.0 568.6,298.2 569.7,298.8 569.7,299.1 568.1,299.7 567.3,299.7 565.5,300.8 564.4,299.6 560.2,300.6 558.1,300.7 558.0,310.6 555.3,310.7 555.3,318.8 555.3,329.1 552.8,330.5 551.3,330.7 549.5,330.2 548.3,330.0 547.8,328.8 546.7,328.0 545.4,329.4Z",
  "cx": 549.6,
  "cy": 310.1,
  "n": "나미비아",
  "ct": "아프리카",
  "cap": "Windhoek",
  "fl": "🇳🇦",
  "lang": "Afrikaans, German",
  "cur": "Namibian dollar",
  "bb": [532.6, 297.1, 569.7, 330.7],
  "ci": [],
  "lat": -22,
  "lng": 17,
  "area": 825615,
  "areaR": 36,
  "pop": 3030131,
  "popR": 137,
  "gdp": 12351024844,
  "gdpR": 147,
  "pc": 4076,
  "lvl": "중하위 소득"
}, {
  "i": "NGA",
  "en": "Nigeria",
  "d": "M523.6,236.7 520.7,237.7 519.7,237.6 518.6,238.2 516.4,238.2 514.9,236.4 514.0,234.4 512.0,232.6 509.9,232.6 507.5,232.6 507.6,228.1 507.6,226.4 508.1,224.6 508.9,223.8 510.3,222.0 510.0,221.3 510.5,220.2 509.9,218.5 510.0,217.6 510.2,215.1 511.0,214.0 511.4,212.4 512.1,211.8 515.1,211.5 517.9,212.5 518.9,213.6 520.4,213.6 521.7,212.9 525.0,214.4 526.5,214.3 528.1,213.1 529.7,213.2 530.5,212.8 532.0,213.0 534.2,213.8 536.3,212.2 537.0,212.3 538.9,215.4 539.4,215.3 540.5,216.4 540.2,216.9 540.0,217.9 537.7,220.0 537.0,221.8 536.6,223.2 536.0,223.8 535.4,225.8 533.9,226.9 533.5,228.3 532.9,229.5 532.6,230.6 530.7,231.5 529.2,230.4 528.1,230.4 526.5,232.1 525.6,232.1 524.3,234.8 523.6,236.7Z",
  "cx": 523.5,
  "cy": 223.0,
  "n": "나이지리아",
  "ct": "아프리카",
  "cap": "Abuja",
  "fl": "🇳🇬",
  "lang": "English",
  "cur": "Nigerian naira",
  "bb": [507.5, 211.5, 540.5, 238.2],
  "ci": [{
    "n": "Niamey",
    "x": 505.9,
    "y": 212.5,
    "c": 0
  }, {
    "n": "Zinder",
    "x": 525.0,
    "y": 211.7,
    "c": 0
  }, {
    "n": "Maradi",
    "x": 519.7,
    "y": 212.5,
    "c": 0
  }, {
    "n": "Alarsas",
    "x": 522.2,
    "y": 202.7,
    "c": 0
  }, {
    "n": "Tahoua",
    "x": 514.6,
    "y": 208.6,
    "c": 0
  }, {
    "n": "Dosso",
    "x": 508.9,
    "y": 213.8,
    "c": 0
  }, {
    "n": "Birnin Konni",
    "x": 514.6,
    "y": 211.7,
    "c": 0
  }, {
    "n": "Tessaoua",
    "x": 522.2,
    "y": 211.8,
    "c": 0
  }, {
    "n": "Gaya",
    "x": 509.6,
    "y": 217.0,
    "c": 0
  }],
  "lat": 10,
  "lng": 8,
  "area": 923768,
  "areaR": 33,
  "pop": 232679478,
  "popR": 6,
  "gdp": 362814951696,
  "gdpR": 43,
  "pc": 1559,
  "lvl": "중하위 소득"
}, {
  "i": "SSD",
  "en": "South Sudan",
  "d": "M594.3,223.7 594.4,225.9 594.0,226.7 592.5,226.8 591.5,228.4 593.2,228.6 594.7,229.9 595.1,231.0 596.4,231.7 598.1,234.7 596.2,236.5 594.5,238.2 592.8,239.5 590.8,239.5 588.6,240.1 586.8,239.5 585.6,240.3 583.2,238.4 582.5,237.2 581.0,237.8 579.7,237.6 579.0,238.1 577.7,237.8 576.0,235.5 575.6,234.6 573.5,233.5 572.8,231.8 571.7,230.6 569.8,229.2 569.8,228.3 568.2,227.1 566.4,226.1 567.2,225.8 568.2,225.2 568.9,222.7 569.6,221.5 571.6,221.1 572.1,221.8 573.5,223.5 574.3,223.7 575.3,223.2 577.3,223.3 577.7,223.9 580.5,223.9 580.6,223.3 582.0,222.8 582.3,222.0 583.3,221.4 585.7,223.0 587.1,222.7 588.5,220.7 590.0,219.2 589.8,217.6 589.1,216.7 590.8,216.6 591.0,216.0 592.2,216.2 591.9,218.2 592.2,220.2 593.7,221.3 594.0,222.3 594.0,223.7 594.3,223.7Z",
  "cx": 583.7,
  "cy": 227.5,
  "n": "남수단",
  "ct": "아프리카",
  "cap": "Juba",
  "fl": "🇸🇸",
  "lang": "English",
  "cur": "South Sudanese pound",
  "bb": [566.4, 216.0, 598.1, 240.3],
  "ci": [],
  "lat": 7,
  "lng": 30,
  "area": 619745,
  "areaR": 45,
  "pop": 11943408,
  "popR": 80,
  "gdp": 11997800760,
  "gdpR": 150,
  "pc": 1005,
  "lvl": "저소득"
}, {
  "i": "ZAF",
  "en": "South Africa",
  "d": "M587.6,331.3 587.0,331.7 585.8,333.1 585.1,334.5 583.5,336.5 580.3,339.4 578.4,341.0 576.3,342.3 573.4,343.4 572.0,343.5 571.6,344.3 569.9,343.9 568.5,344.4 565.5,343.9 563.9,344.2 562.7,344.1 559.8,345.2 557.5,345.6 555.8,346.7 554.5,346.7 553.3,345.7 552.4,345.7 551.2,344.4 551.0,344.8 550.7,344.1 550.7,342.4 549.8,340.6 550.7,340.1 550.6,337.9 548.8,335.3 547.4,333.0 545.4,329.4 546.7,328.0 547.8,328.8 548.3,330.0 549.5,330.2 551.3,330.7 552.8,330.5 555.3,329.1 555.3,318.8 556.0,319.2 557.7,321.9 557.4,323.5 558.0,324.5 560.0,324.2 561.4,323.0 562.7,322.2 563.4,320.8 564.8,320.2 565.9,320.5 567.3,321.3 569.5,321.4 571.3,320.8 571.6,319.9 572.1,318.6 573.6,318.4 574.4,317.3 575.3,315.5 577.8,313.4 581.8,311.4 582.9,311.4 584.2,311.9 585.2,311.5 586.6,311.8 588.0,315.7 588.7,317.7 588.2,320.8 588.4,321.8 587.0,321.3 586.2,321.5 586.0,322.3 585.2,323.3 585.2,324.3 586.9,325.8 588.5,325.5 589.1,324.3 591.2,324.3 590.5,326.3 590.2,328.6 589.5,329.9 587.6,331.3Z M580.5,330.4 579.3,329.6 578.0,330.1 576.5,331.2 575.0,333.0 577.1,335.1 578.1,334.8 578.6,334.0 580.1,333.5 580.6,332.6 581.5,331.3 580.5,330.4Z",
  "cx": 570.7,
  "cy": 329.8,
  "n": "남아프리카",
  "ct": "아프리카",
  "cap": "Pretoria",
  "fl": "🇿🇦",
  "lang": "Afrikaans, English",
  "cur": "South African rand",
  "bb": [545.4, 311.4, 591.2, 346.7],
  "ci": [{
    "n": "Cape Town",
    "x": 551.2,
    "y": 344.2,
    "c": 0
  }, {
    "n": "Durban",
    "x": 586.2,
    "y": 332.9,
    "c": 0
  }, {
    "n": "Johannesburg",
    "x": 578.0,
    "y": 322.8,
    "c": 0
  }, {
    "n": "Soweto",
    "x": 577.4,
    "y": 323.0,
    "c": 0
  }, {
    "n": "Pretoria",
    "x": 578.4,
    "y": 321.4,
    "c": 1
  }, {
    "n": "Port Elizabeth",
    "x": 571.1,
    "y": 344.4,
    "c": 0
  }, {
    "n": "Pietermaritzburg",
    "x": 584.4,
    "y": 332.3,
    "c": 0
  }, {
    "n": "Benoni",
    "x": 578.7,
    "y": 322.7,
    "c": 0
  }, {
    "n": "Tembisa",
    "x": 578.4,
    "y": 322.2,
    "c": 0
  }],
  "lat": -29,
  "lng": 24,
  "area": 1221037,
  "areaR": 26,
  "pop": 64007187,
  "popR": 24,
  "gdp": 377781600986,
  "gdpR": 41,
  "pc": 5902,
  "lvl": "중상위 소득"
}, {
  "i": "NLD",
  "en": "Netherlands",
  "d": "M516.9,101.4 519.2,101.4 519.7,102.4 519.0,104.9 518.3,106.0 516.6,106.0 517.1,108.9 515.6,108.2 513.8,107.0 511.2,107.6 509.2,107.4 510.6,106.6 513.1,102.5 516.9,101.4Z",
  "cx": 515.5,
  "cy": 105.1,
  "n": "네덜란드",
  "ct": "유럽",
  "cap": "Amsterdam",
  "fl": "🇳🇱",
  "lang": "Dutch",
  "cur": "Euro",
  "bb": [509.2, 101.4, 519.7, 108.9],
  "ci": [{
    "n": "Amsterdam",
    "x": 513.6,
    "y": 104.5,
    "c": 1
  }, {
    "n": "Rotterdam",
    "x": 512.4,
    "y": 105.8,
    "c": 0
  }, {
    "n": "The Hague",
    "x": 511.9,
    "y": 105.3,
    "c": 0
  }, {
    "n": "Utrecht",
    "x": 514.2,
    "y": 105.3,
    "c": 0
  }, {
    "n": "Eindhoven",
    "x": 515.2,
    "y": 107.1,
    "c": 0
  }, {
    "n": "Tilburg",
    "x": 514.1,
    "y": 106.8,
    "c": 0
  }, {
    "n": "Groningen",
    "x": 518.2,
    "y": 102.2,
    "c": 0
  }, {
    "n": "Almere Stad",
    "x": 514.5,
    "y": 104.5,
    "c": 0
  }, {
    "n": "Breda",
    "x": 513.3,
    "y": 106.7,
    "c": 0
  }],
  "lat": 52.5,
  "lng": 5.8,
  "area": 41850,
  "areaR": 135,
  "pop": 17993485,
  "popR": 71,
  "gdp": 1118124749886,
  "gdpR": 17,
  "pc": 62141,
  "lvl": "고소득"
}, {
  "i": "NPL",
  "en": "Nepal",
  "d": "M744.8,172.6 744.6,173.8 744.9,175.5 744.6,176.6 742.3,176.7 739.0,176.0 736.8,175.8 735.2,174.3 731.4,174.0 727.8,172.4 725.2,171.1 722.5,170.0 723.5,167.4 725.3,166.2 726.5,165.5 728.7,166.3 731.5,168.2 733.1,168.6 734.0,169.9 736.1,170.4 738.4,171.7 741.5,172.3 744.8,172.6Z",
  "cx": 734.9,
  "cy": 171.6,
  "n": "네팔",
  "ct": "아시아",
  "cap": "Kathmandu",
  "fl": "🇳🇵",
  "lang": "Nepali",
  "cur": "Nepalese rupee",
  "bb": [722.5, 165.5, 744.9, 176.7],
  "ci": [{
    "n": "Kathmandu",
    "x": 737.0,
    "y": 173.0,
    "c": 1
  }, {
    "n": "Pokhara",
    "x": 733.3,
    "y": 171.6,
    "c": 0
  }, {
    "n": "Patan",
    "x": 737.0,
    "y": 173.1,
    "c": 0
  }, {
    "n": "Biratnagar",
    "x": 742.5,
    "y": 176.4,
    "c": 0
  }, {
    "n": "Birganj",
    "x": 735.7,
    "y": 175.0,
    "c": 0
  }, {
    "n": "Dharan Bazar",
    "x": 742.5,
    "y": 175.5,
    "c": 0
  }, {
    "n": "Bharatpur",
    "x": 734.5,
    "y": 173.1,
    "c": 0
  }, {
    "n": "Janakpur",
    "x": 738.7,
    "y": 175.8,
    "c": 0
  }, {
    "n": "Dhangarhi",
    "x": 723.9,
    "y": 170.3,
    "c": 0
  }],
  "lat": 28,
  "lng": 84,
  "area": 147181,
  "areaR": 96,
  "pop": 29651054,
  "popR": 51,
  "gdp": 40908073367,
  "gdpR": 101,
  "pc": 1380,
  "lvl": "중하위 소득"
}, {
  "i": "NOR",
  "en": "Norway",
  "d": "M578.2,52.3 586.9,54.3 583.3,55.0 586.4,56.8 581.7,57.9 579.4,58.2 580.6,56.2 577.0,55.1 572.7,56.0 571.4,58.1 568.7,59.3 565.7,58.6 562.1,58.8 559.0,57.3 557.3,58.0 555.6,58.2 555.2,60.0 550.0,59.5 549.2,61.1 546.6,61.1 544.7,63.0 542.0,66.1 537.7,70.0 538.7,71.0 537.7,72.1 534.9,72.0 533.1,74.6 533.3,78.3 535.1,79.7 534.2,83.0 531.9,84.9 530.6,86.5 528.8,84.8 523.3,88.0 519.6,88.7 515.7,87.3 514.7,84.3 513.9,77.9 516.4,76.1 523.8,73.7 529.2,70.9 534.3,67.0 541.0,61.6 545.7,59.5 553.3,56.1 559.4,54.8 564.0,55.0 568.2,52.7 573.3,52.8 578.2,52.3Z M568.7,33.7 562.5,34.9 557.6,34.2 559.5,33.5 557.8,32.6 563.6,32.1 564.7,33.1 568.7,33.7Z M550.7,28.6 559.8,30.7 552.9,31.8 551.3,33.8 548.9,34.3 547.6,36.6 544.2,36.7 538.2,35.1 540.7,34.1 536.6,33.3 531.2,30.9 529.0,28.7 536.6,27.7 538.1,28.7 542.1,28.7 543.1,27.7 547.2,27.6 550.7,28.6Z M570.7,26.6 576.1,27.6 572.0,29.1 564.0,29.4 555.8,29.0 555.3,28.2 551.3,28.2 548.2,26.9 556.8,26.1 560.9,26.8 563.7,26.0 570.7,26.6Z",
  "cx": 551.6,
  "cy": 50.7,
  "n": "노르웨이",
  "ct": "유럽",
  "cap": "Oslo",
  "fl": "🇳🇴",
  "lang": "Norwegian Nynorsk, Norwegian Bokmål",
  "cur": "Norwegian krone",
  "bb": [513.9, 26.0, 586.9, 88.7],
  "ci": [{
    "n": "Pyongyang",
    "x": 849.3,
    "y": 141.6,
    "c": 0
  }, {
    "n": "Hamhung",
    "x": 854.3,
    "y": 139.1,
    "c": 0
  }, {
    "n": "Hungnam",
    "x": 854.5,
    "y": 139.4,
    "c": 0
  }, {
    "n": "Kaesong",
    "x": 851.5,
    "y": 144.5,
    "c": 0
  }, {
    "n": "Wonsan",
    "x": 854.0,
    "y": 141.2,
    "c": 0
  }, {
    "n": "Chongjin",
    "x": 860.5,
    "y": 133.9,
    "c": 0
  }, {
    "n": "Sinuiju",
    "x": 845.6,
    "y": 138.6,
    "c": 0
  }, {
    "n": "Haeju",
    "x": 849.2,
    "y": 144.3,
    "c": 0
  }, {
    "n": "Kanggye",
    "x": 851.7,
    "y": 136.1,
    "c": 0
  }],
  "lat": 62,
  "lng": 10,
  "area": 323802,
  "areaR": 70,
  "pop": 5572279,
  "popR": 118,
  "gdp": 485513316504,
  "gdpR": 31,
  "pc": 87130,
  "lvl": "고소득"
}, {
  "i": "NCL",
  "en": "New Caledonia",
  "d": "M960.5,308.6 962.8,310.3 964.2,311.6 963.2,312.2 961.6,311.5 959.7,310.2 957.9,308.7 956.0,306.8 955.6,305.8 956.8,305.9 958.4,306.8 959.6,307.8 960.5,308.6Z",
  "cx": 959.8,
  "cy": 308.8,
  "n": "누벨칼레도니",
  "ct": "오세아니아",
  "cap": "Nouméa",
  "fl": "🇳🇨",
  "lang": "French",
  "cur": "CFP franc",
  "bb": [955.6, 305.8, 964.2, 312.2],
  "ci": [],
  "lat": -21.5,
  "lng": 165.5,
  "area": 18575,
  "areaR": 156,
  "pop": 292639,
  "popR": 177,
  "gdp": 9623318718,
  "gdpR": 153,
  "pc": 32885,
  "lvl": "고소득"
}, {
  "i": "NZL",
  "en": "New Zealand",
  "d": "M980.6,363.7 981.2,364.8 983.2,363.7 984.0,364.9 984.0,366.0 983.0,367.3 981.2,369.4 979.8,370.5 980.8,371.8 978.6,371.8 976.3,372.9 975.5,374.7 973.9,377.5 971.8,378.8 970.4,379.6 967.8,379.5 966.0,378.6 963.0,378.4 962.5,377.4 964.0,375.3 967.5,372.6 969.3,372.0 971.3,371.0 973.7,369.5 975.3,368.1 976.6,366.0 977.6,365.3 978.0,363.8 980.0,362.5 980.6,363.7Z M985.0,350.4 987.0,353.4 987.1,351.5 988.4,352.2 988.8,354.3 991.0,355.2 992.9,355.4 994.5,354.4 995.9,354.7 995.2,357.2 994.4,358.8 992.2,358.7 991.5,359.6 991.8,360.8 991.3,361.3 990.3,362.8 988.9,364.7 986.8,365.8 986.3,365.1 985.1,364.7 986.7,362.4 985.8,360.9 982.8,359.7 982.9,358.7 984.9,357.8 985.4,355.6 985.3,353.8 984.1,352.0 984.2,351.5 982.9,350.3 980.7,347.9 979.5,345.9 980.6,345.7 982.1,347.2 984.2,348.0 985.0,350.4Z",
  "cx": 981.8,
  "cy": 362.6,
  "n": "뉴질랜드",
  "ct": "오세아니아",
  "cap": "Wellington",
  "fl": "🇳🇿",
  "lang": "English, Māori",
  "cur": "New Zealand dollar",
  "bb": [962.5, 345.7, 995.9, 379.6],
  "ci": [{
    "n": "Auckland",
    "x": 985.5,
    "y": 352.4,
    "c": 0
  }, {
    "n": "Wellington",
    "x": 985.5,
    "y": 364.7,
    "c": 1
  }, {
    "n": "Christchurch",
    "x": 979.5,
    "y": 370.9,
    "c": 0
  }, {
    "n": "Manakau",
    "x": 986.7,
    "y": 363.1,
    "c": 0
  }, {
    "n": "North Shore",
    "x": 985.4,
    "y": 352.2,
    "c": 0
  }, {
    "n": "Waitakere",
    "x": 984.9,
    "y": 352.4,
    "c": 0
  }, {
    "n": "Hamilton",
    "x": 986.9,
    "y": 355.0,
    "c": 0
  }, {
    "n": "Dunedin",
    "x": 973.6,
    "y": 377.4,
    "c": 0
  }, {
    "n": "Tauranga",
    "x": 989.4,
    "y": 354.7,
    "c": 0
  }],
  "lat": -41,
  "lng": 174,
  "area": 270467,
  "areaR": 77,
  "pop": 5287500,
  "popR": 123,
  "gdp": 253465703232,
  "gdpR": 52,
  "pc": 47937,
  "lvl": "고소득"
}, {
  "i": "NER",
  "en": "Niger",
  "d": "M506.0,216.8 506.0,214.9 502.8,214.3 502.8,213.0 501.2,211.1 500.8,209.9 501.0,208.5 502.8,208.4 503.8,207.4 507.6,207.2 510.1,206.8 510.3,205.0 511.9,203.2 511.9,196.8 515.8,195.6 523.8,190.1 533.3,184.8 537.7,186.0 539.3,187.5 541.3,186.5 541.9,190.8 543.0,191.5 543.0,192.4 544.2,193.4 543.6,194.6 542.5,200.2 542.4,203.8 538.8,206.4 537.6,210.1 538.8,211.1 538.8,212.9 540.5,213.0 540.3,214.3 539.5,214.4 539.4,215.3 538.9,215.4 537.0,212.3 536.3,212.2 534.2,213.8 532.0,213.0 530.5,212.8 529.7,213.2 528.1,213.1 526.5,214.3 525.0,214.4 521.7,212.9 520.4,213.6 518.9,213.6 517.9,212.5 515.1,211.5 512.1,211.8 511.4,212.4 511.0,214.0 510.2,215.1 510.0,217.6 507.9,216.0 506.9,216.0 506.0,216.8Z",
  "cx": 523.7,
  "cy": 207.5,
  "n": "니제르",
  "ct": "아프리카",
  "cap": "Niamey",
  "fl": "🇳🇪",
  "lang": "French",
  "cur": "West African CFA franc",
  "bb": [500.8, 184.8, 544.2, 217.6],
  "ci": [{
    "n": "Lagos",
    "x": 509.4,
    "y": 232.1,
    "c": 0
  }, {
    "n": "Kano",
    "x": 523.7,
    "y": 216.7,
    "c": 0
  }, {
    "n": "Ibadan",
    "x": 510.8,
    "y": 229.5,
    "c": 0
  }, {
    "n": "Kaduna",
    "x": 520.7,
    "y": 220.8,
    "c": 0
  }, {
    "n": "Port Harcourt",
    "x": 519.4,
    "y": 236.7,
    "c": 0
  }, {
    "n": "Benin-City",
    "x": 515.6,
    "y": 232.4,
    "c": 0
  }, {
    "n": "Maiduguri",
    "x": 536.6,
    "y": 217.1,
    "c": 0
  }, {
    "n": "Zaria",
    "x": 521.4,
    "y": 219.3,
    "c": 0
  }, {
    "n": "Aba",
    "x": 520.5,
    "y": 235.8,
    "c": 0
  }],
  "lat": 16,
  "lng": 8,
  "area": 1267000,
  "areaR": 23,
  "pop": 27032412,
  "popR": 55,
  "gdp": 16819170421,
  "gdpR": 132,
  "pc": 622,
  "lvl": "저소득"
}, {
  "i": "NIC",
  "en": "Nicaragua",
  "d": "M261.9,219.2 260.9,218.3 259.7,217.2 259.0,216.3 257.9,215.4 256.5,214.1 256.8,213.7 257.2,214.1 257.5,213.9 258.3,213.8 258.7,213.2 259.1,213.2 259.0,211.8 259.7,211.7 260.2,211.7 260.8,211.0 261.7,211.6 261.9,211.2 262.5,210.9 263.4,210.1 263.5,209.6 263.7,209.6 264.1,208.9 264.4,208.8 264.9,209.3 265.4,209.4 266.0,209.0 266.7,209.0 267.7,208.7 268.1,208.3 269.0,208.3 268.8,208.6 268.7,209.2 268.9,210.2 268.3,211.2 268.0,212.3 267.9,213.5 268.1,214.3 268.1,215.5 267.7,215.8 267.4,217.0 267.6,217.7 267.1,218.4 267.2,219.2 267.6,219.6 267.0,220.2 266.1,220.0 265.7,219.4 264.8,219.2 264.2,219.6 262.3,218.8 261.9,219.2Z",
  "cx": 263.8,
  "cy": 213.7,
  "n": "니카라과",
  "ct": "북아메리카",
  "cap": "Managua",
  "fl": "🇳🇮",
  "lang": "Spanish",
  "cur": "Nicaraguan córdoba",
  "bb": [256.5, 208.3, 269.0, 220.2],
  "ci": [{
    "n": "Managua",
    "x": 260.4,
    "y": 216.2,
    "c": 1
  }, {
    "n": "Leon",
    "x": 258.7,
    "y": 215.5,
    "c": 0
  }, {
    "n": "Masaya",
    "x": 260.8,
    "y": 216.8,
    "c": 0
  }, {
    "n": "Tipitapa",
    "x": 260.9,
    "y": 216.1,
    "c": 0
  }, {
    "n": "Chinandega",
    "x": 257.9,
    "y": 215.0,
    "c": 0
  }, {
    "n": "Matagalpa",
    "x": 261.3,
    "y": 214.1,
    "c": 0
  }, {
    "n": "Esteli",
    "x": 260.1,
    "y": 213.7,
    "c": 0
  }, {
    "n": "Granada",
    "x": 261.3,
    "y": 216.9,
    "c": 0
  }, {
    "n": "Ciudad Sandino",
    "x": 260.2,
    "y": 216.2,
    "c": 0
  }],
  "lat": 13,
  "lng": -85,
  "area": 130373,
  "areaR": 99,
  "pop": 6916140,
  "popR": 108,
  "gdp": 17829215284,
  "gdpR": 130,
  "pc": 2578,
  "lvl": "중하위 소득"
}, {
  "i": "TWN",
  "en": "Taiwan",
  "d": "M838.3,182.2 836.6,186.7 835.4,189.0 833.9,186.6 833.6,184.6 835.3,181.8 837.5,179.7 838.8,180.6 838.3,182.2Z",
  "cx": 836.4,
  "cy": 183.7,
  "n": "대만",
  "ct": "아시아",
  "cap": "Taipei",
  "fl": "🇹🇼",
  "lang": "Chinese",
  "cur": "New Taiwan dollar",
  "bb": [833.6, 179.7, 838.8, 189.0],
  "ci": [],
  "lat": 23.5,
  "lng": 121,
  "area": 36193,
  "areaR": 138,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "DNK",
  "en": "Denmark",
  "d": "M535.3,95.5 533.6,97.8 530.7,96.2 530.3,95.1 534.4,94.1 535.3,95.5Z M530.3,93.2 529.6,94.2 528.8,93.9 526.8,95.9 527.6,97.3 525.8,97.7 523.7,97.3 522.6,95.8 522.5,92.9 522.9,92.2 523.7,91.4 526.2,91.2 527.2,90.4 529.4,89.6 529.3,91.1 528.5,92.0 528.8,92.8 530.3,93.2Z",
  "cx": 528.5,
  "cy": 94.0,
  "n": "덴마크",
  "ct": "유럽",
  "cap": "Copenhagen",
  "fl": "🇩🇰",
  "lang": "Danish",
  "cur": "Danish krone",
  "bb": [522.5, 89.6, 535.3, 97.8],
  "ci": [{
    "n": "Copenhagen",
    "x": 534.9,
    "y": 95.3,
    "c": 1
  }, {
    "n": "Arhus",
    "x": 528.4,
    "y": 94.0,
    "c": 0
  }, {
    "n": "Odense",
    "x": 528.9,
    "y": 96.1,
    "c": 0
  }, {
    "n": "Aalborg",
    "x": 527.6,
    "y": 91.5,
    "c": 0
  }, {
    "n": "Frederiksberg",
    "x": 534.8,
    "y": 95.3,
    "c": 0
  }, {
    "n": "Esbjerg",
    "x": 523.5,
    "y": 95.9,
    "c": 0
  }, {
    "n": "Randers",
    "x": 527.9,
    "y": 93.1,
    "c": 0
  }, {
    "n": "Kolding",
    "x": 526.3,
    "y": 95.9,
    "c": 0
  }, {
    "n": "Vejle",
    "x": 526.5,
    "y": 95.3,
    "c": 0
  }],
  "lat": 56,
  "lng": 10,
  "area": 43094,
  "areaR": 134,
  "pop": 5976992,
  "popR": 114,
  "gdp": 404198757538,
  "gdpR": 36,
  "pc": 67626,
  "lvl": "고소득"
}, {
  "i": "DOM",
  "en": "Dominican Republic",
  "d": "M300.8,195.2 301.1,194.8 303.3,194.8 305.0,195.5 305.7,195.4 306.2,196.4 307.7,196.4 307.6,197.2 308.9,197.3 310.2,198.3 309.2,199.4 307.9,198.8 306.6,198.9 305.7,198.8 305.2,199.3 304.1,199.5 303.7,198.8 302.8,199.2 301.7,201.1 301.0,200.7 300.8,199.9 300.9,199.1 300.2,198.3 300.8,197.8 301.0,196.8 300.8,195.2Z",
  "cx": 304.2,
  "cy": 197.8,
  "n": "도미니카 공화국",
  "ct": "북아메리카",
  "cap": "Santo Domingo",
  "fl": "🇩🇴",
  "lang": "Spanish",
  "cur": "Dominican peso",
  "bb": [300.2, 194.8, 310.2, 201.1],
  "ci": [],
  "lat": 19,
  "lng": -70.7,
  "area": 48671,
  "areaR": 132,
  "pop": 11427557,
  "popR": 84,
  "gdp": 121444279314,
  "gdpR": 63,
  "pc": 10627,
  "lvl": "중상위 소득"
}, {
  "i": "DEU",
  "en": "Germany",
  "d": "M527.6,97.3 527.6,98.3 530.4,99.0 530.4,100.0 533.2,99.5 534.8,98.7 537.9,99.8 539.2,100.7 539.9,102.1 539.1,102.8 540.1,103.8 540.8,105.3 540.6,106.3 541.7,108.0 540.5,108.3 539.7,108.0 539.0,108.5 537.1,109.1 536.0,109.8 534.0,110.4 534.5,111.2 534.8,112.4 536.2,113.0 537.8,114.2 536.8,115.5 535.8,115.9 536.2,117.7 535.9,118.1 535.1,117.6 533.7,117.5 531.7,118.0 529.3,117.9 528.9,118.6 527.5,117.8 526.7,118.0 523.7,117.1 523.1,117.7 520.7,117.7 521.1,115.7 522.5,113.8 518.5,113.3 517.2,112.6 517.3,111.4 516.8,110.8 517.1,108.9 516.6,106.0 518.3,106.0 519.0,104.9 519.7,102.4 519.2,101.4 519.7,100.9 522.0,100.7 522.6,101.3 524.4,99.9 523.8,98.9 523.7,97.3 525.8,97.7 527.6,97.3Z",
  "cx": 529.5,
  "cy": 108.2,
  "n": "독일",
  "ct": "유럽",
  "cap": "Berlin",
  "fl": "🇩🇪",
  "lang": "German",
  "cur": "Euro",
  "bb": [516.6, 97.3, 541.7, 118.6],
  "ci": [{
    "n": "Berlin",
    "x": 537.2,
    "y": 104.1,
    "c": 1
  }, {
    "n": "Hamburg",
    "x": 527.8,
    "y": 101.2,
    "c": 0
  }, {
    "n": "Muenchen",
    "x": 532.2,
    "y": 116.3,
    "c": 0
  }, {
    "n": "Koeln",
    "x": 519.3,
    "y": 108.5,
    "c": 0
  }, {
    "n": "Frankfurt am Main",
    "x": 524.1,
    "y": 110.8,
    "c": 0
  }, {
    "n": "Essen",
    "x": 519.5,
    "y": 107.1,
    "c": 0
  }, {
    "n": "Stuttgart",
    "x": 525.5,
    "y": 114.5,
    "c": 0
  }, {
    "n": "Dortmund",
    "x": 520.7,
    "y": 106.9,
    "c": 0
  }, {
    "n": "Dusseldorf",
    "x": 518.8,
    "y": 107.7,
    "c": 0
  }],
  "lat": 51,
  "lng": 9,
  "area": 357114,
  "areaR": 64,
  "pop": 83516593,
  "popR": 19,
  "gdp": 4456081016706,
  "gdpR": 3,
  "pc": 53356,
  "lvl": "고소득"
}, {
  "i": "TLS",
  "en": "East Timor",
  "d": "M847.1,274.7 847.5,274.0 849.9,273.4 851.8,273.3 852.7,273.0 853.7,273.3 852.7,274.1 849.8,275.3 847.5,276.1 847.4,275.2 847.1,274.7Z",
  "cx": 849.7,
  "cy": 274.3,
  "n": "동티모르",
  "ct": "아시아",
  "cap": "Dili",
  "fl": "🇹🇱",
  "lang": "Portuguese, Tetum",
  "cur": "United States dollar",
  "bb": [847.1, 273.0, 853.7, 276.1],
  "ci": [],
  "lat": -8.8,
  "lng": 125.9,
  "area": 14874,
  "areaR": 160,
  "pop": 1400638,
  "popR": 153,
  "gdp": 2243142908,
  "gdpR": 185,
  "pc": 1602,
  "lvl": "중하위 소득"
}, {
  "i": "LAO",
  "en": "Laos",
  "d": "M792.3,210.4 793.2,209.1 793.3,206.7 791.1,204.3 790.9,201.6 788.8,199.3 786.7,199.1 786.1,200.1 784.5,200.2 783.6,199.7 780.7,201.4 780.7,198.9 781.3,195.9 779.5,195.8 779.3,194.1 778.1,193.3 778.7,192.3 781.1,190.5 781.3,191.1 782.8,191.2 782.4,188.0 783.8,187.6 785.4,189.8 786.7,192.3 790.1,192.3 791.2,194.8 789.4,195.5 788.6,196.5 791.9,198.1 794.2,201.4 796.0,203.9 798.1,205.8 798.8,207.8 798.3,210.5 795.8,209.5 794.6,211.4 792.3,210.4Z",
  "cx": 787.9,
  "cy": 199.2,
  "n": "라오스",
  "ct": "아시아",
  "cap": "Vientiane",
  "fl": "🇱🇦",
  "lang": "Lao",
  "cur": "Lao kip",
  "bb": [778.1, 187.6, 798.8, 211.4],
  "ci": [],
  "lat": 18,
  "lng": 105,
  "area": 236800,
  "areaR": 85,
  "pop": 7769819,
  "popR": 102,
  "gdp": 15843155731,
  "gdpR": 136,
  "pc": 2039,
  "lvl": "중하위 소득"
}, {
  "i": "LBR",
  "en": "Liberia",
  "d": "M478.6,237.9 477.8,237.9 475.0,236.6 472.5,234.5 470.1,232.9 468.2,231.2 468.9,230.3 469.0,229.5 470.3,227.9 471.6,226.6 472.2,226.6 472.9,226.3 474.1,228.0 473.9,229.1 474.4,229.7 475.2,229.7 475.8,228.6 476.6,228.6 476.4,229.5 476.7,230.8 476.1,232.0 476.9,232.8 477.8,233.0 479.0,234.1 479.1,235.2 478.8,235.6 478.6,237.9Z",
  "cx": 474.7,
  "cy": 231.6,
  "n": "라이베리아",
  "ct": "아프리카",
  "cap": "Monrovia",
  "fl": "🇱🇷",
  "lang": "English",
  "cur": "Liberian dollar",
  "bb": [468.2, 226.3, 479.1, 237.9],
  "ci": [{
    "n": "Monrovia",
    "x": 470.0,
    "y": 232.5,
    "c": 1
  }, {
    "n": "Gbarnga",
    "x": 473.7,
    "y": 230.6,
    "c": 0
  }, {
    "n": "Bensonville",
    "x": 470.5,
    "y": 232.1,
    "c": 0
  }, {
    "n": "Harper",
    "x": 478.6,
    "y": 237.8,
    "c": 0
  }, {
    "n": "Buchanan",
    "x": 472.1,
    "y": 233.7,
    "c": 0
  }, {
    "n": "Zwedru",
    "x": 477.4,
    "y": 233.1,
    "c": 0
  }, {
    "n": "New Yekepa",
    "x": 476.3,
    "y": 228.9,
    "c": 0
  }, {
    "n": "Ganta",
    "x": 476.3,
    "y": 229.7,
    "c": 0
  }, {
    "n": "Robertsport",
    "x": 468.4,
    "y": 231.2,
    "c": 0
  }],
  "lat": 6.5,
  "lng": -9.5,
  "area": 111369,
  "areaR": 105,
  "pop": 5612817,
  "popR": 117,
  "gdp": 4332000000,
  "gdpR": 169,
  "pc": 772,
  "lvl": "저소득"
}, {
  "i": "LVA",
  "en": "Latvia",
  "d": "M558.5,94.4 558.6,92.3 559.9,90.5 562.6,89.6 564.8,91.6 567.0,91.6 567.5,89.5 569.9,89.0 571.1,89.3 573.5,90.3 575.8,90.3 577.1,91.0 577.4,92.3 578.3,94.0 575.3,95.0 573.6,95.5 570.9,94.2 569.4,94.0 569.1,93.4 566.3,93.7 561.7,93.5 558.5,94.4Z",
  "cx": 568.5,
  "cy": 92.2,
  "n": "라트비아",
  "ct": "유럽",
  "cap": "Riga",
  "fl": "🇱🇻",
  "lang": "Latvian",
  "cur": "Euro",
  "bb": [558.5, 89.0, 578.3, 95.5],
  "ci": [{
    "n": "Riga",
    "x": 566.9,
    "y": 91.8,
    "c": 1
  }, {
    "n": "Daugavpils",
    "x": 573.7,
    "y": 94.8,
    "c": 0
  }, {
    "n": "Vec-Liepaja",
    "x": 558.4,
    "y": 93.0,
    "c": 0
  }, {
    "n": "Liepaja",
    "x": 558.4,
    "y": 93.0,
    "c": 0
  }, {
    "n": "Jelgava",
    "x": 565.9,
    "y": 92.6,
    "c": 0
  }, {
    "n": "Jurmala",
    "x": 566.0,
    "y": 91.8,
    "c": 0
  }, {
    "n": "Ventspils",
    "x": 559.9,
    "y": 90.6,
    "c": 0
  }, {
    "n": "Rezekne",
    "x": 575.9,
    "y": 93.1,
    "c": 0
  }, {
    "n": "Jekabpils",
    "x": 571.8,
    "y": 93.1,
    "c": 0
  }],
  "lat": 57,
  "lng": 25,
  "area": 64559,
  "areaR": 126,
  "pop": 1866124,
  "popR": 150,
  "gdp": 43627078481,
  "gdpR": 98,
  "pc": 23378,
  "lvl": "고소득"
}, {
  "i": "RUS",
  "en": "Russia",
  "d": "M899.0,109.0 901.8,114.0 897.7,113.0 896.0,117.1 898.7,119.9 898.6,121.8 896.5,120.2 894.7,122.3 894.2,120.0 894.5,117.3 894.2,114.3 894.8,112.2 894.9,108.5 893.3,105.7 893.6,101.9 896.1,100.7 895.0,99.4 896.3,99.0 897.0,100.8 897.9,103.5 897.9,106.2 899.0,109.0Z M563.1,99.1 558.0,99.1 554.6,98.8 555.2,97.6 559.1,96.7 562.0,97.2 563.2,97.6 562.9,98.4 563.1,99.1Z M13.8,65.0 15.7,65.7 15.1,63.7 22.6,64.1 28.1,66.7 25.3,67.9 20.7,68.2 20.7,70.9 19.6,71.5 17.0,71.4 14.9,70.5 11.2,69.7 10.5,68.5 7.7,68.0 4.6,68.4 3.0,67.4 3.6,66.4 0.3,67.0 1.6,68.3 0.0,69.5 0.0,58.4 6.8,60.6 14.1,63.3 13.8,65.0Z M1000.0,53.2 997.0,53.4 996.5,52.5 1000.0,51.3 1000.0,53.2Z M3.6,53.1 0.0,53.2 0.0,51.3 0.4,51.2 2.7,51.2 6.7,52.0 6.5,52.4 3.6,53.1Z M898.9,46.6 894.7,46.7 889.0,46.3 888.5,46.2 891.1,45.1 894.6,44.8 898.6,45.9 898.9,46.6Z M918.7,41.4 915.5,42.5 911.0,42.3 905.9,41.2 906.6,40.3 911.7,40.7 918.7,41.4Z M903.0,40.1 900.8,42.2 890.6,42.1 886.0,42.7 880.5,40.9 882.0,39.0 885.6,38.5 893.0,38.6 903.0,40.1Z M659.8,53.6 658.2,53.8 649.1,53.4 648.4,52.2 643.3,51.5 642.9,50.0 645.8,49.4 645.7,47.8 651.2,45.5 648.6,45.1 655.3,42.7 654.5,41.4 660.7,40.0 669.9,38.2 679.2,37.7 683.9,36.6 689.3,36.3 691.3,37.4 689.4,38.2 679.5,39.6 671.1,40.9 662.4,43.6 658.3,46.3 653.9,49.0 654.5,51.3 659.8,53.6Z M797.1,36.2 797.9,37.6 800.4,36.9 808.5,36.9 814.8,38.3 817.0,39.3 816.3,40.8 813.3,41.6 806.0,43.1 803.9,43.9 807.3,44.3 811.4,45.0 813.9,44.5 815.4,46.3 816.6,45.6 821.0,45.1 829.9,45.6 830.6,46.9 842.2,47.3 842.4,45.2 848.3,45.7 852.7,45.7 857.2,47.1 858.5,48.9 856.8,50.1 860.3,52.2 864.7,53.4 867.4,50.5 871.8,51.7 876.6,51.0 881.9,51.8 884.0,51.0 888.5,51.4 886.5,48.8 890.2,47.6 915.3,49.4 917.6,51.1 924.9,53.2 936.1,52.7 941.7,53.1 944.0,54.3 943.6,56.3 947.1,57.1 950.8,56.5 955.7,56.5 960.9,57.0 966.2,56.7 971.0,59.2 974.5,58.3 972.2,56.5 973.5,55.3 982.3,56.1 988.1,55.9 996.1,57.2 1000.0,58.4 1000.0,69.5 996.4,70.7 992.8,70.5 995.3,72.0 997.0,74.3 998.3,75.0 998.6,76.2 997.9,76.9 992.7,76.3 984.9,78.4 982.4,78.7 978.2,80.7 974.2,82.4 973.1,83.7 969.2,81.7 961.9,83.9 960.7,82.9 958.0,84.1 954.3,83.7 953.4,85.5 950.0,88.2 950.1,89.3 953.3,90.0 952.9,94.0 950.4,94.1 949.2,96.4 950.3,97.6 945.5,99.0 944.5,102.2 940.4,102.9 939.5,105.7 935.5,108.3 934.5,106.4 933.3,102.3 931.8,96.2 933.1,92.3 935.4,90.7 935.6,89.4 939.9,88.7 944.9,85.2 949.6,82.4 954.6,80.2 956.9,76.2 953.5,76.5 951.8,78.8 944.8,81.8 942.5,78.4 935.3,79.3 928.4,84.0 930.7,85.7 924.5,86.4 920.2,86.7 920.4,84.7 916.1,84.3 912.6,85.7 904.1,85.2 895.0,86.0 886.0,91.4 875.4,98.0 879.7,98.3 881.1,100.1 883.8,100.7 885.6,99.3 888.6,99.5 892.6,102.5 892.7,104.9 890.5,107.7 890.3,111.0 889.1,115.4 884.9,119.4 883.9,121.4 880.2,124.6 876.4,127.8 874.6,129.4 870.9,131.1 869.2,131.1 867.4,129.8 863.7,131.8 863.3,132.7 862.9,132.2 862.9,130.8 864.3,130.8 864.7,127.5 864.0,125.1 866.3,124.1 869.7,124.6 871.6,121.9 872.5,118.9 873.6,117.8 875.1,115.3 870.5,116.2 868.1,117.3 863.9,117.2 862.7,114.6 859.4,112.7 854.6,111.8 853.6,109.1 852.6,107.4 851.6,106.2 849.9,103.4 847.4,102.3 843.3,101.5 839.6,101.6 836.1,102.1 833.8,103.5 835.3,104.1 835.4,105.7 833.8,106.5 831.3,109.5 831.4,110.7 827.4,112.5 824.1,111.4 820.8,111.7 819.3,110.7 817.7,110.4 813.6,112.4 809.9,112.8 807.4,113.5 803.9,113.1 801.3,113.1 799.6,111.7 796.9,110.3 794.1,110.0 790.6,110.3 788.0,110.9 784.0,109.7 783.5,107.6 780.2,106.9 777.7,106.6 774.6,105.4 771.7,108.3 772.9,109.9 770.2,111.9 766.2,111.2 763.4,111.1 761.5,109.8 758.6,109.7 756.2,108.9 752.0,110.2 746.7,112.6 743.8,113.1 742.7,113.3 741.2,111.6 737.6,112.0 736.4,110.8 734.5,110.2 733.2,108.6 731.6,108.1 727.6,108.9 723.8,107.3 722.3,108.7 716.1,101.7 712.6,99.5 713.6,98.6 706.6,101.3 704.0,101.4 704.2,99.9 700.6,99.0 697.7,99.6 696.8,96.8 691.9,96.2 689.4,97.3 682.4,98.3 681.1,99.0 670.7,100.0 669.4,100.9 671.4,102.8 668.7,103.6 669.2,104.3 666.6,105.7 671.1,107.6 670.4,108.9 666.5,108.8 665.7,109.6 662.1,108.2 657.7,108.2 654.8,109.4 651.5,108.3 645.4,106.3 641.0,106.4 635.3,109.4 634.9,111.5 632.1,109.8 629.9,112.9 630.7,113.5 629.1,115.6 631.4,117.5 633.5,117.4 635.3,119.2 635.0,120.7 636.4,121.1 635.1,122.8 632.4,123.2 629.7,126.1 632.2,128.7 631.9,130.6 635.0,133.9 633.3,135.0 632.8,135.7 631.6,135.5 629.7,133.8 628.9,133.7 627.2,133.1 626.3,131.9 623.7,131.4 622.0,131.8 621.5,131.3 617.8,129.9 613.7,129.5 611.3,129.0 611.0,129.3 607.4,127.0 604.3,126.0 601.9,124.3 603.9,123.9 606.2,121.6 604.6,120.5 608.7,119.3 608.7,118.7 606.2,119.2 606.3,117.9 607.7,117.2 610.4,116.9 610.8,116.0 610.2,114.5 611.3,113.0 611.3,112.2 607.2,111.3 605.6,111.3 603.9,110.0 601.7,110.5 598.2,109.5 598.3,109.0 597.3,107.8 595.1,107.6 594.8,106.8 595.5,106.2 593.8,104.6 590.9,104.9 590.0,104.8 589.3,105.4 588.3,105.3 587.6,103.5 587.0,102.6 587.5,102.3 589.7,102.4 590.8,101.8 590.0,101.1 588.1,100.6 588.3,100.1 587.2,99.6 585.4,97.7 586.0,97.0 585.8,95.7 583.0,95.0 581.6,95.4 581.2,94.7 578.3,94.0 577.4,92.3 577.1,91.0 575.8,90.3 577.0,89.5 576.2,86.9 578.1,85.3 577.7,84.8 580.9,83.3 578.0,81.9 583.9,78.4 586.5,76.8 587.5,75.4 583.4,73.5 584.6,71.7 582.1,69.6 583.9,67.2 580.7,64.0 583.3,61.9 579.0,60.1 579.4,58.2 581.7,57.9 586.4,56.8 589.3,55.8 593.8,57.5 601.4,58.2 611.9,61.3 614.1,62.6 614.2,64.5 611.2,65.9 606.6,66.7 594.2,64.6 592.2,64.9 596.7,66.9 596.9,68.2 597.1,71.1 600.6,71.9 602.8,72.6 603.2,71.3 601.5,70.1 603.3,69.0 610.0,70.8 612.3,70.1 610.5,68.1 616.9,65.3 619.5,65.5 622.1,66.5 623.7,64.6 621.4,62.9 622.7,61.2 620.7,59.5 628.5,60.4 630.1,62.0 626.5,62.3 626.6,63.9 628.7,64.8 633.0,64.2 633.7,62.4 639.5,61.1 649.2,58.7 651.3,58.9 648.6,60.6 652.0,60.8 654.0,59.9 659.2,59.8 663.3,58.7 666.5,60.3 669.7,58.5 666.8,56.9 668.2,56.0 676.4,56.8 680.2,57.7 690.3,60.9 692.2,59.4 689.3,57.9 689.3,57.3 685.9,57.1 686.8,55.8 685.3,53.6 685.3,52.7 690.4,50.2 692.2,47.7 694.3,47.1 701.6,47.8 702.2,49.4 699.6,51.6 701.3,52.5 702.2,54.5 701.6,58.3 704.6,60.0 703.4,61.8 698.0,65.8 701.2,66.2 702.3,65.2 705.3,64.5 706.1,63.1 708.5,61.8 706.9,60.2 708.2,58.4 705.1,58.1 704.4,56.6 706.7,53.8 703.1,51.5 708.0,49.7 707.4,47.7 708.8,47.6 710.2,49.2 709.1,51.8 712.1,52.4 710.8,50.3 715.5,49.3 721.3,49.1 726.4,50.7 723.9,48.4 723.6,45.4 728.5,44.9 735.2,45.0 741.2,44.6 738.9,43.2 742.1,41.3 745.3,41.3 750.7,39.9 758.1,39.5 759.0,38.8 766.3,38.5 768.6,39.1 774.8,37.6 779.9,37.7 780.7,36.5 783.3,35.3 789.9,34.2 794.6,35.1 790.8,35.8 797.1,36.2Z M791.9,32.5 776.2,33.6 781.3,29.9 783.6,29.6 785.7,29.8 792.7,31.4 791.9,32.5Z M642.0,26.3 638.3,26.6 635.8,26.8 635.4,27.3 632.2,27.7 629.2,27.1 630.8,26.2 624.6,26.1 630.0,25.6 634.2,25.6 634.8,26.3 636.4,25.7 639.0,25.2 643.1,25.8 642.0,26.3Z M777.6,30.9 771.5,31.2 763.8,30.4 759.2,29.4 757.1,27.4 753.3,26.8 760.5,24.9 766.5,24.3 771.9,25.7 778.3,28.4 777.6,30.9Z",
  "cx": 717.2,
  "cy": 78.3,
  "n": "러시아",
  "ct": "유럽",
  "cap": "Moscow",
  "fl": "🇷🇺",
  "lang": "Russian",
  "cur": "Russian ruble",
  "bb": [0.0, 24.3, 1000.0, 135.7],
  "ci": [{
    "n": "Moscow",
    "x": 604.5,
    "y": 95.1,
    "c": 1
  }, {
    "n": "Saint Petersburg",
    "x": 584.1,
    "y": 83.6,
    "c": 0
  }, {
    "n": "Novosibirsk",
    "x": 730.4,
    "y": 97.1,
    "c": 0
  }, {
    "n": "Yekaterinburg",
    "x": 668.4,
    "y": 92.1,
    "c": 0
  }, {
    "n": "Nizhniy Novgorod",
    "x": 622.2,
    "y": 93.5,
    "c": 0
  }, {
    "n": "Samara",
    "x": 639.3,
    "y": 102.2,
    "c": 0
  }, {
    "n": "Omsk",
    "x": 703.9,
    "y": 97.2,
    "c": 0
  }, {
    "n": "Rostov-na-Donu",
    "x": 610.3,
    "y": 118.8,
    "c": 0
  }, {
    "n": "Chelyabinsk",
    "x": 670.6,
    "y": 96.8,
    "c": 0
  }],
  "lat": 60,
  "lng": 100,
  "area": 17098242,
  "areaR": 1,
  "pop": 143533851,
  "popR": 9,
  "gdp": 2021421476035,
  "gdpR": 11,
  "pc": 14083,
  "lvl": "고소득"
}, {
  "i": "LBN",
  "en": "Lebanon",
  "d": "M599.5,157.6 598.8,157.6 598.5,158.1 597.6,158.1 598.6,155.8 599.9,153.9 600.0,153.8 601.2,153.9 601.7,155.0 600.2,156.0 599.5,157.6Z",
  "cx": 599.6,
  "cy": 156.1,
  "n": "레바논",
  "ct": "아시아",
  "cap": "Beirut",
  "fl": "🇱🇧",
  "lang": "Arabic, French",
  "cur": "Lebanese pound",
  "bb": [597.6, 153.8, 601.7, 158.1],
  "ci": [{
    "n": "Beirut",
    "x": 598.6,
    "y": 155.9,
    "c": 1
  }, {
    "n": "Tripoli",
    "x": 599.6,
    "y": 154.3,
    "c": 0
  }, {
    "n": "Sidon",
    "x": 598.2,
    "y": 156.8,
    "c": 0
  }, {
    "n": "Tyre",
    "x": 597.8,
    "y": 157.6,
    "c": 0
  }, {
    "n": "Habbouch",
    "x": 598.6,
    "y": 157.2,
    "c": 0
  }, {
    "n": "Jounie",
    "x": 598.9,
    "y": 155.6,
    "c": 0
  }, {
    "n": "Zahle",
    "x": 599.7,
    "y": 156.0,
    "c": 0
  }, {
    "n": "Baalbek",
    "x": 600.6,
    "y": 155.5,
    "c": 0
  }, {
    "n": "Jbail",
    "x": 599.0,
    "y": 155.2,
    "c": 0
  }],
  "lat": 33.8,
  "lng": 35.8,
  "area": 10452,
  "areaR": 169,
  "pop": 5805962,
  "popR": 115,
  "gdp": 20992421949,
  "gdpR": 119,
  "pc": 3616,
  "lvl": "중하위 소득"
}, {
  "i": "LSO",
  "en": "Lesotho",
  "d": "M580.5,330.4 581.5,331.3 580.6,332.6 580.1,333.5 578.6,334.0 578.1,334.8 577.1,335.1 575.0,333.0 576.5,331.2 578.0,330.1 579.3,329.6 580.5,330.4Z",
  "cx": 578.8,
  "cy": 332.2,
  "n": "레소토",
  "ct": "아프리카",
  "cap": "Maseru",
  "fl": "🇱🇸",
  "lang": "English, Sotho",
  "cur": "Lesotho loti",
  "bb": [575.0, 329.6, 581.5, 335.1],
  "ci": [],
  "lat": -29.5,
  "lng": 28.5,
  "area": 30355,
  "areaR": 142,
  "pop": 2337423,
  "popR": 146,
  "gdp": 2046039024,
  "gdpR": 188,
  "pc": 875,
  "lvl": "저소득"
}, {
  "i": "ROU",
  "en": "Romania",
  "d": "M563.1,117.0 564.3,116.4 566.0,116.7 567.8,116.7 569.1,117.4 570.0,117.0 572.1,116.7 572.8,116.1 573.9,116.1 574.8,116.3 575.6,117.1 576.5,118.3 578.1,120.0 578.2,121.2 577.9,122.4 578.4,123.6 579.7,124.2 581.0,123.7 582.2,124.2 582.3,124.9 580.9,125.5 580.1,125.2 579.3,128.6 577.7,128.3 575.7,127.3 572.4,127.9 571.0,128.6 566.9,128.5 564.8,128.1 563.7,128.3 562.9,127.1 562.4,126.6 563.1,126.2 562.4,125.8 561.5,126.4 559.9,125.6 559.7,124.5 558.0,123.8 557.7,123.0 556.2,121.9 558.4,121.3 560.1,119.5 561.4,117.6 563.1,117.0Z",
  "cx": 569.6,
  "cy": 122.5,
  "n": "루마니아",
  "ct": "유럽",
  "cap": "Bucharest",
  "fl": "🇷🇴",
  "lang": "Romanian",
  "cur": "Romanian leu",
  "bb": [556.2, 116.1, 582.3, 128.6],
  "ci": [{
    "n": "Bucharest",
    "x": 572.5,
    "y": 126.6,
    "c": 1
  }, {
    "n": "Iasi",
    "x": 576.7,
    "y": 119.0,
    "c": 0
  }, {
    "n": "Cluj-Napoca",
    "x": 565.6,
    "y": 120.1,
    "c": 0
  }, {
    "n": "Timisoara",
    "x": 559.0,
    "y": 122.9,
    "c": 0
  }, {
    "n": "Craiova",
    "x": 566.1,
    "y": 126.9,
    "c": 0
  }, {
    "n": "Constanta",
    "x": 579.6,
    "y": 127.3,
    "c": 0
  }, {
    "n": "Galati",
    "x": 577.9,
    "y": 123.8,
    "c": 0
  }, {
    "n": "Brasov",
    "x": 571.1,
    "y": 123.2,
    "c": 0
  }, {
    "n": "Ploiesti",
    "x": 572.3,
    "y": 125.1,
    "c": 0
  }],
  "lat": 46,
  "lng": 25,
  "area": 238391,
  "areaR": 84,
  "pop": 19051804,
  "popR": 66,
  "gdp": 351002579630,
  "gdpR": 44,
  "pc": 18424,
  "lvl": "고소득"
}, {
  "i": "LUX",
  "en": "Luxembourg",
  "d": "M516.8,110.8 517.3,111.4 517.2,112.6 516.4,112.7 515.8,112.4 516.1,110.9 516.8,110.8Z",
  "cx": 516.6,
  "cy": 111.7,
  "n": "룩셈부르크",
  "ct": "유럽",
  "cap": "Luxembourg",
  "fl": "🇱🇺",
  "lang": "German, French",
  "cur": "Euro",
  "bb": [515.8, 110.8, 517.3, 112.7],
  "ci": [{
    "n": "Luxembourg",
    "x": 517.0,
    "y": 112.2,
    "c": 1
  }, {
    "n": "Esch-sur-Alzette",
    "x": 516.6,
    "y": 112.5,
    "c": 0
  }, {
    "n": "Dudelange",
    "x": 516.9,
    "y": 112.6,
    "c": 0
  }, {
    "n": "Schifflange",
    "x": 516.7,
    "y": 112.5,
    "c": 0
  }, {
    "n": "Bettembourg",
    "x": 517.0,
    "y": 112.4,
    "c": 0
  }, {
    "n": "Petange",
    "x": 516.3,
    "y": 112.3,
    "c": 0
  }, {
    "n": "Ettelbruck",
    "x": 517.0,
    "y": 111.5,
    "c": 0
  }, {
    "n": "Diekirch",
    "x": 517.1,
    "y": 111.5,
    "c": 0
  }, {
    "n": "Strassen",
    "x": 516.9,
    "y": 112.2,
    "c": 0
  }],
  "lat": 49.8,
  "lng": 6.2,
  "area": 2586,
  "areaR": 180,
  "pop": 677012,
  "popR": 166,
  "gdp": 85755006124,
  "gdpR": 74,
  "pc": 126667,
  "lvl": "고소득"
}, {
  "i": "RWA",
  "en": "Rwanda",
  "d": "M584.5,253.2 585.6,254.7 585.4,256.4 584.6,256.7 583.2,256.5 582.3,258.1 580.6,257.9 580.9,256.4 581.3,256.2 581.4,254.5 582.2,253.7 582.8,254.0 584.5,253.2Z",
  "cx": 583.0,
  "cy": 255.5,
  "n": "르완다",
  "ct": "아프리카",
  "cap": "Kigali",
  "fl": "🇷🇼",
  "lang": "English, French",
  "cur": "Rwandan franc",
  "bb": [580.6, 253.2, 585.6, 258.1],
  "ci": [],
  "lat": -2,
  "lng": 30,
  "area": 26338,
  "areaR": 149,
  "pop": 14256567,
  "popR": 76,
  "gdp": 14097768648,
  "gdpR": 143,
  "pc": 989,
  "lvl": "저소득"
}, {
  "i": "LBY",
  "en": "Libya",
  "d": "M541.3,186.5 539.3,187.5 537.7,186.0 533.3,184.8 532.1,183.1 529.9,181.8 528.6,182.3 527.6,180.7 527.5,179.5 525.9,177.5 527.0,176.4 526.7,174.6 527.1,173.1 526.9,171.8 527.4,169.6 527.2,168.3 526.3,165.8 527.7,165.2 527.9,164.0 527.6,162.8 529.5,161.8 530.4,160.9 531.8,160.1 531.9,158.0 535.2,158.9 536.3,158.7 538.7,159.1 542.3,160.4 543.6,162.8 546.1,163.4 550.1,164.5 553.0,165.9 554.4,165.2 555.7,163.9 555.1,161.8 555.9,160.4 557.9,159.1 559.8,158.8 563.6,159.3 564.5,160.6 565.6,160.6 566.5,161.1 569.2,161.4 569.9,162.3 568.9,163.6 569.3,164.8 568.6,166.5 569.4,168.8 569.4,178.7 569.4,188.9 569.4,194.4 566.2,194.4 566.2,195.6 555.1,190.3 544.1,185.0 541.3,186.5Z",
  "cx": 545.7,
  "cy": 170.9,
  "n": "리비아",
  "ct": "아프리카",
  "cap": "Tripoli",
  "fl": "🇱🇾",
  "lang": "Arabic",
  "cur": "Libyan dinar",
  "bb": [525.9, 158.0, 569.9, 195.6],
  "ci": [{
    "n": "Tripoli",
    "x": 536.6,
    "y": 158.6,
    "c": 1
  }, {
    "n": "Banghazi",
    "x": 555.7,
    "y": 160.8,
    "c": 0
  }, {
    "n": "Misratah",
    "x": 541.9,
    "y": 160.1,
    "c": 0
  }, {
    "n": "Tarhunah",
    "x": 537.9,
    "y": 159.9,
    "c": 0
  }, {
    "n": "Al Khums",
    "x": 539.6,
    "y": 159.3,
    "c": 0
  }, {
    "n": "Harat az Zawiyah",
    "x": 535.3,
    "y": 159.0,
    "c": 0
  }, {
    "n": "Zuwarah",
    "x": 533.6,
    "y": 158.5,
    "c": 0
  }, {
    "n": "Ajdabiya",
    "x": 556.2,
    "y": 164.6,
    "c": 0
  }, {
    "n": "Surt",
    "x": 546.1,
    "y": 163.3,
    "c": 0
  }],
  "lat": 25,
  "lng": 17,
  "area": 1759540,
  "areaR": 18,
  "pop": 7381023,
  "popR": 105,
  "gdp": 50491722446,
  "gdpR": 92,
  "pc": 6841,
  "lvl": "중상위 소득"
}, {
  "i": "LTU",
  "en": "Lithuania",
  "d": "M563.1,99.1 562.9,98.4 563.2,97.6 562.0,97.2 559.1,96.7 558.5,94.4 561.7,93.5 566.3,93.7 569.1,93.4 569.4,94.0 570.9,94.2 573.6,95.5 573.9,96.8 571.6,97.6 570.9,99.2 567.9,100.3 565.2,100.2 564.6,99.4 563.1,99.1Z",
  "cx": 566.2,
  "cy": 96.9,
  "n": "리투아니아",
  "ct": "유럽",
  "cap": "Vilnius",
  "fl": "🇱🇹",
  "lang": "Lithuanian",
  "cur": "Euro",
  "bb": [558.5, 93.4, 573.9, 100.3],
  "ci": [{
    "n": "Vilnius",
    "x": 570.3,
    "y": 98.1,
    "c": 1
  }, {
    "n": "Kaunas",
    "x": 566.4,
    "y": 97.5,
    "c": 0
  }, {
    "n": "Klaipeda",
    "x": 558.7,
    "y": 95.2,
    "c": 0
  }, {
    "n": "Siauliai",
    "x": 564.8,
    "y": 94.6,
    "c": 0
  }, {
    "n": "Dainava (Kaunas)",
    "x": 566.6,
    "y": 97.5,
    "c": 0
  }, {
    "n": "Panevezys",
    "x": 567.6,
    "y": 95.2,
    "c": 0
  }, {
    "n": "Alytus",
    "x": 566.8,
    "y": 98.9,
    "c": 0
  }, {
    "n": "Marijampole",
    "x": 564.9,
    "y": 98.4,
    "c": 0
  }, {
    "n": "Mazeikiai",
    "x": 562.0,
    "y": 93.6,
    "c": 0
  }],
  "lat": 56,
  "lng": 24,
  "area": 65300,
  "areaR": 125,
  "pop": 2888278,
  "popR": 138,
  "gdp": 77836396963,
  "gdpR": 81,
  "pc": 26949,
  "lvl": "고소득"
}, {
  "i": "MDG",
  "en": "Madagascar",
  "d": "M637.6,284.6 638.4,285.8 639.0,287.7 639.5,291.0 640.2,292.3 639.9,293.6 639.4,294.4 638.5,292.8 638.0,293.6 638.5,295.7 638.3,296.9 637.5,297.5 637.3,299.9 636.2,303.1 634.9,306.9 633.1,312.2 632.1,316.1 630.8,319.3 628.6,319.9 626.1,321.1 624.5,320.4 622.3,319.4 621.6,317.9 621.4,315.5 620.4,313.3 620.2,311.3 620.6,309.3 621.9,308.8 621.9,307.9 623.3,305.8 623.5,304.0 622.9,302.7 622.3,300.9 622.1,298.4 623.1,296.8 623.5,295.0 624.8,294.9 626.4,294.4 627.4,293.9 628.6,293.8 630.2,292.3 632.5,290.5 633.3,289.1 633.0,288.0 634.1,288.3 635.7,286.4 635.7,284.7 636.7,283.4 637.6,284.6Z",
  "cx": 630.5,
  "cy": 299.9,
  "n": "마다가스카르",
  "ct": "아프리카",
  "cap": "Antananarivo",
  "fl": "🇲🇬",
  "lang": "French, Malagasy",
  "cur": "Malagasy ariary",
  "bb": [620.2, 283.4, 640.2, 321.1],
  "ci": [],
  "lat": -20,
  "lng": 47,
  "area": 587041,
  "areaR": 47,
  "pop": 31964956,
  "popR": 49,
  "gdp": 16031702915,
  "gdpR": 135,
  "pc": 502,
  "lvl": "저소득"
}, {
  "i": "MWI",
  "en": "Malawi",
  "d": "M596.0,282.0 595.2,284.1 596.0,287.7 597.0,287.7 598.0,288.6 599.1,290.6 599.4,294.2 598.2,294.7 597.3,296.7 595.5,295.0 595.3,293.0 595.9,291.7 595.7,290.6 594.6,289.9 593.9,290.1 592.3,288.8 590.8,288.1 591.6,285.5 592.5,284.5 592.0,282.2 592.5,280.0 593.0,279.2 592.3,276.9 591.0,275.6 593.7,276.2 594.3,276.9 595.2,278.2 596.0,282.0Z",
  "cx": 594.8,
  "cy": 286.1,
  "n": "말라위",
  "ct": "아프리카",
  "cap": "Lilongwe",
  "fl": "🇲🇼",
  "lang": "English, Chewa",
  "cur": "Malawian kwacha",
  "bb": [590.8, 275.6, 599.4, 296.7],
  "ci": [{
    "n": "Antananarivo",
    "x": 632.0,
    "y": 302.5,
    "c": 0
  }, {
    "n": "Toamasina",
    "x": 637.2,
    "y": 300.5,
    "c": 0
  }, {
    "n": "Fianarantsoa",
    "x": 630.8,
    "y": 309.5,
    "c": 0
  }, {
    "n": "Mahajanga",
    "x": 628.7,
    "y": 293.7,
    "c": 0
  }, {
    "n": "Toliara",
    "x": 621.3,
    "y": 314.9,
    "c": 0
  }, {
    "n": "Antsiranana",
    "x": 636.9,
    "y": 284.1,
    "c": 0
  }, {
    "n": "Antanifotsy",
    "x": 631.4,
    "y": 304.6,
    "c": 0
  }, {
    "n": "Ambovombe",
    "x": 628.0,
    "y": 319.9,
    "c": 0
  }, {
    "n": "Amparafaravola",
    "x": 633.9,
    "y": 298.8,
    "c": 0
  }],
  "lat": -13.5,
  "lng": 34,
  "area": 118484,
  "areaR": 101,
  "pop": 21655286,
  "popR": 61,
  "gdp": 14084341062,
  "gdpR": 144,
  "pc": 650,
  "lvl": "저소득"
}, {
  "i": "MYS",
  "en": "Malaysia",
  "d": "M780.8,232.8 781.0,234.2 782.8,233.9 783.7,232.7 784.4,233.0 786.0,234.7 787.2,236.5 787.3,238.4 787.0,239.6 787.3,240.6 787.5,242.2 788.5,243.0 789.6,245.5 789.5,246.4 787.6,246.6 784.9,244.5 781.6,242.3 781.3,240.9 779.7,239.1 779.3,236.8 778.3,235.2 778.6,233.2 778.0,232.0 778.5,231.5 780.8,232.8Z M829.5,237.6 827.5,238.5 825.0,238.0 821.8,238.0 820.9,241.2 819.8,242.2 818.4,246.0 816.1,246.6 813.5,245.8 812.2,246.1 810.5,247.5 808.8,247.3 807.0,247.9 805.1,246.3 804.6,244.4 806.7,245.4 808.8,244.9 809.4,242.5 810.5,242.0 813.9,241.4 815.9,239.2 817.2,237.4 818.5,238.9 819.1,237.9 820.4,238.0 820.6,236.2 820.7,234.9 822.8,232.9 824.2,230.8 825.4,230.8 826.8,232.2 826.9,233.4 828.7,234.1 831.1,235.0 830.9,236.1 829.0,236.2 829.5,237.6Z",
  "cx": 804.7,
  "cy": 239.0,
  "n": "말레이시아",
  "ct": "아시아",
  "cap": "Kuala Lumpur",
  "fl": "🇲🇾",
  "lang": "English, Malay",
  "cur": "Malaysian ringgit",
  "bb": [778.0, 230.8, 831.1, 247.9],
  "ci": [{
    "n": "Lilongwe",
    "x": 593.8,
    "y": 288.8,
    "c": 0
  }, {
    "n": "Blantyre",
    "x": 597.2,
    "y": 293.8,
    "c": 0
  }, {
    "n": "Zomba",
    "x": 598.1,
    "y": 292.7,
    "c": 0
  }, {
    "n": "Kasungu",
    "x": 593.0,
    "y": 286.2,
    "c": 0
  }, {
    "n": "Mangochi",
    "x": 598.0,
    "y": 290.2,
    "c": 0
  }, {
    "n": "Karonga",
    "x": 594.3,
    "y": 277.6,
    "c": 0
  }, {
    "n": "Salima",
    "x": 595.6,
    "y": 288.3,
    "c": 0
  }, {
    "n": "Nkhotakota",
    "x": 595.3,
    "y": 285.9,
    "c": 0
  }, {
    "n": "Liwonde",
    "x": 597.8,
    "y": 291.9,
    "c": 0
  }],
  "lat": 2.5,
  "lng": 112.5,
  "area": 330803,
  "areaR": 69,
  "pop": 35557673,
  "popR": 44,
  "gdp": 399648828547,
  "gdpR": 38,
  "pc": 11239,
  "lvl": "중상위 소득"
}, {
  "i": "MLI",
  "en": "Mali",
  "d": "M466.2,209.4 467.1,208.9 467.6,207.3 468.5,207.2 470.4,208.0 472.0,207.4 473.1,207.6 473.5,207.0 484.6,206.9 485.2,205.0 484.8,204.7 483.4,192.7 482.1,180.7 486.3,180.6 495.7,186.7 505.1,192.7 505.7,194.0 507.5,194.8 508.7,195.3 508.8,197.1 511.9,196.8 511.9,203.2 510.3,205.0 510.1,206.8 507.6,207.2 503.8,207.4 502.8,208.4 501.0,208.5 499.3,208.5 498.6,208.0 497.0,208.4 494.4,209.6 493.9,210.4 491.8,211.7 491.4,212.4 490.2,213.0 488.9,212.6 488.1,213.3 487.7,215.2 485.5,217.5 485.6,218.4 484.8,219.6 485.0,221.2 483.8,221.6 483.2,222.0 482.8,220.8 482.0,221.1 481.5,221.0 481.0,221.8 478.8,221.8 478.1,221.4 477.7,221.6 476.8,220.8 477.0,220.0 476.6,219.7 476.1,220.0 476.2,219.1 476.7,218.4 475.6,217.2 475.3,216.4 474.6,215.8 474.1,215.7 473.4,216.1 472.5,216.5 471.8,217.1 470.6,216.9 469.8,216.2 469.3,216.1 468.6,216.5 468.2,216.5 468.0,215.4 468.1,214.6 467.9,213.5 466.9,212.7 466.3,211.1 466.2,209.4Z",
  "cx": 483.9,
  "cy": 210.8,
  "n": "말리",
  "ct": "아프리카",
  "cap": "Bamako",
  "fl": "🇲🇱",
  "lang": "French",
  "cur": "West African CFA franc",
  "bb": [466.2, 180.6, 511.9, 222.0],
  "ci": [{
    "n": "Male",
    "x": 704.2,
    "y": 238.4,
    "c": 0
  }, {
    "n": "Hithadhoo",
    "x": 703.0,
    "y": 251.7,
    "c": 0
  }, {
    "n": "Kulhudhuffushi",
    "x": 703.0,
    "y": 231.6,
    "c": 0
  }, {
    "n": "Thinadhoo",
    "x": 702.6,
    "y": 248.5,
    "c": 0
  }, {
    "n": "Naifaru",
    "x": 703.7,
    "y": 234.9,
    "c": 0
  }, {
    "n": "Dhidhdhoo",
    "x": 703.1,
    "y": 230.9,
    "c": 0
  }, {
    "n": "Eydhafushi",
    "x": 702.9,
    "y": 235.8,
    "c": 0
  }, {
    "n": "Mahibadhoo",
    "x": 702.7,
    "y": 239.5,
    "c": 0
  }, {
    "n": "Midu",
    "x": 703.4,
    "y": 251.6,
    "c": 0
  }],
  "lat": 17,
  "lng": -4,
  "area": 1240192,
  "areaR": 25,
  "pop": 24478595,
  "popR": 58,
  "gdp": 20904898296,
  "gdpR": 121,
  "pc": 854,
  "lvl": "저소득"
}, {
  "i": "MEX",
  "en": "Mexico",
  "d": "M230.2,178.1 229.1,180.6 228.6,182.6 228.4,186.3 228.1,187.7 228.6,189.2 229.5,190.5 230.0,192.7 231.9,194.7 232.5,196.3 233.6,197.7 236.6,198.4 237.7,199.6 240.1,198.8 242.3,198.5 244.3,198.0 246.1,197.6 247.9,196.4 248.5,194.8 248.7,192.5 249.2,191.7 251.1,190.9 254.0,190.3 256.5,190.4 258.2,190.2 258.9,190.7 258.8,192.1 257.3,193.7 256.6,195.4 257.1,195.9 256.7,197.1 256.0,199.3 255.3,198.6 254.7,198.6 254.2,198.6 253.2,200.3 252.7,200.0 252.4,200.1 252.4,200.5 249.8,200.5 247.2,200.5 247.2,202.1 246.0,202.1 247.0,203.0 248.0,203.6 248.3,204.2 248.8,204.4 248.7,205.4 245.1,205.4 243.8,207.6 244.2,208.2 243.9,208.8 243.8,209.6 240.7,206.6 239.2,205.7 237.0,205.0 235.4,205.2 233.2,206.2 231.8,206.5 229.8,205.8 227.7,205.3 225.1,204.0 223.1,203.6 219.9,202.3 217.6,201.0 216.9,200.2 215.3,200.1 212.5,199.2 211.3,197.9 208.4,196.3 207.0,194.6 206.3,193.2 207.2,193.0 206.9,192.2 207.6,191.5 207.6,190.5 206.7,189.2 206.4,188.1 205.5,186.7 203.0,184.0 200.2,181.8 198.9,180.1 196.5,178.9 196.0,178.3 196.4,176.5 195.0,175.9 193.4,174.5 192.7,172.6 191.2,172.4 189.6,170.9 188.3,169.6 188.1,168.7 186.6,166.6 185.7,164.5 185.7,163.4 183.7,162.3 182.8,162.4 181.2,161.7 180.7,162.8 181.2,164.1 181.5,166.2 182.4,167.4 184.5,169.3 184.9,169.9 185.4,170.1 185.7,171.1 186.2,171.0 186.8,172.8 187.6,173.5 188.2,174.5 190.0,175.9 190.9,178.5 191.7,179.7 192.5,181.0 192.6,182.5 194.0,182.6 195.1,183.9 196.1,185.1 196.0,185.6 194.8,186.6 194.4,186.6 193.6,184.9 191.8,183.3 189.8,182.0 188.4,181.3 188.5,179.2 188.1,177.7 186.7,176.9 184.8,175.6 184.5,176.0 183.8,175.3 182.0,174.6 180.4,173.0 180.6,172.8 181.7,172.9 182.8,171.9 182.9,170.6 180.7,168.7 179.1,167.9 178.1,166.2 177.1,164.3 175.8,162.1 174.6,159.6 177.8,159.4 181.3,159.1 181.1,159.7 185.3,161.0 191.6,163.0 197.1,162.9 199.3,162.9 199.3,161.8 204.1,161.8 205.2,162.8 206.6,163.7 208.2,164.9 209.2,166.3 209.8,167.9 211.3,168.7 213.6,169.5 215.3,167.3 217.6,167.3 219.6,168.4 221.0,170.3 221.9,171.9 223.6,173.5 224.2,175.4 224.9,176.8 227.1,177.6 229.1,178.2 230.2,178.1Z",
  "cx": 213.9,
  "cy": 183.8,
  "n": "멕시코",
  "ct": "북아메리카",
  "cap": "Mexico City",
  "fl": "🇲🇽",
  "lang": "Spanish",
  "cur": "Mexican peso",
  "bb": [174.6, 159.1, 258.9, 209.6],
  "ci": [{
    "n": "Mexico City",
    "x": 224.6,
    "y": 196.0,
    "c": 1
  }, {
    "n": "Ecatepec",
    "x": 224.9,
    "y": 195.6,
    "c": 0
  }, {
    "n": "Guadalajara",
    "x": 213.0,
    "y": 192.6,
    "c": 0
  }, {
    "n": "Ciudad Juarez",
    "x": 204.2,
    "y": 161.9,
    "c": 0
  }, {
    "n": "Puebla de Zaragoza",
    "x": 227.2,
    "y": 197.1,
    "c": 0
  }, {
    "n": "Tijuana",
    "x": 175.0,
    "y": 159.6,
    "c": 0
  }, {
    "n": "Ciudad Nezahualcoyotl",
    "x": 224.9,
    "y": 196.1,
    "c": 0
  }, {
    "n": "Monterrey",
    "x": 221.3,
    "y": 178.7,
    "c": 0
  }, {
    "n": "Leon",
    "x": 217.6,
    "y": 191.3,
    "c": 0
  }],
  "lat": 23,
  "lng": -102,
  "area": 1964375,
  "areaR": 15,
  "pop": 130861007,
  "popR": 11,
  "gdp": 1788886821047,
  "gdpR": 12,
  "pc": 13670,
  "lvl": "고소득"
}, {
  "i": "MAR",
  "en": "Morocco",
  "d": "M485.6,150.7 487.2,151.9 489.9,151.7 492.8,152.3 494.0,152.3 495.0,154.1 495.2,155.8 496.1,158.7 496.9,159.3 496.4,160.4 492.7,160.8 491.5,161.9 489.9,162.1 489.7,164.2 486.5,165.3 485.4,166.7 483.2,167.4 480.4,167.8 475.9,169.9 475.9,173.2 475.5,173.2 475.6,174.7 473.9,174.8 473.0,175.4 471.7,175.4 470.7,175.0 468.4,175.3 467.4,177.5 466.6,177.7 465.3,181.2 461.4,184.2 460.5,188.0 459.4,189.3 459.0,190.3 452.8,190.5 452.7,190.5 452.9,189.2 453.9,188.4 454.8,187.0 454.6,186.1 455.6,184.1 457.1,182.3 458.1,181.9 458.8,180.3 458.9,178.8 459.9,177.1 461.7,176.1 463.5,173.2 463.6,173.2 464.9,172.1 467.5,171.8 469.7,169.9 471.1,169.2 473.4,166.9 472.7,163.4 473.8,161.0 474.2,159.5 476.0,157.7 478.7,156.4 480.8,155.2 482.7,152.4 483.5,150.7 485.6,150.7Z",
  "cx": 473.7,
  "cy": 170.1,
  "n": "모로코",
  "ct": "아프리카",
  "cap": "Rabat",
  "fl": "🇲🇦",
  "lang": "Arabic, Berber",
  "cur": "Moroccan dirham",
  "bb": [452.7, 150.7, 496.9, 190.5],
  "ci": [{
    "n": "Casablanca",
    "x": 478.9,
    "y": 156.7,
    "c": 0
  }, {
    "n": "Rabat",
    "x": 481.0,
    "y": 155.5,
    "c": 1
  }, {
    "n": "Fes",
    "x": 486.2,
    "y": 155.4,
    "c": 0
  }, {
    "n": "Marrakech",
    "x": 477.8,
    "y": 162.1,
    "c": 0
  }, {
    "n": "Agadir",
    "x": 473.3,
    "y": 165.6,
    "c": 0
  }, {
    "n": "Tangier",
    "x": 483.9,
    "y": 150.6,
    "c": 0
  }, {
    "n": "Meknes",
    "x": 484.6,
    "y": 155.8,
    "c": 0
  }, {
    "n": "Oujda",
    "x": 494.7,
    "y": 153.7,
    "c": 0
  }, {
    "n": "Kenitra",
    "x": 481.7,
    "y": 154.8,
    "c": 0
  }],
  "lat": 32,
  "lng": -5,
  "area": 446550,
  "areaR": 59,
  "pop": 38081173,
  "popR": 39,
  "gdp": 141109373209,
  "gdpR": 61,
  "pc": 3705,
  "lvl": "중하위 소득"
}, {
  "i": "MRT",
  "en": "Mauritania",
  "d": "M466.2,209.4 464.4,207.5 462.7,205.4 460.8,204.7 459.5,203.9 458.0,203.9 456.6,204.5 455.2,204.3 454.3,205.2 454.0,203.7 454.8,202.3 455.1,199.7 454.8,197.0 454.5,195.6 454.8,194.2 454.1,192.9 452.6,191.7 453.2,190.7 464.1,190.8 463.6,186.7 464.2,185.3 466.8,185.1 466.8,178.0 475.9,178.1 475.9,173.9 486.3,180.6 482.1,180.7 483.4,192.7 484.8,204.7 485.2,205.0 484.6,206.9 473.5,207.0 473.1,207.6 472.0,207.4 470.4,208.0 468.5,207.2 467.6,207.3 467.1,208.9 466.2,209.4Z",
  "cx": 465.8,
  "cy": 198.2,
  "n": "모리타니",
  "ct": "아프리카",
  "cap": "Nouakchott",
  "fl": "🇲🇷",
  "lang": "Arabic",
  "cur": "Mauritanian ouguiya",
  "bb": [452.6, 173.9, 486.3, 209.4],
  "ci": [{
    "n": "Nouakchott",
    "x": 455.4,
    "y": 199.7,
    "c": 1
  }, {
    "n": "Nouadhibou",
    "x": 452.7,
    "y": 191.9,
    "c": 0
  }, {
    "n": "Barkewol",
    "x": 465.3,
    "y": 203.8,
    "c": 0
  }],
  "lat": 20,
  "lng": -12,
  "area": 1030700,
  "areaR": 30,
  "pop": 5169395,
  "popR": 125,
  "gdp": 10452577063,
  "gdpR": 152,
  "pc": 2022,
  "lvl": "중하위 소득"
}, {
  "i": "MOZ",
  "en": "Mozambique",
  "d": "M596.0,282.0 598.1,281.8 601.4,282.6 602.2,282.2 604.1,282.1 605.1,281.3 606.7,281.3 609.8,280.3 612.0,278.7 612.4,279.9 612.3,282.7 612.7,285.1 612.8,289.4 613.3,290.8 612.4,292.8 611.4,294.7 609.6,296.4 607.1,297.5 603.9,298.9 600.8,301.8 599.7,302.3 597.8,304.3 596.6,305.0 596.4,306.9 597.7,309.0 598.3,310.7 598.3,311.5 598.8,311.4 598.7,314.1 598.3,315.4 598.9,315.9 598.5,317.0 597.3,318.0 595.0,318.9 591.7,320.4 590.5,321.5 590.7,322.6 591.4,322.8 591.2,324.3 589.1,324.3 588.8,323.0 588.4,321.8 588.2,320.8 588.7,317.7 588.0,315.7 586.6,311.8 589.6,308.7 590.3,306.7 590.7,306.4 591.0,304.8 590.6,303.9 590.7,301.9 591.2,299.9 591.2,296.4 589.8,295.5 588.5,295.3 587.9,294.6 586.6,294.1 584.3,294.1 584.1,293.1 583.8,291.1 592.3,288.8 593.9,290.1 594.6,289.9 595.7,290.6 595.9,291.7 595.3,293.0 595.5,295.0 597.3,296.7 598.2,294.7 599.4,294.2 599.1,290.6 598.0,288.6 597.0,287.7 596.0,287.7 595.2,284.1 596.0,282.0Z",
  "cx": 596.8,
  "cy": 299.8,
  "n": "모잠비크",
  "ct": "아프리카",
  "cap": "Maputo",
  "fl": "🇲🇿",
  "lang": "Portuguese",
  "cur": "Mozambican metical",
  "bb": [583.8, 278.7, 613.3, 324.3],
  "ci": [{
    "n": "Maputo",
    "x": 590.5,
    "y": 322.1,
    "c": 1
  }, {
    "n": "Matola",
    "x": 590.2,
    "y": 322.1,
    "c": 0
  }, {
    "n": "Beira",
    "x": 596.8,
    "y": 305.1,
    "c": 0
  }, {
    "n": "Nampula",
    "x": 609.1,
    "y": 292.0,
    "c": 0
  }, {
    "n": "Chimoio",
    "x": 593.0,
    "y": 303.1,
    "c": 0
  }, {
    "n": "Cidade de Nacala",
    "x": 613.0,
    "y": 290.4,
    "c": 0
  }, {
    "n": "Quelimane",
    "x": 602.5,
    "y": 299.7,
    "c": 0
  }, {
    "n": "Tete",
    "x": 593.3,
    "y": 294.9,
    "c": 0
  }, {
    "n": "Xai-Xai",
    "x": 593.5,
    "y": 319.6,
    "c": 0
  }],
  "lat": -18.2,
  "lng": 35,
  "area": 801590,
  "areaR": 37,
  "pop": 34631766,
  "popR": 46,
  "gdp": 20624597847,
  "gdpR": 122,
  "pc": 596,
  "lvl": "저소득"
}, {
  "i": "MNE",
  "en": "Montenegro",
  "d": "M555.0,131.9 554.8,131.4 553.6,132.8 553.8,133.7 553.2,133.5 552.5,132.6 551.2,132.0 551.6,131.5 552.0,130.0 552.9,129.4 553.4,129.1 554.1,129.6 554.5,130.0 555.4,130.3 556.5,130.8 556.3,131.1 555.8,131.7 555.0,131.9Z",
  "cx": 554.0,
  "cy": 131.3,
  "n": "몬테네그로",
  "ct": "유럽",
  "cap": "Podgorica",
  "fl": "🇲🇪",
  "lang": "Montenegrin",
  "cur": "Euro",
  "bb": [551.2, 129.1, 556.5, 133.7],
  "ci": [],
  "lat": 42.5,
  "lng": 19.3,
  "area": 13812,
  "areaR": 162,
  "pop": 623525,
  "popR": 168,
  "gdp": 7404541965,
  "gdpR": 159,
  "pc": 11875,
  "lvl": "중상위 소득"
}, {
  "i": "MDA",
  "en": "Moldova",
  "d": "M573.9,116.1 574.6,115.6 576.5,115.4 578.5,116.2 579.6,116.3 580.9,117.1 580.7,118.0 581.7,118.5 582.1,119.6 583.1,120.3 582.9,120.8 583.4,121.0 582.7,121.3 581.0,121.2 580.8,120.8 580.2,121.0 580.4,121.5 579.6,122.4 579.1,123.3 578.4,123.6 577.9,122.4 578.2,121.2 578.1,120.0 576.5,118.3 575.6,117.1 574.8,116.3 573.9,116.1Z",
  "cx": 579.1,
  "cy": 119.3,
  "n": "몰도바",
  "ct": "유럽",
  "cap": "Chișinău",
  "fl": "🇲🇩",
  "lang": "Moldavian",
  "cur": "Moldovan leu",
  "bb": [573.9, 115.4, 583.4, 123.6],
  "ci": [{
    "n": "Chisinau",
    "x": 580.2,
    "y": 119.4,
    "c": 0
  }, {
    "n": "Tiraspol",
    "x": 582.3,
    "y": 119.9,
    "c": 0
  }, {
    "n": "Balti",
    "x": 577.6,
    "y": 117.3,
    "c": 0
  }, {
    "n": "Tighina",
    "x": 581.9,
    "y": 119.9,
    "c": 0
  }, {
    "n": "Stefan-Voda",
    "x": 582.4,
    "y": 120.8,
    "c": 0
  }, {
    "n": "Ribnita",
    "x": 580.6,
    "y": 117.3,
    "c": 0
  }, {
    "n": "Cahul",
    "x": 578.3,
    "y": 122.5,
    "c": 0
  }, {
    "n": "Ungheni",
    "x": 577.2,
    "y": 118.9,
    "c": 0
  }, {
    "n": "Soroca",
    "x": 578.6,
    "y": 116.2,
    "c": 0
  }],
  "lat": 47,
  "lng": 29,
  "area": 33846,
  "areaR": 140,
  "pop": 2402306,
  "popR": 144,
  "gdp": 16539436547,
  "gdpR": 134,
  "pc": 6885,
  "lvl": "중상위 소득"
}, {
  "i": "MNG",
  "en": "Mongolia",
  "d": "M743.8,113.1 746.7,112.6 752.0,110.2 756.2,108.9 758.6,109.7 761.5,109.8 763.4,111.1 766.2,111.2 770.2,111.9 772.9,109.9 771.7,108.3 774.6,105.4 777.7,106.6 780.2,106.9 783.5,107.6 784.0,109.7 788.0,110.9 790.6,110.3 794.1,110.0 796.9,110.3 799.6,111.7 801.3,113.1 803.9,113.1 807.4,113.5 809.9,112.8 813.6,112.4 817.7,110.4 819.3,110.7 820.8,111.7 824.1,111.4 822.8,113.5 820.8,116.3 821.5,117.4 823.1,117.1 825.8,117.5 828.0,116.5 830.2,117.4 832.7,119.3 832.4,120.3 830.2,120.0 826.2,120.4 824.2,121.1 822.2,123.0 817.9,124.1 815.2,125.5 812.3,125.0 810.8,124.7 809.3,126.5 810.2,127.6 810.6,128.5 808.7,129.4 806.7,130.9 803.5,131.9 799.3,132.0 794.8,133.0 791.6,134.5 790.3,133.6 787.0,133.6 782.9,131.9 780.1,131.5 776.4,131.9 770.7,131.3 767.6,131.3 766.0,129.7 764.7,127.1 763.0,126.8 759.7,125.1 755.9,124.7 752.6,124.2 751.6,123.0 752.7,119.8 750.8,117.5 746.8,116.5 744.5,115.0 743.8,113.1Z",
  "cx": 790.5,
  "cy": 118.9,
  "n": "몽골국",
  "ct": "아시아",
  "cap": "Ulan Bator",
  "fl": "🇲🇳",
  "lang": "Mongolian",
  "cur": "Mongolian tögrög",
  "bb": [743.8, 105.4, 832.7, 134.5],
  "ci": [],
  "lat": 46,
  "lng": 105,
  "area": 1564110,
  "areaR": 20,
  "pop": 3524788,
  "popR": 132,
  "gdp": 19872180370,
  "gdpR": 125,
  "pc": 5638,
  "lvl": "중상위 소득"
}, {
  "i": "USA",
  "en": "United States of America",
  "d": "M67.9,197.0 67.5,197.5 66.8,197.1 66.9,196.3 66.5,195.3 66.6,195.0 67.1,194.5 66.9,194.0 67.1,193.7 67.3,193.8 68.3,194.2 68.8,194.5 69.3,194.8 70.0,195.8 69.9,196.0 68.8,196.6 67.9,197.0Z M66.4,192.7 65.5,192.9 65.0,192.3 64.7,192.0 64.7,191.9 65.0,191.6 66.0,191.9 66.7,192.3 66.4,192.7Z M62.1,190.8 61.9,190.9 61.7,190.9 60.8,190.8 60.4,190.2 60.3,190.1 61.0,189.7 61.3,189.9 62.1,190.8Z M57.4,188.9 57.0,189.2 56.1,188.7 56.3,188.5 56.7,188.2 57.3,188.3 57.4,188.9Z M236.6,112.8 237.1,114.3 238.0,114.8 239.9,115.0 242.8,115.4 245.4,116.3 247.7,115.9 251.1,116.6 252.0,116.6 254.5,115.8 257.1,116.8 259.8,117.9 262.1,118.8 264.2,119.7 264.5,120.5 265.2,120.7 265.0,121.0 265.7,121.1 266.3,120.8 266.4,121.5 267.0,121.9 267.7,121.9 268.1,122.2 267.8,122.7 270.7,124.0 271.3,126.6 271.8,129.0 271.0,130.6 269.7,132.1 269.1,133.1 269.1,133.4 269.4,133.8 270.3,134.2 271.0,134.2 274.2,132.8 277.1,132.3 280.7,130.9 280.8,130.7 280.5,129.8 280.1,129.3 281.3,128.8 284.1,128.8 286.6,128.8 287.5,127.7 287.8,127.5 290.8,125.5 292.0,125.0 296.3,125.0 301.4,125.0 301.7,124.3 302.5,124.2 303.7,123.7 304.7,122.5 305.6,120.3 307.7,118.2 308.6,118.9 310.5,118.5 311.7,119.3 311.7,123.0 313.5,124.6 314.0,125.5 311.0,126.9 308.2,127.8 305.2,128.7 303.8,130.3 303.3,130.9 303.3,132.4 304.2,133.9 305.3,133.9 305.0,132.9 305.9,133.5 305.7,134.3 303.8,134.8 302.4,134.7 300.4,135.2 299.2,135.4 297.6,135.5 295.2,136.3 299.3,135.8 300.2,136.3 296.3,137.1 294.5,137.1 294.6,136.8 293.7,137.6 294.5,137.7 293.9,139.7 291.9,141.8 291.7,141.1 291.1,141.0 290.2,140.3 290.8,141.8 291.5,142.3 291.5,143.3 290.6,144.4 289.1,146.6 288.8,146.5 289.7,144.6 288.2,143.6 287.9,141.3 287.4,142.5 288.0,144.2 286.1,143.8 288.1,144.7 288.2,147.3 289.0,147.5 289.3,148.5 289.6,151.2 287.9,153.3 285.0,154.1 283.2,155.8 281.8,155.9 280.4,157.0 280.0,157.9 276.9,159.7 275.4,161.0 274.1,162.7 273.6,164.6 274.1,166.6 275.1,168.9 276.3,170.9 276.3,172.1 277.6,175.3 277.5,177.2 277.4,178.3 276.7,180.0 275.9,180.3 274.5,180.0 274.1,178.8 273.0,178.1 271.6,175.8 270.3,173.6 269.8,172.5 270.4,170.7 269.6,169.2 267.5,166.8 266.4,166.4 263.6,167.7 263.1,167.5 261.7,166.2 260.0,165.6 256.9,165.9 254.4,165.6 252.3,165.8 251.1,166.2 251.6,167.0 251.6,168.1 252.2,168.6 251.6,169.0 250.6,168.6 249.6,169.1 247.6,169.0 245.5,167.6 243.1,167.9 241.0,167.3 239.3,167.5 237.0,168.1 234.4,170.2 231.7,171.4 230.2,172.7 229.5,173.9 229.5,175.9 229.6,177.2 230.2,178.1 229.1,178.2 227.1,177.6 224.9,176.8 224.2,175.4 223.6,173.5 221.9,171.9 221.0,170.3 219.6,168.4 217.6,167.3 215.3,167.3 213.6,169.5 211.3,168.7 209.8,167.9 209.2,166.3 208.2,164.9 206.6,163.7 205.2,162.8 204.1,161.8 199.3,161.8 199.3,162.9 197.1,162.9 191.6,163.0 185.3,161.0 181.1,159.7 181.3,159.1 177.8,159.4 174.6,159.6 174.2,158.2 172.4,156.6 171.1,156.3 170.8,155.5 169.2,155.3 168.2,154.6 165.6,154.3 164.9,153.9 164.6,152.3 161.9,149.6 159.6,145.7 159.7,145.0 158.5,144.1 156.3,141.8 155.9,139.5 154.4,138.0 155.1,135.7 155.0,133.3 154.1,131.2 155.2,128.6 155.5,126.1 155.8,123.5 155.3,119.8 154.5,117.4 153.6,116.2 154.0,115.6 158.0,116.6 159.5,119.2 160.2,118.4 159.7,116.2 158.8,113.9 166.7,113.9 174.9,113.9 177.6,113.9 186.1,113.9 194.3,113.9 202.6,113.9 211.0,113.9 220.4,113.9 229.9,113.9 235.7,113.9 235.7,112.8 236.6,112.8Z M75.0,91.3 72.2,92.4 70.8,91.7 70.4,90.4 72.9,89.4 74.4,89.0 76.2,89.2 77.4,90.0 75.0,91.3Z M40.1,83.6 38.4,84.0 36.5,83.5 34.8,82.7 37.6,82.3 39.8,82.5 40.1,83.6Z M23.0,72.8 24.7,73.4 26.4,73.1 28.7,73.8 31.4,74.2 31.2,74.5 29.1,75.1 27.0,74.5 25.9,74.0 23.5,74.1 22.8,73.9 23.0,72.8Z M69.3,52.4 71.3,53.6 72.5,53.1 77.2,53.3 77.0,53.9 81.3,54.4 84.1,54.1 90.0,55.0 95.3,55.2 97.4,55.6 101.1,55.1 105.4,56.0 108.4,56.4 108.4,66.7 108.3,82.5 111.1,82.6 113.8,83.3 115.7,84.5 118.2,86.4 120.9,84.8 123.7,83.9 125.2,85.4 127.0,86.5 129.6,87.7 131.3,89.7 134.1,92.9 138.9,94.7 138.9,96.4 137.4,97.8 135.9,96.7 133.4,95.8 132.6,93.4 129.1,91.2 127.6,88.5 124.9,88.4 120.5,88.3 117.2,87.5 111.5,84.6 108.8,84.1 104.0,83.1 100.1,83.3 94.7,82.1 91.3,80.9 88.3,81.5 88.8,83.4 87.3,83.6 84.1,84.2 81.6,85.1 78.6,85.7 78.2,84.0 79.4,81.3 82.4,80.5 81.6,79.8 78.1,81.3 76.2,83.2 72.2,85.1 74.2,86.5 71.6,88.5 68.6,89.6 65.8,90.5 65.1,91.7 60.8,93.2 59.9,94.5 56.7,95.6 54.8,95.4 52.2,96.2 49.3,97.2 47.0,98.1 42.3,98.9 41.8,98.4 44.9,97.1 47.6,96.3 50.5,94.7 54.0,94.4 55.4,93.3 59.2,91.6 59.8,91.1 61.9,90.1 62.4,88.0 63.8,86.3 60.6,87.2 59.7,86.7 58.2,87.7 56.4,86.3 55.6,87.3 54.6,85.9 51.8,87.0 50.1,87.0 49.8,85.4 50.3,84.4 48.6,83.4 44.9,83.9 42.6,82.6 40.7,81.9 40.7,80.4 38.6,79.2 39.6,77.6 41.9,76.0 42.9,74.6 45.1,74.4 47.0,74.8 49.3,73.5 51.3,73.7 53.4,72.9 52.9,71.6 51.3,71.1 53.4,70.0 51.7,70.1 48.7,70.7 47.9,71.3 45.7,70.7 41.8,71.0 37.7,70.3 36.5,69.2 33.0,67.6 36.9,66.4 43.1,65.1 45.4,65.1 45.0,66.5 50.9,66.3 48.6,64.6 45.2,63.6 43.2,62.2 40.6,61.0 36.8,60.1 38.3,58.7 43.2,58.6 46.8,57.3 47.4,55.9 50.3,54.6 53.0,54.3 58.2,53.1 60.8,53.3 65.1,51.8 69.3,52.4Z",
  "cx": 164.0,
  "cy": 124.2,
  "n": "미국",
  "ct": "북아메리카",
  "cap": "Washington D.WC.",
  "fl": "🇺🇸",
  "lang": "English",
  "cur": "United States dollar",
  "bb": [22.8, 51.8, 314.0, 197.5],
  "ci": [{
    "n": "New York City",
    "x": 294.4,
    "y": 136.9,
    "c": 0
  }, {
    "n": "Los Angeles",
    "x": 171.5,
    "y": 155.4,
    "c": 0
  }, {
    "n": "Chicago",
    "x": 256.5,
    "y": 133.7,
    "c": 0
  }, {
    "n": "Houston",
    "x": 235.1,
    "y": 167.3,
    "c": 0
  }, {
    "n": "Philadelphia",
    "x": 291.2,
    "y": 139.0,
    "c": 0
  }, {
    "n": "Phoenix",
    "x": 188.7,
    "y": 157.1,
    "c": 0
  }, {
    "n": "San Antonio",
    "x": 226.4,
    "y": 168.3,
    "c": 0
  }, {
    "n": "San Diego",
    "x": 174.6,
    "y": 159.1,
    "c": 0
  }, {
    "n": "Dallas",
    "x": 231.1,
    "y": 158.9,
    "c": 0
  }],
  "lat": 38,
  "lng": -97,
  "area": 9372610,
  "areaR": 5,
  "pop": 340110988,
  "popR": 3,
  "gdp": 27360935000000,
  "gdpR": 1,
  "pc": 80447,
  "lvl": "고소득"
}, {
  "i": "MMR",
  "en": "Myanmar",
  "d": "M776.5,193.9 774.9,195.1 772.9,195.3 771.7,198.3 770.5,198.8 771.8,201.2 773.6,203.2 774.7,205.1 773.7,207.5 772.8,208.0 773.4,209.4 775.3,211.6 775.6,213.1 775.5,214.4 776.6,217.0 775.1,219.6 773.8,222.4 773.5,220.3 774.3,218.2 773.4,216.6 773.6,213.5 772.5,212.1 771.6,208.8 771.1,205.3 769.9,203.0 768.1,204.4 764.9,206.3 763.4,206.1 761.6,205.5 762.6,202.0 762.0,199.4 759.8,196.2 760.2,195.2 758.6,194.8 756.6,192.6 756.4,190.3 757.4,190.8 757.4,188.8 758.8,188.1 758.5,186.9 759.1,186.0 759.2,183.1 761.4,183.7 762.6,181.5 762.8,180.1 764.3,177.8 764.2,176.2 767.8,174.3 769.8,174.8 769.6,173.1 770.6,172.5 770.4,171.5 772.0,171.3 772.9,172.9 774.1,173.6 774.2,175.7 774.1,178.0 771.5,180.3 771.1,183.6 774.1,183.2 774.7,185.7 776.5,186.3 775.7,188.6 777.7,189.6 778.9,190.1 781.0,189.3 781.1,190.5 778.7,192.3 778.1,193.3 776.5,193.9Z",
  "cx": 769.8,
  "cy": 194.5,
  "n": "미얀마",
  "ct": "아시아",
  "cap": "Naypyidaw",
  "fl": "🇲🇲",
  "lang": "Burmese",
  "cur": "Burmese kyat",
  "bb": [756.4, 171.3, 781.1, 222.4],
  "ci": [{
    "n": "Rangoon",
    "x": 767.1,
    "y": 203.3,
    "c": 0
  }, {
    "n": "Mandalay",
    "x": 766.9,
    "y": 188.9,
    "c": 0
  }, {
    "n": "Mawlamyine",
    "x": 771.2,
    "y": 204.2,
    "c": 0
  }, {
    "n": "Bago",
    "x": 768.0,
    "y": 201.8,
    "c": 0
  }, {
    "n": "Pathein",
    "x": 763.1,
    "y": 203.4,
    "c": 0
  }, {
    "n": "Monywa",
    "x": 764.3,
    "y": 188.6,
    "c": 0
  }, {
    "n": "Akyab",
    "x": 758.1,
    "y": 194.0,
    "c": 0
  }, {
    "n": "Meiktila",
    "x": 766.3,
    "y": 192.0,
    "c": 0
  }, {
    "n": "Myeik",
    "x": 773.9,
    "y": 215.5,
    "c": 0
  }],
  "lat": 22,
  "lng": 98,
  "area": 676578,
  "areaR": 41,
  "pop": 54500091,
  "popR": 27,
  "gdp": 64815031669,
  "gdpR": 89,
  "pc": 1189,
  "lvl": "중하위 소득"
}, {
  "i": "VUT",
  "en": "Vanuatu",
  "d": "M966.2,295.7 965.3,296.1 964.4,294.9 964.5,294.1 966.2,295.7Z M964.2,291.5 964.6,293.7 963.9,293.4 963.3,293.5 962.9,292.8 962.9,290.6 964.2,291.5Z",
  "cx": 964.4,
  "cy": 293.6,
  "n": "바누아투",
  "ct": "오세아니아",
  "cap": "Port Vila",
  "fl": "🇻🇺",
  "lang": "Bislama, English",
  "cur": "Vanuatu vatu",
  "bb": [962.9, 290.6, 966.2, 296.1],
  "ci": [],
  "lat": -16,
  "lng": 167,
  "area": 12189,
  "areaR": 163,
  "pop": 327777,
  "popR": 176,
  "gdp": 1126313359,
  "gdpR": 197,
  "pc": 3436,
  "lvl": "중하위 소득"
}, {
  "i": "BHS",
  "en": "The Bahamas",
  "d": "M284.6,184.0 283.9,184.1 283.2,182.5 282.2,181.7 282.8,180.0 283.6,180.1 284.6,182.4 284.6,184.0Z M283.8,176.2 280.8,176.6 280.6,175.6 281.9,175.4 283.8,175.4 283.8,176.2Z M286.1,176.1 285.6,178.1 285.1,177.8 285.2,176.3 283.9,175.2 283.9,174.9 286.1,176.1Z",
  "cx": 283.8,
  "cy": 178.5,
  "n": "바하마",
  "ct": "북아메리카",
  "cap": "Nassau",
  "fl": "🇧🇸",
  "lang": "English",
  "cur": "Bahamian dollar",
  "bb": [280.6, 174.9, 286.1, 184.1],
  "ci": [],
  "lat": 24.2,
  "lng": -76,
  "area": 13943,
  "areaR": 161,
  "pop": 401283,
  "popR": 174,
  "gdp": 14338500000,
  "gdpR": 142,
  "pc": 35732,
  "lvl": "고소득"
}, {
  "i": "BGD",
  "en": "Bangladesh",
  "d": "M757.4,188.8 757.4,190.8 756.4,190.3 756.6,192.6 755.8,191.1 755.6,189.7 755.1,188.4 753.9,186.8 751.4,186.7 751.6,187.8 750.8,189.3 749.6,188.8 749.2,189.3 748.4,189.0 747.3,188.7 746.9,186.4 745.9,184.4 746.4,182.7 744.7,181.9 745.3,180.9 747.0,179.9 745.0,178.4 746.0,176.5 748.2,177.7 749.5,177.9 749.8,179.8 752.4,180.2 755.0,180.1 756.6,180.6 755.3,183.0 754.1,183.1 753.2,184.7 754.7,186.2 755.2,184.4 756.0,184.4 757.4,188.8Z",
  "cx": 751.7,
  "cy": 185.0,
  "n": "방글라데시",
  "ct": "아시아",
  "cap": "Dhaka",
  "fl": "🇧🇩",
  "lang": "Bengali",
  "cur": "Bangladeshi taka",
  "bb": [744.7, 176.5, 757.4, 192.6],
  "ci": [{
    "n": "Dhaka",
    "x": 751.1,
    "y": 184.1,
    "c": 1
  }, {
    "n": "Chittagong",
    "x": 755.1,
    "y": 188.0,
    "c": 0
  }, {
    "n": "Khulna",
    "x": 748.8,
    "y": 186.7,
    "c": 0
  }, {
    "n": "Rajshahi",
    "x": 746.1,
    "y": 182.3,
    "c": 0
  }, {
    "n": "Comilla",
    "x": 753.3,
    "y": 184.8,
    "c": 0
  }, {
    "n": "Tungi",
    "x": 751.1,
    "y": 183.6,
    "c": 0
  }, {
    "n": "Mymensingh",
    "x": 751.1,
    "y": 181.2,
    "c": 0
  }, {
    "n": "Rangpur",
    "x": 747.9,
    "y": 178.5,
    "c": 0
  }, {
    "n": "Narsingdi",
    "x": 752.0,
    "y": 183.6,
    "c": 0
  }],
  "lat": 24,
  "lng": 90,
  "area": 147570,
  "areaR": 95,
  "pop": 173562364,
  "popR": 8,
  "gdp": 437415331041,
  "gdpR": 33,
  "pc": 2520,
  "lvl": "중하위 소득"
}, {
  "i": "BEN",
  "en": "Benin",
  "d": "M507.5,232.6 505.2,232.9 504.5,231.0 504.6,224.6 504.1,224.1 504.0,222.7 503.0,221.7 502.1,220.9 502.5,219.5 503.5,219.1 504.0,217.9 505.4,217.7 506.0,216.8 506.9,216.0 507.9,216.0 510.0,217.6 509.9,218.5 510.5,220.2 510.0,221.3 510.3,222.0 508.9,223.8 508.1,224.6 507.6,226.4 507.6,228.1 507.5,232.6Z",
  "cx": 506.5,
  "cy": 222.7,
  "n": "베냉",
  "ct": "아프리카",
  "cap": "Porto-Novo",
  "fl": "🇧🇯",
  "lang": "French",
  "cur": "West African CFA franc",
  "bb": [502.1, 216.0, 510.5, 232.9],
  "ci": [{
    "n": "Cotonou",
    "x": 506.8,
    "y": 232.4,
    "c": 0
  }, {
    "n": "Abomey-Calavi",
    "x": 506.5,
    "y": 232.1,
    "c": 0
  }, {
    "n": "Porto-Novo",
    "x": 507.3,
    "y": 232.0,
    "c": 1
  }, {
    "n": "Djougou",
    "x": 504.6,
    "y": 223.0,
    "c": 0
  }, {
    "n": "Parakou",
    "x": 507.3,
    "y": 224.0,
    "c": 0
  }, {
    "n": "Bohicon",
    "x": 505.7,
    "y": 230.0,
    "c": 0
  }, {
    "n": "Kandi",
    "x": 508.2,
    "y": 219.1,
    "c": 0
  }, {
    "n": "Lokossa",
    "x": 504.8,
    "y": 231.6,
    "c": 0
  }, {
    "n": "Ouidah",
    "x": 505.8,
    "y": 232.3,
    "c": 0
  }],
  "lat": 9.5,
  "lng": 2.2,
  "area": 112622,
  "areaR": 103,
  "pop": 14462724,
  "popR": 75,
  "gdp": 19673284686,
  "gdpR": 127,
  "pc": 1360,
  "lvl": "중하위 소득"
}, {
  "i": "VEN",
  "en": "Venezuela",
  "d": "M301.9,217.3 301.8,217.9 300.1,218.3 301.1,219.5 301.0,221.0 299.8,222.6 300.8,224.8 302.0,224.6 302.7,222.6 301.8,221.6 301.7,219.5 305.1,218.4 304.7,217.1 305.7,216.2 306.7,218.2 308.7,218.2 310.5,219.8 310.6,220.7 313.1,220.7 316.0,220.4 317.6,221.7 319.7,222.0 321.3,221.1 321.3,220.4 324.8,220.3 328.1,220.2 325.7,221.1 326.7,222.4 328.9,222.6 331.0,223.9 331.5,226.2 332.9,226.1 334.0,226.8 331.8,228.4 331.6,229.4 332.5,230.4 331.8,231.0 330.1,231.4 330.2,232.7 329.4,233.4 331.3,235.6 331.7,236.3 330.6,237.4 327.5,238.4 325.5,238.9 324.7,239.5 322.5,238.8 320.5,238.5 320.0,238.7 321.2,239.5 321.1,241.3 321.5,243.1 323.8,243.3 324.0,243.9 322.0,244.7 321.7,245.9 320.5,246.3 318.5,247.0 317.9,247.8 315.8,248.0 314.2,246.5 313.4,243.7 312.6,242.8 311.6,242.2 313.0,240.8 313.0,240.2 312.2,239.3 311.6,237.5 311.8,235.5 312.4,234.6 312.9,233.1 312.0,232.6 310.4,232.9 308.4,232.8 307.3,233.1 305.3,230.7 303.7,230.3 300.1,230.6 299.4,229.6 298.8,229.4 298.7,228.8 299.0,227.8 298.8,226.7 298.2,226.0 297.8,224.8 296.4,224.6 297.1,223.0 297.5,221.0 298.3,219.9 299.4,219.1 300.1,217.8 301.9,217.3Z",
  "cx": 314.0,
  "cy": 229.8,
  "n": "베네수엘라",
  "ct": "남아메리카",
  "cap": "Caracas",
  "fl": "🇻🇪",
  "lang": "Spanish",
  "cur": "Venezuelan bolívar soberano",
  "bb": [296.4, 216.2, 334.0, 248.0],
  "ci": [{
    "n": "Maracaibo",
    "x": 301.0,
    "y": 220.5,
    "c": 0
  }, {
    "n": "Caracas",
    "x": 314.1,
    "y": 220.8,
    "c": 1
  }, {
    "n": "Valencia",
    "x": 311.1,
    "y": 221.7,
    "c": 0
  }, {
    "n": "Barquisimeto",
    "x": 307.4,
    "y": 222.0,
    "c": 0
  }, {
    "n": "Ciudad Guayana",
    "x": 326.0,
    "y": 226.8,
    "c": 0
  }, {
    "n": "Barcelona",
    "x": 320.3,
    "y": 221.9,
    "c": 0
  }, {
    "n": "Maturin",
    "x": 324.5,
    "y": 222.9,
    "c": 0
  }, {
    "n": "Puerto La Cruz",
    "x": 320.5,
    "y": 221.6,
    "c": 0
  }, {
    "n": "Petare",
    "x": 314.4,
    "y": 220.9,
    "c": 0
  }],
  "lat": 8,
  "lng": -66,
  "area": 916445,
  "areaR": 34,
  "pop": 28405543,
  "popR": 53,
  "gdp": 482359318768,
  "gdpR": 32,
  "pc": 16981,
  "lvl": "고소득"
}, {
  "i": "VNM",
  "en": "Vietnam",
  "d": "M800.1,190.1 796.4,192.5 794.1,195.1 793.5,197.1 795.6,200.0 798.2,203.6 800.7,205.3 802.4,207.6 803.7,212.7 803.3,217.6 801.0,219.4 797.8,221.2 795.6,223.5 792.1,226.1 791.1,224.3 791.9,222.4 789.8,220.9 792.2,219.8 795.1,219.6 793.9,217.9 798.6,215.7 798.9,212.4 798.3,210.5 798.8,207.8 798.1,205.8 796.0,203.9 794.2,201.4 791.9,198.1 788.6,196.5 789.4,195.5 791.2,194.8 790.1,192.3 786.7,192.3 785.4,189.8 783.8,187.6 785.3,186.9 787.5,186.9 790.2,186.6 792.6,185.1 793.9,186.2 796.5,186.7 796.0,188.3 797.3,189.4 800.1,190.1Z",
  "cx": 794.5,
  "cy": 202.9,
  "n": "베트남",
  "ct": "아시아",
  "cap": "Hanoi",
  "fl": "🇻🇳",
  "lang": "Vietnamese",
  "cur": "Vietnamese đồng",
  "bb": [783.8, 185.1, 803.7, 226.1],
  "ci": [{
    "n": "Thanh pho Ho Chi Minh",
    "x": 796.3,
    "y": 220.1,
    "c": 0
  }, {
    "n": "Ha Noi",
    "x": 794.0,
    "y": 191.6,
    "c": 1
  }, {
    "n": "Da Nang",
    "x": 800.6,
    "y": 205.4,
    "c": 0
  }, {
    "n": "Haiphong",
    "x": 796.3,
    "y": 192.1,
    "c": 0
  }, {
    "n": "Bien Hoa",
    "x": 796.7,
    "y": 219.6,
    "c": 0
  }, {
    "n": "Hue",
    "x": 798.9,
    "y": 204.3,
    "c": 0
  }, {
    "n": "Nha Trang",
    "x": 803.3,
    "y": 216.0,
    "c": 0
  }, {
    "n": "Can Tho",
    "x": 793.8,
    "y": 222.1,
    "c": 0
  }, {
    "n": "Rach Gia",
    "x": 791.9,
    "y": 222.2,
    "c": 0
  }],
  "lat": 16.2,
  "lng": 107.8,
  "area": 331212,
  "areaR": 68,
  "pop": 100987686,
  "popR": 16,
  "gdp": 429716969050,
  "gdpR": 35,
  "pc": 4255,
  "lvl": "중하위 소득"
}, {
  "i": "BEL",
  "en": "Belgium",
  "d": "M509.2,107.4 511.2,107.6 513.8,107.0 515.6,108.2 517.1,108.9 516.8,110.8 516.1,110.9 515.8,112.4 513.3,111.2 511.9,111.4 510.0,110.1 508.7,108.9 507.4,108.9 507.0,107.9 509.2,107.4Z",
  "cx": 512.2,
  "cy": 109.3,
  "n": "벨기에",
  "ct": "유럽",
  "cap": "Brussels",
  "fl": "🇧🇪",
  "lang": "German, French",
  "cur": "Euro",
  "bb": [507.0, 107.0, 517.1, 112.4],
  "ci": [{
    "n": "Brussels",
    "x": 512.1,
    "y": 108.8,
    "c": 1
  }, {
    "n": "Antwerp",
    "x": 512.3,
    "y": 107.7,
    "c": 0
  }, {
    "n": "Gent",
    "x": 510.3,
    "y": 108.2,
    "c": 0
  }, {
    "n": "Charleroi",
    "x": 512.3,
    "y": 110.0,
    "c": 0
  }, {
    "n": "Liege",
    "x": 515.5,
    "y": 109.3,
    "c": 0
  }, {
    "n": "Brugge",
    "x": 509.0,
    "y": 107.8,
    "c": 0
  }, {
    "n": "Namur",
    "x": 513.5,
    "y": 109.8,
    "c": 0
  }, {
    "n": "Leuven",
    "x": 513.1,
    "y": 108.7,
    "c": 0
  }, {
    "n": "Mons",
    "x": 511.0,
    "y": 109.8,
    "c": 0
  }],
  "lat": 50.8,
  "lng": 4,
  "area": 30528,
  "areaR": 141,
  "pop": 11858610,
  "popR": 81,
  "gdp": 632216577075,
  "gdpR": 23,
  "pc": 53313,
  "lvl": "고소득"
}, {
  "i": "BLR",
  "en": "Belarus",
  "d": "M565.2,100.2 567.9,100.3 570.9,99.2 571.6,97.6 573.9,96.8 573.6,95.5 575.3,95.0 578.3,94.0 581.2,94.7 581.6,95.4 583.0,95.0 585.8,95.7 586.0,97.0 585.4,97.7 587.2,99.6 588.3,100.1 588.1,100.6 590.0,101.1 590.8,101.8 589.7,102.4 587.5,102.3 587.0,102.6 587.6,103.5 588.3,105.3 585.9,105.4 585.1,106.0 584.9,107.4 583.8,107.2 581.3,107.3 580.5,106.7 579.5,107.1 578.4,106.7 576.3,106.7 573.2,106.0 570.4,105.8 568.2,105.9 566.7,106.6 565.4,106.7 565.3,105.5 564.4,104.2 566.1,103.6 566.1,102.5 565.4,101.5 565.2,100.2Z",
  "cx": 578.1,
  "cy": 101.9,
  "n": "벨라루스",
  "ct": "유럽",
  "cap": "Minsk",
  "fl": "🇧🇾",
  "lang": "Belarusian, Russian",
  "cur": "Belarusian ruble",
  "bb": [564.4, 94.0, 590.8, 107.4],
  "ci": [{
    "n": "Minsk",
    "x": 576.6,
    "y": 100.3,
    "c": 1
  }, {
    "n": "Mahilyow",
    "x": 584.3,
    "y": 100.2,
    "c": 0
  }, {
    "n": "Vitsyebsk",
    "x": 583.9,
    "y": 96.7,
    "c": 0
  }, {
    "n": "Hrodna",
    "x": 566.2,
    "y": 100.9,
    "c": 0
  }, {
    "n": "Brest",
    "x": 565.8,
    "y": 105.3,
    "c": 0
  }, {
    "n": "Babruysk",
    "x": 581.2,
    "y": 102.4,
    "c": 0
  }, {
    "n": "Baranavichy",
    "x": 572.3,
    "y": 102.4,
    "c": 0
  }, {
    "n": "Pinsk",
    "x": 572.4,
    "y": 105.2,
    "c": 0
  }, {
    "n": "Orsha",
    "x": 584.5,
    "y": 98.6,
    "c": 0
  }],
  "lat": 53,
  "lng": 28,
  "area": 207600,
  "areaR": 87,
  "pop": 9132629,
  "popR": 99,
  "gdp": 71857382746,
  "gdpR": 86,
  "pc": 7868,
  "lvl": "중상위 소득"
}, {
  "i": "BLZ",
  "en": "Belize",
  "d": "M252.4,200.5 252.4,200.1 252.7,200.0 253.2,200.3 254.2,198.6 254.7,198.6 254.7,199.0 255.3,199.0 255.2,199.8 254.8,201.0 255.0,201.4 254.7,202.4 254.9,202.7 254.6,204.1 254.0,204.8 253.5,204.9 253.0,205.9 252.1,205.9 252.4,202.7 252.4,200.5Z",
  "cx": 253.8,
  "cy": 201.6,
  "n": "벨리즈",
  "ct": "북아메리카",
  "cap": "Belmopan",
  "fl": "🇧🇿",
  "lang": "Belizean Creole, English",
  "cur": "Belize dollar",
  "bb": [252.1, 198.6, 255.3, 205.9],
  "ci": [{
    "n": "Belize City",
    "x": 255.0,
    "y": 201.4,
    "c": 0
  }, {
    "n": "San Ignacio",
    "x": 252.6,
    "y": 202.3,
    "c": 0
  }, {
    "n": "Orange Walk",
    "x": 254.0,
    "y": 199.8,
    "c": 0
  }, {
    "n": "Belmopan",
    "x": 253.4,
    "y": 202.1,
    "c": 1
  }, {
    "n": "Dangriga",
    "x": 255.0,
    "y": 202.9,
    "c": 0
  }, {
    "n": "Corozal",
    "x": 254.5,
    "y": 198.9,
    "c": 0
  }, {
    "n": "San Pedro",
    "x": 255.7,
    "y": 200.2,
    "c": 0
  }, {
    "n": "Benque Viejo del Carmen",
    "x": 252.4,
    "y": 202.6,
    "c": 0
  }, {
    "n": "Punta Gorda",
    "x": 253.3,
    "y": 205.3,
    "c": 0
  }],
  "lat": 17.2,
  "lng": -88.8,
  "area": 22966,
  "areaR": 152,
  "pop": 417072,
  "popR": 173,
  "gdp": 3281500000,
  "gdpR": 176,
  "pc": 7868,
  "lvl": "중상위 소득"
}, {
  "i": "BIH",
  "en": "Bosnia and Herzegovina",
  "d": "M552.8,125.4 553.8,125.4 553.1,126.6 554.4,127.7 554.0,129.0 553.4,129.1 552.9,129.4 552.0,130.0 551.6,131.5 549.1,130.5 548.0,129.3 547.0,128.7 545.7,127.7 545.1,126.8 543.8,125.5 544.3,124.4 545.3,125.0 545.9,124.4 547.2,124.4 549.6,124.8 551.5,124.8 552.8,125.4Z",
  "cx": 549.7,
  "cy": 127.1,
  "n": "보스니아 헤르체고비나",
  "ct": "유럽",
  "cap": "Sarajevo",
  "fl": "🇧🇦",
  "lang": "Bosnian, Croatian",
  "cur": "Bosnia and Herzegovina convertible mark",
  "bb": [543.8, 124.4, 554.4, 131.5],
  "ci": [{
    "n": "Sarajevo",
    "x": 551.1,
    "y": 128.2,
    "c": 1
  }, {
    "n": "Banja Luka",
    "x": 547.7,
    "y": 125.6,
    "c": 0
  }, {
    "n": "Zenica",
    "x": 549.7,
    "y": 127.2,
    "c": 0
  }, {
    "n": "Tuzla",
    "x": 551.9,
    "y": 126.3,
    "c": 0
  }, {
    "n": "Mostar",
    "x": 549.5,
    "y": 129.6,
    "c": 0
  }, {
    "n": "Bihac",
    "x": 544.1,
    "y": 125.5,
    "c": 0
  }, {
    "n": "Bugojno",
    "x": 548.5,
    "y": 127.6,
    "c": 0
  }, {
    "n": "Brcko",
    "x": 552.2,
    "y": 125.4,
    "c": 0
  }, {
    "n": "Bijeljina",
    "x": 553.4,
    "y": 125.7,
    "c": 0
  }],
  "lat": 44,
  "lng": 18,
  "area": 51209,
  "areaR": 129,
  "pop": 3164253,
  "popR": 135,
  "gdp": 27054889363,
  "gdpR": 113,
  "pc": 8550,
  "lvl": "중상위 소득"
}, {
  "i": "BWA",
  "en": "Botswana",
  "d": "M571.2,301.5 571.8,302.0 572.7,303.6 575.8,306.6 577.0,306.9 577.0,307.9 577.8,309.7 580.0,310.1 581.8,311.4 577.8,313.4 575.3,315.5 574.4,317.3 573.6,318.4 572.1,318.6 571.6,319.9 571.3,320.8 569.5,321.4 567.3,321.3 565.9,320.5 564.8,320.2 563.4,320.8 562.7,322.2 561.4,323.0 560.0,324.2 558.0,324.5 557.4,323.5 557.7,321.9 556.0,319.2 555.3,318.8 555.3,310.7 558.0,310.6 558.1,300.7 560.2,300.6 564.4,299.6 565.5,300.8 567.3,299.7 568.1,299.7 569.7,299.1 570.2,299.3 571.2,301.5Z",
  "cx": 567.7,
  "cy": 312.2,
  "n": "보츠와나",
  "ct": "아프리카",
  "cap": "Gaborone",
  "fl": "🇧🇼",
  "lang": "English, Tswana",
  "cur": "Botswana pula",
  "bb": [555.3, 299.1, 581.8, 324.5],
  "ci": [],
  "lat": -22,
  "lng": 24,
  "area": 582000,
  "areaR": 48,
  "pop": 2521139,
  "popR": 143,
  "gdp": 19395765126,
  "gdpR": 129,
  "pc": 7693,
  "lvl": "중상위 소득"
}, {
  "i": "BOL",
  "en": "Bolivia",
  "d": "M325.4,311.2 322.3,311.1 321.2,313.3 319.5,311.3 315.9,310.6 313.6,313.2 311.6,313.5 310.5,309.7 309.0,306.6 309.9,303.9 308.4,302.7 308.1,300.7 306.7,298.8 308.4,295.8 307.3,293.5 307.9,292.6 307.4,291.5 308.5,290.1 308.5,287.8 308.7,285.8 309.3,284.9 306.9,280.4 308.9,280.7 310.4,280.6 311.0,279.8 313.4,278.6 314.9,277.6 318.5,277.1 318.2,279.2 318.6,280.3 318.3,282.1 321.3,284.6 324.5,285.1 325.5,286.1 327.4,286.7 328.6,287.5 330.3,287.4 331.9,288.3 332.1,289.9 332.6,290.7 332.6,291.9 331.8,291.9 332.9,295.2 338.2,295.3 337.8,296.9 338.1,298.0 339.6,298.8 340.3,300.5 339.8,302.7 339.0,303.9 339.3,305.5 338.4,306.0 338.4,305.2 335.8,303.8 333.2,303.7 328.4,304.5 327.0,307.0 327.0,308.5 325.9,311.8 325.4,311.2Z",
  "cx": 322.2,
  "cy": 295.9,
  "n": "볼리비아",
  "ct": "남아메리카",
  "cap": "Sucre",
  "fl": "🇧🇴",
  "lang": "Aymara, Guaraní",
  "cur": "Bolivian boliviano",
  "bb": [306.7, 277.1, 340.3, 313.5],
  "ci": [{
    "n": "Santa Cruz de la Sierra",
    "x": 324.5,
    "y": 299.4,
    "c": 0
  }, {
    "n": "Cochabamba",
    "x": 316.2,
    "y": 298.3,
    "c": 0
  }, {
    "n": "La Paz",
    "x": 310.7,
    "y": 295.8,
    "c": 0
  }, {
    "n": "Sucre",
    "x": 318.7,
    "y": 302.9,
    "c": 1
  }, {
    "n": "Oruro",
    "x": 313.5,
    "y": 300.0,
    "c": 0
  }, {
    "n": "Tarija",
    "x": 320.2,
    "y": 309.8,
    "c": 0
  }, {
    "n": "Potosi",
    "x": 317.4,
    "y": 304.4,
    "c": 0
  }, {
    "n": "Montero",
    "x": 324.3,
    "y": 298.1,
    "c": 0
  }, {
    "n": "Trinidad",
    "x": 319.7,
    "y": 291.2,
    "c": 0
  }],
  "lat": -17,
  "lng": -65,
  "area": 1098581,
  "areaR": 29,
  "pop": 12413315,
  "popR": 78,
  "gdp": 45849832906,
  "gdpR": 97,
  "pc": 3694,
  "lvl": "중하위 소득"
}, {
  "i": "BDI",
  "en": "Burundi",
  "d": "M581.5,262.5 581.3,259.1 580.6,257.9 582.3,258.1 583.2,256.5 584.6,256.7 584.8,257.8 585.4,258.4 585.4,259.3 584.7,259.9 583.7,261.4 582.6,262.4 581.5,262.5Z",
  "cx": 583.2,
  "cy": 259.4,
  "n": "부룬디",
  "ct": "아프리카",
  "cap": "Gitega",
  "fl": "🇧🇮",
  "lang": "French, Kirundi",
  "cur": "Burundian franc",
  "bb": [580.6, 256.5, 585.4, 262.5],
  "ci": [],
  "lat": -3.5,
  "lng": 30,
  "area": 27834,
  "areaR": 147,
  "pop": 14047786,
  "popR": 77,
  "gdp": 2642161669,
  "gdpR": 180,
  "pc": 188,
  "lvl": "저소득"
}, {
  "i": "BFA",
  "en": "Burkina Faso",
  "d": "M492.1,223.2 490.2,222.5 488.9,222.6 488.0,223.3 486.7,222.7 486.2,221.8 485.0,221.2 484.8,219.6 485.6,218.4 485.5,217.5 487.7,215.2 488.1,213.3 488.9,212.6 490.2,213.0 491.4,212.4 491.8,211.7 493.9,210.4 494.4,209.6 497.0,208.4 498.6,208.0 499.3,208.5 501.0,208.5 500.8,209.9 501.2,211.1 502.8,213.0 502.8,214.3 506.0,214.9 506.0,216.8 505.4,217.7 504.0,217.9 503.5,219.1 502.5,219.5 500.1,219.4 498.8,219.2 497.9,219.6 496.7,219.4 491.8,219.5 491.8,221.1 492.1,223.2Z",
  "cx": 494.9,
  "cy": 216.4,
  "n": "부르키나파소",
  "ct": "아프리카",
  "cap": "Ouagadougou",
  "fl": "🇧🇫",
  "lang": "French",
  "cur": "West African CFA franc",
  "bb": [484.8, 208.0, 506.0, 223.3],
  "ci": [],
  "lat": 13,
  "lng": -2,
  "area": 272967,
  "areaR": 76,
  "pop": 23548781,
  "popR": 59,
  "gdp": 20324617839,
  "gdpR": 124,
  "pc": 863,
  "lvl": "저소득"
}, {
  "i": "BTN",
  "en": "Bhutan",
  "d": "M754.7,172.9 755.8,173.7 755.6,175.4 753.4,175.5 751.0,175.3 749.3,175.8 746.8,174.7 746.7,174.2 748.5,172.1 750.0,171.4 752.0,172.0 753.5,172.1 754.7,172.9Z",
  "cx": 751.7,
  "cy": 173.7,
  "n": "부탄",
  "ct": "아시아",
  "cap": "Thimphu",
  "fl": "🇧🇹",
  "lang": "Dzongkha",
  "cur": "Bhutanese ngultrum",
  "bb": [746.7, 171.4, 755.8, 175.8],
  "ci": [{
    "n": "Thimphu",
    "x": 748.9,
    "y": 173.7,
    "c": 1
  }, {
    "n": "Phuntsholing",
    "x": 748.3,
    "y": 175.4,
    "c": 0
  }, {
    "n": "Pajo",
    "x": 749.7,
    "y": 173.5,
    "c": 0
  }, {
    "n": "Tashi Yangtse",
    "x": 754.1,
    "y": 173.4,
    "c": 0
  }, {
    "n": "Mongar",
    "x": 753.3,
    "y": 174.3,
    "c": 0
  }, {
    "n": "Tongsa",
    "x": 751.4,
    "y": 173.6,
    "c": 0
  }, {
    "n": "Daga",
    "x": 749.7,
    "y": 174.8,
    "c": 0
  }, {
    "n": "Paro",
    "x": 748.4,
    "y": 173.8,
    "c": 0
  }, {
    "n": "Ha",
    "x": 748.0,
    "y": 174.0,
    "c": 0
  }],
  "lat": 27.5,
  "lng": 90.5,
  "area": 38394,
  "areaR": 137,
  "pop": 791524,
  "popR": 164,
  "gdp": 2898227713,
  "gdpR": 179,
  "pc": 3662,
  "lvl": "중하위 소득"
}, {
  "i": "MKD",
  "en": "Macedonia",
  "d": "M557.2,133.7 557.5,133.8 557.7,133.2 559.3,132.8 559.9,132.7 560.9,132.5 562.2,132.4 563.6,133.3 563.8,135.2 563.2,135.3 562.8,135.7 561.3,135.7 560.2,136.3 558.4,136.5 557.2,135.9 556.8,134.7 557.2,133.7Z",
  "cx": 560.0,
  "cy": 134.3,
  "n": "북마케도니아",
  "ct": "유럽",
  "cap": "Skopje",
  "fl": "🇲🇰",
  "lang": "Macedonian",
  "cur": "denar",
  "bb": [556.8, 132.4, 563.8, 136.5],
  "ci": [{
    "n": "Skopje",
    "x": 559.5,
    "y": 133.3,
    "c": 1
  }, {
    "n": "Kumanovo",
    "x": 560.3,
    "y": 133.0,
    "c": 0
  }, {
    "n": "Bitola",
    "x": 559.3,
    "y": 136.0,
    "c": 0
  }, {
    "n": "Prilep",
    "x": 559.9,
    "y": 135.1,
    "c": 0
  }, {
    "n": "Tetovo",
    "x": 558.3,
    "y": 133.3,
    "c": 0
  }, {
    "n": "Veles",
    "x": 560.5,
    "y": 134.1,
    "c": 0
  }, {
    "n": "Ohrid",
    "x": 557.8,
    "y": 135.8,
    "c": 0
  }, {
    "n": "Gostivar",
    "x": 558.1,
    "y": 133.9,
    "c": 0
  }, {
    "n": "Shtip",
    "x": 561.7,
    "y": 134.0,
    "c": 0
  }],
  "lat": 41.8,
  "lng": 22,
  "area": 25713,
  "areaR": 150,
  "pop": 1824359,
  "popR": 151,
  "gdp": 14761237042,
  "gdpR": 139,
  "pc": 8091,
  "lvl": "중상위 소득"
}, {
  "i": "BGR",
  "en": "Bulgaria",
  "d": "M562.9,127.1 563.7,128.3 564.8,128.1 566.9,128.5 571.0,128.6 572.4,127.9 575.7,127.3 577.7,128.3 579.3,128.6 577.9,129.7 576.9,131.7 577.8,133.3 575.4,132.9 572.5,133.8 572.5,135.2 570.0,135.5 568.0,134.5 565.8,135.3 563.8,135.2 563.6,133.3 562.2,132.4 562.6,132.1 562.3,131.7 562.8,130.8 563.9,130.0 562.5,128.8 562.3,127.8 562.9,127.1Z",
  "cx": 568.6,
  "cy": 130.8,
  "n": "불가리아",
  "ct": "유럽",
  "cap": "Sofia",
  "fl": "🇧🇬",
  "lang": "Bulgarian",
  "cur": "Euro",
  "bb": [562.2, 127.1, 579.3, 135.5],
  "ci": [{
    "n": "Sofia",
    "x": 564.8,
    "y": 131.4,
    "c": 1
  }, {
    "n": "Plovdiv",
    "x": 568.8,
    "y": 132.9,
    "c": 0
  }, {
    "n": "Varna",
    "x": 577.5,
    "y": 130.0,
    "c": 0
  }, {
    "n": "Burgas",
    "x": 576.3,
    "y": 131.9,
    "c": 0
  }, {
    "n": "Ruse",
    "x": 572.1,
    "y": 128.2,
    "c": 0
  }, {
    "n": "Stara Zagora",
    "x": 571.2,
    "y": 132.1,
    "c": 0
  }, {
    "n": "Pleven",
    "x": 568.4,
    "y": 129.4,
    "c": 0
  }, {
    "n": "Sliven",
    "x": 573.1,
    "y": 131.4,
    "c": 0
  }, {
    "n": "Dobrich",
    "x": 577.3,
    "y": 129.0,
    "c": 0
  }],
  "lat": 43,
  "lng": 25,
  "area": 110879,
  "areaR": 106,
  "pop": 6441421,
  "popR": 110,
  "gdp": 101584384673,
  "gdpR": 71,
  "pc": 15770,
  "lvl": "고소득"
}, {
  "i": "BRA",
  "en": "Brazil",
  "d": "M339.9,333.9 343.6,330.1 346.8,327.4 348.6,326.3 351.0,324.8 351.0,322.6 349.6,321.0 348.3,321.5 348.8,319.9 349.2,318.3 349.2,316.7 348.2,316.2 347.1,316.7 346.1,316.5 345.8,315.5 345.5,312.9 345.0,312.1 343.1,311.4 342.0,311.9 339.1,311.4 339.2,307.6 338.4,306.0 339.3,305.5 339.0,303.9 339.8,302.7 340.3,300.5 339.6,298.8 338.1,298.0 337.8,296.9 338.2,295.3 332.9,295.2 331.8,291.9 332.6,291.9 332.6,290.7 332.1,289.9 331.9,288.3 330.3,287.4 328.6,287.5 327.4,286.7 325.5,286.1 324.5,285.1 321.3,284.6 318.3,282.1 318.6,280.3 318.2,279.2 318.5,277.1 314.9,277.6 313.4,278.6 311.0,279.8 310.4,280.6 308.9,280.7 306.9,280.4 305.3,280.9 304.0,280.6 304.2,276.4 301.9,278.0 299.5,277.9 298.4,276.4 296.6,276.3 297.2,275.1 295.6,273.4 294.5,270.9 295.2,270.4 295.2,269.2 296.9,268.4 296.6,266.9 297.3,265.9 297.5,264.7 300.7,262.8 303.0,262.2 303.3,261.8 305.9,261.9 307.1,254.3 307.2,253.1 306.7,251.5 305.5,250.5 305.5,248.5 307.1,248.0 307.6,248.3 307.7,247.3 306.1,247.0 306.1,245.2 311.5,245.3 312.4,244.3 313.2,245.2 313.7,246.9 314.2,246.5 315.8,248.0 317.9,247.8 318.5,247.0 320.5,246.3 321.7,245.9 322.0,244.7 324.0,243.9 323.8,243.3 321.5,243.1 321.1,241.3 321.2,239.5 320.0,238.7 320.5,238.5 322.5,238.8 324.7,239.5 325.5,238.9 327.5,238.4 330.6,237.4 331.7,236.3 331.3,235.6 332.7,235.4 333.4,236.1 333.0,237.3 334.0,237.7 334.6,239.0 333.8,240.0 333.4,242.3 334.1,243.8 334.3,245.0 336.0,246.3 337.4,246.5 337.7,245.9 338.6,245.8 339.8,245.3 340.7,244.6 342.3,244.8 342.9,244.7 344.5,245.0 344.7,244.4 344.2,243.8 344.5,243.0 345.6,243.3 347.0,243.0 348.5,243.6 349.8,244.2 350.6,243.4 351.2,243.5 351.6,244.3 352.9,244.1 354.0,243.0 354.9,241.0 356.5,238.5 357.5,238.3 358.1,239.9 359.7,244.7 361.2,245.2 361.3,247.1 359.2,249.4 360.0,250.2 364.9,250.7 365.0,253.4 367.2,251.6 370.6,252.6 375.3,254.3 376.6,255.9 376.2,257.5 379.4,256.6 384.8,258.1 388.9,258.0 393.1,260.3 396.6,263.4 398.7,264.2 401.1,264.3 402.1,265.2 403.1,268.7 403.5,270.4 402.4,275.0 401.0,276.8 397.1,280.7 395.3,283.8 393.3,286.2 392.6,286.3 391.8,288.3 392.0,293.5 391.2,297.8 390.9,299.6 390.0,300.7 389.6,304.4 386.7,308.1 386.3,310.9 384.0,312.1 383.4,313.8 380.3,313.8 376.0,314.9 374.0,316.1 370.9,316.9 367.6,319.1 365.3,321.9 364.9,324.0 365.3,325.5 364.8,328.3 364.2,329.7 362.3,331.2 359.2,336.1 356.7,338.3 354.8,339.6 353.6,342.2 351.7,343.8 351.0,342.2 352.2,340.9 350.6,339.0 348.4,337.5 345.6,335.7 344.5,335.8 341.7,333.6 339.9,333.9Z",
  "cx": 341.8,
  "cy": 276.8,
  "n": "브라질",
  "ct": "남아메리카",
  "cap": "Brasília",
  "fl": "🇧🇷",
  "lang": "Portuguese",
  "cur": "Brazilian real",
  "bb": [294.5, 235.4, 403.5, 343.8],
  "ci": [{
    "n": "Sao Paulo",
    "x": 370.5,
    "y": 315.4,
    "c": 0
  }, {
    "n": "Rio de Janeiro",
    "x": 380.0,
    "y": 313.6,
    "c": 0
  }, {
    "n": "Salvador",
    "x": 393.0,
    "y": 286.0,
    "c": 0
  }, {
    "n": "Fortaleza",
    "x": 392.9,
    "y": 260.3,
    "c": 0
  }, {
    "n": "Belo Horizonte",
    "x": 378.0,
    "y": 305.3,
    "c": 0
  }, {
    "n": "Brasilia",
    "x": 366.9,
    "y": 293.8,
    "c": 0
  }, {
    "n": "Curitiba",
    "x": 363.1,
    "y": 320.6,
    "c": 0
  }, {
    "n": "Manaus",
    "x": 333.3,
    "y": 258.6,
    "c": 0
  }, {
    "n": "Recife",
    "x": 403.1,
    "y": 272.4,
    "c": 0
  }],
  "lat": -10,
  "lng": -55,
  "area": 8515767,
  "areaR": 6,
  "pop": 211998573,
  "popR": 7,
  "gdp": 2173665655937,
  "gdpR": 9,
  "pc": 10253,
  "lvl": "중상위 소득"
}, {
  "i": "BRN",
  "en": "Brunei",
  "d": "M817.2,237.4 818.3,236.4 820.7,234.9 820.6,236.2 820.4,238.0 819.1,237.9 818.5,238.9 817.2,237.4Z",
  "cx": 819.0,
  "cy": 237.1,
  "n": "브루나이",
  "ct": "아시아",
  "cap": "Bandar Seri Begawan",
  "fl": "🇧🇳",
  "lang": "Malay",
  "cur": "Brunei dollar",
  "bb": [817.2, 234.9, 820.7, 238.9],
  "ci": [{
    "n": "Bandar Seri Begawan",
    "x": 819.3,
    "y": 236.4,
    "c": 1
  }, {
    "n": "Kuala Belait",
    "x": 817.2,
    "y": 237.3,
    "c": 0
  }, {
    "n": "Seria",
    "x": 817.5,
    "y": 237.2,
    "c": 0
  }, {
    "n": "Tutong",
    "x": 818.5,
    "y": 236.7,
    "c": 0
  }, {
    "n": "Bangar",
    "x": 819.6,
    "y": 236.9,
    "c": 0
  }],
  "lat": 4.5,
  "lng": 114.7,
  "area": 5765,
  "areaR": 174,
  "pop": 462721,
  "popR": 172,
  "gdp": 15128292954,
  "gdpR": 138,
  "pc": 32694,
  "lvl": "고소득"
}, {
  "i": "SAU",
  "en": "Saudi Arabia",
  "d": "M618.8,204.6 618.5,203.4 617.6,202.6 617.4,201.5 616.0,200.5 614.5,198.1 613.7,195.9 611.8,194.0 610.6,193.5 608.7,190.9 608.4,188.9 608.5,187.3 606.9,184.2 605.6,183.1 604.1,182.5 603.2,180.9 603.4,180.3 602.6,178.9 601.8,178.3 600.7,176.2 599.0,174.0 597.6,172.0 596.2,172.1 596.6,170.5 596.8,169.6 597.1,168.5 600.2,168.9 601.4,168.0 602.1,167.0 604.2,166.7 604.6,165.7 605.6,165.3 602.8,162.5 608.3,161.1 608.9,160.7 612.2,161.4 616.4,163.4 624.2,168.9 629.4,169.2 631.8,169.4 632.5,170.8 634.5,170.7 635.6,173.1 636.9,173.7 637.4,174.7 639.3,175.9 639.5,177.0 639.2,177.9 639.6,178.9 640.4,179.6 640.7,180.6 641.1,181.2 642.0,181.8 642.7,181.6 643.3,182.7 643.4,183.3 644.4,186.1 652.8,187.5 653.4,186.9 654.6,188.9 652.8,194.4 644.4,197.2 636.4,198.3 633.8,199.5 631.9,202.5 630.6,202.9 629.9,202.0 628.8,202.1 626.1,201.9 625.6,201.6 622.4,201.6 621.6,201.9 620.5,201.2 619.8,202.5 620.1,203.7 618.8,204.6Z",
  "cx": 621.4,
  "cy": 183.7,
  "n": "사우디아라비아",
  "ct": "아시아",
  "cap": "Riyadh",
  "fl": "🇸🇦",
  "lang": "Arabic",
  "cur": "Saudi riyal",
  "bb": [596.2, 160.7, 654.6, 204.6],
  "ci": [],
  "lat": 25,
  "lng": 45,
  "area": 2149690,
  "areaR": 14,
  "pop": 35300280,
  "popR": 45,
  "gdp": 1067582933333,
  "gdpR": 19,
  "pc": 30243,
  "lvl": "고소득"
}, {
  "i": "ESH",
  "en": "Western Sahara",
  "d": "M475.6,174.7 475.5,173.2 475.9,173.2 475.9,173.4 475.9,173.9 475.9,178.1 466.8,178.0 466.8,185.1 464.2,185.3 463.6,186.7 464.1,190.8 453.2,190.7 452.6,191.7 452.7,190.5 452.8,190.5 459.0,190.3 459.4,189.3 460.5,188.0 461.4,184.2 465.3,181.2 466.6,177.7 467.4,177.5 468.4,175.3 470.7,175.0 471.7,175.4 473.0,175.4 473.9,174.8 475.6,174.7Z",
  "cx": 466.6,
  "cy": 181.2,
  "n": "서사하라",
  "ct": "아프리카",
  "cap": "El Aaiún",
  "fl": "🇪🇭",
  "lang": "Berber, Hassaniya",
  "cur": "Algerian dinar",
  "bb": [452.6, 173.2, 475.9, 191.7],
  "ci": [],
  "lat": 24.5,
  "lng": -13,
  "area": 266000,
  "areaR": 79,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "SEN",
  "en": "Senegal",
  "d": "M453.6,212.2 452.4,210.1 451.0,209.1 452.3,208.6 453.6,206.6 454.3,205.2 455.2,204.3 456.6,204.5 458.0,203.9 459.5,203.9 460.8,204.7 462.7,205.4 464.4,207.5 466.2,209.4 466.3,211.1 466.9,212.7 467.9,213.5 468.1,214.6 468.0,215.4 467.6,215.6 466.1,215.4 465.9,215.7 465.3,215.7 463.3,215.1 461.9,215.0 456.8,214.9 456.1,215.2 455.1,215.1 453.7,215.6 453.2,213.5 455.7,213.5 456.4,213.1 456.9,213.1 457.9,212.5 459.1,213.1 460.3,213.1 461.5,212.5 461.0,211.7 460.1,212.2 459.2,212.1 458.1,211.5 457.2,211.5 456.6,212.2 453.6,212.2Z",
  "cx": 459.5,
  "cy": 211.4,
  "n": "세네갈",
  "ct": "아프리카",
  "cap": "Dakar",
  "fl": "🇸🇳",
  "lang": "French",
  "cur": "West African CFA franc",
  "bb": [451.0, 203.9, 468.1, 215.7],
  "ci": [{
    "n": "Dakar",
    "x": 451.5,
    "y": 209.2,
    "c": 1
  }, {
    "n": "Grand Dakar",
    "x": 451.5,
    "y": 209.1,
    "c": 0
  }, {
    "n": "Thies Nones",
    "x": 452.9,
    "y": 208.9,
    "c": 0
  }, {
    "n": "Saint-Louis",
    "x": 454.2,
    "y": 205.5,
    "c": 0
  }, {
    "n": "Ziguinchor",
    "x": 454.8,
    "y": 215.0,
    "c": 0
  }, {
    "n": "Tiebo",
    "x": 454.9,
    "y": 209.4,
    "c": 0
  }, {
    "n": "Mbake",
    "x": 455.8,
    "y": 208.9,
    "c": 0
  }, {
    "n": "Kolda",
    "x": 458.5,
    "y": 214.2,
    "c": 0
  }, {
    "n": "Richard Toll",
    "x": 456.4,
    "y": 204.3,
    "c": 0
  }],
  "lat": 14,
  "lng": -14,
  "area": 196722,
  "areaR": 89,
  "pop": 18501984,
  "popR": 68,
  "gdp": 31013986429,
  "gdpR": 108,
  "pc": 1676,
  "lvl": "중하위 소득"
}, {
  "i": "SRB",
  "en": "Republic of Serbia",
  "d": "M558.0,123.8 559.7,124.5 559.9,125.6 561.5,126.4 562.4,125.8 563.1,126.2 562.4,126.6 562.9,127.1 562.3,127.8 562.5,128.8 563.9,130.0 562.8,130.8 562.3,131.7 562.6,132.1 562.2,132.4 560.9,132.5 559.9,132.7 559.8,132.4 560.2,132.1 560.5,131.4 560.1,131.5 559.6,130.9 559.1,130.8 558.7,130.4 558.2,130.2 557.8,129.8 557.3,130.0 556.9,130.9 556.3,131.1 556.5,130.8 555.4,130.3 554.5,130.0 554.1,129.6 553.4,129.1 554.0,129.0 554.4,127.7 553.1,126.6 553.8,125.4 552.8,125.4 553.9,124.3 553.0,123.6 552.3,122.5 554.4,121.7 556.2,121.9 557.7,123.0 558.0,123.8Z",
  "cx": 558.3,
  "cy": 128.3,
  "n": "세르비아",
  "ct": "유럽",
  "cap": "Belgrade",
  "fl": "🇷🇸",
  "lang": "Serbian",
  "cur": "Serbian dinar",
  "bb": [552.3, 121.7, 563.9, 132.7],
  "ci": [],
  "lat": 44,
  "lng": 21,
  "area": 88361,
  "areaR": 114,
  "pop": 6586476,
  "popR": 109,
  "gdp": 75187125427,
  "gdpR": 84,
  "pc": 11415,
  "lvl": "중상위 소득"
}, {
  "i": "SOM",
  "en": "Somalia",
  "d": "M638.1,217.8 639.6,217.6 640.9,216.6 642.0,216.6 642.0,217.4 641.8,219.0 641.8,220.4 641.2,221.4 640.4,224.4 639.1,227.6 637.4,231.1 635.0,235.2 632.6,238.3 629.3,242.1 626.6,244.3 622.4,247.1 619.8,249.2 616.8,252.6 616.1,254.0 615.5,254.7 613.9,252.4 613.8,242.3 616.3,239.1 617.0,238.2 618.8,238.2 621.3,236.2 624.9,236.1 632.7,227.8 634.7,225.5 635.9,223.7 635.9,222.3 635.9,219.5 636.0,218.3 636.9,218.2 638.1,217.8Z",
  "cx": 630.6,
  "cy": 231.5,
  "n": "소말리아",
  "ct": "아프리카",
  "cap": "Mogadishu",
  "fl": "🇸🇴",
  "lang": "Arabic, Somali",
  "cur": "Somali shilling",
  "bb": [613.8, 216.6, 642.0, 254.7],
  "ci": [{
    "n": "Mogadishu",
    "x": 626.0,
    "y": 244.3,
    "c": 1
  }, {
    "n": "Hargeysa",
    "x": 622.4,
    "y": 223.4,
    "c": 0
  }, {
    "n": "Berbera",
    "x": 625.0,
    "y": 221.0,
    "c": 0
  }, {
    "n": "Chisimayu",
    "x": 618.1,
    "y": 251.0,
    "c": 0
  }, {
    "n": "Jamaame",
    "x": 618.8,
    "y": 249.8,
    "c": 0
  }, {
    "n": "Baidoa",
    "x": 621.3,
    "y": 241.3,
    "c": 0
  }, {
    "n": "Burao",
    "x": 626.5,
    "y": 223.6,
    "c": 0
  }, {
    "n": "Bender Cassim",
    "x": 636.6,
    "y": 218.7,
    "c": 0
  }, {
    "n": "Afgooye",
    "x": 625.3,
    "y": 244.0,
    "c": 0
  }],
  "lat": 10,
  "lng": 49,
  "area": 637657,
  "areaR": 43,
  "pop": 19009151,
  "popR": 67,
  "gdp": 11679800110,
  "gdpR": 151,
  "pc": 614,
  "lvl": "저소득"
}, {
  "i": "SLB",
  "en": "Solomon Islands",
  "d": "M950.3,279.1 951.1,280.1 949.2,280.1 948.1,278.3 949.8,279.0 950.3,279.1Z M946.8,277.4 945.7,277.5 944.0,277.2 943.4,276.8 943.6,275.7 945.5,276.1 946.4,276.7 946.8,277.4Z M949.1,276.7 948.7,277.2 946.6,274.8 946.1,273.1 947.0,273.1 948.0,275.3 949.1,276.7Z M944.1,273.2 944.2,273.7 942.0,272.5 940.5,271.5 939.5,270.6 939.9,270.3 941.2,271.0 943.4,272.3 944.1,273.2Z M937.6,270.4 937.1,270.6 935.8,269.9 934.7,268.8 934.8,268.3 936.5,269.5 937.6,270.4Z",
  "cx": 944.0,
  "cy": 274.4,
  "n": "솔로몬 제도",
  "ct": "오세아니아",
  "cap": "Honiara",
  "fl": "🇸🇧",
  "lang": "English",
  "cur": "Solomon Islands dollar",
  "bb": [934.7, 268.3, 951.1, 280.1],
  "ci": [{
    "n": "Honiara",
    "x": 944.3,
    "y": 276.2,
    "c": 1
  }, {
    "n": "Gizo",
    "x": 935.7,
    "y": 272.5,
    "c": 0
  }, {
    "n": "Auki",
    "x": 946.4,
    "y": 274.4,
    "c": 0
  }, {
    "n": "Tulaghi",
    "x": 944.9,
    "y": 275.3,
    "c": 0
  }, {
    "n": "Kirakira",
    "x": 949.8,
    "y": 279.0,
    "c": 0
  }, {
    "n": "Lata",
    "x": 960.6,
    "y": 279.8,
    "c": 0
  }],
  "lat": -8,
  "lng": 159,
  "area": 28896,
  "areaR": 144,
  "pop": 819198,
  "popR": 163,
  "gdp": 1631286701,
  "gdpR": 192,
  "pc": 1991,
  "lvl": "중하위 소득"
}, {
  "i": "SDN",
  "en": "Sudan",
  "d": "M594.3,223.7 594.0,223.7 594.0,222.3 593.7,221.3 592.2,220.2 591.9,218.2 592.2,216.2 591.0,216.0 590.8,216.6 589.1,216.7 589.8,217.6 590.0,219.2 588.5,220.7 587.1,222.7 585.7,223.0 583.3,221.4 582.3,222.0 582.0,222.8 580.6,223.3 580.5,223.9 577.7,223.9 577.3,223.3 575.3,223.2 574.3,223.7 573.5,223.5 572.1,221.8 571.6,221.1 569.6,221.5 568.9,222.7 568.2,225.2 567.2,225.8 566.4,226.1 566.1,225.9 565.2,225.1 565.0,224.3 565.4,223.1 565.4,222.0 563.8,220.2 563.5,219.0 563.5,218.4 562.5,217.6 562.5,215.9 561.9,214.9 560.9,215.0 561.2,214.0 561.9,212.9 561.6,211.7 562.5,210.9 562.0,210.2 562.7,208.5 564.0,206.4 566.4,206.6 566.2,195.6 566.2,194.4 569.4,194.4 569.4,188.9 580.6,188.9 591.4,188.9 602.4,188.9 603.3,191.6 602.7,192.1 603.1,195.0 604.1,198.3 605.2,199.0 606.7,200.0 605.3,201.6 603.2,202.0 602.4,202.9 602.1,204.7 600.9,208.8 601.2,209.9 600.8,212.3 599.6,215.1 597.9,216.4 596.8,218.6 596.5,219.7 595.2,220.5 594.3,223.4 594.3,223.7Z",
  "cx": 581.8,
  "cy": 214.1,
  "n": "수단",
  "ct": "아프리카",
  "cap": "Khartoum",
  "fl": "🇸🇩",
  "lang": "Arabic, English",
  "cur": "Sudanese pound",
  "bb": [560.9, 188.9, 606.7, 226.1],
  "ci": [{
    "n": "Khartoum",
    "x": 590.4,
    "y": 206.7,
    "c": 1
  }, {
    "n": "Omdurman",
    "x": 590.1,
    "y": 206.6,
    "c": 0
  }, {
    "n": "Port Sudan",
    "x": 603.4,
    "y": 195.5,
    "c": 0
  }, {
    "n": "Kassala",
    "x": 601.1,
    "y": 207.1,
    "c": 0
  }, {
    "n": "Al Ubayyid",
    "x": 583.9,
    "y": 213.4,
    "c": 0
  }, {
    "n": "Kusti",
    "x": 590.7,
    "y": 213.4,
    "c": 0
  }, {
    "n": "Wad Madani",
    "x": 593.1,
    "y": 210.0,
    "c": 0
  }, {
    "n": "Al Fashir",
    "x": 570.4,
    "y": 212.1,
    "c": 0
  }, {
    "n": "Ad Damazin",
    "x": 595.4,
    "y": 217.3,
    "c": 0
  }],
  "lat": 15,
  "lng": 30,
  "area": 1886068,
  "areaR": 17,
  "pop": 50448963,
  "popR": 30,
  "gdp": 109327023589,
  "gdpR": 66,
  "pc": 2167,
  "lvl": "중하위 소득"
}, {
  "i": "SUR",
  "en": "Suriname",
  "d": "M341.3,233.4 344.6,234.0 344.9,233.5 347.1,233.3 350.1,234.0 348.7,236.4 348.9,238.3 350.0,239.9 349.5,241.1 349.3,242.4 348.5,243.6 347.0,243.0 345.6,243.3 344.5,243.0 344.2,243.8 344.7,244.4 344.5,245.0 342.9,244.7 341.2,242.3 340.9,240.7 340.0,240.7 338.8,238.7 339.3,237.3 339.1,236.6 340.8,235.9 341.3,233.4Z",
  "cx": 344.5,
  "cy": 239.3,
  "n": "수리남",
  "ct": "남아메리카",
  "cap": "Paramaribo",
  "fl": "🇸🇷",
  "lang": "Dutch",
  "cur": "Surinamese dollar",
  "bb": [338.8, 233.3, 350.1, 245.0],
  "ci": [{
    "n": "Paramaribo",
    "x": 346.8,
    "y": 233.8,
    "c": 1
  }, {
    "n": "Lelydorp",
    "x": 346.6,
    "y": 234.2,
    "c": 0
  }, {
    "n": "Nieuw Nickerie",
    "x": 341.7,
    "y": 233.5,
    "c": 0
  }, {
    "n": "Moengo",
    "x": 348.9,
    "y": 234.4,
    "c": 0
  }, {
    "n": "Nieuw Amsterdam",
    "x": 347.0,
    "y": 233.7,
    "c": 0
  }, {
    "n": "Marienburg",
    "x": 347.1,
    "y": 233.7,
    "c": 0
  }, {
    "n": "Wageningen",
    "x": 342.5,
    "y": 234.0,
    "c": 0
  }, {
    "n": "Albina",
    "x": 349.9,
    "y": 234.7,
    "c": 0
  }, {
    "n": "Groningen",
    "x": 345.9,
    "y": 233.9,
    "c": 0
  }],
  "lat": 4,
  "lng": -56,
  "area": 163820,
  "areaR": 93,
  "pop": 634431,
  "popR": 167,
  "gdp": 3782437296,
  "gdpR": 172,
  "pc": 5962,
  "lvl": "중상위 소득"
}, {
  "i": "LKA",
  "en": "Sri Lanka",
  "d": "M727.2,229.1 726.8,232.0 725.6,232.8 723.2,233.4 721.9,231.2 721.4,227.2 722.6,222.7 724.6,224.3 725.8,226.2 727.2,229.1Z",
  "cx": 724.6,
  "cy": 228.8,
  "n": "스리랑카",
  "ct": "아시아",
  "cap": "Colombo",
  "fl": "🇱🇰",
  "lang": "Sinhala, Tamil",
  "cur": "Sri Lankan rupee",
  "bb": [721.4, 222.7, 727.2, 233.4],
  "ci": [{
    "n": "Colombo",
    "x": 721.8,
    "y": 230.7,
    "c": 1
  }, {
    "n": "Galkissa",
    "x": 721.9,
    "y": 231.0,
    "c": 0
  }, {
    "n": "Moratuwa",
    "x": 721.9,
    "y": 231.2,
    "c": 0
  }, {
    "n": "Jaffna",
    "x": 722.2,
    "y": 223.1,
    "c": 0
  }, {
    "n": "Negombo",
    "x": 721.8,
    "y": 230.0,
    "c": 0
  }, {
    "n": "Pita Kotte",
    "x": 721.9,
    "y": 230.9,
    "c": 0
  }, {
    "n": "Sri Jayewardenepura Kotte",
    "x": 722.0,
    "y": 230.8,
    "c": 0
  }, {
    "n": "Kandy",
    "x": 724.0,
    "y": 229.7,
    "c": 0
  }, {
    "n": "Trincomalee",
    "x": 725.6,
    "y": 226.2,
    "c": 0
  }],
  "lat": 7,
  "lng": 81,
  "area": 65610,
  "areaR": 124,
  "pop": 21916000,
  "popR": 60,
  "gdp": 84356860421,
  "gdpR": 76,
  "pc": 3849,
  "lvl": "중하위 소득"
}, {
  "i": "SWE",
  "en": "Sweden",
  "d": "M561.6,67.4 558.9,69.4 559.4,71.1 554.9,73.3 549.6,75.7 547.6,79.6 549.5,81.6 552.2,83.1 549.6,86.2 546.7,86.9 545.7,91.6 544.1,94.2 540.7,93.9 539.2,96.1 536.0,96.2 535.1,93.6 532.7,90.4 530.6,86.5 531.9,84.9 534.2,83.0 535.1,79.7 533.3,78.3 533.1,74.6 534.9,72.0 537.7,72.1 538.7,71.0 537.7,70.0 542.0,66.1 544.7,63.0 546.6,61.1 549.2,61.1 550.0,59.5 555.2,60.0 555.6,58.2 557.3,58.0 561.1,59.4 565.4,61.3 565.5,65.6 566.4,66.6 561.6,67.4Z M547.4,90.6 547.8,90.8 545.6,93.9 545.5,92.9 547.4,90.6Z M553.8,89.0 552.2,89.9 552.3,90.4 552.8,90.4 552.6,90.6 551.9,90.8 552.0,91.1 551.3,91.3 550.9,91.9 550.3,92.0 550.5,91.4 550.2,90.9 550.4,90.6 550.3,90.2 551.8,89.1 552.9,89.1 553.1,88.9 553.8,88.9 553.8,89.0Z",
  "cx": 548.3,
  "cy": 81.0,
  "n": "스웨덴",
  "ct": "유럽",
  "cap": "Stockholm",
  "fl": "🇸🇪",
  "lang": "Swedish",
  "cur": "Swedish krona",
  "bb": [530.6, 58.0, 566.4, 96.2],
  "ci": [{
    "n": "Stockholm",
    "x": 550.2,
    "y": 85.2,
    "c": 1
  }, {
    "n": "Goteborg",
    "x": 533.2,
    "y": 89.7,
    "c": 0
  }, {
    "n": "Malmoe",
    "x": 536.1,
    "y": 95.5,
    "c": 0
  }, {
    "n": "Uppsala",
    "x": 549.0,
    "y": 83.7,
    "c": 0
  }, {
    "n": "Kista",
    "x": 549.8,
    "y": 85.0,
    "c": 0
  }, {
    "n": "Vasteras",
    "x": 546.0,
    "y": 84.4,
    "c": 0
  }, {
    "n": "Orebro",
    "x": 542.2,
    "y": 85.3,
    "c": 0
  }, {
    "n": "Linkoping",
    "x": 543.4,
    "y": 87.7,
    "c": 0
  }, {
    "n": "Helsingborg",
    "x": 535.3,
    "y": 94.3,
    "c": 0
  }],
  "lat": 62,
  "lng": 15,
  "area": 450295,
  "areaR": 57,
  "pop": 10569709,
  "popR": 92,
  "gdp": 593267701033,
  "gdpR": 24,
  "pc": 56129,
  "lvl": "고소득"
}, {
  "i": "CHE",
  "en": "Switzerland",
  "d": "M526.7,118.0 526.8,118.5 526.3,119.2 527.6,119.7 529.0,119.7 528.8,120.9 527.6,121.3 525.5,121.0 524.9,122.1 523.6,122.2 523.1,121.8 521.5,122.7 520.2,122.8 519.0,122.2 518.1,121.0 516.7,121.5 516.8,120.2 518.8,118.6 518.7,117.9 520.0,118.2 520.7,117.7 523.1,117.7 523.7,117.1 526.7,118.0Z",
  "cx": 523.1,
  "cy": 120.0,
  "n": "스위스",
  "ct": "유럽",
  "cap": "Bern",
  "fl": "🇨🇭",
  "lang": "French, Swiss German",
  "cur": "Swiss franc",
  "bb": [516.7, 117.1, 529.0, 122.8],
  "ci": [{
    "n": "Zurich",
    "x": 523.8,
    "y": 118.4,
    "c": 0
  }, {
    "n": "Geneve",
    "x": 517.1,
    "y": 121.7,
    "c": 0
  }, {
    "n": "Basel",
    "x": 521.1,
    "y": 117.9,
    "c": 0
  }, {
    "n": "Bern",
    "x": 520.7,
    "y": 119.6,
    "c": 1
  }, {
    "n": "Lausanne",
    "x": 518.4,
    "y": 120.8,
    "c": 0
  }, {
    "n": "Winterthur",
    "x": 524.3,
    "y": 118.1,
    "c": 0
  }, {
    "n": "Sankt Gallen",
    "x": 526.0,
    "y": 118.3,
    "c": 0
  }, {
    "n": "Luzern",
    "x": 523.1,
    "y": 119.3,
    "c": 0
  }, {
    "n": "Zuerich (Kreis 11)",
    "x": 523.7,
    "y": 118.3,
    "c": 0
  }],
  "lat": 47,
  "lng": 8,
  "area": 41284,
  "areaR": 136,
  "pop": 9005582,
  "popR": 100,
  "gdp": 884940402230,
  "gdpR": 20,
  "pc": 98266,
  "lvl": "고소득"
}, {
  "i": "ESP",
  "en": "Spain",
  "d": "M474.9,133.7 475.0,131.7 473.9,130.5 477.8,128.5 481.2,129.0 485.0,129.0 487.9,129.4 490.2,129.3 494.7,129.4 495.8,130.5 500.9,131.7 501.9,131.1 505.1,132.4 508.3,132.0 508.4,133.6 505.8,135.5 502.3,136.1 502.0,137.0 500.3,138.5 499.2,140.8 500.3,142.4 498.7,143.6 498.1,145.4 496.0,146.0 494.0,148.1 490.5,148.2 487.9,148.1 486.1,149.1 485.1,150.1 483.7,149.9 482.7,149.0 481.9,147.4 479.3,147.0 479.1,146.0 480.1,145.0 480.5,144.2 479.5,143.4 480.3,141.6 479.2,139.9 480.4,139.7 480.5,138.4 480.9,138.0 481.0,135.8 482.3,135.1 481.5,133.7 479.9,133.6 479.4,133.9 477.7,133.9 477.0,132.6 475.9,133.0 474.9,133.7Z",
  "cx": 487.5,
  "cy": 138.1,
  "n": "스페인",
  "ct": "유럽",
  "cap": "Madrid",
  "fl": "🇪🇸",
  "lang": "Spanish",
  "cur": "Euro",
  "bb": [473.9, 128.5, 508.4, 150.1],
  "ci": [{
    "n": "Madrid",
    "x": 489.7,
    "y": 137.7,
    "c": 1
  }, {
    "n": "Barcelona",
    "x": 506.0,
    "y": 135.0,
    "c": 0
  }, {
    "n": "Valencia",
    "x": 499.0,
    "y": 140.4,
    "c": 0
  }, {
    "n": "Sevilla",
    "x": 483.4,
    "y": 146.2,
    "c": 0
  }, {
    "n": "Zaragoza",
    "x": 497.6,
    "y": 134.3,
    "c": 0
  }, {
    "n": "Malaga",
    "x": 487.7,
    "y": 148.0,
    "c": 0
  }, {
    "n": "Murcia",
    "x": 496.9,
    "y": 144.5,
    "c": 0
  }, {
    "n": "Las Palmas de Gran Canaria",
    "x": 457.2,
    "y": 171.9,
    "c": 0
  }, {
    "n": "Palma",
    "x": 507.4,
    "y": 140.1,
    "c": 0
  }],
  "lat": 40,
  "lng": -4,
  "area": 505992,
  "areaR": 53,
  "pop": 48848840,
  "popR": 32,
  "gdp": 1580694712516,
  "gdpR": 15,
  "pc": 32359,
  "lvl": "고소득"
}, {
  "i": "SVK",
  "en": "Slovakia",
  "d": "M552.4,112.5 552.5,112.7 553.7,112.3 555.1,113.3 556.7,112.7 558.0,113.0 560.0,112.6 562.7,113.7 561.9,114.4 561.3,115.5 560.8,115.8 557.8,114.9 556.9,115.1 556.2,115.8 554.9,116.1 554.6,115.9 553.3,116.4 552.2,116.4 551.9,117.0 549.6,117.3 548.6,117.0 547.2,116.3 546.9,115.4 547.1,115.0 547.5,114.4 548.7,114.4 549.7,114.2 549.8,113.9 550.3,113.8 550.5,113.1 551.1,113.0 551.5,112.5 552.4,112.5Z",
  "cx": 553.4,
  "cy": 114.5,
  "n": "슬로바키아",
  "ct": "유럽",
  "cap": "Bratislava",
  "fl": "🇸🇰",
  "lang": "Slovak",
  "cur": "Euro",
  "bb": [546.9, 112.3, 562.7, 117.3],
  "ci": [],
  "lat": 48.7,
  "lng": 19.5,
  "area": 49037,
  "areaR": 131,
  "pop": 5422069,
  "popR": 119,
  "gdp": 132793622283,
  "gdpR": 62,
  "pc": 24491,
  "lvl": "고소득"
}, {
  "i": "SVN",
  "en": "Slovenia",
  "d": "M538.4,120.8 540.6,121.0 542.0,120.4 544.5,120.3 545.0,119.9 545.5,119.9 546.0,120.8 543.8,121.6 543.5,122.7 542.6,123.0 542.6,123.7 541.5,123.7 540.5,123.2 540.0,123.7 538.1,123.6 538.7,123.4 538.1,122.2 538.4,120.8Z",
  "cx": 541.7,
  "cy": 121.9,
  "n": "슬로베니아",
  "ct": "유럽",
  "cap": "Ljubljana",
  "fl": "🇸🇮",
  "lang": "Slovene",
  "cur": "Euro",
  "bb": [538.1, 119.9, 546.0, 123.7],
  "ci": [{
    "n": "Ljubljana",
    "x": 540.3,
    "y": 122.1,
    "c": 1
  }, {
    "n": "Maribor",
    "x": 543.5,
    "y": 120.7,
    "c": 0
  }, {
    "n": "Celje",
    "x": 542.4,
    "y": 121.6,
    "c": 0
  }, {
    "n": "Kranj",
    "x": 539.9,
    "y": 121.6,
    "c": 0
  }, {
    "n": "Velenje",
    "x": 542.0,
    "y": 121.2,
    "c": 0
  }, {
    "n": "Koper",
    "x": 538.1,
    "y": 123.5,
    "c": 0
  }, {
    "n": "Novo Mesto",
    "x": 542.1,
    "y": 122.8,
    "c": 0
  }, {
    "n": "Ptuj",
    "x": 544.1,
    "y": 121.1,
    "c": 0
  }, {
    "n": "Trbovlje",
    "x": 541.8,
    "y": 121.8,
    "c": 0
  }],
  "lat": 46.1,
  "lng": 14.8,
  "area": 20273,
  "areaR": 155,
  "pop": 2127400,
  "popR": 148,
  "gdp": 68216781411,
  "gdpR": 87,
  "pc": 32066,
  "lvl": "고소득"
}, {
  "i": "SYR",
  "en": "Syria",
  "d": "M607.8,157.3 602.3,160.2 599.2,159.1 599.5,158.7 599.5,157.6 600.2,156.0 601.7,155.0 601.2,153.9 600.0,153.8 599.7,151.6 600.4,150.5 601.2,149.9 601.9,149.3 602.1,147.7 603.0,148.3 606.0,147.5 607.5,148.0 609.8,148.0 613.0,147.0 614.5,147.0 617.6,146.6 616.2,148.3 614.7,149.0 615.0,151.0 613.9,154.4 607.8,157.3Z",
  "cx": 606.0,
  "cy": 152.0,
  "n": "시리아",
  "ct": "아시아",
  "cap": "Damascus",
  "fl": "🇸🇾",
  "lang": "Arabic",
  "cur": "Syrian pound",
  "bb": [599.2, 146.6, 617.6, 160.2],
  "ci": [{
    "n": "Aleppo",
    "x": 603.2,
    "y": 149.4,
    "c": 0
  }, {
    "n": "Damascus",
    "x": 600.8,
    "y": 156.9,
    "c": 1
  }, {
    "n": "Hims",
    "x": 602.0,
    "y": 153.5,
    "c": 0
  }, {
    "n": "Hamah",
    "x": 602.1,
    "y": 152.4,
    "c": 0
  }, {
    "n": "Latakia",
    "x": 599.4,
    "y": 151.3,
    "c": 0
  }, {
    "n": "Dayr az Zawr",
    "x": 611.5,
    "y": 151.9,
    "c": 0
  }, {
    "n": "Ar Raqqah",
    "x": 608.4,
    "y": 150.1,
    "c": 0
  }, {
    "n": "Al Bab",
    "x": 604.2,
    "y": 149.0,
    "c": 0
  }, {
    "n": "Idlib",
    "x": 601.8,
    "y": 150.2,
    "c": 0
  }],
  "lat": 35,
  "lng": 38,
  "area": 185180,
  "areaR": 90,
  "pop": 24672760,
  "popR": 57,
  "gdp": 8980060819,
  "gdpR": 155,
  "pc": 364,
  "lvl": "저소득"
}, {
  "i": "SLE",
  "en": "Sierra Leone",
  "d": "M468.2,231.2 467.5,230.9 465.5,229.8 464.0,228.3 463.5,227.3 463.2,225.3 464.7,224.0 465.0,223.3 465.5,222.7 466.2,222.6 466.9,222.1 469.1,222.1 469.9,223.1 470.5,224.3 470.4,225.1 470.8,225.8 470.8,226.8 471.6,226.6 470.3,227.9 469.0,229.5 468.9,230.3 468.2,231.2Z",
  "cx": 467.7,
  "cy": 226.4,
  "n": "시에라리온",
  "ct": "아프리카",
  "cap": "Freetown",
  "fl": "🇸🇱",
  "lang": "English",
  "cur": "Sierra Leonean leone",
  "bb": [463.2, 222.1, 471.6, 231.2],
  "ci": [],
  "lat": 8.5,
  "lng": -11.5,
  "area": 71740,
  "areaR": 121,
  "pop": 8642022,
  "popR": 101,
  "gdp": 3809832237,
  "gdpR": 171,
  "pc": 441,
  "lvl": "저소득"
}, {
  "i": "ARE",
  "en": "United Arab Emirates",
  "d": "M643.3,182.7 643.8,182.5 643.9,183.3 646.0,182.8 648.3,182.9 650.0,183.0 651.9,181.1 654.0,179.3 655.8,177.6 656.3,178.6 656.7,180.8 655.2,180.8 655.0,182.6 655.5,183.0 654.2,183.5 654.2,184.7 653.4,185.8 653.4,186.9 652.8,187.5 644.4,186.1 643.4,183.3 643.3,182.7Z",
  "cx": 650.7,
  "cy": 182.8,
  "n": "아랍에미리트",
  "ct": "아시아",
  "cap": "Abu Dhabi",
  "fl": "🇦🇪",
  "lang": "Arabic",
  "cur": "United Arab Emirates dirham",
  "bb": [643.3, 177.6, 656.7, 187.5],
  "ci": [],
  "lat": 24,
  "lng": 54,
  "area": 83600,
  "areaR": 117,
  "pop": 10986400,
  "popR": 85,
  "gdp": 504173451327,
  "gdpR": 29,
  "pc": 45891,
  "lvl": "고소득"
}, {
  "i": "ARM",
  "en": "Armenia",
  "d": "M621.1,135.9 624.9,135.4 625.5,136.2 626.6,136.6 626.0,137.3 627.5,138.3 626.7,139.2 627.9,139.9 629.1,140.4 629.2,142.3 628.2,142.4 627.0,140.8 627.1,140.4 625.8,140.4 625.0,139.6 624.4,139.7 623.3,138.9 621.3,138.2 621.5,136.8 621.1,135.9Z",
  "cx": 625.5,
  "cy": 138.7,
  "n": "아르메니아",
  "ct": "아시아",
  "cap": "Yerevan",
  "fl": "🇦🇲",
  "lang": "Armenian",
  "cur": "Armenian dram",
  "bb": [621.1, 135.4, 629.2, 142.4],
  "ci": [{
    "n": "Yerevan",
    "x": 623.6,
    "y": 138.4,
    "c": 1
  }, {
    "n": "Gyumri",
    "x": 621.8,
    "y": 136.7,
    "c": 0
  }, {
    "n": "Vanadzor",
    "x": 623.6,
    "y": 136.6,
    "c": 0
  }, {
    "n": "Ejmiatsin",
    "x": 623.0,
    "y": 138.4,
    "c": 0
  }, {
    "n": "Hrazdan",
    "x": 624.3,
    "y": 137.5,
    "c": 0
  }, {
    "n": "Abovyan",
    "x": 624.0,
    "y": 138.1,
    "c": 0
  }, {
    "n": "Kapan",
    "x": 628.9,
    "y": 141.1,
    "c": 0
  }, {
    "n": "Ararat",
    "x": 624.2,
    "y": 139.4,
    "c": 0
  }, {
    "n": "Armavir",
    "x": 622.3,
    "y": 138.5,
    "c": 0
  }],
  "lat": 40,
  "lng": 45,
  "area": 29743,
  "areaR": 143,
  "pop": 3033500,
  "popR": 136,
  "gdp": 24212134631,
  "gdpR": 115,
  "pc": 7982,
  "lvl": "중상위 소득"
}, {
  "i": "ARG",
  "en": "Argentina",
  "d": "M318.1,403.3 315.4,403.5 314.0,402.5 312.3,402.4 309.4,402.4 309.3,396.2 310.4,397.5 311.8,399.6 315.4,401.2 319.3,401.9 318.1,403.3Z M319.5,311.3 321.2,313.3 322.3,311.1 325.4,311.2 325.9,311.8 331.0,316.3 333.3,316.8 336.6,318.8 339.5,319.9 339.9,321.1 337.2,325.3 340.0,326.1 343.1,326.5 345.3,326.1 347.8,323.9 348.3,321.5 349.6,321.0 351.0,322.6 351.0,324.8 348.6,326.3 346.8,327.4 343.6,330.1 339.9,333.9 339.2,336.2 338.5,339.0 338.5,341.8 337.9,342.4 337.7,344.2 337.5,345.6 341.0,348.0 340.7,349.9 342.4,351.1 342.3,352.5 339.6,356.1 335.5,357.6 329.9,358.1 326.8,357.9 327.4,359.5 326.9,361.6 327.4,363.0 325.7,364.0 322.9,364.4 320.2,363.3 319.1,364.1 319.5,366.8 321.4,367.7 322.9,366.8 323.7,368.2 321.2,369.1 318.9,370.8 318.5,373.6 317.9,375.1 315.3,375.1 313.1,376.5 312.3,378.6 315.0,380.6 317.7,381.2 316.7,383.7 313.4,385.3 311.6,388.5 309.1,389.6 307.9,390.9 308.8,393.8 310.7,395.4 309.5,395.3 306.9,394.8 300.2,394.5 299.1,392.8 299.1,390.8 297.3,390.9 296.3,389.9 296.1,387.0 298.2,385.8 299.1,384.0 298.8,382.6 300.2,380.2 301.2,376.6 300.9,374.9 302.2,374.4 301.9,373.4 300.6,372.8 301.5,371.6 300.2,370.6 299.6,367.4 300.7,366.8 300.2,363.4 300.9,360.6 301.6,358.1 303.3,357.1 302.4,354.4 302.4,351.8 304.5,350.0 304.5,347.7 306.1,345.0 306.1,342.4 305.3,341.9 304.1,337.1 305.8,334.3 305.5,331.6 306.5,329.1 308.3,326.4 310.3,324.7 309.5,323.6 310.0,322.7 310.0,318.1 313.0,316.7 313.9,313.9 313.6,313.2 315.9,310.6 319.5,311.3Z",
  "cx": 318.6,
  "cy": 357.0,
  "n": "아르헨티나",
  "ct": "남아메리카",
  "cap": "Buenos Aires",
  "fl": "🇦🇷",
  "lang": "Guaraní, Spanish",
  "cur": "Argentine peso",
  "bb": [296.1, 310.6, 351.0, 403.5],
  "ci": [{
    "n": "Buenos Aires",
    "x": 337.8,
    "y": 346.0,
    "c": 1
  }, {
    "n": "Cordoba",
    "x": 321.7,
    "y": 337.2,
    "c": 0
  }, {
    "n": "Rosario",
    "x": 331.5,
    "y": 341.5,
    "c": 0
  }, {
    "n": "Mendoza",
    "x": 308.8,
    "y": 341.3,
    "c": 0
  }, {
    "n": "San Miguel de Tucuman",
    "x": 318.8,
    "y": 324.5,
    "c": 0
  }, {
    "n": "La Plata",
    "x": 339.0,
    "y": 347.0,
    "c": 0
  }, {
    "n": "Mar del Plata",
    "x": 340.1,
    "y": 355.6,
    "c": 0
  }, {
    "n": "Quilmes",
    "x": 338.1,
    "y": 346.4,
    "c": 0
  }, {
    "n": "Salta",
    "x": 318.3,
    "y": 318.8,
    "c": 0
  }],
  "lat": -34,
  "lng": -64,
  "area": 2780400,
  "areaR": 9,
  "pop": 45696159,
  "popR": 35,
  "gdp": 640591410664,
  "gdpR": 22,
  "pc": 14018,
  "lvl": "고소득"
}, {
  "i": "ISL",
  "en": "Iceland",
  "d": "M459.7,65.4 459.1,67.2 462.2,69.1 458.6,71.2 450.6,73.1 448.2,73.6 444.5,73.2 436.8,72.3 439.5,71.1 433.5,69.7 438.4,69.2 438.3,68.4 432.4,67.7 434.3,65.9 438.5,65.5 442.8,67.4 447.1,65.9 450.6,66.7 455.1,65.2 459.7,65.4Z",
  "cx": 446.5,
  "cy": 68.7,
  "n": "아이슬란드",
  "ct": "유럽",
  "cap": "Reykjavik",
  "fl": "🇮🇸",
  "lang": "Icelandic",
  "cur": "Icelandic króna",
  "bb": [432.4, 65.2, 462.2, 73.6],
  "ci": [{
    "n": "Reykjavik",
    "x": 439.0,
    "y": 71.8,
    "c": 1
  }, {
    "n": "Kopavogur",
    "x": 439.1,
    "y": 71.9,
    "c": 0
  }, {
    "n": "Hafnarfjordur",
    "x": 439.0,
    "y": 72.0,
    "c": 0
  }, {
    "n": "Akureyri",
    "x": 449.7,
    "y": 67.6,
    "c": 0
  }, {
    "n": "Gardabar",
    "x": 438.9,
    "y": 72.0,
    "c": 0
  }, {
    "n": "Keflavik",
    "x": 437.3,
    "y": 72.2,
    "c": 0
  }, {
    "n": "Akranes",
    "x": 438.6,
    "y": 71.3,
    "c": 0
  }, {
    "n": "Selfoss",
    "x": 441.7,
    "y": 72.4,
    "c": 0
  }, {
    "n": "Njardvik",
    "x": 437.5,
    "y": 72.3,
    "c": 0
  }],
  "lat": 65,
  "lng": -18,
  "area": 103000,
  "areaR": 109,
  "pop": 386506,
  "popR": 175,
  "gdp": 31020032583,
  "gdpR": 107,
  "pc": 80258,
  "lvl": "고소득"
}, {
  "i": "HTI",
  "en": "Haiti",
  "d": "M296.7,194.7 298.4,194.8 300.8,195.2 301.0,196.8 300.8,197.8 300.2,198.3 300.9,199.1 300.8,199.9 299.0,199.4 297.7,199.6 296.0,199.4 294.7,199.9 293.2,199.0 293.4,198.2 296.0,198.5 298.1,198.8 299.1,198.1 297.8,196.9 297.8,195.9 296.1,195.4 296.7,194.7Z",
  "cx": 297.9,
  "cy": 197.6,
  "n": "아이티",
  "ct": "북아메리카",
  "cap": "Port-au-Prince",
  "fl": "🇭🇹",
  "lang": "French, Haitian Creole",
  "cur": "Haitian gourde",
  "bb": [293.2, 194.7, 301.0, 199.9],
  "ci": [{
    "n": "Port-au-Prince",
    "x": 299.1,
    "y": 198.5,
    "c": 1
  }, {
    "n": "Carrefour",
    "x": 298.9,
    "y": 198.5,
    "c": 0
  }, {
    "n": "Delmas 73",
    "x": 299.2,
    "y": 198.5,
    "c": 0
  }, {
    "n": "Cap-Haitien",
    "x": 299.4,
    "y": 195.1,
    "c": 0
  }, {
    "n": "Petionville",
    "x": 299.2,
    "y": 198.6,
    "c": 0
  }, {
    "n": "Gonaives",
    "x": 298.1,
    "y": 196.0,
    "c": 0
  }, {
    "n": "Saint-Marc",
    "x": 298.1,
    "y": 196.9,
    "c": 0
  }, {
    "n": "Les Cayes",
    "x": 295.1,
    "y": 199.4,
    "c": 0
  }, {
    "n": "Verrettes",
    "x": 298.7,
    "y": 197.1,
    "c": 0
  }],
  "lat": 19,
  "lng": -72.4,
  "area": 27750,
  "areaR": 148,
  "pop": 11772557,
  "popR": 82,
  "gdp": 19850829758,
  "gdpR": 126,
  "pc": 1686,
  "lvl": "중하위 소득"
}, {
  "i": "IRL",
  "en": "Ireland",
  "d": "M482.8,100.4 483.2,102.4 481.1,104.8 476.2,106.5 472.3,106.1 474.5,103.2 473.1,100.3 476.9,98.2 479.0,96.9 479.5,98.3 479.0,99.8 480.7,99.8 482.8,100.4Z",
  "cx": 478.5,
  "cy": 101.3,
  "n": "아일랜드",
  "ct": "유럽",
  "cap": "Dublin",
  "fl": "🇮🇪",
  "lang": "English, Irish",
  "cur": "Euro",
  "bb": [472.3, 96.9, 483.2, 106.5],
  "ci": [{
    "n": "Dublin",
    "x": 482.6,
    "y": 101.9,
    "c": 1
  }, {
    "n": "Cork",
    "x": 476.4,
    "y": 105.8,
    "c": 0
  }, {
    "n": "Dun Laoghaire",
    "x": 483.0,
    "y": 102.0,
    "c": 0
  }, {
    "n": "Limerick",
    "x": 476.0,
    "y": 103.7,
    "c": 0
  }, {
    "n": "Galway",
    "x": 474.9,
    "y": 102.0,
    "c": 0
  }, {
    "n": "Tallaght",
    "x": 482.3,
    "y": 102.0,
    "c": 0
  }, {
    "n": "Port Lairge",
    "x": 480.2,
    "y": 104.8,
    "c": 0
  }, {
    "n": "Drogheda",
    "x": 482.4,
    "y": 100.8,
    "c": 0
  }, {
    "n": "Dun Dealgan",
    "x": 482.2,
    "y": 100.0,
    "c": 0
  }],
  "lat": 53,
  "lng": -8,
  "area": 70273,
  "areaR": 122,
  "pop": 5395790,
  "popR": 120,
  "gdp": 545629450404,
  "gdpR": 25,
  "pc": 101121,
  "lvl": "고소득"
}, {
  "i": "AZE",
  "en": "Azerbaijan",
  "d": "M625.0,139.6 625.8,140.4 627.1,140.4 627.0,140.8 628.2,142.4 626.3,142.0 624.9,140.7 624.4,139.7 625.0,139.6Z M631.6,135.5 632.8,135.7 633.3,135.0 635.0,133.9 636.4,135.3 637.8,137.3 639.1,137.4 640.0,138.2 637.7,138.4 637.2,140.6 636.7,141.5 635.7,142.2 635.8,143.6 635.1,143.7 633.4,142.2 634.3,140.9 633.5,140.0 632.5,140.3 629.2,142.3 629.1,140.4 627.9,139.9 626.7,139.2 627.5,138.3 626.0,137.3 626.6,136.6 625.5,136.2 624.9,135.4 625.6,135.0 627.7,135.8 629.2,135.9 629.5,135.6 628.2,134.1 628.9,133.7 629.7,133.8 631.6,135.5Z",
  "cx": 630.6,
  "cy": 138.5,
  "n": "아제르바이잔",
  "ct": "아시아",
  "cap": "Baku",
  "fl": "🇦🇿",
  "lang": "Azerbaijani, Russian",
  "cur": "Azerbaijani manat",
  "bb": [624.4, 133.7, 640.0, 143.7],
  "ci": [{
    "n": "Baku",
    "x": 638.6,
    "y": 137.8,
    "c": 1
  }, {
    "n": "Ganca",
    "x": 628.8,
    "y": 137.0,
    "c": 0
  }, {
    "n": "Sumqayit",
    "x": 638.0,
    "y": 137.3,
    "c": 0
  }, {
    "n": "Mingacevir",
    "x": 630.7,
    "y": 136.7,
    "c": 0
  }, {
    "n": "Qaracuxur",
    "x": 638.8,
    "y": 137.8,
    "c": 0
  }, {
    "n": "Ali Bayramli",
    "x": 635.9,
    "y": 139.1,
    "c": 0
  }, {
    "n": "Bakixanov",
    "x": 638.8,
    "y": 137.7,
    "c": 0
  }, {
    "n": "Naxcivan",
    "x": 626.1,
    "y": 141.1,
    "c": 0
  }, {
    "n": "Saki",
    "x": 631.0,
    "y": 135.6,
    "c": 0
  }],
  "lat": 40.5,
  "lng": 47.5,
  "area": 86600,
  "areaR": 115,
  "pop": 10202830,
  "popR": 94,
  "gdp": 72356176471,
  "gdpR": 85,
  "pc": 7092,
  "lvl": "중상위 소득"
}, {
  "i": "AFG",
  "en": "Afghanistan",
  "d": "M670.0,151.0 672.9,152.0 675.0,151.7 675.5,150.4 677.7,150.0 679.3,149.1 679.9,146.9 682.2,146.4 682.6,145.4 683.9,146.1 684.8,146.2 686.3,146.2 688.4,146.8 689.3,147.2 691.3,146.3 692.2,146.8 693.1,145.5 694.8,145.6 695.2,145.2 695.5,144.1 696.7,143.1 698.2,143.7 697.9,144.6 698.7,144.7 698.5,147.0 699.6,147.9 700.5,147.4 701.8,147.1 703.5,145.8 705.4,146.1 708.3,146.1 708.8,146.9 707.2,147.2 705.7,147.7 702.6,148.0 699.6,148.6 698.0,149.8 698.6,151.0 698.9,152.4 697.5,153.5 697.7,154.6 696.9,155.6 694.3,155.5 695.3,157.3 693.6,158.0 692.4,159.7 692.5,161.4 691.5,162.2 690.4,161.9 688.3,162.3 688.0,163.0 685.9,163.0 684.4,164.6 684.3,167.0 680.7,168.1 678.8,167.9 678.2,168.5 676.5,168.1 673.7,168.6 669.1,167.1 671.6,164.6 671.4,162.8 669.3,162.4 669.1,160.6 668.2,158.4 669.3,156.9 668.1,156.5 668.9,154.4 670.0,151.0Z",
  "cx": 688.0,
  "cy": 153.3,
  "n": "아프가니스탄",
  "ct": "아시아",
  "cap": "Kabul",
  "fl": "🇦🇫",
  "lang": "Dari, Pashto",
  "cur": "Afghan afghani",
  "bb": [668.1, 143.1, 708.8, 168.6],
  "ci": [{
    "n": "Kabul",
    "x": 692.2,
    "y": 154.1,
    "c": 1
  }, {
    "n": "Kandahar",
    "x": 682.5,
    "y": 162.2,
    "c": 0
  }, {
    "n": "Mazar-e Sharif",
    "x": 686.4,
    "y": 148.0,
    "c": 0
  }, {
    "n": "Herat",
    "x": 672.7,
    "y": 154.6,
    "c": 0
  }, {
    "n": "Jalalabad",
    "x": 695.7,
    "y": 154.4,
    "c": 0
  }, {
    "n": "Konduz",
    "x": 691.3,
    "y": 148.0,
    "c": 0
  }, {
    "n": "Ghazni",
    "x": 690.1,
    "y": 156.8,
    "c": 0
  }, {
    "n": "Balkh",
    "x": 685.8,
    "y": 147.9,
    "c": 0
  }, {
    "n": "Baghlan",
    "x": 690.8,
    "y": 149.7,
    "c": 0
  }],
  "lat": 33,
  "lng": 65,
  "area": 652230,
  "areaR": 42,
  "pop": 42647492,
  "popR": 36,
  "gdp": 14502158192,
  "gdpR": 140,
  "pc": 340,
  "lvl": "저소득"
}, {
  "i": "ALB",
  "en": "Albania",
  "d": "M557.2,133.7 556.8,134.7 557.2,135.9 558.4,136.5 558.3,137.3 557.4,137.7 557.3,138.6 556.0,139.9 555.5,139.7 555.4,139.1 553.9,138.2 553.7,136.9 553.9,135.0 554.3,134.1 553.8,133.7 553.6,132.8 554.8,131.4 555.0,131.9 555.8,131.7 556.3,132.4 557.0,132.7 557.2,133.7Z",
  "cx": 555.9,
  "cy": 135.3,
  "n": "알바니아",
  "ct": "유럽",
  "cap": "Tirana",
  "fl": "🇦🇱",
  "lang": "Albanian",
  "cur": "Albanian lek",
  "bb": [553.6, 131.4, 558.4, 139.9],
  "ci": [{
    "n": "Tirana",
    "x": 555.1,
    "y": 135.2,
    "c": 1
  }, {
    "n": "Durres",
    "x": 554.0,
    "y": 135.2,
    "c": 0
  }, {
    "n": "Elbasan",
    "x": 555.8,
    "y": 135.8,
    "c": 0
  }, {
    "n": "Vlore",
    "x": 554.1,
    "y": 137.6,
    "c": 0
  }, {
    "n": "Shkoder",
    "x": 554.2,
    "y": 133.1,
    "c": 0
  }, {
    "n": "Fier-Cifci",
    "x": 554.4,
    "y": 136.9,
    "c": 0
  }, {
    "n": "Korce",
    "x": 557.7,
    "y": 137.2,
    "c": 0
  }, {
    "n": "Berat",
    "x": 555.4,
    "y": 136.9,
    "c": 0
  }, {
    "n": "Lushnje",
    "x": 554.7,
    "y": 136.3,
    "c": 0
  }],
  "lat": 41,
  "lng": 20,
  "area": 28748,
  "areaR": 145,
  "pop": 2377128,
  "popR": 145,
  "gdp": 22977677861,
  "gdpR": 117,
  "pc": 9666,
  "lvl": "중상위 소득"
}, {
  "i": "DZA",
  "en": "Algeria",
  "d": "M533.3,184.8 523.8,190.1 515.8,195.6 511.9,196.8 508.8,197.1 508.7,195.3 507.5,194.8 505.7,194.0 505.1,192.7 495.7,186.7 486.3,180.6 475.9,173.9 475.9,173.4 475.9,173.2 475.9,169.9 480.4,167.8 483.2,167.4 485.4,166.7 486.5,165.3 489.7,164.2 489.9,162.1 491.5,161.9 492.7,160.8 496.4,160.4 496.9,159.3 496.1,158.7 495.2,155.8 495.0,154.1 494.0,152.3 496.6,150.8 499.6,150.3 501.4,149.2 504.1,148.3 508.8,147.8 513.4,147.6 514.8,148.0 517.4,146.9 520.4,146.9 521.5,147.5 523.4,147.4 522.8,148.8 523.3,151.4 522.6,153.7 520.9,155.3 521.1,157.4 523.4,159.0 523.4,159.7 525.2,160.8 526.3,165.8 527.2,168.3 527.4,169.6 526.9,171.8 527.1,173.1 526.7,174.6 527.0,176.4 525.9,177.5 527.5,179.5 527.6,180.7 528.6,182.3 529.9,181.8 532.1,183.1 533.3,184.8Z",
  "cx": 509.3,
  "cy": 167.8,
  "n": "알제리",
  "ct": "아프리카",
  "cap": "Algiers",
  "fl": "🇩🇿",
  "lang": "Arabic",
  "cur": "Algerian dinar",
  "bb": [475.9, 146.9, 533.3, 197.1],
  "ci": [{
    "n": "Algiers",
    "x": 508.5,
    "y": 147.9,
    "c": 1
  }, {
    "n": "Oran",
    "x": 498.2,
    "y": 150.9,
    "c": 0
  }, {
    "n": "Constantine",
    "x": 518.4,
    "y": 149.0,
    "c": 0
  }, {
    "n": "Batna",
    "x": 517.2,
    "y": 151.2,
    "c": 0
  }, {
    "n": "Bab Ezzouar",
    "x": 508.8,
    "y": 148.0,
    "c": 0
  }, {
    "n": "Annaba",
    "x": 521.6,
    "y": 147.5,
    "c": 0
  }, {
    "n": "Sidi Bel Abbes",
    "x": 498.2,
    "y": 152.2,
    "c": 0
  }, {
    "n": "Ech Chettia",
    "x": 503.5,
    "y": 149.5,
    "c": 0
  }, {
    "n": "Bejaia",
    "x": 514.1,
    "y": 147.9,
    "c": 0
  }],
  "lat": 28,
  "lng": 3,
  "area": 2381741,
  "areaR": 11,
  "pop": 46814308,
  "popR": 33,
  "gdp": 239899491128,
  "gdpR": 54,
  "pc": 5124,
  "lvl": "중상위 소득"
}, {
  "i": "AGO",
  "en": "Angola",
  "d": "M545.4,266.3 546.0,268.4 546.8,270.1 547.5,271.0 548.5,272.4 550.4,272.2 551.3,271.8 552.8,272.2 553.2,271.5 553.9,269.9 555.7,269.8 555.8,269.3 557.2,269.3 557.0,270.3 560.4,270.3 560.4,272.0 561.0,273.1 560.6,274.7 560.8,276.5 561.7,277.5 561.5,280.8 562.2,280.5 563.4,280.6 565.2,280.2 566.4,280.4 566.7,281.2 566.4,282.6 566.9,283.9 566.5,284.9 566.7,285.9 560.9,285.8 560.8,294.7 562.7,296.9 564.5,298.7 559.4,299.8 552.7,299.4 550.7,298.1 539.5,298.2 539.1,298.4 537.4,297.1 535.6,297.1 533.9,297.5 532.6,298.1 532.3,296.3 532.7,293.9 533.7,291.3 533.8,290.1 534.7,287.6 535.4,286.5 537.0,284.7 537.9,283.4 538.2,281.4 538.0,279.8 537.2,278.8 536.4,277.1 535.8,275.5 535.9,274.9 536.8,273.8 535.9,271.1 535.4,269.2 534.0,267.5 534.2,266.9 535.4,266.6 536.2,266.6 537.2,266.3 545.4,266.3Z M534.5,265.8 533.8,266.1 533.1,264.0 534.2,262.8 535.1,262.3 536.1,263.3 535.1,263.9 534.6,264.6 534.5,265.8Z",
  "cx": 546.8,
  "cy": 278.4,
  "n": "앙골라",
  "ct": "아프리카",
  "cap": "Luanda",
  "fl": "🇦🇴",
  "lang": "Portuguese",
  "cur": "Angolan kwanza",
  "bb": [532.3, 262.3, 566.9, 299.8],
  "ci": [{
    "n": "Luanda",
    "x": 536.8,
    "y": 274.6,
    "c": 1
  }, {
    "n": "Huambo",
    "x": 543.7,
    "y": 285.5,
    "c": 0
  }, {
    "n": "Lobito",
    "x": 537.6,
    "y": 284.3,
    "c": 0
  }, {
    "n": "Benguela",
    "x": 537.2,
    "y": 284.9,
    "c": 0
  }, {
    "n": "Kuito",
    "x": 547.0,
    "y": 284.4,
    "c": 0
  }, {
    "n": "Lubango",
    "x": 537.5,
    "y": 291.4,
    "c": 0
  }, {
    "n": "Malanje",
    "x": 545.4,
    "y": 276.5,
    "c": 0
  }, {
    "n": "Namibe",
    "x": 533.8,
    "y": 292.2,
    "c": 0
  }, {
    "n": "Soyo",
    "x": 534.4,
    "y": 267.0,
    "c": 0
  }],
  "lat": -12.5,
  "lng": 18.5,
  "area": 1246700,
  "areaR": 24,
  "pop": 37885849,
  "popR": 40,
  "gdp": 84722957642,
  "gdpR": 75,
  "pc": 2236,
  "lvl": "중하위 소득"
}, {
  "i": "ERI",
  "en": "Eritrea",
  "d": "M617.6,215.2 616.7,214.3 615.6,212.6 614.3,211.7 613.6,210.8 611.2,209.7 609.3,209.6 608.6,209.1 607.0,209.7 605.3,208.4 604.4,210.5 601.2,209.9 600.9,208.8 602.1,204.7 602.4,202.9 603.2,202.0 605.3,201.6 606.7,200.0 608.3,203.2 609.1,205.8 610.6,207.1 614.4,209.7 615.9,211.3 617.4,212.9 618.3,213.9 619.7,214.7 618.8,215.4 617.6,215.2Z",
  "cx": 610.6,
  "cy": 209.3,
  "n": "에리트레아",
  "ct": "아프리카",
  "cap": "Asmara",
  "fl": "🇪🇷",
  "lang": "Arabic, English",
  "cur": "Eritrean nakfa",
  "bb": [600.9, 200.0, 619.7, 215.4],
  "ci": [{
    "n": "Asmara",
    "x": 608.1,
    "y": 207.4,
    "c": 1
  }, {
    "n": "Mendefera",
    "x": 607.8,
    "y": 208.6,
    "c": 0
  }, {
    "n": "Barentu",
    "x": 604.4,
    "y": 208.0,
    "c": 0
  }, {
    "n": "Adi Keyh",
    "x": 609.4,
    "y": 208.8,
    "c": 0
  }, {
    "n": "Idi",
    "x": 615.8,
    "y": 211.3,
    "c": 0
  }, {
    "n": "Dekemhare",
    "x": 608.5,
    "y": 208.1,
    "c": 0
  }, {
    "n": "Akurdet",
    "x": 605.2,
    "y": 206.8,
    "c": 0
  }, {
    "n": "Teseney",
    "x": 601.8,
    "y": 208.0,
    "c": 0
  }],
  "lat": 15,
  "lng": 39,
  "area": 117600,
  "areaR": 102,
  "pop": 3535603,
  "popR": 131,
  "gdp": 2065001626,
  "gdpR": 187,
  "pc": 584,
  "lvl": "저소득"
}, {
  "i": "SWZ",
  "en": "Swaziland",
  "d": "M589.1,324.3 588.5,325.5 586.9,325.8 585.2,324.3 585.2,323.3 586.0,322.3 586.2,321.5 587.0,321.3 588.4,321.8 588.8,323.0 589.1,324.3Z",
  "cx": 587.3,
  "cy": 323.4,
  "n": "에스와티니",
  "ct": "아프리카",
  "cap": "Lobamba",
  "fl": "🇸🇿",
  "lang": "English, Swazi",
  "cur": "Swazi lilangeni",
  "bb": [585.2, 321.3, 589.1, 325.8],
  "ci": [{
    "n": "Manzini",
    "x": 587.1,
    "y": 323.6,
    "c": 0
  }, {
    "n": "Mbabane",
    "x": 586.5,
    "y": 323.1,
    "c": 0
  }, {
    "n": "Big Bend",
    "x": 588.7,
    "y": 324.5,
    "c": 0
  }, {
    "n": "Malkerns",
    "x": 586.6,
    "y": 323.8,
    "c": 0
  }, {
    "n": "Mhlume",
    "x": 588.5,
    "y": 322.3,
    "c": 0
  }, {
    "n": "Hluti",
    "x": 587.8,
    "y": 325.6,
    "c": 0
  }, {
    "n": "Siteki",
    "x": 588.8,
    "y": 323.5,
    "c": 0
  }, {
    "n": "Piggs Peak",
    "x": 586.8,
    "y": 322.1,
    "c": 0
  }, {
    "n": "Lobamba",
    "x": 586.7,
    "y": 323.5,
    "c": 1
  }],
  "lat": -26.5,
  "lng": 31.5,
  "area": 17364,
  "areaR": 159,
  "pop": 1242822,
  "popR": 158,
  "gdp": 4597855845,
  "gdpR": 167,
  "pc": 3700,
  "lvl": "중하위 소득"
}, {
  "i": "EST",
  "en": "Estonia",
  "d": "M567.5,89.5 567.9,87.8 566.8,88.2 565.1,87.2 564.8,85.6 568.3,84.8 571.8,84.4 574.9,84.9 577.7,84.8 578.1,85.3 576.2,86.9 577.0,89.5 575.8,90.3 573.5,90.3 571.1,89.3 569.9,89.0 567.5,89.5Z",
  "cx": 571.4,
  "cy": 87.5,
  "n": "에스토니아",
  "ct": "유럽",
  "cap": "Tallinn",
  "fl": "🇪🇪",
  "lang": "Estonian",
  "cur": "Euro",
  "bb": [564.8, 84.4, 578.1, 90.3],
  "ci": [{
    "n": "Tallinn",
    "x": 568.8,
    "y": 84.9,
    "c": 1
  }, {
    "n": "Tartu",
    "x": 574.2,
    "y": 87.8,
    "c": 0
  }, {
    "n": "Narva",
    "x": 578.3,
    "y": 85.1,
    "c": 0
  }, {
    "n": "Kohtla-Jarve",
    "x": 575.8,
    "y": 85.0,
    "c": 0
  }, {
    "n": "Parnu",
    "x": 568.1,
    "y": 87.8,
    "c": 0
  }, {
    "n": "Viljandi",
    "x": 571.1,
    "y": 87.9,
    "c": 0
  }, {
    "n": "Rakvere",
    "x": 573.2,
    "y": 85.1,
    "c": 0
  }, {
    "n": "Sillamae",
    "x": 577.1,
    "y": 85.0,
    "c": 0
  }, {
    "n": "Maardu",
    "x": 569.5,
    "y": 84.8,
    "c": 0
  }],
  "lat": 59,
  "lng": 26,
  "area": 45227,
  "areaR": 133,
  "pop": 1372341,
  "popR": 154,
  "gdp": 40744848828,
  "gdpR": 102,
  "pc": 29690,
  "lvl": "고소득"
}, {
  "i": "ECU",
  "en": "Ecuador",
  "d": "M276.9,259.5 278.4,257.4 277.8,256.2 276.8,257.5 275.1,256.2 275.7,255.5 275.2,252.9 276.2,252.5 276.7,250.8 277.7,249.0 277.5,247.9 279.0,247.3 281.0,246.2 283.7,247.8 284.3,247.7 284.9,248.9 287.3,249.3 288.1,248.8 289.4,249.8 290.6,250.4 291.0,252.5 290.2,254.3 287.1,257.2 283.8,258.3 282.1,260.8 281.6,262.6 280.0,263.8 278.8,262.4 277.7,262.1 276.5,262.3 276.5,261.3 277.3,260.6 276.9,259.5Z",
  "cx": 281.0,
  "cy": 254.8,
  "n": "에콰도르",
  "ct": "남아메리카",
  "cap": "Quito",
  "fl": "🇪🇨",
  "lang": "Spanish",
  "cur": "United States dollar",
  "bb": [275.1, 246.2, 291.0, 263.8],
  "ci": [{
    "n": "Guayaquil",
    "x": 278.1,
    "y": 256.0,
    "c": 0
  }, {
    "n": "Quito",
    "x": 281.9,
    "y": 250.6,
    "c": 1
  }, {
    "n": "Cuenca",
    "x": 280.6,
    "y": 258.0,
    "c": 0
  }, {
    "n": "Santo Domingo de los Colorados",
    "x": 280.1,
    "y": 250.7,
    "c": 0
  }, {
    "n": "Machala",
    "x": 277.9,
    "y": 259.1,
    "c": 0
  }, {
    "n": "Manta",
    "x": 275.7,
    "y": 252.6,
    "c": 0
  }, {
    "n": "Portoviejo",
    "x": 276.5,
    "y": 252.9,
    "c": 0
  }, {
    "n": "Duran",
    "x": 278.2,
    "y": 256.1,
    "c": 0
  }, {
    "n": "Ambato",
    "x": 281.6,
    "y": 253.5,
    "c": 0
  }],
  "lat": -2,
  "lng": -77.5,
  "area": 276841,
  "areaR": 75,
  "pop": 18135478,
  "popR": 70,
  "gdp": 118844826000,
  "gdpR": 64,
  "pc": 6553,
  "lvl": "중상위 소득"
}, {
  "i": "ETH",
  "en": "Ethiopia",
  "d": "M605.3,208.4 607.0,209.7 608.6,209.1 609.3,209.6 611.2,209.7 613.6,210.8 614.3,211.7 615.6,212.6 616.7,214.3 617.6,215.2 616.7,216.4 615.7,217.7 615.9,218.5 616.0,219.3 617.5,219.3 618.2,219.2 618.8,219.6 618.2,220.6 619.2,222.2 620.3,223.5 621.3,224.5 630.4,227.8 632.7,227.8 624.9,236.1 621.3,236.2 618.8,238.2 617.0,238.2 616.3,239.1 614.4,239.1 613.2,238.2 610.7,239.3 609.9,240.5 608.0,240.3 607.4,240.0 606.8,240.0 605.9,240.0 602.4,237.6 600.4,237.6 599.5,236.7 599.5,235.2 598.1,234.7 596.4,231.7 595.1,231.0 594.7,229.9 593.2,228.6 591.5,228.4 592.5,226.8 594.0,226.7 594.4,225.9 594.3,223.4 595.2,220.5 596.5,219.7 596.8,218.6 597.9,216.4 599.6,215.1 600.8,212.3 601.2,209.9 604.4,210.5 605.3,208.4Z",
  "cx": 608.4,
  "cy": 224.7,
  "n": "에티오피아",
  "ct": "아프리카",
  "cap": "Addis Ababa",
  "fl": "🇪🇹",
  "lang": "Amharic",
  "cur": "Ethiopian birr",
  "bb": [591.5, 208.4, 632.7, 240.5],
  "ci": [{
    "n": "Addis Ababa",
    "x": 607.5,
    "y": 224.9,
    "c": 1
  }, {
    "n": "Dire Dawa",
    "x": 616.3,
    "y": 223.4,
    "c": 0
  }, {
    "n": "Nazret",
    "x": 609.1,
    "y": 226.2,
    "c": 0
  }, {
    "n": "Bahir Dar",
    "x": 603.8,
    "y": 217.8,
    "c": 0
  }, {
    "n": "Gonder",
    "x": 604.1,
    "y": 215.0,
    "c": 0
  }, {
    "n": "Dese",
    "x": 610.1,
    "y": 219.1,
    "c": 0
  }, {
    "n": "Awasa",
    "x": 606.9,
    "y": 230.4,
    "c": 0
  }, {
    "n": "Jima",
    "x": 602.3,
    "y": 228.7,
    "c": 0
  }, {
    "n": "Debre Zeyit",
    "x": 608.3,
    "y": 225.7,
    "c": 0
  }],
  "lat": 8,
  "lng": 38,
  "area": 1104300,
  "areaR": 28,
  "pop": 132059767,
  "popR": 10,
  "gdp": 163697927594,
  "gdpR": 59,
  "pc": 1240,
  "lvl": "중하위 소득"
}, {
  "i": "SLV",
  "en": "El Salvador",
  "d": "M256.1,212.8 255.8,213.5 254.2,213.4 253.2,213.2 252.1,212.6 250.5,212.4 249.7,211.8 249.8,211.4 250.8,210.7 251.3,210.4 251.1,210.1 251.8,209.9 252.6,210.2 253.2,210.7 254.1,211.2 254.2,211.5 255.4,211.2 255.9,211.4 256.3,211.7 256.1,212.8Z",
  "cx": 253.2,
  "cy": 211.6,
  "n": "엘살바도르",
  "ct": "북아메리카",
  "cap": "San Salvador",
  "fl": "🇸🇻",
  "lang": "Spanish",
  "cur": "United States dollar",
  "bb": [249.7, 209.9, 256.3, 213.5],
  "ci": [{
    "n": "San Salvador",
    "x": 252.2,
    "y": 211.9,
    "c": 1
  }, {
    "n": "Soyapango",
    "x": 252.4,
    "y": 211.8,
    "c": 0
  }, {
    "n": "Santa Ana",
    "x": 251.2,
    "y": 211.1,
    "c": 0
  }, {
    "n": "San Miquel",
    "x": 255.0,
    "y": 212.5,
    "c": 0
  }, {
    "n": "Mejicanos",
    "x": 252.2,
    "y": 211.8,
    "c": 0
  }, {
    "n": "Nueva San Salvador",
    "x": 252.0,
    "y": 212.0,
    "c": 0
  }, {
    "n": "Apopa",
    "x": 252.3,
    "y": 211.6,
    "c": 0
  }, {
    "n": "Delgado",
    "x": 252.3,
    "y": 211.9,
    "c": 0
  }, {
    "n": "Sonsonate",
    "x": 250.8,
    "y": 211.9,
    "c": 0
  }],
  "lat": 13.8,
  "lng": -88.9,
  "area": 21041,
  "areaR": 153,
  "pop": 6338193,
  "popR": 111,
  "gdp": 34015620000,
  "gdpR": 104,
  "pc": 5367,
  "lvl": "중상위 소득"
}, {
  "i": "GBR",
  "en": "United Kingdom",
  "d": "M484.3,98.5 482.8,100.4 480.7,99.8 479.0,99.8 479.5,98.3 479.0,96.9 481.3,96.7 484.3,98.5Z M491.7,87.1 488.7,90.1 491.5,89.7 494.6,89.8 493.8,92.0 491.3,94.5 494.2,94.7 494.4,95.0 496.9,98.3 498.8,98.7 500.5,101.9 501.3,103.0 504.7,103.5 504.3,105.3 502.9,106.1 504.0,107.5 501.5,109.0 497.8,109.0 493.1,109.7 491.8,109.2 490.0,110.5 487.4,110.2 485.4,111.2 484.0,110.7 488.0,107.7 490.5,107.1 486.2,106.7 485.4,105.6 488.3,104.7 486.7,103.2 487.3,101.4 491.4,101.7 491.8,100.0 490.0,98.3 489.9,98.3 486.5,97.8 485.9,97.1 486.9,95.8 486.0,95.0 484.5,96.4 484.3,93.7 482.9,92.3 483.9,89.4 486.1,87.1 488.3,87.4 491.7,87.1Z",
  "cx": 490.0,
  "cy": 99.6,
  "n": "영국",
  "ct": "유럽",
  "cap": "London",
  "fl": "🇬🇧",
  "lang": "English",
  "cur": "British pound",
  "bb": [479.0, 87.1, 504.7, 111.2],
  "ci": [{
    "n": "London",
    "x": 499.7,
    "y": 106.9,
    "c": 1
  }, {
    "n": "Birmingham",
    "x": 494.7,
    "y": 104.3,
    "c": 0
  }, {
    "n": "Glasgow",
    "x": 488.2,
    "y": 94.9,
    "c": 0
  }, {
    "n": "Liverpool",
    "x": 491.7,
    "y": 101.6,
    "c": 0
  }, {
    "n": "Leeds",
    "x": 495.7,
    "y": 100.6,
    "c": 0
  }, {
    "n": "Sheffield",
    "x": 495.9,
    "y": 101.7,
    "c": 0
  }, {
    "n": "Edinburgh",
    "x": 491.1,
    "y": 94.6,
    "c": 0
  }, {
    "n": "Bristol",
    "x": 492.8,
    "y": 107.1,
    "c": 0
  }, {
    "n": "Manchester",
    "x": 493.8,
    "y": 101.4,
    "c": 0
  }],
  "lat": 54,
  "lng": -2,
  "area": 242900,
  "areaR": 81,
  "pop": 69226000,
  "popR": 21,
  "gdp": 3340032380668,
  "gdpR": 6,
  "pc": 48248,
  "lvl": "고소득"
}, {
  "i": "YEM",
  "en": "Yemen",
  "d": "M647.5,203.7 645.5,204.5 645.0,205.7 644.9,206.7 642.1,207.8 637.7,209.1 635.2,211.1 634.0,211.3 633.2,211.1 631.5,212.2 629.8,212.8 627.4,212.9 626.7,213.1 626.1,213.8 625.4,214.0 625.0,214.7 623.6,214.7 622.7,215.0 620.8,214.9 620.1,213.3 620.1,211.8 619.7,210.9 619.1,208.9 618.3,207.7 618.9,207.6 618.6,206.3 619.0,205.8 618.8,204.6 620.1,203.7 619.8,202.5 620.5,201.2 621.6,201.9 622.4,201.6 625.6,201.6 626.1,201.9 628.8,202.1 629.9,202.0 630.6,202.9 631.9,202.5 633.8,199.5 636.4,198.3 644.4,197.2 646.6,201.8 647.5,203.7Z",
  "cx": 629.2,
  "cy": 207.1,
  "n": "예멘",
  "ct": "아시아",
  "cap": "Sana'a",
  "fl": "🇾🇪",
  "lang": "Arabic",
  "cur": "Yemeni rial",
  "bb": [618.3, 197.2, 647.5, 215.0],
  "ci": [{
    "n": "Sanaa",
    "x": 622.8,
    "y": 207.3,
    "c": 1
  }, {
    "n": "Al Hudaydah",
    "x": 619.3,
    "y": 208.9,
    "c": 0
  }, {
    "n": "Ta`izz",
    "x": 622.3,
    "y": 212.3,
    "c": 0
  }, {
    "n": "`Adan",
    "x": 625.1,
    "y": 214.5,
    "c": 0
  }, {
    "n": "Al Mukalla",
    "x": 636.5,
    "y": 209.6,
    "c": 0
  }, {
    "n": "Ibb",
    "x": 622.7,
    "y": 211.2,
    "c": 0
  }, {
    "n": "Sayyan",
    "x": 623.1,
    "y": 207.9,
    "c": 0
  }, {
    "n": "Zabid",
    "x": 620.3,
    "y": 210.6,
    "c": 0
  }, {
    "n": "Bajil",
    "x": 620.2,
    "y": 208.1,
    "c": 0
  }],
  "lat": 15,
  "lng": 48,
  "area": 527968,
  "areaR": 51,
  "pop": 40583164,
  "popR": 38,
  "gdp": 21606160663,
  "gdpR": 118,
  "pc": 532,
  "lvl": "저소득"
}, {
  "i": "OMN",
  "en": "Oman",
  "d": "M663.5,191.3 662.5,193.3 661.2,193.1 660.6,193.8 660.2,195.2 660.5,197.0 660.3,197.4 659.0,197.4 657.2,198.4 657.0,199.8 656.3,200.3 654.6,200.3 653.5,201.0 653.5,202.1 652.2,202.9 650.7,202.7 648.8,203.6 647.5,203.7 646.6,201.8 644.4,197.2 652.8,194.4 654.6,188.9 653.4,186.9 653.4,185.8 654.2,184.7 654.2,183.5 655.5,183.0 655.0,182.6 655.2,180.8 656.7,180.8 657.9,182.7 659.5,183.7 661.5,184.0 663.1,184.5 664.4,186.1 665.1,187.1 666.1,187.4 666.1,188.0 665.1,189.7 664.7,190.5 663.5,191.3Z M656.6,178.1 656.3,178.6 655.8,177.6 656.6,176.7 656.9,176.9 656.6,178.1Z",
  "cx": 657.3,
  "cy": 190.3,
  "n": "오만",
  "ct": "아시아",
  "cap": "Muscat",
  "fl": "🇴🇲",
  "lang": "Arabic",
  "cur": "Omani rial",
  "bb": [644.4, 176.7, 666.1, 203.7],
  "ci": [{
    "n": "Muscat",
    "x": 662.8,
    "y": 184.4,
    "c": 1
  }, {
    "n": "As Sib",
    "x": 661.6,
    "y": 184.2,
    "c": 0
  }, {
    "n": "Salalah",
    "x": 650.2,
    "y": 202.7,
    "c": 0
  }, {
    "n": "Bawshar",
    "x": 662.2,
    "y": 184.6,
    "c": 0
  }, {
    "n": "Suhar",
    "x": 657.6,
    "y": 182.3,
    "c": 0
  }, {
    "n": "As Suwayq",
    "x": 659.6,
    "y": 183.8,
    "c": 0
  }, {
    "n": "`Ibri",
    "x": 657.0,
    "y": 185.5,
    "c": 0
  }, {
    "n": "Saham",
    "x": 658.0,
    "y": 182.9,
    "c": 0
  }, {
    "n": "Rustaq",
    "x": 659.5,
    "y": 185.0,
    "c": 0
  }],
  "lat": 21,
  "lng": 57,
  "area": 309500,
  "areaR": 73,
  "pop": 5281538,
  "popR": 124,
  "gdp": 108192457737,
  "gdpR": 67,
  "pc": 20485,
  "lvl": "고소득"
}, {
  "i": "AUT",
  "en": "Austria",
  "d": "M547.2,116.3 547.0,117.5 545.4,117.5 545.9,118.1 545.0,119.9 544.5,120.3 542.0,120.4 540.6,121.0 538.4,120.8 534.4,120.1 533.8,119.1 531.0,119.6 530.7,120.1 529.0,119.7 527.6,119.7 526.3,119.2 526.8,118.5 526.7,118.0 527.5,117.8 528.9,118.6 529.3,117.9 531.7,118.0 533.7,117.5 535.1,117.6 535.9,118.1 536.2,117.7 535.8,115.9 536.8,115.5 537.8,114.2 539.8,115.1 541.4,114.0 542.4,113.8 544.5,114.6 545.8,114.5 547.1,115.0 546.9,115.4 547.2,116.3Z",
  "cx": 537.5,
  "cy": 117.7,
  "n": "오스트리아",
  "ct": "유럽",
  "cap": "Vienna",
  "fl": "🇦🇹",
  "lang": "Austro-Bavarian German",
  "cur": "Euro",
  "bb": [526.3, 113.8, 547.2, 121.0],
  "ci": [{
    "n": "Wien",
    "x": 545.5,
    "y": 116.1,
    "c": 0
  }, {
    "n": "Graz",
    "x": 542.9,
    "y": 119.3,
    "c": 0
  }, {
    "n": "Linz",
    "x": 539.7,
    "y": 115.8,
    "c": 0
  }, {
    "n": "Salzburg",
    "x": 536.2,
    "y": 117.2,
    "c": 0
  }, {
    "n": "Innsbruck",
    "x": 531.7,
    "y": 118.7,
    "c": 0
  }, {
    "n": "Klagenfurt",
    "x": 539.7,
    "y": 120.5,
    "c": 0
  }, {
    "n": "Villach",
    "x": 538.5,
    "y": 120.5,
    "c": 0
  }, {
    "n": "Wels",
    "x": 539.0,
    "y": 116.2,
    "c": 0
  }, {
    "n": "Sankt Polten",
    "x": 543.4,
    "y": 116.1,
    "c": 0
  }],
  "lat": 47.3,
  "lng": 13.3,
  "area": 83871,
  "areaR": 116,
  "pop": 9177982,
  "popR": 98,
  "gdp": 516034144116,
  "gdpR": 26,
  "pc": 56225,
  "lvl": "고소득"
}, {
  "i": "HND",
  "en": "Honduras",
  "d": "M257.5,213.9 257.0,213.1 256.1,212.8 256.3,211.7 255.9,211.4 255.4,211.2 254.2,211.5 254.1,211.2 253.2,210.7 252.6,210.2 251.8,209.9 252.4,209.2 252.2,208.7 252.3,208.1 253.7,207.4 254.9,206.3 255.2,206.4 255.8,205.9 256.6,205.9 256.9,206.1 257.3,206.0 258.6,206.2 259.9,206.2 260.8,205.9 261.1,205.5 262.0,205.7 262.7,205.9 263.4,205.8 263.9,205.6 265.2,206.0 265.6,206.0 266.5,206.5 267.3,207.2 268.3,207.6 269.0,208.3 268.1,208.3 267.7,208.7 266.7,209.0 266.0,209.0 265.4,209.4 264.9,209.3 264.4,208.8 264.1,208.9 263.7,209.6 263.5,209.6 263.4,210.1 262.5,210.9 261.9,211.2 261.7,211.6 260.8,211.0 260.2,211.7 259.7,211.7 259.0,211.8 259.1,213.2 258.7,213.2 258.3,213.8 257.5,213.9Z",
  "cx": 260.1,
  "cy": 209.1,
  "n": "온두라스",
  "ct": "북아메리카",
  "cap": "Tegucigalpa",
  "fl": "🇭🇳",
  "lang": "Spanish",
  "cur": "Honduran lempira",
  "bb": [251.8, 205.5, 269.0, 213.9],
  "ci": [{
    "n": "Tegucigalpa",
    "x": 257.7,
    "y": 210.8,
    "c": 1
  }, {
    "n": "San Pedro Sula",
    "x": 255.5,
    "y": 206.9,
    "c": 0
  }, {
    "n": "Choloma",
    "x": 255.7,
    "y": 206.6,
    "c": 0
  }, {
    "n": "La Ceiba",
    "x": 258.9,
    "y": 206.2,
    "c": 0
  }, {
    "n": "El Progreso",
    "x": 256.1,
    "y": 207.2,
    "c": 0
  }, {
    "n": "Ciudad Choluteca",
    "x": 257.8,
    "y": 213.1,
    "c": 0
  }, {
    "n": "Comayagua",
    "x": 256.6,
    "y": 209.9,
    "c": 0
  }, {
    "n": "Puerto Cortez",
    "x": 255.7,
    "y": 206.0,
    "c": 0
  }, {
    "n": "La Lima",
    "x": 255.8,
    "y": 207.1,
    "c": 0
  }],
  "lat": 15,
  "lng": -86.5,
  "area": 112492,
  "areaR": 104,
  "pop": 10825703,
  "popR": 88,
  "gdp": 34400509852,
  "gdpR": 103,
  "pc": 3178,
  "lvl": "중하위 소득"
}, {
  "i": "JOR",
  "en": "Jordan",
  "d": "M598.7,160.0 599.2,159.1 602.3,160.2 607.8,157.3 608.9,160.7 608.3,161.1 602.8,162.5 605.6,165.3 604.6,165.7 604.2,166.7 602.1,167.0 601.4,168.0 600.2,168.9 597.1,168.5 597.0,168.1 598.4,163.6 598.3,162.5 598.7,161.7 598.7,160.0Z",
  "cx": 601.8,
  "cy": 163.5,
  "n": "요르단",
  "ct": "아시아",
  "cap": "Amman",
  "fl": "🇯🇴",
  "lang": "Arabic",
  "cur": "Jordanian dinar",
  "bb": [597.0, 157.3, 608.9, 168.9],
  "ci": [{
    "n": "Amman",
    "x": 599.8,
    "y": 161.2,
    "c": 1
  }, {
    "n": "Irbid",
    "x": 599.6,
    "y": 159.6,
    "c": 0
  }, {
    "n": "Wadi as Sir",
    "x": 599.5,
    "y": 161.2,
    "c": 0
  }, {
    "n": "`Ajlun",
    "x": 599.3,
    "y": 160.2,
    "c": 0
  }, {
    "n": "Al `Aqabah",
    "x": 597.2,
    "y": 168.0,
    "c": 0
  }, {
    "n": "Madaba",
    "x": 599.4,
    "y": 161.9,
    "c": 0
  }, {
    "n": "As Salt",
    "x": 599.2,
    "y": 161.0,
    "c": 0
  }, {
    "n": "Ar Ramtha",
    "x": 600.0,
    "y": 159.6,
    "c": 0
  }, {
    "n": "Al Mafraq",
    "x": 600.6,
    "y": 160.1,
    "c": 0
  }],
  "lat": 31,
  "lng": 36,
  "area": 89342,
  "areaR": 113,
  "pop": 11552876,
  "popR": 83,
  "gdp": 50813642349,
  "gdpR": 91,
  "pc": 4398,
  "lvl": "중하위 소득"
}, {
  "i": "UGA",
  "en": "Uganda",
  "d": "M588.5,252.9 585.5,252.8 584.5,253.2 582.8,254.0 582.2,253.7 582.2,251.6 582.8,250.6 583.0,248.3 583.6,247.0 584.6,245.6 585.7,244.9 586.6,243.9 585.5,243.5 585.6,240.3 586.8,239.5 588.6,240.1 590.8,239.5 592.8,239.5 594.5,238.2 595.8,240.1 596.1,241.5 597.3,244.7 596.3,246.7 594.9,248.6 594.1,249.7 594.2,252.6 588.5,252.9Z",
  "cx": 588.7,
  "cy": 246.5,
  "n": "우간다",
  "ct": "아프리카",
  "cap": "Kampala",
  "fl": "🇺🇬",
  "lang": "English, Swahili",
  "cur": "Ugandan shilling",
  "bb": [582.2, 238.2, 597.3, 254.0],
  "ci": [{
    "n": "Kampala",
    "x": 590.5,
    "y": 249.1,
    "c": 1
  }, {
    "n": "Gulu",
    "x": 589.7,
    "y": 242.3,
    "c": 0
  }, {
    "n": "Lira",
    "x": 591.4,
    "y": 243.8,
    "c": 0
  }, {
    "n": "Jinja",
    "x": 592.2,
    "y": 248.8,
    "c": 0
  }, {
    "n": "Bwizibwera",
    "x": 585.1,
    "y": 251.6,
    "c": 0
  }, {
    "n": "Mbale",
    "x": 594.9,
    "y": 247.0,
    "c": 0
  }, {
    "n": "Mukono",
    "x": 591.0,
    "y": 249.0,
    "c": 0
  }, {
    "n": "Kasese",
    "x": 583.3,
    "y": 249.4,
    "c": 0
  }, {
    "n": "Masaka",
    "x": 588.1,
    "y": 250.9,
    "c": 0
  }],
  "lat": 1,
  "lng": 32,
  "area": 241550,
  "areaR": 82,
  "pop": 50015092,
  "popR": 31,
  "gdp": 49272882214,
  "gdpR": 93,
  "pc": 985,
  "lvl": "저소득"
}, {
  "i": "URY",
  "en": "Uruguay",
  "d": "M339.9,333.9 341.7,333.6 344.5,335.8 345.6,335.7 348.4,337.5 350.6,339.0 352.2,340.9 351.0,342.2 351.7,343.8 350.5,345.5 347.4,347.1 345.3,346.5 343.8,346.8 341.3,345.6 339.4,345.7 337.7,344.2 337.9,342.4 338.5,341.8 338.5,339.0 339.2,336.2 339.9,333.9Z",
  "cx": 344.0,
  "cy": 340.8,
  "n": "우루과이",
  "ct": "남아메리카",
  "cap": "Montevideo",
  "fl": "🇺🇾",
  "lang": "Spanish",
  "cur": "Uruguayan peso",
  "bb": [337.7, 333.6, 352.2, 347.1],
  "ci": [{
    "n": "Montevideo",
    "x": 344.0,
    "y": 346.8,
    "c": 1
  }, {
    "n": "Salto",
    "x": 339.0,
    "y": 337.2,
    "c": 0
  }, {
    "n": "Paysandu",
    "x": 338.7,
    "y": 339.8,
    "c": 0
  }, {
    "n": "Las Piedras",
    "x": 343.8,
    "y": 346.5,
    "c": 0
  }, {
    "n": "Rivera",
    "x": 345.8,
    "y": 335.8,
    "c": 0
  }, {
    "n": "Maldonado",
    "x": 347.4,
    "y": 346.9,
    "c": 0
  }, {
    "n": "Tacuarembo",
    "x": 344.5,
    "y": 338.1,
    "c": 0
  }, {
    "n": "Melo",
    "x": 349.5,
    "y": 339.9,
    "c": 0
  }, {
    "n": "Mercedes",
    "x": 338.8,
    "y": 342.4,
    "c": 0
  }],
  "lat": -33,
  "lng": -56,
  "area": 181034,
  "areaR": 92,
  "pop": 3386588,
  "popR": 133,
  "gdp": 77240831587,
  "gdpR": 82,
  "pc": 22808,
  "lvl": "고소득"
}, {
  "i": "UZB",
  "en": "Uzbekistan",
  "d": "M684.8,146.2 684.9,144.5 681.2,143.3 678.3,142.0 676.4,140.7 673.3,138.7 671.9,135.9 671.0,135.4 668.0,135.5 666.9,134.9 666.6,132.7 662.9,131.2 660.5,132.9 658.1,133.8 658.6,135.2 655.5,135.3 655.4,125.0 662.5,123.4 663.0,123.6 667.3,125.6 669.6,126.7 672.3,129.2 675.5,128.7 680.3,128.5 683.6,130.6 683.4,133.3 684.8,133.4 685.3,135.6 688.8,135.7 689.6,137.0 690.6,137.0 691.9,135.0 695.5,133.1 697.1,132.6 697.9,132.9 695.6,134.7 697.7,135.7 699.6,135.0 702.9,136.5 699.4,138.5 697.3,138.2 696.1,138.3 695.7,137.5 696.3,136.2 692.6,136.9 691.7,138.6 690.4,140.2 688.1,140.1 687.3,141.3 689.4,141.9 690.0,144.0 688.4,146.8 686.3,146.2 684.8,146.2Z",
  "cx": 681.9,
  "cy": 135.9,
  "n": "우즈베키스탄",
  "ct": "아시아",
  "cap": "Tashkent",
  "fl": "🇺🇿",
  "lang": "Russian, Uzbek",
  "cur": "Uzbekistani soʻm",
  "bb": [655.4, 123.4, 702.9, 146.8],
  "ci": [],
  "lat": 41,
  "lng": 64,
  "area": 447400,
  "areaR": 58,
  "pop": 36361859,
  "popR": 43,
  "gdp": 90889149307,
  "gdpR": 72,
  "pc": 2500,
  "lvl": "중하위 소득"
}, {
  "i": "UKR",
  "en": "Ukraine",
  "d": "M588.3,105.3 589.3,105.4 590.0,104.8 590.9,104.9 593.8,104.6 595.5,106.2 594.8,106.8 595.1,107.6 597.3,107.8 598.3,109.0 598.2,109.5 601.7,110.5 603.9,110.0 605.6,111.3 607.2,111.3 611.3,112.2 611.3,113.0 610.2,114.5 610.8,116.0 610.4,116.9 607.7,117.2 606.3,117.9 606.2,119.2 604.0,119.4 602.1,120.3 599.5,120.4 597.1,121.5 597.3,123.2 598.6,123.9 601.5,123.7 600.9,124.7 597.9,125.2 594.1,126.8 592.6,126.2 593.2,124.9 590.2,124.1 590.6,123.6 593.3,122.6 592.5,122.0 588.2,121.3 588.0,120.3 585.4,120.6 584.4,122.1 582.2,124.2 581.0,123.7 579.7,124.2 578.4,123.6 579.1,123.3 579.6,122.4 580.4,121.5 580.2,121.0 580.8,120.8 581.0,121.2 582.7,121.3 583.4,121.0 582.9,120.8 583.1,120.3 582.1,119.6 581.7,118.5 580.7,118.0 580.9,117.1 579.6,116.3 578.5,116.2 576.5,115.4 574.6,115.6 573.9,116.1 572.8,116.1 572.1,116.7 570.0,117.0 569.1,117.4 567.8,116.7 566.0,116.7 564.3,116.4 563.1,117.0 562.9,116.2 561.3,115.5 561.9,114.4 562.7,113.7 563.3,113.8 562.6,112.6 565.1,110.3 566.5,109.9 566.7,109.2 565.4,106.7 566.7,106.6 568.2,105.9 570.4,105.8 573.2,106.0 576.3,106.7 578.4,106.7 579.5,107.1 580.5,106.7 581.3,107.3 583.8,107.2 584.9,107.4 585.1,106.0 585.9,105.4 588.3,105.3Z",
  "cx": 585.1,
  "cy": 115.4,
  "n": "우크라이나",
  "ct": "유럽",
  "cap": "Kyiv",
  "fl": "🇺🇦",
  "lang": "Ukrainian",
  "cur": "Ukrainian hryvnia",
  "bb": [561.3, 104.6, 611.3, 126.8],
  "ci": [{
    "n": "Kiev",
    "x": 584.8,
    "y": 109.9,
    "c": 0
  }, {
    "n": "Kharkiv",
    "x": 600.7,
    "y": 111.1,
    "c": 0
  }, {
    "n": "Odesa",
    "x": 585.4,
    "y": 120.9,
    "c": 0
  }, {
    "n": "Zaporizhzhya",
    "x": 597.7,
    "y": 117.2,
    "c": 0
  }, {
    "n": "Kryvyy Rih",
    "x": 592.6,
    "y": 116.9,
    "c": 0
  }, {
    "n": "Mykolayiv",
    "x": 588.9,
    "y": 119.5,
    "c": 0
  }, {
    "n": "Makiyivka",
    "x": 605.5,
    "y": 116.6,
    "c": 0
  }, {
    "n": "Vinnytsya",
    "x": 579.1,
    "y": 113.2,
    "c": 0
  }, {
    "n": "Kherson",
    "x": 590.6,
    "y": 120.5,
    "c": 0
  }],
  "lat": 49,
  "lng": 32,
  "area": 603500,
  "areaR": 46,
  "pop": 37860221,
  "popR": 41,
  "gdp": 178757021387,
  "gdpR": 58,
  "pc": 4721,
  "lvl": "중상위 소득"
}, {
  "i": "IRQ",
  "en": "Iraq",
  "d": "M626.2,150.1 628.0,150.9 628.2,152.5 626.8,153.5 626.2,155.6 628.1,158.3 631.5,159.8 632.9,161.9 632.5,163.9 633.3,163.9 633.4,165.4 634.9,166.9 633.3,166.7 631.4,166.5 629.4,169.2 624.2,168.9 616.4,163.4 612.2,161.4 608.9,160.7 607.8,157.3 613.9,154.4 615.0,151.0 614.7,149.0 616.2,148.3 617.6,146.6 618.8,146.2 622.1,146.5 623.0,147.2 624.4,146.7 626.2,150.1Z",
  "cx": 623.9,
  "cy": 156.8,
  "n": "이라크",
  "ct": "아시아",
  "cap": "Baghdad",
  "fl": "🇮🇶",
  "lang": "Arabic, Aramaic",
  "cur": "Iraqi dinar",
  "bb": [607.8, 146.2, 634.9, 169.2],
  "ci": [{
    "n": "Baghdad",
    "x": 623.3,
    "y": 157.4,
    "c": 1
  }, {
    "n": "Al Basrah",
    "x": 632.8,
    "y": 165.3,
    "c": 0
  }, {
    "n": "Al Mawsil al Jadidah",
    "x": 619.7,
    "y": 149.1,
    "c": 0
  }, {
    "n": "Al Basrah al Qadimah",
    "x": 632.8,
    "y": 165.3,
    "c": 0
  }, {
    "n": "Mosul",
    "x": 619.8,
    "y": 149.1,
    "c": 0
  }, {
    "n": "Arbil",
    "x": 622.2,
    "y": 149.5,
    "c": 0
  }, {
    "n": "Abu Ghurayb",
    "x": 622.7,
    "y": 157.5,
    "c": 0
  }, {
    "n": "As Sulaymaniyah",
    "x": 626.2,
    "y": 151.2,
    "c": 0
  }, {
    "n": "Kirkuk",
    "x": 623.3,
    "y": 151.5,
    "c": 0
  }],
  "lat": 33,
  "lng": 44,
  "area": 438317,
  "areaR": 60,
  "pop": 46042015,
  "popR": 34,
  "gdp": 250842782139,
  "gdpR": 53,
  "pc": 5448,
  "lvl": "중상위 소득"
}, {
  "i": "IRN",
  "en": "Iran",
  "d": "M649.8,146.7 652.2,146.1 654.2,144.5 656.1,144.6 657.3,144.1 659.3,144.4 662.3,145.8 664.5,146.1 667.7,148.5 669.8,148.6 670.0,151.0 668.9,154.4 668.1,156.5 669.3,156.9 668.2,158.4 669.1,160.6 669.3,162.4 671.4,162.8 671.6,164.6 669.1,167.1 670.5,168.6 671.6,170.3 674.2,171.5 674.3,173.9 675.6,174.4 675.9,175.7 671.9,177.1 670.8,180.3 665.6,179.5 662.6,178.9 659.4,178.5 658.3,175.1 656.9,174.6 654.8,175.1 652.0,176.4 648.6,175.5 645.8,173.4 643.1,172.6 641.3,170.0 639.2,166.3 637.7,166.7 635.9,165.8 634.9,166.9 633.4,165.4 633.3,163.9 632.5,163.9 632.9,161.9 631.5,159.8 628.1,158.3 626.2,155.6 626.8,153.5 628.2,152.5 628.0,150.9 626.2,150.1 624.4,146.7 622.8,144.5 623.4,143.7 622.5,140.5 624.4,139.7 624.9,140.7 626.3,142.0 628.2,142.4 629.2,142.3 632.5,140.3 633.5,140.0 634.3,140.9 633.4,142.2 635.1,143.7 635.8,143.6 636.7,145.6 639.3,146.2 641.2,147.6 645.2,148.1 649.5,147.3 649.8,146.7Z",
  "cx": 648.4,
  "cy": 157.2,
  "n": "이란",
  "ct": "아시아",
  "cap": "Tehran",
  "fl": "🇮🇷",
  "lang": "Persian (Farsi)",
  "cur": "Iranian rial",
  "bb": [622.5, 139.7, 675.9, 180.3],
  "ci": [{
    "n": "Tehran",
    "x": 642.8,
    "y": 150.9,
    "c": 1
  }, {
    "n": "Mashhad",
    "x": 665.6,
    "y": 149.2,
    "c": 0
  }, {
    "n": "Esfahan",
    "x": 643.5,
    "y": 159.3,
    "c": 0
  }, {
    "n": "Karaj",
    "x": 641.7,
    "y": 150.5,
    "c": 0
  }, {
    "n": "Tabriz",
    "x": 628.6,
    "y": 144.2,
    "c": 0
  }, {
    "n": "Shiraz",
    "x": 645.9,
    "y": 167.7,
    "c": 0
  }, {
    "n": "Qom",
    "x": 641.3,
    "y": 153.8,
    "c": 0
  }, {
    "n": "Ahvaz",
    "x": 635.3,
    "y": 163.0,
    "c": 0
  }, {
    "n": "Kahriz",
    "x": 630.7,
    "y": 154.5,
    "c": 0
  }],
  "lat": 32,
  "lng": 53,
  "area": 1648195,
  "areaR": 19,
  "pop": 91567738,
  "popR": 17,
  "gdp": 401504514719,
  "gdpR": 37,
  "pc": 4385,
  "lvl": "중하위 소득"
}, {
  "i": "ISR",
  "en": "Israel",
  "d": "M599.2,159.1 598.7,160.0 597.7,159.6 597.2,161.5 597.8,161.8 597.1,162.2 597.0,162.9 598.3,162.5 598.4,163.6 597.0,168.1 595.2,163.3 596.0,162.4 595.8,162.2 596.5,160.9 597.1,158.8 597.5,158.1 597.6,158.1 598.5,158.1 598.8,157.6 599.5,157.6 599.5,158.7 599.2,159.1Z",
  "cx": 597.7,
  "cy": 160.7,
  "n": "이스라엘",
  "ct": "아시아",
  "cap": "Jerusalem",
  "fl": "🇮🇱",
  "lang": "Arabic, Hebrew",
  "cur": "Israeli new shekel",
  "bb": [595.2, 157.6, 599.5, 168.1],
  "ci": [{
    "n": "Jerusalem",
    "x": 597.9,
    "y": 161.8,
    "c": 1
  }, {
    "n": "Tel Aviv-Yafo",
    "x": 596.6,
    "y": 160.9,
    "c": 0
  }, {
    "n": "Haifa",
    "x": 597.2,
    "y": 158.8,
    "c": 0
  }, {
    "n": "Ashdod",
    "x": 596.3,
    "y": 161.6,
    "c": 0
  }, {
    "n": "Rishon LeZiyyon",
    "x": 596.7,
    "y": 161.2,
    "c": 0
  }, {
    "n": "Beersheba",
    "x": 596.6,
    "y": 163.2,
    "c": 0
  }, {
    "n": "Netanya",
    "x": 596.8,
    "y": 160.2,
    "c": 0
  }, {
    "n": "Holon",
    "x": 596.6,
    "y": 161.1,
    "c": 0
  }, {
    "n": "Bene Beraq",
    "x": 596.8,
    "y": 160.9,
    "c": 0
  }],
  "lat": 31.5,
  "lng": 35.1,
  "area": 20770,
  "areaR": 154,
  "pop": 9974400,
  "popR": 95,
  "gdp": 509901495702,
  "gdpR": 28,
  "pc": 51121,
  "lvl": "고소득"
}, {
  "i": "EGY",
  "en": "Egypt",
  "d": "M597.0,168.1 596.2,169.2 595.6,171.3 594.9,172.7 594.2,173.2 593.3,172.3 592.0,171.1 590.1,167.1 589.8,167.3 590.9,170.3 592.6,173.1 594.7,177.4 595.8,178.9 596.7,180.5 599.1,183.5 598.6,184.0 598.7,185.8 601.9,188.3 602.4,188.9 591.4,188.9 580.6,188.9 569.4,188.9 569.4,178.7 569.4,168.8 568.6,166.5 569.3,164.8 568.9,163.6 569.9,162.3 573.6,162.3 576.3,163.0 579.0,163.8 580.3,164.2 582.5,163.4 583.6,162.6 586.0,162.3 588.0,162.7 588.8,164.1 589.4,163.2 591.6,163.8 593.8,164.0 595.2,163.3 597.0,168.1Z",
  "cx": 587.5,
  "cy": 171.6,
  "n": "이집트",
  "ct": "아프리카",
  "cap": "Cairo",
  "fl": "🇪🇬",
  "lang": "Arabic",
  "cur": "Egyptian pound",
  "bb": [568.6, 162.3, 602.4, 188.9],
  "ci": [],
  "lat": 27,
  "lng": 30,
  "area": 1002450,
  "areaR": 31,
  "pop": 116538258,
  "popR": 13,
  "gdp": 395926075163,
  "gdpR": 39,
  "pc": 3397,
  "lvl": "중하위 소득"
}, {
  "i": "ITA",
  "en": "Italy",
  "d": "M543.1,143.8 542.1,146.0 542.5,146.8 541.9,148.3 539.8,147.2 538.4,146.9 534.5,145.5 534.9,144.1 538.2,144.3 541.0,144.0 543.1,143.8Z M525.6,135.5 527.2,137.5 526.9,141.2 525.6,141.0 524.5,141.9 523.4,141.2 523.3,137.8 522.7,136.2 524.2,136.4 525.6,135.5Z M534.4,120.1 538.4,120.8 538.1,122.2 538.7,123.4 536.5,123.0 534.2,123.9 534.4,125.3 534.1,126.1 535.0,127.5 537.6,128.9 539.0,131.2 542.1,133.5 544.2,133.4 544.9,134.1 544.1,134.6 546.6,135.6 548.7,136.5 551.0,137.9 551.3,138.4 550.8,139.4 549.3,138.1 546.9,137.7 545.7,139.5 547.7,140.5 547.4,141.9 546.2,142.1 544.7,144.5 543.6,144.7 543.6,143.8 544.1,142.4 544.7,141.8 543.7,140.2 542.8,138.8 541.7,138.4 540.8,137.2 539.1,136.7 537.9,135.6 535.8,135.4 533.6,134.2 531.1,132.3 529.2,130.7 528.3,128.0 527.0,127.7 524.7,126.8 523.4,127.1 521.8,128.4 520.7,128.6 521.0,127.4 519.5,127.1 518.7,124.9 519.7,124.1 518.9,123.0 519.0,122.2 520.2,122.8 521.5,122.7 523.1,121.8 523.6,122.2 524.9,122.1 525.5,121.0 527.6,121.3 528.8,120.9 529.0,119.7 530.7,120.1 531.0,119.6 533.8,119.1 534.4,120.1Z",
  "cx": 534.6,
  "cy": 133.2,
  "n": "이탈리아",
  "ct": "유럽",
  "cap": "Rome",
  "fl": "🇮🇹",
  "lang": "Italian",
  "cur": "Euro",
  "bb": [518.7, 119.1, 551.3, 148.3],
  "ci": [{
    "n": "Rome",
    "x": 534.7,
    "y": 133.6,
    "c": 1
  }, {
    "n": "Milano",
    "x": 525.5,
    "y": 123.7,
    "c": 0
  }, {
    "n": "Napoli",
    "x": 539.6,
    "y": 136.6,
    "c": 0
  }, {
    "n": "Torino",
    "x": 521.4,
    "y": 124.8,
    "c": 0
  }, {
    "n": "Palermo",
    "x": 537.1,
    "y": 144.1,
    "c": 0
  }, {
    "n": "Genova",
    "x": 524.8,
    "y": 126.6,
    "c": 0
  }, {
    "n": "Florence",
    "x": 531.2,
    "y": 128.4,
    "c": 0
  }, {
    "n": "Bologna",
    "x": 531.5,
    "y": 126.4,
    "c": 0
  }, {
    "n": "Bari",
    "x": 546.8,
    "y": 135.8,
    "c": 0
  }],
  "lat": 42.8,
  "lng": 12.8,
  "area": 301336,
  "areaR": 74,
  "pop": 58952704,
  "popR": 25,
  "gdp": 2254851212732,
  "gdpR": 8,
  "pc": 38248,
  "lvl": "고소득"
}, {
  "i": "IND",
  "en": "India",
  "d": "M716.2,151.4 719.2,154.7 718.9,156.9 720.0,158.3 719.9,159.8 717.9,159.4 718.7,162.5 721.4,164.2 725.3,166.2 723.5,167.4 722.5,170.0 725.2,171.1 727.8,172.4 731.4,174.0 735.2,174.3 736.8,175.8 739.0,176.0 742.3,176.7 744.6,176.6 744.9,175.5 744.6,173.8 744.8,172.6 746.5,172.0 746.7,174.2 746.8,174.7 749.3,175.8 751.0,175.3 753.4,175.5 755.6,175.4 755.8,173.7 754.7,172.9 757.0,172.5 759.5,170.4 762.7,168.7 765.0,169.4 767.0,168.2 768.3,169.9 767.4,171.1 770.4,171.5 770.6,172.5 769.6,173.1 769.8,174.8 767.8,174.3 764.2,176.2 764.3,177.8 762.8,180.1 762.6,181.5 761.4,183.7 759.2,183.1 759.1,186.0 758.5,186.9 758.8,188.1 757.4,188.8 756.0,184.4 755.2,184.4 754.7,186.2 753.2,184.7 754.1,183.1 755.3,183.0 756.6,180.6 755.0,180.1 752.4,180.2 749.8,179.8 749.5,177.9 748.2,177.7 746.0,176.5 745.0,178.4 747.0,179.9 745.3,180.9 744.7,181.9 746.4,182.7 745.9,184.4 746.9,186.4 747.3,188.7 746.9,189.7 745.0,189.7 741.6,190.3 741.8,192.4 740.3,194.0 736.3,195.9 733.2,199.2 731.1,200.9 728.3,202.7 728.3,204.0 726.9,204.7 724.4,205.7 723.1,205.8 722.3,208.0 722.9,211.6 723.0,213.9 721.8,216.5 721.8,221.2 720.4,221.4 719.1,223.5 720.0,224.4 717.4,225.2 716.5,227.1 715.4,227.9 712.8,225.3 711.5,221.4 710.4,218.6 709.4,217.3 708.0,214.6 707.3,211.1 706.8,209.4 704.3,205.6 703.1,200.2 702.3,196.6 702.3,193.3 701.8,190.7 697.7,192.3 695.8,192.0 692.1,188.6 693.5,187.6 692.6,186.5 689.4,184.2 691.2,182.3 697.3,182.3 696.8,180.0 695.2,178.5 694.9,176.4 693.1,175.2 696.2,172.3 699.4,172.5 702.3,169.6 704.0,166.7 706.7,163.9 706.7,162.0 709.1,160.4 706.8,159.0 705.8,157.1 704.9,154.7 706.2,153.5 710.4,154.2 713.5,153.7 716.2,151.4Z",
  "cx": 731.8,
  "cy": 183.3,
  "n": "인도",
  "ct": "아시아",
  "cap": "New Delhi",
  "fl": "🇮🇳",
  "lang": "English, Hindi",
  "cur": "Indian rupee",
  "bb": [689.4, 151.4, 770.6, 227.9],
  "ci": [{
    "n": "Mumbai",
    "x": 702.4,
    "y": 197.2,
    "c": 0
  }, {
    "n": "Delhi",
    "x": 714.5,
    "y": 170.4,
    "c": 0
  }, {
    "n": "Bengaluru",
    "x": 715.6,
    "y": 214.0,
    "c": 0
  }, {
    "n": "Calcutta",
    "x": 745.5,
    "y": 187.3,
    "c": 0
  }, {
    "n": "Chennai",
    "x": 723.0,
    "y": 213.6,
    "c": 0
  }, {
    "n": "Ahmadabad",
    "x": 701.7,
    "y": 186.0,
    "c": 0
  }, {
    "n": "Hyderabad",
    "x": 718.0,
    "y": 201.7,
    "c": 0
  }, {
    "n": "Pune",
    "x": 705.2,
    "y": 198.6,
    "c": 0
  }, {
    "n": "Surat",
    "x": 702.3,
    "y": 191.2,
    "c": 0
  }],
  "lat": 20,
  "lng": 77,
  "area": 3287590,
  "areaR": 8,
  "pop": 1450935791,
  "popR": 1,
  "gdp": 3549918918778,
  "gdpR": 5,
  "pc": 2447,
  "lvl": "중하위 소득"
}, {
  "i": "IDN",
  "en": "Indonesia",
  "d": "M835.3,278.4 834.2,278.5 830.5,276.5 833.1,276.0 834.5,276.8 835.5,277.7 835.3,278.4Z M845.7,278.2 843.3,278.8 842.9,278.4 843.2,277.5 844.4,275.8 847.1,274.7 847.4,275.2 847.5,276.1 845.7,278.2Z M827.5,272.5 828.5,273.2 830.2,273.0 830.9,274.2 827.7,274.7 825.8,275.1 824.3,275.1 825.2,273.5 826.8,273.5 827.5,272.5Z M841.4,272.5 841.0,274.0 836.8,274.8 833.1,274.5 833.1,273.5 835.3,272.9 837.1,273.7 838.9,273.5 841.4,272.5Z M801.7,268.8 807.1,269.1 807.7,268.0 812.8,269.3 813.8,271.1 818.0,271.6 821.4,273.3 818.2,274.3 815.2,273.2 812.7,273.3 809.8,273.1 807.2,272.6 804.0,271.5 801.9,271.2 800.8,271.6 795.7,270.4 795.2,269.2 792.7,269.0 794.6,266.4 798.0,266.5 800.2,267.6 801.4,267.8 801.7,268.8Z M874.2,267.3 872.8,269.2 872.5,267.1 873.0,266.1 873.6,265.1 874.2,265.9 874.2,267.3Z M853.5,259.6 852.4,260.5 850.5,260.0 850.0,258.8 852.8,258.7 853.5,259.6Z M862.4,258.6 863.4,260.7 861.1,259.6 858.8,259.3 857.2,259.5 855.3,259.4 855.9,257.9 859.4,257.8 862.4,258.6Z M872.6,253.2 873.4,257.7 876.3,259.4 878.6,256.4 881.8,254.7 884.2,254.7 886.6,255.7 888.7,256.7 891.7,257.2 891.7,266.3 891.8,275.3 889.3,273.0 886.5,272.5 885.8,273.3 882.3,273.4 883.4,271.1 885.2,270.3 884.5,267.3 883.1,265.0 877.7,262.6 875.5,262.4 871.3,259.8 870.5,261.2 869.4,261.4 868.8,260.4 868.8,259.2 866.6,257.8 869.6,256.8 871.6,256.9 871.4,256.2 867.3,256.1 866.2,254.5 863.7,254.0 862.6,252.6 866.3,251.9 867.7,251.0 872.2,252.2 872.6,253.2Z M847.9,246.1 845.7,248.8 843.6,249.3 840.9,248.8 836.3,248.9 833.8,249.3 833.4,251.4 835.9,253.9 837.4,252.7 842.6,251.7 842.4,253.0 841.2,252.6 840.0,254.2 837.5,255.3 840.2,258.9 839.6,259.8 842.1,263.0 842.1,264.8 840.6,265.7 839.5,264.7 840.9,262.4 838.2,263.5 837.5,262.7 837.8,261.6 835.8,260.0 836.0,257.3 834.2,258.1 834.4,261.4 834.5,265.4 832.8,265.8 831.6,264.9 832.4,262.4 831.9,259.7 830.8,259.7 829.9,257.8 831.1,256.0 831.5,253.8 832.8,249.6 833.4,248.4 835.8,246.4 838.0,247.2 841.5,247.6 844.7,247.5 847.4,245.4 847.9,246.1Z M857.5,246.9 857.3,249.3 855.9,249.0 855.5,250.7 856.6,252.2 855.8,252.5 854.7,250.7 853.9,247.2 854.4,245.0 855.4,244.0 855.6,245.5 857.2,245.7 857.5,246.9Z M827.4,244.9 830.5,247.5 827.3,247.8 826.3,249.7 826.4,252.2 823.8,254.1 823.7,256.9 822.6,261.1 822.2,260.2 819.1,261.4 818.0,259.7 816.0,259.6 814.6,258.7 811.3,259.7 810.3,258.3 808.5,258.5 806.2,258.2 805.8,254.4 804.4,253.7 803.0,251.3 802.6,248.8 803.0,246.3 804.6,244.4 805.1,246.3 807.0,247.9 808.8,247.3 810.5,247.5 812.2,246.1 813.5,245.8 816.1,246.6 818.4,246.0 819.8,242.2 820.9,241.2 821.8,238.0 825.0,238.0 827.5,238.5 825.9,241.0 827.9,243.6 827.4,244.9Z M793.9,266.3 790.9,266.3 788.5,264.0 785.0,261.7 783.8,260.0 781.7,257.8 780.3,255.7 778.2,251.8 775.7,249.5 774.9,247.1 773.9,244.9 771.4,243.2 769.9,240.8 767.8,239.3 764.9,236.2 764.7,234.8 766.5,234.9 770.8,235.4 773.2,238.1 775.4,240.0 776.9,241.2 779.6,244.2 782.4,244.2 784.7,246.1 786.3,248.4 788.4,249.7 787.3,252.0 788.9,252.9 789.9,253.0 790.4,255.0 791.4,256.5 793.4,256.7 794.7,258.5 794.0,262.0 793.9,266.3Z",
  "cx": 832.4,
  "cy": 258.9,
  "n": "인도네시아",
  "ct": "아시아",
  "cap": "Jakarta",
  "fl": "🇮🇩",
  "lang": "Indonesian",
  "cur": "Indonesian rupiah",
  "bb": [764.7, 234.8, 891.8, 278.8],
  "ci": [{
    "n": "Jakarta",
    "x": 796.7,
    "y": 267.2,
    "c": 1
  }, {
    "n": "Surabaya",
    "x": 813.2,
    "y": 270.1,
    "c": 0
  }, {
    "n": "Medan",
    "x": 774.1,
    "y": 240.0,
    "c": 0
  }, {
    "n": "Bandung",
    "x": 798.9,
    "y": 269.2,
    "c": 0
  }, {
    "n": "Bekasi",
    "x": 797.2,
    "y": 267.3,
    "c": 0
  }, {
    "n": "Palembang",
    "x": 791.0,
    "y": 258.1,
    "c": 0
  }, {
    "n": "Tangerang",
    "x": 796.2,
    "y": 267.2,
    "c": 0
  }, {
    "n": "Makassar",
    "x": 831.8,
    "y": 264.3,
    "c": 0
  }, {
    "n": "Semarang",
    "x": 806.7,
    "y": 269.4,
    "c": 0
  }],
  "lat": -5,
  "lng": 120,
  "area": 1904569,
  "areaR": 16,
  "pop": 283487931,
  "popR": 4,
  "gdp": 1371171152331,
  "gdpR": 16,
  "pc": 4837,
  "lvl": "중상위 소득"
}, {
  "i": "JPN",
  "en": "Japan",
  "d": "M874.0,155.1 874.4,156.1 872.8,157.8 871.6,156.9 870.2,157.5 869.5,159.2 867.7,158.4 867.7,157.0 869.2,155.4 870.8,155.7 872.0,154.5 874.0,155.1Z M891.6,146.8 890.6,149.0 891.0,150.4 889.6,152.4 886.0,153.7 881.2,153.9 877.2,157.0 875.3,156.0 875.2,153.9 870.4,154.5 867.1,155.8 863.9,155.9 866.7,157.9 864.8,162.6 863.0,163.8 861.7,162.7 862.4,160.2 860.6,159.4 859.5,157.5 862.1,156.7 863.6,154.9 866.3,153.5 868.4,151.6 873.9,150.7 876.9,151.3 879.8,146.4 881.6,147.7 885.7,144.9 887.3,143.8 889.0,140.4 888.6,137.3 889.7,135.6 892.7,135.1 894.2,138.9 894.1,141.2 891.6,144.0 891.6,146.8Z M899.8,127.3 901.7,127.9 903.7,126.7 904.3,129.8 900.2,130.6 897.7,133.3 893.4,131.4 891.9,134.5 888.8,134.5 888.4,131.8 889.8,129.6 892.7,129.5 893.5,125.6 894.4,123.5 897.6,126.4 899.8,127.3Z",
  "cx": 881.0,
  "cy": 146.7,
  "n": "일본",
  "ct": "아시아",
  "cap": "Tokyo",
  "fl": "🇯🇵",
  "lang": "Japanese",
  "cur": "Japanese yen",
  "bb": [859.5, 123.5, 904.3, 163.8],
  "ci": [{
    "n": "Tokyo",
    "x": 888.0,
    "y": 150.9,
    "c": 1
  }, {
    "n": "Yokohama",
    "x": 887.9,
    "y": 151.5,
    "c": 0
  }, {
    "n": "Osaka",
    "x": 876.4,
    "y": 153.6,
    "c": 0
  }, {
    "n": "Nagoya",
    "x": 880.3,
    "y": 152.3,
    "c": 0
  }, {
    "n": "Sapporo",
    "x": 892.6,
    "y": 130.4,
    "c": 0
  }, {
    "n": "Kobe",
    "x": 875.5,
    "y": 153.7,
    "c": 0
  }, {
    "n": "Kyoto",
    "x": 877.1,
    "y": 152.7,
    "c": 0
  }, {
    "n": "Fukuoka",
    "x": 862.2,
    "y": 156.7,
    "c": 0
  }, {
    "n": "Kawasaki",
    "x": 888.1,
    "y": 151.3,
    "c": 0
  }],
  "lat": 36,
  "lng": 138,
  "area": 377930,
  "areaR": 63,
  "pop": 123975371,
  "popR": 12,
  "gdp": 4212945159781,
  "gdpR": 4,
  "pc": 33982,
  "lvl": "고소득"
}, {
  "i": "JAM",
  "en": "Jamaica",
  "d": "M284.5,198.6 286.4,198.9 287.9,199.6 288.3,200.3 286.4,200.4 285.5,200.8 284.0,200.4 282.4,199.4 282.7,198.7 283.9,198.5 284.5,198.6Z",
  "cx": 285.1,
  "cy": 199.5,
  "n": "자메이카",
  "ct": "북아메리카",
  "cap": "Kingston",
  "fl": "🇯🇲",
  "lang": "English, Jamaican Patois",
  "cur": "Jamaican dollar",
  "bb": [282.4, 198.5, 288.3, 200.8],
  "ci": [{
    "n": "Kingston",
    "x": 286.7,
    "y": 200.0,
    "c": 1
  }, {
    "n": "New Kingston",
    "x": 286.7,
    "y": 200.0,
    "c": 0
  }, {
    "n": "Spanish Town",
    "x": 286.3,
    "y": 200.0,
    "c": 0
  }, {
    "n": "Portmore",
    "x": 286.5,
    "y": 200.1,
    "c": 0
  }, {
    "n": "Montego Bay",
    "x": 283.6,
    "y": 198.7,
    "c": 0
  }, {
    "n": "Mandeville",
    "x": 284.7,
    "y": 199.9,
    "c": 0
  }, {
    "n": "May Pen",
    "x": 285.5,
    "y": 200.1,
    "c": 0
  }, {
    "n": "Old Harbour",
    "x": 285.8,
    "y": 200.2,
    "c": 0
  }, {
    "n": "Linstead",
    "x": 286.0,
    "y": 199.6,
    "c": 0
  }],
  "lat": 18.2,
  "lng": -77.5,
  "area": 10991,
  "areaR": 166,
  "pop": 2839175,
  "popR": 140,
  "gdp": 19423355367,
  "gdpR": 128,
  "pc": 6841,
  "lvl": "중상위 소득"
}, {
  "i": "ZMB",
  "en": "Zambia",
  "d": "M591.0,275.6 592.3,276.9 593.0,279.2 592.5,280.0 592.0,282.2 592.5,284.5 591.6,285.5 590.8,288.1 592.3,288.8 583.8,291.1 584.1,293.1 582.0,293.5 580.4,294.6 580.1,295.5 579.1,295.7 576.7,298.0 575.1,299.8 574.2,299.9 573.3,299.6 570.2,299.3 569.7,299.1 569.7,298.8 568.6,298.2 566.8,298.0 564.5,298.7 562.7,296.9 560.8,294.7 560.9,285.8 566.7,285.9 566.5,284.9 566.9,283.9 566.4,282.6 566.7,281.2 566.4,280.4 567.4,280.4 567.5,281.3 568.8,281.2 570.6,281.5 571.5,282.7 573.8,283.1 575.5,282.2 576.1,283.7 578.2,284.1 579.2,285.3 580.4,286.8 582.5,286.8 582.3,283.8 581.5,284.3 579.6,283.3 578.8,282.8 579.2,280.0 579.6,276.7 579.0,275.5 579.8,273.7 580.6,273.4 584.3,272.9 585.4,273.2 586.5,273.9 587.7,274.3 589.4,274.8 591.0,275.6Z",
  "cx": 577.8,
  "cy": 285.7,
  "n": "잠비아",
  "ct": "아프리카",
  "cap": "Lusaka",
  "fl": "🇿🇲",
  "lang": "English",
  "cur": "Zambian kwacha",
  "bb": [560.8, 272.9, 593.0, 299.9],
  "ci": [{
    "n": "Lusaka",
    "x": 578.6,
    "y": 292.8,
    "c": 1
  }, {
    "n": "Kitwe",
    "x": 578.3,
    "y": 285.6,
    "c": 0
  }, {
    "n": "Ndola",
    "x": 579.5,
    "y": 286.0,
    "c": 0
  }, {
    "n": "Kabwe",
    "x": 579.0,
    "y": 290.1,
    "c": 0
  }, {
    "n": "Chingola",
    "x": 577.4,
    "y": 284.8,
    "c": 0
  }, {
    "n": "Mufulira",
    "x": 578.4,
    "y": 284.9,
    "c": 0
  }, {
    "n": "Luanshya",
    "x": 578.9,
    "y": 286.5,
    "c": 0
  }, {
    "n": "Livingstone",
    "x": 571.9,
    "y": 299.6,
    "c": 0
  }, {
    "n": "Kasama",
    "x": 586.7,
    "y": 278.3,
    "c": 0
  }],
  "lat": -15,
  "lng": 30,
  "area": 752612,
  "areaR": 40,
  "pop": 21314956,
  "popR": 62,
  "gdp": 28162630954,
  "gdpR": 111,
  "pc": 1321,
  "lvl": "중하위 소득"
}, {
  "i": "GNQ",
  "en": "Equatorial Guinea",
  "d": "M526.4,247.2 525.8,246.8 526.8,243.7 531.3,243.7 531.3,247.1 527.3,247.0 526.4,247.2Z",
  "cx": 527.9,
  "cy": 246.1,
  "n": "적도 기니",
  "ct": "아프리카",
  "cap": "Malabo",
  "fl": "🇬🇶",
  "lang": "French, Portuguese",
  "cur": "Central African CFA franc",
  "bb": [525.8, 243.7, 531.3, 247.2],
  "ci": [{
    "n": "Bata",
    "x": 527.1,
    "y": 244.9,
    "c": 0
  }, {
    "n": "Malabo",
    "x": 524.4,
    "y": 239.6,
    "c": 1
  }, {
    "n": "Ebebiyin",
    "x": 531.5,
    "y": 244.0,
    "c": 0
  }, {
    "n": "Aconibe",
    "x": 530.4,
    "y": 246.4,
    "c": 0
  }, {
    "n": "Anisoc",
    "x": 529.9,
    "y": 244.9,
    "c": 0
  }, {
    "n": "Luba",
    "x": 523.8,
    "y": 240.4,
    "c": 0
  }, {
    "n": "Evinayong",
    "x": 529.4,
    "y": 246.0,
    "c": 0
  }, {
    "n": "Mongomo",
    "x": 531.4,
    "y": 245.5,
    "c": 0
  }, {
    "n": "Mikomeseng",
    "x": 529.5,
    "y": 244.1,
    "c": 0
  }],
  "lat": 2,
  "lng": 10,
  "area": 28051,
  "areaR": 146,
  "pop": 1892516,
  "popR": 149,
  "gdp": 12116922539,
  "gdpR": 148,
  "pc": 6403,
  "lvl": "중상위 소득"
}, {
  "i": "PRK",
  "en": "North Korea",
  "d": "M862.9,132.2 863.3,132.7 862.2,132.6 861.0,133.5 860.2,134.4 860.3,136.4 858.9,137.1 858.4,137.5 857.3,138.4 855.5,138.8 854.3,139.6 854.2,140.8 853.8,141.1 855.0,141.5 856.5,142.7 856.1,143.4 854.9,143.6 853.0,143.7 851.9,145.0 850.7,144.9 850.5,145.1 849.1,144.6 848.8,145.1 848.0,145.4 847.9,144.8 847.2,144.6 846.4,144.1 847.2,142.9 847.8,142.6 847.6,142.1 848.3,140.6 848.1,140.1 846.5,139.8 845.2,139.1 847.4,137.3 850.5,135.8 852.4,133.8 853.7,134.7 856.1,134.8 855.7,133.3 860.0,132.2 861.1,130.6 862.9,132.2Z",
  "cx": 853.7,
  "cy": 139.2,
  "n": "조선",
  "ct": "아시아",
  "cap": "Pyongyang",
  "fl": "🇰🇵",
  "lang": "Korean",
  "cur": "North Korean won",
  "bb": [845.2, 130.6, 863.3, 145.4],
  "ci": [],
  "lat": 40,
  "lng": 127,
  "area": 120538,
  "areaR": 100,
  "pop": 26498823,
  "popR": 56,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "GEO",
  "en": "Georgia",
  "d": "M615.4,134.6 615.8,133.4 615.1,131.5 613.5,130.5 612.0,130.2 611.0,129.3 611.3,129.0 613.7,129.5 617.8,129.9 621.5,131.3 622.0,131.8 623.7,131.4 626.3,131.9 627.2,133.1 628.9,133.7 628.2,134.1 629.5,135.6 629.2,135.9 627.7,135.8 625.6,135.0 624.9,135.4 621.1,135.9 618.4,134.5 615.4,134.6Z",
  "cx": 620.6,
  "cy": 132.8,
  "n": "조지아",
  "ct": "아시아",
  "cap": "Tbilisi",
  "fl": "🇬🇪",
  "lang": "Georgian",
  "cur": "lari",
  "bb": [611.0, 129.0, 629.5, 135.9],
  "ci": [{
    "n": "Tbilisi",
    "x": 624.4,
    "y": 134.1,
    "c": 1
  }, {
    "n": "Sokhumi",
    "x": 613.9,
    "y": 130.5,
    "c": 0
  }, {
    "n": "Zugdidi",
    "x": 616.3,
    "y": 131.9,
    "c": 0
  }, {
    "n": "Gori",
    "x": 622.5,
    "y": 133.4,
    "c": 0
  }, {
    "n": "Samtredia",
    "x": 617.6,
    "y": 132.9,
    "c": 0
  }, {
    "n": "Khashuri",
    "x": 621.1,
    "y": 133.4,
    "c": 0
  }, {
    "n": "Senaki",
    "x": 616.9,
    "y": 132.6,
    "c": 0
  }, {
    "n": "Stantsiya Novyy Afon",
    "x": 613.4,
    "y": 130.3,
    "c": 0
  }, {
    "n": "Marneuli",
    "x": 624.5,
    "y": 134.8,
    "c": 0
  }],
  "lat": 42,
  "lng": 43.5,
  "area": 69700,
  "areaR": 123,
  "pop": 3699557,
  "popR": 130,
  "gdp": 30535530479,
  "gdpR": 110,
  "pc": 8254,
  "lvl": "중상위 소득"
}, {
  "i": "CHN",
  "en": "China",
  "d": "M806.5,198.1 804.1,199.5 801.8,198.6 801.7,196.2 803.1,194.9 806.1,194.2 807.7,194.2 808.4,195.3 807.1,196.5 806.5,198.1Z M854.6,111.8 859.4,112.7 862.7,114.6 863.9,117.2 868.1,117.3 870.5,116.2 875.1,115.3 873.6,117.8 872.5,118.9 871.6,121.9 869.7,124.6 866.3,124.1 864.0,125.1 864.7,127.5 864.3,130.8 862.9,130.8 862.9,132.2 861.1,130.6 860.0,132.2 855.7,133.3 856.1,134.8 853.7,134.7 852.4,133.8 850.5,135.8 847.4,137.3 845.2,139.1 841.3,139.9 839.3,141.2 836.3,142.0 837.7,140.7 837.2,139.6 839.4,137.7 837.9,136.3 835.5,137.2 832.3,139.2 830.6,141.0 827.9,141.1 826.5,142.4 827.9,144.3 830.2,144.7 830.3,146.0 832.5,146.8 835.6,144.8 838.1,145.9 839.9,146.0 840.3,147.4 836.4,148.2 835.1,149.7 832.4,151.1 831.0,153.0 834.0,154.6 835.1,157.3 836.7,159.8 838.6,162.0 838.6,164.0 836.8,164.8 837.5,166.3 839.1,167.1 838.7,169.4 838.0,171.6 836.5,171.8 834.4,174.9 832.2,178.5 829.6,181.8 825.8,184.4 821.9,186.7 818.8,187.0 817.1,188.3 816.1,187.4 814.6,188.7 810.7,190.1 807.7,190.6 806.8,193.5 805.2,193.7 804.5,191.6 805.2,190.6 801.5,189.7 800.1,190.1 797.3,189.4 796.0,188.3 796.5,186.7 793.9,186.2 792.6,185.1 790.2,186.6 787.5,186.9 785.3,186.9 783.8,187.6 782.4,188.0 782.8,191.2 781.3,191.1 781.1,190.5 781.0,189.3 778.9,190.1 777.7,189.6 775.7,188.6 776.5,186.3 774.7,185.7 774.1,183.2 771.1,183.6 771.5,180.3 774.1,178.0 774.2,175.7 774.1,173.6 772.9,172.9 772.0,171.3 770.4,171.5 767.4,171.1 768.3,169.9 767.0,168.2 765.0,169.4 762.7,168.7 759.5,170.4 757.0,172.5 754.7,172.9 753.5,172.1 752.0,172.0 750.0,171.4 748.5,172.1 746.7,174.2 746.5,172.0 744.8,172.6 741.5,172.3 738.4,171.7 736.1,170.4 734.0,169.9 733.1,168.6 731.5,168.2 728.7,166.3 726.5,165.5 725.3,166.2 721.4,164.2 718.7,162.5 717.9,159.4 719.9,159.8 720.0,158.3 718.9,156.9 719.2,154.7 716.2,151.4 711.6,150.3 710.8,148.1 708.8,146.9 708.3,146.1 707.9,144.5 708.0,143.4 706.3,142.8 705.4,143.0 704.7,140.5 705.4,139.8 705.1,139.2 707.7,137.9 709.6,137.3 712.6,137.7 713.6,135.9 717.2,135.6 718.2,134.5 722.6,133.0 722.9,132.4 722.7,130.8 724.6,130.1 722.1,125.2 727.6,124.1 729.1,123.5 731.1,118.5 736.6,119.4 738.1,118.2 738.2,115.4 740.6,115.1 742.7,113.3 743.8,113.1 744.5,115.0 746.8,116.5 750.8,117.5 752.7,119.8 751.6,123.0 752.6,124.2 755.9,124.7 759.7,125.1 763.0,126.8 764.7,127.1 766.0,129.7 767.6,131.3 770.7,131.3 776.4,131.9 780.1,131.5 782.9,131.9 787.0,133.6 790.3,133.6 791.6,134.5 794.8,133.0 799.3,132.0 803.5,131.9 806.7,130.9 808.7,129.4 810.6,128.5 810.2,127.6 809.3,126.5 810.8,124.7 812.3,125.0 815.2,125.5 817.9,124.1 822.2,123.0 824.2,121.1 826.2,120.4 830.2,120.0 832.4,120.3 832.7,119.3 830.2,117.4 828.0,116.5 825.8,117.5 823.1,117.1 821.5,117.4 820.8,116.3 822.8,113.5 824.1,111.4 827.4,112.5 831.4,110.7 831.3,109.5 833.8,106.5 835.4,105.7 835.3,104.1 833.8,103.5 836.1,102.1 839.6,101.6 843.3,101.5 847.4,102.3 849.9,103.4 851.6,106.2 852.6,107.4 853.6,109.1 854.6,111.8Z",
  "cx": 794.6,
  "cy": 148.4,
  "n": "중국",
  "ct": "아시아",
  "cap": "Beijing",
  "fl": "🇨🇳",
  "lang": "Chinese",
  "cur": "Chinese yuan",
  "bb": [704.7, 101.5, 875.1, 199.5],
  "ci": [{
    "n": "Shanghai",
    "x": 837.4,
    "y": 163.3,
    "c": 0
  }, {
    "n": "Beijing",
    "x": 823.3,
    "y": 139.1,
    "c": 1
  }, {
    "n": "Nanchong",
    "x": 794.6,
    "y": 164.4,
    "c": 0
  }, {
    "n": "Kaifeng",
    "x": 817.6,
    "y": 153.4,
    "c": 0
  }, {
    "n": "Wuhan",
    "x": 817.4,
    "y": 165.0,
    "c": 0
  }, {
    "n": "Chongqing",
    "x": 796.0,
    "y": 167.9,
    "c": 0
  }, {
    "n": "Chengdu",
    "x": 789.1,
    "y": 164.8,
    "c": 0
  }, {
    "n": "Tianjin",
    "x": 825.5,
    "y": 141.3,
    "c": 0
  }, {
    "n": "Puyang",
    "x": 833.0,
    "y": 168.2,
    "c": 0
  }],
  "lat": 35,
  "lng": 105,
  "area": 9706961,
  "areaR": 4,
  "pop": 1408975000,
  "popR": 2,
  "gdp": 17794781986104,
  "gdpR": 2,
  "pc": 12630,
  "lvl": "중상위 소득"
}, {
  "i": "CAF",
  "en": "Central African Republic",
  "d": "M542.4,229.4 544.7,229.2 545.3,228.5 545.7,228.5 546.4,229.1 549.9,228.1 551.1,227.0 552.5,226.0 552.3,225.0 553.0,224.8 555.7,225.0 558.3,223.7 560.3,220.6 561.8,219.5 563.5,219.0 563.8,220.2 565.4,222.0 565.4,223.1 565.0,224.3 565.2,225.1 566.1,225.9 568.2,227.1 569.8,228.3 569.8,229.2 571.7,230.6 572.8,231.8 573.5,233.5 575.6,234.6 576.0,235.5 575.1,235.8 573.3,235.7 571.3,235.4 570.2,235.6 569.8,236.3 568.9,236.4 567.8,235.8 564.7,237.2 563.4,236.9 563.1,237.1 562.2,238.8 560.2,238.3 558.1,238.0 556.4,237.0 554.1,236.0 552.6,236.9 551.5,238.3 551.3,240.3 549.5,240.1 547.6,239.6 545.9,241.1 544.5,243.7 544.2,242.9 544.1,241.6 542.8,240.7 541.8,239.3 541.5,238.3 540.2,236.9 540.4,236.0 540.2,234.9 540.4,232.7 541.0,232.2 542.4,229.4Z",
  "cx": 557.0,
  "cy": 232.4,
  "n": "중앙아프리카 공화국",
  "ct": "아프리카",
  "cap": "Bangui",
  "fl": "🇨🇫",
  "lang": "French, Sango",
  "cur": "Central African CFA franc",
  "bb": [540.2, 219.0, 576.0, 243.7],
  "ci": [{
    "n": "Bangui",
    "x": 551.6,
    "y": 237.9,
    "c": 1
  }, {
    "n": "Bimbo",
    "x": 551.5,
    "y": 238.1,
    "c": 0
  }, {
    "n": "Mbaiki",
    "x": 550.0,
    "y": 239.2,
    "c": 0
  }, {
    "n": "Berberati",
    "x": 543.8,
    "y": 238.1,
    "c": 0
  }, {
    "n": "Kaga Bandoro",
    "x": 553.3,
    "y": 230.6,
    "c": 0
  }, {
    "n": "Bozoum",
    "x": 545.5,
    "y": 232.5,
    "c": 0
  }, {
    "n": "Carnot",
    "x": 544.1,
    "y": 236.3,
    "c": 0
  }, {
    "n": "Sibut",
    "x": 553.0,
    "y": 234.1,
    "c": 0
  }, {
    "n": "Bambari",
    "x": 557.4,
    "y": 234.0,
    "c": 0
  }],
  "lat": 7,
  "lng": 21,
  "area": 622984,
  "areaR": 44,
  "pop": 5330690,
  "popR": 121,
  "gdp": 2555492085,
  "gdpR": 182,
  "pc": 479,
  "lvl": "저소득"
}, {
  "i": "DJI",
  "en": "Djibouti",
  "d": "M619.7,214.7 620.3,215.6 620.2,216.7 618.7,217.4 619.8,218.2 618.8,219.6 618.2,219.2 617.5,219.3 616.0,219.3 615.9,218.5 615.7,217.7 616.7,216.4 617.6,215.2 618.8,215.4 619.7,214.7Z",
  "cx": 618.2,
  "cy": 217.2,
  "n": "지부티",
  "ct": "아프리카",
  "cap": "Djibouti",
  "fl": "🇩🇯",
  "lang": "Arabic, French",
  "cur": "Djiboutian franc",
  "bb": [615.7, 214.7, 620.3, 219.6],
  "ci": [{
    "n": "Djibouti",
    "x": 619.9,
    "y": 217.8,
    "c": 1
  }, {
    "n": "`Ali Sabieh",
    "x": 618.6,
    "y": 219.0,
    "c": 0
  }, {
    "n": "Tadjoura",
    "x": 619.1,
    "y": 217.3,
    "c": 0
  }, {
    "n": "Obock",
    "x": 620.3,
    "y": 216.8,
    "c": 0
  }, {
    "n": "Dikhil",
    "x": 617.7,
    "y": 219.1,
    "c": 0
  }, {
    "n": "`Arta",
    "x": 619.0,
    "y": 218.0,
    "c": 0
  }, {
    "n": "Holhol",
    "x": 619.2,
    "y": 218.6,
    "c": 0
  }, {
    "n": "Dorra",
    "x": 618.0,
    "y": 216.3,
    "c": 0
  }, {
    "n": "Galafi",
    "x": 616.2,
    "y": 217.5,
    "c": 0
  }],
  "lat": 11.5,
  "lng": 43,
  "area": 23200,
  "areaR": 151,
  "pop": 1168722,
  "popR": 159,
  "gdp": 4098530514,
  "gdpR": 170,
  "pc": 3507,
  "lvl": "중하위 소득"
}, {
  "i": "ZWE",
  "en": "Zimbabwe",
  "d": "M586.6,311.8 585.2,311.5 584.2,311.9 582.9,311.4 581.8,311.4 580.0,310.1 577.8,309.7 577.0,307.9 577.0,306.9 575.8,306.6 572.7,303.6 571.8,302.0 571.2,301.5 570.2,299.3 573.3,299.6 574.2,299.9 575.1,299.8 576.7,298.0 579.1,295.7 580.1,295.5 580.4,294.6 582.0,293.5 584.1,293.1 584.3,294.1 586.6,294.1 587.9,294.6 588.5,295.3 589.8,295.5 591.2,296.4 591.2,299.9 590.7,301.9 590.6,303.9 591.0,304.8 590.7,306.4 590.3,306.7 589.6,308.7 586.6,311.8Z",
  "cx": 582.4,
  "cy": 302.4,
  "n": "짐바브웨",
  "ct": "아프리카",
  "cap": "Harare",
  "fl": "🇿🇼",
  "lang": "Chibarwe, English",
  "cur": "Botswana pula",
  "bb": [570.2, 293.1, 591.2, 311.9],
  "ci": [{
    "n": "Harare",
    "x": 586.2,
    "y": 299.5,
    "c": 1
  }, {
    "n": "Bulawayo",
    "x": 579.4,
    "y": 306.0,
    "c": 0
  }, {
    "n": "Chitungwiza",
    "x": 586.2,
    "y": 300.0,
    "c": 0
  }, {
    "n": "Mutare",
    "x": 590.7,
    "y": 302.7,
    "c": 0
  }, {
    "n": "Gweru",
    "x": 582.8,
    "y": 304.0,
    "c": 0
  }, {
    "n": "Epworth",
    "x": 586.5,
    "y": 299.7,
    "c": 0
  }, {
    "n": "Zvishavane District",
    "x": 583.6,
    "y": 306.2,
    "c": 0
  }, {
    "n": "Kwekwe",
    "x": 582.8,
    "y": 302.5,
    "c": 0
  }, {
    "n": "Kadoma",
    "x": 583.1,
    "y": 301.0,
    "c": 0
  }],
  "lat": -20,
  "lng": 30,
  "area": 390757,
  "areaR": 62,
  "pop": 16634373,
  "popR": 73,
  "gdp": 26538273499,
  "gdpR": 114,
  "pc": 1595,
  "lvl": "중하위 소득"
}, {
  "i": "TCD",
  "en": "Chad",
  "d": "M540.3,214.3 540.5,213.0 538.8,212.9 538.8,211.1 537.6,210.1 538.8,206.4 542.4,203.8 542.5,200.2 543.6,194.6 544.2,193.4 543.0,192.4 543.0,191.5 541.9,190.8 541.3,186.5 544.1,185.0 555.1,190.3 566.2,195.6 566.4,206.6 564.0,206.4 562.7,208.5 562.0,210.2 562.5,210.9 561.6,211.7 561.9,212.9 561.2,214.0 560.9,215.0 561.9,214.9 562.5,215.9 562.5,217.6 563.5,218.4 563.5,219.0 561.8,219.5 560.3,220.6 558.3,223.7 555.7,225.0 553.0,224.8 552.3,225.0 552.5,226.0 551.1,227.0 549.9,228.1 546.4,229.1 545.7,228.5 545.3,228.5 544.7,229.2 542.4,229.4 542.9,228.6 542.0,226.7 541.6,225.6 540.4,225.1 538.8,223.5 539.4,222.2 540.6,222.4 541.4,222.2 543.0,222.3 541.5,219.7 541.6,217.9 541.4,216.1 540.3,214.3Z",
  "cx": 549.5,
  "cy": 214.2,
  "n": "차드",
  "ct": "아프리카",
  "cap": "N'Djamena",
  "fl": "🇹🇩",
  "lang": "Arabic, French",
  "cur": "Central African CFA franc",
  "bb": [537.6, 185.0, 566.4, 229.4],
  "ci": [{
    "n": "Moundou",
    "x": 544.7,
    "y": 226.2,
    "c": 0
  }, {
    "n": "Sarh",
    "x": 551.1,
    "y": 224.6,
    "c": 0
  }, {
    "n": "Abeche",
    "x": 557.9,
    "y": 211.6,
    "c": 0
  }, {
    "n": "Kelo",
    "x": 543.9,
    "y": 224.1,
    "c": 0
  }, {
    "n": "Koumra",
    "x": 548.7,
    "y": 225.2,
    "c": 0
  }, {
    "n": "Pala",
    "x": 541.4,
    "y": 224.0,
    "c": 0
  }, {
    "n": "Am Timan",
    "x": 556.3,
    "y": 219.4,
    "c": 0
  }, {
    "n": "Bongor",
    "x": 542.7,
    "y": 221.4,
    "c": 0
  }, {
    "n": "Mongo",
    "x": 551.9,
    "y": 216.2,
    "c": 0
  }],
  "lat": 15,
  "lng": 19,
  "area": 1284000,
  "areaR": 22,
  "pop": 20299123,
  "popR": 64,
  "gdp": 13149325359,
  "gdpR": 146,
  "pc": 648,
  "lvl": "저소득"
}, {
  "i": "CZE",
  "en": "Czech Republic",
  "d": "M547.1,115.0 545.8,114.5 544.5,114.6 542.4,113.8 541.4,114.0 539.8,115.1 537.8,114.2 536.2,113.0 534.8,112.4 534.5,111.2 534.0,110.4 536.0,109.8 537.1,109.1 539.0,108.5 539.7,108.0 540.5,108.3 541.7,108.0 543.0,108.9 545.1,109.2 544.9,109.9 546.4,110.5 546.9,109.8 548.8,110.1 549.0,111.0 551.1,111.1 552.4,112.5 551.5,112.5 551.1,113.0 550.5,113.1 550.3,113.8 549.8,113.9 549.7,114.2 548.7,114.4 547.5,114.4 547.1,115.0Z",
  "cx": 544.2,
  "cy": 111.9,
  "n": "체코",
  "ct": "유럽",
  "cap": "Prague",
  "fl": "🇨🇿",
  "lang": "Czech, Slovak",
  "cur": "Czech koruna",
  "bb": [534.0, 108.0, 552.4, 115.1],
  "ci": [{
    "n": "Praha",
    "x": 540.1,
    "y": 110.9,
    "c": 0
  }, {
    "n": "Brno",
    "x": 546.1,
    "y": 113.3,
    "c": 0
  }, {
    "n": "Ostrava",
    "x": 550.8,
    "y": 111.6,
    "c": 0
  }, {
    "n": "Plzen",
    "x": 537.2,
    "y": 111.8,
    "c": 0
  }, {
    "n": "Olomouc",
    "x": 547.9,
    "y": 112.2,
    "c": 0
  }, {
    "n": "Liberec",
    "x": 541.8,
    "y": 109.0,
    "c": 0
  }, {
    "n": "Ceske Budejovice",
    "x": 540.2,
    "y": 114.0,
    "c": 0
  }, {
    "n": "Hradec Kralove",
    "x": 544.0,
    "y": 110.5,
    "c": 0
  }, {
    "n": "Usti nad Labem",
    "x": 539.0,
    "y": 109.3,
    "c": 0
  }],
  "lat": 49.8,
  "lng": 15.5,
  "area": 78865,
  "areaR": 119,
  "pop": 10905028,
  "popR": 87,
  "gdp": 330858339872,
  "gdpR": 47,
  "pc": 30340,
  "lvl": "고소득"
}, {
  "i": "CHL",
  "en": "Chile",
  "d": "M309.3,396.2 309.4,402.4 312.3,402.4 314.0,402.5 313.1,403.6 310.7,404.5 309.3,404.4 307.7,404.2 305.7,403.3 302.8,402.9 299.3,401.4 296.4,399.9 292.6,396.8 294.9,397.4 298.8,399.2 302.5,400.2 303.9,398.9 304.8,397.0 307.4,395.9 309.3,396.2Z M310.5,309.7 311.6,313.5 313.6,313.2 313.9,313.9 313.0,316.7 310.0,318.1 310.0,322.7 309.5,323.6 310.3,324.7 308.3,326.4 306.5,329.1 305.5,331.6 305.8,334.3 304.1,337.1 305.3,341.9 306.1,342.4 306.1,345.0 304.5,347.7 304.5,350.0 302.4,351.8 302.4,354.4 303.3,357.1 301.6,358.1 300.9,360.6 300.2,363.4 300.7,366.8 299.6,367.4 300.2,370.6 301.5,371.6 300.6,372.8 301.9,373.4 302.2,374.4 300.9,374.9 301.2,376.6 300.2,380.2 298.8,382.6 299.1,384.0 298.2,385.8 296.1,387.0 296.3,389.9 297.3,390.9 299.1,390.8 299.1,392.8 300.2,394.5 306.9,394.8 309.5,395.3 307.1,395.3 305.7,395.9 303.2,396.9 302.8,399.5 301.6,399.6 298.5,398.7 295.3,396.8 291.8,395.2 290.9,393.4 291.7,391.8 290.3,389.9 290.0,385.2 291.2,382.5 294.1,380.4 289.9,379.6 292.5,377.1 293.5,372.5 296.6,373.5 298.0,367.7 296.1,367.0 295.3,370.5 293.5,370.1 294.4,366.1 295.3,361.0 296.6,359.1 295.8,356.3 295.6,353.2 296.8,353.1 298.5,348.6 300.4,344.2 301.6,340.1 300.9,335.9 301.7,333.6 301.4,330.2 303.0,326.8 303.5,321.4 304.4,315.6 305.3,309.4 305.1,304.9 304.5,301.0 305.9,300.3 306.7,298.8 308.1,300.7 308.4,302.7 309.9,303.9 309.0,306.6 310.5,309.7Z",
  "cx": 302.3,
  "cy": 363.5,
  "n": "칠레",
  "ct": "남아메리카",
  "cap": "Santiago",
  "fl": "🇨🇱",
  "lang": "Spanish",
  "cur": "Chilean peso",
  "bb": [289.9, 298.8, 314.0, 404.5],
  "ci": [{
    "n": "Santiago",
    "x": 303.7,
    "y": 342.9,
    "c": 1
  }, {
    "n": "vina causino",
    "x": 303.9,
    "y": 343.4,
    "c": 0
  }, {
    "n": "Antofagasta",
    "x": 304.4,
    "y": 315.7,
    "c": 0
  }, {
    "n": "Vina del Mar",
    "x": 301.2,
    "y": 341.7,
    "c": 0
  }, {
    "n": "Valparaiso",
    "x": 301.0,
    "y": 341.8,
    "c": 0
  }, {
    "n": "Talcahuano",
    "x": 296.9,
    "y": 352.0,
    "c": 0
  }, {
    "n": "San Bernardo",
    "x": 303.6,
    "y": 343.3,
    "c": 0
  }, {
    "n": "Temuco",
    "x": 298.3,
    "y": 357.6,
    "c": 0
  }, {
    "n": "Iquique",
    "x": 305.1,
    "y": 306.2,
    "c": 0
  }],
  "lat": -30,
  "lng": -71,
  "area": 756102,
  "areaR": 39,
  "pop": 19764771,
  "popR": 65,
  "gdp": 335533331669,
  "gdpR": 46,
  "pc": 16976,
  "lvl": "고소득"
}, {
  "i": "CMR",
  "en": "Cameroon",
  "d": "M536.3,243.7 536.0,243.6 534.3,243.9 532.6,243.5 531.3,243.7 526.8,243.7 527.2,241.5 526.1,239.6 524.9,239.2 524.3,237.9 523.6,237.5 523.6,236.7 524.3,234.8 525.6,232.1 526.5,232.1 528.1,230.4 529.2,230.4 530.7,231.5 532.6,230.6 532.9,229.5 533.5,228.3 533.9,226.9 535.4,225.8 536.0,223.8 536.6,223.2 537.0,221.8 537.7,220.0 540.0,217.9 540.2,216.9 540.5,216.4 539.4,215.3 539.5,214.4 540.3,214.3 541.4,216.1 541.6,217.9 541.5,219.7 543.0,222.3 541.4,222.2 540.6,222.4 539.4,222.2 538.8,223.5 540.4,225.1 541.6,225.6 542.0,226.7 542.9,228.6 542.4,229.4 541.0,232.2 540.4,232.7 540.2,234.9 540.4,236.0 540.2,236.9 541.5,238.3 541.8,239.3 542.8,240.7 544.1,241.6 544.2,242.9 544.5,243.7 544.3,245.2 542.1,244.5 539.8,243.8 536.3,243.7Z",
  "cx": 536.5,
  "cy": 231.3,
  "n": "카메룬",
  "ct": "아프리카",
  "cap": "Yaoundé",
  "fl": "🇨🇲",
  "lang": "English, French",
  "cur": "Central African CFA franc",
  "bb": [523.6, 214.3, 544.5, 245.2],
  "ci": [{
    "n": "Douala",
    "x": 526.9,
    "y": 238.7,
    "c": 0
  }, {
    "n": "Yaounde",
    "x": 532.0,
    "y": 239.3,
    "c": 0
  }, {
    "n": "Garoua",
    "x": 537.2,
    "y": 224.2,
    "c": 0
  }, {
    "n": "Kousseri",
    "x": 541.8,
    "y": 216.4,
    "c": 0
  }, {
    "n": "Bamenda",
    "x": 528.2,
    "y": 233.5,
    "c": 0
  }, {
    "n": "Maroua",
    "x": 539.8,
    "y": 220.6,
    "c": 0
  }, {
    "n": "Bafoussam",
    "x": 528.9,
    "y": 234.8,
    "c": 0
  }, {
    "n": "Mokolo",
    "x": 538.3,
    "y": 220.2,
    "c": 0
  }, {
    "n": "Ngaoundere",
    "x": 537.7,
    "y": 229.7,
    "c": 0
  }],
  "lat": 6,
  "lng": 12,
  "area": 475442,
  "areaR": 55,
  "pop": 29123744,
  "popR": 52,
  "gdp": 47945510090,
  "gdpR": 95,
  "pc": 1646,
  "lvl": "중하위 소득"
}, {
  "i": "KAZ",
  "en": "Kazakhstan",
  "d": "M697.1,132.6 695.5,133.1 691.9,135.0 690.6,137.0 689.6,137.0 688.8,135.7 685.3,135.6 684.8,133.4 683.4,133.3 683.6,130.6 680.3,128.5 675.5,128.7 672.3,129.2 669.6,126.7 667.3,125.6 663.0,123.6 662.5,123.4 655.4,125.0 655.5,135.3 654.0,135.4 652.1,133.2 650.2,132.4 647.1,133.0 645.8,133.9 645.7,133.3 646.4,132.1 645.8,131.1 642.6,130.2 641.4,127.7 639.8,127.0 639.7,126.1 642.4,126.3 642.5,124.3 644.9,123.9 647.3,124.3 647.8,121.6 647.3,119.9 644.6,120.0 642.2,119.3 639.0,120.5 636.4,121.1 635.0,120.7 635.3,119.2 633.5,117.4 631.4,117.5 629.1,115.6 630.7,113.5 629.9,112.9 632.1,109.8 634.9,111.5 635.3,109.4 641.0,106.4 645.4,106.3 651.5,108.3 654.8,109.4 657.7,108.2 662.1,108.2 665.7,109.6 666.5,108.8 670.4,108.9 671.1,107.6 666.6,105.7 669.2,104.3 668.7,103.6 671.4,102.8 669.4,100.9 670.7,100.0 681.1,99.0 682.4,98.3 689.4,97.3 691.9,96.2 696.8,96.8 697.7,99.6 700.6,99.0 704.2,99.9 704.0,101.4 706.6,101.3 713.6,98.6 712.6,99.5 716.1,101.7 722.3,108.7 723.8,107.3 727.6,108.9 731.6,108.1 733.2,108.6 734.5,110.2 736.4,110.8 737.6,112.0 741.2,111.6 742.7,113.3 740.6,115.1 738.2,115.4 738.1,118.2 736.6,119.4 731.1,118.5 729.1,123.5 727.6,124.1 722.1,125.2 724.6,130.1 722.7,130.8 722.9,132.4 721.2,132.0 719.8,131.0 715.7,130.7 711.1,130.6 710.1,130.9 706.1,129.7 704.6,130.3 704.1,131.9 699.6,131.0 697.7,131.4 697.1,132.6Z",
  "cx": 680.8,
  "cy": 118.9,
  "n": "카자흐스탄",
  "ct": "아시아",
  "cap": "Astana",
  "fl": "🇰🇿",
  "lang": "Kazakh, Russian",
  "cur": "Kazakhstani tenge",
  "bb": [629.1, 96.2, 742.7, 137.0],
  "ci": [{
    "n": "Almaty",
    "x": 713.7,
    "y": 129.9,
    "c": 0
  }, {
    "n": "Qaraghandy",
    "x": 703.1,
    "y": 111.7,
    "c": 0
  }, {
    "n": "Karagandy",
    "x": 652.4,
    "y": 110.9,
    "c": 0
  }, {
    "n": "Shymkent",
    "x": 693.3,
    "y": 132.5,
    "c": 0
  }, {
    "n": "Taraz",
    "x": 698.2,
    "y": 130.8,
    "c": 0
  }, {
    "n": "Astana",
    "x": 698.4,
    "y": 107.8,
    "c": 1
  }, {
    "n": "Pavlodar",
    "x": 713.7,
    "y": 104.7,
    "c": 0
  }, {
    "n": "Kyzylorda",
    "x": 682.0,
    "y": 125.4,
    "c": 0
  }, {
    "n": "Semipalatinsk",
    "x": 722.9,
    "y": 110.0,
    "c": 0
  }],
  "lat": 48,
  "lng": 68,
  "area": 2724900,
  "areaR": 10,
  "pop": 20592571,
  "popR": 63,
  "gdp": 261421121086,
  "gdpR": 51,
  "pc": 12695,
  "lvl": "중상위 소득"
}, {
  "i": "QAT",
  "en": "Qatar",
  "d": "M641.1,181.2 641.0,179.2 641.7,177.8 642.5,177.5 643.3,178.3 643.4,180.0 642.7,181.6 642.0,181.8 641.1,181.2Z",
  "cx": 642.1,
  "cy": 179.8,
  "n": "카타르",
  "ct": "아시아",
  "cap": "Doha",
  "fl": "🇶🇦",
  "lang": "Arabic",
  "cur": "Qatari riyal",
  "bb": [641.0, 177.5, 643.4, 181.8],
  "ci": [{
    "n": "Doha",
    "x": 643.1,
    "y": 179.8,
    "c": 1
  }, {
    "n": "Ar Rayyan",
    "x": 642.8,
    "y": 179.7,
    "c": 0
  }, {
    "n": "Umm Salal Muhammad",
    "x": 642.8,
    "y": 179.4,
    "c": 0
  }, {
    "n": "Al Wakrah",
    "x": 643.4,
    "y": 180.1,
    "c": 0
  }, {
    "n": "Al Khawr",
    "x": 643.1,
    "y": 178.7,
    "c": 0
  }, {
    "n": "Dukhan",
    "x": 641.1,
    "y": 179.4,
    "c": 0
  }, {
    "n": "Al Wukayr",
    "x": 643.2,
    "y": 180.1,
    "c": 0
  }, {
    "n": "Umm Bab",
    "x": 641.1,
    "y": 180.0,
    "c": 0
  }, {
    "n": "Al Ghuwayriyah",
    "x": 642.3,
    "y": 178.3,
    "c": 0
  }],
  "lat": 25.5,
  "lng": 51.2,
  "area": 11586,
  "areaR": 165,
  "pop": 2857822,
  "popR": 139,
  "gdp": 235770403735,
  "gdpR": 56,
  "pc": 82500,
  "lvl": "고소득"
}, {
  "i": "KHM",
  "en": "Cambodia",
  "d": "M787.5,220.5 786.4,219.0 785.0,216.1 784.3,212.8 786.1,210.5 789.7,210.0 792.3,210.4 794.6,211.4 795.8,209.5 798.3,210.5 798.9,212.4 798.6,215.7 793.9,217.9 795.1,219.6 792.2,219.8 789.8,220.9 787.5,220.5Z",
  "cx": 791.5,
  "cy": 215.1,
  "n": "캄보디아",
  "ct": "아시아",
  "cap": "Phnom Penh",
  "fl": "🇰🇭",
  "lang": "Khmer",
  "cur": "Cambodian riel",
  "bb": [784.3, 209.5, 798.9, 220.9],
  "ci": [{
    "n": "Phnom Penh",
    "x": 791.4,
    "y": 217.9,
    "c": 1
  }, {
    "n": "Kampong Saom",
    "x": 787.5,
    "y": 220.5,
    "c": 0
  }, {
    "n": "Batdambang",
    "x": 786.7,
    "y": 213.6,
    "c": 0
  }, {
    "n": "Siemreab",
    "x": 788.5,
    "y": 212.9,
    "c": 0
  }, {
    "n": "Kampong Chhnang",
    "x": 790.7,
    "y": 216.0,
    "c": 0
  }, {
    "n": "Kampong Cham",
    "x": 792.9,
    "y": 216.7,
    "c": 0
  }, {
    "n": "Pouthisat",
    "x": 788.7,
    "y": 215.2,
    "c": 0
  }, {
    "n": "Ta Khmau",
    "x": 791.5,
    "y": 218.1,
    "c": 0
  }, {
    "n": "Phumi Veal Sre",
    "x": 791.1,
    "y": 219.5,
    "c": 0
  }],
  "lat": 13,
  "lng": 105,
  "area": 181035,
  "areaR": 91,
  "pop": 17638801,
  "popR": 72,
  "gdp": 31772759999,
  "gdpR": 106,
  "pc": 1801,
  "lvl": "중하위 소득"
}, {
  "i": "CAN",
  "en": "Canada",
  "d": "M323.2,120.7 325.2,121.1 327.7,121.0 326.4,122.1 325.3,122.3 321.8,121.1 321.1,120.2 322.2,119.3 323.2,120.7Z M328.3,113.6 327.0,113.6 323.4,112.8 320.8,111.5 321.7,111.2 325.4,111.9 328.2,113.1 328.3,113.6Z M156.9,115.2 155.5,115.6 151.0,114.4 150.1,113.4 147.6,112.4 147.1,111.6 144.3,111.1 143.2,109.6 143.4,109.0 146.4,109.6 148.1,110.0 150.7,110.3 151.6,111.2 153.0,112.6 155.8,113.7 156.9,115.2Z M344.1,109.2 342.2,111.6 344.0,110.7 345.9,111.3 344.9,112.3 347.4,113.0 348.7,112.3 351.5,113.2 350.6,115.2 352.5,114.8 352.9,116.2 353.8,118.0 352.6,120.4 351.3,120.5 349.5,120.0 350.1,117.7 349.3,117.4 346.1,119.8 344.5,119.7 346.4,118.4 343.7,117.7 340.8,117.9 335.4,117.8 334.9,116.9 336.7,116.0 335.5,115.2 337.8,113.5 340.7,109.1 342.4,107.5 344.8,106.6 346.1,106.7 345.6,107.5 344.1,109.2Z M131.4,99.9 134.0,99.7 133.2,102.8 135.6,105.1 134.5,105.0 132.8,103.8 131.8,102.5 130.4,101.6 129.9,100.4 130.1,99.5 131.4,99.9Z M279.8,77.3 278.7,78.8 277.5,78.6 276.8,77.7 276.9,77.5 278.0,76.7 279.1,76.8 279.8,77.3Z M272.5,75.8 269.3,77.3 267.3,77.3 266.7,76.5 268.7,75.2 272.6,75.3 272.5,75.8Z M263.4,67.6 264.0,68.8 265.4,68.4 267.0,69.1 270.0,70.1 273.2,71.0 273.5,72.3 275.5,72.1 277.5,73.0 275.0,73.9 270.7,73.2 269.1,71.9 266.4,73.4 262.4,74.9 261.5,73.2 257.7,73.5 260.1,72.1 260.5,69.9 261.4,67.4 263.4,67.6Z M289.3,63.5 286.1,63.6 285.5,62.3 286.6,60.7 289.2,60.3 291.3,61.1 291.4,62.3 291.1,62.7 289.3,63.5Z M234.3,58.0 232.6,59.0 228.8,58.2 226.6,58.5 222.8,57.2 225.2,56.4 227.2,55.2 230.1,55.9 231.8,56.4 232.6,57.0 234.3,58.0Z M248.5,57.0 248.5,59.8 252.2,57.6 255.5,59.4 254.7,61.5 257.4,63.3 260.3,61.3 262.3,58.9 262.4,55.9 266.4,56.1 270.5,56.5 274.2,57.9 274.4,59.3 272.3,60.7 274.3,62.2 273.9,63.6 268.5,65.5 264.6,66.0 261.8,65.1 260.9,66.5 258.2,68.9 257.4,70.1 254.2,71.9 250.2,72.1 248.0,73.3 247.9,75.1 244.6,75.5 241.2,77.7 238.2,80.8 237.1,83.0 237.0,86.3 241.1,86.7 242.3,89.3 243.6,91.4 247.5,90.9 252.7,92.1 255.4,93.1 257.4,94.4 260.9,95.2 263.9,96.4 268.4,96.5 271.5,96.8 271.0,99.2 271.9,102.0 273.9,105.1 278.0,107.8 280.2,106.9 281.7,104.0 280.2,99.6 278.3,98.1 282.7,96.8 285.8,94.9 287.4,93.0 287.2,91.1 285.3,88.7 281.9,86.7 285.2,83.7 284.0,81.2 283.0,76.9 285.0,76.2 289.7,77.0 292.6,77.3 294.9,76.5 297.5,77.5 300.9,79.1 301.7,80.2 306.7,80.4 306.6,82.7 307.5,86.2 310.1,86.7 312.1,88.3 316.1,86.8 318.8,83.7 320.6,82.4 322.8,84.9 326.4,88.4 329.5,91.8 328.3,93.5 332.0,95.1 334.5,96.7 339.0,97.4 340.7,98.3 341.8,100.6 344.0,101.0 345.1,102.0 345.3,105.1 343.3,106.2 341.3,107.2 336.7,108.2 333.2,110.4 328.5,110.9 322.6,110.3 318.4,110.3 315.6,110.5 313.2,112.5 309.7,113.7 305.7,117.4 302.5,119.9 304.8,119.5 309.3,115.8 315.1,113.5 319.3,113.2 321.7,114.6 319.1,116.5 320.0,119.5 320.9,121.6 324.5,122.9 329.1,122.5 331.9,119.4 332.1,121.4 333.9,122.4 330.4,124.3 324.3,125.9 321.5,127.0 318.4,129.0 316.3,128.8 316.2,126.5 321.0,124.2 316.6,124.3 313.5,124.6 311.7,123.0 311.7,119.3 310.5,118.5 308.6,118.9 307.7,118.2 305.6,120.3 304.7,122.5 303.7,123.7 302.5,124.2 301.7,124.3 301.4,125.0 296.3,125.0 292.0,125.0 290.8,125.5 287.8,127.5 287.5,127.7 286.6,128.8 284.1,128.8 281.3,128.8 280.1,129.3 280.5,129.8 280.8,130.7 280.7,130.9 277.1,132.3 274.2,132.8 271.0,134.2 270.3,134.2 269.4,133.8 269.1,133.4 269.1,133.1 269.7,132.1 271.0,130.6 271.8,129.0 271.3,126.6 270.7,124.0 267.8,122.7 268.1,122.2 267.7,121.9 267.0,121.9 266.4,121.5 266.3,120.8 265.7,121.1 265.0,121.0 265.2,120.7 264.5,120.5 264.2,119.7 262.1,118.8 259.8,117.9 257.1,116.8 254.5,115.8 252.0,116.6 251.1,116.6 247.7,115.9 245.4,116.3 242.8,115.4 239.9,115.0 238.0,114.8 237.1,114.3 236.6,112.8 235.7,112.8 235.7,113.9 229.9,113.9 220.4,113.9 211.0,113.9 202.6,113.9 194.3,113.9 186.1,113.9 177.6,113.9 174.9,113.9 166.7,113.9 158.8,113.9 158.4,113.9 153.0,111.2 151.0,110.0 146.0,108.8 144.5,106.3 144.9,104.6 141.3,103.5 140.8,101.2 137.5,99.2 137.4,97.8 138.9,96.4 138.9,94.7 134.1,92.9 131.3,89.7 129.6,87.7 127.0,86.5 125.2,85.4 123.7,83.9 120.9,84.8 118.2,86.4 115.7,84.5 113.8,83.3 111.1,82.6 108.3,82.5 108.4,66.7 108.4,56.4 113.6,57.0 117.9,58.4 120.8,58.6 123.3,57.5 126.6,56.6 130.8,56.9 134.9,55.7 139.5,55.0 141.4,56.2 143.4,55.5 144.1,54.2 146.0,54.5 150.7,57.0 154.4,55.1 154.8,57.2 158.2,56.8 159.2,56.0 162.6,56.1 166.8,57.3 173.3,58.3 177.1,58.8 179.9,58.6 183.6,60.0 179.7,61.4 184.7,62.0 192.2,61.6 194.6,61.2 197.6,62.8 200.6,61.4 197.7,60.2 199.5,59.3 202.9,59.2 205.1,58.9 207.4,59.6 210.2,61.1 213.3,60.8 218.2,62.1 222.5,61.7 226.5,61.7 226.2,60.0 228.7,59.5 233.0,60.4 233.0,63.1 234.8,60.9 237.0,60.9 238.2,58.1 235.3,56.4 232.0,55.3 232.2,52.2 235.5,50.2 239.2,50.7 242.0,51.9 245.8,55.0 243.3,56.4 248.5,57.0Z M182.9,46.9 181.5,48.2 187.7,47.3 191.5,48.7 194.7,47.3 197.2,48.2 199.5,51.0 200.9,49.8 198.9,47.0 201.3,46.6 204.1,47.0 207.2,48.1 209.0,50.8 209.8,52.8 214.5,54.2 219.5,55.5 219.2,56.7 214.6,56.9 216.4,58.0 215.5,59.0 210.4,58.6 205.7,57.8 202.4,58.0 197.2,58.9 190.2,59.4 185.2,59.6 183.7,58.3 179.9,57.6 177.5,57.9 174.1,55.7 175.9,55.4 180.2,54.9 184.1,55.0 187.7,54.5 182.4,53.9 176.4,54.1 172.5,54.1 171.0,53.0 177.5,51.9 173.2,52.0 168.3,51.2 170.7,49.1 172.6,48.0 180.0,46.3 182.9,46.9Z M209.7,46.1 207.3,47.9 202.9,45.9 203.9,45.6 207.6,45.4 209.7,46.1Z M287.9,46.9 288.2,47.7 285.2,47.6 282.2,47.6 279.2,47.9 278.4,47.8 275.3,46.3 275.5,45.3 276.8,45.1 283.2,45.4 287.9,46.9Z M259.5,46.8 261.7,48.5 264.3,46.3 271.3,45.1 276.1,48.0 275.7,49.8 281.2,49.0 283.8,47.9 290.0,49.3 293.8,50.6 294.2,51.9 299.3,51.2 302.2,53.0 308.9,54.1 311.3,55.2 314.0,57.8 308.9,59.1 315.4,60.9 319.8,61.5 323.8,64.1 328.2,64.3 327.3,66.2 322.4,69.4 319.0,68.3 314.7,65.6 311.1,65.9 310.7,67.5 313.6,69.1 317.4,70.4 318.6,71.2 320.4,73.9 319.4,75.9 315.9,75.2 308.9,72.9 312.9,75.3 315.8,77.0 316.2,78.0 308.7,76.9 302.7,75.2 299.3,73.9 300.3,73.1 296.2,71.7 292.1,70.3 292.2,71.1 284.1,71.6 281.8,70.6 283.6,68.6 288.8,68.5 294.6,68.2 293.6,67.2 294.6,65.8 298.2,63.1 297.4,61.9 296.4,60.9 292.1,59.6 286.5,58.6 288.3,57.9 285.3,56.2 282.9,56.0 280.7,55.1 279.2,55.9 274.2,56.3 264.0,55.6 258.2,54.8 253.7,54.4 251.4,53.4 254.3,52.2 250.3,52.2 249.4,49.3 251.6,46.9 254.4,45.7 261.6,45.0 259.5,46.8Z M221.2,44.9 224.5,45.5 229.5,45.1 230.2,45.9 227.6,47.2 231.8,48.4 231.3,50.9 226.8,52.0 224.1,51.8 222.2,50.7 215.3,48.6 215.3,47.7 221.0,48.0 217.9,46.2 221.2,44.9Z M241.1,47.9 238.1,49.9 235.0,49.8 233.2,47.4 233.3,46.0 234.7,44.8 237.5,44.1 243.3,44.2 248.6,44.8 244.4,47.3 241.1,47.9Z M165.4,51.7 158.1,53.1 156.6,51.8 150.2,50.4 151.4,49.2 153.3,47.2 155.7,45.3 153.0,43.6 162.4,43.2 166.4,43.8 173.5,43.9 176.2,44.7 179.1,45.9 175.6,46.6 168.8,48.6 165.4,50.5 165.4,51.7Z M240.0,41.7 238.5,42.8 234.4,42.6 231.1,41.9 232.5,40.6 236.5,39.9 239.0,40.8 240.0,41.7Z M226.4,36.9 228.5,38.2 228.6,39.6 227.3,41.7 222.8,42.0 219.8,41.5 219.8,39.9 215.3,40.1 215.1,38.0 218.1,38.0 222.3,37.1 226.2,37.3 226.4,36.9Z M199.4,38.3 200.5,39.3 203.0,38.9 205.9,39.0 206.4,40.3 204.7,41.7 195.3,42.1 188.3,43.3 184.0,43.3 183.7,42.4 189.5,41.2 176.9,41.5 173.0,41.0 176.8,38.3 179.4,37.6 187.2,38.5 192.2,40.1 197.0,40.4 193.1,37.7 195.6,36.7 198.5,37.0 199.4,38.3Z M237.0,35.8 240.1,36.7 245.5,36.7 247.9,37.6 247.3,38.7 250.5,39.3 252.3,40.0 256.0,40.1 260.1,40.3 264.5,39.7 270.1,39.5 274.6,39.7 277.6,40.7 278.2,41.9 276.5,42.6 272.4,43.2 268.8,42.9 260.8,43.3 255.1,43.4 250.7,43.0 243.3,42.1 242.3,40.6 242.0,39.2 239.2,38.0 233.4,37.7 230.2,36.8 231.3,35.7 237.0,35.8Z M177.2,34.3 176.8,36.5 174.7,37.4 172.1,37.6 166.9,38.7 162.5,39.2 158.7,38.6 163.5,36.5 169.2,34.7 173.4,34.7 177.2,34.3Z M239.3,34.7 238.1,34.7 232.9,34.6 232.1,33.8 237.7,33.8 239.7,34.3 239.3,34.7Z M193.9,34.2 188.7,35.0 184.6,34.1 186.9,33.2 190.9,32.9 194.8,33.3 193.9,34.2Z M195.4,31.7 192.0,32.2 187.4,32.2 187.4,31.8 190.3,31.0 191.8,31.1 195.4,31.7Z M233.8,33.2 229.7,33.7 227.4,33.1 226.2,32.1 226.0,30.9 229.6,31.0 231.2,31.2 234.6,32.2 233.8,33.2Z M222.1,32.4 223.1,33.6 218.6,33.3 214.0,32.4 207.8,32.3 210.5,31.5 207.2,30.8 207.0,29.7 212.4,30.1 219.9,31.1 222.1,32.4Z M258.3,28.7 261.6,29.6 257.8,30.4 252.7,32.5 247.8,32.7 242.0,32.4 239.0,31.2 239.1,30.2 241.3,29.5 236.2,29.5 233.1,28.6 231.4,27.3 233.3,26.1 235.2,25.3 238.1,25.1 236.8,24.4 243.3,24.3 246.9,25.8 251.5,26.4 256.1,26.9 258.3,28.7Z M309.7,19.1 317.1,19.4 323.1,19.7 328.2,20.5 328.1,21.2 321.3,22.4 314.6,23.0 312.1,23.6 318.1,23.6 311.6,25.3 307.0,26.1 302.3,28.3 296.5,28.8 294.8,29.4 286.4,29.7 290.2,30.0 288.3,30.5 290.6,31.9 287.9,32.8 283.6,33.6 282.3,34.7 278.4,35.5 278.8,36.2 283.6,36.0 283.6,36.7 276.2,38.4 269.0,37.6 260.8,38.1 256.7,37.7 251.4,37.6 251.1,36.2 256.2,35.6 254.8,33.6 256.5,33.4 264.0,34.6 260.2,32.8 255.7,32.3 257.9,31.2 262.8,30.6 263.6,29.6 259.7,28.5 258.5,27.1 266.1,27.2 268.3,27.5 272.6,26.5 266.4,26.2 256.7,26.3 251.8,25.4 249.4,24.3 246.2,23.5 245.6,22.5 249.7,22.0 253.0,21.9 258.4,21.4 262.5,20.4 265.9,20.6 268.9,21.3 271.1,19.8 274.7,19.4 279.7,19.1 288.2,19.0 289.7,19.3 297.7,18.8 303.7,19.0 309.7,19.1Z",
  "cx": 247.7,
  "cy": 68.8,
  "n": "캐나다",
  "ct": "북아메리카",
  "cap": "Ottawa",
  "fl": "🇨🇦",
  "lang": "English, French",
  "cur": "Canadian dollar",
  "bb": [108.3, 18.8, 353.8, 134.2],
  "ci": [{
    "n": "Toronto",
    "x": 279.4,
    "y": 128.6,
    "c": 0
  }, {
    "n": "Montreal",
    "x": 295.4,
    "y": 123.6,
    "c": 0
  }, {
    "n": "Vancouver",
    "x": 158.0,
    "y": 113.2,
    "c": 0
  }, {
    "n": "Calgary",
    "x": 183.1,
    "y": 108.2,
    "c": 0
  }, {
    "n": "Ottawa",
    "x": 289.7,
    "y": 123.8,
    "c": 1
  }, {
    "n": "Edmonton",
    "x": 184.8,
    "y": 101.2,
    "c": 0
  }, {
    "n": "Winnipeg",
    "x": 230.1,
    "y": 111.4,
    "c": 0
  }, {
    "n": "Quebec",
    "x": 302.2,
    "y": 120.0,
    "c": 0
  }, {
    "n": "Hamilton",
    "x": 277.9,
    "y": 129.9,
    "c": 0
  }],
  "lat": 60,
  "lng": -95,
  "area": 9984670,
  "areaR": 3,
  "pop": 41288599,
  "popR": 37,
  "gdp": 2140085567791,
  "gdpR": 10,
  "pc": 51832,
  "lvl": "고소득"
}, {
  "i": "KEN",
  "en": "Kenya",
  "d": "M613.9,252.4 615.5,254.7 613.6,255.8 612.9,256.9 611.8,257.1 611.4,259.1 610.6,260.2 610.0,262.1 608.9,263.0 604.9,260.2 604.7,258.6 594.6,252.9 594.2,252.6 594.1,249.7 594.9,248.6 596.3,246.7 597.3,244.7 596.1,241.5 595.8,240.1 594.5,238.2 596.2,236.5 598.1,234.7 599.5,235.2 599.5,236.7 600.4,237.6 602.4,237.6 605.9,240.0 606.8,240.0 607.4,240.0 608.0,240.3 609.9,240.5 610.7,239.3 613.2,238.2 614.4,239.1 616.3,239.1 613.8,242.3 613.9,252.4Z",
  "cx": 605.2,
  "cy": 246.6,
  "n": "케냐",
  "ct": "아프리카",
  "cap": "Nairobi",
  "fl": "🇰🇪",
  "lang": "English, Swahili",
  "cur": "Kenyan shilling",
  "bb": [594.1, 234.7, 616.3, 263.0],
  "ci": [{
    "n": "Nairobi",
    "x": 602.3,
    "y": 253.6,
    "c": 1
  }, {
    "n": "Mombasa",
    "x": 610.2,
    "y": 261.2,
    "c": 0
  }, {
    "n": "Nakuru",
    "x": 600.2,
    "y": 250.8,
    "c": 0
  }, {
    "n": "Eldoret",
    "x": 598.0,
    "y": 248.6,
    "c": 0
  }, {
    "n": "Kisumu",
    "x": 596.5,
    "y": 250.3,
    "c": 0
  }, {
    "n": "Thika",
    "x": 603.0,
    "y": 252.9,
    "c": 0
  }, {
    "n": "Kitale",
    "x": 597.2,
    "y": 247.2,
    "c": 0
  }, {
    "n": "Malindi",
    "x": 611.4,
    "y": 258.9,
    "c": 0
  }, {
    "n": "Garissa",
    "x": 610.2,
    "y": 251.3,
    "c": 0
  }],
  "lat": 1,
  "lng": 38,
  "area": 580367,
  "areaR": 49,
  "pop": 56432944,
  "popR": 26,
  "gdp": 107440575838,
  "gdpR": 68,
  "pc": 1904,
  "lvl": "중하위 소득"
}, {
  "i": "CRI",
  "en": "Costa Rica",
  "d": "M269.5,227.2 268.0,226.5 267.5,226.0 267.8,225.5 267.7,224.9 266.9,224.2 265.8,223.6 264.9,223.3 264.7,222.5 264.0,222.0 264.1,222.8 263.6,223.5 262.9,222.7 262.1,222.4 261.7,221.8 261.7,221.0 262.1,220.1 261.3,219.7 261.9,219.2 262.3,218.8 264.2,219.6 264.8,219.2 265.7,219.4 266.1,220.0 267.0,220.2 267.6,219.6 268.3,221.1 269.4,222.2 270.7,223.4 269.6,223.7 269.6,224.8 270.2,225.2 269.8,225.5 269.9,226.0 269.7,226.6 269.5,227.2Z",
  "cx": 266.2,
  "cy": 222.8,
  "n": "코스타리카",
  "ct": "북아메리카",
  "cap": "San José",
  "fl": "🇨🇷",
  "lang": "Spanish",
  "cur": "Costa Rican colón",
  "bb": [261.3, 218.8, 270.7, 227.2],
  "ci": [{
    "n": "San Jose",
    "x": 266.4,
    "y": 222.4,
    "c": 0
  }, {
    "n": "Puerto Limon",
    "x": 269.4,
    "y": 222.2,
    "c": 0
  }, {
    "n": "San Francisco",
    "x": 266.3,
    "y": 222.3,
    "c": 0
  }, {
    "n": "Alajuela",
    "x": 266.1,
    "y": 222.2,
    "c": 0
  }, {
    "n": "Liberia",
    "x": 262.7,
    "y": 220.5,
    "c": 0
  }, {
    "n": "Paraiso",
    "x": 267.0,
    "y": 222.7,
    "c": 0
  }, {
    "n": "Puntarenas",
    "x": 264.3,
    "y": 222.3,
    "c": 0
  }, {
    "n": "San Isidro",
    "x": 267.5,
    "y": 223.9,
    "c": 0
  }, {
    "n": "Curridabat",
    "x": 266.6,
    "y": 222.5,
    "c": 0
  }],
  "lat": 10,
  "lng": -84,
  "area": 51100,
  "areaR": 130,
  "pop": 5129910,
  "popR": 126,
  "gdp": 86497941439,
  "gdpR": 73,
  "pc": 16861,
  "lvl": "고소득"
}, {
  "i": "CIV",
  "en": "Ivory Coast",
  "d": "M492.1,236.1 490.8,236.2 488.9,235.6 487.1,235.6 483.8,236.1 481.9,236.9 479.1,237.9 478.6,237.9 478.8,235.6 479.1,235.2 479.0,234.1 477.8,233.0 476.9,232.8 476.1,232.0 476.7,230.8 476.4,229.5 476.6,228.6 477.0,228.6 477.2,227.4 476.9,226.9 477.2,226.5 478.2,226.2 477.6,224.0 476.9,222.8 477.1,221.9 477.7,221.6 478.1,221.4 478.8,221.8 481.0,221.8 481.5,221.0 482.0,221.1 482.8,220.8 483.2,222.0 483.8,221.6 485.0,221.2 486.2,221.8 486.7,222.7 488.0,223.3 488.9,222.6 490.2,222.5 492.1,223.2 492.9,227.2 491.7,229.5 491.0,232.6 492.2,235.0 492.1,236.1Z",
  "cx": 482.7,
  "cy": 228.2,
  "n": "코트디부아르",
  "ct": "아프리카",
  "cap": "Yamoussoukro",
  "fl": "🇨🇮",
  "lang": "French",
  "cur": "West African CFA franc",
  "bb": [476.1, 220.8, 492.9, 237.9],
  "ci": [],
  "lat": 8,
  "lng": -5,
  "area": 322463,
  "areaR": 71,
  "pop": 31934230,
  "popR": 50,
  "gdp": 78788828907,
  "gdpR": 80,
  "pc": 2467,
  "lvl": "중하위 소득"
}, {
  "i": "COL",
  "en": "Colombia",
  "d": "M290.6,250.4 289.4,249.8 288.1,248.8 287.3,249.3 284.9,248.9 284.3,247.7 283.7,247.8 281.0,246.2 280.6,245.3 281.6,245.1 281.5,243.7 282.1,242.7 283.5,242.5 284.7,240.8 285.8,239.3 284.7,238.6 285.3,237.0 284.6,234.5 285.2,233.8 284.8,231.4 283.7,229.9 284.0,228.6 284.9,228.8 285.4,228.0 284.8,226.3 285.1,225.9 286.6,226.0 288.6,224.1 289.8,223.8 289.8,222.8 290.3,220.5 291.9,219.2 293.7,219.2 293.9,218.6 296.1,218.8 298.3,217.4 299.3,216.8 300.7,215.5 301.7,215.6 302.4,216.4 301.9,217.3 300.1,217.8 299.4,219.1 298.3,219.9 297.5,221.0 297.1,223.0 296.4,224.6 297.8,224.8 298.2,226.0 298.8,226.7 299.0,227.8 298.7,228.8 298.8,229.4 299.4,229.6 300.1,230.6 303.7,230.3 305.3,230.7 307.3,233.1 308.4,232.8 310.4,232.9 312.0,232.6 312.9,233.1 312.4,234.6 311.8,235.5 311.6,237.5 312.2,239.3 313.0,240.2 313.0,240.8 311.6,242.2 312.6,242.8 313.4,243.7 314.2,246.5 313.7,246.9 313.2,245.2 312.4,244.3 311.5,245.3 306.1,245.2 306.1,247.0 307.7,247.3 307.6,248.3 307.1,248.0 305.5,248.5 305.5,250.5 306.7,251.5 307.2,253.1 307.1,254.3 305.9,261.9 304.5,260.5 303.6,260.4 305.4,257.6 303.3,256.3 301.6,256.5 300.6,256.0 299.1,256.8 297.0,256.4 295.4,253.5 294.1,252.8 293.2,251.5 291.4,250.2 290.6,250.4Z",
  "cx": 298.0,
  "cy": 237.6,
  "n": "콜롬비아",
  "ct": "남아메리카",
  "cap": "Bogotá",
  "fl": "🇨🇴",
  "lang": "Spanish",
  "cur": "Colombian peso",
  "bb": [280.6, 215.5, 314.2, 261.9],
  "ci": [{
    "n": "Bogota",
    "x": 294.2,
    "y": 237.2,
    "c": 0
  }, {
    "n": "Cali",
    "x": 287.4,
    "y": 240.5,
    "c": 0
  }, {
    "n": "Medellin",
    "x": 290.2,
    "y": 232.5,
    "c": 0
  }, {
    "n": "Barranquilla",
    "x": 292.2,
    "y": 219.5,
    "c": 0
  }, {
    "n": "Cartagena",
    "x": 290.2,
    "y": 221.1,
    "c": 0
  }, {
    "n": "Cucuta",
    "x": 298.6,
    "y": 228.1,
    "c": 0
  }, {
    "n": "Bucaramanga",
    "x": 296.9,
    "y": 230.2,
    "c": 0
  }, {
    "n": "Pereira",
    "x": 289.7,
    "y": 236.6,
    "c": 0
  }, {
    "n": "Santa Marta",
    "x": 293.9,
    "y": 218.8,
    "c": 0
  }],
  "lat": 4,
  "lng": -72,
  "area": 1141748,
  "areaR": 27,
  "pop": 52886363,
  "popR": 28,
  "gdp": 363540156235,
  "gdpR": 42,
  "pc": 6874,
  "lvl": "중상위 소득"
}, {
  "i": "COG",
  "en": "Republic of the Congo",
  "d": "M536.1,263.3 535.1,262.3 534.2,262.8 533.1,264.0 530.8,261.1 532.9,259.5 531.9,257.7 532.8,257.0 534.7,256.6 534.9,255.4 536.4,256.7 538.9,256.9 539.7,255.6 540.1,253.7 539.8,251.5 538.5,249.9 539.7,246.7 539.0,246.1 536.9,246.3 536.1,244.9 536.3,243.7 539.8,243.8 542.1,244.5 544.3,245.2 544.5,243.7 545.9,241.1 547.6,239.6 549.5,240.1 551.3,240.3 551.1,241.9 550.3,243.4 549.7,245.2 549.4,247.6 549.5,249.2 549.1,250.2 549.0,251.2 548.7,252.1 546.8,253.4 545.6,254.8 544.4,257.5 544.5,259.8 543.8,260.7 542.1,262.1 540.5,263.8 539.5,263.3 539.3,262.5 537.8,262.5 536.8,263.6 536.1,263.3Z",
  "cx": 541.2,
  "cy": 253.0,
  "n": "콩고",
  "ct": "아프리카",
  "cap": "Brazzaville",
  "fl": "🇨🇬",
  "lang": "French, Kikongo",
  "cur": "Central African CFA franc",
  "bb": [530.8, 239.6, 551.3, 264.0],
  "ci": [],
  "lat": -1,
  "lng": 15,
  "area": 342000,
  "areaR": 66,
  "pop": 6332961,
  "popR": 112,
  "gdp": 15321055818,
  "gdpR": 137,
  "pc": 2419,
  "lvl": "중하위 소득"
}, {
  "i": "COD",
  "en": "Democratic Republic of the Congo",
  "d": "M585.6,240.3 585.5,243.5 586.6,243.9 585.7,244.9 584.6,245.6 583.6,247.0 583.0,248.3 582.8,250.6 582.2,251.6 582.2,253.7 581.4,254.5 581.3,256.2 580.9,256.4 580.6,257.9 581.3,259.1 581.5,262.5 582.0,265.1 581.7,266.5 582.3,268.1 583.9,269.7 585.4,273.2 584.3,272.9 580.6,273.4 579.8,273.7 579.0,275.5 579.6,276.7 579.2,280.0 578.8,282.8 579.6,283.3 581.5,284.3 582.3,283.8 582.5,286.8 580.4,286.8 579.2,285.3 578.2,284.1 576.1,283.7 575.5,282.2 573.8,283.1 571.5,282.7 570.6,281.5 568.8,281.2 567.5,281.3 567.4,280.4 566.4,280.4 565.2,280.2 563.4,280.6 562.2,280.5 561.5,280.8 561.7,277.5 560.8,276.5 560.6,274.7 561.0,273.1 560.4,272.0 560.4,270.3 557.0,270.3 557.2,269.3 555.8,269.3 555.7,269.8 553.9,269.9 553.2,271.5 552.8,272.2 551.3,271.8 550.4,272.2 548.5,272.4 547.5,271.0 546.8,270.1 546.0,268.4 545.4,266.3 537.2,266.3 536.2,266.6 535.4,266.6 534.2,266.9 533.8,266.1 534.5,265.8 534.6,264.6 535.1,263.9 536.1,263.3 536.8,263.6 537.8,262.5 539.3,262.5 539.5,263.3 540.5,263.8 542.1,262.1 543.8,260.7 544.5,259.8 544.4,257.5 545.6,254.8 546.8,253.4 548.7,252.1 549.0,251.2 549.1,250.2 549.5,249.2 549.4,247.6 549.7,245.2 550.3,243.4 551.1,241.9 551.3,240.3 551.5,238.3 552.6,236.9 554.1,236.0 556.4,237.0 558.1,238.0 560.2,238.3 562.2,238.8 563.1,237.1 563.4,236.9 564.7,237.2 567.8,235.8 568.9,236.4 569.8,236.3 570.2,235.6 571.3,235.4 573.3,235.7 575.1,235.8 576.0,235.5 577.7,237.8 579.0,238.1 579.7,237.6 581.0,237.8 582.5,237.2 583.2,238.4 585.6,240.3Z",
  "cx": 563.9,
  "cy": 260.5,
  "n": "콩고 민주 공화국",
  "ct": "아프리카",
  "cap": "Kinshasa",
  "fl": "🇨🇩",
  "lang": "French, Kikongo",
  "cur": "Congolese franc",
  "bb": [533.8, 235.4, 586.6, 286.8],
  "ci": [],
  "lat": 0,
  "lng": 25,
  "area": 2344858,
  "areaR": 12,
  "pop": 109276265,
  "popR": 15,
  "gdp": 66383287003,
  "gdpR": 88,
  "pc": 607,
  "lvl": "저소득"
}, {
  "i": "CUB",
  "en": "Cuba",
  "d": "M271.5,185.6 273.9,185.8 276.1,185.8 278.7,186.8 279.8,187.8 282.4,187.5 283.4,188.1 285.7,189.8 287.4,191.1 288.3,191.1 290.0,191.6 289.8,192.4 291.9,192.5 293.9,193.7 293.6,194.3 291.8,194.7 289.9,194.8 288.0,194.6 284.0,194.8 285.9,193.3 284.7,192.6 283.0,192.4 282.0,191.6 281.3,190.0 279.8,190.1 277.2,189.4 276.3,188.8 272.7,188.4 271.8,187.8 272.8,187.1 270.1,187.0 268.1,188.4 266.9,188.5 266.5,189.1 265.1,189.4 264.0,189.2 265.4,188.3 266.0,187.3 267.3,186.7 268.7,186.2 270.8,185.9 271.5,185.6Z",
  "cx": 278.5,
  "cy": 189.7,
  "n": "쿠바",
  "ct": "북아메리카",
  "cap": "Havana",
  "fl": "🇨🇺",
  "lang": "Spanish",
  "cur": "Cuban convertible peso",
  "bb": [264.0, 185.6, 293.9, 194.8],
  "ci": [{
    "n": "Havana",
    "x": 271.2,
    "y": 185.7,
    "c": 1
  }, {
    "n": "Santiago de Cuba",
    "x": 289.4,
    "y": 194.4,
    "c": 0
  }, {
    "n": "Camaguey",
    "x": 283.6,
    "y": 190.6,
    "c": 0
  }, {
    "n": "Holguin",
    "x": 288.2,
    "y": 192.0,
    "c": 0
  }, {
    "n": "Guantanamo",
    "x": 291.1,
    "y": 194.0,
    "c": 0
  }, {
    "n": "Santa Clara",
    "x": 277.9,
    "y": 187.8,
    "c": 0
  }, {
    "n": "Las Tunas",
    "x": 286.2,
    "y": 191.8,
    "c": 0
  }, {
    "n": "Bayamo",
    "x": 287.1,
    "y": 193.4,
    "c": 0
  }, {
    "n": "Pinar del Rio",
    "x": 267.5,
    "y": 187.7,
    "c": 0
  }],
  "lat": 21.5,
  "lng": -80,
  "area": 109884,
  "areaR": 107,
  "pop": 10979783,
  "popR": 86,
  "gdp": 107351800000,
  "gdpR": 69,
  "pc": 9777,
  "lvl": "중상위 소득"
}, {
  "i": "KWT",
  "en": "Kuwait",
  "d": "M633.3,166.7 633.8,168.0 633.6,168.6 634.5,170.7 632.5,170.8 631.8,169.4 629.4,169.2 631.4,166.5 633.3,166.7Z",
  "cx": 632.6,
  "cy": 168.5,
  "n": "쿠웨이트",
  "ct": "아시아",
  "cap": "Kuwait City",
  "fl": "🇰🇼",
  "lang": "Arabic",
  "cur": "Kuwaiti dinar",
  "bb": [629.4, 166.5, 634.5, 170.8],
  "ci": [{
    "n": "As Salimiyah",
    "x": 633.5,
    "y": 168.5,
    "c": 0
  }, {
    "n": "Sabah as Salim",
    "x": 633.5,
    "y": 168.7,
    "c": 0
  }, {
    "n": "Al Farwaniyah",
    "x": 633.2,
    "y": 168.7,
    "c": 0
  }, {
    "n": "Al Fuhayhil",
    "x": 633.7,
    "y": 169.2,
    "c": 0
  }, {
    "n": "Kuwait",
    "x": 633.3,
    "y": 168.4,
    "c": 0
  }, {
    "n": "Ar Riqqah",
    "x": 633.6,
    "y": 169.0,
    "c": 0
  }, {
    "n": "Salwa",
    "x": 633.6,
    "y": 168.6,
    "c": 0
  }, {
    "n": "Al Manqaf",
    "x": 633.7,
    "y": 169.2,
    "c": 0
  }, {
    "n": "Ar Rabiyah",
    "x": 633.1,
    "y": 168.6,
    "c": 0
  }],
  "lat": 29.5,
  "lng": 45.8,
  "area": 17818,
  "areaR": 158,
  "pop": 4897263,
  "popR": 127,
  "gdp": 161772221951,
  "gdpR": 60,
  "pc": 33033,
  "lvl": "고소득"
}, {
  "i": "HRV",
  "en": "Croatia",
  "d": "M552.3,122.5 553.0,123.6 553.9,124.3 552.8,125.4 551.5,124.8 549.6,124.8 547.2,124.4 545.9,124.4 545.3,125.0 544.3,124.4 543.8,125.5 545.1,126.8 545.7,127.7 547.0,128.7 548.0,129.3 549.1,130.5 551.6,131.5 551.3,132.0 548.6,131.0 547.0,130.0 544.5,129.1 542.2,127.1 542.7,126.9 541.4,125.7 541.4,124.8 539.6,124.4 538.8,125.5 537.9,124.6 538.0,123.7 538.1,123.6 540.0,123.7 540.5,123.2 541.5,123.7 542.6,123.7 542.6,123.0 543.5,122.7 543.8,121.6 546.0,120.8 546.9,121.2 549.0,122.4 551.3,122.9 552.3,122.5Z",
  "cx": 545.7,
  "cy": 125.3,
  "n": "크로아티아",
  "ct": "유럽",
  "cap": "Zagreb",
  "fl": "🇭🇷",
  "lang": "Croatian",
  "cur": "Euro",
  "bb": [537.9, 120.8, 553.9, 132.0],
  "ci": [{
    "n": "Zagreb - Centar",
    "x": 544.4,
    "y": 122.7,
    "c": 0
  }, {
    "n": "Zagreb",
    "x": 544.4,
    "y": 122.8,
    "c": 1
  }, {
    "n": "Split",
    "x": 545.7,
    "y": 129.1,
    "c": 0
  }, {
    "n": "Rijeka",
    "x": 540.0,
    "y": 124.0,
    "c": 0
  }, {
    "n": "Osijek",
    "x": 551.9,
    "y": 123.5,
    "c": 0
  }, {
    "n": "Zadar",
    "x": 542.3,
    "y": 127.4,
    "c": 0
  }, {
    "n": "Slavonski Brod",
    "x": 550.0,
    "y": 124.6,
    "c": 0
  }, {
    "n": "Pula",
    "x": 538.5,
    "y": 125.4,
    "c": 0
  }, {
    "n": "Sesvete",
    "x": 544.8,
    "y": 122.7,
    "c": 0
  }],
  "lat": 45.2,
  "lng": 15.5,
  "area": 56594,
  "areaR": 128,
  "pop": 3866200,
  "popR": 129,
  "gdp": 82688842717,
  "gdpR": 78,
  "pc": 21388,
  "lvl": "고소득"
}, {
  "i": "KGZ",
  "en": "Kyrgyzstan",
  "d": "M697.1,132.6 697.7,131.4 699.6,131.0 704.1,131.9 704.6,130.3 706.1,129.7 710.1,130.9 711.1,130.6 715.7,130.7 719.8,131.0 721.2,132.0 722.9,132.4 722.6,133.0 718.2,134.5 717.2,135.6 713.6,135.9 712.6,137.7 709.6,137.3 707.7,137.9 705.1,139.2 705.4,139.8 704.7,140.5 699.4,140.9 696.0,140.0 693.0,140.2 693.2,138.6 696.2,139.1 697.3,138.2 699.4,138.5 702.9,136.5 699.6,135.0 697.7,135.7 695.6,134.7 697.9,132.9 697.1,132.6Z",
  "cx": 705.5,
  "cy": 135.1,
  "n": "키르기스스탄",
  "ct": "아시아",
  "cap": "Bishkek",
  "fl": "🇰🇬",
  "lang": "Kyrgyz, Russian",
  "cur": "Kyrgyzstani som",
  "bb": [693.0, 129.7, 722.9, 140.9],
  "ci": [],
  "lat": 41,
  "lng": 75,
  "area": 199951,
  "areaR": 88,
  "pop": 7221868,
  "popR": 106,
  "gdp": 13987627909,
  "gdpR": 145,
  "pc": 1937,
  "lvl": "중하위 소득"
}, {
  "i": "CYP",
  "en": "Cyprus",
  "d": "M594.4,152.6 594.5,152.8 591.6,154.0 590.3,153.6 589.6,152.5 590.9,152.4 591.4,152.5 592.2,152.3 592.7,152.3 592.9,152.5 593.0,152.8 593.1,152.7 593.5,152.7 594.1,152.5 594.4,152.6Z",
  "cx": 592.6,
  "cy": 152.7,
  "n": "키프로스",
  "ct": "유럽",
  "cap": "Nicosia",
  "fl": "🇨🇾",
  "lang": "Greek, Turkish",
  "cur": "Euro",
  "bb": [589.6, 152.3, 594.5, 154.0],
  "ci": [{
    "n": "Nicosia",
    "x": 592.7,
    "y": 152.3,
    "c": 1
  }, {
    "n": "Limassol",
    "x": 591.8,
    "y": 153.7,
    "c": 0
  }, {
    "n": "Larnaca",
    "x": 593.4,
    "y": 153.0,
    "c": 0
  }, {
    "n": "Famagusta",
    "x": 594.3,
    "y": 152.4,
    "c": 0
  }, {
    "n": "Paphos",
    "x": 590.0,
    "y": 153.4,
    "c": 0
  }, {
    "n": "Kyrenia",
    "x": 592.5,
    "y": 151.8,
    "c": 0
  }, {
    "n": "Protaras",
    "x": 594.6,
    "y": 152.7,
    "c": 0
  }, {
    "n": "Morphou",
    "x": 591.6,
    "y": 152.2,
    "c": 0
  }, {
    "n": "Aradhippou",
    "x": 593.3,
    "y": 152.9,
    "c": 0
  }],
  "lat": 35,
  "lng": 33,
  "area": 9251,
  "areaR": 170,
  "pop": 1358282,
  "popR": 156,
  "gdp": 32229622669,
  "gdpR": 105,
  "pc": 23728,
  "lvl": "고소득"
}, {
  "i": "TJK",
  "en": "Tajikistan",
  "d": "M697.3,138.2 696.2,139.1 693.2,138.6 693.0,140.2 696.0,140.0 699.4,140.9 704.7,140.5 705.4,143.0 706.3,142.8 708.0,143.4 707.9,144.5 708.3,146.1 705.4,146.1 703.5,145.8 701.8,147.1 700.5,147.4 699.6,147.9 698.5,147.0 698.7,144.7 697.9,144.6 698.2,143.7 696.7,143.1 695.5,144.1 695.2,145.2 694.8,145.6 693.1,145.5 692.2,146.8 691.3,146.3 689.3,147.2 688.4,146.8 690.0,144.0 689.4,141.9 687.3,141.3 688.1,140.1 690.4,140.2 691.7,138.6 692.6,136.9 696.3,136.2 695.7,137.5 696.1,138.3 697.3,138.2Z",
  "cx": 696.9,
  "cy": 142.8,
  "n": "타지키스탄",
  "ct": "아시아",
  "cap": "Dushanbe",
  "fl": "🇹🇯",
  "lang": "Russian, Tajik",
  "cur": "Tajikistani somoni",
  "bb": [687.3, 136.2, 708.3, 147.9],
  "ci": [{
    "n": "Dushanbe",
    "x": 691.0,
    "y": 142.9,
    "c": 1
  }, {
    "n": "Khujand",
    "x": 693.4,
    "y": 138.1,
    "c": 0
  }, {
    "n": "Kulob",
    "x": 693.8,
    "y": 144.7,
    "c": 0
  }, {
    "n": "Qurghonteppa",
    "x": 691.1,
    "y": 144.9,
    "c": 0
  }, {
    "n": "Istaravshan",
    "x": 691.7,
    "y": 139.1,
    "c": 0
  }, {
    "n": "Konibodom",
    "x": 695.6,
    "y": 138.1,
    "c": 0
  }, {
    "n": "Kofarnihon",
    "x": 691.7,
    "y": 142.9,
    "c": 0
  }, {
    "n": "Tursunzoda",
    "x": 689.5,
    "y": 143.0,
    "c": 0
  }, {
    "n": "Isfara",
    "x": 696.2,
    "y": 138.6,
    "c": 0
  }],
  "lat": 39,
  "lng": 71,
  "area": 143100,
  "areaR": 97,
  "pop": 10590927,
  "popR": 90,
  "gdp": 12060602009,
  "gdpR": 149,
  "pc": 1139,
  "lvl": "중하위 소득"
}, {
  "i": "TZA",
  "en": "United Republic of Tanzania",
  "d": "M594.2,252.6 594.6,252.9 604.7,258.6 604.9,260.2 608.9,263.0 607.6,266.4 607.8,268.0 609.6,269.0 609.6,269.7 608.9,271.4 609.0,272.2 608.9,273.6 609.8,275.3 611.0,278.1 612.0,278.7 609.8,280.3 606.7,281.3 605.1,281.3 604.1,282.1 602.2,282.2 601.4,282.6 598.1,281.8 596.0,282.0 595.2,278.2 594.3,276.9 593.7,276.2 591.0,275.6 589.4,274.8 587.7,274.3 586.5,273.9 585.4,273.2 583.9,269.7 582.3,268.1 581.7,266.5 582.0,265.1 581.5,262.5 582.6,262.4 583.7,261.4 584.7,259.9 585.4,259.3 585.4,258.4 584.8,257.8 584.6,256.7 585.4,256.4 585.6,254.7 584.5,253.2 585.5,252.8 588.5,252.9 594.2,252.6Z",
  "cx": 595.4,
  "cy": 268.1,
  "n": "탄자니아",
  "ct": "아프리카",
  "cap": "Dodoma",
  "fl": "🇹🇿",
  "lang": "English, Swahili",
  "cur": "Tanzanian shilling",
  "bb": [581.5, 252.6, 612.0, 282.6],
  "ci": [],
  "lat": -6,
  "lng": 35,
  "area": 945087,
  "areaR": 32,
  "pop": 68560157,
  "popR": 22,
  "gdp": 79158286334,
  "gdpR": 79,
  "pc": 1155,
  "lvl": "중하위 소득"
}, {
  "i": "THA",
  "en": "Thailand",
  "d": "M785.0,216.1 782.5,214.9 780.1,214.9 780.5,212.7 778.0,212.8 777.8,215.8 776.3,219.9 775.4,222.3 775.6,224.3 777.4,224.4 778.6,227.0 779.1,229.4 780.6,231.0 782.3,231.3 783.7,232.7 782.8,233.9 781.0,234.2 780.8,232.8 778.5,231.5 778.0,232.0 776.9,231.0 776.4,229.6 775.0,228.0 773.6,226.7 773.2,228.3 772.6,226.8 772.9,225.1 773.8,222.4 775.1,219.6 776.6,217.0 775.5,214.4 775.6,213.1 775.3,211.6 773.4,209.4 772.8,208.0 773.7,207.5 774.7,205.1 773.6,203.2 771.8,201.2 770.5,198.8 771.7,198.3 772.9,195.3 774.9,195.1 776.5,193.9 778.1,193.3 779.3,194.1 779.5,195.8 781.3,195.9 780.7,198.9 780.7,201.4 783.6,199.7 784.5,200.2 786.1,200.1 786.7,199.1 788.8,199.3 790.9,201.6 791.1,204.3 793.3,206.7 793.2,209.1 792.3,210.4 789.7,210.0 786.1,210.5 784.3,212.8 785.0,216.1Z",
  "cx": 779.5,
  "cy": 213.5,
  "n": "태국",
  "ct": "아시아",
  "cap": "Bangkok",
  "fl": "🇹🇭",
  "lang": "Thai",
  "cur": "Thai baht",
  "bb": [770.5, 193.3, 793.3, 234.2],
  "ci": [{
    "n": "Bangkok",
    "x": 779.2,
    "y": 211.8,
    "c": 1
  }, {
    "n": "Samut Prakan",
    "x": 779.4,
    "y": 212.2,
    "c": 0
  }, {
    "n": "Udon Thani",
    "x": 785.5,
    "y": 201.6,
    "c": 0
  }, {
    "n": "Chon Buri",
    "x": 780.5,
    "y": 212.9,
    "c": 0
  }, {
    "n": "Nakhon Ratchasima",
    "x": 783.6,
    "y": 208.4,
    "c": 0
  }, {
    "n": "Chiang Mai",
    "x": 774.9,
    "y": 197.8,
    "c": 0
  }, {
    "n": "Hat Yai",
    "x": 779.1,
    "y": 230.5,
    "c": 0
  }, {
    "n": "Pak Kret",
    "x": 779.2,
    "y": 211.3,
    "c": 0
  }, {
    "n": "Si Racha",
    "x": 780.4,
    "y": 213.4,
    "c": 0
  }],
  "lat": 15,
  "lng": 100,
  "area": 513120,
  "areaR": 52,
  "pop": 71668011,
  "popR": 20,
  "gdp": 514944993834,
  "gdpR": 27,
  "pc": 7185,
  "lvl": "중상위 소득"
}, {
  "i": "TUR",
  "en": "Turkey",
  "d": "M602.5,135.2 606.5,136.3 609.8,135.8 612.1,136.1 615.4,134.6 618.4,134.5 621.1,135.9 621.5,136.8 621.3,138.2 623.3,138.9 624.4,139.7 622.5,140.5 623.4,143.7 622.8,144.5 624.4,146.7 623.0,147.2 622.1,146.5 618.8,146.2 617.6,146.6 614.5,147.0 613.0,147.0 609.8,148.0 607.5,148.0 606.0,147.5 603.0,148.3 602.1,147.7 601.9,149.3 601.2,149.9 600.4,150.5 599.4,149.2 600.4,148.2 598.8,148.4 596.4,147.8 594.5,149.4 590.3,149.7 588.1,148.2 585.1,148.1 584.4,149.3 582.5,149.6 579.8,148.1 576.8,148.2 575.1,145.4 573.1,143.9 574.5,141.7 572.7,140.4 575.8,137.7 580.1,137.6 581.2,135.5 586.5,135.9 589.9,134.1 593.1,133.3 597.7,133.2 602.5,135.2Z M575.5,137.0 573.2,138.5 572.3,137.2 572.4,136.6 573.0,136.3 573.9,134.5 572.5,133.8 575.4,132.9 577.8,133.3 578.1,134.4 580.5,135.3 580.0,136.0 576.7,136.1 575.5,137.0Z",
  "cx": 596.2,
  "cy": 141.6,
  "n": "터키",
  "ct": "아시아",
  "cap": "Ankara",
  "fl": "🇹🇷",
  "lang": "Turkish",
  "cur": "Turkish lira",
  "bb": [572.3, 132.9, 624.4, 150.5],
  "ci": [{
    "n": "Istanbul",
    "x": 580.4,
    "y": 136.1,
    "c": 0
  }, {
    "n": "Ankara",
    "x": 591.3,
    "y": 139.1,
    "c": 1
  }, {
    "n": "Izmir",
    "x": 575.4,
    "y": 143.3,
    "c": 0
  }, {
    "n": "Bursa",
    "x": 580.7,
    "y": 138.4,
    "c": 0
  }, {
    "n": "Adana",
    "x": 598.1,
    "y": 147.2,
    "c": 0
  }, {
    "n": "Gaziantep",
    "x": 603.8,
    "y": 147.1,
    "c": 0
  }, {
    "n": "Konya",
    "x": 590.2,
    "y": 144.8,
    "c": 0
  }, {
    "n": "Antalya",
    "x": 585.2,
    "y": 147.5,
    "c": 0
  }, {
    "n": "Eskisehir Ili",
    "x": 586.6,
    "y": 139.8,
    "c": 0
  }],
  "lat": 39,
  "lng": 35,
  "area": 783562,
  "areaR": 38,
  "pop": 85518661,
  "popR": 18,
  "gdp": 1108022373260,
  "gdpR": 18,
  "pc": 12956,
  "lvl": "중상위 소득"
}, {
  "i": "TGO",
  "en": "Togo",
  "d": "M505.2,232.9 502.9,233.5 502.3,232.6 501.6,230.8 501.4,229.4 502.0,226.9 501.3,225.9 501.0,223.7 501.0,221.7 499.9,220.3 500.1,219.4 502.5,219.5 502.1,220.9 503.0,221.7 504.0,222.7 504.1,224.1 504.6,224.6 504.5,231.0 505.2,232.9Z",
  "cx": 502.6,
  "cy": 226.0,
  "n": "토고",
  "ct": "아프리카",
  "cap": "Lomé",
  "fl": "🇹🇬",
  "lang": "French",
  "cur": "West African CFA franc",
  "bb": [499.9, 219.4, 505.2, 233.5],
  "ci": [{
    "n": "Lome",
    "x": 503.4,
    "y": 233.0,
    "c": 0
  }, {
    "n": "Sokode",
    "x": 503.1,
    "y": 225.0,
    "c": 0
  }, {
    "n": "Kara",
    "x": 503.3,
    "y": 223.5,
    "c": 0
  }, {
    "n": "Kpalime",
    "x": 501.8,
    "y": 230.8,
    "c": 0
  }, {
    "n": "Atakpame",
    "x": 503.1,
    "y": 229.1,
    "c": 0
  }, {
    "n": "Bassar",
    "x": 502.2,
    "y": 224.3,
    "c": 0
  }, {
    "n": "Tsevie",
    "x": 503.4,
    "y": 232.1,
    "c": 0
  }, {
    "n": "Aneho",
    "x": 504.4,
    "y": 232.7,
    "c": 0
  }, {
    "n": "Sansanne-Mango",
    "x": 501.3,
    "y": 221.2,
    "c": 0
  }],
  "lat": 8,
  "lng": 1.2,
  "area": 56785,
  "areaR": 127,
  "pop": 9515236,
  "popR": 97,
  "gdp": 9171261835,
  "gdpR": 154,
  "pc": 964,
  "lvl": "저소득"
}, {
  "i": "TKM",
  "en": "Turkmenistan",
  "d": "M670.0,151.0 669.8,148.6 667.7,148.5 664.5,146.1 662.3,145.8 659.3,144.4 657.3,144.1 656.1,144.6 654.2,144.5 652.2,146.1 649.8,146.7 649.3,144.7 649.7,141.8 647.5,140.9 648.2,139.0 646.4,138.8 647.0,136.5 649.6,137.1 652.0,136.2 650.0,134.6 649.2,133.0 647.0,133.7 646.7,135.7 645.8,133.9 647.1,133.0 650.2,132.4 652.1,133.2 654.0,135.4 655.5,135.3 658.6,135.2 658.1,133.8 660.5,132.9 662.9,131.2 666.6,132.7 666.9,134.9 668.0,135.5 671.0,135.4 671.9,135.9 673.3,138.7 676.4,140.7 678.3,142.0 681.2,143.3 684.9,144.5 684.8,146.2 683.9,146.1 682.6,145.4 682.2,146.4 679.9,146.9 679.3,149.1 677.7,150.0 675.5,150.4 675.0,151.7 672.9,152.0 670.0,151.0Z",
  "cx": 662.8,
  "cy": 141.1,
  "n": "투르크메니스탄",
  "ct": "아시아",
  "cap": "Ashgabat",
  "fl": "🇹🇲",
  "lang": "Russian, Turkmen",
  "cur": "Turkmenistan manat",
  "bb": [645.8, 131.2, 684.9, 152.0],
  "ci": [],
  "lat": 40,
  "lng": 60,
  "area": 488100,
  "areaR": 54,
  "pop": 7494498,
  "popR": 104,
  "gdp": 59887334844,
  "gdpR": 90,
  "pc": 7991,
  "lvl": "중상위 소득"
}, {
  "i": "TUN",
  "en": "Tunisia",
  "d": "M526.3,165.8 525.2,160.8 523.4,159.7 523.4,159.0 521.1,157.4 520.9,155.3 522.6,153.7 523.3,151.4 522.8,148.8 523.4,147.4 526.4,146.3 528.4,146.6 528.3,148.0 530.6,147.0 530.8,147.5 529.4,148.9 529.4,150.1 530.4,150.8 530.0,153.2 528.2,154.6 528.7,156.2 530.2,156.2 530.9,157.5 531.9,158.0 531.8,160.1 530.4,160.9 529.5,161.8 527.6,162.8 527.9,164.0 527.7,165.2 526.3,165.8Z",
  "cx": 527.3,
  "cy": 155.5,
  "n": "튀니지",
  "ct": "아프리카",
  "cap": "Tunis",
  "fl": "🇹🇳",
  "lang": "Arabic",
  "cur": "Tunisian dinar",
  "bb": [520.9, 146.3, 531.9, 165.8],
  "ci": [{
    "n": "Tunis",
    "x": 528.3,
    "y": 147.8,
    "c": 1
  }, {
    "n": "Sfax",
    "x": 529.9,
    "y": 153.5,
    "c": 0
  }, {
    "n": "Sousse",
    "x": 529.6,
    "y": 150.5,
    "c": 0
  }, {
    "n": "Midoun",
    "x": 530.5,
    "y": 156.1,
    "c": 0
  }, {
    "n": "Kairouan",
    "x": 528.1,
    "y": 150.9,
    "c": 0
  }, {
    "n": "Bizerte",
    "x": 527.4,
    "y": 146.5,
    "c": 0
  }, {
    "n": "Gabes",
    "x": 528.1,
    "y": 155.9,
    "c": 0
  }, {
    "n": "Kasserine",
    "x": 524.5,
    "y": 152.3,
    "c": 0
  }, {
    "n": "Gafsa",
    "x": 524.4,
    "y": 154.4,
    "c": 0
  }],
  "lat": 34,
  "lng": 9,
  "area": 163610,
  "areaR": 94,
  "pop": 12277109,
  "popR": 79,
  "gdp": 48529595417,
  "gdpR": 94,
  "pc": 3953,
  "lvl": "중하위 소득"
}, {
  "i": "TTO",
  "en": "Trinidad and Tobago",
  "d": "M328.7,220.1 330.3,219.8 330.8,219.8 330.7,221.9 328.4,222.2 327.9,222.0 328.7,221.2 328.7,220.1Z",
  "cx": 329.3,
  "cy": 220.9,
  "n": "트리니다드 토바고",
  "ct": "북아메리카",
  "cap": "Port of Spain",
  "fl": "🇹🇹",
  "lang": "English",
  "cur": "Trinidad and Tobago dollar",
  "bb": [327.9, 219.8, 330.8, 222.2],
  "ci": [],
  "lat": 11,
  "lng": -61,
  "area": 5130,
  "areaR": 175,
  "pop": 1368333,
  "popR": 155,
  "gdp": 28139944790,
  "gdpR": 112,
  "pc": 20565,
  "lvl": "고소득"
}, {
  "i": "PAN",
  "en": "Panama",
  "d": "M283.7,229.9 282.7,229.1 282.1,227.6 282.8,226.9 282.1,226.7 281.6,225.8 280.2,225.0 279.0,225.2 278.4,226.2 277.3,226.9 276.7,226.9 276.4,227.5 277.8,229.0 277.0,229.4 276.6,229.8 275.3,229.9 274.8,228.3 274.5,228.8 273.6,228.6 273.0,227.5 271.9,227.3 271.1,227.0 269.9,227.0 269.9,227.6 269.5,227.2 269.7,226.6 269.9,226.0 269.8,225.5 270.2,225.2 269.6,224.8 269.6,223.7 270.7,223.4 271.7,224.4 271.6,225.0 272.8,225.1 273.0,224.9 273.8,225.6 275.1,225.4 276.3,224.7 278.0,224.1 279.0,223.3 280.5,223.5 280.4,223.7 281.9,223.8 283.2,224.3 284.1,225.1 285.1,225.9 284.8,226.3 285.4,228.0 284.9,228.8 284.0,228.6 283.7,229.9Z",
  "cx": 276.9,
  "cy": 226.5,
  "n": "파나마",
  "ct": "북아메리카",
  "cap": "Panama City",
  "fl": "🇵🇦",
  "lang": "Spanish",
  "cur": "Panamanian balboa",
  "bb": [269.5, 223.3, 285.4, 229.9],
  "ci": [{
    "n": "Panama",
    "x": 279.1,
    "y": 225.1,
    "c": 0
  }, {
    "n": "San Miguelito",
    "x": 279.2,
    "y": 224.9,
    "c": 0
  }, {
    "n": "Tocumen",
    "x": 279.5,
    "y": 224.8,
    "c": 0
  }, {
    "n": "David",
    "x": 271.0,
    "y": 226.6,
    "c": 0
  }, {
    "n": "Arraijan",
    "x": 278.7,
    "y": 225.1,
    "c": 0
  }, {
    "n": "Colon",
    "x": 278.1,
    "y": 224.0,
    "c": 0
  }, {
    "n": "Las Cumbres",
    "x": 279.1,
    "y": 224.8,
    "c": 0
  }, {
    "n": "La Chorrera",
    "x": 278.4,
    "y": 225.3,
    "c": 0
  }, {
    "n": "Pacora",
    "x": 279.8,
    "y": 224.8,
    "c": 0
  }],
  "lat": 9,
  "lng": -80,
  "area": 75417,
  "areaR": 120,
  "pop": 4515577,
  "popR": 128,
  "gdp": 83382400000,
  "gdpR": 77,
  "pc": 18466,
  "lvl": "고소득"
}, {
  "i": "PRY",
  "en": "Paraguay",
  "d": "M325.9,311.8 327.0,308.5 327.0,307.0 328.4,304.5 333.2,303.7 335.8,303.8 338.4,305.2 338.4,306.0 339.2,307.6 339.1,311.4 342.0,311.9 343.1,311.4 345.0,312.1 345.5,312.9 345.8,315.5 346.1,316.5 347.1,316.7 348.2,316.2 349.2,316.7 349.2,318.3 348.8,319.9 348.3,321.5 347.8,323.9 345.3,326.1 343.1,326.5 340.0,326.1 337.2,325.3 339.9,321.1 339.5,319.9 336.6,318.8 333.3,316.8 331.0,316.3 325.9,311.8Z",
  "cx": 339.7,
  "cy": 314.9,
  "n": "파라과이",
  "ct": "남아메리카",
  "cap": "Asunción",
  "fl": "🇵🇾",
  "lang": "Guaraní, Spanish",
  "cur": "Paraguayan guaraní",
  "bb": [325.9, 303.7, 349.2, 326.5],
  "ci": [{
    "n": "Asuncion",
    "x": 339.8,
    "y": 320.2,
    "c": 0
  }, {
    "n": "San Lorenzo",
    "x": 340.2,
    "y": 320.4,
    "c": 0
  }, {
    "n": "Capiata",
    "x": 340.5,
    "y": 320.4,
    "c": 0
  }, {
    "n": "Lambare",
    "x": 339.9,
    "y": 320.4,
    "c": 0
  }, {
    "n": "Fernando de la Mora",
    "x": 340.0,
    "y": 320.3,
    "c": 0
  }, {
    "n": "Limpio",
    "x": 340.2,
    "y": 320.0,
    "c": 0
  }, {
    "n": "Nemby",
    "x": 340.0,
    "y": 320.5,
    "c": 0
  }, {
    "n": "Encarnacion",
    "x": 344.7,
    "y": 325.9,
    "c": 0
  }, {
    "n": "Colonia Mariano Roque Alonso",
    "x": 340.1,
    "y": 319.9,
    "c": 0
  }],
  "lat": -23,
  "lng": -58,
  "area": 406752,
  "areaR": 61,
  "pop": 6929153,
  "popR": 107,
  "gdp": 42956263544,
  "gdpR": 100,
  "pc": 6199,
  "lvl": "중상위 소득"
}, {
  "i": "PAK",
  "en": "Pakistan",
  "d": "M708.8,146.9 710.8,148.1 711.6,150.3 716.2,151.4 713.5,153.7 710.4,154.2 706.2,153.5 704.9,154.7 705.8,157.1 706.8,159.0 709.1,160.4 706.7,162.0 706.7,163.9 704.0,166.7 702.3,169.6 699.4,172.5 696.2,172.3 693.1,175.2 694.9,176.4 695.2,178.5 696.8,180.0 697.3,182.3 691.2,182.3 689.4,184.2 687.3,183.5 686.5,181.5 684.4,179.4 679.3,179.9 674.7,179.9 670.8,180.3 671.9,177.1 675.9,175.7 675.6,174.4 674.3,173.9 674.2,171.5 671.6,170.3 670.5,168.6 669.1,167.1 673.7,168.6 676.5,168.1 678.2,168.5 678.8,167.9 680.7,168.1 684.3,167.0 684.4,164.6 685.9,163.0 688.0,163.0 688.3,162.3 690.4,161.9 691.5,162.2 692.5,161.4 692.4,159.7 693.6,158.0 695.3,157.3 694.3,155.5 696.9,155.6 697.7,154.6 697.5,153.5 698.9,152.4 698.6,151.0 698.0,149.8 699.6,148.6 702.6,148.0 705.7,147.7 707.2,147.2 708.8,146.9Z",
  "cx": 692.8,
  "cy": 164.4,
  "n": "파키스탄",
  "ct": "아시아",
  "cap": "Islamabad",
  "fl": "🇵🇰",
  "lang": "English, Urdu",
  "cur": "Pakistani rupee",
  "bb": [669.1, 146.9, 716.2, 184.2],
  "ci": [{
    "n": "Karachi",
    "x": 686.3,
    "y": 180.9,
    "c": 0
  }, {
    "n": "Lahore",
    "x": 706.5,
    "y": 162.4,
    "c": 0
  }, {
    "n": "Faisalabad",
    "x": 703.0,
    "y": 162.7,
    "c": 0
  }, {
    "n": "Rawalpindi",
    "x": 703.0,
    "y": 156.7,
    "c": 0
  }, {
    "n": "Multan",
    "x": 698.5,
    "y": 166.1,
    "c": 0
  }, {
    "n": "Hyderabad",
    "x": 689.9,
    "y": 179.5,
    "c": 0
  }, {
    "n": "Gujranwala",
    "x": 706.1,
    "y": 160.7,
    "c": 0
  }, {
    "n": "Peshawar",
    "x": 698.8,
    "y": 155.5,
    "c": 0
  }, {
    "n": "Quetta",
    "x": 686.1,
    "y": 166.1,
    "c": 0
  }],
  "lat": 30,
  "lng": 70,
  "area": 881912,
  "areaR": 35,
  "pop": 251269164,
  "popR": 5,
  "gdp": 338368455318,
  "gdpR": 45,
  "pc": 1347,
  "lvl": "중하위 소득"
}, {
  "i": "PNG",
  "en": "Papua New Guinea",
  "d": "M933.0,268.9 932.2,269.2 931.0,268.2 929.8,266.4 929.2,264.3 929.6,264.0 929.9,264.8 930.7,265.5 932.1,267.2 933.4,268.2 933.0,268.9Z M922.2,265.2 920.7,265.4 920.3,266.2 918.8,266.9 917.3,267.5 915.9,267.5 913.6,266.7 912.0,266.0 912.2,265.1 914.7,265.5 916.2,265.3 916.7,264.0 917.1,263.9 917.3,265.4 918.9,265.2 919.7,264.2 921.2,263.2 920.9,261.6 922.6,261.5 923.2,262.0 923.1,263.5 922.2,265.2Z M908.9,270.5 911.3,272.3 913.2,275.3 914.7,275.2 914.6,276.4 916.8,276.9 915.9,277.4 918.9,278.6 918.6,279.4 916.7,279.6 916.1,278.9 913.7,278.6 910.9,278.1 908.7,276.4 907.1,274.8 905.7,272.4 902.1,271.2 899.7,272.0 898.0,272.9 898.4,275.0 896.2,275.9 894.6,275.4 891.8,275.3 891.7,266.3 891.7,257.2 896.5,259.1 901.6,260.7 903.5,262.1 905.1,263.5 905.5,265.2 910.1,266.9 910.8,268.4 908.3,268.7 908.9,270.5Z M925.4,262.5 924.5,263.2 924.0,261.6 923.4,260.5 922.1,259.6 920.5,258.4 918.5,257.6 919.3,256.9 920.8,257.7 921.7,258.3 922.9,259.0 924.0,260.2 925.1,261.1 925.4,262.5Z",
  "cx": 916.0,
  "cy": 267.3,
  "n": "파푸아뉴기니",
  "ct": "오세아니아",
  "cap": "Port Moresby",
  "fl": "🇵🇬",
  "lang": "English, Hiri Motu",
  "cur": "Papua New Guinean kina",
  "bb": [891.7, 256.9, 933.4, 279.6],
  "ci": [{
    "n": "Port Moresby",
    "x": 908.9,
    "y": 276.3,
    "c": 1
  }, {
    "n": "Lae",
    "x": 908.3,
    "y": 268.7,
    "c": 0
  }, {
    "n": "Arawa",
    "x": 932.1,
    "y": 267.3,
    "c": 0
  }, {
    "n": "Mount Hagen",
    "x": 900.6,
    "y": 266.3,
    "c": 0
  }, {
    "n": "Popondetta",
    "x": 911.8,
    "y": 274.4,
    "c": 0
  }, {
    "n": "Madang",
    "x": 905.0,
    "y": 264.5,
    "c": 0
  }, {
    "n": "Kokopo",
    "x": 923.0,
    "y": 262.1,
    "c": 0
  }, {
    "n": "Mendi",
    "x": 899.0,
    "y": 267.1,
    "c": 0
  }, {
    "n": "Kimbe",
    "x": 917.1,
    "y": 265.4,
    "c": 0
  }],
  "lat": -6,
  "lng": 147,
  "area": 462840,
  "areaR": 56,
  "pop": 10576502,
  "popR": 91,
  "gdp": 30932496250,
  "gdpR": 109,
  "pc": 2925,
  "lvl": "중하위 소득"
}, {
  "i": "PSE",
  "en": "West Bank",
  "d": "M598.7,160.0 598.7,161.7 598.3,162.5 597.0,162.9 597.1,162.2 597.8,161.8 597.2,161.5 597.7,159.6 598.7,160.0Z",
  "cx": 597.9,
  "cy": 161.4,
  "n": "팔레스타인",
  "ct": "아시아",
  "cap": "Ramallah",
  "fl": "🇵🇸",
  "lang": "Arabic",
  "cur": "Egyptian pound",
  "bb": [597.0, 159.6, 598.7, 162.9],
  "ci": [],
  "lat": 31.9,
  "lng": 35.2,
  "area": 6220,
  "areaR": 173,
  "pop": 5289152,
  "popR": 122,
  "gdp": 17396300000,
  "gdpR": 131,
  "pc": 3289,
  "lvl": "중하위 소득"
}, {
  "i": "PER",
  "en": "Peru",
  "d": "M306.7,298.8 305.9,300.3 304.5,301.0 301.7,299.4 301.5,298.2 296.0,295.4 291.0,292.4 288.9,290.7 287.7,288.4 288.2,287.6 285.8,284.0 283.1,278.8 280.5,273.3 279.3,272.0 278.4,270.0 276.3,268.2 274.3,267.0 275.2,265.8 273.9,263.2 274.7,261.2 276.9,259.5 277.3,260.6 276.5,261.3 276.5,262.3 277.7,262.1 278.8,262.4 280.0,263.8 281.6,262.6 282.1,260.8 283.8,258.3 287.1,257.2 290.2,254.3 291.0,252.5 290.6,250.4 291.4,250.2 293.2,251.5 294.1,252.8 295.4,253.5 297.0,256.4 299.1,256.8 300.6,256.0 301.6,256.5 303.3,256.3 305.4,257.6 303.6,260.4 304.5,260.5 305.9,261.9 303.3,261.8 303.0,262.2 300.7,262.8 297.5,264.7 297.3,265.9 296.6,266.9 296.9,268.4 295.2,269.2 295.2,270.4 294.5,270.9 295.6,273.4 297.2,275.1 296.6,276.3 298.4,276.4 299.5,277.9 301.9,278.0 304.2,276.4 304.0,280.6 305.3,280.9 306.9,280.4 309.3,284.9 308.7,285.8 308.5,287.8 308.5,290.1 307.4,291.5 307.9,292.6 307.3,293.5 308.4,295.8 306.7,298.8Z",
  "cx": 294.2,
  "cy": 272.0,
  "n": "페루",
  "ct": "남아메리카",
  "cap": "Lima",
  "fl": "🇵🇪",
  "lang": "Aymara, Quechua",
  "cur": "Peruvian sol",
  "bb": [273.9, 250.2, 309.3, 301.0],
  "ci": [{
    "n": "Lima",
    "x": 286.0,
    "y": 283.5,
    "c": 1
  }, {
    "n": "Arequipa",
    "x": 301.3,
    "y": 295.6,
    "c": 0
  }, {
    "n": "Callao",
    "x": 285.7,
    "y": 283.5,
    "c": 0
  }, {
    "n": "Trujillo",
    "x": 280.5,
    "y": 272.5,
    "c": 0
  }, {
    "n": "Chiclayo",
    "x": 278.2,
    "y": 268.8,
    "c": 0
  }, {
    "n": "Iquitos",
    "x": 296.5,
    "y": 260.4,
    "c": 0
  }, {
    "n": "Huancayo",
    "x": 291.0,
    "y": 283.5,
    "c": 0
  }, {
    "n": "Piura",
    "x": 276.0,
    "y": 264.4,
    "c": 0
  }, {
    "n": "Chimbote",
    "x": 281.7,
    "y": 275.2,
    "c": 0
  }],
  "lat": -10,
  "lng": -76,
  "area": 1285216,
  "areaR": 21,
  "pop": 34217848,
  "popR": 48,
  "gdp": 267603248655,
  "gdpR": 50,
  "pc": 7821,
  "lvl": "중상위 소득"
}, {
  "i": "PRT",
  "en": "Portugal",
  "d": "M474.9,133.7 475.9,133.0 477.0,132.6 477.7,133.9 479.4,133.9 479.9,133.6 481.5,133.7 482.3,135.1 481.0,135.8 480.9,138.0 480.5,138.4 480.4,139.7 479.2,139.9 480.3,141.6 479.5,143.4 480.5,144.2 480.1,145.0 479.1,146.0 479.3,147.0 478.2,147.7 476.7,147.3 475.3,147.6 475.7,145.4 475.4,143.7 474.2,143.4 473.5,142.4 473.8,140.6 474.9,139.6 475.1,138.4 475.6,136.8 475.6,135.6 475.0,134.6 474.9,133.7Z",
  "cx": 477.7,
  "cy": 139.6,
  "n": "포르투갈",
  "ct": "유럽",
  "cap": "Lisbon",
  "fl": "🇵🇹",
  "lang": "Portuguese",
  "cur": "Euro",
  "bb": [473.5, 132.6, 482.3, 147.7],
  "ci": [{
    "n": "Lisbon",
    "x": 474.6,
    "y": 142.5,
    "c": 1
  }, {
    "n": "Porto",
    "x": 476.1,
    "y": 135.7,
    "c": 0
  }, {
    "n": "Amadora",
    "x": 474.4,
    "y": 142.4,
    "c": 0
  }, {
    "n": "Braga",
    "x": 476.6,
    "y": 134.6,
    "c": 0
  }, {
    "n": "Setubal",
    "x": 475.3,
    "y": 143.0,
    "c": 0
  }, {
    "n": "Coimbra",
    "x": 476.6,
    "y": 138.3,
    "c": 0
  }, {
    "n": "Queluz",
    "x": 474.3,
    "y": 142.4,
    "c": 0
  }, {
    "n": "Funchal",
    "x": 453.1,
    "y": 159.4,
    "c": 0
  }, {
    "n": "Cacem",
    "x": 474.2,
    "y": 142.3,
    "c": 0
  }],
  "lat": 39.5,
  "lng": -8,
  "area": 92090,
  "areaR": 112,
  "pop": 10694681,
  "popR": 89,
  "gdp": 287080013574,
  "gdpR": 49,
  "pc": 26843,
  "lvl": "고소득"
}, {
  "i": "FLK",
  "en": "Falkland Islands",
  "d": "M330.0,394.0 333.3,392.4 335.7,393.1 337.4,391.9 339.6,393.2 338.8,394.2 335.0,395.0 333.8,394.0 331.4,395.3 330.0,394.0Z",
  "cx": 334.5,
  "cy": 393.7,
  "n": "포클랜드 제도",
  "ct": "남아메리카",
  "cap": "Stanley",
  "fl": "🇫🇰",
  "lang": "English",
  "cur": "Falkland Islands pound",
  "bb": [330.0, 391.9, 339.6, 395.3],
  "ci": [],
  "lat": -51.8,
  "lng": -59,
  "area": 12173,
  "areaR": 164,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "POL",
  "en": "Poland",
  "d": "M541.7,108.0 540.6,106.3 540.8,105.3 540.1,103.8 539.1,102.8 539.9,102.1 539.2,100.7 541.1,99.9 545.5,98.6 549.0,97.6 551.7,98.1 551.9,98.8 554.6,98.8 558.0,99.1 563.1,99.1 564.6,99.4 565.2,100.2 565.4,101.5 566.1,102.5 566.1,103.6 564.4,104.2 565.3,105.5 565.4,106.7 566.7,109.2 566.5,109.9 565.1,110.3 562.6,112.6 563.3,113.8 562.7,113.7 560.0,112.6 558.0,113.0 556.7,112.7 555.1,113.3 553.7,112.3 552.5,112.7 552.4,112.5 551.1,111.1 549.0,111.0 548.8,110.1 546.9,109.8 546.4,110.5 544.9,109.9 545.1,109.2 543.0,108.9 541.7,108.0Z",
  "cx": 553.6,
  "cy": 106.4,
  "n": "폴란드",
  "ct": "유럽",
  "cap": "Warsaw",
  "fl": "🇵🇱",
  "lang": "Polish",
  "cur": "Polish złoty",
  "bb": [539.1, 97.6, 566.7, 113.8],
  "ci": [{
    "n": "Warsaw",
    "x": 558.3,
    "y": 104.9,
    "c": 1
  }, {
    "n": "Lodz",
    "x": 554.1,
    "y": 106.2,
    "c": 0
  }, {
    "n": "Krakow",
    "x": 555.3,
    "y": 110.9,
    "c": 0
  }, {
    "n": "Wroclaw",
    "x": 547.3,
    "y": 108.1,
    "c": 0
  }, {
    "n": "Poznan",
    "x": 547.1,
    "y": 104.4,
    "c": 0
  }, {
    "n": "Gdansk",
    "x": 551.9,
    "y": 99.0,
    "c": 0
  }, {
    "n": "Szczecin",
    "x": 540.4,
    "y": 101.6,
    "c": 0
  }, {
    "n": "Bydgoszcz",
    "x": 550.0,
    "y": 102.4,
    "c": 0
  }, {
    "n": "Lublin",
    "x": 562.7,
    "y": 107.6,
    "c": 0
  }],
  "lat": 52,
  "lng": 20,
  "area": 312679,
  "areaR": 72,
  "pop": 36559233,
  "popR": 42,
  "gdp": 811229100688,
  "gdpR": 21,
  "pc": 22189,
  "lvl": "고소득"
}, {
  "i": "PRI",
  "en": "Puerto Rico",
  "d": "M315.9,198.6 317.3,198.8 317.8,199.4 317.1,200.1 315.0,200.1 313.4,200.1 313.2,199.0 313.6,198.6 315.9,198.6Z",
  "cx": 315.5,
  "cy": 199.3,
  "n": "푸에르토리코",
  "ct": "북아메리카",
  "cap": "San Juan",
  "fl": "🇵🇷",
  "lang": "English, Spanish",
  "cur": "United States dollar",
  "bb": [313.2, 198.6, 317.8, 200.1],
  "ci": [],
  "lat": 18.2,
  "lng": -66.5,
  "area": 8870,
  "areaR": 171,
  "pop": 3203295,
  "popR": 134,
  "gdp": 117902300000,
  "gdpR": 65,
  "pc": 36807,
  "lvl": "고소득"
}, {
  "i": "FRA",
  "en": "France",
  "d": "M526.6,132.9 525.6,135.1 524.4,134.5 523.7,132.6 524.3,131.6 526.1,130.5 526.6,132.9Z M510.0,110.1 511.9,111.4 513.3,111.2 515.8,112.4 516.4,112.7 517.2,112.6 518.5,113.3 522.5,113.8 521.1,115.7 520.7,117.7 520.0,118.2 518.7,117.9 518.8,118.6 516.8,120.2 516.7,121.5 518.1,121.0 519.0,122.2 518.9,123.0 519.7,124.1 518.7,124.9 519.5,127.1 521.0,127.4 520.7,128.6 518.1,130.2 512.7,129.4 508.6,130.3 508.3,132.0 505.1,132.4 501.9,131.1 500.9,131.7 495.8,130.5 494.7,129.4 496.2,127.7 496.7,122.2 493.8,119.3 491.8,117.9 487.5,116.8 487.2,114.8 490.8,114.2 495.5,114.9 494.6,111.7 497.3,112.9 503.7,110.8 504.6,108.5 507.0,107.9 507.4,108.9 508.7,108.9 510.0,110.1Z",
  "cx": 511.1,
  "cy": 121.1,
  "n": "프랑스",
  "ct": "유럽",
  "cap": "Paris",
  "fl": "🇫🇷",
  "lang": "French",
  "cur": "Euro",
  "bb": [487.2, 107.9, 526.6, 135.1],
  "ci": [{
    "n": "Paris",
    "x": 506.5,
    "y": 114.3,
    "c": 1
  }, {
    "n": "Marseille",
    "x": 515.0,
    "y": 129.7,
    "c": 0
  }, {
    "n": "Lyon",
    "x": 513.5,
    "y": 122.9,
    "c": 0
  }, {
    "n": "Toulouse",
    "x": 504.0,
    "y": 128.9,
    "c": 0
  }, {
    "n": "Nice",
    "x": 520.2,
    "y": 128.6,
    "c": 0
  }, {
    "n": "Nantes",
    "x": 495.7,
    "y": 118.8,
    "c": 0
  }, {
    "n": "Strasbourg",
    "x": 521.5,
    "y": 115.0,
    "c": 0
  }, {
    "n": "Montpellier",
    "x": 510.8,
    "y": 128.9,
    "c": 0
  }, {
    "n": "Bordeaux",
    "x": 498.4,
    "y": 125.5,
    "c": 0
  }],
  "lat": 46,
  "lng": 2,
  "area": 551695,
  "areaR": 50,
  "pop": 68551653,
  "popR": 23,
  "gdp": 3030904089608,
  "gdpR": 7,
  "pc": 44213,
  "lvl": "고소득"
}, {
  "i": "GUF",
  "en": "French Guiana",
  "d": "M354.0,243.0 352.9,244.1 351.6,244.3 351.2,243.5 350.6,243.4 349.8,244.2 348.5,243.6 349.2,242.4 349.5,241.1 350.0,239.9 348.9,238.3 348.7,236.4 350.1,234.0 351.1,234.3 353.1,235.0 356.0,237.3 356.5,238.5 354.9,241.0 354.0,243.0Z",
  "cx": 351.6,
  "cy": 240.4,
  "n": "프랑스령 기아나",
  "ct": "남아메리카",
  "cap": "Cayenne",
  "fl": "🇬🇫",
  "lang": "French",
  "cur": "Euro",
  "bb": [348.5, 234.0, 356.5, 244.3],
  "ci": [],
  "lat": 4,
  "lng": -53,
  "area": 83534,
  "areaR": 118,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "ATF",
  "en": "French Southern and Antarctic Lands",
  "d": "M691.5,385.1 693.3,385.9 695.9,386.3 696.0,386.8 695.2,388.1 691.0,388.3 690.9,386.8 691.3,385.6 691.5,385.1Z",
  "cx": 693.0,
  "cy": 386.4,
  "n": "프랑스령 남부와 남극 지역",
  "ct": "아프리카",
  "cap": "Port-aux-Français",
  "fl": "🇹🇫",
  "lang": "French",
  "cur": "Euro",
  "bb": [690.9, 385.1, 696.0, 388.3],
  "ci": [],
  "lat": -49.2,
  "lng": 69.2,
  "area": 7747,
  "areaR": 172,
  "pop": null,
  "popR": null,
  "gdp": null,
  "gdpR": null,
  "pc": null,
  "lvl": ""
}, {
  "i": "FJI",
  "en": "Fiji",
  "d": "M995.5,298.2 996.4,299.0 996.0,300.4 994.3,300.8 992.7,300.5 992.5,299.2 993.5,298.3 994.8,298.6 995.5,298.2Z M998.2,296.7 996.5,297.3 996.1,296.2 997.5,295.6 998.4,295.5 1000.0,294.6 1000.0,296.0 998.2,296.7Z",
  "cx": 996.2,
  "cy": 297.8,
  "n": "피지",
  "ct": "오세아니아",
  "cap": "Suva",
  "fl": "🇫🇯",
  "lang": "English, Fijian",
  "cur": "Fijian dollar",
  "bb": [992.5, 294.6, 1000.0, 300.8],
  "ci": [{
    "n": "Suva",
    "x": 995.6,
    "y": 300.4,
    "c": 1
  }, {
    "n": "Nandi",
    "x": 992.8,
    "y": 299.4,
    "c": 0
  }, {
    "n": "Lambasa",
    "x": 998.3,
    "y": 295.6,
    "c": 0
  }],
  "lat": -18,
  "lng": 175,
  "area": 18272,
  "areaR": 157,
  "pop": 928784,
  "popR": 160,
  "gdp": 5494797541,
  "gdpR": 166,
  "pc": 5916,
  "lvl": "중상위 소득"
}, {
  "i": "FIN",
  "en": "Finland",
  "d": "M579.4,58.2 579.0,60.1 583.3,61.9 580.7,64.0 583.9,67.2 582.1,69.6 584.6,71.7 583.4,73.5 587.5,75.4 586.5,76.8 583.9,78.4 578.0,81.9 572.9,82.2 568.0,83.2 563.5,83.8 561.9,82.2 559.2,81.3 559.8,78.6 558.5,76.1 559.8,74.5 562.3,72.7 568.7,69.7 570.6,69.1 570.3,68.0 566.4,66.6 565.5,65.6 565.4,61.3 561.1,59.4 557.3,58.0 559.0,57.3 562.1,58.8 565.7,58.6 568.7,59.3 571.4,58.1 572.7,56.0 577.0,55.1 580.6,56.2 579.4,58.2Z",
  "cx": 571.6,
  "cy": 68.1,
  "n": "핀란드",
  "ct": "유럽",
  "cap": "Helsinki",
  "fl": "🇫🇮",
  "lang": "Finnish, Swedish",
  "cur": "Euro",
  "bb": [557.3, 55.1, 587.5, 83.8],
  "ci": [{
    "n": "Helsinki",
    "x": 569.3,
    "y": 82.8,
    "c": 1
  }, {
    "n": "Espoo",
    "x": 568.5,
    "y": 82.7,
    "c": 0
  }, {
    "n": "Tampere",
    "x": 566.1,
    "y": 79.2,
    "c": 0
  }, {
    "n": "Vantaa",
    "x": 569.5,
    "y": 82.5,
    "c": 0
  }, {
    "n": "Turku",
    "x": 561.9,
    "y": 82.1,
    "c": 0
  }, {
    "n": "Oulu",
    "x": 570.7,
    "y": 69.4,
    "c": 0
  }, {
    "n": "Lahti",
    "x": 571.3,
    "y": 80.6,
    "c": 0
  }, {
    "n": "Kuopio",
    "x": 576.9,
    "y": 75.3,
    "c": 0
  }, {
    "n": "Jyvaskyla",
    "x": 571.5,
    "y": 77.1,
    "c": 0
  }],
  "lat": 64,
  "lng": 26,
  "area": 338424,
  "areaR": 67,
  "pop": 5619911,
  "popR": 116,
  "gdp": 300187202696,
  "gdpR": 48,
  "pc": 53415,
  "lvl": "고소득"
}, {
  "i": "PHL",
  "en": "Philippines",
  "d": "M851.0,226.6 851.3,228.5 851.5,230.0 850.5,232.6 849.5,229.7 848.2,231.1 849.1,233.2 848.3,234.5 845.1,232.9 844.3,230.9 845.1,229.6 843.4,228.2 842.5,229.4 841.2,229.3 839.1,230.8 838.7,230.0 839.8,227.7 841.5,226.9 843.0,225.9 844.0,227.1 846.1,226.3 846.6,225.1 848.5,225.0 848.4,222.9 850.6,224.2 850.9,225.6 851.0,226.6Z M844.4,221.4 843.4,222.4 842.5,224.1 841.7,224.9 839.9,223.0 840.5,222.3 841.2,221.5 841.5,219.8 843.1,219.6 842.6,221.5 844.7,218.8 844.4,221.4Z M829.2,224.1 825.5,226.8 826.8,224.8 828.9,223.1 830.5,221.2 832.0,218.4 832.5,220.7 830.6,222.2 829.2,224.1Z M838.6,217.0 840.2,217.8 842.0,217.8 841.9,219.0 840.7,220.2 838.9,221.0 838.8,219.7 839.0,218.3 838.6,217.0Z M848.6,216.2 849.4,219.3 847.3,218.6 847.3,219.5 848.0,221.2 846.7,221.8 846.6,219.9 845.7,219.8 845.3,218.1 846.9,218.3 846.9,217.2 845.2,215.1 847.9,215.2 848.6,216.2Z M837.6,213.7 836.8,216.1 835.6,214.7 834.2,212.6 836.6,212.7 837.6,213.7Z M837.0,198.6 838.7,199.4 839.6,198.7 839.8,199.4 839.4,200.5 840.3,202.5 839.6,204.8 838.0,205.7 837.5,208.0 838.1,210.2 839.6,210.5 840.8,210.2 844.3,211.7 844.0,213.2 844.9,213.9 844.7,215.2 842.5,213.8 841.5,212.4 840.8,213.4 839.0,211.7 836.5,212.1 835.1,211.5 835.2,210.4 836.1,209.7 835.3,209.0 834.9,210.0 833.5,208.4 833.1,207.2 833.0,204.5 834.1,205.5 834.4,201.1 835.3,198.6 837.0,198.6Z",
  "cx": 841.1,
  "cy": 218.0,
  "n": "필리핀",
  "ct": "아시아",
  "cap": "Manila",
  "fl": "🇵🇭",
  "lang": "English, Filipino",
  "cur": "Philippine peso",
  "bb": [825.5, 198.6, 851.5, 234.5],
  "ci": [{
    "n": "Manila",
    "x": 836.1,
    "y": 209.4,
    "c": 1
  }, {
    "n": "Davao",
    "x": 848.9,
    "y": 230.4,
    "c": 0
  }, {
    "n": "Cebu City",
    "x": 844.1,
    "y": 221.4,
    "c": 0
  }, {
    "n": "Antipolo",
    "x": 836.6,
    "y": 209.5,
    "c": 0
  }, {
    "n": "Zamboanga",
    "x": 839.1,
    "y": 230.8,
    "c": 0
  }, {
    "n": "Mansilingan",
    "x": 841.6,
    "y": 220.5,
    "c": 0
  }, {
    "n": "Cagayan de Oro",
    "x": 846.2,
    "y": 226.4,
    "c": 0
  }, {
    "n": "Dasmarinas",
    "x": 835.9,
    "y": 210.2,
    "c": 0
  }, {
    "n": "Iloilo",
    "x": 840.5,
    "y": 220.3,
    "c": 0
  }],
  "lat": 13,
  "lng": 122,
  "area": 342353,
  "areaR": 65,
  "pop": 115843670,
  "popR": 14,
  "gdp": 437146372730,
  "gdpR": 34,
  "pc": 3774,
  "lvl": "중하위 소득"
}, {
  "i": "KOR",
  "en": "South Korea",
  "d": "M856.5,142.7 858.9,146.0 859.6,147.8 859.6,151.0 858.6,152.5 856.1,153.1 853.9,154.2 851.3,154.5 851.0,153.0 851.6,150.9 850.3,148.0 852.4,147.5 850.5,145.1 850.7,144.9 851.9,145.0 853.0,143.7 854.9,143.6 856.1,143.4 856.5,142.7Z",
  "cx": 854.4,
  "cy": 147.9,
  "n": "한국",
  "ct": "아시아",
  "cap": "Seoul",
  "fl": "🇰🇷",
  "lang": "Korean",
  "cur": "South Korean won",
  "bb": [850.3, 142.7, 859.6, 154.5],
  "ci": [{
    "n": "Seoul",
    "x": 852.8,
    "y": 145.6,
    "c": 1
  }, {
    "n": "Pusan",
    "x": 858.4,
    "y": 152.5,
    "c": 0
  }, {
    "n": "Taegu",
    "x": 857.2,
    "y": 150.4,
    "c": 0
  }, {
    "n": "Taejon",
    "x": 853.9,
    "y": 149.1,
    "c": 0
  }, {
    "n": "Kwangju",
    "x": 852.5,
    "y": 152.3,
    "c": 0
  }, {
    "n": "Suwon",
    "x": 852.8,
    "y": 146.4,
    "c": 0
  }, {
    "n": "Songnam",
    "x": 853.2,
    "y": 146.0,
    "c": 0
  }, {
    "n": "Ulsan",
    "x": 859.2,
    "y": 151.3,
    "c": 0
  }, {
    "n": "Chonju",
    "x": 853.2,
    "y": 150.5,
    "c": 0
  }],
  "lat": 37,
  "lng": 127.5,
  "area": 100210,
  "areaR": 110,
  "pop": 51751065,
  "popR": 29,
  "gdp": 1712792854202,
  "gdpR": 14,
  "pc": 33097,
  "lvl": "고소득"
}, {
  "i": "HUN",
  "en": "Hungary",
  "d": "M545.0,119.9 545.9,118.1 545.4,117.5 547.0,117.5 547.2,116.3 548.6,117.0 549.6,117.3 551.9,117.0 552.2,116.4 553.3,116.4 554.6,115.9 554.9,116.1 556.2,115.8 556.9,115.1 557.8,114.9 560.8,115.8 561.3,115.5 562.9,116.2 563.1,117.0 561.4,117.6 560.1,119.5 558.4,121.3 556.2,121.9 554.4,121.7 552.3,122.5 551.3,122.9 549.0,122.4 546.9,121.2 546.0,120.8 545.5,119.9 545.0,119.9Z",
  "cx": 552.9,
  "cy": 118.3,
  "n": "헝가리",
  "ct": "유럽",
  "cap": "Budapest",
  "fl": "🇭🇺",
  "lang": "Hungarian",
  "cur": "Hungarian forint",
  "bb": [545.0, 114.9, 563.1, 122.9],
  "ci": [{
    "n": "Budapest",
    "x": 553.0,
    "y": 118.1,
    "c": 1
  }, {
    "n": "Debrecen",
    "x": 560.1,
    "y": 118.0,
    "c": 0
  }, {
    "n": "Miskolc",
    "x": 557.7,
    "y": 116.4,
    "c": 0
  }, {
    "n": "Szeged",
    "x": 556.0,
    "y": 121.5,
    "c": 0
  }, {
    "n": "Pecs",
    "x": 550.6,
    "y": 122.0,
    "c": 0
  }, {
    "n": "Gyor",
    "x": 549.0,
    "y": 117.5,
    "c": 0
  }, {
    "n": "Nyiregyhaza",
    "x": 560.3,
    "y": 116.8,
    "c": 0
  }, {
    "n": "Kecskemet",
    "x": 554.7,
    "y": 119.7,
    "c": 0
  }, {
    "n": "Szekesfehervar",
    "x": 551.1,
    "y": 118.9,
    "c": 0
  }],
  "lat": 47,
  "lng": 20,
  "area": 93028,
  "areaR": 111,
  "pop": 9562065,
  "popR": 96,
  "gdp": 212388906459,
  "gdpR": 57,
  "pc": 22212,
  "lvl": "고소득"
}, {
  "i": "AUS",
  "en": "Australia",
  "d": "M903.9,363.3 906.6,364.3 908.1,363.9 910.2,363.4 911.9,363.5 912.1,366.8 911.2,367.8 910.9,370.0 909.9,369.3 908.0,371.2 907.4,371.1 905.7,371.0 904.0,368.6 903.6,366.8 902.0,364.3 902.1,363.1 903.9,363.3Z M898.8,288.2 899.8,290.4 901.6,289.4 902.5,290.5 903.8,291.6 903.5,292.9 904.1,295.2 904.5,296.6 905.2,297.0 906.0,299.3 905.7,300.8 906.6,302.7 909.6,304.1 911.6,305.4 913.5,306.6 913.1,307.3 914.7,309.1 915.8,312.1 916.9,311.5 918.0,312.7 918.7,312.2 919.2,315.2 921.1,316.9 922.4,317.9 924.6,320.2 925.4,322.4 925.4,324.0 925.3,325.7 926.6,328.1 926.4,330.5 925.9,331.8 925.2,334.3 925.2,335.9 924.7,337.9 923.5,340.4 921.4,341.8 920.4,343.9 919.5,345.3 918.7,347.7 917.6,349.1 916.9,351.2 916.5,353.1 916.7,354.0 915.1,354.9 912.0,355.0 909.4,356.2 908.1,357.2 906.4,358.4 904.1,357.2 902.4,356.7 902.9,355.3 901.3,355.8 898.9,357.8 896.5,357.1 894.9,356.6 893.4,356.4 890.7,355.6 888.9,353.9 888.4,351.8 887.7,350.4 886.3,349.3 883.7,348.9 884.6,347.6 883.9,345.5 882.6,347.4 880.1,347.9 881.5,346.4 882.0,344.8 883.0,343.4 882.8,341.4 880.5,343.8 878.8,344.7 877.7,346.9 875.6,345.8 875.7,344.3 873.9,342.3 872.5,341.2 873.0,340.6 869.4,338.9 867.5,338.8 864.8,337.5 859.8,337.8 856.2,338.7 853.1,339.7 850.4,339.5 847.5,340.9 845.1,341.6 844.5,343.0 843.5,344.1 841.1,344.2 839.4,344.5 836.9,343.9 834.9,344.3 833.0,344.4 831.4,345.9 830.6,345.7 829.2,346.5 827.8,347.4 825.8,347.3 824.0,347.3 821.0,345.5 819.5,345.0 819.6,343.4 821.0,343.0 821.4,342.4 821.3,341.4 821.7,339.5 821.4,337.8 819.9,335.0 819.4,333.4 819.6,331.8 818.4,330.0 818.4,329.2 817.1,328.1 816.8,325.9 815.2,323.7 814.8,322.5 816.1,323.7 815.1,321.2 816.5,322.0 817.3,323.1 817.3,321.6 815.9,319.4 815.6,318.6 815.0,317.7 815.3,316.1 815.9,315.4 816.2,314.1 815.9,312.4 817.1,310.4 817.3,312.5 818.5,310.6 820.7,309.7 822.1,308.5 824.2,307.5 825.5,307.3 826.2,307.6 828.4,306.6 830.1,306.3 830.5,305.7 831.3,305.4 832.8,305.5 835.7,304.7 837.2,303.4 837.9,302.0 839.6,300.5 839.7,299.4 839.8,297.9 841.7,295.6 842.9,298.0 844.1,297.4 843.1,296.1 843.9,294.8 845.2,295.4 845.5,293.2 847.0,291.9 847.7,290.8 849.1,290.3 849.1,289.5 850.3,289.9 850.4,289.2 851.6,288.8 853.0,288.4 855.0,289.7 856.6,291.3 858.3,291.3 860.1,291.6 859.5,290.1 860.8,287.8 862.1,287.1 861.6,286.4 862.8,284.8 864.5,283.8 865.9,284.2 868.3,283.7 868.2,282.2 866.2,281.3 867.7,280.9 869.5,281.6 871.0,282.7 873.3,283.5 874.1,283.2 875.8,284.0 877.5,283.2 878.5,283.5 879.1,282.9 880.4,284.3 879.7,285.8 878.6,286.9 877.7,287.0 878.0,288.1 877.2,289.5 876.2,290.9 876.4,291.7 878.6,293.2 880.7,294.1 882.2,295.0 884.2,296.7 885.0,296.7 886.4,297.4 886.8,298.3 889.5,299.2 891.3,298.2 891.9,296.8 892.4,295.5 892.8,294.0 893.6,291.8 893.2,290.4 893.4,289.6 893.1,288.1 893.5,286.0 894.0,285.4 893.6,284.5 894.2,283.0 894.8,281.5 894.8,280.7 895.9,279.6 896.7,281.0 896.9,282.7 897.5,283.1 897.7,284.2 898.7,285.7 898.9,287.2 898.8,288.2Z",
  "cx": 872.9,
  "cy": 319.5,
  "n": "호주",
  "ct": "오세아니아",
  "cap": "Canberra",
  "fl": "🇦🇺",
  "lang": "English",
  "cur": "Australian dollar",
  "bb": [814.8, 279.6, 926.6, 371.2],
  "ci": [{
    "n": "Sydney",
    "x": 920.0,
    "y": 344.1,
    "c": 0
  }, {
    "n": "Melbourne",
    "x": 902.7,
    "y": 355.0,
    "c": 0
  }, {
    "n": "Perth",
    "x": 821.8,
    "y": 338.7,
    "c": 0
  }, {
    "n": "Adelaide",
    "x": 885.0,
    "y": 347.0,
    "c": 0
  }, {
    "n": "Brisbane",
    "x": 925.1,
    "y": 326.3,
    "c": 0
  }, {
    "n": "Gold Coast",
    "x": 926.2,
    "y": 327.8,
    "c": 0
  }, {
    "n": "Newcastle",
    "x": 921.6,
    "y": 341.5,
    "c": 0
  }, {
    "n": "Canberra",
    "x": 914.2,
    "y": 348.0,
    "c": 1
  }, {
    "n": "Wollongong",
    "x": 919.1,
    "y": 345.6,
    "c": 0
  }],
  "lat": -27,
  "lng": 133,
  "area": 7692024,
  "areaR": 7,
  "pop": 27196812,
  "popR": 54,
  "gdp": 1723827215335,
  "gdpR": 13,
  "pc": 63383,
  "lvl": "고소득"
}];
const TOTAL = COUNTRIES.length;
const BY_ID = {};
COUNTRIES.forEach(c => BY_ID[c.i] = c);
const CONT_ORDER = ["아시아", "유럽", "아프리카", "북아메리카", "남아메리카", "오세아니아"];
const CONT_IDS = {};
CONT_ORDER.forEach(k => CONT_IDS[k] = []);
COUNTRIES.forEach(c => CONT_IDS[c.ct] && CONT_IDS[c.ct].push(c.i));
const VIRTUES = ["사랑", "감사", "기쁨", "용기", "겸손", "오래참음", "친절", "믿음", "인내", "소망", "평화", "온유", "절제"];
const WISDOM = ["아이의 질문에 즉답하지 마라. 되물어 스스로 답을 찾게 하라.", "혼내기보다, 잘하는 것을 비춰주어라.", "기다림은 게으름이 아니라, 가장 적극적인 사랑이다.", "엄마의 눈이 머무는 곳에서 아이는 자란다.", "고치려 하지 말고, 다른 문을 열어주어라."];
const LEVELS = [{
  p: 0,
  name: "첫 빛"
}, {
  p: 15,
  name: "등불 든 사람"
}, {
  p: 30,
  name: "오솔길지기"
}, {
  p: 50,
  name: "들판을 밝히는 이"
}, {
  p: 70,
  name: "골짜기를 깨우는 이"
}, {
  p: 90,
  name: "마을을 품은 이"
}, {
  p: 100,
  name: "온 땅을 밝힌 이"
}];
function levelInfo(count) {
  if (count <= 0) return {
    idx: -1,
    name: "아직 어둑한 세계"
  };
  const pct = count / TOTAL * 100;
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (pct >= LEVELS[i].p) idx = i;
  return {
    idx,
    name: LEVELS[idx].name
  };
}
const WC = {
  night: "#0C1230",
  night2: "#141C3C",
  sea: "#0A1028",
  dim: "#212A50",
  dimEdge: "#2C3766",
  gold: "#F2C16B",
  glow: "#FFE3A6",
  peach: "#FF9E6D",
  cream: "#F3EEE3",
  mute: "#9AA3C7",
  sel: "#7FD1F0",
  gem: "#A88BF0",
  todo: "#6FC79A"
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function clampView(v) {
  const s = clamp(v.scale, 1, 8);
  return {
    scale: s,
    tx: clamp(v.tx, 1000 * (1 - s), 0),
    ty: clamp(v.ty, 500 * (1 - s), 0)
  };
}
const pad = n => String(n).padStart(2, "0");
const keyOf = d => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
const todayKey = keyOf(new Date());

// 오늘의 관찰 질문 (고문님: 교육의 본질은 어머니의 관찰). 날짜로 매일 하나씩 로테이션.
const OBS_QUESTIONS = ["아이가 시키지 않았는데 스스로 한 일이 있었나요?", "작게라도 참거나 기다린 순간이 있었나요?", "아이가 \u201c왜?\u201d 하고 궁금해한 게 있었나요?", "누군가를 위하는 모습을 봤나요?", "어제보다 아주 조금이라도 나아진 점이 있었나요?", "아이가 환하게 웃은 순간은 언제였나요?", "끝까지 해낸 작은 일이 있었나요?", "솔직하게 말한 순간이 있었나요?", "혼자 해보려 한 게 있었나요?", "어떤 점이 \u2018이 아이답다\u2019 싶었나요?", "무언가에 푹 빠져 있던 순간이 있었나요?", "약속을 지킨 게 있었나요?", "실수한 뒤 다시 해보려 한 적 있나요?", "양보하거나 배려한 순간이 있었나요?", "엄마를 기쁘게 한 아주 작은 일은?", "새로 해본 것이 있었나요?", "차분했던 순간은 언제였나요?", "스스로 정리하거나 챙긴 게 있었나요?", "기특했던 한마디는 무엇이었나요?", "힘든 걸 참고 해낸 게 있었나요?", "호기심을 보인 주제가 있었나요?", "고맙다거나 미안하다고 한 적 있나요?", "집안일을 도운 게 있었나요?", "오늘 아이의 표정 중 가장 좋았던 순간은?", "스스로 생각해서 한 선택이 있었나요?", "끝까지 들어주거나 기다려준 순간이 있었나요?", "작은 용기를 낸 일이 있었나요?", "어제는 못 하던 걸 해낸 게 있나요?", "오늘 보여준 \u2018이 아이만의 강점\u2019은?", "오늘 하루, 아이에게 고마웠던 한 가지는?"];
function obsToday() {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 50 + d.getDate();
  return OBS_QUESTIONS[seed % OBS_QUESTIONS.length];
}

// 마음 내려놓기 — AI·저장 없음. 적고 비우면 흘려보내는 자리.
// 비운 뒤 남기는 따뜻한 마무리 한마디.
// ※ 고문님 말씀은 지식베이스의 검증된 어록만 토씨 그대로 인용한다 (지어내지 않음).
const CALM_WORDS = ["다 쏟으셨어요. 이제 그 말은 여기 두고 가셔도 돼요.", "잘 적으셨어요. 아이에게 가기 전에 먼저 비운 거예요.", "적어 내려간 만큼, 마음이 한결 가벼워지셨길 바라요.", "이 자리에 내려놓으셨으니, 아이에게는 분명 다른 말이 나올 거예요.", "충분히 그럴 만했어요. 쏟아낸 만큼, 마음에 자리가 생겼을 거예요.", "고문님 말씀이에요. “아이를 혼내는 방법은 아이를 변하게 못 합니다. 어머니 기분은 풀리겠지만.”", "고문님 말씀이에요. “칭찬하세요, 꾸짖지 마시고… 마음에 안 드는 점 고치는 방법입니다.”"];
// 함께 광장 — 구글시트 백엔드 (기질테스트와 같은 시트, source로 탭 분리)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxkpIeb9FmErkwE1nDvnBa4F9L3hBg295hYd-UWksPAkYwO-MRkjHiojRFfH7thuuPY/exec";
const SHEET_SOURCE = "maum_world_share"; // 좋은점 공유 탭 이름

// 함께 광장 — 마스코트 새는 컴포넌트 안 birdFor()로 결정
const fmtDate = iso => new Date(iso).toLocaleDateString("ko-KR", {
  month: "long",
  day: "numeric"
});
// 시간 경과를 "방금 / 12분 전 / 3시간 전 / 2일 전"으로
function agoText(t) {
  if (!t) return "";
  const ms = Date.now() - new Date(t).getTime();
  if (isNaN(ms)) return "";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "방금";
  if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "시간 전";
  const d = Math.floor(h / 24);
  return d + "일 전";
}
const sameDay = iso => keyOf(iso) === todayKey;
const krNum = n => {
  if (n == null) return "—";
  if (n >= 1e8) {
    const eok = Math.floor(n / 1e8);
    const man = Math.round(n % 1e8 / 1e4);
    return man ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만`;
  return n.toLocaleString();
};
const fmtUSD = n => {
  if (n == null) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}조 달러`;
  if (n >= 1e8) return `${Math.round(n / 1e8).toLocaleString()}억 달러`;
  return `${n.toLocaleString()} 달러`;
};
const fmtLL = (lat, lng) => `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"}`;
const WD = ["일", "월", "화", "수", "목", "금", "토"];
function WorldPage({
  onHome,
  onCoach,
  onTest
}) {
  const [lights, setLights] = useState([]);
  // 🔠 글자 크기(가⁻ 가⁺) — 0:보통 1:크게 2:더크게. 폰에 기억(maum_fontscale)
  const [fsLv, setFsLv] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_fontscale");
        if (r && r.value != null) {
          const n = parseInt(r.value, 10);
          if (n >= 0 && n < FS_LEVELS.length) setFsLv(n);
        }
      } catch (e) {}
    })();
  }, []);
  function bumpFs(d) {
    const next = Math.max(0, Math.min(FS_LEVELS.length - 1, fsLv + d));
    if (next === fsLv) return;
    setFsLv(next);
    try {
      store.set("maum_fontscale", String(next));
    } catch (e) {}
  }
  // 매 렌더마다 현재 배율을 WS 글자 크기에 반영 (base에서 다시 계산하므로 누적 안 됨)
  applyFontScale(FS_LEVELS[fsLv]);
  const [gems, setGems] = useState([]);
  const [memos, setMemos] = useState([]);
  const [todos, setTodos] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [diaryText, setDiaryText] = useState("");
  const [diaryEditing, setDiaryEditing] = useState(false);
  const [text, setText] = useState("");
  const [selId, setSelId] = useState(null);
  const [view, setView] = useState({
    scale: 1,
    tx: 0,
    ty: 0
  });
  const [message, setMessage] = useState(null);
  const [greet, setGreet] = useState(null);
  const [showList, setShowList] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [showCalm, setShowCalm] = useState(false);
  const [calmText, setCalmText] = useState("");
  const [calmRes, setCalmRes] = useState(null);
  const [calmLoading, setCalmLoading] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showPlaza, setShowPlaza] = useState(false); // 함께 광장
  // 🌸 그룹 — 도전 어머님들 그룹핑 (시트 groups 탭, 대표 승인제)
  const [myGroup, setMyGroup] = useState(""); // 가입한 그룹 이름 ("" = 없음)
  const [plazaTab, setPlazaTab] = useState("all"); // "all"(전체) | "group"(우리 그룹)
  const [grpOpen, setGrpOpen] = useState(false);
  const [grpQ, setGrpQ] = useState("");
  const [grpResults, setGrpResults] = useState(null);
  const [grpBusy, setGrpBusy] = useState(false);
  const [grpMsg, setGrpMsg] = useState(null);
  const [grpReqName, setGrpReqName] = useState("");
  const [grpReqSize, setGrpReqSize] = useState("");
  const [grpReqIntro, setGrpReqIntro] = useState("");
  const [plazaReplies, setPlazaReplies] = useState({}); // 💬 {글키: [답글]}
  const [mentorSet, setMentorSet] = useState({}); // 🌟 {별명: true}
  const [replyOpen, setReplyOpen] = useState(null); // 펼친 글키
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_group");
        if (r && r.value) {
          setMyGroup(r.value);
          setPlazaTab("group");
        }
      } catch (e) {}
    })();
  }, []);
  const [showProfile, setShowProfile] = useState(false); // 아이디 만들기/변경
  const [pfChild, setPfChild] = useState(""); // 아이디 입력: 아이 이름
  const [pfRole, setPfRole] = useState("맘"); // 맘/아빠/그 외
  const [pfYear, setPfYear] = useState(""); // 생년 4자리
  const [plazaData, setPlazaData] = useState(null); // 시트에서 불러온 광장 글들
  const [plazaLoading, setPlazaLoading] = useState(false);
  const [shareOff, setShareOff] = useState(false); // 🔒 나만 보기 (true면 시트에 안 보냄)
  const [muted, setMuted] = useState(false);
  const [showGuide, setShowGuide] = useState(false); // 📖 사용법 다시 보기
  const [demo, setDemo] = useState(false);
  const [aiText, setAiText] = useState(null);
  const [kidOpen, setKidOpen] = useState(false); // 아이와 나누기 펼침
  const [aiLoading, setAiLoading] = useState(false);
  const [gemLoading, setGemLoading] = useState(false);
  const [gemReveal, setGemReveal] = useState(null);
  const [pickedVirtue, setPickedVirtue] = useState(null); // 엄마가 고른 덕담
  const [contEvent, setContEvent] = useState(null);
  const [popupId, setPopupId] = useState(null);
  const [cityKo, setCityKo] = useState({});
  // ── 아이별 제로섬 ──
  const [sos, setSos] = useState([]); // 코칭에서 온 '마음의 보석'
  const [wkids, setWkids] = useState([]); // 진단 앱에 등록된 아이들 [{name, temper}]
  const [curChild, setCurChild] = useState(null); // 지금 기록 대상 아이
  const [mapMode, setMapMode] = useState(null); // 지도 방식: "together"(다같이) | "perkid"(아이별) | null(미정=다같이로 동작)
  const [modeLoaded, setModeLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_map_mode");
        if (r && r.value) setMapMode(r.value);
      } catch (e) {}
      setModeLoaded(true);
    })();
  }, []);
  async function chooseMode(m) {
    setMapMode(m);
    try {
      await store.set("maum_map_mode", m);
    } catch (e) {}
  }
  // 🌅 오늘의 시작 — 하루 첫 진입에만 보여주는 들어가는 페이지 (인사·어제 한 줄·오늘의 관찰·아이 고르기)
  const [entryOpen, setEntryOpen] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_entry_day");
        const today = keyOf(new Date());
        if (!r || r.value !== today) setEntryOpen(true);
      } catch (e) {
        setEntryOpen(true);
      }
    })();
  }, []);
  async function enterMap(kidName) {
    if (kidName) pickChildW(kidName);
    try {
      await store.set("maum_entry_day", keyOf(new Date()));
    } catch (e) {}
    setEntryOpen(false);
  }
  // ✨ 오늘은 누구? — 아이별 모드 + 아이 2명 이상 + 오늘 첫 진입에만 한 번 묻기
  const [todayKidAsk, setTodayKidAsk] = useState(false);
  useEffect(() => {
    (async () => {
      if (!modeLoaded || mapMode !== "perkid" || wkids.length < 2) return;
      try {
        const r = await store.get("maum_today_kid");
        const today = keyOf(new Date());
        if (r && r.value) {
          const o = JSON.parse(r.value);
          if (o.day === today) {
            if (o.kid && wkids.some(k => k.name === o.kid)) setCurChild(o.kid);
            return;
          }
        }
        setTodayKidAsk(true);
      } catch (e) {
        setTodayKidAsk(true);
      }
    })();
  }, [modeLoaded, mapMode, wkids]);
  async function pickTodayKid(name) {
    setCurChild(name);
    setTodayKidAsk(false);
    try {
      await store.set("maum_today_kid", JSON.stringify({
        day: keyOf(new Date()),
        kid: name
      }));
    } catch (e) {}
  }
  useEffect(() => {
    if (mapMode === "perkid" && !curChild && wkids.length) setCurChild(wkids[0].name);
  }, [mapMode, wkids]);
  const [lens, setLens] = useState(null); // 지도 렌즈: null=전체 / 이름 / "함께"
  const [stockFilter, setStockFilter] = useState(null); // 곳간 필터
  const [showJourney, setShowJourney] = useState(false); // 🏆 빛의 여정 진열장
  // 세계지도 팝업들을 뒤로가기로 닫기 (지도 확대/이동 view는 건드리지 않음)
  useBackClose(showList, () => setShowList(false));
  useBackClose(showCal, () => setShowCal(false));
  useBackClose(showSet, () => setShowSet(false));
  useBackClose(showCalm, () => setShowCalm(false));
  useBackClose(showStock, () => setShowStock(false));
  useBackClose(showPlaza, () => setShowPlaza(false));
  useBackClose(showProfile, () => setShowProfile(false));
  useBackClose(showGuide, () => setShowGuide(false));
  useBackClose(showJourney, () => setShowJourney(false));
  const [challenge, setChallenge] = useState(null); // 🌱 함께 보기 챌린지 {start, days, sharedStart}
  const [worldDone, setWorldDone] = useState(false); // 🌍 온 땅 완주 대미 카드 (= 여섯 대륙 모두 밝힌 피날레)
  // 아이디(공유용 프로필): 기질테스트에서 아이이름+생년으로 자동 생성, 변경 가능
  // { child: "민서", role: "맘", nick: "민서맘", year: "2018" }
  const [profile, setProfile] = useState(null);
  // 진단(기질테스트)에서 만든 아이를 읽어와 별명 폼을 자동으로 채운다 (아이디 동기화)
  const [testKid, setTestKid] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await store.get("cheji:children:v1");
        const list = r && r.value ? JSON.parse(r.value) : [];
        const kids = Array.isArray(list) ? list.filter(c => c && !c.isParent && c.name) : [];
        const k = kids.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
        if (alive && k) setTestKid({ name: k.name, year: (k.byear || "").trim() });
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, []);
  const [briefByCid, setBriefByCid] = useState({});
  // 별명 폼이 열릴 때(아직 별명이 없고 처음일 때) 진단의 아이 이름·생년을 자동으로 채움
  useEffect(() => {
    if (showProfile && !profile && testKid) {
      setPfChild(p => p && p.trim() ? p : testKid.name);
      setPfYear(p => p && p.trim() ? p : testKid.year || "");
    }
  }, [showProfile, testKid]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selCity, setSelCity] = useState(null);
  // 달력
  const [cal, setCal] = useState({
    y: new Date().getFullYear(),
    m: new Date().getMonth()
  });
  const [selDay, setSelDay] = useState(todayKey);
  const [query, setQuery] = useState("");
  const [memoText, setMemoText] = useState("");
  const [todoText, setTodoText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const svgRef = useRef(null);
  const ptrs = useRef(new Map());
  const moved = useRef(false);
  const pinch = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("maum_world5");
        if (r && r.value) {
          const o = JSON.parse(r.value);
          setLights(o.lights || []);
          setGems(o.gems || []);
          setMemos(o.memos || []);
          setTodos(o.todos || []);
          setDiaries(o.diaries || []);
          setSos(o.sos || []);
          setChallenge(o.challenge || null);
          if (o.profile) setProfile(o.profile);
          if (o.lights && o.lights.length) setGreet(`${o.lights.length}개 나라에 불이 켜져 있어요. 잘하고 있어요.`);
        }
      } catch (e) {}
    })();
  }, []);
  useEffect(() => {
    if (!greet) return;
    const t = setTimeout(() => setGreet(null), 3200);
    return () => clearTimeout(t);
  }, [greet]);
  // 진단 앱의 아이들 + 마지막 선택(코치와 같은 키 maum_child 공유)
  useEffect(() => {
    (async () => {
      let list = [];
      try {
        const r = await store.get("cheji:children:v1");
        if (r && r.value) list = JSON.parse(r.value).filter(c => !c.isParent).map(c => ({
          name: c.name,
          temper: c.scores ? TYPES[topType(c.scores)].name : null
        }));
      } catch (e) {}
      setWkids(list);
      try {
        const r = await store.get("maum_child");
        if (r && r.value && list.some(k => k.name === r.value)) setCurChild(r.value);else if (list.length === 1) setCurChild(list[0].name);
      } catch (e) {}
    })();
  }, []);
  function pickChildW(name) {
    const v = mapMode === "perkid" ? name : curChild === name ? null : name;
    setCurChild(v);
    try {
      store.set("maum_child", v || "");
    } catch (e) {}
  }
  useEffect(() => {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      } catch (e) {}
    }
  }, []);
  useEffect(() => {
    setSelCity(null);
    if (!popupId) return;
    const c = BY_ID[popupId];
    if (!c || briefByCid[popupId]) return;
    // 정적 데이터에서 나라 소개를 읽는다 (AI 호출 없음)
    const nd = NARA[c.en];
    setBriefByCid(p => ({
      ...p,
      [c.i]: nd && nd.brief ? nd.brief : " "
    }));
  }, [popupId]);

  // 아이별 모드: 지금 보고 있는 아이의 빛만 (다같이 모드: 전체)
  const perKid = mapMode === "perkid";
  const activeKid = perKid ? curChild || wkids[0] && wkids[0].name || null : null;
  const visLights = perKid && activeKid ? lights.filter(e => e.child === activeKid) : lights;
  const litMap = {};
  visLights.forEach(e => litMap[e.cid] = e);
  const gemsByCid = {};
  gems.forEach(g => {
    (gemsByCid[g.cid] = gemsByCid[g.cid] || []).push(g);
  });
  // 아이별 렌즈 — 지도 '표시'만 거름 (밝히기/보석 규칙은 전체 기준 유지)
  const lensMatch = e => lens === null || (lens === "함께" ? !e.child : e.child === lens);
  const viewLitMap = perKid || lens === null ? litMap : (() => {
    const m = {};
    lights.filter(lensMatch).forEach(e => m[e.cid] = e);
    return m;
  })();
  const viewGemsByCid = perKid || lens === null ? gemsByCid : (() => {
    const m = {};
    gems.filter(lensMatch).forEach(g => {
      (m[g.cid] = m[g.cid] || []).push(g);
    });
    return m;
  })();
  const hasLegacy = lights.some(e => !e.child) || gems.some(g => !g.child);
  // 🔥 연속 기록 일수 — 압박이 아니라 응원 (현재 연속 + 함께한 총 날수)
  const streakInfo = (() => {
    const days = new Set([...lights, ...gems].map(e => keyOf(e.date)));
    const totalDays = days.size;
    if (totalDays === 0) return {
      cur: 0,
      total: 0
    };
    let cur = 0;
    const d = new Date();
    if (!days.has(keyOf(d))) d.setDate(d.getDate() - 1);
    while (days.has(keyOf(d))) {
      cur++;
      d.setDate(d.getDate() - 1);
    }
    return {
      cur,
      total: totalDays
    };
  })();
  // 🌱 함께 보기 챌린지 진행 — start 이후 '기록한 날 수' (못 한 날은 세지 않음)
  const chInfo = (() => {
    if (!challenge) return null;
    const daySet = new Set([...lights, ...gems].map(e => keyOf(e.date)));
    const start = new Date(challenge.start);
    let done = 0;
    const tmp = new Date(start);
    for (let i = 0; i < challenge.days; i++) {
      if (daySet.has(keyOf(tmp))) done++;
      tmp.setDate(tmp.getDate() + 1);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + challenge.days - 1);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dleft = Math.ceil((end - today) / 86400000);
    const dayNo = Math.floor((today - new Date(new Date(challenge.start).setHours(0, 0, 0, 0))) / 86400000) + 1;
    return {
      done,
      total: challenge.days,
      dleft,
      dayNo,
      complete: done >= challenge.days
    };
  })();
  // 빈자리 관찰 신호 — 이번 주 기록이 0인 아이 (비교 없이, 빈자리만)
  const obsNudge = (() => {
    if (wkids.length < 2) return null;
    const wk = Date.now() - 7 * 86400000;
    const cnt = {};
    wkids.forEach(k => cnt[k.name] = 0);
    [...lights, ...gems].forEach(e => {
      if (e.child && cnt[e.child] !== undefined && new Date(e.date).getTime() >= wk) cnt[e.child]++;
    });
    const empty = wkids.find(k => cnt[k.name] === 0);
    const any = Object.values(cnt).some(v => v > 0);
    return empty && any ? `이번 주 ${withName(empty.name)}의 좋은 점은 아직 빈자리예요 — 오늘 하나 찾아볼까요?` : null;
  })();
  const count = visLights.length; // 아이별 모드에선 그 아이의 진행
  // 🌙 어제 발견한 좋은 점 (오늘의 시작 페이지용, 최대 3개)
  const yesterKey = keyOf(new Date(Date.now() - 864e5));
  const yesterNotes = entryOpen ? [...lights.filter(e => keyOf(e.date) === yesterKey).map(e => ({
    t: e.text,
    c: e.child
  })), ...gems.filter(g => keyOf(g.date) === yesterKey).map(g => ({
    t: g.note,
    c: g.child
  }))].filter(n => n.t).slice(0, 3) : [];
  const pct = Math.round(count / TOTAL * 100);
  const lvl = levelInfo(count);
  const litToday = visLights.some(e => sameDay(e.date)); // 하루 1나라도 아이별

  // 광장 뷰 계산: 시트에서 받은 행 → 화면용. plazaData가 null이면 로딩 전.
  const plazaView = (() => {
    if (!plazaData) return null;
    // 최신순 정렬 (시간 내림차순), 좋은점 있는 것만 — 축하 행은 따로 뗀다
    let all = plazaData.filter(r => r && (r["좋은점"] || "").toString().trim()).sort((a, b) => new Date(b["시간"] || 0) - new Date(a["시간"] || 0));
    if (plazaTab === "group" && myGroup) all = all.filter(r => String(r["그룹"] || "").trim() === myGroup); // 🌸 우리 그룹만
    const isCeleb = r => (r["덕담"] || "") === "🎉축하";
    const rows = all.filter(r => !isCeleb(r));
    // 🎉 오늘의 축하 — 오늘 날짜의 이정표만, 모두에게 보임
    const celebs = all.filter(r => isCeleb(r) && sameDay(r["시간"])).slice(0, 10).map(r => ({
      bird: r["새"] || birdFor(r["별명"] || ""),
      nick: r["별명"] || "익명",
      text: r["좋은점"] || ""
    }));
    // 피드: 최근 12개
    const feed = rows.slice(0, 12).map(r => ({
      key: String(r["시간"] || "") + "|" + (r["별명"] || ""),
      bird: r["새"] || birdFor(r["별명"] || ""),
      nick: r["별명"] || "익명",
      year: (r["생년"] || "").toString(),
      virtue: r["덕담"] || "",
      nara: r["나라"] || "",
      note: r["좋은점"] || "",
      ago: agoText(r["시간"])
    }));
    // 합계: 함께 밝힌 나라(중복 제거), 함께한 엄마(별명 종류)
    const naraSet = new Set(rows.map(r => r["나라"]).filter(Boolean));
    const momSet = new Set(rows.map(r => r["별명"]).filter(Boolean));
    // 연속기록 대신 '이번 주 많이 담은 엄마' (별명별 좋은점 수, 최근 7일)
    const weekAgo = Date.now() - 7 * 864e5;
    const byMom = {};
    rows.forEach(r => {
      const t = new Date(r["시간"] || 0).getTime();
      if (t < weekAgo) return;
      const k = r["별명"] || "익명";
      byMom[k] = byMom[k] || {
        nick: k,
        count: 0
      };
      byMom[k].count++;
    });
    const streaks = Object.values(byMom).sort((a, b) => b.count - a.count).slice(0, 5);
    return {
      feed,
      celebs,
      naraCount: naraSet.size,
      momCount: momSet.size,
      streaks
    };
  })();
  async function saveAll(L, G, M, T, D, P, SS, CH) {
    try {
      await store.set("maum_world5", JSON.stringify({
        lights: L,
        gems: G,
        memos: M,
        todos: T,
        diaries: D !== undefined ? D : diaries,
        profile: P !== undefined ? P : profile,
        sos: SS !== undefined ? SS : sos,
        challenge: CH !== undefined ? CH : challenge
      }));
    } catch (e) {}
  }
  function persist(p) {
    saveAll(p.lights || lights, p.gems || gems, p.memos || memos, p.todos || todos, p.diaries !== undefined ? p.diaries : diaries, p.profile !== undefined ? p.profile : profile, p.sos !== undefined ? p.sos : sos, p.challenge !== undefined ? p.challenge : challenge);
  }

  // 아이디 만들기: 아이이름 + 역할(맘/아빠/등) → 별명, + 생년 4자리
  function makeProfile(child, role, year) {
    const c = (child || "").trim();
    const r = (role || "맘").trim();
    const y = (year || "").trim();
    if (!c) return;
    const np = {
      child: c,
      role: r,
      nick: c + r,
      year: y
    };
    setProfile(np);
    persist({
      profile: np
    });
    return np;
  }

  // 별명 첫 글자로 마스코트 새를 정한다 (같은 별명은 늘 같은 새)
  const PLAZA_BIRDS = ["🐦", "🐤", "🐧", "🐥", "🕊️", "🦜", "🐔"];
  function birdFor(nick) {
    let s = 0;
    for (let i = 0; i < (nick || "").length; i++) s += nick.charCodeAt(i);
    return PLAZA_BIRDS[s % PLAZA_BIRDS.length];
  }

  // 좋은 점을 구글시트로 보낸다 (공유 ON일 때만). 실패해도 앱은 계속 동작.
  function shareToPlaza(virtue, naraName, note) {
    if (shareOff || !profile) return; // 🔒 나만 보기거나 아이디 없으면 안 보냄
    const body = {
      source: SHEET_SOURCE,
      별명: profile.nick,
      생년: profile.year || "",
      새: birdFor(profile.nick),
      덕담: virtue || "",
      나라: naraName || "",
      좋은점: note || "",
      그룹: myGroup || ""
    };
    try {
      fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(body)
      });
    } catch (e) {}
  }

  // 🎉 이정표 축하를 광장에 보낸다 — 그날 하루 모든 이용자에게 보임 (프로필 있고 공유 ON일 때만)
  function sendCelebration(text, tag) {
    if (shareOff || !profile) return;
    const body = {
      source: SHEET_SOURCE,
      별명: profile.nick,
      생년: profile.year || "",
      새: birdFor(profile.nick),
      덕담: "🎉축하",
      나라: tag || "",
      좋은점: text || "",
      그룹: myGroup || ""
    };
    try {
      fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(body)
      });
    } catch (e) {}
  }

  // 🌱 챌린지 시작 — 며칠 함께 볼지 정하고, 광장에 도전 선언 공유
  function startChallenge(days) {
    const ch = {
      start: keyOf(new Date()),
      days: days,
      sharedStart: false
    };
    setChallenge(ch);
    persist({
      challenge: ch
    });
    if (!shareOff && profile) {
      sendCelebration(`${days}일 '함께 보기'에 도전해요 🌱 응원해 주세요!`, "챌린지시작");
    }
    setMessage({
      title: `${days}일 함께 보기, 시작! 🌱`,
      body: "하루에 하나, 아이의 좋은 점을 발견해 보세요. 못 한 날이 있어도 괜찮아요 — 다시 이어가면 돼요."
    });
  }
  function endChallenge() {
    setChallenge(null);
    persist({
      challenge: null
    });
  }
  // 완주 공유 (한 번만)
  const chCelebratedRef = useRef(false);
  useEffect(() => {
    if (chInfo && chInfo.complete && challenge && !challenge.sharedDone && !chCelebratedRef.current) {
      chCelebratedRef.current = true;
      const ch = {
        ...challenge,
        sharedDone: true
      };
      setChallenge(ch);
      persist({
        challenge: ch
      });
      sendCelebration(`${challenge.days}일 '함께 보기'를 완주했어요 🌷`, "챌린지완주");
      setMessage({
        title: `${challenge.days}일 함께 보기 완주! 🌷`,
        body: "아이를 바라보는 눈이 한 뼘 더 자랐어요. 이 시선이 아이를 키웁니다."
      });
    }
  }, [chInfo && chInfo.complete]);

  // 광장 글들을 시트에서 불러온다
  async function loadPlaza(silent) {
    if (!silent) setPlazaLoading(true);
    try {
      const post = body => fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(body)
      }).then(r => r.json()).catch(() => null);
      const [d, rp, mt] = await Promise.all([post({
        source: SHEET_SOURCE,
        action: "load"
      }), post({
        source: "replies",
        action: "load"
      }),
      // 💬 답글
      post({
        source: "mentors",
        action: "load"
      }) // 🌟 멘토 명단 (대표가 시트에 직접 관리)
      ]);
      if (d && d.ok && Array.isArray(d.rows)) setPlazaData(d.rows);else if (!silent) setPlazaData([]);
      const rm = {};
      if (rp && rp.ok && Array.isArray(rp.rows)) rp.rows.forEach(r => {
        const k = String(r["글키"] || "");
        if (!k) return;
        (rm[k] = rm[k] || []).push({
          nick: r["별명"] || "익명",
          bird: r["새"] || "",
          text: r["내용"] || "",
          ago: agoText(r["시간"])
        });
      });
      setPlazaReplies(rm);
      const ms = {};
      if (mt && mt.ok && Array.isArray(mt.rows)) mt.rows.forEach(r => {
        const n = String(r["별명"] || "").trim();
        if (n) ms[n] = true;
      });
      setMentorSet(ms);
    } catch (e) {
      if (!silent) setPlazaData([]);
    }
    if (!silent) setPlazaLoading(false);
  }
  // 광장이 열려 있는 동안 45초마다 조용히 새로고침 — 멘토링 대화가 느리게나마 실시간처럼
  useEffect(() => {
    if (!showPlaza) return;
    const t = setInterval(() => {
      loadPlaza(true);
    }, 45000);
    return () => clearInterval(t);
  }, [showPlaza]);

  // 🌸 그룹 검색 — groups 탭에서 승인된 그룹만
  async function searchGroups() {
    const q = grpQ.trim();
    if (!q) return;
    setGrpBusy(true);
    setGrpResults(null);
    setGrpMsg(null);
    try {
      const res = await fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          source: "groups",
          action: "load"
        })
      });
      const d = await res.json();
      const rows = d && d.ok && Array.isArray(d.rows) ? d.rows : [];
      const ok = rows.filter(r => String(r["상태"] || "").trim() === "승인" && String(r["그룹명"] || "").includes(q));
      const seen = {};
      const list = [];
      ok.forEach(r => {
        const n = String(r["그룹명"]).trim();
        if (!seen[n]) {
          seen[n] = 1;
          list.push({
            name: n,
            boss: r["방장"] || "",
            intro: r["소개"] || "",
            size: r["인원"] || ""
          });
        }
      });
      setGrpResults(list);
      if (!list.length) setGrpMsg({
        ok: false,
        t: "그 이름의 그룹을 못 찾았어요. 아직 승인 전이거나 이름이 다를 수 있어요."
      });
    } catch (e) {
      setGrpMsg({
        ok: false,
        t: "검색에 실패했어요. 잠시 후 다시 시도해 주세요."
      });
    }
    setGrpBusy(false);
  }
  async function joinGroup(name) {
    setMyGroup(name);
    setPlazaTab("group");
    try {
      await store.set("maum_group", name);
    } catch (e) {}
    setGrpOpen(false);
    setGrpMsg(null);
    setGrpResults(null);
    setGrpQ("");
  }
  async function leaveGroup() {
    if (!window.confirm(`'${myGroup}' 그룹에서 나갈까요?\n(글은 남아 있고, 언제든 다시 가입할 수 있어요)`)) return;
    setMyGroup("");
    setPlazaTab("all");
    try {
      await store.set("maum_group", "");
    } catch (e) {}
  }
  // 🌸 그룹 만들기 요청 — 운영자(시트)에서 상태를 '승인'으로 바꾸면 열림
  async function requestGroup() {
    const n = grpReqName.trim();
    if (!n || !profile) return;
    setGrpBusy(true);
    setGrpMsg(null);
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          source: "groups",
          그룹명: n,
          방장: profile.nick,
          인원: grpReqSize.trim(),
          소개: grpReqIntro.trim(),
          상태: "요청"
        })
      });
      setGrpMsg({
        ok: true,
        t: "요청을 보냈어요! 운영자가 확인해 열어주면, 팀원들이 이 이름으로 검색해 가입할 수 있어요."
      });
      setGrpReqName("");
      setGrpReqSize("");
      setGrpReqIntro("");
    } catch (e) {
      setGrpMsg({
        ok: false,
        t: "요청 전송에 실패했어요. 잠시 후 다시요."
      });
    }
    setGrpBusy(false);
  }

  // 💬 답글 보내기 — 그룹 멘토링의 핵심 (시트 replies 탭)
  async function sendReply(postKey) {
    const t = replyText.trim();
    if (!t || !profile || replyBusy) return;
    setReplyBusy(true);
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          source: "replies",
          글키: postKey,
          별명: profile.nick,
          새: birdFor(profile.nick),
          내용: t,
          그룹: myGroup || ""
        })
      });
      setPlazaReplies(m => ({
        ...m,
        [postKey]: [...(m[postKey] || []), {
          nick: profile.nick,
          bird: birdFor(profile.nick),
          text: t,
          ago: "방금"
        }]
      }));
      setReplyText("");
    } catch (e) {}
    setReplyBusy(false);
  }
  function speak(t) {
    if (muted) return;
    try {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(t);
        u.lang = "ko-KR";
        u.rate = 0.98;
        u.pitch = 1.05;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function speakLang(t, tag, fb) {
    try {
      if (muted) return;
      if (!("speechSynthesis" in window) || !t) return;
      const vs = window.speechSynthesis.getVoices() || [];
      const base = (tag || "").split("-")[0].toLowerCase();
      const v = base ? vs.find(x => x.lang && x.lang.toLowerCase().startsWith(base)) : null;
      window.speechSynthesis.cancel();
      if (v) {
        const u = new SpeechSynthesisUtterance(t);
        u.voice = v;
        u.lang = v.lang;
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
        return;
      }
      if (vs.length && fb) {
        const u = new SpeechSynthesisUtterance(fb);
        u.lang = "ko-KR";
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
        return;
      }
      const u = new SpeechSynthesisUtterance(t);
      if (tag) u.lang = tag;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function toSvg(cx, cy) {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: (cx - r.left) / r.width * 1000,
      y: (cy - r.top) / r.height * 500
    };
  }
  function zoomAbout(f, fx, fy) {
    setView(v => {
      const ns = clamp(v.scale * f, 1, 8);
      const k = ns / v.scale;
      return clampView({
        scale: ns,
        tx: fx - (fx - v.tx) * k,
        ty: fy - (fy - v.ty) * k
      });
    });
  }
  function onWheel(e) {
    const p = toSvg(e.clientX, e.clientY);
    zoomAbout(e.deltaY < 0 ? 1.15 : 1 / 1.15, p.x, p.y);
  }
  function onDown(e) {
    ptrs.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });
    moved.current = false;
    if (ptrs.current.size === 2) {
      const a = [...ptrs.current.values()];
      pinch.current = {
        d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y)
      };
    }
  }
  function onMove(e) {
    const m = ptrs.current;
    if (!m.has(e.pointerId)) return;
    const prev = m.get(e.pointerId);
    const cur = {
      x: e.clientX,
      y: e.clientY
    };
    m.set(e.pointerId, cur);
    if (m.size === 1) {
      if (Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y) > 3) moved.current = true;
      const r = svgRef.current.getBoundingClientRect();
      setView(v => clampView({
        ...v,
        tx: v.tx + (cur.x - prev.x) / r.width * 1000,
        ty: v.ty + (cur.y - prev.y) / r.height * 500
      }));
    } else if (m.size >= 2) {
      moved.current = true;
      const a = [...m.values()];
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (pinch.current && pinch.current.d) {
        const mid = toSvg((a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2);
        zoomAbout(d / pinch.current.d, mid.x, mid.y);
      }
      pinch.current = {
        d
      };
    }
  }
  function onUp(e) {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) pinch.current = null;
  }
  function zoomTo(c) {
    const s = 3.6;
    setView(clampView({
      scale: s,
      tx: 500 - s * c.cx,
      ty: 250 - s * c.cy
    }));
  }
  function select(c) {
    setSelId(c.i);
    setAiText(null);
    setGemReveal(null);
    setMessage(null);
  }
  function pick(c) {
    if (moved.current) return;
    select(c);
    if (litMap[c.i]) setPopupId(c.i);else setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
  }
  function focusCountry(c) {
    zoomTo(c);
    select(c);
    setShowList(false);
    if (litMap[c.i]) setPopupId(c.i);
  }
  function askAI(c) {
    // 토글: 이미 열려 있으면 접기
    if (aiText) {
      setAiText(null);
      setKidOpen(false);
      return;
    }
    const nd = NARA[c.en] || {};
    setAiText({
      adult: nd.adult || null,
      story: nd.story || null,
      brief: nd.brief || null
    });
    setKidOpen(false);
  }
  function openYoutube(c) {
    window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(c.n + " 나라 소개"), "_blank");
  }
  async function submitNote() {
    const v = text.trim();
    const c = selId ? BY_ID[selId] : null;
    if (!c) {
      setMessage({
        title: "나라를 골라주세요",
        body: "지도에서 나라를 톡 고른 뒤 한 줄을 적어주세요."
      });
      return;
    }
    if (v.length < 1) {
      inputRef.current && inputRef.current.focus();
      return;
    }
    if (!litMap[c.i]) {
      if (litToday && !demo) {
        setMessage({
          title: "오늘의 새 땅은 다 밝혔어요 🌙",
          body: "내일 또 새 나라를 밝혀요. 오늘은 이미 밝힌 나라에 기록을 더해 보석을 모아볼까요?"
        });
        return;
      }
      const order = count + 1;
      const prevIdx = levelInfo(count).idx;
      const next = [...lights, {
        id: Date.now(),
        date: new Date().toISOString(),
        text: v,
        cid: c.i,
        cn: c.n,
        order,
        child: (perKid ? activeKid : curChild) || null
      }];
      const np = Math.round(next.length / TOTAL * 100);
      const newIdx = levelInfo(next.length).idx;
      const litIds = new Set(next.map(e => e.cid));
      const contDone = c.ct !== "기타" && CONT_IDS[c.ct].every(id => litIds.has(id));
      let body = `「${c.n}」에 불이 켜졌어요. 세계를 ${np}% 밝혔어요.`;
      if (newIdx > prevIdx) {
        body = `🎉 이제 「${levelInfo(next.length).name}」이에요. ` + body;
        sendCelebration(`「${levelInfo(next.length).name}」이 되었어요 ✨`, "칭호");
      }
      setLights(next);
      setText("");
      setMessage({
        title: `${order}번째 빛을 밝혔어요`,
        body
      });
      speak(`${c.n}에 불이 켜졌어요.`);
      persist({
        lights: next
      });
      if (next.length >= TOTAL) {
        setTimeout(() => setWorldDone(true), 500);
        sendCelebration(`온 땅 ${TOTAL}개 나라를 모두 밝혔어요 🌍`, "완주");
      } else if (contDone) {
        setContEvent({
          name: c.ct,
          quote: WISDOM[Math.floor(Math.random() * WISDOM.length)]
        });
        sendCelebration(`${c.ct} 대륙의 등불을 모두 밝혔어요 🏮`, "대륙");
      }
    } else {
      mintGem(c, v);
    }
  }
  function mintGem(c, note) {
    const existing = gemsByCid[c.i] || [];
    const won = new Set(existing.map(g => g.virtue));
    // 아직 안 받은 덕담만 후보로
    const remaining = VIRTUES.filter(v => !won.has(v));
    // 13개 다 모았으면 더 만들지 않고 안내
    if (remaining.length === 0 && !pickedVirtue) {
      setMessage({
        title: "이 나라의 덕담을 다 모았어요 🎉",
        body: `「${c.n}」의 13가지 덕담을 모두 모았어요. 다른 나라에서 새 보석을 모아볼까요?`
      });
      setText("");
      return;
    }
    // 고른 덕담 우선, 없으면 안 받은 것 중 순서대로
    const virtue = pickedVirtue || remaining[0];
    setGemReveal(null);
    // 정적 데이터에서 덕담 번역을 읽는다 (AI 호출 없음)
    const vd = getVirtueData(c, virtue);
    const idx = existing.length;
    const cityM = c.ci && c.ci[idx] ? c.ci[idx] : null;
    const gem = vd ? {
      id: Date.now(),
      date: new Date().toISOString(),
      cid: c.i,
      virtue,
      note,
      word: vd.word,
      pron: vd.pron,
      sentence: vd.sentence,
      spron: vd.spron,
      bcp47: vd.bcp47 || "",
      city: cityM ? cityM.n : "",
      findTogether: false,
      child: (perKid ? activeKid : curChild) || null
    } : {
      id: Date.now(),
      date: new Date().toISOString(),
      cid: c.i,
      virtue,
      note,
      word: virtue,
      pron: "",
      sentence: "",
      spron: "",
      bcp47: "",
      city: cityM ? cityM.n : "",
      findTogether: true,
      child: (perKid ? activeKid : curChild) || null
    };
    const ng = [...gems, gem];
    setGems(ng);
    setText("");
    setPickedVirtue(null);
    setGemReveal(gem);
    persist({
      gems: ng
    });
    if (vd) speakLang(gem.word, gem.bcp47, gem.pron);
    if (cityM) setSelCity({
      ...cityM,
      idx
    });
    if (note && note.trim()) shareToPlaza(virtue, c.n, note.trim()); // 공유 ON이면 광장에 보냄
    // 이번 보석으로 13개 다 모았으면 축하
    if (won.size + 1 >= VIRTUES.length) {
      setTimeout(() => setMessage({
        title: "🎉 컴플리트!",
        body: `「${c.n}」의 덕담 13가지를 모두 모았어요. 정말 멋져요!`
      }), 400);
      sendCelebration(`「${c.n}」의 덕담 13가지를 모두 모았어요 💎`, "컴플리트");
    }
  }

  // 달력/메모/할일
  function saveDiary() {
    const v = diaryText.trim();
    const others = diaries.filter(d => d.day !== selDay);
    const nd = v ? [...others, {
      day: selDay,
      text: v,
      date: new Date(selDay + "T12:00:00").toISOString()
    }] : others;
    setDiaries(nd);
    setDiaryEditing(false);
    persist({
      diaries: nd
    });
  }
  function addMemo() {
    const v = memoText.trim();
    if (!v) return;
    const nm = [...memos, {
      id: Date.now(),
      date: new Date(selDay + "T12:00:00").toISOString(),
      text: v
    }];
    setMemos(nm);
    setMemoText("");
    persist({
      memos: nm
    });
  }
  function addTodo() {
    const v = todoText.trim();
    if (!v) return;
    const nt = [...todos, {
      id: Date.now(),
      date: new Date(selDay + "T12:00:00").toISOString(),
      text: v,
      done: false
    }];
    setTodos(nt);
    setTodoText("");
    persist({
      todos: nt
    });
  }
  function toggleTodo(id) {
    const nt = todos.map(t => t.id === id ? {
      ...t,
      done: !t.done
    } : t);
    setTodos(nt);
    persist({
      todos: nt
    });
  }
  function delMemo(id) {
    const nm = memos.filter(m => m.id !== id);
    setMemos(nm);
    persist({
      memos: nm
    });
  }
  function delTodo(id) {
    const nt = todos.filter(t => t.id !== id);
    setTodos(nt);
    persist({
      todos: nt
    });
  }
  function runCalm() {
    if (!calmText.trim()) return;
    // AI 없음·저장 없음: 적은 말을 흘려보내고 따뜻한 마무리 한마디만 남긴다
    setCalmText("");
    setCalmRes({
      done: true,
      word: CALM_WORDS[Math.floor(Math.random() * CALM_WORDS.length)]
    });
  }
  function shiftDay(delta) {
    const d = new Date(selDay + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setSelDay(keyOf(d));
    setCal({
      y: d.getFullYear(),
      m: d.getMonth()
    });
    setDiaryEditing(false);
    setDiaryText("");
  }
  function startEdit(m) {
    setEditId(m.id);
    setEditText(m.text);
  }
  function saveEdit() {
    const nm = memos.map(x => x.id === editId ? {
      ...x,
      text: editText.trim() || x.text
    } : x);
    setMemos(nm);
    setEditId(null);
    persist({
      memos: nm
    });
  }
  function exportBackup() {
    const data = {
      app: "마음지도",
      v: 5,
      exportedAt: new Date().toISOString(),
      lights,
      gems,
      memos,
      todos
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `마음지도_백업_${todayKey}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function importBackup(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(r.result);
        const L = o.lights || [],
          G = o.gems || [],
          M = o.memos || [],
          T = o.todos || [],
          D = o.diaries || [];
        setLights(L);
        setGems(G);
        setMemos(M);
        setTodos(T);
        setDiaries(D);
        saveAll(L, G, M, T, D);
        window.alert("복원했어요. 기록이 모두 돌아왔어요.");
      } catch (err) {
        window.alert("파일을 읽지 못했어요. 백업 파일이 맞는지 확인해 주세요.");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  }
  async function reset() {
    if (!window.confirm("모든 기록(빛·보석·메모·할일·일기)을 지우고 처음부터 시작할까요? 되돌릴 수 없어요.")) return;
    setLights([]);
    setGems([]);
    setMemos([]);
    setTodos([]);
    setDiaries([]);
    setMessage(null);
    setSelId(null);
    setView({
      scale: 1,
      tx: 0,
      ty: 0
    });
    saveAll([], [], [], [], []);
    setShowSet(false);
  }

  // 검색
  const q = query.trim().toLowerCase();
  const results = q ? [...lights.filter(e => e.text.toLowerCase().includes(q)).map(e => ({
    key: keyOf(e.date),
    icon: "🌍",
    text: e.text,
    tag: e.cn
  })), ...gems.filter(g => (g.note || "").toLowerCase().includes(q) || (g.word || "").toLowerCase().includes(q) || (g.virtue || "").includes(query.trim())).map(g => ({
    key: keyOf(g.date),
    icon: "💎",
    text: g.note,
    tag: `${BY_ID[g.cid] ? BY_ID[g.cid].n : ""} · ${g.virtue}`
  })), ...memos.filter(m => m.text.toLowerCase().includes(q)).map(m => ({
    key: keyOf(m.date),
    icon: "📝",
    text: m.text,
    tag: ""
  })), ...todos.filter(t => t.text.toLowerCase().includes(q)).map(t => ({
    key: keyOf(t.date),
    icon: "✅",
    text: t.text,
    tag: ""
  }))].sort((a, b) => a.key < b.key ? 1 : -1) : [];
  const byDay = {};
  function bucket(k, type) {
    byDay[k] = byDay[k] || {
      light: false,
      gem: false,
      memo: false,
      todo: false,
      diary: false
    };
    byDay[k][type] = true;
  }
  lights.forEach(e => bucket(keyOf(e.date), "light"));
  diaries.forEach(d => bucket(d.day, "diary"));
  gems.forEach(g => bucket(keyOf(g.date), "gem"));
  memos.forEach(m => bucket(keyOf(m.date), "memo"));
  todos.forEach(t => bucket(keyOf(t.date), "todo"));
  const dayLights = lights.filter(e => keyOf(e.date) === selDay);
  const dayGems = gems.filter(g => keyOf(g.date) === selDay);
  const dayMemos = memos.filter(m => keyOf(m.date) === selDay);
  const dayTodos = todos.filter(t => keyOf(t.date) === selDay);
  const sel = selId ? BY_ID[selId] : null;
  const selLit = sel ? litMap[sel.i] : null;
  const selGems = sel ? gemsByCid[sel.i] || [] : [];
  // 이 나라에서 이미 받은 덕담 집합 (중복 방지·도감 표시용)
  const wonVirtues = new Set(selGems.map(g => g.virtue));
  const allVirtuesDone = wonVirtues.size >= VIRTUES.length; // 13개 다 모았나
  const showLabels = view.scale > 1.4;
  const fs = 26 / view.scale;
  const canLightSel = sel && !selLit && (!litToday || demo);
  const btnLabel = sel ? selLit ? gemLoading ? "보석 만드는 중…" : "기록 남기기" : "밝히기" : "밝히기";
  const firstDow = new Date(cal.y, cal.m, 1).getDay();
  const dim = new Date(cal.y, cal.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  return /*#__PURE__*/React.createElement("div", {
    style: WS.root
  }, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "wFrame",
    style: WS.frame
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.topBar
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onHome,
    "aria-label": "\uD648\uC73C\uB85C",
    style: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.14)",
      color: WC.cream,
      fontSize: 12.5,
      fontWeight: 600,
      borderRadius: 11,
      padding: "7px 13px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u2190 \uD648"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 12,
      padding: "3px 4px"
    },
    "aria-label": "\uAE00\uC790 \uD06C\uAE30"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => bumpFs(-1),
    disabled: fsLv <= 0,
    "aria-label": "\uAE00\uC790 \uC791\uAC8C",
    style: {
      background: "none",
      border: "none",
      color: fsLv <= 0 ? "rgba(255,255,255,0.25)" : WC.cream,
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1,
      padding: "4px 7px",
      cursor: fsLv <= 0 ? "default" : "pointer",
      fontFamily: "inherit"
    }
  }, "\uAC00\u207B"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.mute,
      fontSize: 10,
      minWidth: 30,
      textAlign: "center"
    }
  }, ["\uBCF4\uD1B5", "\uD06C\uAC8C", "\uB354\uD06C\uAC8C"][fsLv]), /*#__PURE__*/React.createElement("button", {
    onClick: () => bumpFs(1),
    disabled: fsLv >= FS_LEVELS.length - 1,
    "aria-label": "\uAE00\uC790 \uD06C\uAC8C",
    style: {
      background: "none",
      border: "none",
      color: fsLv >= FS_LEVELS.length - 1 ? "rgba(255,255,255,0.25)" : WC.cream,
      fontSize: 16,
      fontWeight: 700,
      lineHeight: 1,
      padding: "4px 7px",
      cursor: fsLv >= FS_LEVELS.length - 1 ? "default" : "pointer",
      fontFamily: "inherit"
    }
  }, "\uAC00\u207A")), /*#__PURE__*/React.createElement("button", {
    style: WS.setTop,
    onClick: () => setShowSet(true),
    "aria-label": "\uC124\uC815"
  }, "\u2699")), /*#__PURE__*/React.createElement("header", {
    style: WS.header
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowJourney(true),
    style: {
      background: "none",
      border: "none",
      padding: 0,
      textAlign: "left",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.eyebrow
  }, "\uBE5B\uC758 \uC5EC\uC815"), /*#__PURE__*/React.createElement("div", {
    style: WS.title
  }, lvl.name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.mute,
      fontSize: 13,
      fontWeight: 400
    }
  }, "\u203A"))), /*#__PURE__*/React.createElement("div", {
    style: WS.progressBox
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.pct
  }, pct, "%"), /*#__PURE__*/React.createElement("div", {
    style: WS.pctLabel
  }, count, " / ", TOTAL, " \uB098\uB77C"))), /*#__PURE__*/React.createElement("div", {
    style: WS.barTrack
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.barFill,
      width: `${Math.max(2, pct)}%`
    }
  })), !perKid && wkids.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      justifyContent: "center",
      flexWrap: "wrap",
      margin: "9px 0 0"
    }
  }, [null, ...wkids.map(k => k.name), ...(hasLegacy ? ["함께"] : [])].map(l => {
    const on = lens === l;
    const kk = l && l !== "함께" ? wkids.find(k => k.name === l) : null;
    return /*#__PURE__*/React.createElement("button", {
      key: l || "전체",
      onClick: () => setLens(l),
      style: {
        background: on ? "rgba(242,193,107,0.16)" : "rgba(255,255,255,0.04)",
        border: on ? "1px solid rgba(242,193,107,0.55)" : "1px solid rgba(255,255,255,0.12)",
        color: on ? WC.gold : WC.mute,
        fontSize: 11.5,
        fontWeight: 700,
        borderRadius: 99,
        padding: "4px 11px",
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, l === null ? "🌍 전체" : l === "함께" ? "함께" : `${kk && kk.temper ? EMOJI_T[kk.temper] + " " : ""}${l}`);
  })), !perKid && lens && lens !== "함께" && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      color: WC.mute,
      fontSize: 11,
      marginTop: 5
    }
  }, withName(lens), "\uC758 \uBE5B\uACFC \uBCF4\uC11D\uB9CC \uBCF4\uACE0 \uC788\uC5B4\uC694"), perKid && wkids.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      justifyContent: "center",
      flexWrap: "wrap",
      margin: "9px 0 0"
    }
  }, wkids.map(k => {
    const on = activeKid === k.name;
    return /*#__PURE__*/React.createElement("button", {
      key: k.name,
      onClick: () => pickChildW(k.name),
      style: {
        background: on ? "rgba(242,193,107,0.18)" : "rgba(255,255,255,0.04)",
        border: on ? "1px solid rgba(242,193,107,0.6)" : "1px solid rgba(255,255,255,0.12)",
        color: on ? WC.gold : WC.mute,
        fontSize: 12,
        fontWeight: 800,
        borderRadius: 99,
        padding: "5px 14px",
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, k.temper ? EMOJI_T[k.temper] + " " : "", k.name, "\uC758 \uC9C0\uB3C4");
  })), /*#__PURE__*/React.createElement("div", {
    style: WS.mapWrap
  }, todayKidAsk && perKid && !(modeLoaded && !mapMode && wkids.length >= 2) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 89,
      background: "rgba(8,10,30,0.82)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 360,
      background: "#15183A",
      borderRadius: 20,
      padding: "24px 20px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 8
    }
  }, "\u2728"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 16.5,
      fontWeight: 800,
      marginBottom: 5
    }
  }, "\uC624\uB298\uC740 \uB204\uAD6C\uC758 \uC88B\uC740 \uC810\uC744", /*#__PURE__*/React.createElement("br", null), "\uBC1C\uACAC\uD560\uAE4C\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11.5,
      marginBottom: 16
    }
  }, "\uC9C0\uB3C4 \uC704 \uD0ED\uC73C\uB85C \uC5B8\uC81C\uB4E0 \uBC14\uAFC0 \uC218 \uC788\uC5B4\uC694."), wkids.map(k => {
    const done = [...lights, ...gems].some(e => e && e.child === k.name && sameDay(e.date));
    return /*#__PURE__*/React.createElement("button", {
      key: k.name,
      onClick: () => pickTodayKid(k.name),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(242,193,107,0.35)",
        borderRadius: 13,
        padding: "14px 15px",
        marginBottom: 8,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#F3EEE3",
        fontSize: 14.5,
        fontWeight: 800
      }
    }, k.temper ? EMOJI_T[k.temper] + " " : "", k.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: done ? "#9FE1CB" : "#9AA3C7"
      }
    }, done ? "✨ 오늘 발견했어요" : "· 아직이에요"));
  }))), entryOpen && !(modeLoaded && !mapMode && wkids.length >= 2) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 88,
      background: "linear-gradient(160deg,#0E1430,#1A1438)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 22,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 380,
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      marginBottom: 8
    }
  }, streakInfo.cur >= 1 ? "🔥" : "🌅"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 19,
      fontWeight: 800,
      lineHeight: 1.4
    }
  }, "\uC624\uB298\uB3C4 \uC88B\uC740 \uC810\uC744", /*#__PURE__*/React.createElement("br", null), "\uCC3E\uC73C\uB7EC \uAC00\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 12.5,
      marginTop: 8,
      lineHeight: 1.6
    }
  }, streakInfo.cur >= 2 ? `${streakInfo.cur}일째 이어가고 있어요. 잘하고 있어요.` : streakInfo.total > 0 ? `지금까지 ${streakInfo.total}일, 아이의 좋은 점을 발견했어요.` : "오늘이 첫 발견이 될 거예요.")), yesterNotes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "13px 15px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9FE1CB",
      fontSize: 11.5,
      fontWeight: 800,
      marginBottom: 8
    }
  }, "\uD83C\uDF19 \uC5B4\uC81C \uBC1C\uACAC\uD55C \uC88B\uC740 \uC810"), yesterNotes.map((n, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: "#E8E2D5",
      fontSize: 12.5,
      lineHeight: 1.7,
      marginBottom: i < yesterNotes.length - 1 ? 5 : 0
    }
  }, "\xB7 ", n.t, n.c ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#9AA3C7",
      fontSize: 11
    }
  }, " \u2014 ", withName(n.c)) : null))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg, rgba(242,193,107,0.13), rgba(255,158,109,0.08))",
      border: "1px solid rgba(242,193,107,0.35)",
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.gold,
      fontSize: 11.5,
      fontWeight: 800,
      marginBottom: 6
    }
  }, "\uD83D\uDC9B \uC624\uB298\uC758 \uAD00\uCC30"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.6
    }
  }, obsToday()), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 11,
      marginTop: 7,
      lineHeight: 1.5
    }
  }, "\uC774 \uC9C8\uBB38\uC744 \uB9C8\uC74C\uC5D0 \uD488\uACE0, \uC624\uB298 \uC544\uC774\uB97C \uBC14\uB77C\uBD10 \uC8FC\uC138\uC694.")), wkids.length >= 1 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 12,
      textAlign: "center",
      marginBottom: 9
    }
  }, "\uB204\uAD6C\uC758 \uC88B\uC740 \uC810\uC744 \uCC3E\uC544\uBCFC\uAE4C\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, wkids.map(k => /*#__PURE__*/React.createElement("button", {
    key: k.name,
    onClick: () => enterMap(k.name),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: 13,
      padding: "14px 16px",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, k.temper ? EMOJI_T[k.temper] : "🐣"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#F3EEE3",
      fontSize: 15,
      fontWeight: 700
    }
  }, withName(k.name), perKid ? "의 지도로" : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      color: WC.gold,
      fontSize: 18
    }
  }, "\u2192")))), /*#__PURE__*/React.createElement("button", {
    onClick: () => enterMap(null),
    style: {
      width: "100%",
      marginTop: 12,
      background: "none",
      border: "none",
      color: "#9AA3C7",
      fontSize: 12.5,
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "underline",
      textUnderlineOffset: 2
    }
  }, "\uADF8\uB0E5 \uC9C0\uB3C4\uB85C \uAC08\uAC8C\uC694")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => enterMap(null),
    style: {
      width: "100%",
      background: "linear-gradient(135deg,#F2C16B,#FF9E6D)",
      color: "#3A2410",
      border: "none",
      borderRadius: 13,
      padding: "15px 0",
      fontSize: 15,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uC9C0\uB3C4\uB85C \uAC00\uAE30 \u2192"))), modeLoaded && !mapMode && wkids.length >= 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 90,
      background: "rgba(8,10,30,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 380,
      background: "#15183A",
      borderRadius: 20,
      padding: "26px 20px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83D\uDDFA\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 17,
      fontWeight: 800,
      marginBottom: 6
    }
  }, "\uC9C0\uB3C4\uB97C \uC5B4\uB5BB\uAC8C \uBC1D\uD790\uAE4C\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 12.5,
      lineHeight: 1.6,
      marginBottom: 18
    }
  }, "\uB098\uC911\uC5D0 \uC9C0\uB3C4 \uC124\uC815(\u2699)\uC5D0\uC11C \uBC14\uAFC0 \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("button", {
    onClick: () => chooseMode("perkid"),
    style: {
      width: "100%",
      background: "rgba(242,193,107,0.13)",
      border: "1px solid rgba(242,193,107,0.5)",
      borderRadius: 14,
      padding: "16px 14px",
      marginBottom: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F2C16B",
      fontSize: 14.5,
      fontWeight: 800,
      marginBottom: 4
    }
  }, "\uD83D\uDC67\uD83D\uDC66 \uC544\uC774\uBCC4\uB85C \uAC01\uC790 \uC9C0\uB3C4"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 12,
      lineHeight: 1.55
    }
  }, "\uC544\uC774\uB9C8\uB2E4 \uC790\uAE30 \uC9C0\uB3C4\uB97C \uB530\uB85C \uBC1D\uD600\uC694. \uAC19\uC740 \uB098\uB77C\uB3C4 \uAC01\uC790 \uCF24 \uC218 \uC788\uC5B4\uC694.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => chooseMode("together"),
    style: {
      width: "100%",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 14,
      padding: "16px 14px",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 14.5,
      fontWeight: 800,
      marginBottom: 4
    }
  }, "\uD83C\uDF0D \uB2E4\uAC19\uC774 \uD55C \uC9C0\uB3C4"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9AA3C7",
      fontSize: 12,
      lineHeight: 1.55
    }
  }, "\uC628 \uAC00\uC871\uC774 \uD55C \uC9C0\uB3C4\uB97C \uD568\uAED8 \uBC1D\uD600\uC694. \uAE30\uB85D\uB9C8\uB2E4 \uB204\uAD6C\uC758 \uC88B\uC740 \uC810\uC778\uC9C0 \uACE0\uB97C \uC218 \uC788\uC5B4\uC694.")))), /*#__PURE__*/React.createElement("svg", {
    ref: svgRef,
    viewBox: "0 0 1000 500",
    style: WS.svg,
    preserveAspectRatio: "xMidYMid meet",
    onWheel: onWheel,
    onPointerDown: onDown,
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
    onPointerLeave: onUp
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "0",
    width: "1000",
    height: "500",
    fill: "transparent",
    onClick: () => {
      if (!moved.current) setSelId(null);
    }
  }), /*#__PURE__*/React.createElement("g", {
    transform: `translate(${view.tx} ${view.ty}) scale(${view.scale})`
  }, [166.7, 333.3, 500, 666.7, 833.3].map((x, i) => /*#__PURE__*/React.createElement("line", {
    key: "v" + i,
    x1: x,
    y1: 0,
    x2: x,
    y2: 500,
    stroke: "rgba(255,255,255,0.04)",
    strokeWidth: 0.6 / view.scale
  })), [125, 250, 375].map((y, i) => /*#__PURE__*/React.createElement("line", {
    key: "h" + i,
    x1: 0,
    y1: y,
    x2: 1000,
    y2: y,
    stroke: "rgba(255,255,255,0.04)",
    strokeWidth: 0.6 / view.scale
  })), COUNTRIES.map(c => {
    const lit = !!viewLitMap[c.i],
      isSel = c.i === selId;
    return /*#__PURE__*/React.createElement("path", {
      key: c.i,
      d: c.d,
      fill: lit ? WC.gold : WC.dim,
      stroke: isSel ? WC.sel : lit ? "rgba(255,227,166,0.6)" : WC.dimEdge,
      strokeWidth: (isSel ? 1.4 : 0.5) / view.scale,
      onClick: () => pick(c),
      style: {
        cursor: "pointer",
        transition: "fill .45s ease"
      }
    });
  }), COUNTRIES.map(c => {
    const lit = !!viewLitMap[c.i];
    const show = c.i === selId || lit && showLabels;
    if (!show) return null;
    const g = (viewGemsByCid[c.i] || []).length;
    return /*#__PURE__*/React.createElement("text", {
      key: "t" + c.i,
      x: c.cx,
      y: c.cy,
      fontSize: fs,
      textAnchor: "middle",
      fill: WC.cream,
      stroke: "rgba(0,0,0,.6)",
      strokeWidth: fs / 9,
      paintOrder: "stroke",
      style: {
        pointerEvents: "none",
        fontWeight: 800
      }
    }, c.n, lit ? ` · ${viewLitMap[c.i].order}` : "", g ? ` 💎${g}` : "");
  }))), /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.demoChip,
      ...(demo ? WS.demoChipOn : {})
    },
    onClick: () => setDemo(d => !d)
  }, "\u2726 \uCCB4\uD5D8"), /*#__PURE__*/React.createElement("div", {
    style: WS.zoomBtns
  }, /*#__PURE__*/React.createElement("button", {
    style: WS.zb,
    onClick: () => zoomAbout(1.4, 500, 250)
  }, "\uFF0B"), /*#__PURE__*/React.createElement("button", {
    style: WS.zb,
    onClick: () => zoomAbout(1 / 1.4, 500, 250)
  }, "\uFF0D"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.zb,
      fontSize: 11
    },
    onClick: () => setView({
      scale: 1,
      tx: 0,
      ty: 0
    })
  }, "\uC804\uCCB4"))), /*#__PURE__*/React.createElement("div", {
    style: WS.msgArea
  }, sel ? /*#__PURE__*/React.createElement("div", {
    style: WS.info,
    className: "rise",
    key: sel.i
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.infoHead
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.flag
  }, sel.fl), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.infoName
  }, sel.n, " ", /*#__PURE__*/React.createElement("span", {
    style: WS.infoEn
  }, sel.en)), /*#__PURE__*/React.createElement("div", {
    style: WS.infoMeta
  }, sel.ct, " \xB7 \uC218\uB3C4 ", sel.cap)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSelId(null);
      setAiText(null);
      setGemReveal(null);
    },
    style: {
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: WC.mute,
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 9,
      padding: "5px 10px",
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
      alignSelf: "flex-start"
    }
  }, "\u2715 \uB2E4\uC2DC \uACE0\uB974\uAE30")), sel.lang && sel.lang !== "—" && /*#__PURE__*/React.createElement("div", {
    style: WS.infoSub
  }, "\uC5B8\uC5B4 ", sel.lang), selLit && /*#__PURE__*/React.createElement("div", {
    style: WS.litLine
  }, "\u2605 ", selLit.order, "\uBC88\uC9F8\uB85C \uBC1D\uD78C \uB098\uB77C \xB7 ", fmtDate(selLit.date), " \u2014 \u201C", selLit.text, "\u201D"), selLit && /*#__PURE__*/React.createElement("div", {
    style: WS.gemBox
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.gemHead
  }, "\uD83D\uDC8E \uBCF4\uC11D ", selGems.length, "\uAC1C ", selGems.length === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.mute,
      fontWeight: 400
    }
  }, "\xB7 \uAE30\uB85D\uC744 \uB354 \uB0A8\uAE30\uBA74 \uBAA8\uC5EC\uC694"), selGems.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setMuted(m => !m),
    style: {
      marginLeft: 8,
      background: "none",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 8,
      padding: "2px 8px",
      color: WC.mute,
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, muted ? "🔇 소리 꺼짐" : "🔊 소리 켜짐")), /*#__PURE__*/React.createElement("div", {
    style: WS.gemList
  }, selGems.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: WS.gemItem,
    onClick: () => {
      setGemReveal(gemReveal && gemReveal.id === g.id ? null : g);
      if (!g.findTogether && !(gemReveal && gemReveal.id === g.id)) speakLang(g.word, g.bcp47, g.pron);
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.gemItemTop
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.gemItemVirtue
  }, "\u300C", g.virtue, "\u300D"), !g.findTogether && /*#__PURE__*/React.createElement("span", {
    style: WS.gemItemWord
  }, g.word), g.findTogether && /*#__PURE__*/React.createElement("span", {
    style: WS.gemItemFind
  }, "\uD83C\uDF0D \uD568\uAED8 \uCC3E\uC544\uBD10\uC694")), g.note && /*#__PURE__*/React.createElement("div", {
    style: WS.gemItemNote
  }, "\u201C", g.note, "\u201D"), gemReveal && gemReveal.id === g.id && !g.findTogether && /*#__PURE__*/React.createElement("div", {
    style: WS.gemItemExpand
  }, /*#__PURE__*/React.createElement("button", {
    style: WS.spk,
    onClick: e => {
      e.stopPropagation();
      if (muted) {
        setMuted(false);
        setTimeout(() => speakLang(g.word, g.bcp47, g.pron), 60);
      } else {
        speakLang(g.word, g.bcp47, g.pron);
      }
    }
  }, muted ? "🔇" : "🔊", " ", g.word, " ", g.pron && `/${g.pron}/`), g.sentence && /*#__PURE__*/React.createElement("div", {
    style: WS.gemItemSentence
  }, "\u201C", g.sentence, "\u201D ", g.spron && /*#__PURE__*/React.createElement("span", {
    style: WS.gemP
  }, "/", g.spron, "/"), " ", /*#__PURE__*/React.createElement("button", {
    style: WS.spk,
    onClick: e => {
      e.stopPropagation();
      speakLang(g.sentence, g.bcp47, g.spron);
    }
  }, "\uD83D\uDD0A"))))))), /*#__PURE__*/React.createElement("div", {
    style: WS.infoBtns
  }, /*#__PURE__*/React.createElement("button", {
    style: WS.aiBtn,
    onClick: () => askAI(sel),
    disabled: aiLoading
  }, aiText ? "✨ 이야기 접기" : "✨ 이 나라 이야기 보기"), /*#__PURE__*/React.createElement("button", {
    style: WS.ytBtn,
    onClick: () => openYoutube(sel)
  }, "\u25B6 \uC720\uD29C\uBE0C")), aiText && /*#__PURE__*/React.createElement("div", {
    style: WS.aiText
  }, aiText.adult && typeof aiText.adult === "object" ? /*#__PURE__*/React.createElement("div", null, aiText.adult.summary && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      lineHeight: 1.7,
      color: WC.cream,
      marginBottom: 13
    }
  }, aiText.adult.summary), [["🗺️ 지리", aiText.adult.geo], ["📜 역사", aiText.adult.history], ["🎭 문화", aiText.adult.culture], ["⭐ 인물", aiText.adult.people]].map(function (row) {
    return row[1] ? /*#__PURE__*/React.createElement("div", {
      key: row[0],
      style: {
        marginBottom: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: WC.gold,
        marginBottom: 3
      }
    }, row[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        lineHeight: 1.65,
        color: WC.cream,
        opacity: 0.92
      }
    }, row[1])) : null;
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.7
    }
  }, aiText.adult || aiText.brief || "이 나라의 자세한 정보는 곧 채워질 거예요."), aiText.story && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setKidOpen(v => !v),
    style: {
      width: "100%",
      textAlign: "left",
      background: "rgba(159,225,203,0.08)",
      border: "1px solid rgba(159,225,203,0.28)",
      borderRadius: 11,
      padding: "9px 12px",
      color: "#9FE1CB",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDC67 \uC544\uC774\uC640 \uC774\uC57C\uAE30 \uB098\uB204\uAE30 ", kidOpen ? "\u25b4" : "\u25be"), kidOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: "11px 13px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 11,
      color: WC.cream,
      fontSize: 13,
      lineHeight: 1.75,
      whiteSpace: "pre-line"
    }
  }, aiText.story)))) : greet ? /*#__PURE__*/React.createElement("div", {
    style: WS.greet
  }, greet) : message ? /*#__PURE__*/React.createElement("div", {
    style: WS.msgCard,
    className: "rise",
    key: (message.title || "") + count
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.msgTitle
  }, message.title), /*#__PURE__*/React.createElement("div", {
    style: WS.msgBody
  }, message.body)) : /*#__PURE__*/React.createElement("div", {
    style: WS.empty
  }, count === 0 ? "지도에서 나라를 톡 고르고, 오늘 아이의 좋은 점을 적어보세요." : litToday ? "오늘의 새 땅은 밝혔어요 🌙 밝힌 나라를 골라 아이의 좋은 점을 더 남겨 보석을 모아보세요." : "오늘 밝힐 나라를 지도에서 톡 골라보세요.")), sel && selLit && /*#__PURE__*/React.createElement("div", {
    style: WS.virtuePickWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.virtuePickLabel
  }, "\uC774 \uC88B\uC740 \uC810\uC5D0 \uC5B4\uC6B8\uB9AC\uB294 \uB355\uB2F4\uC744 \uACE8\uB77C\uC694", /*#__PURE__*/React.createElement("span", {
    style: WS.virtueCount
  }, " \xB7 ", wonVirtues.size, "/", VIRTUES.length)), /*#__PURE__*/React.createElement("div", {
    style: WS.virtuePickChips
  }, VIRTUES.map(v => {
    const won = wonVirtues.has(v);
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      disabled: won,
      onClick: () => {
        if (!won) setPickedVirtue(pickedVirtue === v ? null : v);
      },
      style: {
        ...WS.virtueChip,
        ...(won ? WS.virtueChipWon : pickedVirtue === v ? WS.virtueChipOn : {})
      }
    }, won ? "💎 " : "", v);
  })), allVirtuesDone && /*#__PURE__*/React.createElement("div", {
    style: WS.virtueComplete
  }, "\uD83C\uDF89 \u300C", sel.n, "\u300D\uC758 \uB355\uB2F4 13\uAC00\uC9C0\uB97C \uBAA8\uB450 \uBAA8\uC558\uC5B4\uC694!"), /*#__PURE__*/React.createElement("div", {
    style: WS.shareRow
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.shareToggle,
      ...(shareOff ? WS.shareToggleOn : {})
    },
    onClick: () => setShareOff(s => !s)
  }, shareOff ? "🔒 나만 보기" : "🌍 함께 광장에 나눠요"), /*#__PURE__*/React.createElement("span", {
    style: WS.shareHint
  }, shareOff ? "이 좋은 점은 나만 봐요" : "좋은 점은 다른 엄마들과 나눠요"))), sel && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: "14px 14px 4px",
      background: "rgba(255,255,255,0.035)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 16
    }
  }, perKid && activeKid && /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.gold,
      fontSize: 11.5,
      fontWeight: 700,
      margin: "0 2px 2px"
    }
  }, "\u2728 ", withName(activeKid), "\uC758 \uC9C0\uB3C4\uC5D0 \uAE30\uB85D\uD574\uC694"), !perKid && wkids.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      margin: "0 2px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.mute,
      fontSize: 11.5
    }
  }, "\uB204\uAD6C\uC758 \uC88B\uC740 \uC810?"), wkids.map(k => /*#__PURE__*/React.createElement("button", {
    key: k.name,
    onClick: () => pickChildW(k.name),
    style: {
      background: curChild === k.name ? "rgba(242,193,107,0.16)" : "rgba(255,255,255,0.05)",
      border: curChild === k.name ? "1px solid rgba(242,193,107,0.55)" : "1px solid rgba(255,255,255,0.14)",
      color: curChild === k.name ? WC.gold : WC.mute,
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 99,
      padding: "5px 12px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, k.temper ? EMOJI_T[k.temper] + " " : "", k.name))), obsNudge && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9FE1CB",
      fontSize: 11.5,
      lineHeight: 1.5,
      margin: "6px 2px 0"
    }
  }, "\uD83C\uDF31 ", obsNudge), sel && (selLit || canLightSel) && /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.obsBar,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.obsTag
  }, "\uD83C\uDF0D \uC624\uB298\uC758 \uAD00\uCC30"), /*#__PURE__*/React.createElement("span", {
    style: WS.obsText
  }, obsToday())), /*#__PURE__*/React.createElement("div", {
    style: WS.inputRow
  }, /*#__PURE__*/React.createElement("textarea", {
    ref: inputRef,
    value: text,
    onChange: e => setText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote();
    },
    placeholder: !sel ? "지도에서 나라를 톡 고르세요" : selLit ? `「${sel.n}」에 아이의 좋은 점 더 적기` : canLightSel ? `「${sel.n}」 — 오늘 아이의 좋은 점을 적어보세요` : "오늘의 새 땅은 다 밝혔어요 🌙",
    style: WS.input,
    rows: 2,
    maxLength: 500,
    disabled: !!sel && !selLit && !canLightSel
  }), /*#__PURE__*/React.createElement("button", {
    onClick: submitNote,
    style: {
      ...WS.btn,
      opacity: sel && (selLit ? text.trim() && !gemLoading : canLightSel && text.trim()) ? 1 : 0.5
    }
  }, btnLabel))), /*#__PURE__*/React.createElement("div", {
    style: WS.footer
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSelDay(todayKey);
      setCal({
        y: new Date().getFullYear(),
        m: new Date().getMonth()
      });
      setShowCal(true);
    },
    style: WS.navBtn
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.navIcon
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("span", {
    style: WS.navLabel
  }, "\uB2EC\uB825")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowList(s => !s);
    },
    style: WS.navBtn
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.navIcon
  }, "\uD83D\uDDFA\uFE0F"), /*#__PURE__*/React.createElement("span", {
    style: WS.navLabel
  }, "\uB300\uB959\xB7\uB098\uB77C")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCalmText("");
      setCalmRes(null);
      setShowCalm(true);
    },
    style: WS.navBtn
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.navIcon
  }, "\uD83D\uDD4A\uFE0F"), /*#__PURE__*/React.createElement("span", {
    style: WS.navLabel
  }, "\uB9C8\uC74C \uBE44\uC6B0\uAE30")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowStock(true),
    style: WS.navBtn
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.navIcon
  }, "\uD83C\uDFFA"), /*#__PURE__*/React.createElement("span", {
    style: WS.navLabel
  }, "\uACF3\uAC04")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (profile) {
        setShowPlaza(true);
        loadPlaza();
      } else setShowProfile(true);
    },
    style: WS.navBtn
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.navIcon
  }, "\uD83C\uDF0D"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...WS.navLabel,
      color: WC.gold
    }
  }, "\uD568\uAED8 \uAD11\uC7A5"))), showList && /*#__PURE__*/React.createElement("div", {
    style: WS.panel
  }, CONT_ORDER.filter(k => CONT_IDS[k].length).map(k => {
    const ids = CONT_IDS[k];
    const lit = ids.filter(id => litMap[id]).length;
    const done = lit === ids.length && k !== "기타";
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.listHead
    }, k, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: done ? WC.gold : WC.mute,
        fontWeight: 400
      }
    }, lit, "/", ids.length, done ? " ✓" : "")), /*#__PURE__*/React.createElement("div", {
      style: WS.chips
    }, ids.map(id => {
      const c = BY_ID[id];
      const isLit = !!litMap[id];
      return /*#__PURE__*/React.createElement("button", {
        key: id,
        style: {
          ...WS.chip,
          ...(isLit ? WS.chipLit : {})
        },
        onClick: () => focusCountry(c)
      }, c.fl, " ", c.n, isLit ? ` · ${litMap[id].order}` : "");
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: WS.proto
  }, demo ? "체험 모드" : "")), showStock && (() => {
    const fMatch = e => stockFilter === null || (stockFilter === "함께" ? !e.child : e.child === stockFilter);
    const stock = lights.filter(fMatch).length + gems.filter(fMatch).length;
    const sosShown = sos.filter(s => stockFilter === null || (stockFilter === "함께" ? !s.child : s.child === stockFilter));
    const full = stock >= 30,
      mid = stock >= 10;
    return /*#__PURE__*/React.createElement("div", {
      style: WS.overlay,
      onClick: () => setShowStock(false)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...WS.sheet,
        maxWidth: 400
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.sheetHead
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.sheetTitle
    }, "\uB9C8\uC74C \uACF3\uAC04"), /*#__PURE__*/React.createElement("button", {
      style: WS.x,
      onClick: () => setShowStock(false)
    }, "\u2715")), wkids.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: 12
      }
    }, [null, ...wkids.map(k => k.name), ...(hasLegacy ? ["함께"] : [])].map(l => {
      const on = stockFilter === l;
      const kk = l && l !== "함께" ? wkids.find(k => k.name === l) : null;
      return /*#__PURE__*/React.createElement("button", {
        key: l || "전체",
        onClick: () => setStockFilter(l),
        style: {
          background: on ? "rgba(242,193,107,0.16)" : "rgba(255,255,255,0.04)",
          border: on ? "1px solid rgba(242,193,107,0.55)" : "1px solid rgba(255,255,255,0.12)",
          color: on ? WC.gold : WC.mute,
          fontSize: 11.5,
          fontWeight: 700,
          borderRadius: 99,
          padding: "4px 11px",
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, l === null ? "전체" : l === "함께" ? "함께" : `${kk && kk.temper ? EMOJI_T[kk.temper] + " " : ""}${l}`);
    })), /*#__PURE__*/React.createElement("div", {
      style: WS.stockJar
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.stockNum
    }, stock), /*#__PURE__*/React.createElement("div", {
      style: WS.stockUnit
    }, stockFilter && stockFilter !== "함께" ? `그동안 발견한 ${withName(stockFilter)}의 좋은 점` : "그동안 발견한 아이의 좋은 점")), sosShown.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "rgba(159,225,203,0.07)",
        border: "1px solid rgba(159,225,203,0.25)",
        borderRadius: 14,
        padding: "13px 14px",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#9FE1CB",
        fontSize: 12.5,
        fontWeight: 800,
        marginBottom: 8
      }
    }, "\uD83C\uDF3F \uB9C8\uC74C\uC758 \uBCF4\uC11D \u2014 \uD63C\uB0B4\uB294 \uB300\uC2E0 \uBA48\uCD98 \uC21C\uAC04\uB4E4"), sosShown.slice(0, 8).map(s => {
      const d = new Date(s.id);
      const kk = s.child ? wkids.find(k => k.name === s.child) : null;
      return /*#__PURE__*/React.createElement("div", {
        key: s.id,
        style: {
          fontSize: 12,
          color: WC.cream,
          lineHeight: 1.6,
          marginBottom: 5
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: WC.mute
        }
      }, d.getMonth() + 1, ".", d.getDate()), s.child ? ` · ${kk && kk.temper ? EMOJI_T[kk.temper] : ""}${s.child}` : "", s.good ? ` — ${s.good}` : " — 멈추고, 되물었어요");
    }), sosShown.length > 8 && /*#__PURE__*/React.createElement("div", {
      style: {
        color: WC.mute,
        fontSize: 11
      }
    }, "\uC678 ", sosShown.length - 8, "\uAC1C")), (() => {
      // 기록 모아보기 — 빛+보석 통합, 최신순 (필터 적용)
      const recs = [...lights.filter(fMatch).map(e => ({
        id: e.id,
        date: e.date,
        txt: e.text,
        cid: e.cid,
        kind: "✨",
        child: e.child
      })), ...gems.filter(fMatch).filter(g => g.note && g.note.trim()).map(g => ({
        id: g.id,
        date: g.date,
        txt: g.note,
        cid: g.cid,
        kind: "💎",
        child: g.child
      }))].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (recs.length === 0) return null;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 14,
          padding: "13px 14px",
          marginBottom: 12,
          maxHeight: 260,
          overflowY: "auto"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          color: WC.gold,
          fontSize: 12.5,
          fontWeight: 800,
          marginBottom: 8
        }
      }, "\uD83D\uDCD6 ", stockFilter && stockFilter !== "함께" ? `${withName(stockFilter)}의 좋은 점 기록` : "좋은 점 기록 모아보기"), recs.slice(0, 40).map(r => {
        const d = new Date(r.date);
        const cc = BY_ID[r.cid];
        const kk = r.child ? wkids.find(k => k.name === r.child) : null;
        return /*#__PURE__*/React.createElement("div", {
          key: r.kind + r.id,
          style: {
            fontSize: 12,
            color: WC.cream,
            lineHeight: 1.6,
            marginBottom: 6,
            borderBottom: "1px dashed rgba(255,255,255,0.06)",
            paddingBottom: 5
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            color: WC.mute
          }
        }, d.getMonth() + 1, ".", d.getDate()), stockFilter === null && r.child ? ` · ${kk && kk.temper ? EMOJI_T[kk.temper] : ""}${r.child}` : "", cc ? ` · ${cc.fl}` : "", " ", r.kind, " ", r.txt);
      }), recs.length > 40 && /*#__PURE__*/React.createElement("div", {
        style: {
          color: WC.mute,
          fontSize: 11
        }
      }, "\uC678 ", recs.length - 40, "\uAC1C \u2014 \uB2EC\uB825\uC5D0\uC11C \uB0A0\uC9DC\uBCC4\uB85C \uBCFC \uC218 \uC788\uC5B4\uC694"));
    })(), !mid && /*#__PURE__*/React.createElement("div", {
      style: WS.stockMsg
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.stockTitle
    }, "\uC9C0\uAE08\uC740 \uC88B\uC740 \uC810\uC744 \uBAA8\uC73C\uB294 \uB54C\uC608\uC694."), /*#__PURE__*/React.createElement("div", {
      style: WS.stockBody
    }, "\uACF3\uAC04\uC774 \uCC28\uC57C \uADF8 \uD55C\uB9C8\uB514\uAC00 \uD798\uC744 \uAC00\uC838\uC694. \uACE0\uBB38\uB2D8 \uB9D0\uC500\uC774\uC5D0\uC694. \u201C\uCE6D\uCC2C\uD558\uC138\uC694, \uAFB8\uC9D6\uC9C0 \uB9C8\uC2DC\uACE0\u2026 \uB9C8\uC74C\uC5D0 \uC548 \uB4DC\uB294 \uC810 \uACE0\uCE58\uB294 \uBC29\uBC95\uC785\uB2C8\uB2E4.\u201D \uC624\uB298\uB3C4 \uC544\uC774\uC758 \uC791\uC740 \uC88B\uC740 \uC21C\uAC04 \uD558\uB098\uB97C \uB2F4\uC544 \uBCF4\uC138\uC694.")), mid && !full && /*#__PURE__*/React.createElement("div", {
      style: WS.stockMsg
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.stockTitle
    }, "\uACF3\uAC04\uC774 \uCC28\uC624\uB974\uACE0 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
      style: WS.stockBody
    }, "\uC544\uC774 \uB9C8\uC74C\uC5D0 \uC88B\uC740 \uC810\uC774 \uC313\uC774\uB294 \uC911\uC774\uC5D0\uC694. \uC870\uAE08\uB9CC \uB354 \uBAA8\uC544 \uC8FC\uC138\uC694. \uACF3\uAC04\uC774 \uAC00\uB4DD \uCC28\uBA74, \uADF8\uB54C \u2018\uB531 \uD558\uB098\u2019\uB97C \uAC74\uB12C \uD798\uC774 \uC0DD\uACA8\uC694.")), full && /*#__PURE__*/React.createElement("div", {
      style: {
        ...WS.stockMsg,
        borderColor: "rgba(242,193,107,0.4)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...WS.stockTitle,
        color: WC.gold
      }
    }, "\uB9C8\uC74C \uACF3\uAC04\uC774 \uAF64 \uCC3C\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
      style: WS.stockBody
    }, "\uADF8\uB3D9\uC548 \uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 ", stock, "\uAC00\uC9C0\uB098 \uBC1C\uACAC\uD558\uC168\uC5B4\uC694. \uC774\uC81C \uC544\uC774 \uB9C8\uC74C \uACF3\uAC04\uC774 \uB4E0\uB4E0\uD574\uC694. \uD639\uC2DC \uB531 \uD558\uB098, \u201C\uC774\uAC74 \uB108\uB2F5\uC9C0 \uC54A\uC740\uB370?\u201D \uD558\uACE0 \uC2F6\uC740 \uAC8C \uC788\uC73C\uC168\uB098\uC694?"), /*#__PURE__*/React.createElement("div", {
      style: WS.stockNote
    }, "\u2014 \uB2E8, \uD63C\uB0B4\uC9C0 \uB9D0\uACE0 \uD638\uC18C\uB85C. \u201C\uB108\uB294 \u25CB\u25CB\uD55C \uC544\uC774\u201D\uB77C\uACE0 \uADDC\uC815\uD558\uC9C0 \uB9D0\uACE0, \u201C\uC774\uAC74 \uB108\uB2F5\uC9C0 \uC54A\uC544\u201D \uD55C \uB9C8\uB514\uB9CC. \uADF8 \uD558\uB098\uAC00 \uC544\uC774\uB97C \uB2E4\uC2DC \uC77C\uC73C\uCF1C\uC694."))));
  })(), showCalm && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setShowCalm(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.sheet,
      maxWidth: 400
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetHead
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetTitle
  }, "\uB9C8\uC74C \uB0B4\uB824\uB193\uAE30"), /*#__PURE__*/React.createElement("button", {
    style: WS.x,
    onClick: () => setShowCalm(false)
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: WS.calmLead
  }, "\uC544\uC774\uC5D0\uAC8C \uC3DF\uAE30 \uC804\uC5D0, \uC5EC\uAE30 \uBA3C\uC800 \uC3DF\uC544 \uBCF4\uC138\uC694.", /*#__PURE__*/React.createElement("br", null), "\uC801\uC5B4 \uB0B4\uB824\uAC00\uB2E4 \uBCF4\uBA74, \uB9C8\uC74C\uC774 \uD55C\uACB0 \uAC00\uB77C\uC549\uC544\uC694."), /*#__PURE__*/React.createElement("textarea", {
    value: calmText,
    onChange: e => setCalmText(e.target.value),
    placeholder: "\uC9C0\uAE08 \uC544\uC774\uC5D0\uAC8C \uD558\uACE0 \uC2F6\uC740 \uB9D0, \uADF8\uB300\uB85C \uC801\uC73C\uC154\uB3C4 \uB3FC\uC694.",
    style: WS.calmArea
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.calmBtn,
      opacity: calmText.trim() ? 1 : 0.5
    },
    disabled: !calmText.trim(),
    onClick: runCalm
  }, "\uB9C8\uC74C \uBE44\uC6B0\uAE30"), calmRes && calmRes.done && /*#__PURE__*/React.createElement("div", {
    style: WS.calmResBox
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.calmRecv
  }, calmRes.word)), /*#__PURE__*/React.createElement("div", {
    style: WS.calmNote
  }, "\uC801\uC740 \uB9D0\uC740 \uC5B4\uB514\uC5D0\uB3C4 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC544\uC694. \uC3DF\uC544\uB0B4\uACE0, \uB0B4\uB824\uB193\uB294 \uC790\uB9AC\uC608\uC694."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowCalm(false);
      onCoach();
    },
    style: {
      display: "block",
      width: "100%",
      marginTop: 12,
      background: "rgba(255,255,255,0.05)",
      border: "1px dashed rgba(242,193,107,0.4)",
      borderRadius: 12,
      padding: "10px 0",
      color: WC.gold,
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uB354 \uAE4A\uAC8C \uC774\uC57C\uAE30\uD558\uACE0 \uC2F6\uB2E4\uBA74 \u2014 \uCABD\uCABD\uC774 \uCF54\uCE58 \u2192"))), showProfile && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setShowProfile(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.sheet,
      maxWidth: 400
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetHead
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetTitle
  }, profile ? "내 별명 바꾸기" : "함께하려면 별명을 정해요"), /*#__PURE__*/React.createElement("button", {
    style: WS.x,
    onClick: () => setShowProfile(false)
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: WS.pfLead
  }, "\uB2E4\uB978 \uC5C4\uB9C8\uB4E4\uACFC \uC88B\uC740 \uC810\uC744 \uB098\uB20C \uB54C \uBCF4\uC774\uB294 \uC774\uB984\uC774\uC5D0\uC694.", /*#__PURE__*/React.createElement("br", null), "\uC544\uC774 \uC774\uB984\uC73C\uB85C \uB530\uB73B\uD558\uAC8C \uB9CC\uB4E4\uC5B4\uC694 \uD83C\uDF38"), /*#__PURE__*/React.createElement("div", {
    style: WS.pfField
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.pfLabel
  }, "\uC544\uC774 \uC774\uB984"), /*#__PURE__*/React.createElement("input", {
    value: pfChild,
    onChange: e => setPfChild(e.target.value),
    placeholder: "\uC608: \uBBFC\uC11C",
    style: WS.pfInput,
    maxLength: 10
  })), /*#__PURE__*/React.createElement("div", {
    style: WS.pfField
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.pfLabel
  }, "\uB098\uB294"), /*#__PURE__*/React.createElement("div", {
    style: WS.pfRoles
  }, ["맘", "아빠", "할머니", "이모"].map(r => /*#__PURE__*/React.createElement("button", {
    key: r,
    onClick: () => setPfRole(r),
    style: {
      ...WS.pfRole,
      ...(pfRole === r ? WS.pfRoleOn : {})
    }
  }, r)))), /*#__PURE__*/React.createElement("div", {
    style: WS.pfField
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.pfLabel
  }, "\uC544\uC774\uAC00 \uD0DC\uC5B4\uB09C \uD574 (4\uC790\uB9AC)"), /*#__PURE__*/React.createElement("input", {
    value: pfYear,
    onChange: e => setPfYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4)),
    placeholder: "\uC608: 2018",
    style: WS.pfInput,
    inputMode: "numeric"
  }), /*#__PURE__*/React.createElement("div", {
    style: WS.pfHint
  }, "\uD3F0\uC744 \uBC14\uAFD4\uB3C4 \u300C", pfChild || "아이이름", " \xB7 ", pfYear || "0000", "\u300D\uB85C \uC774\uC5B4\uAC00\uC694.")), pfChild.trim() && /*#__PURE__*/React.createElement("div", {
    style: WS.pfPreview
  }, "\uB0B4 \uBCC4\uBA85\uC740 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: WC.gold
    }
  }, pfChild.trim() + pfRole), " \uC774\uC5D0\uC694."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.pfSave,
      opacity: pfChild.trim() && pfYear.length === 4 ? 1 : 0.5
    },
    disabled: !(pfChild.trim() && pfYear.length === 4),
    onClick: () => {
      makeProfile(pfChild, pfRole, pfYear);
      setShowProfile(false);
      setShowPlaza(true);
      loadPlaza();
    }
  }, profile ? "바꾸기" : "이 별명으로 시작하기"))), showPlaza && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setShowPlaza(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.sheet,
      maxWidth: 420
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetHead
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetTitle
  }, "\uD83C\uDF0D \uD568\uAED8 \uAD11\uC7A5"), /*#__PURE__*/React.createElement("button", {
    style: WS.x,
    onClick: () => setShowPlaza(false)
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaWho
  }, profile ? /*#__PURE__*/React.createElement(React.Fragment, null, "\uB098\uB294 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: WC.gold
    }
  }, profile.nick)) : "함께하는 중", /*#__PURE__*/React.createElement("button", {
    style: WS.plazaEdit,
    onClick: () => {
      setPfChild(profile ? profile.child : "");
      setPfRole(profile ? profile.role : "맘");
      setPfYear(profile ? profile.year : "");
      setShowProfile(true);
    }
  }, "\uBCC4\uBA85 \uBC14\uAFB8\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center",
      marginBottom: 10,
      flexWrap: "wrap"
    }
  }, myGroup ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlazaTab("all"),
    style: {
      background: plazaTab === "all" ? "rgba(242,193,107,0.16)" : "rgba(255,255,255,0.04)",
      border: plazaTab === "all" ? "1px solid rgba(242,193,107,0.55)" : "1px solid rgba(255,255,255,0.12)",
      color: plazaTab === "all" ? WC.gold : WC.mute,
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 99,
      padding: "5px 12px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83C\uDF0D \uC804\uCCB4"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlazaTab("group"),
    style: {
      background: plazaTab === "group" ? "rgba(255,158,109,0.16)" : "rgba(255,255,255,0.04)",
      border: plazaTab === "group" ? "1px solid rgba(255,158,109,0.6)" : "1px solid rgba(255,255,255,0.12)",
      color: plazaTab === "group" ? "#FF9E6D" : WC.mute,
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 99,
      padding: "5px 12px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83C\uDF38 ", myGroup), /*#__PURE__*/React.createElement("button", {
    onClick: leaveGroup,
    style: {
      marginLeft: "auto",
      background: "none",
      border: "none",
      color: WC.mute,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "underline",
      textUnderlineOffset: 2
    }
  }, "\uB098\uAC00\uAE30")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setGrpOpen(!grpOpen);
      setGrpMsg(null);
    },
    style: {
      background: "rgba(255,158,109,0.1)",
      border: "1px solid rgba(255,158,109,0.4)",
      color: "#FF9E6D",
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 99,
      padding: "5px 13px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83C\uDF38 \uADF8\uB8F9 \uCC3E\uAE30 \xB7 \uB9CC\uB4E4\uAE30")), grpOpen && !myGroup && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "13px 13px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#FF9E6D",
      fontSize: 12.5,
      fontWeight: 800,
      marginBottom: 7
    }
  }, "\uD83D\uDD0D \uADF8\uB8F9 \uCC3E\uC544 \uAC00\uC785\uD558\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: grpQ,
    onChange: e => setGrpQ(e.target.value),
    onKeyDown: e => e.key === "Enter" && searchGroups(),
    placeholder: "\uADF8\uB8F9 \uC774\uB984\uC73C\uB85C \uAC80\uC0C9",
    style: {
      flex: 1,
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 9,
      padding: "9px 11px",
      color: "#F3EEE3",
      fontSize: 12.5,
      fontFamily: "inherit"
    }
  }), /*#__PURE__*/React.createElement("button", {
    disabled: grpBusy || !grpQ.trim(),
    onClick: searchGroups,
    style: {
      background: "rgba(255,158,109,0.15)",
      border: "1px solid rgba(255,158,109,0.45)",
      color: "#FF9E6D",
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 9,
      padding: "0 14px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, grpBusy ? "…" : "검색")), grpResults && grpResults.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.name,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      background: "rgba(0,0,0,0.2)",
      borderRadius: 10,
      padding: "9px 11px",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 13,
      fontWeight: 700
    }
  }, "\uD83C\uDF38 ", g.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 10.5,
      marginTop: 2
    }
  }, g.boss ? `방장 ${g.boss}` : "", g.size ? ` · ${g.size}명` : "", g.intro ? ` · ${g.intro}` : "")), /*#__PURE__*/React.createElement("button", {
    onClick: () => joinGroup(g.name),
    style: {
      background: "rgba(159,225,203,0.15)",
      border: "1px solid rgba(159,225,203,0.4)",
      color: "#9FE1CB",
      fontSize: 11.5,
      fontWeight: 700,
      borderRadius: 9,
      padding: "6px 12px",
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    }
  }, "\uAC00\uC785"))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(255,255,255,0.08)",
      margin: "10px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#FF9E6D",
      fontSize: 12.5,
      fontWeight: 800,
      marginBottom: 7
    }
  }, "\u270B \uC0C8 \uADF8\uB8F9 \uB9CC\uB4E4\uAE30 \uC694\uCCAD (\uBC29\uC7A5)"), /*#__PURE__*/React.createElement("input", {
    value: grpReqName,
    onChange: e => setGrpReqName(e.target.value),
    placeholder: "\uADF8\uB8F9 \uC774\uB984 (\uC608: \uB9C8\uB354\uC0C8\uC2F9\uBC18)",
    maxLength: 20,
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 9,
      padding: "9px 11px",
      color: "#F3EEE3",
      fontSize: 12.5,
      fontFamily: "inherit",
      marginBottom: 6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: grpReqSize,
    onChange: e => setGrpReqSize(e.target.value.replace(/[^0-9]/g, "").slice(0, 3)),
    inputMode: "numeric",
    placeholder: "\uC778\uC6D0 (\uC608: 8)",
    style: {
      flex: 1,
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 9,
      padding: "9px 11px",
      color: "#F3EEE3",
      fontSize: 12.5,
      fontFamily: "inherit"
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: grpReqIntro,
    onChange: e => setGrpReqIntro(e.target.value),
    placeholder: "\uD55C \uC904 \uC18C\uAC1C (\uC120\uD0DD)",
    maxLength: 30,
    style: {
      flex: 2,
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 9,
      padding: "9px 11px",
      color: "#F3EEE3",
      fontSize: 12.5,
      fontFamily: "inherit"
    }
  })), /*#__PURE__*/React.createElement("button", {
    disabled: grpBusy || !grpReqName.trim(),
    onClick: requestGroup,
    style: {
      width: "100%",
      background: grpReqName.trim() ? "linear-gradient(135deg,#FF9E6D,#F2C16B)" : "rgba(255,255,255,0.08)",
      color: grpReqName.trim() ? "#3A2410" : WC.mute,
      border: "none",
      borderRadius: 10,
      padding: "10px 0",
      fontSize: 12.5,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, grpBusy ? "보내는 중…" : "만들기 요청 보내기"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 10.5,
      lineHeight: 1.5,
      marginTop: 6
    }
  }, "\uC6B4\uC601\uC790\uAC00 \uD655\uC778\uD574 \uC5F4\uC5B4\uC8FC\uBA74, \uD300\uC6D0\uB4E4\uC774 \uADF8\uB8F9 \uC774\uB984\uC73C\uB85C \uAC80\uC0C9\uD574 \uAC00\uC785\uD574\uC694."), grpMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      color: grpMsg.ok ? "#9FE1CB" : "#FF9E9E",
      fontSize: 11.5,
      lineHeight: 1.55
    }
  }, grpMsg.t)), plazaView && plazaView.celebs.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg, rgba(242,193,107,0.13), rgba(255,158,109,0.09))",
      border: "1px solid rgba(242,193,107,0.4)",
      borderRadius: 14,
      padding: "12px 14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.gold,
      fontSize: 12.5,
      fontWeight: 800,
      marginBottom: 7
    }
  }, "\uD83C\uDF89 \uC624\uB298\uC758 \uCD95\uD558"), plazaView.celebs.map((cb, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: 12.5,
      color: WC.cream,
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginRight: 4
    }
  }, cb.bird), /*#__PURE__*/React.createElement("b", {
    style: {
      color: WC.gold
    }
  }, cb.nick), "\uB2D8\uC774 ", cb.text)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 10.5,
      marginTop: 6
    }
  }, "\uC624\uB298 \uD558\uB8E8, \uD568\uAED8 \uCD95\uD558\uD574 \uC8FC\uC138\uC694 \uD83D\uDE4C")), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStats
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStat
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStatLabel
  }, "\uC6B0\uB9AC \uBAA8\uB450 \uBC1D\uD78C \uB098\uB77C"), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStatNum
  }, plazaView ? plazaView.naraCount.toLocaleString() : "—")), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStat
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStatLabel
  }, "\uD568\uAED8\uD55C \uC5C4\uB9C8"), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStatNum
  }, plazaView ? plazaView.momCount : "—"))), plazaLoading && /*#__PURE__*/React.createElement("div", {
    style: WS.plazaMsg
  }, "\uAD11\uC7A5\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC774\uC5D0\uC694\u2026"), !plazaLoading && plazaView && plazaView.feed.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: WS.plazaMsg
  }, "\uC544\uC9C1 \uB3C4\uCC29\uD55C \uC88B\uC740 \uC810\uC774 \uC5C6\uC5B4\uC694.", /*#__PURE__*/React.createElement("br", null), "\uC624\uB298 \uC6B0\uB9AC \uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 \uCC98\uC74C\uC73C\uB85C \uB0A8\uACA8\uBCFC\uAE4C\uC694? \uD83C\uDF38"), plazaView && plazaView.feed.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: WS.plazaSecTitle
  }, "\uBC29\uAE08 \uB3C4\uCC29\uD55C \uC88B\uC740 \uC810"), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaFeed
  }, plazaView.feed.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: f.key || i,
    style: WS.plazaCard
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.plazaCardHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, f.bird), /*#__PURE__*/React.createElement("span", {
    style: WS.plazaNick
  }, f.nick), mentorSet[f.nick] && /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(242,193,107,0.15)",
      border: "1px solid rgba(242,193,107,0.45)",
      color: WC.gold,
      fontSize: 9.5,
      fontWeight: 800,
      borderRadius: 99,
      padding: "1px 7px"
    }
  }, "\uD83C\uDF1F \uBA58\uD1A0"), f.year && /*#__PURE__*/React.createElement("span", {
    style: WS.plazaYear
  }, f.year, "\uB144\uC0DD"), /*#__PURE__*/React.createElement("span", {
    style: WS.plazaTag
  }, f.virtue, f.nara ? " · " + f.nara : ""), /*#__PURE__*/React.createElement("span", {
    style: WS.plazaAgo
  }, f.ago)), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaNote
  }, f.note), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 7
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setReplyOpen(replyOpen === f.key ? null : f.key);
      setReplyText("");
    },
    style: {
      background: "none",
      border: "none",
      color: (plazaReplies[f.key] || []).length ? "#9FE1CB" : WC.mute,
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      padding: 0
    }
  }, "\uD83D\uDCAC \uB2F5\uAE00", (plazaReplies[f.key] || []).length ? ` ${(plazaReplies[f.key] || []).length}` : ""), replyOpen === f.key && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 7,
      borderLeft: "2px solid rgba(255,255,255,0.1)",
      paddingLeft: 10
    }
  }, (plazaReplies[f.key] || []).map((rp, j) => /*#__PURE__*/React.createElement("div", {
    key: j,
    style: {
      fontSize: 12,
      color: WC.cream,
      lineHeight: 1.65,
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginRight: 3
    }
  }, rp.bird), /*#__PURE__*/React.createElement("b", {
    style: {
      color: WC.gold
    }
  }, rp.nick), mentorSet[rp.nick] && /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(242,193,107,0.15)",
      border: "1px solid rgba(242,193,107,0.45)",
      color: WC.gold,
      fontSize: 9,
      fontWeight: 800,
      borderRadius: 99,
      padding: "0px 6px",
      marginLeft: 4
    }
  }, "\uD83C\uDF1F \uBA58\uD1A0"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6
    }
  }, rp.text), /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.mute,
      fontSize: 10,
      marginLeft: 6
    }
  }, rp.ago))), profile ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: replyText,
    onChange: e => setReplyText(e.target.value),
    onKeyDown: e => e.key === "Enter" && sendReply(f.key),
    placeholder: "\uB530\uB73B\uD55C \uD55C\uB9C8\uB514\uB97C \uB0A8\uACA8\uC694",
    maxLength: 120,
    style: {
      flex: 1,
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 9,
      padding: "8px 10px",
      color: "#F3EEE3",
      fontSize: 12,
      fontFamily: "inherit"
    }
  }), /*#__PURE__*/React.createElement("button", {
    disabled: replyBusy || !replyText.trim(),
    onClick: () => sendReply(f.key),
    style: {
      background: "rgba(159,225,203,0.15)",
      border: "1px solid rgba(159,225,203,0.4)",
      color: "#9FE1CB",
      fontSize: 11.5,
      fontWeight: 700,
      borderRadius: 9,
      padding: "0 12px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, replyBusy ? "…" : "보내기")) : /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 11
    }
  }, "\uBCC4\uBA85\uC744 \uB9CC\uB4E4\uBA74 \uB2F5\uAE00\uC744 \uB0A8\uAE38 \uC218 \uC788\uC5B4\uC694.")))))), plazaView.streaks.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: WS.plazaSecTitle
  }, "\uC774\uBC88 \uC8FC \uD568\uAED8 \uB9CE\uC774 \uB2F4\uC740 \uC5C4\uB9C8\uB4E4"), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaStreaks
  }, plazaView.streaks.map((s, i) => {
    const isMe = profile && s.nick === profile.nick;
    const trees = ["🌳", "🌿", "🌱", "🍃", "🌾"];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        ...WS.plazaStreak,
        ...(isMe ? WS.plazaStreakMe : {})
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, trees[i] || "🌱"), /*#__PURE__*/React.createElement("span", {
      style: WS.plazaStreakName
    }, s.nick, isMe ? " (나)" : ""), /*#__PURE__*/React.createElement("span", {
      style: WS.plazaStreakInfo
    }, "\uC88B\uC740 \uC810 ", s.count, "\uAC1C"));
  })))), /*#__PURE__*/React.createElement("div", {
    style: WS.plazaFoot
  }, "\uC21C\uC704\uAC00 \uC544\uB2C8\uB77C \u2018\uD568\uAED8\u2019 \uB2F4\uB294 \uC5C4\uB9C8\uB4E4\uC774\uC5D0\uC694.", /*#__PURE__*/React.createElement("br", null), "\uC544\uC774\uC758 \uC88B\uC740 \uC810\uB9CC \uBAA8\uC5EC\uC694. \uBE44\uAD50\uAC00 \uC544\uB2C8\uB77C \uC751\uC6D0\uC774\uC5D0\uC694 \uD83C\uDF38"))), showCal && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setShowCal(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheet,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetHead
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetTitle
  }, "\uB2EC\uB825 \uC77C\uAE30"), /*#__PURE__*/React.createElement("button", {
    style: WS.x,
    onClick: () => setShowCal(false)
  }, "\u2715")), streakInfo.total > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg, rgba(255,158,109,0.13), rgba(242,193,107,0.1))",
      border: "1px solid rgba(242,193,107,0.32)",
      borderRadius: 14,
      padding: "13px 15px",
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26
    }
  }, streakInfo.cur >= 1 ? "🔥" : "🌱"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.gold,
      fontSize: 14,
      fontWeight: 800
    }
  }, streakInfo.cur >= 2 ? `${streakInfo.cur}일째 이어가고 있어요` : streakInfo.cur === 1 ? "오늘도 함께했어요" : "오늘 다시 시작해 볼까요"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 11.5,
      marginTop: 2
    }
  }, "\uC9C0\uAE08\uAE4C\uC9C0 \uBAA8\uB450 ", streakInfo.total, "\uC77C \u2014 \uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 \uBC1C\uACAC\uD55C \uB0A0\uC774\uC5D0\uC694"))), !challenge ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(159,225,203,0.07)",
      border: "1px solid rgba(159,225,203,0.25)",
      borderRadius: 14,
      padding: "14px 15px",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9FE1CB",
      fontSize: 13.5,
      fontWeight: 800,
      marginBottom: 4
    }
  }, "\uD83C\uDF31 \uD568\uAED8 \uBCF4\uAE30 \uCC4C\uB9B0\uC9C0"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 12,
      lineHeight: 1.6,
      marginBottom: 10
    }
  }, "\uD558\uB8E8\uC5D0 \uD558\uB098, \uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 \uBC1C\uACAC\uD558\uB294 \uC2B5\uAD00. \uBABB \uD55C \uB0A0\uC774 \uC788\uC5B4\uB3C4 \uAD1C\uCC2E\uC544\uC694 \u2014 \uB2E4\uC2DC \uC774\uC5B4\uAC00\uBA74 \uB3FC\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, [7, 14, 21, 30].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => startChallenge(d),
    style: {
      flex: 1,
      background: d === 21 ? "rgba(159,225,203,0.18)" : "rgba(255,255,255,0.05)",
      border: d === 21 ? "1px solid rgba(159,225,203,0.5)" : "1px solid rgba(255,255,255,0.14)",
      color: d === 21 ? "#9FE1CB" : WC.cream,
      fontSize: 13,
      fontWeight: 800,
      borderRadius: 10,
      padding: "10px 0",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, d, "\uC77C"))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 10.5,
      marginTop: 7,
      textAlign: "center"
    }
  }, "\uB3C4\uC804\uC744 \uC2DC\uC791\uD558\uBA74 \uD568\uAED8 \uAD11\uC7A5\uC5D0 \uC751\uC6D0 \uAE00\uC774 \uC62C\uB77C\uAC00\uC694 (\uACF5\uC720 \uCF30\uC744 \uB54C)")) : chInfo && /*#__PURE__*/React.createElement("div", {
    style: {
      background: chInfo.complete ? "linear-gradient(135deg, rgba(242,193,107,0.16), rgba(255,158,109,0.12))" : "rgba(159,225,203,0.07)",
      border: chInfo.complete ? "1px solid rgba(242,193,107,0.5)" : "1px solid rgba(159,225,203,0.25)",
      borderRadius: 14,
      padding: "14px 15px",
      marginBottom: 14
    }
  }, chInfo.complete ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.gold,
      fontSize: 14.5,
      fontWeight: 800,
      marginBottom: 4
    }
  }, "\uD83C\uDF37 ", challenge.days, "\uC77C \uD568\uAED8 \uBCF4\uAE30 \uC644\uC8FC!"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.cream,
      fontSize: 12,
      lineHeight: 1.6,
      marginBottom: 10
    }
  }, challenge.days, "\uC77C \uB3D9\uC548 \uC544\uC774\uB97C \uBC14\uB77C\uBCF8 \uC2DC\uAC04\uC774 \uC313\uC600\uC5B4\uC694. \uC774 \uC2DC\uC120\uC774 \uC544\uC774\uB97C \uD0A4\uC6C1\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("button", {
    onClick: endChallenge,
    style: {
      width: "100%",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: WC.cream,
      fontSize: 12.5,
      fontWeight: 700,
      borderRadius: 10,
      padding: "9px 0",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uC0C8 \uCC4C\uB9B0\uC9C0 \uC2DC\uC791\uD558\uAE30")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#9FE1CB",
      fontSize: 13.5,
      fontWeight: 800
    }
  }, "\uD83C\uDF31 ", challenge.days, "\uC77C \uD568\uAED8 \uBCF4\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.gold,
      fontSize: 12.5,
      fontWeight: 800
    }
  }, chInfo.dleft > 0 ? `D-${chInfo.dleft}` : "D-day")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "rgba(255,255,255,0.08)",
      borderRadius: 99,
      overflow: "hidden",
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${Math.round(chInfo.done / chInfo.total * 100)}%`,
      background: "linear-gradient(90deg,#9FE1CB,#6FC79A)",
      borderRadius: 99
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 11.5
    }
  }, chInfo.total, "\uC77C \uC911 ", chInfo.done, "\uC77C \uBC1C\uACAC\uD588\uC5B4\uC694", chInfo.dayNo >= 1 && chInfo.dayNo <= challenge.days ? ` · 오늘은 ${chInfo.dayNo}일째예요` : "", " \u2014 \uC798 \uAC00\uACE0 \uC788\uC5B4\uC694"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (window.confirm("진행 중인 챌린지를 그만둘까요?")) endChallenge();
    },
    style: {
      marginTop: 9,
      background: "none",
      border: "none",
      color: WC.mute,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "underline"
    }
  }, "\uADF8\uB9CC\uB450\uAE30"))), /*#__PURE__*/React.createElement("div", {
    style: WS.searchRow
  }, /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "\uAE30\uB85D \uAC80\uC0C9",
    style: WS.search
  }), query && /*#__PURE__*/React.createElement("button", {
    style: WS.clearBtn,
    onClick: () => setQuery("")
  }, "\uC9C0\uC6B0\uAE30")), q ? /*#__PURE__*/React.createElement("div", {
    style: WS.results
  }, results.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: WS.pEmpty
  }, "\u201C", query, "\u201D \uACB0\uACFC\uAC00 \uC5C6\uC5B4\uC694.") : results.map((r, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    style: WS.resultItem,
    onClick: () => {
      const [y, m] = r.key.split("-").map(Number);
      setCal({
        y,
        m: m - 1
      });
      setSelDay(r.key);
      setQuery("");
    }
  }, /*#__PURE__*/React.createElement("span", null, r.icon), /*#__PURE__*/React.createElement("span", {
    style: WS.resultText
  }, r.text), /*#__PURE__*/React.createElement("span", {
    style: WS.resultTag
  }, r.key.slice(5), r.tag ? " · " + r.tag : "")))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: WS.calNav
  }, /*#__PURE__*/React.createElement("button", {
    style: WS.navBtn,
    onClick: () => setCal(c => c.m === 0 ? {
      y: c.y - 1,
      m: 11
    } : {
      y: c.y,
      m: c.m - 1
    })
  }, "\u2039"), /*#__PURE__*/React.createElement("div", {
    style: WS.calTitle
  }, cal.y, "\uB144 ", cal.m + 1, "\uC6D4"), /*#__PURE__*/React.createElement("button", {
    style: WS.navBtn,
    onClick: () => setCal(c => c.m === 11 ? {
      y: c.y + 1,
      m: 0
    } : {
      y: c.y,
      m: c.m + 1
    })
  }, "\u203A")), /*#__PURE__*/React.createElement("div", {
    style: WS.grid7
  }, WD.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: w,
    style: {
      ...WS.wd,
      color: i === 0 ? "#E58B8B" : i === 6 ? "#8BB6E5" : WC.mute
    }
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: WS.grid7
  }, cells.map((d, i) => {
    if (d === null) return /*#__PURE__*/React.createElement("div", {
      key: "e" + i
    });
    const k = `${cal.y}-${pad(cal.m + 1)}-${pad(d)}`;
    const b = byDay[k];
    const isToday = k === todayKey;
    const isSel = k === selDay;
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      style: {
        ...WS.day,
        ...(isSel ? WS.daySel : {}),
        ...(isToday && !isSel ? WS.dayToday : {})
      },
      onClick: () => {
        setSelDay(k);
        setDiaryEditing(false);
        setDiaryText("");
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: i % 7 === 0 ? "#E58B8B" : i % 7 === 6 ? "#8BB6E5" : WC.cream
      }
    }, d), b && /*#__PURE__*/React.createElement("span", {
      style: WS.dots
    }, b.light && /*#__PURE__*/React.createElement("i", {
      style: {
        ...WS.dot,
        background: WC.gold
      }
    }), b.diary && /*#__PURE__*/React.createElement("i", {
      style: {
        ...WS.dot,
        background: WC.peach
      }
    }), b.gem && /*#__PURE__*/React.createElement("i", {
      style: {
        ...WS.dot,
        background: WC.gem
      }
    }), b.memo && /*#__PURE__*/React.createElement("i", {
      style: {
        ...WS.dot,
        background: WC.sel
      }
    }), b.todo && /*#__PURE__*/React.createElement("i", {
      style: {
        ...WS.dot,
        background: WC.todo
      }
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: WS.dayNav
  }, /*#__PURE__*/React.createElement("button", {
    style: WS.navBtn,
    onClick: () => shiftDay(-1)
  }, "\u2039"), /*#__PURE__*/React.createElement("div", {
    style: WS.dayHeadC
  }, /*#__PURE__*/React.createElement("span", {
    style: WS.dayHead
  }, selDay.slice(5).replace("-", "월 "), "\uC77C (", WD[new Date(selDay + "T12:00:00").getDay()], ")"), selDay !== todayKey && /*#__PURE__*/React.createElement("button", {
    style: WS.todayBtn,
    onClick: () => {
      setSelDay(todayKey);
      setDiaryEditing(false);
      setDiaryText("");
    }
  }, "\uC624\uB298\uB85C")), /*#__PURE__*/React.createElement("button", {
    style: WS.navBtn,
    onClick: () => shiftDay(1)
  }, "\u203A")), (() => {
    const today = diaries.find(d => d.day === selDay);
    const editing = diaryEditing || !today;
    return /*#__PURE__*/React.createElement("div", {
      style: WS.section
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.secHead
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: WC.peach
      }
    }, "\uD83D\uDCD6 \uC624\uB298\uC758 \uC77C\uAE30"), today && !diaryEditing && /*#__PURE__*/React.createElement("button", {
      style: WS.diaryEdit,
      onClick: () => {
        setDiaryText(today.text);
        setDiaryEditing(true);
      }
    }, "\u270E \uACE0\uCE58\uAE30")), editing ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("textarea", {
      value: diaryEditing || !today ? diaryText : today.text,
      onChange: e => setDiaryText(e.target.value),
      onFocus: () => {
        if (!diaryEditing && !today) setDiaryText(diaryText);
      },
      placeholder: "\uC624\uB298 \uD558\uB8E8, \uC5C4\uB9C8\uC758 \uB9C8\uC74C\uC744 \uC801\uC5B4 \uBCF4\uC138\uC694. \uBA54\uBAA8\uB3C4, \uD3B8\uC9C0\uB3C4, \uD558\uC18C\uC5F0\uB3C4 \uC88B\uC544\uC694.",
      style: WS.diaryArea
    }), /*#__PURE__*/React.createElement("div", {
      style: WS.addRow
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...WS.addBtn,
        background: "rgba(255,158,109,0.18)",
        borderColor: "rgba(255,158,109,0.5)",
        color: WC.peach,
        flex: 1
      },
      onClick: saveDiary
    }, today ? "고쳐 쓰기" : "오늘 일기 저장"), diaryEditing && /*#__PURE__*/React.createElement("button", {
      style: WS.smallBtn,
      onClick: () => {
        setDiaryEditing(false);
        setDiaryText("");
      }
    }, "\uCDE8\uC18C"))) : /*#__PURE__*/React.createElement("div", {
      style: WS.diaryView
    }, today.text));
  })(), (dayLights.length > 0 || dayGems.length > 0) && /*#__PURE__*/React.createElement("div", {
    style: WS.section
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.secHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.gold
    }
  }, "\uD83C\uDF0D \uC624\uB298\uC758 \uAD00\uCC30")), dayLights.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    style: WS.rec
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDF0D"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: WS.recText
  }, e.text), /*#__PURE__*/React.createElement("div", {
    style: WS.recTag
  }, BY_ID[e.cid] ? BY_ID[e.cid].n : e.cn)))), dayGems.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: WS.rec
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC8E"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: WS.recText
  }, g.note), /*#__PURE__*/React.createElement("div", {
    style: WS.recTag
  }, BY_ID[g.cid] ? BY_ID[g.cid].n : "", " \xB7 ", g.virtue, " ", g.word))))), /*#__PURE__*/React.createElement("div", {
    style: WS.section
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.secHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.sel
    }
  }, "\uD83D\uDCDD \uBA54\uBAA8")), dayMemos.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: WS.secEmpty
  }, "\uBA54\uBAA8\uAC00 \uC5C6\uC5B4\uC694."), dayMemos.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.id,
    style: WS.memoItem
  }, editId === m.id ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", {
    value: editText,
    onChange: e => setEditText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") saveEdit();
    },
    style: WS.editInput,
    autoFocus: true
  }), /*#__PURE__*/React.createElement("button", {
    style: WS.smallBtn,
    onClick: saveEdit
  }, "\uC800\uC7A5")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.recText
  }, m.text), /*#__PURE__*/React.createElement("div", {
    style: WS.recTag
  }, new Date(m.date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit"
  }))), /*#__PURE__*/React.createElement("button", {
    style: WS.del,
    onClick: () => startEdit(m)
  }, "\u270E"), /*#__PURE__*/React.createElement("button", {
    style: WS.del,
    onClick: () => delMemo(m.id)
  }, "\u2715")))), /*#__PURE__*/React.createElement("div", {
    style: WS.addRow
  }, /*#__PURE__*/React.createElement("input", {
    value: memoText,
    onChange: e => setMemoText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") addMemo();
    },
    placeholder: "\uBA54\uBAA8 \uCD94\uAC00",
    style: WS.addInput
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.addBtn,
      background: "rgba(127,209,240,0.16)",
      borderColor: "rgba(127,209,240,0.45)",
      color: WC.sel
    },
    onClick: addMemo
  }, "\uCD94\uAC00"))), /*#__PURE__*/React.createElement("div", {
    style: WS.section
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.secHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: WC.todo
    }
  }, "\u2705 \uD560\uC77C"), dayTodos.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: WS.secCount
  }, dayTodos.filter(t => t.done).length, "/", dayTodos.length)), dayTodos.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: WS.secEmpty
  }, "\uD560\uC77C\uC774 \uC5C6\uC5B4\uC694."), dayTodos.filter(t => !t.done).map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: WS.memoItem
  }, /*#__PURE__*/React.createElement("button", {
    style: WS.check,
    onClick: () => toggleTodo(t.id)
  }, "\u2610"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.recText
  }, t.text)), /*#__PURE__*/React.createElement("button", {
    style: WS.del,
    onClick: () => delTodo(t.id)
  }, "\u2715"))), dayTodos.filter(t => t.done).map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: WS.memoItem
  }, /*#__PURE__*/React.createElement("button", {
    style: WS.check,
    onClick: () => toggleTodo(t.id)
  }, "\u2611"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.recText,
      textDecoration: "line-through",
      color: WC.mute
    }
  }, t.text)), /*#__PURE__*/React.createElement("button", {
    style: WS.del,
    onClick: () => delTodo(t.id)
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    style: WS.addRow
  }, /*#__PURE__*/React.createElement("input", {
    value: todoText,
    onChange: e => setTodoText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") addTodo();
    },
    placeholder: "\uD560\uC77C \uCD94\uAC00",
    style: WS.addInput
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.addBtn,
      background: "rgba(111,199,154,0.18)",
      borderColor: "rgba(111,199,154,0.5)",
      color: WC.todo
    },
    onClick: addTodo
  }, "\uCD94\uAC00")))))), showSet && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setShowSet(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.sheet,
      maxWidth: 360
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetHead
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetTitle
  }, "\uC9C0\uB3C4 \uC124\uC815"), /*#__PURE__*/React.createElement("button", {
    style: WS.x,
    onClick: () => setShowSet(false)
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\uD83D\uDD0A \uBCF4\uC11D \uB2E8\uC5B4 \uC18C\uB9AC"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMuted(m => !m),
    style: {
      background: muted ? "rgba(255,255,255,0.08)" : "rgba(159,225,203,0.16)",
      border: muted ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(159,225,203,0.5)",
      color: muted ? WC.mute : "#9FE1CB",
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 99,
      padding: "5px 14px",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, muted ? "꺼짐" : "켜짐")), /*#__PURE__*/React.createElement("div", {
    style: WS.setHint
  }, "\uBCF4\uC11D\uC744 \uB204\uB974\uBA74 \uADF8 \uB098\uB77C \uB9D0\uB85C \uB2E8\uC5B4\uB97C \uC77D\uC5B4\uC918\uC694."), /*#__PURE__*/React.createElement("div", {
    style: WS.setDivider
  }), wkids.length >= 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: WS.setDesc
  }, "\uD83D\uDDFA\uFE0F \uC9C0\uB3C4 \uBC29\uC2DD: \uC9C0\uAE08\uC740 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#F2C16B"
    }
  }, perKid ? "아이별로 각자 지도" : "다같이 한 지도"), "\uC608\uC694."), /*#__PURE__*/React.createElement("button", {
    style: WS.setBtn,
    onClick: () => {
      chooseMode(perKid ? "together" : "perkid");
      setShowSet(false);
    }
  }, perKid ? "🌍 다같이 한 지도로 바꾸기" : "👧👦 아이별 지도로 바꾸기"), /*#__PURE__*/React.createElement("div", {
    style: WS.setDivider
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 4
    }
  }, [["💡 밝힌 빛", lights.length], ["💎 보석", gems.length], ["🗓️ 함께한 날", streakInfo.total]].map(([l, n]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      flex: 1,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 11,
      padding: "9px 4px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 10.5
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F2C16B",
      fontSize: 16,
      fontWeight: 800,
      marginTop: 2
    }
  }, n)))), /*#__PURE__*/React.createElement("div", {
    style: WS.setDivider
  }), myGroup ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 13,
      fontWeight: 700
    }
  }, "\uD83C\uDF38 \uB0B4 \uADF8\uB8F9: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#FF9E6D"
    }
  }, myGroup)), /*#__PURE__*/React.createElement("button", {
    onClick: leaveGroup,
    style: {
      background: "none",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 9,
      padding: "4px 11px",
      color: WC.mute,
      fontSize: 11.5,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uB098\uAC00\uAE30")) : /*#__PURE__*/React.createElement("div", {
    style: WS.setDesc
  }, "\uD83C\uDF38 \uADF8\uB8F9\uC740 \uD568\uAED8 \uAD11\uC7A5\uC5D0\uC11C \uCC3E\uAC70\uB098 \uB9CC\uB4E4 \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: WS.setDivider
  }), /*#__PURE__*/React.createElement("button", {
    style: WS.setBtn,
    onClick: () => {
      setShowSet(false);
      setShowGuide(true);
    }
  }, "\uD83D\uDCD6 \uC0AC\uC6A9\uBC95 \uB2E4\uC2DC \uBCF4\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: WS.setDivider
  }), /*#__PURE__*/React.createElement("div", {
    style: WS.setDesc
  }, "\u2601\uFE0F \uBC31\uC5C5\xB7\uBCF5\uC6D0\uC740 \uD648 \uD654\uBA74\uC758 \u2699 \uC124\uC815\uC5D0\uC11C \u2014 \uC138\uACC4\uC9C0\uB3C4\uBFD0 \uC544\uB2C8\uB77C \uAE30\uC9C8 \uC9C4\uB2E8\xB7\uB9C8\uC74C \uC11C\uB78D\uAE4C\uC9C0 \uC571 \uC804\uCCB4\uB97C \uD55C \uBC88\uC5D0 \uB2F4\uC544\uC694."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...WS.setBtn,
      ...WS.dangerBtn
    },
    onClick: () => {
      if (!window.confirm("지우기 전에 — 혹시 남기고 싶은 기록이 있다면\n홈 화면 ⚙ 설정에서 먼저 백업해 주세요.\n\n백업 없이 지우면 되돌릴 수 없어요.\n계속할까요?")) return;
      reset();
    }
  }, "\uCC98\uC74C\uBD80\uD130 (\uBAA8\uB450 \uC9C0\uC6B0\uAE30)"))), showGuide && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setShowGuide(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.sheet,
      maxWidth: 380
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetHead
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.sheetTitle
  }, "\uD83D\uDCD6 \uC774\uB807\uAC8C \uC368\uC694"), /*#__PURE__*/React.createElement("button", {
    style: WS.x,
    onClick: () => setShowGuide(false)
  }, "\u2715")), [["1️⃣", "나라를 톡 골라요", "지도를 움직이고 키워서 마음에 드는 나라를 골라요. 아래 '대륙·나라'에서 찾아도 돼요."], ["2️⃣", "아이의 좋은 점을 한 줄 적어요", "오늘 아이에게서 발견한 좋은 점을 짧게 적고 '이 땅 밝히기'를 눌러요. 하루에 새 나라 하나씩!"], ["3️⃣", "불이 켜지고, 보석이 모여요", "기록이 쌓이면 그 나라의 말로 된 보석 단어가 모여요. 보석을 누르면 소리로 읽어줘요."], ["4️⃣", "달력과 곳간에서 돌아봐요", "달력에선 날짜별로, 곳간에선 모아서 — 그동안 발견한 좋은 점들을 언제든 다시 봐요."], ["5️⃣", "함께 광장에서 나눠요", "다른 엄마들의 발견을 보며 서로 응원해요. 그룹을 만들어 우리끼리 모일 수도 있어요."]].map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      lineHeight: 1.2
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F3EEE3",
      fontSize: 13.5,
      fontWeight: 800,
      marginBottom: 3
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 12,
      lineHeight: 1.6
    }
  }, d)))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F2C16B",
      fontSize: 11.5,
      lineHeight: 1.6,
      textAlign: "center",
      marginTop: 4
    }
  }, "\uB098\uB77C\uB97C \uBAA8\uC73C\uB294 \uAC8C \uC544\uB2C8\uC5D0\uC694.", /*#__PURE__*/React.createElement("br", null), "\uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 \uBC1C\uACAC\uD558\uB294 \uB208\uC744 \uAE30\uB974\uB294 \uAC70\uC608\uC694. \uD83C\uDF31"))), popupId && (() => {
    const c = BY_ID[popupId];
    const lr = litMap[c.i];
    const cg = gemsByCid[c.i] || [];
    const bw = c.bb[2] - c.bb[0],
      bh = c.bb[3] - c.bb[1];
    const pd = Math.max(3, (bw + bh) * 0.07);
    const vb = `${c.bb[0] - pd} ${c.bb[1] - pd} ${bw + pd * 2} ${bh + pd * 2}`;
    const M = Math.max(bw, bh) + pd * 2;
    const koName = ct => cityKo[c.i] && cityKo[c.i][ct.n] || ct.n;
    const capCity = c.ci.find(x => x.c);
    const capKo = capCity ? koName(capCity) : cityKo[c.i] && cityKo[c.i][c.cap] || c.cap;
    return /*#__PURE__*/React.createElement("div", {
      style: WS.overlay,
      onClick: () => setPopupId(null)
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.sheet,
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.sheetHead
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 32
      }
    }, c.fl), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: WS.infoName
    }, c.n, " ", /*#__PURE__*/React.createElement("span", {
      style: WS.infoEn
    }, c.en)), /*#__PURE__*/React.createElement("div", {
      style: WS.infoMeta
    }, c.ct, lr ? ` · ${lr.order}번째로 밝힘` : ""))), /*#__PURE__*/React.createElement("button", {
      style: WS.x,
      onClick: () => setPopupId(null)
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      style: WS.cmapWrap
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: vb,
      style: {
        width: "100%",
        height: "auto",
        display: "block",
        maxHeight: 300
      },
      preserveAspectRatio: "xMidYMid meet"
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
      id: "cgrad",
      cx: "42%",
      cy: "28%",
      r: "85%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#FFE6B0"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "58%",
      stopColor: "#F2C16B"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#DC9B45"
    }))), /*#__PURE__*/React.createElement("path", {
      d: c.d,
      fill: "url(#cgrad)",
      stroke: "rgba(255,243,214,0.85)",
      strokeWidth: M / 320,
      strokeLinejoin: "round"
    }), c.ci.map((ct, i) => {
      const isS = selCity && selCity.idx === i;
      const g = i < cg.length ? cg[i] : null;
      return /*#__PURE__*/React.createElement("g", {
        key: i,
        onClick: () => {
          setSelCity({
            ...ct,
            idx: i
          });
          if (g) {
            setGemReveal(g);
            if (!g.findTogether) speakLang(g.word, g.bcp47, g.pron);
          } else setGemReveal(null);
        },
        style: {
          cursor: "pointer"
        }
      }, ct.c && /*#__PURE__*/React.createElement("circle", {
        cx: ct.x,
        cy: ct.y,
        r: M / 52,
        fill: "none",
        stroke: "rgba(192,57,43,0.55)",
        strokeWidth: M / 240
      }), /*#__PURE__*/React.createElement("circle", {
        cx: ct.x,
        cy: ct.y,
        r: g ? M / 86 : ct.c ? M / 100 : M / 140,
        fill: g ? "#A88BF0" : ct.c ? "#C0392B" : "#6B4518",
        stroke: "#fff",
        strokeWidth: M / 400
      }), isS && /*#__PURE__*/React.createElement("circle", {
        cx: ct.x,
        cy: ct.y,
        r: M / 42,
        fill: "none",
        stroke: "#7FD1F0",
        strokeWidth: M / 170
      }));
    }), selCity && /*#__PURE__*/React.createElement("text", {
      x: selCity.x,
      y: selCity.y - M / 28,
      fontSize: M / 19,
      textAnchor: "middle",
      fill: "#0E1430",
      stroke: "rgba(255,255,255,0.95)",
      strokeWidth: M / 80,
      paintOrder: "stroke",
      style: {
        fontWeight: 800,
        pointerEvents: "none"
      }
    }, koName(selCity)))), c.ci.length > 0 ? /*#__PURE__*/React.createElement("div", {
      style: WS.cityWrap
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.cityHead
    }, "\uC8FC\uC694 \uB3C4\uC2DC ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C0392B"
      }
    }, "\u25CF"), " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: WC.mute,
        fontWeight: 400,
        letterSpacing: 0
      }
    }, "\uC218\uB3C4"), cityLoading && /*#__PURE__*/React.createElement("span", {
      style: {
        color: WC.mute,
        fontWeight: 400,
        letterSpacing: 0
      }
    }, " \xB7 \uD55C\uAE00 \uBCC0\uD658 \uC911\u2026")), /*#__PURE__*/React.createElement("div", {
      style: WS.chips
    }, c.ci.map((ct, idx) => ({
      ...ct,
      idx
    })).sort((a, b) => (b.c || 0) - (a.c || 0)).map(ct => {
      const isS = selCity && selCity.idx === ct.idx;
      const g = ct.idx < cg.length ? cg[ct.idx] : null;
      return /*#__PURE__*/React.createElement("button", {
        key: ct.idx,
        style: {
          ...WS.cityChip,
          ...(ct.c ? WS.cityChipCap : {}),
          ...(g ? WS.cityChipGem : {}),
          ...(isS ? WS.cityChipSel : {})
        },
        onClick: () => {
          setSelCity(ct);
          if (g) {
            setGemReveal(g);
            if (!g.findTogether) speakLang(g.word, g.bcp47, g.pron);
          } else setGemReveal(null);
        }
      }, ct.c ? "★ " : "", koName(ct), g ? ` · 💎${g.virtue}` : "");
    }))) : /*#__PURE__*/React.createElement("div", {
      style: {
        ...WS.infoSub,
        marginTop: 4
      }
    }, "\uC8FC\uC694 \uB3C4\uC2DC \uC815\uBCF4\uAC00 \uC544\uC9C1 \uC5C6\uB294 \uB098\uB77C\uC608\uC694."), /*#__PURE__*/React.createElement("div", {
      style: WS.factBox
    }, [["대륙", c.ct], ["수도", capKo], ["인구", c.pop ? `${krNum(c.pop)}명 · 세계 ${c.popR}위` : "—"], ["면적", c.area ? `${c.area.toLocaleString()} km² · 세계 ${c.areaR}위` : "—"], ["GDP", c.gdp ? `${fmtUSD(c.gdp)} · 세계 ${c.gdpR}위` : "—"], ["1인당 GDP", c.pc ? `${c.pc.toLocaleString()} 달러 · ${c.lvl}` : "—"], ["언어·통화", `${c.lang} · ${c.cur}`], ["좌표", c.lat != null ? fmtLL(c.lat, c.lng) : "—"]].map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: WS.factRow
    }, /*#__PURE__*/React.createElement("span", {
      style: WS.factK
    }, k), /*#__PURE__*/React.createElement("span", {
      style: WS.factV
    }, v)))), /*#__PURE__*/React.createElement("div", {
      style: WS.briefBox
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.briefHead
    }, "\u2728 \uC774 \uB098\uB77C, \uC54C\uC544\uB450\uBA74 \uC88B\uC544\uC694"), /*#__PURE__*/React.createElement("div", {
      style: WS.briefText
    }, briefByCid[c.i] && briefByCid[c.i].trim() ? briefByCid[c.i] : cityLoading ? "불러오는 중…" : "—")), lr && /*#__PURE__*/React.createElement("div", {
      style: WS.litLine
    }, "\u2605 ", lr.order, "\uBC88\uC9F8\uB85C \uBC1D\uD78C \uB098\uB77C \xB7 ", fmtDate(lr.date), " \u2014 \u201C", lr.text, "\u201D"), /*#__PURE__*/React.createElement("div", {
      style: WS.gemBox
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.gemHead
    }, "\uD83D\uDC8E \uBCF4\uC11D ", cg.length, "\uAC1C ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: WC.mute,
        fontWeight: 400
      }
    }, "\xB7 \uD070 \uB3C4\uC2DC\uBD80\uD130 \uD558\uB098\uC529 \uB193\uC5EC\uC694")), gemReveal && gemReveal.cid === c.i && /*#__PURE__*/React.createElement("div", {
      style: WS.gemReveal
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.gemV
    }, "\u300C", gemReveal.virtue, "\u300D", gemReveal.city ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: WC.mute,
        fontWeight: 400
      }
    }, " \xB7 ", koName({
      n: gemReveal.city
    })) : ""), gemReveal.findTogether ? /*#__PURE__*/React.createElement("div", {
      style: WS.gemFind
    }, "\uC774 \uB098\uB77C \uB9D0\uB85C\uB294 \uC5B4\uB5BB\uAC8C \uB9D0\uD560\uAE4C\uC694?", /*#__PURE__*/React.createElement("br", null), "\uC544\uC774\uC640 \uD568\uAED8 \uCC3E\uC544\uBD10\uC694 \uD83C\uDF0D") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: WS.gemW
    }, gemReveal.word, " ", gemReveal.pron && /*#__PURE__*/React.createElement("span", {
      style: WS.gemP
    }, "/", gemReveal.pron, "/"), " ", /*#__PURE__*/React.createElement("button", {
      style: WS.spk,
      onClick: () => speakLang(gemReveal.word, gemReveal.bcp47, gemReveal.pron)
    }, "\uD83D\uDD0A \uB4E3\uAE30")), gemReveal.sentence && /*#__PURE__*/React.createElement("div", {
      style: WS.gemS
    }, "\u201C", gemReveal.sentence, "\u201D ", gemReveal.spron && /*#__PURE__*/React.createElement("span", {
      style: WS.gemP
    }, "/", gemReveal.spron, "/"), " ", /*#__PURE__*/React.createElement("button", {
      style: WS.spk,
      onClick: () => speakLang(gemReveal.sentence, gemReveal.bcp47, gemReveal.spron)
    }, "\uD83D\uDD0A \uB4E3\uAE30")))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...WS.addRow,
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: text,
      onChange: e => setText(e.target.value),
      placeholder: `「${c.n}」에 아이의 좋은 점 적기`,
      style: WS.addInput
    }), /*#__PURE__*/React.createElement("button", {
      style: {
        ...WS.addBtn,
        background: "rgba(168,139,240,0.18)",
        borderColor: "rgba(168,139,240,0.5)",
        color: "#CDBEF8"
      },
      onClick: () => {
        if (text.trim() && !gemLoading) mintGem(c, text.trim());
      }
    }, gemLoading ? "…" : "기록")), /*#__PURE__*/React.createElement("div", {
      style: WS.gemHint
    }, "\uB3C4\uC2DC\uB97C \uB204\uB974\uBA74 \uADF8 \uB3C4\uC2DC\uC5D0 \uB193\uC778 \uBCF4\uC11D\uC774 \uBCF4\uC774\uACE0 \uC18C\uB9AC\uAC00 \uB098\uC694.")), /*#__PURE__*/React.createElement("div", {
      style: WS.infoBtns
    }, /*#__PURE__*/React.createElement("button", {
      style: WS.aiBtn,
      onClick: () => askAI(c),
      disabled: aiLoading
    }, aiText ? "✨ 이야기 접기" : "✨ 이 나라 이야기 보기"), /*#__PURE__*/React.createElement("button", {
      style: WS.ytBtn,
      onClick: () => openYoutube(c)
    }, "\u25B6 \uC720\uD29C\uBE0C")), aiText && /*#__PURE__*/React.createElement("div", {
      style: WS.aiText
    }, aiText.adult && typeof aiText.adult === "object" ? /*#__PURE__*/React.createElement("div", null, aiText.adult.summary && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        lineHeight: 1.7,
        color: WC.cream,
        marginBottom: 13
      }
    }, aiText.adult.summary), [["🗺️ 지리", aiText.adult.geo], ["📜 역사", aiText.adult.history], ["🎭 문화", aiText.adult.culture], ["⭐ 인물", aiText.adult.people]].map(function (row) {
      return row[1] ? /*#__PURE__*/React.createElement("div", {
        key: row[0],
        style: {
          marginBottom: 11
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          fontWeight: 800,
          color: WC.gold,
          marginBottom: 3
        }
      }, row[0]), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          lineHeight: 1.65,
          color: WC.cream,
          opacity: 0.92
        }
      }, row[1])) : null;
    })) : /*#__PURE__*/React.createElement("div", {
      style: {
        lineHeight: 1.7
      }
    }, aiText.adult || aiText.brief || "이 나라의 자세한 정보는 곧 채워질 거예요."), aiText.story && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setKidOpen(v => !v),
      style: {
        width: "100%",
        textAlign: "left",
        background: "rgba(159,225,203,0.08)",
        border: "1px solid rgba(159,225,203,0.28)",
        borderRadius: 11,
        padding: "9px 12px",
        color: "#9FE1CB",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "\uD83D\uDC67 \uC544\uC774\uC640 \uC774\uC57C\uAE30 \uB098\uB204\uAE30 ", kidOpen ? "\u25b4" : "\u25be"), kidOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        padding: "11px 13px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 11,
        color: WC.cream,
        fontSize: 13,
        lineHeight: 1.75,
        whiteSpace: "pre-line"
      }
    }, aiText.story)))));
  })(), showJourney && (() => {
    const nextLvl = LEVELS.find(L => L.p > pct);
    const nextNeed = nextLvl ? Math.ceil(nextLvl.p / 100 * TOTAL) - count : 0;
    const conts = CONT_ORDER.filter(k => k !== "기타").map(k => {
      const ids = CONT_IDS[k];
      const n = ids.filter(id => litMap[id]).length;
      return {
        k,
        n,
        total: ids.length,
        done: n === ids.length
      };
    });
    const completeCids = Object.keys(gemsByCid).filter(cid => new Set(gemsByCid[cid].map(g => g.virtue)).size >= VIRTUES.length);
    return /*#__PURE__*/React.createElement("div", {
      style: WS.overlay,
      onClick: () => setShowJourney(false)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...WS.sheet,
        maxWidth: 400
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.sheetHead
    }, /*#__PURE__*/React.createElement("div", {
      style: WS.sheetTitle
    }, "\uBE5B\uC758 \uC5EC\uC815"), /*#__PURE__*/React.createElement("button", {
      style: WS.x,
      onClick: () => setShowJourney(false)
    }, "\u2715")), pct >= 100 && /*#__PURE__*/React.createElement("div", {
      style: {
        border: "1.5px solid rgba(242,193,107,0.55)",
        background: "rgba(242,193,107,0.08)",
        borderRadius: 14,
        padding: "13px 14px",
        marginBottom: 14,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22
      }
    }, "\uD83C\uDF0D"), /*#__PURE__*/React.createElement("div", {
      style: {
        color: WC.gold,
        fontSize: 14,
        fontWeight: 800,
        marginTop: 3
      }
    }, "\uC628 \uB545\uC744 \uBC1D\uD78C \uC774"), /*#__PURE__*/React.createElement("div", {
      style: {
        color: WC.cream,
        fontSize: 11.5,
        marginTop: 4,
        lineHeight: 1.6
      }
    }, TOTAL, "\uAC1C \uB098\uB77C\uB97C \uBAA8\uB450 \uBC1D\uD614\uC5B4\uC694 \u2014 \uAD00\uCC30\uC758 \uC5EC\uC815\uC744 \uC644\uC8FC\uD588\uC5B4\uC694.")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, LEVELS.map((L, i) => {
      const got = pct >= L.p;
      const cur = lvl.name === L.name;
      return /*#__PURE__*/React.createElement("div", {
        key: L.name,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "5px 2px",
          opacity: got ? 1 : 0.45
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13
        }
      }, got ? "✨" : "·"), /*#__PURE__*/React.createElement("span", {
        style: {
          color: cur ? WC.gold : got ? WC.cream : WC.mute,
          fontSize: 13.5,
          fontWeight: cur ? 800 : 500
        }
      }, L.name), /*#__PURE__*/React.createElement("span", {
        style: {
          color: WC.mute,
          fontSize: 10.5
        }
      }, L.p, "%"), cur && /*#__PURE__*/React.createElement("span", {
        style: {
          color: WC.gold,
          fontSize: 10.5,
          fontWeight: 700,
          border: "1px solid rgba(242,193,107,0.4)",
          borderRadius: 99,
          padding: "1px 8px"
        }
      }, "\uC9C0\uAE08"));
    }), nextLvl && /*#__PURE__*/React.createElement("div", {
      style: {
        color: WC.mute,
        fontSize: 11.5,
        marginTop: 6,
        paddingLeft: 2
      }
    }, "\uB2E4\uC74C \u300C", nextLvl.name, "\u300D\uAE4C\uC9C0 ", nextNeed, "\uAC1C \uB098\uB77C \uB0A8\uC558\uC5B4\uC694.")), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: WC.gold,
        fontSize: 12.5,
        fontWeight: 800,
        marginBottom: 8
      }
    }, "\uD83C\uDFEE \uB300\uB959 \uB4F1\uBD88", conts.every(ct => ct.done) ? /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10.5,
        border: "1px solid rgba(242,193,107,0.45)",
        borderRadius: 99,
        padding: "1px 8px"
      }
    }, "\uC5EC\uC12F \uB4F1\uBD88 \uBAA8\uB450 \uCF1C\uC9D0 \u2728") : null), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 7
      }
    }, conts.map(ct => /*#__PURE__*/React.createElement("span", {
      key: ct.k,
      style: {
        border: ct.done ? "1px solid rgba(242,193,107,0.55)" : "1px solid rgba(255,255,255,0.12)",
        background: ct.done ? "rgba(242,193,107,0.12)" : "rgba(255,255,255,0.03)",
        color: ct.done ? WC.gold : WC.mute,
        fontSize: 11.5,
        fontWeight: 700,
        borderRadius: 99,
        padding: "5px 11px"
      }
    }, ct.done ? "🏮" : "🕯️", " ", ct.k, " ", ct.done ? "" : `${ct.n}/${ct.total}`)))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#A88BF0",
        fontSize: 12.5,
        fontWeight: 800,
        marginBottom: 8
      }
    }, "\uD83D\uDC8E \uB355\uB2F4 13\uAC00\uC9C0\uB97C \uBAA8\uB450 \uBAA8\uC740 \uB098\uB77C"), completeCids.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: WC.mute,
        fontSize: 12,
        lineHeight: 1.6
      }
    }, "\uC544\uC9C1 \uC5C6\uC5B4\uC694. \uD55C \uB098\uB77C\uC5D0 \uC88B\uC740 \uC810\uC744 \uAC70\uB4ED \uB2F4\uC73C\uBA74 \uADF8 \uB098\uB77C\uC758 \uB355\uB2F4 13\uAC00\uC9C0\uAC00 \uBAA8\uC5EC\uC694.") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 7
      }
    }, completeCids.map(cid => {
      const cc = BY_ID[cid];
      return cc ? /*#__PURE__*/React.createElement("span", {
        key: cid,
        style: {
          fontSize: 13,
          color: WC.cream,
          border: "1px solid rgba(168,139,240,0.35)",
          borderRadius: 99,
          padding: "4px 11px"
        }
      }, cc.fl, " ", cc.n) : null;
    }))), sos.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#9FE1CB",
        fontSize: 12.5,
        lineHeight: 1.6
      }
    }, "\uD83C\uDF3F \uB9C8\uC74C\uC758 \uBCF4\uC11D ", sos.length, "\uAC1C \u2014 \uD63C\uB0B4\uB294 \uB300\uC2E0 \uBA48\uCD98 \uC21C\uAC04\uB4E4\uC774\uC5D0\uC694. \uB9C8\uC74C \uACF3\uAC04\uC5D0\uC11C \uBCFC \uC218 \uC788\uC5B4\uC694.")));
  })(), worldDone && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setWorldDone(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.eventCard,
      maxWidth: 360,
      border: "1.5px solid rgba(242,193,107,0.6)",
      boxShadow: "0 0 60px rgba(242,193,107,0.25), 0 18px 50px rgba(0,0,0,0.5)"
    },
    className: "pop",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 46,
      marginBottom: 6
    }
  }, "\uD83C\uDF0D"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.eventTitle,
      fontSize: 21
    }
  }, "\uC628 \uB545\uC744 \uBC1D\uD614\uC5B4\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      letterSpacing: 3,
      margin: "4px 0 2px"
    }
  }, "\uD83C\uDFEE\uD83C\uDFEE\uD83C\uDFEE\uD83C\uDFEE\uD83C\uDFEE\uD83C\uDFEE"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.eventSub,
      marginBottom: 12
    }
  }, "\uC5EC\uC12F \uB300\uB959 \xB7 ", TOTAL, "\uAC1C \uB098\uB77C \xB7 ", lights.length + gems.length, "\uBC88\uC758 \uBC1C\uACAC"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.cream,
      fontSize: 13.5,
      lineHeight: 1.75,
      marginBottom: 14
    }
  }, "\uB098\uB77C\uB97C \uBAA8\uC740 \uAC8C \uC544\uB2C8\uC5D0\uC694.", /*#__PURE__*/React.createElement("br", null), "\uC544\uC774\uC758 \uC88B\uC740 \uC810\uC744 ", lights.length + gems.length, "\uBC88 \uBC1C\uACAC\uD55C \uAC70\uC608\uC694.", /*#__PURE__*/React.createElement("br", null), "\uADF8 \uB208\uC774, \uC544\uC774\uB97C \uD0A4\uC6E0\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      ...WS.eventQuote,
      marginBottom: 16
    }
  }, "\u201C\uAD50\uC721\uC758 \uBCF8\uC9C8\uC774 \uC5B4\uBA38\uB2C8\uC758 \uAD00\uCC30\uC785\uB2C8\uB2E4.\u201D", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      opacity: 0.8
    }
  }, "\u2014 \uC774\uC7AC\uD6C8 \uACE0\uBB38\uB2D8 \xB7 2026.01.31")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WC.mute,
      fontSize: 12,
      lineHeight: 1.6,
      marginBottom: 14
    }
  }, "\uC774\uC81C \uBAA8\uB4E0 \uB4F1\uBD88\uC774 \uCF1C\uC84C\uC5B4\uC694. \uC5EC\uC815\uC740 \uACC4\uC18D\uB3FC\uC694 \u2014", /*#__PURE__*/React.createElement("br", null), "\uBC1D\uD78C \uB098\uB77C\uB4E4\uC5D0 \uBCF4\uC11D\uC744 \uB354\uD558\uACE0, \uB355\uB2F4 13\uAC00\uC9C0\uB97C \uBAA8\uC544\uBCF4\uC138\uC694."), /*#__PURE__*/React.createElement("button", {
    style: WS.eventBtn,
    onClick: () => setWorldDone(false)
  }, "\uACE0\uB9C8\uC6CC\uC694"))), contEvent && /*#__PURE__*/React.createElement("div", {
    style: WS.overlay,
    onClick: () => setContEvent(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.eventCard,
    className: "pop",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: WS.eventBadge
  }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
    style: WS.eventTitle
  }, contEvent.name, "\uC744 \uBAA8\uB450 \uBC1D\uD614\uC5B4\uC694!"), /*#__PURE__*/React.createElement("div", {
    style: WS.eventSub
  }, "\uB300\uB959 \uB4F1\uBD88\uC744 \uC5BB\uC5C8\uC5B4\uC694"), /*#__PURE__*/React.createElement("div", {
    style: WS.eventQuote
  }, "\u201C", contEvent.quote, "\u201D"), /*#__PURE__*/React.createElement("button", {
    style: WS.eventBtn,
    onClick: () => setContEvent(null)
  }, "\uACE0\uB9C8\uC6CC\uC694"))));
}
const CSS = `
@keyframes riseK{0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);}}
@keyframes popK{0%{opacity:0;transform:scale(.85);}100%{opacity:1;transform:scale(1);}}
.rise{animation:riseK .4s ease-out;} .pop{animation:popK .45s cubic-bezier(.2,.9,.3,1.2);}
@media (prefers-reduced-motion: reduce){.rise,.pop{animation:none !important;}}
input::placeholder{color:#6f78a0;} input:disabled{opacity:.6;}
textarea::placeholder{color:#6f78a0;} .prewrap{white-space:pre-wrap;}
@media (min-width: 521px){ .wFrame{ max-width:min(92vw, 1200px) !important; } }
`;
const WS = {
  root: {
    minHeight: "100vh",
    width: "100%",
    background: `radial-gradient(120% 80% at 50% 0%, ${WC.night2} 0%, ${WC.night} 60%, #080C20 100%)`,
    display: "flex",
    justifyContent: "center",
    padding: "20px 14px 40px",
    boxSizing: "border-box",
    fontFamily: "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,sans-serif"
  },
  frame: {
    width: "100%",
    maxWidth: 480,
    position: "relative"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  setTop: {
    background: "none",
    border: "none",
    color: "rgba(154,163,199,0.7)",
    fontSize: 17,
    cursor: "pointer",
    padding: "2px 4px",
    lineHeight: 1
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12
  },
  eyebrow: {
    color: WC.mute,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 500,
    marginBottom: 5
  },
  title: {
    color: WC.cream,
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: 0.3,
    lineHeight: 1.1
  },
  progressBox: {
    textAlign: "right"
  },
  pct: {
    color: WC.gold,
    fontSize: 25,
    fontWeight: 500,
    lineHeight: 1
  },
  pctLabel: {
    color: WC.mute,
    fontSize: 10.5,
    marginTop: 3
  },
  barTrack: {
    height: 6,
    borderRadius: 99,
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    marginBottom: 14
  },
  barFill: {
    height: "100%",
    borderRadius: 99,
    background: `linear-gradient(90deg, ${WC.peach}, ${WC.gold})`,
    transition: "width .6s cubic-bezier(.2,.8,.2,1)"
  },
  mapWrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    background: `radial-gradient(140% 120% at 50% 0%, #122044 0%, ${WC.sea} 70%)`,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "inset 0 2px 30px rgba(0,0,0,.45)",
    marginBottom: 14
  },
  svg: {
    width: "100%",
    height: "auto",
    display: "block",
    touchAction: "none"
  },
  zoomBtns: {
    position: "absolute",
    right: 8,
    bottom: 8,
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  demoChip: {
    position: "absolute",
    top: 10,
    left: 10,
    background: "rgba(10,16,40,0.7)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: WC.mute,
    fontSize: 11.5,
    padding: "5px 11px",
    borderRadius: 20,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  demoChipOn: {
    background: "rgba(242,193,107,0.16)",
    border: "1px solid rgba(242,193,107,0.5)",
    color: WC.gold,
    fontWeight: 700
  },
  zb: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "rgba(10,16,40,0.75)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: WC.cream,
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  msgArea: {
    minHeight: 78,
    display: "flex",
    alignItems: "center"
  },
  greet: {
    color: WC.gold,
    fontSize: 14,
    textAlign: "center",
    width: "100%"
  },
  msgCard: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,227,166,.25)",
    borderRadius: 14,
    padding: "13px 16px"
  },
  msgTitle: {
    color: WC.gold,
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4
  },
  msgBody: {
    color: WC.cream,
    fontSize: 13.5,
    lineHeight: 1.5
  },
  empty: {
    color: WC.mute,
    fontSize: 13.5,
    textAlign: "center",
    width: "100%",
    lineHeight: 1.5
  },
  info: {
    width: "100%",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    padding: "15px 16px",
    boxSizing: "border-box"
  },
  infoHead: {
    display: "flex",
    gap: 12,
    alignItems: "center"
  },
  flag: {
    fontSize: 27
  },
  infoName: {
    color: WC.cream,
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: 0.2
  },
  infoEn: {
    color: WC.mute,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  cityWrap: {
    marginBottom: 12
  },
  cityHead: {
    color: WC.peach,
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: 2,
    marginBottom: 9
  },
  cityChip: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: WC.cream,
    fontSize: 12.5,
    borderRadius: 8,
    padding: "6px 11px",
    letterSpacing: 0.2
  },
  cityChipCap: {
    background: "rgba(192,57,43,0.16)",
    border: "1px solid rgba(192,57,43,0.45)",
    color: "#F0A89E",
    fontWeight: 700
  },
  cityChipSel: {
    background: "rgba(127,209,240,0.22)",
    border: "1px solid rgba(127,209,240,0.6)",
    color: "#CDEBFA",
    fontWeight: 700
  },
  cityChipGem: {
    background: "rgba(168,139,240,0.16)",
    border: "1px solid rgba(168,139,240,0.45)",
    color: "#CDBEF8"
  },
  gemHint: {
    color: WC.mute,
    fontSize: 11.5,
    marginTop: 9,
    lineHeight: 1.5
  },
  factBox: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: "4px 13px",
    marginBottom: 10
  },
  factRow: {
    display: "flex",
    gap: 10,
    padding: "7px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)"
  },
  factK: {
    color: WC.mute,
    fontSize: 12.5,
    width: 80,
    flexShrink: 0
  },
  factV: {
    color: WC.cream,
    fontSize: 13,
    flex: 1,
    lineHeight: 1.45
  },
  briefBox: {
    background: "rgba(168,139,240,0.08)",
    border: "1px solid rgba(168,139,240,0.22)",
    borderRadius: 12,
    padding: "11px 13px",
    marginBottom: 10
  },
  briefHead: {
    color: WC.gem,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6
  },
  briefText: {
    color: WC.cream,
    fontSize: 13,
    lineHeight: 1.65
  },
  infoMeta: {
    color: WC.mute,
    fontSize: 12,
    marginTop: 3
  },
  infoSub: {
    color: WC.mute,
    fontSize: 12,
    marginTop: 8
  },
  litLine: {
    color: "#C9B383",
    fontSize: 12.5,
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.07)",
    lineHeight: 1.5
  },
  cmapWrap: {
    borderRadius: 16,
    overflow: "hidden",
    background: `radial-gradient(130% 120% at 50% 10%, #16264E, ${WC.sea})`,
    border: "1px solid rgba(255,255,255,0.07)",
    padding: 14,
    marginBottom: 14,
    boxShadow: "inset 0 2px 24px rgba(0,0,0,.4)"
  },
  gemBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  },
  gemHead: {
    color: WC.gem,
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8
  },
  gemList: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  gemItem: {
    background: "rgba(168,139,240,0.1)",
    border: "1px solid rgba(168,139,240,0.25)",
    borderRadius: 12,
    padding: "10px 13px",
    cursor: "pointer"
  },
  gemItemTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  gemItemVirtue: {
    color: WC.gem,
    fontSize: 13.5,
    fontWeight: 700
  },
  gemItemWord: {
    color: WC.cream,
    fontSize: 14,
    fontWeight: 800
  },
  gemItemFind: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12.5
  },
  gemItemNote: {
    color: WC.cream,
    fontSize: 14.5,
    lineHeight: 1.55,
    marginTop: 6
  },
  gemItemExpand: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  gemItemSentence: {
    color: WC.cream,
    fontSize: 14,
    lineHeight: 1.6,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  gemChip: {
    background: "rgba(168,139,240,0.15)",
    border: "1px solid rgba(168,139,240,0.4)",
    color: "#CDBEF8",
    fontSize: 15,
    borderRadius: 9,
    padding: "8px 12px",
    cursor: "pointer"
  },
  virtuePickWrap: {
    marginBottom: 10
  },
  virtuePickLabel: {
    fontSize: 12,
    color: "rgba(205,190,248,0.85)",
    marginBottom: 7
  },
  virtuePickChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6
  },
  virtueChip: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(168,139,240,0.3)",
    color: "rgba(205,190,248,0.8)",
    fontSize: 13,
    borderRadius: 16,
    padding: "6px 13px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s"
  },
  virtueChipOn: {
    background: "rgba(168,139,240,0.35)",
    border: "1px solid rgba(168,139,240,0.9)",
    color: "#fff",
    fontWeight: 700
  },
  virtueChipWon: {
    background: "rgba(242,193,107,0.16)",
    border: "1px solid rgba(242,193,107,0.45)",
    color: WC.gold,
    cursor: "default",
    opacity: 0.95
  },
  virtueCount: {
    color: WC.gold,
    fontSize: 11.5,
    fontWeight: 700
  },
  virtueComplete: {
    marginTop: 10,
    background: "rgba(242,193,107,0.14)",
    border: "1px solid rgba(242,193,107,0.4)",
    borderRadius: 12,
    padding: "10px 13px",
    color: WC.gold,
    fontSize: 13.5,
    fontWeight: 700,
    textAlign: "center"
  },
  shareRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginTop: 10,
    flexWrap: "wrap"
  },
  shareToggle: {
    background: "rgba(143,208,188,0.14)",
    border: "1px solid rgba(143,208,188,0.4)",
    color: "#8FD0BC",
    fontSize: 12.5,
    borderRadius: 16,
    padding: "6px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap"
  },
  shareToggleOn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "rgba(255,255,255,0.75)"
  },
  shareHint: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.45)"
  },
  gemReveal: {
    marginTop: 10,
    background: "rgba(168,139,240,0.1)",
    borderRadius: 10,
    padding: "10px 12px"
  },
  gemV: {
    color: WC.gem,
    fontSize: 14,
    fontWeight: 700
  },
  gemW: {
    color: WC.cream,
    fontSize: 24,
    fontWeight: 800,
    marginTop: 5,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  gemP: {
    color: WC.mute,
    fontSize: 14,
    fontWeight: 400
  },
  gemS: {
    color: WC.cream,
    fontSize: 15,
    marginTop: 10,
    lineHeight: 1.6,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  gemFind: {
    color: WC.cream,
    fontSize: 15.5,
    marginTop: 8,
    lineHeight: 1.7,
    opacity: 0.92
  },
  spk: {
    background: "rgba(168,139,240,0.25)",
    border: "1px solid rgba(168,139,240,0.55)",
    color: "#E0D6FA",
    borderRadius: 9,
    padding: "5px 11px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  },
  infoBtns: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap"
  },
  aiBtn: {
    flex: 1,
    minWidth: 150,
    background: "linear-gradient(135deg,#7FD1F0,#9A8CF0)",
    color: "#10203a",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  },
  ytBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: WC.cream,
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    cursor: "pointer"
  },
  aiText: {
    color: WC.cream,
    fontSize: 13.5,
    lineHeight: 1.65,
    marginTop: 12,
    whiteSpace: "pre-line",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 10
  },
  obsBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    padding: "8px 12px",
    marginBottom: 6,
    background: "rgba(242,193,107,0.08)",
    border: "1px solid rgba(242,193,107,0.22)",
    borderRadius: 12
  },
  obsTag: {
    color: WC.gold,
    fontSize: 11.5,
    fontWeight: 700,
    flexShrink: 0
  },
  obsText: {
    color: WC.cream,
    fontSize: 13,
    lineHeight: 1.5,
    opacity: 0.92
  },
  calmLead: {
    color: WC.cream,
    fontSize: 13.5,
    lineHeight: 1.65,
    textAlign: "center",
    padding: "2px 4px 12px"
  },
  calmArea: {
    width: "100%",
    minHeight: 110,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: "13px 15px",
    color: WC.cream,
    fontSize: 15,
    outline: "none",
    resize: "none",
    lineHeight: 1.6,
    fontFamily: "inherit",
    boxSizing: "border-box"
  },
  calmBtn: {
    width: "100%",
    padding: "13px",
    marginTop: 10,
    background: `linear-gradient(135deg, ${WC.gold}, ${WC.peach})`,
    color: "#3a2410",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer"
  },
  calmResBox: {
    marginTop: 12,
    background: "rgba(143,208,188,0.08)",
    border: "1px solid rgba(143,208,188,0.25)",
    borderRadius: 14,
    padding: "14px 15px",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  calmRecv: {
    color: WC.cream,
    fontSize: 14.5,
    lineHeight: 1.6,
    fontWeight: 600
  },
  calmTurn: {
    color: WC.mute,
    fontSize: 13.5,
    lineHeight: 1.6
  },
  calmSay: {
    color: WC.gold,
    fontSize: 15.5,
    lineHeight: 1.6,
    fontWeight: 700,
    padding: "2px 0"
  },
  calmWhy: {
    color: WC.calm,
    fontSize: 12.5,
    lineHeight: 1.55
  },
  calmNote: {
    color: WC.mute,
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: "center",
    marginTop: 12
  },
  pfLead: {
    color: WC.cream,
    fontSize: 13.5,
    lineHeight: 1.65,
    textAlign: "center",
    padding: "2px 4px 16px"
  },
  pfField: {
    marginBottom: 14
  },
  pfLabel: {
    color: WC.gold,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6
  },
  pfInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 13px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: WC.cream,
    fontSize: 15,
    outline: "none"
  },
  pfHint: {
    color: WC.mute,
    fontSize: 11.5,
    lineHeight: 1.5,
    marginTop: 6
  },
  pfRoles: {
    display: "flex",
    gap: 8
  },
  pfRole: {
    flex: 1,
    padding: "10px 0",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: WC.mute,
    fontSize: 14,
    cursor: "pointer"
  },
  pfRoleOn: {
    background: "rgba(168,139,240,0.2)",
    borderColor: "rgba(168,139,240,0.5)",
    color: "#CDBEF8",
    fontWeight: 700
  },
  pfPreview: {
    textAlign: "center",
    color: WC.cream,
    fontSize: 15,
    padding: "6px 0 14px",
    lineHeight: 1.6
  },
  pfSave: {
    width: "100%",
    padding: "13px",
    background: `linear-gradient(135deg, ${WC.gold}, ${WC.peach})`,
    color: "#3a2410",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer"
  },
  plazaWho: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: WC.cream,
    fontSize: 14,
    padding: "2px 2px 14px"
  },
  plazaEdit: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.18)",
    color: WC.mute,
    fontSize: 12,
    borderRadius: 9,
    padding: "5px 10px",
    cursor: "pointer"
  },
  plazaStats: {
    display: "flex",
    gap: 10,
    marginBottom: 18
  },
  plazaStat: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: "13px 12px"
  },
  plazaStatLabel: {
    color: WC.mute,
    fontSize: 12,
    marginBottom: 5
  },
  plazaStatNum: {
    color: WC.gold,
    fontSize: 23,
    fontWeight: 800
  },
  plazaSecTitle: {
    color: WC.mute,
    fontSize: 12.5,
    fontWeight: 700,
    margin: "0 2px 8px"
  },
  plazaFeed: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 18
  },
  plazaCard: {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "11px 13px"
  },
  plazaCardHead: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
    flexWrap: "wrap"
  },
  plazaNick: {
    color: WC.cream,
    fontSize: 13,
    fontWeight: 700
  },
  plazaTag: {
    fontSize: 11,
    background: "rgba(143,208,188,0.15)",
    color: "#8FD0BC",
    padding: "2px 8px",
    borderRadius: 10
  },
  plazaAgo: {
    marginLeft: "auto",
    fontSize: 11,
    color: WC.mute
  },
  plazaNote: {
    color: WC.cream,
    fontSize: 13.5,
    lineHeight: 1.55
  },
  plazaStreaks: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 6
  },
  plazaStreak: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 13px",
    borderBottom: "1px solid rgba(255,255,255,0.07)"
  },
  plazaStreakMe: {
    background: "rgba(245,200,120,0.1)"
  },
  plazaStreakName: {
    color: WC.cream,
    fontSize: 13.5
  },
  plazaStreakInfo: {
    marginLeft: "auto",
    fontSize: 12,
    color: WC.mute
  },
  plazaFoot: {
    color: WC.mute,
    fontSize: 11.5,
    lineHeight: 1.55,
    textAlign: "center",
    marginTop: 12
  },
  plazaMsg: {
    color: WC.cream,
    fontSize: 13.5,
    lineHeight: 1.7,
    textAlign: "center",
    padding: "24px 10px",
    opacity: 0.9
  },
  plazaYear: {
    fontSize: 10.5,
    color: WC.mute,
    background: "rgba(255,255,255,0.07)",
    padding: "2px 6px",
    borderRadius: 8
  },
  stockJar: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "14px 0 18px"
  },
  stockNum: {
    color: WC.gold,
    fontSize: 52,
    fontWeight: 800,
    lineHeight: 1
  },
  stockUnit: {
    color: WC.mute,
    fontSize: 13,
    marginTop: 8
  },
  stockMsg: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "16px 16px"
  },
  stockTitle: {
    color: WC.cream,
    fontSize: 15.5,
    fontWeight: 700,
    marginBottom: 8,
    lineHeight: 1.5
  },
  stockBody: {
    color: WC.cream,
    fontSize: 14,
    lineHeight: 1.75,
    opacity: 0.92
  },
  stockNote: {
    color: WC.calm,
    fontSize: 13,
    lineHeight: 1.7,
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  },
  inputRow: {
    display: "flex",
    gap: 8,
    marginTop: 6
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 14px",
    color: WC.cream,
    fontSize: 15,
    outline: "none",
    resize: "none",
    minHeight: 48,
    lineHeight: 1.45,
    fontFamily: "inherit"
  },
  btn: {
    background: `linear-gradient(135deg, ${WC.gold}, ${WC.peach})`,
    color: "#3a2410",
    border: "none",
    borderRadius: 12,
    padding: "0 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  footer: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-start",
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  },
  navBtn: {
    flex: 1,
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    padding: "2px 0",
    fontFamily: "inherit"
  },
  navIcon: {
    fontSize: 21,
    lineHeight: 1,
    width: 46,
    height: 46,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 13,
    boxSizing: "border-box"
  },
  navLabel: {
    color: WC.mute,
    fontSize: 10,
    whiteSpace: "nowrap",
    lineHeight: 1,
    height: 10,
    display: "block"
  },
  footRight: {
    display: "flex",
    gap: 6
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: WC.mute,
    fontSize: 12.5,
    cursor: "pointer",
    padding: "4px 2px",
    whiteSpace: "nowrap"
  },
  iconBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: WC.mute,
    fontSize: 13,
    borderRadius: 9,
    padding: "6px 10px",
    cursor: "pointer"
  },
  iconOn: {
    background: "rgba(242,193,107,0.18)",
    border: "1px solid rgba(242,193,107,0.5)",
    color: WC.gold
  },
  panel: {
    marginTop: 12,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 10,
    maxHeight: 320,
    overflowY: "auto"
  },
  pEmpty: {
    color: WC.mute,
    fontSize: 13,
    textAlign: "center",
    padding: 16
  },
  listHead: {
    color: WC.peach,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    margin: "2px 2px 8px"
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6
  },
  chip: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: WC.mute,
    fontSize: 12,
    borderRadius: 8,
    padding: "5px 9px",
    cursor: "pointer"
  },
  chipLit: {
    background: "rgba(242,193,107,0.16)",
    border: "1px solid rgba(242,193,107,0.4)",
    color: WC.gold
  },
  proto: {
    textAlign: "center",
    color: "rgba(255,255,255,0.18)",
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 22
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(6,10,26,0.82)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "30px 14px",
    zIndex: 50,
    overflowY: "auto"
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    background: "linear-gradient(170deg,#16204A,#0E1430)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 16
  },
  sheetHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  sheetTitle: {
    color: WC.cream,
    fontSize: 18,
    fontWeight: 700
  },
  x: {
    background: "none",
    border: "none",
    color: WC.mute,
    fontSize: 18,
    cursor: "pointer"
  },
  searchRow: {
    display: "flex",
    gap: 8,
    marginBottom: 12
  },
  search: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 12px",
    color: WC.cream,
    fontSize: 14,
    outline: "none"
  },
  clearBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: WC.mute,
    borderRadius: 10,
    padding: "0 12px",
    fontSize: 12,
    cursor: "pointer"
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  resultItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left"
  },
  resultText: {
    color: WC.cream,
    fontSize: 13.5,
    flex: 1
  },
  resultTag: {
    color: WC.mute,
    fontSize: 11,
    whiteSpace: "nowrap"
  },
  calNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  navBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: WC.cream,
    fontSize: 18,
    width: 36,
    height: 32,
    borderRadius: 8,
    cursor: "pointer"
  },
  calTitle: {
    color: WC.cream,
    fontSize: 16,
    fontWeight: 700
  },
  grid7: {
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
    gap: 4
  },
  wd: {
    textAlign: "center",
    fontSize: 12,
    padding: "4px 0"
  },
  day: {
    position: "relative",
    aspectRatio: "1",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid transparent",
    borderRadius: 9,
    color: WC.cream,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 2
  },
  daySel: {
    background: "rgba(242,193,107,0.18)",
    border: "1px solid rgba(242,193,107,0.6)"
  },
  dayToday: {
    border: "1px solid rgba(127,209,240,0.5)"
  },
  dots: {
    display: "flex",
    gap: 2
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    display: "inline-block"
  },
  dayHead: {
    color: WC.gold,
    fontSize: 14,
    fontWeight: 700
  },
  dayNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "16px 0 10px"
  },
  dayHeadC: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  todayBtn: {
    background: "rgba(127,209,240,0.14)",
    border: "1px solid rgba(127,209,240,0.4)",
    color: WC.sel,
    fontSize: 11,
    borderRadius: 7,
    padding: "3px 8px",
    cursor: "pointer"
  },
  section: {
    marginBottom: 14
  },
  secHead: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  secCount: {
    color: WC.mute,
    fontSize: 12,
    fontWeight: 400
  },
  secEmpty: {
    color: WC.mute,
    fontSize: 12.5,
    padding: "4px 2px 8px"
  },
  memoItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: "9px 11px",
    marginBottom: 6
  },
  editInput: {
    flex: 1,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(127,209,240,0.4)",
    borderRadius: 8,
    padding: "8px 10px",
    color: WC.cream,
    fontSize: 14,
    outline: "none"
  },
  smallBtn: {
    background: "rgba(127,209,240,0.16)",
    border: "1px solid rgba(127,209,240,0.45)",
    color: WC.sel,
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12,
    cursor: "pointer"
  },
  dayBody: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 10
  },
  rec: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: "9px 11px"
  },
  recText: {
    color: WC.cream,
    fontSize: 13.5,
    lineHeight: 1.4
  },
  recTag: {
    color: WC.mute,
    fontSize: 11,
    marginTop: 2
  },
  del: {
    background: "none",
    border: "none",
    color: WC.mute,
    fontSize: 13,
    cursor: "pointer"
  },
  check: {
    background: "none",
    border: "none",
    color: WC.todo,
    fontSize: 18,
    cursor: "pointer",
    lineHeight: 1
  },
  addRow: {
    display: "flex",
    gap: 8,
    marginTop: 8
  },
  addInput: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 12px",
    color: WC.cream,
    fontSize: 14,
    outline: "none"
  },
  addBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: WC.cream,
    borderRadius: 10,
    padding: "0 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  },
  setDesc: {
    color: WC.mute,
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 14
  },
  diaryArea: {
    width: "100%",
    minHeight: 96,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,158,109,0.3)",
    borderRadius: 12,
    padding: "12px 13px",
    color: WC.cream,
    fontSize: 14.5,
    outline: "none",
    resize: "vertical",
    lineHeight: 1.7,
    fontFamily: "inherit",
    boxSizing: "border-box",
    marginBottom: 8
  },
  diaryView: {
    color: WC.cream,
    fontSize: 14.5,
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
    padding: "4px 2px"
  },
  diaryEdit: {
    background: "none",
    border: "none",
    color: WC.mute,
    fontSize: 12,
    cursor: "pointer",
    marginLeft: "auto"
  },
  setHint: {
    color: WC.mute,
    fontSize: 12,
    lineHeight: 1.5,
    margin: "6px 2px 0"
  },
  setDivider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "16px 0 14px"
  },
  setBtn: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: WC.cream,
    borderRadius: 11,
    padding: "13px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 10
  },
  dangerBtn: {
    background: "rgba(229,139,139,0.1)",
    border: "1px solid rgba(229,139,139,0.35)",
    color: "#E58B8B",
    marginTop: 6
  },
  eventCard: {
    background: "linear-gradient(160deg,#1A2348,#0E1430)",
    border: "1px solid rgba(242,193,107,0.5)",
    borderRadius: 20,
    padding: "26px 22px",
    textAlign: "center",
    maxWidth: 340,
    boxShadow: "0 0 50px rgba(242,193,107,.25)",
    margin: "auto"
  },
  eventBadge: {
    fontSize: 46
  },
  eventTitle: {
    color: WC.gold,
    fontSize: 20,
    fontWeight: 800,
    marginTop: 8
  },
  eventSub: {
    color: WC.peach,
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 1
  },
  eventQuote: {
    color: WC.cream,
    fontSize: 14.5,
    lineHeight: 1.6,
    margin: "18px 6px 4px",
    fontStyle: "italic"
  },
  eventBtn: {
    marginTop: 20,
    background: `linear-gradient(135deg, ${WC.gold}, ${WC.peach})`,
    color: "#3a2410",
    border: "none",
    borderRadius: 12,
    padding: "11px 30px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer"
  }
};

// ── 글자 크기(가⁻ 가⁺) ──
// WS의 '글자(fontSize)'만 배율로 키운다. 지도(mapWrap/svg)·칸·버튼 크기는 그대로라 레이아웃이 안 깨진다.
// 배율: 1=보통, 1.08=크게, 1.15=더크게 (±15% 이내)
const FS_LEVELS = [1, 1.08, 1.15];
// 지도/박스 등 '글자가 핵심이 아닌' 키는 건드리지 않는다 (지도 영역 보호)
const WS_FS_SKIP = { mapWrap: 1, svg: 1, zoomBtns: 1 };
const WS_BASE_FS = {};
Object.keys(WS).forEach(function (k) {
  if (!WS_FS_SKIP[k] && WS[k] && typeof WS[k].fontSize === "number") {
    WS_BASE_FS[k] = WS[k].fontSize;
  }
});
function applyFontScale(s) {
  Object.keys(WS_BASE_FS).forEach(function (k) {
    WS[k].fontSize = Math.round(WS_BASE_FS[k] * s * 100) / 100;
  });
}

// ── 마운트 (깃허브 페이지) ──
(function () {
  try {
    var rootEl = document.getElementById("root");
    if (rootEl && typeof ReactDOM !== "undefined") {
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
      var boot = document.getElementById("boot");
      if (boot) {
        boot.classList.add("gone");
        setTimeout(function () {
          boot.remove();
        }, 500);
      }
    }
  } catch (e) {
    console.error("앱 시작 실패:", e);
  }
})();