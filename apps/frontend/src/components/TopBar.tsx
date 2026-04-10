import type { ActiveView, ThemeMode } from "../types/app";

type TopBarProps = {
  theme: ThemeMode;
  onToggleTheme: () => void;
  userLabel?: string;
  onLogout?: () => void;
  activeView?: ActiveView;
  isSuperAdmin?: boolean;
  onViewChange?: (view: ActiveView) => void;
};

export const TopBar = ({
  theme,
  onToggleTheme,
  userLabel,
  onLogout,
  activeView,
  isSuperAdmin = false,
  onViewChange,
}: TopBarProps) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="brand">sp-shipping</span>
        {onViewChange && activeView ? (
          <nav className="tabs">
            <button
              className={`tab ${activeView === "home" ? "active" : ""}`}
              onClick={() => onViewChange("home")}
            >
              Home
            </button>
            {isSuperAdmin ? (
              <button
                className={`tab ${activeView === "settings" ? "active" : ""}`}
                onClick={() => onViewChange("settings")}
              >
                Settings
              </button>
            ) : null}
          </nav>
        ) : null}
      </div>

      <div className="topbar-right">
        <button className="btn ghost" onClick={onToggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        {userLabel ? <div className="user-chip">{userLabel}</div> : null}
        {onLogout ? (
          <button className="btn ghost" onClick={onLogout}>
            Log out
          </button>
        ) : null}
      </div>
    </header>
  );
};
