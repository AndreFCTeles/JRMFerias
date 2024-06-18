import React, { useState, useEffect } from 'react';
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import { Button, SegmentedControl, Select, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';

import newAbsence from '../utils/absences/newAbsence';
import fetchWorkers from '../utils/workers/fetchWorkers';
import updateAbsence from '../utils/absences/updateAbsence';
import { CalendarEvent } from '../utils/types';

//WIP
//import calculateBusinessDays from '../utils/calculateBusinessDays';
//import isHolidayOrWeekend from '../utils/isHolidayOrWeekend';

interface AbsenceModalProps {
   onClose: () => void;
   onUpdateAbsences: () => void; 
   currentEvent?: CalendarEvent | null;
}

interface WorkerOption {
   value: string;
   label: string;
}

interface AbsenceFormData {
   selectedWorkerId: string;
   vacationType: 'vacation' | 'off-day';
   startDate: Date;
   endDate: Date;
}


// Component
const AbsenceModal: React.FC<AbsenceModalProps> = ({ onClose, onUpdateAbsences, currentEvent }) => {
   const [workers, setWorkers] = useState<WorkerOption[]>([]);
   const [showEndDateTooltip, setShowEndDateTooltip] = useState(false);

   const getVacationTypeFromId = (id: string): 'vacation' | 'off-day' => {
      const typeCode = id.split('-')[1];
      return typeCode === '1' ? 'vacation' : 'off-day';
   };

   const form = useForm<AbsenceFormData>({
      initialValues: {
         selectedWorkerId: currentEvent ? currentEvent.id : '',
         vacationType: currentEvent ? getVacationTypeFromId(currentEvent.eventId) : 'vacation',
         startDate: currentEvent ? new Date(currentEvent.start) : new Date(),
         endDate: currentEvent ? new Date(currentEvent.end) : new Date(),
      },
   });

   useEffect(() => {
      const fetchAndProcessWorkers = async () => {
         try {
            const fetchedWorkers = await fetchWorkers();
            const workerOptions = fetchedWorkers.map(worker => ({
               value: worker.id,
               label: worker.title,
            }));
            setWorkers(workerOptions);
         } catch (error) { console.error("Falha ao buscar colaboradores - Aplicação", error); }
      };

      fetchAndProcessWorkers();
   }, []);

   useEffect(() => {
      const shouldUpdateEndDate = form.values.vacationType === 'off-day' || form.values.startDate > form.values.endDate;
      if (shouldUpdateEndDate) { 
         form.setFieldValue('endDate', form.values.startDate);
         setShowEndDateTooltip(true);
         setTimeout(() => setShowEndDateTooltip(false), 3000);
      }
   }, [form, form.values.vacationType, form.values.startDate, form.setFieldValue]);

   const handleSubmit = async (values: AbsenceFormData) => {
      if (currentEvent) {         
         const updatedData = {
            start: values.startDate,
            end: values.endDate,
         };           
         console.log(updatedData) 
         try {
            await updateAbsence(currentEvent.eventId, updatedData);
            onUpdateAbsences();
            form.reset();
            onClose();
         } catch (error) { console.error("Error submitting absence:", error); }
      }
      else {
         try {
            console.log(form.values)   
            await newAbsence(values.selectedWorkerId, values.vacationType, values.startDate, values.endDate);
            console.log("Ausência adicionada com sucesso");
            onUpdateAbsences();
            form.reset();
            onClose();
         } catch (error) { console.error("Erro ao submeter ausência:", error); }
      }
   };

   return (
      <>
         <form onSubmit={form.onSubmit(handleSubmit)}>
            <SegmentedControl
               {...form.getInputProps('vacationType')}
               color="blue"
               mt="md"
               data={[
                  { label: 'Férias', value: 'vacation' },
                  { label: 'Ausência', value: 'off-day' },
               ]}
            />

            <Select
               mt='md'
               label="Selecione o colaborador"
               placeholder="Colaborador"
               {...form.getInputProps('selectedWorkerId')}
               data={workers}
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
                  required
               />
            </DatesProvider>

            {form.values.vacationType === 'vacation' && (
               <Tooltip label="" opened={showEndDateTooltip}>
                  <DatesProvider settings={{ locale: 'pt', firstDayOfWeek: 0 }}>
                     <DatePickerInput
                     mt='md'
                     label="Fim"
                     placeholder="Selecione data"
                     {...form.getInputProps('endDate')}
                     valueFormat='DD MMMM YYYY'
                     required
                     />
                  </DatesProvider>
               </Tooltip>
            )}

            <Button type='submit' mt='md'>Confirmar</Button>
         </form>
      </>
   );
};

export default AbsenceModal;
