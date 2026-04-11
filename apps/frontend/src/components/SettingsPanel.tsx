import type { AdminUser, AppRole } from "../types/app";

type SettingsPanelProps = {
  actorSub?: string;
  actorEmail?: string;
  users: AdminUser[];
  usersMessage: string;
  isUsersLoading: boolean;
  newUserEmail: string;
  newUserRole: AppRole;
  addUserMessage: string;
  roleUpdateMessage: string;
  isAddingUser: boolean;
  isUpdatingRole: boolean;
  updatingUserId: string | null;
  roleOptions: readonly AppRole[];
  setNewUserEmail: (value: string) => void;
  setNewUserRole: (value: AppRole) => void;
  setDraftRole: (userId: string, role: AppRole) => void;
  getDraftRole: (user: AdminUser) => AppRole;
  hasUserRoleChanged: (user: AdminUser) => boolean;
  refetchUsers: () => Promise<unknown>;
  addUser: () => Promise<void>;
  saveUserRole: (user: AdminUser) => Promise<void>;
};

export const SettingsPanel = ({
  actorSub,
  actorEmail,
  users,
  usersMessage,
  isUsersLoading,
  newUserEmail,
  newUserRole,
  addUserMessage,
  roleUpdateMessage,
  isAddingUser,
  isUpdatingRole,
  updatingUserId,
  roleOptions,
  setNewUserEmail,
  setNewUserRole,
  setDraftRole,
  getDraftRole,
  hasUserRoleChanged,
  refetchUsers,
  addUser,
  saveUserRole,
}: SettingsPanelProps) => {
  const normalizeEmail = (email?: string) => (email ? email.trim().toLowerCase() : "");

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
            onChange={(event) => setNewUserRole(event.target.value as AppRole)}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => void addUser()} disabled={isAddingUser || !newUserEmail.trim()}>
            {isAddingUser ? "Adding..." : "Add user"}
          </button>
        </div>
        {addUserMessage ? <p className="status-line">{addUserMessage}</p> : null}
        <div className="actions">
          <button className="btn primary" onClick={() => void refetchUsers()} disabled={isUsersLoading}>
            {isUsersLoading ? "Refreshing..." : "Refresh users"}
          </button>
        </div>
        {usersMessage ? <p className="status-line">{usersMessage}</p> : null}
        {roleUpdateMessage ? <p className="status-line">{roleUpdateMessage}</p> : null}
        {users.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((adminUser) => (
                  <tr key={adminUser.id ?? adminUser.email ?? "unknown-user"}>
                    <td>{adminUser.email ?? "no-email"}</td>
                    <td>
                      <select
                        className="input"
                        value={getDraftRole(adminUser)}
                        disabled={
                          isUpdatingRole ||
                          !adminUser.id ||
                          (actorSub && adminUser.auth0Sub === actorSub) ||
                          (normalizeEmail(actorEmail).length > 0 &&
                            normalizeEmail(actorEmail) === normalizeEmail(adminUser.email))
                        }
                        onChange={(event) => {
                          if (!adminUser.id) {
                            return;
                          }
                          setDraftRole(adminUser.id, event.target.value as AppRole);
                        }}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{adminUser.isActive ? "active" : "inactive"}</td>
                    <td>
                      <button
                        className="btn primary"
                        disabled={
                          !adminUser.id ||
                          !hasUserRoleChanged(adminUser) ||
                          isUpdatingRole ||
                          (actorSub && adminUser.auth0Sub === actorSub) ||
                          (normalizeEmail(actorEmail).length > 0 &&
                            normalizeEmail(actorEmail) === normalizeEmail(adminUser.email))
                        }
                        onClick={() => void saveUserRole(adminUser)}
                      >
                        {updatingUserId === adminUser.id ? "Saving..." : "Save"}
                      </button>
                    </td>
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
