import React, { useState, useEffect  } from 'react';
import { DatePickerInput , DatesProvider} from '@mantine/dates';
import { Button, SegmentedControl, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import fetchWorkers from '../src/utils/dataManager';

interface AbsenceModalProps { onClose: () => void; }

interface WorkerOption {
   id: number | string;
   title: string;
}

interface AbsenceFormData {
   selectedWorkerName: string | null;
   vacationType: 'vacation' | 'off-day';
   startDate: Date;
   endDate: Date;
}

const AbsenceModal: React.FC<AbsenceModalProps> = ({ onClose }) => {
   const [workers, setWorkers] = useState<WorkerOption[]>([]);
   const form = useForm<AbsenceFormData>({
      initialValues: {
         selectedWorkerName: null,
         vacationType: 'vacation',
         startDate: new Date(),
         endDate: new Date(),
      },
   });
   
   useEffect(() => {
      fetchWorkers().then(fetchedWorkers => {   
         setWorkers(fetchedWorkers);
      }).catch(error => console.error("Falha ao buscar colaboradores", error));
   }, []);
   
   const handleSubmit = async (values: AbsenceFormData) => {
      const selectedWorker = workers.find(worker => worker.title === values.selectedWorkerName);    
      if (!selectedWorker) {
         console.error("Colaborador não selecionado");
         return;
      }

      try {
         const response = await fetch('/api/postferias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               id: selectedWorker.id,
               absence: {
                  start: values.startDate.toISOString().slice(0, 10),
                  end: values.endDate.toISOString().slice(0, 10),
               },
               type: values.vacationType,
            }),
         });

         if (!response.ok) { throw new Error('Falha ao submeter ausência'); }
         console.log("Ausência submetida com sucesso");
         form.reset();
         onClose();
      } catch (error) { console.error("Erro ao submeter ausência:", error); }
   };

   return (
      <form onSubmit={form.onSubmit(handleSubmit)}>
         <SegmentedControl
            {...form.getInputProps('vacationType')}
            color="blue"
            fw={250}
            data={[
               { label: 'Férias', value: 'vacation' },
               { label: 'Ausência', value: 'off-day' },
            ]}
         />        

         <Select
         mt='md'
         label="Selecione o colaborador"
         placeholder="colaborador"
         {...form.getInputProps('selectedWorker')}
         data={workers.map(worker => worker.title)}
         searchable
         required
         />
         
            <DatesProvider settings={{locale: 'pt', firstDayOfWeek: 0}}>
               <DatePickerInput
                  mt='md'
                  label={( form.values.vacationType === 'vacation' ) ? ( "Início" ) : ( "Data da ausência" )}
                  valueFormat="DD MMM YYYY"
                  placeholder="Selecione data"
                  {...form.getInputProps('startDate')}
                  required
               />
            </DatesProvider>
         
         {form.values.vacationType === 'vacation' && (
            <DatesProvider settings={{locale: 'pt', firstDayOfWeek: 0}}>
               <DatePickerInput
                  mt='md'
                  label="Fim"
                  valueFormat="DD MMM YYYY"
                  placeholder="Selecione data"
                  {...form.getInputProps('endDate')}
                  required
               />
            </DatesProvider>
         )}
         <Button type='submit' mt='md'>Confirmar</Button>
      </form>
   );
};

export default AbsenceModal;