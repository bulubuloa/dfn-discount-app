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

  console.log('Processing cart lines for quantity break pricing...');
  
  const operations: any[] = [];

  // Group cart lines by product and tier structure
  interface ProductGroup {
    productTitle: string;
    productId: string;
    lines: Array<{
      line: any;
      productInfo: any;
      quantity: number;
      shopifyPrice: number;
    }>;
    totalQuantity: number;
  }

  const productGroups = new Map<string, ProductGroup>();

  // First pass: Group lines by product and tier structure
  for (const line of input.cart.lines) {
    console.log(`Processing cart line: ${JSON.stringify(line, null, 2)}`);
    
    const productInfo = getProductInfoFromCartLine(line);
    if (!productInfo) {
      console.log(`No product info found for cart line ${line.id}, skipping`);
      continue;
    }

    console.log(`Processing cart line ${line.id} with SKU: ${productInfo.sku}`);
    
    const hasBreaks = hasQuantityBreakPricingFromCartLine(line);
    console.log(`Has quantity break pricing: ${hasBreaks}`);
    
    if (!hasBreaks) {
      console.log(`Cart line ${line.id} does not have quantity break metafields for SKU: ${productInfo.sku}`);
      continue;
    }

    const quantity = line.quantity || 1;
    const shopifyPrice = line.cost?.subtotalAmount?.amount || 0;
    
    if (shopifyPrice <= 0) {
      console.log(`Shopify price is $${shopifyPrice} for cart line ${line.id}, skipping`);
      continue;
    }

    // Get the product ID and tier structure to group same product with same tiers
    const productId = line.merchandise?.product?.id;
    if (!productId) {
      console.log(`No product ID found for cart line ${line.id}, skipping`);
      continue;
    }
    
    const tierData = line.merchandise?.qbTiers?.value || '';
    const groupKey = `${productId}_${tierData}`;

    if (!productGroups.has(groupKey)) {
      productGroups.set(groupKey, {
        productTitle: productInfo.name,
        productId: productId,
        lines: [],
        totalQuantity: 0,
      });
    }

    const group = productGroups.get(groupKey)!;
    group.lines.push({
      line,
      productInfo,
      quantity,
      shopifyPrice,
    });
    group.totalQuantity += quantity;

    console.log(`Added ${quantity} items to product group ${productInfo.name} (${productId}). Total: ${group.totalQuantity}`);
  }

  // Second pass: Calculate discounts using combined quantities
  const discountCandidates: any[] = [];

  for (const [groupKey, group] of productGroups) {
    console.log(`\n=== Processing product group: ${group.productTitle} ===`);
    console.log(`Total combined quantity: ${group.totalQuantity}`);
    console.log(`Lines in group: ${group.lines.length}`);

    // Use the first line to determine tier pricing (all lines in group have same tiers by design)
    const firstLine = group.lines[0];
    
    // Calculate combined quantity discount
    const combinedYourPrice = calculateTargetPriceFromCartLine(firstLine.line, group.totalQuantity);
    const combinedApplicablePriceBreak = getApplicablePriceBreakFromCartLine(firstLine.line, group.totalQuantity);
    
    console.log(`Combined quantity ${group.totalQuantity} qualifies for $${combinedApplicablePriceBreak} per item`);

    // Apply the combined tier pricing to each individual line
    for (const lineData of group.lines) {
      const { line, productInfo, quantity, shopifyPrice } = lineData;
      
      console.log(`\nProcessing line ${line.id}: ${quantity} × ${productInfo.sku}`);
      
      // Use the combined quantity tier price for this individual line
      const yourPriceWithCombinedTier = combinedApplicablePriceBreak ? (combinedApplicablePriceBreak * quantity) : null;
      
      if (!yourPriceWithCombinedTier) {
        console.log(`Could not calculate combined tier price for line ${line.id}`);
        continue;
      }

      const discountAmount = shopifyPrice - yourPriceWithCombinedTier;
      
      console.log(`Individual calculation:`);
      console.log(`  Shopify Price: $${shopifyPrice}`);
      console.log(`  Your Price (combined tier): $${yourPriceWithCombinedTier} (${quantity} × $${combinedApplicablePriceBreak})`);
      console.log(`  Discount: $${discountAmount}`);
      
      if (discountAmount <= 0) {
        console.log(`No discount applicable for line ${line.id}`);
        continue;
      }

      const discountPercentage = (discountAmount / shopifyPrice) * 100;
      
      console.log(`Applying combined quantity discount: $${discountAmount} (${discountPercentage.toFixed(1)}%)`);
      console.log(`Combined total: ${group.totalQuantity} items qualifies for $${combinedApplicablePriceBreak} each`);
      
      // Add this line's discount as a candidate
      discountCandidates.push({
        message: `QUANTITY BREAK: ${quantity} items at $${combinedApplicablePriceBreak} each (${group.totalQuantity} total)`,
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