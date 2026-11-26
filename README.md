# Rcoder Home (test)
 
Rcoder Agent bilingual interactive landing page. The demo uses four prepared examples; it never uploads prompts or calls an AI model.
 
Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The **Deploy Rcoder Home to GitHub Pages** workflow validates and publishes `docs/` on pushes to `main`. For the first deployment after selecting the source, use **Actions → Deploy Rcoder Home to GitHub Pages → Run workflow** on `main` if no run is active. The test pages use `noindex`; public access remains possible. No product code, GIF reference, or private recordings are included.

## Search and social sharing

Both test pages have localized titles, descriptions, canonical and alternate URLs, and Open Graph/X cards. The preview artwork lives in `docs/assets/share-zh.jpg` and `docs/assets/share-en.jpg`. The test pages remain publicly readable but intentionally marked `noindex`.

Before enabling search indexing on the final domain: confirm that both language routes and card images resolve over HTTPS, update canonical/hreflang/Open Graph/X image URLs and the sitemap together, then update the noindex check in the Pages workflow and the homepage validation script as part of the same release. Publish and reference the sitemap on the final origin, then verify both URLs in Search Console. Do not remove noindex from the test host.
