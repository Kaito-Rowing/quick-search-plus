# Release guide

## Verify the candidate

1. Run `npm ci`, `npx playwright install chromium`, `npm run check` and `npm test`.
2. Complete the [manual Chrome checks](../CONTRIBUTING.md). Automated Chromium tests do not replace real-site, browser-zoom and accessibility review.
3. Confirm privacy disclosures match the code: page access, `storage.sync` for four preferences, `clipboardWrite`, explicit Google/URL/clipboard actions, no clipboard reading or tracking.
4. Align versions in manifest, package and lockfile. Update versioned ZIP names in both READMEs. Date the changelog when releasing.
5. Run `npm run package`. Extract the ZIP to a clean folder, load it in Chrome and verify settings, all four features, icons and locales.
6. Review the actual screenshots, copy and privacy policies before publication.

## GitHub release

After maintainer approval, merge the reviewed PR. Tag the verified main commit `v1.2.1`, create a GitHub release and attach `dist/quick-search-plus-1.2.1.zip` (optionally with a SHA-256 checksum). Do not overwrite existing tags. Update both READMEs to download the verified release asset. CI uploads workflow artifacts only; it does not merge or publish releases.

## Chrome Web Store

- Upload the runtime ZIP, not the source repository.
- Review [STORE_LISTING.md](STORE_LISTING.md); use `docs/store-screenshot.png` (1280 × 800) and supply any additional artwork required by the current dashboard.
- Publish a stable public privacy-policy URL and verify it is accessible before submitting.
- Explain the single purpose as contextual actions on text explicitly selected by the user.
- Explain HTTP/HTTPS content-script access, preference sync via `storage`, and explicit clipboard writes via `clipboardWrite`.
- Disclose local selection processing, user-directed Google search/URL navigation, clipboard writes and browser-account preference sync. Do not claim that the extension never handles data or never communicates.
- Complete the current dashboard declarations and review current store policies. No store review or approval is implied by the package.

After store approval, add the verified store URL to both READMEs and retain local-install instructions.

References: [manifest icons](https://developer.chrome.com/docs/extensions/reference/manifest/icons), [storage API](https://developer.chrome.com/docs/extensions/reference/api/storage), [user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
