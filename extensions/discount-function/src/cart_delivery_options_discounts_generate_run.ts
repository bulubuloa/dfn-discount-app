import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
  DeliveryInput,
  CartDeliveryOptionsDiscountsGenerateRunResult,
} from "../generated/api";

export function cartDeliveryOptionsDiscountsGenerateRun(
  input: DeliveryInput,
): CartDeliveryOptionsDiscountsGenerateRunResult {
  console.log('🚚 DFN Shipping Discount Function TRIGGERED!');
  console.log('Function called with input:', JSON.stringify(input, null, 2));
  
  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    console.log("❌ No delivery groups found, returning empty operations");
    return {operations: []};
  }

  console.log('✅ Found delivery group:', firstDeliveryGroup.id);

  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping,
  );

  console.log('✅ Has Shipping discount class:', hasShippingDiscountClass);

  if (!hasShippingDiscountClass) {
    console.log("❌ No shipping discount class found, returning empty operations");
    return {operations: []};
  }

  // Default shipping discount percentage
  const SHIPPING_DISCOUNT_PERCENT = 50;
  
  console.log('⚙️ Using shipping configuration:', {
    shippingDiscountPercent: SHIPPING_DISCOUNT_PERCENT
  });
  console.log(`🎉 Applying ${SHIPPING_DISCOUNT_PERCENT}% shipping discount`);

  const result = {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: `${SHIPPING_DISCOUNT_PERCENT}% OFF SHIPPING`,
              targets: [
                {
                  deliveryGroup: {
                    id: firstDeliveryGroup.id,
                  },
                },
              ],
              value: {
                percentage: {
                  value: SHIPPING_DISCOUNT_PERCENT,
                },
              },
            },
          ],
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };

  console.log('✅ Shipping discount operation added');
  console.log('Returning operations:', JSON.stringify(result, null, 2));
  
  return result;
}