import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from '../generated/api';
import {
  getProductBySku,
  getProductPrice,
  hasQuantityBreakPricing,
  calculateQuantityBreakDiscount,
  calculateQuantityBreakDiscountPercentage,
  calculateTargetPrice,
  calculateShopifyTieredPrice,
  getApplicablePriceBreak,
} from './utils/productData';

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  console.log('DFN Discount Function TRIGGERED!');
  console.log('Function called with input:', JSON.stringify(input, null, 2));
  console.log('Cart lines count:', input.cart.lines.length);
  console.log('Discount classes:', input.discount.discountClasses);
  
  if (!input.cart.lines.length) {
    console.log('No cart lines found, returning empty operations');
    return {operations: []};
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  console.log('Has Order class:', hasOrderDiscountClass);
  console.log('Has Product class:', hasProductDiscountClass);

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    console.log('No discount classes found, returning empty operations');
    return {operations: []};
  }

  const operations: any[] = [];

  // Apply quantity break pricing discounts if eligible
  if (hasProductDiscountClass || hasOrderDiscountClass) {
    console.log('Processing quantity break pricing discounts');
    
    // Process each cart line and apply quantity break pricing
    const productDiscountOperations = input.cart.lines
      .map(line => {
        // Try to get SKU from the line
        const merchandise = line.merchandise as any;
        const sku = merchandise?.product?.sku || 
                   merchandise?.variant?.sku ||
                   merchandise?.variant?.product?.sku;
        
        if (!sku) {
          console.log(`No SKU found for cart line ${line.id}, skipping`);
          return null;
        }

        console.log(`Processing cart line ${line.id} with SKU: ${sku}`);
        
        // Check if product has quantity break pricing
        if (!hasQuantityBreakPricing(sku)) {
          console.log(`Product ${sku} does not have quantity break pricing, skipping`);
          return null;
        }

        // Get product info
        const product = getProductBySku(sku);
        if (!product) {
          console.log(`Product with SKU ${sku} not found in JSON data, skipping`);
          return null;
        }

        console.log(`Found product: ${product.SKU} (${product.Option2Value}) - Fixed Price: $${product.FixedPrice}`);
        
        // Get quantity and Shopify price from cart line
        const quantity = line.quantity || 1;
        const shopifyPrice = line.cost?.subtotalAmount?.amount || 0;
        
        if (shopifyPrice <= 0) {
          console.log(`Shopify price is $${shopifyPrice} for SKU ${sku}, skipping`);
          return null;
        }

        console.log(`Quantity: ${quantity}, Shopify Price: $${shopifyPrice}`);
        
        // Calculate your price (single price break for entire quantity)
        const yourPrice = calculateTargetPrice(sku, quantity);
        if (yourPrice === null) {
          console.log(`Could not calculate your price for SKU ${sku}, skipping`);
          return null;
        }

        // Calculate Shopify's tiered price for comparison
        const shopifyTieredPrice = calculateShopifyTieredPrice(sku, quantity);
        if (shopifyTieredPrice === null) {
          console.log(`Could not calculate Shopify tiered price for SKU ${sku}, skipping`);
          return null;
        }

        // Get applicable price break
        const applicablePriceBreak = getApplicablePriceBreak(sku, quantity);
        if (applicablePriceBreak === null) {
          console.log(`No applicable price break found for SKU ${sku}, skipping`);
          return null;
        }

        console.log(`Your Price: $${yourPrice} (${quantity} × $${applicablePriceBreak})`);
        console.log(`Shopify Tiered Price: $${shopifyTieredPrice}`);
        console.log(`Shopify Actual Price: $${shopifyPrice}`);
        
        // Calculate discount amount: Your Price - Shopify Price
        const discountAmount = calculateQuantityBreakDiscount(sku, quantity, shopifyPrice);
        
        if (discountAmount <= 0) {
          console.log(`No discount applicable for SKU ${sku} (discount: $${discountAmount})`);
          return null;
        }

        // Calculate discount percentage for display
        const discountPercentage = calculateQuantityBreakDiscountPercentage(sku, quantity, shopifyPrice);
        
        console.log(`Applying quantity break discount: $${discountAmount} (${discountPercentage.toFixed(1)}%) to ${product.SKU}`);
        console.log(`This gives customer the better price: ${quantity} × $${applicablePriceBreak} = $${yourPrice}`);
        
        // Create discount operation using fixed amount
        return {
          productDiscountsAdd: {
            candidates: [
              {
                message: `QUANTITY BREAK: ${quantity} items at $${applicablePriceBreak} each`,
                targets: [
                  {
                    cartLine: {
                      id: line.id,
                    },
                  },
                ],
                value: {
                  fixedAmount: {
                    amount: discountAmount.toString(),
                  },
                },
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        };
      })
      .filter(operation => operation !== null); // Remove null operations

    operations.push(...productDiscountOperations);
    console.log(`Added ${productDiscountOperations.length} quantity break discount operations`);
  }

  console.log('Final operations count:', operations.length);
  console.log('Returning operations:', JSON.stringify(operations, null, 2));
  
  return {
    operations,
  };
}
