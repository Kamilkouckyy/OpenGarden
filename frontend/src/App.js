import './App.css';
import { Routes, Route } from "react-router-dom";
import GardenBedOverview from "./components/common/GardenBedOverview.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/garden-bed-overview" element={<GardenBedOverview />} />
     
    </Routes>
  );
}