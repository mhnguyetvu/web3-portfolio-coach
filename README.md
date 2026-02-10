This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. **Push the repo to GitHub** (if you haven’t already).

2. **Import on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository (e.g. `my-defai-chatbot`)
   - Vercel will detect Next.js and use the project’s `vercel.json` (pnpm install/build).

3. **Set environment variable**
   - In the Vercel project: **Settings → Environment Variables**
   - Add:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** your [Google AI Studio API key](https://aistudio.google.com/apikey)
   - Redeploy (or trigger a new deployment) so the variable is applied.

4. **Deploy**
   - Click **Deploy**. Each push to your main branch will trigger a new deployment.

Your app will be available at `https://<project-name>.vercel.app` (or your custom domain).

---

## Deploy with ngrok (ngrok-free.dev)

Expose the app on a public URL using [ngrok](https://ngrok-free.dev) (free tier supported).

### Option A: Local + ngrok

1. Install [ngrok](https://ngrok-free.dev/download) and add your auth token.
2. Build and start the app:
   ```bash
   pnpm install && pnpm build && pnpm start
   ```
3. In another terminal, start a tunnel:
   ```bash
   ngrok http 3000
   ```
4. Open the HTTPS URL ngrok prints (e.g. `https://abc123.ngrok-free.app`).

### Option B: Docker + ngrok

1. Build and run the container:
   ```bash
   docker build -t my-defai-chatbot .
   docker run -p 3000:3000 --env-file .env.local my-defai-chatbot
   ```
2. In another terminal:
   ```bash
   ngrok http 3000
   ```

**Environment:** Set `GEMINI_API_KEY` (e.g. in `.env.local` or container env) so the chat API works.
