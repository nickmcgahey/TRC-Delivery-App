# Private preview on Vercel Hobby

The sample shop can be opened on a phone from an HTTPS link. Vercel Hobby has no deployment password, so this app asks for one itself. The passcode page sets an httpOnly cookie. That works in iPhone Safari and in a home-screen icon. HTTP Basic Auth does not: the home-screen app often drops it or asks again on every launch.

Do not commit the password. Do not put it in a `NEXT_PUBLIC_` variable.

## Import

1. In Vercel, import this GitHub repo. Leave the production branch as the one you intend to publish. This prototype lives on the delivery-membership branch until it is merged.
2. Set **Root Directory** to `apps/customer-web`. The repo root has no Next.js app. If this stays at the root, the build fails.
3. Framework preset: **Next.js**. Leave the install and build commands at the defaults (`npm install`, `npm run build`).
4. Before the first deploy, add an environment variable:
   - Name: `PREVIEW_PASSWORD`
   - Value: a long random password, chosen in the Vercel dashboard
   - Environments: Production and Preview
5. Deploy. Vercel applies environment variables when a deployment is created, so after you change the password, redeploy.

If `PREVIEW_PASSWORD` is missing on a production deploy, every URL returns **503** and the shop does not load.

## On an iPhone

1. Open the Vercel HTTPS link in Safari and enter the password.
2. To keep an icon on the home screen: Share → Add to Home Screen, open that icon, and enter the password there once. iOS keeps the home-screen app’s cookies separate from Safari, so signing in only in Safari does not unlock the icon.
3. The cookie lasts 30 days, is httpOnly, SameSite=Lax, and is marked Secure on HTTPS.

The shop is sample data. It is also marked `noindex`. The link is still unlisted only as long as the password stays private.
