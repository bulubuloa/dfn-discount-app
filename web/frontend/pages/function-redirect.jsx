import { useEffect } from "react";
import { Page, Layout, Card, Text, Stack, Spinner } from "@shopify/polaris";

export default function FunctionRedirect() {
  useEffect(() => {
    // Check if we're in a Shopify Function configuration context
    if (window.shopify && window.shopify.config) {
      // If we're in a function configuration context, redirect to the config page
      window.location.href = "/function-config";
    } else {
      // Otherwise redirect to the discounts page
      const shopDomain = window.location.hostname.includes('myshopify.com') 
        ? window.location.hostname 
        : 'btsa-staging.myshopify.com';
      
      const discountUrl = `https://admin.shopify.com/store/${shopDomain.replace('.myshopify.com', '')}/discounts`;
      window.location.href = discountUrl;
    }
  }, []);

  return (
    <Page title="DFN Discount Function">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Spinner size="large" />
              <Text variant="headingMd" as="h2">
                Setting up your discount function...
              </Text>
              <Text variant="bodyMd" as="p">
                You're being redirected to configure your 90% discount function.
              </Text>
              <Text variant="bodyMd" as="p">
                If you're not redirected automatically, please go to your Shopify admin → Discounts → Create discount → Function-based discount → Select dfn-discount-app
              </Text>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
