# Premium UI & Styling Design System

These guidelines define the specific, modern, and high-end aesthetic developed for this application. Use these exact principles to ensure all new and existing pages share a consistent, stylish look.

## 1. Dialogs & Modals

### The Header (Gradient & Glassmorphism)
- **Background**: Avoid generic solid colors or plain white. Use vibrant gradients.
  ```tsx
  className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 overflow-hidden px-8 py-8"
  ```
- **Decorative Elements**: Add absolute positioned, blurred background elements to create depth.
  ```tsx
  <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
  ```
- **Primary Icon**: Wrap the main header icon in a frosted glass container.
  ```tsx
  <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-xl">
  ```
- **Typography (Titles/Badges)**: Use `font-black text-white tracking-tight` for the main title, and small, high-contrast, uppercase letter-spaced text for metadata badges.

### Meta Information Pills
- DO NOT use flat grey text boxes. Use elevated, discrete "cards" with color-coded icons.
  ```tsx
  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          {/* Icon */}
      </div>
      <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Label</p>
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Main Value</p>
      </div>
  </div>
  ```

### Data Tables (In-App)
- **Header**: Use `bg-slate-50` or `bg-slate-50/50`. Small, uppercase text with letter spacing.
- **Rows**: Very faint borders (`border-slate-100`). Hover effect should be a slight tint (`hover:bg-slate-50/80`). 
- **Icons**: Wrap cell icons in a soft `bg-slate-100 rounded-lg` box.
- **Numbers**: Always use `tabular-nums` class on numeric values (quantities, prices) to align digits properly.

### Total Summaries (Dark Weight)
- For the primary financial/total output on a page, use a heavy, dark block to anchor the design.
  ```tsx
  <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white min-w-[320px] shadow-lg shadow-slate-900/20 relative overflow-hidden">
      {/* Absolute decorative geometries inside */}
  </div>
  ```

---

## 2. PDF Exports (jsPDF)

To prevent PDFs from looking like raw, unstyled HTML tables, follow these settings using `jspdf` and `jspdf-autotable`.

### Branding Header
- Draw a solid color rectangle at the top of the PDF using our primary indigo brand color.
  ```javascript
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, 210, 45, 'F');
  ```
- Use uppercase, bold Helvetica, size 26 for the primary document title, painted in white over the color block.

### Table Theme (autoTable)
Use the `grid` theme, but overwrite the hard black lines with sophisticated slate tones:
```javascript
autoTable(doc, {
    theme: 'grid',
    headStyles: { 
        fillColor: [241, 245, 249], // slate-100
        textColor: [15, 23, 42],    // slate-900
        fontStyle: 'bold',
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.1
    },
    bodyStyles: {
        textColor: [71, 85, 105],   // slate-600
        lineColor: [226, 232, 240],
    },
    alternateRowStyles: {
        fillColor: [248, 250, 252]  // slate-50
    }
});
```

### Sign-off & Totals
- Manually draw a right-aligned border line before the final total.
- Use a contrasting color (Indigo: `[79, 70, 229]`) for the final numeric readout.
