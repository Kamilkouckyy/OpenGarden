import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Navbar from "./components/layout/Navbar";
import GardenBedOverview from "./components/common/GardenBedOverview";
import GardenBedDetailview from "./components/common/GardenBedDetailview";
import TaskPanelOverview from "./components/common/TaskPanelOverview";
import TaskDetailCard from "./components/common/TaskDetailCard";
import ReportsOverview from "./components/common/ReportsOverview";
import EquipmentOverview from "./components/common/EquipmentOverview";
import EventsOverview from "./components/common/EventsOverview";
import LoginScreen from "./components/auth/LoginScreen";
import "./App.css";

function AppShell() {
  const { user, setUser } = useUser();

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div>
      <Navbar
        user={user}
        onLogout={() => setUser(null)}
        navItems={[
          { path: "/garden-beds", label: "Záhony" },
          { path: "/tasks", label: "Úkoly" },
          { path: "/reports", label: "Hlášení" },
          { path: "/equipment", label: "Vybavení" },
          { path: "/events", label: "Události" },
        ]}
      />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/garden-beds" replace />} />
          <Route path="/garden-beds" element={<GardenBedOverview />} />
          <Route path="/garden-beds/:id" element={<GardenBedDetailview />} />
          <Route path="/tasks" element={<TaskPanelOverview />} />
          <Route path="/tasks/:id" element={<TaskDetailCard />} />
          <Route path="/reports" element={<ReportsOverview />} />
          <Route path="/equipment" element={<EquipmentOverview />} />
          <Route path="/events" element={<EventsOverview />} />
          <Route path="*" element={<Navigate to="/garden-beds" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppShell />
    </UserProvider>
  );
}
