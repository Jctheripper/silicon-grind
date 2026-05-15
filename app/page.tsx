'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const EMPLOYEES = [
  { id: 'dev',           name: 'Developer',      cost: 50,    income: 0.5,  emoji: '💻', color: '#4f46e5' },
  { id: 'designer',      name: 'Designer',        cost: 120,   income: 1.2,  emoji: '🎨', color: '#ec4899' },
  { id: 'marketer',      name: 'Marketer',        cost: 300,   income: 2.5,  emoji: '📣', color: '#f59e0b' },
  { id: 'sales',         name: 'Sales Rep',       cost: 600,   income: 5,    emoji: '🤝', color: '#22c55e' },
  { id: 'pm',            name: 'Product Manager', cost: 1200,  income: 9,    emoji: '📋', color: '#06b6d4' },
  { id: 'datascientist', name: 'Data Scientist',  cost: 2500,  income: 18,   emoji: '📊', color: '#8b5cf6' },
  { id: 'cto',           name: 'CTO',             cost: 8000,  income: 55,   emoji: '🔧', color: '#ef4444' },
  { id: 'ceo',           name: 'CEO',             cost: 25000, income: 150,  emoji: '👔', color: '#f59e0b' },
]

const OFFICES = [
  { id: 'garage',     name: 'Garage',          cost: 0,     multiplier: 1,   emoji: '🏠', desc: 'Coffee stains and dreams',   floors: 1 },
  { id: 'small',      name: 'Small Office',    cost: 1200,  multiplier: 1.5, emoji: '🏢', desc: 'Real desks, real coffee',     floors: 3 },
  { id: 'openplan',   name: 'Open Floor Plan', cost: 8000,  multiplier: 2.5, emoji: '🏙️', desc: 'Ping pong and cold brew',     floors: 6 },
  { id: 'skyscraper', name: 'Skyscraper HQ',   cost: 50000, multiplier: 6,   emoji: '🚀', desc: 'Penthouse views, IPO dreams', floors: 10 },
]

const FLOOR_DEFS = [
  { id: 'lobby',      name: 'Lobby',           color: '#1e1e3e', accent: '#4f46e5', icon: '🚪', desc: 'Where dreams begin',        unlockAt: 0      },
  { id: 'devroom',    name: 'Dev Room',        color: '#0f172a', accent: '#4f46e5', icon: '💻', desc: 'Code shipped here',         unlockAt: 0      },
  { id: 'design',     name: 'Design Studio',   color: '#1a0a2e', accent: '#ec4899', icon: '🎨', desc: 'Pixels and gradients',      unlockAt: 1200   },
  { id: 'marketing',  name: 'Marketing Hub',   color: '#1a1200', accent: '#f59e0b', icon: '📣', desc: 'Growth at all costs',       unlockAt: 1200   },
  { id: 'sales',      name: 'Sales Floor',     color: '#0a1a0a', accent: '#22c55e', icon: '🤝', desc: 'Always be closing',         unlockAt: 8000   },
  { id: 'datalab',    name: 'Data Lab',        color: '#0a0a1e', accent: '#8b5cf6', icon: '📊', desc: 'Big data, bigger insights', unlockAt: 8000   },
  { id: 'serverroom', name: 'Server Room',     color: '#001a0a', accent: '#22c55e', icon: '🖥️', desc: 'The heartbeat of ops',      unlockAt: 8000   },
  { id: 'boardroom',  name: 'Board Room',      color: '#1a0a00', accent: '#f59e0b', icon: '📋', desc: 'Power decisions made here', unlockAt: 50000  },
  { id: 'rooftop',    name: 'Rooftop Lounge',  color: '#0a001a', accent: '#a78bfa', icon: '🌆', desc: 'The perks of success',      unlockAt: 50000  },
  { id: 'penthouse',  name: 'CEO Penthouse',   color: '#1a0a00', accent: '#f59e0b', icon: '👑', desc: 'The corner office',         unlockAt: 50000  },
]

const TOOLS = [
  { id: 'github', name: 'GitHub',   cost: 200,   multiplier: 1.2, emoji: '🐙' },
  { id: 'slack',  name: 'Slack',    cost: 500,   multiplier: 1.3, emoji: '💬' },
  { id: 'aws',    name: 'AWS',      cost: 1500,  multiplier: 1.5, emoji: '☁️' },
  { id: 'figma',  name: 'Figma',    cost: 3000,  multiplier: 1.4, emoji: '🎯' },
  { id: 'ai',     name: 'AI Tools', cost: 10000, multiplier: 2.0, emoji: '🤖' },
]

const EQUIPMENT = [
  { id: 'coffee',   name: 'Coffee Machine',  cost: 150,  multiplier: 1.1, emoji: '☕' },
  { id: 'desks',    name: 'Standing Desks',  cost: 400,  multiplier: 1.2, emoji: '🪑' },
  { id: 'servers',  name: 'Server Rack',     cost: 2000, multiplier: 1.4, emoji: '🖥️' },
  { id: 'pinpong',  name: 'Ping Pong Table', cost: 5000, multiplier: 1.3, emoji: '🏓' },
  { id: 'snackbar', name: 'Snack Bar',       cost: 8000, multiplier: 1.5, emoji: '🍕' },
]

const GEM_PACKS = [
  { id: 'starter', name: 'Starter Pack', gems: 50,   price: 1.99,  emoji: '💎' },
  { id: 'growth',  name: 'Growth Pack',  gems: 150,  price: 4.99,  emoji: '💎💎' },
  { id: 'scale',   name: 'Scale Pack',   gems: 500,  price: 9.99,  emoji: '💎💎💎' },
  { id: 'founder', name: 'Founder Pack', gems: 2000, price: 19.99, emoji: '👑' },
]

const SPIN_REWARDS = [
  { label: '$500',   value: 500,  type: 'cash',  color: '#22c55e', pct: 0.005,  base: 500  },
  { label: '10 💎',  value: 10,   type: 'gems',  color: '#a78bfa', pct: 0,      base: 0    },
  { label: '$1,000', value: 1000, type: 'cash',  color: '#22c55e', pct: 0.01,   base: 1000 },
  { label: '2x 5m',  value: 300,  type: 'boost', color: '#f59e0b', pct: 0,      base: 0    },
  { label: '25 💎',  value: 25,   type: 'gems',  color: '#a78bfa', pct: 0,      base: 0    },
  { label: '$250',   value: 250,  type: 'cash',  color: '#22c55e', pct: 0.0025, base: 250  },
  { label: '50 💎',  value: 50,   type: 'gems',  color: '#a78bfa', pct: 0,      base: 0    },
  { label: '$2,000', value: 2000, type: 'cash',  color: '#22c55e', pct: 0.02,   base: 2000 },
]

const MILESTONES = [
  { id: 'm1', label: 'First Dollar',     goal: 1,       type: 'earned', reward: '10 💎',   rewardType: 'gems', rewardVal: 10     },
  { id: 'm2', label: 'First Employee',   goal: 1,       type: 'emp',    reward: '$500',    rewardType: 'cash', rewardVal: 500    },
  { id: 'm3', label: 'Reach $1,000',     goal: 1000,    type: 'earned', reward: '25 💎',   rewardType: 'gems', rewardVal: 25     },
  { id: 'm4', label: 'Reach $10,000',    goal: 10000,   type: 'earned', reward: '50 💎',   rewardType: 'gems', rewardVal: 50     },
  { id: 'm5', label: 'Reach $100,000',   goal: 100000,  type: 'earned', reward: '$50,000', rewardType: 'cash', rewardVal: 50000  },
  { id: 'm6', label: 'Reach $1,000,000', goal: 1000000, type: 'earned', reward: '200 💎',  rewardType: 'gems', rewardVal: 200    },
]

const LIVE_EVENTS = [
  { id: 'e1', name: 'Launch Weekend', desc: 'Ship 3 features',  goal: 3,     goalType: 'ships', reward: 150,  rewardType: 'gems', emoji: '🚀' },
  { id: 'e2', name: 'Hiring Spree',   desc: 'Hire 5 employees', goal: 5,     goalType: 'hires', reward: 5000, rewardType: 'cash', emoji: '👥' },
  { id: 'e3', name: 'Revenue Rush',   desc: 'Earn $50,000',     goal: 50000, goalType: 'cash',  reward: 100,  rewardType: 'gems', emoji: '💰' },
]

const RANDOM_EVENTS = [
  { msgFn: (v:number) => `🚀 Viral tweet! +${fmt(v)}`,           type: 'good', pct: 0.02,  base: 2000 },
  { msgFn: (v:number) => `📰 Press feature! +${fmt(v)}`,          type: 'good', pct: 0.05,  base: 5000 },
  { msgFn: (v:number) => `🎯 Enterprise client! +${fmt(v)}`,      type: 'good', pct: 0.08,  base: 8000 },
  { msgFn: (v:number) => `⚠️ Server crash! Pay ${fmt(v)} to fix`, type: 'bad',  pct: 0.005, base: 500  },
  { msgFn: (v:number) => `👾 Security breach! Pay ${fmt(v)}`,     type: 'bad',  pct: 0.01,  base: 1000 },
]

const LEADERBOARD_BASE = [
  { name: 'TechVault Inc',  value: 9800000 },
  { name: 'NexaCore',       value: 7200000 },
  { name: 'PixelForge',     value: 5100000 },
  { name: 'CloudNine Labs', value: 3400000 },
  { name: 'ByteRocket',     value: 2100000 },
]

const IPO_THRESHOLD = 1_000_000_000

const PRESTIGE_BOARD = [
  { name: 'TechVault Inc',  ipos: 7 },
  { name: 'NexaCore',       ipos: 5 },
  { name: 'PixelForge',     ipos: 4 },
  { name: 'CloudNine Labs', ipos: 2 },
  { name: 'ByteRocket',     ipos: 1 },
]

const OFFLINE_CAP = 3 * 60 * 60
const GAME_VERSION = '1.0.0'

const SAVE_KEY = 'sg_save'
let _saveCache: Record<string,unknown>|null|undefined = undefined
function loadSave(): Record<string,unknown>|null {
  if (_saveCache !== undefined) return _saveCache
  if (typeof window === 'undefined') return null
  try { const r=localStorage.getItem(SAVE_KEY); _saveCache=r?JSON.parse(r):null } catch(_) { _saveCache=null }
  return _saveCache ?? null
}

