import {
  getProductBySku,
  getProductPrice,
  isProductEligibleForDiscount,
  getDiscountPercentage,
  getAllSkus,
  getAllCategories
} from './utils/productData';

// Test the JSON import functionality
console.log('🧪 Testing JSON import functionality...');

// Test getting all SKUs
const allSkus = getAllSkus();
console.log('📋 All available SKUs:', allSkus);

// Test getting all categories
const allCategories = getAllCategories();
console.log('📂 All available categories:', allCategories);

// Test getting product by SKU
const testSku = 'PROD-001';
const product = getProductBySku(testSku);
console.log(`🔍 Product for SKU ${testSku}:`, product);

// Test getting product price
const price = getProductPrice(testSku);
console.log(`💰 Price for SKU ${testSku}: $${price}`);

// Test discount eligibility
const isEligible = isProductEligibleForDiscount(testSku, 2);
console.log(`✅ Is SKU ${testSku} eligible for discount with quantity 2:`, isEligible);

// Test discount percentage
const discountPercent = getDiscountPercentage(testSku);
console.log(`🎯 Discount percentage for SKU ${testSku}: ${discountPercent}%`);

// Test with non-existent SKU
const nonExistentSku = 'NON-EXISTENT';
const nonExistentProduct = getProductBySku(nonExistentSku);
console.log(`❌ Product for non-existent SKU ${nonExistentSku}:`, nonExistentProduct);

console.log('✅ JSON import test completed!');
