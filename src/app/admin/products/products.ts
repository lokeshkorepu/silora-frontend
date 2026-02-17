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
  categories: string[] = [];
  selectedCategory: string = '';
  loading = true;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  categoryCounts: { [key: string]: number } = {};
  pageSize = 20;
  allProducts: Product[] = [];




  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllProducts();

    // Debounce search (professional search)
  this.searchSubject
    .pipe(
      debounceTime(400),
      distinctUntilChanged()
    )
    .subscribe(value => {
      this.performSearch(value);
    });
  }

  /* =========================
     LOAD ALL PRODUCTS
  ========================== */
 loadAllProducts() {

  this.loading = true;

  this.productService
    .getFilteredProducts(
      this.selectedCategory,
      this.pageSize
    )
    .subscribe((data) => {

      this.allProducts = data;
      this.products = data;

      if (!this.selectedCategory) {
        this.extractCategories(data);
      }

      this.loading = false;
    });
}



  /* =========================
     FILTER BY CATEGORY
  ========================== */
  onCategoryChange(category: string) {

    this.selectedCategory = category;
    this.loading = true;
     this.loadAllProducts();    
  }

  /* =========================
     EXTRACT UNIQUE CATEGORIES
  ========================== */
  extractCategories(products: Product[]) {

  const counts: { [key: string]: number } = {};

  products.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  this.categoryCounts = counts;
  this.categories = Object.keys(counts);
}


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
     SEARCH PRODUCT
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


loadMore() {
  this.pageSize += 20;
  this.loadAllProducts();
}



}
