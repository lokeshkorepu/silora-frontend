import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css']
})
export class AddProductComponent {

  products: any[] = [
    this.createEmptyProduct()
  ];

  constructor(private productService: ProductService) {}

  createEmptyProduct() {
    return {
      name: '',
      price: null,
      category: '',
      image: '',
      quantity: ''
    };
  }

  addRow() {
    this.products.push(this.createEmptyProduct());
  }

  removeRow(index: number) {
    this.products.splice(index, 1);
  }

  async submitAll() {
  for (const p of this.products) {
    if (p.file) {
      p.image = await this.productService.uploadImage(p.file);
    }
    delete p.file;
    await this.productService.addProduct(p);
  }

  alert('All products with images added successfully');
  this.products = [this.createEmptyProduct()];
}


  onFileSelected(event: any, index: number) {
  const file = event.target.files[0];
  if (file) {
    this.products[index].file = file;
  }
}

}
