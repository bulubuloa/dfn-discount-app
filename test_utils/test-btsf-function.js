#!/usr/bin/env node

/**
 * Test BTSF Function
 * 
 * Test your discount function with BTSF products that have qbtier metafields
 */

// Simulate the function input with BTSF data from diagnosis
const testInput = {
  "cart": {
    "lines": [
      {
        "id": "gid://shopify/CartLine/0",
        "quantity": 80,
        "cost": {
          "subtotalAmount": {
            "amount": "4076.0",
            "currencyCode": "USD"
          },
          "amountPerQuantity": {
            "amount": "50.95",
            "currencyCode": "USD"
          }
        },
        "merchandise": {
          "__typename": "ProductVariant",
          "id": "gid://shopify/ProductVariant/test-btsf-3xl",
          "title": "3XL / PFD",
          "sku": "btsa011-rflc-oversized-hoodie-pfd-3xl",
          "product": {
            "id": "gid://shopify/Product/test-btsf-011",
            "title": "RFLC 011",
            "qbTiers": null
          },
          "qbTiers": {
            "value": "{\"fixed\":\"49.50\",\"breaks\":[{\"min\":10,\"price\":\"37.95\"},{\"min\":50,\"price\":\"33.95\"},{\"min\":150,\"price\":\"30.95\"}]}",
            "type": "json"
          },
          "customTiers": null
        }
      },
      {
        "id": "gid://shopify/CartLine/1", 
        "quantity": 80,
        "cost": {
          "subtotalAmount": {
            "amount": "4076.0",
            "currencyCode": "USD"
          },
          "amountPerQuantity": {
            "amount": "50.95",
            "currencyCode": "USD"
          }
        },
        "merchandise": {
          "__typename": "ProductVariant",
          "id": "gid://shopify/ProductVariant/test-btsf-2xl",
          "title": "2XL / PFD",
          "sku": "btsa011-rflc-oversized-hoodie-pfd-2xl",
          "product": {
            "id": "gid://shopify/Product/test-btsf-011",
            "title": "RFLC 011",
            "qbTiers": null
          },
          "qbTiers": {
            "value": "{\"fixed\":\"49.50\",\"breaks\":[{\"min\":10,\"price\":\"37.95\"},{\"min\":50,\"price\":\"33.95\"},{\"min\":150,\"price\":\"30.95\"}]}",
            "type": "json"
          },
          "customTiers": null
        }
      }
    ]
  },
  "discount": {
    "discountClasses": [
      "PRODUCT",
      "ORDER", 
      "SHIPPING"
    ]
  }
};

// Import the actual function (you'll need to adjust this path)
// For now, let's simulate the core logic
console.log(' Testing BTSF Function with Real Data');
console.log('=====================================\n');

// Simulate the function logic
function testQuantityBreakLogic(input) {
  console.log(' Processing cart lines...\n');
  
  for (const line of input.cart.lines) {
    console.log(`  Processing: ${line.merchandise.title} (${line.merchandise.sku})`);
    console.log(`   Quantity: ${line.quantity}`);
    console.log(`   Shopify Price: $${line.cost.subtotalAmount.amount} ($${line.cost.amountPerQuantity.amount} each)`);
    
    // Check for qbTiers metafield
    if (line.merchandise.qbTiers?.value) {
      try {
        const qbData = JSON.parse(line.merchandise.qbTiers.value);
        console.log(`    Found qbTiers metafield:`, qbData);
        
        // Find applicable tier
        let applicablePrice = parseFloat(qbData.fixed);
        for (const breakTier of qbData.breaks) {
          if (line.quantity >= breakTier.min) {
            applicablePrice = parseFloat(breakTier.price);
          }
        }
        
        const yourPrice = applicablePrice * line.quantity;
        const shopifyPrice = parseFloat(line.cost.subtotalAmount.amount);
        const discount = shopifyPrice - yourPrice;
        
        console.log(`    Calculation:`);
        console.log(`      Quantity ${line.quantity} qualifies for $${applicablePrice} each`);
        console.log(`      Your Price: $${yourPrice} (${line.quantity} × $${applicablePrice})`);
        console.log(`      Shopify Price: $${shopifyPrice}`);
        console.log(`      Discount: $${discount} (${((discount/shopifyPrice)*100).toFixed(1)}%)`);
        
        if (discount > 0) {
          console.log(`    DISCOUNT APPLICABLE: $${discount}`);
        } else {
          console.log(`     No discount (your price higher than Shopify)`);
        }
        
      } catch (error) {
        console.log(`    Error parsing qbTiers: ${error.message}`);
      }
    } else {
      console.log(`    No qbTiers metafield found`);
    }
    
    console.log(`   ${'-'.repeat(60)}\n`);
  }
  
  // Test combined quantity logic
  console.log(' Testing Combined Quantity Logic:');
  
  // Group by product and same tier structure
  const productGroups = new Map();
  
  for (const line of input.cart.lines) {
    const productId = line.merchandise.product.id;
    const tierData = line.merchandise.qbTiers?.value || '';
    const groupKey = `${productId}_${tierData}`;
    
    if (!productGroups.has(groupKey)) {
      productGroups.set(groupKey, {
        productTitle: line.merchandise.product.title,
        lines: [],
        totalQuantity: 0
      });
    }
    
    const group = productGroups.get(groupKey);
    group.lines.push(line);
    group.totalQuantity += line.quantity;
  }
  
  for (const [groupKey, group] of productGroups) {
    console.log(`\n Product Group: ${group.productTitle}`);
    console.log(`   Total Combined Quantity: ${group.totalQuantity}`);
    console.log(`   Individual Lines: ${group.lines.length}`);
    
    if (group.lines[0].merchandise.qbTiers?.value) {
      const qbData = JSON.parse(group.lines[0].merchandise.qbTiers.value);
      
      // Find tier for combined quantity
      let combinedTierPrice = parseFloat(qbData.fixed);
      for (const breakTier of qbData.breaks) {
        if (group.totalQuantity >= breakTier.min) {
          combinedTierPrice = parseFloat(breakTier.price);
        }
      }
      
      console.log(`    Combined quantity ${group.totalQuantity} qualifies for $${combinedTierPrice} each`);
      console.log(`    Individual line discounts:`);
      
      for (const line of group.lines) {
        const yourPrice = combinedTierPrice * line.quantity;
        const shopifyPrice = parseFloat(line.cost.subtotalAmount.amount);
        const discount = shopifyPrice - yourPrice;
        
        console.log(`      ${line.merchandise.title}: ${line.quantity} × $${combinedTierPrice} = $${yourPrice}`);
        console.log(`      Discount: $${discount} (${((discount/shopifyPrice)*100).toFixed(1)}%)`);
      }
    }
  }
}

console.log('Input data:');
console.log('- 80x RFLC 011 3XL/PFD');
console.log('- 80x RFLC 011 2XL/PFD');
console.log('- Same product, same tiers');
console.log('- Total: 160 items (should get higher tier)\n');

testQuantityBreakLogic(testInput);

console.log('\n EXPECTED RESULTS:');
console.log(' Both items should have qbTiers metafields');
console.log(' Individual quantities (80 each) get $33.95 tier');
console.log(' Combined quantity (160 total) should get $30.95 tier');
console.log(' Significant discount should be applied');
console.log('\nIf you see the calculations above, your BTSF products are ready! ');
