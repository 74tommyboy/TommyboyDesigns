const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!
const endpoint = `https://${domain}/api/2024-01/graphql.json`

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Shopify API error: ${res.status} — ${body}`)
  }
  const { data, errors } = await res.json()
  if (errors) throw new Error(errors[0].message)
  return data
}

// ─── Types ───────────────────────────────────────────────
export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  tags: string[]
  updatedAt: string
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
    maxVariantPrice: { amount: string; currencyCode: string }
  }
  compareAtPriceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  images: { edges: Array<{ node: { url: string; altText: string | null } }> }
  variants: { edges: Array<{ node: ShopifyVariant }> }
  collections: { edges: Array<{ node: { handle: string; title: string } }> }
}

export interface ShopifyVariant {
  id: string
  title: string
  availableForSale: boolean
  price: { amount: string; currencyCode: string }
  compareAtPrice: { amount: string; currencyCode: string } | null
  selectedOptions: Array<{ name: string; value: string }>
  image: { url: string; altText: string | null } | null
}

export interface ShopifyCollection {
  id: string
  handle: string
  title: string
  description: string
  updatedAt: string
  image: { url: string; altText: string | null } | null
  products: { edges: Array<{ node: ShopifyProduct }> }
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { totalAmount: { amount: string; currencyCode: string } }
  lines: {
    edges: Array<{
      node: {
        id: string
        quantity: number
        attributes: Array<{ key: string; value: string }>
        merchandise: {
          id: string
          title: string
          product: { title: string; handle: string }
          image: { url: string; altText: string | null } | null
          price: { amount: string; currencyCode: string }
        }
      }
    }>
  }
}

// ─── Product Fragments ───────────────────────────────────
const PRODUCT_FRAGMENT = `
  id
  handle
  title
  description
  descriptionHtml
  tags
  updatedAt
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  compareAtPriceRange {
    minVariantPrice { amount currencyCode }
  }
  images(first: 10) {
    edges { node { url altText } }
  }
  variants(first: 250) {
    edges {
      node {
        id title availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        selectedOptions { name value }
        image { url altText }
      }
    }
  }
  collections(first: 3) {
    edges { node { handle title } }
  }
`

// ─── Queries ─────────────────────────────────────────────
export async function getProducts(first = 20): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{ products: { edges: Array<{ node: ShopifyProduct }> } }>(`
    query GetProducts($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) {
        edges { node { ${PRODUCT_FRAGMENT} } }
      }
    }
  `, { first })
  return data.products.edges.map(e => e.node)
}

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ product: ShopifyProduct | null }>(`
    query GetProduct($handle: String!) {
      product(handle: $handle) { ${PRODUCT_FRAGMENT} }
    }
  `, { handle })
  return data.product
}

export async function getProductById(numericId: string): Promise<ShopifyProduct | null> {
  const id = `gid://shopify/Product/${numericId}`
  const data = await shopifyFetch<{ node: ShopifyProduct | null }>(`
    query GetProductById($id: ID!) {
      node(id: $id) {
        ... on Product { ${PRODUCT_FRAGMENT} }
      }
    }
  `, { id })
  return data.node
}

export async function getCollections(): Promise<ShopifyCollection[]> {
  const data = await shopifyFetch<{ collections: { edges: Array<{ node: ShopifyCollection }> } }>(`
    query GetCollections {
      collections(first: 20) {
        edges {
          node {
            id handle title description updatedAt
            image { url altText }
            products(first: 4) {
              edges { node { ${PRODUCT_FRAGMENT} } }
            }
          }
        }
      }
    }
  `)
  return data.collections.edges.map(e => e.node)
}

export async function getCollection(handle: string): Promise<ShopifyCollection | null> {
  const data = await shopifyFetch<{ collection: ShopifyCollection | null }>(`
    query GetCollection($handle: String!) {
      collection(handle: $handle) {
        id handle title description updatedAt
        image { url altText }
        products(first: 50) {
          edges { node { ${PRODUCT_FRAGMENT} } }
        }
      }
    }
  `, { handle })
  return data.collection
}

// ─── Cart Mutations ───────────────────────────────────────
export async function createCart(): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartCreate: { cart: ShopifyCart } }>(`
    mutation CartCreate {
      cartCreate {
        cart {
          id checkoutUrl totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 20) {
            edges {
              node {
                id quantity
                attributes { key value }
                merchandise {
                  ... on ProductVariant {
                    id title
                    product { title handle }
                    image { url altText }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `)
  return data.cartCreate.cart
}

export async function addToCart(cartId: string, variantId: string, quantity: number, attributes: Array<{ key: string; value: string }> = []): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: ShopifyCart } }>(`
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id checkoutUrl totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 20) {
            edges {
              node {
                id quantity
                attributes { key value }
                merchandise {
                  ... on ProductVariant {
                    id title
                    product { title handle }
                    image { url altText }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity, attributes }],
  })
  return data.cartLinesAdd.cart
}

export async function addMultipleToCart(
  cartId: string,
  lines: Array<{ variantId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: ShopifyCart } }>(`
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id checkoutUrl totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 20) {
            edges {
              node {
                id quantity
                attributes { key value }
                merchandise {
                  ... on ProductVariant {
                    id title
                    product { title handle }
                    image { url altText }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `, {
    cartId,
    lines: lines.map(l => ({ merchandiseId: l.variantId, quantity: l.quantity, attributes: l.attributes ?? [] })),
  })
  return data.cartLinesAdd.cart
}

export async function removeFromCart(cartId: string, lineId: string): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesRemove: { cart: ShopifyCart } }>(`
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id checkoutUrl totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 20) {
            edges {
              node {
                id quantity
                attributes { key value }
                merchandise {
                  ... on ProductVariant {
                    id title
                    product { title handle }
                    image { url altText }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `, { cartId, lineIds: [lineId] })
  return data.cartLinesRemove.cart
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesUpdate: { cart: ShopifyCart } }>(`
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id checkoutUrl totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 20) {
            edges {
              node {
                id quantity
                attributes { key value }
                merchandise {
                  ... on ProductVariant {
                    id title
                    product { title handle }
                    image { url altText }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `, { cartId, lines: [{ id: lineId, quantity }] })
  return data.cartLinesUpdate.cart
}

// ─── Helpers ──────────────────────────────────────────────
export function formatMoney(amount: string, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}

export function isCustomProduct(product: ShopifyProduct): boolean {
  return product.tags.includes('custom') || product.title.toLowerCase().includes('custom')
}
