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
  return (
    <section className="grid">
      <article className="card">
        <h1>Dashboard</h1>
        <p className="muted">Hey, {userDisplay}.</p>
        <div className="meta-row">
          <span className="badge">Roles: {rolesDisplay}</span>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onCallProtectedApi}>
            Call protected API
          </button>
        </div>
        {apiMessage ? <p className="status-line">{apiMessage}</p> : null}
      </article>
    </section>
  );
};
