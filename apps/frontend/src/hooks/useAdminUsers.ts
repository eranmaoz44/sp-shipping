import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBaseUrl } from "../auth-config";
import { ROLE_OPTIONS, type AdminUser, type AppRole } from "../types/app";

type UseAdminUsersParams = {
  getApiToken: () => Promise<string>;
  enabled?: boolean;
};

export const useAdminUsers = ({ getApiToken, enabled = true }: UseAdminUsersParams) => {
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("member");
  const [draftRoles, setDraftRoles] = useState<Record<string, AppRole>>({});
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    enabled,
    queryFn: async () => {
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
        throw new Error(data.error ?? "Failed to load users");
      }

      return {
        users: data.users ?? [],
        total: data.total ?? data.users?.length ?? 0,
      };
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      const token = await getApiToken();
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: { email?: string; roles?: string[] };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add user");
      }

      return data.user;
    },
    onSuccess: async () => {
      setNewUserEmail("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const token = await getApiToken();
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const data = (await response.json()) as {
        error?: string;
        user?: AdminUser;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update user role");
      }

      return data.user;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<{ users: AdminUser[]; total: number } | undefined>(
        ["admin-users"],
        (current) => {
          if (!current || !updatedUser?.id) {
            return current;
          }

          return {
            ...current,
            users: current.users.map((user) =>
              user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
            ),
          };
        },
      );
      if (updatedUser?.id && updatedUser.roles?.[0]) {
        setDraftRoles((current) => ({
          ...current,
          [updatedUser.id as string]: updatedUser.roles?.[0] as AppRole,
        }));
      }
      setUpdatingUserId(null);
    },
    onError: () => {
      setUpdatingUserId(null);
    },
  });

  useEffect(() => {
    const loadedUsers = usersQuery.data?.users;
    if (!loadedUsers) {
      return;
    }

    setDraftRoles((current) => {
      const next = { ...current };
      for (const user of loadedUsers) {
        if (!user.id) {
          continue;
        }
        if (!next[user.id]) {
          const role = (user.roles?.[0] ?? "viewer") as AppRole;
          next[user.id] = role;
        }
      }
      return next;
    });
  }, [usersQuery.data?.users]);

  const usersMessage = useMemo(() => {
    if (usersQuery.isLoading) {
      return "Loading users...";
    }
    if (usersQuery.isError) {
      return usersQuery.error instanceof Error
        ? usersQuery.error.message
        : "Failed to load users";
    }
    if (!usersQuery.data) {
      return "";
    }
    return `Loaded ${usersQuery.data.total} allowed users.`;
  }, [usersQuery.data, usersQuery.error, usersQuery.isError, usersQuery.isLoading]);

  const addUserMessage = useMemo(() => {
    if (addUserMutation.isPending) {
      return "Adding user...";
    }
    if (addUserMutation.isError) {
      return addUserMutation.error instanceof Error
        ? addUserMutation.error.message
        : "Failed to add user";
    }
    if (addUserMutation.isSuccess && addUserMutation.data?.email) {
      return `Added ${addUserMutation.data.email}.`;
    }
    return "";
  }, [
    addUserMutation.data?.email,
    addUserMutation.error,
    addUserMutation.isError,
    addUserMutation.isPending,
    addUserMutation.isSuccess,
  ]);

  const roleUpdateMessage = useMemo(() => {
    if (updateRoleMutation.isPending) {
      return "Updating role...";
    }
    if (updateRoleMutation.isError) {
      return updateRoleMutation.error instanceof Error
        ? updateRoleMutation.error.message
        : "Failed to update role";
    }
    if (updateRoleMutation.isSuccess) {
      return "Role updated.";
    }
    return "";
  }, [
    updateRoleMutation.error,
    updateRoleMutation.isError,
    updateRoleMutation.isPending,
    updateRoleMutation.isSuccess,
  ]);

  const addUser = async () => {
    await addUserMutation.mutateAsync({
      email: newUserEmail.trim(),
      role: newUserRole,
    });
  };

  const getCurrentRole = (user: AdminUser): AppRole => {
    return (user.roles?.[0] ?? "viewer") as AppRole;
  };

  const getDraftRole = (user: AdminUser): AppRole => {
    if (!user.id) {
      return getCurrentRole(user);
    }

    return draftRoles[user.id] ?? getCurrentRole(user);
  };

  const setDraftRole = (userId: string, role: AppRole) => {
    setDraftRoles((current) => ({
      ...current,
      [userId]: role,
    }));
  };

  const hasUserRoleChanged = (user: AdminUser): boolean => {
    if (!user.id) {
      return false;
    }

    return getDraftRole(user) !== getCurrentRole(user);
  };

  const saveUserRole = async (user: AdminUser) => {
    if (!user.id) {
      return;
    }

    setUpdatingUserId(user.id);
    await updateRoleMutation.mutateAsync({
      userId: user.id,
      role: getDraftRole(user),
    });
  };

  return {
    users: usersQuery.data?.users ?? [],
    usersMessage,
    isUsersLoading: usersQuery.isLoading || usersQuery.isFetching,
    newUserEmail,
    newUserRole,
    addUserMessage,
    roleUpdateMessage,
    isAddingUser: addUserMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    updatingUserId,
    roleOptions: ROLE_OPTIONS,
    setNewUserEmail,
    setNewUserRole,
    setDraftRole,
    getDraftRole,
    hasUserRoleChanged,
    refetchUsers: usersQuery.refetch,
    addUser,
    saveUserRole,
  };
};
