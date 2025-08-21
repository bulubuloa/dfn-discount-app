import {
  getProductBySku,
  hasQuantityBreakPricing,
  getQuantityBreakTiers,
  calculateTargetPrice,
  calculateShopifyTieredPrice,
  calculateQuantityBreakDiscount,
  calculateQuantityBreakDiscountPercentage,
  getApplicablePriceBreak,
} from './utils/productData';

// Test the quantity break pricing functionality
console.log('Testing Quantity Break Pricing Functionality...');
console.log('New Logic: Your Price = Price Break × Total Quantity (single price for entire quantity)');
console.log('Discount = Your Price - Shopify Price\n');

// Test with a product that has quantity breaks
const testSku = 'btsa034-mflc-jogger-pfd-xs';
const product = getProductBySku(testSku);

if (product) {
  console.log(`Product: ${product.SKU}`);
  console.log(`Fixed Price: $${product.FixedPrice}`);
  console.log(`Options: ${product.Option1Value}, ${product.Option2Value}`);
  
  // Check if product has quantity break pricing
  const hasBreaks = hasQuantityBreakPricing(testSku);
  console.log(`Has quantity break pricing: ${hasBreaks}`);
  
  if (hasBreaks) {
    // Get quantity break tiers
    const tiers = getQuantityBreakTiers(testSku);
    console.log('Quantity Break Tiers:');
    tiers.forEach((tier, index) => {
      console.log(`  Tier ${index + 1}: ${tier.quantity}+ items at $${tier.price} each`);
    });
    
    // Test different quantities
    const testQuantities = [1, 5, 10, 25, 50, 100, 150, 200];
    
    console.log('\nTesting Quantity Break Calculations:');
    testQuantities.forEach(quantity => {
      const applicablePrice = getApplicablePriceBreak(testSku, quantity);
      const yourPrice = calculateTargetPrice(testSku, quantity);
      const shopifyTieredPrice = calculateShopifyTieredPrice(testSku, quantity);
      const shopifyActualPrice = (product.FixedPrice || 0) * quantity; // Simulate Shopify's actual price
      const discountAmount = calculateQuantityBreakDiscount(testSku, quantity, shopifyActualPrice);
      const discountPercentage = calculateQuantityBreakDiscountPercentage(testSku, quantity, shopifyActualPrice);
      
      console.log(`\nQuantity: ${quantity}`);
      console.log(`  Fixed Price: $${product.FixedPrice} × ${quantity} = $${shopifyActualPrice}`);
      console.log(`  Applicable Price Break: $${applicablePrice}`);
      console.log(`  Your Price: $${yourPrice} (${quantity} × $${applicablePrice})`);
      console.log(`  Shopify Tiered Price: $${shopifyTieredPrice}`);
      console.log(`  Discount Amount: $${discountAmount.toFixed(2)}`);
      console.log(`  Discount Percentage: ${discountPercentage.toFixed(1)}%`);
      console.log(`  Final Price After Discount: $${(shopifyActualPrice - discountAmount).toFixed(2)}`);
      
      // Show the difference between approaches
      if (shopifyTieredPrice !== null && yourPrice !== null && shopifyTieredPrice !== yourPrice) {
        console.log(`  Difference: Your approach saves $${(shopifyTieredPrice - yourPrice).toFixed(2)} vs Shopify tiered pricing`);
      }
    });
  }
} else {
  console.log(`Product with SKU ${testSku} not found`);
}

// Test with a product that doesn't have quantity breaks
const testSkuNoBreaks = 'btsa006-shj-short-sleeve-pfd-xs';
const productNoBreaks = getProductBySku(testSkuNoBreaks);

if (productNoBreaks) {
  console.log(`\nProduct (No Breaks): ${productNoBreaks.SKU}`);
  console.log(`Fixed Price: $${productNoBreaks.FixedPrice}`);
  
  const hasBreaks = hasQuantityBreakPricing(testSkuNoBreaks);
  console.log(`Has quantity break pricing: ${hasBreaks}`);
  
  if (hasBreaks) {
    const tiers = getQuantityBreakTiers(testSkuNoBreaks);
    console.log('Quantity Break Tiers:');
    tiers.forEach((tier, index) => {
      console.log(`  Tier ${index + 1}: ${tier.quantity}+ items at $${tier.price} each`);
    });
  }
}

console.log('\nQuantity Break Pricing Test Completed!');
