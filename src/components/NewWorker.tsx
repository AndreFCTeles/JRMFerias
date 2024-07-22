import React, {useState} from 'react';
import { Text, TextInput, Button, ColorInput, NumberInput, Modal, Group, Combobox, InputBase, useCombobox, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';

import newWorker from '../utils/workers/newWorker';
import updateWorker from '../utils/workers/updateWorkers';
import { JRMWorkerData } from '../utils/types';

interface WorkerModalProps {
   onClose: () => void;
   onUpdateWorkers: () => Promise<void>;
   showNotification: (title: string, message: string, color: string) => void;
   currentWorker: JRMWorkerData | null;
   departments: string[];
}




// Component
const WorkerModal: React.FC<WorkerModalProps> = ({ onClose, onUpdateWorkers, showNotification, currentWorker, departments }) => {
   //STATES
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [actionType, setActionType] = useState('');   
   const [search, setSearch] = useState(currentWorker?.dep || '');

   
   const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
   const exactOptionMatch = departments.some((item) => item === search);
   const filteredOptions = exactOptionMatch
      ? departments
      : departments.filter((item) => item.toLowerCase().includes(search.toLowerCase().trim()));

   const options = filteredOptions.map((item) => (
      <Combobox.Option value={item} key={item}>
         {item}
      </Combobox.Option>
   ));

   const form = useForm({
      initialValues: {
         title: currentWorker?.title || '',
         dep: currentWorker?.dep || '',
         color: currentWorker?.color || '#000000',
         avaDays: currentWorker?.avaDays || 0,
         compH: currentWorker?.compH || 0,
         lunchH: currentWorker?.lunchH || 1
      },
      validate: { 
         title: (value) => (value.trim() ? null : 'Nome de colaborador obrigatório'),
         dep: (value) => (value.trim() ? null : 'Departamento do colaborador obrigatório'),
      },
   });





   // HANDLERS
   const handleFieldChange = (field: string, value: string) => {
      form.setFieldValue(field, value);
      if (value.trim() !== '') { form.setFieldError(field, null); }
   };
   const handleConfirm = async () => {
      if (actionType === 'submit') { await submitForm(); } 
      else if (actionType === 'cancel') { onClose(); }
      setIsConfirmOpen(false);
   };
   const handleActionClick = (action: 'submit' | 'cancel') => {
      setActionType(action);
      if (action === 'submit') {
         const errors = form.validate();
         console.log("errors:");
         console.log(errors);
         if (!currentWorker || form.isDirty()) { setIsConfirmOpen(true); } 
         else { submitForm(); }
      } else {
         if (form.isDirty()) { setIsConfirmOpen(true); } 
         else { onClose(); }
      }
   };





   // SUBMIT
   const submitForm = async () => {
      const values = form.values;
      try {
         let message = '';
         if (currentWorker) {
            await updateWorker(currentWorker.id, values);
            message = 'Colaborador atualizado com sucesso';
         } else {            
            await newWorker(values);
            message = 'Novo colaborador adicionado com sucesso';
         }
         await onUpdateWorkers();
         form.reset();
         showNotification("Sucesso!", message, "green");
         onClose();
      } catch (error) {
         console.error("Erro na operação de colaborador:", error);
         showNotification("Erro", `Erro ao ${currentWorker ? 'atualizar' : 'adicionar'} colaborador.`, "red");
      }
   };





   //JSX
   return (
      <>
         <form onSubmit={(e)=>{e.preventDefault();}}>
            <TextInput
            label="Nome do Colaborador:"
            placeholder="Nome"
            mt="md"
            required
            {...form.getInputProps('title')}
            onChange={(event) => handleFieldChange('title', event.currentTarget.value)}
            />

            <Combobox
            withinPortal={false}
            store={combobox}
            onOptionSubmit={(val) => {
               if (val === '$create') {
                  const newDepartment = search;
                  form.setFieldValue('dep', newDepartment);
                  setSearch(newDepartment);
               } 
               else { form.setFieldValue('dep', val); }
               combobox.closeDropdown();
               setSearch(val);
            }}
            >
               <Combobox.Target>
                  <InputBase
                  rightSection={<Combobox.Chevron />}
                  rightSectionPointerEvents="none"
                  label="Departamento"
                  placeholder="Departamento"
                  description="Escolha da lista ou crie um novo departamento"
                  mt="md"
                  required
                  value={search}
                  onClick={() => combobox.openDropdown()}
                  onFocus={() => combobox.openDropdown()}
                  onChange={(event) => {
                     combobox.openDropdown();
                     combobox.updateSelectedOptionIndex();
                     setSearch(event.currentTarget.value);
                  }}
                  onBlur={() => {
                     combobox.closeDropdown();
                     if (!exactOptionMatch) setSearch(form.values.dep || '');
                  }}
                  />
               </Combobox.Target>
               <Combobox.Dropdown>
                  <Combobox.Options>
                     {options}
                     {!exactOptionMatch && search.trim().length > 0 && (
                        <Combobox.Option value="$create">+ Criar "{search}"</Combobox.Option>
                     )}
                  </Combobox.Options>
               </Combobox.Dropdown>
            </Combobox>


            {!currentWorker ?
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
            :
               <Grid>
                  <Grid.Col span={6}>
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
                  </Grid.Col>
                  <Grid.Col span={6}>
                     <NumberInput
                     label="Horas a compensar:"
                     suffix=" horas"
                     description="de ausências parciais"
                     mt="md"
                     defaultValue={0}
                     allowNegative={false}
                     allowDecimal={false}
                     stepHoldDelay={500}
                     stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
                     {...form.getInputProps('compH')}
                     />
                     </Grid.Col>
               </Grid>
            }

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
            <Text ta="center" mt="md">Tem certeza de que deseja {actionType === 'submit' ? (currentWorker ? 'atualizar dados' : 'adicionar o novo colaborador') : 'cancelar'}?</Text>
            <Group mt="md" justify='center'>
               <Button onClick={handleConfirm}>Confirmar</Button>
               <Button onClick={() => setIsConfirmOpen(false)} color="gray">Cancelar</Button>
            </Group>
         </Modal>
      </>
   );
};

export default WorkerModal;
