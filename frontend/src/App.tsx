import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { LoginPage } from "./pages/LoginPage";
import { BerandaPage } from "./pages/BerandaPage";
import { KeluargaPage } from "./pages/KeluargaPage";
import { DetailKeluargaPage } from "./pages/DetailKeluargaPage";
import { PengaturanPage } from "./pages/PengaturanPage";

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
          <Route path="/" element={<Protected><BerandaPage /></Protected>} />
          <Route path="/keluarga" element={<Protected><KeluargaPage /></Protected>} />
          <Route path="/keluarga/:id" element={<Protected><DetailKeluargaPage /></Protected>} />
          <Route path="/pengaturan" element={<Protected><PengaturanPage /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
