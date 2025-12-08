import useSWR from "swr";

async function fetchAPI(key) {
  const res = await fetch(key);
  const responseBody = await res.json();

  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "loading...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Last updated at: {updatedAtText}</div>;
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  const loadingText = "loading...";

  const versionText =
    isLoading && !data ? loadingText : data.dependencies.database.version;
  const openConnectionsText =
    isLoading && !data
      ? loadingText
      : data.dependencies.database.opened_connections;
  const maxConnectionsText =
    isLoading && !data
      ? loadingText
      : data.dependencies.database.max_connections;

  return (
    <div>
      <h2>Database</h2>
      <p>Version: {versionText}</p>
      <p>Open connections: {openConnectionsText}</p>
      <p>Max connections: {maxConnectionsText}</p>
    </div>
  );
}
