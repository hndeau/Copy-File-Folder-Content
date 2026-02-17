# Copy File Content

A Visual Studio Code extension that copies file and folder contents to your clipboard in a clean, structured, AI-friendly format.

Built for workflows such as:
- AI / LLM prompting
- Code review
- Sharing multiple files quickly
- Inspecting directories without zipping or exporting

---

## Features

- 📁 Copy folders recursively
- 📄 Copy one or many selected files
- ✂️ Copy editor selection or entire document (fallback)
- 🧠 AI-friendly Markdown formatting with code fences
- 🚫 Automatically skips:
  - Binary files
  - Oversized files
  - Common build and dependency directories
- 📊 Clipboard summary includes:
  - Included file count
  - Skipped file count
  - Total character count
  - Approximate token estimate
- ⚡ Parallel file processing for speed
- 🧩 Modular, maintainable architecture

---

## Usage

### Explorer Context Menu
1. Select one or more files and/or folders
2. Right-click
3. Choose **“Copy File/Folder Content for AI”**

### Multi-Select Support
- Works with:
  - Multiple files
  - Multiple folders
  - Mixed selections
- Order is preserved
- Duplicates are removed

### Editor Fallback
If no Explorer selection is present:
- Copies the active editor selection
- Or the entire document if nothing is selected

This allows use via:
- Command Palette
- Keyboard shortcuts
- Custom keybindings

---

## Output Format

Each file is copied as structured Markdown:

```markdown
## relative/path/to/file.ts
```typescript
// file contents
