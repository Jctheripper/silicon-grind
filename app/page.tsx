'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────

const SAVE_KEY = 'sg_save'
const VISITED_KEY = 'sg_visited'
const OFFLINE_CAP = 10800 // 3 hours
const IPO_THRESHOLD = 1_000_000_000
const SHIP_COOLDOWN = 30
const BOOST_DURATION = 60
const BOOST_DURATION_SPIN = 300
const VERSION = '1.0.0'

function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K'
  return Math.floor(n).toString()
}

function fmtCash(n: number) { return '$' + fmt(n) }

function fmtTime(s: number) {
  if (s <= 0) return '0s'
  if (s < 60) return `${Math.ceil(s)}s`
  const m = Math.floor(s / 60), sec = Math.ceil(s % 60)
  return `${m}m${sec > 0 ? ` ${sec}s` : ''}`
}

function fmtProg(n: number, max: number) {
  const pct = Math.min(1, n / max) * 100
  return pct.toFixed(1) + '%'
}

const EMPLOYEES = [
  { id: 'dev',           name: 'Developer',       baseCost: 50,    income: 0.5,  emoji: '🧑‍💻' },
  { id: 'designer',      name: 'Designer',         baseCost: 120,   income: 1.2,  emoji: '🎨' },
  { id: 'marketer',      name: 'Marketer',         baseCost: 300,   income: 2.5,  emoji: '📣' },
  { id: 'sales',         name: 'Sales Rep',        baseCost: 600,   income: 5,    emoji: '💼' },
  { id: 'pm',            name: 'Product Manager',  baseCost: 1200,  income: 9,    emoji: '📋' },
  { id: 'datascientist', name: 'Data Scientist',   baseCost: 2500,  income: 18,   emoji: '📊' },
  { id: 'cto',           name: 'CTO',              baseCost: 8000,  income: 55,   emoji: '⚙️' },
  { id: 'ceo',           name: 'CEO',              baseCost: 25000, income: 150,  emoji: '👔' },
]

const OFFICES = [
  { id: 'garage',      name: 'Garage',           cost: 0,     mult: 1,   floors: 1,  accent: '#4ade80' },
  { id: 'small',       name: 'Small Office',     cost: 1200,  mult: 1.5, floors: 3,  accent: '#60a5fa' },
  { id: 'openplan',    name: 'Open Floor Plan',  cost: 8000,  mult: 2.5, floors: 6,  accent: '#fbbf24' },
  { id: 'skyscraper',  name: 'Skyscraper HQ',    cost: 50000, mult: 6,   floors: 10, accent: '#a78bfa' },
]

const TOOLS = [
  { id: 'github', name: 'GitHub',      cost: 200,   mult: 1.2, emoji: '🐙' },
  { id: 'slack',  name: 'Slack',       cost: 500,   mult: 1.3, emoji: '💬' },
  { id: 'aws',    name: 'AWS',         cost: 1500,  mult: 1.5, emoji: '☁️' },
  { id: 'figma',  name: 'Figma',       cost: 3000,  mult: 1.4, emoji: '✏️' },
  { id: 'ai',     name: 'AI Suite',    cost: 10000, mult: 2.0, emoji: '🤖' },
]

const EQUIPMENT = [
  { id: 'coffee',   name: 'Coffee Machine', cost: 150,  mult: 1.1, emoji: '☕' },
  { id: 'desks',    name: 'Standing Desks', cost: 400,  mult: 1.2, emoji: '🪑' },
  { id: 'servers',  name: 'Server Rack',    cost: 2000, mult: 1.4, emoji: '🖥️' },
  { id: 'pingpong', name: 'Ping Pong',      cost: 5000, mult: 1.3, emoji: '🏓' },
  { id: 'snackbar', name: 'Snack Bar',      cost: 8000, mult: 1.5, emoji: '🍕' },
]

const RESEARCH = [
  // dev branch
  { id:'r01', branch:'dev',   cost:5,   boost:0.05, name:'Code Review',       prev:null },
  { id:'r02', branch:'dev',   cost:15,  boost:0.08, name:'Pair Programming',  prev:'r01' },
  { id:'r03', branch:'dev',   cost:35,  boost:0.12, name:'TDD Mastery',       prev:'r02' },
  { id:'r04', branch:'dev',   cost:60,  boost:0.15, name:'Clean Architecture',prev:'r03' },
  { id:'r05', branch:'dev',   cost:100, boost:0.20, name:'DevOps Pipeline',   prev:'r04' },
  { id:'r16', branch:'dev',   cost:175, boost:0.28, name:'Open Source',       prev:'r05' },
  // infra branch
  { id:'r06', branch:'infra', cost:8,   boost:0.05, name:'Load Balancing',    prev:null },
  { id:'r07', branch:'infra', cost:20,  boost:0.10, name:'Auto Scaling',      prev:'r06' },
  { id:'r08', branch:'infra', cost:40,  boost:0.13, name:'CDN Mastery',       prev:'r07' },
  { id:'r09', branch:'infra', cost:80,  boost:0.16, name:'Zero Downtime',     prev:'r08' },
  { id:'r10', branch:'infra', cost:130, boost:0.22, name:'Multi-Region',      prev:'r09' },
  { id:'r17', branch:'infra', cost:175, boost:0.28, name:'Edge Computing',    prev:'r10' },
  // data branch
  { id:'r11', branch:'data',  cost:8,   boost:0.05, name:'Analytics',         prev:null },
  { id:'r12', branch:'data',  cost:18,  boost:0.08, name:'A/B Testing',       prev:'r11' },
  { id:'r13', branch:'data',  cost:35,  boost:0.10, name:'Data Warehouse',    prev:'r12' },
  { id:'r14', branch:'data',  cost:65,  boost:0.14, name:'ML Pipeline',       prev:'r13' },
  { id:'r15', branch:'data',  cost:120, boost:0.20, name:'Predictive AI',     prev:'r14' },
  { id:'r18', branch:'data',  cost:200, boost:0.35, name:'AI Product Manager',prev:'r15' },
]

const LIVE_EVENTS = [
  { id:'launch',  name:'🚀 Launch Weekend', desc:'Ship 3 features',  goal:3,  type:'ships', reward:150, rewardType:'gems',  rewardDesc:'150 💎' },
  { id:'hiring',  name:'👥 Hiring Spree',   desc:'Hire 5 employees', goal:5,  type:'hires', reward:5000,rewardType:'cash',  rewardDesc:'$5K' },
  { id:'revenue', name:'💸 Revenue Rush',   desc:'Earn $50K',        goal:50000,type:'earned',reward:100,rewardType:'gems', rewardDesc:'100 💎' },
]

const MILESTONES = [
  { id:'m1', label:'First Dollar',    type:'earned', goal:1,       reward:{ gems:10 } },
  { id:'m2', label:'First Employee',  type:'emp',    goal:1,       reward:{ cash:500 } },
  { id:'m3', label:'$1K Earned',      type:'earned', goal:1000,    reward:{ gems:25 } },
  { id:'m4', label:'$10K Earned',     type:'earned', goal:10000,   reward:{ gems:50 } },
  { id:'m5', label:'$100K Earned',    type:'earned', goal:100000,  reward:{ cash:50000 } },
  { id:'m6', label:'$1M Earned',      type:'earned', goal:1000000, reward:{ gems:200 } },
]

const SPIN_REWARDS = [
  { label: '$250',    type: 'cash',  val: 250 },
  { label: '10 💎',   type: 'gems',  val: 10 },
  { label: '$500',    type: 'cash',  val: 500 },
  { label: '2× Boost',type: 'boost', val: BOOST_DURATION_SPIN },
  { label: '$1,000',  type: 'cash',  val: 1000 },
  { label: '25 💎',   type: 'gems',  val: 25 },
  { label: '$2,000',  type: 'cash',  val: 2000 },
  { label: '50 💎',   type: 'gems',  val: 50 },
]

const MISSION_POOL = [
  { id:'ms1', desc:'Ship 2 features today',       type:'ships',  goal:2,     reward:{ gems:5 } },
  { id:'ms2', desc:'Earn $5,000 today',           type:'earned', goal:5000,  reward:{ gems:8 } },
  { id:'ms3', desc:'Hire 3 employees today',      type:'hires',  goal:3,     reward:{ gems:6 } },
  { id:'ms4', desc:'Click WORK 50 times',         type:'clicks', goal:50,    reward:{ cash:1000 } },
  { id:'ms5', desc:'Spend $2,000 on upgrades',    type:'spend',  goal:2000,  reward:{ gems:7 } },
  { id:'ms6', desc:'Earn $20,000 today',          type:'earned', goal:20000, reward:{ gems:15 } },
  { id:'ms7', desc:'Ship 5 features today',       type:'ships',  goal:5,     reward:{ gems:12 } },
  { id:'ms8', desc:'Click WORK 100 times',        type:'clicks', goal:100,   reward:{ gems:10 } },
  { id:'ms9', desc:'Hire 1 senior employee',      type:'hires',  goal:1,     reward:{ cash:3000 } },
]

const COMPANY_STAGES = [
  { label:'Side Project', min:0 },
  { label:'Seed Stage',   min:1000 },
  { label:'Series A',     min:100000 },
  { label:'Series B',     min:1000000 },
  { label:'Series C',     min:10000000 },
  { label:'Unicorn 🦄',   min:100000000 },
]

const RANDOM_EVENTS = [
  { id:'viral',      text:'🐦 Viral Tweet!',       type:'good', base:2000,    pct:0.005 },
  { id:'press',      text:'📰 Press Feature!',      type:'good', base:5000,    pct:0.01  },
  { id:'enterprise', text:'🏢 Enterprise Client!',  type:'good', base:8000,    pct:0.015 },
  { id:'crash',      text:'💥 Server Crash!',       type:'bad',  base:-500,    pct:0.002 },
  { id:'breach',     text:'🔒 Security Breach!',    type:'bad',  base:-1000,   pct:0.003 },
]

const LEADERBOARD_RIVALS = [
  { name:'TechVault Inc',  val:9_800_000 },
  { name:'NexaCore',       val:7_200_000 },
  { name:'PixelForge',     val:4_100_000 },
  { name:'ByteRocket',     val:2_600_000 },
  { name:'DataNest',       val:1_400_000 },
]

const GEM_PACKS = [
  { gems:50,   price:'$1.99', label:'Starter',    bonus:'' },
  { gems:150,  price:'$4.99', label:'Growth',     bonus:'+20% bonus' },
  { gems:500,  price:'$9.99', label:'Accelerate', bonus:'+35% bonus' },
  { gems:2000, price:'$19.99',label:'Founder 🌟', bonus:'+100% bonus' },
]

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

type EmpCounts  = Record<string, number>
type Owned      = Record<string, boolean>
type ResearchOwned = Record<string, boolean>
type MilestonesDone = Record<string, boolean>

interface LiveEvent {
  id: string
  progress: number
  claimed: boolean
}

interface Mission {
  id: string
  desc: string
  type: string
  goal: number
  reward: { gems?: number; cash?: number }
  progress: number
  claimed: boolean
}

interface FloatItem {
  id: number
  x: number
  y: number
  val: string
  color?: string
}

interface AlertItem {
  id: number
  text: string
  type: 'good' | 'bad'
  reward: number
}

interface GameState {
  cash: number
  gems: number
  officeIdx: number
  employees: EmpCounts
  tools: Owned
  equipment: Owned
  research: ResearchOwned
  totalEarned: number
  companyValue: number
  welcomeClaimed: boolean
  spunDate: string
  liveEvent: LiveEvent
  liveEventTimer: number
  totalShips: number
  totalHires: number
  missionDate: string
  dailyMissions: Mission[]
  dailyShips: number
  dailyHires: number
  dailyEarned: number
  dailyClicks: number
  dailySpent: number
  loginStreak: number
  lastLoginDate: string
  streakClaimed: boolean
  milestones: MilestonesDone
  sfxEnabled: boolean
  companyName: string
  daysPlayed: number
  prestigeLevel: number
  lastSaved: number
}

// ─────────────────────────────────────────────────────────────
//  DEFAULT STATE
// ─────────────────────────────────────────────────────────────

function defaultState(): GameState {
  return {
    cash: 0, gems: 0, officeIdx: 0,
    employees: {}, tools: {}, equipment: {}, research: {},
    totalEarned: 0, companyValue: 0,
    welcomeClaimed: false, spunDate: '',
    liveEvent: { id: 'launch', progress: 0, claimed: false },
    liveEventTimer: 172800,
    totalShips: 0, totalHires: 0,
    missionDate: '', dailyMissions: [],
    dailyShips: 0, dailyHires: 0, dailyEarned: 0, dailyClicks: 0, dailySpent: 0,
    loginStreak: 0, lastLoginDate: '', streakClaimed: false,
    milestones: {}, sfxEnabled: true,
    companyName: 'My Startup', daysPlayed: 0,
    prestigeLevel: 0, lastSaved: Date.now(),
  }
}

// ─────────────────────────────────────────────────────────────
//  INCOME COMPUTATION
// ─────────────────────────────────────────────────────────────

