import React, {useState, useEffect} from "react";
import { Card, Text, Badge, Title , Group, ScrollArea, Tooltip, Modal, Button, Accordion, Stack, Grid } from '@mantine/core';
import { useContextMenu} from 'mantine-contextmenu';
import { JRMWorkerData } from "../utils/types";

interface WorkerListProps {
   workers: JRMWorkerData[];
   onWorkerEdit: (workerId: string) => void;
   onWorkerDelete: (WorkerID: string) => void;
   showNotification: (title: string, message: string, color: string) => void;
   isLoggedIn: boolean;
}

const WorkerList: React.FC<WorkerListProps> = ({ workers, onWorkerEdit, onWorkerDelete, showNotification, isLoggedIn }) => {
   const { showContextMenu } = useContextMenu();
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
   const [departmentGroups, setDepartmentGroups] = useState<Map<string, JRMWorkerData[]>>(new Map());

   useEffect(() => {
      const groups = new Map<string, JRMWorkerData[]>();
      workers.forEach((worker) => {
         const deptWorkers = groups.get(worker.dep || '') || [];
         groups.set(worker.dep || '', [...deptWorkers, worker]);
      });
      // Sort workers by first name within each department
      groups.forEach((deptWorkers) => {
         deptWorkers.sort((a, b) => {
         const [aFirstName] = a.title.split(' ');
         const [bFirstName] = b.title.split(' ');
         return aFirstName.localeCompare(bFirstName);
         });
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

   const getDayColor = (value: number) => {
      if (value >= 0 && value < 5) return 'red';
      if (value >= 5 && value < 10) return 'orange';
      if (value >= 10 && value < 15) return 'yellow';
      return 'green';
   };
   const getHourColor = (value: number) => {
      if (value >= 0 && value < 3) return 'green';
      if (value >= 3 && value < 5) return 'yellow';
      if (value >= 5 && value < 8) return 'orange';
      return 'red';
   };

   const cardHeight = 100; // Estimated height of each card (including margin/padding)
   const maxVisibleCards = 5;
   const maxVisibleHeight = cardHeight * maxVisibleCards;

   const accordionItems = Array.from(departmentGroups).map(([department, deptWorkers]) => (
      <Accordion.Item key={department} value={department}>
         <Accordion.Control>{department}</Accordion.Control>
         <Accordion.Panel px={0}>            
            <ScrollArea 
            h={deptWorkers.length > maxVisibleCards ? maxVisibleHeight : 'auto'}
            w={"100%"}  
            px={0}
            mx={0}
            scrollbarSize={6}
            offsetScrollbars>
               {deptWorkers.map((worker) => {
                  const fullName = worker.title;
                  const nameParts = fullName.split(' ');
                  const firstName = nameParts[0];
                  const lastName = nameParts[nameParts.length - 1];
                  const displayName = firstName + (nameParts.length > 1 ? (' ' + lastName) : '');

                  return (
                     <Tooltip openDelay={500}
                     key={worker.id}
                     label={isLoggedIn 
                        //? `Editar ou eliminar ${worker.title}` 
                        ? `Editar ou eliminar ${displayName}` 
                        : 'Clique em "Login" e introduza as suas credenciais para editar informações de colaborador'
                     }
                     position="bottom"
                     multiline
                     //w={200}
                     >
                        <Card 
                        key={worker.id} 
                        className='worker_card' 
                        shadow="sm" 
                        //color={worker.color}
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
                        onDoubleClick={() => onWorkerEdit(worker.id)}
                        style={{borderColor: worker.color}}
                        >
                           <Grid w="100%" align="center">                                 
                              <Tooltip openDelay={500} key={worker.id} label={worker.title}>
                                 <Grid.Col span={{base:12, sm:6}}>
                                    <Text fw={600} size="lg" ta="left" style={{lineHeight:"1.2"}}>{`${displayName}`}</Text>
                                 </Grid.Col>
                              </Tooltip>

                              <Grid.Col span={{base:12, sm:6}}>
                                 <Stack gap={1} align="flex-end" pr={2} pb={2}>
                                    <Group gap={5}>
                                       <Text fw={600} size="xs">Dias</Text>
                                       <Badge variant="dot" color={getDayColor( worker.avaDays?worker.avaDays:0 )}>{worker.avaDays}</Badge>
                                    </Group>
                                    <Group gap={5}>
                                       <Text fw={600} size="xs">Horas</Text>
                                       <Badge variant="dot" color={ getHourColor( worker.compH?worker.compH:0 )}>{worker.compH?worker.compH:0}</Badge>
                                    </Group>
                                 </Stack>
                              </Grid.Col>
                           </Grid>
                        </Card>  
                     </Tooltip>
                  )}
               )}
            </ScrollArea>
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