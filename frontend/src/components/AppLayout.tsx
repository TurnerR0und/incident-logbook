import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Incident Logbook</h1>
        <div className="app-header-right">
          <span>{user?.email}{user?.is_admin ? " (Admin)" : ""}</span>
          <button className="btn btn-sm btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
