import { useRef, useState } from "react"
import type { UserData, Screen } from "../types"
import { AppLayout } from "../components/Nav"
import {
  ArrowLeftIcon,
  MapPinIcon,
  HomeAddressIcon,
  RecycleIcon,
  CheckCircleIcon,
} from "../components/Icons"
import { Req } from "../components/PasswordRules"
import { LOCATION_MATERIALS } from "../data/catalog"
import type { Suggestion } from "../data/catalog"

interface RegistrarEcopontoProps {
  user: UserData
  navigate: (s: Screen) => void
  onSubmit: (s: Pick<Suggestion, "name" | "address" | "materials" | "obs">) => Promise<boolean>
}

const MATERIALS = LOCATION_MATERIALS

export default function RegistrarEcoponto({
  navigate,
  onSubmit,
}: RegistrarEcopontoProps) {
  const [nome, setNome] = useState("")
  const [tipos, setTipos] = useState<string[]>([])
  const [obs, setObs] = useState("")
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  // Endereço
  const [cep, setCep] = useState("")
  const [rua, setRua] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [uf, setUf] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState("")
  const [cepOk, setCepOk] = useState(false)

  const numeroRef = useRef<HTMLInputElement | null>(null)

  function formatCep(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 8)
    return digits.length > 5
      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
      : digits
  }

  // Recebe o valor digitado: o estado `cep` ainda não foi atualizado neste ciclo.
  async function buscarCep(value: string = cep) {
    const digits = value.replace(/\D/g, "")
    if (digits.length !== 8) return
    setCepLoading(true)
    setCepError("")
    setCepOk(false)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError("CEP não encontrado. Verifique e tente novamente.")
        return
      }
      setRua(data.logradouro || "")
      setBairro(data.bairro || "")
      setCidade(data.localidade || "")
      setUf(data.uf || "")
      setCepOk(true)
      setTimeout(() => numeroRef.current?.focus(), 50)
    } catch {
      setCepError("Não foi possível consultar o CEP agora.")
    } finally {
      setCepLoading(false)
    }
  }

  function handleCepChange(v: string) {
    const formatted = formatCep(v)
    setCep(formatted)
    setCepError("")
    setCepOk(false)
    if (formatted.replace(/\D/g, "").length === 8) buscarCep(formatted)
  }

  function toggleTipo(t: string) {
    setTipos((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  const canConfirm =
    nome.trim() !== "" &&
    cepOk &&
    rua.trim() !== "" &&
    numero.trim() !== "" &&
    tipos.length > 0

  const fullAddress = `${rua}${numero ? `, ${numero}` : ""}${
    complemento ? `, ${complemento}` : ""
  }${bairro ? `, ${bairro}` : ""}${cidade ? `, ${cidade}/${uf}` : ""}`

  const inputClass =
    "w-full bg-white border border-eco-200 rounded-2xl px-4 py-3.5 text-sm font-body text-eco-800 placeholder:text-eco-300 focus:outline-none focus:border-eco-400 focus:ring-2 focus:ring-eco-100 transition-all"

  if (done) {
    return (
      <AppLayout screen="registrarEcoponto" navigate={navigate}>
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
            Ecolocalização enviada!
          </h1>
          <p className="text-eco-500 font-body text-sm max-w-xs leading-relaxed mb-6">
            Obrigado por contribuir com o Gama! A gestão vai validar a
            ecolocalização e você será notificado(a) quando ela for aprovada.
          </p>
          <div className="w-full max-w-xs bg-white rounded-2xl border border-eco-100 p-4 mb-8 text-left space-y-3">
            <div className="flex items-center gap-3">
              <RecycleIcon size={16} className="text-eco-600" />
              <span className="text-eco-800 text-sm font-body font-semibold">
                {nome}
              </span>
            </div>
            <div className="flex items-start gap-3 pt-3 border-t border-eco-50">
              <HomeAddressIcon
                size={16}
                className="text-eco-600 flex-shrink-0 mt-0.5"
              />
              <span className="text-eco-800 text-sm font-body font-semibold leading-snug">
                {fullAddress}
              </span>
            </div>
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => navigate("ecopontos")}
              className="flex-1 py-3 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50 transition-colors"
            >
              Ver mapa
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
    <AppLayout screen="registrarEcoponto" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("ecopontos")}
            className="p-2 -ml-2 rounded-full text-eco-600 hover:bg-eco-50 transition-colors"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div>
            <h1 className="font-display font-bold text-eco-900 text-2xl">
              Registrar ecolocalização
            </h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">
              Sugira um novo ponto de coleta no Gama
            </p>
          </div>
        </div>

        <p className="text-[11px] text-eco-500 font-body mb-4">
          <Req /> Campos obrigatórios
        </p>

        {/* Nome */}
        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
          Nome da ecolocalização
          <Req />
        </h2>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Ecolocalização Setor Central"
          className={`${inputClass} mb-6`}
          required
        />

        {/* Endereço */}
        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
          Endereço
          <Req />
        </h2>

        {/* CEP */}
        <div className="flex gap-2 mb-1.5">
          <div className="relative flex-1">
            <MapPinIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-eco-400"
            />
            <input
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), buscarCep())
              }
              placeholder="Digite o CEP"
              inputMode="numeric"
              className="w-full bg-white border border-eco-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-body text-eco-800 placeholder:text-eco-300 focus:outline-none focus:border-eco-400 focus:ring-2 focus:ring-eco-100 transition-all"
              required
            />
          </div>
          <button
            onClick={() => buscarCep()}
            disabled={cep.replace(/\D/g, "").length !== 8 || cepLoading}
            className="px-5 rounded-2xl bg-eco-800 text-white text-sm font-display font-semibold disabled:opacity-40 hover:bg-eco-900 transition-colors"
          >
            {cepLoading ? "..." : "Buscar"}
          </button>
        </div>
        {cepError && (
          <p className="text-red-500 text-xs font-body mb-3 px-1">{cepError}</p>
        )}
        {cepOk && (
          <p className="text-eco-600 text-xs font-body mb-3 px-1 flex items-center gap-1">
            <CheckCircleIcon size={12} /> Endereço encontrado. Complete o
            número.
          </p>
        )}
        {!cepError && !cepOk && (
          <p className="text-eco-400 text-xs font-body mb-3 px-1">
            Preenchemos o endereço pelo CEP; você informa número e complemento.
          </p>
        )}

        <div className="space-y-3 mb-6">
          <div className="relative">
            <HomeAddressIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-eco-400"
            />
            <input
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              placeholder="Rua / Logradouro"
              className="w-full bg-white border border-eco-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-body text-eco-800 placeholder:text-eco-300 focus:outline-none focus:border-eco-400 focus:ring-2 focus:ring-eco-100 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input
              ref={numeroRef}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Número"
              inputMode="numeric"
              className={`col-span-1 ${inputClass}`}
              required
            />
            <input
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              placeholder="Complemento (opcional)"
              className={`col-span-2 ${inputClass}`}
            />
          </div>

          <input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro / Setor"
            className={inputClass}
          />

          <div className="grid grid-cols-3 gap-3">
            <input
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Cidade"
              className="col-span-2 w-full bg-eco-50 border border-eco-200 rounded-2xl px-4 py-3.5 text-sm font-body text-eco-700 placeholder:text-eco-300 focus:outline-none focus:border-eco-400 focus:ring-2 focus:ring-eco-100 transition-all"
            />
            <input
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="UF"
              className="col-span-1 w-full bg-eco-50 border border-eco-200 rounded-2xl px-4 py-3.5 text-sm font-body text-eco-700 placeholder:text-eco-300 focus:outline-none focus:border-eco-400 focus:ring-2 focus:ring-eco-100 transition-all"
            />
          </div>
        </div>

        {/* Materiais */}
        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
          Materiais aceitos
          <Req />
        </h2>
        <div
          className="flex flex-wrap gap-2 mb-6"
          role="group"
          aria-label="Materiais aceitos"
          aria-required="true"
        >
          {MATERIALS.map((m) => {
            const active = tipos.includes(m)
            return (
              <button
                key={m}
                onClick={() => toggleTipo(m)}
                className={`px-4 py-2 rounded-full text-sm font-body font-medium border transition-all ${
                  active
                    ? "border-eco-800 bg-eco-800 text-white"
                    : "border-eco-200 bg-white text-eco-600 hover:border-eco-300"
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>

        {/* Observações */}
        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
          Observações{" "}
          <span className="text-eco-300 normal-case font-body">(opcional)</span>
        </h2>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Horário de funcionamento, referências, contato…"
          rows={3}
          className={`${inputClass} resize-none mb-6`}
        />

        <button
          onClick={async () => {
            setBusy(true)
            const ok = await onSubmit({ name: nome.trim(), address: fullAddress, materials: tipos, obs: obs.trim() || undefined })
            setBusy(false)
            if (ok) setDone(true)
          }}
          disabled={!canConfirm || busy}
          className="w-full py-3.5 rounded-xl text-white font-display font-semibold text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #2d7a3a, #1d5c2a)" }}
        >
          {busy ? "Enviando…" : "Enviar ecolocalização"}
        </button>
        {!canConfirm && (
          <p className="text-eco-400 text-xs font-body text-center mt-2">
            Preencha nome, endereço (com número) e ao menos um material.
          </p>
        )}

        <div className="h-4" />
      </div>
    </AppLayout>
  )
}
