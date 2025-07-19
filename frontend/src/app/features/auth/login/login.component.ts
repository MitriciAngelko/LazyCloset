import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.supabaseService.isAuthenticated()) {
      this.router.navigate(['/closet']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      const { user, error } = await this.supabaseService.signIn(email, password);

      if (error) {
        this.errorMessage = this.getErrorMessage(error);
      } else if (user) {
        console.log('✅ Login successful:', user.email);
        this.router.navigate(['/closet']);
      }
    } catch (error) {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      console.error('Login error:', error);
    } finally {
      this.loading = false;
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    
    switch (error.error_description || error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please try again.';
      case 'Email not confirmed':
        return 'Please check your email and confirm your account before signing in.';
      default:
        return 'Login failed. Please check your credentials and try again.';
    }
  }

  // Getter methods for template access
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
} 