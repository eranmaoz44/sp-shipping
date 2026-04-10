import { useState } from "react";
import { apiBaseUrl } from "../auth-config";
import type { AdminUser } from "../types/app";

type UseAdminUsersParams = {
  getApiToken: () => Promise<string>;
};

export const useAdminUsers = ({ getApiToken }: UseAdminUsersParams) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersMessage, setUsersMessage] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("member");
  const [addUserMessage, setAddUserMessage] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

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
      setUsersMessage(`Loaded ${data.total ?? data.users?.length ?? 0} allowed users.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load users from API";
      setUsers([]);
      setUsersMessage(message);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const addUser = async () => {
    setIsAddingUser(true);
    setAddUserMessage("");

    try {
      const token = await getApiToken();
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: { email?: string; roles?: string[] };
      };

      if (!response.ok) {
        setAddUserMessage(data.error ?? "Failed to add user");
        return;
      }

      setAddUserMessage(
        `Added ${data.user?.email ?? newUserEmail} with roles: ${data.user?.roles?.join(", ") ?? newUserRole}.`,
      );
      setNewUserEmail("");
      await loadAdminUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add user";
      setAddUserMessage(message);
    } finally {
      setIsAddingUser(false);
    }
  };

  return {
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
  };
};
