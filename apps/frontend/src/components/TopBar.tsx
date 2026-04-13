import type { ActiveView, ThemeMode } from "../types/app";
import { useI18n } from "../i18n";

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
  const { t, toggleLanguage } = useI18n();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="brand">{t("common.brand")}</span>
        {onViewChange && activeView ? (
          <nav className="tabs">
            <button
              className={`tab ${activeView === "home" ? "active" : ""}`}
              onClick={() => onViewChange("home")}
            >
              {t("common.home")}
            </button>
            {isSuperAdmin ? (
              <button
                className={`tab ${activeView === "settings" ? "active" : ""}`}
                onClick={() => onViewChange("settings")}
              >
                {t("common.settings")}
              </button>
            ) : null}
          </nav>
        ) : null}
      </div>

      <div className="topbar-right">
        <button className="btn ghost" onClick={toggleLanguage}>
          {t("common.languageToggle")}
        </button>
        <button className="btn ghost" onClick={onToggleTheme}>
          {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}
        </button>
        {userLabel ? <div className="user-chip">{userLabel}</div> : null}
        {onLogout ? (
          <button className="btn ghost" onClick={onLogout}>
            {t("common.logOut")}
          </button>
        ) : null}
      </div>
    </header>
  );
};
