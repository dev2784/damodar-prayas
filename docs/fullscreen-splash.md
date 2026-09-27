# Full-screen launch artwork

Uses the approved pointed-cap Guruji maroon/gold design, converted without cropping to a 305 KB bundled WebP. All original artwork, Hindi title and tagline are retained. The foreground uses contain; a dim, blurred cover of the same image fills any extra area on different aspect ratios. No network download is needed.

Android's native splash only supports an icon-sized image. Its old oversized/cropped logo is replaced by a transparent native drawable on matching maroon, followed by the React full-screen artwork. Native hiding waits for layout and image display; a six-second fail-open prevents a broken image/storage task trapping startup. The artwork stays briefly (900 ms) before fading after auth/language hydration. It covers the tab bar and hides the status bar while visible. The underlying route remains mounted, including onboarding/deep-link routing. Web skips the native launch overlay.

A new native binary is required. For a local checkout with an existing generated Android directory, synchronize configuration before Gradle:

```
cd apps/mobile
pnpm exec expo prebuild --platform android
```

Then build the release using the usual Gradle/EAS workflow. Do not use `--clean` on a native folder containing custom modifications unless those have been preserved. Expo Go/development launches do not reproduce release splash behavior reliably.

Verified: mobile TypeScript, targeted ESLint and web export; assets bundled locally. Still requires a release-device cold-start check: 16:9 and tall phone screens, first-install onboarding, returning user, deep link, dark/light system mode. Confirm the full Hindi title, Guruji and pot remain visible, and startup proceeds without blank flashes. Native Android/iOS builds were not executed in this environment.
