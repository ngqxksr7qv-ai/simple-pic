# 🚀 Deployment Guide (Netlify)

Yes, your Netlify account is perfect for this! Here is how to deploy your Inventory App.

## 1. Preparation (Already Done ✅)
I have added a `netlify.toml` file to your project. This tells Netlify how to build your app and handles the routing so that refreshing pages works correctly.

## 2. Deploying to Netlify

### Option A: Drag & Drop (Easiest)
1.  Run the build command locally:
    ```bash
    npm run build
    ```
2.  This will create a `dist` folder in your project directory.
3.  Log in to [Netlify](https://app.netlify.com).
4.  Go to the **"Sites"** tab.
5.  Drag and drop the `dist` folder onto the area that says "Drag and drop your site output folder here".

### Option B: Connect to Git (Recommended)
1.  Push your code to GitHub/GitLab/Bitbucket.
2.  Log in to Netlify and click **"Add new site"** -> **"Import from an existing project"**.
3.  Select your repository.
4.  Netlify will detect the settings automatically (thanks to `netlify.toml`).
5.  Click **"Deploy"**.

## 3. ⚠️ IMPORTANT: Environment Variables

Your app needs to know how to connect to Supabase. **It won't work until you do this step!**

1.  In your Netlify Dashboard, go to **"Site configuration"** > **"Environment variables"**.
2.  Click **"Add a variable"**.
3.  Add these two variables (copy them from your `.env.local` file):
    *   Key: `VITE_SUPABASE_URL`
        *   Value: `https://your-project-id.supabase.co`
    *   Key: `VITE_SUPABASE_ANON_KEY`
        *   Value: `your-long-anon-key-string`
4.  **Redeploy** your site (if you used Option B, go to "Deploys" -> "Trigger deploy").

## 4. Final Check
Open your new Netlify URL. You should be able to sign in and see your inventory!
