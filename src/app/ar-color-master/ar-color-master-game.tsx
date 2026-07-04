"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Camera, Hand, MousePointer2, RotateCcw, Sparkles } from "lucide-react";

declare global {
  interface Window {
    Hands?: new (options: { locateFile: (file: string) => string }) => MediaPipeHands;
  }
}

type MediaPipeHands = {
  setOptions: (options: {
    maxNumHands: number;
    modelComplexity: number;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: HandResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
};

type HandResults = {
  multiHandLandmarks?: Array<Array<{ x: number; y: number }>>;
};

type ColorKey = "Red" | "Yellow" | "Blue" | "Orange" | "Green" | "Purple";
type LessonKind = "primary" | "secondary" | "temperature" | "complementary";
type GameState = "intro" | "playing" | "lesson-clear" | "complete";
type CursorSource = "none" | "mouse" | "hand";

type ColorInfo = {
  th: string;
  en: string;
  hex: string;
  soft: string;
  family: "warm" | "cool";
};

type Monster = {
  name: string;
  color: ColorKey;
  hp: number;
  maxHp: number;
  mode?: "fire" | "ice";
};

type Lesson = {
  id: number;
  kind: LessonKind;
  title: string;
  subtitle: string;
  codexTitle: string;
  codexBody: string;
  monsters: Monster[];
  trivia?: Trivia;
};

type Trivia = {
  question: string;
  options: ColorKey[];
  answer: ColorKey;
  note: string;
};

type SpellOrb = {
  key: ColorKey;
  x: number;
  y: number;
  r: number;
};

type TriviaOrb = {
  key: ColorKey;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
};

type HandControl = {
  x: number | null;
  y: number | null;
  pinchRatio: number | null;
  isPinched: boolean;
  pinchFrames: number;
  openFrames: number;
  missedFrames: number;
};

type FloatingText = {
  text: string;
  x: number;
  y: number;
  color: string;
  until: number;
};

const COLORS: Record<ColorKey, ColorInfo> = {
  Red: { th: "แดง", en: "Red", hex: "#ef4444", soft: "#fee2e2", family: "warm" },
  Yellow: { th: "เหลือง", en: "Yellow", hex: "#facc15", soft: "#fef9c3", family: "warm" },
  Blue: { th: "น้ำเงิน", en: "Blue", hex: "#3b82f6", soft: "#dbeafe", family: "cool" },
  Orange: { th: "ส้ม", en: "Orange", hex: "#f97316", soft: "#ffedd5", family: "warm" },
  Green: { th: "เขียว", en: "Green", hex: "#22c55e", soft: "#dcfce7", family: "cool" },
  Purple: { th: "ม่วง", en: "Purple", hex: "#a855f7", soft: "#f3e8ff", family: "cool" },
};

const PRIMARY_COLORS: ColorKey[] = ["Red", "Yellow", "Blue"];
const ALL_COLORS: ColorKey[] = ["Red", "Yellow", "Blue", "Orange", "Green", "Purple"];
const WARM_COLORS: ColorKey[] = ["Red", "Yellow", "Orange"];
const COOL_COLORS: ColorKey[] = ["Blue", "Green", "Purple"];
const SECONDARY_RECIPE: Record<ColorKey, ColorKey[]> = {
  Orange: ["Red", "Yellow"],
  Green: ["Yellow", "Blue"],
  Purple: ["Red", "Blue"],
  Red: [],
  Yellow: [],
  Blue: [],
};
const COMPLEMENTARY: Record<ColorKey, ColorKey> = {
  Red: "Green",
  Green: "Red",
  Yellow: "Purple",
  Purple: "Yellow",
  Blue: "Orange",
  Orange: "Blue",
};

const LESSONS: Lesson[] = [
  {
    id: 1,
    kind: "primary",
    title: "บทที่ 1: กำเนิดแม่สี",
    subtitle: "ปราบมอนสเตอร์ด้วยแม่สีให้ตรงกัน",
    codexTitle: "แม่สีคือรากของเวทมนตร์สี",
    codexBody: "แดง เหลือง และน้ำเงิน เป็นแม่สีที่ใช้สร้างสีอื่น ๆ ได้อีกมากมาย จำสามสีนี้ให้แม่นก่อนเริ่มผสมสี",
    monsters: [
      { name: "ไฟแดงฝึกหัด", color: "Red", hp: 60, maxHp: 60 },
      { name: "ภูตแสงเหลือง", color: "Yellow", hp: 60, maxHp: 60 },
      { name: "เงาน้ำเงิน", color: "Blue", hp: 70, maxHp: 70 },
    ],
  },
  {
    id: 2,
    kind: "secondary",
    title: "บทที่ 2: เวทมนตร์ผสมสี",
    subtitle: "ใช้แม่สี 2 สีผสมกันเพื่อชนะสีขั้นที่ 2",
    codexTitle: "สีขั้นที่ 2 เกิดจากการผสมแม่สี",
    codexBody: "ส้มเกิดจากแดง+เหลือง, เขียวเกิดจากเหลือง+น้ำเงิน, ม่วงเกิดจากแดง+น้ำเงิน เลือกร่ายแม่สีให้ครบสูตร",
    trivia: {
      question: "สีเขียวเกิดจากการผสมสีใด?",
      options: ["Blue", "Orange"],
      answer: "Blue",
      note: "ถูกต้อง! สีเขียวเกิดจากเหลือง + น้ำเงิน",
    },
    monsters: [
      { name: "อสูรส้ม", color: "Orange", hp: 90, maxHp: 90 },
      { name: "บอสเขียวมรกต", color: "Green", hp: 110, maxHp: 110 },
      { name: "จอมเวทม่วง", color: "Purple", hp: 110, maxHp: 110 },
    ],
  },
  {
    id: 3,
    kind: "temperature",
    title: "บทที่ 3: ศึกวรรณะร้อน-เย็น",
    subtitle: "ดับไฟด้วยสีเย็น และละลายน้ำแข็งด้วยสีร้อน",
    codexTitle: "วรรณะสีสร้างอารมณ์ของภาพ",
    codexBody: "สีร้อนให้พลังและความอบอุ่น ส่วนสีเย็นให้ความสงบ หากบอสเป็นไฟให้ใช้สีเย็นทั้งหมด หากเป็นน้ำแข็งให้ใช้สีร้อนทั้งหมด",
    trivia: {
      question: "สีใดต่อไปนี้จัดอยู่ในวรรณะเย็น?",
      options: ["Blue", "Orange"],
      answer: "Blue",
      note: "ใช่เลย! น้ำเงิน เขียว ม่วง คือกลุ่มวรรณะเย็น",
    },
    monsters: [
      { name: "บอสไฟแดง", color: "Red", hp: 130, maxHp: 130, mode: "fire" },
      { name: "บอสน้ำแข็งน้ำเงิน", color: "Blue", hp: 130, maxHp: 130, mode: "ice" },
    ],
  },
  {
    id: 4,
    kind: "complementary",
    title: "บทที่ 4: พลังสีตรงข้าม",
    subtitle: "ใช้สีคู่ตรงข้ามเพื่อโจมตีคริติคอล",
    codexTitle: "สีคู่ตรงข้ามให้แรงปะทะสูง",
    codexBody: "สีตรงข้ามในวงจรสีช่วยขับกันให้เด่น เช่น แดง-เขียว เหลือง-ม่วง น้ำเงิน-ส้ม ใช้คู่ตรงข้ามจะเกิดคริติคอล",
    trivia: {
      question: "สีคู่ตรงข้ามของสีแดงคือสีใด?",
      options: ["Green", "Purple"],
      answer: "Green",
      note: "แม่นมาก! แดงกับเขียวเป็นคู่สีตรงข้าม",
    },
    monsters: [
      { name: "ราชามังกรแดง", color: "Red", hp: 170, maxHp: 170 },
      { name: "ผู้พิทักษ์ม่วง", color: "Purple", hp: 180, maxHp: 180 },
      { name: "มังกรน้ำเงิน", color: "Blue", hp: 190, maxHp: 190 },
    ],
  },
];

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const pointInCircle = (x: number, y: number, circle: { x: number; y: number; r: number }, padding = 0) =>
  distance({ x, y }, circle) <= circle.r + padding;

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, fill: string, stroke = "rgba(255,255,255,.2)") {
  ctx.save();
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  color: string,
  align: CanvasTextAlign = "center",
  maxWidth?: number,
) {
  ctx.save();
  ctx.font = `${weight} ${size}px var(--font-geist-sans), Kanit, Tahoma, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 5;
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, size: number, weight: number, color: string) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  words.forEach((word, index) => {
    const test = line ? `${line} ${word}` : word;
    ctx.font = `${weight} ${size}px var(--font-geist-sans), Kanit, Tahoma, sans-serif`;
    if (ctx.measureText(test).width > maxWidth && line) {
      drawText(ctx, line, x, currentY, size, weight, color);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
    if (index === words.length - 1) drawText(ctx, line, x, currentY, size, weight, color);
  });
}

function cloneMonster(monster: Monster): Monster {
  return { ...monster };
}

function getLessonSpells(kind: LessonKind): ColorKey[] {
  if (kind === "primary" || kind === "secondary") return PRIMARY_COLORS;
  return ALL_COLORS;
}

export function ArColorMasterGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<MediaPipeHands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handFrameRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const prevDownRef = useRef(false);
  const lastHandTimeRef = useRef(0);
  const scriptsReadyRef = useRef(false);
  const handControlRef = useRef<HandControl>({
    x: null,
    y: null,
    pinchRatio: null,
    isPinched: false,
    pinchFrames: 0,
    openFrames: 0,
    missedFrames: 0,
  });
  const stateRef = useRef({
    gameState: "intro" as GameState,
    lessonIndex: 0,
    monsterIndex: 0,
    score: 0,
    cursor: { x: 0, y: 0, isDown: false, active: false, source: "none" as CursorSource },
    spellOrbs: [] as SpellOrb[],
    triviaOrbs: [] as TriviaOrb[],
    monster: cloneMonster(LESSONS[0].monsters[0]),
    requiredHits: [] as ColorKey[],
    shieldActive: false,
    shieldSolved: false,
    floatingTexts: [] as FloatingText[],
    codexTitle: LESSONS[0].codexTitle,
    codexBody: LESSONS[0].codexBody,
    cameraStatus: "ยังไม่ได้เปิดกล้อง",
    handVisible: false,
    lastCastAt: 0,
  });
  const [viewState, setViewState] = useState({
    gameState: "intro" as GameState,
    lessonIndex: 0,
    monsterIndex: 0,
    score: 0,
    codexTitle: LESSONS[0].codexTitle,
    codexBody: LESSONS[0].codexBody,
    cameraStatus: "ยังไม่ได้เปิดกล้อง",
    arEnabled: false,
  });

  const syncView = useCallback(() => {
    const state = stateRef.current;
    setViewState({
      gameState: state.gameState,
      lessonIndex: state.lessonIndex,
      monsterIndex: state.monsterIndex,
      score: state.score,
      codexTitle: state.codexTitle,
      codexBody: state.codexBody,
      cameraStatus: state.cameraStatus,
      arEnabled: state.cursor.source === "hand" || state.handVisible,
    });
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number, color = "#fef3c7") => {
    stateRef.current.floatingTexts.push({ text, x, y, color, until: performance.now() + 1100 });
  }, []);

  const arrangeOrbs = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const compact = rect.width < 760;
    const state = stateRef.current;
    const lesson = LESSONS[state.lessonIndex];
    const spells = getLessonSpells(lesson.kind);
    const rightInset = compact ? 0 : 280;
    const usableWidth = rect.width - rightInset;
    const radius = compact ? 31 : 40;
    const gap = compact ? 12 : 20;
    const total = spells.length * radius * 2 + (spells.length - 1) * gap;
    const startX = Math.max(18 + radius, (usableWidth - total) / 2 + radius);
    const y = rect.height - (compact ? 76 : 86);
    state.spellOrbs = spells.map((key, index) => ({
      key,
      x: startX + index * (radius * 2 + gap),
      y,
      r: radius,
    }));

    if (state.shieldActive && lesson.trivia) {
      const choiceRadius = compact ? 38 : 48;
      state.triviaOrbs = lesson.trivia.options.map((key, index) => ({
        key,
        x: usableWidth / 2 + (index === 0 ? -choiceRadius * 1.55 : choiceRadius * 1.55),
        y: rect.height * 0.5 + Math.sin(performance.now() / 500 + index) * 12,
        r: choiceRadius,
        vx: index === 0 ? -0.25 : 0.25,
        vy: index === 0 ? 0.16 : -0.16,
      }));
    } else {
      state.triviaOrbs = [];
    }
  }, []);

  const startLesson = useCallback(
    (lessonIndex: number) => {
      const state = stateRef.current;
      if (lessonIndex >= LESSONS.length) {
        state.gameState = "complete";
        state.codexTitle = "สำเร็จหลักสูตรสี";
        state.codexBody = "คุณผ่านทั้งแม่สี สีขั้นที่ 2 วรรณะร้อน-เย็น และสีคู่ตรงข้ามแล้ว พร้อมใช้ความรู้สีสร้างงานศิลปะต่อได้เลย";
        syncView();
        return;
      }

      const lesson = LESSONS[lessonIndex];
      state.gameState = "playing";
      state.lessonIndex = lessonIndex;
      state.monsterIndex = 0;
      state.monster = cloneMonster(lesson.monsters[0]);
      state.requiredHits = [];
      state.shieldActive = Boolean(lesson.trivia);
      state.shieldSolved = !lesson.trivia;
      state.codexTitle = lesson.codexTitle;
      state.codexBody = lesson.codexBody;
      state.floatingTexts = [];
      arrangeOrbs();
      syncView();
    },
    [arrangeOrbs, syncView],
  );

  const resetGame = useCallback(() => {
    const state = stateRef.current;
    state.score = 0;
    startLesson(0);
  }, [startLesson]);

  const nextMonsterOrLesson = useCallback(() => {
    const state = stateRef.current;
    const lesson = LESSONS[state.lessonIndex];
    const nextMonster = state.monsterIndex + 1;
    if (nextMonster < lesson.monsters.length) {
      state.monsterIndex = nextMonster;
      state.monster = cloneMonster(lesson.monsters[nextMonster]);
      state.requiredHits = [];
      state.shieldActive = false;
      state.shieldSolved = true;
      state.codexTitle = `พบ ${state.monster.name}`;
      state.codexBody = getMonsterCodex(lesson, state.monster);
      addFloatingText("มอนสเตอร์ตัวใหม่!", 260, 180, "#bfdbfe");
      arrangeOrbs();
      syncView();
      return;
    }

    state.gameState = "lesson-clear";
    state.codexTitle = "ผ่านบทเรียนแล้ว";
    state.codexBody = "ยอดเยี่ยม! ความรู้สีบทนี้ถูกบันทึกลงสมุดโน้ตนักเวทย์แล้ว";
    syncView();
    window.setTimeout(() => startLesson(state.lessonIndex + 1), 1300);
  }, [addFloatingText, arrangeOrbs, startLesson, syncView]);

  const dealDamage = useCallback(
    (amount: number, label: string, color = "#fde68a") => {
      const state = stateRef.current;
      state.monster.hp = Math.max(0, state.monster.hp - amount);
      state.score += amount;
      addFloatingText(label, 300, 250, color);
      if (state.monster.hp <= 0) window.setTimeout(nextMonsterOrLesson, 500);
      syncView();
    },
    [addFloatingText, nextMonsterOrLesson, syncView],
  );

  const solveTrivia = useCallback(
    (key: ColorKey) => {
      const state = stateRef.current;
      const lesson = LESSONS[state.lessonIndex];
      if (!lesson.trivia || !state.shieldActive) return;
      if (key === lesson.trivia.answer) {
        state.shieldActive = false;
        state.shieldSolved = true;
        state.triviaOrbs = [];
        state.codexTitle = "เกราะคำถามแตกแล้ว";
        state.codexBody = lesson.trivia.note;
        addFloatingText("คำตอบถูกต้อง!", 300, 220, "#bbf7d0");
        dealDamage(25, "Shield Break +25", "#bbf7d0");
      } else {
        addFloatingText("ยังไม่ใช่ ลองอีกครั้ง", 300, 220, "#fecaca");
        state.codexTitle = "เกราะยังทำงานอยู่";
        state.codexBody = `คำถาม: ${lesson.trivia.question}`;
        syncView();
      }
    },
    [addFloatingText, dealDamage, syncView],
  );

  const castSpell = useCallback(
    (key: ColorKey) => {
      const state = stateRef.current;
      const lesson = LESSONS[state.lessonIndex];
      const now = performance.now();
      if (now - state.lastCastAt < 220) return;
      state.lastCastAt = now;

      if (state.shieldActive) {
        addFloatingText("ทำลายเกราะคำถามก่อน!", 300, 220, "#fde68a");
        return;
      }

      const monster = state.monster;
      const color = COLORS[key];
      state.codexTitle = `${color.th} (${color.en})`;

      if (lesson.kind === "primary") {
        const correct = key === monster.color;
        state.codexBody = correct ? "แม่สีตรงกับมอนสเตอร์พอดี พลังโจมตีเต็ม!" : "บทนี้ฝึกจำแม่สี ต้องใช้สีเดียวกับมอนสเตอร์";
        dealDamage(correct ? 45 : 10, correct ? "ตรงสี +45" : "เฉียด +10", correct ? "#bbf7d0" : "#fecaca");
        return;
      }

      if (lesson.kind === "secondary") {
        const recipe = SECONDARY_RECIPE[monster.color];
        const correct = recipe.includes(key) && !state.requiredHits.includes(key);
        if (correct) state.requiredHits.push(key);
        state.codexBody = getSecondaryCodex(monster.color, recipe, state.requiredHits);
        if (state.requiredHits.length === recipe.length) {
          state.requiredHits = [];
          dealDamage(65, "ผสมสำเร็จ +65", "#bbf7d0");
        } else {
          dealDamage(correct ? 20 : 6, correct ? "ส่วนผสมถูก +20" : "สูตรยังไม่ใช่", correct ? "#bfdbfe" : "#fecaca");
        }
        return;
      }

      if (lesson.kind === "temperature") {
        const required = monster.mode === "fire" ? COOL_COLORS : WARM_COLORS;
        const correct = required.includes(key) && !state.requiredHits.includes(key);
        if (correct) state.requiredHits.push(key);
        state.codexBody =
          monster.mode === "fire"
            ? `บอสไฟต้องใช้วรรณะเย็นให้ครบ: ${required.map((c) => COLORS[c].th).join(", ")}`
            : `บอสน้ำแข็งต้องใช้วรรณะร้อนให้ครบ: ${required.map((c) => COLORS[c].th).join(", ")}`;
        if (state.requiredHits.length === required.length) {
          state.requiredHits = [];
          dealDamage(80, "ล้างวรรณะ +80", "#bbf7d0");
        } else {
          dealDamage(correct ? 24 : 8, correct ? "วรรณะถูก +24" : "วรรณะผิด", correct ? "#bfdbfe" : "#fecaca");
        }
        return;
      }

      const expected = COMPLEMENTARY[monster.color];
      const correct = key === expected;
      state.codexBody = correct
        ? `${COLORS[monster.color].th} ตรงข้ามกับ ${COLORS[expected].th} เกิดคริติคอล!`
        : `ลองหาคู่ตรงข้ามของ ${COLORS[monster.color].th} ในวงจรสี`;
      dealDamage(correct ? 90 : 12, correct ? "Critical +90" : "โจมตีเบา", correct ? "#fde68a" : "#fecaca");
    },
    [addFloatingText, dealDamage],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    arrangeOrbs();
  }, [arrangeOrbs]);

  const updateCursorFallback = useCallback((x: number, y: number, isDown: boolean | null) => {
    if (Date.now() - lastHandTimeRef.current < 900) return;
    const cursor = stateRef.current.cursor;
    cursor.x = x;
    cursor.y = y;
    if (isDown !== null) cursor.isDown = isDown;
    cursor.active = true;
    cursor.source = "mouse";
  }, []);

  const stopCamera = useCallback(() => {
    if (handFrameRef.current) cancelAnimationFrame(handFrameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    handFrameRef.current = null;
  }, []);

  const runHandFrame = useCallback(async () => {
    const video = videoRef.current;
    const hands = handsRef.current;
    if (!video || !hands || !streamRef.current) return;
    if (video.readyState >= 2) {
      try {
        await hands.send({ image: video });
      } catch {
        // The next animation frame will retry while the stream is active.
      }
    }
    // eslint-disable-next-line react-hooks/immutability
    handFrameRef.current = requestAnimationFrame(runHandFrame);
  }, []);

  const tryStartCamera = useCallback(async () => {
    const state = stateRef.current;
    const video = videoRef.current;
    if (!video || !window.Hands) {
      state.cameraStatus = "กำลังโหลดระบบจับมือ...";
      syncView();
      return;
    }

    try {
      stopCamera();
      state.cameraStatus = "กำลังขออนุญาตกล้อง...";
      syncView();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.72,
        minTrackingConfidence: 0.72,
      });
      hands.onResults((results) => {
        const current = stateRef.current;
        const control = handControlRef.current;
        const landmarks = results.multiHandLandmarks?.[0];
        if (!landmarks) {
          control.missedFrames += 1;
          current.handVisible = false;
          if (control.missedFrames > 8) {
            current.cursor.isDown = false;
            control.isPinched = false;
            control.pinchFrames = 0;
            control.openFrames = 0;
          }
          return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const indexBase = landmarks[5];
        const pinkyBase = landmarks[17];
        const wrist = landmarks[0];
        const middleBase = landmarks[9];
        const rawX = (1 - indexTip.x) * rect.width;
        const rawY = indexTip.y * rect.height;
        const palmSize = Math.max(distance(indexBase, pinkyBase), distance(wrist, middleBase), 0.08);
        const rawPinchRatio = distance(indexTip, thumbTip) / palmSize;

        control.x = control.x === null ? rawX : control.x + (rawX - control.x) * 0.42;
        control.y = control.y === null ? rawY : control.y + (rawY - control.y) * 0.42;
        control.pinchRatio = control.pinchRatio === null ? rawPinchRatio : control.pinchRatio + (rawPinchRatio - control.pinchRatio) * 0.45;
        control.missedFrames = 0;

        const wantsPinch = control.isPinched ? control.pinchRatio < 0.68 : control.pinchRatio < 0.48;
        if (wantsPinch) {
          control.pinchFrames += 1;
          control.openFrames = 0;
        } else {
          control.openFrames += 1;
          control.pinchFrames = 0;
        }
        if (!control.isPinched && control.pinchFrames >= 2) control.isPinched = true;
        if (control.isPinched && control.openFrames >= 2) control.isPinched = false;

        current.cursor.x = control.x;
        current.cursor.y = control.y;
        current.cursor.isDown = control.isPinched;
        current.cursor.active = true;
        current.cursor.source = "hand";
        current.handVisible = true;
        current.cameraStatus = control.isPinched ? "กำลังจับลูกแก้ว" : "จับมือได้แล้ว";
        lastHandTimeRef.current = Date.now();
      });

      handsRef.current = hands;
      state.cameraStatus = "เปิดกล้องแล้ว";
      syncView();
      handFrameRef.current = requestAnimationFrame(runHandFrame);
    } catch (error) {
      console.error(error);
      state.cameraStatus = "เปิดกล้องไม่ได้ แต่ยังเล่นด้วยเมาส์/ทัชได้";
      state.cursor.source = "mouse";
      syncView();
    }
  }, [runHandFrame, stopCamera, syncView]);

  const handleScriptReady = useCallback(() => {
    scriptsReadyRef.current = true;
  }, []);

  const updateGame = useCallback(() => {
    const state = stateRef.current;
    const now = performance.now();
    const cursor = state.cursor;
    const justPressed = cursor.isDown && !prevDownRef.current;
    state.floatingTexts = state.floatingTexts.filter((text) => text.until > now);

    if (state.gameState === "playing") {
      state.triviaOrbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += Math.sin(now / 420 + orb.x) * 0.2 + orb.vy;
        if (orb.y < 230 || orb.y > 470) orb.vy *= -1;
      });

      if (justPressed) {
        const hitPadding = cursor.source === "hand" ? 18 : 0;
        const triviaHit = state.triviaOrbs.find((orb) => pointInCircle(cursor.x, cursor.y, orb, hitPadding));
        if (triviaHit) solveTrivia(triviaHit.key);
        else {
          const spellHit = state.spellOrbs.find((orb) => pointInCircle(cursor.x, cursor.y, orb, hitPadding));
          if (spellHit) castSpell(spellHit.key);
        }
      }
    }

    prevDownRef.current = cursor.isDown;
  }, [castSpell, solveTrivia]);

  const drawMonster = (ctx: CanvasRenderingContext2D, x: number, y: number, monster: Monster, now: number, compact: boolean) => {
    const color = COLORS[monster.color];
    const pulse = Math.sin(now / 260) * 5;
    const bodyR = compact ? 62 : 86;
    ctx.save();
    ctx.shadowColor = color.hex;
    ctx.shadowBlur = 28;
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.arc(x, y + pulse, bodyR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = color.soft;
    ctx.beginPath();
    ctx.arc(x - bodyR * 0.28, y - bodyR * 0.2 + pulse, bodyR * 0.14, 0, Math.PI * 2);
    ctx.arc(x + bodyR * 0.28, y - bodyR * 0.2 + pulse, bodyR * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(x - bodyR * 0.28, y - bodyR * 0.2 + pulse, bodyR * 0.06, 0, Math.PI * 2);
    ctx.arc(x + bodyR * 0.28, y - bodyR * 0.2 + pulse, bodyR * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = monster.mode === "fire" ? "#fed7aa" : monster.mode === "ice" ? "#bae6fd" : "#ffffff";
    ctx.lineWidth = compact ? 6 : 8;
    ctx.beginPath();
    ctx.arc(x, y + pulse, bodyR + 14, -0.2, Math.PI * 1.25);
    ctx.stroke();
    ctx.restore();
  };

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const compact = width < 760;
    const state = stateRef.current;
    const lesson = LESSONS[state.lessonIndex];
    const now = performance.now();

    ctx.clearRect(0, 0, width, height);
    if (video && video.readyState >= 2 && state.cursor.source === "hand") {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      const ratio = Math.max(width / video.videoWidth, height / video.videoHeight);
      const drawW = video.videoWidth * ratio;
      const drawH = video.videoHeight * ratio;
      ctx.drawImage(video, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
      ctx.restore();
      ctx.fillStyle = "rgba(2,6,23,.55)";
      ctx.fillRect(0, 0, width, height);
    } else {
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#101827");
      bg.addColorStop(0.5, "#183348");
      bg.addColorStop(1, "#172554");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }

    updateGame();

    const rightInset = compact ? 0 : 280;
    const playWidth = width - rightInset;
    if (state.gameState === "intro") {
      drawPanel(ctx, Math.max(18, playWidth / 2 - 330), compact ? 72 : 86, Math.min(660, playWidth - 36), compact ? 472 : 420, 24, "rgba(15,23,42,.84)");
      drawText(ctx, "AR Color Master", playWidth / 2, compact ? 128 : 145, compact ? 38 : 56, 900, "#f8fafc");
      drawText(ctx, "ศึกนักเวทย์แห่งวงจรสี", playWidth / 2, compact ? 174 : 205, compact ? 21 : 26, 800, "#bae6fd");
      drawWrappedText(
        ctx,
        "เรียนรู้แม่สี การผสมสี วรรณะร้อน-เย็น และสีคู่ตรงข้ามผ่านการปราบมอนสเตอร์ ใช้เมาส์ ทัช หรือ AR จับลูกแก้วสีเพื่อร่ายเวท",
        playWidth / 2,
        compact ? 232 : 270,
        Math.min(540, playWidth - 84),
        compact ? 30 : 34,
        compact ? 17 : 20,
        600,
        "#e2e8f0",
      );
      drawPanel(ctx, playWidth / 2 - 120, compact ? 425 : 402, 240, 70, 999, "rgba(34,197,94,.92)", "#86efac");
      drawText(ctx, "เริ่มผจญภัย", playWidth / 2, compact ? 460 : 437, 25, 900, "#052e16");
    }

    if (state.gameState === "playing" || state.gameState === "lesson-clear") {
      drawPanel(ctx, 14, 16, Math.max(260, playWidth - 28), compact ? 104 : 94, 18, "rgba(15,23,42,.72)");
      drawText(ctx, lesson.title, playWidth / 2, compact ? 42 : 43, compact ? 20 : 28, 900, "#fde68a", "center", playWidth - 48);
      drawText(ctx, lesson.subtitle, playWidth / 2, compact ? 72 : 73, compact ? 14 : 18, 700, "#f8fafc", "center", playWidth - 52);
      drawText(ctx, `คะแนน ${state.score}`, playWidth / 2, compact ? 96 : 96, compact ? 13 : 15, 800, "#bbf7d0");

      const monsterX = playWidth / 2;
      const monsterY = compact ? height * 0.38 : height * 0.42;
      drawMonster(ctx, monsterX, monsterY, state.monster, now, compact);
      drawText(ctx, state.monster.name, monsterX, monsterY - (compact ? 96 : 126), compact ? 19 : 26, 900, "#ffffff");
      drawText(ctx, `${COLORS[state.monster.color].th} (${COLORS[state.monster.color].en})`, monsterX, monsterY - (compact ? 70 : 94), compact ? 14 : 18, 700, COLORS[state.monster.color].soft);

      const hpW = Math.min(compact ? playWidth - 80 : 360, playWidth - 50);
      const hpX = monsterX - hpW / 2;
      const hpY = monsterY + (compact ? 88 : 116);
      drawPanel(ctx, hpX, hpY, hpW, 18, 999, "rgba(255,255,255,.16)", "rgba(255,255,255,.18)");
      drawPanel(ctx, hpX, hpY, hpW * (state.monster.hp / state.monster.maxHp), 18, 999, COLORS[state.monster.color].hex, "transparent");
      drawText(ctx, `${state.monster.hp}/${state.monster.maxHp}`, monsterX, hpY + 9, 12, 900, "#fff");

      if (state.shieldActive && lesson.trivia) {
        drawPanel(ctx, Math.max(18, playWidth / 2 - 270), compact ? 132 : 128, Math.min(540, playWidth - 36), compact ? 94 : 86, 18, "rgba(30,41,59,.9)", "#fbbf24");
        drawText(ctx, "เกราะคำถาม", playWidth / 2, compact ? 156 : 152, compact ? 18 : 22, 900, "#fde68a");
        drawText(ctx, lesson.trivia.question, playWidth / 2, compact ? 188 : 188, compact ? 14 : 17, 700, "#f8fafc", "center", Math.min(500, playWidth - 56));
        state.triviaOrbs.forEach((orb) => {
          // eslint-disable-next-line react-hooks/immutability
          drawOrb(ctx, orb, compact, true);
        });
      }

      state.spellOrbs.forEach((orb) => {
        drawOrb(ctx, orb, compact, false);
      });
      drawText(ctx, "เลือก/จีบลูกแก้วเพื่อร่ายเวท", playWidth / 2, height - (compact ? 28 : 30), compact ? 12 : 14, 700, "rgba(255,255,255,.68)");

      state.floatingTexts.forEach((text) => {
        const progress = 1 - (text.until - now) / 1100;
        drawText(ctx, text.text, text.x, text.y - progress * 34, compact ? 18 : 24, 900, text.color);
      });

      if (state.gameState === "lesson-clear") {
        drawPanel(ctx, playWidth / 2 - Math.min(260, playWidth / 2 - 18), height / 2 - 72, Math.min(520, playWidth - 36), 144, 24, "rgba(15,23,42,.9)", "#86efac");
        drawText(ctx, "ผ่านบทเรียน!", playWidth / 2, height / 2 - 22, compact ? 32 : 42, 900, "#bbf7d0");
        drawText(ctx, "กำลังเปิดบทต่อไป", playWidth / 2, height / 2 + 30, compact ? 18 : 22, 800, "#e0f2fe");
      }
    }

    if (state.gameState === "complete") {
      drawPanel(ctx, playWidth / 2 - Math.min(330, playWidth / 2 - 18), height / 2 - 160, Math.min(660, playWidth - 36), 320, 26, "rgba(15,23,42,.9)", "#fde68a");
      drawText(ctx, "สำเร็จหลักสูตรสี!", playWidth / 2, height / 2 - 78, compact ? 36 : 52, 900, "#fde68a");
      drawText(ctx, `คะแนนรวม ${state.score}`, playWidth / 2, height / 2 - 16, compact ? 24 : 32, 900, "#bbf7d0");
      drawWrappedText(ctx, "คุณปราบมอนสเตอร์ด้วยความรู้เรื่องแม่สี สีขั้นที่ 2 วรรณะสี และคู่สีตรงข้ามครบแล้ว", playWidth / 2, height / 2 + 48, Math.min(540, playWidth - 70), 30, compact ? 17 : 20, 700, "#e0f2fe");
    }

    if (state.cursor.active) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(state.cursor.x, state.cursor.y, state.cursor.isDown ? 18 : 15, 0, Math.PI * 2);
      ctx.fillStyle = state.cursor.isDown ? "rgba(34,197,94,.32)" : "rgba(56,189,248,.2)";
      ctx.strokeStyle = state.cursor.isDown ? "#22c55e" : "#38bdf8";
      ctx.lineWidth = 4;
      ctx.fill();
      ctx.stroke();
      drawText(ctx, state.cursor.source === "hand" ? "จับ" : "เลือก", state.cursor.x + 32, state.cursor.y, 12, 800, "rgba(255,255,255,.75)", "left");
      ctx.restore();
    }

    // eslint-disable-next-line react-hooks/immutability
    animationRef.current = requestAnimationFrame(drawGame);
  }, [updateGame]);

  function drawOrb(ctx: CanvasRenderingContext2D, orb: { key: ColorKey; x: number; y: number; r: number }, compact: boolean, trivia: boolean) {
    const color = COLORS[orb.key];
    ctx.save();
    ctx.shadowColor = color.hex;
    ctx.shadowBlur = trivia ? 24 : 18;
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.82)";
    ctx.lineWidth = trivia ? 4 : 3;
    ctx.stroke();
    drawText(ctx, color.th, orb.x, orb.y + orb.r + (compact ? 15 : 18), compact ? 11 : 13, 800, "#f8fafc");
    ctx.restore();
  }

  useEffect(() => {
    resizeCanvas();
    animationRef.current = requestAnimationFrame(drawGame);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      stopCamera();
    };
  }, [drawGame, resizeCanvas, stopCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pointerMove = (event: PointerEvent) => updateCursorFallback(event.clientX, event.clientY, null);
    const pointerDown = (event: PointerEvent) => {
      updateCursorFallback(event.clientX, event.clientY, true);
      const state = stateRef.current;
      if (state.gameState === "intro") {
        const rect = canvas.getBoundingClientRect();
        const compact = rect.width < 760;
        const rightInset = compact ? 0 : 280;
        const playWidth = rect.width - rightInset;
        const button = { x: playWidth / 2 - 120, y: compact ? 425 : 402, w: 240, h: 70 };
        if (event.clientX >= button.x && event.clientX <= button.x + button.w && event.clientY >= button.y && event.clientY <= button.y + button.h) {
          resetGame();
        }
      }
    };
    const pointerUp = (event: PointerEvent) => updateCursorFallback(event.clientX, event.clientY, false);

    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointerup", pointerUp);
    return () => {
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerup", pointerUp);
    };
  }, [resetGame, updateCursorFallback]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        strategy="afterInteractive"
        onLoad={handleScriptReady}
        onError={() => {
          stateRef.current.cameraStatus = "โหลดระบบจับมือไม่สำเร็จ";
          syncView();
        }}
      />

      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="block h-full w-full touch-none" aria-label="AR Color Master game canvas" />

      <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 md:left-5 md:top-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold text-sky-100 backdrop-blur-md md:text-sm">
          {viewState.arEnabled ? <Hand className="h-4 w-4 text-emerald-300" /> : <MousePointer2 className="h-4 w-4 text-sky-300" />}
          {viewState.arEnabled ? "โหมดจับมือ" : "เมาส์/ทัชพร้อมเล่น"}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold text-amber-100 backdrop-blur-md md:text-sm">
          <Camera className="h-4 w-4 text-amber-300" />
          {viewState.cameraStatus}
        </span>
      </div>

      <aside className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-[280px] border-l border-white/10 bg-slate-950/72 p-5 pt-24 backdrop-blur-xl md:block">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-bold text-cyan-100">
          <BookOpen className="h-4 w-4" />
          สมุดโน้ตนักเวทย์
        </div>
        <h2 className="mb-3 text-xl font-black leading-tight text-amber-100">{viewState.codexTitle}</h2>
        <p className="text-sm font-medium leading-7 text-slate-200">{viewState.codexBody}</p>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/8 p-3">
          <p className="text-xs font-bold text-slate-400">บทเรียน</p>
          <p className="mt-1 text-sm font-bold text-white">{LESSONS[viewState.lessonIndex]?.title ?? "ครบทุกบท"}</p>
          <p className="mt-3 text-xs font-bold text-slate-400">คะแนน</p>
          <p className="mt-1 text-2xl font-black text-emerald-300">{viewState.score}</p>
        </div>
      </aside>

      {viewState.gameState !== "intro" && (
        <div className="absolute bottom-3 left-3 z-20 flex gap-2 md:bottom-5 md:left-5">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
            onClick={resetGame}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            เริ่มใหม่
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/18 px-4 py-2 text-sm font-bold text-emerald-50 shadow-lg backdrop-blur-md transition hover:bg-emerald-400/28"
            onClick={() => void tryStartCamera()}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            เปิด AR
          </button>
        </div>
      )}
    </main>
  );
}

function getSecondaryCodex(monsterColor: ColorKey, recipe: ColorKey[], selected: ColorKey[]) {
  const color = COLORS[monsterColor];
  const recipeText = recipe.map((key) => COLORS[key].th).join(" + ");
  const selectedText = selected.length ? selected.map((key) => COLORS[key].th).join(" + ") : "ยังไม่ได้เลือกส่วนผสม";
  return `รู้หรือไม่? สี${color.th} (${color.en}) เป็นสีขั้นที่ 2 เกิดจาก ${recipeText} ตอนนี้เลือกแล้ว: ${selectedText}`;
}

function getMonsterCodex(lesson: Lesson, monster: Monster) {
  if (lesson.kind === "secondary") return getSecondaryCodex(monster.color, SECONDARY_RECIPE[monster.color], []);
  if (lesson.kind === "temperature") {
    return monster.mode === "fire"
      ? "บอสอยู่ในโหมดไฟ ใช้สีวรรณะเย็นทั้งหมด ได้แก่ น้ำเงิน เขียว ม่วง เพื่อดับไฟ"
      : "บอสอยู่ในโหมดน้ำแข็ง ใช้สีวรรณะร้อนทั้งหมด ได้แก่ แดง เหลือง ส้ม เพื่อละลายน้ำแข็ง";
  }
  if (lesson.kind === "complementary") {
    const opposite = COMPLEMENTARY[monster.color];
    return `สีคู่ตรงข้ามของ ${COLORS[monster.color].th} คือ ${COLORS[opposite].th} ใช้สีนี้เพื่อโจมตีคริติคอล`;
  }
  return lesson.codexBody;
}
