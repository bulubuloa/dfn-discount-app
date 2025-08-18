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
                📋 How to Use This Discount Function
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Step 1:</strong> Click "Create Discount" button below
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 2:</strong> In the discounts page, click "Create discount"
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 3:</strong> Select "Function-based discount" as the type
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 4:</strong> Choose "dfn-discount-app" from the function list
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 5:</strong> Configure your discount settings and activate it
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Important:</strong> After selecting the function, you'll be redirected back here. This is normal! 
                  The function is now active and will apply discounts automatically when customers shop.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                ✅ Function Status
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Function Status:</strong> Active and Ready
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Available Discounts:</strong> 50% Order, 50% Product, Free Shipping
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Next Step:</strong> Create a discount using this function
                </Text>
              </Stack>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-staging/discounts", "_blank")}
                >
                  Create Discount
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

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                🔄 What Happens After Selection
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Normal Behavior:</strong> When you select this function, you'll be redirected back to this page. This is expected!
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Function Activation:</strong> The function is now active and will automatically apply discounts when customers shop.
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>No Configuration Needed:</strong> The function works automatically based on the discount classes you select in Shopify's discount interface.
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Testing:</strong> Add items to cart and proceed to checkout to see the discounts applied automatically.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
