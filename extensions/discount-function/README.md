# DFN Discount App - Shopify Function

This Shopify Function automatically applies discounts to customer carts when you create discounts in your Shopify admin.

## What It Does

- **Order Discounts**: Automatically applies 20% off to entire cart subtotals
- **Product Discounts**: Automatically applies 15% off to individual products
- **Shipping Discounts**: Automatically applies 50% off to shipping costs

## How to Use

1. **Deploy the Function**: Deploy this function to your Shopify app
2. **Create a Discount**: Go to Shopify Admin → Discounts → Create discount
3. **Select Function**: Choose "DFN Discount App" as the discount function
4. **Configure**: Set your discount conditions, scheduling, and other settings
5. **Activate**: Save and activate your discount

## Important Notes

- The function automatically applies discounts to **all qualifying carts**
- Discounts work with your existing Shopify discount conditions
- No customer action required - discounts apply automatically
- The function respects your discount scheduling and targeting rules

## Troubleshooting

If discounts aren't showing in carts:

1. **Verify Function Selection**: Ensure you selected "DFN Discount App" as the function
2. **Check Activation**: Make sure your discount is active and not expired
3. **Verify Conditions**: Ensure cart meets any discount conditions you set
4. **Clear Cache**: Try refreshing the cart page
5. **Test Simple**: Test with a single product first

## Technical Details

- **Target**: `cart.lines.discounts.generate.run` and `cart.delivery-options.discounts.generate.run`
- **Language**: TypeScript
- **Framework**: Shopify Functions
- **Build**: Uses Vite for compilation

## Development

To test locally:

```bash
npm run test
npm run build
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the function is properly deployed
3. Test with simple discount configurations first
4. Contact support if problems persist
