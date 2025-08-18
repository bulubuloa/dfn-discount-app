import { useEffect } from "react";
import { Page, Layout, Card, Text, Stack, Badge, Button } from "@shopify/polaris";

export default function Index() {
  useEffect(() => {
    // If we're in a Shopify Function configuration context, close it immediately
    if (window.shopify && window.shopify.config) {
      console.log("In Shopify config context, closing immediately");
      try {
        window.shopify.config.close();
      } catch (error) {
        console.log("Could not close config, continuing normally");
      }
    }
  }, []);

  return (
    <Page title="DFN Discount App - 90% Discount Function">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
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
                ✅ Function Status
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Function Status:</strong> Active and Ready
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Available Discounts:</strong> 90% Order, 90% Product, Free Shipping
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Next Step:</strong> Create a discount using this function
                </Text>
              </Stack>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-shop-staging/discounts", "_blank")}
                >
                  Create Discount
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
