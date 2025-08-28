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
    return [];
  }
  
  // Check metafield sources for quantity break data
  const metafieldSources = [
    // Variant-level metafields
    { name: 'variant.qbTiers', field: merchandise.qbTiers },
    { name: 'variant.customTiers', field: merchandise.customTiers },
    // Product-level metafields (fallback)
    { name: 'product.qbTiers', field: merchandise.product?.qbTiers }
  ];
  
  let foundMetafield = null;
  for (const source of metafieldSources) {
    if (source.field?.value) {
      foundMetafield = source.field;
      break;
    }
  }
  
  // Try to parse JSON-based metafields first
  if (foundMetafield?.value) {
    try {
      const qbData = JSON.parse(foundMetafield.value);
      
      if (qbData.breaks && Array.isArray(qbData.breaks)) {
        for (const breakTier of qbData.breaks) {
          const quantity = parseInt(breakTier.min);
          const price = parseFloat(breakTier.price);
          
          if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            tiers.push({quantity, price});
          }
        }
      }
      
      // Also store the fixed price for reference
      if (qbData.fixed) {
        const fixedPrice = parseFloat(qbData.fixed);
        if (!isNaN(fixedPrice) && fixedPrice > 0) {
          // Add fixed price as the base tier (quantity 1)
          tiers.unshift({quantity: 1, price: fixedPrice});
        }
      }
    } catch (error) {
      // Silent fail - try other methods
    }
  }
  
  // If no JSON data found, try individual quantity price break fields
  if (tiers.length === 0) {
    // Check for individual quantity price break metafields (format: "quantity:price")
    const qpbFields = [
      { name: 'quantityPriceBreak1', field: merchandise.quantityPriceBreak1 },
      { name: 'quantityPriceBreak2', field: merchandise.quantityPriceBreak2 },
      { name: 'quantityPriceBreak3', field: merchandise.quantityPriceBreak3 }
    ];
    
    for (const qpb of qpbFields) {
      if (qpb.field?.value) {
        // Try different formats: "quantity:price", "quantity,price", or JSON
        const value = qpb.field.value.trim();
        let quantity, price;
        
        if (value.includes(':')) {
          [quantity, price] = value.split(':').map(s => s.trim());
        } else if (value.includes(',')) {
          [quantity, price] = value.split(',').map(s => s.trim());
        } else {
          try {
            const parsed = JSON.parse(value);
            quantity = parsed.quantity || parsed.min;
            price = parsed.price;
          } catch (e) {
            continue;
          }
        }
        
        const qty = parseInt(quantity);
        const prc = parseFloat(price);
        
        if (!isNaN(qty) && !isNaN(prc) && qty > 0 && prc > 0) {
          tiers.push({quantity: qty, price: prc});
        }
      }
    }
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
    return null;
  }
  
  // Find the highest tier that applies to this quantity
  let applicablePrice = tiers[0].price; // Default to first tier (lowest quantity)
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (quantity >= tiers[i].quantity) {
      applicablePrice = tiers[i].price;
      break;
    }
  }
  
  const totalPrice = applicablePrice * quantity;
  return totalPrice;
}

/**
 * Calculate Shopify's tiered pricing from cart line (for comparison)
 */
export function calculateShopifyTieredPriceFromCartLine(cartLine: any, quantity: number): number | null {
  const tiers = getQuantityBreakTiersFromCartLine(cartLine);
  if (tiers.length === 0) {
    return null;
  }
  
  let remainingQuantity = quantity;
  let totalPrice = 0;
  let currentTierIndex = 0;
  
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
    currentTierIndex++;
  }
  
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
    return null;
  }
  
  // Find the highest tier that applies to this quantity
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (quantity >= tiers[i].quantity) {
      return tiers[i].price;
    }
  }
  
  // If no tier applies, use the first tier (base price)
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
      // Silent fail
    }
  }
  
  // Fallback to cost if no fixed price found
  if (!fixedPrice || fixedPrice <= 0) {
    fixedPrice = parseFloat(cartLine.cost?.amountPerQuantity?.amount || '0');
  }
  
  if (!sku) {
    return null;
  }
  
  if (!fixedPrice || fixedPrice <= 0) {
    return null;
  }
  
  return {
    sku,
    name: name || sku,
    fixedPrice
  };
}
