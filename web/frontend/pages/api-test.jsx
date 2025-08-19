import { useState } from "react";
import { Page, Layout, Card, Text, Stack, Button, Banner, Icon, Box, Spinner, CodeBlock, List } from "@shopify/polaris";
import { DiscountsMajor, PlayMajor, CircleTickMajor, CircleCancelMajor } from "@shopify/polaris-icons";

export default function ApiTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const testApiConnection = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    try {
      console.log('Testing API connection...');
      
      // Get the current shop domain from the URL or session
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop') || window.location.hostname.replace('.myshopify.com', '');
      
      if (!shop) {
        throw new Error('Shop domain not found. Please access this app from within Shopify Admin.');
      }
      
      // Test the API connection
      const response = await fetch(`https://dfn-discount-app-backend.vercel.app/api/test-graphql`, {
        method: 'GET',
        headers: {
          'X-Shopify-Shop-Domain': shop
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setTestResults({ 
          type: 'success', 
          message: '✅ API connection successful!',
          data: data
        });
      } else {
        setTestResults({ 
          type: 'error', 
          message: `❌ API test failed: ${data.error || 'Unknown error'}`,
          data: data
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      setTestResults({ 
        type: 'error', 
        message: `❌ Error testing API: ${error.message}`,
        error: error
      });
    } finally {
      setIsTesting(false);
    }
  };

  const createTestDiscount = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    try {
      console.log('Creating test discount...');
      
      // Get the current shop domain from the URL or session
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop') || window.location.hostname.replace('.myshopify.com', '');
      
      if (!shop) {
        throw new Error('Shop domain not found. Please access this app from within Shopify Admin.');
      }
      
      // Create a test discount
      const response = await fetch(`https://dfn-discount-app-backend.vercel.app/api/discount-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shop
        },
        body: JSON.stringify({
          title: "API Test Discount",
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
        setTestResults({ 
          type: 'success', 
          message: `✅ Test discount created successfully! ID: ${data.summary.discountId}`,
          data: data
        });
      } else {
        setTestResults({ 
          type: 'error', 
          message: `❌ Discount creation failed: ${data.error || 'Unknown error'}`,
          data: data
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      setTestResults({ 
        type: 'error', 
        message: `❌ Error creating discount: ${error.message}`,
        error: error
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Page 
      title="API Test - New Backend"
      backAction={{ content: 'Home', url: '/' }}
    >
      <Layout>
        {/* API Test Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Icon source={DiscountsMajor} tone="success" />
              <Text variant="headingLg" as="h1" alignment="center">
                🧪 API Test - New Backend
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                Test the connection to the new API at dfn-discount-app-backend.vercel.app
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Test Buttons */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Text variant="headingMd" as="h2">
                🔍 Test API Connection
              </Text>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  size="large"
                  onClick={testApiConnection}
                  loading={isTesting}
                  disabled={isTesting}
                  icon={PlayMajor}
                >
                  Test API Connection
                </Button>
                
                <Button 
                  size="large"
                  onClick={createTestDiscount}
                  loading={isTesting}
                  disabled={isTesting}
                  icon={DiscountsMajor}
                >
                  Create Test Discount
                </Button>
              </Stack>
              
              <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                These tests will use the new API at https://dfn-discount-app-backend.vercel.app/
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Results */}
        {testResults && (
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                <Banner
                  title={testResults.type === 'success' ? 'Success!' : 'Error'}
                  tone={testResults.type}
                  icon={testResults.type === 'success' ? CircleTickMajor : CircleCancelMajor}
                >
                  <p>{testResults.message}</p>
                </Banner>
                
                {testResults.data && (
                  <Box>
                    <Text variant="headingSm" as="h3">
                      API Response:
                    </Text>
                    <CodeBlock>
                      {JSON.stringify(testResults.data, null, 2)}
                    </CodeBlock>
                  </Box>
                )}
                
                {testResults.error && (
                  <Box>
                    <Text variant="headingSm" as="h3">
                      Error Details:
                    </Text>
                    <CodeBlock>
                      {JSON.stringify(testResults.error, null, 2)}
                    </CodeBlock>
                  </Box>
                )}
              </Stack>
            </Card>
          </Layout.Section>
        )}

        {/* API Information */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                📋 API Endpoints
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Base URL:</strong> https://dfn-discount-app-backend.vercel.app
                </Text>
                
                <Text variant="bodyMd" as="p">
                  <strong>Available Endpoints:</strong>
                </Text>
                
                <List type="bullet">
                  <List.Item>
                    <strong>GET /api/health</strong> - Health check
                  </List.Item>
                  <List.Item>
                    <strong>GET /api/test-graphql</strong> - Test GraphQL connection
                  </List.Item>
                  <List.Item>
                    <strong>GET /api/shopify-functions</strong> - Get function ID
                  </List.Item>
                  <List.Item>
                    <strong>POST /api/create-discount-automatic</strong> - Create discount with function ID
                  </List.Item>
                  <List.Item>
                    <strong>POST /api/discount-workflow</strong> - Complete workflow (get ID + create discount)
                  </List.Item>
                </List>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Action Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Banner
                title="API Testing Complete"
                tone="info"
              >
                <p>Use the buttons above to test the new API connection and create test discounts automatically.</p>
              </Banner>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  size="large"
                  url="/test-discount"
                >
                  🧪 Test Discount Page
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
