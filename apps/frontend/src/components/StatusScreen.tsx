import type { ThemeMode } from "../types/app";
import { TopBar } from "./TopBar";

type StatusScreenProps = {
  theme: ThemeMode;
  onToggleTheme: () => void;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "ghost";
};

export const StatusScreen = ({
  theme,
  onToggleTheme,
  title,
  message,
  actionLabel,
  onAction,
  actionVariant = "primary",
}: StatusScreenProps) => {
  return (
    <main className="app-shell">
      <TopBar theme={theme} onToggleTheme={onToggleTheme} />
      <section className="card centered auth-card">
        <h1>{title}</h1>
        <p className="muted">{message}</p>
        {actionLabel && onAction ? (
          <button className={`btn ${actionVariant}`} onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </section>
    </main>
  );
};
