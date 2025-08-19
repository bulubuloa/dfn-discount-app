import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from '../generated/api';


export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  console.log('🎯 DFN Discount Function TRIGGERED!');
  console.log('Function called with input:', JSON.stringify(input, null, 2));
  console.log('Cart lines count:', input.cart.lines.length);
  console.log('Discount classes:', input.discount.discountClasses);
  
  if (!input.cart.lines.length) {
    console.log('❌ No cart lines found, returning empty operations');
    return {operations: []};
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  console.log('✅ Has Order class:', hasOrderDiscountClass);
  console.log('✅ Has Product class:', hasProductDiscountClass);

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    console.log('❌ No discount classes found, returning empty operations');
    return {operations: []};
  }

  // Configurable discount percentages (these would come from app settings)
  const ORDER_DISCOUNT_PERCENT = 20;
  const PRODUCT_DISCOUNT_PERCENT = 15;
  const MINIMUM_ORDER_AMOUNT = 0;

  const operations: any[] = [];

  if (hasOrderDiscountClass) {
    console.log(`🎉 Applying ${ORDER_DISCOUNT_PERCENT}% order discount`);
    
    // Check minimum order amount if configured
    const cartSubtotal = input.cart.lines.reduce((total, line) => {
      return total + (line.cost?.subtotalAmount?.amount || 0);
    }, 0);
    
    console.log('Cart subtotal:', cartSubtotal);
    
    if (MINIMUM_ORDER_AMOUNT > 0 && cartSubtotal < MINIMUM_ORDER_AMOUNT) {
      console.log(`❌ Cart subtotal $${cartSubtotal} is below minimum $${MINIMUM_ORDER_AMOUNT}`);
    } else {
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: `${ORDER_DISCOUNT_PERCENT}% OFF ENTIRE ORDER`,
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: [],
                  },
                },
              ],
              value: {
                percentage: {
                  value: ORDER_DISCOUNT_PERCENT,
                },
              },
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
      console.log('✅ Order discount operation added');
    }
  }

  if (hasProductDiscountClass) {
    console.log(`🎉 Applying ${PRODUCT_DISCOUNT_PERCENT}% product discount to ${input.cart.lines.length} items`);
    
    // Apply discount to all cart lines
    const productDiscountOperations = input.cart.lines.map(line => ({
      productDiscountsAdd: {
        candidates: [
          {
            message: `${PRODUCT_DISCOUNT_PERCENT}% OFF ITEM`,
            targets: [
              {
                cartLine: {
                  id: line.id,
                },
              },
            ],
            value: {
              percentage: {
                value: PRODUCT_DISCOUNT_PERCENT,
              },
            },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.First,
      },
    }));

    operations.push(...productDiscountOperations);
    console.log('✅ Product discount operations added for all cart lines');
  }

  console.log('🎯 Final operations count:', operations.length);
  console.log('Returning operations:', JSON.stringify(operations, null, 2));
  
  return {
    operations,
  };
}
