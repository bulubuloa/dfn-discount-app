import { Page, Layout, Card, Text, Stack, Button, Banner, Icon, Box, List } from "@shopify/polaris";
import { PlayMajor, DiscountsMajor, CartMajor } from "@shopify/polaris-icons";

export default function Debug() {
  return (
    <Page 
      title="Debug Your Discount Function"
      backAction={{ content: 'Home', url: '/' }}
    >
      <Layout>
        {/* Debug Instructions */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Icon source={PlayMajor} tone="success" />
              <Text variant="headingLg" as="h1" alignment="center">
                🔍 Debug Your Discount Function
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                Learn how to verify if your discount function is being triggered and troubleshoot issues.
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* How to Check if Function is Triggered */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🎯 How to Verify Function is Triggered
              </Text>
              
              <Stack vertical spacing="loose">
                <Text variant="bodyMd" as="p">
                  <strong>Step 1:</strong> Open your storefront in a browser
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 2:</strong> Open Developer Tools (F12 or right-click → Inspect)
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 3:</strong> Go to the Console tab
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 4:</strong> Add products to cart and go to cart page
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Step 5:</strong> Look for logs starting with "🎯 DFN Discount Function TRIGGERED!"
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Expected Logs */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                📋 Expected Console Logs
              </Text>
              
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>🎯 DFN Discount Function TRIGGERED!</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>Function called with input: {...}</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>Cart lines count: X</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>Discount classes: ["ORDER"]</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>✅ Has Order class: true</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>🎉 Applying 20% order discount</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>✅ Order discount operation added</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>🎯 Final operations count: 1</strong>
                  </Text>
                </Stack>
              </Card>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Troubleshooting */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                ❌ If You Don't See Logs
              </Text>
              
              <Stack vertical spacing="loose">
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={DiscountsMajor} tone="warning" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Function Not Triggered
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        This means Shopify isn't calling your function. Check:
                      </Text>
                      <List type="bullet">
                        <List.Item>Did you select "DFN Discount App" as the discount function?</List.Item>
                        <List.Item>Is your discount active and not expired?</List.Item>
                        <List.Item>Does your cart meet the discount conditions?</List.Item>
                        <List.Item>Is the function properly deployed?</List.Item>
                      </List>
                    </Box>
                  </Stack>
                </Card>

                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={CartMajor} tone="warning" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Function Runs But No Discount
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        You see logs but no discount appears. Check:
                      </Text>
                      <List type="bullet">
                        <List.Item>Are the discount percentages reasonable (not too high)?</List.Item>
                        <List.Item>Does the cart meet minimum order requirements?</List.Item>
                        <List.Item>Are there any error messages in the logs?</List.Item>
                        <List.Item>Try refreshing the cart page</List.Item>
                      </List>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Quick Test */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🧪 Quick Test Steps
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>1.</strong> Create a simple order discount in Shopify Admin
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>2.</strong> Select "DFN Discount App" as the function
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>3.</strong> Set no conditions (minimum order = $0)
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>4.</strong> Activate the discount
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>5.</strong> Go to your storefront and add any product to cart
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>6.</strong> Check browser console for logs
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
                title="Need Help?"
                tone="info"
              >
                <p>If you're still having issues after following these steps, check the getting started guide or contact support.</p>
              </Banner>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  size="large"
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-shop-staging/discounts", "_blank")}
                >
                  🎯 Create Test Discount
                </Button>
                <Button 
                  size="large"
                  url="/test-discount"
                >
                  🧪 Test Page
                </Button>
                <Button 
                  size="large"
                  url="/getting-started"
                >
                  📖 Getting Started
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
