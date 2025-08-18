# DFN Discount App - 50% Discount Function

A Shopify app that provides a powerful 50% discount function for e-commerce stores. This app allows store owners to easily apply 50% discounts to orders or individual products using Shopify's discount function API.

## 🎯 Features

- **50% Order Discount**: Apply 50% off to entire orders
- **50% Product Discount**: Apply 50% off to individual cart line items
- **Flexible Discount Classes**: Supports both Order and Product discount classes
- **Multiple Cart Lines**: Automatically applies discounts to all cart items
- **Smart Integration**: Works seamlessly with Shopify's existing discount system

## 🚀 How It Works

The discount function (`cart_lines_discounts_generate_run`) processes cart input and generates discount operations based on the configured discount classes:

1. **Order Discount Class**: Creates a single 50% discount on the entire order
2. **Product Discount Class**: Creates individual 50% discounts for each cart line item
3. **Combined**: Both discounts can be applied simultaneously

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: React with Shopify Polaris components
- **Extension**: Shopify Function (TypeScript)
- **Build Tools**: Vite, Shopify CLI
- **Package Manager**: npm

## 📁 Project Structure

```
dfn-discount-app/
├── extensions/
│   └── discount-function/          # Discount function extension
│       ├── src/
│       │   ├── cart_lines_discounts_generate_run.ts  # Main discount logic
│       │   └── cart_lines_discounts_generate_run.graphql
│       └── shopify.extension.toml
├── web/                            # Web application
│   ├── frontend/                   # React frontend
│   │   ├── pages/
│   │   │   └── index.jsx          # Main app interface
│   │   └── components/
│   └── index.js                    # Express backend
├── shopify.app.toml                # App configuration
└── README.md                       # This file
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Shopify CLI
- Shopify Partner account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dfn-discount-app.git
   cd dfn-discount-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd web/frontend && npm install
   cd ../../extensions/discount-function && npm install
   ```

3. **Configure the app**
   ```bash
   shopify app config link
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Building & Deployment

1. **Build the frontend**
   ```bash
   cd web/frontend
   SHOPIFY_API_KEY=your_api_key npm run build
   ```

2. **Build the function**
   ```bash
   cd extensions/discount-function
   npm run build
   ```

3. **Deploy the app**
   ```bash
   npm run deploy
   ```

## 📋 Usage

### Creating a Discount

1. Deploy the app to your Shopify store
2. In your Shopify admin, go to **Discounts**
3. Click **"Create discount"**
4. Select **"Function-based discount"**
5. Choose this app's discount function
6. Configure discount classes (Order, Product, or both)
7. Set conditions and restrictions as needed
8. Activate the discount

### Discount Classes

- **Order**: Applies 50% to entire order subtotal
- **Product**: Applies 50% to each cart line item individually
- **Both**: Applies both types of discounts

## 🔍 Configuration

The app automatically detects the discount classes configured in your Shopify discount and applies the appropriate logic:

- If only `Order` class is selected: 50% off entire order
- If only `Product` class is selected: 50% off each item
- If both classes are selected: Both discounts are applied

## 🧪 Testing

### Function Testing

```bash
cd extensions/discount-function
npm test
```

### Frontend Testing

```bash
cd web/frontend
npm test
```

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run deploy
```

## 📚 API Reference

### Discount Function

The main discount function processes cart input and returns discount operations:

```typescript
export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult
```

### Input Schema

The function expects cart input with:
- Cart lines (items in cart)
- Discount classes (Order, Product, or both)

### Output Schema

Returns an array of discount operations that Shopify processes to apply the discounts.

## 🔒 Security & Permissions

The app requires the following Shopify permissions:
- `write_products`: Access to product information
- `write_discounts`: Ability to create and manage discounts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [Shopify documentation](https://shopify.dev/docs/apps/discounts)
- Review the test files for usage examples
- Check the Shopify Partner dashboard for deployment status

## 🎉 Acknowledgments

- Built with [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- Uses [Shopify Polaris](https://polaris.shopify.com/) design system
- Powered by [Shopify Functions](https://shopify.dev/docs/apps/functions)

---

**Built with ❤️ for Shopify merchants**
