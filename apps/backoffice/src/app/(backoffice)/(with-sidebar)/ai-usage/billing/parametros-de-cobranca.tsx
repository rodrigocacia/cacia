"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Pencil, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/custom-input";
import { Toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableCard } from "@/components/ui/table-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  deleteAiPrice,
  updateAiBilling,
  upsertAiPrice,
  type AiBilling,
  type PrecoDeModelo,
} from "@/http/ai-usage/ai-billing";
import {
  formatarDolares,
  formatarPercentual,
  lerNumero,
  numeroParaCampo,
  validarNumero,
} from "@/utils/consumo-ia";

/** Campo de texto com número em pt-BR, conferido com os limites do DTO. */
function campoNumerico(limites: { min: number; max?: number; casas: number }) {
  return z.string().superRefine((valor, ctx) => {
    const erro = validarNumero(valor, limites);
    if (erro) ctx.addIssue({ code: z.ZodIssueCode.custom, message: erro });
  });
}

const parametrosSchema = z.object({
  margemPercentual: campoNumerico({ min: 0, max: 1000, casas: 2 }),
  cambio: campoNumerico({ min: 0.01, max: 100, casas: 4 }),
});
type ParametrosFormData = z.infer<typeof parametrosSchema>;

const precoSchema = z.object({
  modelo: z
    .string()
    .trim()
    .min(1, "Informe o nome do modelo")
    .max(200, "Nome longo demais"),
  entradaUsdPorMilhao: campoNumerico({ min: 0, casas: 6 }),
  entradaEmCacheUsdPorMilhao: campoNumerico({ min: 0, casas: 6 }),
  saidaUsdPorMilhao: campoNumerico({ min: 0, casas: 6 }),
});
type PrecoFormData = z.infer<typeof precoSchema>;

type Aviso = {
  title: string;
  description: string;
  variant: "successSolid" | "errorSolid";
};

