import { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Button,
  Banner,
  Text,
  TextField,
  Stack,
  Spinner,
  List,
  Divider,
} from '@shopify/polaris';

export default function SyncProducts() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleSync = async () => {
    if (!shopDomain || !accessToken) {
      setError('Please provide both shop domain and access token');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/sync-all-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shopify-shop-domain': shopDomain,
          'x-shopify-access-token': accessToken,
        },
        body: JSON.stringify({
          shopDomain,
          accessToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Sync All Products"
      subtitle="Convert native quantity breaks to metafields for all products"
      breadcrumbs={[{content: 'Settings', url: '/'}]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Stack vertical>
              <Text variant="headingMd">Store Configuration</Text>
              
              <TextField
                label="Shop Domain"
                value={shopDomain}
                onChange={setShopDomain}
                placeholder="your-store.myshopify.com"
                helpText="Your Shopify store domain"
              />
              
              <TextField
                label="Access Token"
                value={accessToken}
                onChange={setAccessToken}
                placeholder="shpat_..."
                type="password"
                helpText="Admin API access token with read_products and write_products scopes"
              />

              <Button
                primary
                loading={loading}
                onClick={handleSync}
                disabled={!shopDomain || !accessToken}
              >
                {loading ? 'Syncing All Products...' : 'Sync All Products'}
              </Button>
            </Stack>
          </Card>
        </Layout.Section>

        {loading && (
          <Layout.Section>
            <Card>
              <Stack alignment="center">
                <Spinner size="large" />
                <Text>Fetching and converting all products with quantity breaks...</Text>
              </Stack>
            </Card>
          </Layout.Section>
        )}

        {error && (
          <Layout.Section>
            <Banner status="critical" title="Sync Failed">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {result && (
          <Layout.Section>
            <Card>
              <Stack vertical>
                <Text variant="headingMd"> Sync Completed Successfully!</Text>
                
                <Divider />
                
                <Stack distribution="fillEvenly">
                  <div>
                    <Text variant="headingSm">Total Variants Scanned</Text>
                    <Text variant="heading2xl">{result.totalVariants}</Text>
                  </div>
                  <div>
                    <Text variant="headingSm">With Quantity Breaks</Text>
                    <Text variant="heading2xl">{result.variantsWithBreaks}</Text>
                  </div>
                  <div>
                    <Text variant="headingSm">Metafields Created</Text>
                    <Text variant="heading2xl">{result.metafieldsCreated}</Text>
                  </div>
                </Stack>

                {result.errors > 0 && (
                  <Banner status="warning" title={`${result.errors} errors encountered`}>
                    <p>Some metafields may not have been created. Check the logs for details.</p>
                  </Banner>
                )}

                {result.conversionReport && result.conversionReport.length > 0 && (
                  <>
                    <Divider />
                    <Text variant="headingMd">Products Converted:</Text>
                    <List type="bullet">
                      {result.conversionReport.slice(0, 10).map((item, index) => (
                        <List.Item key={index}>
                          <strong>{item.product}</strong> - {item.variant} ({item.sku}) - {item.quantityBreaks} breaks
                        </List.Item>
                      ))}
                      {result.conversionReport.length > 10 && (
                        <List.Item>
                          <em>... and {result.conversionReport.length - 10} more products</em>
                        </List.Item>
                      )}
                    </List>
                  </>
                )}

                <Banner status="success" title=" Your discount function now works with ALL products!">
                  <p>
                    All products with quantity pricing have been converted to metafields.
                    Your Shopify Function can now apply quantity break discounts to every product.
                  </p>
                </Banner>
              </Stack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
