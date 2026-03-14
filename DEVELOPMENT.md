# NammaKrishi - Development Standards

## Code Style

### JavaScript/React
- Use functional components and hooks
- Use const/let instead of var
- Use arrow functions
- Use template literals for strings
- Use destructuring where applicable
- Maximum line length: 100 characters

Example:
```javascript
const MyComponent = ({ equipment, onSelect }) => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = () => {
    setLoading(true);
    // logic
  };
  
  return <div onClick={handleClick}>...</div>;
};
```

### CSS
- Use CSS Modules or scoped CSS
- Follow BEM naming convention for classes
- Mobile-first responsive design
- Use flexbox/grid for layouts
- Consistent spacing (8px grid)
- Color palette standardized

Example:
```css
.equipment-card {
  padding: 16px;
  border-radius: 8px;
}

.equipment-card-header {
  display: flex;
  justify-content: space-between;
}
```

### File Naming
- Components: PascalCase (EquipmentCard.js)
- Pages: PascalCase with "Page" suffix (HomePage.js)
- Services: camelCase (equipmentService.js)
- Utilities: camelCase (helpers.js)
- Hooks: camelCase with "use" prefix (useAuth.js)

## Project Structure
```
src/
├── components/          # Reusable components
├── pages/              # Full page components
├── services/           # Firebase and API services
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
└── App.js              # Main app component
```

## Git Workflow
1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push to branch: `git push origin feature/feature-name`
4. Create Pull Request

## Commit Messages
- feat: A new feature
- fix: A bug fix
- docs: Documentation only
- style: Changes to formatting/styling
- refactor: Code refactoring
- test: Adding/updating tests
- chore: Build/setup/dependency changes

Example: `git commit -m "feat: add voice search for Hindi language"`

## Testing
- Unit tests for services
- Component tests for reusable components
- Integration tests for workflows
- Test command: `npm test`

## Environment Variables
- Frontend: `.env` in root directory
- Functions: `.env` in functions directory
- Never commit `.env` files
- Use `.env.example` as template

## Performance Guidelines
- Lazy load routes with React Router
- Optimize images before upload
- Minimize bundle size
- Implement pagination for large lists
- Use memoization for expensive calculations

## Accessibility (a11y)
- Semantic HTML tags
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratios >= 4.5:1
- Alt text for images

## Security Guidelines
- Never expose keys in frontend code
- Validate all user inputs
- Use HTTPS for all APIs
- Implement rate limiting
- Keep dependencies updated
- Use environment variables for secrets

## Documentation
- JSDoc comments for functions
- README for each major feature
- Inline comments for complex logic
- Keep file headers with purpose
- Document API endpoints

Example:
```javascript
/**
 * Calculates total rental price
 * @param {number} dailyRate - Price per day
 * @param {Date} startDate - Rental start date
 * @param {Date} endDate - Rental end date
 * @returns {number} Total price in INR
 */
const calculateTotalPrice = (dailyRate, startDate, endDate) => {
  // implementation
};
```

## Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Error Handling
- Try-catch for async operations
- User-friendly error messages
- Log errors to console in development
- Send error reports in production
- Handle network timeouts

## State Management
- Use React hooks (useState, useContext)
- Lift state for shared data
- Use custom hooks for logic reuse
- Firestore as single source of truth

## Performance Monitoring
- Monitor Firebase function execution time
- Track API response times
- Monitor bundle size
- Check for memory leaks
- Monitor database queries

## Deployment Checklist
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables set
- [ ] Firestore rules updated
- [ ] Cloud Functions deployed
- [ ] Security audit completed
- [ ] Performance benchmarked
- [ ] Documentation updated

---

For questions, refer to individual file headers or contact the team.
