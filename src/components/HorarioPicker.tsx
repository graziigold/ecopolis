import { useEffect, useMemo } from "react"
import {
  PICKUP_CAPACITY,
  PICKUP_NOTICE_HOURS,
  fmtDay,
  hourLabel,
  hourStart,
  monthShort,
  parseDay,
  pickupHours,
  scheduleDays,
  weekday,
} from "../data/catalog"
import { Req } from "./PasswordRules"

export interface When {
  date: string
  hour: number
}

interface Props {
  value: When | null
  onChange: (w: When | null) => void
  /** Coletas agendadas por janela, no formato "AAAA-MM-DD|H". */
  occupancy: Record<string, number>
  loading?: boolean
}

const key = (date: string, hour: number) => `${date}|${hour}`

/** Seletor de dia e janela de 1 hora com vagas, usado no agendamento e na remarcação. */
export default function HorarioPicker({ value, onChange, occupancy, loading }: Props) {
  const days = useMemo(() => scheduleDays(), [])

  const status = (date: string, hour: number) => {
    if (hourStart(date, hour) - Date.now() < PICKUP_NOTICE_HOURS * 3600_000) return { ok: false, text: "Encerrado" }
    const left = PICKUP_CAPACITY - (occupancy[key(date, hour)] ?? 0)
    if (left <= 0) return { ok: false, text: "Lotado" }
    return { ok: true, text: left === 1 ? "1 vaga" : `${left} vagas` }
  }
  const freeHours = (date: string) => pickupHours(date).filter((h) => status(date, h).ok)

  // Mantém uma seleção válida: escolhe o primeiro horário livre quando a atual deixa de existir.
  useEffect(() => {
    if (loading) return
    if (value && status(value.date, value.hour).ok) return
    const date = value?.date && freeHours(value.date).length ? value.date : days.find((d) => freeHours(d).length)
    onChange(date ? { date, hour: freeHours(date)[0] } : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupancy, loading])

  const selectedDay = value?.date ?? days[0]
  const hours = pickupHours(selectedDay)
  const groups = [
    { label: "Manhã", hours: hours.filter((h) => h < 12) },
    { label: "Tarde", hours: hours.filter((h) => h >= 12) },
  ].filter((g) => g.hours.length)

  return (
    <div>
      <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">
        Escolha o dia
        <Req />
      </h2>
      <div className="-mx-4 px-4 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 w-max" role="group" aria-label="Dia da coleta">
          {days.map((iso) => {
            const free = freeHours(iso).length
            const active = iso === selectedDay
            return (
              <button
                key={iso}
                type="button"
                disabled={!free || loading}
                aria-pressed={active}
                onClick={() => onChange({ date: iso, hour: freeHours(iso)[0] })}
                className={`w-[60px] rounded-2xl py-2.5 border flex flex-col items-center gap-0.5 transition-all disabled:opacity-40 ${
                  active ? "border-eco-400 bg-eco-50 ring-1 ring-eco-300" : "border-eco-100 bg-white hover:border-eco-200"
                }`}
              >
                <span className="text-[11px] font-body text-eco-400">{weekday(iso)}</span>
                <span className={`font-display font-bold text-base leading-tight ${active ? "text-eco-800" : "text-eco-600"}`}>
                  {parseDay(iso).getDate()}
                </span>
                <span className="text-[10px] font-body text-eco-400">{free ? monthShort(iso) : "cheio"}</span>
              </button>
            )
          })}
        </div>
      </div>

      <h2 className="font-display font-semibold text-eco-800 text-xs mb-1 uppercase tracking-wider">
        Horário
        <Req />
      </h2>
      <p className="text-eco-400 text-xs font-body mb-3">
        A equipe chega dentro da janela de 1 hora. Agende com pelo menos {PICKUP_NOTICE_HOURS} horas de antecedência.
      </p>
      {groups.map((g) => (
        <div key={g.label} className="mb-3">
          <div className="text-[11px] font-body font-semibold text-eco-500 mb-1.5">{g.label}</div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="group" aria-label={`Horários da ${g.label.toLowerCase()}`}>
            {g.hours.map((h) => {
              const st = status(selectedDay, h)
              const active = value?.date === selectedDay && value.hour === h
              return (
                <button
                  key={h}
                  type="button"
                  disabled={!st.ok || loading}
                  aria-pressed={active}
                  onClick={() => onChange({ date: selectedDay, hour: h })}
                  className={`rounded-xl py-2 border flex flex-col items-center transition-all disabled:cursor-not-allowed ${
                    active
                      ? "border-eco-800 bg-eco-800 text-white"
                      : st.ok
                        ? "border-eco-100 bg-white text-eco-700 hover:border-eco-300"
                        : "border-eco-50 bg-eco-50/60 text-eco-300"
                  }`}
                >
                  <span className="font-display font-semibold text-sm">{String(h).padStart(2, "0")}h</span>
                  <span className={`text-[10px] font-body ${active ? "text-eco-100" : ""}`}>{loading ? "…" : st.text}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {value ? (
        <p className="text-eco-700 text-sm font-body mt-4 mb-6">
          Coleta em <strong>{fmtDay(value.date)}</strong>, das <strong>{hourLabel(value.hour)}</strong>.
        </p>
      ) : (
        !loading && <p className="text-red-500 text-sm font-body mt-4 mb-6">Não há horários livres nos próximos dias.</p>
      )}
    </div>
  )
}
