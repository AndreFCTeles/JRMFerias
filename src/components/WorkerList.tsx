// FRAMEWORKS
import React, { 
   useState, 
   useMemo, 
   memo 
} from "react";
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
   Grid,
   Checkbox,
   Container,
   TextInput, 
   ActionIcon
} from "@mantine/core";
import { useContextMenu } from "mantine-contextmenu";
// Utils
import { 
   getDayColor, 
   getHourColor, 
   resolveWorkerLabel, 
   shortOf,
   tokenize,
   matchesAll
} from "../utils/generalUtils";
// Types
import { 
   DepartmentData, 
   JRMWorkerData, 
   NameDisplay 
} from "../utils/types";
// Icons
import { IconSearch, IconX } from "@tabler/icons-react";





// PROPS
interface WorkerListProps {
   workers: JRMWorkerData[];
   departments: DepartmentData[];

   onWorkerEdit: (workerId: string) => void;
   onWorkerDelete: (workerId: string) => void;
   showNotification: (title: string, message: string, color: string) => void;
   isLoggedIn: boolean;

   //selectedDepartments: string[];
   onToggleWorker: (workerId: string, depName: string) => void;
   selectedWorkers: string[];
   onToggleDepartment: (depName: string) => void;
   nameDisplay: NameDisplay;
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
   selectedWorkers,
   onToggleDepartment,
   nameDisplay
}) => {
   // STATES/VARS
   // UI
   const { showContextMenu } = useContextMenu();
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   // Workers
   const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
   // Search
   const [query, setQuery] = useState('');
   const depByName = useMemo(() => {
      const map = new Map(departments.map(d => [d.depName, d]));
      return map;
   }, [departments]);
   const terms = useMemo(() => tokenize(query), [query]);
   // Init Vars   
   const cardHeight = 100;
   const maxVisibleCards = 5;
   const maxVisibleHeight = cardHeight * maxVisibleCards;


   // HELPERS
   // Procurar/Filtrar   
   const deptMatches = (depName: string) => {
      if (terms.length === 0) return true;
      const dep = depByName.get(depName);
      const depKey = (dep as any)?.depKey || '';
      return ( matchesAll(depName, terms) || (depKey && matchesAll(depKey, terms)) );
   };
   const workerMatches = (w: JRMWorkerData) => {
      if (terms.length === 0) return true;
      const full = w.title || '';
      const short = shortOf(full);
      const disp = w.displayName || '';
      // Search over: title, dep, displayName, short, plus department fields indirectly
      return (
         matchesAll(full, terms) ||
         matchesAll(short, terms) ||
         matchesAll(disp, terms) ||
         matchesAll(w.dep || '', terms)
      );
   };
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
            const A = resolveWorkerLabel(a, nameDisplay).label;
            const B = resolveWorkerLabel(b, nameDisplay).label;
            return A.localeCompare(B, 'pt', { sensitivity: 'base' });
         });
      }
      return groups;
   }, [workers, nameDisplay]);
   
   // Ordenar departamentos por nome
   const TOP_DEPARTMENT = "JRMatos";
   const orderedDepartmentNames = useMemo(() => {
      const withWorkers = new Set(departmentGroups.keys());
      const deptNames = departments
         .map(d => d.depName)
         .filter(name => withWorkers.has(name))
         .sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }));
         
      const i = deptNames.indexOf(TOP_DEPARTMENT);
      if (i > -1) {
         deptNames.splice(i, 1);
         deptNames.unshift(TOP_DEPARTMENT);
      }
      return deptNames;
   }, [departments, departmentGroups]);

   // Procurar departamentos
   const filteredDepartmentNames = useMemo(() => {
      if (terms.length === 0) return orderedDepartmentNames;
      const result: string[] = [];
      for (const depName of orderedDepartmentNames) {
         const depOk = deptMatches(depName);
         if (depOk) {
            result.push(depName);
            continue;
         }
         // se o departamento não corresponder, verifica se há algum worker que corresponda
         const list = departmentGroups.get(depName) ?? [];
         if (list.some(workerMatches)) {result.push(depName);}
      }
      return result;
   }, [orderedDepartmentNames, departmentGroups, terms]);

   // Rendering departmentos, decide que workers mostrar
   const getVisibleWorkersForDepartment = (depName: string) => {
      const list = departmentGroups.get(depName) ?? [];
      if (terms.length === 0) return list;
      if (deptMatches(depName)) return list; // departamento corresponde -> mostra todos
      return list.filter(workerMatches);     // senão, apenas os workers que correspondem
   };






   // UTILS
   // Juntar workers por ID para cada departamento
   const idsForDepartment = (department: string) => (departmentGroups.get(department) ?? []).map(w => w.id);

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

   





   // DYNAMIC RENDER
   // caso exista filtragem/procura
   const listToRender = filteredDepartmentNames.length
      ? filteredDepartmentNames
      : orderedDepartmentNames;

   // regular old render lmao
   const accordionItems = listToRender.map(department => {
      //const deptWorkers = departmentGroups.get(department) ?? [];
      const deptWorkers = getVisibleWorkersForDepartment(department);
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

            <Accordion.Panel px={0}> 
               <ScrollArea
               h={deptWorkers.length > maxVisibleCards ? maxVisibleHeight : "auto"}
               w={"100%"}
               px={0}
               mx={0}
               scrollbarSize={6}
               offsetScrollbars
               >
                  {deptWorkers.map(worker => {
                     const { label: labelName, tooltip: tooltipName } = resolveWorkerLabel(worker, nameDisplay);
                     const nameSel = `[data-wl-name="${worker.id}"]`;
                     //console.log({labelName, tooltipName})

                     return (
                        <Tooltip
                        openDelay={500}
                        key={`${worker.id}`}
                        label={ isLoggedIn 
                           ? `Editar ou eliminar ${labelName}`
                           : 'Clique em "Login" e introduza as suas credenciais para editar informações de colaborador'
                        }
                        position="bottom"
                        multiline
                        >
                           <Checkbox.Card
                           key={`${worker.id}-${checkboxState}`} 
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
                           style={{borderColor: worker.color }}>
                              <Container p="md">
                                 {/* Worker */}
                                 <Group 
                                 mb={department === "JRMatos" ? 0 : "md"} 
                                 wrap="nowrap" 
                                 preventGrowOverflow={false}
                                 style={{ minWidth: 0}}>
                                    <Checkbox.Indicator />
                                    <Text 
                                    data-wl-name={worker.id}
                                    lineClamp={1} 
                                    component="div" 
                                    fw={600} 
                                    size="lg" 
                                    truncate="end" 
                                    style={{ lineHeight: "1.2", minWidth: 0  }}
                                    >
                                       {`${labelName}`}
                                    </Text>
                                    <Tooltip 
                                    openDelay={500} 
                                    target={nameSel}
                                    label={`${tooltipName}`} /> 
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



   const firstDept = (
      filteredDepartmentNames.length 
      ? filteredDepartmentNames[0]
      :orderedDepartmentNames[0]
   ) || undefined;








   // JSX
   return (
      <>
         {/* Worker List */}
         <TextInput
         placeholder="Filtrar por departamento ou colaborador..."
         value={query}
         m={0}
         p={0}
         onChange={(e) => setQuery(e.currentTarget.value)}
         leftSection={<IconSearch size={16} />}
         rightSection={query ? (
            <ActionIcon 
            variant="subtle" 
            onClick={() => setQuery('')}>
               <IconX size={16} />
            </ActionIcon>
         ) : null}
         size="sm"
         radius="md"
         />
         <ScrollArea h={"full"}>
            <Accordion 
            radius={0} 
            chevronPosition="right" 
            defaultValue={firstDept}>
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