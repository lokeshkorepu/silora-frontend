import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Router } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css']
})
export class AddProductComponent {

  selectedFile: File | null = null;
  previewImage: string = 'assets/products/no-image.png';
  isSaving = false;
  productForm!: FormGroup;
  categories$: any;
  subcategories: any[] = [];
  subcategories$: any;
  mainCategories: any[] = [];

  constructor(
    private productService: ProductService,
    private router: Router,
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {

    this.loadSubcategories();
    this.loadMainCategories();

    this.subcategories$ = this.categoryService.getAllSubCategories();

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      subcategorySlug: ['', Validators.required],
      quantity: [''],
      discount: [''],
      stockQuantity: [''],
      subcategoryId: ['', Validators.required]   // ✅ INSIDE form group
    });

    this.productForm.get('categorySlug')?.valueChanges.subscribe(slug => {

      if (!slug) {
        this.subcategories = [];
        return;
      }

      this.categoryService.getSubcategories(slug)
        .subscribe(res => {
          this.subcategories = res ?? [];
        });
    });
  }

loadSubcategories() {
  this.categoryService.getAllSubCategories()
    .subscribe(data => {

      this.subcategories = data.map((doc: any) => ({
        id: doc.id,                  // document ID
        name: doc.name,              // subcategory name
        parentId: doc.parentId,      // main category ID
        parentName: doc.parentName   // main category name
      }));

      console.log('Loaded subcategories:', this.subcategories);
    });
}

loadMainCategories() {
  this.categoryService.getMainCategories()
    .subscribe(data => {
      this.mainCategories = data;
    });
}

  onFileSelected(event: any): void {

    const file: File = event.target.files?.[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
// SAVE PRODUCT
  async saveProduct(): Promise<void> {

  const formValue = this.productForm.value;

  if (!formValue.subcategoryId) {
    alert('Select subcategory');
    return;
  }

  if (!this.selectedFile) {
    alert('Select product image');
    return;
  }

  // 🔹 Find selected subcategory
  const selectedSub = this.subcategories.find(
    s => s.id === formValue.subcategoryId
  );

  if (!selectedSub) {
    alert('Subcategory not found');
    return;
  }

  // 🔹 Price Calculation
  const originalPrice = Number(formValue.price);
  const discountPercentage = Number(formValue.discount) || 0;

  const finalPrice = discountPercentage > 0
    ? Number((originalPrice - (originalPrice * discountPercentage / 100)).toFixed(2))
    : originalPrice;

  // ✅ ONLY STORE IDS (BEST PRACTICE)
  const productData = {
    name: formValue.name,
    price: finalPrice,
    originalPrice: originalPrice,
    discountPercentage: discountPercentage,
    quantity: formValue.quantity,
    stockQuantity: Number(formValue.stockQuantity || 0),

    categoryId: selectedSub.parentId,   // main category id
    subcategoryId: selectedSub.id       // subcategory id
  };

  try {
    this.isSaving = true;

    await this.productService.addProduct(productData, this.selectedFile);

    alert('Product added successfully ✅');
    this.router.navigate(['/admin/products']);

  } catch (error) {
    console.error(error);
    alert('Failed ❌');
  } finally {
    this.isSaving = false;
  }
}
}