import Link from 'next/link';
import {
  Wind,
  Thermometer,
  CloudRain,
  Mountain,
  AlertTriangle,
  Shield,
  Signal,
  LifeBuoy,
  Upload,
  Activity,
  ChevronRight,
  Bike,
  Footprints,
  Clock,
  Map,
  Droplets,
  Eye,
  Sun,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { LogoIcon } from '@/app/_components/logo-icon';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090f] text-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <ImportSources />
      <DataSources />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ─── NAV ─────────────────────────────────────────────────── */
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#08090f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="h-7 w-7 text-[#3b82f6]" />
          <span className="font-heading text-lg font-bold tracking-tight">peakOne</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#2563eb]"
          >
            Empezar gratis <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── HERO ────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#1d4ed8]/15 blur-[120px]" />
        <div className="absolute top-40 left-1/4 h-[300px] w-[400px] rounded-full bg-[#0ea5e9]/8 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-1.5 text-xs font-medium text-[#93c5fd]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
            Análisis meteorológico de ruta · Open-Meteo API
          </span>
        </div>

        <h1 className="font-heading mb-6 text-center text-5xl leading-tight font-bold tracking-tight md:text-7xl">
          Conoce cada kilómetro
          <br />
          <span className="bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#38bdf8] bg-clip-text text-transparent">
            antes de salir
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-lg leading-relaxed text-white/55">
          Sube tu ruta GPX o importa desde Strava. peakOne analiza el tiempo, el terreno y los
          riesgos <strong className="text-white/80">punto a punto</strong> — temperatura, viento,
          lluvia, pendientes, cobertura móvil y mucho más.
        </p>

        <div className="mb-16 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#3b82f6]/25 transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/40"
          >
            Analizar mi ruta <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-base font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
          >
            Ver características
          </a>
        </div>

        {/* Stats */}
        <div className="mb-14 flex flex-wrap items-center justify-center gap-8">
          {[
            { value: '50+', label: 'variables meteorológicas' },
            { value: 'km a km', label: 'análisis punto a punto' },
            { value: 'GPX · Strava · Wikiloc', label: 'fuentes de importación' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-heading text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* App Mockup */}
        <AppMockup />
      </div>
    </section>
  );
}

