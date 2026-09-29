"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Icon } from "@/components/icone";
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
    <div className="w-full flex flex-col gap-6 mt-6 pb-8">
      <FormularioDeParametros
        billing={billing}
        onSalvo={(novo) => setBilling(novo)}
        onResultado={avisar}
      />

      <section className="w-full bg-white rounded-2xl shadow-sm p-6 max-md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon
              icon="mdi:tag-text-outline"
              className="w-8 h-8 text-[#BDBDBD]"
            />
            <h3 className="text-[20px] text-[#707070] font-bold">
              Preços dos modelos
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setEditando("novo")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#348C98] text-white text-sm font-medium cursor-pointer"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            Adicionar modelo
          </button>
        </div>

        <hr className="w-full my-4 h-px border-t-0 bg-gray-200" />

        <div className="text-sm text-[#707070] flex flex-col gap-1.5 mb-4">
          <p>
            Preço em dólar por 1 milhão de tokens, do jeito que os provedores
            publicam. Confira os valores na página de preços de cada provedor
            antes de cadastrar ou alterar.
          </p>
          <p>
            <strong>Entrada em cache</strong> é o texto de entrada que o
            provedor reaproveita de chamadas anteriores e cobra mais barato.
          </p>
          <p>
            Novos preços valem só para as chamadas feitas a partir de agora: o
            custo de cada chamada é fixado no momento em que ela acontece.
            Chamadas de um modelo sem preço entram com custo zero.
          </p>
        </div>

        {billing.precos.length === 0 ? (
          <p className="text-sm text-[#BDBDBD] py-6 text-center">
            Nenhum preço cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm font-medium text-[#707070]">
                    Modelo
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Entrada (US$/1M)
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Entrada em cache (US$/1M)
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Saída (US$/1M)
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070]">
                    Atualizado em
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.precos.map((preco) => (
                  <TableRow key={preco.modelo}>
                    <TableCell className="text-sm font-medium text-[#3D3D3D]">
                      {preco.modelo}
                    </TableCell>
                    <TableCell className="text-sm text-[#707070] text-right tabular-nums">
                      {formatarDolares(preco.entrada_usd_por_milhao)}
                    </TableCell>
                    <TableCell className="text-sm text-[#707070] text-right tabular-nums">
                      {formatarDolares(preco.entrada_em_cache_usd_por_milhao)}
                    </TableCell>
                    <TableCell className="text-sm text-[#707070] text-right tabular-nums">
                      {formatarDolares(preco.saida_usd_por_milhao)}
                    </TableCell>
                    <TableCell className="text-sm text-[#707070]">
                      {format(
                        new Date(preco.atualizado_em),
                        "dd/MM/yyyy HH:mm",
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        aria-label={`Editar ${preco.modelo}`}
                        onClick={() => setEditando(preco)}
                        className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <Icon
                          icon="mdi:pencil"
                          className="w-4 h-4 text-[#348C98]"
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remover ${preco.modelo}`}
                        onClick={() => setRemovendo(preco)}
                        className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <Icon
                          icon="mdi:trash-can-outline"
                          className="w-4 h-4 text-[#DC2626]"
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              className="h-[56px]"
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
    <section className="w-full bg-white rounded-2xl shadow-sm p-6 max-md:p-4">
      <div className="flex items-center gap-3">
        <Icon icon="mdi:cash-multiple" className="w-8 h-8 text-[#BDBDBD]" />
        <h3 className="text-[20px] text-[#707070] font-bold">
          Margem e câmbio
        </h3>
      </div>

      <hr className="w-full my-4 h-px border-t-0 bg-gray-200" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-6"
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="text-xs text-[#707070]">
              É o preço de venda: o percentual somado ao custo para chegar ao
              valor a cobrar. Vale para qualquer período, inclusive meses já
              fechados — alterar a margem muda o valor a cobrar de todo o
              histórico. Hoje: {formatarPercentual(billing.margem_percentual)}.
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
            <p className="text-xs text-[#707070]">
              Converte o preço dos modelos, cobrado em dólar, para real. Vale só
              para as chamadas feitas a partir de agora: o custo de cada chamada
              é fixado no momento em que ela acontece.
            </p>
          </div>
        </div>

        <div className="w-full flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            isLoading={isSubmitting}
            iconLeft={
              <Icon icon="mdi:content-save" className="w-6 h-6 text-white" />
            }
            className="px-10 cursor-pointer max-md:w-full disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="px-8 cursor-pointer"
          >
            Salvar
          </Button>
        </div>
      </form>
    </>
  );
}
