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

  name = '';
  price: number | null = null;
  category = '';
  quantity = '';
  selectedFile: File | null = null;
  previewUrl = 'assets/products/no-image.png';

  constructor(private productService: ProductService) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

     if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file); // 👈 preview
  }

  async saveProduct() {
    if (!this.name || !this.price || !this.category || !this.quantity) {
      alert('Fill all fields');
      return;
    }

    if (!this.selectedFile) {
      alert('Select image');
      return;
    }

    try {
      const imageUrl = await this.productService.uploadImage(this.selectedFile);

      await this.productService.addProduct({
        name: this.name,
        price: Number(this.price),
        category: this.category,
        quantity: this.quantity,
        imageUrl
      });

      alert('Product added');
      this.resetForm();

    } catch (e) {
      console.error(e);
      alert('Upload failed');
    }
  }

  resetForm() {
    this.name = '';
    this.price = null;
    this.category = '';
    this.quantity = '';
    this.selectedFile = null;
    this.previewUrl = 'assets/products/no-image.png';
  }
}
