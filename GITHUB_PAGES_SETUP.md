# GitHub Pages Setup Guide

Follow these steps to enable GitHub Pages for your repository:

## Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/Nerdware-Developers/P-O-S
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions** (NOT "Deploy from a branch")
5. Click **Save**

## Step 2: Trigger the Workflow

The GitHub Actions workflow should run automatically when you push to `main`. If it hasn't run yet:

1. Go to the **Actions** tab in your repository
2. You should see "Deploy to GitHub Pages" workflow
3. Click on it and then click **Run workflow** → **Run workflow**

## Step 3: Wait for Deployment

1. Go to the **Actions** tab
2. Click on the latest workflow run
3. Wait for both jobs to complete:
   - ✅ **build** (builds your app)
   - ✅ **deploy** (deploys to GitHub Pages)

## Step 4: Access Your Site

Once deployment is complete, your site will be available at:
**https://nerdware-developers.github.io/P-O-S/**

## Troubleshooting

### If the workflow fails:

1. Check the **Actions** tab for error messages
2. Common issues:
   - Missing dependencies (should be handled automatically)
   - Build errors (check the build logs)
   - Permission issues (make sure Pages permissions are set)

### If Pages still shows "There isn't a GitHub Pages site here":

1. Make sure you selected **GitHub Actions** as the source (NOT "Deploy from a branch")
2. Wait a few minutes after the workflow completes
3. Refresh the Pages settings page
4. Check that the workflow completed successfully in the Actions tab

### Manual Trigger

If the workflow didn't run automatically:
1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button (top right)
4. Select branch: **main**
5. Click **Run workflow**

## Important Notes

- The first deployment may take 5-10 minutes
- After enabling GitHub Actions as the source, you need to wait for the workflow to complete
- Your site URL will be: `https://nerdware-developers.github.io/P-O-S/`
- The site will automatically update whenever you push to the `main` branch


