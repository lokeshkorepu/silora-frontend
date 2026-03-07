import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Router } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';
import { ActivatedRoute } from '@angular/router';

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
  activeTab: string = 'basic';
  isEditMode = false;
  productId: string | null = null;
  variants: any[] = [];
  variantFiles: { [key: number]: File } = {};

  constructor(
    private productService: ProductService,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private categoryService: CategoryService
  ) {}  

  ngOnInit() {

    this.loadSubcategories();
    this.loadMainCategories();

    this.subcategories$ = this.categoryService.getAllSubCategories();

    this.productId = this.route.snapshot.paramMap.get('id');

  if (this.productId) {
    this.isEditMode = true;
    this.loadProductData(this.productId);
  }

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      discount: [''],
      subcategoryId: ['', Validators.required],   // ✅ INSIDE form group

      hsnCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6,8}$/)]],

      gstType: ['GST'],
      gstPercentage: [0],

      cgst: [{ value: 0, disabled: true }],
      sgst: [{ value: 0, disabled: true }],
      igst: [{ value: 0, disabled: true }],
      cess: [0],

      quantityValue: [0],
      quantityUnit: ['g'],
      stockQuantity: [0],
      optionsCount: [0],
      isActive: [true] 
    });

    this.productForm.get('optionsCount')?.valueChanges.subscribe(count => {

  this.variants = [];

  const total = Number(count) || 0;

  for (let i = 0; i < total; i++) {
    this.variants.push({
      quantity: '',
      price: 0,
      mrp: 0
    });
  }

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

loadProductData(id: string) {
  this.productService.getProductById(id).subscribe(product => {

    if (!product) {
      console.error('Product not found');
      return;
    }

    this.productForm.patchValue({

      name: product.name,

      // ✅ VERY IMPORTANT FIX
      price: product.originalPrice,

      discount: product.discountPercentage || 0,

      subcategoryId: product.subcategoryId,

      quantityValue: product.quantityValue,
      quantityUnit: product.quantityUnit,
      stockQuantity: product.stockQuantity,

      hsnCode: product.hsnCode,
      gstType: product.gstType,
      gstPercentage: product.gstPercentage,
      cgst: product.cgst,
      sgst: product.sgst,
      igst: product.igst,
      cess: product.cess

    });

    if (product.imageUrl) {
      this.previewImage = product.imageUrl;
    }

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

  if (this.productForm.invalid) {
    console.log('Form invalid');
    return;
  }

  const formValue = this.productForm.getRawValue();

  const originalPrice = Number(formValue.price);
  const discountPercentage = Number(formValue.discount) || 0;

  const finalPrice = discountPercentage > 0
    ? Number((originalPrice - (originalPrice * discountPercentage / 100)).toFixed(2))
    : originalPrice;

  const productData = {

    name: formValue.name,

    originalPrice,
    discountPercentage,
    price: finalPrice,

    quantityValue: Number(formValue.quantityValue),
    quantityUnit: formValue.quantityUnit,
    stockQuantity: Number(formValue.stockQuantity),
    optionsCount: formValue.optionsCount,

    hsnCode: formValue.hsnCode,
    gstType: formValue.gstType,
    gstPercentage: Number(formValue.gstPercentage),
    cgst: Number(formValue.cgst),
    sgst: Number(formValue.sgst),
    igst: Number(formValue.igst),
    cess: Number(formValue.cess),

    subcategoryId: formValue.subcategoryId,

    isActive: formValue.isActive ?? true,

    updatedAt: new Date()
  };

  try {

    if (this.isEditMode && this.productId) {

      // ✅ UPDATE MODE (image optional)
      await this.productService.updateProduct(
        this.productId,
        productData,
        this.selectedFile ?? undefined
      );

      console.log('✅ Product Updated');

    } else {

      if (!this.selectedFile) {
        console.error('No image selected');
        return;
      }

      // ✅ ADD MODE (image required)
      const productId = await this.productService.addProduct(
  productData,
  this.selectedFile
);

for (let i = 0; i < this.variants.length; i++) {

  const v = this.variants[i];

  const variantData = {
    quantity: v.quantity || '',
    price: Number(v.price) || 0,
    mrp: Number(v.mrp) || 0,
    stock: Number(v.stock) || 0
  };

  const file = this.variantFiles[i];

  await this.productService.addVariant(
    productId,
    variantData,
    file
  );

}

      console.log('✅ Product Added');
    }

    this.router.navigate(['/admin/products']);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

onGstPercentageChange(): void {

  const gst = Number(this.productForm.get('gstPercentage')?.value) || 0;
  const type = this.productForm.get('gstType')?.value;

  if (type === 'GST') {

    this.productForm.patchValue({
      cgst: gst / 2,
      sgst: gst / 2,
      igst: 0
    });

  }

  else if (type === 'IGST') {

    this.productForm.patchValue({
      cgst: 0,
      sgst: 0,
      igst: gst
    });

  }

  else if (type === 'EXEMPT') {

    this.productForm.patchValue({
      gstPercentage: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0
    });

  }
}

onCancel(): void {

  if (this.isEditMode) {
    // If editing → go back to products list
    this.router.navigate(['/admin/products']);
  } else {
    // If adding → go to dashboard
    this.router.navigate(['/admin']);
  }

}

addVariant() {

  this.variants.push({
    quantity: '',
    price: 0,
    mrp: 0,
    stock: 0,
    image: ''
  });

}

removeVariant(index: number) {

  this.variants.splice(index, 1);

}

onVariantImageSelected(event: any, index: number) {

  const file = event.target.files[0];

  if (!file) return;

  this.variantFiles[index] = file;

}

}