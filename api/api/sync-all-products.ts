// API endpoint version of sync-all-products.js
// Deploy this to Vercel/Netlify and call via HTTP

import { VercelRequest, VercelResponse } from '@vercel/node';

interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: string;
  quantityPriceBreaks: QuantityPriceBreak[];
  product: {
    id: string;
    title: string;
  };
}

interface QuantityPriceBreak {
  id: string;
  minimumQuantity: string;
  price: {
    amount: string;
    currencyCode: string;
  };
}

interface ProductVariantEdge {
  node: ProductVariant;
}

interface ProductVariantsResponse {
  productVariants: {
    edges: ProductVariantEdge[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
}

interface MetafieldInput {
  namespace: string;
  key: string;
  type: string;
  value: string;
  ownerId: string;
}

interface MetafieldsSetResponse {
  metafieldsSet: {
    metafields: Array<{
      id: string;
      namespace: string;
      key: string;
      value: string;
    }>;
    userErrors: Array<{
      field: string;
      message: string;
    }>;
  };
}

interface QuantityBreak {
  min: number;
  price: string;
}

interface QBTiers {
  fixed: string;
  breaks: QuantityBreak[];
}

interface ConversionReportItem {
  product: string;
  variant: string;
  sku: string;
  quantityBreaks: number;
}

interface SyncResult {
  totalVariants: number;
  variantsWithBreaks: number;
  metafieldsCreated: number;
  errors: number;
  conversionReport: ConversionReportItem[];
  message?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-shopify-shop-domain, x-shopify-access-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shopDomain = req.headers['x-shopify-shop-domain'] as string || req.body?.shopDomain;
    const accessToken = req.headers['x-shopify-access-token'] as string || req.body?.accessToken;

    if (!shopDomain || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing shopDomain or accessToken',
        required: 'Include in headers or body'
      });
    }

    console.log(`Starting sync for ${shopDomain}`);

    // Same logic as sync-all-products.js but as API
    const result = await syncAllProductsAPI(shopDomain, accessToken);
    
    res.status(200).json({
      success: true,
      message: 'Sync completed successfully',
      ...result
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function syncAllProductsAPI(shopDomain: string, accessToken: string): Promise<SyncResult> {
  const GET_VARIANTS_QUERY = `
    query getProductVariants($first: Int!, $after: String) {
      productVariants(first: $first, after: $after) {
        edges {
          node {
            id
            sku
            title
            price
            quantityPriceBreaks {
              id
              minimumQuantity
              price {
                amount
                currencyCode
              }
            }
            product {
              id
              title
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const CREATE_METAFIELDS_MUTATION = `
    mutation metafieldSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  async function makeGraphQLRequest<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    return data.data;
  }

  // Get all variants with quantity breaks
  let allVariants: ProductVariantEdge[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let pageCount = 0;

  console.log('Fetching all product variants...');

  while (hasNextPage) {
    pageCount++;
    console.log(`Page ${pageCount}...`);
    
    const data = await makeGraphQLRequest<ProductVariantsResponse>(GET_VARIANTS_QUERY, {
      first: 100,
      after: cursor
    });

    const variants = data.productVariants.edges;
    allVariants = allVariants.concat(variants);
    
    hasNextPage = data.productVariants.pageInfo.hasNextPage;
    cursor = data.productVariants.pageInfo.endCursor;
  }

  // Filter variants with quantity breaks
  const variantsWithQuantityBreaks = allVariants.filter(({ node }) => 
    node.quantityPriceBreaks && node.quantityPriceBreaks.length > 0
  );

  console.log(`Found ${variantsWithQuantityBreaks.length} variants with quantity breaks`);

  if (variantsWithQuantityBreaks.length === 0) {
    return {
      totalVariants: allVariants.length,
      variantsWithBreaks: 0,
      metafieldsCreated: 0,
      errors: 0,
      conversionReport: [],
      message: 'No products with quantity breaks found'
    };
  }

  // Convert to metafields
  const metafieldsToCreate: MetafieldInput[] = [];
  const conversionReport: ConversionReportItem[] = [];

  for (const { node: variant } of variantsWithQuantityBreaks) {
    const breaks: QuantityBreak[] = variant.quantityPriceBreaks.map(qpb => ({
      min: parseInt(qpb.minimumQuantity),
      price: qpb.price.amount
    }));

    const qbTiers: QBTiers = {
      fixed: variant.price,
      breaks: breaks.sort((a, b) => a.min - b.min)
    };

    metafieldsToCreate.push({
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: JSON.stringify(qbTiers),
      ownerId: variant.id
    });

    conversionReport.push({
      product: variant.product.title,
      variant: variant.title,
      sku: variant.sku,
      quantityBreaks: breaks.length
    });
  }

  // Create metafields in batches
  const BATCH_SIZE = 25;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < metafieldsToCreate.length; i += BATCH_SIZE) {
    const batch = metafieldsToCreate.slice(i, i + BATCH_SIZE);
    
    try {
      const result = await makeGraphQLRequest<MetafieldsSetResponse>(CREATE_METAFIELDS_MUTATION, {
        metafields: batch
      });

      if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
        console.log('Batch errors:', result.metafieldsSet.userErrors);
        errorCount += result.metafieldsSet.userErrors.length;
      } else {
        successCount += batch.length;
      }
    } catch (error) {
      console.error('Batch error:', error instanceof Error ? error.message : 'Unknown error');
      errorCount += batch.length;
    }
  }

  return {
    totalVariants: allVariants.length,
    variantsWithBreaks: variantsWithQuantityBreaks.length,
    metafieldsCreated: successCount,
    errors: errorCount,
    conversionReport
  };
}
