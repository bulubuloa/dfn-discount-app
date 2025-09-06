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

    // Check if any lines have quantity breaks
    const hasAnyBreaks = group.lines.some(lineData => lineData.hasBreaks);
    if (!hasAnyBreaks) continue;

    // Apply the best tier pricing to each individual line
    // Each variant uses its own pricing structure with the total group quantity to determine the best tier
    for (const lineData of group.lines) {
      const { line, productInfo, quantity, shopifyPrice, hasBreaks, variantId } = lineData;
      
      // Only apply discounts to lines that have quantity break pricing
      if (!hasBreaks) continue;
      
      // Use the total group quantity to find the best applicable tier for this specific variant
      const targetPrice = calculateTargetPriceFromCartLine(line, group.totalQuantityWithBreaks);
      if (targetPrice === null) continue;
      
      // Calculate the discount amount
      const discountAmount = shopifyPrice - targetPrice;
      
      if (discountAmount <= 0) continue;

      // Calculate the per-item price for the message
      const perItemPrice = targetPrice / quantity;
      
      discountCandidates.push({
        message: `QUANTITY BREAK: ${quantity} items at $${perItemPrice.toFixed(2)} each (${group.totalQuantityWithBreaks} total from ${group.productTitle}) - Best Price: $${perItemPrice.toFixed(2)}`,
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