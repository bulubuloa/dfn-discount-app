import React from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Stack,
  Button,
  Banner,
  Icon,
  Box,
  Badge,
} from '@shopify/polaris';
import { DiscountsMajor, CartMajor, DiscountAutomaticMajor } from '@shopify/polaris-icons';

export default function Config() {
  return (
    <Page title="DFN Discount App Configuration">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Icon source={DiscountsMajor} tone="success" />
              <Text variant="headingLg" as="h1" alignment="center">
                🎉 Discount Function is Active!
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                Your discount function is now configured and ready to apply discounts automatically.
              </Text>
              
              <Stack distribution="center" spacing="tight">
                <Badge tone="success" size="large">Function Active</Badge>
                <Badge tone="info" size="large">Ready to Use</Badge>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                ⚙️ Current Configuration
              </Text>
              
              <Stack vertical spacing="loose">
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={DiscountsMajor} tone="success" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Order Discounts: 20% OFF
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Automatically applies 20% discount to entire cart subtotals
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={CartMajor} tone="info" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Product Discounts: 15% OFF
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Automatically applies 15% discount to individual products
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={DiscountAutomaticMajor} tone="warning" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Shipping Discounts: 50% OFF
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Automatically applies 50% discount to shipping costs
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🚀 How to Use
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>1.</strong> Go to Shopify Admin → Discounts → Create discount
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>2.</strong> Choose your discount type (Order, Product, or Shipping)
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>3.</strong> In the "Function" section, select "DFN Discount App"
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>4.</strong> Configure your discount conditions and settings
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>5.</strong> Save and activate your discount
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                ✅ What Happens Next
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  Once configured, this function will automatically:
                </Text>
                
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd" as="p">
                    • Apply discounts to <strong>all qualifying carts</strong>
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Work with your existing discount conditions and rules
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Provide consistent discount application across your store
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Boost conversion rates by removing friction
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Banner
                title="Ready to Create Your First Discount?"
                tone="success"
              >
                <p>Your discount function is now properly configured! Go to Shopify Admin to create discounts that will automatically apply to customer carts.</p>
              </Banner>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  size="large"
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-shop-staging/discounts", "_blank")}
                >
                  🎯 Go to Shopify Discounts
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
