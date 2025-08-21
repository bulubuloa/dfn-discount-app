import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from '../generated/api';
import {
  hasQuantityBreakPricingFromCartLine,
  calculateQuantityBreakDiscountFromCartLine,
  calculateQuantityBreakDiscountPercentageFromCartLine,
  calculateTargetPriceFromCartLine,
  calculateShopifyTieredPriceFromCartLine,
  getApplicablePriceBreakFromCartLine,
  getProductInfoFromCartLine,
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

  // Always process if we have cart lines, regardless of discount classes
  console.log('Processing cart lines for quantity break pricing...');
  
  const operations: any[] = [];

  // Process each cart line and collect discount candidates
  const discountCandidates: any[] = [];
  
  for (const line of input.cart.lines) {
    console.log(`Processing cart line: ${JSON.stringify(line, null, 2)}`);
    
    const productInfo = getProductInfoFromCartLine(line);
    if (!productInfo) {
      console.log(`No product info found for cart line ${line.id}, skipping`);
      continue;
    }

    console.log(`Processing cart line ${line.id} with SKU: ${productInfo.sku}`);
    console.log(`Cart line merchandise data: ${JSON.stringify(line.merchandise, null, 2)}`);
    
    const hasBreaks = hasQuantityBreakPricingFromCartLine(line);
    console.log(`Has quantity break pricing: ${hasBreaks}`);
    
    if (!hasBreaks) {
      console.log(`Cart line ${line.id} does not have quantity break metafields for SKU: ${productInfo.sku}`);
      console.log(`To enable quantity break pricing, add metafields to this product variant:`);
      console.log(`Namespace: "qbtier", Key: "tiers" with JSON value`);
      continue;
    }

    console.log(`Found product: ${productInfo.name} - Fixed Price: $${productInfo.fixedPrice}`);
    
    const quantity = line.quantity || 1;
    const shopifyPrice = line.cost?.subtotalAmount?.amount || 0;
    
    console.log(`Quantity: ${quantity}, Shopify Price: $${shopifyPrice}`);
    
    if (shopifyPrice <= 0) {
      console.log(`Shopify price is $${shopifyPrice} for cart line ${line.id}, skipping`);
      continue;
    }

    let yourPrice = calculateTargetPriceFromCartLine(line, quantity);
    if (yourPrice === null) {
      console.log(`Could not calculate your price for cart line ${line.id}, using fixed price`);
      yourPrice = productInfo.fixedPrice * quantity;
    }

    const shopifyTieredPrice = calculateShopifyTieredPriceFromCartLine(line, quantity);
    if (shopifyTieredPrice === null) {
      console.log(`Could not calculate Shopify tiered price for cart line ${line.id}, using fixed price`);
    }

    const applicablePriceBreak = getApplicablePriceBreakFromCartLine(line, quantity);
    if (applicablePriceBreak === null) {
      console.log(`No applicable price break found for cart line ${line.id}, using fixed price`);
    }

    console.log(`Your Price: $${yourPrice} (${quantity} × $${applicablePriceBreak || productInfo.fixedPrice})`);
    console.log(`Shopify Tiered Price: $${shopifyTieredPrice || shopifyPrice}`);
    console.log(`Shopify Actual Price: $${shopifyPrice}`);
    
    const discountAmount = calculateQuantityBreakDiscountFromCartLine(line, quantity, shopifyPrice);
    
    console.log(`Calculated discount amount: $${discountAmount}`);
    
    if (discountAmount <= 0) {
      console.log(`No discount applicable for cart line ${line.id} (discount: $${discountAmount})`);
      continue;
    }

    const discountPercentage = calculateQuantityBreakDiscountPercentageFromCartLine(line, quantity, shopifyPrice);
    
    console.log(`Applying quantity break discount: $${discountAmount} (${discountPercentage.toFixed(1)}%) to ${productInfo.name}`);
    console.log(`This gives customer the better price: ${quantity} × $${applicablePriceBreak || productInfo.fixedPrice} = $${yourPrice}`);
    
    // Add this line's discount as a candidate
    discountCandidates.push({
      message: `QUANTITY BREAK: ${quantity} items at $${applicablePriceBreak || productInfo.fixedPrice} each`,
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
    });
  }

  // Create a single productDiscountsAdd operation with all candidates
  if (discountCandidates.length > 0) {
    operations.push({
      productDiscountsAdd: {
        candidates: discountCandidates,
        selectionStrategy: ProductDiscountSelectionStrategy.All,
      },
    });
  }

  console.log(`Added ${discountCandidates.length} quantity break discount candidates`);
  console.log('Final operations count:', operations.length);
  console.log('Returning operations:', JSON.stringify(operations, null, 2));
  
  return {
    operations,
  };
}