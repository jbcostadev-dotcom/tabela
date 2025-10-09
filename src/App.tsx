import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PricingTable from './components/PricingTable';
import Admin from './pages/Admin';
import Confirmacao from './pages/Confirmacao';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PricingTable />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/confirmacao" element={<Confirmacao />} />
      </Routes>
    </Router>
  );
}

export default App;
