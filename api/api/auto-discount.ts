// api/discount.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SHOP = process.env.SHOPIFY_SHOP ?? 'btsa-shop-staging.myshopify.com'; // e.g. my-shop.myshopify.com
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN ?? 'shpat_1234567890'; // Admin API token with write_discounts
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-07';

const ADMIN_GRAPHQL_URL = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

const APP_DISCOUNT_TYPES = /* GraphQL */ `
  query AppDiscountTypes($first: Int = 50) {
    appDiscountTypes(first: $first) {
      nodes {
        key
        title
        discountClass
        functionId
      }
    }
  }
`;

const CREATE_AUTOMATIC = /* GraphQL */ `
  mutation CreateAutomatic($input: DiscountAutomaticAppInput!) {
    discountAutomaticAppCreate(automaticAppDiscount: $input) {
      userErrors { field message }
      automaticAppDiscount {
        id
        title
        status
        startsAt
        endsAt
      }
    }
  }
`;

const CREATE_CODE = /* GraphQL */ `
  mutation CreateCode($input: DiscountCodeAppInput!) {
    discountCodeAppCreate(codeAppDiscount: $input) {
      userErrors { field message }
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeApp {
            id
            title
            status
            startsAt
            endsAt
            codes(first: 50) { nodes }
          }
        }
      }
    }
  }
`;

async function gql<T>(query: string, variables: Record<string, any> = {}) {
  if (!SHOP || !ADMIN_TOKEN) {
    throw new Error('Missing SHOPIFY_SHOP or SHOPIFY_ADMIN_TOKEN env.');
  }

  const res = await fetch(ADMIN_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as { data?: T; errors?: any[] };
  if (!res.ok || json.errors?.length) {
    const msg = `GraphQL error: ${JSON.stringify(json.errors || res.statusText)}`;
    throw new Error(msg);
  }
  return json.data as T;
}

type CreateRequestBody = {
  // REQUIRED
  type: 'automatic' | 'code';
  title: string;
  functionConfiguration: any; // This must match what your Function expects

  // OPTIONAL - pick one: pass functionId directly, or functionKey to look it up
  functionId?: string;
  functionKey?: string; // your extension key (from appDiscountTypes)

  // Optional scheduling / behavior
  startsAt?: string; // ISO
  endsAt?: string;   // ISO
  combinesWith?: {
    orderDiscounts?: boolean;
    productDiscounts?: boolean;
    shippingDiscounts?: boolean;
  };

  // For code discounts
  codes?: string[] | string;
};

async function resolveFunctionId(input: CreateRequestBody): Promise<string> {
  if (input.functionId) return input.functionId;

  // If a functionKey is specified, try to find that exact key
  if (input.functionKey) {
    const data = await gql<{
      appDiscountTypes: { nodes: Array<{ key: string; functionId: string }> };
    }>(APP_DISCOUNT_TYPES, { first: 50 });

    const match = data.appDiscountTypes.nodes.find(n => n.key === input.functionKey);
    if (!match?.functionId) {
      throw new Error(`Could not find functionId for functionKey="${input.functionKey}".`);
    }
    return match.functionId;
  }

  // Otherwise: pick the first discount type owned by this app
  const data = await gql<{
    appDiscountTypes: { nodes: Array<{ key: string; functionId: string }> };
  }>(APP_DISCOUNT_TYPES, { first: 1 });

  const first = data.appDiscountTypes.nodes[0];
  if (!first?.functionId) {
    throw new Error('No app discount types found for this app; is your Function deployed?');
  }
  return first.functionId;
}

function toArray<T>(v?: T | T[]): T[] | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v : [v];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS (adjust origins as needed)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as CreateRequestBody;

    // Validate basics
    if (!body?.type || !['automatic', 'code'].includes(body.type)) {
      return res.status(400).json({ error: 'Invalid "type". Must be "automatic" or "code".' });
    }
    if (!body.title) {
      return res.status(400).json({ error: 'Missing "title".' });
    }
    if (body.type === 'code' && !body.codes) {
      return res.status(400).json({ error: 'Missing "codes" for type="code".' });
    }
    if (!body.functionConfiguration) {
      return res.status(400).json({ error: 'Missing "functionConfiguration" JSON.' });
    }

    // 1) Resolve functionId (GET)
    const functionId = await resolveFunctionId(body);

    // 2) Create the discount (SAVE)
    const metafields = [
      {
        namespace: 'discount',
        key: 'function-configuration',
        type: 'json',
        value: JSON.stringify(body.functionConfiguration),
      },
    ];

    const common = {
      title: body.title,
      functionId,
      startsAt: body.startsAt ?? new Date().toISOString(),
      endsAt: body.endsAt,
      combinesWith: body.combinesWith ?? {
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true,
      },
      metafields,
    };

    if (body.type === 'automatic') {
      const data = await gql<{
        discountAutomaticAppCreate: {
          userErrors: Array<{ field: string[]; message: string }>;
          automaticAppDiscount: {
            id: string;
            title: string;
            status: string;
            startsAt: string;
            endsAt?: string | null;
          } | null;
        };
      }>(CREATE_AUTOMATIC, { input: common });

      const result = data.discountAutomaticAppCreate;
      if (result.userErrors?.length) {
        return res.status(400).json({ errors: result.userErrors });
      }
      return res.status(201).json({ type: 'automatic', discount: result.automaticAppDiscount });
    } else {
      const data = await gql<{
        discountCodeAppCreate: {
          userErrors: Array<{ field: string[]; message: string }>;
          codeDiscountNode: {
            id: string;
            codeDiscount?: {
              id: string;
              title: string;
              status: string;
              startsAt: string;
              endsAt?: string | null;
              codes?: { nodes: string[] };
            };
          } | null;
        };
      }>(CREATE_CODE, {
        input: {
          ...common,
          codes: toArray(body.codes),
        },
      });

      const result = data.discountCodeAppCreate;
      if (result.userErrors?.length) {
        return res.status(400).json({ errors: result.userErrors });
      }
      return res.status(201).json({ type: 'code', discount: result.codeDiscountNode });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
