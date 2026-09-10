"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { FaTrash } from "react-icons/fa"
import { MdTune } from "react-icons/md"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/custom-button"

interface FiltersPanelProps {
  filters: {
    id: string
    name: string
    status: string
    icon: React.JSX.Element | null
  }[]
  showDateFilter?: boolean
  startDate?: string
  endDate?: string
  onDateChange?: (startDate: string, endDate: string) => void
  showResponsive?: boolean
}

/**
 * Botão "Filtros" e o painel que ele abre.
 *
 * O painel é `w-full` e conta com o `flex-wrap` do contêiner que o envolve
 * para cair numa linha só dele, abaixo da barra — é isso que o mantém no
 * fluxo da página, empurrando o conteúdo para baixo, em vez de flutuar por
 * cima. Quem usar este componente precisa envolver a linha num flex com
 * `flex-wrap`.
 */
export function FiltersPanel({
  filters,
  showDateFilter = false,
  startDate: initialStartDate = "",
  endDate: initialEndDate = "",
  onDateChange,
  showResponsive = false,
}: FiltersPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get("status") || ""

  const [isOpen, setIsOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const activeCount =
    (currentStatus !== "" ? 1 : 0) +
    (showDateFilter && startDate ? 1 : 0) +
    (showDateFilter && endDate ? 1 : 0)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const handleSave = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (filters.length > 0) {
      params.set("status", selectedStatus)
    }

    if (showDateFilter && startDate) {
      params.set("startDate", startDate)
    }
    if (showDateFilter && endDate) {
      params.set("endDate", endDate)
    }

    router.push(`${pathname}?${params.toString()}`)

    if (onDateChange && showDateFilter) {
      onDateChange(startDate, endDate)
    }

    setIsOpen(false)
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (filters.length > 0) {
      params.delete("status")
      setSelectedStatus("")
    }

    if (showDateFilter) {
      params.delete("startDate")
      params.delete("endDate")
      setStartDate("")
      setEndDate("")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className={`flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-5 text-sm transition-colors ${
          showResponsive ? "" : "max-lg:hidden"
        } ${
          isOpen || activeCount > 0
            ? "bg-[#BBE2E7] hover:bg-[#A8DAE1]"
            : "bg-[#ECF7F8] hover:bg-[#DCEFF2]"
        }`}
      >
        <MdTune size={18} className="text-[#348C98]" />

        <span className="font-plus-jakarta text-sm font-bold text-[#348C98]">
          Filtros
        </span>

        {activeCount > 0 && (
          <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#348C98] text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`w-full rounded-2xl border border-[#ECECF1] bg-white p-4 ${
            showResponsive ? "" : "max-lg:hidden"
          }`}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#3D3D3D]">
                Filtros avançados
              </h2>

              <p className="text-sm text-[#9A9AA5]">
                Selecione filtros para uma busca mais específica.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar filtros"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#9A9AA5] transition-colors hover:bg-[#F1F1F5] hover:text-[#3D3D3D]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {filters.length > 0 && (
            <div className="flex w-full flex-col gap-3">
              <h3 className="text-[11px] font-semibold tracking-wide text-[#BDBDBD]">
                FILTRAGEM RÁPIDA
              </h3>

              <div className="flex w-full flex-wrap items-center gap-1.5">
                {filters.map((link) => {
                  const isActive = link.status === selectedStatus

                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => setSelectedStatus(link.status)}
                      className={`relative flex cursor-pointer items-center justify-center rounded-full border px-3 py-[9px] text-sm font-medium transition-colors ${
                        isActive
                          ? "border-[#BBE2E7] bg-[#ECF7F8]"
                          : "border-[#EDEDF2] bg-white hover:border-[#D5D5E0]"
                      }`}
                    >
                      {link.icon && (
                        <span className="mr-2 flex items-center justify-center">
                          {React.cloneElement(link.icon, {
                            className: `w-4 h-4 ${
                              isActive ? "text-[#348C98]" : "text-[#BDBDBD]"
                            }`,
                          })}
                        </span>
                      )}

                      <span
                        className={`text-sm font-bold ${
                          isActive ? "text-[#348C98]" : "text-[#707070]"
                        }`}
                      >
                        {link.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {showDateFilter && (
            <div className="flex w-full flex-col gap-3">
              <h3 className="text-[11px] font-semibold tracking-wide text-[#BDBDBD]">
                FILTRO POR PERÍODO
              </h3>

              <div className="flex items-center gap-3 max-md:flex-col">
                <div className="flex flex-1 flex-col gap-1 max-md:w-full">
                  <label className="text-xs font-medium text-[#3D3D3D]">
                    Data de Início
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-[#E7E7EE] px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#348C98] focus:outline-none"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-1 max-md:w-full">
                  <label className="text-xs font-medium text-[#3D3D3D]">
                    Data de Fim
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-[#E7E7EE] px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#348C98] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F1F1F5] pt-4">
            <Button
              className="h-10! cursor-pointer px-4 text-sm"
              variant="danger"
              iconLeft={<FaTrash size={14} className="text-[#DC2626]" />}
              onClick={handleClear}
            >
              Limpar Filtros
            </Button>

            <Button
              className="h-10! cursor-pointer px-5 text-sm"
              iconLeft={<Check className="h-4 w-4" />}
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
