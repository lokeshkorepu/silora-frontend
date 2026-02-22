import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css']
})
export class AddProductComponent {

  product = {
    name: '',
    price: null as number | null,
    categoryId: '',
    quantity: null as number | null,
    discount: null as number | null
  };

  selectedFile: File | null = null;
  previewImage: string = 'assets/products/no-image.png';
  isSaving = false;
  productForm!: FormGroup;
  isEditMode = false;
  categories$ : any;

  
  
  constructor(
    private productService: ProductService,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {

    // 🔥 Firestore Categories
       this.categories$ = this.categoryService.getCategories();

    this.productForm = this.fb.group({
      name: [''],
      price: [''],
      categoryId: [''],
      quantity: [''],
      discount: [''],
      stockQuantity: [0]
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;

      this.productService.getProductById(id).subscribe((product: any) => {
        if (product) {
          this.productForm.patchValue({
                  ...product,
                  stockQuantity: product.stockQuantity ?? 0
              });

          this.previewImage = product.imageUrl;
        }
      });
    }
  }

  /* =========================
     FILE SELECT
  ========================== */
  onFileSelected(event: any): void {

    const file: File = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  /* =========================
     SAVE PRODUCT
  ========================== */
  async saveProduct(): Promise<void> {

    if (this.productForm.invalid) {
      alert('Please fill all fields');
      return;
    }

    const formValue = this.productForm.value;
    const id = this.route.snapshot.paramMap.get('id');

    const originalPrice = Number(formValue.price);
    const discountPercentage = Number(formValue.discount) || 0;

    // ✅ Calculate final price
    const finalPrice = discountPercentage > 0
      ? Math.round(originalPrice - (originalPrice * discountPercentage / 100))
      : originalPrice;

    const productData = {
      name: formValue.name,
      price: finalPrice,              // ✅ selling price
      originalPrice: originalPrice,   // ✅ MRP
      discountPercentage: discountPercentage,
      quantity: formValue.quantity,
      stockQuantity: Number(formValue.stockQuantity || 0),
      categoryId: formValue.categoryId,
      createdAt: new Date()
    };

    try {
      this.isSaving = true;

      if (this.isEditMode && id) {

        // 🔥 UPDATE (image optional)
        await this.productService.updateProduct(id, productData);
        alert('Product updated successfully ✅');

      } else {

        if (!this.selectedFile) {
          alert('Please select product image');
          this.isSaving = false;
          return;
        }

        // 🔥 NEW ADD (pass file directly)
        await this.productService.addProduct(          
            productData,
            this.selectedFile
            // createdAt: new Date()          
          // this.selectedFile
        );

        alert('Product added successfully ✅');
      }

      this.router.navigate(['/admin/products']);

    } catch (error) {
      console.error(error);
      alert('Operation failed ❌');
    } finally {
      this.isSaving = false;
    }
  }

  /* =========================
     RESET FORM
  ========================== */
  resetForm(): void {

    this.product = {
      name: '',
      price: null,
      categoryId: '',
      quantity: null,
      discount: null
    };

    this.productForm.reset();
    this.selectedFile = null;
    this.previewImage = 'assets/products/no-image.png';
  }
}
