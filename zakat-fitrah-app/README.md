# React + TypeScript + Vite

## Invitation Auth Flow (Production)

High-level flow used in this project:

1. Admin creates invitation via `invitation-manager` Edge Function (`createInvitation`)
2. User opens `/register?token=...` and app validates token (`validateInvitation`)
3. User submits registration and account is created (`registerUser`)
4. User confirms email via `/email-confirmation`
5. User logs in and app enforces `users.is_active` on session bootstrap

Core references:
- Migration deployment: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- Edge Function deployment: [EDGE_FUNCTION_DEPLOYMENT.md](EDGE_FUNCTION_DEPLOYMENT.md)
- Email templates setup: [EMAIL_TEMPLATE_SETUP.md](EMAIL_TEMPLATE_SETUP.md)
- Invitation-auth test plan: [TESTING_CHECKLIST_INVITATION_AUTH.md](TESTING_CHECKLIST_INVITATION_AUTH.md)

## Quick Security Regression (Task 10.13)

Run this command from the `zakat-fitrah-app` folder to verify last-admin protection:

```bash
python3 scripts/test_10_13_last_admin_protection.py
```

Pass criteria in output:
- `last_admin_deactivate_blocked: true`
- `status_last_admin_attempt: 400`
- response contains `Cannot deactivate or demote the last active admin` (code `P0001`)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
