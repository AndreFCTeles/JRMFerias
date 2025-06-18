// Frameworks
import React, { useState, useEffect, memo } from "react";
import { 
   Flex, 
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
   Grid,
   Checkbox
} from '@mantine/core';
import { useContextMenu} from 'mantine-contextmenu';
// Types
import { JRMWorkerData } from "../utils/types";
import { getDayColor, getHourColor } from "../utils/generalUtils";

// Props
interface WorkerListProps {
   workers: JRMWorkerData[];
   onWorkerEdit: (workerId: string) => void;
   onWorkerDelete: (WorkerID: string) => void;
   showNotification: (title: string, message: string, color: string) => void;
   isLoggedIn: boolean;
   selectedDepartments: string[];
   setSelectedDepartments: React.Dispatch<React.SetStateAction<string[]>>;
   selectedWorkers: string[];
   setSelectedWorkers: React.Dispatch<React.SetStateAction<string[]>>;
}



// COMPONENT
const WorkerList: React.FC<WorkerListProps> = ({ 
   workers, 
   onWorkerEdit, 
   onWorkerDelete, 
   showNotification, 
   isLoggedIn, 
   setSelectedDepartments,
   selectedDepartments, 
   setSelectedWorkers,
   selectedWorkers 
}) => {
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

   // HANDLERS
   // Confirmação
   const handleConfirm = async () => {
      if (selectedWorkerId) {
         onWorkerDelete(selectedWorkerId);
         setIsConfirmOpen(false);
         setSelectedWorkerId(null);
      }
   };
   // Checkboxes departamento
   const handleDepartmentChange = (department: string) => {
      const isSelected = selectedDepartments.includes(department);
      const newSelectedDepartments = isSelected 
         ? selectedDepartments.filter(dep => dep !== department) 
         : [...selectedDepartments, department];
      setSelectedDepartments(newSelectedDepartments);

      const departmentWorkers = workers.filter(worker => worker.dep === department).map(worker => worker.id);
      const newSelectedWorkers = isSelected 
         ? selectedWorkers.filter(workerId => !departmentWorkers.includes(workerId))
         : [...selectedWorkers, ...departmentWorkers];
      setSelectedWorkers(newSelectedWorkers);
   };
   // Checkboxes colaborador
   const handleWorkerChange = (workerId: string, department: string) => {
      const isSelected = selectedWorkers.includes(workerId);
      const newSelectedWorkers = isSelected 
         ? selectedWorkers.filter(id => id !== workerId)
         : [...selectedWorkers, workerId];
      setSelectedWorkers(newSelectedWorkers);

      const departmentWorkers = workers.filter(worker => worker.dep === department).map(worker => worker.id);
      const allDepartmentWorkersSelected = departmentWorkers.every(workerId => newSelectedWorkers.includes(workerId));

      if (allDepartmentWorkersSelected) {
         setSelectedDepartments(prev => prev.includes(department) ? prev : [...prev, department]);
      } else {
         setSelectedDepartments(prev => prev.filter(dep => dep !== department));
      }
   };



   // Geração dinâmica de elementos da lista
   const accordionItems = Array.from(departmentGroups).map(([department, deptWorkers]) => {      
      const isDepartmentChecked = (department: string) => {
         const departmentWorkers = workers.filter(worker => worker.dep === department).map(worker => worker.id);
         const allSelected = departmentWorkers.every(workerId => selectedWorkers.includes(workerId));
         const noneSelected = departmentWorkers.every(workerId => !selectedWorkers.includes(workerId));
         return allSelected ? true : noneSelected ? false : 'indeterminate';
      }; 

      return (
         <Accordion.Item 
         key={department} 
         value={department}>
            <Accordion.Control>
               <Grid>
                  <Grid.Col span={2}>
                     <Checkbox
                     label={``}
                     checked={selectedDepartments.includes(department)}
                     indeterminate={isDepartmentChecked(department) === 'indeterminate'}
                     onClick={(event) => event.stopPropagation()}
                     onChange={() => handleDepartmentChange(department)}
                     />
                  </Grid.Col>
                  <Grid.Col span={9}>
                     <Text truncate="end">{department}</Text>                   
                  </Grid.Col>
               </Grid>
            </Accordion.Control>
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
                           <Checkbox.Card
                           key={worker.id}
                           checked={selectedWorkers.includes(worker.id)}
                           onClick={() => handleWorkerChange(worker.id, department)}
                           className='worker_card' 
                           mt="xs" 
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
                              <Grid w="100%" justify="center" align="center" p={department==='JRMatos'? "md" : 0 } m={0}>   
                                 <Grid.Col span={{base:12, md:8}} p={"md"}> 
                                    <Group>
                                       <Checkbox.Indicator />                          
                                       <Tooltip openDelay={500} key={worker.id} label={worker.title}>
                                          <Text truncate="end" fw={600} size="lg" ta="left" style={{lineHeight:"1.2"}}>{`${displayName}`}</Text>
                                       </Tooltip>
                                    </Group>
                                 </Grid.Col>

                                 {/* Absence Stats */}
                                 <Grid.Col span={{base:12, md:4}} p={"md"}>
                                    <Stack gap={3} align="center" pr={2} pb={2} justify="center">
                                       {!(department==='JRMatos') && <>                                    
                                       <Group preventGrowOverflow={false} wrap="nowrap" justify="center" align="center">
                                          <Tooltip
                                          multiline
                                          withArrow
                                          arrowOffset={50} 
                                          arrowSize={8}
                                          label="Dias disponíveis para ausência">
                                             <Flex
                                             gap="xs"
                                             justify="center"
                                             align="center"
                                             direction="row"
                                             wrap="nowrap"
                                             >
                                                <Badge variant="dot" color={getDayColor( worker.avaDays?worker.avaDays:0 )}>{worker.avaDays}</Badge>
                                                <Text truncate="end" fw={600} size="xs">Dias</Text>
                                             </Flex>
                                          </Tooltip>
                                       </Group>
                                       <Group preventGrowOverflow={false} wrap="nowrap">
                                          <Tooltip
                                          multiline
                                          withArrow
                                          arrowOffset={50} 
                                          arrowSize={8}
                                          label="Horas a compensar">
                                             <Flex
                                             gap="xs"
                                             justify="center"
                                             align="center"
                                             direction="row"
                                             wrap="nowrap"
                                             >
                                                <Badge variant="dot" color={ getHourColor( worker.compH?worker.compH:0 )}>{worker.compH?worker.compH:0}</Badge>
                                                <Text truncate="end" fw={600} size="xs">Horas</Text>
                                             </Flex>
                                          </Tooltip>
                                       </Group>
                                       </>}
                                    </Stack>
                                 </Grid.Col>

                              </Grid>
                           </Checkbox.Card>

                        </Tooltip>
                     )}
                  )}
               </ScrollArea>
            </Accordion.Panel>
         </Accordion.Item>
   )});





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
            <Accordion 
            radius={0} 
            chevronPosition="right" 
            defaultValue={departmentGroups.keys().next().value}
            >
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