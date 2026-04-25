# Unified Page & Toolbar Styling Guidelines

These guidelines define the structure and aesthetic of the main dashboard and list pages (e.g., Inventory, Invoices). The goal is to maximize data density while keeping the interface extremely premium and uncluttered.

## 1. Page Header (Identity Banners)

Instead of using plain white cards for the page title and separate white cards for aggregate stats, merge them into a single, vibrant "Identity Banner".

### The Banner Container
- **Background**: Use a strong blue/indigo/violet gradient to establish the brand tone.
- **Shape**: `rounded-2xl` with a subtle overflow-hidden mask.
- **Decoration**: Include large, absolute-positioned white circles with low opacity (`bg-white/10` or `bg-white/5`) pushed to the edges to create a gentle geometric bleed.
```tsx
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
    {/* Content */}
</div>
```

### Integrated Stats (In the Banner)
- Push page aggregate stats directly into the banner instead of stacking them vertically below it. This saves massive amounts of vertical space.
- **Glassmorphism Container**: `bg-white/10 backdrop-blur border border-white/10 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]`.
- **Typography inside stats**:
  - Labels: Very small, brightly colored pastels (e.g., `text-blue-200` or `text-emerald-200`), `text-[10px] uppercase font-bold tracking-widest`.
  - Values: `text-lg font-black text-white`.

## 2. Toolbars & Filters (High Density)

The main control bar above a table should be a single, cohesive line of controls. 

### The Toolbar Container
- Used immediately below the Identity Banner or attached to the top of the data table container.
- **Styling**: `bg-white border-b border-slate-200 p-4`.

### "Pill" Segmented Controls
Avoid scattering raw dropdowns and date inputs across the page. Group related filters into a single segmented pill.
- **The Wrapper**: `bg-slate-50 border border-slate-200 p-1.5 rounded-2xl flex items-center`.
- **The Inputs inside**: Should be `h-8`, highly rounded (`rounded-xl`), with no severe borders unless active.
- **Active State Highlights**: If a specific pill/filter is active, fill it with a solid color to drastically distinguish it from the gray wrapper (e.g., `bg-violet-600 text-white`).

```tsx
<div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
    {/* Date Input */}
    <input className="h-8 bg-white border border-slate-200 rounded-xl" />
    
    <div className="w-px h-6 bg-slate-200 mx-1" /> {/* Divider */}
    
    {/* Select Toggle */}
    <select className="h-8 bg-white ... hover:border-violet-400">
        <option>All Suppliers</option>
    </select>
</div>
```

### Primary Action Buttons
- "Create" or "Add" buttons inside the toolbar can use premium gradients closely matching the Identity Banner, but scaled down.
- **Properties**: `h-9 px-4 text-[10px] uppercase tracking-widest font-bold rounded-xl active:scale-95 shadow-md`.

### Search Bars
- Usually positioned opposite the filters (e.g. `justify-between` or right-aligned).
- Must have an absolute generic Icon inside (e.g., Search icon `left-3.5`).
- Input behavior: `bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all`.

## Summary of Core Tenets
1. **Never Waste Vertical Space**: Stat cards must float inside the Identity Banner.
2. **Contain Your Filters**: No free-floating white dropdowns; build them into continuous `bg-slate-50` segments.
3. **Use Color as a Toggle**: An active filter dropdown should become a solid, vivid color block to instantly signal to the user that the list is constrained.
