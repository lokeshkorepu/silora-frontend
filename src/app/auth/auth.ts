import { Component } from '@angular/core';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { CommonModule } from '@angular/common';  // ✅ Import CommonModule




@Component({
  selector: 'app-auth',
  standalone: true,
  templateUrl: './auth.html',
  imports: [CommonModule]   // ✅ Add CommonModule here

})
export class AuthComponent {
  private auth = getAuth();
  currentUser: any = null;

   constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      console.log("Auth state changed:", user);
    });
  }



  signup(email: string, password: string) {
    createUserWithEmailAndPassword(this.auth, email, password)
      .then(userCredential => {
        console.log("User signed up:", userCredential.user);
      })
      .catch(error => {
        console.error("Signup error:", error);
      });
  }

  login(email: string, password: string) {
    signInWithEmailAndPassword(this.auth, email, password)
      .then(userCredential => {
        console.log("User logged in:", userCredential.user);
      })
      .catch(error => {
console.error("Login error:", error.code, error.message);      });
  }

  logout() {
  signOut(this.auth).then(() => {
    console.log("User logged out");
  });
}

}