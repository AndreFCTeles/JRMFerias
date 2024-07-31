// Frameworks
import React, { useEffect, useRef, useState, memo } from 'react';
import { DatePickerInput, DatesProvider, TimeInput  } from '@mantine/dates';
import { Button, SegmentedControl, Select, ActionIcon, Text, Flex, rem, Group, Modal } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
// Types
import { CalendarEvent, JRMWorkerData } from '../utils/types';
// Utils
import newAbsence from '../utils/absences/newAbsence';
import updateAbsence from '../utils/absences/updateAbsence';
import { 
   calculateBusinessDays, 
   calculateAbsenceHours,
   getWorkerFromId,
   getVacationTypeFromId
} from '../utils/generalUtils';

// Props
interface AbsenceModalProps {
   onClose: () => void;
   onUpdateAbsences: () => void; 
   currentEvent?: CalendarEvent | null;
   workers: JRMWorkerData[];
   defaultDate?: Date | null;
}
// Assert Form Values
interface AbsenceFormData {
   selectedWorkerId: string;
   vacationType: 'vacation' | 'off-day';
   startDate: Date | string;
   endDate: Date | string;
   allDay: 'true' | 'false';
   lunch: 'true' | 'false';
   lunchH: '1' | '1:30' | string;
   startTime: string;
   endTime: string;
}





