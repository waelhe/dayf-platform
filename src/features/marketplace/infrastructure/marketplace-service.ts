/**
 * Marketplace Service
 * Handles all API calls for marketplace functionality
 */

import { Product, ProductsResponse, ProductResponse, CreateProductInput } from '../types';

const API_BASE = '/api/marketplace';

export const marketplaceService = {
  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data: ProductsResponse = await response.json();
      return data.products;
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  },

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch product');
      }
      const data: ProductResponse = await response.json();
      return data.product;
    } catch (error) {
      console.error('Error in getProductById:', error);
      throw error;
    }
  },

  /**
   * Get products by vendor ID
   */
  async getProductsByVendor(vendorId: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE}/products?vendorId=${vendorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products by vendor');
      }
      const data: ProductsResponse = await response.json();
      return data.products;
    } catch (error) {
      console.error('Error in getProductsByVendor:', error);
      throw error;
    }
  },

  /**
   * Create a new product
   */
  async createProduct(product: CreateProductInput): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      if (!response.ok) {
        throw new Error('Failed to create product');
      }
      const data: ProductResponse = await response.json();
      return data.product!;
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw error;
    }
  },

  /**
   * Seed products (batch create)
   */
  async seedProducts(products: Omit<CreateProductInput, 'vendorId'>[], vendorId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/products/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products, vendorId }),
      });
      if (!response.ok) {
        throw new Error('Failed to seed products');
      }
    } catch (error) {
      console.error('Error in seedProducts:', error);
      throw error;
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw error;
    }
  },

  /**
   * Update a product
   */
  async updateProduct(id: string, data: Partial<CreateProductInput>): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      const result: ProductResponse = await response.json();
      return result.product!;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw error;
    }
  },
};
