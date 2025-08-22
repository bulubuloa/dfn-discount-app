#!/bin/bash

# Setup Environment for All Products Sync
# This script helps you configure the required environment variables

echo "🔧 Shopify All Products Sync Setup"
echo "=================================="
echo ""

# Get shop domain
echo "📍 What's your Shopify shop domain?"
echo "   Example: my-store.myshopify.com"
read -p "Shop domain: " SHOP_DOMAIN

# Get access token
echo ""
echo "🔑 What's your Shopify access token?"
echo "   You can find this in your app settings or Partner Dashboard"
echo "   It should start with 'shpat_' or similar"
read -p "Access token: " ACCESS_TOKEN

# Create .env file
echo ""
echo "💾 Creating .env file..."
cat > .env << EOF
# Shopify Store Configuration
SHOPIFY_SHOP_DOMAIN=$SHOP_DOMAIN
SHOPIFY_ACCESS_TOKEN=$ACCESS_TOKEN
EOF

echo "✅ Environment configured!"
echo ""
echo "📋 Your .env file contains:"
echo "   SHOPIFY_SHOP_DOMAIN=$SHOP_DOMAIN"
echo "   SHOPIFY_ACCESS_TOKEN=${ACCESS_TOKEN:0:8}..."
echo ""
echo "🚀 Now you can run the sync:"
echo "   node sync-all-products.js"
echo ""
echo "⚠️  Make sure your access token has these scopes:"
echo "   - read_products"
echo "   - write_products" 
echo "   - read_product_listings"
