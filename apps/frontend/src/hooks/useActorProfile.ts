import { useEffect, useState } from "react";
import { apiBaseUrl } from "../auth-config";
import type { ActorProfile } from "../types/app";

type UseActorProfileParams = {
  isAuthenticated: boolean;
  getApiToken: () => Promise<string>;
};

export const useActorProfile = ({ isAuthenticated, getApiToken }: UseActorProfileParams) => {
  const [actor, setActor] = useState<ActorProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasResolvedProfile, setHasResolvedProfile] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setActor(null);
      setIsAccessDenied(false);
      setHasResolvedProfile(false);
      setProfileMessage("");
      return;
    }

    const loadProfile = async () => {
      setIsProfileLoading(true);
      setHasResolvedProfile(false);
      setProfileMessage("");

      try {
        const token = await getApiToken();
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as ActorProfile & { error?: string };
        if (!response.ok) {
          setProfileMessage(data.error ?? "Failed to load profile");
          setIsAccessDenied(response.status === 403);
          setActor(null);
          return;
        }

        setIsAccessDenied(false);
        setActor({
          sub: data.sub,
          email: data.email,
          roles: data.roles ?? [],
          permissions: data.permissions ?? [],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load actor profile";
        setProfileMessage(message);
        setIsAccessDenied(false);
        setActor(null);
      } finally {
        setIsProfileLoading(false);
        setHasResolvedProfile(true);
      }
    };

    void loadProfile();
  }, [getApiToken, isAuthenticated]);

  return {
    actor,
    isProfileLoading,
    hasResolvedProfile,
    isAccessDenied,
    profileMessage,
  };
};
