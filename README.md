# S3 Explorer

A modern, self-hosted S3 file manager built with React Router 7. Browse, upload, download, preview, and manage files in any S3-compatible storage.

## Features

- Browse buckets and folders with URL-driven navigation
- Upload files (drag & drop or click)
- Download via presigned URLs
- Inline preview for images, video, audio, PDF, and text files
- Multi-select with bulk delete
- Search/filter within folders
- Dark/light theme
- Optional username/password authentication
- Stateless sessions (survives restarts, scales horizontally)

## Supported Storage

AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces, Backblaze B2, Wasabi, and any S3-compatible service.

## Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/XHCuv0?referralCode=mHvVn-)

Set these environment variables in Railway:

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_ENDPOINT` | Yes | S3 endpoint URL |
| `S3_ACCESS_KEY_ID` | Yes | S3 access key |
| `S3_SECRET_ACCESS_KEY` | Yes | S3 secret key |
| `S3_REGION` | Yes | S3 region (e.g., `us-east-1`) |
| `S3_BUCKET` | No | Default bucket (skips bucket list) |
| `S3_FORCE_PATH_STYLE` | No | Set to `true` for MinIO/R2 (default: `true`) |
| `AUTH_USERNAME` | No | Enable auth with this username |
| `AUTH_PASSWORD` | No | Password for authentication |
| `SESSION_SECRET` | No | Cookie signing secret (auto-generated if not set) |

## Local Development

```bash
# Clone the repo
git clone https://github.com/soratekstudio/s3-explorer.git
cd s3-explorer

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your S3 credentials

# Start dev server
npm run dev
```

Open http://localhost:5173

## Docker

```bash
docker build -t s3-explorer .
docker run -p 3000:3000 \
  -e S3_ENDPOINT=https://s3.amazonaws.com \
  -e S3_ACCESS_KEY_ID=your-key \
  -e S3_SECRET_ACCESS_KEY=your-secret \
  -e S3_REGION=us-east-1 \
  s3-explorer
```

## Tech Stack

- [React Router 7](https://reactrouter.com/) (framework mode)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Lucide React](https://lucide.dev/)

## License

MIT
