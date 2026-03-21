'use client';
// app/dashboard/page.tsx
// The dashboard page is now a thin orchestrator.
// All logic lives in separate component files.
// This file only: loads user, manages activeNav, renders Sidebar + Header + the right tab.

import { useState, useEffect } from 'react';
import { User } from '../../types';
import { USER_TYPE_CONFIG } from '../../lib/constants';

import Sidebar         from '../../components/dashboard/Sidebar';
import Header          from '../../components/dashboard/Header';
import DashboardTab    from '../../components/dashboard/tabs/DashboardTab';
import TimeTrackerTab  from '../../components/dashboard/tabs/TimeTrackerTab';
import PlannerTab      from '../../components/dashboard/tabs/PlannerTab';
import { TasksTab }    from '../../components/dashboard/tabs/TasksTab';
import { FocusZoneTab } from '../../components/dashboard/tabs/FocusZoneTab';
import { ProgressTab, AIAssistantTab } from '../../components/dashboard/tabs/ProgressAndAITabs';

export default function DashboardPage() {
  const [user,      setUser]      = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [time,      setTime]      = useState(new Date());

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tl_user');
    if (stored) setUser(JSON.parse(stored));
    else window.location.href = '/login';
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('tl_token');
    localStorage.removeItem('tl_user');
    window.location.href = '/login';
  };

  // Loading spinner while user loads
  if (!user) return (
    <div style={{ minHeight:'100vh', background:'#080c14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(0,220,255,.2)', borderTopColor:'#00dcff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  const cfg    = USER_TYPE_CONFIG[user.userType] || USER_TYPE_CONFIG.student;
  const accent = cfg.accent;

  // Render the correct tab component based on activeNav
  const renderTab = () => {
    if (activeNav === 'Dashboard')                                               return <DashboardTab   user={user} accent={accent} />;
    if (activeNav === 'Time Tracker')                                            return <TimeTrackerTab accent={accent} />;
    if (['Planner','Meetings','Projects'].includes(activeNav))                   return <PlannerTab     accent={accent} label={activeNav} />;
    if (activeNav === 'Focus Zone')                                              return <FocusZoneTab   accent={accent} />;
    if (activeNav === 'Tasks')                                                   return <TasksTab       accent={accent} />;
    if (['Progress','Reports','Goals','Revenue','Exams','Team'].includes(activeNav)) return <ProgressTab accent={accent} />;
    if (activeNav === 'AI Assistant')                                            return <AIAssistantTab accent={accent} user={user} />;
    return <div style={{ color:'rgba(255,255,255,.4)', padding:40, textAlign:'center' }}>Coming soon...</div>;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Exo+2:wght@300;400;500;600&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#080c14; overflow-x:hidden; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,.03); }
        ::-webkit-scrollbar-thumb { background:rgba(0,220,255,.2); border-radius:3px; }
        select option { background:#0e1828; color:#fff; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator { filter:invert(1); opacity:.5; cursor:pointer; }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:'#080c14', fontFamily:"'Exo 2',sans-serif", color:'#fff' }}>

        {/* Sidebar — fixed left navigation */}
        <Sidebar
          user={user}
          activeNav={activeNav}
          onNavChange={setActiveNav}
          onSignOut={handleSignOut}
        />

        {/* Main content area */}
        <main style={{ marginLeft:240, flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>

          {/* Sticky top header */}
          <Header user={user} activeNav={activeNav} currentTime={time} />

          {/* Tab content */}
          <div style={{ padding:'24px 28px', flex:1 }}>
            {renderTab()}
          </div>

        </main>
      </div>
    </>
  );
}
