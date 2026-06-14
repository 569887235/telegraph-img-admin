# telegraph-img-admin

Vue admin dashboard for telegraph-img.

## Development

```bash
npm install
npm run dev
```

The dev server is fixed at port `5173` and listens on `0.0.0.0`, so it can be exposed by an external port mapping.

Browser requests use same-origin paths. Vite proxies these paths to the API service at `http://127.0.0.1:3100`:

- `/api`
- `/health`

Override the browser API base only when proxying is not desired:

```bash
VITE_API_BASE=http://localhost:3100 npm run dev
```

## Display Rules

- API size fields remain numeric bytes. The admin UI formats file sizes in the browser with `formatFileSize`, using `B`, `K`, `M`, and `G` for display only.