export function ParametrosDeCobranca({ inicial }: { inicial: AiBilling }) {
  const [billing, setBilling] = useState(inicial);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // `null` fechado; `"novo"` para cadastrar; o preço existente para editar
  const [editando, setEditando] = useState<PrecoDeModelo | "novo" | null>(null);
  const [removendo, setRemovendo] = useState<PrecoDeModelo | null>(null);
  const [removendoAgora, setRemovendoAgora] = useState(false);

  function avisar(
    resultado: { success: true } | { success: false; error: string },
    sucesso: string,
  ) {
    setAviso(
      resultado.success
        ? { title: "Pronto!", description: sucesso, variant: "successSolid" }
        : {
            title: "Não foi possível salvar",
            description: resultado.error,
            variant: "errorSolid",
          },
    );
  }

  async function remover() {
    if (!removendo) return;

    setRemovendoAgora(true);
    const resultado = await deleteAiPrice(removendo.modelo);
    setRemovendoAgora(false);

    if (resultado.success) {
      setBilling(resultado.data);
      setRemovendo(null);
    }
    avisar(resultado, `Preço de ${removendo.modelo} removido.`);
  }

  return (
    <div className="mt-6 flex w-full flex-col gap-6">
      <FormularioDeParametros
        billing={billing}
        onSalvo={(novo) => setBilling(novo)}
        onResultado={avisar}
      />

      <section className="w-full overflow-hidden rounded-[14px] border border-filete bg-white">
        <div className="flex flex-col gap-4 p-6 max-md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
                Preços dos modelos
              </h2>
              <span className="font-mono text-[11px] text-tinta-3 tabular">
                {billing.precos.length}
              </span>
            </div>

            <Button
              type="button"
              onClick={() => setEditando("novo")}
              iconLeft={<Plus size={16} strokeWidth={1.9} aria-hidden />}
            >
              Adicionar modelo
            </Button>
          </div>

          <ul className="flex max-w-[760px] list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-tinta-2 marker:text-gray-400">
            <li>
              Preço em dólar por 1 milhão de tokens, do jeito que os provedores
              publicam. Confira os valores na página de preços de cada provedor
              antes de cadastrar ou alterar.
            </li>
            <li>
              <strong className="font-semibold text-tinta">
                Entrada em cache
              </strong>{" "}
              é o texto de entrada que o provedor reaproveita de chamadas
              anteriores e cobra mais barato.
            </li>
            <li>
              Novos preços valem só para as chamadas feitas a partir de agora: o
              custo de cada chamada é fixado no momento em que ela acontece.
              Chamadas de um modelo sem preço entram com custo zero.
            </li>
          </ul>
        </div>

        {billing.precos.length === 0 ? (
          <p className="border-t border-filete px-6 py-10 text-center text-[13.5px] text-tinta-3">
            Nenhum preço cadastrado.
          </p>
        ) : (
          <div className="border-t border-filete">
            <TableCard semMoldura>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">
                      Entrada (US$/1M)
                    </TableHead>
                    <TableHead className="text-right">
                      Entrada em cache (US$/1M)
                    </TableHead>
                    <TableHead className="text-right">Saída (US$/1M)</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billing.precos.map((preco) => (
                    <TableRow key={preco.modelo}>
                      <TableCell className="font-mono text-[13px] text-tinta">
                        {preco.modelo}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatarDolares(preco.entrada_usd_por_milhao)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatarDolares(preco.entrada_em_cache_usd_por_milhao)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatarDolares(preco.saida_usd_por_milhao)}
                      </TableCell>
                      <TableCell className="tabular text-tinta-3">
                        {format(
                          new Date(preco.atualizado_em),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            type="button"
                            aria-label={`Editar ${preco.modelo}`}
                            title="Editar"
                            onClick={() => setEditando(preco)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-tinta-2 transition-colors hover:bg-gray-100 hover:text-tinta"
                          >
                            <Pencil size={15} strokeWidth={1.7} aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remover ${preco.modelo}`}
                            title="Remover"
                            onClick={() => setRemovendo(preco)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#A23B2A] transition-colors hover:bg-[#FBEDEA]"
                          >
                            <Trash2 size={15} strokeWidth={1.7} aria-hidden />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </div>
        )}
      </section>

      <Dialog
        open={editando !== null}
        onOpenChange={(aberto) => !aberto && setEditando(null)}
      >
        <DialogContent className="px-[30px]">
          {editando !== null && (
            <FormularioDePreco
              key={editando === "novo" ? "novo" : editando.modelo}
              preco={editando === "novo" ? null : editando}
              modelosCadastrados={billing.precos.map((p) => p.modelo)}
              onCancelar={() => setEditando(null)}
              onSalvo={(novo, modelo) => {
                setBilling(novo);
                setEditando(null);
                avisar({ success: true }, `Preço de ${modelo} salvo.`);
              }}
              onErro={(erro) => avisar({ success: false, error: erro }, "")}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={removendo !== null}
        onOpenChange={(aberto) => !aberto && setRemovendo(null)}
      >
        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle>Remover o preço de {removendo?.modelo}?</DialogTitle>
            <DialogDescription>
              As chamadas já feitas mantêm o custo que tiveram. As próximas
              chamadas deste modelo entram com custo zero até um novo preço ser
              cadastrado.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full flex items-center justify-end gap-3.5 mt-4">
            <Button
              variant="outline"
              onClick={() => setRemovendo(null)}
              disabled={removendoAgora}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={remover}
              disabled={removendoAgora}
            >
              {removendoAgora ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {aviso && (
        <Toast
          title={aviso.title}
          description={aviso.description}
          variant={aviso.variant}
          onClose={() => setAviso(null)}
        />
      )}
    </div>
  );
}

function FormularioDeParametros({
  billing,
  onSalvo,
  onResultado,
}: {
  billing: AiBilling;
  onSalvo: (novo: AiBilling) => void;
  onResultado: (
    resultado: { success: true } | { success: false; error: string },
    sucesso: string,
  ) => void;
}) {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ParametrosFormData>({
    resolver: zodResolver(parametrosSchema),
    defaultValues: {
      margemPercentual: numeroParaCampo(billing.margem_percentual),
      cambio: numeroParaCampo(billing.cambio),
    },
  });

  const onSubmit: SubmitHandler<ParametrosFormData> = async (dados) => {
    const resultado = await updateAiBilling({
      margemPercentual: lerNumero(dados.margemPercentual) ?? undefined,
      cambio: lerNumero(dados.cambio) ?? undefined,
    });

    if (resultado.success) {
      onSalvo(resultado.data);
      reset({
        margemPercentual: numeroParaCampo(resultado.data.margem_percentual),
        cambio: numeroParaCampo(resultado.data.cambio),
      });
    }
    onResultado(resultado, "Parâmetros de cobrança salvos.");
  };

  return (
    <section className="w-full rounded-[14px] border border-filete bg-white p-6 max-md:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
          Margem e câmbio
        </h2>
        <p className="text-[13px] text-tinta-3">
          Margem atual:{" "}
          <span className="tabular font-medium text-tinta-2">
            {formatarPercentual(billing.margem_percentual)}
          </span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-5 flex w-full flex-col gap-5"
      >
        <div className="grid w-full grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              inputMode="decimal"
              label="Margem (%)"
              aria-label="Margem (%)"
              iconName={null}
              {...register("margemPercentual")}
              error={errors?.margemPercentual}
            />
            <p className="text-[12.5px] leading-relaxed text-tinta-3">
              É o preço de venda: o percentual somado ao custo para chegar ao
              valor a cobrar. Vale para qualquer período, inclusive meses já
              fechados — alterar a margem muda o valor a cobrar de todo o
              histórico.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              type="text"
              inputMode="decimal"
              label="Câmbio (R$ por US$ 1)"
              aria-label="Câmbio (R$ por US$ 1)"
              iconName={null}
              {...register("cambio")}
              error={errors?.cambio}
            />
            <p className="text-[12.5px] leading-relaxed text-tinta-3">
              Converte o preço dos modelos, cobrado em dólar, para real. Vale só
              para as chamadas feitas a partir de agora: o custo de cada chamada
              é fixado no momento em que ela acontece.
            </p>
          </div>
        </div>

        <div className="flex w-full justify-end border-t border-filete pt-5">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            isLoading={isSubmitting}
            iconLeft={<Save size={16} strokeWidth={1.7} aria-hidden />}
            className="px-6 max-md:w-full"
          >
            Salvar
          </Button>
        </div>
      </form>
    </section>
  );
}

function FormularioDePreco({
  preco,
  modelosCadastrados,
  onCancelar,
  onSalvo,
  onErro,
}: {
  /** `null` para cadastrar um modelo novo. */
  preco: PrecoDeModelo | null;
  modelosCadastrados: string[];
  onCancelar: () => void;
  onSalvo: (novo: AiBilling, modelo: string) => void;
  onErro: (erro: string) => void;
}) {
  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PrecoFormData>({
    resolver: zodResolver(precoSchema),
    defaultValues: preco
      ? {
          modelo: preco.modelo,
          entradaUsdPorMilhao: numeroParaCampo(preco.entrada_usd_por_milhao),
          entradaEmCacheUsdPorMilhao: numeroParaCampo(
            preco.entrada_em_cache_usd_por_milhao,
          ),
          saidaUsdPorMilhao: numeroParaCampo(preco.saida_usd_por_milhao),
        }
      : {
          modelo: "",
          entradaUsdPorMilhao: "",
          entradaEmCacheUsdPorMilhao: "",
          saidaUsdPorMilhao: "",
        },
  });

  const onSubmit: SubmitHandler<PrecoFormData> = async (dados) => {
    // O PUT é upsert: sem esta checagem, "adicionar" um modelo já cadastrado
    // sobrescreveria o preço dele sem aviso
    if (!preco && modelosCadastrados.includes(dados.modelo)) {
      setError("modelo", {
        message: "Este modelo já tem preço — use o botão de editar.",
      });
      return;
    }

    const modelo = preco?.modelo ?? dados.modelo;

    const resultado = await upsertAiPrice(modelo, {
      entradaUsdPorMilhao: lerNumero(dados.entradaUsdPorMilhao) ?? 0,
      entradaEmCacheUsdPorMilhao:
        lerNumero(dados.entradaEmCacheUsdPorMilhao) ?? 0,
      saidaUsdPorMilhao: lerNumero(dados.saidaUsdPorMilhao) ?? 0,
    });

    if (resultado.success) onSalvo(resultado.data, modelo);
    else onErro(resultado.error);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {preco ? `Editar preço de ${preco.modelo}` : "Adicionar modelo"}
        </DialogTitle>
        <DialogDescription>
          Valores em US$ por 1 milhão de tokens, conforme a página de preços do
          provedor. Valem para as chamadas feitas a partir de agora.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-4"
      >
        {/* O nome é a chave do preço: renomear seria cadastrar outro modelo */}
        {!preco && (
          <Input
            type="text"
            label="Modelo"
            aria-label="Modelo"
            placeholder="Nome exato do modelo, como o provedor informa"
            iconName={null}
            {...register("modelo")}
            error={errors?.modelo}
          />
        )}
        <Input
          type="text"
          inputMode="decimal"
          label="Entrada (US$/1M tokens)"
          aria-label="Entrada (US$/1M tokens)"
          iconName={null}
          {...register("entradaUsdPorMilhao")}
          error={errors?.entradaUsdPorMilhao}
        />
        <Input
          type="text"
          inputMode="decimal"
          label="Entrada em cache (US$/1M tokens)"
          aria-label="Entrada em cache (US$/1M tokens)"
          iconName={null}
          {...register("entradaEmCacheUsdPorMilhao")}
          error={errors?.entradaEmCacheUsdPorMilhao}
        />
        <Input
          type="text"
          inputMode="decimal"
          label="Saída (US$/1M tokens)"
          aria-label="Saída (US$/1M tokens)"
          iconName={null}
          {...register("saidaUsdPorMilhao")}
          error={errors?.saidaUsdPorMilhao}
        />

        <div className="w-full flex items-center justify-end gap-3.5 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="px-6"
          >
            Salvar
          </Button>
        </div>
      </form>
    </>
  );
}
