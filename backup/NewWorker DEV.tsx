import React, {useState, useEffect} from 'react';
import { Text, TextInput, Button, ColorInput, NumberInput, Modal, Group } from '@mantine/core';
import { useForm } from '@mantine/form';

import newWorker from '../src/utils/workers/newWorker';
import updateWorker from '../src/utils/workers/updateWorkers';
import { Worker } from '../src/utils/types';

interface WorkerModalProps {
   onClose: () => void;
   onUpdateWorkers: () => Promise<void>;
   showNotification: (title: string, message: string, color: string) => void;
   currentWorker: Worker | null;
}

const WorkerModal: React.FC<WorkerModalProps> = ({ onClose, onUpdateWorkers, showNotification, currentWorker }) => {
   //STATES
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);

   const form = useForm({
      initialValues: {
         title: currentWorker?.title || '',
         dep: currentWorker?.dep || '',
         color: currentWorker?.color || '#000000',
         avaDays: currentWorker?.avaDays || 0,
      },
      validate: {
         title: (value) => (value.trim() ? null : 'Nome de colaborador obrigatório'),
         dep: (value) => (value.trim() ? null : 'Departamento do colaborador obrigatório'),
      },
   });

   // Enhanced to handle direct closure attempts (e.g., clicking the modal's close button)
   const enhancedOnClose = () => {
      if (form.isDirty() || !currentWorker) { setIsConfirmOpen(true); } 
      else { onClose(); }
   };

   const handleFormSubmit = async () => {
      try {
         const values = form.values;
         let message = '';
         if (currentWorker) {
            await updateWorker(currentWorker.id, values);
            message = 'Colaborador atualizado com sucesso';
         } else {
            await newWorker(values);
            message = 'Novo colaborador adicionado com sucesso';
         }
         await onUpdateWorkers();
         showNotification("Sucesso!", message, "green");
         form.reset();
         onClose();
      } catch (error) {
         console.error("Erro na operação de colaborador:", error);
         showNotification("Erro", `Erro ao ${currentWorker ? 'atualizar' : 'adicionar'} colaborador.`, "red");
      }
   };

   // Logic to decide if we need to show the confirmation modal before submitting
   const confirmSubmission = () => {
      if (form.isDirty() || !currentWorker) { setIsConfirmOpen(true); } 
      else { handleFormSubmit(); }
   };

   //JSX
   return (
      <>
         <form onSubmit={form.onSubmit(confirmSubmission)}>
            <TextInput
               label="Nome do Colaborador:"
               placeholder="Nome"
               mt="md"
               required
               {...form.getInputProps('title')}
            />
            <TextInput
               label="Departamento:"
               placeholder="Departamento"
               mt="md"
               required
               {...form.getInputProps('dep')}
            />
            <NumberInput
               label="Dias disponíveis:"
               suffix=" dias"
               description="para férias ou ausências"
               mt="md"
               defaultValue={0}
               allowNegative={false}
               allowDecimal={false}
               stepHoldDelay={500}
               stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
               {...form.getInputProps('avaDays')}
            />
            <ColorInput
               label="Cor associada:"
               mt="md"
               {...form.getInputProps('color')}
            />
            <Group mt="md" justify='space-between'>
               <Button 
               onClick={() => handleActionClick('submit')}>{currentWorker ? 'Guardar Alterações' : 'Adicionar Colaborador'}</Button>
               <Button 
               color="gray" 
               onClick={() => handleActionClick('cancel')}>Cancelar</Button>
            </Group>
         </form>

         <Modal 
         opened={isConfirmOpen} 
         onClose={() => setIsConfirmOpen(false)} 
         title="Confirmar"              
         style={{
            left: "0%",
            position: "absolute"
         }} >
            <Text ta="center" mt="md">{currentWorker ? "Tem certeza de que deseja atualizar as informações?" : "Tem certeza de que deseja adicionar este colaborador?"}</Text>
            <Group mt="md" justify='center'>
               <Button onClick={handleFormSubmit}>Confirmar</Button>
               <Button onClick={() => setIsConfirmOpen(false)} color="gray">Cancelar</Button>
            </Group>
         </Modal>
      </>
   );
};

export default WorkerModal;
