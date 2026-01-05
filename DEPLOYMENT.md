# How to Publish ZeroBudget App

This project uses [GitHub Pages](https://pages.github.com/) for easy and free hosting.

## Prerequisites

1.  A GitHub Account.
2.  A new empty repository created on GitHub (e.g., named `zero-budget-app`).

## Setup Steps

1.  **Initialize Git** (if not done):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

2.  **Connect to GitHub**:
    Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual details.
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```

3.  **Configure Base URL** (Important!):
    Open `vite.config.ts` and ensure the `base` property matches your repository name.
    
    If your repo is https://github.com/user/my-app, then:
    ```ts
    export default defineConfig({
      plugins: [react()],
      base: "/my-app/", 
    })
    ```
    *If you are using a custom domain or user page (user.github.io), you might not need this.*

4.  **Deploy**:
    Run the deployment script:
    ```bash
    npm run deploy
    ```

5.  **Verify**:
    Go to your GitHub Repository Settings -> Pages. ensure the source is set to `gh-pages` branch.
    Your site usually appears at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.
