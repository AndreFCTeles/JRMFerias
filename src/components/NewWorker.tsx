// Frameworks
import React, {useState, useMemo, memo} from 'react';
import { 
   Text, 
   TextInput, 
   Button, 
   ColorInput, 
   NumberInput, 
   Modal, 
   Group, 
   Combobox, 
   InputBase, 
   useCombobox, 
   Grid 
} from '@mantine/core';
import { useForm } from '@mantine/form';
// Utils
import newWorker from '../utils/workers/newWorker';
import updateWorker from '../utils/workers/updateWorkers';
import { DepartmentData, JRMWorkerData } from '../utils/types';

// Props
interface WorkerModalProps {
   onClose: () => void;
   onUpdateWorkers: () => Promise<void>;
   showNotification: (title: string, message: string, color: string) => void;
   currentWorker: JRMWorkerData | null;
   departments: DepartmentData[];
   depCounts?: Map<string, number>; 
}




// COMPONENT
const WorkerModal: React.FC<WorkerModalProps> = ({ 
   onClose, 
   onUpdateWorkers, 
   showNotification, 
   currentWorker, 
   departments,
   depCounts
}) => {
   // STATES/VARS
   // UI
   //const [confirmOpen, setConfirmOpen] = useState(false);
   //const [confirmKind, setConfirmKind] = useState<'submit' | 'cancel' | ''>('');
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [actionType, setActionType] = useState<'submit' | 'cancel' | ''>('');
   const [confirmMessage, setConfirmMessage] = useState<string>('');
   //const [colorTouched, setColorTouched] = useState(false); // --------------------------------- Verificar se user mudou cor (para mudança de dep não dar override)
   // DepartmentName Combobox
   const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() }); // --- Previne loop de re-seleção de departamento
   const [search, setSearch] = useState(currentWorker?.dep || ''); // ---------------------------- Estado que gere procura de departamento 
   const depNames = useMemo(() => departments.map((d) => d.depName), [departments]); // ---------- Inicialização dos nomes de departamento
   const depColorMap = useMemo( // --------------------------------------------------------------- Inicialização das cores de departamento
      () => Object.fromEntries(departments.map((d) => [d.depName, d.depDefColor])),
      [departments]
   );
   const exactOptionMatch = useMemo(
      () => depNames.some((n) => n.toLowerCase() === search.toLowerCase().trim()),
      [depNames, search]
   );
   const filteredOptions = useMemo(
      () =>
         exactOptionMatch
         ? depNames
         : depNames.filter((n) => n.toLowerCase().includes(search.toLowerCase().trim())),
      [depNames, search, exactOptionMatch]
   );
   /*
   const options = filteredOptions.map((item) => (
      <Combobox.Option value={item} key={item}>
         {item}
      </Combobox.Option>
   ));
   */
   // const exactOptionMatch = departments.some((item) => item === search);
   /*
   const filteredOptions = exactOptionMatch
      ? departments
      : departments.filter((item) => item.toLowerCase().includes(search.toLowerCase().trim()));
   */
   // Form values init
   const form = useForm({
      initialValues: {
         title: currentWorker?.title || '',
         displayName: currentWorker?.displayName || '',
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
   const openConfirm = (kind: 'submit' | 'cancel', message: string) => {
      setActionType(kind);
      setConfirmMessage(message);
      setIsConfirmOpen(true);
   };
   const handleConfirm = async () => {
      if (actionType === 'submit') { await submitForm(); } 
      else if (actionType === 'cancel') { onClose(); }
      setIsConfirmOpen(false);
   };

   /*
   const handleActionClick = (action: 'submit' | 'cancel') => {
      setActionType(action);
      if (action === 'submit') {
         //const errors = form.validate();
         //console.log("errors:");
         //console.log(errors);
         if (!currentWorker || form.isDirty()) { setIsConfirmOpen(true); } 
         else { submitForm(); }
      } else {
         if (form.isDirty()) { setIsConfirmOpen(true); } 
         else { onClose(); }
      }
   };
   */

   const requestSubmit = () => {
      // basic validate
      const { hasErrors } = form.validate();
      if (hasErrors) return;

      if (currentWorker) {
         const originalDep = currentWorker.dep;
         const newDep = form.values.dep;
         const willOrphan =
            !!depCounts &&
            !!originalDep &&
            originalDep !== newDep &&
            depCounts.get(originalDep) === 1;

         if (willOrphan) {
            openConfirm(
               'submit',
               `Ao alterar o departamento, "${originalDep}" ficará sem colaboradores e será apagado. Deseja prosseguir?`
            );
            return;
         }

         openConfirm('submit', 'Tem certeza de que deseja atualizar dados do colaborador?');
         return;
      }

      // new worker confirm (optional – you already show a confirm; keep consistent)
      openConfirm('submit', 'Tem certeza de que deseja adicionar o novo colaborador?');
   };
   
   const requestCancel = () => {
      if (form.isDirty()) {
         openConfirm('cancel', 'Existem alterações não guardadas. Pretende cancelar?');
      } else { onClose(); }
   };





   // SUBMIT
   const submitForm = async () => {
      const values = form.values;

      try {
         if (currentWorker) {
            await updateWorker(currentWorker.id, values);
            showNotification('Sucesso!', 'Colaborador atualizado com sucesso', 'green');
         } else {
            await newWorker(values);
            showNotification('Sucesso!', 'Novo colaborador adicionado com sucesso', 'green');
         }
         await onUpdateWorkers(); // refetch workers + departments
         form.reset();
         onClose();
      } catch (err) {
         console.error(err);
         showNotification(
            'Erro',
            `Erro ao ${currentWorker ? 'atualizar' : 'adicionar'} colaborador.`,
            'red'
         );
      }
   };


   /*
   const submitForm = async () => {
      // validation check
      const { hasErrors } = form.validate();
      if (hasErrors) return;

      const values = form.values;

      // orphan dep check
      if (currentWorker) {
         const originalDep = currentWorker.dep;
         const newDep = form.values.dep;
         const willOrphan =
         !!depCounts &&
         !!originalDep &&
         originalDep !== newDep &&
         depCounts.get(originalDep) === 1;

         if (willOrphan) {
            openConfirm(
               'submit',
               `Ao alterar o departamento, "${originalDep}" ficará sem colaboradores e será apagado. Deseja prosseguir?`
            );
            return;
         }
      }

      try {
         let message = '';
         if (currentWorker) {
            //console.log(currentWorker.id);
            //console.log(values);
            await updateWorker(currentWorker.id, values);
            message = 'Colaborador atualizado com sucesso';
         } else {   
            //console.log(values);         
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
   */





   //JSX
   return (
      <>
         <form onSubmit={(e)=>{e.preventDefault();}}>
            <TextInput
            label="Nome do Colaborador:"
            placeholder="Nome completo"
            mt="md"
            required
            {...form.getInputProps('title')}
            />
            <TextInput
            label="Nome de apresentação:"
            placeholder="Nome"
            description="Opcional - p.ex. alcunha"
            mt="md"
            {...form.getInputProps('displayName')}
            />

            <Combobox
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(val) => {
               if (val === '$create') {
                  form.setFieldValue('dep', search);
                  setSearch(search);
               } 
               else { 
                  // existing department
                  form.setFieldValue('dep', val);
                  setSearch(val);

                  // default color behavior
                  const newDepColor = depColorMap[val];
                  if (newDepColor) { form.setFieldValue('color', newDepColor); }
                  /*
                  if (!currentWorker) {
                     if (newDepColor) form.setFieldValue('color', newDepColor);
                  } else {
                     const prevDepColor = currentWorker.dep ? depColorMap[currentWorker.dep] : undefined;
                     const stillDefault = prevDepColor && form.values.color === prevDepColor;
                     if (newDepColor && stillDefault && !colorTouched) {
                        form.setFieldValue('color', newDepColor);
                     }
                  }
                  */
               }
               combobox.closeDropdown();
            }} >
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
                  onFocus={() => {
                     combobox.openDropdown();
                     setSearch(form.values.dep || '');
                  }}
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
                     {filteredOptions.map((name) => (
                        <Combobox.Option value={name} key={name}>
                           {name}
                        </Combobox.Option>
                     ))}
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
               //defaultValue={0}
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
                     //defaultValue={0}
                     allowNegative={true}
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
                     //defaultValue={0}
                     allowNegative={true}
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
            onChange={(val) => {
               //if (!colorTouched) setColorTouched(true);
               form.setFieldValue('color', val);
            }} />
            
            <Group mt="md" justify='space-between'>
               {/*<Button onClick={() => handleActionClick('submit')} >{currentWorker ? 'Guardar Alterações' : 'Adicionar Colaborador'}</Button>
               <Button color="gray" onClick={() => handleActionClick('cancel')} >Cancelar</Button>*/}
               <Button onClick={requestSubmit}>
                  {currentWorker ? 'Guardar Alterações' : 'Adicionar Colaborador'}
               </Button>
               <Button color="gray" onClick={requestCancel}>
                  Cancelar
               </Button>
            </Group>
         </form>

         {/* Confirm */}
         <Modal 
         opened={isConfirmOpen} 
         onClose={() => setIsConfirmOpen(false)} 
         title="Confirmar"              
         style={{
            left: "0%",
            position: "absolute"
         }} >
            {/*
               <Text ta="center" mt="md">Tem certeza de que deseja {actionType === 'submit' ? (currentWorker ? 'atualizar dados' : 'adicionar o novo colaborador') : 'cancelar'}?</Text>
               <Group mt="md" justify='center'>
                  <Button onClick={handleConfirm}>Confirmar</Button>
                  <Button onClick={() => setIsConfirmOpen(false)} color="gray">Cancelar</Button>
               </Group>
            */}
            <Text ta="center" mt="md">{confirmMessage}</Text>
            <Group mt="md" justify="center">
               <Button onClick={handleConfirm}>Confirmar</Button>
               <Button onClick={() => setIsConfirmOpen(false)} color="gray">
                  Cancelar
               </Button>
            </Group>
         </Modal>
      </>
   );
};

export default memo(WorkerModal);
