// Type definitions for our JSON structure
interface Product {
  SKU: string;
  Option1Value: string;
  Option2Value: string;
  FixedPrice: number | null;
  QuantityBreak1: number | null;
  PriceBreak1: number | null;
  QuantityBreak2: number | null;
  PriceBreak2: number | null;
  QuantityBreak3: number | null;
  PriceBreak3: number | null;
  QuantityBreak4: number | null;
  PriceBreak4: number | null;
  QuantityBreak5: number | null;
  PriceBreak5: number | null;
}

interface DiscountRule {
  percentage: number;
  minimumQuantity: number;
}

/**
 * Get quantity break pricing tiers for a product from cart line metafields
 */
export function getQuantityBreakTiersFromCartLine(cartLine: any): Array<{quantity: number, price: number}> {
  const tiers: Array<{quantity: number, price: number}> = [];
  const merchandise = cartLine.merchandise as any;
  
  if (!merchandise?.sku) {
    console.log('No SKU found for cart line');
    return [];
  }

  console.log(`Processing quantity breaks for SKU: ${merchandise.sku}`);
  
  // Check for qbtier metafield
  const qbTiersField = merchandise.qbTiers;
  console.log(`QB Tiers metafield:`, qbTiersField);
  
  if (qbTiersField?.value) {
    try {
      const qbData = JSON.parse(qbTiersField.value);
      console.log(`Parsed QB data:`, qbData);
      
      if (qbData.breaks && Array.isArray(qbData.breaks)) {
        for (const breakTier of qbData.breaks) {
          const quantity = parseInt(breakTier.min);
          const price = parseFloat(breakTier.price);
          
          if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            tiers.push({quantity, price});
            console.log(`Found tier: ${quantity}+ items at $${price} each`);
          }
        }
      }
      
      // Also store the fixed price for reference
      if (qbData.fixed) {
        const fixedPrice = parseFloat(qbData.fixed);
        if (!isNaN(fixedPrice) && fixedPrice > 0) {
          console.log(`Fixed price: $${fixedPrice}`);
          // Add fixed price as the base tier (quantity 1)
          tiers.unshift({quantity: 1, price: fixedPrice});
        }
      }
    } catch (error) {
      console.log(`Error parsing QB tiers JSON:`, error);
    }
  }

  if (tiers.length === 0) {
    console.log(`No quantity break tiers found for SKU: ${merchandise.sku}`);
    console.log(`Looking for metafield with namespace "qbtier" and key "tiers"`);
  } else {
    console.log(`Found ${tiers.length} quantity break tiers`);
  }

  return tiers.sort((a, b) => a.quantity - b.quantity);
}

/**
 * Calculate the target price based on quantity break pricing from cart line
 * For a given quantity, find the appropriate price break and calculate:
 * Target Price = Price Break × Total Quantity (single price for entire quantity)
 */
export function calculateTargetPriceFromCartLine(cartLine: any, quantity: number): number | null {
  const tiers = getQuantityBreakTiersFromCartLine(cartLine);
  if (tiers.length === 0) {
    console.log('No tiers found for target price calculation');
    return null;
  }
  
  // Find the highest tier that applies to this quantity
  let applicablePrice = tiers[0].price; // Default to first tier (lowest quantity)
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (quantity >= tiers[i].quantity) {
      applicablePrice = tiers[i].price;
      console.log(`Using tier for ${tiers[i].quantity}+ items: $${applicablePrice} each for quantity ${quantity}`);
      break;
    }
  }
  
  const totalPrice = applicablePrice * quantity;
  console.log(`Target price calculation: ${quantity} × $${applicablePrice} = $${totalPrice}`);
  return totalPrice;
}

/**
 * Calculate Shopify's tiered pricing from cart line (for comparison)
 */
