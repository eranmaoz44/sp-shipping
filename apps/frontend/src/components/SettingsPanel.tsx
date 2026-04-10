import type { AdminUser } from "../types/app";

type SettingsPanelProps = {
  users: AdminUser[];
  usersMessage: string;
  isUsersLoading: boolean;
  newUserEmail: string;
  newUserRole: string;
  addUserMessage: string;
  isAddingUser: boolean;
  setNewUserEmail: (value: string) => void;
  setNewUserRole: (value: string) => void;
  loadAdminUsers: () => Promise<void>;
  addUser: () => Promise<void>;
};

export const SettingsPanel = ({
  users,
  usersMessage,
  isUsersLoading,
  newUserEmail,
  newUserRole,
  addUserMessage,
  isAddingUser,
  setNewUserEmail,
  setNewUserRole,
  loadAdminUsers,
  addUser,
}: SettingsPanelProps) => {
  return (
    <section className="grid">
      <article className="card">
        <h2>Users management</h2>
        <p className="muted">Allow users by email and assign their initial role.</p>
        <div className="actions">
          <input
            className="input"
            type="email"
            placeholder="user@example.com"
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.target.value)}
          />
          <select
            className="input"
            value={newUserRole}
            onChange={(event) => setNewUserRole(event.target.value)}
          >
            <option value="viewer">viewer</option>
            <option value="member">member</option>
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </select>
          <button className="btn primary" onClick={() => void addUser()} disabled={isAddingUser || !newUserEmail.trim()}>
            {isAddingUser ? "Adding..." : "Add user"}
          </button>
        </div>
        {addUserMessage ? <p className="status-line">{addUserMessage}</p> : null}
        <div className="actions">
          <button className="btn primary" onClick={() => void loadAdminUsers()} disabled={isUsersLoading}>
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
                  <th>Roles</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((adminUser) => (
                  <tr key={adminUser.id ?? adminUser.email}>
                    <td>{adminUser.email ?? "no-email"}</td>
                    <td>{adminUser.roles?.join(", ") ?? "-"}</td>
                    <td>{adminUser.isActive ? "active" : "inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>
    </section>
  );
};
