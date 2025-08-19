import React, { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Stack,
  TextField,
  Button,
  FormLayout,
  Banner,
} from "@shopify/polaris";

// Type declaration for Shopify window object
declare global {
  interface Window {
    shopify?: {
      config?: {
        save: (config: any) => Promise<void>;
        close: () => void;
      };
    };
  }
}

export default function Config() {
  const [config, setConfig] = useState({
    orderDiscountPercent: 20,
    productDiscountPercent: 15,
    shippingDiscountPercent: 50,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check if we're in Shopify's config context
  useEffect(() => {
    if (window.shopify && window.shopify.config) {
      console.log("In Shopify config context");
    }
  }, []);

  const handleConfigChange = useCallback((field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Save configuration to Shopify
      if (window.shopify && window.shopify.config) {
        // Convert config to the format Shopify expects
        const shopifyConfig = {
          orderDiscountPercent: config.orderDiscountPercent,
          productDiscountPercent: config.productDiscountPercent,
          shippingDiscountPercent: config.shippingDiscountPercent,
        };
        
        console.log("Saving configuration:", shopifyConfig);
        
        // Save the configuration
        await window.shopify.config.save(shopifyConfig);
        
        // Close the config window
        window.shopify.config.close();
      } else {
        console.log("Not in Shopify config context, saving locally");
        // For testing outside of Shopify context
        localStorage.setItem('dfn-discount-config', JSON.stringify(config));
        alert('Configuration saved! Now create a discount in Shopify and select this app.');
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert('Error saving configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const handleCancel = useCallback(() => {
    if (window.shopify && window.shopify.config) {
      window.shopify.config.close();
    }
  }, []);

  return (
    <Page title="Configure DFN Discount App">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Banner
                title="Configure Your Discount Function"
              >
                <p>Set up your discount percentages. These settings will be used when the discount function runs.</p>
              </Banner>
              
              <FormLayout>
                <Text variant="headingMd" as="h2">
                  💰 Discount Percentages
                </Text>
                
                <TextField
                  label="Order Discount Percentage"
                  type="number"
                  value={config.orderDiscountPercent.toString()}
                  onChange={(value) => handleConfigChange('orderDiscountPercent', parseInt(value) || 0)}
                  suffix="%"
                  min={0}
                  max={100}
                  helpText="Percentage off entire order subtotal"
                  autoComplete="off"
                />
                
                <TextField
                  label="Product Discount Percentage"
                  type="number"
                  value={config.productDiscountPercent.toString()}
                  onChange={(value) => handleConfigChange('productDiscountPercent', parseInt(value) || 0)}
                  suffix="%"
                  min={0}
                  max={100}
                  helpText="Percentage off individual products"
                  autoComplete="off"
                />
                
                <TextField
                  label="Shipping Discount Percentage"
                  type="number"
                  value={config.shippingDiscountPercent.toString()}
                  onChange={(value) => handleConfigChange('shippingDiscountPercent', parseInt(value) || 0)}
                  suffix="%"
                  min={0}
                  max={100}
                  helpText="Percentage off shipping costs"
                  autoComplete="off"
                />
              </FormLayout>
              
              <Stack distribution="trailing">
                <Button onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
                <Button primary onClick={handleSave} loading={isLoading}>
                  Save Configuration
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
