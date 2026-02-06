import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PRODUCTS } from '../../core/data/products';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { CartBar } from '../../core/cart-bar/cart-bar';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,
            CartBar],
  templateUrl: './home.html',
   styleUrls: ['./home.css'] // 👈 MUST be THIS
})
export class HomeComponent {

  products = PRODUCTS;

  categories: { name: string; items: Product[] }[] = [];

  constructor(private cartService: CartService) { }


  ngOnInit() {
    this.groupByCategory();
      this.syncWithCart();
      this.cartService.clearCart();
      

  }
  

syncWithCart() {
  const cartItems = this.cartService.getCartItems();

  this.products.forEach(product => {
    const cartItem = cartItems.find(c => c.id === product.id);
    product.count = cartItem ? cartItem.count : 0;
  });
}


  groupByCategory() {
    const map = new Map<string, Product[]>();

    this.products.forEach(p => {
      if (!map.has(p.category)) {
        map.set(p.category, []);
      }
      map.get(p.category)!.push(p);
    });

    this.categories = Array.from(map.entries()).map(([name, items]) => ({
      name,
      items
    }));
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
