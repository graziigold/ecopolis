import { useRef, useState } from "react"
import type { UserData, Screen } from "../types"
import { AppLayout } from "../components/Nav"
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckCircleIcon,
} from "../components/Icons"
import { Req } from "../components/PasswordRules"
import type { Material } from "../data/catalog"
import { imageFileError, toSquareJpeg } from "../lib/image"

interface DescarteProps {
  user: UserData
  navigate: (s: Screen) => void
  onRegister: (materialKey: string, kg: number, photo: string) => Promise<string | null>
  materials: Material[]
}

const WEIGHTS = [0.5, 1, 2, 5]

export default function Descarte({ navigate, onRegister, materials }: DescarteProps) {
  const MATERIALS = materials.filter((m) => m.active)
  const [material, setMaterial] = useState(MATERIALS[0])
  const [weight, setWeight] = useState(1)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState("")
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const earned = Math.round(material.rate * weight)

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const err = imageFileError(file, 15)
    if (err) return setPhotoError(err)
    setPhotoError("")
    setProcessing(true)
    try {
      setPhoto(await toSquareJpeg(file, 720))
    } catch {
      setPhotoError("Não foi possível ler essa imagem. Tente outra foto.")
    } finally {
      setProcessing(false)
    }
  }

  async function handleSubmit() {
    if (busy) return
    if (!photo) return setPhotoError("Tire ou escolha uma foto do material para continuar.")
    setBusy(true)
    const code = await onRegister(material.key, weight, photo)
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
                {m.photo ? (
                  <img src={m.photo} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: m.bg, color: m.color }}
                  >
                    <Icon size={20} />
                  </div>
                )}
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
          Foto do material
          <Req />
        </h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pickPhoto}
          className="sr-only"
          aria-label="Foto do material"
        />
        {photo ? (
          <div className="flex items-center gap-4 rounded-2xl border border-eco-200 bg-white p-3 mb-2">
            <img src={photo} alt="Foto do material" className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-eco-800 text-sm font-body font-semibold">Foto adicionada</div>
              <div className="text-eco-400 text-xs font-body">O operador confere a foto na entrega.</div>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 h-9 px-3.5 rounded-xl border border-eco-200 text-eco-700 text-xs font-display font-semibold hover:bg-eco-50"
            >
              Trocar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className={`w-full rounded-2xl border-2 border-dashed py-8 flex flex-col items-center gap-2 mb-2 transition-colors ${
              photoError ? "border-red-300 bg-red-50/40" : "border-eco-200 bg-eco-50/50 hover:border-eco-300"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-white border border-eco-100 flex items-center justify-center">
              <CameraIcon size={22} className="text-eco-500" />
            </div>
            <span className="text-eco-600 text-sm font-body font-semibold">
              {processing ? "Preparando a foto…" : "Tirar ou escolher foto"}
            </span>
            <span className="text-eco-400 text-xs font-body">
              Obrigatória: mostre o material separado e limpo
            </span>
          </button>
        )}
        {photoError ? (
          <p role="alert" className="text-red-500 text-xs font-body mb-4">{photoError}</p>
        ) : (
          <div className="mb-4" />
        )}

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
          disabled={busy || processing || !photo}
          className="w-full py-3.5 rounded-xl text-white font-display font-semibold text-sm shadow-sm disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #2d7a3a, #1d5c2a)" }}
        >
          {busy ? "Registrando…" : "Confirmar descarte"}
        </button>
        {!photo && (
          <p className="text-eco-400 text-xs font-body text-center mt-2">Adicione a foto do material para confirmar.</p>
        )}

        <div className="h-4" />
      </div>
    </AppLayout>
  )
}
