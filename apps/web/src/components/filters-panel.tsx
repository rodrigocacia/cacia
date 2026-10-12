"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { Check, SlidersHorizontal, X } from "lucide-react"

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
        className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border px-3.5 text-[13.5px] font-medium transition-colors ${
          showResponsive ? "" : "max-lg:hidden"
        } ${
          isOpen || activeCount > 0
            ? "border-acao bg-nevoa text-turquesa-profundo"
            : "border-filete-forte bg-white text-tinta hover:bg-gray-100"
        }`}
      >
        <SlidersHorizontal size={16} strokeWidth={1.7} />

        <span>Filtros</span>

        {activeCount > 0 && (
          <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-md bg-acao px-1 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`w-full rounded-[14px] border border-filete bg-white p-5 ${
            showResponsive ? "" : "max-lg:hidden"
          }`}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[14.5px] font-semibold text-tinta">
                Filtros avançados
              </h2>

              <p className="text-[13px] text-tinta-3">
                Selecione filtros para uma busca mais específica.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar filtros"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-tinta-3 transition-colors hover:bg-gray-100 hover:text-tinta"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {filters.length > 0 && (
            <div className="flex w-full flex-col gap-3">
              <h3 className="rotulo">Status</h3>

              <div className="flex w-full flex-wrap items-center gap-1.5">
                {filters.map((link) => {
                  const isActive = link.status === selectedStatus

                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => setSelectedStatus(link.status)}
                      aria-pressed={isActive}
                      className={`relative flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-[13px] transition-colors ${
                        isActive
                          ? "border-acao bg-nevoa"
                          : "border-filete-forte bg-white hover:bg-gray-100"
                      }`}
                    >
                      {link.icon && (
                        <span className="mr-2 flex items-center justify-center">
                          {React.cloneElement(link.icon, {
                            className: `w-4 h-4 ${
                              isActive
                                ? "text-turquesa-profundo"
                                : "text-tinta-3"
                            }`,
                          })}
                        </span>
                      )}

                      <span
                        className={
                          isActive
                            ? "font-semibold text-turquesa-profundo"
                            : "font-medium text-tinta-2"
                        }
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
              <h3 className="rotulo">Período</h3>

              <div className="flex items-center gap-3 max-md:flex-col">
                <div className="flex flex-1 flex-col gap-1 max-md:w-full">
                  <label className="text-[13px] font-medium text-tinta-2">
                    Data de Início
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 rounded-[10px] border border-filete-forte bg-white px-3 text-[14px] text-tinta outline-none focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-1 max-md:w-full">
                  <label className="text-[13px] font-medium text-tinta-2">
                    Data de Fim
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-[10px] border border-filete-forte bg-white px-3 text-[14px] text-tinta outline-none focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-filete pt-4">
            <Button
              className="h-9! cursor-pointer px-3.5 text-[13.5px]"
              variant="ghost"
              onClick={handleClear}
            >
              Limpar filtros
            </Button>

            <Button
              className="h-9! cursor-pointer px-3.5 text-[13.5px]"
              iconLeft={<Check className="h-4 w-4" />}
              onClick={handleSave}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
