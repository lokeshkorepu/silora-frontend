import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,   // ✅ MUST BE TRUE
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {

  openBlog() {
    window.open('/#/blog', '_blank');
  }

  openPrivacy() {
    window.open('/#/privacy', '_blank');
  }

  openTerms() {
    window.open('/#/terms', '_blank');
  }

  openFAQs() {
    window.open('/#/faqs', '_blank');
  }

  openSecurity() {
    window.open('/#/security', '_blank');
  }

  openContact() {
    window.open('/#/home/contact', '_blank');
  }

  openPartner() {
    window.open('/#/home/partner', '_blank');
  }

  openFranchise() {
    window.open('/#/home/franchise', '_blank');
  }

  openSeller() {
    window.open('/#/home/seller', '_blank');
  }

  openWarehouse() {
    window.open('/#/home/warehouse', '_blank');
  }

  openDeliver() {
    window.open('/#/home/deliver', '_blank');
  }

  openResources() {
    window.open('/#/home/resources', '_blank');
  }

  openRecipes() {
    window.open('/#/home/recipes', '_blank');
  }

  openBistro() {
    window.open('/#/home/bistro', '_blank');
  }

  openDistrict() {
    window.open('/#/home/district', '_blank');
  }
 
}