/* ─── APP MOCKUP ──────────────────────────────────────────── */
function AppMockup() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Outer glow */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-[#3b82f6]/20 to-transparent blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1624] shadow-2xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-white/8 bg-[#0a0e1a] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ef4444]/70" />
            <div className="h-3 w-3 rounded-full bg-[#f59e0b]/70" />
            <div className="h-3 w-3 rounded-full bg-[#22c55e]/70" />
          </div>
          <div className="mx-auto rounded-md bg-white/5 px-8 py-1 text-center text-[10px] text-white/30">
            peakone.app/route
          </div>
        </div>

        {/* Map + route visualization */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#1a2a4a] via-[#1e3a5f] to-[#162038]">
          {/* Terrain texture lines */}
          <svg className="absolute inset-0 h-full w-full opacity-15" preserveAspectRatio="none">
            <defs>
              <pattern id="terrain" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 20 Q 10 10 20 20 Q 30 30 40 20" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#terrain)" />
          </svg>

          {/* Route SVG */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 208" preserveAspectRatio="none">
            {/* Route casing */}
            <path
              d="M 20 160 Q 80 140 120 120 Q 180 90 240 80 Q 300 70 360 85 Q 420 100 480 60 Q 540 30 600 45 Q 660 60 720 40 Q 760 30 780 35"
              fill="none" stroke="white" strokeWidth="8" strokeLinecap="round"
            />
            {/* Route base */}
            <path
              d="M 20 160 Q 80 140 120 120 Q 180 90 240 80 Q 300 70 360 85 Q 420 100 480 60 Q 540 30 600 45 Q 660 60 720 40 Q 760 30 780 35"
              fill="none" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round"
            />
            {/* Direction arrows */}
            <text fill="#3b82f6" fontSize="14" fontWeight="bold">
              <textPath href="#routepath" startOffset="20%">›</textPath>
              <textPath href="#routepath" startOffset="45%">›</textPath>
              <textPath href="#routepath" startOffset="70%">›</textPath>
            </text>
            <defs>
              <path id="routepath" d="M 20 160 Q 80 140 120 120 Q 180 90 240 80 Q 300 70 360 85 Q 420 100 480 60 Q 540 30 600 45 Q 660 60 720 40 Q 760 30 780 35" />
            </defs>
          </svg>

          {/* Start / End markers */}
          <div className="absolute bottom-8 left-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold text-white shadow-lg shadow-[#22c55e]/40">A</div>
          <div className="absolute top-6 right-8 flex h-6 w-6 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-lg shadow-[#ef4444]/40">B</div>

          {/* Weather overlay cards */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
              <Thermometer className="h-3.5 w-3.5 text-[#f97316]" />
              <span className="text-xs font-semibold text-white">22°C</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
              <Wind className="h-3.5 w-3.5 text-[#60a5fa]" />
              <span className="text-xs font-semibold text-white">18 km/h</span>
            </div>
          </div>

          {/* Risk marker on map */}
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#f59e0b]/90 px-2 py-1 shadow-lg shadow-[#f59e0b]/30">
            <AlertTriangle className="h-3 w-3 text-white" />
            <span className="text-[10px] font-bold text-white">Rampa dura</span>
          </div>

          {/* Map type badge */}
          <div className="absolute top-3 right-3 rounded-md bg-black/50 px-2 py-1 text-[10px] text-white/60 backdrop-blur-sm">
            Topografía
          </div>
        </div>

        {/* Weather stats strip */}
        <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/8 bg-[#0c111e]">
          {[
            { icon: <Thermometer className="h-3.5 w-3.5 text-[#f97316]" />, label: 'Temp. media', value: '22°C', sub: 'Sensación 20°C' },
            { icon: <Wind className="h-3.5 w-3.5 text-[#60a5fa]" />, label: 'Viento máx.', value: '28 km/h', sub: '12% de cara' },
            { icon: <CloudRain className="h-3.5 w-3.5 text-[#818cf8]" />, label: 'Prob. lluvia', value: '5%', sub: 'Sin precipitación' },
            { icon: <Eye className="h-3.5 w-3.5 text-[#34d399]" />, label: 'Visibilidad', value: '> 10 km', sub: 'Excelente' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5 p-3">
              <div className="flex items-center gap-1 text-white/40">
                {stat.icon}
                <span className="text-[9px]">{stat.label}</span>
              </div>
              <div className="text-sm font-bold text-white">{stat.value}</div>
              <div className="text-[9px] text-white/30">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Elevation profile */}
        <div className="bg-[#0a0e1a] px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/40">Perfil de elevación · 48 km</span>
            <span className="text-[10px] text-white/30">D+ 1.240 m</span>
          </div>
          <svg viewBox="0 0 760 60" className="h-14 w-full">
            <defs>
              <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Filled area */}
            <path
              d="M 0 58 L 0 45 Q 60 40 100 35 Q 160 28 200 30 Q 240 32 280 18 Q 320 5 380 8 Q 420 10 460 14 Q 500 18 540 12 Q 580 6 620 10 Q 660 14 700 18 Q 730 20 760 16 L 760 58 Z"
              fill="url(#elev)"
            />
            {/* Profile line */}
            <path
              d="M 0 45 Q 60 40 100 35 Q 160 28 200 30 Q 240 32 280 18 Q 320 5 380 8 Q 420 10 460 14 Q 500 18 540 12 Q 580 6 620 10 Q 660 14 700 18 Q 730 20 760 16"
              fill="none" stroke="#3b82f6" strokeWidth="1.5"
            />
            {/* Slope color segments */}
            <path d="M 0 45 Q 60 40 100 35 Q 160 28 200 30" fill="none" stroke="#22c55e" strokeWidth="3" />
            <path d="M 200 30 Q 240 32 280 18 Q 310 8 340 6" fill="none" stroke="#f59e0b" strokeWidth="3" />
            <path d="M 340 6 Q 360 5 380 8" fill="none" stroke="#ef4444" strokeWidth="3" />
            <path d="M 380 8 Q 420 10 460 14 Q 500 18 540 12" fill="none" stroke="#22c55e" strokeWidth="3" />
            <path d="M 540 12 Q 580 6 620 10" fill="none" stroke="#f59e0b" strokeWidth="3" />
            <path d="M 620 10 Q 660 14 700 18 Q 730 20 760 16" fill="none" stroke="#22c55e" strokeWidth="3" />
            {/* Peak label */}
            <text x="378" y="3" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">2.180m</text>
            <line x1="380" y1="5" x2="380" y2="8" stroke="#ef4444" strokeWidth="1" />
          </svg>
          <div className="mt-1 flex gap-3">
            {[
              { color: '#22c55e', label: 'Fácil (< 4%)' },
              { color: '#f59e0b', label: 'Moderado (4–8%)' },
              { color: '#ef4444', label: 'Duro (> 8%)' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1">
                <div className="h-1.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] text-white/30">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FEATURES ────────────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: <CloudRain className="h-5 w-5" />,
      color: '#818cf8',
      bg: '#818cf8/10',
      title: 'Meteorología punto a punto',
      description:
        'Temperatura, viento, lluvia, visibilidad e índice solar en cada kilómetro de tu ruta. No solo en el inicio o el destino.',
      visual: <WeatherVisual />,
    },
    {
      icon: <Mountain className="h-5 w-5" />,
      color: '#3b82f6',
      bg: '#3b82f6/10',
      title: 'Perfil de elevación y pendientes',
      description:
        'Visualiza dónde están las rampas duras antes de salir. Coloreado automático por dificultad de pendiente.',
      visual: <ElevationVisual />,
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      color: '#f59e0b',
      bg: '#f59e0b/10',
      title: 'Detección de riesgos',
      description:
        'Identifica automáticamente subidas exigentes, descensos peligrosos y tramos de estrés térmico con nivel de riesgo.',
      visual: <HazardVisual />,
    },
    {
      icon: <LifeBuoy className="h-5 w-5" />,
      color: '#10b981',
      bg: '#10b981/10',
      title: 'Puntos de evacuación',
      description:
        'Núcleos urbanos, carreteras principales y refugios de montaña a menos de 2,5 km de la ruta detectados automáticamente.',
      visual: <EscapeVisual />,
    },
    {
      icon: <Signal className="h-5 w-5" />,
      color: '#f97316',
      bg: '#f97316/10',
      title: 'Cobertura móvil',
      description:
        'Mapa de calor sobre la ruta que indica las zonas sin señal o con cobertura limitada. Datos reales de torres de telefonía.',
      visual: <CoverageVisual />,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      color: '#a855f7',
      bg: '#a855f7/10',
      title: 'Ventana óptima de salida',
      description:
        'Analiza las próximas 12 horas y sugiere el mejor momento para salir según viento, temperatura y probabilidad de lluvia.',
      visual: <WindowVisual />,
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">
            Características
          </span>
        </div>
        <h2 className="font-heading mb-4 text-center text-4xl font-bold">
          Todo lo que necesitas saber
        </h2>
        <p className="mx-auto mb-16 max-w-xl text-center text-white/50">
          Un análisis completo de tu ruta antes de salir. Sin sorpresas.
        </p>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        {/* Extra features list */}
        <div className="mt-10 rounded-2xl border border-white/6 bg-white/2 p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
            También incluye
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              'Fuentes de agua fiables',
              'Tipo de firme y superficie',
              'Riesgo de barro',
              'Equipo de nieve recomendado',
              'Exposición solar',
              'Viento relativo (cola/frente)',
              'IBP Index de dificultad',
              'Rutas guardadas localmente',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#3b82f6]" />
                <span className="text-xs text-white/50">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  color,
  title,
  description,
  visual,
}: {
  icon: React.ReactNode;
  color: string;
  bg?: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/7 bg-[#0d1120] transition-all hover:border-white/15">
      {/* Visual mockup */}
      <div className="border-b border-white/5 bg-[#0a0e1a] p-4">{visual}</div>
      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
        <h3 className="font-heading text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs leading-relaxed text-white/45">{description}</p>
      </div>
    </div>
  );
}

/* ─── FEATURE VISUALS (mini mockups) ─────────────────────── */
function WeatherVisual() {
  const points = [
    { km: '0', temp: '14°', wind: 12, rain: 0, icon: '☀️' },
    { km: '10', temp: '18°', wind: 18, rain: 5, icon: '⛅' },
    { km: '20', temp: '22°', wind: 25, rain: 10, icon: '🌤️' },
    { km: '30', temp: '20°', wind: 20, rain: 40, icon: '🌧️' },
    { km: '40', temp: '17°', wind: 15, rain: 20, icon: '⛅' },
  ];
  return (
    <div className="flex items-end justify-between gap-1">
      {points.map((p) => (
        <div key={p.km} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-base">{p.icon}</span>
          <div
            className="w-full rounded-sm bg-gradient-to-t from-[#3b82f6]/60 to-[#60a5fa]/30"
            style={{ height: `${Math.max(8, p.wind * 1.5)}px` }}
          />
          <span className="text-[9px] font-bold text-white/80">{p.temp}</span>
          <span className="text-[8px] text-white/30">km {p.km}</span>
        </div>
      ))}
    </div>
  );
}

function ElevationVisual() {
  return (
    <div>
      <svg viewBox="0 0 280 56" className="w-full">
        <defs>
          <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d="M0 54 L0 40 Q40 34 70 28 Q100 22 130 14 Q155 8 175 10 Q200 12 220 20 Q245 28 280 24 L280 54Z" fill="url(#eg)" />
        <path d="M0 40 Q40 34 70 28 Q100 22 130 14 Q155 8 175 10 Q200 12 220 20 Q245 28 280 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        <path d="M0 40 Q40 34 70 28" stroke="#22c55e" strokeWidth="2.5" fill="none" />
        <path d="M70 28 Q100 22 130 14 Q150 9 165 9" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
        <path d="M165 9 Q170 8 175 10" stroke="#ef4444" strokeWidth="2.5" fill="none" />
        <path d="M175 10 Q200 12 220 20 Q245 28 280 24" stroke="#22c55e" strokeWidth="2.5" fill="none" />
        <circle cx="174" cy="8" r="3" fill="#ef4444" />
        <text x="174" y="4" textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold">cima</text>
      </svg>
      <div className="mt-1.5 flex gap-2.5">
        {[['#22c55e','Fácil'],['#f59e0b','Moderado'],['#ef4444','Duro']].map(([c,l])=>(
          <div key={l} className="flex items-center gap-1">
            <div className="h-1.5 w-2.5 rounded-full" style={{backgroundColor:c}}/>
            <span className="text-[8px] text-white/30">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HazardVisual() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { label: 'Subida exigente', km: 'km 12–18', level: 'ALTO', color: '#ef4444', bar: 85 },
        { label: 'Estrés térmico', km: 'km 24–30', level: 'MEDIO', color: '#f59e0b', bar: 55 },
        { label: 'Descenso técnico', km: 'km 38–42', level: 'ALTO', color: '#ef4444', bar: 75 },
      ].map((h) => (
        <div key={h.label} className="rounded-lg border border-white/5 bg-white/3 px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" style={{ color: h.color }} />
              <span className="text-[10px] font-semibold text-white/80">{h.label}</span>
            </div>
            <span className="rounded px-1 py-0.5 text-[8px] font-bold" style={{ backgroundColor: `${h.color}20`, color: h.color }}>
              {h.level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${h.bar}%`, backgroundColor: h.color }} />
            </div>
            <span className="text-[8px] text-white/30">{h.km}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EscapeVisual() {
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-[#0f2040] to-[#1a3a5c]">
      {/* Fake map contour lines */}
      <svg className="absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="none">
        {[20,35,50,65,80].map(y=>(
          <ellipse key={y} cx="140" cy={y} rx="120" ry="12" fill="none" stroke="#60a5fa" strokeWidth="0.5"/>
        ))}
      </svg>
      {/* Route */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 112" preserveAspectRatio="none">
        <path d="M10 90 Q60 70 110 55 Q160 40 200 48 Q240 55 270 42" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <path d="M10 90 Q60 70 110 55 Q160 40 200 48 Q240 55 270 42" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      {/* Escape point markers */}
      <div className="absolute top-6 left-[38%] flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366f1] shadow-lg shadow-[#6366f1]/40">
          <span className="text-[8px]">🏠</span>
        </div>
        <div className="mt-0.5 rounded bg-black/60 px-1 text-[7px] text-white/80">1.2 km</div>
      </div>
      <div className="absolute top-3 left-[68%] flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] shadow-lg shadow-[#f59e0b]/40">
          <span className="text-[8px]">⛺</span>
        </div>
        <div className="mt-0.5 rounded bg-black/60 px-1 text-[7px] text-white/80">0.8 km</div>
      </div>
      <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
        <span className="text-[9px] font-semibold text-[#10b981]">5 puntos detectados</span>
      </div>
    </div>
  );
}

function CoverageVisual() {
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-[#0f2040] to-[#1a3a5c]">
      {/* Route */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 112" preserveAspectRatio="none">
        <path d="M10 80 Q70 60 120 50 Q170 40 210 55 Q240 65 270 50" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <path d="M10 80 Q70 60 120 50 Q170 40 210 55 Q240 65 270 50" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      {/* Heatmap blobs for no coverage */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 112">
        <defs>
          <radialGradient id="h1" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="h2" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="130" cy="48" rx="35" ry="20" fill="url(#h1)"/>
        <ellipse cx="215" cy="55" rx="28" ry="18" fill="url(#h2)"/>
      </svg>
      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
        <span className="text-[9px] font-semibold text-[#f59e0b]">2 zonas sin cobertura</span>
      </div>
    </div>
  );
}

function WindowVisual() {
  const windows = [
    { time: '06:00', score: 92, good: true },
    { time: '08:00', score: 88, good: true },
    { time: '10:00', score: 71, good: true },
    { time: '12:00', score: 45, good: false },
    { time: '14:00', score: 30, good: false },
    { time: '16:00', score: 62, good: false },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 text-[9px] font-medium text-white/30">Próximas 12 horas</div>
      {windows.map((w) => (
        <div key={w.time} className="flex items-center gap-2">
          <span className="w-10 text-[9px] text-white/40">{w.time}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${w.score}%`,
                backgroundColor: w.good ? '#22c55e' : '#ef4444',
                opacity: w.good ? 1 : 0.6,
              }}
            />
          </div>
          <span className="w-7 text-right text-[9px] font-bold" style={{ color: w.good ? '#22c55e' : '#ef4444' }}>
            {w.score}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-[#22c55e]/10 px-2 py-1">
        <Zap className="h-3 w-3 text-[#22c55e]" />
        <span className="text-[9px] font-semibold text-[#22c55e]">Recomendado: salida a las 06:00</span>
      </div>
    </div>
  );
}

/* ─── HOW IT WORKS ────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: <Upload className="h-6 w-6" />,
      title: 'Importa tu ruta',
      description:
        'Sube un archivo GPX, importa directamente desde Strava (actividades y rutas guardadas) o pega un enlace de Wikiloc.',
      color: '#3b82f6',
    },
    {
      n: '02',
      icon: <Clock className="h-6 w-6" />,
      title: 'Configura la salida',
      description:
        'Elige fecha y hora de inicio, velocidad media y tipo de actividad. peakOne calcula el tiempo en cada punto.',
      color: '#a855f7',
    },
    {
      n: '03',
      icon: <Map className="h-6 w-6" />,
      title: 'Analiza y sal con confianza',
      description:
        'Obtén el informe completo: tiempo por kilómetro, riesgos, consejos, cobertura y puntos de evacuación en el mapa.',
      color: '#10b981',
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">
            Cómo funciona
          </span>
        </div>
        <h2 className="font-heading mb-16 text-center text-4xl font-bold">
          Tres pasos, cero sorpresas
        </h2>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line (desktop) */}
          <div className="absolute top-10 right-[16.67%] left-[16.67%] hidden h-px bg-gradient-to-r from-[#3b82f6]/30 via-[#a855f7]/30 to-[#10b981]/30 md:block" />

          {steps.map((step) => (
            <div key={step.n} className="relative flex flex-col items-center text-center">
              <div
                className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border shadow-xl"
                style={{
                  backgroundColor: `${step.color}12`,
                  borderColor: `${step.color}30`,
                  boxShadow: `0 0 40px ${step.color}15`,
                  color: step.color,
                }}
              >
                {step.icon}
                <span
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: step.color }}
                >
                  {step.n.slice(1)}
                </span>
              </div>
              <h3 className="font-heading mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="max-w-xs text-sm leading-relaxed text-white/45">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── IMPORT SOURCES ──────────────────────────────────────── */
function ImportSources() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-2xl border border-white/7 bg-gradient-to-br from-[#0d1120] to-[#0a0e1a]">
          <div className="grid md:grid-cols-2">
            {/* Text side */}
            <div className="flex flex-col justify-center p-10">
              <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">
                Importación
              </span>
              <h2 className="font-heading mb-4 text-3xl font-bold">
                Tus rutas,
                <br />
                donde quieras
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-white/45">
                Importa desde las plataformas que ya usas. peakOne se conecta con Strava para
                traer tus actividades y rutas, acepta cualquier GPX y lee rutas de Wikiloc con
                solo pegar el enlace.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <Upload className="h-4 w-4" />, label: 'Archivo GPX', sub: 'Cualquier formato GPX estándar', color: '#3b82f6' },
                  { icon: <Activity className="h-4 w-4" />, label: 'Strava', sub: 'Actividades y rutas guardadas', color: '#fc4c02' },
                  { icon: <Globe className="h-4 w-4" />, label: 'Wikiloc', sub: 'Importa pegando el enlace de la ruta', color: '#f59e0b' },
                ].map((src) => (
                  <div key={src.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${src.color}20`, color: src.color }}
                    >
                      {src.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{src.label}</div>
                      <div className="text-xs text-white/40">{src.sub}</div>
                    </div>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-[#3b82f6]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side */}
            <div className="relative flex items-center justify-center overflow-hidden border-t border-white/5 bg-[#080b14] p-8 md:border-t-0 md:border-l">
              <div className="flex flex-col items-center gap-3 text-center">
                {/* Strava card mockup */}
                <div className="w-full max-w-[260px] overflow-hidden rounded-xl border border-white/8 bg-[#0f1624]">
                  <div className="border-b border-white/5 bg-[#0a0e1a] px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-[#fc4c02]" />
                      <span className="text-[10px] font-semibold text-white/60">Importar desde Strava</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    {[
                      { name: 'Vuelta al puerto', dist: '48 km', type: 'cycling', date: 'Hace 2 días' },
                      { name: 'Ruta Sierra Nevada', dist: '92 km', type: 'cycling', date: 'Hace 1 semana' },
                      { name: 'Trail matutino', dist: '18 km', type: 'hiking', date: 'Hace 2 semanas' },
                    ].map((a) => (
                      <div key={a.name} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/5 bg-white/3 px-3 py-2 hover:border-[#3b82f6]/30 hover:bg-[#3b82f6]/5">
                        {a.type === 'cycling' ? (
                          <Bike className="h-3.5 w-3.5 shrink-0 text-white/30" />
                        ) : (
                          <Footprints className="h-3.5 w-3.5 shrink-0 text-white/30" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[10px] font-medium text-white/80">{a.name}</div>
                          <div className="text-[8px] text-white/30">{a.dist} · {a.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── DATA SOURCES ────────────────────────────────────────── */
function DataSources() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-white/25">
          Datos de calidad de fuentes abiertas
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { name: 'Open-Meteo', sub: 'Meteorología', icon: <CloudRain className="h-4 w-4" />, color: '#60a5fa' },
            { name: 'OpenStreetMap', sub: 'Terreno y carreteras', icon: <Map className="h-4 w-4" />, color: '#10b981' },
            { name: 'OpenCellID', sub: 'Cobertura móvil', icon: <Signal className="h-4 w-4" />, color: '#f97316' },
            { name: 'Strava API', sub: 'Actividades y rutas', icon: <Activity className="h-4 w-4" />, color: '#fc4c02' },
            { name: 'WeatherAPI', sub: 'Meteorología backup', icon: <Sun className="h-4 w-4" />, color: '#f59e0b' },
            { name: 'Tomorrow.io', sub: 'Meteorología backup', icon: <Droplets className="h-4 w-4" />, color: '#818cf8' },
          ].map((src) => (
            <div
              key={src.name}
              className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/2 px-4 py-3 transition-all hover:border-white/12"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${src.color}15`, color: src.color }}
              >
                {src.icon}
              </div>
              <div>
                <div className="text-xs font-semibold text-white/70">{src.name}</div>
                <div className="text-[9px] text-white/30">{src.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ───────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[#3b82f6]/20 bg-gradient-to-br from-[#0d1a36] via-[#0f1e40] to-[#0a1225] p-12 text-center">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[#3b82f6]/10 blur-[80px]" />
          </div>

          <div className="relative">
            <div className="mb-3 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-1.5 text-xs font-medium text-[#93c5fd]">
                <Bike className="h-3.5 w-3.5" />
                Para ciclistas y senderistas
                <Footprints className="h-3.5 w-3.5" />
              </span>
            </div>
            <h2 className="font-heading mb-4 text-4xl font-bold md:text-5xl">
              ¿Listo para salir
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] bg-clip-text text-transparent">
                con confianza?
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-base text-white/50">
              Únete y analiza tu próxima ruta gratis. Solo necesitas una cuenta de Google o Strava.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#3b82f6]/25 transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/40"
              >
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/25">Sin tarjeta de crédito · Datos locales · Open source</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="h-6 w-6 text-[#3b82f6]" />
          <span className="font-heading text-sm font-bold text-white/70">peakOne</span>
        </div>
        <div className="flex gap-6">
          {[
            { label: 'Privacidad', href: '/privacy' },
            { label: 'Términos', href: '/terms' },
            { label: 'Iniciar sesión', href: '/login' },
          ].map((l) => (
            <Link key={l.label} href={l.href} className="text-xs text-white/35 hover:text-white/70 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-white/20">© {new Date().getFullYear()} peakOne</p>
      </div>
    </footer>
  );
}
