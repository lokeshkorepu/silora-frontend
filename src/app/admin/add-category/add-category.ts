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
  templateUrl: './add-category.html'
})

export class AddCategory {

  name = '';
  selectedFile: File | null = null;
  categories$!: Observable<any[]>;
  categoryId: string | null = null;
  isEditMode = false;
  

  constructor(private categoryService: CategoryService,
              private route: ActivatedRoute,
              private router: Router
  ) {}

 ngOnInit() {

  // Load category list
  this.categories$ = this.categoryService.getCategories();

  // Check if edit mode
  this.categoryId = this.route.snapshot.paramMap.get('id');

  if (this.categoryId) {
    this.isEditMode = true;

    this.categoryService.getCategoryById(this.categoryId)
      .subscribe((category: any) => {

        if (category) {
          this.name = category.name || '';
        }

      });
  }
}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async save() {

  if (!this.name) {
    alert('Please enter category name');
    return;
  }

  try {

    if (this.isEditMode && this.categoryId) {

      // ✅ UPDATE MODE
      await this.categoryService.updateCategory(
        this.categoryId,
        this.name,
        this.selectedFile
      );

      alert('Category updated successfully ✅');

    } else {

      // ✅ ADD MODE
      if (!this.selectedFile) {
        alert('Please select image');
        return;
      }

      await this.categoryService.addCategory(this.name, this.selectedFile);

      alert('Category added successfully ✅');
    }

    this.router.navigate(['/admin/add-category']);

  } catch (error) {
    console.error(error);
    alert('Operation failed ❌');
  }
}


editCategory(category: any) {
  this.router.navigate(['/admin/edit-category', category.id]);
}

deleteCategory(category: any) {

  if (!confirm('Are you sure you want to delete this category?')) return;

  const storage = getStorage();
  const firestore = getFirestore();

  // ⚠️ Make sure you saved imagePath while uploading
  const imageRef = ref(storage, category.imageUrl);

  deleteObject(imageRef)
    .then(() => {
      return deleteDoc(doc(firestore, 'categories', category.id));
    })
    .then(() => {
      console.log('Category deleted successfully');
    })
    .catch((error) => {
      console.error('Delete error:', error);
    });
}

}
