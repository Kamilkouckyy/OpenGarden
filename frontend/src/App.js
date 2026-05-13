import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import Navbar from "./components/layout/Navbar";
import GardenBedOverview from "./components/common/GardenBedOverview";
import TaskPanelOverview from "./components/common/TaskPanelOverview";
import TaskDetailCard from "./components/common/TaskDetailCard";
import ReportsOverview from "./components/common/ReportsOverview";
import EquipmentOverview from "./components/common/EquipmentOverview";
import EquipmentDetail from "./components/common/EquipmentDetail";
import EventsOverview from "./components/common/EventsOverview";
import LoginScreen from "./components/auth/LoginScreen";
import EventDetailView from "./components/common/EventDetailView";
import ReportDetail from "./components/common/ReportDetail";
import "./App.css";

function AppShell() {
  const { user, loading, logout } = useUser();
  const { t } = useLanguage();

  if (loading) {
    return <div className="app-main">Načítám přihlášení…</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div>
      <Navbar
        user={user}
        onLogout={logout}
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
          <Route path="/garden-beds/:id" element={<Navigate to="/garden-beds" replace />} />
          <Route path="/tasks" element={<TaskPanelOverview />} />
          <Route path="/tasks/:id" element={<TaskDetailCard />} />
          <Route path="/reports" element={<ReportsOverview />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/equipment" element={<EquipmentOverview />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
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