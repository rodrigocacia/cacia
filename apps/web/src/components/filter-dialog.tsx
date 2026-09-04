"use client"

import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { useState } from "react"
import { FaTrash } from "react-icons/fa"
import { MdTune } from "react-icons/md"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

interface DialogFiltersProps {
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

export function DialogFilters({
  filters,
  showDateFilter = false,
  startDate: initialStartDate = "",
  endDate: initialEndDate = "",
  onDateChange,
  showResponsive = false,
}: DialogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get("status") || ""

  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const handleSave = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Sempre incluir status se houver filtros
    if (filters.length > 0) {
      params.set("status", selectedStatus)
    }

    // Incluir datas se o filtro de data estiver ativo
    if (showDateFilter && startDate) {
      params.set("startDate", startDate)
    }
    if (showDateFilter && endDate) {
      params.set("endDate", endDate)
    }

    router.push(`${pathname}?${params.toString()}`)

    // Call onDateChange callback if provided
    if (onDateChange && showDateFilter) {
      onDateChange(startDate, endDate)
    }
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Limpar status apenas se houver filtros
    if (filters.length > 0) {
      params.delete("status")
      setSelectedStatus("")
    }

    // Sempre limpar datas se o filtro de data estiver ativo
    if (showDateFilter) {
      params.delete("startDate")
      params.delete("endDate")
      setStartDate("")
      setEndDate("")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Dialog>
      <DialogTrigger className={showResponsive ? "" : "max-lg:hidden"} asChild>
        <button
          className={`cursor-pointer flex items-center gap-3 px-5 py-2 rounded-full ${
            currentStatus !== "" || (showDateFilter && (startDate || endDate))
              ? "bg-[#BBE2E7]"
              : "bg-[#ECF7F8]"
          }`}
        >
          <MdTune size={18} className="text-[#348C98]" />

          <span className="text-sm text-[#348C98] font-plus-jakarta font-bold">
            Filtros
          </span>

          {(currentStatus !== "" ||
            (showDateFilter && (startDate || endDate))) && (
            <span className="ml-1 w-6 h-6 text-xs font-bold rounded-full bg-[#348C98] text-white flex items-center justify-center">
              {(() => {
                let count = 0
                if (currentStatus !== "") count++
                if (startDate) count++
                if (endDate) count++
                return count
              })()}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="px-[30px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Filtros</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-col gap-3.5">
          <div className="flex items-center gap-2">
            <Image src="/filter-icon.svg" width={32} height={32} alt="" />
            <h2 className="text-2xl text-[#3D3D3D] font-bold">
              Filtros avançados
            </h2>
          </div>

          <p className="text-base w-[70%] text-[#BDBDBD] font-semibold">
            Selecione filtros para uma busca mais específica.
          </p>
        </div>

        {filters.length > 0 && (
          <div className="w-full p-2.5 flex flex-col gap-4 bg-[#FCFCFD] rounded-[12px]">
            <h3 className="text-xs text-[#BDBDBD] font-semibold">
              FILTRAGEM RÁPIDA
            </h3>

            <div className="flex w-full flex-wrap items-center gap-1.5">
              {filters.map((link) => {
                const isActive = link.status === selectedStatus
                return (
                  <button
                    key={link.id}
                    onClick={() => setSelectedStatus(link.status)}
                    className={`relative flex items-center justify-center px-3 py-[9px] rounded-[100px] border border-[#F6F6F9] text-sm font-medium ${
                      isActive ? "bg-[#ECF7F8]" : "bg-white"
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
                        isActive ? "text-[#348C98]" : "text-[#BDBDBD]"
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

        {/* Filtro por Datas */}
        {showDateFilter && (
          <div className="w-full p-2.5 flex flex-col gap-4 bg-[#FCFCFD] rounded-[12px]">
            <h3 className="text-xs text-[#BDBDBD] font-semibold">
              FILTRO POR PERÍODO
            </h3>

            <div className="flex w-full flex-col gap-3">
              <div className="flex max-md:flex-col items-center gap-3">
                <div className="max-md:w-full flex flex-col gap-1 flex-1">
                  <label className="text-xs text-[#3D3D3D] font-medium">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-[#F6F6F9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#348C98] focus:border-transparent"
                  />
                </div>
                <div className="max-md:w-full flex flex-col gap-1 flex-1">
                  <label className="text-xs text-[#3D3D3D] font-medium">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-[#F6F6F9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#348C98] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-start mt-[34px]">
          <Button
            className="cursor-pointer"
            variant="danger"
            iconLeft={<FaTrash size={16} className="text-[#DC2626]" />}
            onClick={handleClear}
          >
            Limpar Filtros
          </Button>
        </div>

        <div className="w-full flex items-center justify-end pt-3 border-t border-[#F6F6F9] mt-[32px]">
          <DialogClose asChild>
            <Button iconLeft={<Check />} className="pr-8" onClick={handleSave}>
              Salvar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
