import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";

export default function AppLayout({ children, wide = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">M</span>
          MOVES Experiment Console
        </div>
        {isAuthenticated ? (
          <div className="app-user-menu">
            <span>{user?.fullName || user?.username}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : null}
      </header>
      <main className="app-main">
        <div className={`page ${wide ? "page-wide" : ""}`}>{children}</div>
      </main>
    </div>
  );
}
