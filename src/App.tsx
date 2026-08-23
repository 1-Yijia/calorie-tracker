import { Navigate, Route, Routes } from "react-router-dom";
import { isOnboarded } from "./lib/storage";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import LogSlot from "./screens/LogSlot";
import Summary from "./screens/Summary";
import EditLimits from "./screens/EditLimits";

function RequireOnboard({ children }: { children: React.ReactNode }) {
  if (!isOnboarded()) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/"
        element={
          <RequireOnboard>
            <Home />
          </RequireOnboard>
        }
      />
      <Route
        path="/log/:slot"
        element={
          <RequireOnboard>
            <LogSlot />
          </RequireOnboard>
        }
      />
      <Route
        path="/summary"
        element={
          <RequireOnboard>
            <Summary />
          </RequireOnboard>
        }
      />
      <Route
        path="/limits"
        element={
          <RequireOnboard>
            <EditLimits />
          </RequireOnboard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