function fmt(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${Math.floor(n)}`
}

function empCost(base: number, owned: number): number {
  return Math.floor(base * Math.pow(1.15, owned))
}

function rewardLabel(def: typeof LIVE_EVENTS[0]): string {
  return def.rewardType === 'gems' ? `${def.reward} 💎` : fmt(def.reward)
}

interface FloatItem      { id: number; x: number; y: number; val: string }
interface Particle       { id: number; x: number; y: number; vx: number; vy: number; life: number; sym: string }
interface MilestoneState { id: string; done: boolean; claimed: boolean }
interface EventState     { msg: string; type: string; val: number }
interface LiveEventState { id: string; progress: number; claimed: boolean }
interface EmpAnim        { id: number; x: number; dir: number }
interface ConfettiPiece  { id: number; x: number; color: string; w: number; h: number; dur: number; delay: number }
interface DailyMission   { id: string; label: string; goal: number; type: 'ships'|'earned'|'hires'|'clicks'|'spend'; rewardType: 'gems'|'cash'; rewardVal: number; rewardPct: number; progress: number; claimed: boolean }

const MISSION_POOL = [
  { id:'ms1',  label:'Ship 2 Features',  goal:2,      type:'ships'  as const, rewardType:'gems' as const, rewardVal:20,    rewardPct:0    },
  { id:'ms2',  label:'Earn $10,000',      goal:10000,  type:'earned' as const, rewardType:'gems' as const, rewardVal:15,    rewardPct:0    },
  { id:'ms3',  label:'Hire 3 Employees',  goal:3,      type:'hires'  as const, rewardType:'gems' as const, rewardVal:25,    rewardPct:0    },
  { id:'ms4',  label:'Work 20 Times',     goal:20,     type:'clicks' as const, rewardType:'cash' as const, rewardVal:5000,  rewardPct:0.05 },
  { id:'ms5',  label:'Spend $5,000',      goal:5000,   type:'spend'  as const, rewardType:'gems' as const, rewardVal:20,    rewardPct:0    },
  { id:'ms6',  label:'Ship 5 Features',   goal:5,      type:'ships'  as const, rewardType:'gems' as const, rewardVal:40,    rewardPct:0    },
  { id:'ms7',  label:'Hire 5 Employees',  goal:5,      type:'hires'  as const, rewardType:'gems' as const, rewardVal:35,    rewardPct:0    },
  { id:'ms8',  label:'Earn $50,000',      goal:50000,  type:'earned' as const, rewardType:'gems' as const, rewardVal:35,    rewardPct:0    },
  { id:'ms9',  label:'Earn $100,000',     goal:100000, type:'earned' as const, rewardType:'gems' as const, rewardVal:50,    rewardPct:0    },
  { id:'ms10', label:'Work 50 Times',     goal:50,     type:'clicks' as const, rewardType:'cash' as const, rewardVal:20000, rewardPct:0.1  },
]

const STREAK_REWARDS = [
  { day:1, gems:10,  cash:0,     cashPct:0    },
  { day:2, gems:20,  cash:0,     cashPct:0    },
  { day:3, gems:0,   cash:5000,  cashPct:0.05 },
  { day:4, gems:35,  cash:0,     cashPct:0    },
  { day:5, gems:0,   cash:15000, cashPct:0.15 },
  { day:6, gems:75,  cash:0,     cashPct:0    },
  { day:7, gems:150, cash:50000, cashPct:0.5  },
]

function streakRewardLabel(r: typeof STREAK_REWARDS[0], cv: number): string {
  const cashAmt = r.cash > 0 ? Math.max(r.cash, Math.floor(cv * r.cashPct)) : 0
  if (r.day === 7) return `👑 ${r.gems} 💎 + ${fmt(cashAmt)}`
  if (r.gems > 0)  return `${r.gems} 💎`
  return fmt(cashAmt)
}

function pickDailyMissions(dateStr: string) {
  let seed = 0
  for (let i = 0; i < dateStr.length; i++) seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0
  const lcg = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000 }
  const pool = [...MISSION_POOL]
  const picked: typeof MISSION_POOL = []
  while (picked.length < 3 && pool.length > 0) {
    const idx = Math.floor(lcg() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}

function useMusicEngine(level: number) {
  const ctxRef    = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const echoInRef = useRef<DelayNode | null>(null)
  const schedRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextRef   = useRef(0)
  const stepRef   = useRef(0)
  const levelRef  = useRef(level)
  const [playing, setPlaying] = useState(false)

  useEffect(() => { levelRef.current = level }, [level])

  // 128 BPM · 16th-note grid
  const S     = 60 / 128 / 4   // ~0.117 s per 16th note
  const STEPS = 64              // 4-bar loop: Am – F – C – G
  const AHEAD = 0.15
  const MS    = 50

  const HZ: Record<string,number> = {
    E2:82.41,  F2:87.31,  G2:98.00,  A2:110.00, B2:123.47,
    C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00,
    A3:220.00, B3:246.94, C4:261.63, D4:293.66, E4:329.63,
    F4:349.23, G4:392.00, A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99,
  }

  // Bass: one note per 8th note (every 2 steps) — 32 entries
  const BASS = [
    HZ.A2,HZ.A2, HZ.A2,HZ.E3, HZ.A2,HZ.G3, HZ.A2,HZ.E3,  // Am
    HZ.F2,HZ.F2, HZ.F2,HZ.C3, HZ.F2,HZ.E3, HZ.F2,HZ.C3,  // F
    HZ.C3,HZ.C3, HZ.C3,HZ.G3, HZ.C3,HZ.B2, HZ.C3,HZ.G3,  // C
    HZ.G2,HZ.G2, HZ.G2,HZ.D3, HZ.G2,HZ.F2, HZ.G2,HZ.D3,  // G
  ]

  // Chord pads per bar [Am, F, C, G]
  const PADS = [
    [HZ.A3,HZ.C4,HZ.E4],
    [HZ.F3,HZ.A3,HZ.C4],
    [HZ.C4,HZ.E4,HZ.G4],
    [HZ.G3,HZ.B3,HZ.D4],
  ]

  // Pre-composed melody: step → {f, d} | null
  type Mel = {f:number,d:number}|null
  const MEL: Mel[] = Array(STEPS).fill(null)
  const put = (st:number,n:string,d:number) => { MEL[st]={f:HZ[n],d} }
  put(0,'E5',2);  put(2,'D5',2);  put(4,'C5',2);  put(6,'A4',2)   // Bar 1 (Am)
  put(8,'G4',2);  put(10,'A4',2); put(12,'C5',4)
  put(16,'F5',3); put(19,'E5',1); put(20,'D5',4)                   // Bar 2 (F)
  put(24,'C5',2); put(26,'D5',2); put(28,'E5',4)
  put(32,'G4',2); put(34,'A4',2); put(36,'C5',4)                   // Bar 3 (C)
  put(40,'E5',2); put(42,'G5',2); put(44,'E5',4)
  put(48,'D5',4); put(52,'B4',4)                                    // Bar 4 (G)
  put(56,'G4',2); put(58,'A4',2); put(60,'B4',2); put(62,'D5',2)

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const ctx    = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
      // 8th-note echo with feedback
      const echoDelay    = ctx.createDelay(0.3)
      const echoFeedback = ctx.createGain()
      const echoWet      = ctx.createGain()
      echoDelay.delayTime.value = S * 2
      echoFeedback.gain.value   = 0.28
      echoWet.gain.value        = 0.20
      echoDelay.connect(echoFeedback)
      echoFeedback.connect(echoDelay)
      echoDelay.connect(echoWet)
      echoWet.connect(master)
      ctxRef.current    = ctx
      masterRef.current = master
      echoInRef.current = echoDelay
    }
    return { ctx: ctxRef.current!, master: masterRef.current! }
  }

  const kick = (ctx: AudioContext, dst: GainNode, t: number) => {
    const osc = ctx.createOscillator(), g = ctx.createGain()
    osc.connect(g); g.connect(dst)
    osc.frequency.setValueAtTime(60, t)
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.38)
    g.gain.setValueAtTime(1.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38)
    osc.start(t); osc.stop(t + 0.39)
  }

  const snare = (ctx: AudioContext, dst: GainNode, t: number) => {
    const len  = Math.floor(ctx.sampleRate * 0.13)
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain()
    src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8
    src.connect(bp); bp.connect(g); g.connect(dst)
    g.gain.setValueAtTime(0.65, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.13)
    src.start(t); src.stop(t + 0.14)
    const osc2 = ctx.createOscillator(), g2 = ctx.createGain()
    osc2.type = 'triangle'; osc2.frequency.value = 200
    osc2.connect(g2); g2.connect(dst)
    g2.gain.setValueAtTime(0.35, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc2.start(t); osc2.stop(t + 0.08)
  }

  const hihat = (ctx: AudioContext, dst: GainNode, t: number, vol: number, decay: number) => {
    const len  = Math.floor(ctx.sampleRate * (decay + 0.01))
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain()
    src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 9000
    src.connect(hp); hp.connect(g); g.connect(dst)
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + decay)
    src.start(t); src.stop(t + decay + 0.01)
  }

  const bass = (ctx: AudioContext, dst: GainNode, freq: number, t: number, dur: number) => {
    const osc = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain()
    osc.type = 'sawtooth'; osc.frequency.value = freq
    lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = 3
    osc.connect(lp); lp.connect(g); g.connect(dst)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.65, t + 0.01)
    g.gain.setValueAtTime(0.45, t + dur - 0.03)
    g.gain.linearRampToValueAtTime(0, t + dur)
    osc.start(t); osc.stop(t + dur + 0.01)
  }

  const lead = (ctx: AudioContext, dst: GainNode, freq: number, t: number, dur: number) => {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator()
    const lp = ctx.createBiquadFilter(), g = ctx.createGain()
    o1.type = 'square'; o1.frequency.value = freq
    o2.type = 'square'; o2.frequency.value = freq * 1.006
    lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 2
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(dst)
    if (echoInRef.current) g.connect(echoInRef.current)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22, t + 0.012)
    g.gain.setValueAtTime(0.18, t + dur - 0.05)
    g.gain.linearRampToValueAtTime(0, t + dur)
    o1.start(t); o2.start(t); o1.stop(t+dur+0.01); o2.stop(t+dur+0.01)
  }

  const pad = (ctx: AudioContext, dst: GainNode, freqs: number[], t: number, dur: number) => {
    for (const freq of freqs) {
      const osc = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      lp.type = 'lowpass'; lp.frequency.value = 1400
      osc.connect(lp); lp.connect(g); g.connect(dst)
      if (echoInRef.current) g.connect(echoInRef.current)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.07, t + 0.45)
      g.gain.setValueAtTime(0.07, t + dur - 0.35)
      g.gain.linearRampToValueAtTime(0, t + dur)
      osc.start(t); osc.stop(t + dur + 0.01)
    }
  }

  const schedule = useCallback(() => {
    const ctx = ctxRef.current, master = masterRef.current
    if (!ctx || !master) return
    while (nextRef.current < ctx.currentTime + AHEAD) {
      const t  = nextRef.current
      const st = stepRef.current % STEPS
      const lv = levelRef.current

      if (st % 16 === 0) pad(ctx, master, PADS[Math.floor(st/16)], t, S * 16)
      const note = MEL[st]
      if (note) lead(ctx, master, note.f, t, S * note.d * 0.88)

      if (lv >= 1) {
        if (st % 8 === 0)   kick(ctx, master, t)
        if (st % 8 === 4)   snare(ctx, master, t)
        if (st % 2 === 0)   hihat(ctx, master, t, 0.20, 0.05)
        if (st % 16 === 14) hihat(ctx, master, t, 0.25, 0.30)
      }
      if (lv >= 2 && st % 2 === 0)
        bass(ctx, master, BASS[Math.floor(st/2)], t, S * 1.7)
      if (lv >= 3 && st % 2 === 1) hihat(ctx, master, t, 0.10, 0.04)

      stepRef.current++
      nextRef.current += S
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stop = useCallback(() => {
    if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null }
    const ctx = ctxRef.current, master = masterRef.current
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)
    }
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    const { ctx, master } = ensureCtx()
    if (ctx.state === 'suspended') ctx.resume()
    nextRef.current  = ctx.currentTime + 0.05
    stepRef.current  = 0
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2)
    schedRef.current = setInterval(schedule, MS)
    setPlaying(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule])

  const toggle = useCallback(() => {
    if (playing) stop(); else start()
  }, [playing, stop, start])

  useEffect(() => () => { stop() }, [stop])

  return { playing, toggle, start }
}

function BuildingFloor({
  floor, unlocked, income, onClick, empCount, hasEquipment
}: {
  floor: typeof FLOOR_DEFS[0]
  unlocked: boolean
  income: number
  onClick: () => void
  empCount: number
  hasEquipment: boolean
}) {
  const [emps, setEmps]         = useState<EmpAnim[]>([])
  const [cashPops, setCashPops] = useState<{id:number;x:number}[]>([])
  const tickRef                 = useRef(0)

  useEffect(() => {
    if (!unlocked || empCount === 0) { setEmps([]); return }
    const count = Math.min(empCount, 4)
    setEmps(Array.from({ length: count }, (_, i) => ({ id: i, x: 20 + i * 55, dir: i % 2 === 0 ? 1 : -1 })))
  }, [unlocked, empCount])

  useEffect(() => {
    if (!unlocked || empCount === 0) return
    const iv = setInterval(() => {
      tickRef.current++
      setEmps(prev => prev.map(e => {
        let nx = e.x + e.dir * 0.9
        let nd = e.dir
        if (nx > 255) { nx = 255; nd = -1 }
        if (nx < 10)  { nx = 10;  nd = 1  }
        return { ...e, x: nx, dir: nd }
      }))
      if (income > 0 && tickRef.current % 28 === 0) {
        const id = Date.now() + Math.random()
        setCashPops(p => [...p, { id, x: 60 + Math.random() * 140 }])
        setTimeout(() => setCashPops(p => p.filter(c => c.id !== id)), 1100)
      }
    }, 50)
    return () => clearInterval(iv)
  }, [unlocked, empCount, income])

  if (!unlocked) {
    return (
      <div onClick={onClick} style={{ height: 68, background: '#080810', border: '1px dashed #1a1a2e', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#2a2a3e' }}>🔒 {floor.name}</span>
      </div>
    )
  }

  return (
    <div onClick={onClick} style={{ height: 68, background: floor.color, border: `1px solid ${floor.accent}44`, borderRadius: 6, position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: 3 }}>
      <div style={{ position:'absolute', top:4, left:8, fontSize:10, color:floor.accent, fontWeight:700, zIndex:2 }}>{floor.icon} {floor.name}</div>
      {income > 0 && <div style={{ position:'absolute', top:4, right:8, fontSize:9, color:'#22c55e', zIndex:2 }}>+{fmt(income)}/s</div>}

      {[0,1,2].map(i => (
        <div key={i} style={{ position:'absolute', bottom:13, left:24+i*82, width:52, height:9, background:`${floor.accent}33`, borderRadius:2 }}>
          <div style={{ position:'absolute', top:-5, left:3, width:11, height:9, background:'#111', borderRadius:2, border:`1px solid ${floor.accent}55` }} />
        </div>
      ))}

      {floor.id === 'serverroom' && (
        <div style={{ position:'absolute', right:10, bottom:8, display:'flex', gap:3 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:6, height:22, background:'#0a1a0a', border:'1px solid #22c55e33', borderRadius:2, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'3px 0' }}>
              <div style={{ width:3, height:3, borderRadius:'50%', background:'#22c55e', animation:`blink ${0.7+i*0.35}s infinite` }} />
              <div style={{ width:3, height:3, borderRadius:'50%', background:'#f59e0b', animation:`blink ${1.1+i*0.25}s infinite` }} />
            </div>
          ))}
        </div>
      )}

      {floor.id === 'lobby' && hasEquipment && (
        <div style={{ position:'absolute', right:18, bottom:11, width:38, height:7, background:'#166534', borderRadius:2, border:'1px solid #15803d' }}>
          <div style={{ position:'absolute', left:'50%', top:0, width:1, height:7, background:'#fff' }} />
        </div>
      )}

      {emps.map(e => (
        <div key={e.id} style={{ position:'absolute', bottom:20, left:e.x, transition:'left 0.05s linear', zIndex:3 }}>
          <div style={{ width:11, height:11, borderRadius:'50%', background:EMPLOYEES[e.id % EMPLOYEES.length]?.color||'#888', border:'1px solid #fff3', fontSize:7, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            {e.dir===1?'›':'‹'}
          </div>
          <div style={{ width:7, height:9, background:EMPLOYEES[e.id%EMPLOYEES.length]?.color||'#555', margin:'0 auto', borderRadius:'2px 2px 0 0', opacity:0.75 }} />
        </div>
      ))}

      {cashPops.map(c => (
        <div key={c.id} style={{ position:'absolute', bottom:28, left:c.x, fontSize:10, color:'#22c55e', fontWeight:700, animation:'floatUp 1.1s ease-out forwards', pointerEvents:'none', zIndex:5 }}>$</div>
      ))}

      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`${floor.accent}44` }} />
    </div>
  )
}

function BuildingView({
  officeIdx, totalEarned, getIncome, employees, equipment,
  cash, setCash, setTotalEarned, addFloat,
  ship, shipCooldown, watchAd, milestones, claimMilestone, upgradeOffice
}: {
  officeIdx: number; totalEarned: number; getIncome: ()=>number
  employees: Record<string,number>; equipment: Record<string,boolean>
  cash: number; setCash: (fn:(c:number)=>number)=>void
  setTotalEarned: (fn:(t:number)=>number)=>void; addFloat: (val:string)=>void
  ship: ()=>void; shipCooldown: number; watchAd: (type:string)=>void
  milestones: MilestoneState[]; claimMilestone: (id:string)=>void; upgradeOffice: ()=>void
}) {
  const [zoom, setZoom]                   = useState(1)
  const [panY, setPanY]                   = useState(0)
  const [dragging, setDragging]           = useState(false)
  const [lastY, setLastY]                 = useState(0)
  const [selectedFloor, setSelectedFloor] = useState<typeof FLOOR_DEFS[0]|null>(null)
  const lastDistRef                       = useRef<number|null>(null)

  const office      = OFFICES[officeIdx]
  const allFloors   = FLOOR_DEFS.slice(0, office.floors + 2)
  const income      = getIncome()
  const hasEquip    = Object.values(equipment).some(Boolean)

  const floorEmpMap: Record<string,string[]> = {
    devroom:['dev','datascientist'], design:['designer'], marketing:['marketer'],
    sales:['sales'], datalab:['datascientist','pm'], boardroom:['pm','ceo'],
    penthouse:['ceo','cto'], serverroom:['cto'], lobby:['sales'], rooftop:[],
  }

  const floorIncome  = (id:string) => (floorEmpMap[id]||[]).reduce((a,eid) => { const e=EMPLOYEES.find(x=>x.id===eid); return a+(e?e.income*(employees[eid]||0):0) }, 0) * office.multiplier
  const floorEmpCount= (id:string) => (floorEmpMap[id]||[]).reduce((a,eid) => a+(employees[eid]||0), 0)

  const handleMouseDown = (e:React.MouseEvent) => { setDragging(true); setLastY(e.clientY) }
  const handleMouseMove = (e:React.MouseEvent) => { if (dragging) setPanY(p => p + e.movementY) }
  const handleMouseUp   = () => setDragging(false)
  const handleWheel     = (e:React.WheelEvent) => { e.preventDefault(); setZoom(z => Math.max(0.5, Math.min(2.5, z - e.deltaY*0.001))) }

  const handleTouchStart = (e:React.TouchEvent) => { if (e.touches.length===1) { setDragging(true); setLastY(e.touches[0].clientY) } }
  const handleTouchMove  = (e:React.TouchEvent) => {
    if (e.touches.length===2) {
      const dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY
      const dist=Math.sqrt(dx*dx+dy*dy)
      if (lastDistRef.current!==null) setZoom(z => Math.max(0.5, Math.min(2.5, z+(dist-lastDistRef.current!)*0.005)))
      lastDistRef.current=dist
    } else if (e.touches.length===1 && dragging) {
      setPanY(p => p+(e.touches[0].clientY-lastY)); setLastY(e.touches[0].clientY)
    }
  }
  const handleTouchEnd = () => { setDragging(false); lastDistRef.current=null }

  const reversed = [...allFloors].reverse()

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ fontSize:11, color:'#666' }}>{office.emoji} {office.name} • {allFloors.filter(f=>totalEarned>=f.unlockAt).length} floors active</div>
        <div style={{ display:'flex', gap:5 }}>
          <button onClick={()=>setZoom(z=>Math.min(2.5,z+0.25))} style={{ background:'#1a1a2e', border:'1px solid #333', color:'#fff', borderRadius:5, padding:'3px 9px', cursor:'pointer', fontSize:15 }}>+</button>
          <button onClick={()=>setZoom(1)} style={{ background:'#1a1a2e', border:'1px solid #333', color:'#666', borderRadius:5, padding:'3px 7px', cursor:'pointer', fontSize:10 }}>1x</button>
          <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.25))} style={{ background:'#1a1a2e', border:'1px solid #333', color:'#fff', borderRadius:5, padding:'3px 9px', cursor:'pointer', fontSize:15 }}>−</button>
        </div>
      </div>
      <div style={{ fontSize:9, color:'#333', textAlign:'center', marginBottom:5 }}>Drag to pan • Pinch/scroll to zoom • Tap floor to inspect</div>

      <div
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}     onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{ height:400, overflow:'hidden', background:'#04040e', borderRadius:14, border:'1px solid #1a1a2e', cursor:dragging?'grabbing':'grab', position:'relative' }}
      >
        {/* stars */}
        {[...Array(18)].map((_,i) => (
          <div key={i} style={{ position:'absolute', width:1, height:1, background:'#fff', borderRadius:'50%', top:`${(i*11)%85}%`, left:`${(i*19)%100}%`, opacity:0.2+(i%4)*0.1 }} />
        ))}
        {/* skyline bg */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:120, opacity:0.12 }}>
          {[0,40,75,110,150,185,220,260,295,330,370,405,440].map((x,i)=>(
            <div key={i} style={{ position:'absolute', bottom:0, left:x, width:28, height:50+(i%4)*35, background:'#1e1e3e' }} />
          ))}
        </div>

        <div style={{ transform:`translateY(${panY}px) scale(${zoom})`, transformOrigin:'top center', transition:dragging?'none':'transform 0.08s', padding:'12px 16px' }}>
          <div style={{ background:'#0a0a18', border:'2px solid #1e1e3e', borderRadius:10, overflow:'hidden' }}>
            {/* roof bar */}
            <div style={{ background:'#1a1a2e', padding:'5px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#818cf8' }}>⚡ SILICON GRIND HQ</div>
              <div style={{ fontSize:9, color:'#22c55e' }}>{fmt(income)}/s</div>
            </div>
            <div style={{ padding:'3px 6px 6px' }}>
              {reversed.map(floor => (
                <BuildingFloor
                  key={floor.id}
                  floor={floor}
                  unlocked={totalEarned >= floor.unlockAt}
                  income={floorIncome(floor.id)}
                  onClick={() => setSelectedFloor(totalEarned>=floor.unlockAt ? floor : null)}
                  empCount={floorEmpCount(floor.id)}
                  hasEquipment={hasEquip}
                />
              ))}
            </div>
            <div style={{ height:6, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', opacity:0.6 }} />
          </div>
        </div>
      </div>

      {selectedFloor && (
        <div style={{ background:'#1a1a2e', border:`1px solid ${selectedFloor.accent}`, borderRadius:10, padding:12, marginTop:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>{selectedFloor.icon} {selectedFloor.name}</div>
            <button onClick={()=>setSelectedFloor(null)} style={{ background:'none', border:'none', color:'#555', fontSize:17, cursor:'pointer' }}>×</button>
          </div>
          <div style={{ fontSize:10, color:'#555', marginBottom:7 }}>{selectedFloor.desc}</div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
            <span style={{ color:'#888' }}>Staff: <strong style={{ color:'#fff' }}>{floorEmpCount(selectedFloor.id)}</strong></span>
            <span style={{ color:'#888' }}>Output: <strong style={{ color:'#22c55e' }}>{fmt(floorIncome(selectedFloor.id))}/s</strong></span>
          </div>
        </div>
      )}

      <div style={{ marginTop:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
        <button onClick={ship} disabled={shipCooldown>0} style={{ padding:11, background:shipCooldown>0?'#1e1e3e':'linear-gradient(90deg,#22c55e,#16a34a)', color:shipCooldown>0?'#444':'#fff', border:'none', borderRadius:9, cursor:'pointer', fontWeight:700, fontSize:12, animation:shipCooldown===0?'shipPulse 1.5s ease-in-out infinite':'none' }}>
          {shipCooldown>0?`🚀 ${shipCooldown}s`:'🚀 Ship Feature!'}
        </button>
        {officeIdx < OFFICES.length-1
          ? <button onClick={upgradeOffice} disabled={cash<OFFICES[officeIdx+1].cost} style={{ padding:11, background:cash>=OFFICES[officeIdx+1].cost?'linear-gradient(90deg,#4f46e5,#7c3aed)':'#1e1e3e', color:cash>=OFFICES[officeIdx+1].cost?'#fff':'#444', border:'none', borderRadius:9, cursor:'pointer', fontWeight:700, fontSize:11 }}>
              🏢 Upgrade HQ<br/><span style={{ fontSize:9, fontWeight:400 }}>({fmt(OFFICES[officeIdx+1].cost)})</span>
            </button>
          : <div style={{ padding:11, background:'#0f2818', border:'1px solid #22c55e', borderRadius:9, textAlign:'center', fontSize:11, color:'#22c55e', fontWeight:700 }}>👑 Max Level!</div>
        }
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginTop:7 }}>
        {[{type:'boost',icon:'⚡',sub:'2x 60s'},{type:'gems',icon:'💎',sub:'+15 💎'},{type:'cash',icon:'💰',sub:'Bonus $'}].map(a=>(
          <button key={a.type} onClick={()=>watchAd(a.type)} style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:9, padding:'7px 3px', cursor:'pointer', color:'#fff', textAlign:'center' }}>
            <div style={{ fontSize:17 }}>{a.icon}</div>
            <div style={{ fontSize:9, color:'#818cf8' }}>Watch Ad</div>
            <div style={{ fontSize:9, color:'#555' }}>{a.sub}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize:11, color:'#666', margin:'11px 0 7px' }}>MILESTONES</div>
      {milestones.map(ms => {
        const def = MILESTONES.find(m=>m.id===ms.id)!
        return (
          <div key={ms.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:ms.done?'#0f2818':'#1a1a2e', border:`1px solid ${ms.done?'#22c55e':'#2a2a2a'}`, borderRadius:9, padding:'8px 11px', marginBottom:5 }}>
            <div style={{ fontSize:11 }}>{ms.done?'✅':'🎯'} {def.label}</div>
            {ms.done&&!ms.claimed
              ? <button onClick={()=>claimMilestone(ms.id)} style={{ background:'#22c55e', color:'#fff', border:'none', borderRadius:5, padding:'3px 8px', cursor:'pointer', fontSize:10, fontWeight:700 }}>Claim {def.reward}</button>
              : <div style={{ fontSize:10, color:ms.claimed?'#22c55e':'#555' }}>{ms.claimed?'✓':def.reward}</div>
            }
          </div>
        )
      })}
    </div>
  )
}

export default function SiliconGrind() {
  const [cash, setCash]                     = useState(500)
  const [gems, setGems]                     = useState(20)
  const [tab, setTab]                       = useState('hq')
  const [officeIdx, setOfficeIdx]           = useState(0)
  const [employees, setEmployees]           = useState<Record<string,number>>({})
  const [tools, setTools]                   = useState<Record<string,boolean>>({})
  const [equipment, setEquipment]           = useState<Record<string,boolean>>({})
  const [boost, setBoost]                   = useState(false)
  const [boostTimer, setBoostTimer]         = useState(0)
  const [shipCooldown, setShipCooldown]     = useState(0)
  const [spinning, setSpinning]             = useState(false)
  const [spinResult, setSpinResult]         = useState<string|null>(null)
  const [spinAngle, setSpinAngle]           = useState(0)
  const [spunToday, setSpunToday]           = useState(false)
  const [milestones, setMilestones]         = useState<MilestoneState[]>(MILESTONES.map(m=>({id:m.id,done:false,claimed:false})))
  const [floats, setFloats]                 = useState<FloatItem[]>([])
  const [flashSale, setFlashSale]           = useState(false)
  const [flashTimer, setFlashTimer]         = useState(0)
  const [event, setEvent]                   = useState<EventState|null>(null)
  const [totalEarned, setTotalEarned]       = useState(500)
  const [companyValue, setCompanyValue]     = useState(500)
  const [adWatching, setAdWatching]         = useState<string|null>(null)
  const [showWelcome, setShowWelcome]       = useState(false)
  const [welcomeTimer, setWelcomeTimer]     = useState(30)
  const [welcomeClaimed, setWelcomeClaimed] = useState(false)
  const [showOffline, setShowOffline]       = useState(false)
  const [offlineEarned, setOfflineEarned]   = useState(0)
  const [loginStreak, setLoginStreak]       = useState(1)
  const [liveEvent, setLiveEvent]           = useState<LiveEventState>({id:'e1',progress:0,claimed:false})
  const [liveEventTimer, setLiveEventTimer] = useState(48*3600)
  const [totalShips, setTotalShips]         = useState(0)
  const [totalHires, setTotalHires]         = useState(0)
  const [unlockedTabs, setUnlockedTabs]     = useState<string[]>(['hq','settings'])
  const [newTabBadge, setNewTabBadge]       = useState<string|null>(null)
  const [milestonePopup, setMilestonePopup] = useState<string|null>(null)
  const lastTickRef       = useRef<number>(Date.now())
  const companyValueRef   = useRef(500)
  const { playing: musicPlaying, toggle: toggleMusic, start: startMusic } = useMusicEngine(officeIdx)
  const musicStartedRef = useRef(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const rAFRef = useRef(0)
  const [shaking, setShaking]             = useState(false)
  const [levelUpShow, setLevelUpShow]     = useState(false)
  const [newOfficeName, setNewOfficeName] = useState('')
  const [confetti, setConfetti]           = useState<ConfettiPiece[]>([])
  const displayCashRef                            = useRef(500)
  const [displayCash, setDisplayCash]             = useState(500)
  const [sfxEnabled, setSfxEnabled]               = useState(true)
  const [companyName, setCompanyName]             = useState('Your Company')
  const [companyNameInput, setCompanyNameInput]   = useState('Your Company')
  const [daysPlayed, setDaysPlayed]               = useState(1)
  const [showResetConfirm, setShowResetConfirm]   = useState(false)
  const sfxCtxRef = useRef<AudioContext|null>(null)
  const [prestigeLevel, setPrestigeLevel] = useState(0)
  const [ipoShow, setIpoShow]             = useState(false)
  const [missionDate, setMissionDate]         = useState('')
  const [dailyMissions, setDailyMissions]     = useState<DailyMission[]>([])
  const [dailyShips, setDailyShips]           = useState(0)
  const [dailyHires, setDailyHires]           = useState(0)
  const [dailyEarned, setDailyEarned]         = useState(0)
  const [dailyClicks, setDailyClicks]         = useState(0)
  const [dailySpent, setDailySpent]           = useState(0)
  const [lastLoginDate, setLastLoginDate]     = useState('')
  const [streakClaimed, setStreakClaimed]     = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)

  useEffect(()=>{
    const s=loadSave()
    if (s) {
      if (typeof s.cash==='number')          setCash(s.cash)
      if (typeof s.gems==='number')          setGems(s.gems)
      if (typeof s.officeIdx==='number')     setOfficeIdx(s.officeIdx)
      if (s.employees)                       setEmployees(s.employees as Record<string,number>)
      if (s.tools)                           setTools(s.tools as Record<string,boolean>)
      if (s.equipment)                       setEquipment(s.equipment as Record<string,boolean>)
      if (s.spunDate===new Date().toDateString()) setSpunToday(true)
      if (s.milestones)                      setMilestones(s.milestones as MilestoneState[])
      if (typeof s.totalEarned==='number')   setTotalEarned(s.totalEarned)
      if (typeof s.companyValue==='number')  setCompanyValue(s.companyValue)
      if (s.welcomeClaimed)                  { setWelcomeClaimed(true); setShowWelcome(false) }
      if (s.liveEvent)                       setLiveEvent(s.liveEvent as LiveEventState)
      if (typeof s.liveEventTimer==='number') setLiveEventTimer(s.liveEventTimer)
      if (typeof s.totalShips==='number')    setTotalShips(s.totalShips)
      if (typeof s.totalHires==='number')    setTotalHires(s.totalHires)
      if (typeof s.missionDate==='string')   setMissionDate(s.missionDate)
      if (Array.isArray(s.dailyMissions))    setDailyMissions(s.dailyMissions as DailyMission[])
      if (typeof s.dailyShips==='number')    setDailyShips(s.dailyShips)
      if (typeof s.dailyHires==='number')    setDailyHires(s.dailyHires)
      if (typeof s.dailyEarned==='number')   setDailyEarned(s.dailyEarned)
      if (typeof s.dailyClicks==='number')   setDailyClicks(s.dailyClicks)
      if (typeof s.dailySpent==='number')    setDailySpent(s.dailySpent)
      if (typeof s.sfxEnabled==='boolean')    setSfxEnabled(s.sfxEnabled)
      if (typeof s.companyName==='string')    { setCompanyName(s.companyName); setCompanyNameInput(s.companyName) }
      if (typeof s.prestigeLevel==='number')  setPrestigeLevel(s.prestigeLevel)
      const loadedLastLogin = typeof s.lastLoginDate==='string' ? s.lastLoginDate : ''
      const loadedStreak    = typeof s.loginStreak==='number'   ? s.loginStreak   : 1
      const loadedDays      = typeof s.daysPlayed==='number'    ? s.daysPlayed    : 1
      const today           = new Date().toDateString()
      if (loadedLastLogin !== today) {
        const yesterday = new Date(Date.now()-86400000).toDateString()
        const newStreak = loadedLastLogin===yesterday ? loadedStreak+1 : 1
        setLoginStreak(newStreak); setLastLoginDate(today); setStreakClaimed(false); setShowStreakModal(true)
        setDaysPlayed(loadedDays+1)
      } else {
        setLoginStreak(loadedStreak); setLastLoginDate(loadedLastLogin)
        if (typeof s.streakClaimed==='boolean') setStreakClaimed(s.streakClaimed)
        setDaysPlayed(loadedDays)
      }
    } else {
      setShowWelcome(true)
      setLoginStreak(1); setLastLoginDate(new Date().toDateString()); setStreakClaimed(false)
      setDaysPlayed(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        cash, gems, officeIdx, employees, tools, equipment,
        spunDate: spunToday ? new Date().toDateString() : null,
        milestones, totalEarned, companyValue, welcomeClaimed,
        liveEvent, liveEventTimer, totalShips, totalHires,
        missionDate, dailyMissions, dailyShips, dailyHires, dailyEarned, dailyClicks, dailySpent,
        loginStreak, lastLoginDate, streakClaimed,
        sfxEnabled, companyName, daysPlayed, prestigeLevel,
      }))
    } catch(_) {}
  },[cash,gems,officeIdx,employees,tools,equipment,spunToday,milestones,
     totalEarned,companyValue,welcomeClaimed,liveEvent,liveEventTimer,totalShips,totalHires,
     missionDate,dailyMissions,dailyShips,dailyHires,dailyEarned,dailyClicks,dailySpent,
     loginStreak,lastLoginDate,streakClaimed,
     sfxEnabled,companyName,daysPlayed,prestigeLevel])

  useEffect(()=>{
    try {
      const saved=localStorage.getItem('sg_last_seen')
      if(saved){const diff=Math.min((Date.now()-parseInt(saved))/1000,OFFLINE_CAP);if(diff>60){setOfflineEarned(Math.floor(diff*0.5));setShowOffline(true)}}
      localStorage.setItem('sg_last_seen',Date.now().toString())
      if(localStorage.getItem('sg_visited'))setShowWelcome(false)
    }catch(_){}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{
    const tabs=['hq']
    if(totalEarned>=200)tabs.push('team')
    if(totalEarned>=1000)tabs.push('grow')
    if(totalEarned>=5000)tabs.push('ship')
    if(totalEarned>=10000)tabs.push('meta')
    tabs.push('settings')
    setUnlockedTabs(prev=>{const added=tabs.filter(t=>!prev.includes(t));if(added.length>0)setNewTabBadge(added[added.length-1]);return tabs})
  },[totalEarned])

  useEffect(()=>{if(!newTabBadge)return;const t=setTimeout(()=>setNewTabBadge(null),4000);return()=>clearTimeout(t)},[newTabBadge])

  const getIncome=useCallback(():number=>{
    let base=0
    Object.entries(employees).forEach(([id,count])=>{const emp=EMPLOYEES.find(e=>e.id===id);if(emp)base+=emp.income*count})
    let mult=OFFICES[officeIdx].multiplier
    Object.entries(tools).forEach(([id,owned])=>{if(owned){const t=TOOLS.find(t=>t.id===id);if(t)mult*=t.multiplier}})
    Object.entries(equipment).forEach(([id,owned])=>{if(owned){const e=EQUIPMENT.find(e=>e.id===id);if(e)mult*=e.multiplier}})
    if(boost)mult*=2
    return base*mult*(prestigeLevel+1)
  },[employees,officeIdx,tools,equipment,boost,prestigeLevel])

  const totalEmps=Object.values(employees).reduce((a,b)=>a+b,0)

  useEffect(()=>{
    const interval=setInterval(()=>{
      const now=Date.now(),delta=(now-lastTickRef.current)/1000
      lastTickRef.current=now
      const inc=getIncome()*delta
      if(inc>0){setCash(c=>c+inc);setTotalEarned(t=>t+inc);setCompanyValue(v=>v+inc*0.5);setDailyEarned(e=>e+inc)}
      setBoostTimer(t=>Math.max(0,t-1));setShipCooldown(t=>Math.max(0,t-1))
      setFlashTimer(t=>{if(t<=1){setFlashSale(false);return 0}return t-1})
      setLiveEventTimer(t=>Math.max(0,t-1));setWelcomeTimer(t=>Math.max(0,t-1))
    },1000)
    return()=>clearInterval(interval)
  },[getIncome])

  useEffect(()=>{if(boostTimer===0)setBoost(false)},[boostTimer])
  useEffect(()=>{companyValueRef.current=companyValue},[companyValue])

  useEffect(()=>{
    const iv=setInterval(()=>{
      if(Math.random()<0.04&&!event){
        const raw=RANDOM_EVENTS[Math.floor(Math.random()*RANDOM_EVENTS.length)]
        const val=Math.max(raw.base,Math.floor(companyValueRef.current*raw.pct))
        setEvent({msg:raw.msgFn(val),type:raw.type,val})
      }
      if(Math.random()<0.015&&!flashSale){setFlashSale(true);setFlashTimer(120)}
    },5000)
    return()=>clearInterval(iv)
  },[event,flashSale])

  useEffect(()=>{
    setMilestones(prev=>prev.map(ms=>{
      if(ms.done)return ms
      const def=MILESTONES.find(m=>m.id===ms.id)!
      const met=(def.type==='earned'&&totalEarned>=def.goal)||(def.type==='emp'&&totalEmps>=def.goal)
      if(met){setMilestonePopup(def.label);setTimeout(()=>setMilestonePopup(null),3000)}
      return met?{...ms,done:true}:ms
    }))
  },[totalEarned,totalEmps])

  useEffect(()=>{
    setLiveEvent(prev=>{
      if(prev.claimed)return prev
      const def=LIVE_EVENTS.find(e=>e.id===prev.id)!
      const progress=def.goalType==='ships'?totalShips:def.goalType==='hires'?totalHires:totalEarned
      return{...prev,progress}
    })
  },[totalShips,totalHires,totalEarned])

  useEffect(()=>{
    if(particles.length===0)return
    rAFRef.current=requestAnimationFrame(()=>{
      setParticles(prev=>prev
        .map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+0.38,life:p.life-0.033}))
        .filter(p=>p.life>0)
      )
    })
    return()=>cancelAnimationFrame(rAFRef.current)
  },[particles])

  const spawnBurst=(rect:DOMRect)=>{
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2
    const SYMS=['💰','$','💵','🪙','💲','$','$','💸']
    setParticles(prev=>[...prev,...Array.from({length:16},(_,i)=>{
      const angle=(i/16)*Math.PI*2-Math.PI/2+(Math.random()-0.5)*0.9
      const speed=3.5+Math.random()*6
      return{id:Date.now()+i,x:cx,y:cy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,life:1,sym:SYMS[Math.floor(Math.random()*SYMS.length)]}
    })])
  }

  useEffect(()=>{
    displayCashRef.current=cash
    const iv=setInterval(()=>{
      setDisplayCash(c=>{
        const diff=displayCashRef.current-c
        return Math.abs(diff)<0.5?displayCashRef.current:c+diff*0.18
      })
    },33)
    return()=>clearInterval(iv)
  },[cash])

  useEffect(()=>{
    const today=new Date().toDateString()
    if(missionDate!==today){
      const picked=pickDailyMissions(today)
      setDailyMissions(picked.map(m=>({...m,progress:0,claimed:false})))
      setMissionDate(today)
      setDailyShips(0);setDailyHires(0);setDailyEarned(0);setDailyClicks(0);setDailySpent(0)
    }
  },[missionDate])

  useEffect(()=>{
    setDailyMissions(prev=>prev.map(m=>{
      if(m.claimed)return m
      const vals:Record<string,number>={ships:dailyShips,earned:dailyEarned,hires:dailyHires,clicks:dailyClicks,spend:dailySpent}
      return{...m,progress:Math.min(vals[m.type]??0,m.goal)}
    }))
  },[dailyShips,dailyEarned,dailyHires,dailyClicks,dailySpent])

  const addFloat=(val:string)=>{
    const id=Date.now()+Math.random()
    setFloats(f=>[...f,{id,x:60+Math.random()*260,y:100+Math.random()*50,val}])
    setTimeout(()=>setFloats(f=>f.filter(fl=>fl.id!==id)),1500)
  }

  const work=(e:React.MouseEvent<HTMLButtonElement>)=>{
    if(!musicStartedRef.current){startMusic();musicStartedRef.current=true}
    const bonus=10+Math.floor(totalEmps*2);setCash(c=>c+bonus);setTotalEarned(t=>t+bonus);addFloat(`+${fmt(bonus)}`)
    spawnBurst(e.currentTarget.getBoundingClientRect())
    setDailyClicks(c=>c+1)
    playSfx('coin')
  }

  const ship=()=>{
    if(shipCooldown>0)return
    const bonus=Math.max(500,getIncome()*30)
    setCash(c=>c+bonus);setTotalEarned(t=>t+bonus)
    setShipCooldown(30);setTotalShips(s=>s+1);addFloat(`🚀 +${fmt(bonus)}`)
    setShaking(true);setTimeout(()=>setShaking(false),600)
    setDailyShips(s=>s+1)
  }

  const buyEmployee=(emp:typeof EMPLOYEES[0])=>{
    const count=employees[emp.id]||0,cost=empCost(emp.cost,count)
    if(cash<cost)return
    setCash(c=>c-cost);setEmployees(e=>({...e,[emp.id]:count+1}));setTotalHires(h=>h+1);addFloat(`+${emp.emoji}`)
    setDailyHires(h=>h+1)
  }

  const buyTool=(tool:typeof TOOLS[0])=>{
    if(tools[tool.id]||cash<tool.cost)return
    setCash(c=>c-tool.cost);setTools(t=>({...t,[tool.id]:true}));addFloat(`+${tool.emoji}`)
    setDailySpent(s=>s+tool.cost)
  }

  const buyEquipment=(eq:typeof EQUIPMENT[0])=>{
    if(equipment[eq.id]||cash<eq.cost)return
    setCash(c=>c-eq.cost);setEquipment(e=>({...e,[eq.id]:true}));addFloat(`+${eq.emoji}`)
    setDailySpent(s=>s+eq.cost)
  }

  const upgradeOffice=()=>{
    if(officeIdx>=OFFICES.length-1)return
    const next=OFFICES[officeIdx+1]
    if(cash<next.cost)return
    setCash(c=>c-next.cost);setOfficeIdx(i=>i+1);addFloat(`🏢 ${next.name}!`)
    setNewOfficeName(next.name)
    const cols=['#f59e0b','#4f46e5','#22c55e','#ec4899','#06b6d4','#a78bfa','#ff6b6b','#fff']
    setConfetti(Array.from({length:70},(_,i)=>({id:i,x:Math.random()*100,color:cols[i%cols.length],w:Math.round(6+Math.random()*10),h:Math.round(4+Math.random()*6),dur:+(1.5+Math.random()*1.5).toFixed(2),delay:+(Math.random()*1.2).toFixed(2)})))
    setLevelUpShow(true)
    setTimeout(()=>{setLevelUpShow(false);setConfetti([])},3800)
    setDailySpent(s=>s+next.cost)
  }

  const claimDailyMission=(id:string)=>{
    const m=dailyMissions.find(m=>m.id===id)
    if(!m||m.claimed||m.progress<m.goal)return
    setDailyMissions(prev=>prev.map(dm=>dm.id===id?{...dm,claimed:true}:dm))
    const cashAmt=m.rewardType==='cash'?Math.max(m.rewardVal,Math.floor(companyValue*(m.rewardPct||0))):0
    if(m.rewardType==='gems'){setGems(g=>g+m.rewardVal);addFloat(`+${m.rewardVal} 💎`)}
    if(m.rewardType==='cash'){setCash(c=>c+cashAmt);setTotalEarned(t=>t+cashAmt);addFloat(`+${fmt(cashAmt)}`)}
    playSfx('claim')
  }

  const claimStreakReward=()=>{
    const day=((loginStreak-1)%7)+1
    const r=STREAK_REWARDS[day-1]
    const cashAmt=r.cash>0?Math.max(r.cash,Math.floor(companyValue*r.cashPct)):0
    if(r.gems>0){setGems(g=>g+r.gems);addFloat(`+${r.gems} 💎`)}
    if(r.cash>0){setCash(c=>c+cashAmt);setTotalEarned(t=>t+cashAmt);addFloat(`+${fmt(cashAmt)}`)}
    setStreakClaimed(true);setShowStreakModal(false)
    playSfx('claim')
  }

  const claimMilestone=(id:string)=>{
    const def=MILESTONES.find(m=>m.id===id)!
    setMilestones(prev=>prev.map(ms=>ms.id===id?{...ms,claimed:true}:ms))
    if(def.rewardType==='gems'){setGems(g=>g+def.rewardVal);addFloat(`+${def.rewardVal} 💎`)}
    if(def.rewardType==='cash'){setCash(c=>c+def.rewardVal);addFloat(`+${fmt(def.rewardVal)}`)}
    playSfx('claim')
  }

  const claimLiveEvent=()=>{
    const def=LIVE_EVENTS.find(e=>e.id===liveEvent.id)!
    if(liveEvent.progress<def.goal||liveEvent.claimed)return
    setLiveEvent(prev=>({...prev,claimed:true}))
    if(def.rewardType==='gems'){setGems(g=>g+def.reward);addFloat(`+${def.reward} 💎`)}
    if(def.rewardType==='cash'){setCash(c=>c+def.reward);addFloat(`+${fmt(def.reward)}`)}
  }

  const watchAd=(type:string)=>{
    setAdWatching(type)
    setTimeout(()=>{
      setAdWatching(null)
      if(type==='boost'){setBoost(true);setBoostTimer(60);addFloat('⚡ 2x 60s!')}
      if(type==='gems'){setGems(g=>g+15);addFloat('+15 💎')}
      if(type==='cash'){const b=Math.max(1000,getIncome()*60,companyValue*0.01);setCash(c=>c+b);addFloat(`💰 +${fmt(b)}`)}
      if(type==='spin'){setSpunToday(false);addFloat('🎰 Free Spin!')}
    },2000)
  }

  const doSpin=()=>{
    if(spinning||spunToday)return
    setSpinning(true);setSpinResult(null)
    const idx=Math.floor(Math.random()*SPIN_REWARDS.length)
    setSpinAngle(a=>a+360*5+(idx/SPIN_REWARDS.length)*360)
    setTimeout(()=>{
      const r=SPIN_REWARDS[idx]
      const spinCashVal=r.type==='cash'?Math.max(r.base,Math.floor(companyValue*r.pct)):r.value
      const spinDisplay=r.type==='cash'?fmt(spinCashVal):r.label
      setSpinResult(spinDisplay)
      if(r.type==='cash'){setCash(c=>c+spinCashVal);addFloat(`🎰 +${fmt(spinCashVal)}`)}
      if(r.type==='gems'){setGems(g=>g+r.value);addFloat(`🎰 +${r.value} 💎`)}
      if(r.type==='boost'){setBoost(true);setBoostTimer(r.value);addFloat('🎰 2x Boost!')}
      setSpinning(false);setSpunToday(true);playSfx('claim')
    },3000)
  }

  const handleEvent=(accept:boolean)=>{
    if(!event)return
    if(accept){
      if(event.type==='good'){setCash(c=>c+event.val);setTotalEarned(t=>t+event.val);addFloat(`+${fmt(event.val)}`)}
      if(event.type==='bad'){setCash(c=>Math.max(0,c-event.val));addFloat(`-${fmt(event.val)}`)}
    }
    setEvent(null)
  }

  const spendGems=(cost:number,action:()=>void)=>{if(gems<cost)return;setGems(g=>g-cost);action()}

  const claimOffline=(doubled=false)=>{
    const amt=doubled?offlineEarned*2:offlineEarned
    setCash(c=>c+amt);setTotalEarned(t=>t+amt)
    if(doubled)setGems(g=>g+20)
    setShowOffline(false);addFloat(`💤 +${fmt(amt)}`)
  }

  const claimWelcome=()=>{
    setGems(g=>g+100);setCash(c=>c+1000);setWelcomeClaimed(true);setShowWelcome(false)
    try{localStorage.setItem('sg_visited','1')}catch(_){}
    addFloat('🎁 +100 💎 +$1,000!')
  }

  const playSfx=(type:'coin'|'claim'|'error')=>{
    if(!sfxEnabled)return
    if(!sfxCtxRef.current)sfxCtxRef.current=new AudioContext()
    const ctx=sfxCtxRef.current
    if(ctx.state==='suspended')ctx.resume()
    const g=ctx.createGain();g.connect(ctx.destination)
    if(type==='coin'){
      const o=ctx.createOscillator();o.type='sine';o.frequency.value=900
      o.connect(g);g.gain.setValueAtTime(0.18,ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.08)
      o.start();o.stop(ctx.currentTime+0.09)
    }else if(type==='claim'){
      [[523.25,0],[659.25,0.09]].forEach(([freq,delay])=>{
        const o2=ctx.createOscillator(),g2=ctx.createGain()
        o2.type='sine';o2.frequency.value=freq
        o2.connect(g2);g2.connect(ctx.destination)
        g2.gain.setValueAtTime(0.2,ctx.currentTime+delay)
        g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay+0.12)
        o2.start(ctx.currentTime+delay);o2.stop(ctx.currentTime+delay+0.13)
      })
    }else{
      const o=ctx.createOscillator();o.type='square';o.frequency.value=150
      o.connect(g);g.gain.setValueAtTime(0.12,ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1)
      o.start();o.stop(ctx.currentTime+0.11)
    }
  }

  const resetGame=()=>{
    try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem('sg_last_seen');localStorage.removeItem('sg_visited')}catch(_){}
    window.location.reload()
  }

  const doIPO=()=>{
    playSfx('claim')
    setPrestigeLevel(p=>p+1)
    const cols=['#ffd700','#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeaa7']
    setConfetti(Array.from({length:150},(_,i)=>({id:i,x:Math.random()*100,color:cols[i%cols.length],w:Math.round(6+Math.random()*10),h:Math.round(4+Math.random()*6),dur:+(2+Math.random()*2).toFixed(2),delay:+(Math.random()*2).toFixed(2)})))
    setIpoShow(true)
    setTimeout(()=>setConfetti([]),5000)
  }

  const dismissIPO=()=>{
    setIpoShow(false)
    setCash(0);setOfficeIdx(0);setEmployees({});setTools({});setEquipment({})
    setSpunToday(false);setMilestones(MILESTONES.map(m=>({id:m.id,done:false,claimed:false})));setTotalEarned(0);setCompanyValue(500)
    setLiveEvent({id:'e1',progress:0,claimed:false});setLiveEventTimer(48*3600);setTotalShips(0);setTotalHires(0)
    setMissionDate('');setDailyMissions([]);setDailyShips(0);setDailyHires(0)
    setDailyEarned(0);setDailyClicks(0);setDailySpent(0)
    setBoost(false);setBoostTimer(0);setFlashSale(false);setFlashTimer(0)
    setTab('hq')
  }

  const income=getIncome()
  const liveEventDef=LIVE_EVENTS.find(e=>e.id===liveEvent.id)!
  const liveEventPct=Math.min(100,(liveEvent.progress/liveEventDef.goal)*100)
  const liveHrs=Math.floor(liveEventTimer/3600),liveMins=Math.floor((liveEventTimer%3600)/60),liveSecs=liveEventTimer%60
  const allEntries=[...LEADERBOARD_BASE,{name:`${companyName} ⭐`,value:Math.floor(companyValue)}].sort((a,b)=>b.value-a.value).slice(0,8)
  const cycleDay=((loginStreak-1)%7)+1
  const _now=new Date(),_mid=new Date(_now);_mid.setHours(24,0,0,0)
  const mSecsLeft=Math.max(0,Math.floor((_mid.getTime()-_now.getTime())/1000))
  const mHH=Math.floor(mSecsLeft/3600),mMM=Math.floor((mSecsLeft%3600)/60),mSS=mSecsLeft%60
  const MISSION_ICONS:Record<string,string>={ships:'🚀',earned:'💰',hires:'👥',clicks:'🖱️',spend:'💸'}

  return (
    <div style={{background:'#0a0a14',minHeight:'100vh',color:'#fff',fontFamily:'sans-serif',maxWidth:480,margin:'0 auto',position:'relative',overflow:'hidden',animation:shaking?'shake 0.55s ease-in-out':'none'}}>

      {floats.map(f=>(
        <div key={f.id} style={{position:'fixed',top:f.y,left:f.x,color:'#22c55e',fontWeight:700,fontSize:13,pointerEvents:'none',zIndex:200,animation:'floatUp 1.5s ease-out forwards',whiteSpace:'nowrap'}}>{f.val}</div>
      ))}

      {particles.map(p=>(
        <div key={p.id} style={{position:'fixed',left:p.x,top:p.y,transform:'translate(-50%,-50%)',fontSize:Math.round(14+p.life*8),opacity:p.life,pointerEvents:'none',zIndex:250,color:p.sym==='$'||p.sym==='💲'?'#4ade80':'#fbbf24',fontWeight:900,textShadow:`0 0 ${Math.round(p.life*10)}px currentColor`,userSelect:'none'}}>{p.sym}</div>
      ))}

      {levelUpShow&&(
        <div onClick={()=>{setLevelUpShow(false);setConfetti([])}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,cursor:'pointer'}}>
          {confetti.map(c=>(
            <div key={c.id} style={{position:'fixed',top:'-30px',left:`${c.x}%`,width:c.w,height:c.h,background:c.color,borderRadius:2,animation:`confettiFall ${c.dur}s ${c.delay}s ease-in both`,pointerEvents:'none'}} />
          ))}
          <div style={{textAlign:'center',position:'relative',zIndex:501,animation:'levelUpPop 0.5s ease-out forwards'}}>
            <div style={{fontSize:64,marginBottom:8}}>🏢</div>
            <div style={{fontSize:28,fontWeight:900,color:'#fff',textShadow:'0 0 30px #7c3aed',marginBottom:6}}>OFFICE UPGRADED!</div>
            <div style={{fontSize:18,color:'#a78bfa',marginBottom:14}}>{newOfficeName}</div>
            <div style={{fontSize:11,color:'#555'}}>Tap anywhere to continue</div>
          </div>
        </div>
      )}

      {milestonePopup&&<div style={{position:'fixed',top:68,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(90deg,#22c55e,#16a34a)',color:'#fff',borderRadius:11,padding:'7px 16px',fontWeight:700,fontSize:12,zIndex:300,whiteSpace:'nowrap'}}>🎯 {milestonePopup}!</div>}
      {newTabBadge&&<div style={{position:'fixed',top:68,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(90deg,#4f46e5,#7c3aed)',color:'#fff',borderRadius:11,padding:'7px 16px',fontWeight:700,fontSize:12,zIndex:300,whiteSpace:'nowrap'}}>🔓 Unlocked: {newTabBadge.toUpperCase()}!</div>}
      {flashSale&&<div style={{background:'#7c3aed',padding:'5px 14px',textAlign:'center',fontSize:11,cursor:'pointer'}} onClick={()=>setTab('meta')}>⚡ FLASH SALE! 50% off Gems — {flashTimer}s →</div>}

      {showWelcome&&!welcomeClaimed&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400}}>
          <div style={{background:'linear-gradient(135deg,#1a0a2e,#0a0a1e)',border:'2px solid #7c3aed',borderRadius:18,padding:26,maxWidth:290,textAlign:'center'}}>
            <div style={{fontSize:42,marginBottom:7}}>🎁</div>
            <div style={{fontSize:19,fontWeight:700,marginBottom:3}}>Welcome Gift!</div>
            <div style={{fontSize:11,color:'#888',marginBottom:13}}>Expires in {welcomeTimer}s</div>
            <div style={{background:'#1a1a2e',borderRadius:10,padding:13,marginBottom:13}}>
              <div style={{fontSize:14,marginBottom:3}}>💎 100 Gems + 💰 $1,000</div>
              <div style={{fontSize:12,color:'#f59e0b'}}>+ Founder Badge</div>
            </div>
            <button onClick={claimWelcome} style={{width:'100%',padding:12,background:'linear-gradient(90deg,#7c3aed,#4f46e5)',color:'#fff',border:'none',borderRadius:11,cursor:'pointer',fontWeight:700,fontSize:15,marginBottom:7}}>Claim FREE</button>
            <button onClick={()=>{setShowWelcome(false);try{localStorage.setItem('sg_visited','1')}catch(_){}}} style={{background:'none',border:'none',color:'#444',fontSize:11,cursor:'pointer'}}>No thanks</button>
          </div>
        </div>
      )}

      {showOffline&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400}}>
          <div style={{background:'#1a1a2e',border:'1px solid #22c55e',borderRadius:18,padding:26,maxWidth:290,textAlign:'center'}}>
            <div style={{fontSize:42,marginBottom:7}}>💤</div>
            <div style={{fontSize:17,fontWeight:700,marginBottom:3}}>While you were away…</div>
            <div style={{fontSize:11,color:'#888',marginBottom:13}}>Your team kept grinding!</div>
            <div style={{fontSize:28,fontWeight:700,color:'#22c55e',marginBottom:13}}>{fmt(offlineEarned)}</div>
            <button onClick={()=>claimOffline(false)} style={{width:'100%',padding:12,background:'linear-gradient(90deg,#22c55e,#16a34a)',color:'#fff',border:'none',borderRadius:11,cursor:'pointer',fontWeight:700,fontSize:14,marginBottom:7}}>Collect!</button>
            <button onClick={()=>claimOffline(true)} style={{width:'100%',padding:10,background:'#1a1a2e',border:'1px solid #7c3aed',color:'#a78bfa',borderRadius:11,cursor:'pointer',fontSize:11}}>📺 Watch Ad — Double + 20 💎</button>
          </div>
        </div>
      )}

      {event&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300}}>
          <div style={{background:'#1a1a2e',border:`1px solid ${event.type==='good'?'#22c55e':'#ef4444'}`,borderRadius:14,padding:22,maxWidth:290,textAlign:'center'}}>
            <div style={{fontSize:28,marginBottom:10}}>{event.type==='good'?'🎉':'⚠️'}</div>
            <div style={{fontSize:14,marginBottom:17}}>{event.msg}</div>
            <div style={{display:'flex',gap:9,justifyContent:'center'}}>
              <button onClick={()=>handleEvent(true)} style={{background:event.type==='good'?'#22c55e':'#ef4444',color:'#fff',border:'none',borderRadius:7,padding:'8px 16px',cursor:'pointer',fontWeight:700}}>{event.type==='good'?'Claim!':'Pay Up'}</button>
              {event.type==='bad'&&<button onClick={()=>handleEvent(false)} style={{background:'#333',color:'#fff',border:'none',borderRadius:7,padding:'8px 16px',cursor:'pointer'}}>Ignore</button>}
            </div>
          </div>
        </div>
      )}

      {adWatching&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.94)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:50,marginBottom:13}}>📺</div>
            <div style={{fontSize:16,color:'#fff',marginBottom:5}}>Watching ad…</div>
            <div style={{fontSize:12,color:'#888'}}>Reward incoming!</div>
          </div>
        </div>
      )}

      {showStreakModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:450}}>
          <div style={{background:'linear-gradient(135deg,#1a0a2e,#0a0a1e)',border:'2px solid #f59e0b',borderRadius:18,padding:26,maxWidth:290,textAlign:'center',animation:'levelUpPop 0.5s ease-out forwards'}}>
            <div style={{fontSize:52,marginBottom:7}}>{cycleDay===7?'👑':'🔥'}</div>
            <div style={{fontSize:14,color:'#f59e0b',fontWeight:700,marginBottom:2}}>DAY {loginStreak} LOGIN STREAK!</div>
            <div style={{fontSize:10,color:'#888',marginBottom:14}}>{cycleDay===7?'Full cycle complete — mega reward!':'Day '+cycleDay+' of 7'}</div>
            <div style={{background:'#1a1a2e',borderRadius:10,padding:13,marginBottom:14}}>
              <div style={{fontSize:20,fontWeight:700,color:'#fff'}}>{streakRewardLabel(STREAK_REWARDS[cycleDay-1],companyValue)}</div>
            </div>
            <button onClick={claimStreakReward} style={{width:'100%',padding:12,background:'linear-gradient(90deg,#f59e0b,#d97706)',color:'#fff',border:'none',borderRadius:11,cursor:'pointer',fontWeight:700,fontSize:15,marginBottom:7}}>CLAIM REWARD</button>
            <button onClick={()=>setShowStreakModal(false)} style={{background:'none',border:'none',color:'#555',fontSize:11,cursor:'pointer'}}>Claim later</button>
          </div>
        </div>
      )}

      {ipoShow&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:600,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
          {confetti.map(c=>(
            <div key={c.id} style={{position:'fixed',top:'-30px',left:`${c.x}%`,width:c.w,height:c.h,background:c.color,borderRadius:2,animation:`confettiFall ${c.dur}s ${c.delay}s ease-in both`,pointerEvents:'none'}} />
          ))}
          <div style={{fontSize:64,marginBottom:8}}>🚀</div>
          <div style={{fontSize:28,fontWeight:800,color:'#ffd700',textAlign:'center',marginBottom:8}}>YOU WENT PUBLIC!</div>
          <div style={{fontSize:15,color:'#aaa',textAlign:'center',marginBottom:4}}>IPO #{prestigeLevel} complete</div>
          <div style={{fontSize:18,color:'#22c55e',fontWeight:700,marginBottom:24}}>{prestigeLevel+1}x Permanent Income Multiplier!</div>
          <div style={{background:'#1a1a2e',border:'1px solid #ffd700',borderRadius:12,padding:'12px 24px',marginBottom:24,textAlign:'center'}}>
            <div style={{fontSize:12,color:'#888',marginBottom:4}}>All gameplay progress reset</div>
            <div style={{fontSize:12,color:'#22c55e'}}>Gems, streak &amp; settings preserved</div>
          </div>
          <button onClick={dismissIPO} style={{background:'linear-gradient(135deg,#ffd700,#ff8c00)',color:'#000',border:'none',borderRadius:12,padding:'14px 32px',fontSize:16,fontWeight:700,cursor:'pointer'}}>
            Start Over — {prestigeLevel+1}x Active!
          </button>
        </div>
      )}

      {/* HEADER */}
      <div style={{padding:'11px 13px 7px',background:'#0d0d1e',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
          <div style={{fontSize:16,fontWeight:700,color:'#818cf8'}}>⚡ SILICON GRIND</div>
          <div style={{display:'flex',gap:7,alignItems:'center'}}>
            {loginStreak>1&&<div style={{background:'#f59e0b22',border:'1px solid #f59e0b',borderRadius:14,padding:'2px 7px',fontSize:10,color:'#f59e0b'}}>🔥 Day {loginStreak}</div>}
            {prestigeLevel>0&&<div style={{background:'linear-gradient(135deg,#ffd700,#ff8c00)',borderRadius:14,padding:'2px 7px',fontSize:10,color:'#000',fontWeight:700}}>🚀 P{prestigeLevel}·{prestigeLevel+1}x</div>}
            {companyValue>=IPO_THRESHOLD&&<div style={{background:'#ffd700',borderRadius:14,padding:'2px 7px',fontSize:10,color:'#000',fontWeight:700,animation:'blink 1s infinite'}}>⚡ IPO!</div>}
            <button onClick={toggleMusic} title={musicPlaying?'Mute music':'Play music'} style={{background:'#1a1a2e',border:'none',borderRadius:18,padding:'3px 9px',fontSize:14,cursor:'pointer',color:musicPlaying?'#818cf8':'#444',lineHeight:1}}>{musicPlaying?'🎵':'🔇'}</button>
            <div style={{background:'#1a1a2e',borderRadius:18,padding:'3px 9px',fontSize:11,color:'#a78bfa'}}>💎 {gems}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:5}}>
          {[{label:'Cash',value:fmt(displayCash),color:'#22c55e'},{label:'Income/s',value:fmt(income),color:'#60a5fa'},{label:'Value',value:fmt(companyValue),color:'#a78bfa'},{label:'Team',value:`${totalEmps}👥`,color:'#f59e0b'}].map(s=>(
            <div key={s.label} style={{background:'#1a1a2e',borderRadius:7,padding:'4px 2px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'#555',marginBottom:1}}>{s.label}</div>
              <div style={{fontSize:10,fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>
        {boost&&<div style={{marginTop:4,background:'#f59e0b22',border:'1px solid #f59e0b',borderRadius:6,padding:'2px 7px',fontSize:9,color:'#f59e0b',textAlign:'center'}}>⚡ 2x BOOST — {boostTimer}s</div>}
        <div style={{marginTop:5,background:'#1a1a2e',borderRadius:7,padding:'4px 7px',display:'flex',alignItems:'center',gap:5,cursor:'pointer'}} onClick={()=>setTab('ship')}>
          <div style={{fontSize:13}}>{liveEventDef.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:700,color:'#f59e0b'}}>{liveEventDef.name}</div>
            <div style={{background:'#333',borderRadius:3,height:3,marginTop:1}}>
              <div style={{background:'#f59e0b',height:3,borderRadius:3,width:`${liveEventPct}%`,transition:'width 0.5s'}} />
            </div>
          </div>
          <div style={{fontSize:8,color:'#555',whiteSpace:'nowrap'}}>{liveHrs}h {liveMins}m {liveSecs}s</div>
        </div>
      </div>

      {/* ticker */}
      <div style={{background:'#0d0d1e',borderTop:'1px solid #1a1a2e',padding:'2px 0',overflow:'hidden'}}>
        <div style={{whiteSpace:'nowrap',animation:'ticker 18s linear infinite',display:'inline-block',fontSize:9,color:'#4ade80'}}>
          &nbsp;&nbsp;{companyName} {fmt(companyValue)} ▲ • {fmt(income)}/s • {totalEmps} staff • {OFFICES[officeIdx].name} • 💎 {gems}&nbsp;&nbsp;{companyName} {fmt(companyValue)} ▲ • {fmt(income)}/s • {totalEmps} staff • {OFFICES[officeIdx].name} • 💎 {gems}&nbsp;&nbsp;
        </div>
      </div>

      {/* TAB CONTENT */}
      <div key={tab} style={{padding:11,paddingBottom:86,overflowY:'auto',maxHeight:'calc(100vh - 200px)',animation:'fadeSlideIn 0.22s ease-out'}}>

        {tab==='hq'&&(
          <div>
            {companyValue>=1e8&&companyValue<IPO_THRESHOLD&&(
              <div style={{background:'#1a1a2e',borderRadius:12,padding:'12px 16px',marginBottom:12,border:'1px solid #ffd700'}}>
                <div style={{fontSize:12,color:'#ffd700',marginBottom:6}}>🚀 IPO Progress — {fmt(companyValue)} / $1B</div>
                <div style={{background:'#0d0d1a',borderRadius:6,height:8,overflow:'hidden'}}>
                  <div style={{background:'linear-gradient(90deg,#ffd700,#ff8c00)',height:'100%',width:`${Math.min(100,(companyValue/IPO_THRESHOLD)*100).toFixed(1)}%`,transition:'width 0.5s'}}/>
                </div>
              </div>
            )}
            {companyValue>=IPO_THRESHOLD&&!ipoShow&&(
              <div style={{background:'linear-gradient(135deg,#1a1400,#2a2000)',border:'2px solid #ffd700',borderRadius:16,padding:20,marginBottom:16,textAlign:'center',animation:'levelUpPop 0.4s ease'}}>
                <div style={{fontSize:28,marginBottom:8}}>🏆</div>
                <div style={{fontSize:18,fontWeight:700,color:'#ffd700',marginBottom:4}}>Company Value: {fmt(companyValue)}</div>
                <div style={{fontSize:13,color:'#aaa',marginBottom:16}}>You&apos;ve reached $1 Billion! Time to go public.</div>
                <button onClick={doIPO} style={{background:'linear-gradient(135deg,#ffd700,#ff8c00)',color:'#000',border:'none',borderRadius:12,padding:'14px 32px',fontSize:16,fontWeight:700,cursor:'pointer'}}>🚀 Go Public — IPO!</button>
              </div>
            )}
            <BuildingView
              officeIdx={officeIdx} totalEarned={totalEarned} getIncome={getIncome}
              employees={employees} equipment={equipment} cash={cash}
              setCash={setCash} setTotalEarned={setTotalEarned} addFloat={addFloat}
              ship={ship} shipCooldown={shipCooldown} watchAd={watchAd}
              milestones={milestones} claimMilestone={claimMilestone} upgradeOffice={upgradeOffice}
            />

            {/* Login Streak */}
            <div style={{marginTop:10,background:'#1a1a2e',borderRadius:13,padding:13}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
                <div style={{fontSize:11,fontWeight:700,color:'#f59e0b'}}>🔥 LOGIN STREAK — Day {loginStreak}</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:9}}>
                {STREAK_REWARDS.map((r,i)=>{
                  const d=i+1,isToday=d===cycleDay,isDone=d<cycleDay
                  return(
                    <div key={d} style={{textAlign:'center',background:isDone?'#0f2818':isToday?'#1a0a2e':'#111',border:`1px solid ${isDone?'#22c55e':isToday?'#f59e0b':'#2a2a2a'}`,borderRadius:6,padding:'5px 2px',animation:isToday&&!streakClaimed?'streakPulse 1.5s ease-in-out infinite':'none'}}>
                      <div style={{fontSize:8,color:isDone?'#22c55e':isToday?'#f59e0b':'#333',fontWeight:700}}>D{d}{d===7?'👑':''}</div>
                      <div style={{fontSize:13,lineHeight:1.3}}>{isDone?'✓':isToday?'▶':'○'}</div>
                    </div>
                  )
                })}
              </div>
              {!streakClaimed
                ? <button onClick={()=>setShowStreakModal(true)} style={{width:'100%',padding:9,background:'linear-gradient(90deg,#f59e0b,#d97706)',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:11}}>🎁 CLAIM DAY {cycleDay} REWARD — {streakRewardLabel(STREAK_REWARDS[cycleDay-1],companyValue)}</button>
                : <div style={{textAlign:'center',fontSize:11,color:'#22c55e',padding:4}}>✓ Today&apos;s reward claimed!</div>
              }
            </div>

            {/* Daily Missions */}
            <div style={{marginTop:8,background:'#1a1a2e',borderRadius:13,padding:13}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
                <div style={{fontSize:11,fontWeight:700,color:'#818cf8'}}>📋 DAILY MISSIONS</div>
                <div style={{fontSize:9,color:'#555'}}>resets {mHH}h {mMM}m {mSS}s</div>
              </div>
              {dailyMissions.map(m=>{
                const pct=Math.min(100,(m.progress/m.goal)*100)
                const done=m.progress>=m.goal
                return(
                  <div key={m.id} style={{background:'#111',borderRadius:9,padding:'9px 11px',marginBottom:6,border:`1px solid ${m.claimed?'#22c55e44':done?'#4f46e555':'#1a1a2e'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <div style={{fontSize:11}}>{MISSION_ICONS[m.type]} {m.label}</div>
                      {m.claimed
                        ? <span style={{fontSize:11,color:'#22c55e',fontWeight:700}}>✓</span>
                        : <button onClick={()=>claimDailyMission(m.id)} disabled={!done} style={{background:done?'linear-gradient(90deg,#4f46e5,#7c3aed)':'#1e1e3e',color:done?'#fff':'#444',border:'none',borderRadius:5,padding:'3px 9px',cursor:done?'pointer':'default',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                            {m.rewardType==='gems'?`${m.rewardVal} 💎`:fmt(Math.max(m.rewardVal,Math.floor(companyValue*(m.rewardPct||0))))}
                          </button>
                      }
                    </div>
                    <div style={{background:'#222',borderRadius:3,height:4}}>
                      <div style={{background:m.claimed?'#22c55e':done?'#4f46e5':'#f59e0b',height:4,borderRadius:3,width:`${pct}%`,transition:'width 0.4s'}} />
                    </div>
                    <div style={{fontSize:9,color:'#555',marginTop:3}}>
                      {m.type==='earned'||m.type==='spend'
                        ? `${fmt(Math.min(m.progress,m.goal))} / ${fmt(m.goal)}`
                        : `${Math.min(m.progress,m.goal)} / ${m.goal}`
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab==='team'&&(
          <div>
            <div style={{fontSize:10,color:'#666',marginBottom:9}}>HIRE TEAM MEMBERS</div>
            {EMPLOYEES.map(emp=>{
              const count=employees[emp.id]||0,cost=empCost(emp.cost,count)
              return(
                <div key={emp.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#1a1a2e',border:'1px solid #2a2a2a',borderRadius:11,padding:'10px 12px',marginBottom:6}}>
                  <div>
                    <div style={{fontSize:13}}>{emp.emoji} <strong>{emp.name}</strong> {count>0&&<span style={{background:emp.color,borderRadius:9,padding:'1px 6px',fontSize:9}}>×{count}</span>}</div>
                    <div style={{fontSize:9,color:'#555'}}>{fmt(emp.income*OFFICES[officeIdx].multiplier)}/s each</div>
                  </div>
                  <button onClick={()=>buyEmployee(emp)} disabled={cash<cost} style={{background:cash>=cost?`linear-gradient(90deg,${emp.color},${emp.color}88)`:'#1e1e3e',color:cash>=cost?'#fff':'#444',border:'none',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:700}}>
                    {fmt(cost)}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {tab==='grow'&&(
          <div>
            <div style={{fontSize:10,color:'#666',marginBottom:9}}>TOOLS & SOFTWARE</div>
            {TOOLS.map(tool=>(
              <div key={tool.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:tools[tool.id]?'#0f2818':'#1a1a2e',border:`1px solid ${tools[tool.id]?'#22c55e':'#2a2a2a'}`,borderRadius:11,padding:'10px 12px',marginBottom:6}}>
                <div>
                  <div style={{fontSize:13}}>{tool.emoji} <strong>{tool.name}</strong></div>
                  <div style={{fontSize:9,color:'#555'}}>{tool.multiplier}x multiplier</div>
                </div>
                <button onClick={()=>buyTool(tool)} disabled={tools[tool.id]||cash<tool.cost} style={{background:tools[tool.id]?'#1e3a2e':cash>=tool.cost?'#4f46e5':'#1e1e3e',color:tools[tool.id]?'#22c55e':'#fff',border:'none',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:700}}>
                  {tools[tool.id]?'✓':fmt(tool.cost)}
                </button>
              </div>
            ))}
            <div style={{fontSize:10,color:'#666',margin:'12px 0 9px'}}>EQUIPMENT</div>
            {EQUIPMENT.map(eq=>(
              <div key={eq.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:equipment[eq.id]?'#0f2818':'#1a1a2e',border:`1px solid ${equipment[eq.id]?'#22c55e':'#2a2a2a'}`,borderRadius:11,padding:'10px 12px',marginBottom:6}}>
                <div>
                  <div style={{fontSize:13}}>{eq.emoji} <strong>{eq.name}</strong></div>
                  <div style={{fontSize:9,color:'#555'}}>{eq.multiplier}x multiplier</div>
                </div>
                <button onClick={()=>buyEquipment(eq)} disabled={equipment[eq.id]||cash<eq.cost} style={{background:equipment[eq.id]?'#1e3a2e':cash>=eq.cost?'#4f46e5':'#1e1e3e',color:equipment[eq.id]?'#22c55e':'#fff',border:'none',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:700}}>
                  {equipment[eq.id]?'✓':fmt(eq.cost)}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab==='ship'&&(
          <div>
            <div style={{background:'#1a1a2e',border:'1px solid #f59e0b',borderRadius:13,padding:13,marginBottom:11}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <div style={{fontSize:14,fontWeight:700}}>{liveEventDef.emoji} {liveEventDef.name}</div>
                <div style={{fontSize:9,color:'#f59e0b'}}>{liveHrs}h {liveMins}m left</div>
              </div>
              <div style={{fontSize:10,color:'#777',marginBottom:6}}>{liveEventDef.desc}</div>
              <div style={{background:'#333',borderRadius:4,height:6,marginBottom:5}}>
                <div style={{background:'#f59e0b',height:6,borderRadius:4,width:`${liveEventPct}%`,transition:'width 0.5s'}} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:9,color:'#555'}}>{Math.min(liveEvent.progress,liveEventDef.goal)} / {liveEventDef.goal}</div>
                <button onClick={claimLiveEvent} disabled={liveEvent.progress<liveEventDef.goal||liveEvent.claimed} style={{background:liveEvent.progress>=liveEventDef.goal&&!liveEvent.claimed?'#f59e0b':'#1e1e3e',color:liveEvent.progress>=liveEventDef.goal&&!liveEvent.claimed?'#000':'#444',border:'none',borderRadius:6,padding:'4px 11px',cursor:'pointer',fontSize:10,fontWeight:700}}>
                  {liveEvent.claimed?'✓ Claimed':`Claim ${rewardLabel(liveEventDef)}`}
                </button>
              </div>
            </div>

            <div style={{background:'#1a1a2e',borderRadius:13,padding:17,marginBottom:11,textAlign:'center'}}>
              <div style={{fontSize:11,color:'#666',marginBottom:9}}>LUCKY SPIN — Once daily</div>
              <div style={{position:'relative',width:185,height:185,margin:'0 auto 11px'}}>
                <div style={{width:185,height:185,borderRadius:'50%',border:'4px solid #4f46e5',position:'relative',overflow:'hidden',transition:spinning?'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)':'none',transform:`rotate(${spinAngle}deg)`,background:'#111'}}>
                  {SPIN_REWARDS.map((r,i)=>(
                    <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:'48%',height:2,background:r.color,transformOrigin:'0 50%',transform:`rotate(${(i/SPIN_REWARDS.length)*360}deg) translateY(-50%)`}}>
                      <span style={{position:'absolute',right:-40,top:-7,fontSize:8,color:'#fff',whiteSpace:'nowrap'}}>{r.type==='cash'?fmt(Math.max(r.base,Math.floor(companyValue*r.pct))):r.label}</span>
                    </div>
                  ))}
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:25}}>🎰</div>
                </div>
                <div style={{position:'absolute',top:-7,left:'50%',transform:'translateX(-50%)',fontSize:19}}>▼</div>
              </div>
              {spinResult&&<div style={{fontSize:16,fontWeight:700,color:'#22c55e',marginBottom:7}}>🎉 {spinResult}!</div>}
              <button onClick={doSpin} disabled={spinning||spunToday} style={{background:spinning||spunToday?'#1e1e3e':'linear-gradient(90deg,#f59e0b,#d97706)',color:spinning||spunToday?'#444':'#fff',border:'none',borderRadius:10,padding:'10px 30px',cursor:'pointer',fontWeight:700,fontSize:13,marginBottom:6}}>
                {spinning?'Spinning…':spunToday?'Come back tomorrow!':'🎰 FREE SPIN'}
              </button>
              {spunToday&&<button onClick={()=>watchAd('spin')} style={{display:'block',width:'100%',background:'#1a1a2e',border:'1px solid #4f46e5',color:'#818cf8',borderRadius:8,padding:8,cursor:'pointer',fontSize:11}}>📺 Watch Ad for Extra Spin</button>}
            </div>

            <div style={{background:'#1a1a2e',border:'1px solid #f59e0b',borderRadius:13,padding:13,textAlign:'center'}}>
              <div style={{fontSize:11,color:'#666',marginBottom:7}}>INVESTOR MEETING — Tap fast!</div>
              <InvestorMeeting setCash={setCash} setTotalEarned={setTotalEarned} addFloat={addFloat} companyValue={companyValue} />
            </div>
          </div>
        )}

        {tab==='meta'&&(
          <div>
            <div style={{fontSize:10,color:'#666',marginBottom:9}}>GEM PACKS</div>
            {GEM_PACKS.map(pack=>(
              <div key={pack.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:flashSale?'#1a0f2e':'#1a1a2e',border:`1px solid ${flashSale?'#7c3aed':'#2a2a2a'}`,borderRadius:11,padding:'11px 12px',marginBottom:8}}>
                <div>
                  <div style={{fontSize:13}}>{pack.emoji} <strong>{pack.name}</strong></div>
                  <div style={{fontSize:9,color:'#a78bfa'}}>{pack.gems} gems{flashSale&&<span style={{color:'#f59e0b'}}> ⚡ 50% OFF</span>}</div>
                </div>
                <button onClick={()=>{setGems(g=>g+pack.gems);addFloat(`+${pack.gems} 💎`)}} style={{background:'linear-gradient(90deg,#7c3aed,#4f46e5)',color:'#fff',border:'none',borderRadius:7,padding:'8px 11px',cursor:'pointer',fontWeight:700,fontSize:11}}>
                  {flashSale?'50% OFF':`$${pack.price.toFixed(2)}`}
                </button>
              </div>
            ))}

            <div style={{fontSize:10,color:'#666',margin:'12px 0 9px'}}>VIP PASS</div>
            <div style={{background:'linear-gradient(135deg,#1a0a2e,#0a0a1e)',border:'1px solid #7c3aed',borderRadius:13,padding:13,textAlign:'center',marginBottom:12}}>
              <div style={{fontSize:24,marginBottom:5}}>👑</div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>VIP Pass</div>
              <div style={{fontSize:10,color:'#888',marginBottom:9}}>2x idle income • No ad waits • Exclusive features</div>
              <button style={{background:'linear-gradient(90deg,#7c3aed,#4f46e5)',color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:13}}>$2.99/month</button>
            </div>

            <div style={{fontSize:10,color:'#666',marginBottom:9}}>SPEND GEMS</div>
            {[
              {label:'☕ Coffee Boost', sub:'5min 2x income', cost:10, action:()=>{setBoost(true);setBoostTimer(300)}},
              {label:'⚡ Skip Cooldown',sub:'Reset ship timer',cost:15,action:()=>setShipCooldown(0)},
              {label:'🎨 Office Theme', sub:'Custom skin',     cost:25,action:()=>addFloat('🎨 Applied!')},
              {label:'🐕 Mascot',       sub:'Boost morale',   cost:50,action:()=>addFloat('🐕 Woof!')},
              {label:'🎰 Extra Spin',   sub:'Spin again',     cost:20,action:()=>setSpunToday(false)},
            ].map(item=>(
              <div key={item.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#1a1a2e',border:'1px solid #2a2a2a',borderRadius:11,padding:'10px 12px',marginBottom:6}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700}}>{item.label}</div>
                  <div style={{fontSize:9,color:'#555'}}>{item.sub}</div>
                </div>
                <button onClick={()=>spendGems(item.cost,item.action)} disabled={gems<item.cost} style={{background:gems>=item.cost?'linear-gradient(90deg,#7c3aed,#4f46e5)':'#1e1e3e',color:gems>=item.cost?'#fff':'#444',border:'none',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontWeight:700,fontSize:11}}>
                  💎 {item.cost}
                </button>
              </div>
            ))}

            <div style={{fontSize:10,color:'#666',margin:'12px 0 9px'}}>LEADERBOARD</div>
            {allEntries.map((entry,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:entry.name.includes('⭐')?'#0f1a2e':'#1a1a2e',border:`1px solid ${entry.name.includes('⭐')?'#4f46e5':'#2a2a2a'}`,borderRadius:9,padding:'8px 12px',marginBottom:4}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:i===0?'#f59e0b':i===1?'#aaa':i===2?'#cd7f32':'#444'}}>#{i+1}</div>
                  <div style={{fontSize:11}}>{entry.name}</div>
                </div>
                <div style={{fontSize:10,color:'#a78bfa',fontWeight:700}}>{fmt(entry.value)}</div>
              </div>
            ))}

            <div style={{fontSize:10,color:'#666',margin:'14px 0 9px'}}>🚀 IPO HALL OF FAME</div>
            {[...PRESTIGE_BOARD,...(prestigeLevel>0?[{name:`${companyName} ⭐`,ipos:prestigeLevel}]:[])]
              .sort((a,b)=>b.ipos-a.ipos)
              .map((e,i)=>{
                const isPlayer=e.name.includes('⭐')
                return(
                  <div key={e.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:isPlayer?'rgba(255,215,0,0.08)':'#1a1a2e',border:`1px solid ${isPlayer?'#ffd700':'#2a2a2a'}`,borderRadius:9,padding:'8px 12px',marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{fontSize:12,fontWeight:700,color:i===0?'#ffd700':i===1?'#aaa':i===2?'#cd7f32':'#444'}}>#{i+1}</div>
                      <div style={{fontSize:11,color:isPlayer?'#ffd700':'#fff'}}>{e.name}</div>
                    </div>
                    <div style={{fontSize:10,color:'#ffd700',fontWeight:700}}>{e.ipos} IPO{e.ipos!==1?'s':''}</div>
                  </div>
                )
              })}
            {prestigeLevel===0&&<div style={{fontSize:11,color:'#444',textAlign:'center',marginTop:4}}>Reach $1B to join the Hall of Fame</div>}
          </div>
        )}

        {tab==='settings'&&(
          <div>
            {/* AUDIO */}
            <div style={{background:'#1a1a2e',borderRadius:13,padding:13,marginBottom:8}}>
              <div style={{fontSize:10,color:'#666',marginBottom:9,fontWeight:700,letterSpacing:1}}>AUDIO</div>
              {[
                {label:'🎵 Music',      active:musicPlaying,  onToggle:toggleMusic},
                {label:'🔊 Sound FX',   active:sfxEnabled,    onToggle:()=>setSfxEnabled(v=>!v)},
              ].map(row=>(
                <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:12}}>{row.label}</div>
                  <div onClick={row.onToggle} style={{width:44,height:24,borderRadius:12,background:row.active?'#22c55e':'#2a2a3e',position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
                    <div style={{position:'absolute',top:3,left:row.active?21:3,width:18,height:18,borderRadius:'50%',background:row.active?'#fff':'#666',transition:'left 0.2s'}} />
                  </div>
                </div>
              ))}
            </div>

            {/* PROFILE */}
            <div style={{background:'#1a1a2e',borderRadius:13,padding:13,marginBottom:8}}>
              <div style={{fontSize:10,color:'#666',marginBottom:9,fontWeight:700,letterSpacing:1}}>PROFILE</div>
              <div style={{fontSize:11,color:'#888',marginBottom:6}}>🏢 Company Name</div>
              <div style={{display:'flex',gap:7}}>
                <input
                  value={companyNameInput}
                  onChange={e=>setCompanyNameInput(e.target.value)}
                  maxLength={20}
                  placeholder="Your Company"
                  style={{flex:1,background:'#111',border:'1px solid #2a2a3e',borderRadius:7,padding:'7px 10px',color:'#fff',fontSize:12,outline:'none'}}
                />
                <button onClick={()=>{const n=companyNameInput.trim()||'Your Company';setCompanyName(n);setCompanyNameInput(n);addFloat('✓ Name saved!')}} style={{background:'linear-gradient(90deg,#4f46e5,#7c3aed)',color:'#fff',border:'none',borderRadius:7,padding:'7px 14px',cursor:'pointer',fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>Save</button>
              </div>
            </div>

            {/* STATS */}
            <div style={{background:'#1a1a2e',borderRadius:13,padding:13,marginBottom:8}}>
              <div style={{fontSize:10,color:'#666',marginBottom:9,fontWeight:700,letterSpacing:1}}>STATS</div>
              {[
                {icon:'💰',label:'Total Earned',    value:fmt(totalEarned)},
                {icon:'👥',label:'Total Hired',      value:`${totalHires} employees`},
                {icon:'🚀',label:'Features Shipped', value:`${totalShips}`},
                {icon:'📅',label:'Days Played',      value:`${daysPlayed}`},
                {icon:'🔥',label:'Login Streak',     value:`Day ${loginStreak}`},
              ].map(s=>(
                <div key={s.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #2a2a2a',paddingBottom:7,marginBottom:7}}>
                  <div style={{fontSize:11,color:'#888'}}>{s.icon} {s.label}</div>
                  <div style={{fontSize:12,fontWeight:700,color:'#fff'}}>{s.value}</div>
                </div>
              ))}
              {prestigeLevel>0&&(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:7}}>
                  <div style={{fontSize:11,color:'#888'}}>🚀 IPO Count</div>
                  <div style={{fontSize:12,fontWeight:700,color:'#ffd700'}}>{prestigeLevel}x</div>
                </div>
              )}
            </div>

            {/* DANGER ZONE */}
            <div style={{background:'#1a0a0a',border:'1px solid #ef444444',borderRadius:13,padding:13,marginBottom:8}}>
              <div style={{fontSize:10,color:'#ef4444',marginBottom:9,fontWeight:700,letterSpacing:1}}>DANGER ZONE</div>
              {!showResetConfirm
                ? <button onClick={()=>setShowResetConfirm(true)} style={{width:'100%',padding:10,background:'#1e1010',border:'1px solid #ef4444',color:'#ef4444',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:12}}>🗑️ Reset All Progress</button>
                : <div>
                    <div style={{fontSize:11,color:'#888',marginBottom:10,textAlign:'center'}}>This will erase <strong style={{color:'#fff'}}>all data</strong> permanently. Are you sure?</div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>setShowResetConfirm(false)} style={{flex:1,padding:9,background:'#1a1a2e',border:'1px solid #2a2a2a',color:'#888',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:11}}>Cancel</button>
                      <button onClick={resetGame} style={{flex:1,padding:9,background:'#ef4444',border:'none',color:'#fff',borderRadius:9,cursor:'pointer',fontWeight:700,fontSize:11}}>Yes, Delete Everything</button>
                    </div>
                  </div>
              }
            </div>

            {/* CREDITS */}
            <div style={{background:'#1a1a2e',borderRadius:13,padding:13,textAlign:'center'}}>
              <div style={{fontSize:18,marginBottom:5}}>⚡</div>
              <div style={{fontSize:14,fontWeight:700,color:'#818cf8',marginBottom:3}}>Silicon Grind</div>
              <div style={{fontSize:10,color:'#555',marginBottom:2}}>v{GAME_VERSION}</div>
              <div style={{fontSize:9,color:'#333',marginBottom:2}}>Built with Next.js 16 &amp; Web Audio API</div>
              <div style={{fontSize:9,color:'#333'}}>© 2025 — All Rights Reserved</div>
            </div>
          </div>
        )}
      </div>

      {/* WORK button */}
      <div style={{position:'fixed',bottom:58,left:'50%',transform:'translateX(-50%)',zIndex:50}}>
        <button onClick={work} style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',border:'3px solid #818cf8',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',animation:'workPulse 2s ease-in-out infinite'}}>WORK</button>
      </div>

      {/* bottom nav */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'#0d0d1e',borderTop:'1px solid #1a1a2e',display:'flex',justifyContent:'space-around',padding:'4px 0',zIndex:50}}>
        {[{id:'hq',icon:'🏠',label:'HQ'},{id:'team',icon:'👥',label:'Team'},{id:'grow',icon:'📈',label:'Grow'},{id:'ship',icon:'🚀',label:'Ship'},{id:'meta',icon:'💎',label:'Store'},{id:'settings',icon:'⚙️',label:'Set'}].map(t=>{
          const locked=!unlockedTabs.includes(t.id)
          return(
            <button key={t.id} onClick={()=>!locked&&setTab(t.id)} style={{background:'none',border:'none',color:locked?'#222':tab===t.id?'#818cf8':'#444',cursor:locked?'default':'pointer',fontSize:9,display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'3px 7px',position:'relative'}}>
              <span style={{fontSize:18,filter:locked?'grayscale(1) opacity(0.15)':'none'}}>{t.icon}</span>
              {t.label}
              {locked&&<span style={{fontSize:7,color:'#2a2a2a'}}>🔒</span>}
              {newTabBadge===t.id&&<span style={{position:'absolute',top:0,right:2,width:6,height:6,background:'#ef4444',borderRadius:'50%'}} />}
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-52px)}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes shake{0%,100%{transform:translateX(0)}10%{transform:translateX(-8px) rotate(-1deg)}20%{transform:translateX(8px) rotate(1deg)}30%{transform:translateX(-6px)}50%{transform:translateX(6px)}70%{transform:translateX(-3px)}90%{transform:translateX(2px)}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes workPulse{0%,100%{box-shadow:0 0 16px #4f46e540}50%{box-shadow:0 0 36px #7c3aed,0 0 60px #4f46e555}}
        @keyframes shipPulse{0%,100%{box-shadow:0 0 8px #22c55e30}50%{box-shadow:0 0 26px #22c55e,0 0 46px #16a34a55}}
        @keyframes confettiFall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
        @keyframes levelUpPop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes streakPulse{0%,100%{box-shadow:0 0 6px #f59e0b40}50%{box-shadow:0 0 18px #f59e0b,0 0 30px #d97706aa}}
      `}</style>
    </div>
  )
}

function InvestorMeeting({setCash,setTotalEarned,addFloat,companyValue}:{
  setCash:(fn:(c:number)=>number)=>void
  setTotalEarned:(fn:(t:number)=>number)=>void
  addFloat:(val:string)=>void
  companyValue:number
}) {
  const [taps,setTaps]=useState(0),[active,setActive]=useState(false),[done,setDone]=useState(false),[timer,setTimer]=useState(0)
  const perTap=Math.max(50,Math.floor(companyValue*0.0005))
  const start=()=>{if(active||done)return;setActive(true);setTaps(0);setTimer(100)}
  useEffect(()=>{if(!active)return;const iv=setInterval(()=>setTimer(t=>{if(t<=1){setActive(false);setDone(true);return 0}return t-1}),100);return()=>clearInterval(iv)},[active])
  useEffect(()=>{
    if(!done)return
    const reward=taps*perTap;setCash(c=>c+reward);setTotalEarned(t=>t+reward)
    addFloat(`🤝 +${fmt(reward)}`)
    const t=setTimeout(()=>setDone(false),4000);return()=>clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[done])
  return(
    <div>
      {!active&&!done&&<button onClick={start} style={{background:'linear-gradient(90deg,#f59e0b,#d97706)',color:'#fff',border:'none',borderRadius:10,padding:'10px 26px',cursor:'pointer',fontWeight:700,fontSize:13}}>Start Meeting</button>}
      {active&&(
        <div>
          <div style={{fontSize:11,color:'#f59e0b',marginBottom:6}}>⏱ {(timer/10).toFixed(1)}s — Tap! {taps} taps ({fmt(taps*perTap)})</div>
          <div style={{background:'#333',borderRadius:4,height:6,marginBottom:9}}><div style={{background:'#f59e0b',height:6,borderRadius:4,width:`${timer}%`,transition:'width 0.1s'}}/></div>
          <button onClick={()=>setTaps(t=>t+1)} style={{width:82,height:82,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'3px solid #fbbf24',color:'#fff',fontSize:24,cursor:'pointer'}}>💼</button>
        </div>
      )}
      {done&&<div style={{fontSize:14,color:'#22c55e',fontWeight:700}}>🎉 {fmt(taps*perTap)} raised!</div>}
    </div>
  )
}