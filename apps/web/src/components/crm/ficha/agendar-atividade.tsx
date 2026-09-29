"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

import { mensagemDoErro } from "@/http/api-crm"
import { agendarAtividade, horariosLivres } from "@/http/crm/agenda"
import type { HorarioLivre } from "@/http/crm/tipos"

interface Agenda {
  _id?: string
  id?: string
  title: string
}

/**
 * Marca uma atividade com o lead, escolhendo entre os horários LIVRES.
 *
 * Campo de data e hora livre era o que existia antes, e aceitava três da manhã
 * de domingo — a configuração de dias e turnos estava no banco e ninguém a
 * consultava. Aqui a pessoa escolhe o que a agenda de fato oferece.
 */
export function AgendarAtividade({
  leadId,
  agendas,
  aoAgendar,
}: {
  leadId: string
  agendas: Agenda[]
  aoAgendar: () => Promise<unknown>
}) {
  const primeira = agendas[0]
  const idDaPrimeira = primeira?.id ?? primeira?._id ?? ""

  // As agendas chegam depois do primeiro render (SWR). Guardar só a escolha
  // da pessoa, e cair na primeira enquanto não houver escolha — com
  // useState(idDaPrimeira) o id ficava vazio para sempre e a data nunca
  // mostrava horário livre.
  const [agendaEscolhida, setCalendarId] = useState("")
  const calendarId = agendaEscolhida || idDaPrimeira
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [duracao, setDuracao] = useState(60)
  const [titulo, setTitulo] = useState("Contato com o lead")
  const [tipo, setTipo] = useState<"CALL" | "FOLLOW_UP" | "MEETING">("CALL")

  const [livres, setLivres] = useState<HorarioLivre[]>([])
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!calendarId) return

    let cancelado = false

    setCarregando(true)
    setErro(null)

    horariosLivres({ calendarId, date: data, duracaoMinutos: duracao })
      .then((resposta) => {
        // A resposta pode chegar depois de a pessoa já ter trocado a data;
        // sem esta guarda, a lista mostraria os horários do dia anterior.
        if (!cancelado) setLivres(resposta.slots)
      })
      .catch(async (falha: unknown) => {
        if (!cancelado) setErro(await mensagemDoErro(falha))
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [calendarId, data, duracao])

  async function marcar(horario: HorarioLivre): Promise<void> {
    setSalvando(true)
    setErro(null)

    try {
      await agendarAtividade({
        calendarId,
        leadId,
        title: titulo.trim() || "Contato com o lead",
        type: tipo,
        startTime: horario.inicio,
        endTime: horario.fim,
        // Uma hora antes: é a antecedência que serve para quase todo contato
        // comercial, e sem lembrete nenhum o compromisso é só uma anotação.
        reminderOffsets: [60],
      })

      await aoAgendar()

      // Recarrega os horários: o que acabou de ser marcado não pode continuar
      // na lista de livres.
      const atualizados = await horariosLivres({
        calendarId,
        date: data,
        duracaoMinutos: duracao,
      })
      setLivres(atualizados.slots)
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    } finally {
      setSalvando(false)
    }
  }

  if (agendas.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nenhuma agenda configurada. Crie uma em Configurações → Agendas para
        poder marcar atividades.
      </p>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {agendas.length > 1 && (
          <select
            value={calendarId}
            onChange={(evento) => setCalendarId(evento.target.value)}
            className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none"
          >
            {agendas.map((agenda) => {
              const id = agenda.id ?? agenda._id ?? ""
              return (
                <option key={id} value={id}>
                  {agenda.title}
                </option>
              )
            })}
          </select>
        )}

        <input
          type="date"
          value={data}
          onChange={(evento) => setData(evento.target.value)}
          className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none"
        />

        <select
          value={duracao}
          onChange={(evento) => setDuracao(Number(evento.target.value))}
          className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none"
        >
          <option value={30}>30 min</option>
          <option value={60}>1 hora</option>
          <option value={120}>2 horas</option>
        </select>

        <select
          value={tipo}
          onChange={(evento) =>
            setTipo(evento.target.value as "CALL" | "FOLLOW_UP" | "MEETING")
          }
          className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none"
        >
          <option value="CALL">Ligação</option>
          <option value="FOLLOW_UP">Retorno</option>
          <option value="MEETING">Reunião</option>
        </select>
      </div>

      <input
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder="Assunto"
        className="mt-2 w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-400"
      />

      <div className="mt-3">
        {carregando && <p className="text-sm text-zinc-500">Buscando…</p>}

        {!carregando && livres.length === 0 && !erro && (
          <p className="text-sm text-zinc-500">
            Nenhum horário livre nesta data.
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {livres.map((horario) => (
            <button
              key={horario.inicio}
              type="button"
              disabled={salvando}
              onClick={() => void marcar(horario)}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-40"
            >
              {new Date(horario.inicio).toLocaleTimeString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                hour: "2-digit",
                minute: "2-digit",
              })}
              <span className="ml-1 text-[10px] text-zinc-400">
                {horario.online ? "online" : "presencial"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  )
}
