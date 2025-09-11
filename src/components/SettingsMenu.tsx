import React from 'react'; // , {useState}
import {
   Menu,
   Box,
   SegmentedControl,
   Switch,
   MenuProps,
   Button,
   Radio, 
   useMantineColorScheme, 
   useComputedColorScheme,
   Tooltip
} from '@mantine/core';
import { CalendarView, NameDisplay } from '../utils/types';
import { 
   IconSettings, 
   IconChevronLeft, 
   IconX, 
   IconCheck,
   IconLogout
} from '@tabler/icons-react';


type SettingsMenuProps = {
   calendarView: CalendarView;
   onCalendarViewChange: (v: CalendarView) => void;
   nameDisplay: NameDisplay;
   onNameDisplayChange: (v: NameDisplay) => void;
   persistLogin: boolean;
   onPersistLoginChange: (checked: boolean) => void;
   isLoggedIn: boolean;
   onLogout: () => void;
   onChangePassword: () => void;
   canChangePassword?: boolean;
   iconSize?: number;
} & Omit<MenuProps, 'children'>;









const SettingsMenu: React.FC<SettingsMenuProps> = ({
   calendarView,
   onCalendarViewChange,
   nameDisplay,
   onNameDisplayChange,
   persistLogin,
   onPersistLoginChange,
   isLoggedIn,
   onChangePassword,
   canChangePassword,
   iconSize = 18,
   ...menuProps
}) => {
   const { setColorScheme } = useMantineColorScheme({keepTransitions: true});
   const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });
   const isDark = computed === 'dark';






   return (
      <Menu 
      withArrow 
      closeOnItemClick={false} 
      position="bottom-end" 
      shadow="md" 
      {...menuProps}
      >
         <Menu.Target>
            <Button 
            variant="subtle"
            className='settings'
            color='red'
            rightSection={ 
               <IconSettings size={iconSize} />
            }>Opções</Button>
         </Menu.Target>

         <Menu.Dropdown>
            <Menu.Label>Vista de calendário</Menu.Label>
            <Box px="xs" pb="sm">
               <SegmentedControl
               fullWidth
               size="xs"
               value={calendarView}
               onChange={(v) => onCalendarViewChange(v as CalendarView)}
               data={[
                  { label: 'Mês', value: 'dayGridMonth' },
                  { label: 'Ano', value: 'multiMonthYear' },
               ]} />
            </Box>

            <Menu.Divider />

            <Menu.Label>Aparência</Menu.Label>
            <Box
            px="xs"
            py={6}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onKeyDownCapture={(e) => e.stopPropagation()}
            >
               <Switch
               label="Alternar modo escuro"
               labelPosition="left"
               checked={isDark}
               color="teal"
               onChange={()=>{ setColorScheme(isDark ? 'light' : 'dark'); }}
               thumbIcon={
                  isDark ? (
                     <IconCheck size={12} color="var(--mantine-color-teal-6)" stroke={3} />
                  ) : (
                     <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
                  )
               } />
            </Box>

            <Menu.Sub position="left">
               <Menu.Sub.Target>
                  <Menu.Sub.Item 
                  leftSection={<IconChevronLeft size={16} />}
                  rightSection={<></>}
                  >Lista de Colaboradores</Menu.Sub.Item>
               </Menu.Sub.Target>

               <Menu.Sub.Dropdown p={'xs'}>                  
                  <Radio.Group
                  name="workerListDisplay"
                  description="Apresentação de nomes"
                  value={nameDisplay}
                  onChange={(v) => onNameDisplayChange(v as NameDisplay)}
                  >
                     <Box 
                     px="xs" 
                     py={4} 
                     mt={'xs'}
                     onMouseDownCapture={(e) => e.stopPropagation()}
                     onKeyDownCapture={(e) => e.stopPropagation()} 
                     >
                        <Radio value="full" label="Completo" />
                     </Box>
                     <Box 
                     px="xs" 
                     py={4}
                     onMouseDownCapture={(e) => e.stopPropagation()}
                     onKeyDownCapture={(e) => e.stopPropagation()} 
                     >
                        <Radio value="short" label="Primeiro + Último" />
                     </Box>
                     <Box 
                     px="xs" 
                     py={4}
                     onMouseDownCapture={(e) => e.stopPropagation()}
                     onKeyDownCapture={(e) => e.stopPropagation()} 
                     >
                        <Radio value="displayName" label="Alcunha" />
                     </Box>
                  </Radio.Group>
               </Menu.Sub.Dropdown>
            </Menu.Sub>

            {isLoggedIn && ( <>
               <Menu.Divider />

               <Menu.Label>Conta</Menu.Label>
               <Box
               px="xs"
               py={6}
               onMouseDownCapture={(e) => e.stopPropagation()}
               onKeyDownCapture={(e) => e.stopPropagation()}
               >
                  <Tooltip
                  disabled={!!isLoggedIn}
                  label="Inicie sessão para configurar"
                  >
                     <Switch
                     label="Manter sessão iniciada"
                     labelPosition="left"
                     color="teal"
                     checked={persistLogin}
                     onChange={(e) => { onPersistLoginChange(e.currentTarget.checked);}}
                     disabled={!isLoggedIn} 
                     thumbIcon={
                        persistLogin ? (
                           <IconCheck size={12} color="var(--mantine-color-teal-6)" stroke={3} />
                        ) : (
                           <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
                        )
                     } />
                  </Tooltip>
               </Box>

               <Tooltip
               disabled={!!canChangePassword}
               label="Sem permissões para alterar a palavra-passe"
               >
                  <Menu.Item onClick={onChangePassword} disabled={!canChangePassword}>
                     Alterar palavra-passe
                  </Menu.Item>
               </Tooltip>
               
               <Tooltip
               disabled={!!canChangePassword}
               label="Terminar sessão também esquece credenciais de acesso a esta aplicação"
               >
                  <Menu.Item 
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={onChangePassword} 
                  disabled={!canChangePassword}
                  >
                     Terminar sessão
                  </Menu.Item>
               </Tooltip>
            </> )}

         </Menu.Dropdown>
      </Menu>
   )
}

export default SettingsMenu