import { useEffect } from "react";
import { Page, Layout, Card, Text, Stack, Spinner } from "@shopify/polaris";

export default function FunctionRedirect() {
  useEffect(() => {
    // Redirect to the proper discount creation page
    const redirectToDiscounts = () => {
      const shopDomain = window.location.hostname.includes('myshopify.com') 
        ? window.location.hostname 
        : 'btsa-staging.myshopify.com';
      
      const discountUrl = `https://admin.shopify.com/store/${shopDomain.replace('.myshopify.com', '')}/discounts`;
      
      // Check if we're in a Shopify admin context
      if (window.shopify && window.shopify.config) {
        // If we're in a function configuration context, close it
        window.shopify.config.close();
      } else {
        // Otherwise redirect to the discounts page
        window.location.href = discountUrl;
      }
    };

    // Redirect after a short delay
    const timer = setTimeout(redirectToDiscounts, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Page title="DFN Discount Function">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Spinner size="large" />
              <Text variant="headingMd" as="h2">
                Redirecting to Discount Configuration...
              </Text>
              <Text variant="bodyMd" as="p">
                You're being redirected to Shopify's discount configuration page where you can set up your discount function.
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
