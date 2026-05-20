import { useI18n } from "../i18n";

type DashboardPanelProps = {
  userDisplay: string;
  rolesDisplay: string;
  apiMessage: string;
  onCallProtectedApi: () => void;
};

export const DashboardPanel = ({
  userDisplay,
  rolesDisplay,
  apiMessage,
  onCallProtectedApi,
}: DashboardPanelProps) => {
  const { t } = useI18n();

  return (
    <section className="grid">
      <article className="card">
        <h1>{t("dashboard.title")}</h1>
        <p className="muted">{t("dashboard.helloUser", { user: userDisplay })}</p>
        <div className="meta-row">
          <span className="badge">{t("dashboard.roles", { roles: rolesDisplay })}</span>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onCallProtectedApi}>
            {t("dashboard.callProtectedApi")}
          </button>
        </div>
        {apiMessage ? <p className="status-line">{apiMessage}</p> : null}
      </article>
    </section>
  );
};
