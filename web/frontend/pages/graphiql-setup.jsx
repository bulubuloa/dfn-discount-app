import { Page, Layout, Card, Text, Stack, Button, Banner, Icon, Box, List, Badge, Tabs } from "@shopify/polaris";
import { AppsMajor, PlayMajor, DiscountsMajor, CartMajor } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";

export default function GraphiQLSetup() {
  const [selected, setSelected] = useState(0);

  const tabs = [
    {
      id: 'setup',
      content: 'Setup',
      accessibilityLabel: 'GraphiQL Setup',
      panelID: 'setup-panel',
    },
    {
      id: 'queries',
      content: 'Queries',
      accessibilityLabel: 'API Queries',
      panelID: 'queries-panel',
    },
    {
      id: 'mutations',
      content: 'Mutations',
      accessibilityLabel: 'API Mutations',
      panelID: 'mutations-panel',
    },
    {
      id: 'troubleshooting',
      content: 'Troubleshooting',
      accessibilityLabel: 'Troubleshooting',
      panelID: 'troubleshooting-panel',
    },
  ];

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    [],
  );

  const CodeBlock = ({ children }) => (
    <Card sectioned>
      <pre style={{ 
        backgroundColor: '#f6f6f7', 
        padding: '12px', 
        borderRadius: '4px',
        overflow: 'auto',
        fontSize: '14px',
        margin: 0
      }}>
        {children}
      </pre>
    </Card>
  );

  return (
    <Page 
      title="GraphiQL Interface Setup"
      backAction={{ content: 'Debug', url: '/debug' }}
    >
      <Layout>
        {/* Header */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Icon source={AppsMajor} tone="info" />
              <Text variant="headingLg" as="h1" alignment="center">
                🚀 GraphiQL Interface Setup
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" tone="subdued">
                Complete guide to using GraphiQL with Shopify Admin API for discount functions
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Main Content with Tabs */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
              {/* Setup Tab */}
              <Card.Section>
                <div id="setup-panel">
                  <Stack vertical spacing="loose">
                    <Banner tone="info">
                      <p><strong>Prerequisite:</strong> Make sure your Shopify app is running in development mode. In your terminal, you should see a message like "Press g to open GraphiQL".</p>
                    </Banner>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Stack alignment="center" spacing="tight">
                          <Badge tone="success">Step 1</Badge>
                          <Text variant="headingSm" as="h3">
                            Open GraphiQL Interface
                          </Text>
                        </Stack>
                        
                        <Stack vertical spacing="tight">
                          <Text variant="bodyMd" as="p">
                            <strong>In your terminal where the app is running:</strong>
                          </Text>
                          <Text variant="bodyMd" as="p">
                            1. Press <strong>g</strong> to open the GraphiQL interface
                          </Text>
                          <Text variant="bodyMd" as="p">
                            2. For <strong>API Version</strong>, select the latest stable release
                          </Text>
                          <Text variant="bodyMd" as="p">
                            3. You should see the GraphiQL playground in your browser
                          </Text>
                        </Stack>
                      </Stack>
                    </Card>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Stack alignment="center" spacing="tight">
                          <Badge tone="success">Step 2</Badge>
                          <Text variant="headingSm" as="h3">
                            Verify Connection
                          </Text>
                        </Stack>
                        
                        <Text variant="bodyMd" as="p">
                          <strong>Test the connection with this simple query:</strong>
                        </Text>
                        
                        <CodeBlock>
{`query {
  shop {
    name
    myshopifyDomain
  }
}`}
                        </CodeBlock>
                        
                        <Banner tone="success">
                          <p>If you see your shop information, the GraphiQL interface is working correctly!</p>
                        </Banner>
                      </Stack>
                    </Card>
                  </Stack>
                </div>
              </Card.Section>

              {/* Queries Tab */}
              <Card.Section>
                <div id="queries-panel">
                  <Stack vertical spacing="loose">
                    <Text variant="headingMd" as="h2">
                      📋 Useful Queries
                    </Text>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          Get Your Function ID
                        </Text>
                        
                        <Text variant="bodyMd" as="p">
                          <strong>This query will return all your app's functions:</strong>
                        </Text>
                        
                        <CodeBlock>
{`query {
  shopifyFunctions(first: 25) {
    nodes {
      app {
        title
      }
      apiType
      title
      id
    }
  }
}`}
                        </CodeBlock>
                        
                        <Stack vertical spacing="tight">
                          <Text variant="bodyMd" as="p">
                            <strong>Expected Response:</strong>
                          </Text>
                          <CodeBlock>
{`{
  "data": {
    "shopifyFunctions": {
      "nodes": [
        {
          "app": {
            "title": "your-app-name-here"
          },
          "apiType": "discounts",
          "title": "discount-function-js",
          "id": "YOUR_FUNCTION_ID_HERE"
        }
      ]
    }
  }
}`}
                          </CodeBlock>
                        </Stack>
                        
                        <Banner tone="warning">
                          <p><strong>Important:</strong> Copy the <code>id</code> value from the response. You'll need this for creating discounts.</p>
                        </Banner>
                      </Stack>
                    </Card>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          List Existing Discounts
                        </Text>
                        
                        <Text variant="bodyMd" as="p">
                          <strong>Check what discounts already exist in your store:</strong>
                        </Text>
                        
                        <CodeBlock>
{`query {
  discountAutomaticNodes(first: 10) {
    nodes {
      id
      title
      startsAt
      endsAt
      status
      discountClass
    }
  }
}`}
                        </CodeBlock>
                      </Stack>
                    </Card>
                  </Stack>
                </div>
              </Card.Section>

              {/* Mutations Tab */}
              <Card.Section>
                <div id="mutations-panel">
                  <Stack vertical spacing="loose">
                    <Text variant="headingMd" as="h2">
                      ⚡ Useful Mutations
                    </Text>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          Create Automatic App Discount
                        </Text>
                        
                        <Text variant="bodyMd" as="p">
                          <strong>Replace "YOUR_FUNCTION_ID_HERE" with your actual function ID:</strong>
                        </Text>
                        
                        <CodeBlock>
{`mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "Cart line, Order, Shipping discount"
      functionId: "YOUR_FUNCTION_ID_HERE"
      discountClasses: [PRODUCT, ORDER, SHIPPING]
      startsAt: "2025-01-01T00:00:00"
    }
  ) {
    automaticAppDiscount {
      discountId
      title
      status
    }
    userErrors {
      field
      message
    }
  }
}`}
                        </CodeBlock>
                        
                        <Stack vertical spacing="tight">
                          <Text variant="bodyMd" as="p">
                            <strong>Expected Success Response:</strong>
                          </Text>
                          <CodeBlock>
{`{
  "data": {
    "discountAutomaticAppCreate": {
      "automaticAppDiscount": {
        "discountId": "gid://shopify/DiscountAutomaticNode/123456789"
      },
      "userErrors": []
    }
  }
}`}
                          </CodeBlock>
                        </Stack>
                        
                        <Banner tone="success">
                          <p><strong>Success!</strong> If you see a <code>discountId</code> in the response, your discount has been created successfully.</p>
                        </Banner>
                      </Stack>
                    </Card>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          Delete a Discount
                        </Text>
                        
                        <Text variant="bodyMd" as="p">
                          <strong>To remove a discount (replace with actual discount ID):</strong>
                        </Text>
                        
                        <CodeBlock>
{`mutation {
  discountAutomaticDelete(
    id: "gid://shopify/DiscountAutomaticNode/123456789"
  ) {
    deletedDiscountAutomaticId
    userErrors {
      field
      message
    }
  }
}`}
                        </CodeBlock>
                      </Stack>
                    </Card>
                  </Stack>
                </div>
              </Card.Section>

              {/* Troubleshooting Tab */}
              <Card.Section>
                <div id="troubleshooting-panel">
                  <Stack vertical spacing="loose">
                    <Text variant="headingMd" as="h2">
                      🔧 Troubleshooting
                    </Text>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          Common Issues
                        </Text>
                        
                        <List type="bullet">
                          <List.Item>
                            <strong>GraphiQL won't open:</strong> Make sure your app is running in development mode and you're in the correct terminal window
                          </List.Item>
                          <List.Item>
                            <strong>Authentication errors:</strong> Ensure you're logged into the correct Shopify store in your browser
                          </List.Item>
                          <List.Item>
                            <strong>Function not found:</strong> Verify your function is properly deployed and the app is installed on the store
                          </List.Item>
                          <List.Item>
                            <strong>Invalid function ID:</strong> Double-check the ID format and make sure it's from the correct function
                          </List.Item>
                        </List>
                      </Stack>
                    </Card>

                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          Error Messages
                        </Text>
                        
                        <Stack vertical spacing="tight">
                          <Text variant="bodyMd" as="p">
                            <strong>If you see "userErrors" in the response:</strong>
                          </Text>
                          <CodeBlock>
{`{
  "data": {
    "discountAutomaticAppCreate": {
      "automaticAppDiscount": null,
      "userErrors": [
        {
          "field": ["functionId"],
          "message": "Function not found"
        }
      ]
    }
  }
}`}
                          </CodeBlock>
                          
                          <Text variant="bodyMd" as="p">
                            This usually means the function ID is incorrect or the function isn't properly deployed.
                          </Text>
                        </Stack>
                      </Stack>
                    </Card>
                  </Stack>
                </div>
              </Card.Section>
            </Tabs>
          </Card>
        </Layout.Section>

        {/* Action Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Banner
                title="Ready to Test?"
                tone="success"
              >
                <p>Once you've created your discount using GraphiQL, you can test it in your store and debug the function behavior.</p>
              </Banner>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  size="large"
                  url="/debug"
                >
                  🔍 Debug Function
                </Button>
                <Button 
                  size="large"
                  url="/test-discount"
                >
                  🧪 Test Discount
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
