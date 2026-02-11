import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
   styleUrls: ['./home.css'] // 👈 MUST be THIS
})
export class HomeComponent implements OnInit {

  products: Product[] = [];
  categories: { name: string; items: Product[] }[] = [];
  loading = true;
  selectedCategory: { name: string; items: Product[] } | null = null;

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

 ngOnInit(): void {
  this.loading = true;

  this.productService.getProducts().subscribe({
    next: (res: Product[]) => {

      console.log('🔥 RAW PRODUCTS FROM FIRESTORE:', res);

      this.products = res ?? [];

      this.buildCategories();

      console.log('📦 CATEGORIES AFTER BUILD:', this.categories);

      this.selectedCategory = this.categories[0]; // ✅ move this HERE

      console.log('👉 SELECTED CATEGORY:', this.selectedCategory);

      this.syncWithCart();
      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Product API failed', err);
      this.products = [];
      this.categories = [];
      this.loading = false;
    }
  });
}

private buildCategories(): void {
  const map: Record<string, Product[]> = {};

  for (const p of this.products) {
    const category = p.category?.trim() || 'Others';

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


ngAfterViewInit() {
  const container = this.productsGrid.nativeElement as HTMLElement;

  container.addEventListener('scroll', () => {
    const blocks = Array.from(
      container.querySelectorAll('.category-block')
    ) as HTMLElement[];

    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (rect.top >= containerRect.top && rect.top < containerRect.bottom) {
        const categoryName = block.getAttribute('data-category');
        const match = this.categories.find(c => c.name === categoryName);
        if (match) this.selectedCategory = match;
        break;
      }
    }
  });
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
  if (!product.id) return 0;   // ✅ guard
  return this.cartService.getProductCount(product.id);
}


 onImageError(event: Event) {
  const img = event.target as HTMLImageElement;

  // prevent infinite loop
  if (!img.src.includes('no-image.png')) {
    img.src = 'assets/products/no-image.png';
  }
}

@ViewChild('productsGrid') productsGrid!: ElementRef;

scrollToCategory(category: any) {
  const container = this.productsGrid.nativeElement as HTMLElement;
  const target = container.querySelector(
    `[data-category="${category.name}"]`
  ) as HTMLElement;

  if (target) {
    container.scrollTo({
      top: target.offsetTop,
      behavior: 'smooth'
    });
  }

  this.selectedCategory = category;

  setTimeout(() => {
    if(this.productsGrid) {
      this.productsGrid.nativeElement.scrollTo({
        top : 0,
        behavior : 'smooth'
      });
    }
  });
}


}
