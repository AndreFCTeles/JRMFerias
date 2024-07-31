//Frameworks
import React, { useState, FormEvent, memo } from 'react';
import { TextInput, Button, PasswordInput, Center } from '@mantine/core';

// Props
interface LoginProps {
   onLoginSuccess: (username: string, password: string) => Promise<void>;
   onClose: () => void; 
}
// Assert Form Values
interface User {
   username: string;
   password: string;
}



// COMPONENT
const LoginModal: React.FC<LoginProps> = ({onLoginSuccess, onClose}) => {
   // STATES
   const [username, setUsername] = useState('');
   const [password, setPassword] = useState('');

   // HANDLERS
   const handleLogin = async (e: FormEvent) => {
      e.preventDefault();
      try {
         const res = await fetch('/api/getloginferias');
         if (!res.ok) throw new Error('Erro ao buscar credenciais');
         const data = await res.json();
         const user = data.credentials.find((u: User) => u.username === username && u.password === password);

         if (user) {
            onLoginSuccess(username, password);
            onClose();
         } else {
            alert('Credenciais inválidas');
         }
      } catch (error) {
            console.error("Erro ao buscar dados de login:", error);
            alert('Ocorreu um erro. Por favor tente novamente.');
      }
   };


   // JSX
   return (
      <>      
         <form onSubmit={handleLogin}>
            <TextInput
               label="Nome de utilizador"
               placeholder="nome"
               mt="md"
               value={username}
               data-autofocus
               required
               onChange={(event) => setUsername(event.currentTarget.value)}
            />
            <PasswordInput
               label="Password"
               placeholder="password"
               type="password"
               mt="md"
               value={password}
               required
               onChange={(event) => setPassword(event.currentTarget.value)}        
            />
            <Center>
               <Button type='submit' mt='md'>Login</Button>
            </Center>
         </form>
      </>
   );
};

export default memo(LoginModal);
