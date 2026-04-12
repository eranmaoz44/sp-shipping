import { useCallback, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiBaseUrl, auth0Config } from "./auth-config";
import { DashboardPanel } from "./components/DashboardPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatusScreen } from "./components/StatusScreen";
import { TopBar } from "./components/TopBar";
import { useActorProfile } from "./hooks/useActorProfile";
import { useAdminUsers } from "./hooks/useAdminUsers";
import { useI18n } from "./i18n";
import { useTheme } from "./hooks/useTheme";
import type { ActiveView } from "./types/app";
import "./App.css";

function App() {
  const {
    isAuthenticated,
    isLoading,
    error,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const { theme, toggleTheme } = useTheme();
  const { t, tRole } = useI18n();
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [apiMessage, setApiMessage] = useState<string>("");

  const getApiToken = useCallback(async (): Promise<string> => {
    return getAccessTokenSilently({
      authorizationParams: {
        audience: auth0Config.audience,
      },
    });
  }, [getAccessTokenSilently]);

  const {
    actor,
    isProfileLoading,
    hasResolvedProfile,
    isAccessDenied,
    profileMessage,
    profileState,
  } = useActorProfile({ isAuthenticated, getApiToken });

  const callProtectedApi = async () => {
    try {
      const token = await getApiToken();
      const response = await fetch(`${apiBaseUrl}/api/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await response.json()) as { message?: string; error?: string };
      setApiMessage(data.message ?? data.error ?? t("dashboard.noResponseMessage"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("dashboard.unknownAuthError");
      setApiMessage(message);
    }
  };

  const isSuperAdmin = actor?.roles.includes("super_admin") ?? false;
  const adminUsers = useAdminUsers({ getApiToken, enabled: isSuperAdmin });
  const userDisplay = user?.email ?? user?.name ?? t("common.authenticatedUser");
  const rolesDisplay = isProfileLoading
    ? t("dashboard.loadingRoles")
    : actor?.roles.map((role) => tRole(role)).join(", ") || t("dashboard.noRoles");
  const dashboardMessage = profileMessage || apiMessage;
  const logoutToHome = () =>
    logout({
      logoutParams: { returnTo: window.location.origin },
    });

  if (isLoading) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title={t("status.loadingAuthTitle")}
        message={t("status.loadingAuthMessage")}
      />
    );
  }

  if (error) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title={t("status.authErrorTitle")}
        message={error.message}
        actionLabel={t("status.tryLoginAgain")}
        onAction={() => void loginWithRedirect()}
      />
    );
  }

  const isHandlingAuthCallback =
    window.location.search.includes("code=") && window.location.search.includes("state=");

  if (isHandlingAuthCallback) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title={t("status.finalizingLoginTitle")}
        message={t("status.finalizingLoginMessage")}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title={t("status.welcomeTitle")}
        message={t("status.welcomeMessage")}
        actionLabel={t("status.loginWithAuth0")}
        onAction={() => void loginWithRedirect()}
      />
    );
  }

  if (isProfileLoading || !hasResolvedProfile) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title={t("status.checkingAccessTitle")}
        message={t("status.checkingAccessMessage")}
      />
    );
  }

  if (profileState === "error") {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title={t("status.unableToVerifyTitle")}
        message={profileMessage || t("status.unableToVerifyMessage")}
        actionLabel={t("status.tryLoginAgain")}
        onAction={() => void loginWithRedirect()}
      />
    );
  }

  if (isAccessDenied || !actor) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title={t("status.accessDeniedTitle")}
        message={t("status.accessDeniedMessage")}
        actionLabel={t("common.logOut")}
        onAction={logoutToHome}
        actionVariant="ghost"
      />
    );
  }

  return (
    <main className="app-shell">
      <TopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        userLabel={user?.email ?? user?.name ?? t("common.authenticatedUser")}
        onLogout={logoutToHome}
        activeView={activeView}
        isSuperAdmin={isSuperAdmin}
        onViewChange={setActiveView}
      />

      {activeView === "home" ? (
        <DashboardPanel
          userDisplay={userDisplay}
          rolesDisplay={rolesDisplay}
          apiMessage={dashboardMessage}
          onCallProtectedApi={() => void callProtectedApi()}
        />
      ) : null}

      {activeView === "settings" && isSuperAdmin ? (
        <SettingsPanel
          actorSub={actor.sub}
          actorEmail={actor.email}
          users={adminUsers.users}
          usersMessage={adminUsers.usersMessage}
          isUsersLoading={adminUsers.isUsersLoading}
          newUserEmail={adminUsers.newUserEmail}
          newUserRole={adminUsers.newUserRole}
          addUserMessage={adminUsers.addUserMessage}
          roleUpdateMessage={adminUsers.roleUpdateMessage}
          isAddingUser={adminUsers.isAddingUser}
          isUpdatingRole={adminUsers.isUpdatingRole}
          updatingUserId={adminUsers.updatingUserId}
          roleOptions={adminUsers.roleOptions}
          setNewUserEmail={adminUsers.setNewUserEmail}
          setNewUserRole={adminUsers.setNewUserRole}
          setDraftRole={adminUsers.setDraftRole}
          getDraftRole={adminUsers.getDraftRole}
          hasUserRoleChanged={adminUsers.hasUserRoleChanged}
          refetchUsers={adminUsers.refetchUsers}
          addUser={adminUsers.addUser}
          saveUserRole={adminUsers.saveUserRole}
        />
      ) : null}

      {activeView === "settings" && !isSuperAdmin ? (
        <section className="grid">
          <article className="card">
            <h2>{t("settings.superAdminOnlyTitle")}</h2>
            <p className="muted">{t("settings.superAdminOnlyMessage")}</p>
          </article>
        </section>
      ) : null}
    </main>
  );
}

export default App;
