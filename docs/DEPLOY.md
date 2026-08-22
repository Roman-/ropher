# Deploying to GitHub Pages

## Prerequisites

- Node.js 20+
- npm
- Git with push access to the repository

## How It Works

The app is built with Vite and deployed to the `gh-pages` branch. GitHub Pages serves the site from that branch at `https://<username>.github.io/ropher/`.

The base path is set to `/ropher/` in `vite.config.js`.

## Manual Deploy

1. Install dependencies (if not already):

   ```sh
   npm ci
   ```

2. Build the project:

   ```sh
   npm run build
   ```

   This produces the `dist/` directory.

3. Deploy to `gh-pages`:

   ```sh
   cd /tmp
   rm -rf ropher-deploy
   mkdir ropher-deploy
   cp -r <project-path>/dist/* ropher-deploy/
   cd ropher-deploy
   git init
   git checkout -b gh-pages
   git add -A
   git commit -m "Deploy to GitHub Pages"
   git remote add origin git@github.com:<username>/ropher.git
   git push origin gh-pages --force
   ```

   Replace `<project-path>` and `<username>` with your actual values.

## GitHub Pages Settings

In the repository on GitHub, go to **Settings > Pages** and set:

- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `/ (root)`

## CI/CD (Optional)

A GitHub Actions workflow exists at `.github/workflows/deploy.yml` that automates the build and deploy on every push to `main`. For it to work, GitHub Pages source must be set to the `gh-pages` branch as described above.
