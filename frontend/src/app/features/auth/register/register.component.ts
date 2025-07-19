import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.supabaseService.isAuthenticated()) {
      this.router.navigate(['/closet']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.registerForm.value;

    try {
      const { user, error } = await this.supabaseService.signUp(email, password);

      if (error) {
        this.errorMessage = this.getErrorMessage(error);
      } else if (user) {
        this.successMessage = 'Account created successfully! Please check your email to confirm your account.';
        console.log('✅ Registration successful:', user.email);
        
        // Optionally redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      }
    } catch (error) {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      console.error('Registration error:', error);
    } finally {
      this.loading = false;
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    
    switch (error.error_description || error.message) {
      case 'User already registered':
        return 'An account with this email already exists. Please sign in instead.';
      case 'Password is too weak':
        return 'Password is too weak. Please choose a stronger password.';
      case 'Invalid email':
        return 'Please enter a valid email address.';
      default:
        return 'Registration failed. Please try again.';
    }
  }

  // Getter methods for template access
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get passwordMismatch() { 
    return this.registerForm.errors?.['passwordMismatch'] && 
           this.confirmPassword?.touched; 
  }
} 