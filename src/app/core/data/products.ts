import { Product } from '../models/product.model';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Milk',
    price: 28,
    imageUrl: '/assets/Amul Buffalo A2 Milk.avif',
    quantity: '500ml',
    category: 'Dairy',
    count: 0
  },
  {
    id: '2',
    name: 'Bread',
    price: 40,
    imageUrl: '/assets/Bonn High Fibre Brown Bread.avif',
    quantity: '400g',
    category: 'Bakery',
    count: 0
  },
  {
    id: '3',
    name: 'Eggs',
    price: 65,
    imageUrl: '/assets/Eggs.avif',
    quantity: '6 pcs',
    category: 'Eggs',
    count: 0
  }
];
