// Shared GUI test helpers

// Block requests to anything but the local dev server. External resources
// (CDN, analytics) would slow down or hang the page's load event and make
// tests depend on third-party availability.
export async function blockExternal(page) {
    await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, route => route.abort());
}
