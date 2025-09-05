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
  getQuantityBreakTiersFromCartLine,
} from './utils/productData';

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  if (!input.cart.lines.length) {
    return {operations: []};
  }

  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass) {
    return {operations: []};
  }
  
  const operations: any[] = [];
  const discountCandidates: any[] = [];

  // Group cart lines by product only - total quantity across all variants determines tier pricing
  const productGroups = new Map<string, {
    productTitle: string;
    productId: string;
    lines: Array<{
      line: any;
      productInfo: any;
      quantity: number;
      shopifyPrice: number;
      hasBreaks: boolean;
      variantId: string;
    }>;
    totalQuantity: number;
    totalQuantityWithBreaks: number;
  }>();

  // First pass: Group lines by product only
  for (const line of input.cart.lines) {
    const productInfo = getProductInfoFromCartLine(line);
    if (!productInfo) continue;

    const hasBreaks = hasQuantityBreakPricingFromCartLine(line);
    const quantity = line.quantity || 1;
    const shopifyPrice = parseFloat(line.cost?.subtotalAmount?.amount || '0');
    
    if (shopifyPrice <= 0) continue;

    const productId = line.merchandise?.product?.id;
    const variantId = line.merchandise?.id;
    if (!productId || !variantId) continue;
    
    // Group by product ID only - total quantity across variants determines tier
    const groupKey = productId;

    if (!productGroups.has(groupKey)) {
      productGroups.set(groupKey, {
        productTitle: productInfo.name,
        productId: productId,
        lines: [],
        totalQuantity: 0,
        totalQuantityWithBreaks: 0,
      });
    }

    const group = productGroups.get(groupKey)!;
    group.lines.push({
      line,
      productInfo,
      quantity,
      shopifyPrice,
      hasBreaks,
      variantId,
    });
    group.totalQuantity += quantity;
    
    // Only count quantities for lines that have quantity break pricing
    if (hasBreaks) {
      group.totalQuantityWithBreaks += quantity;
    }
  }

  // Second pass: Calculate discounts using total product quantity to determine best tier for all variants
  for (const [groupKey, group] of productGroups) {
    if (group.lines.length === 0) continue;

    // Find the first line with quantity breaks to get the tier structure
    const lineWithBreaks = group.lines.find(lineData => lineData.hasBreaks);
    if (!lineWithBreaks) continue;

    // Use the total quantity across ALL variants to determine the best applicable tier
    const bestApplicablePriceBreak = getApplicablePriceBreakFromCartLine(lineWithBreaks.line, group.totalQuantityWithBreaks);
    
    if (!bestApplicablePriceBreak) continue;

    // Apply the best tier pricing to each individual line (all variants get the same tier benefit)
    for (const lineData of group.lines) {
      const { line, productInfo, quantity, shopifyPrice, hasBreaks, variantId } = lineData;
      
      // Only apply discounts to lines that have quantity break pricing
      if (!hasBreaks) continue;
      
      // Each variant uses its own pricing structure but with the best tier price
      const variantTiers = getQuantityBreakTiersFromCartLine(line);
      if (variantTiers.length === 0) continue;
      
      // Find the best tier price for this variant's structure based on total product quantity
      let bestVariantPrice = variantTiers[0].price; // Default to first tier
      
      // Map total product quantity to the appropriate tier for this variant
      // If total quantity is 150+, find the highest tier this variant supports
      if (group.totalQuantityWithBreaks >= 150) {
        // Find the highest tier available for this variant (150+ equivalent)
        for (let i = variantTiers.length - 1; i >= 0; i--) {
          if (variantTiers[i].quantity >= 150) {
            bestVariantPrice = variantTiers[i].price;
            break;
          }
        }
        // If no 150+ tier exists, use the highest available tier
        if (bestVariantPrice === variantTiers[0].price) {
          bestVariantPrice = variantTiers[variantTiers.length - 1].price;
        }
      } else if (group.totalQuantityWithBreaks >= 50) {
        // Find the 50+ tier for this variant
        for (let i = variantTiers.length - 1; i >= 0; i--) {
          if (variantTiers[i].quantity >= 50) {
            bestVariantPrice = variantTiers[i].price;
            break;
          }
        }
        // If no 50+ tier exists, use the highest available tier
        if (bestVariantPrice === variantTiers[0].price) {
          bestVariantPrice = variantTiers[variantTiers.length - 1].price;
        }
      } else if (group.totalQuantityWithBreaks >= 10) {
        // Find the 10+ tier for this variant
        for (let i = variantTiers.length - 1; i >= 0; i--) {
          if (variantTiers[i].quantity >= 10) {
            bestVariantPrice = variantTiers[i].price;
            break;
          }
        }
      }
      
      const yourPriceWithBestTier = bestVariantPrice * quantity;
      const discountAmount = shopifyPrice - yourPriceWithBestTier;
      
      if (discountAmount <= 0) continue;

      discountCandidates.push({
        message: `QUANTITY BREAK: ${quantity} items at $${bestVariantPrice} each (${group.totalQuantityWithBreaks} total from ${group.productTitle}) - Best Price: $${bestVariantPrice}`,
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
  
  return {
    operations,
  };
}