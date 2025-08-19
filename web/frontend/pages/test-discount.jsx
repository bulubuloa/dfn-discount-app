import { useState } from "react";
import { Page, Layout, Card, Text, Stack, Button, Banner, Icon, Box, List, Spinner } from "@shopify/polaris";
import { PlayMajor, DiscountsMajor, CartMajor } from "@shopify/polaris-icons";

export default function TestDiscount() {
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
  const [result, setResult] = useState(null);

  const createDiscountAutomatically = async () => {
    setIsCreatingDiscount(true);
    setResult(null);
    
    try {
      setResult({ type: 'info', message: '🔍 Creating discount automatically using new API...' });
      
      console.log('Creating discount using new backend API...');
      
      // Get the current shop domain from the URL or session
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop') || window.location.hostname.replace('.myshopify.com', '');
      
      if (!shop) {
        throw new Error('Shop domain not found. Please access this app from within Shopify Admin.');
      }
      
      // Use the new backend API
      const response = await fetch(`https://dfn-discount-app-backend.vercel.app/api/discount-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shop
        },
        body: JSON.stringify({
          title: "DFN Test Discount",
          startsAt: new Date().toISOString(),
          discountClasses: "PRODUCT, ORDER, SHIPPING"
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success && data.summary?.discountId) {
        setResult({ 
          type: 'success', 
          message: `✅ Test discount created successfully! ID: ${data.summary.discountId}. You can now test it in your store.`,
          discountInfo: {
            id: data.summary.discountId,
            functionId: data.summary.functionId,
            workflow: data.workflow
          }
        });
      } else {
        setResult({ 
          type: 'error', 
          message: `❌ Automatic creation failed: ${data.error || 'Unknown error'}. ${data.details || ''}`,
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      setResult({ 
        type: 'error', 
        message: `❌ Error creating discount: ${error.message}`,
      });
    } finally {
      setIsCreatingDiscount(false);
    }
  };

  return (
    <Page 
      title="Test Your Discount Function"
      backAction={{ content: 'Home', url: '/' }}
    >
      <Layout>
        {/* Auto-Create Discount Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Icon source={DiscountsMajor} tone="success" />
              <Text variant="headingLg" as="h1" alignment="center">
                🚀 Auto-Create Test Discount
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                Create a test discount automatically using our new API
              </Text>
              
              {result && (
                <Banner
                  title={result.type === 'success' ? 'Success!' : result.type === 'error' ? 'Error' : 'Info'}
                  tone={result.type}
                >
                  <p>{result.message}</p>
                  {result.discountInfo && (
                    <div style={{ marginTop: '8px' }}>
                      <Text variant="bodySm" as="p">
                        <strong>Discount ID:</strong> {result.discountInfo.id}
                      </Text>
                      <Text variant="bodySm" as="p">
                        <strong>Function ID:</strong> {result.discountInfo.functionId}
                      </Text>
                    </div>
                  )}
                </Banner>
              )}
              
              <Button 
                primary 
                size="large"
                onClick={createDiscountAutomatically}
                loading={isCreatingDiscount}
                disabled={isCreatingDiscount}
              >
                {isCreatingDiscount ? (
                  <Stack alignment="center" spacing="tight">
                    <Spinner size="small" />
                    <Text>Creating Discount...</Text>
                  </Stack>
                ) : (
                  '🎯 Auto-Create Test Discount'
                )}
              </Button>
              
              <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                This will create a discount using the new API at dfn-discount-app-backend.vercel.app
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Test Instructions */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Icon source={PlayMajor} tone="success" />
              <Text variant="headingLg" as="h1" alignment="center">
                🧪 Test Your Discount Function
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                Follow these steps to verify your discount function is working correctly.
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Step-by-Step Testing */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                📋 Testing Steps
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
                        Create a Test Discount
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Use the "Auto-Create Test Discount" button above, or go to Shopify Admin → Discounts → Create discount. Choose "Order discount" and select "DFN Discount App" as the function.
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
                        Add Products to Cart
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Go to your storefront and add some products to the cart. Make sure the cart value meets any minimum requirements.
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
                        Check Cart Page
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        On the cart page, you should see the discount applied. Look for "20% OFF ENTIRE ORDER" or similar messages.
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
                        Check Browser Console
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Open browser developer tools (F12) and check the Console tab. You should see logs starting with "🎯 DFN Discount Function TRIGGERED!"
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Expected Console Logs */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🔍 Expected Console Logs
              </Text>
              
              <Text variant="bodyMd" as="p">
                When the discount function runs, you should see these logs in the browser console:
              </Text>
              
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>🎯 DFN Discount Function TRIGGERED!</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>✅ Has Order class: true</strong> (if using order discount)
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>🎉 Applying 20% order discount</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>✅ Order discount operation added</strong>
                  </Text>
                </Stack>
              </Card>
              
              <Text variant="bodyMd" as="p">
                If you don't see these logs, the function isn't being triggered. Check that:
              </Text>
              
              <List type="bullet">
                <List.Item>You selected "DFN Discount App" as the discount function</List.Item>
                <List.Item>Your discount is active and not expired</List.Item>
                <List.Item>Your cart meets any discount conditions</List.Item>
                <List.Item>The function is properly deployed</List.Item>
              </List>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Common Issues */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                ❌ Common Issues & Solutions
              </Text>
              
              <Stack vertical spacing="loose">
                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={DiscountsMajor} tone="warning" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        No Console Logs
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        <strong>Problem:</strong> Function not being triggered
                        <br />
                        <strong>Solution:</strong> Verify discount function selection and activation
                      </Text>
                    </Box>
                  </Stack>
                </Card>

                <Card sectioned>
                  <Stack alignment="center" spacing="tight">
                    <Icon source={CartMajor} tone="warning" />
                    <Box minWidth="0" flexGrow={1}>
                      <Text variant="headingSm" as="h3">
                        Discount Not Applied
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        <strong>Problem:</strong> Function runs but no discount shows
                        <br />
                        <strong>Solution:</strong> Check discount conditions and cart eligibility
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
                title="Ready to Test?"
                tone="info"
              >
                <p>Follow the steps above to test your discount function. If you encounter issues, check the console logs and refer to the troubleshooting guide.</p>
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
                  url="/getting-started"
                >
                  📖 Getting Started Guide
                </Button>
                <Button 
                  size="large"
                  url="/"
                >
                  🏠 Back to Home
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
