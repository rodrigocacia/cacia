"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"

import { CustomPagination } from "../ui/custom-pagination"
import { RowActions } from "../ui/row-actions"
import { TableCard, TableCardFooter } from "../ui/table-card"
import { Icon } from "@/components/icone"
import { Spinner } from "../ui/sppiner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { EmptySearch } from "../empty-search"
import { useQuestion } from "@/http/hooks/question"

export function QuestionsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""

  const { questions, isLoading, currentPage, totalItems, totalPages, perPage } =
    useQuestion(page, search)

  if (isLoading) return <Spinner />

  if (totalItems === 0) {
    return <EmptySearch title="Nenhuma dúvida cadastrada." subtitle="" />
  }

  const handleAddDeleteQuestionId = (questionId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("deleteQuestionId", questionId)

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleAddEditQuestionId = (questionId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("editId", questionId)

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      <div className="mt-6 w-full">
        <TableCard>
          <Table>
            <TableHeader className="max-lg:hidden">
              <TableRow>
                <TableHead>Dúvida</TableHead>
                <TableHead className="hidden lg:table-cell">Resposta</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {questions?.map((question) => (
                <TableRow key={question?._id}>
                  <TableCell className="font-medium">
                    <div className="flex gap-2.5 items-center">
                      <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
                        <Icon
                          icon="mdi:question-mark"
                          className="w-6 h-6 text-[#348C98]"
                        />
                      </div>

                      <p className="text-sm text-[#707070]">
                        {`${question?.title?.substring(0, 20)}...`}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <p className="text-base text-[#707070]">
                      {`${question?.description?.substring(0, 20)}...`}
                    </p>
                  </TableCell>

                  <TableCell className="text-right">
                    <RowActions
                      actions={[
                        {
                          label: "Editar",
                          onClick: () => handleAddEditQuestionId(question?._id),
                          icon: (
                            <Icon
                              icon="mdi:edit"
                              className="h-[18px] w-[18px]"
                            />
                          ),
                        },
                        {
                          label: "Excluir",
                          onClick: () =>
                            handleAddDeleteQuestionId(question?._id),
                          icon: (
                            <Icon
                              icon="mdi:delete"
                              className="h-[18px] w-[18px]"
                            />
                          ),
                          danger: true,
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TableCardFooter>
            <CustomPagination
              totalItems={totalItems}
              totalPages={totalPages}
              currentPage={currentPage}
              perPage={perPage}
            />
          </TableCardFooter>
        </TableCard>
      </div>
    </>
  )
}
