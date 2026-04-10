import { useCallback, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiBaseUrl, auth0Config } from "./auth-config";
import { DashboardPanel } from "./components/DashboardPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatusScreen } from "./components/StatusScreen";
import { TopBar } from "./components/TopBar";
import { useActorProfile } from "./hooks/useActorProfile";
import { useAdminUsers } from "./hooks/useAdminUsers";
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
  } = useActorProfile({ isAuthenticated, getApiToken });

  const adminUsers = useAdminUsers({ getApiToken });

  const callProtectedApi = async () => {
    try {
      const token = await getApiToken();
      const response = await fetch(`${apiBaseUrl}/api/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await response.json()) as { message?: string; error?: string };
      setApiMessage(data.message ?? data.error ?? "No response message");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown auth error";
      setApiMessage(message);
    }
  };

  const isSuperAdmin = actor?.roles.includes("super_admin") ?? false;
  const userDisplay = user?.email ?? user?.name ?? "authenticated user";
  const rolesDisplay = isProfileLoading ? "loading..." : actor?.roles.join(", ") || "none";
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
        title="sp-shipping"
        message="Loading authentication..."
      />
    );
  }

  if (error) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title="Authentication error"
        message={error.message}
        actionLabel="Try login again"
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
        title="sp-shipping"
        message="Finalizing login..."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title="Welcome to sp-shipping"
        message="Sign in to continue to your dashboard."
        actionLabel="Log in with Auth0"
        onAction={() => void loginWithRedirect()}
      />
    );
  }

  if (isProfileLoading || !hasResolvedProfile) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title="sp-shipping"
        message="Checking account access..."
      />
    );
  }

  if (isAccessDenied || !actor) {
    return (
      <StatusScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        title="Access denied"
        message="You do not have an account in this application yet, so you cannot use it. Contact an administrator to be added."
        actionLabel="Log out"
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
        userLabel={user?.email ?? user?.name ?? "Authenticated user"}
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
          users={adminUsers.users}
          usersMessage={adminUsers.usersMessage}
          isUsersLoading={adminUsers.isUsersLoading}
          newUserEmail={adminUsers.newUserEmail}
          newUserRole={adminUsers.newUserRole}
          addUserMessage={adminUsers.addUserMessage}
          isAddingUser={adminUsers.isAddingUser}
          setNewUserEmail={adminUsers.setNewUserEmail}
          setNewUserRole={adminUsers.setNewUserRole}
          loadAdminUsers={adminUsers.loadAdminUsers}
          addUser={adminUsers.addUser}
        />
      ) : null}

      {activeView === "settings" && !isSuperAdmin ? (
        <section className="grid">
          <article className="card">
            <h2>Access denied</h2>
            <p className="muted">Only super admins can open settings.</p>
          </article>
        </section>
      ) : null}
    </main>
  );
}

export default App;
