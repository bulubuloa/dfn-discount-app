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

  // Group cart lines by product only (not by tier structure)
  const productGroups = new Map<string, {
    productTitle: string;
    productId: string;
    lines: Array<{
      line: any;
      productInfo: any;
      quantity: number;
      shopifyPrice: number;
      hasBreaks: boolean;
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
    if (!productId) continue;
    
    // Group only by product ID, not by tier structure
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
    });
    group.totalQuantity += quantity;
    
    // Only count quantities for lines that have quantity break pricing
    if (hasBreaks) {
      group.totalQuantityWithBreaks += quantity;
    }
  }

  // Second pass: Calculate discounts using combined quantities per product
  for (const [groupKey, group] of productGroups) {
    if (group.lines.length === 0) continue;

    // Find the first line with quantity breaks to determine tier pricing
    const lineWithBreaks = group.lines.find(lineData => lineData.hasBreaks);
    if (!lineWithBreaks) continue;

    // Use the total quantity with breaks to determine the applicable tier
    const combinedApplicablePriceBreak = getApplicablePriceBreakFromCartLine(lineWithBreaks.line, group.totalQuantityWithBreaks);
    
    if (!combinedApplicablePriceBreak) continue;

    // Apply the combined tier pricing to each individual line
    for (const lineData of group.lines) {
      const { line, productInfo, quantity, shopifyPrice, hasBreaks } = lineData;
      
      // Only apply discounts to lines that have quantity break pricing
      if (!hasBreaks) continue;
      
      const yourPriceWithCombinedTier = combinedApplicablePriceBreak * quantity;
      const discountAmount = shopifyPrice - yourPriceWithCombinedTier;
      
      if (discountAmount <= 0) continue;

      discountCandidates.push({
        message: `QUANTITY BREAK: ${quantity} items at $${combinedApplicablePriceBreak} each (${group.totalQuantityWithBreaks} total from ${group.productTitle})`,
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