function computeIncome(s: GameState): number {
  let base = 0
  for (const emp of EMPLOYEES) {
    base += emp.income * (s.employees[emp.id] || 0)
  }
  const office = OFFICES[s.officeIdx]
  let mult = office.mult
  for (const t of TOOLS)     if (s.tools[t.id])     mult *= t.mult
  for (const e of EQUIPMENT) if (s.equipment[e.id]) mult *= e.mult
  let rMult = 1
  for (const r of RESEARCH)  if (s.research[r.id])  rMult *= (1 + r.boost)
  mult *= rMult
  mult *= (s.prestigeLevel + 1)
  return base * mult
}

function empCost(id: string, owned: number): number {
  const emp = EMPLOYEES.find(e => e.id === id)!
  return Math.floor(emp.baseCost * Math.pow(1.15, owned))
}

function totalEmps(s: GameState): number {
  return Object.values(s.employees).reduce((a, b) => a + b, 0)
}

function getStage(cv: number) {
  let stage = COMPANY_STAGES[0]
  for (const s of COMPANY_STAGES) { if (cv >= s.min) stage = s }
  return stage
}

function getNextStage(cv: number) {
  for (const s of COMPANY_STAGES) { if (cv < s.min) return s }
  return null
}

function getMissionProgress(m: Mission, s: GameState): number {
  if (m.type === 'ships')  return s.dailyShips
  if (m.type === 'earned') return s.dailyEarned
  if (m.type === 'hires')  return s.dailyHires
  if (m.type === 'clicks') return s.dailyClicks
  if (m.type === 'spend')  return s.dailySpent
  return 0
}

function pickMissions(seed: number): Mission[] {
  const picked: Mission[] = []
  const used = new Set<number>()
  let x = seed
  while (picked.length < 3) {
    x = (x * 1664525 + 1013904223) & 0xffffffff
    const idx = Math.abs(x) % MISSION_POOL.length
    if (!used.has(idx)) {
      used.add(idx)
      const m = MISSION_POOL[idx]
      picked.push({ ...m, progress: 0, claimed: false })
    }
  }
  return picked
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ─────────────────────────────────────────────────────────────
//  SAVE / LOAD
// ─────────────────────────────────────────────────────────────

function saveState(s: GameState) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, lastSaved: Date.now() })) } catch {}
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...JSON.parse(raw) }
  } catch { return defaultState() }
}

// ─────────────────────────────────────────────────────────────
//  SFX (Web Audio)
// ─────────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return _ctx
}
function playTone(freq: number, dur: number, vol = 0.08, type: OscillatorType = 'sine') {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq; osc.type = type
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch {}
}
function sfxWork()    { playTone(440, 0.05, 0.06, 'square') }
function sfxBuy()     { playTone(660, 0.1,  0.07, 'sine');  setTimeout(() => playTone(880, 0.1, 0.07, 'sine'), 80) }
function sfxShip()    { playTone(880, 0.15, 0.08, 'sine');  setTimeout(() => playTone(1100, 0.2, 0.06, 'sine'), 100) }
function sfxGem()     { playTone(1200, 0.12, 0.07, 'triangle') }
function sfxMilestone(){ playTone(523, 0.15, 0.1); setTimeout(()=>playTone(659, 0.15, 0.1), 150); setTimeout(()=>playTone(784, 0.3, 0.1), 300) }

