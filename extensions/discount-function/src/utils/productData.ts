import productData from '../data/products.json';

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

// Cast the imported JSON to our type
const typedProductData = productData as Product[];

/**
 * Get product information by SKU
 */
export function getProductBySku(sku: string): Product | undefined {
  return typedProductData.find(product => product.SKU === sku);
}

/**
 * Get product price by SKU
 */
export function getProductPrice(sku: string): number | undefined {
  const product = getProductBySku(sku);
  return product?.FixedPrice || undefined;
}

/**
 * Get quantity break pricing tiers for a product
 */
export function getQuantityBreakTiers(sku: string): Array<{quantity: number, price: number}> {
  const product = getProductBySku(sku);
  if (!product) return [];

  const tiers: Array<{quantity: number, price: number}> = [];
  
  // Add all valid quantity break tiers
  if (product.QuantityBreak1 && product.PriceBreak1) {
    tiers.push({quantity: product.QuantityBreak1, price: product.PriceBreak1});
  }
  if (product.QuantityBreak2 && product.PriceBreak2) {
    tiers.push({quantity: product.QuantityBreak2, price: product.PriceBreak2});
  }
  if (product.QuantityBreak3 && product.PriceBreak3) {
    tiers.push({quantity: product.QuantityBreak3, price: product.PriceBreak3});
  }
  if (product.QuantityBreak4 && product.PriceBreak4) {
    tiers.push({quantity: product.QuantityBreak4, price: product.PriceBreak4});
  }
  if (product.QuantityBreak5 && product.PriceBreak5) {
    tiers.push({quantity: product.QuantityBreak5, price: product.PriceBreak5});
  }

  // Sort by quantity ascending
  return tiers.sort((a, b) => a.quantity - b.quantity);
}

/**
 * Calculate the target price based on quantity break pricing
 * For a given quantity, find the appropriate price break and calculate:
 * Target Price = Price Break × Total Quantity (single price for entire quantity)
 * 
 * This is different from Shopify's tiered pricing where different quantities
 * get different prices. Here we apply one price break to the entire quantity.
 */
export function calculateTargetPrice(sku: string, quantity: number): number | null {
  const product = getProductBySku(sku);
  if (!product || !product.FixedPrice) return null;

  const tiers = getQuantityBreakTiers(sku);
  if (tiers.length === 0) return null;

  // Find the appropriate price break for the given quantity
  let applicablePrice = product.FixedPrice; // Default to fixed price
  
  // Find the highest tier where quantity >= the tier quantity
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (quantity >= tiers[i].quantity) {
      applicablePrice = tiers[i].price;
      break;
    }
  }

  // Calculate target price: Price Break × Total Quantity (single price for entire quantity)
  return applicablePrice * quantity;
}

/**
 * Calculate Shopify's tiered pricing (for comparison)
 * This shows how Shopify would calculate the price with tiered pricing
 */
export function calculateShopifyTieredPrice(sku: string, quantity: number): number | null {
  const product = getProductBySku(sku);
  if (!product || !product.FixedPrice) return null;

  const tiers = getQuantityBreakTiers(sku);
  if (tiers.length === 0) return product.FixedPrice * quantity;

  let remainingQuantity = quantity;
  let totalPrice = 0;
  let currentTierIndex = 0;

  // Calculate price using tiered approach
  while (remainingQuantity > 0 && currentTierIndex < tiers.length) {
    const currentTier = tiers[currentTierIndex];
    const nextTier = tiers[currentTierIndex + 1];
    
    let tierQuantity: number;
    
    if (nextTier) {
      // Use current tier up to the next tier's quantity
      tierQuantity = Math.min(remainingQuantity, nextTier.quantity - currentTier.quantity);
    } else {
      // Last tier - use all remaining quantity
      tierQuantity = remainingQuantity;
    }
    
    totalPrice += tierQuantity * currentTier.price;
    remainingQuantity -= tierQuantity;
    currentTierIndex++;
  }

  // If there's still remaining quantity, use the fixed price
  if (remainingQuantity > 0) {
    totalPrice += remainingQuantity * (product.FixedPrice || 0);
  }

  return totalPrice;
}

/**
 * Calculate the discount amount based on quantity break pricing
 * Discount = Your Price - Shopify Price
 * Where:
 * - Your Price = Price Break × Total Quantity (single price for entire quantity)
 * - Shopify Price = Tiered pricing calculation
 */
export function calculateQuantityBreakDiscount(sku: string, quantity: number, shopifyPrice: number): number {
  const yourPrice = calculateTargetPrice(sku, quantity);
  if (yourPrice === null) return 0;

  // Discount = Your Price - Shopify Price
  const discount = yourPrice - shopifyPrice;
  return Math.max(0, discount); // Ensure discount is not negative
}

/**
 * Calculate discount percentage based on quantity break pricing
 */
export function calculateQuantityBreakDiscountPercentage(sku: string, quantity: number, shopifyPrice: number): number {
  const yourPrice = calculateTargetPrice(sku, quantity);
  if (yourPrice === null || shopifyPrice === 0) return 0;

  const discount = yourPrice - shopifyPrice;
  if (discount <= 0) return 0;

  return (discount / shopifyPrice) * 100;
}

/**
 * Get the applicable price break for a given quantity
 */
export function getApplicablePriceBreak(sku: string, quantity: number): number | null {
  const product = getProductBySku(sku);
  if (!product || !product.FixedPrice) return null;

  const tiers = getQuantityBreakTiers(sku);
  if (tiers.length === 0) return product.FixedPrice;

  // Find the highest tier where quantity >= the tier quantity
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (quantity >= tiers[i].quantity) {
      return tiers[i].price;
    }
  }

  return product.FixedPrice;
}

/**
 * Check if a product has quantity break pricing
 */
export function hasQuantityBreakPricing(sku: string): boolean {
  const tiers = getQuantityBreakTiers(sku);
  return tiers.length > 0;
}

/**
 * Get discount rule for a product category (legacy function)
 */
export function getDiscountRule(category: string): DiscountRule | undefined {
  // This is kept for backward compatibility
  return undefined;
}

/**
 * Get all products in a specific category
 */
export function getProductsByCategory(category: string): Product[] {
  return typedProductData.filter(product => product.Option2Value === category);
}

/**
 * Check if a product is eligible for discount based on category rules (legacy function)
 */
export function isProductEligibleForDiscount(sku: string, quantity: number): boolean {
  // For quantity break pricing, all products with quantity breaks are eligible
  return hasQuantityBreakPricing(sku) && quantity > 0;
}

/**
 * Get discount percentage for a product (legacy function - now uses quantity break calculation)
 */
export function getDiscountPercentage(sku: string): number {
  // This function is now deprecated in favor of calculateQuantityBreakDiscountPercentage
  return 0;
}

/**
 * Get all available SKUs
 */
export function getAllSkus(): string[] {
  return typedProductData.map(product => product.SKU);
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(typedProductData.map(product => product.Option2Value));
  return Array.from(categories);
}
