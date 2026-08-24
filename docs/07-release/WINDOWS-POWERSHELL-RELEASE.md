# Windows PowerShell — Firebase Release Quick Commands

Use these commands from the repository root after pulling the latest `feature/t0-repository-foundation` branch.

## Install and validate

```powershell
npm ci
npm run release:preflight
npm run quality
npm run build:production
```

## Authenticate Firebase CLI

```powershell
npx --yes firebase-tools login
npx --yes firebase-tools projects:list
```

Confirm that project `nocreportv2` is listed before any production deploy.

## Deploy Firestore rules and indexes only

```powershell
npm run firebase:deploy:firestore
```

## Deploy Hosting only

```powershell
npm run firebase:deploy:hosting
```

## Full MVP release

```powershell
npm run firebase:deploy:release
```

The full release command runs the T8 preflight, builds with the committed public Firebase Web App configuration and emulator mode disabled, then deploys Firestore Security Rules, Firestore indexes, and Firebase Hosting to project `nocreportv2`.

Do not commit Firebase CLI credentials, service-account JSON, private keys, refresh tokens, or generated local `.env` files.

After deployment, follow the production smoke checklist in `docs/07-release/FIREBASE-DEPLOYMENT.md` before marking T8 complete.
