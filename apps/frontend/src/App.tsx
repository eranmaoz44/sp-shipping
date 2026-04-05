import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiBaseUrl, auth0Config } from "./auth-config";
import "./App.css";

type ActorProfile = {
  sub?: string;
  email?: string;
  roles: string[];
  permissions: string[];
};

type AdminUser = {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
  lastLogin?: string;
  loginCount?: number;
};

type ThemeMode = "light" | "dark";

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
  const [apiMessage, setApiMessage] = useState<string>("");
  const [actor, setActor] = useState<ActorProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersMessage, setUsersMessage] = useState<string>("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "settings">("home");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("sp-theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sp-theme", theme);
  }, [theme]);

  const getApiToken = async (): Promise<string> => {
    return getAccessTokenSilently({
      authorizationParams: {
        audience: auth0Config.audience,
      },
    });
  };

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

  useEffect(() => {
    if (!isAuthenticated) {
      setActor(null);
      return;
    }

    const loadProfile = async () => {
      setIsProfileLoading(true);

      try {
        const token = await getApiToken();
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as ActorProfile & { error?: string };
        if (!response.ok) {
          setApiMessage(data.error ?? "Failed to load profile");
          setActor(null);
          return;
        }

        setActor({
          sub: data.sub,
          email: data.email,
          roles: data.roles ?? [],
          permissions: data.permissions ?? [],
        });
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load actor profile";
        setApiMessage(message);
        setActor(null);
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadProfile();
  }, [isAuthenticated, getAccessTokenSilently]);

  const isSuperAdmin = actor?.roles.includes("super_admin") ?? false;

  const loadAdminUsers = async () => {
    setIsUsersLoading(true);
    setUsersMessage("");

    try {
      const token = await getApiToken();
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await response.json()) as {
        users?: AdminUser[];
        total?: number;
        error?: string;
      };

      if (!response.ok) {
        setUsers([]);
        setUsersMessage(data.error ?? "Failed to load users");
        return;
      }

      setUsers(data.users ?? []);
      setUsersMessage(`Loaded ${data.total ?? data.users?.length ?? 0} users from Auth0.`);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load users from API";
      setUsers([]);
      setUsersMessage(message);
    } finally {
      setIsUsersLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="app-shell">
        <div className="card centered">
          <h1>sp-shipping</h1>
          <p className="muted">Loading authentication...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <span className="brand">sp-shipping</span>
          <button className="btn ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </header>
        <section className="card centered">
          <h1>Authentication error</h1>
          <p className="error-text">{error.message}</p>
          <button className="btn primary" onClick={() => loginWithRedirect()}>
            Try login again
          </button>
        </section>
      </main>
    );
  }

  const isHandlingAuthCallback =
    window.location.search.includes("code=") && window.location.search.includes("state=");

  if (isHandlingAuthCallback) {
    return (
      <main className="app-shell">
        <div className="card centered">
          <h1>sp-shipping</h1>
          <p className="muted">Finalizing login...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <span className="brand">sp-shipping</span>
          <button className="btn ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </header>
        <section className="card centered auth-card">
          <h1>Welcome to sp-shipping</h1>
          <p className="muted">Sign in to continue to your dashboard.</p>
          <button className="btn primary" onClick={() => loginWithRedirect()}>
            Log in with Auth0
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand">sp-shipping</span>
          <nav className="tabs">
            <button
              className={`tab ${activeView === "home" ? "active" : ""}`}
              onClick={() => setActiveView("home")}
            >
              Home
            </button>
            {isSuperAdmin ? (
              <button
                className={`tab ${activeView === "settings" ? "active" : ""}`}
                onClick={() => setActiveView("settings")}
              >
                Settings
              </button>
            ) : null}
          </nav>
        </div>
        <div className="topbar-right">
          <button className="btn ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className="user-chip">{user?.email ?? user?.name ?? "Authenticated user"}</div>
          <button
            className="btn ghost"
            onClick={() =>
              logout({
                logoutParams: { returnTo: window.location.origin },
              })
            }
          >
            Log out
          </button>
        </div>
      </header>

      {activeView === "home" ? (
        <section className="grid">
          <article className="card">
            <h1>Dashboard</h1>
            <p className="muted">Hey, {user?.email ?? user?.name ?? "authenticated user"}.</p>
            <div className="meta-row">
              <span className="badge">
                Roles: {isProfileLoading ? "loading..." : actor?.roles.join(", ") || "none"}
              </span>
            </div>
            <div className="actions">
              <button className="btn primary" onClick={callProtectedApi}>
                Call protected API
              </button>
            </div>
            {apiMessage ? <p className="status-line">{apiMessage}</p> : null}
          </article>
        </section>
      ) : null}

      {activeView === "settings" && isSuperAdmin ? (
        <section className="grid">
          <article className="card">
            <h2>Users management</h2>
            <p className="muted">List users from Auth0 Management API.</p>
            <div className="actions">
              <button className="btn primary" onClick={loadAdminUsers} disabled={isUsersLoading}>
                {isUsersLoading ? "Loading users..." : "Load users"}
              </button>
            </div>
            {usersMessage ? <p className="status-line">{usersMessage}</p> : null}
            {users.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Last login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((adminUser) => (
                      <tr key={adminUser.id ?? adminUser.email}>
                        <td>{adminUser.email ?? "no-email"}</td>
                        <td>{adminUser.name ?? "no-name"}</td>
                        <td>{adminUser.lastLogin ? new Date(adminUser.lastLogin).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </section>
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
