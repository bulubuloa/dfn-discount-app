import { Page, Layout, Card, Text, Stack, Button, Banner, Icon, Box, List } from "@shopify/polaris";
import { DiscountMajor, CartMajor, ShippingMajor, PlayMajor, CheckmarkMajor } from "@shopify/polaris-icons";

export default function GettingStarted() {
  return (
    <Page 
      title="Getting Started with DFN Discount App"
      backAction={{ content: 'Home', url: '/' }}
    >
      <Layout>
        {/* Welcome Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Icon source={PlayMajor} tone="success" />
              <Text variant="headingLg" as="h1" alignment="center">
                Welcome to DFN Discount App! 🎉
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                This guide will walk you through setting up your first discount using our powerful app.
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* What This App Does */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🎯 What This App Does
              </Text>
              
              <Text variant="bodyMd" as="p">
                The DFN Discount App is a <strong>Shopify Function</strong> that automatically applies discounts to customer carts. 
                Unlike traditional discounts that require customers to enter codes, this app works behind the scenes to:
              </Text>
              
              <List type="bullet">
                <List.Item>Apply discounts to <strong>all qualifying carts automatically</strong></List.Item>
                <List.Item>Work with your existing discount rules and conditions</List.Item>
                <List.Item>Provide consistent discount application across your store</List.Item>
                <List.Item>Boost conversion rates by removing friction</List.Item>
              </List>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Step-by-Step Setup */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                📋 Step-by-Step Setup
              </Text>
              
              <Stack vertical spacing="loose">
                {/* Step 1 */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Box minWidth="40px">
                      <Text variant="headingMd" as="h3" tone="success">
                        1
                      </Text>
                    </Box>
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Go to Shopify Admin → Discounts
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Navigate to your Shopify admin panel and click on "Discounts" in the left sidebar.
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Step 2 */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Box minWidth="40px">
                      <Text variant="headingMd" as="h3" tone="success">
                        2
                      </Text>
                    </Box>
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Click "Create discount"
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Click the "Create discount" button to start building your new discount.
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Step 3 */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Box minWidth="40px">
                      <Text variant="headingMd" as="h3" tone="success">
                        3
                      </Text>
                    </Box>
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Choose discount type
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Select the type of discount you want to create (Order discount, Product discount, or Shipping discount).
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Step 4 */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Box minWidth="40px">
                      <Text variant="headingMd" as="h3" tone="success">
                        4
                      </Text>
                    </Box>
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Select "DFN Discount App" as function
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        <strong>This is the crucial step!</strong> In the "Function" section, select "DFN Discount App" from the dropdown.
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Step 5 */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Box minWidth="40px">
                      <Text variant="headingMd" as="h3" tone="success">
                        5
                      </Text>
                    </Box>
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Configure your discount
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Set your discount title, conditions, and any other settings you want. The app will handle the actual discount application.
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Step 6 */}
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Box minWidth="40px">
                      <Text variant="headingMd" as="h3" tone="success">
                        6
                      </Text>
                    </Box>
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Save and activate
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Save your discount and activate it. The app will now automatically apply discounts to all qualifying carts!
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Available Discount Types */}
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
                        When you create an <strong>Order discount</strong>, this app automatically applies a 20% discount to the entire cart subtotal.
                        Perfect for store-wide sales and promotions!
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
                        When you create a <strong>Product discount</strong>, this app applies a 15% discount to each individual product in the cart.
                        Great for product-specific promotions!
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
                        When you create a <strong>Shipping discount</strong>, this app automatically reduces shipping costs by 50% for eligible orders.
                        Boosts conversion rates by reducing shipping costs!
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Pro Tips */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                💡 Pro Tips
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>🎯 Combine with conditions:</strong> Set up your discount with conditions (minimum order value, customer groups, etc.) and the app will respect those rules.
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>📅 Use scheduling:</strong> Schedule your discounts to start and end at specific times for better campaign management.
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>👥 Customer targeting:</strong> Target specific customer groups or segments with your discount conditions.
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>📊 Monitor performance:</strong> Check your discount analytics in Shopify to see how well your campaigns are performing.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Troubleshooting Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🔧 Troubleshooting
              </Text>
              
              <Stack vertical spacing="loose">
                <Text variant="bodyMd" as="p">
                  <strong>Discount not showing in cart?</strong> Here are common solutions:
                </Text>
                
                <List type="bullet">
                  <List.Item>
                    <strong>Check discount activation:</strong> Make sure your discount is active and not expired
                  </List.Item>
                  <List.Item>
                    <strong>Verify function selection:</strong> Ensure you selected "DFN Discount App" as the discount function
                  </List.Item>
                  <List.Item>
                    <strong>Check conditions:</strong> Verify that your cart meets the discount conditions (minimum order value, customer groups, etc.)
                  </List.Item>
                  <List.Item>
                    <strong>Clear cart cache:</strong> Try refreshing the cart page or clearing browser cache
                  </List.Item>
                  <List.Item>
                    <strong>Test with simple cart:</strong> Try adding just one product to see if the discount applies
                  </List.Item>
                </List>
                
                <Text variant="bodyMd" as="p">
                  <strong>Still not working?</strong> Check the browser console for any error messages and ensure your discount function is properly deployed.
                </Text>
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
                <p>You now have all the information you need! Click the button below to start creating your first discount with the DFN Discount App.</p>
              </Banner>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  size="large"
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-shop-staging/discounts", "_blank")}
                >
                  🎯 Create My First Discount
                </Button>
                <Button 
                  size="large"
                  onClick={() => window.open("https://help.shopify.com/en/manual/discounts", "_blank")}
                >
                  📚 Shopify Discount Help
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Support Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🆘 Need Help?
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Documentation:</strong> Check Shopify's official discount documentation for detailed information about creating discounts.
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>App Support:</strong> If you encounter issues with the discount function, contact our support team.
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Testing:</strong> Test your discounts with a test order to ensure they're working correctly.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
