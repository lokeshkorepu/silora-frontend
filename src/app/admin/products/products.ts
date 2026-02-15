import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';




@Component({
  selector: 'app-products',
  standalone: true,
imports: [
  CommonModule,
  MatIconModule
],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit {

  products: Product[] = [];
  loading = true;

  constructor(private productService: ProductService,
              private dialog: MatDialog,
              private router: Router
  ) {}

  ngOnInit() {
  this.productService.getProducts().subscribe(data => {
    this.products = data;
    this.loading = false;
  });
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



}
