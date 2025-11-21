# Interactive Grid System

This project is a solution for **Challenge 01 – Interactive Grid System**, built using **Next.js** and **Tailwind CSS**.

The goal is to create a grid layout where items can be selected, moved freely, resized, and snapped back into the grid when deselected.

---

## 🚀 Live Demo

https://interactive-grid-system.vercel.app/

---

## 📌 Features

- **10-column grid** layout
- Dynamic row height
- Boxes can be:
  - Selected
  - Dragged freely
  - Resized (width & height)
- Selected boxes become **absolute positioned**
- Clicking outside a selected box **snaps it back** into the grid
- Snapping calculates:
  - Column
  - Row
  - Column span
  - Row span
- No heavy drag/resize libraries used

---

## 🛠️ Tech Used

- Next.js
- React
- Tailwind CSS
- TypeScript

---

## ▶️ Running Locally

```bash
npm install
npm run dev
