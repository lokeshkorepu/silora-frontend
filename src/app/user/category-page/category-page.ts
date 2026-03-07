import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { CartBar } from '../../core/cart-bar/cart-bar';
import { CategoryService } from '../../core/services/category.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { debounceTime, skip } from 'rxjs/operators';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, CartBar, RouterModule],
  templateUrl: './category-page.html',
  styleUrls: ['./category-page.css']
})
export class CategoryPageComponent implements OnInit {

  products: Product[] = [];
  subcategories: any[] = [];

  categoryId!: string;
  subcategoryId!: string | null;

  // ✅ ADD THIS
  subcategoryName: string = '';
  subcategoryDescription: string = '';

  loading = true;
  isCartOpen = false;

  currentSearchText: string = '';

  @ViewChild('productsGrid') productsGrid!: ElementRef;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    /* =========================
       CART LISTENER
    ========================== */
    this.cartService.cartOpen$.subscribe(value => {
      this.isCartOpen = value;
    });

    /* =========================
       ROUTE LISTENER
    ========================== */
    this.route.paramMap.subscribe(params => {

      this.categoryId = params.get('categoryId')!;
      this.subcategoryId = params.get('subcategoryId');


      if (!this.categoryId) return;

      // 🔥 Load subcategories (parentId based)
      this.categoryService.getSubcategories(this.categoryId)
        .subscribe((subs: any[]) => {


          this.subcategories = subs ?? [];

          // If no subcategory in URL → auto select first
          if (!this.subcategoryId && this.subcategories.length > 0) {

            const firstSub = this.subcategories[0];

            this.router.navigate([
              '/category',
              this.categoryId,
              firstSub.id
            ]);

            return;
          }

          // ✅ SET SUBCATEGORY NAME HERE
          const selectedSub = this.subcategories.find(
            sub => sub.id === this.subcategoryId
          );


          this.subcategoryName = selectedSub?.name || '';
          this.subcategoryDescription = selectedSub?.descriptionHTML || '';


          // Load products if subcategory exists
          if (this.subcategoryId) {
            this.loadProducts(this.subcategoryId);
          }
        });

    });

    /* =========================
       GLOBAL SEARCH LISTENER
    ========================== */
    this.productService.search$
      .pipe(debounceTime(300), skip(1))
      .subscribe(text => {
        this.currentSearchText = text;
      });
  }

  /* =========================
     LOAD PRODUCTS
  ========================== */
  loadProducts(subcategoryId: string) {

  this.loading = true;

  this.productService
    .getProducts()
    .subscribe((res: Product[]) => {

      const allProducts = res ?? [];

      this.products = allProducts
      .filter(p =>p.subcategoryId === subcategoryId)
      .sort((a: any, b: any) =>
        a.createdAt?.seconds - b.createdAt?.seconds
      );

      this.syncWithCart();
      this.loading = false;

    }, () => {
      this.loading = false;
    });

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
     IMAGE FALLBACK
  ========================== */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('no-image.png')) {
      img.src = 'assets/products/no-image.png';
    }
  }

  getAvailableUnits(product: Product): number {

    if (!product.stockQuantity || !product.quantityValue) return 0;

    const unitWeight = Number(product.quantityValue || '0');
    const stock = product.stockQuantity || 0;

    if (unitWeight === 0) return 0;

    return Math.floor(stock / unitWeight);
  }

  isLowStock(product: Product): boolean {
    const units = this.getAvailableUnits(product);
    return units > 0 && units <= 3;
  }

  getLowStockClass(product: Product): string {
    const units = this.getAvailableUnits(product);
    if (units === 1) return 'low-critical';
    return 'low-warning';
  }

  highlight(text: string): string {

    if (!this.currentSearchText) return text;

    const search = this.currentSearchText.trim();
    if (!search) return text;

    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, `<span class="highlight-text">$1</span>`);
  }

  trackById(index: number, item: any) {
    return item.id;
  }

/* =========================
   VARIANT POPUP
========================== */

selectedProduct: Product | null = null;

/* ADD BUTTON CLICK */
handleAddClick(product: Product) {

  // If product has variants
  if (product.optionsCount && product.optionsCount > 1) {

    if (!product.id) return;

    this.productService
      .getProductVariants(product.id)
      .subscribe((variants: any[]) => {

        this.selectedProduct = {
          ...product,
          variants: variants
        };

      });

  } else {

    // Normal product
    this.addProduct(product);

  }

}

/* CLOSE POPUP */
closeOptionsPopup() {
  this.selectedProduct = null;
}

/* ADD VARIANT TO CART */
addVariantToCart(variant: any) {

  if (!this.selectedProduct) return;

  const variantProduct: Product = {

    ...this.selectedProduct,

    price: variant.price,

    quantityValue: variant.quantity,

    id: this.selectedProduct.id + '_' + variant.id

  };

  this.cartService.addToCart(variantProduct);

  this.selectedProduct = null;

}

getVariantDiscount(variant: any): number {

  if (!variant.mrp || !variant.price) return 0;

  const discount =
    ((variant.mrp - variant.price) / variant.mrp) * 100;

  return Math.round(discount);

}

}