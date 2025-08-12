# Backend Architecture Guide

## 📁 Folder Structure (Module-based)

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts     # HTTP request handlers
│   │   ├── auth.service.ts        # Business logic
│   │   ├── auth.validation.ts     # Zod schemas ✅
│   │   ├── auth.routes.ts         # Route definitions
│   │   ├── auth.types.ts          # TypeScript types
│   │   └── index.ts               # Module exports
│   ├── users/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.validation.ts
│   │   └── user.routes.ts
│   ├── issues/
│   │   ├── issue.controller.ts
│   │   ├── issue.service.ts
│   │   ├── issue.validation.ts
│   │   └── issue.routes.ts
│   └── tickets/
├── shared/
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── utils/
│   │   ├── response.util.ts
│   │   ├── hash.util.ts
│   │   └── jwt.util.ts
│   ├── types/
│   │   └── common.types.ts
│   └── constants/
├── config/
│   ├── database.ts
│   ├── environment.ts
│   └── app.ts
├── lib/
│   ├── db.ts                      # Prisma client ✅
│   └── logger.ts
└── index.ts
```

## 🎯 Benefits of This Structure:

### 1. **Domain-Driven Design**
- Each module represents a business domain
- Easy to understand and maintain

### 2. **Scalability**
- Add new features without touching existing code
- Can easily extract to microservices later

### 3. **Team Collaboration**
- Different teams can work on different modules
- Minimal merge conflicts

### 4. **Testing**
- Unit test each module independently
- Integration tests for cross-module functionality

### 5. **Code Organization**
- Related code stays together
- Easy to find what you need

## 📋 File Naming Conventions:

- `*.controller.ts` - HTTP request/response handling
- `*.service.ts` - Business logic and data processing  
- `*.validation.ts` - Zod schemas for input validation
- `*.routes.ts` - Express route definitions
- `*.types.ts` - TypeScript type definitions
- `*.middleware.ts` - Express middlewares
- `*.util.ts` - Utility functions

## 🔄 Module Example (Auth):

```typescript
// modules/auth/index.ts
export { authController } from './auth.controller';
export { authService } from './auth.service';
export { authRoutes } from './auth.routes';
export { registerSchema, loginSchema } from './auth.validation';
export type { RegisterInput, LoginInput } from './auth.validation';
```

This architecture follows modern Node.js best practices and scales well for enterprise applications.
