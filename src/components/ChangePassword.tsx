import React, { useState } from 'react';
import { 
   PasswordInput, 
   Button, 
   Stack, 
   Group, 
   Text 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import login from '../utils/auth';
import { CredentialSafe, LS_AUTH, LS_KEEP, APP_NAME } from '../utils/types';

type Props = {
   user: CredentialSafe;
   appName?: string;
   onSuccess?: () => void;
   onCancel?: () => void;
};

const ChangePassword: React.FC<Props> = ({ user, appName = APP_NAME, onSuccess, onCancel }) => {
   const [submitting, setSubmitting] = useState(false);
   const [serverErr, setServerErr] = useState<string | null>(null);
   const appRole = user.apps?.[appName]?.roles ?? user.roles;
   const canChange = appRole && appRole !== 'user';
   const form = useForm({
      initialValues: { oldPw: '', newPw: '', confirmPw: '' },
      validate: {
         oldPw: (v) => (!!v ? null : 'Obrigatório'),
         newPw: (v, vals) => v && v.length >= 6 && v !== vals.oldPw ? null : 'Mín. 6 e diferente da atual',
         confirmPw: (v, vals) => (v === vals.newPw ? null : 'As palavras-passe não coincidem'),
      },
      validateInputOnChange: true,
   });

   const handleSubmit = form.onSubmit(async ({ oldPw, newPw }) => {
      if (!canChange) {
         setServerErr('Sem permissões para alterar a palavra-passe.');
         return;
      }
      setSubmitting(true);
      setServerErr(null);
      try {
         // Verify old password (per-app access enforced server-side)
         await login(user.username, oldPw, appName);

         // Update app-scoped password
         const res = await fetch(`/api/auth/updateuser/${user._id}/password`, {
            method: 'PATCH',
            headers: { 
               'Content-Type': 'application/json',
               'x-actor': user.username
            },
            body: JSON.stringify({ 
               scope: 'app', 
               appName, 
               newPassword: newPw 
            }),
         });
         const json = await res.json().catch(() => ({}));
         if (!res.ok) throw new Error(json?.error || 'Falha ao alterar a palavra-passe');

         // Refresh saved creds if keep-login is ON
         if (localStorage.getItem(LS_KEEP) === '1') {
            localStorage.setItem(
               LS_AUTH,
               JSON.stringify({
                  username: user.username,
                  password: newPw,     // new appPass
                  app: appName ?? APP_NAME,
               })
            );
         }

         onSuccess?.();
         form.reset();
      } catch (e: any) {
         const msg = e?.message || 'Não foi possível alterar a palavra-passe';
         // Map likely errors to fields for better UX:
         if (/inválidas|password/i.test(msg)) form.setFieldError('oldPw', 'Palavra-passe atual incorreta');
         else if (/fraca|min/i.test(msg)) form.setFieldError('newPw', 'Requisitos mínimos não cumpridos');
         else setServerErr(msg);
      } finally { setSubmitting(false); }
   });



   return (
      <form onSubmit={handleSubmit}>
         <Stack gap="sm">
            <PasswordInput 
            label="Palavra-passe atual" 
            required 
            data-autofocus
            {...form.getInputProps('oldPw')}
            />
            <PasswordInput 
            label="Nova palavra-passe" 
            required 
            {...form.getInputProps('newPw')} 
            />
            <PasswordInput 
            label="Confirmar nova palavra-passe" 
            required 
            {...form.getInputProps('confirmPw')} 
            />
            {serverErr && <Text c="red" size="sm">{serverErr}</Text>}
            <Group justify="flex-end" mt="xs">
               {onCancel && (
                  <Button  
                  color="gray"
                  onClick={onCancel} 
                  disabled={submitting}>
                     Cancelar
                  </Button>
               )}
               <Button type="submit" loading={submitting}>
                  Guardar
               </Button>
            </Group>
         </Stack>
      </form>
   );
}

export default ChangePassword