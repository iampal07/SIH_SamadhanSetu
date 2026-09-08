# Citizen Problem Portal — Step 1 (Pure Supabase)

SIH26043 · AI-Powered Societal Innovation Collaboration Portal · Team Outlaws

This is Step 1 of the platform: a citizen can select a language (**English / Hindi / खोठा Khortha**), sign in via Supabase (Email/Password or 1-Click Google OAuth), report a societal problem (with photos and GPS location), and track it in "My Reports".

The application connects directly to **Supabase**:
- **Database**: Directly reads and writes to the live `challenges` and `challenge_media` tables via `@supabase/supabase-js`. No local PostgreSQL installation, no Docker, and no Prisma setup required.
- **Storage**: Uploads evidence photos directly to your Supabase Storage bucket `attachments` and stores public CDN URLs.
- **Auth**: Fully integrated Supabase Auth (Email + Password, Google 1-Click OAuth). Citizens **must authenticate** before submitting a report; authenticated user ID is linked to all challenge submissions.
- **Languages**: Full tri-lingual i18n support including **Khortha (खोठा)** for Jharkhand citizens, **Hindi (हिन्दी)**, and **English**.

---

## Environment Variables

The project comes pre-configured with credentials in `.env`:

```env
# Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL="https://jsbyehfzerpmjqpiwgou.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_4ap9RTIESkv-zpYDKuNBaA_qQZzLJMn"

# Server-side compatibility
SUPABASE_URL="https://jsbyehfzerpmjqpiwgou.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_4ap9RTIESkv-zpYDKuNBaA_qQZzLJMn"

# Storage toggle
USE_SUPABASE_STORAGE="true"
```

---

## Google OAuth Setup in Supabase Dashboard

To enable 1-Click Google Sign-In:
1. In your **Google Cloud Console**, create OAuth 2.0 Credentials (Web application).
   - Authorized Redirect URI: `https://jsbyehfzerpmjqpiwgou.supabase.co/auth/v1/callback`
2. In your **Supabase Dashboard** (`https://supabase.com/dashboard/project/jsbyehfzerpmjqpiwgou`):
   - Go to **Authentication** → **Providers** → **Google**.
   - Toggle **Enable Google provider**.
   - Paste your Google `Client ID` and `Client Secret`.
   - Under **Authentication** → **URL Configuration**, ensure **Redirect URLs** includes:
     - `http://localhost:3000/auth/callback`
     - Production deployment URLs (e.g. Vercel domain).
3. Save! Google OAuth will now authenticate users seamlessly and redirect to `/auth/callback`.

---

## Android Studio & PWA Setup

To test the web app on Android devices / emulators or wrap it in a native container:

### Test in Android Emulator
1. Open Android Studio → **Device Manager** → Create Virtual Device (Pixel with API 33/34).
2. Start the emulator.
3. Run `npm run dev` on your computer (hosted on port 3000).
4. Inside the Android Emulator Chrome browser, navigate to `http://10.0.2.2:3000` (`10.0.2.2` maps directly to host `localhost`).
5. Test responsive layout, camera upload permission, and GPS geolocation capture.

### Optional Native Wrapper (Capacitor)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init samadhansetu com.outlaws.samadhansetu --web-dir=out
npm run build
npx cap add android
npx cap open android
```
Run the app target on an emulator or physical device directly from Android Studio.

### Required one-time Supabase config for native Google sign-in

Fixed in this update: previously, tapping "Continue with Google" inside the
packaged Android app opened the OAuth flow in the system browser and, because
`samadhansetu://auth-callback` wasn't a registered redirect target, Supabase
fell back to the project's Site URL — landing the citizen on the public
website instead of back in the app. The app now requests
`redirectTo: samadhansetu://auth-callback`, opens it via `@capacitor/browser`,
and `AndroidManifest.xml` registers that scheme so Android hands control back
to the app, where `AuthProvider` finishes the sign-in and routes the citizen
to Home/Report — never to the website.

For this to work, a Supabase project admin must add the redirect URL once, in
the **same Supabase project the website uses**:

Supabase Dashboard → Authentication → URL Configuration → Redirect URLs → add
`samadhansetu://auth-callback`

Email/Password sign-in does not need this — it already stays fully in-app.
