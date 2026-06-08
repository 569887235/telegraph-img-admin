# telegraph-img-admin

Vue admin dashboard for telegraph-img.

## Development

```bash
npm install
npm run dev
```

The default dev-server base is `/proxy/5173/`, and the default API base is `/proxy/3100`. This matches code-server style external access:

- Admin: `https://code.zyzhou.dpdns.org/proxy/5173/`
- API: `https://code.zyzhou.dpdns.org/proxy/3100`

Override them when using different addresses:

```bash
VITE_BASE=/ VITE_API_BASE=http://localhost:3100 npm run dev
```
