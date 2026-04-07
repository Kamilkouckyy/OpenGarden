import { useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import GardenBedOverview from "./components/common/GardenBedOverview.jsx";
import Navbar from "./components/layout/Navbar.jsx";

export default function App() {
  const [user, setUser] = useState({
    name: "Anna",
    role: "Správce",
  });

  const navItems = useMemo(
    () => [
      { label: "Záhony", path: "/garden-beds" },
      { label: "Úkoly", path: "/tasks" },
      { label: "Hlášení", path: "/reports" },
      { label: "Vybavení", path: "/equipment" },
      { label: "Události", path: "/events" },
    ],
    []
  );

  const handleLogin = () => {
    setUser({
      name: "Anna",
      role: "Správce",
    });
  };

  const handleLogout = () => setUser(undefined);

  return (
    <div className="App">
      <Navbar
        user={user}
        navItems={navItems}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <main className="og-page-wrap">
        <Routes>
          <Route path="/" element={<Navigate to="/garden-beds" replace />} />
          <Route path="/garden-beds" element={<GardenBedOverview />} />
          <Route path="/tasks" element={<Navigate to="/tasks" replace />} />
          <Route path="/reports" element={<Navigate to="/reports" replace />} />
          <Route path="/equipment" element={<Navigate to="/equipment" replace />} />
          <Route path="/events" element={<Navigate to="/events" replace />} />
          <Route path="*" element={<Navigate to="/garden-beds" replace />} />
        </Routes>
      </main>
    </div>
  );
}