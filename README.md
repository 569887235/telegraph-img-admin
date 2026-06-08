# telegraph-img-admin

Vue admin dashboard for telegraph-img.

## Development

```bash
npm install
npm run dev
```

Dev server is fixed at port `5173` and listens on `0.0.0.0`, so it can be exposed by an external port mapping.

The default API base is the code-server API proxy:

```text
https://code.zyzhou.dpdns.org/proxy/3100
```

Override it when using a different backend:

```bash
VITE_API_BASE=http://localhost:3100 npm run dev
```
