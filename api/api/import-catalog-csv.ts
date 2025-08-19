// /api/import-catalog-csv.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Papa from 'papaparse';

const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-07';
const CSV_URL = process.env.CATALOG_CSV_URL ?? 'https://storage.googleapis.com/shopify_khoapm/catalogs_export.csv'; // e.g., https://your-bucket/catalog.csv

const GQL = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

async function gql<T>(query: string, variables?: any) {
  const r = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json() as { data?: T; errors?: any[] };
  if (!r.ok || j.errors?.length) throw new Error(`GraphQL: ${JSON.stringify(j.errors || r.statusText)}`);
  return j.data!;
}

const Q_VARIANT_BY_SKU = `
  query($s:String!){
    productVariants(first: 1, query: $s) {
      edges { node { id sku } }
    }
  }
`;

const M_SET_METAFIELD = `
  mutation($ownerId: ID!, $value: String!) {
    metafieldsSet(metafields: [{
      ownerId: $ownerId,
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: $value
    }]) {
      metafields { id }
      userErrors { field message code }
    }
  }
`;

function normalizeSku(s: string) {
  return s.startsWith("sku:'") ? s : `sku:'${s}'`;
}

function buildTiersFromRow(row: Record<string, any>) {
  const fixed = String(row['Fixed Price'] ?? '').trim();
  const breaks: Array<{ min: number; price: string }> = [];
  for (let i = 1; i <= 10; i++) {
    const q = Number(row[`Quantity Break ${i}`]);
    const p = row[`Price Break ${i}`];
    if (q && p != null && String(p).trim() !== '') {
      breaks.push({ min: q, price: String(p).trim() });
    }
  }
  breaks.sort((a, b) => a.min - b.min);
  return { fixed, breaks };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  try {
    if (!SHOP || !TOKEN) return res.status(400).json({ error: 'Missing SHOPIFY env vars' });
    if (!CSV_URL) return res.status(400).json({ error: 'Missing CATALOG_CSV_URL env var' });

    // 1) Download CSV
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`Failed to download CSV: ${resp.status}`);
    const csvText = await resp.text();

    // 2) Parse CSV
    const parsed = Papa.parse(csvText, { header: true });
    const rows = (parsed.data as any[]).filter(Boolean);

    const results: Array<{ sku: string; variant?: string; status: string; errors?: any }> = [];

    // 3) Iterate rows → find variant by SKU → write metafield
    for (const row of rows) {
      const sku = (row.SKU || row['Variant SKU'] || '').trim();
      if (!sku) { results.push({ sku: '', status: 'skip_no_sku' }); continue; }

      const tiers = buildTiersFromRow(row);
      if (!tiers.fixed && !tiers.breaks.length) {
        results.push({ sku, status: 'skip_no_price_or_breaks' });
        continue;
      }

      const v = await gql<{ productVariants: { edges: { node: { id: string } }[] } }>(
        Q_VARIANT_BY_SKU, { s: normalizeSku(sku) }
      );
      const variantId = v.productVariants.edges[0]?.node?.id;
      if (!variantId) { results.push({ sku, status: 'variant_not_found' }); continue; }

      const value = JSON.stringify(tiers); // {"fixed":"..","breaks":[{min,price},...]}
      const m = await gql<{ metafieldsSet: { userErrors: any[] } }>(M_SET_METAFIELD, {
        ownerId: variantId, value
      });
      const errs = (m as any).metafieldsSet?.userErrors || [];
      results.push({ sku, variant: variantId, status: errs.length ? 'error' : 'ok', errors: errs });
    }

    const ok = results.filter(r => r.status === 'ok').length;
    const missing = results.filter(r => r.status === 'variant_not_found').length;
    return res.status(200).json({ updated: ok, missing, totalRows: rows.length, results });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Import failed' });
  }
}
