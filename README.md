# telegraph-img-admin

Vue admin dashboard for telegraph-img.

## Development

```bash
npm install
npm run dev
```

The default API base is `/proxy/3100`, which matches code-server style external access such as `https://code.zyzhou.dpdns.org/proxy/3100`.

Set `VITE_API_BASE` when using a different API address:

```bash
VITE_API_BASE=https://code.zyzhou.dpdns.org/proxy/3100 npm run dev
```
