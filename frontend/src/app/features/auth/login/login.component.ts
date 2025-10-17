import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

interface LilGuy {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  scale: number;
}

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  // Lil Guy properties
  lilGuy: LilGuy = {
    x: 50,
    y: 50,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    scale: 1
  };

  private animationInterval: any;

  // Constants for bounce physics
  private readonly SPEED = 0.15; // Movement speed
  private readonly BOUNCE_DAMPING = 0.8; // Velocity reduction on bounce
  private readonly LIL_GUY_SIZE = 15; // Percentage of viewport

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

    // Start floating animation
    this.startFloatingAnimation();
  }

  ngOnDestroy(): void {
    this.stopFloatingAnimation();
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

  // Floating animation methods
  private startFloatingAnimation(): void {
    // Randomize initial position on left side (avoiding login form)
    this.lilGuy.x = Math.random() * 40 + 10; // Left 10-50%
    this.lilGuy.y = Math.random() * 60 + 20; // Middle area

    // Random initial velocity
    this.lilGuy.velocityX = (Math.random() - 0.5) * this.SPEED * 2;
    this.lilGuy.velocityY = (Math.random() - 0.5) * this.SPEED * 2;

    this.animationInterval = setInterval(() => {
      this.updateFloatingAnimation();
    }, 16); // ~60fps
  }

  private stopFloatingAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  private updateFloatingAnimation(): void {
    const time = Date.now() * 0.001;

    // Update position based on velocity
    this.lilGuy.x += this.lilGuy.velocityX;
    this.lilGuy.y += this.lilGuy.velocityY;

    // Update rotation based on velocity direction
    this.lilGuy.rotation += (this.lilGuy.velocityX + this.lilGuy.velocityY) * 0.5;

    // Subtle scale animation
    this.lilGuy.scale = 1 + Math.sin(time * 1.5) * 0.03;

    // Bounce off screen edges
    const minX = this.LIL_GUY_SIZE / 2;
    const maxX = 100 - this.LIL_GUY_SIZE / 2;
    const minY = this.LIL_GUY_SIZE / 2;
    const maxY = 100 - this.LIL_GUY_SIZE / 2;

    if (this.lilGuy.x <= minX || this.lilGuy.x >= maxX) {
      this.lilGuy.velocityX *= -this.BOUNCE_DAMPING;
      this.lilGuy.x = this.lilGuy.x <= minX ? minX : maxX;
      // Add random variation on bounce
      this.lilGuy.velocityY += (Math.random() - 0.5) * this.SPEED * 0.5;
    }

    if (this.lilGuy.y <= minY || this.lilGuy.y >= maxY) {
      this.lilGuy.velocityY *= -this.BOUNCE_DAMPING;
      this.lilGuy.y = this.lilGuy.y <= minY ? minY : maxY;
      // Add random variation on bounce
      this.lilGuy.velocityX += (Math.random() - 0.5) * this.SPEED * 0.5;
    }

    // Bounce off login form (centered, ~440px wide, in viewport)
    // Login form is roughly at 50-95% x, 20-80% y when centered
    const formLeft = 50;
    const formRight = 95;
    const formTop = 20;
    const formBottom = 80;

    const lilGuyRadius = this.LIL_GUY_SIZE / 2;

    // Check collision with login form
    if (
      this.lilGuy.x + lilGuyRadius > formLeft &&
      this.lilGuy.x - lilGuyRadius < formRight &&
      this.lilGuy.y + lilGuyRadius > formTop &&
      this.lilGuy.y - lilGuyRadius < formBottom
    ) {
      // Determine which side hit
      const distToLeft = Math.abs(this.lilGuy.x - formLeft);
      const distToRight = Math.abs(this.lilGuy.x - formRight);
      const distToTop = Math.abs(this.lilGuy.y - formTop);
      const distToBottom = Math.abs(this.lilGuy.y - formBottom);

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

      if (minDist === distToLeft || minDist === distToRight) {
        // Hit left or right side
        this.lilGuy.velocityX *= -this.BOUNCE_DAMPING;
        this.lilGuy.x = minDist === distToLeft ? formLeft - lilGuyRadius : formRight + lilGuyRadius;
      } else {
        // Hit top or bottom
        this.lilGuy.velocityY *= -this.BOUNCE_DAMPING;
        this.lilGuy.y = minDist === distToTop ? formTop - lilGuyRadius : formBottom + lilGuyRadius;
      }

      // Add energy on form bounce
      this.lilGuy.velocityX += (Math.random() - 0.5) * this.SPEED * 0.3;
      this.lilGuy.velocityY += (Math.random() - 0.5) * this.SPEED * 0.3;
    }

    // Add slight random drift for organic movement
    this.lilGuy.velocityX += (Math.random() - 0.5) * 0.01;
    this.lilGuy.velocityY += (Math.random() - 0.5) * 0.01;

    // Clamp velocity to prevent too fast movement
    const maxVelocity = this.SPEED * 1.5;
    this.lilGuy.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, this.lilGuy.velocityX));
    this.lilGuy.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, this.lilGuy.velocityY));
  }

  getLilGuyTransform(): string {
    return `translate(-50%, -50%) rotate(${this.lilGuy.rotation}deg) scale(${this.lilGuy.scale})`;
  }
} 