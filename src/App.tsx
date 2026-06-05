import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { TradingJournal } from './pages/TradingJournal';
import { CRM } from './pages/CRM';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="trading" element={<TradingJournal />} />
          <Route path="crm" element={<CRM />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
