---
name: "frontend-best-practices"
description: "提供前端代码最佳实践指导，包括代码审查、性能优化、样式规范、组件设计等。Invoke when developing frontend code, performing code reviews, or refactoring frontend applications."
---

# Frontend Best Practices

## Description

This skill provides comprehensive guidance on frontend development best practices, covering code reviews, performance optimization, styling conventions, component design, and more.

## Usage Scenario

- When developing new frontend features
- When performing code reviews for frontend code
- When refactoring existing frontend applications
- When setting up new frontend projects
- When optimizing frontend performance

## Instructions

### 1. Component Design Principles

- **Single Responsibility**: Each component should do one thing and do it well
- **Reusability**: Design components to be reusable across the application
- **Props Validation**: Always validate props with TypeScript interfaces or PropTypes
- **State Management**: Keep state as local as possible, lift state up only when necessary

### 2. Code Organization

```
src/
  ├── components/     # Reusable UI components
  ├── pages/       # Page components
  ├── hooks/       # Custom hooks
  ├── services/    # API calls and business logic
  ├── types/       # TypeScript type definitions
  ├── utils/      # Utility functions
  ├── styles/      # Global styles and theme
  └── assets/      # Static assets
```

### 3. Performance Optimization

- **Lazy Loading**: Use React.lazy and Suspense for code splitting
- **Memoization**: Use useMemo and useCallback appropriately
- **Bundle Analysis**: Regularly analyze bundle size with tools like webpack-bundle-analyzer
- **Image Optimization**: Use appropriate image formats (WebP, AVIF) and lazy loading

### 4. Styling Best Practices

- Use CSS-in-JS or utility-first CSS (Tailwind) consistently
- Follow a consistent naming convention (BEM, CSS Modules, etc.)
- Avoid inline styles for complex styling
- Use CSS variables for theming

### 5. Accessibility (a11y)

- Use semantic HTML elements
- Add appropriate ARIA attributes when needed
- Ensure keyboard navigation works
- Test with screen readers

### 6. Testing Strategy

- Write unit tests for utility functions
- Write component tests with React Testing Library
- Write E2E tests for critical user flows
- Maintain high test coverage for core features

### 7. State Management

- Use React Context + useReducer for moderate complexity
- Consider Zustand, Jotai, or similar for more complex state
- Keep server state separate from UI state (React Query, SWR)

### 8. Code Review Checklist

- [ ] Code follows project conventions
- [ ] Components are properly typed
- [ ] No unused code or comments removed
- [ ] Proper error handling implemented
- [ ] Accessibility considered
- [ ] Performance implications reviewed
- [ ] Tests added/updated
- [ ] Documentation updated if needed

## Examples

### Good Component Example

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Button = ({
  variant, size, onClick, children, disabled = false }: ButtonProps) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick();
    }
  }, [onClick, disabled]);

  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### Bad Component Example (Avoid)

```jsx
// Avoid: Too many responsibilities, no typing, inline styles
export function MyButton({ onClick, text, isDisabled, color }) {
  const [count, setCount] = useState(0);
  
  return (
    <button 
      style={{ backgroundColor: color || 'blue', padding: '10px' }}
      onClick={() => {
        setCount(c => c + 1);
        onClick();
      }}
      disabled={isDisabled}
    >
      {text}
    </button>
  );
}
```
