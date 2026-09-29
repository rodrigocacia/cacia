import { z } from 'zod';

const fieldLabels: Record<string, string> = {
  street: 'Rua',
  number: 'Número',
  cep: 'CEP',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
};

/**
 * Campos do escritório, comuns ao cadastro e à edição.
 *
 * Os do dono ficam opcionais AQUI e são exigidos só no cadastro (ver
 * `officeFormSchema`). Com eles obrigatórios no esquema único, a edição —
 * que não mostra dono nem senha — nunca passava na validação.
 *
 * Razão social, nome fantasia e biografia são opcionais como na API: exigir
 * seis caracteres impedia cadastrar advogado autônomo sem razão social.
 */
const camposDoEscritorio = z.object({
  name: z.string().min(2, { message: 'Insira um nome válido' }),
  document: z.string().refine(
    (val) => {
      const cleanVal = val.replace(/\D/g, '');
      return cleanVal.length === 11 || cleanVal.length === 14;
    },
    { message: 'Insira um CPF ou CNPJ válido' },
  ),
  legal_name: z.string().optional(),
  trade_name: z.string().optional(),
  remotejid: z
    .string()
    .min(6, { message: 'Insira um número de telefone válido' }),
  description: z.string().optional(),

  /**
   * Registro na OAB.
   *
   * Obrigatório: o escritório é de advocacia, e a API recusa o cadastro sem
   * ele. Antes o campo não existia no formulário e o cadastro nascia
   * incompleto.
   */
  oab_number: z.string().min(1, { message: 'Insira o número da OAB' }),
  oab_uf: z.string().length(2, { message: 'Informe a UF da OAB com 2 letras' }),

  owner_name: z.string().optional(),
  owner_email: z.string().optional(),
  owner_password: z.string().optional(),
  owner_phone: z.string().optional(),

  street: z.string().optional(),
  number: z.string().optional(),
  cep: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type CamposDoEscritorio = z.infer<typeof camposDoEscritorio>;

/** Endereço é opcional, mas começado precisa estar completo. */
function validarEndereco(data: CamposDoEscritorio, ctx: z.RefinementCtx) {
  const fieldsAddress = ['street', 'number', 'cep', 'neighborhood', 'city'];

  const hasAddress = fieldsAddress.some((field) => {
    const value = (data as Record<string, string | undefined>)[field];
    return value && value.trim() !== '';
  });

  if (!hasAddress) return;

  fieldsAddress.forEach((field) => {
    const value = (data as Record<string, string | undefined>)[field];
    if (!value || value.trim() === '') {
      ctx.addIssue({
        path: [field],
        code: z.ZodIssueCode.custom,
        message: `O campo ${fieldLabels[field]} é obrigatório ao preencher o endereço`,
      });
    }
  });
}

const emailValido = z.string().email();

/**
 * O dono do escritório, exigido só no cadastro.
 *
 * Nasce junto: um escritório sem membro é inacessível — o acesso passa por
 * office_members, e nem quem o criou conseguiria entrar.
 */
function validarDono(data: CamposDoEscritorio, ctx: z.RefinementCtx) {
  if (!data.owner_name || data.owner_name.trim().length < 2) {
    ctx.addIssue({
      path: ['owner_name'],
      code: z.ZodIssueCode.custom,
      message: 'Insira o nome do responsável',
    });
  }

  if (!emailValido.safeParse(data.owner_email ?? '').success) {
    ctx.addIssue({
      path: ['owner_email'],
      code: z.ZodIssueCode.custom,
      message: 'Insira um e-mail válido',
    });
  }

  if (!data.owner_password || data.owner_password.length < 8) {
    ctx.addIssue({
      path: ['owner_password'],
      code: z.ZodIssueCode.custom,
      message: 'A senha precisa de ao menos 8 caracteres',
    });
  }
}

export const officeFormSchema = camposDoEscritorio.superRefine((data, ctx) => {
  validarDono(data, ctx);
  validarEndereco(data, ctx);
});

export const officeEditSchema = camposDoEscritorio.superRefine(validarEndereco);

export type OfficeFormData = CamposDoEscritorio;
