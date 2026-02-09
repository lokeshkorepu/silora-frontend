import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { CartBar } from '../../core/cart-bar/cart-bar';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,
            CartBar],
  templateUrl: './home.html',
   styleUrls: ['./home.css'] // 👈 MUST be THIS
})
export class HomeComponent implements OnInit {

  products: Product[] = [];
  categories: { name: string; items: Product[] }[] = [];
  loading = true;

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

 ngOnInit(): void {
  this.loading = true;

  this.productService.getProducts().subscribe({
    next: (res: Product[]) => {
      this.products = res ?? [];
      this.buildCategories();
      this.syncWithCart();
      this.loading = false;
    },
    error: (err) => {
      console.error('Product API failed', err);
      this.products = [];
      this.categories = [];
      this.loading = false;
    }
  });
}


  private buildCategories(): void {
  const map: Record<string, Product[]> = {};

  for (const p of this.products) {
    const category = p.category?.trim() || 'Others'; // ✅ fallback

    if (!map[category]) {
      map[category] = [];
    }

    map[category].push(p);
  }

  this.categories = Object.keys(map).map(key => ({
    name: key,
    items: map[key]
  }));
}


syncWithCart() {
  const cartItems = this.cartService.getCartItems();

  this.products.forEach(product => {
    const cartItem = cartItems.find(c => c.id === product.id);
    product.count = cartItem ? cartItem.count : 0;
  });
}

  addProduct(product: any) {
    this.cartService.addToCart(product);
    //product.count = 1;
  }

  increase(product: any) {
    this.cartService.increase(product);
    //product.count++;
  }

  decrease(product: any) {
    this.cartService.decrease(product);
    //product.count--;
  }

  getCount(product: Product): number {
    return this.cartService.getProductCount(product.id);
  }
}
