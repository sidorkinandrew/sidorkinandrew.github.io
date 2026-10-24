# Hyperlink widget geo visibility: test cases

Test page and cases for a defect where the Hyperlink (and Button) embed widget ignores
geo-targeted templates for visitors who have not saved a consent choice, plus the interim
customer workaround.

- **Test page:** https://sidorkinandrew.github.io/widget-geo-test/ (debug panel + scenario links)
- **Test domain script:** `https://app.secureprivacy.ai/script/65401a848143b1304ce74af4.js`

## Summary of the defect

`secure-privacy-v2.js` takes one of two paths on page load:

| Visitor state | Endpoint used | Widget handling |
|---|---|---|
| No saved consent | `GET /api/banner/v2/template/{domain}` | Injects `widgetText` / `widgetType` from the response with `O(widgetType, widgetText)`. These fields do **not** reflect the geo-matched template: they are the same for every location, and are present even when the matched template has the widget disabled. |
| Consent saved | `GET /api/banner/v2/widget/{domain}` | Geo-aware: `204` when the matched template has the widget disabled, otherwise that template's widget type and text. |

Results:

1. **US visitors** (template with banner and widget disabled) never see a banner, never save a
   choice, and always get the default `Privacy` link.
2. **International visitors** see `Privacy` instead of their template's label until they save a choice.
3. After saving, `O()` does not update an existing link, so the wrong label stays until the next page load.

Only the `Link` and `Embedded` widget types are affected. `Floating` is rendered through the
widget endpoint and is geo-aware.

## Files

| File | Purpose |
|---|---|
| `index.html` | Test page (GoVegan template). Loads `harness.js` before the CMP script, then the CMP script exactly as a site embeds it. |
| `harness.js` | Seeds or clears CMP storage, optionally reshapes API responses (mock), installs the snippet under test, records events/API calls/errors, exposes `window.__geoTest.snapshot()`. |
| `panel.js` | Debug panel: live state, event log, config check, reset. |
| `customer-snippet-v3.html` | **Recommended customer workaround**, verbatim. |
| `customer-snippet.html` | Earlier class-based variant (rejected, see REJ-01). |

## Page parameters

| Parameter | Values | Effect |
|---|---|---|
| `mode` | `baseline` (default), `customer`, `v1`, `v2` | `baseline` = CMP embed span `#sp-tb-embed-widget` only. `customer` = customer link + snippet file. `v1`/`v2` = earlier workaround drafts. |
| `snippet` | file name | Snippet file for `mode=customer` (default `customer-snippet.html`). |
| `geo` | `real` (default), `US-NY`, `PL`, `none`, any location code | `real` clears storage so the CMP geolocates normally. Any other value seeds `localStorage.sp_dynamic` with that location (the CMP then skips `/api/banner/dynamic`). `none` seeds a cached lookup with no location. |
| `mock` | `1` | Reshapes API responses **in this page only** to the payload shape reported by the customer (template: `widgetText "Privacy"`, `widgetType "Link"`; US template: no banner, Implicit; US widget: `204`; other widget: Link, `"Your Privacy Choices "`). US template/preference-center requests are sent as `PL` so the test domain returns a template to reshape. The CMP script itself is unmodified. |
| `mount` | `now` (default), `late`, `rerender` | `late` renders the footer link 3 s after load (SPA). `rerender` replaces it at 4 s (route change). |
| `listen` | `early` (default), `late` | `late` loads the snippet 6 s after load, after `sp_init` (tag manager). |
| `keep` | `1` | Keep stored consent and location (returning visitor). Ignores `geo`. |
| `keepspan` | `1` | `mode=customer`: also render the old `#sp-tb-embed-widget` span. |
| `htmlreset` | `1` | At 5 s, overwrite `document.documentElement.className` (theme switchers, some frameworks). |

`window.__geoTest.snapshot()` returns `location`, `spInitFired`, `consentSaved`, `bannerVisible`,
`linkInDom`, `linkVisible`, `linkText`, `spanText`, `spanVisible`, `htmlClass`, `prefCenterOpen`.

## Test domain configuration

The cases need a GDPR template that matches `PL` (banner on) and a US template (banner off).
Cases marked **mock** reproduce the customer's exact payloads regardless of the domain's widget
settings. To reproduce **without** the mock, configure the domain like the customer:

1. Design > Widget: type **Hyperlink**, "Show on pages" empty.
2. US template: cookie banner **disabled**, widget **disabled**.
3. GDPR / international template: widget **enabled** with a distinctive label.
4. Purge the API cache (see QA notes), then run BUG-01 and BUG-02 without `&mock=1`.

