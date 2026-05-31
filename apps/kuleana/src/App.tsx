import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { BoardPage } from './pages/BoardPage';
import { GigBrowserPage } from './pages/GigBrowserPage';
import { KuleanaPage } from './pages/KuleanaPage';
import { PastWeeksPage } from './pages/PastWeeksPage';
import { SettingsPage } from './pages/SettingsPage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<BoardPage />} />
            <Route path="gigs" element={<GigBrowserPage />} />
            <Route path="kuleana" element={<KuleanaPage />} />
            <Route path="history" element={<PastWeeksPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
