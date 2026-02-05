export interface DsnParts {
  serverUrl: string;
  projectId: string;
}

/**
 * Parse DSN: https://host[:port]/project_id
 */
export function parseDsn(dsn: string): DsnParts {
  let url: URL;
  try {
    url = new URL(dsn);
  } catch {
    throw new Error(
      `Invalid DSN format. Expected: https://xrayradar.com/your_project_id`
    );
  }
  if (!url.protocol || !url.host) {
    throw new Error(
      `Invalid DSN format. Expected: https://xrayradar.com/your_project_id`
    );
  }
  const pathParts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const projectId = pathParts[pathParts.length - 1];
  if (!projectId) {
    throw new Error(
      `Missing project ID in DSN. Expected: https://xrayradar.com/your_project_id`
    );
  }
  const serverUrl = `${url.protocol}//${url.host}`;
  return { serverUrl, projectId };
}
