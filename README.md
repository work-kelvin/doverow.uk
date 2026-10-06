# Doverow — Shopify theme

Custom Online Store 2.0 theme for Doverow: simple black-and-white brand storefront with native cart and checkout.

## Requirements

- A Shopify store (development or paid)
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) 3.x
- Node.js 18+ (for the CLI)

## Local development

```bash
# From this repo root (theme root)
shopify theme dev --store your-store.myshopify.com
```

Then open the preview URL the CLI prints. Changes sync live to a development theme.

### Push / publish

```bash
shopify theme push
shopify theme publish   # when ready to go live
```

## Theme structure

```
layout/          # theme.liquid
templates/       # JSON templates (home, product, collection, cart, pages)
sections/        # hero, grids, product, cart drawer, header/footer
snippets/        # product-card, icons
assets/          # base.css, theme.js, bird mark, hero image
config/          # theme settings
locales/         # en.default.json
docs/            # admin setup + product seed checklist
archive/         # previous static site (not uploaded)
```

## Store setup

See [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md) for collections, product seed from the old catalog, navigation, and payments.

## What changed from the static site

- Password gate and Supabase newsletter removed
- Mac System 6 UI replaced with a simpler brand storefront
- Cart and checkout use Shopify
- Newsletter uses Shopify customer form in the footer
