import { Page, Layout, Card, Text } from "@shopify/polaris";

export default function Test() {
  return (
    <Page title="Test Page">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text variant="headingMd" as="h3">
              Test Page Working!
            </Text>
            <Text variant="bodyMd" as="p">
              If you can see this, routing is working correctly.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
