import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { doc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})

export class Products implements OnInit {

  products: Product[] = [];
  allProducts: Product[] = [];
  totalProducts: number = 0;

categories: any[] = [];
categoryMap: { [key: string]: string } = {};
selectedCategory: string = '';

  loading = true;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  categoryCounts: { [key: string]: number } = {};

  pageSize = 20;

  constructor(
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private firestore: Firestore,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {

    this.loadAllProducts();

    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.performSearch(value);
      });

      this.categoryService.getCategories().subscribe((cats: any[]) => {

  this.categories = cats;

  cats.forEach(cat => {
    this.categoryMap[cat.id] = cat.name;
  });

});
  }

  /* =========================
     LOAD PRODUCTS
  ========================== */
  loadAllProducts() {

    this.loading = true;

    this.productService
      .getFilteredProducts(
        this.selectedCategory,
        this.pageSize
      )
      .subscribe((data) => {

        // this.allProducts = data;
        this.products = data;
        this.productService.getAllProductsCount().subscribe(count => {
         this.totalProducts = count;
       });

        // // keep original category extraction logic
        // if (!this.selectedCategory) {
        //   this.extractCategories(data);
        // }

        // snackbar for out of stock
        data.forEach(product => {
          if (this.getAvailableUnits(product) === 0) {
            this.snackBar.open(
              `${product.name} is out of stock! Reorder required.`,
              'Close',
              { duration: 4000 }
            );
          }
        });

        this.loading = false;
      });
  }

  /* =========================
     FILTER BY CATEGORY
  ========================== */
  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.loadAllProducts();
  }

  // /* =========================
  //    EXTRACT UNIQUE CATEGORY IDS
  // ========================== */
  // extractCategories(products: Product[]) {

  //   const counts: { [key: string]: number } = {};

  //   products.forEach(p => {
  //     counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
  //   });

  //   this.categoryCounts = counts;
  //   this.categories = Object.keys(counts);
  // }

  /* =========================
     DELETE PRODUCT
  ========================== */
  async deleteProduct(id: string) {

    const confirmDelete = confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      await this.productService.deleteProduct(id);
      alert('Product deleted successfully ✅');
    } catch (error) {
      console.error(error);
      alert('Delete failed ❌');
    }
  }

  /* =========================
     EDIT PRODUCT
  ========================== */
  editProduct(product: Product) {
    this.router.navigate(['/admin/add-product', product.id]);
  }

  /* =========================
     SEARCH
  ========================== */
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  performSearch(value: string) {

    const search = value.toLowerCase().trim();

    if (!search) {
      this.products = this.allProducts;
      return;
    }

    this.products = this.allProducts.filter(product =>
      product.name.toLowerCase().includes(search)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.products = this.allProducts;
  }  

  /* =========================
     STOCK LOGIC
  ========================== */
  getAvailableUnits(product: Product): number {

    if (!product.stockQuantity || !product.quantity) return 0;

    const unitWeight = parseInt(product.quantity || '0');
    const stock = product.stockQuantity || 0;

    if (unitWeight === 0) return 0;

    return Math.floor(stock / unitWeight);
  }

  shouldReorder(product: Product): boolean {
    return this.getAvailableUnits(product) <= 5;
  }

  getReorderQuantity(product: Product): number {

    const idealStock = 30;
    const currentUnits = this.getAvailableUnits(product);

    if (currentUnits >= idealStock) return 0;

    return idealStock - currentUnits;
  }

  async restockProduct(product: Product) {

    if (!product.id) return;

    const reorderUnits = this.getReorderQuantity(product);
    if (reorderUnits <= 0) return;

    const unitWeight = parseInt(product.quantity || '0');
    const additionalStock = reorderUnits * unitWeight;
    const newStock = (product.stockQuantity || 0) + additionalStock;

    await updateDoc(
      doc(this.firestore, `products/${product.id}`),
      { stockQuantity: newStock }
    );

    this.snackBar.open(
      `${product.name} restocked successfully`,
      'Close',
      { duration: 3000 }
    );
  }

  getFormattedStock(product: Product): string {

  if (!product.stockQuantity || !product.quantity) return '0';

  const quantityText = product.quantity.trim();   // "150 g", "2 kg", "5 pcs"
  const parts = quantityText.split(' ');

  if (parts.length < 2) return product.stockQuantity.toString();

  const unit = parts[1];  // g, kg, pcs

  return `${product.stockQuantity} ${unit}`;
}

async bulkRestockLowStock() {

  const lowStockProducts = this.products.filter(p =>
    this.shouldReorder(p)
  );

  if (lowStockProducts.length === 0) {
    this.snackBar.open('No low stock products found', 'Close', {
      duration: 3000
    });
    return;
  }

  for (const product of lowStockProducts) {

    if (!product.id) continue;

    const reorderUnits = this.getReorderQuantity(product);
    const unitWeight = parseInt(product.quantity || '0');

    const additionalStock = reorderUnits * unitWeight;
    const newStock = (product.stockQuantity || 0) + additionalStock;

    await updateDoc(
      doc(this.firestore, `products/${product.id}`),
      { stockQuantity: newStock }
    );
  }

  this.snackBar.open(
    `${lowStockProducts.length} products restocked successfully`,
    'Close',
    { duration: 4000 }
  );
}

onPageSizeChange() {
  this.loadAllProducts();
}

}