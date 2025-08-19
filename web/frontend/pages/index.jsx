import { useEffect } from "react";
import { Page, Layout, Card, Text, Stack, Badge, Button, Banner, Icon, Box } from "@shopify/polaris";
import { DiscountMajor, CartMajor, ShippingMajor } from "@shopify/polaris-icons";

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
    <Page title="DFN Discount App - Powerful Cart Discounts">
      <Layout>
        {/* Hero Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Stack distribution="center" spacing="tight">
                <Badge tone="success" size="large">Active & Ready</Badge>
                <Badge tone="info" size="large">Automatic Discounts Available</Badge>
              </Stack>
              
              <Text variant="headingLg" as="h1" alignment="center">
                🎉 Your Discount App is Ready!
              </Text>
              
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                This app automatically applies powerful discounts to all customer carts when you create discounts in Shopify.
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* How It Works Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🚀 How It Works
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>1.</strong> Create a discount in Shopify Admin → Discounts
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>2.</strong> Select "DFN Discount App" as the discount function
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>3.</strong> The app automatically applies discounts to all qualifying carts
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Available Discounts Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                💰 Available Discount Types
              </Text>
              
              <Stack vertical spacing="loose">
                {/* Order Discount */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={DiscountMajor} tone="success" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        20% OFF ENTIRE ORDER
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Applies to the entire cart subtotal. Perfect for store-wide sales!
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Product Discount */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={CartMajor} tone="info" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        15% OFF INDIVIDUAL PRODUCTS
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Applies to each product in the cart. Great for product-specific promotions!
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Shipping Discount */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={ShippingMajor} tone="warning" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        50% OFF SHIPPING
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Reduces shipping costs by half. Boosts conversion rates!
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Action Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Banner
                title="Ready to Create Your First Discount?"
                tone="success"
                action={{content: 'Create Discount Now', url: 'https://admin.shopify.com/store/btsa-shop-staging/discounts'}}
              >
                <p>Click the button below to go directly to Shopify's discount creation page. Remember to select "DFN Discount App" as your discount function!</p>
              </Banner>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  size="large"
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-shop-staging/discounts", "_blank")}
                >
                  🎯 Create Discount in Shopify
                </Button>
                <Button 
                  size="large"
                  onClick={() => window.open("https://help.shopify.com/en/manual/discounts", "_blank")}
                >
                  📚 Learn About Discounts
                </Button>
                <Button 
                  size="large"
                  url="/getting-started"
                >
                  📖 Getting Started Guide
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Status Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                ✅ App Status
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Function Status:</strong> Active and Ready
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Coverage:</strong> All customer carts automatically
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Next Step:</strong> Create a discount using this function
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Quick Troubleshooting */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🔧 Quick Troubleshooting
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Discount not working?</strong> Check these common issues:
                </Text>
                
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd" as="p">
                    • Make sure you selected "DFN Discount App" as the discount function
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Verify your discount is active and not expired
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Check that your cart meets any discount conditions
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Try refreshing the cart page
                  </Text>
                </Stack>
                
                <Button 
                  url="/getting-started"
                  size="small"
                >
                  📖 View Detailed Guide
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