export default function SiliconGrind() {
  // ── State ──
  const [gs, setGs] = useState<GameState>(defaultState)
  const [loaded, setLoaded] = useState(false)
  const [sheet, setSheet] = useState<string | null>(null)       // active bottom sheet
  const [teamTab, setTeamTab] = useState<'hire'|'offices'|'tools'|'equip'>('hire')
  const [resTab, setResTab] = useState<'dev'|'infra'|'data'>('dev')
  const [floats, setFloats] = useState<FloatItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [banner, setBanner] = useState<string | null>(null)     // top flash banner
  const [shipCd, setShipCd] = useState(0)                      // ship cooldown remaining
  const [boostEnd, setBoostEnd] = useState(0)                   // timestamp when boost ends
  const [productivity, setProductivity] = useState(100)         // 0–100
  const [spinResult, setSpinResult] = useState<null | typeof SPIN_REWARDS[0]>(null)
  const [spinAnimIdx, setSpinAnimIdx] = useState<number | null>(null)
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [offlineEarned, setOfflineEarned] = useState(0)
  const [showIPO, setShowIPO] = useState(false)
  const [investorActive, setInvestorActive] = useState(false)
  const [investorTaps, setInvestorTaps] = useState(0)
  const [investorTimer, setInvestorTimer] = useState(10)
  const [investorDone, setInvestorDone] = useState(false)
  const [nameEdit, setNameEdit] = useState(false)
  const [nameVal, setNameVal] = useState('')

  const lastWorkRef = useRef(0)
  const gsRef = useRef(gs)
  useEffect(() => { gsRef.current = gs }, [gs])

  const income = useMemo(() => computeIncome(gs), [gs])
  const boostActive = boostEnd > Date.now()
  const boostMult = boostActive ? 2 : 1
  const effectiveIncome = income * boostMult * (gs.prestigeLevel + 1)

  // ── Load on mount ──
  useEffect(() => {
    const saved = loadState()
    const today = todayStr()

    // offline earnings
    const elapsed = Math.min((Date.now() - (saved.lastSaved || Date.now())) / 1000, OFFLINE_CAP)
    const offEarnings = Math.floor(computeIncome(saved) * 0.5 * elapsed)
    if (offEarnings > 100 && saved.lastSaved) {
      setOfflineEarned(offEarnings)
      setShowOfflineModal(true)
    }

    // login streak
    let streak = saved.loginStreak
    let streakClaimed = saved.streakClaimed
    if (saved.lastLoginDate !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().slice(0, 10)
      if (saved.lastLoginDate === yStr) { streak = (streak % 7) + 1 } else { streak = 1 }
      streakClaimed = false
    }

    // daily missions
    let dailyMissions = saved.dailyMissions
    if (saved.missionDate !== today) {
      const seed = parseInt(today.replace(/-/g, ''), 10)
      dailyMissions = pickMissions(seed)
    }

    const next: GameState = {
      ...saved,
      loginStreak: streak,
      streakClaimed,
      lastLoginDate: today,
      missionDate: today,
      dailyMissions,
      dailyShips:  saved.missionDate !== today ? 0 : (saved.dailyShips  || 0),
      dailyHires:  saved.missionDate !== today ? 0 : (saved.dailyHires  || 0),
      dailyEarned: saved.missionDate !== today ? 0 : (saved.dailyEarned || 0),
      dailyClicks: saved.missionDate !== today ? 0 : (saved.dailyClicks || 0),
      dailySpent:  saved.missionDate !== today ? 0 : (saved.dailySpent  || 0),
    }

    setGs(next)
    setLoaded(true)

    // welcome bonus
    if (!localStorage.getItem(VISITED_KEY)) {
      localStorage.setItem(VISITED_KEY, '1')
      setTimeout(() => {
        setGs(prev => ({ ...prev, cash: prev.cash + 1000, gems: prev.gems + 100, welcomeClaimed: true }))
        showBanner('🎉 Welcome! +100 💎 and $1,000 to get you started!')
      }, 800)
    }
  }, []) // eslint-disable-line

  // ── Auto-save ──
  useEffect(() => {
    if (loaded) saveState(gs)
  }, [gs, loaded])

  // ── Passive income tick ──
  useEffect(() => {
    if (!loaded) return
    const id = setInterval(() => {
      const s = gsRef.current
      const bActive = boostEnd > Date.now()
      const bMult = bActive ? 2 : 1
      const inc = computeIncome(s) * bMult * (s.prestigeLevel + 1)
      if (inc > 0) {
        setGs(prev => {
          const earned = prev.totalEarned + inc
          const cv = prev.companyValue + inc
          return {
            ...prev,
            cash: prev.cash + inc,
            totalEarned: earned,
            companyValue: cv,
            dailyEarned: prev.dailyEarned + inc,
          }
        })
        // float income indicator occasionally
        if (Math.random() < 0.3) {
          addFloat('+' + fmtCash(inc) + '/s', undefined, '#4ade80')
        }
      }
      // productivity recover
      setProductivity(p => Math.min(100, p + 2))
    }, 1000)
    return () => clearInterval(id)
  }, [loaded, boostEnd]) // eslint-disable-line

  // ── Ship cooldown tick ──
  useEffect(() => {
    if (shipCd <= 0) return
    const id = setInterval(() => setShipCd(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [shipCd])

  // ── Random events ──
  useEffect(() => {
    if (!loaded) return
    const id = setInterval(() => {
      if (Math.random() > 0.04) return
      const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
      const s = gsRef.current
      const val = ev.type === 'good'
        ? Math.max(ev.base, Math.floor(s.companyValue * ev.pct))
        : Math.max(ev.base, -Math.floor(s.companyValue * ev.pct))
      const alertId = Date.now() + Math.random()
      setAlerts(prev => [...prev, { id: alertId, text: ev.text, type: ev.type as 'good'|'bad', reward: val }].slice(-3))
      setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== alertId)), 5000)
      setGs(prev => ({
        ...prev,
        cash: Math.max(0, prev.cash + val),
        companyValue: Math.max(0, prev.companyValue + val),
        totalEarned: ev.type === 'good' ? prev.totalEarned + val : prev.totalEarned,
      }))
    }, 5000)
    return () => clearInterval(id)
  }, [loaded])

  // ── Check milestones ──
  useEffect(() => {
    const s = gs
    for (const m of MILESTONES) {
      if (s.milestones[m.id]) continue
      let met = false
      if (m.type === 'earned' && s.totalEarned >= m.goal) met = true
      if (m.type === 'emp'    && totalEmps(s) >= m.goal)  met = true
      if (!met) continue
      setGs(prev => {
        const updates: Partial<GameState> = {
          milestones: { ...prev.milestones, [m.id]: true },
        }
        if (m.reward.gems) updates.gems = (prev.gems || 0) + m.reward.gems
        if (m.reward.cash) updates.cash = prev.cash + m.reward.cash
        return { ...prev, ...updates }
      })
      showBanner(`🏆 Milestone: ${m.label}! +${m.reward.gems ? m.reward.gems + ' 💎' : fmtCash(m.reward.cash!)}`)
      sfxMilestone()
    }
  }, [gs.totalEarned, gs.employees]) // eslint-disable-line

  // ── IPO check ──
  useEffect(() => {
    if (gs.companyValue >= IPO_THRESHOLD && !showIPO) setShowIPO(true)
  }, [gs.companyValue]) // eslint-disable-line

  // ── Investor meeting timer ──
  useEffect(() => {
    if (!investorActive) return
    if (investorTimer <= 0) { setInvestorActive(false); setInvestorDone(true); return }
    const id = setTimeout(() => setInvestorTimer(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [investorActive, investorTimer])

  // ── Live event timer ──
  useEffect(() => {
    if (!loaded) return
    const id = setInterval(() => {
      setGs(prev => {
        let t = prev.liveEventTimer - 1
        let ev = prev.liveEvent
        if (t <= 0) {
          // rotate to next event
          const idx = (LIVE_EVENTS.findIndex(e => e.id === prev.liveEvent.id) + 1) % LIVE_EVENTS.length
          ev = { id: LIVE_EVENTS[idx].id, progress: 0, claimed: false }
          t = 172800
        }
        return { ...prev, liveEventTimer: t, liveEvent: ev }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [loaded])

  // ── Helpers ──
  const addFloat = useCallback((val: string, rect?: DOMRect, color?: string) => {
    const id = Date.now() + Math.random()
    const x = rect ? rect.left + rect.width / 2 : 120 + Math.random() * 160
    const y = rect ? rect.top : 200 + Math.random() * 60
    setFloats(f => [...f, { id, x, y, val, color }].slice(-8))
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 1600)
  }, [])

  const spawnBurst = useCallback((rect: DOMRect) => {
    const layer = document.getElementById('sg-burst-layer')
    if (!layer) return
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const SYMS = ['💰', '$', '💵', '🪙', '$', '💲']
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.8
      const dist = 45 + Math.random() * 55
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist - 20
      const el = document.createElement('div')
      el.textContent = SYMS[i % SYMS.length]
      el.style.cssText = [
        `position:fixed`, `left:${cx}px`, `top:${cy}px`,
        `font-size:${14 + Math.random() * 8}px`, `pointer-events:none`,
        `transform:translate(-50%,-50%)`,
        `animation:sgburst 0.75s ease-out forwards`,
        `--dx:${dx}px`, `--dy:${dy}px`, `font-weight:900`,
        `color:${i % 2 === 0 ? '#4ade80' : '#fbbf24'}`,
        `z-index:300`,
      ].join(';')
      layer.appendChild(el)
      el.addEventListener('animationend', () => el.remove(), { once: true })
    }
  }, [])

  const showBanner = (text: string) => {
    setBanner(text)
    setTimeout(() => setBanner(null), 3500)
  }

  // ── WORK button ──
  const handleWork = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now()
    if (now - lastWorkRef.current < 120) return
    lastWorkRef.current = now
    const rect = e.currentTarget.getBoundingClientRect()
    const s = gsRef.current
    const bMult = boostEnd > Date.now() ? 2 : 1
    const gain = Math.floor((10 + totalEmps(s) * 2) * bMult)
    spawnBurst(rect)
    addFloat('+' + fmtCash(gain), rect)
    if (s.sfxEnabled) sfxWork()
    setProductivity(p => Math.max(0, p - 8))
    setGs(prev => ({
      ...prev,
      cash: prev.cash + gain,
      totalEarned: prev.totalEarned + gain,
      companyValue: prev.companyValue + gain,
      dailyEarned: prev.dailyEarned + gain,
      dailyClicks: prev.dailyClicks + 1,
    }))
  }, [boostEnd, spawnBurst, addFloat])

  // ── Ship Feature ──
  const handleShip = useCallback(() => {
    if (shipCd > 0) return
    const s = gsRef.current
    const reward = Math.max(500, effectiveIncome * 30)
    const earned = Math.floor(reward)
    addFloat('🚀 Shipped! +' + fmtCash(earned))
    if (s.sfxEnabled) sfxShip()
    setShipCd(SHIP_COOLDOWN)
    setGs(prev => {
      const ships = prev.totalShips + 1
      const dShips = prev.dailyShips + 1
      // update live event
      let liveEvent = prev.liveEvent
      const evDef = LIVE_EVENTS.find(e => e.id === liveEvent.id)
      if (evDef && evDef.type === 'ships' && !liveEvent.claimed) {
        liveEvent = { ...liveEvent, progress: liveEvent.progress + 1 }
      }
      return {
        ...prev,
        cash: prev.cash + earned,
        totalEarned: prev.totalEarned + earned,
        companyValue: prev.companyValue + earned,
        dailyEarned: prev.dailyEarned + earned,
        totalShips: ships,
        dailyShips: dShips,
        liveEvent,
      }
    })
    showBanner(`🚀 Feature Shipped! +${fmtCash(earned)}`)
  }, [shipCd, effectiveIncome, addFloat])

  // ── Hire Employee ──
  const handleHire = useCallback((empId: string) => {
    const s = gsRef.current
    const owned = s.employees[empId] || 0
    const cost = empCost(empId, owned)
    if (s.cash < cost) return
    if (s.sfxEnabled) sfxBuy()
    setGs(prev => {
      const employees = { ...prev.employees, [empId]: (prev.employees[empId] || 0) + 1 }
      const hires = prev.totalHires + 1
      const dHires = prev.dailyHires + 1
      let liveEvent = prev.liveEvent
      const evDef = LIVE_EVENTS.find(e => e.id === liveEvent.id)
      if (evDef && evDef.type === 'hires' && !liveEvent.claimed) {
        liveEvent = { ...liveEvent, progress: liveEvent.progress + 1 }
      }
      return {
        ...prev,
        cash: prev.cash - cost,
        dailySpent: prev.dailySpent + cost,
        employees,
        totalHires: hires,
        dailyHires: dHires,
        liveEvent,
      }
    })
    const emp = EMPLOYEES.find(e => e.id === empId)!
    addFloat(`${emp.emoji} Hired!`)
  }, [addFloat])

  // ── Buy Office ──
  const handleBuyOffice = useCallback((idx: number) => {
    const s = gsRef.current
    const off = OFFICES[idx]
    if (s.cash < off.cost || s.officeIdx >= idx) return
    if (s.sfxEnabled) sfxBuy()
    setGs(prev => ({
      ...prev,
      cash: prev.cash - off.cost,
      dailySpent: prev.dailySpent + off.cost,
      officeIdx: idx,
    }))
    showBanner(`🏢 Upgraded to ${off.name}!`)
  }, [])

  // ── Buy Tool ──
  const handleBuyTool = useCallback((toolId: string) => {
    const s = gsRef.current
    const t = TOOLS.find(t => t.id === toolId)!
    if (s.cash < t.cost || s.tools[toolId]) return
    if (s.sfxEnabled) sfxBuy()
    setGs(prev => ({
      ...prev,
      cash: prev.cash - t.cost,
      dailySpent: prev.dailySpent + t.cost,
      tools: { ...prev.tools, [toolId]: true },
    }))
    addFloat(`${t.emoji} ${t.name} active!`)
  }, [addFloat])

  // ── Buy Equipment ──
  const handleBuyEquip = useCallback((eqId: string) => {
    const s = gsRef.current
    const eq = EQUIPMENT.find(e => e.id === eqId)!
    if (s.cash < eq.cost || s.equipment[eqId]) return
    if (s.sfxEnabled) sfxBuy()
    setGs(prev => ({
      ...prev,
      cash: prev.cash - eq.cost,
      dailySpent: prev.dailySpent + eq.cost,
      equipment: { ...prev.equipment, [eqId]: true },
    }))
    addFloat(`${eq.emoji} Equipped!`)
  }, [addFloat])

  // ── Research ──
  const handleResearch = useCallback((nodeId: string) => {
    const s = gsRef.current
    const node = RESEARCH.find(r => r.id === nodeId)!
    if (s.gems < node.cost || s.research[nodeId]) return
    if (node.prev && !s.research[node.prev]) return
    if (s.sfxEnabled) sfxGem()
    setGs(prev => ({
      ...prev,
      gems: prev.gems - node.cost,
      research: { ...prev.research, [nodeId]: true },
    }))
    addFloat(`🔬 +${Math.round(node.boost * 100)}% income!`)
  }, [addFloat])

  // ── Boost (ad) ──
  const handleWatchAd = useCallback((type: 'boost'|'gems'|'cash'|'spin') => {
    const s = gsRef.current
    if (type === 'boost') {
      setBoostEnd(Date.now() + BOOST_DURATION * 1000)
      showBanner('⚡ 2× Boost active for 60 seconds!')
    } else if (type === 'gems') {
      setGs(prev => ({ ...prev, gems: prev.gems + 15 }))
      showBanner('💎 +15 Gems! Thanks for watching!')
    } else if (type === 'cash') {
      const reward = Math.max(1000, Math.floor(Math.max(effectiveIncome * 60, s.companyValue * 0.01)))
      setGs(prev => ({
        ...prev,
        cash: prev.cash + reward,
        totalEarned: prev.totalEarned + reward,
      }))
      showBanner('💰 +' + fmtCash(reward) + ' from ad reward!')
    } else if (type === 'spin') {
      setGs(prev => ({ ...prev, spunDate: '' }))
      showBanner('🎰 Daily Spin reset!')
    }
  }, [effectiveIncome])

  // ── Daily Spin ──
  const handleSpin = useCallback(() => {
    const s = gsRef.current
    const today = todayStr()
    if (s.spunDate === today) return
    const idx = Math.floor(Math.random() * SPIN_REWARDS.length)
    setSpinAnimIdx(idx)
    setTimeout(() => {
      const reward = SPIN_REWARDS[idx]
      setSpinResult(reward)
      setSpinAnimIdx(null)
      setGs(prev => {
        const updates: Partial<GameState> = { spunDate: today }
        if (reward.type === 'cash')  updates.cash  = prev.cash + reward.val
        if (reward.type === 'gems')  updates.gems  = prev.gems + reward.val
        if (reward.type === 'boost') setBoostEnd(Date.now() + reward.val * 1000)
        return { ...prev, ...updates }
      })
      if (s.sfxEnabled) sfxGem()
    }, 2000)
  }, [])

  // ── Claim Live Event ──
  const handleClaimEvent = useCallback(() => {
    const s = gsRef.current
    const evDef = LIVE_EVENTS.find(e => e.id === s.liveEvent.id) ?? LIVE_EVENTS[0]
    if (s.liveEvent.claimed || s.liveEvent.progress < evDef.goal) return
    setGs(prev => {
      const updates: Partial<GameState> = {
        liveEvent: { ...prev.liveEvent, claimed: true }
      }
      if (evDef.rewardType === 'gems') updates.gems = prev.gems + evDef.reward
      if (evDef.rewardType === 'cash') updates.cash = prev.cash + evDef.reward
      return { ...prev, ...updates }
    })
    showBanner(`🎉 Event complete! ${evDef.rewardDesc} claimed!`)
    if (gs.sfxEnabled) sfxMilestone()
  }, [gs.sfxEnabled])

  // ── Claim mission ──
  const handleClaimMission = useCallback((mIdx: number) => {
    const s = gsRef.current
    const m = s.dailyMissions[mIdx]
    if (!m || m.claimed || getMissionProgress(m, s) < m.goal) return
    if (s.sfxEnabled) sfxGem()
    setGs(prev => {
      const missions = prev.dailyMissions.map((mis, i) => i === mIdx ? { ...mis, claimed: true } : mis)
      const updates: Partial<GameState> = { dailyMissions: missions }
      if (m.reward.gems) updates.gems = prev.gems + m.reward.gems
      if (m.reward.cash) updates.cash = prev.cash + m.reward.cash
      return { ...prev, ...updates }
    })
    addFloat(m.reward.gems ? `+${m.reward.gems} 💎` : `+${fmtCash(m.reward.cash!)}`)
  }, [addFloat])

  // ── Claim streak ──
  const handleClaimStreak = useCallback(() => {
    const s = gsRef.current
    if (s.streakClaimed) return
    const day = ((s.loginStreak - 1) % 7) + 1
    const rewards: Record<number, {gems?:number; cash?:number}> = {
      1:{gems:10}, 2:{gems:20}, 3:{cash:5000}, 4:{gems:35}, 5:{cash:15000}, 6:{gems:75}, 7:{gems:150,cash:50000}
    }
    const r = rewards[day] || {}
    if (s.sfxEnabled) sfxMilestone()
    setGs(prev => {
      const cv = prev.companyValue
      const updates: Partial<GameState> = { streakClaimed: true }
      if (r.gems) updates.gems = prev.gems + r.gems
      if (r.cash) {
        const base = r.cash
        const scaled = Math.max(base, Math.floor(cv * (day === 3 ? 0.01 : 0.02)))
        updates.cash = prev.cash + scaled
      }
      return { ...prev, ...updates }
    })
    showBanner(`📅 Day ${day} streak reward claimed!`)
  }, [])

  // ── IPO ──
  const handleIPO = useCallback(() => {
    if (gs.companyValue < IPO_THRESHOLD) return
    setGs(prev => ({
      ...defaultState(),
      gems: prev.gems,
      prestigeLevel: prev.prestigeLevel + 1,
      companyName: prev.companyName,
      sfxEnabled: prev.sfxEnabled,
      welcomeClaimed: true,
    }))
    setShowIPO(false)
    showBanner(`🎉 IPO Complete! Now at Prestige ${gs.prestigeLevel + 1}! Income ×${gs.prestigeLevel + 2}`)
    sfxMilestone()
  }, [gs.companyValue, gs.prestigeLevel, gs.gems, gs.companyName, gs.sfxEnabled])

  // ── Investor meeting ──
  const handleStartInvestor = () => {
    setInvestorTaps(0)
    setInvestorTimer(10)
    setInvestorDone(false)
    setInvestorActive(true)
  }
  const handleInvestorTap = () => {
    if (!investorActive) return
    setInvestorTaps(t => t + 1)
    const perTap = Math.max(50, Math.floor(gs.companyValue * 0.0005))
    addFloat('+' + fmtCash(perTap))
    setGs(prev => ({ ...prev, cash: prev.cash + perTap }))
  }
  const handleInvestorEnd = () => {
    setInvestorActive(false)
    setInvestorDone(true)
    showBanner(`🤝 Investor meeting done! ${investorTaps} taps!`)
  }

  // ── Claim offline ──
  const handleClaimOffline = (double: boolean) => {
    if (double && gs.gems < 20) return
    const earn = double ? offlineEarned * 2 : offlineEarned
    setGs(prev => ({
      ...prev,
      cash: prev.cash + earn,
      totalEarned: prev.totalEarned + earn,
      gems: double ? prev.gems - 20 : prev.gems,
    }))
    setShowOfflineModal(false)
    showBanner(`💤 Offline earnings: +${fmtCash(earn)} claimed!`)
  }

  // ── Tap alert ──
  const handleTapAlert = (a: AlertItem) => {
    setAlerts(prev => prev.filter(x => x.id !== a.id))
  }

  // ── Tab unlocks ──
  const tabsUnlocked = {
    team:     gs.totalEarned >= 200,
    research: gs.totalEarned >= 2000,
    ship:     gs.totalEarned >= 5000,
    more:     gs.totalEarned >= 10000,
  }

  const office = OFFICES[gs.officeIdx]
  const stage = getStage(gs.companyValue)
  const nextStage = getNextStage(gs.companyValue)
  const stageProgress = nextStage
    ? Math.min(1, (gs.companyValue - stage.min) / (nextStage.min - stage.min))
    : 1
  const evDef = LIVE_EVENTS.find(e => e.id === gs.liveEvent.id) ?? LIVE_EVENTS[0]
  const prodColor = productivity > 60 ? '#4ade80' : productivity > 30 ? '#fbbf24' : '#f87171'

  if (!loaded) {
    return (
      <div style={{
        background:'#0d0d1a', height:'100dvh', display:'flex',
        alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16
      }}>
        <div style={{ fontSize:48 }}>⚙️</div>
        <div style={{ color:'#4ade80', fontFamily:'var(--font)', fontWeight:700, fontSize:20 }}>
          SILICON GRIND
        </div>
        <div style={{
          width:40, height:40, border:'3px solid #4ade80',
          borderTopColor:'transparent', borderRadius:'50%',
          animation:'sg-spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div id="sg-root" style={{ fontFamily:'var(--font)', background:'#0d0d1a', color:'#f0f0ff', display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', userSelect:'none' }}>
      <div id="sg-burst-layer" />

      {/* ── Floating text ── */}
      {floats.map(fl => (
        <div key={fl.id} style={{
          position:'fixed', left:fl.x, top:fl.y, pointerEvents:'none',
          zIndex:200, fontWeight:800, fontSize:15,
          color: fl.color || '#fbbf24',
          animation:'sg-rise 1.5s ease-out forwards',
          textShadow:'0 1px 4px rgba(0,0,0,0.8)',
          whiteSpace:'nowrap',
        }}>
          {fl.val}
        </div>
      ))}

      {/* ── Top flash banner ── */}
      {banner && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:400,
          background:'linear-gradient(135deg,#1c3a2a,#0f2d1a)',
          borderBottom:'1px solid #4ade8055',
          padding:'10px 16px', textAlign:'center',
          fontSize:13, fontWeight:700, color:'#4ade80',
          animation:'sg-milestone 3.5s ease-out forwards',
        }}>
          {banner}
        </div>
      )}

      {/* ── Top HUD ── */}
      <div style={{
        flexShrink:0, background:'#0d0d1a',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'10px 12px 8px',
      }}>
        {/* Row 1: company name + stage */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{
              background:'linear-gradient(135deg,#1a3a28,#0d2018)',
              border:'1px solid #4ade8040', borderRadius:6,
              padding:'2px 8px', fontSize:11, fontWeight:700, color:'#4ade80',
            }}>{stage.label}</span>
            {nameEdit ? (
              <input
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={() => { setGs(prev => ({ ...prev, companyName: nameVal || prev.companyName })); setNameEdit(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { setGs(prev => ({ ...prev, companyName: nameVal || prev.companyName })); setNameEdit(false) } }}
                autoFocus
                style={{
                  background:'#1c1c35', border:'1px solid #4ade80', borderRadius:6,
                  color:'#fff', padding:'2px 8px', fontSize:13, fontWeight:700,
                  outline:'none', width:120,
                }}
              />
            ) : (
              <span
                style={{ fontSize:14, fontWeight:800, color:'#f0f0ff', cursor:'pointer' }}
                onClick={() => { setNameVal(gs.companyName); setNameEdit(true) }}
              >
                {gs.companyName} ✏️
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {gs.prestigeLevel > 0 && (
              <span style={{ fontSize:11, color:'#a78bfa', fontWeight:700 }}>P{gs.prestigeLevel}</span>
            )}
            {boostActive && (
              <span style={{
                background:'linear-gradient(135deg,#7c2d12,#92400e)',
                border:'1px solid #fbbf24', borderRadius:6,
                padding:'2px 6px', fontSize:10, fontWeight:800, color:'#fbbf24',
                animation:'sg-boost-glow 1s ease-in-out infinite',
              }}>⚡2×</span>
            )}
          </div>
        </div>

        {/* Row 2: Cash | Value | Gems */}
        <div style={{ display:'flex', gap:6, marginBottom:6 }}>
          <StatChip label="💰 Cash" value={fmtCash(gs.cash)} accent="#4ade80" />
          <StatChip label="🏢 Value" value={fmtCash(gs.companyValue)} accent="#60a5fa" />
          <StatChip label="💎 Gems" value={gs.gems.toString()} accent="#a78bfa" />
        </div>

        {/* Row 3: Income/s + stage progress */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#8888aa', whiteSpace:'nowrap' }}>
            +{fmtCash(effectiveIncome)}/s
          </span>
          <div style={{ flex:1, height:5, background:'#1c1c35', borderRadius:3, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:(stageProgress * 100) + '%',
              background:'linear-gradient(90deg,#60a5fa,#a78bfa)',
              borderRadius:3, transition:'width 0.5s ease',
            }} />
          </div>
          {nextStage && (
            <span style={{ fontSize:10, color:'#8888aa', whiteSpace:'nowrap' }}>
              {fmtCash(nextStage.min)}
            </span>
          )}
        </div>
      </div>

      {/* ── News ticker ── */}
      <div style={{
        flexShrink:0, height:20, overflow:'hidden',
        background:'#151528', borderBottom:'1px solid rgba(255,255,255,0.04)',
        display:'flex', alignItems:'center',
      }}>
        <div style={{
          whiteSpace:'nowrap', fontSize:11, color:'#8888aa',
          animation:'sg-ticker 20s linear infinite',
          paddingLeft:'100%',
        }}>
          {gs.companyName} — {stage.label} • {fmtCash(gs.companyValue)} valuation • +{fmtCash(effectiveIncome)}/s passive income • Prestige Level {gs.prestigeLevel} • Total Earned: {fmtCash(gs.totalEarned)} •
        </div>
      </div>

      {/* ── Live Event Badge ── */}
      <div style={{
        position:'absolute', top:130, right:10, zIndex:100,
      }}>
        <div
          onClick={() => setSheet('more')}
          style={{
            background:'linear-gradient(135deg,#1a1a35,#0d0d2a)',
            border:`1px solid ${evDef.rewardType === 'gems' ? '#a78bfa55' : '#4ade8055'}`,
            borderRadius:10, padding:'4px 8px', cursor:'pointer',
            animation:'sg-alert-bob 2s ease-in-out infinite',
          }}
        >
          <div style={{ fontSize:10, color:'#8888aa', marginBottom:1 }}>LIVE EVENT</div>
          <div style={{ fontSize:11, fontWeight:700, color:'#f0f0ff' }}>{evDef.name}</div>
          <div style={{ fontSize:10, color:'#4ade80' }}>
            {gs.liveEvent.progress}/{evDef.goal} • {evDef.rewardDesc}
          </div>
        </div>
      </div>

      {/* ── Floating alerts ── */}
      <div style={{ position:'fixed', top:155, left:12, zIndex:150, display:'flex', flexDirection:'column', gap:4 }}>
        {alerts.map(a => (
          <div
            key={a.id}
            onClick={() => handleTapAlert(a)}
            style={{
              background: a.type === 'good'
                ? 'linear-gradient(135deg,#1a3a28,#0f2d1a)'
                : 'linear-gradient(135deg,#3a1a1a,#2d0f0f)',
              border:`1px solid ${a.type === 'good' ? '#4ade8055' : '#f8717155'}`,
              borderRadius:8, padding:'5px 10px', cursor:'pointer',
              animation:'sg-slidein 0.3s ease-out',
              fontSize:12, fontWeight:600,
              color: a.type === 'good' ? '#4ade80' : '#f87171',
            }}
          >
            {a.text} {a.type === 'good' ? '+' : ''}{fmtCash(a.reward)}
          </div>
        ))}
      </div>

      {/* ── OFFICE SCENE (main content) ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden', minHeight:0 }}>
        <OfficeScene
          officeIdx={gs.officeIdx}
          employees={gs.employees}
          equipment={gs.equipment}
          tools={gs.tools}
          totalEarned={gs.totalEarned}
          income={effectiveIncome}
          companyName={gs.companyName}
          prestigeLevel={gs.prestigeLevel}
        />

        {/* Side action buttons */}
        <div style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:8 }}>
          <IconBtn emoji="👥" label="Team"  onClick={() => setSheet('team')}     unlocked={tabsUnlocked.team} />
          <IconBtn emoji="🔬" label="R&D"   onClick={() => setSheet('research')} unlocked={tabsUnlocked.research} />
        </div>
        <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:8 }}>
          <IconBtn emoji="🚀" label="Ship"  onClick={() => setSheet('ship')}     unlocked={tabsUnlocked.ship} badge={shipCd > 0 ? fmtTime(shipCd) : undefined} />
          <IconBtn emoji="⭐" label="More"  onClick={() => setSheet('more')}     unlocked={tabsUnlocked.more} />
        </div>
      </div>

      {/* ── Productivity bar ── */}
      <div style={{
        flexShrink:0, padding:'6px 16px 4px',
        background:'#0d0d1a',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontSize:10, color:'#8888aa', minWidth:90 }}>
            ⚡ PRODUCTIVITY
          </span>
          <div style={{ flex:1, height:5, background:'#1c1c35', borderRadius:3, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:productivity + '%',
              background:`linear-gradient(90deg,${prodColor},${prodColor}cc)`,
              borderRadius:3, transition:'width 0.2s ease',
            }} />
          </div>
          <span style={{ fontSize:10, color:prodColor, minWidth:32, textAlign:'right' }}>
            {Math.round(productivity)}%
          </span>
        </div>
      </div>

      {/* ── WORK Button ── */}
      <div style={{
        flexShrink:0, display:'flex', justifyContent:'center',
        padding:'6px 0 12px', background:'#0d0d1a',
        position:'relative',
      }}>
        {/* Pulse rings */}
        {[1,2,3].map(i => (
          <div key={i} style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%, -50%)',
            width:80, height:80, borderRadius:'50%',
            border:`2px solid ${office.accent}44`,
            animation:`sg-ring 2s ease-out ${i * 0.6}s infinite`,
            pointerEvents:'none',
          }} />
        ))}
        <button
          onClick={handleWork}
          style={{
            width:80, height:80, borderRadius:'50%',
            background:`radial-gradient(circle at 35% 35%, ${office.accent}cc, ${office.accent}66)`,
            border:`3px solid ${office.accent}`,
            boxShadow:`0 0 20px ${office.accent}55, inset 0 2px 8px rgba(255,255,255,0.15)`,
            fontSize:14, fontWeight:900, color:'#fff',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column', gap:1,
            animation:`sg-pulse 2s ease-in-out infinite`,
          }}
        >
          <span style={{ fontSize:22, lineHeight:1 }}>💻</span>
          <span style={{ fontSize:10, letterSpacing:'0.05em' }}>WORK</span>
        </button>
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div style={{
        flexShrink:0, display:'flex',
        background:'#0d0d1a',
        borderTop:'1px solid rgba(255,255,255,0.06)',
        paddingBottom:'env(safe-area-inset-bottom)',
      }}>
        {[
          { id:'team',     emoji:'👥', label:'Team',     unlocked: tabsUnlocked.team },
          { id:'research', emoji:'🔬', label:'R&D',      unlocked: tabsUnlocked.research },
          { id:'ship',     emoji:'🚀', label:'Ship',     unlocked: tabsUnlocked.ship },
          { id:'more',     emoji:'⭐', label:'More',     unlocked: tabsUnlocked.more },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => t.unlocked ? setSheet(sheet === t.id ? null : t.id) : undefined}
            style={{
              flex:1, padding:'8px 0', background:'none', border:'none',
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              opacity: t.unlocked ? 1 : 0.3,
              cursor: t.unlocked ? 'pointer' : 'not-allowed',
            }}
          >
            <span style={{ fontSize:18 }}>{t.emoji}</span>
            <span style={{ fontSize:10, color: sheet === t.id ? '#4ade80' : '#8888aa', fontWeight:600 }}>{t.label}</span>
            {sheet === t.id && (
              <div style={{ width:4, height:4, borderRadius:'50%', background:'#4ade80', marginTop:1 }} />
            )}
          </button>
        ))}
      </div>

      {/* ── BOTTOM SHEETS ── */}
      {sheet && (
        <div
          style={{
            position:'fixed', inset:0, zIndex:300,
            background:'rgba(0,0,0,0.6)',
          }}
          onClick={() => setSheet(null)}
        >
          <div
            style={{
              position:'absolute', bottom:0, left:0, right:0,
              background:'#151528',
              borderRadius:'20px 20px 0 0',
              border:'1px solid rgba(255,255,255,0.08)',
              maxHeight:'78dvh',
              display:'flex', flexDirection:'column',
              animation:'sg-banner-in 0.3s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div style={{
              flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'14px 16px 10px',
              borderBottom:'1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontWeight:800, fontSize:16 }}>
                {sheet === 'team' && '👥 Team'}
                {sheet === 'research' && '🔬 R&D'}
                {sheet === 'ship' && '🚀 Ship'}
                {sheet === 'more' && '⭐ More'}
              </div>
              <button
                onClick={() => setSheet(null)}
                style={{ background:'none', border:'none', color:'#8888aa', fontSize:22, cursor:'pointer', lineHeight:1 }}
              >×</button>
            </div>

            {/* Sheet content */}
            <div id="sg-scroll" style={{ flex:1, overflowY:'auto', padding:'12px 0' }} className="hide-scroll">
              {sheet === 'team'     && <TeamSheet gs={gs} onHire={handleHire} onBuyOffice={handleBuyOffice} onBuyTool={handleBuyTool} onBuyEquip={handleBuyEquip} teamTab={teamTab} setTeamTab={setTeamTab} income={income} />}
              {sheet === 'research' && <ResearchSheet gs={gs} onResearch={handleResearch} resTab={resTab} setResTab={setResTab} />}
              {sheet === 'ship'     && <ShipSheet gs={gs} shipCd={shipCd} evDef={evDef} onShip={handleShip} onClaimEvent={handleClaimEvent} onWatchAd={handleWatchAd} effectiveIncome={effectiveIncome} />}
              {sheet === 'more'     && <MoreSheet gs={gs} onSpin={handleSpin} spinResult={spinResult} spinAnimIdx={spinAnimIdx} setSpinResult={setSpinResult} onClaimMission={handleClaimMission} onClaimStreak={handleClaimStreak} onStartInvestor={handleStartInvestor} investorActive={investorActive} investorTaps={investorTaps} investorTimer={investorTimer} investorDone={investorDone} onInvestorTap={handleInvestorTap} onInvestorEnd={handleInvestorEnd} onWatchAd={handleWatchAd} showIPO={showIPO} onIPO={handleIPO} onToggleSfx={() => setGs(prev => ({ ...prev, sfxEnabled: !prev.sfxEnabled }))} />}
            </div>
          </div>
        </div>
      )}

      {/* ── OFFLINE MODAL ── */}
      {showOfflineModal && (
        <div style={{
          position:'fixed', inset:0, zIndex:500,
          background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            background:'#1c1c35', borderRadius:20,
            border:'1px solid rgba(255,255,255,0.1)',
            padding:28, maxWidth:300, width:'90%',
            animation:'sg-pop 0.4s ease-out',
            textAlign:'center',
          }}>
            <div style={{ fontSize:48, marginBottom:12 }}>💤</div>
            <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>Welcome Back!</div>
            <div style={{ color:'#8888aa', marginBottom:16, fontSize:14 }}>
              While you were away, your team kept grinding...
            </div>
            <div style={{ fontWeight:900, fontSize:28, color:'#4ade80', marginBottom:20 }}>
              +{fmtCash(offlineEarned)}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <GBtn label="Claim" color="#4ade80" onClick={() => handleClaimOffline(false)} />
              <GBtn
                label={`2× Claim (20 💎)`}
                color="#a78bfa"
                onClick={() => handleClaimOffline(true)}
                disabled={gs.gems < 20}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── IPO MODAL ── */}
      {showIPO && (
        <div style={{
          position:'fixed', inset:0, zIndex:500,
          background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            background:'linear-gradient(135deg,#1a1535,#0d0a2a)',
            borderRadius:20,
            border:'1px solid #a78bfa55',
            padding:28, maxWidth:300, width:'90%',
            animation:'sg-pop 0.4s ease-out',
            textAlign:'center',
          }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
            <div style={{ fontWeight:900, fontSize:22, color:'#a78bfa', marginBottom:8 }}>IPO READY!</div>
            <div style={{ color:'#8888aa', marginBottom:8, fontSize:14 }}>
              {gs.companyName} has reached a <strong style={{ color:'#f0f0ff' }}>$1B valuation!</strong>
            </div>
            <div style={{ color:'#8888aa', marginBottom:20, fontSize:13 }}>
              Going public resets your progress but permanently boosts income by ×{gs.prestigeLevel + 2}. Your gems carry over.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button
                onClick={() => setShowIPO(false)}
                style={{
                  background:'none', border:'1px solid #8888aa55',
                  color:'#8888aa', borderRadius:10, padding:'10px 18px',
                  fontWeight:700, cursor:'pointer',
                }}
              >Not Yet</button>
              <GBtn label="🚀 Go Public!" color="#a78bfa" onClick={handleIPO} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  UI PRIMITIVES
// ─────────────────────────────────────────────────────────────

function StatChip({ label, value, accent }: { label:string; value:string; accent:string }) {
  return (
    <div style={{
      flex:1, background:'#151528', border:`1px solid ${accent}33`,
      borderRadius:8, padding:'4px 8px', minWidth:0,
    }}>
      <div style={{ fontSize:9, color:'#8888aa', marginBottom:1 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:800, color:accent, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {value}
      </div>
    </div>
  )
}

function IconBtn({ emoji, label, onClick, unlocked, badge }: {
  emoji:string; label:string; onClick:()=>void; unlocked:boolean; badge?:string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background:'rgba(13,13,26,0.9)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:12, padding:'8px 6px',
        width:50, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
        opacity: unlocked ? 1 : 0.3,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        position:'relative', backdropFilter:'blur(4px)',
      }}
    >
      <span style={{ fontSize:20 }}>{emoji}</span>
      <span style={{ fontSize:9, color:'#8888aa', fontWeight:600 }}>{label}</span>
      {badge && (
        <div style={{
          position:'absolute', top:-4, right:-4,
          background:'#f87171', borderRadius:8, padding:'1px 4px',
          fontSize:8, fontWeight:800, color:'#fff',
        }}>{badge}</div>
      )}
    </button>
  )
}

function GBtn({ label, color, onClick, disabled, small }: {
  label:string; color:string; onClick:()=>void; disabled?:boolean; small?:boolean
}) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      style={{
        background: disabled ? '#2a2a3a' : `linear-gradient(135deg,${color}99,${color}55)`,
        border:`1px solid ${disabled ? '#333' : color + '66'}`,
        borderRadius:10, padding: small ? '7px 12px' : '10px 18px',
        color: disabled ? '#555' : color,
        fontWeight:800, fontSize: small ? 11 : 13, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace:'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function SheetRow({ left, right, sub, onClick, owned }: {
  left:React.ReactNode; right:React.ReactNode; sub?:string; onClick?:()=>void; owned?:boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        background: owned ? 'rgba(74,222,128,0.04)' : 'transparent',
        transition:'background 0.15s',
      }}
    >
      <div>
        <div style={{ fontWeight:700, fontSize:14 }}>{left}</div>
        {sub && <div style={{ fontSize:11, color:'#8888aa', marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink:0, marginLeft:12 }}>{right}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  OFFICE SCENES
// ─────────────────────────────────────────────────────────────

interface SceneProps {
  officeIdx: number
  employees: EmpCounts
  equipment: Owned
  tools: Owned
  totalEarned: number
  income: number
  companyName: string
  prestigeLevel: number
}

function OfficeScene(props: SceneProps) {
  const { officeIdx } = props
  if (officeIdx === 0) return <GarageScene {...props} />
  if (officeIdx === 1) return <SmallOfficeScene {...props} />
  if (officeIdx === 2) return <OpenPlanScene {...props} />
  return <SkyscraperScene {...props} />
}

// ── Garage Scene ──
function GarageScene({ employees, equipment, companyName }: SceneProps) {
  const devs = employees['dev'] || 0
  const hasDesigner = (employees['designer'] || 0) > 0
  const hasCoffee = true

  return (
    <div style={{
      width:'100%', height:'100%',
      background:'linear-gradient(180deg,#1a1210 0%,#0d0a08 100%)',
      position:'relative', overflow:'hidden',
    }}>
      {/* Concrete floor */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'35%',
        background:'linear-gradient(180deg,#1a1a1a 0%,#141414 100%)',
        borderTop:'2px solid #2a2a2a',
      }}>
        {/* Oil stain */}
        <div style={{
          position:'absolute', bottom:20, left:'40%',
          width:60, height:20,
          background:'rgba(0,0,0,0.4)',
          borderRadius:'50%', filter:'blur(6px)',
        }} />
      </div>

      {/* Garage walls */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(180deg,#2a2018 0%,transparent 40%)',
        pointerEvents:'none',
      }} />

      {/* Flickering overhead light */}
      <div style={{
        position:'absolute', top:8, left:'50%', transform:'translateX(-50%)',
        width:80, height:8, background:'#fff',
        borderRadius:4,
        animation:'sg-flicker 4s ease-in-out infinite',
        boxShadow:'0 0 30px 10px rgba(255,240,180,0.15)',
      }} />
      {/* Light cone */}
      <div style={{
        position:'absolute', top:16, left:'50%', transform:'translateX(-50%)',
        width:0, height:0,
        borderLeft:'100px solid transparent',
        borderRight:'100px solid transparent',
        borderTop:'120px solid rgba(255,240,180,0.04)',
        pointerEvents:'none',
      }} />

      {/* Whiteboard */}
      <div style={{
        position:'absolute', top:30, right:20,
        width:90, height:70,
        background:'#e8e8e8', borderRadius:4,
        border:'3px solid #5a3a1a',
        padding:6, overflow:'hidden',
      }}>
        <div style={{ fontSize:7, color:'#333', lineHeight:1.4, fontFamily:'monospace' }}>
          <div style={{ color:'#888' }}>MVP PLAN</div>
          <div>✓ Build it</div>
          <div>✓ Ship it</div>
          <div style={{ color:'#4ade80' }}>□ Profit?</div>
          <div style={{ marginTop:2, color:'#60a5fa', fontSize:6 }}>
            {companyName}
          </div>
        </div>
      </div>

      {/* Laptop with code */}
      <div style={{
        position:'absolute', top:'30%', left:'15%',
        width:80, height:55,
      }}>
        {/* screen */}
        <div style={{
          width:80, height:45,
          background:'#0a0a0a', borderRadius:'4px 4px 0 0',
          border:'2px solid #333',
          overflow:'hidden', position:'relative',
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, overflow:'hidden' }}>
            <div style={{
              fontFamily:'monospace', fontSize:5, color:'#4ade80', lineHeight:1.6,
              animation:'sg-code-scroll 4s linear infinite',
              padding:3,
            }}>
              {`function buildMVP() {
  const idea = new App()
  idea.ship()
  return profit
}
git commit -m "fix"
npm run deploy
console.log('live!')
// TODO: sleep
const users = []
fetch('/api/v1')
  .then(r => r.json())
`}
              {`function buildMVP() {
  const idea = new App()
  idea.ship()
  return profit
}`}
            </div>
          </div>
          {/* screen glow */}
          <div style={{
            position:'absolute', inset:0,
            background:'rgba(74,222,128,0.03)',
            pointerEvents:'none',
          }} />
        </div>
        {/* keyboard */}
        <div style={{
          width:80, height:10,
          background:'#2a2a2a', borderRadius:'0 0 4px 4px',
          border:'2px solid #333', borderTop:'none',
        }} />
      </div>

      {/* Coffee with steam */}
      <div style={{
        position:'absolute', bottom:'38%', left:'10%',
        display:'flex', flexDirection:'column', alignItems:'center',
      }}>
        {/* steam */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:3, height:12,
            background:'rgba(200,200,200,0.4)',
            borderRadius:4,
            marginBottom:-4,
            marginLeft: i === 1 ? 8 : i === 2 ? -8 : 0,
            animation:`sg-steam ${1.5 + i * 0.4}s ease-out ${i * 0.5}s infinite`,
          }} />
        ))}
        <div style={{
          width:24, height:20, borderRadius:'4px 4px 8px 8px',
          background:'linear-gradient(180deg,#6b3a2a,#4a2510)',
          border:'2px solid #7a4a3a',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10,
        }}>☕</div>
      </div>

      {/* Pizza boxes */}
      <div style={{
        position:'absolute', bottom:'38%', right:'15%',
        display:'flex', flexDirection:'column', gap:-2,
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:36, height:8,
            background: i === 0 ? '#8b3a3a' : i === 1 ? '#7a3333' : '#6a2828',
            border:'1px solid #5a2020', borderRadius:2,
            marginBottom:-4,
            transform:`rotate(${(i-1)*2}deg)`,
          }} />
        ))}
      </div>

      {/* Developer figures */}
      {Array.from({ length: Math.min(devs, 3) }).map((_, i) => (
        <div key={i} style={{
          position:'absolute',
          bottom:'37%',
          left: `${35 + i * 18}%`,
          fontSize:22,
          animation:`sg-breathe ${2 + i * 0.3}s ease-in-out infinite`,
        }}>
          🧑‍💻
        </div>
      ))}

      {/* Designer if unlocked */}
      {hasDesigner && (
        <div style={{
          position:'absolute', bottom:'37%', left:'75%',
          fontSize:22,
          animation:'sg-breathe 2.4s ease-in-out infinite',
        }}>🎨</div>
      )}

      {/* Company name on wall */}
      <div style={{
        position:'absolute', top:'15%', left:'50%',
        transform:'translateX(-50%)',
        fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.15)',
        fontFamily:'monospace', letterSpacing:'0.2em', textTransform:'uppercase',
      }}>
        {companyName}
      </div>

      {/* Box labels */}
      <div style={{
        position:'absolute', bottom:'37%', left:14,
        display:'flex', flexDirection:'column', gap:4,
      }}>
        {['🗄️','📦','📦'].map((e,i) => (
          <div key={i} style={{ fontSize:16 }}>{e}</div>
        ))}
      </div>
    </div>
  )
}

