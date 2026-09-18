# Damodar Prayas mobile

Expo SDK 57 / React Native app in the pnpm workspace.

Run these commands from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm --filter mobile start
pnpm --filter mobile typecheck
pnpm --filter mobile lint
pnpm --filter mobile test
pnpm --filter mobile format:check
```

Use `pnpm --filter mobile format` to format the source. The tests use Node's built-in test runner with TypeScript stripping; use Node 22.6 or newer.

Routes live in `src/app`, API endpoints in `src/services`, shared logic in `src/lib`, and native styles in `src/styles/*.styles.ts`. Keep style modules outside `src/app` so Expo Router does not treat them as screens. React Native uses `StyleSheet` modules rather than browser CSS; data-dependent style values remain beside their components.

The bottom tabs add the device's bottom safe-area inset to their height and padding. Verify both Android three-button and gesture navigation on a device when changing this layout.

Native authentication uses SecureStore. Web authentication uses sessionStorage and lasts for the current browser tab. Expo starter screens and unused starter components have been removed.

For an Android preview build, run from `apps/mobile`:

```powershell
eas build --platform android --profile preview
```

An Android JavaScript export and static checks do not replace device testing of navigation, keyboard behavior, authentication, uploads, and backend workflows.
