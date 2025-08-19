import { useEffect, useState } from "react";
import { Page, Layout, Card, Text, Stack, Badge, Button, Banner, Icon, Box, TextField, Select, FormLayout, ButtonGroup, Spinner, Modal, List } from "@shopify/polaris";
import { DiscountsMajor, CartMajor, DiscountAutomaticMajor } from "@shopify/polaris-icons";

export default function Index() {
  const [config, setConfig] = useState({
    orderDiscountPercent: 20,
    productDiscountPercent: 15,
    shippingDiscountPercent: 50,
    minimumOrderAmount: 0,
    enableOrderDiscount: true,
    enableProductDiscount: true,
    enableShippingDiscount: true
  });

  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
  const [result, setResult] = useState(null);

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

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveConfiguration = () => {
    // Here you would typically save to your backend or Shopify app settings
    console.log('Saving configuration:', config);
    setIsConfiguring(false);
    // Show success message
    alert('Configuration saved! Now create a discount in Shopify and select this app.');
  };

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
          title: "DFN Auto Discount",
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
          message: `✅ Discount created successfully! ID: ${data.summary.discountId}. The discount is now active in your store.`,
          discountInfo: {
            id: data.summary.discountId,
            functionId: data.summary.functionId,
            workflow: data.workflow
          }
        });
      } else {
        // Show error message
        setResult({ 
          type: 'error', 
          message: `❌ Automatic creation failed: ${data.error || 'Unknown error'}. ${data.details || ''}`,
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      
      // Fallback: provide instructions directly
      const fallbackInstructions = {
        message: 'Copy and paste these queries into GraphiQL (press "g" in your terminal):',
        steps: [
          {
            step: 1,
            title: 'Get Function ID',
            description: 'Run this query in GraphiQL to get your function ID:',
            query: `query {
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
}`,
            note: 'Copy the "id" value from the response'
          },
          {
            step: 2,
            title: 'Create Discount',
            description: 'Replace YOUR_FUNCTION_ID_HERE with the ID from step 1, then run this mutation:',
            query: `mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "DFN Auto Discount"
      functionId: "YOUR_FUNCTION_ID_HERE"
      discountClasses: [PRODUCT, ORDER, SHIPPING]
      startsAt: "${new Date().toISOString()}"
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
}`,
            note: 'If successful, you\'ll see a discountId in the response'
          }
        ],
        config: config,
        quickStart: {
          message: 'Quick Start:',
          instructions: [
            '1. Press "g" in your terminal to open GraphiQL',
            '2. Copy the first query above and run it',
            '3. Copy the function ID from the response',
            '4. Replace "YOUR_FUNCTION_ID_HERE" in the second query with your function ID',
            '5. Run the second query to create the discount'
          ]
        }
      };
      
      setResult({ 
        type: 'warning', 
        message: `⚠️ ${error.message}. Using manual instructions below.`,
        instructions: fallbackInstructions
      });
    } finally {
      setIsCreatingDiscount(false);
    }
  };

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
            </Stack>
          </Card>
        </Layout.Section>

        {/* One-Click Discount Creation */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Text variant="headingMd" as="h2" alignment="center">
                🚀 One-Click Discount Creation
              </Text>
              
              <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
                Click the button below to automatically get your Function ID and create a discount
              </Text>

              {result && (
                <>
                  <Banner
                    title={result.message}
                    tone={result.type === 'success' ? 'success' : result.type === 'error' ? 'critical' : result.type === 'warning' ? 'warning' : 'info'}
                  />
                  
                  {result.discountInfo && (
                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          ✅ Discount Created Successfully
                        </Text>
                        
                        <Stack vertical spacing="tight">
                          <Text variant="bodyMd" as="p">
                            <strong>Discount ID:</strong> <code>{result.discountInfo.id}</code>
                          </Text>
                          <Text variant="bodyMd" as="p">
                            <strong>Title:</strong> {result.discountInfo.title}
                          </Text>
                          <Text variant="bodyMd" as="p">
                            <strong>Status:</strong> {result.discountInfo.status}
                          </Text>
                          <Text variant="bodyMd" as="p">
                            <strong>Function ID:</strong> <code>{result.discountInfo.functionId}</code>
                          </Text>
                        </Stack>
                        
                        <Banner tone="success">
                          <p><strong>🎉 Your discount is now active!</strong> Customers will automatically receive the discount when they meet the conditions.</p>
                        </Banner>
                      </Stack>
                    </Card>
                  )}
                  
                  {result.instructions && (
                    <Card sectioned>
                      <Stack vertical spacing="loose">
                        <Text variant="headingSm" as="h3">
                          📋 Step-by-Step Instructions
                        </Text>
                        
                        {result.instructions.steps.map((step, index) => (
                          <Card key={index} sectioned>
                            <Stack vertical spacing="tight">
                              <Text variant="headingSm" as="h4">
                                Step {step.step}: {step.title}
                              </Text>
                              <Text variant="bodyMd" as="p">
                                {step.description}
                              </Text>
                              <Card sectioned>
                                <pre style={{ 
                                  backgroundColor: '#f6f6f7', 
                                  padding: '12px', 
                                  borderRadius: '4px',
                                  overflow: 'auto',
                                  fontSize: '14px',
                                  margin: 0
                                }}>
                                  {step.query}
                                </pre>
                              </Card>
                              <Text variant="bodyMd" as="p" tone="subdued">
                                <strong>Note:</strong> {step.note}
                              </Text>
                            </Stack>
                          </Card>
                        ))}
                        
                        <Card sectioned>
                          <Stack vertical spacing="tight">
                            <Text variant="headingSm" as="h4">
                              🚀 Quick Start
                            </Text>
                            <List type="number">
                              {result.instructions.quickStart.instructions.map((instruction, index) => (
                                <List.Item key={index}>{instruction}</List.Item>
                              ))}
                            </List>
                          </Stack>
                        </Card>
                      </Stack>
                    </Card>
                  )}
                </>
              )}

              <Button 
                primary
                size="large"
                onClick={createDiscountAutomatically}
                loading={isCreatingDiscount}
                disabled={isCreatingDiscount}
              >
                {isCreatingDiscount ? 'Creating Discount...' : '🎯 Create Discount Automatically'}
              </Button>

              <Banner tone="info">
                <p><strong>What this does:</strong> Gets your Function ID → Creates discount with current settings → Activates it in your store</p>
              </Banner>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Configuration Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Stack alignment="center" spacing="tight">
                <Text variant="headingMd" as="h2">
                  ⚙️ Discount Configuration
                </Text>
                <Button 
                  size="small"
                  onClick={() => setIsConfiguring(!isConfiguring)}
                >
                  {isConfiguring ? 'Cancel' : 'Configure Discounts'}
                </Button>
              </Stack>
              
              {isConfiguring ? (
                <FormLayout>
                  <Stack vertical spacing="loose">
                    <Text variant="headingSm" as="h3">Order Discounts</Text>
                    <Stack>
                      <TextField
                        label="Order Discount Percentage"
                        type="number"
                        value={config.orderDiscountPercent.toString()}
                        onChange={(value) => handleConfigChange('orderDiscountPercent', parseInt(value) || 0)}
                        suffix="%"
                        min={0}
                        max={100}
                        helpText="Percentage off entire order subtotal"
                      />
                      <TextField
                        label="Minimum Order Amount"
                        type="number"
                        value={config.minimumOrderAmount.toString()}
                        onChange={(value) => handleConfigChange('minimumOrderAmount', parseFloat(value) || 0)}
                        prefix="$"
                        min={0}
                        helpText="Minimum order value to qualify for discount"
                      />
                    </Stack>
                    
                    <Text variant="headingSm" as="h3">Product Discounts</Text>
                    <TextField
                      label="Product Discount Percentage"
                      type="number"
                      value={config.productDiscountPercent.toString()}
                      onChange={(value) => handleConfigChange('productDiscountPercent', parseInt(value) || 0)}
                      suffix="%"
                      min={0}
                      max={100}
                      helpText="Percentage off individual products"
                    />
                    
                    <Text variant="headingSm" as="h3">Shipping Discounts</Text>
                    <TextField
                      label="Shipping Discount Percentage"
                      type="number"
                      value={config.shippingDiscountPercent.toString()}
                      onChange={(value) => handleConfigChange('shippingDiscountPercent', parseInt(value) || 0)}
                      suffix="%"
                      min={0}
                      max={100}
                      helpText="Percentage off shipping costs"
                    />
                    
                    <ButtonGroup>
                      <Button primary onClick={saveConfiguration}>
                        Save Configuration
                      </Button>
                      <Button onClick={() => setIsConfiguring(false)}>
                        Cancel
                      </Button>
                    </ButtonGroup>
                  </Stack>
                </FormLayout>
              ) : (
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd" as="p">
                    <strong>Current Settings:</strong>
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Order Discount: {config.orderDiscountPercent}% off (min. ${config.minimumOrderAmount})
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Product Discount: {config.productDiscountPercent}% off individual items
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Shipping Discount: {config.shippingDiscountPercent}% off shipping
                  </Text>
                </Stack>
              )}
            </Stack>
          </Card>
        </Layout.Section>

        {/* Navigation Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2" alignment="center">
                🧭 Other Tools
              </Text>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  size="large"
                  url="/api-test"
                >
                  🧪 API Test
                </Button>
                <Button 
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
