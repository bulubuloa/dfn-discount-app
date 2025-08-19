import {
  Page,
  Layout,
  Card,
  Text,
  Stack,
  TextField,
  Select,
  Button,
  FormLayout,
  Banner,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

export default function Config() {
  const [config, setConfig] = useState({
    orderDiscountPercent: 20,
    productDiscountPercent: 15,
    shippingDiscountPercent: 50,
    minimumOrderAmount: 0,
    discountClasses: ["ORDER", "PRODUCT", "SHIPPING"],
  });

  const handleConfigChange = useCallback((field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(() => {
    // Save configuration to Shopify
    if (window.shopify && window.shopify.config) {
      window.shopify.config.close();
    }
  }, []);

  const discountClassOptions = [
    { label: "Order Discount", value: "ORDER" },
    { label: "Product Discount", value: "PRODUCT" },
    { label: "Shipping Discount", value: "SHIPPING" },
  ];

  return (
    <Page title="Configure DFN Discount App">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Banner
                title="Configure Your Discount Function"
                tone="info"
              >
                <p>Set up your discount percentages and conditions. These settings will be used when the discount function runs.</p>
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
                />
                
                <TextField
                  label="Minimum Order Amount"
                  type="number"
                  value={config.minimumOrderAmount.toString()}
                  onChange={(value) => handleConfigChange('minimumOrderAmount', parseFloat(value) || 0)}
                  prefix="$"
                  min={0}
                  helpText="Minimum order value to qualify for discount (0 = no minimum)"
                />
                
                <Select
                  label="Discount Classes"
                  options={discountClassOptions}
                  value={config.discountClasses}
                  onChange={(value) => handleConfigChange('discountClasses', value)}
                  helpText="Types of discounts this function can apply"
                  multiple
                />
              </FormLayout>
              
              <Stack distribution="trailing">
                <Button primary onClick={handleSave}>
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
