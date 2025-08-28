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

  // Group cart lines by product and tier structure
  const productGroups = new Map<string, {
    productTitle: string;
    productId: string;
    lines: Array<{
      line: any;
      productInfo: any;
      quantity: number;
      shopifyPrice: number;
    }>;
    totalQuantity: number;
  }>();

  // First pass: Group lines by product and tier structure
  for (const line of input.cart.lines) {
    const productInfo = getProductInfoFromCartLine(line);
    if (!productInfo) continue;

    const hasBreaks = hasQuantityBreakPricingFromCartLine(line);
    if (!hasBreaks) continue;

    const quantity = line.quantity || 1;
    const shopifyPrice = parseFloat(line.cost?.subtotalAmount?.amount || '0');
    
    if (shopifyPrice <= 0) continue;

    const productId = line.merchandise?.product?.id;
    if (!productId) continue;
    
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
  }

  // Second pass: Calculate discounts using combined quantities
  for (const [groupKey, group] of productGroups) {
    if (group.lines.length === 0) continue;

    const firstLine = group.lines[0];
    const combinedApplicablePriceBreak = getApplicablePriceBreakFromCartLine(firstLine.line, group.totalQuantity);
    
    if (!combinedApplicablePriceBreak) continue;

    // Apply the combined tier pricing to each individual line
    for (const lineData of group.lines) {
      const { line, productInfo, quantity, shopifyPrice } = lineData;
      
      const yourPriceWithCombinedTier = combinedApplicablePriceBreak * quantity;
      const discountAmount = shopifyPrice - yourPriceWithCombinedTier;
      
      if (discountAmount <= 0) continue;

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
  
  return {
    operations,
  };
}