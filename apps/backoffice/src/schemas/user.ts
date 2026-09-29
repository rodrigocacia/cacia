import { z } from 'zod';

export const userFormSchema = z
  .object({
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
    // Mesmo mínimo da API (CriarUsuarioDto): com 1 aqui, a senha curta passava
    // na tela e voltava recusada do servidor.
    password: z.string().min(8, 'A senha precisa de ao menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((dados) => dados.password === dados.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
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
