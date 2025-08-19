import { useEffect, useState } from "react";
import { Page, Layout, Card, Text, Stack, Badge, Button, Banner, Icon, Box, TextField, Select, FormLayout, ButtonGroup, Spinner, Modal } from "@shopify/polaris";
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
  const [functionId, setFunctionId] = useState(null);
  const [isLoadingFunctionId, setIsLoadingFunctionId] = useState(false);
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
  const [showCreateDiscountModal, setShowCreateDiscountModal] = useState(false);
  const [discountTitle, setDiscountTitle] = useState("DFN Auto Discount");
  const [discountMessage, setDiscountMessage] = useState("🎉 Special discount applied automatically!");
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

  const getFunctionId = async () => {
    setIsLoadingFunctionId(true);
    try {
      const response = await fetch('/api/get-function-id', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFunctionId(data.functionId);
      setResult({ type: 'success', message: `✅ Function ID retrieved: ${data.functionId}` });
    } catch (error) {
      console.error('Error getting function ID:', error);
      setResult({ type: 'error', message: `❌ Error getting Function ID: ${error.message}` });
    } finally {
      setIsLoadingFunctionId(false);
    }
  };

  const createDiscount = async () => {
    if (!functionId) {
      setResult({ type: 'error', message: '❌ Please get the Function ID first!' });
      return;
    }

    setIsCreatingDiscount(true);
    try {
      const response = await fetch('/api/create-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionId,
          title: discountTitle,
          message: discountMessage,
          config
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult({ type: 'success', message: `✅ Discount created successfully! ID: ${data.discountId}` });
      setShowCreateDiscountModal(false);
    } catch (error) {
      console.error('Error creating discount:', error);
      setResult({ type: 'error', message: `❌ Error creating discount: ${error.message}` });
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

        {/* Function ID & Discount Creation Section */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h2">
                🚀 Quick Setup - Get Function ID & Create Discount
              </Text>
              
              <Text variant="bodyMd" as="p" tone="subdued">
                Use these buttons to automatically get your Function ID and create a discount programmatically.
              </Text>

              {result && (
                <Banner
                  title={result.message}
                  tone={result.type === 'success' ? 'success' : 'critical'}
                />
              )}

              <Stack distribution="center" spacing="tight">
                <Button 
                  size="small"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test');
                      const data = await response.json();
                      setResult({ type: 'success', message: `✅ Test API: ${data.message}` });
                    } catch (error) {
                      setResult({ type: 'error', message: `❌ Test API failed: ${error.message}` });
                    }
                  }}
                >
                  🧪 Test API
                </Button>
                
                <Button 
                  primary
                  size="large"
                  onClick={getFunctionId}
                  loading={isLoadingFunctionId}
                  disabled={isLoadingFunctionId}
                >
                  🔍 Get Function ID
                </Button>
                
                <Button 
                  size="large"
                  onClick={() => setShowCreateDiscountModal(true)}
                  disabled={!functionId}
                >
                  🎯 Create Discount Automatically
                </Button>
              </Stack>

              {functionId && (
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Text variant="headingSm" as="h3">
                      ✅ Function ID Retrieved
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Function ID:</strong> <code>{functionId}</code>
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      This ID is now ready to use for creating discounts. Click "Create Discount Automatically" above to proceed.
                    </Text>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
      {/* Create Discount Modal */}
      <Modal
        open={showCreateDiscountModal}
        onClose={() => setShowCreateDiscountModal(false)}
        title="Create Automatic Discount"
        primaryAction={{
          content: 'Create Discount',
          onAction: createDiscount,
          loading: isCreatingDiscount,
          disabled: isCreatingDiscount
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowCreateDiscountModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Stack vertical spacing="loose">
            <Text variant="bodyMd" as="p">
              Configure your automatic discount settings:
            </Text>
            
            <TextField
              label="Discount Title"
              value={discountTitle}
              onChange={setDiscountTitle}
              helpText="This will be the name of your discount in Shopify"
            />
            
            <TextField
              label="Discount Message"
              value={discountMessage}
              onChange={setDiscountMessage}
              helpText="Message shown to customers when discount is applied"
            />
            
            <Card sectioned>
              <Stack vertical spacing="tight">
                <Text variant="headingSm" as="h3">
                  Discount Configuration
                </Text>
                <Text variant="bodyMd" as="p">
                  • Order Discount: {config.orderDiscountPercent}% off
                </Text>
                <Text variant="bodyMd" as="p">
                  • Product Discount: {config.productDiscountPercent}% off
                </Text>
                <Text variant="bodyMd" as="p">
                  • Shipping Discount: {config.shippingDiscountPercent}% off
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  These settings will be applied to all qualifying carts automatically.
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
