# LazyCloset 🧥

A modern, intelligent digital closet management application built with Angular 19 and Supabase.

## 🌟 Features

- **Smart Clothing Management**: Upload, categorize, and organize your clothing items
- **AI-Powered Background Removal**: Automatic background removal for clean product images
- **Intelligent Outfit Generation**: AI-powered outfit suggestions based on your wardrobe
- **Advanced Filtering**: Filter by category, color, tags, and more
- **Drag & Drop Interface**: Intuitive drag-and-drop organization
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Sync**: Cloud-based storage with real-time synchronization
- **User Authentication**: Secure user accounts with Supabase Auth

## 🏗️ Architecture

### Frontend
- **Framework**: Angular 19
- **UI Library**: Angular Material
- **State Management**: RxJS with BehaviorSubjects
- **Styling**: SCSS with modern CSS features
- **Build Tool**: Angular CLI

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions

### External Services
- **Background Removal**: Remove.bg API
- **Image Processing**: Browser-based compression and enhancement

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Supabase account
- Remove.bg API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LazyCloset
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your actual values
   nano .env
   ```

4. **Configure your environment variables**
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   REMOVE_BG_API_KEY=your_remove_bg_api_key
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:4200`

## 📁 Project Structure

```
LazyCloset/
├── frontend/                          # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                  # Core services and guards
│   │   │   │   ├── guards/           # Route guards
│   │   │   │   ├── services/         # Core services
│   │   │   │   └── repositories/     # Repository interfaces
│   │   │   ├── features/             # Feature modules
│   │   │   │   ├── auth/             # Authentication
│   │   │   │   ├── closet/           # Main closet functionality
│   │   │   │   └── upload/           # File upload functionality
│   │   │   ├── shared/               # Shared components and models
│   │   │   │   ├── models/           # Data models
│   │   │   │   ├── components/       # Shared components
│   │   │   │   └── pipes/            # Custom pipes
│   │   │   └── infrastructure/       # External integrations
│   │   ├── assets/                   # Static assets
│   │   └── environments/             # Environment configuration
│   ├── package.json
│   └── angular.json
├── env.example                       # Environment variables template
├── package.json                      # Root package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `REMOVE_BG_API_KEY` | Remove.bg API key for background removal | No |

### Supabase Setup

1. Create a new Supabase project
2. Set up the following tables:
   - `clothing_items`
   - `outfits`
3. Configure Row Level Security (RLS)
4. Set up storage buckets for images
5. Configure authentication providers

## 🎨 Features in Detail

### Clothing Management
- Upload images with automatic compression
- Categorize items (shirts, pants, shoes, etc.)
- Add colors, tags, and metadata
- Mark items as favorites
- Search and filter functionality

### Outfit Generation
- AI-powered outfit suggestions
- Manual outfit creation
- Save and organize outfits
- Weather and occasion-based recommendations

### Image Processing
- Automatic background removal
- Image compression and optimization
- Thumbnail generation
- Multiple format support (JPEG, PNG, WebP)

### User Experience
- Drag-and-drop interface
- Responsive design
- Real-time updates
- Offline capability with local storage fallback

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start              # Start development server
npm run build          # Build for production
npm test               # Run tests
npm run install:all    # Install all dependencies

# Frontend specific
cd frontend
npm start              # Start Angular dev server
npm run build          # Build Angular app
npm test               # Run Angular tests
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Angular**: Follow Angular style guide
- **SCSS**: BEM methodology for CSS classes
- **Components**: OnPush change detection strategy
- **Services**: Injectable with proper error handling

### Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# The built files will be in frontend/dist/
```

### Deployment Options

1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `frontend/dist/frontend`

3. **Firebase Hosting**
   ```bash
   npm install -g firebase-tools
   firebase init hosting
   firebase deploy
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include your environment details and error messages

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced AI outfit recommendations
- [ ] Social features (share outfits)
- [ ] Integration with fashion APIs
- [ ] Advanced analytics and insights
- [ ] Multi-language support

---

**Built with ❤️ using Angular and Supabase** 