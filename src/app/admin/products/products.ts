import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
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
  totalProducts: number = 0;

  categories: any[] = [];
  subCategoryMap: { [key: string]: string } = {};

  selectedCategory: string = '';

  loading = true;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  pageSize = 20;

  constructor(
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private firestore: Firestore,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadSubCategories();
    this.initializeSearch();
    this.loadAllProducts();

  this.productService.getProducts().subscribe(products => {
    this.products = products;
  });

}

  

  /* =========================
     LOAD SUBCATEGORIES MAP
  ========================== */
  private loadSubCategories(): void {
    this.categoryService.getAllSubCategories().subscribe(subs => {

      this.subCategoryMap = {};

      subs.forEach((sub: any) => {
        this.subCategoryMap[sub.id] = sub.name;
      });

      console.log('SubCategory Map Ready:', this.subCategoryMap);
    });
  }

  /* =========================
     SEARCH INIT
  ========================== */
  private initializeSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  /* =========================
     LOAD PRODUCTS
  ========================== */
  loadAllProducts() {

    this.loading = true;

    this.productService
      .getFilteredProducts(this.selectedCategory, this.pageSize)
      .subscribe({
        next: (data) => {

          this.products = data;

          this.productService.getAllProductsCount().subscribe(count => {
            this.totalProducts = count;
          });

          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loading = false;
        }
      });
  }

  /* =========================
     On Category Change
  ========================== */

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.loadAllProducts();
  }

  /* =========================
       Delete Product
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
       Edit Product
  ========================== */

  editProduct(product: Product) {
    this.router.navigate(['/admin/add-product', product.id]);
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  performSearch(value: string) {

    const search = value.toLowerCase().trim();

    if (!search) {
      this.loadAllProducts();
      return;
    }

    this.products = this.products.filter(product =>
      product.name.toLowerCase().includes(search)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.loadAllProducts();
  }

getFormattedStock(product: any): string {

  // If new structure exists
  if (product.quantityValue && product.quantityUnit) {

    const total = 
  (Number(product.quantityValue) || 0) *
  (Number(product.stockQuantity) || 0);

    if (isNaN(total)) return '-';

    if (product.quantityUnit === 'g') {
      if (total >= 1000) {
        return (total / 1000).toFixed(2) + ' kg';
      }
      return total + ' g';
    }

    if (product.quantityUnit === 'ml') {
      if (total >= 1000) {
        return (total / 1000).toFixed(2) + ' l';
      }
      return total + ' ml';
    }

    return total + ' ' + product.quantityUnit;
  }

  // OLD STRUCTURE (fallback)
  if (product.stockQuantity && product.quantity) {
    return product.stockQuantity + ' ' + product.quantity;
  }

  return '-';
}

getDisplayQuantity(product: any): string {

  // NEW STRUCTURE
  if (product.quantityValue && product.quantityUnit) {
    return product.quantityValue + ' ' + product.quantityUnit;
  }

  // OLD STRUCTURE (Fallback)
  if (product.quantity) {
    return product.quantity;
  }

  return '-';
}

onPageSizeChange() {
    this.loadAllProducts();
  }
}