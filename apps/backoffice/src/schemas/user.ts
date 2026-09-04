import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  document: z.string().refine(
    (val) => {
      const cleanVal = val.replace(/\D/g, '');
      return cleanVal.length === 11 || cleanVal.length === 14;
    },
    { message: 'Insira um CPF ou CNPJ válido' },
  ),
  birthday: z.string().min(1, 'Data de nascimento é obrigatória'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
});

export const userUpdateFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  document: z.string().refine(
    (val) => {
      const cleanVal = val.replace(/\D/g, '');
      return cleanVal.length === 11 || cleanVal.length === 14;
    },
    { message: 'Insira um CPF ou CNPJ válido' },
  ),
  birthday: z.string().min(1, 'Data de nascimento é obrigatória'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
});

export type UserFormData = z.infer<typeof userFormSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateFormSchema>;
