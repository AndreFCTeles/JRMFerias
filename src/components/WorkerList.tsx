// Frameworks
import React, { useMemo, useState, memo } from "react";
import {
   Flex,
   Text,
   Badge,
   Group,
   ScrollArea,
   Tooltip,
   Modal, 
   Button,
   Accordion,
   //Typography,
   Grid,
   Checkbox,
   Container
} from "@mantine/core";
import { useContextMenu } from "mantine-contextmenu";
// Utils
import { getDayColor, getHourColor, getFirstAndLastName } from "../utils/generalUtils";
// Types
import { DepartmentData, JRMWorkerData } from "../utils/types";


// Props
interface WorkerListProps {
   workers: JRMWorkerData[];
   departments: DepartmentData[];

   onWorkerEdit: (workerId: string) => void;
   onWorkerDelete: (workerId: string) => void;
   showNotification: (title: string, message: string, color: string) => void;
   isLoggedIn: boolean;

   selectedDepartments: string[];
   onToggleWorker: (workerId: string, depName: string) => void;
   selectedWorkers: string[];
   onToggleDepartment: (depName: string) => void;
}




// COMPONENT
const WorkerList: React.FC<WorkerListProps> = ({
   workers,
   departments,
   onWorkerEdit,
   onWorkerDelete,
   showNotification,
   isLoggedIn,
   onToggleWorker,
   onToggleDepartment,
   selectedWorkers
}) => {
   // STATES/VARS
   // UI
   const { showContextMenu } = useContextMenu();
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   // Workers
   const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
   // Init Vars   
   const cardHeight = 100;
   const maxVisibleCards = 5;
   const maxVisibleHeight = cardHeight * maxVisibleCards;

   // Agrupar workers por departamento
   const departmentGroups = useMemo(() => {
      const groups = new Map<string, JRMWorkerData[]>();
      for (const w of workers) {
         const key = w.dep || "";
         if (!groups.has(key)) groups.set(key, []);
         groups.get(key)!.push(w);
      }
      // Ordenar workers por primeiro nome, para cada departamento
      for (const [, list] of groups) {
         list.sort((a, b) => {
            const [aFirst] = a.title.split(" ");
            const [bFirst] = b.title.split(" ");
            return aFirst.localeCompare(bFirst);
         });
      }
      return groups;
   }, [workers]);
   
   // Ordenar departamentos por nome
   const TOP_DEPARTMENT = "JRMatos";
   const orderedDepartmentNames = useMemo(() => {
      const withWorkers = new Set(departmentGroups.keys());
      const deptNames = departments
         .map(d => d.depName)
         .filter(name => withWorkers.has(name))
         .sort((a, b) => a.localeCompare(b));
         
      const i = deptNames.indexOf(TOP_DEPARTMENT);
      if (i > -1) {
         deptNames.splice(i, 1);
         deptNames.unshift(TOP_DEPARTMENT);
      }
      //const extras = [...withWorkers].filter(name => !fromDeptData.includes(name)); // Incluir departamentos que escaparam
      //extras.sort((a, b) => a.localeCompare(b)); // Ordem alfabética a extras
      //return [...fromDeptData, ...extras];
      return deptNames;
   }, [departments, departmentGroups]);

   // Juntar workers por ID para cada departamento
   const idsForDepartment = (department: string) =>
      (departmentGroups.get(department) ?? []).map(w => w.id);

   // Indeterminate/checked para checkboxes de departamento 
   const getDepartmentCheckboxState = (department: string) => {
      const ids = idsForDepartment(department);
      if (ids.length === 0) return false;
      const selectedCount = ids.reduce((n, id) => n + (selectedWorkers.includes(id) ? 1 : 0), 0);
      if (selectedCount === 0) return false;
      if (selectedCount === ids.length) return true;
      return 'indeterminate';
   };


   // HANDLERS
   // Confirmação
   const handleConfirm = async () => {
      if (selectedWorkerId) {
         onWorkerDelete(selectedWorkerId);
         setIsConfirmOpen(false);
         setSelectedWorkerId(null);
      }
   };

   // Checkboxes
   const handleDepartmentChange = (department: string) => { onToggleDepartment(department); };
   const handleWorkerChange = (workerId: string, department: string) => { onToggleWorker(workerId, department); };

   

   // Geração dinâmica de elementos da lista
   const accordionItems = orderedDepartmentNames.map(department => {
      const deptWorkers = departmentGroups.get(department) ?? [];
      const checkboxState = getDepartmentCheckboxState(department);
      const dep = departments.find(d => d.depName === department);
      const depDefaultColor = dep?.depDefColor;
      
      // debugging de checkboxes
      //const ids = idsForDepartment(department);
      //const sel = ids.filter(id => selectedWorkers.includes(id)).length;

      return (
         <Accordion.Item key={department} value={department}>
            <Accordion.Control style={{ borderRadius: 0 }} className="depcont">
               <Grid align="center">
                  <Grid.Col span={2}>
                     <Group gap="xs" wrap="nowrap">
                        {depDefaultColor && (
                           <div style={{
                              width: 10,
                              height: 20,
                              borderRadius: 0,
                              background: depDefaultColor,
                              flex: "0 0 auto"
                           }}/>
                        )}
                        <Checkbox
                        key={`${department}-${checkboxState}`} 
                        //defaultChecked
                        label={""}
                        checked={checkboxState === true}
                        indeterminate={checkboxState === "indeterminate"}
                        onChange={() => handleDepartmentChange(department)}
                        onClick={(e) => e.stopPropagation()}
                        />
                     </Group>
                     {/* debugging de checkboxes */}   
                     {/*<Text size="xs" c="dimmed">{sel}/{ids.length}</Text>*/}
                  </Grid.Col>
                  <Grid.Col span={9}>
                     <Group gap="xs" wrap="nowrap">
                        <Text 
                        truncate="end"
                        className="dephover"
                        style={{ '--hover-color': depDefaultColor } as React.CSSProperties}
                        >{department}</Text>
                     </Group>
                  </Grid.Col>
               </Grid>
            </Accordion.Control>

            <Accordion.Panel px={0} style={{ backgroundColor: "rgba(250, 250, 250, 1)" }}>
               <ScrollArea
               h={deptWorkers.length > maxVisibleCards ? maxVisibleHeight : "auto"}
               w={"100%"}
               px={0}
               mx={0}
               scrollbarSize={6}
               offsetScrollbars
               >
                  {deptWorkers.map(worker => {
                     const fullName = worker.title;
                     /*
                     const parts = fullName.split(" ");
                     const first = parts[0];
                     const last = parts.length > 1 ? parts[parts.length - 1] : "";
                     const shortName = `${first}${last ? " " + last : ""}`;
                     */
                     const displayLabel =
                     (worker.displayName && worker.displayName.trim().length > 0)
                        ? worker.displayName.trim()
                        : getFirstAndLastName(fullName);

                     return (
                        <Tooltip
                        openDelay={500}
                        key={worker.id}
                        label={ isLoggedIn 
                           ? `Editar ou eliminar ${displayLabel}`
                           : 'Clique em "Login" e introduza as suas credenciais para editar informações de colaborador'
                        }
                        position="bottom"
                        multiline
                        >
                           <Checkbox.Card
                           key={worker.id}
                           checked={selectedWorkers.includes(worker.id)}
                           onChange={() => handleWorkerChange(worker.id, department)}
                           className="worker_card"
                           mt="xs"
                           radius="md"
                           withBorder
                           onContextMenu={showContextMenu([
                              isLoggedIn ? {
                                 key: "edit",
                                 title: "Editar dados",
                                 onClick: () => onWorkerEdit(worker.id)
                              } : {
                                 key: "editLoginReminder",
                                 title: "Editar dados",
                                 onClick: () =>
                                    showNotification(
                                       "Requer Login",
                                       'Por favor clique "Login" e introduza as suas credenciais de acesso para efetuar esta operação',
                                       "red"
                                    )
                              },
                              isLoggedIn ? {
                                    key: "del",
                                    title: "Eliminar colaborador",
                                    onClick: () => {
                                       setSelectedWorkerId(worker.id);
                                       setIsConfirmOpen(true);
                                    }
                              } : {
                                 key: "delLoginReminder",
                                 title: "Eliminar colaborador",
                                 onClick: () =>
                                    showNotification(
                                    "Requer Login",
                                    'Por favor clique "Login" e introduza as suas credenciais de acesso para efetuar esta operação',
                                    "red"
                                    )
                              }
                           ])}
                           onDoubleClick={() => onWorkerEdit(worker.id)}
                           style={{
                              borderColor: worker.color,
                              backgroundColor: "#FFF"
                           }}>
                              <Container p="md">
                                 {/* Worker */}
                                 <Group 
                                 mb={department === "JRMatos" ? 0 : "md"} 
                                 wrap="nowrap" 
                                 preventGrowOverflow={false}
                                 style={{ minWidth: 0 }}>
                                    <Checkbox.Indicator />
                                    <Tooltip 
                                    openDelay={500} 
                                    key={worker.id} 
                                    label={
                                       worker.displayName && worker.displayName.trim()
                                       ? `${worker.displayName.trim()} (${fullName})`
                                       : fullName
                                    }>
                                       <Text 
                                       lineClamp={1} 
                                       component="div" 
                                       fw={600} 
                                       size="lg" 
                                       truncate="end" 
                                       style={{ lineHeight: "1.2", minWidth: 0  }}
                                       //title={displayLabel}
                                       >
                                          {/*<Typography><p>{displayLabel}</p></Typography>*/}
                                          {displayLabel}
                                       </Text>
                                    </Tooltip>
                                 </Group>

                                 {/* Absence Stats */}
                                 {department !== "JRMatos" && (
                                    <Group align="center" justify="space-evenly">
                                       <Group preventGrowOverflow={false} align="center">
                                          <Tooltip
                                          multiline
                                          withArrow
                                          arrowOffset={50}
                                          arrowSize={8}
                                          label="Dias disponíveis para ausência"
                                          >
                                             <Flex gap={3} justify="center" align="center" direction="row" wrap="nowrap">
                                                <Badge variant="dot" color={getDayColor(worker.avaDays ? worker.avaDays : 0)}>
                                                   {worker.avaDays}
                                                </Badge>
                                                <Text truncate="end" fw={600} size="xs">
                                                   Dias
                                                </Text>
                                             </Flex>
                                          </Tooltip>
                                       </Group>

                                       <Group preventGrowOverflow={true}>
                                          <Tooltip
                                          multiline
                                          withArrow
                                          arrowOffset={50}
                                          arrowSize={8}
                                          label="Horas a compensar"
                                          >
                                             <Flex gap={3} justify="center" align="center" direction="row" wrap="nowrap">
                                                <Badge variant="dot" color={getHourColor(worker.compH ? worker.compH : 0)}>
                                                   {worker.compH ? worker.compH : 0}
                                                </Badge>
                                                <Text truncate="end" fw={600} size="xs">Horas</Text>
                                             </Flex>
                                          </Tooltip>
                                       </Group>
                                    </Group>
                                 )}
                              </Container>
                           </Checkbox.Card>
                        </Tooltip>
                     );
                  })}
               </ScrollArea>
            </Accordion.Panel>
         </Accordion.Item>
      );
   });
   const firstDept = orderedDepartmentNames[0];


   // JSX
   return (
      <>
         {/* Worker List */}
         <ScrollArea h={"full"}>
            <Accordion radius={0} chevronPosition="right" defaultValue={firstDept}>
               {accordionItems}
            </Accordion>
         </ScrollArea>

         {/* Confirm */}
         <Modal
         opened={isConfirmOpen}
         onClose={() => setIsConfirmOpen(false)}
         title="Confirmar"
         style={{ left: "0%", position: "absolute" }}
         >
            <Text ta="center" mt="md">Tem certeza de que deseja eliminar colaborador?</Text>
            <Text ta="center" mt="md">Esta operação não pode ser revertida.</Text>
            <Group mt="md" justify="center">
               <Button onClick={handleConfirm}>Confirmar</Button>
               <Button onClick={() => setIsConfirmOpen(false)} color="gray">Cancelar</Button>
            </Group>
         </Modal>
      </>
   );
};

export default memo(WorkerList);
