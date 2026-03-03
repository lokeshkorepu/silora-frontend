import { Component } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-add-category',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-category.html',
  styleUrls: ['./add-category.css']
})
export class AddCategory {

  name = '';
  selectedFile: File | null = null;

  categories$!: Observable<any[]>;
  mainCategories$!: Observable<any[]>;

  categoryId: string | null = null;
  isEditMode = false;

  previewImage: string | null = null;
  searchText: string = '';
  parentId: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {

    // 🔥 Load all categories
    this.categories$ = this.categoryService.getAllCategories();

    // 🔥 Derive main categories from same collection
    this.mainCategories$ = this.categoryService.getAllCategories().pipe(
      map(categories =>
        categories.filter(cat => !cat.parentId)
      )
    );

    // Edit mode check
    this.categoryId = this.route.snapshot.paramMap.get('id');

    if (this.categoryId) {
      this.isEditMode = true;

      this.categoryService.getCategoryById(this.categoryId)
        .subscribe((category: any) => {
          if (category) {
            this.name = category.name || '';
            this.parentId = category.parentId ?? null;
            this.previewImage = category.imageUrl || null;
          }
        });
    }
  }

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

    if (!this.name.trim()) {
      alert('Please enter category name');
      return;
    }

    try {

      if (this.isEditMode && this.categoryId) {

        await this.categoryService.updateCategory(
          this.categoryId,
          this.name,
          this.selectedFile,
          this.parentId
        );

        alert('Category updated successfully ✅');

      } else {

        if (!this.selectedFile) {
          alert('Please select image');
          return;
        }

        await this.categoryService.addCategory(
          this.name,
          this.selectedFile,
          this.parentId
        );

        alert('Category added successfully ✅');
      }

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
    this.parentId = null;
    this.router.navigate(['/admin/add-category']);
  }

  editCategory(category: any) {
    this.router.navigate(['/admin/edit-category', category.id]);
  }

  async deleteCategory(category: any) {

    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await this.categoryService.deleteCategorySafe(category);
      alert('Category deleted successfully ✅');
    } catch (error: any) {
      alert(error.message);
    }
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