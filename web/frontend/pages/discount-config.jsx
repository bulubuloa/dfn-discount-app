import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Stack,
  Badge,
  Button,
  FormLayout,
  Checkbox,
  Select,
  TextField,
  Banner,
  Divider,
} from "@shopify/polaris";

export default function DiscountConfig() {
  const [discountClasses, setDiscountClasses] = useState({
    order: true,
    product: false,
    shipping: false,
  });
  
  const [discountPercentage, setDiscountPercentage] = useState("50");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");

  const handleDiscountClassChange = (key, checked) => {
    setDiscountClasses(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSave = () => {
    // This would typically save the configuration
    console.log("Saving discount configuration:", {
      discountClasses,
      discountPercentage,
      minimumOrderAmount,
      usageLimit
    });
    
    // For Shopify Function configuration, we need to return the configuration
    // This will be handled by Shopify's function configuration system
    const config = {
      discountClasses: Object.keys(discountClasses).filter(key => discountClasses[key]),
      discountPercentage: parseInt(discountPercentage),
      minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null
    };
    
    // If we're in a Shopify Function configuration context
    if (window.shopify && window.shopify.config) {
      window.shopify.config.save(config);
    } else {
      // Fallback for direct access
      console.log("Configuration saved:", config);
      alert("Configuration saved! You can now create your discount.");
    }
  };

  return (
    <Page
      title="Configure DFN Discount Function"
      subtitle="Set up your 50% discount function"
      backAction={{
        content: "Back to Discounts",
        onAction: () => {
          if (window.shopify && window.shopify.config) {
            window.shopify.config.close();
          }
        },
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner title="Function Configuration" tone="info">
            <p>Configure how your discount function will work. This function applies discounts to customer carts.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                Discount Classes
              </Text>
              
              <FormLayout>
                <Checkbox
                  label="Order Discount (50% off entire order)"
                  checked={discountClasses.order}
                  onChange={(checked) => handleDiscountClassChange('order', checked)}
                  helpText="Applies discount to the entire order subtotal"
                />
                
                <Checkbox
                  label="Product Discount (50% off individual items)"
                  checked={discountClasses.product}
                  onChange={(checked) => handleDiscountClassChange('product', checked)}
                  helpText="Applies discount to each cart item individually"
                />
                
                <Checkbox
                  label="Shipping Discount (Free shipping)"
                  checked={discountClasses.shipping}
                  onChange={(checked) => handleDiscountClassChange('shipping', checked)}
                  helpText="Provides 100% free shipping"
                />
              </FormLayout>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                Discount Settings
              </Text>
              
              <FormLayout>
                <TextField
                  label="Discount Percentage"
                  value={discountPercentage}
                  onChange={setDiscountPercentage}
                  suffix="%"
                  type="number"
                  min="1"
                  max="100"
                  helpText="Percentage discount to apply (currently fixed at 50%)"
                  disabled
                />
                
                <TextField
                  label="Minimum Order Amount (optional)"
                  value={minimumOrderAmount}
                  onChange={setMinimumOrderAmount}
                  prefix="$"
                  type="number"
                  min="0"
                  step="0.01"
                  helpText="Minimum order amount required for discount"
                />
                
                <TextField
                  label="Usage Limit (optional)"
                  value={usageLimit}
                  onChange={setUsageLimit}
                  type="number"
                  min="1"
                  helpText="Maximum number of times this discount can be used"
                />
              </FormLayout>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                Function Summary
              </Text>
              
              <Stack vertical spacing="tight">
                {discountClasses.order && (
                  <Text variant="bodyMd">
                    ✅ <strong>Order Discount:</strong> 50% off entire order
                  </Text>
                )}
                {discountClasses.product && (
                  <Text variant="bodyMd">
                    ✅ <strong>Product Discount:</strong> 50% off each item
                  </Text>
                )}
                {discountClasses.shipping && (
                  <Text variant="bodyMd">
                    ✅ <strong>Shipping Discount:</strong> Free shipping
                  </Text>
                )}
                {!discountClasses.order && !discountClasses.product && !discountClasses.shipping && (
                  <Text variant="bodyMd" tone="subdued">
                    No discount classes selected. Please select at least one.
                  </Text>
                )}
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack distribution="trailing" spacing="tight">
              <Button
                onClick={() => {
                  if (window.shopify && window.shopify.config) {
                    window.shopify.config.close();
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                primary
                onClick={handleSave}
                disabled={!discountClasses.order && !discountClasses.product && !discountClasses.shipping}
              >
                Save Configuration
              </Button>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
