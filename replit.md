# Warehouse Visibility Demo MVP

## Overview

This is a React-based warehouse visibility demonstration system built with TypeScript and modern web technologies. The application provides an interactive 2D warehouse floor map with real-time operational visibility features including heatmap overlays, live resource tracking, and SKU search capabilities. All data is simulated using deterministic algorithms to provide a realistic demonstration without requiring actual warehouse integrations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React hooks with custom state management for warehouse data
- **Canvas Rendering**: Konva.js for high-performance 2D canvas operations
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **WebSocket**: Native WebSocket server for real-time forklift position updates
- **API Layer**: RESTful endpoints for warehouse layout and health checks
- **Development Server**: Integrated Vite development server with HMR

### Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Management**: Type-safe schema definitions with Zod validation
- **Connection**: Neon Database serverless PostgreSQL (configured but not actively used in demo)
- **Demo Data**: In-memory simulation with seeded random data generators

## Key Components

### Warehouse Visualization Engine
- **Interactive Canvas**: Pan and zoom capabilities with smooth 30 FPS rendering
- **Grid Layout**: 6-aisle warehouse with 288 bin faces (6 aisles × 12 bins × 2 levels × 2 depth)
- **Cell Addressing**: Structured format: {Aisle}-{Bin}-{Level}-{Depth} (e.g., "A2-B37-L2-D1")

### Heatmap System
- **Six Layer Types**: Volume, Frequency, Occupancy, Misplacement, Expiry, Exceptions
- **Dynamic Generation**: Time-range adjustable data (15 minutes to 24 hours)
- **Visual Overlays**: Color-coded intensity mapping with opacity controls
- **Toggle Controls**: Individual layer visibility with eye icon toggles

### Resource Tracking
- **Live Simulation**: 3 forklift resources with real-time position updates
- **Movement Paths**: Predefined route simulation with 1-second update intervals
- **Trail Visualization**: 5-minute movement history with color-coded status
- **Interactive Selection**: Click-to-track individual resources

### Search and Highlight System
- **SKU Search**: Full and partial SKU matching with bin location highlighting
- **Flash Animation**: Visual feedback for search results
- **Location Mapping**: Simulated inventory distribution across storage locations

## Data Flow

1. **Initialization**: Warehouse layout loaded from configuration with cell coordinates
2. **Real-time Updates**: WebSocket connection provides forklift position streams
3. **Heatmap Generation**: Time-range selection triggers data regeneration with seeded algorithms
4. **User Interactions**: Layer toggles, search queries, and export actions update canvas rendering
5. **State Management**: Custom hooks manage layer states, resource tracking, and search highlights

## External Dependencies

### Core Libraries
- **React Ecosystem**: React, React-DOM, React Router (Wouter)
- **UI Components**: Radix UI primitives, Shadcn/ui component library
- **Styling**: Tailwind CSS, Class Variance Authority for component variants
- **Canvas**: Konva and React-Konva for 2D graphics rendering
- **Data Management**: TanStack Query for server state, React Hook Form for forms

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Development server with hot module replacement
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Autoprefixer

### Backend Dependencies
- **Express.js**: Web server framework
- **WebSocket**: Real-time communication for resource updates
- **Drizzle**: Database ORM with PostgreSQL dialect
- **Zod**: Runtime type validation and schema definition

## Deployment Strategy

### Development Environment
- **Local Server**: Vite dev server with Express API integration
- **Hot Reloading**: Full-stack development with instant updates
- **Environment Variables**: DATABASE_URL for optional database connection

### Production Build
- **Static Assets**: Vite builds optimized client bundle to `dist/public`
- **Server Bundle**: ESBuild compiles Express server to `dist/index.js`
- **Deployment**: Node.js server serves static files and API endpoints

### Architecture Decisions

#### Problem: Real-time warehouse visualization without actual warehouse data
**Solution**: Deterministic simulation with seeded random number generators
**Rationale**: Provides realistic-looking data that's reproducible for demonstrations
**Alternatives**: Mock REST APIs, static JSON files
**Pros**: Realistic behavior, no external dependencies, presentation-ready
**Cons**: Not connected to real systems, limited to demonstration scenarios

#### Problem: High-performance canvas rendering for warehouse floor maps
**Solution**: Konva.js with React integration for 2D graphics
**Rationale**: Optimized for interactive graphics with pan/zoom capabilities
**Alternatives**: SVG with D3.js, HTML5 Canvas directly, WebGL solutions
**Pros**: Good performance, React integration, feature-rich
**Cons**: Additional library dependency, learning curve

#### Problem: Responsive layer management and heatmap visualization
**Solution**: Custom React hooks with centralized state management
**Rationale**: Provides clean separation of concerns and reusable logic
**Alternatives**: Redux, Zustand, Context API
**Pros**: Lightweight, TypeScript-friendly, component-focused
**Cons**: May not scale to larger applications

## Changelog

```
Changelog:
- July 03, 2025. Initial setup
- July 03, 2025. Performance optimizations implemented:
  * Reduced warehouse bins from 1440 to 240 (5 aisles × 12 bins × 2 levels × 2 depth)
  * Optimized heatmap rendering - filters insignificant data, limits to top 200 cells
  * Throttled resource updates to 3-second intervals
  * Enhanced zoom performance with faster increments and throttled React updates
  * Added perfectDrawEnabled={false} to canvas elements for better performance
- July 03, 2025. Enhanced resource tracking with realistic movement trails:
  * Created movementTrails.ts for authentic warehouse movement simulation
  * Forklifts move primarily within assigned aisles (80% time), occasionally visit zones
  * BOPTs move horizontally across warehouse with frequent load changes
  * Color-coded trails: orange for loaded movement, white for unloaded
  * Background dims when resource selected for focused tracking
  * Trail data based on time range selection (15 min - 24 hours)
- July 05, 2025. Expanded warehouse layout with additional aisle:
  * Added 6th aisle (A6) to warehouse configuration
  * Updated warehouse from 240 to 288 bin faces (6 aisles × 12 bins × 2 levels × 2 depth)
  * Adjusted all movement simulation logic to accommodate new aisle range
  * Updated BOPT traversal patterns for wider warehouse layout
  * Enhanced heatmap generation to include new aisle in calculations
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```