## Test cases

Expected values describe the **correct** behavior. Cases marked "known failing" fail until the
product fix ships and should pass after it.

Observed on 2026-10-24, Chrome (built-in browser), visitor in Poland; US cases use the seeded location.

| ID | Scenario | URL (`index.html?...`) | Expected | Observed |
|---|---|---|---|---|
| **Bug reproduction** (CMP embed span, customer-shaped API responses) | | | | |
| BUG-01 | International visitor, no saved choice | [`mode=baseline&geo=PL&mock=1`](index.html?mode=baseline&geo=PL&mock=1) | Link visible, text `Your Privacy Choices` | FAIL (known): `Privacy` |
| BUG-02 | US visitor (US widget disabled), no saved choice | [`mode=baseline&geo=US-NY&mock=1`](index.html?mode=baseline&geo=US-NY&mock=1) | No link | FAIL (known): `Privacy` visible, no banner |
| BUG-03 | International visitor accepts (`sp.saveAllConsents('acceptAll','cb')`); same page | [`mode=baseline&geo=PL&mock=1`](index.html?mode=baseline&geo=PL&mock=1) | Text becomes `Your Privacy Choices` | FAIL (known): stays `Privacy`; widget endpoint returned the correct label |
| BUG-04 | Same visitor, next page load (run right after BUG-03) | [`mode=baseline&geo=PL&mock=1&keep=1`](index.html?mode=baseline&geo=PL&mock=1&keep=1) | Link visible, `Your Privacy Choices` | PASS |
| **Workaround v3** (verbatim `customer-snippet-v3.html`, customer link markup) | | | | |
| WA-01 | International, real domain config | [`mode=customer&snippet=customer-snippet-v3.html&geo=PL`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=PL) | Link visible | PASS |
| WA-02 | US, real domain config | [`mode=customer&snippet=customer-snippet-v3.html&geo=US-NY`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=US-NY) | No link | PASS |
| WA-03 | International, customer-shaped responses | [`mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1) | Link visible, `Your Privacy Choices` | PASS |
| WA-04 | US, customer-shaped responses | [`mode=customer&snippet=customer-snippet-v3.html&geo=US-NY&mock=1`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=US-NY&mock=1) | No link | PASS |
| WA-05 | Footer mounts 3 s after load (SPA) | [`mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&mount=late`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&mount=late) | Link visible | PASS |
| WA-06 | Footer re-rendered at 4 s (route change) | [`mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&mount=rerender`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&mount=rerender) | Link visible | PASS |
| WA-07 | Snippet loaded 6 s after init (tag manager), international | [`mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&listen=late`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&listen=late) | Link visible | PASS |
| WA-08 | Snippet loaded 6 s after init (tag manager), US | [`mode=customer&snippet=customer-snippet-v3.html&geo=US-NY&mock=1&listen=late`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=US-NY&mock=1&listen=late) | No link | PASS |
| WA-09 | App rewrites `<html class>` at 5 s | [`mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&htmlreset=1`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=PL&mock=1&htmlreset=1) | Link visible | PASS |
| WA-10 | Location unknown (cached lookup without location) | [`mode=customer&snippet=customer-snippet-v3.html&geo=none&mock=1`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=none&mock=1) | Link visible (fails open) | PASS (link shown; see defect 6 for CMP errors) |
| WA-11 | Mouse click and keyboard Enter on the link | [`mode=customer&snippet=customer-snippet-v3.html&geo=PL`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=PL) | Preference center opens, no `#` in URL | PASS (real mouse click and Enter key) |
| WA-12 | Old embed span left in place, US | [`mode=customer&snippet=customer-snippet-v3.html&geo=US-NY&mock=1&keepspan=1`](index.html?mode=customer&snippet=customer-snippet-v3.html&geo=US-NY&mock=1&keepspan=1) | No link of any kind | FAIL (known): old span shows `Privacy`; customers must remove it |
| **Rejected variants** (kept as evidence) | | | | |
| REJ-01 | Class-based snippet (`customer-snippet.html`), app rewrites `<html class>` | [`mode=customer&geo=PL&mock=1&htmlreset=1`](index.html?mode=customer&geo=PL&mock=1&htmlreset=1) | Link visible | FAIL: link disappears |
| REJ-02 | First draft (v1), footer mounts late | [`mode=v1&geo=PL&mock=1&mount=late`](index.html?mode=v1&geo=PL&mock=1&mount=late) | Link visible | FAIL: no link for international |
| REJ-03 | First draft (v1), footer re-rendered | [`mode=v1&geo=PL&mock=1&mount=rerender`](index.html?mode=v1&geo=PL&mock=1&mount=rerender) | Link visible | FAIL: link lost |
| REJ-04 | First draft (v1), loaded after init | [`mode=v1&geo=PL&mock=1&listen=late`](index.html?mode=v1&geo=PL&mock=1&listen=late) | Link visible | FAIL: no link for international |

### Manual checks

| ID | Steps | Expected |
|---|---|---|
| MAN-01 | `?mode=customer&snippet=customer-snippet-v3.html&geo=PL`, close the banner, Tab to "Your Privacy Choices", press Enter. | Preference center opens; URL gets no `#`. |
| MAN-02 | Same page, click the link with the mouse. | Preference center opens; URL gets no `#`. |
| MAN-03 | Real US location (VPN, fresh private window), customer's real site with the v3 snippet. | No link, no banner. |
| MAN-04 | Real international location, fresh private window. | Banner, and "Your Privacy Choices" link. |

## Recommended customer workaround (v3)

Replace the embed span with the site's own link and add the snippet (preferably in the site's
own CSS/JS bundle so a Content Security Policy does not block it):

