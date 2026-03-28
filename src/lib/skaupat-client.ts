import { SkaupatProduct, DietaryLabel } from './types';

const STORE_ID = process.env.SKAUPAT_STORE_ID || '513971200';
const GRAPHQL_HASH =
  process.env.SKAUPAT_GRAPHQL_HASH ||
  '48756d592aa8fe6f1c9f560440bbdf8ce390ec3110fa34fc89b298c7d7a3bd4f';

interface SkaupatResponse {
  data?: {
    store?: {
      products?: {
        productListItems?: Array<{
          ean: string;
          name: string;
          slug: string;
          price: number;
          labels: string[];
          brandName: string;
        }>;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

async function queryProducts(
  queryString: string,
  limit = 5
): Promise<SkaupatProduct[]> {
  const res = await fetch('https://www.s-kaupat.fi/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'RemoteFilteredProducts',
      variables: {
        queryString,
        storeId: STORE_ID,
        limit,
        facets: [
          { key: 'brandName', order: 'asc' },
          { key: 'category' },
          { key: 'labels' },
        ],
        generatedSessionId: crypto.randomUUID(),
        fetchSponsoredContent: false,
        useRandomId: false,
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: GRAPHQL_HASH,
        },
      },
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`S-kaupat API error: ${res.status} ${res.statusText}`);
  }

  const data: SkaupatResponse = await res.json();

  if (data.errors) {
    throw new Error(`S-kaupat GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const items = data.data?.store?.products?.productListItems || [];

  return items.map((item) => ({
    ean: item.ean,
    name: item.name,
    slug: item.slug,
    price: item.price,
    labels: (item.labels || []) as DietaryLabel[],
    brandName: item.brandName,
  }));
}

function matchesDietary(product: SkaupatProduct, dietaryLabel?: DietaryLabel): boolean {
  if (!dietaryLabel) return true;
  return product.labels.includes(dietaryLabel);
}

function generateFallbackQueries(originalQuery: string, dietaryLabel?: DietaryLabel): string[] {
  const queries: string[] = [];
  const lower = originalQuery.toLowerCase();

  // Add dietary prefix
  if (dietaryLabel === 'VEGAN') {
    queries.push(`vegaaninen ${originalQuery}`);
    queries.push(`vegan ${originalQuery}`);
  } else if (dietaryLabel === 'LACTOSE_FREE') {
    queries.push(`laktoositon ${originalQuery}`);
    queries.push(`lactose free ${originalQuery}`);
  } else if (dietaryLabel === 'GLUTEN_FREE') {
    queries.push(`gluteeniton ${originalQuery}`);
    queries.push(`gluten free ${originalQuery}`);
  }

  // Try broader search terms
  const words = lower.split(' ').filter((w) => w.length > 3);
  if (words.length > 1) {
    queries.push(words[0]); // Just the main keyword
  }

  return queries;
}

export async function resolveProduct(
  searchQuery: string,
  dietaryLabel?: DietaryLabel
): Promise<SkaupatProduct | null> {
  // Attempt 1: Direct query
  let products = await queryProducts(searchQuery);

  // Filter by dietary label if specified
  if (dietaryLabel) {
    const filtered = products.filter((p) => matchesDietary(p, dietaryLabel));
    if (filtered.length > 0) return filtered[0];
  } else if (products.length > 0) {
    return products[0];
  }

  // Attempt 2-4: Fallback queries
  const fallbacks = generateFallbackQueries(searchQuery, dietaryLabel);
  for (const fallback of fallbacks.slice(0, 3)) {
    try {
      products = await queryProducts(fallback);

      if (dietaryLabel) {
        const filtered = products.filter((p) => matchesDietary(p, dietaryLabel));
        if (filtered.length > 0) return filtered[0];
      } else if (products.length > 0) {
        return products[0];
      }
    } catch {
      // Continue to next fallback
      continue;
    }
  }

  // Nothing found — return null (caller should flag for human)
  return null;
}
