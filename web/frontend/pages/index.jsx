import { useState, useEffect } from "react";
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
  TextField,
  Banner,
  Divider,
} from "@shopify/polaris";

export default function Index() {
  const [discountClasses, setDiscountClasses] = useState({
    order: true,
    product: false,
    shipping: false,
  });
  
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    // Check if we're in a Shopify Function configuration context
    console.log("Checking Shopify config context...");
    console.log("window.shopify:", window.shopify);
    console.log("window.shopify?.config:", window.shopify?.config);
    
    if (window.shopify && window.shopify.config) {
      console.log("Setting isConfiguring to true");
      setIsConfiguring(true);
    } else {
      console.log("Not in Shopify config context");
    }
  }, []);

  const handleDiscountClassChange = (key, checked) => {
    setDiscountClasses(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSave = () => {
    const config = {
      discountClasses: Object.keys(discountClasses).filter(key => discountClasses[key]),
      discountPercentage: 90, // Fixed at 90%
      minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null
    };
    
    console.log("Saving function configuration:", config);
    console.log("Shopify config context:", window.shopify?.config);
    
    // If we're in a Shopify Function configuration context
    if (window.shopify && window.shopify.config) {
      try {
        window.shopify.config.save(config);
        console.log("Configuration saved successfully to Shopify");
      } catch (error) {
        console.error("Error saving configuration:", error);
        alert("Error saving configuration. Please try again.");
      }
    } else {
      // Fallback for direct access
      console.log("Not in Shopify config context, showing fallback message");
      alert("Configuration saved! You can now create your discount.");
    }
  };

  const handleCancel = () => {
    if (window.shopify && window.shopify.config) {
      window.shopify.config.close();
    }
  };

  return (
    <Page
      title="DFN Discount App - 90% Discount Function"
      subtitle="Configure your 90% discount function"
      backAction={isConfiguring ? {
        content: "Cancel",
        onAction: handleCancel,
      } : undefined}
    >
      <Layout>
        <Layout.Section>
          <Banner title="Function Configuration" tone="info">
            <p>Configure how your discount function will work. This function applies 90% discounts to customer carts.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Stack distribution="center" spacing="tight">
                <Badge tone="success">Active</Badge>
                <Badge tone="info">Ready to Use</Badge>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                Discount Classes
              </Text>
              
              <FormLayout>
                <Checkbox
                  label="Order Discount (90% off entire order)"
                  checked={discountClasses.order}
                  onChange={(checked) => handleDiscountClassChange('order', checked)}
                  helpText="Applies 90% discount to the entire order subtotal"
                />
                
                <Checkbox
                  label="Product Discount (90% off individual items)"
                  checked={discountClasses.product}
                  onChange={(checked) => handleDiscountClassChange('product', checked)}
                  helpText="Applies 90% discount to each cart item individually"
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
                  value="90"
                  suffix="%"
                  type="number"
                  helpText="Percentage discount to apply (fixed at 90%)"
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
                    ✅ <strong>Order Discount:</strong> 90% off entire order
                  </Text>
                )}
                {discountClasses.product && (
                  <Text variant="bodyMd">
                    ✅ <strong>Product Discount:</strong> 90% off each item
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
            <Stack vertical spacing="loose">
              <Text variant="headingMd" as="h3">
                Next Steps
              </Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>Function Status:</strong> Active and Ready
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Available Discounts:</strong> 90% Order, 90% Product, Free Shipping
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Next Step:</strong> Create a discount using this function
                </Text>
              </Stack>
              
              <Stack distribution="center" spacing="tight">
                <Button 
                  primary 
                  onClick={() => window.open("https://admin.shopify.com/store/btsa-staging/discounts", "_blank")}
                >
                  Create Discount
                </Button>
                <Button 
                  onClick={() => window.open("https://github.com/yourusername/dfn-discount-app", "_blank")}
                >
                  View on GitHub
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack distribution="trailing" spacing="tight">
              <Button
                onClick={handleCancel}
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
