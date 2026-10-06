# Shopify admin setup — Doverow

Use this checklist while the store is being created. The theme expects **collections**, **products with prices**, and **navigation**. Photos are required before a real launch.

## 1. Create the store

1. Create a Shopify store (trial or Basic+).
2. Set store name to **Doverow**.
3. Currency: GBP (or your selling currency).
4. Connect custom domain `doverow.uk` when DNS is ready (Settings → Domains).
5. While building, leave the **storefront password** on (Online Store → Preferences). This is Shopify’s preview lock — not the old client-side gate.

## 2. Install the theme

From the theme repo root:

```bash
shopify theme push --store your-store.myshopify.com
```

Or: Online Store → Themes → Add theme → Upload zip of this repo (exclude `archive/` if zipping by hand).

Preview with:

```bash
shopify theme dev --store your-store.myshopify.com
```

## 3. Create collections

Create a **manual collection** for each category (Products → Collections):

| Collection title | Suggested handle | Notes |
|------------------|------------------|-------|
| Uppers | `uppers` | Tops / knitwear |
| Lowers | `lowers` | Trousers |
| Middle | `middle` | Mid layer / under |
| Halo | `halo` | Headwear |
| Steppers | `steppers` | Socks |
| Anys | `anys` | Objects / accessories |
| Sides | `sides` | Bags |

Optional: one automated collection **All** (Shopify creates this by default).

On the home page featured collection block, pick **Uppers** (or whichever drop you want first).

## 4. Seed products (from previous catalog)

Create each product under Products → Add product.  
Assign it to the matching collection.  
Use option name **Colour** (or **Style**) for variants.  
Set a **price** and at least one image before launch.

### Uppers

| Product | Variants (Colour) |
|---------|-------------------|
| Cowy Top | Multicolour |
| Malawi Vest | Multi colour |
| Dove Shirt | White; Okra black & grey; Okra navy & black |
| Only You Top | Multicolour |
| Forever Sweater | Multicolour |
| Wool Sweater Dove Hand Stitched Arm | Purple; Deep blue |
| Shy Tee | Multiple colours *(split into real colourways when known)* |
| Shy Shirt | Multiple colours |
| Shy Hoodie | Multiple colours |

### Lowers

| Product | Variants | Description |
|---------|----------|-------------|
| Trim Trouser | Cream; Deep navy & red | Back heel stitch faded. Red trimmings. Pocket flap detailing. Deep pockets done well. Slightly straight with loose sections. Upside down with cinder flap. |

### Middle

| Product | Variants |
|---------|----------|
| To Be Held | Braided blue leather |
| Underalls | Pink & seamed gray |

### Halo

| Product | Variants |
|---------|----------|
| Leather Skully | Black leather; Pink leather |
| Global Cap | Black leather; Multicolour |

### Steppers

| Product | Variants |
|---------|----------|
| Dove Socks | Black & turquoise blue |
| Missed Connecting Socks | Pink, white & green |

### Anys

| Product | Variants |
|---------|----------|
| Trumpet | Green |
| Drum | Blue |
| Triangle | Silver & pink |
| Instrument Case | Cigarette or weed holder *(or rename variant to a sellable style label)* |

### Sides

| Product | Variants |
|---------|----------|
| Less Go Bag | Black & turquoise |

**Total:** ~21 products across 7 collections.

## 5. Pages

Online Store → Pages:

| Title | Theme template | Content |
|-------|----------------|---------|
| About | `page.about` | Brand line (prefilled in theme) |
| Contact | `page.contact` | IG + email (prefilled in section settings) |

## 6. Navigation

Online Store → Navigation → **Main menu**:

- Home → `/`
- Shop → `/collections` (collections list) or `/collections/all`
- About → `/pages/about`
- Contact → `/pages/contact`

**Footer** menu (optional):

- Shop, About, Contact, and any policy pages

## 7. Payments & shipping

1. Settings → Payments → enable Shopify Payments (or alternatives).
2. Settings → Shipping and delivery → add zones/rates (UK + international as needed).
3. Settings → Taxes → configure for your regions.
4. Add refund / shipping / privacy policy pages (Settings → Policies).

## 8. Theme customizer pass

Online Store → Themes → Customize:

1. Upload logo / confirm bird mark asset.
2. Hero: upload a compressed campaign image (or keep theme `hero-splash.jpg`).
3. Featured collection → choose a live collection.
4. Header menu → Main menu.
5. Footer newsletter → leave on (uses Shopify customers / marketing).

## 9. Go-live

1. Products have prices, inventory, and photos.
2. Test: Home → collection → product → Add to cart → Checkout.
3. Remove storefront password.
4. Publish the theme.
5. Point `doverow.uk` DNS at Shopify.

## Removed (do not recreate)

- Client-side password gate
- Supabase newsletter (`newsletter_subscribers`)
- Fake in-memory cart
