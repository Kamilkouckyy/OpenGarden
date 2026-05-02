import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import Navbar from "./components/layout/Navbar";
import GardenBedOverview from "./components/common/GardenBedOverview";
import GardenBedDetailview from "./components/common/GardenBedDetailview";
import TaskPanelOverview from "./components/common/TaskPanelOverview";
import TaskDetailCard from "./components/common/TaskDetailCard";
import ReportsOverview from "./components/common/ReportsOverview";
import EquipmentOverview from "./components/common/EquipmentOverview";
import EventsOverview from "./components/common/EventsOverview";
import LoginScreen from "./components/auth/LoginScreen";
import EventDetailView from "./components/common/EventDetailView";
import "./App.css";

function AppShell() {
  const { user, setUser } = useUser();
  const { t } = useLanguage();

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div>
      <Navbar
        user={user}
        onLogout={() => setUser(null)}
        navItems={[
          { path: "/garden-beds", label: t("nav.gardenBeds") },
          { path: "/tasks", label: t("nav.tasks") },
          { path: "/reports", label: t("nav.reports") },
          { path: "/equipment", label: t("nav.equipment") },
          { path: "/events", label: t("nav.events") },
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
          <Route path="/events/:id" element={<EventDetailView />} />
          <Route path="*" element={<Navigate to="/garden-beds" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <AppShell />
      </LanguageProvider>
    </UserProvider>
  );
}