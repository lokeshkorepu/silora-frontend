import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { CartBar } from '../../core/cart-bar/cart-bar';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CartBar],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  products: Product[] = [];
  categories: any[] = [];
  selectedCategory: any = null;

  loading = true;
  isCartOpen = false;

  @ViewChild('productsGrid') productsGrid!: ElementRef;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {

    /* =========================
       CART STATE
    ========================== */
    this.cartService.cartOpen$.subscribe(value => {
      this.isCartOpen = value;
    });

    /* =========================
       LOAD CATEGORIES (REAL-TIME)
    ========================== */
    this.categoryService.getCategories().subscribe(data => {
      this.categories = data;

      if (data.length && !this.selectedCategory) {
        this.selectedCategory = data[0];
      }
    });

    /* =========================
       LOAD PRODUCTS (REAL-TIME)
    ========================== */
    this.productService.getProducts().subscribe({
      next: (res: Product[]) => {
        this.products = res ?? [];
        this.syncWithCart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Product fetch failed:', err);
        this.products = [];
        this.loading = false;
      }
    });
  }

  /* =========================
     FILTER PRODUCTS BY CATEGORY
  ========================== */
  get filteredProducts(): Product[] {
    if (!this.selectedCategory?.name) return [];

    return this.products.filter(
      p => p.category === this.selectedCategory.name
    );
  }

  /* =========================
     CART SYNC
  ========================== */
  syncWithCart() {
    const cartItems = this.cartService.getCartItems();

    this.products.forEach(product => {
      const cartItem = cartItems.find(c => c.id === product.id);
      product.count = cartItem ? cartItem.count : 0;
    });
  }

  addProduct(product: Product) {
    this.cartService.addToCart(product);
  }

  increase(product: Product) {
    this.cartService.increase(product);
  }

  decrease(product: Product) {
    this.cartService.decrease(product);
  }

  getCount(product: Product): number {
    if (!product.id) return 0;
    return this.cartService.getProductCount(product.id);
  }

  /* =========================
     SIDEBAR CLICK
  ========================== */
  scrollToCategory(category: any) {
    this.selectedCategory = category;

    if (!this.productsGrid) return;

    this.productsGrid.nativeElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  openCart() {
    this.cartService.openCart();
  }

  /* =========================
     IMAGE FALLBACK
  ========================== */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('no-image.png')) {
      img.src = 'assets/products/no-image.png';
    }
  }

}
