'use client';
// app/dashboard/page.tsx
import { useState, useEffect } from 'react';
import { User } from '../../types';
import { USER_TYPE_CONFIG } from '../../lib/constants';
import { useTheme } from '../../lib/ThemeContext';

import Sidebar            from '../../components/dashboard/Sidebar';
import Header             from '../../components/dashboard/Header';
import SettingsModal      from '../../components/dashboard/SettingsModal';
import DashboardTab       from '../../components/dashboard/tabs/DashboardTab';
import TimeTrackerTab     from '../../components/dashboard/tabs/TimeTrackerTab';
import PlannerTab         from '../../components/dashboard/tabs/PlannerTab';
import { TasksTab }       from '../../components/dashboard/tabs/TasksTab';
import { FocusZoneTab }   from '../../components/dashboard/tabs/FocusZoneTab';
import { ProgressTab, AIAssistantTab } from '../../components/dashboard/tabs/ProgressAndAITabs';
import { HabitsTab }      from '../../components/dashboard/tabs/HabitsTab';
import { JournalTab }     from '../../components/dashboard/tabs/JournalTab';

export default function DashboardPage() {
  const [user,      setUser]      = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { isDark, accent } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem('tl_user');
    if (stored) setUser(JSON.parse(stored));
    else window.location.href = '/login';
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  const handleSignOut = () => {
    localStorage.removeItem('tl_token');
    localStorage.removeItem('tl_user');
    window.location.href = '/login';
  };

  if (!user) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--accent-light)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  const cfg    = USER_TYPE_CONFIG[user.userType] || USER_TYPE_CONFIG.student;

  const renderTab = () => {
    if (activeNav === 'Dashboard')                                                    return <DashboardTab   user={user} accent={accent} />;
    if (activeNav === 'Time Tracker')                                                 return <TimeTrackerTab accent={accent} />;
    if (['Planner','Meetings','Projects'].includes(activeNav))                        return <PlannerTab     accent={accent} label={activeNav} user={user} />;
    if (activeNav === 'Focus Zone')                                                   return <FocusZoneTab   accent={accent} />;
    if (activeNav === 'Tasks')                                                        return <TasksTab       accent={accent} />;
    if (['Progress','Reports','Goals','Revenue','Exams','Team'].includes(activeNav))  return <ProgressTab    accent={accent} />;
    if (activeNav === 'AI Assistant')                                                 return <AIAssistantTab accent={accent} user={user} />;
    if (activeNav === 'Habits')                                                       return <HabitsTab      accent={accent} />;
    if (activeNav === 'Journal')                                                      return <JournalTab     accent={accent} />;
    return <div style={{ color:'rgba(255,255,255,.4)', padding:40, textAlign:'center' }}>Coming soon...</div>;
  };

  const bg  = 'var(--bg)';
  const col = 'var(--text)';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:var(--bg); overflow-x:hidden; color:var(--text); transition: background .3s, color .3s; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:var(--border); }
        ::-webkit-scrollbar-thumb { background:var(--scrollbar-thumb); border-radius:3px; }
        select option { background:var(--bg2); color:var(--text); }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator { filter:${isDark ? 'invert(1)' : 'none'}; opacity:.6; cursor:pointer; }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:bg, fontFamily:"'Plus Jakarta Sans',sans-serif", color:col }}>
        <Sidebar user={user} activeNav={activeNav} onNavChange={setActiveNav} onSignOut={handleSignOut} expanded={sidebarExpanded} onExpandedChange={setSidebarExpanded} />
        <main style={{ marginLeft: sidebarExpanded ? 240 : 60, flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', background:bg, transition: 'margin-left .25s ease' }}>
          <Header user={user} activeNav={activeNav} currentTime={currentTime} onSettingsOpen={() => setSettingsOpen(true)} />
          <div style={{ padding:'24px 28px', flex:1, background:bg }}>
            {renderTab()}
          </div>
        </main>
      </div>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}