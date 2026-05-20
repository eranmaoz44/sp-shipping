import { useEffect, useState } from "react";
import { apiBaseUrl } from "../auth-config";
import type { ActorProfile } from "../types/app";

type UseActorProfileParams = {
  isAuthenticated: boolean;
  getApiToken: () => Promise<string>;
};

type ProfileLoadState = "idle" | "loading" | "authorized" | "access_denied" | "error";

export const useActorProfile = ({ isAuthenticated, getApiToken }: UseActorProfileParams) => {
  const [actor, setActor] = useState<ActorProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasResolvedProfile, setHasResolvedProfile] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileState, setProfileState] = useState<ProfileLoadState>("idle");

  useEffect(() => {
    if (!isAuthenticated) {
      setActor(null);
      setIsAccessDenied(false);
      setHasResolvedProfile(false);
      setProfileMessage("");
      setProfileState("idle");
      return;
    }

    const loadProfile = async () => {
      setIsProfileLoading(true);
      setHasResolvedProfile(false);
      setProfileMessage("");
      setProfileState("loading");

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
          const isForbidden = response.status === 403;
          setIsAccessDenied(isForbidden);
          setProfileState(isForbidden ? "access_denied" : "error");
          setActor(null);
          return;
        }

        setIsAccessDenied(false);
        setProfileState("authorized");
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
        setProfileState("error");
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
    profileState,
  };
};
