// Frameworks
import React, {useState, useEffect, memo} from "react";
import { 
   Card, 
   Text, 
   Badge, 
   Title, 
   Group, 
   ScrollArea, 
   Tooltip, 
   Modal, 
   Button, 
   Accordion, 
   Stack, 
   Grid
} from '@mantine/core';
import { useContextMenu} from 'mantine-contextmenu';
// Types
import { JRMWorkerData } from "../utils/types";

// Props
interface WorkerListProps {
   workers: JRMWorkerData[];
   onWorkerEdit: (workerId: string) => void;
   onWorkerDelete: (WorkerID: string) => void;
   showNotification: (title: string, message: string, color: string) => void;
   isLoggedIn: boolean;
}



// COMPONENT
const WorkerList: React.FC<WorkerListProps> = ({ workers, onWorkerEdit, onWorkerDelete, showNotification, isLoggedIn }) => {
   // STATES/VARS
   // UI
   const { showContextMenu } = useContextMenu();
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   // Workers
   const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
   const [departmentGroups, setDepartmentGroups] = useState<Map<string, JRMWorkerData[]>>(new Map());
   // Init Vars   
   const cardHeight = 100;
   const maxVisibleCards = 5;
   const maxVisibleHeight = cardHeight * maxVisibleCards;


   // Inicialização de dados da lista
   useEffect(() => {
      const groups = new Map<string, JRMWorkerData[]>();
      workers.forEach((worker) => {
         const deptWorkers = groups.get(worker.dep || '') || [];
         groups.set(worker.dep || '', [...deptWorkers, worker]);
      });
      // Ordenar workers por primeiro nome, para cada departamento
      groups.forEach((deptWorkers) => {
         deptWorkers.sort((a, b) => {
         const [aFirstName] = a.title.split(' ');
         const [bFirstName] = b.title.split(' ');
         return aFirstName.localeCompare(bFirstName);
         });
      });
      setDepartmentGroups(groups);
   }, [workers]);

   // Handlers
   const handleConfirm = async () => {
      if (selectedWorkerId) {
         onWorkerDelete(selectedWorkerId);
         setIsConfirmOpen(false);
         setSelectedWorkerId(null);
      }
   };

   // Utils
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

   // Geração dinâmica de elementos da lista
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
                        ? `Editar ou eliminar ${displayName}` 
                        : 'Clique em "Login" e introduza as suas credenciais para editar informações de colaborador'
                     }
                     position="bottom"
                     multiline
                     >
                        {/* Worker Card */}
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
                        onDoubleClick={() => onWorkerEdit(worker.id)}
                        style={{borderColor: worker.color}}
                        >

                           {/* Content */}
                           <Grid w="100%" align="center">                                 
                              <Tooltip openDelay={500} key={worker.id} label={worker.title}>
                                 <Grid.Col span={{base:12, sm:6}}>
                                    <Text fw={600} size="lg" ta="left" style={{lineHeight:"1.2"}}>{`${displayName}`}</Text>
                                 </Grid.Col>
                              </Tooltip>

                              {/* Absence Stats */}
                              <Grid.Col span={{base:12, sm:6}}>
                                 <Stack gap={1} align="flex-end" pr={2} pb={2}>
                                    <Group gap={5}>
                                       <Tooltip
                                       multiline
                                       withArrow
                                       arrowOffset={50} 
                                       arrowSize={8}
                                       label="Dias disponíveis para ausência">
                                          <Group gap={2}>
                                             <Text fw={600} size="xs">Dias</Text>
                                             <Badge variant="dot" color={getDayColor( worker.avaDays?worker.avaDays:0 )}>{worker.avaDays}</Badge>
                                          </Group>
                                       </Tooltip>
                                    </Group>
                                    <Group gap={5}>
                                       <Tooltip
                                       multiline
                                       withArrow
                                       arrowOffset={50} 
                                       arrowSize={8}
                                       label="Horas a compensar">
                                          <Group gap={2}>
                                             <Text fw={600} size="xs">Horas</Text>
                                             <Badge variant="dot" color={ getHourColor( worker.compH?worker.compH:0 )}>{worker.compH?worker.compH:0}</Badge>
                                          </Group>
                                       </Tooltip>
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





   // JSX
   return (
      <> 
         <Title 
         py="md" 
         mb="xs" 
         order={3} 
         style={{ backgroundColor:"#269AFF", color:"#FFF" }}>Lista de Colaboradores</Title>

         {/* Worker List */}
         <ScrollArea h={'full'}>
            <Accordion radius={0} chevronPosition="left" defaultValue={departmentGroups.keys().next().value}>
               {accordionItems}
            </Accordion> 
         </ScrollArea>

         {/* Confirm */}
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

export default memo(WorkerList);