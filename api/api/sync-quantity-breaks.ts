import { VercelRequest, VercelResponse } from '@vercel/node';

// Type definitions
interface Metafield {
  id: string;
  namespace: string;
  key: string;
  value?: string;
  ownerId: string;
}

interface VariantWithBreaks {
  variant: {
    id: string;
    title: string;
    price: string;
    product: {
      id: string;
      title: string;
    };
  };
  quantityPriceBreaks: {
    edges: Array<{
      node: {
        minimumQuantity: string;
        price: {
          amount: string;
          currencyCode: string;
        };
      };
    }>;
  };
  priceListName: string;
  priceListId: string;
}

interface QuantityBreak {
  min: number;
  price: string;
}

interface MetafieldToCreate {
  namespace: string;
  key: string;
  type: string;
  value: string;
  ownerId: string;
}

// Query to get all products with their variants to find metafields
const GET_PRODUCTS_WITH_METAFIELDS_QUERY = `
  query getProductsWithMetafields($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          variants(first: 100) {
            edges {
              node {
                id
                title
                metafields(first: 10, namespace: "qbtier") {
                  edges {
                    node {
                      id
                      namespace
                      key
                      value
                    }
                  }
                }
              }
            }
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

// Query to get a single price list with all its prices
const GET_PRICE_LIST_QUERY = `
  query getPriceList($id: ID!, $first: Int!, $after: String) {
    priceList(id: $id) {
      id
      name
      prices(first: $first, after: $after) {
        edges {
          node {
            variant {
              id
              title
              price
              product {
                id
                title
              }
            }
            quantityPriceBreaks(first: 10) {
              edges {
                node {
                  minimumQuantity
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

// Query to get all price lists
const GET_ALL_PRICE_LISTS_QUERY = `
  query getAllPriceLists($first: Int!, $after: String) {
    priceLists(first: $first, after: $after) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Mutation to delete metafields
const DELETE_METAFIELDS_MUTATION = `
  mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields { key namespace ownerId }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation to create metafields
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

async function makeGraphQLRequest(shopDomain: string, accessToken: string, query: string, variables = {}) {
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

async function getAllExistingMetafields(shopDomain: string, accessToken: string): Promise<Array<{ node: Metafield }>> {
  let allMetafields: Array<{ node: Metafield }> = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    
    const data = await makeGraphQLRequest(shopDomain, accessToken, GET_PRODUCTS_WITH_METAFIELDS_QUERY, {
      first: 10,
      after: cursor
    });

    const products = data.products.edges;
    let metafieldsInThisPage = 0;
    
    // Extract metafields from all variants in all products
    for (const { node: product } of products) {
      for (const { node: variant } of product.variants.edges) {
        for (const { node: metafield } of variant.metafields.edges) {
          if (metafield.namespace === "qbtier" && metafield.key === "tiers") {
            allMetafields.push({
              node: {
                id: metafield.id,
                namespace: metafield.namespace,
                key: metafield.key,
                ownerId: variant.id
              }
            });
            metafieldsInThisPage++;
          }
        }
      }
    }
    
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return allMetafields;
}

async function deleteAllExistingMetafields(shopDomain: string, accessToken: string): Promise<{ deletedCount: number; errorCount: number }> {
  const existingMetafields = await getAllExistingMetafields(shopDomain, accessToken);
  
  if (existingMetafields.length === 0) {
    return { deletedCount: 0, errorCount: 0 };
  }

  let deletedCount = 0;
  let errorCount = 0;
  const totalMetafields = existingMetafields.length;

  for (let i = 0; i < existingMetafields.length; i++) {
    const metafield = existingMetafields[i];
    
    if (!metafield?.node) {
      errorCount++;
      continue;
    }
    
    try {
      const result = await makeGraphQLRequest(shopDomain, accessToken, DELETE_METAFIELDS_MUTATION, {
        metafields: [{ ownerId: metafield.node.ownerId, namespace: "qbtier", key: "tiers" }]
      });

      if (result.metafieldsDelete.userErrors && result.metafieldsDelete.userErrors.length > 0) {
        errorCount++;
      } else {
        deletedCount += result.metafieldsDelete.deletedMetafields.length;
      }
    } catch (error) {
      errorCount++;
    }

    // Add a small delay every 10 deletions to avoid rate limits
    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { deletedCount, errorCount };
}

async function getAllPriceLists(shopDomain: string, accessToken: string): Promise<Array<{ node: { id: string; name: string } }>> {  
  let allPriceLists: Array<{ node: { id: string; name: string } }> = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const data = await makeGraphQLRequest(shopDomain, accessToken, GET_ALL_PRICE_LISTS_QUERY, {
      first: 10,
      after: cursor
    });

    const priceLists = data.priceLists.edges;
    allPriceLists = allPriceLists.concat(priceLists);
    
    hasNextPage = data.priceLists.pageInfo.hasNextPage;
    cursor = data.priceLists.pageInfo.endCursor;    
  }

  return allPriceLists;
}

async function getAllPricesFromPriceList(shopDomain: string, accessToken: string, priceListId: string, priceListName: string): Promise<Array<{ node: any }>> {  
  let allPrices: Array<{ node: any }> = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const data = await makeGraphQLRequest(shopDomain, accessToken, GET_PRICE_LIST_QUERY, {
      id: priceListId,
      first: 100,
      after: cursor
    });

    if (data.priceList && data.priceList.prices) {
      const prices = data.priceList.prices.edges;
      allPrices = allPrices.concat(prices);
      
      hasNextPage = data.priceList.prices.pageInfo.hasNextPage;
      cursor = data.priceList.prices.pageInfo.endCursor;
      
    } else {
      hasNextPage = false;
    }
  }

  return allPrices;
}

async function getAllVariantsWithQuantityBreaks(shopDomain: string, accessToken: string): Promise<VariantWithBreaks[]> {  
  const priceLists = await getAllPriceLists(shopDomain, accessToken);
  let allVariantsWithBreaks: VariantWithBreaks[] = [];

  for (const { node: priceList } of priceLists) {
    const prices = await getAllPricesFromPriceList(shopDomain, accessToken, priceList.id, priceList.name);
    
    // Filter prices that have quantity breaks
    const variantsWithBreaks = prices.filter(({ node: price }) => 
      price.quantityPriceBreaks.edges.length > 0
    );

    if (variantsWithBreaks.length > 0) {      
      // Add price list info to each variant
      variantsWithBreaks.forEach(({ node: price }) => {
        allVariantsWithBreaks.push({
          ...price,
          priceListName: priceList.name,
          priceListId: priceList.id
        });
      });
    }
  }

  return allVariantsWithBreaks;
}

async function convertToMetafields(variantsWithQuantityBreaks: VariantWithBreaks[]): Promise<{ metafieldsToCreate: MetafieldToCreate[]; conversionReport: any[] }> {  
  const metafieldsToCreate: MetafieldToCreate[] = [];
  const conversionReport: any[] = [];

  for (const variant of variantsWithQuantityBreaks) {
    const quantityBreaks = variant.quantityPriceBreaks.edges;
    
    // Convert to our metafield format
    const breaks: QuantityBreak[] = quantityBreaks.map(({ node: qpb }) => {
      return {
        min: parseInt(qpb.minimumQuantity),
        price: qpb.price.amount
      };
    });

    const qbTiers = {
      fixed: variant.variant.price,
      breaks: breaks.sort((a: QuantityBreak, b: QuantityBreak) => a.min - b.min)
    };

    metafieldsToCreate.push({
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: JSON.stringify(qbTiers),
      ownerId: variant.variant.id
    });

    conversionReport.push({
      product: variant.variant.product.title,
      variant: variant.variant.title,
      sku: variant.variant.id.split('/').pop(),
      basePrice: variant.variant.price,
      quantityBreaks: breaks.length,
      priceList: variant.priceListName,
      converted: true
    });
  }

  return { metafieldsToCreate, conversionReport };
}

async function createMetafieldsInBatches(shopDomain: string, accessToken: string, metafieldsToCreate: MetafieldToCreate[]): Promise<{ successCount: number; errorCount: number }> {  
  const BATCH_SIZE = 25;
  const batches: MetafieldToCreate[][] = [];
  
  for (let i = 0; i < metafieldsToCreate.length; i += BATCH_SIZE) {
    batches.push(metafieldsToCreate.slice(i, i + BATCH_SIZE));
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    if (!batch) {
      errorCount++;
      continue;
    }
    
    try {
      const result = await makeGraphQLRequest(shopDomain, accessToken, CREATE_METAFIELDS_MUTATION, {
        metafields: batch
      });

      if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
        errorCount += result.metafieldsSet.userErrors.length;
      } else {
        successCount += batch.length;
      }
    } catch (error) {
      errorCount += batch.length;
    }

    // Add a small delay between batches to avoid rate limits
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { successCount, errorCount };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { shopDomain, accessToken } = req.body;

    // Validate required parameters
    if (!shopDomain || !accessToken) {
      res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['shopDomain', 'accessToken']
      });
      return;
    }

    // Validate shop domain format
    if (!shopDomain.includes('.myshopify.com')) {
      res.status(400).json({ 
        error: 'Invalid shop domain format. Must be in format: your-shop.myshopify.com'
      });
      return;
    }

    const startTime = Date.now();

    // Step 1: Clean up existing metafields
    const { deletedCount, errorCount: deleteErrors } = await deleteAllExistingMetafields(shopDomain, accessToken);

    // Step 2: Get all variants with quantity breaks
    const variantsWithQuantityBreaks = await getAllVariantsWithQuantityBreaks(shopDomain, accessToken);
    
    if (variantsWithQuantityBreaks.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No variants with quantity breaks found in any price list',
        deletedCount,
        createdCount: 0,
        errorCount: 0,
        duration: Date.now() - startTime
      });
      return;
    }

    // Step 3: Convert to metafields format
    const { metafieldsToCreate, conversionReport } = await convertToMetafields(variantsWithQuantityBreaks);

    // Step 4: Create metafields in batches
    const { successCount, errorCount } = await createMetafieldsInBatches(shopDomain, accessToken, metafieldsToCreate);

    const duration = Date.now() - startTime;

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Quantity breaks synced to metafields successfully',
      deletedCount,
      createdCount: successCount,
      errorCount: errorCount + deleteErrors,
      variantsProcessed: conversionReport.length,
      duration,
      details: {
        cleanup: {
          deleted: deletedCount,
          errors: deleteErrors
        },
        creation: {
          created: successCount,
          errors: errorCount
        }
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