export function calculateShopifyTieredPriceFromCartLine(cartLine: any, quantity: number): number | null {
  const tiers = getQuantityBreakTiersFromCartLine(cartLine);
  if (tiers.length === 0) {
    console.log('No tiers found for Shopify tiered price calculation');
    return null;
  }
  
  let remainingQuantity = quantity;
  let totalPrice = 0;
  let currentTierIndex = 0;
  
  console.log(`Calculating Shopify tiered price for ${quantity} items:`);
  
  while (remainingQuantity > 0 && currentTierIndex < tiers.length) {
    const currentTier = tiers[currentTierIndex];
    const nextTier = tiers[currentTierIndex + 1];
    let tierQuantity: number;
    
    if (nextTier) {
      tierQuantity = Math.min(remainingQuantity, nextTier.quantity - currentTier.quantity);
    } else {
      tierQuantity = remainingQuantity;
    }
    
    const tierPrice = tierQuantity * currentTier.price;
    totalPrice += tierPrice;
    remainingQuantity -= tierQuantity;
    
    console.log(`Tier ${currentTierIndex + 1}: ${tierQuantity} items × $${currentTier.price} = $${tierPrice}`);
    currentTierIndex++;
  }
  
  console.log(`Shopify tiered total: $${totalPrice}`);
  return totalPrice;
}

/**
 * Calculate the discount amount based on quantity break pricing from cart line
 * Discount = Shopify Price - Your Price (when your price is lower)
 */
export function calculateQuantityBreakDiscountFromCartLine(cartLine: any, quantity: number, shopifyPrice: number): number {
  const yourPrice = calculateTargetPriceFromCartLine(cartLine, quantity);
  if (yourPrice === null) return 0;
  
  // Discount = Shopify Price - Your Price (when your price is lower)
  const discount = shopifyPrice - yourPrice;
  console.log(`Discount calculation: $${shopifyPrice} - $${yourPrice} = $${discount}`);
  
  return Math.max(0, discount);
}

/**
 * Calculate discount percentage based on quantity break pricing from cart line
 */
export function calculateQuantityBreakDiscountPercentageFromCartLine(cartLine: any, quantity: number, shopifyPrice: number): number {
  const yourPrice = calculateTargetPriceFromCartLine(cartLine, quantity);
  if (yourPrice === null || shopifyPrice === 0) return 0;
  
  // Discount = Shopify Price - Your Price (when your price is lower)
  const discount = shopifyPrice - yourPrice;
  if (discount <= 0) return 0;
  return (discount / shopifyPrice) * 100;
}

/**
 * Get the applicable price break for a given quantity from cart line
 */
export function getApplicablePriceBreakFromCartLine(cartLine: any, quantity: number): number | null {
  const tiers = getQuantityBreakTiersFromCartLine(cartLine);
  if (tiers.length === 0) {
    console.log('No tiers found for price break calculation');
    return null;
  }
  
  // Find the highest tier that applies to this quantity
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (quantity >= tiers[i].quantity) {
      console.log(`Applicable price break for ${quantity} items: $${tiers[i].price} (tier: ${tiers[i].quantity}+)`);
      return tiers[i].price;
    }
  }
  
  // If no tier applies, use the first tier (base price)
  console.log(`Using base price tier: $${tiers[0].price}`);
  return tiers[0].price;
}

/**
 * Check if a cart line has quantity break pricing
 */
export function hasQuantityBreakPricingFromCartLine(cartLine: any): boolean {
  const tiers = getQuantityBreakTiersFromCartLine(cartLine);
  return tiers.length > 0;
}

/**
 * Get product info from cart line
 */
export function getProductInfoFromCartLine(cartLine: any): {sku: string, name: string, fixedPrice: number} | null {
  const merchandise = cartLine.merchandise as any;
  const sku = merchandise?.sku;
  const name = merchandise?.product?.title || merchandise?.title;
  
  // Get fixed price from qbTiers metafield or fallback to cost
  let fixedPrice = 0;
  
  // Try to get fixed price from qbTiers metafield
  if (merchandise?.qbTiers?.value) {
    try {
      const qbData = JSON.parse(merchandise.qbTiers.value);
      if (qbData.fixed) {
        fixedPrice = parseFloat(qbData.fixed);
      }
    } catch (error) {
      console.log(`Error parsing QB tiers for fixed price:`, error);
    }
  }
  
  // Fallback to cost if no fixed price found
  if (!fixedPrice || fixedPrice <= 0) {
    fixedPrice = cartLine.cost?.amountPerQuantity?.amount || 0;
  }
  
  console.log(`Product info for ${sku}: name="${name}", fixedPrice=$${fixedPrice}`);
  
  if (!sku) {
    console.log('No SKU found in merchandise');
    return null;
  }
  
  if (!fixedPrice || fixedPrice <= 0) {
    console.log('No valid fixed price found');
    return null;
  }
  
  return {
    sku,
    name: name || sku,
    fixedPrice
  };
}
