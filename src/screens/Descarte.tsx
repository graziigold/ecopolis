import { useState } from "react"
import type { UserData, Screen } from "../types"
import { AppLayout } from "../components/Nav"
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckCircleIcon,
} from "../components/Icons"
import { Req } from "../components/PasswordRules"
import type { Material } from "../data/catalog"

interface DescarteProps {
  user: UserData
  navigate: (s: Screen) => void
  onRegister: (materialKey: string, kg: number) => Promise<string | null>
  materials: Material[]
}

const WEIGHTS = [0.5, 1, 2, 5]

export default function Descarte({ navigate, onRegister, materials }: DescarteProps) {
  const MATERIALS = materials.filter((m) => m.active)
  const [material, setMaterial] = useState(MATERIALS[0])
  const [weight, setWeight] = useState(1)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const earned = Math.round(material.rate * weight)

  async function handleSubmit() {
    if (busy) return
    setBusy(true)
    const code = await onRegister(material.key, weight)
    setBusy(false)
    if (code) setDone(code)
  }

  if (done) {
    return (
      <AppLayout screen="descarte" navigate={navigate}>
        <div className="max-w-md mx-auto px-4 pt-6 pb-4 flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="animate-splash-in">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6 mx-auto"
              style={{
                background: "linear-gradient(135deg, #3a9448, #1d5c2a)",
              }}
            >
              <CheckCircleIcon size={48} className="text-white" />
            </div>
          </div>
          <h1 className="font-display font-bold text-eco-900 text-2xl mb-2">
            Descarte registrado!
          </h1>
          <p className="text-eco-500 font-body text-sm max-w-xs leading-relaxed mb-5">
            Leve o material à ecolocalização e mostre este código ao operador. Ele vai
            pesar e conferir o {material.label.toLowerCase()} antes de liberar os Ecopontos.
          </p>
          <div className="w-full max-w-xs rounded-2xl bg-white border border-eco-100 p-5 mb-4">
            <div className="text-[11px] uppercase tracking-widest text-eco-400 font-semibold mb-2">
              Código da entrega
            </div>
            <div className="flex justify-center gap-2" aria-label={`Código ${done}`}>
              {done.split("").map((d, i) => (
                <span key={i} className="w-12 h-14 rounded-xl bg-eco-50 border border-eco-200 flex items-center justify-center font-display font-bold text-3xl text-eco-900">
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div
            className="w-full max-w-xs rounded-2xl px-5 py-3 mb-8 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #fdf6eb, #f6e9cf)" }}
          >
            <span className="text-drach/70 text-xs font-body font-semibold uppercase tracking-wider">
              Estimativa
            </span>
            <span className="text-drach font-display font-bold text-xl">
              ~{earned} Ecopontos
            </span>
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => navigate("home")}
              className="flex-1 py-3 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50 transition-colors"
            >
              Ver entregas
            </button>
            <button
              onClick={() => navigate("home")}
              className="flex-1 py-3 rounded-xl text-white text-sm font-display font-semibold"
              style={{
                background: "linear-gradient(135deg, #2d7a3a, #1d5c2a)",
              }}
            >
              Concluir
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout screen="descarte" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("home")}
            className="lg:hidden p-2 -ml-2 rounded-full text-eco-600 hover:bg-eco-50 transition-colors"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div>
            <h1 className="font-display font-bold text-eco-900 text-2xl">
              Registrar descarte
            </h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">
              Escolha o material e a quantidade
            </p>
          </div>
        </div>

        <p className="text-[11px] text-eco-500 font-body mb-4">
          <Req /> Campos obrigatórios
        </p>

        {/* Material */}
        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
          Tipo de material
          <Req />
        </h2>
        <div
          className="grid grid-cols-3 gap-3 mb-6"
          role="group"
          aria-label="Tipo de material"
          aria-required="true"
        >
          {MATERIALS.map((m) => {
            const Icon = m.icon
            const active = material.key === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMaterial(m)}
                className={`rounded-2xl p-3.5 border flex flex-col items-center gap-2 transition-all ${
                  active
                    ? "border-eco-400 ring-1 ring-eco-300 bg-eco-50"
                    : "border-eco-100 bg-white hover:border-eco-200"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: m.bg }}
                >
                  <Icon size={20} style={{ color: m.color }} />
                </div>
                <span className="text-eco-700 text-xs font-semibold font-body">
                  {m.label}
                </span>
                <span className="text-[10px] font-body text-eco-400">
                  {m.rate}/kg
                </span>
              </button>
            )
          })}
        </div>

        {/* Weight */}
        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
          Quantidade estimada
          <Req />
        </h2>
        <div
          className="grid grid-cols-4 gap-3 mb-6"
          role="group"
          aria-label="Quantidade estimada"
          aria-required="true"
        >
          {WEIGHTS.map((w) => (
            <button
              key={w}
              onClick={() => setWeight(w)}
              className={`rounded-2xl py-3.5 border font-display font-semibold text-sm transition-all ${
                weight === w
                  ? "border-eco-800 bg-eco-800 text-white"
                  : "border-eco-100 bg-white text-eco-600 hover:border-eco-200"
              }`}
            >
              {w} kg
            </button>
          ))}
        </div>

        {/* Photo */}
        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
          Comprovação
        </h2>
        <button className="w-full rounded-2xl border-2 border-dashed border-eco-200 bg-eco-50/50 py-8 flex flex-col items-center gap-2 mb-6 hover:border-eco-300 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white border border-eco-100 flex items-center justify-center">
            <CameraIcon size={22} className="text-eco-500" />
          </div>
          <span className="text-eco-600 text-sm font-body font-semibold">
            Adicionar foto do material
          </span>
          <span className="text-eco-400 text-xs font-body">
            Opcional, acelera a validação
          </span>
        </button>

        {/* Summary */}
        <div
          className="rounded-2xl p-4 mb-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #fdf6eb, #f6e9cf)" }}
        >
          <div>
            <div className="text-drach/70 text-xs font-body font-semibold uppercase tracking-wider">
              Você vai ganhar
            </div>
            <div className="text-drach font-display font-bold text-2xl mt-0.5">
              +{earned} <span className="text-base font-semibold">Ecopontos</span>
            </div>
          </div>
          <div className="text-right text-xs font-body text-drach/70">
            {material.label} · {weight} kg
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full py-3.5 rounded-xl text-white font-display font-semibold text-sm shadow-sm disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #2d7a3a, #1d5c2a)" }}
        >
          {busy ? "Registrando…" : "Confirmar descarte"}
        </button>

        <div className="h-4" />
      </div>
    </AppLayout>
  )
}
