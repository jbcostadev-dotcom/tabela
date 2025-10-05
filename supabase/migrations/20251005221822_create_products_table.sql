/*
  # Create products table for LOCK PHARMA pricing

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `description` (text) - Detailed product description
      - `category` (text) - Either 'injectable' or 'oral'
      - `price` (decimal) - Product price in BRL
      - `image_url` (text, optional) - Product image URL
      - `brand` (text) - Brand name
      - `stock` (integer) - Available stock quantity
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access (catalog browsing)
    - Add policy for authenticated users to manage products (admin)

  3. Important Notes
    - Prices are stored with 2 decimal precision
    - Stock defaults to 0
    - Categories are constrained to valid values
    - Updated_at automatically updates on row modification
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('injectable', 'oral')),
  price decimal(10, 2) NOT NULL CHECK (price >= 0),
  image_url text,
  brand text NOT NULL DEFAULT 'LOCK PHARMA',
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view products (public catalog)
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  USING (true);

-- Only authenticated users can insert products
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update products
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete products
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();