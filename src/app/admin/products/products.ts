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

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.loadAllProducts();
  }

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

  getFormattedStock(product: Product): string {

    if (!product.stockQuantity || !product.quantity) return '0';

    const quantityText = product.quantity.trim();
    const parts = quantityText.split(' ');

    if (parts.length < 2) return product.stockQuantity.toString();

    const unit = parts[1];

    return `${product.stockQuantity} ${unit}`;
  }

  onPageSizeChange() {
    this.loadAllProducts();
  }
}