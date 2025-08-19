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
  console.log('Function called with input:', JSON.stringify(input, null, 2));
  
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

  console.log('Discount classes:', input.discount.discountClasses);
  console.log('Has Order class:', hasOrderDiscountClass);
  console.log('Has Product class:', hasProductDiscountClass);

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    console.log('No discount classes found, returning empty operations');
    return {operations: []};
  }

  const operations: any[] = [];

  if (hasOrderDiscountClass) {
    operations.push({
      orderDiscountsAdd: {
        candidates: [
          {
            message: '20% OFF ENTIRE ORDER',
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: [],
                },
              },
            ],
            value: {
              percentage: {
                value: 20,
              },
            },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });
  }

  if (hasProductDiscountClass) {
    // Apply 15% discount to all cart lines
    const productDiscountOperations = input.cart.lines.map(line => ({
      productDiscountsAdd: {
        candidates: [
          {
            message: '15% OFF ITEM',
            targets: [
              {
                cartLine: {
                  id: line.id,
                },
              },
            ],
            value: {
              percentage: {
                value: 15,
              },
            },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.First,
      },
    }));

    operations.push(...productDiscountOperations);
  }

  console.log('Returning operations:', JSON.stringify(operations, null, 2));
  
  return {
    operations,
  };
}