```html
<a href="#" class="privacy-choices-link">Your Privacy Choices</a>
```

See `customer-snippet-v3.html` for the exact snippet. Constraints:

- The old `#sp-tb-embed-widget` span **must be removed**, or US visitors still get `Privacy` (WA-12).
- Uses `sp.location`, which is undocumented. Hides for every `US` / `US-*` location; update the rule if the US template's regions change.
- Unknown location shows the link (WA-10). The link only opens the preference center.
- Label is fixed text; sites with several languages should use their own translations.
- Uses a `data-privacy-choices` attribute rather than a class because apps that rewrite `<html class>` remove a class (REJ-01).

## Defects for engineering

| # | Area | Defect | Repro |
|---|---|---|---|
| 1 | API / script | `template` response `widgetText`/`widgetType` ignore the geo-matched template; the script injects them without checking widget enablement or location. | BUG-01, BUG-02 |
| 2 | Script | `O()` only creates `#sp-tb-embed-widget-link`/`-btn` when missing and never updates the text, so the label is stale after consent is saved on the same page. | BUG-03 |
| 3 | API cache | The public banner API is cached by URL only. The response format depends on the request `Content-Type`, so a plain GET (browser tab, `curl`) caches an HTML "snapshot" page that the script then receives (JSON parse error: no banner, no unblock, no `sp_init`). Error responses (`400 No associated legal templates found`) are cached too, so dashboard changes do not apply until the cache expires or is purged. | Open `/api/banner/v2/template/{domain}?Language=en&Location=ZZ-TEST` in a tab, then request the same URL with `Content-Type: application/json`: HTML is returned. |
| 4 | Script | `sp_cookie_banner_click` always reports `"reject"`: in `saveAllConsents`, the event detail reads `a` before `a` is assigned. | Accept on the banner: `sp_cookie_banner_click "reject"`, then `sp_cookie_banner_save "accept"`. |
| 5 | Script | `sp.cookieBannerVisible()` returns `true` after the banner is closed (checks `style.display`, not `dialog.open`). | Accept, then call `sp.cookieBannerVisible()`. |
| 6 | Script | With no location in the cached lookup, requests are sent with `Location=undefined` (template) and `Location=` (preference center); the preference center path throws `Cannot read properties of undefined (reading 'ConsentType')`. | `?mode=customer&geo=none&mock=1`, check the event log. |

Suggested fixes: derive `widgetText`/`widgetType` in the template response from the geo-matched
template (omit when its widget is disabled), or have the script defer Link/Embedded rendering to
the widget endpoint; make `O()` update existing text and remove the element on `204`; include the
response format in the cache key (or serve JSON only, and request `?format=json` / send `Accept`
instead of `Content-Type` on GET, which also removes a CORS preflight per call); do not cache
error responses, and purge on configuration save.

## QA notes

- **Location is cached for 4 hours** in `localStorage.sp_dynamic`. Use a fresh private window per
  location, or this page's "Reset storage" button. The test page shares storage with every other
  page on `sidorkinandrew.github.io`; reset when done.
- **Never open the plain API URLs in a browser tab.** Add `&format=json` (a separate cache key).
  The debug panel's "Check config" button does this.
- **After changing domain settings, purge the API cache** or test with a location the script has
  not requested recently (for example `geo=US-TX`).
- BUG-03 saves one consent record on the test domain.
