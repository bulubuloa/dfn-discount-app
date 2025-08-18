import { Page, Layout, Card, Text, Stack, Badge, Button } from "@shopify/polaris";

export default function Index() {
  return (
    <Page title="DFN Discount App - 50% Discount Function">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h2">
                🎯 DFN Discount App - 50% Discount Function
              </Text>
              
              <Text variant="bodyMd" as="p">
                Welcome to your Shopify discount function app! This app provides powerful 50% discount capabilities for your store.
              </Text>

              <Stack distribution="center" spacing="tight">
                <Badge tone="success">Active</Badge>
                <Badge tone="info">Ready to Use</Badge>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                🚀 What This App Does
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>50% Order Discount:</strong> Apply 50% off to entire orders
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>50% Product Discount:</strong> Apply 50% off to individual cart items
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Smart Integration:</strong> Works seamlessly with Shopify's discount system
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                📋 How to Use
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  1. Go to your Shopify admin → Discounts
                </Text>
                <Text variant="bodyMd" as="p">
                  2. Create a new discount and select "Function-based discount"
                </Text>
                <Text variant="bodyMd" as="p">
                  3. Choose this app's discount function
                </Text>
                <Text variant="bodyMd" as="p">
                  4. Configure discount classes and conditions
                </Text>
                <Text variant="bodyMd" as="p">
                  5. Activate and start saving your customers money!
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                🔧 App Status
              </Text>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-staging/discounts", "_blank")}
                >
                  Go to Discounts
                </Button>
                <Button 
                  onClick={() => window.open("/discount-config", "_blank")}
                >
                  Configure Function
                </Button>
                <Button 
                  onClick={() => window.open("https://github.com/yourusername/dfn-discount-app", "_blank")}
                >
                  View on GitHub
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
