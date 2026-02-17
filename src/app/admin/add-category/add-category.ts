import { Component } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { FormsModule } from '@angular/forms';  // ✅ ADD THIS
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { deleteObject, ref, getStorage } from 'firebase/storage';
import { doc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-add-category',
  imports: [CommonModule, FormsModule], // ✅ ADD FormsModule HERE
  templateUrl: './add-category.html',
  styleUrls: ['./add-category.css'] 
})

export class AddCategory {

  name = '';
  selectedFile: File | null = null;
  categories$!: Observable<any[]>;
  categoryId: string | null = null;
  isEditMode = false;
  previewImage: string | null = null;
  searchText: string = '';


  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {

    // Load categories
    this.categories$ = this.categoryService.getCategories();

    // Check edit mode
    this.categoryId = this.route.snapshot.paramMap.get('id');

    if (this.categoryId) {
      this.isEditMode = true;

      this.categoryService.getCategoryById(this.categoryId)
        .subscribe((category: any) => {
          if (category) {
            this.name = category.name || '';
            this.previewImage = category.imageUrl || null; // ✅ show existing image
          }
        });
    }
  }

  // ✅ IMAGE PREVIEW FIX
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async save() {

    if (!this.name) {
      alert('Please enter category name');
      return;
    }

    try {

      if (this.isEditMode && this.categoryId) {

        await this.categoryService.updateCategory(
          this.categoryId,
          this.name,
          this.selectedFile
        );

        alert('Category updated successfully ✅');

      } else {

        if (!this.selectedFile) {
          alert('Please select image');
          return;
        }

        await this.categoryService.addCategory(this.name, this.selectedFile);

        alert('Category added successfully ✅');
      }

      // ✅ Reset form instead of full navigation reload
      this.resetForm();

    } catch (error) {
      console.error(error);
      alert('Operation failed ❌');
    }
  }

  cancel() {
    this.resetForm();
  }

  resetForm() {
    this.name = '';
    this.selectedFile = null;
    this.previewImage = null;
    this.isEditMode = false;
    this.categoryId = null;
    this.router.navigate(['/admin/add-category']);
  }

  editCategory(category: any) {
    this.router.navigate(['/admin/edit-category', category.id]);
  }

  deleteCategory(category: any) {

  if (!confirm('Are you sure you want to delete this category?')) return;

  this.categoryService
    .deleteCategory(category.id, category.imageUrl)
    .then(() => {
      alert('Category deleted successfully');
    })
    .catch((error: any) => {
      console.error(error);
    });
}


getFilteredCategories(categories: any[]) {

  if (!this.searchText) return categories;

  return categories.filter(category =>
    category.name
      .toLowerCase()
      .includes(this.searchText.toLowerCase())
  );
}


}