// ── Small Office Scene ──
function SmallOfficeScene({ employees, equipment, tools, companyName }: SceneProps) {
  const devs = employees['dev'] || 0
  const designers = employees['designer'] || 0
  const marketers = employees['marketer'] || 0
  const hasSlack = tools['slack']
  const hasPlant = (equipment['snackbar'] || equipment['desks'])

  return (
    <div style={{
      width:'100%', height:'100%',
      background:'linear-gradient(180deg,#1a2030 0%,#0d1020 100%)',
      position:'relative', overflow:'hidden',
    }}>
      {/* Floor */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'35%',
        background:'linear-gradient(180deg,#1e1e2e 0%,#161626 100%)',
        borderTop:'2px solid #2a2a40',
      }} />

      {/* Window */}
      <div style={{
        position:'absolute', top:15, left:'50%', transform:'translateX(-50%)',
        width:120, height:70,
        background:'linear-gradient(180deg,#1a2a4a,#0d1a30)',
        border:'4px solid #2a2a40', borderRadius:4,
        overflow:'hidden',
      }}>
        {/* City view */}
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            position:'absolute', bottom:0,
            left: `${i * 22}%`, width:'15%',
            height: `${30 + i * 8}%`,
            background:'#1a2a3a',
            border:'1px solid #2a3a4a',
          }}>
            {/* windows on buildings */}
            {[0,1,2].map(j => (
              <div key={j} style={{
                position:'absolute', top: `${10 + j * 28}%`,
                left:'20%', width:'60%', height:'18%',
                background: Math.random() > 0.4 ? '#fbbf2444' : '#1a2a3a',
                borderRadius:1,
              }} />
            ))}
          </div>
        ))}
        <div style={{ position:'absolute', inset:0, background:'rgba(96,165,250,0.05)' }} />
      </div>

      {/* Post-its on wall */}
      {[
        { text:'🚀 Ship it!', top:'22%', left:'5%', rot:-3, color:'#fef08a' },
        { text:'Fix bugs', top:'28%', left:'8%', rot:2, color:'#bbf7d0' },
        { text:'📊 Analytics', top:'22%', right:'5%', rot:3, color:'#fde68a' },
      ].map((p, i) => (
        <div key={i} style={{
          position:'absolute', top:p.top, left:p.left, right:p.right,
          background:p.color, borderRadius:2,
          padding:'3px 5px', fontSize:7, color:'#333',
          transform:`rotate(${p.rot}deg)`,
          boxShadow:'1px 2px 4px rgba(0,0,0,0.3)',
        }}>
          {p.text}
        </div>
      ))}

      {/* Dev zone */}
      <div style={{
        position:'absolute', bottom:'36%', left:'5%',
        display:'flex', flexDirection:'column', gap:4,
      }}>
        <div style={{ fontSize:9, color:'#8888aa', marginBottom:2 }}>DEV ZONE</div>
        {Array.from({ length: Math.min(devs, 2) }).map((_, i) => (
          <div key={i} style={{ fontSize:18 }}>🧑‍💻</div>
        ))}
        {devs === 0 && <div style={{ fontSize:13, color:'#333' }}>🪑 Empty</div>}
      </div>

      {/* Design zone */}
      <div style={{
        position:'absolute', bottom:'36%', right:'5%',
        display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end',
      }}>
        <div style={{ fontSize:9, color:'#8888aa', marginBottom:2 }}>DESIGN ZONE</div>
        {Array.from({ length: Math.min(designers, 2) }).map((_, i) => (
          <div key={i} style={{ fontSize:18 }}>🎨</div>
        ))}
        {designers === 0 && <div style={{ fontSize:13, color:'#333' }}>🪑 Empty</div>}
      </div>

      {/* Desk row center */}
      <div style={{
        position:'absolute', bottom:'37%', left:'50%', transform:'translateX(-50%)',
        display:'flex', gap:8, alignItems:'center',
      }}>
        {marketers > 0 && <div style={{ fontSize:20 }}>📣</div>}
        <div style={{ width:60, height:20, background:'#2a2a40', borderRadius:4, border:'1px solid #3a3a55' }} />
        {marketers > 1 && <div style={{ fontSize:20 }}>📣</div>}
      </div>

      {/* Slack notifications popup */}
      {hasSlack && (
        <div style={{
          position:'absolute', top:'20%', right:'2%',
          background:'#3a1f5e', border:'1px solid #7c3aed44',
          borderRadius:8, padding:'5px 8px',
          animation:'sg-slack-pop 4s ease-in-out infinite',
        }}>
          <div style={{ fontSize:8, color:'#a78bfa', fontWeight:700 }}>💬 Slack</div>
          <div style={{ fontSize:7, color:'#e8e8f0', marginTop:1 }}>New message!</div>
        </div>
      )}

      {/* Plant (morale indicator) */}
      {hasPlant && (
        <div style={{
          position:'absolute', bottom:'37%', left:'50%', transform:'translateX(-50%)',
          fontSize:28, marginBottom:4,
          animation:'sg-breathe 3s ease-in-out infinite',
        }}>
          🪴
        </div>
      )}

      {/* Company sign */}
      <div style={{
        position:'absolute', bottom:'36%', left:'50%', transform:'translateX(-50%)',
        fontSize:10, color:'#60a5fa', fontWeight:800, whiteSpace:'nowrap',
        textShadow:'0 0 8px #60a5fa55',
      }}>
        {companyName.toUpperCase()}
      </div>
    </div>
  )
}

