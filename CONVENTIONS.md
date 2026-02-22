# Coding Conventions - PeakOne

## Naming
- Components & Component Files: `PascalCase` (e.g., `MapContainer.tsx`).
- Hooks & Functions: `camelCase` (e.g., `useMapLocation.ts`).
- Server Actions: File must end in `.action.ts` (e.g., `saveLocation.action.ts`).
- Types/Interfaces: Start with a capital letter, no `I` prefix (e.g., `LocationData`, not `ILocationData`).

## Styling (Tailwind CSS)
- Use utility classes directly in `className`.
- For dynamic components, use `clsx` and `tailwind-merge` (usually via a `cn` utility function).
- Do not create separate `.css` or `.scss` files, except for `globals.css`.

## Error Handling & Loading State
- Every route in `/app` that consumes async data must have its respective `loading.tsx` and `error.tsx`.
- Server Actions must return a typed object: `{ success: boolean, data?: any, error?: string }`.