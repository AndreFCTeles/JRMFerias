import React, {useState, useEffect} from "react";
import { Card, Text, Badge, Title , Group, ScrollArea, Tooltip, Modal, Button, Accordion, Stack, Grid } from '@mantine/core';
import { useContextMenu} from 'mantine-contextmenu';
import { Worker } from "../utils/types";

interface WorkerListProps {
   workers: Worker[];
   onWorkerEdit: (workerId: string) => void;
   onWorkerDelete: (WorkerID: string) => void;
   showNotification: (title: string, message: string, color: string) => void;
   isLoggedIn: boolean;
}

const WorkerList: React.FC<WorkerListProps> = ({ workers, onWorkerEdit, onWorkerDelete, showNotification, isLoggedIn }) => {
   const {showContextMenu} = useContextMenu();
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

   const [departmentGroups, setDepartmentGroups] = useState<Map<string, Worker[]>>(new Map());

   useEffect(() => {
      const groups = new Map<string, Worker[]>();
      workers.forEach((worker) => {
         const deptWorkers = groups.get(worker.dep || '') || [];
         groups.set(worker.dep || '', [...deptWorkers, worker]);
      });
      setDepartmentGroups(groups);
   }, [workers]);

   const handleConfirm = async () => {
      if (selectedWorkerId) {
         onWorkerDelete(selectedWorkerId);
         setIsConfirmOpen(false);
         setSelectedWorkerId(null);
      }
   };

   const accordionItems = Array.from(departmentGroups).map(([department, deptWorkers]) => (
      <Accordion.Item key={department} value={department}>
         <Accordion.Control>{department}</Accordion.Control>
         <Accordion.Panel px={0}>
            {deptWorkers.map((worker) => (
               <Tooltip openDelay={500}
               key={worker.id}
               label={isLoggedIn 
                  ? `Editar ou eliminar ${worker.title}` 
                  : 'Clique em "Login" e introduza as suas credenciais para editar informações de colaborador'
               }
               position="bottom"
               multiline
               w={200}
               >
                  <Card 
                  key={worker.id} 
                  className='worker_card' 
                  shadow="sm" 
                  mt="xs" 
                  mx="xs" 
                  radius="md" 
                  withBorder
                  onContextMenu={
                     showContextMenu([
                        isLoggedIn ? {                        
                           key: 'edit',
                           title: 'Editar dados',
                           onClick: () => onWorkerEdit(worker.id)
                        } : {
                           key: 'editLoginReminder',
                           title: 'Editar dados',
                           onClick: () => showNotification(
                              "Requer Login", 
                              'Por favor clique "Login" e introduza as suas credenciais de acesso para efetuar esta operação', 
                              "red"
                           ),
                        },                    
                        isLoggedIn ? {
                           key: 'del',
                           title: 'Eliminar colaborador',
                           onClick: () => {
                           setSelectedWorkerId(worker.id);
                           setIsConfirmOpen(true);
                           }
                        } : {
                           key: 'delLoginReminder',
                           title: 'Eliminar colaborador',
                           onClick: () => showNotification(
                              "Requer Login", 
                              'Por favor clique "Login" e introduza as suas credenciais de acesso para efetuar esta operação', 
                              "red"
                           ),
                        },
                     ])
                  }
                  onDoubleClick={() => onWorkerEdit(worker.id)}>
                     <Stack gap={0}>                     
                        <Group justify="space-between">
                           <Text fw={650}>Colaborador:</Text>
                           <Text fw={650}>Dias disponíveis:</Text>
                        </Group>
                        <Group w="100%">
                           <Grid w="100%" justify="space-between" align="stretch" grow>
                              <Grid.Col span={6}><Text fw={400} size="md" ta="left" style={{lineHeight:"1.2"}}>{worker.title}</Text></Grid.Col>
                              <Grid.Col span={6}><Badge color={worker.color}>{worker.avaDays}</Badge></Grid.Col>
                           </Grid>
                           
                           
                        </Group>
                     </Stack>
                  </Card>  
               </Tooltip>
            ))}
         </Accordion.Panel>
      </Accordion.Item>
   ));


   return (
      <> 
         <Title 
         py="md" 
         mb="xs" 
         order={3} 
         style={{ backgroundColor:"#269AFF", color:"#FFF" }}>Lista de Colaboradores</Title>

         <ScrollArea h={'full'}>
            <Accordion radius={0} chevronPosition="left" defaultValue={departmentGroups.keys().next().value}>
               {accordionItems}
            </Accordion> 
         </ScrollArea>

         <Modal 
         opened={isConfirmOpen} 
         onClose={() => setIsConfirmOpen(false)} 
         title="Confirmar"              
         style={{ left: "0%", position: "absolute" }}>
            <Text ta="center" mt="md">Tem certeza de que deseja eliminar colaborador?</Text>
            <Text ta="center" mt="md">Esta operação não pode ser revertida.</Text>
            <Group mt="md" justify='center'>
               <Button onClick={handleConfirm}>Confirmar</Button>
               <Button onClick={() => setIsConfirmOpen(false)} color="gray">Cancelar</Button>
            </Group>
         </Modal>
      </>
   );
};

export default WorkerList;