// ── Open Floor Plan Scene ──
function OpenPlanScene({ employees, equipment, tools, companyName }: SceneProps) {
  const devs = employees['dev'] || 0
  const marketers = employees['marketer'] || 0
  const hasPingPong = equipment['pingpong']
  const hasSlack = tools['slack']

  return (
    <div style={{
      width:'100%', height:'100%',
      background:'linear-gradient(180deg,#1a1510 0%,#0d0d08 100%)',
      position:'relative', overflow:'hidden',
    }}>
      {/* Exposed brick wall */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:'40%',
        backgroundImage:`repeating-linear-gradient(
          0deg, transparent, transparent 10px,
          rgba(60,30,20,0.3) 10px, rgba(60,30,20,0.3) 12px
        ), repeating-linear-gradient(
          90deg, transparent, transparent 25px,
          rgba(60,30,20,0.2) 25px, rgba(60,30,20,0.2) 27px
        )`,
        background:'#2a1a10',
      }} />

      {/* Neon sign */}
      <div style={{
        position:'absolute', top:15, left:'50%', transform:'translateX(-50%)',
        fontSize:11, fontWeight:900, color:'#4ade80', whiteSpace:'nowrap',
        animation:'sg-neon-blink 5s ease-in-out infinite',
        textShadow:'0 0 8px #4ade80, 0 0 20px #4ade80',
        letterSpacing:'0.1em',
      }}>
        WE&apos;RE HIRING
      </div>

      {/* Floor */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'35%',
        background:'linear-gradient(180deg,#1e1a10 0%,#151008 100%)',
        borderTop:'2px solid #2a2010',
      }} />

      {/* Ping pong table */}
      {hasPingPong && (
        <div style={{
          position:'absolute', bottom:'36%', left:'50%', transform:'translateX(-50%)',
          width:90, height:40,
          background:'linear-gradient(90deg,#1a6030,#1a7030,#1a6030)',
          border:'3px solid #2a7040', borderRadius:4,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ width:'100%', height:2, background:'#fff', opacity:0.5 }} />
          {/* Ball */}
          <div style={{
            position:'absolute',
            width:8, height:8, borderRadius:'50%',
            background:'#fff',
            animation:'sg-ping-pong 1.8s ease-in-out infinite',
            top:'40%',
          }} />
        </div>
      )}

      {/* Desk rows */}
      <div style={{
        position:'absolute', bottom:'36%', left:'5%', right:'5%',
        display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:4,
      }}>
        {Array.from({ length: Math.min(devs + marketers, 6) }).map((_, i) => (
          <div key={i} style={{
            width:30, height:18, background:'#2a2a2a', borderRadius:3,
            border:'1px solid #3a3a3a',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12,
          }}>
            {i < devs ? '🧑‍💻' : '📣'}
          </div>
        ))}
      </div>

      {/* Slack notification */}
      {hasSlack && (
        <div style={{
          position:'absolute', top:'30%', right:'2%',
          background:'#3a1f5e', border:'1px solid #7c3aed44',
          borderRadius:8, padding:'4px 8px',
          animation:'sg-slack-pop 5s ease-in-out 1s infinite',
        }}>
          <div style={{ fontSize:8, color:'#a78bfa', fontWeight:700 }}>💬 #general</div>
          <div style={{ fontSize:7, color:'#e8e8f0', marginTop:1 }}>just shipped 🚀</div>
        </div>
      )}

      {/* Company sign on wall */}
      <div style={{
        position:'absolute', top:'22%', left:'50%', transform:'translateX(-50%)',
        fontSize:13, fontWeight:900, color:'#fbbf24', opacity:0.7,
        whiteSpace:'nowrap', letterSpacing:'0.15em',
      }}>
        {companyName.toUpperCase()}
      </div>

      {/* Income graph deco */}
      <div style={{
        position:'absolute', bottom:'38%', right:'2%',
        width:50, height:40,
        display:'flex', alignItems:'flex-end', gap:2,
      }}>
        {[20,35,25,45,38,55,42,60].map((h,i) => (
          <div key={i} style={{
            width:4, height:h/2, background:'#4ade80',
            borderRadius:'1px 1px 0 0',
            opacity:0.5 + i * 0.06,
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Skyscraper HQ Scene ──
function SkyscraperScene({ employees, companyName, income, prestigeLevel }: SceneProps) {
  const totalStaff = Object.values(employees).reduce((a, b) => a + b, 0)

  return (
    <div style={{
      width:'100%', height:'100%',
      background:'linear-gradient(180deg,#050514 0%,#0a0a20 100%)',
      position:'relative', overflow:'hidden',
    }}>
      {/* City skyline */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, bottom:'30%',
        background:'linear-gradient(180deg,#050514 0%,#0d1030 100%)',
        overflow:'hidden',
      }}>
        {/* City buildings */}
        {[
          { left:'0%',  w:'12%', h:'55%', color:'#0d1530' },
          { left:'10%', w:'8%',  h:'70%', color:'#0d1a3a' },
          { left:'16%', w:'10%', h:'45%', color:'#0a1228' },
          { left:'24%', w:'7%',  h:'60%', color:'#0d1535' },
          { left:'56%', w:'9%',  h:'50%', color:'#0d1228' },
          { left:'63%', w:'12%', h:'75%', color:'#0a1530' },
          { left:'73%', w:'8%',  h:'55%', color:'#0d1a3a' },
          { left:'80%', w:'10%', h:'65%', color:'#0d1228' },
          { left:'88%', w:'8%',  h:'45%', color:'#0a1530' },
        ].map((b, i) => (
          <div key={i} style={{
            position:'absolute', bottom:0, left:b.left,
            width:b.w, height:b.h, background:b.color,
            borderTop:'1px solid #1a2a4a',
            overflow:'hidden',
          }}>
            {/* Building windows */}
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(3,1fr)',
              gap:2, padding:3, height:'100%',
            }}>
              {Array.from({ length:12 }).map((_, j) => (
                <div key={j} style={{
                  background: Math.random() > 0.5 ? '#fbbf2422' : 'transparent',
                  borderRadius:1,
                  animation:`sg-twinkle ${2 + j * 0.3}s ease-in-out ${j * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        ))}

        {/* Stars */}
        {Array.from({ length:20 }).map((_, i) => (
          <div key={i} style={{
            position:'absolute',
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            width:2, height:2, borderRadius:'50%',
            background:'#fff',
            animation:`sg-twinkle ${1.5 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
          }} />
        ))}
      </div>

      {/* Glass floor-to-ceiling windows */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(180deg,rgba(96,165,250,0.03) 0%,transparent 50%)',
        pointerEvents:'none',
      }} />

      {/* Office floor */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'35%',
        background:'linear-gradient(180deg,#1a1a2e 0%,#0d0d1a 100%)',
        borderTop:'2px solid #2a2a4a',
      }} />

      {/* Marble lobby accent */}
      <div style={{
        position:'absolute', bottom:'30%', left:0, right:0, height:4,
        background:'linear-gradient(90deg,#a78bfa55,#60a5fa55,#a78bfa55)',
      }} />

      {/* Holographic screen */}
      <div style={{
        position:'absolute', bottom:'36%', left:'50%', transform:'translateX(-50%)',
        width:100, height:50,
        background:'rgba(96,165,250,0.05)',
        border:'1px solid rgba(96,165,250,0.3)',
        borderRadius:6,
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:6,
      }}>
        <div style={{ fontSize:8, color:'#60a5fa66', marginBottom:3, letterSpacing:'0.1em' }}>
          COMPANY VALUE
        </div>
        <div style={{ fontSize:11, fontWeight:900, color:'#60a5fa' }}>
          {fmtCash(income * 3600)}/hr
        </div>
        {prestigeLevel > 0 && (
          <div style={{ fontSize:9, color:'#a78bfa', marginTop:2 }}>
            ×{prestigeLevel + 1} Prestige
          </div>
        )}
      </div>

      {/* Elevator */}
      <div style={{
        position:'absolute', bottom:'30%', right:'8%',
        width:30, height:70,
        background:'#1a1a2e', border:'2px solid #2a2a4a',
        borderRadius:'4px 4px 0 0',
        overflow:'hidden',
      }}>
        <div style={{
          width:'100%', height:'40%',
          background:'linear-gradient(180deg,#2a2a4a,#1a1a35)',
          animation:'sg-elevator 4s ease-in-out infinite',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:12,
        }}>🛗</div>
      </div>

      {/* Stock ticker */}
      <div style={{
        position:'absolute', bottom:'30%', left:0, right:0,
        overflow:'hidden', height:16,
        background:'rgba(13,13,26,0.8)',
        borderTop:'1px solid rgba(96,165,250,0.2)',
        borderBottom:'1px solid rgba(96,165,250,0.2)',
        display:'flex', alignItems:'center',
      }}>
        <div style={{
          whiteSpace:'nowrap', fontSize:9, color:'#4ade80',
          animation:'sg-ticker 12s linear infinite',
          paddingLeft:'100%',
          fontFamily:'monospace',
        }}>
          {companyName.toUpperCase()} ▲ +{(Math.random() * 5 + 1).toFixed(2)}%  •  TECH +1.2%  •  NASDAQ ▲  •  Series {['A','B','C','D'][Math.min(prestigeLevel, 3)]} Funding  •  {totalStaff} employees  •
        </div>
      </div>

      {/* Employee figures on floor */}
      <div style={{
        position:'absolute', bottom:'33%', left:'5%', right:'18%',
        display:'flex', gap:6, flexWrap:'wrap',
      }}>
        {EMPLOYEES.slice(0, 6).map(emp => {
          const count = employees[emp.id] || 0
          if (count === 0) return null
          return (
            <div key={emp.id} style={{ fontSize:18, animation:'sg-breathe 2.5s ease-in-out infinite' }}>
              {emp.emoji}
            </div>
          )
        })}
      </div>

      {/* Company name etched in glass */}
      <div style={{
        position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)',
        fontSize:16, fontWeight:900, color:'rgba(96,165,250,0.2)',
        whiteSpace:'nowrap', letterSpacing:'0.2em', textTransform:'uppercase',
        textShadow:'0 0 20px rgba(96,165,250,0.3)',
      }}>
        {companyName}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  BOTTOM SHEETS
// ─────────────────────────────────────────────────────────────

// ── Team Sheet ──
function TeamSheet({ gs, onHire, onBuyOffice, onBuyTool, onBuyEquip, teamTab, setTeamTab, income }: {
  gs: GameState
  onHire: (id:string)=>void
  onBuyOffice: (idx:number)=>void
  onBuyTool: (id:string)=>void
  onBuyEquip: (id:string)=>void
  teamTab: 'hire'|'offices'|'tools'|'equip'
  setTeamTab: (t:'hire'|'offices'|'tools'|'equip')=>void
  income: number
}) {
  const tabs: { id: 'hire'|'offices'|'tools'|'equip'; label:string }[] = [
    { id:'hire',    label:'👥 Hire' },
    { id:'offices', label:'🏢 Office' },
    { id:'tools',   label:'🔧 Tools' },
    { id:'equip',   label:'🎮 Equip' },
  ]

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:4 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTeamTab(t.id)}
            style={{
              flex:1, background:'none', border:'none',
              padding:'8px 4px', fontSize:11, fontWeight:700,
              color: teamTab === t.id ? '#4ade80' : '#8888aa',
              cursor:'pointer',
              borderBottom: teamTab === t.id ? '2px solid #4ade80' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Income display */}
      <div style={{ padding:'6px 16px', fontSize:11, color:'#8888aa' }}>
        Base income: <span style={{ color:'#4ade80', fontWeight:700 }}>+{fmtCash(income)}/s</span>
      </div>

      {teamTab === 'hire' && (
        <div>
          {EMPLOYEES.map(emp => {
            const owned = gs.employees[emp.id] || 0
            const cost = empCost(emp.id, owned)
            const canAfford = gs.cash >= cost
            const perSec = emp.income * (gs.officeIdx >= 0 ? OFFICES[gs.officeIdx].mult : 1)
            return (
              <SheetRow
                key={emp.id}
                left={<span>{emp.emoji} {emp.name} <span style={{ color:'#8888aa', fontSize:11 }}>×{owned}</span></span>}
                sub={`+${fmtCash(emp.income)}/s each • ${fmtCash(cost)} to hire`}
                right={
                  <GBtn
                    label={fmtCash(cost)}
                    color={canAfford ? '#4ade80' : '#555'}
                    onClick={() => onHire(emp.id)}
                    disabled={!canAfford}
                    small
                  />
                }
              />
            )
          })}
        </div>
      )}

      {teamTab === 'offices' && (
        <div>
          {OFFICES.map((off, idx) => {
            const owned = gs.officeIdx >= idx
            const canAfford = gs.cash >= off.cost && gs.officeIdx < idx
            const isCurrent = gs.officeIdx === idx
            return (
              <SheetRow
                key={off.id}
                left={<span style={{ color: isCurrent ? off.accent : '#f0f0ff' }}>
                  {isCurrent ? '✅ ' : ''}{off.name}
                </span>}
                sub={`${off.mult}× income multiplier • ${off.floors} floors${off.cost === 0 ? ' • Free' : ` • ${fmtCash(off.cost)}`}`}
                owned={owned}
                right={
                  isCurrent ? (
                    <span style={{ fontSize:11, color:'#4ade80', fontWeight:700 }}>CURRENT</span>
                  ) : owned ? (
                    <span style={{ fontSize:11, color:'#8888aa' }}>Unlocked</span>
                  ) : (
                    <GBtn
                      label={fmtCash(off.cost)}
                      color={canAfford ? off.accent : '#555'}
                      onClick={() => onBuyOffice(idx)}
                      disabled={!canAfford}
                      small
                    />
                  )
                }
              />
            )
          })}
        </div>
      )}

      {teamTab === 'tools' && (
        <div>
          {TOOLS.map(tool => {
            const owned = !!gs.tools[tool.id]
            const canAfford = gs.cash >= tool.cost && !owned
            return (
              <SheetRow
                key={tool.id}
                left={<span>{tool.emoji} {tool.name}</span>}
                sub={`${tool.mult}× income multiplier • ${fmtCash(tool.cost)}`}
                owned={owned}
                right={
                  owned ? (
                    <span style={{ fontSize:11, color:'#4ade80', fontWeight:700 }}>✅ Active</span>
                  ) : (
                    <GBtn
                      label={fmtCash(tool.cost)}
                      color={canAfford ? '#60a5fa' : '#555'}
                      onClick={() => onBuyTool(tool.id)}
                      disabled={!canAfford}
                      small
                    />
                  )
                }
              />
            )
          })}
        </div>
      )}

      {teamTab === 'equip' && (
        <div>
          {EQUIPMENT.map(eq => {
            const owned = !!gs.equipment[eq.id]
            const canAfford = gs.cash >= eq.cost && !owned
            return (
              <SheetRow
                key={eq.id}
                left={<span>{eq.emoji} {eq.name}</span>}
                sub={`${eq.mult}× income multiplier • ${fmtCash(eq.cost)}`}
                owned={owned}
                right={
                  owned ? (
                    <span style={{ fontSize:11, color:'#4ade80', fontWeight:700 }}>✅ Installed</span>
                  ) : (
                    <GBtn
                      label={fmtCash(eq.cost)}
                      color={canAfford ? '#fbbf24' : '#555'}
                      onClick={() => onBuyEquip(eq.id)}
                      disabled={!canAfford}
                      small
                    />
                  )
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Research Sheet ──
function ResearchSheet({ gs, onResearch, resTab, setResTab }: {
  gs: GameState
  onResearch: (id:string)=>void
  resTab: 'dev'|'infra'|'data'
  setResTab: (t:'dev'|'infra'|'data')=>void
}) {
  const tabs: { id:'dev'|'infra'|'data'; label:string; color:string }[] = [
    { id:'dev',   label:'💻 Dev',   color:'#4ade80' },
    { id:'infra', label:'☁️ Infra', color:'#60a5fa' },
    { id:'data',  label:'📊 Data',  color:'#fbbf24' },
  ]

  const branchNodes = RESEARCH.filter(r => r.branch === resTab)
  const totalBoost = RESEARCH
    .filter(r => gs.research[r.id])
    .reduce((acc, r) => acc * (1 + r.boost), 1)

  return (
    <div>
      {/* Gems + total boost */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 16px 10px', fontSize:12 }}>
        <span style={{ color:'#8888aa' }}>
          Balance: <span style={{ color:'#a78bfa', fontWeight:700 }}>{gs.gems} 💎</span>
        </span>
        <span style={{ color:'#8888aa' }}>
          Research boost: <span style={{ color:'#fbbf24', fontWeight:700 }}>×{totalBoost.toFixed(2)}</span>
        </span>
      </div>

      {/* Branch tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:4 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setResTab(t.id)}
            style={{
              flex:1, background:'none', border:'none',
              padding:'8px 4px', fontSize:12, fontWeight:700,
              color: resTab === t.id ? t.color : '#8888aa',
              cursor:'pointer',
              borderBottom: resTab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {branchNodes.map((node, idx) => {
          const owned = !!gs.research[node.id]
          const prevUnlocked = !node.prev || !!gs.research[node.prev]
          const canAfford = gs.gems >= node.cost && !owned && prevUnlocked
          const locked = !prevUnlocked
          return (
            <SheetRow
              key={node.id}
              left={
                <span style={{ opacity: locked ? 0.4 : 1 }}>
                  {owned ? '✅ ' : locked ? '🔒 ' : `${idx + 1}. `}{node.name}
                </span>
              }
              sub={locked ? 'Unlock previous node first' : `+${Math.round(node.boost * 100)}% income • ${node.cost} 💎`}
              owned={owned}
              right={
                owned ? (
                  <span style={{ fontSize:11, color:'#4ade80', fontWeight:700 }}>Researched</span>
                ) : (
                  <GBtn
                    label={`${node.cost} 💎`}
                    color={canAfford ? '#a78bfa' : '#555'}
                    onClick={() => onResearch(node.id)}
                    disabled={!canAfford || locked}
                    small
                  />
                )
              }
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Ship Sheet ──
function ShipSheet({ gs, shipCd, evDef, onShip, onClaimEvent, onWatchAd, effectiveIncome }: {
  gs: GameState
  shipCd: number
  evDef: typeof LIVE_EVENTS[0]
  onShip: ()=>void
  onClaimEvent: ()=>void
  onWatchAd: (t:'boost'|'gems'|'cash'|'spin')=>void
  effectiveIncome: number
}) {
  const shipReward = Math.max(500, effectiveIncome * 30)
  const eventPct = Math.min(1, gs.liveEvent.progress / evDef.goal)

  return (
    <div style={{ padding:'0 16px 16px' }}>
      {/* Ship Feature button */}
      <div style={{
        background:'linear-gradient(135deg,#0f2d1a,#1a3a28)',
        border:'1px solid #4ade8033',
        borderRadius:16, padding:20, marginBottom:14,
        textAlign:'center',
      }}>
        <div style={{ fontSize:13, color:'#8888aa', marginBottom:6 }}>
          🚀 Ship a feature to your users
        </div>
        <div style={{ fontWeight:900, fontSize:24, color:'#4ade80', marginBottom:12 }}>
          +{fmtCash(shipReward)}
        </div>
        {shipCd > 0 ? (
          <div>
            <div style={{
              background:'#1c1c35', borderRadius:10, padding:'10px 20px',
              color:'#8888aa', fontWeight:700, fontSize:14, marginBottom:10,
            }}>
              ⏳ Cooldown: {fmtTime(shipCd)}
            </div>
            <div style={{ fontSize:11, color:'#8888aa' }}>Total shipped: {gs.totalShips}</div>
          </div>
        ) : (
          <GBtn label="🚀 SHIP IT!" color="#4ade80" onClick={onShip} />
        )}
      </div>

      {/* Live Event */}
      <div style={{
        background:'linear-gradient(135deg,#1a1535,#0d0a25)',
        border:'1px solid #a78bfa33',
        borderRadius:16, padding:16, marginBottom:14,
      }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{evDef.name}</div>
        <div style={{ fontSize:12, color:'#8888aa', marginBottom:10 }}>
          {evDef.desc} → {evDef.rewardDesc}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ flex:1, height:8, background:'#2a2a3a', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:(eventPct * 100) + '%',
              background:'linear-gradient(90deg,#a78bfa,#60a5fa)',
              borderRadius:4, transition:'width 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize:11, color:'#a78bfa', fontWeight:700 }}>
            {gs.liveEvent.progress}/{evDef.goal}
          </span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <GBtn
            label={gs.liveEvent.claimed ? '✅ Claimed' : 'Claim Reward'}
            color="#a78bfa"
            onClick={onClaimEvent}
            disabled={gs.liveEvent.claimed || gs.liveEvent.progress < evDef.goal}
            small
          />
          <span style={{ fontSize:11, color:'#8888aa' }}>
            ⏰ {fmtTime(gs.liveEventTimer)} remaining
          </span>
        </div>
      </div>

      {/* Ad Rewards */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, color:'#8888aa', marginBottom:8, fontWeight:700 }}>📺 WATCH ADS FOR BONUSES</div>
        {[
          { type:'boost' as const, label:'⚡ Watch for 2× Boost (60s)', color:'#fbbf24' },
          { type:'gems'  as const, label:'💎 Watch for +15 Gems',       color:'#a78bfa' },
          { type:'cash'  as const, label:`💰 Watch for ${fmtCash(Math.max(1000, effectiveIncome*60))} Cash`, color:'#4ade80' },
        ].map(a => (
          <div key={a.type} style={{ marginBottom:8 }}>
            <GBtn label={a.label} color={a.color} onClick={() => onWatchAd(a.type)} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── More Sheet ──
function MoreSheet({ gs, onSpin, spinResult, spinAnimIdx, setSpinResult, onClaimMission, onClaimStreak, onStartInvestor, investorActive, investorTaps, investorTimer, investorDone, onInvestorTap, onInvestorEnd, onWatchAd, showIPO, onIPO, onToggleSfx }: {
  gs: GameState
  onSpin: ()=>void
  spinResult: typeof SPIN_REWARDS[0] | null
  spinAnimIdx: number | null
  setSpinResult: (r: typeof SPIN_REWARDS[0] | null)=>void
  onClaimMission: (i:number)=>void
  onClaimStreak: ()=>void
  onStartInvestor: ()=>void
  investorActive: boolean
  investorTaps: number
  investorTimer: number
  investorDone: boolean
  onInvestorTap: ()=>void
  onInvestorEnd: ()=>void
  onWatchAd: (t:'boost'|'gems'|'cash'|'spin')=>void
  showIPO: boolean
  onIPO: ()=>void
  onToggleSfx: ()=>void
}) {
  const today = todayStr()
  const canSpin = gs.spunDate !== today
  const streakDay = ((gs.loginStreak - 1) % 7) + 1

  const lbEntries = [
    { name: gs.companyName, val: gs.companyValue, isPlayer: true },
    ...LEADERBOARD_RIVALS,
  ].sort((a, b) => b.val - a.val)

  return (
    <div style={{ padding:'0 0 20px' }}>

      {/* IPO Banner */}
      {showIPO && (
        <div style={{
          margin:'0 16px 14px',
          background:'linear-gradient(135deg,#1a1535,#0d0a25)',
          border:'2px solid #a78bfa',
          borderRadius:16, padding:16, textAlign:'center',
          animation:'sg-pulse 2s ease-in-out infinite',
        }}>
          <div style={{ fontWeight:900, fontSize:16, color:'#a78bfa', marginBottom:6 }}>🎉 IPO READY!</div>
          <div style={{ fontSize:12, color:'#8888aa', marginBottom:12 }}>
            Your company hit $1B! Go public for Prestige {gs.prestigeLevel + 1}.
          </div>
          <GBtn label="🚀 Go Public!" color="#a78bfa" onClick={onIPO} />
        </div>
      )}

      {/* Daily Spin */}
      <div style={{
        margin:'0 16px 14px',
        background:'linear-gradient(135deg,#1a1525,#0d0a20)',
        border:'1px solid #a78bfa33',
        borderRadius:16, padding:16,
      }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:10, display:'flex', justifyContent:'space-between' }}>
          <span>🎰 Daily Spin</span>
          {!canSpin && <span style={{ fontSize:11, color:'#8888aa' }}>Used today</span>}
        </div>
        {spinResult && (
          <div style={{
            textAlign:'center', marginBottom:12,
            background:'#1c1c35', borderRadius:10, padding:10,
            animation:'sg-pop 0.4s ease-out',
          }}>
            <div style={{ fontSize:20, marginBottom:4 }}>🎉</div>
            <div style={{ fontWeight:800, color:'#4ade80' }}>You won: {spinResult.label}</div>
            <button
              onClick={() => setSpinResult(null)}
              style={{ marginTop:8, background:'none', border:'1px solid #8888aa44', borderRadius:8, color:'#8888aa', padding:'4px 12px', fontSize:11, cursor:'pointer' }}
            >
              Close
            </button>
          </div>
        )}
        {/* Spin wheel display */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
          {SPIN_REWARDS.map((r, i) => (
            <div key={i} style={{
              flex:'1 1 calc(25% - 4px)', textAlign:'center',
              background: spinAnimIdx === i ? '#2a3a4a' : '#1c1c35',
              borderRadius:8, padding:'6px 4px',
              fontSize:9, fontWeight:700,
              color: spinAnimIdx === i ? '#fbbf24' : '#8888aa',
              border: spinAnimIdx === i ? '1px solid #fbbf24' : '1px solid transparent',
              transition:'all 0.1s',
            }}>
              {r.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <GBtn
            label={canSpin ? '🎰 Spin!' : 'Already Spun'}
            color={canSpin ? '#a78bfa' : '#555'}
            onClick={canSpin && !spinAnimIdx ? onSpin : ()=>{}}
            disabled={!canSpin || !!spinAnimIdx}
          />
          {!canSpin && (
            <GBtn label="📺 Watch to Reset" color="#fbbf24" onClick={() => onWatchAd('spin')} small />
          )}
        </div>
      </div>

      {/* Login Streak */}
      <div style={{
        margin:'0 16px 14px',
        background:'linear-gradient(135deg,#1a1520,#0d0a18)',
        border:'1px solid #fbbf2433',
        borderRadius:16, padding:16,
      }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>📅 Login Streak</div>
        <div style={{ display:'flex', gap:4, marginBottom:10 }}>
          {Array.from({ length:7 }).map((_, i) => {
            const dayNum = i + 1
            const claimed = dayNum < streakDay || (dayNum === streakDay && gs.streakClaimed)
            const isToday = dayNum === streakDay
            return (
              <div key={i} style={{
                flex:1, textAlign:'center',
                background: claimed ? '#1a3a28' : isToday ? '#2a2010' : '#1c1c35',
                borderRadius:8, padding:'5px 2px',
                border: isToday ? '1px solid #fbbf24' : '1px solid transparent',
              }}>
                <div style={{ fontSize:9, color: claimed ? '#4ade80' : isToday ? '#fbbf24' : '#8888aa' }}>
                  {claimed ? '✅' : isToday ? '⭐' : `D${dayNum}`}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <GBtn
            label={gs.streakClaimed ? '✅ Claimed' : `Claim Day ${streakDay}`}
            color={gs.streakClaimed ? '#555' : '#fbbf24'}
            onClick={gs.streakClaimed ? ()=>{} : onClaimStreak}
            disabled={gs.streakClaimed}
            small
          />
          <span style={{ fontSize:11, color:'#8888aa' }}>🔥 {gs.loginStreak} day streak</span>
        </div>
      </div>

      {/* Daily Missions */}
      <div style={{
        margin:'0 16px 14px',
        background:'linear-gradient(135deg,#141a14,#0d0d10)',
        border:'1px solid #4ade8033',
        borderRadius:16, padding:16,
      }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>📋 Daily Missions</div>
        {gs.dailyMissions.map((m, i) => {
          const prog = getMissionProgress(m, gs)
          const pct = Math.min(1, prog / m.goal)
          const done = pct >= 1
          return (
            <div key={m.id} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:600, color: m.claimed ? '#555' : '#f0f0ff' }}>
                  {m.claimed ? '✅ ' : ''}{m.desc}
                </span>
                <span style={{ fontSize:11, color:'#8888aa' }}>
                  {m.reward.gems ? `${m.reward.gems} 💎` : fmtCash(m.reward.cash!)}
                </span>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ flex:1, height:5, background:'#1c1c35', borderRadius:3, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', width:(pct * 100) + '%',
                    background: done ? '#4ade80' : '#60a5fa',
                    borderRadius:3, transition:'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize:10, color:'#8888aa', minWidth:40 }}>
                  {fmt(prog)}/{fmt(m.goal)}
                </span>
                {done && !m.claimed && (
                  <GBtn label="Claim" color="#4ade80" onClick={() => onClaimMission(i)} small />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Investor Meeting */}
      <div style={{
        margin:'0 16px 14px',
        background:'linear-gradient(135deg,#151a20,#0d1015)',
        border:'1px solid #60a5fa33',
        borderRadius:16, padding:16,
      }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:8 }}>🤝 Investor Meeting</div>
        <div style={{ fontSize:12, color:'#8888aa', marginBottom:12 }}>
          Tap as fast as you can for 10 seconds!
          Earn {fmtCash(Math.max(50, Math.floor(gs.companyValue * 0.0005)))} per tap.
        </div>
        {!investorActive && !investorDone && (
          <GBtn label="Start Meeting" color="#60a5fa" onClick={onStartInvestor} />
        )}
        {investorActive && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:32, fontWeight:900, color:'#fbbf24', marginBottom:4 }}>
              {investorTimer}s
            </div>
            <div style={{ fontSize:14, color:'#4ade80', marginBottom:8 }}>
              {investorTaps} taps
            </div>
            <button
              onClick={onInvestorTap}
              style={{
                width:100, height:100, borderRadius:'50%',
                background:'linear-gradient(135deg,#1a3a5a,#0d2030)',
                border:'3px solid #60a5fa',
                fontSize:32, cursor:'pointer',
                animation:'sg-pulse 0.5s ease-in-out infinite',
              }}
            >
              🤝
            </button>
            <div style={{ marginTop:8 }}>
              <GBtn label="End Meeting" color="#f87171" onClick={onInvestorEnd} small />
            </div>
          </div>
        )}
        {investorDone && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:14, color:'#4ade80', marginBottom:8 }}>
              ✅ Done! {investorTaps} taps total.
            </div>
            <GBtn label="Start Again" color="#60a5fa" onClick={onStartInvestor} small />
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div style={{
        margin:'0 16px 14px',
        background:'linear-gradient(135deg,#1a1520,#0d0a18)',
        border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:16, padding:16,
      }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>🏆 Leaderboard</div>
        {lbEntries.slice(0, 6).map((e, i) => (
          <div key={i} style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)',
            background: e.isPlayer ? 'rgba(74,222,128,0.05)' : 'transparent',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:13, color: i === 0 ? '#fbbf24' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#555', fontWeight:800, minWidth:20 }}>
                {i + 1}
              </span>
              <span style={{ fontSize:12, fontWeight: e.isPlayer ? 800 : 400, color: e.isPlayer ? '#4ade80' : '#f0f0ff' }}>
                {e.name}{e.isPlayer ? ' (You)' : ''}
              </span>
            </div>
            <span style={{ fontSize:11, color:'#8888aa' }}>{fmtCash(e.val)}</span>
          </div>
        ))}
      </div>

      {/* Gem Store */}
      <div style={{
        margin:'0 16px 14px',
        background:'linear-gradient(135deg,#1a1535,#0d0a25)',
        border:'1px solid #a78bfa33',
        borderRadius:16, padding:16,
      }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>💎 Gem Store</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {GEM_PACKS.map((pack, i) => (
            <div key={i} style={{
              background:'#1c1c35', borderRadius:12, padding:'10px 8px',
              textAlign:'center', border:'1px solid rgba(167,139,250,0.2)',
              position:'relative',
            }}>
              {i === 3 && (
                <div style={{
                  position:'absolute', top:-6, right:-6,
                  background:'#fbbf24', borderRadius:8, padding:'1px 5px',
                  fontSize:8, fontWeight:800, color:'#0d0d1a',
                }}>BEST</div>
              )}
              <div style={{ fontWeight:800, fontSize:16, color:'#a78bfa', marginBottom:2 }}>
                💎 {pack.gems}
              </div>
              <div style={{ fontSize:10, color:'#8888aa', marginBottom:4 }}>{pack.label}</div>
              {pack.bonus && <div style={{ fontSize:9, color:'#4ade80', marginBottom:6 }}>{pack.bonus}</div>}
              <div style={{
                background:'linear-gradient(135deg,#a78bfa99,#a78bfa55)',
                border:'1px solid #a78bfa66',
                borderRadius:8, padding:'5px 0',
                fontSize:13, fontWeight:800, color:'#a78bfa',
                cursor:'pointer',
              }}>
                {pack.price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{ margin:'0 16px 14px' }}>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>⚙️ Settings</div>
        <SheetRow
          left="🔊 Sound Effects"
          sub={gs.sfxEnabled ? 'Enabled' : 'Disabled'}
          right={
            <button
              onClick={onToggleSfx}
              style={{
                width:44, height:24, borderRadius:12,
                background: gs.sfxEnabled ? '#4ade80' : '#2a2a3a',
                border:'none', cursor:'pointer', position:'relative',
                transition:'background 0.2s',
              }}
            >
              <div style={{
                width:18, height:18, borderRadius:'50%', background:'#fff',
                position:'absolute', top:3,
                left: gs.sfxEnabled ? 23 : 3,
                transition:'left 0.2s',
              }} />
            </button>
          }
        />
        <SheetRow
          left="🎮 Version"
          sub={`Silicon Grind v${VERSION}`}
          right={<span style={{ fontSize:11, color:'#555' }}>{gs.daysPlayed}d played</span>}
        />
      </div>
    </div>
  )
}