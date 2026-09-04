import { z } from 'zod';

const fieldLabels: Record<string, string> = {
  street: 'Rua',
  number: 'Número',
  cep: 'CEP',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
};

export const officeFormSchema = z
  .object({
    name: z.string().min(6, { message: 'Insira um nome válido' }),
    document: z.string().refine(
      (val) => {
        const cleanVal = val.replace(/\D/g, '');
        return cleanVal.length === 11 || cleanVal.length === 14;
      },
      { message: 'Insira um CPF ou CNPJ válido' },
    ),
    legal_name: z.string().min(6, { message: 'Insira um nome legal válido' }),
    trade_name: z
      .string()
      .min(6, { message: 'Insira um nome comercial válido' }),
    remotejid: z
      .string()
      .min(6, { message: 'Insira um número de telefone válido' }),
    description: z.string().min(6, { message: 'Insira uma biografia válida' }),
    street: z.string().optional(),
    number: z.string().optional(),
    cep: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const fieldsAddress = ['street', 'number', 'cep', 'neighborhood', 'city'];

    const hasAddress = fieldsAddress.some((field) => {
      const value = (data as Record<string, string>)[field];
      return value && value.trim() !== '';
    });

    if (hasAddress) {
      fieldsAddress.forEach((field) => {
        const value = (data as Record<string, string>)[field];
        if (!value || value.trim() === '') {
          ctx.addIssue({
            path: [field],
            code: z.ZodIssueCode.custom,
            message: `O campo ${fieldLabels[field]} é obrigatório ao preencher o endereço`,
          });
        }
      });
    }
  });

export type OfficeFormData = z.infer<typeof officeFormSchema>;