// COMPONENT
const AbsenceModal: React.FC<AbsenceModalProps> = ({ onClose, onUpdateAbsences, currentEvent, workers, defaultDate }) => {
   // STATES/VARS
   // UI
   const [isFormReady, setIsFormReady] = useState(false);
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [actionType, setActionType] = useState<'submit' | 'cancel' | ''>('');
   // Icons
   const calIcon = <IconCalendar style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;
   const iconStartRef = useRef<HTMLInputElement>(null);
   const iconEndRef = useRef<HTMLInputElement>(null);
   const timeStartIcon = (
      <ActionIcon variant="subtle" color="gray" onClick={() => iconStartRef.current?.showPicker()}>
         <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
      </ActionIcon>
   );
   const timeEndIcon = (
      <ActionIcon variant="subtle" color="gray" onClick={() => iconEndRef.current?.showPicker()}>
         <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
      </ActionIcon>
   );
   
   // Form values init para novos eventos
   const isInitialized = useRef(false);
   const form = useForm<AbsenceFormData>({
      initialValues: {
         vacationType: 'vacation',
         selectedWorkerId: '',
         startDate: defaultDate || new Date(),
         endDate:  defaultDate || new Date(),
         allDay: 'true',
         lunch: 'false',
         lunchH: '1',
         startTime: dayjs(new Date()).format('HH:mm'),
         endTime: dayjs(new Date()).format('HH:mm'),
      },
   });

   // EFFECTS
   // Form values init para edição de eventos
   useEffect(() => { 
      if (!isInitialized.current) {
         if (currentEvent) {  

            console.log(" ");
            console.log("-----------------------------");
            console.log("SELECTED EVENT TO BE UPDATED:");
            console.log(" ");
            console.log("id of the selected event:", currentEvent.eventId);
            console.log("absenceType:", getVacationTypeFromId(currentEvent.eventId));

            form.setValues({
               vacationType: getVacationTypeFromId(currentEvent.eventId),
               selectedWorkerId: getWorkerFromId(currentEvent.eventId),
               startDate: dayjs(currentEvent.start).toDate(),
               endDate: dayjs(currentEvent.end).toDate(),
               allDay: currentEvent.allDay ? 'true' : 'false',
               lunch: currentEvent.lunch ? 'true' : 'false',
               lunchH: (workers.find(worker => worker.id === currentEvent.id)?.lunchH?.toString() ?? '1'),
               startTime: dayjs(currentEvent.start).format('HH:mm'),
               endTime: dayjs(currentEvent.end).format('HH:mm'),
            });
         } 
         else { form.reset(); }
         isInitialized.current = true;
         setIsFormReady(true);
      }
   }, [currentEvent, workers, form]);

   // Auto-validação de datas - manter start menor ou igual a end
   useEffect(() => {
      if (form.values.startDate > form.values.endDate || form.values.vacationType === 'off-day') {
         form.setFieldValue('endDate', form.values.startDate);
      } else if (form.values.endDate < form.values.startDate ){
         form.setFieldValue('startDate', form.values.endDate);         
      }
   }, [form.values.startDate, form]);






   // HANDLERS
   // UI
   const handleConfirm = async () => {
      if (actionType === 'submit') { await handleSubmit(form.values); } 
      else if (actionType === 'cancel') { onClose(); }
      setIsConfirmOpen(false);
   };
   const handleActionClick = (action: 'submit' | 'cancel') => {
      setActionType(action);
      if (action === 'submit') {
         const errors = form.validate();
         console.log("errors:");
         console.log(errors);
         if (!currentEvent || form.isDirty()) { setIsConfirmOpen(true); } 
         else { handleSubmit(form.values); }
      } else {
         if (form.isDirty()) { setIsConfirmOpen(true); } 
         else { onClose();  }
      }
   };
   
   // Submit
   const handleSubmit = async (values: AbsenceFormData) => {
      console.log(" ");
      console.log("-----------------------------");
      console.log("Submitting data (handleSubmit):");
      let startDateTime = dayjs(values.startDate).format('YYYY-MM-DD');
      let endDateTime = dayjs(values.endDate).format('YYYY-MM-DD');

      // Converter strings de SegmentedControl para booleans
      const allDay = values.allDay === 'true';
      const lunch = values.lunch === 'true';
      console.log("allDay:",allDay);
      console.log("lunch:",lunch);

      // Processamento de dados consoante tipo de ausência

      // Ausência parcial
      if (values.vacationType === 'off-day' && !allDay) {
         console.log("Partial day detected - calculating 'start' and 'end'...");
         const startTime = values.startTime || '00:00';
         const endTime = values.endTime || '00:00';

         startDateTime = `${startDateTime}T${startTime}`;
         endDateTime = `${endDateTime}T${endTime}`;
         
         console.log("start:",startDateTime);
         console.log("end:",endDateTime);
         console.log("----------------------------------------");
      } 

      // Férias ou Ausência (dia completo)
      let businessDays = 0;
      if (values.vacationType === 'vacation' || allDay) {
         console.log("Vacation or full-day absence detected - calculating business days...");
         businessDays = await calculateBusinessDays(dayjs(values.startDate), dayjs(values.endDate)); 
         console.log("businessDays:", businessDays);
         console.log("----------------------------------------");
      }      

      let absTime = values.vacationType === 'off-day' && !allDay ? calculateAbsenceHours(startDateTime, endDateTime) : 0;

      // Calcular hora de almoço
      if (lunch && !allDay) { 
         console.log("Partial absence includes lunch...")
         absTime = Math.max(absTime - parseFloat(values.lunchH), 0); 
         console.log("Total absTime:", absTime);
         console.log("----------------------------------------");
      } 

      // Encontrar worker selecionado (edição de dados existentes)
      const selectedWorker = workers.find(worker => worker.id === values.selectedWorkerId);
      if (selectedWorker) {
         const eventData = {
            id: currentEvent ? currentEvent.eventId : '',
            workerId: values.selectedWorkerId,
            type: values.vacationType,
            start: startDateTime,
            end: endDateTime,
            allDay: values.vacationType === 'vacation' || allDay,
            busDays: values.vacationType === 'vacation' ? businessDays : (allDay ? 1 : 0),
            absTime: values.vacationType === 'off-day' ? absTime : 0,
            lunch: values.vacationType === 'off-day' ? lunch : false
         };

         console.log(" ");
         console.log("----------------------------------------");
         console.log("SUBMITTING NEW ABSENCE FROM ABSENCEMODAL");
         console.log("----------------------------------------");
         console.log(" ");

         console.log("----------------------------------------");
         console.log('workers:', workers);
         //console.log('workers, stringified:', JSON.stringify(workers, null, 2));
         console.log('selectedWorker:', selectedWorker)
         //console.log('selectedWorker, stringified:', JSON.stringify(selectedWorker, null, 2));
         console.log("----------------------------------------");
         console.log("eventData before 'trying' to submit: ", eventData);

         // Submissão
         try {            
            console.log('Data to submit:');
            console.log(eventData);
            //console.log('Data to submit (stringified):', JSON.stringify(eventData, null, 2));
            console.log('Last date checks before submission:');
            console.log('eventData.start',eventData.start);
            console.log('eventData.end',eventData.end);
            console.log('startDateTime',startDateTime);
            console.log('endDateTime',endDateTime);
            console.log("----------------------------------------");
            console.log("Now submitting data...")
            
            if (currentEvent) {
               console.log('Event being updated:', currentEvent);
               await updateAbsence(workers, currentEvent.eventId, eventData);
               console.log("Ausência editada com sucesso");
               console.log("----------------------------");
            } else {
               await newAbsence(workers, values.selectedWorkerId, eventData);
               console.log("Ausência adicionada com sucesso");
               console.log("-------------------------------");
            }
            onUpdateAbsences();
            form.reset();
            onClose();
         } catch (error) {
            console.error("Erro ao submeter ausência:", error);
         }
      }
   };

   if (!isFormReady) return null;





   // JSX
   return (
      <>
         <form 
         onSubmit={form.onSubmit(handleSubmit)}
         style={{transition:'height 1s ease'}}
         >

            <Flex
            my={"sm"}
            gap="sm"
            justify="flex-start"
            align="stretch"
            direction="row"
            wrap="wrap"
            >
               <SegmentedControl
               {...form.getInputProps('vacationType')}
               w={"100%"}
               color="blue"
               data={[
                  { label: 'Férias', value: 'vacation' },
                  { label: 'Ausência', value: 'off-day' },
               ]} />
            </Flex>

            <Select
            mt='md'
            label="Selecione o colaborador"
            placeholder="Colaborador"
            {...form.getInputProps('selectedWorkerId')}
            data={workers.map(worker => ({ value: worker.id, label: worker.title }))}
            searchable
            required
            />

            <DatesProvider settings={{ locale: 'pt', firstDayOfWeek: 0 }}>
               <DatePickerInput
               mt='md'
               label={form.values.vacationType === 'vacation' ? "Início" : "Data da ausência"}
               placeholder="Selecione data"
               {...form.getInputProps('startDate')}
               valueFormat='DD MMMM YYYY'
               leftSection={calIcon}
               leftSectionPointerEvents="none"
               clearable
               required
               />
            </DatesProvider>

            {form.values.vacationType === 'vacation' && (          
               <DatesProvider settings={{ locale: 'pt', firstDayOfWeek: 0 }}>
                  <DatePickerInput
                  mt='md'
                  label="Fim"
                  placeholder="Selecione data"
                  {...form.getInputProps('endDate')}
                  valueFormat='DD MMMM YYYY'
                  leftSection={calIcon}
                  leftSectionPointerEvents="none"
                  clearable
                  required
                  />
               </DatesProvider>
            )}

            {form.values.vacationType === 'off-day' && (<>             

               <Flex
               gap="0"
               justify="flex-start"
               align="stretch"
               direction="column"
               wrap="wrap"
               mt='md'
               >
                  <Text size="sm" fw={500} mb={3}>Todo o dia</Text>
                  <SegmentedControl
                  color="blue"
                  {...form.getInputProps('allDay')}
                  data={[
                     { label: 'Sim', value: 'true' },
                     { label: 'Não', value: 'false' },
                  ]} />                     
               </Flex>

               {form.values.allDay === 'false' && (
                  <Flex
                  mt='md'
                  mx={0}
                  gap="sm"
                  justify="center"
                  align="center"
                  direction="row"
                  w={"100%"}
                  >
                     <TimeInput 
                     label="Início" 
                     {...form.getInputProps('startTime')} 
                     ref={iconStartRef} 
                     leftSection={timeStartIcon} 
                     w={"50%"}  
                     />
                     <TimeInput 
                     label="Fim" 
                     {...form.getInputProps('endTime')} 
                     ref={iconEndRef} 
                     leftSection={timeEndIcon} 
                     w={"50%"} />
                  </Flex>
               )}

               <Flex // Lunch container
               justify="center"
               align="stretch"
               wrap="nowrap"
               w={"100%"}
               >
                  {form.values.allDay === 'false' && (
                     <>
                        <Flex
                        gap="0"
                        justify="center"
                        align="stretch"
                        direction="column"
                        wrap="nowrap"
                        w={"50%"}
                        mt={"sm"}
                        >
                           <Text size="md" fw={500}>Coincide com almoço?</Text>
                           <SegmentedControl
                           color="blue"
                           w={"100%"}
                           {...form.getInputProps('lunch')}
                           data={[
                              { label: 'Sim', value: 'true' },
                              { label: 'Não', value: 'false' },
                           ]} />    
                        </Flex>
                        <Flex
                        gap="xs"
                        justify={form.values.lunch === 'true' ? "center" : "flex-start"}
                        align="stretch"
                        direction="row"
                        wrap="nowrap"
                        w={"50%"}
                        >
                           {form.values.lunch === 'true' && (
                              <Flex
                              gap="0"
                              justify="center"
                              align="stretch"
                              direction="column"
                              wrap="nowrap"
                              w={"100%"}
                              mt={"sm"}
                              >
                                 <Text size="md" fw={500}>Duração</Text>
                                 <SegmentedControl
                                 color="blue"
                                 w={"100%"}
                                 {...form.getInputProps('lunchH')}
                                 data={[
                                    { label: '1h', value: '1' },
                                    { label: '1:30', value: '1:30' },
                                 ]} />   
                              </Flex>  
                           )}    
                        </Flex>
                     </>
                  )}                     
               </Flex> 
            </>)}
            
            <Group mt="md" justify='space-between'>
               <Button onClick={() => handleActionClick('submit')} >{currentEvent ? 'Guardar Alterações' : 'Criar Evento'}</Button>
               <Button color="gray" onClick={() => handleActionClick('cancel')} >Cancelar</Button>
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
            <Text ta="center" mt="md">Tem certeza de que deseja {actionType === 'submit' ? (currentEvent ? 'atualizar dados' : 'criar esta ausência') : 'cancelar'}?</Text>
            <Group mt="md" justify='center'>
               <Button onClick={handleConfirm}>Confirmar</Button>
               <Button onClick={() => setIsConfirmOpen(false)} color="gray">Cancelar</Button>
            </Group>
         </Modal>
      </>
   );
};

export default memo(AbsenceModal);
