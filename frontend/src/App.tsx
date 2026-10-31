import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { LoginPage } from "./pages/LoginPage";
import { BerandaPage } from "./pages/BerandaPage";
import { KeluargaPage } from "./pages/KeluargaPage";
import { DetailKeluargaPage } from "./pages/DetailKeluargaPage";
import { RiwayatPage } from "./pages/RiwayatPage";
import { PengaturanPage } from "./pages/PengaturanPage";
import { SplitLayout } from "./components/SplitLayout";

function Protected({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Protected><SplitLayout /></Protected>}>
            <Route path="/" element={<BerandaPage />} />
            <Route path="/keluarga" element={<KeluargaPage />} />
            <Route path="/keluarga/:id" element={<DetailKeluargaPage />} />
            <Route path="/riwayat" element={<RiwayatPage />} />
            <Route path="/pengaturan" element={<PengaturanPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}