# Smart Faculty Navigator (V1)

ระบบนำทางและค้นหาห้องพัก/ห้องเรียนภายในอาคารแบบซอฟต์แวร์กำหนดตำแหน่ง (Software-defined Indoor Navigation System) สำหรับคณะวิทยาศาสตร์และเทคโนโลยี

---

## (อ่านก่อนเริ่มทำงาน)

ถ้าเคยทำเว็บแบบแยกไฟล์ `index.html` + `style.css` + `script.js` แล้วมาเจอโครงสร้างนี้ครั้งแรกแล้วรู้สึกงง = เป็นเรื่องปกติมาก ข่าวดีคือ**ทุกคนไม่ต้องรู้จักไฟล์ทุกไฟล์ในนี้ทั้งหมด** ส่วนใหญ่เป็น "ไฟล์ตั้งค่าเครื่องมือสำหรับdev" ที่ generate ให้อัตโนมัติ ไม่ใช่ที่ที่ต้องไปเขียนโค้ดทับหรือ edit

### กฎข้อเดียวที่ต้องจำ: **งาน 95% ของทุกคนตอนนี้อยู่ใน `src/components/` เท่านั้น**

**ที่พวกเราคุ้นเคย → ที่จะทำต่อไปนี้**

| แบบเดิม (HTML/CSS/JS) | แบบใหม่ (React) |
|---|---|
| สร้างไฟล์ `page.html` ใหม่ทุกหน้า | สร้างไฟล์ `.tsx` ใหม่ใน `src/components/` เช่น `SearchBar.tsx` |
| เขียน `<div>`, `<button>` ใน `.html` | เขียน `<div>`, `<button>` **แบบเดียวกันเป๊ะ** แต่อยู่ใน `.tsx` (เรียกว่า JSX แต่หน้าตาเหมือน HTML เกือบ 100%) |
| เขียน style ใน `.css` แยกไฟล์ | เขียน class ของ Tailwind ใส่ตรง `<div className="p-4 flex">` ในไฟล์เดียวกันเลย (ไม่ต้องสลับไฟล์) |
| เขียน logic ใน `.js` แล้วเชื่อมด้วย `<script src="...">` | เขียน logic (function, useState) **อยู่ในไฟล์ `.tsx` เดียวกันกับ UI** ไม่ต้องแยกไฟล์ |
| แก้ `index.html` เพื่อเพิ่มหน้าใหม่ | **ไม่ต้องแตะ `index.html` เลย** — import component ใหม่เข้า `App.tsx` แทน |

### ตอบคำถาม "อยากเพิ่ม UI ต้องไปเขียนที่ไหน" แบบตรงที่สุด

**ไม่ใช่ `index.html`, ไม่ใช่ `main.tsx`** สองไฟล์นี้เป็น "สายไฟ" ที่เชื่อมทุกอย่างเข้าด้วยกัน ตั้งไว้ครั้งเดียวแล้วแทบไม่ต้องแตะอีกเลยตลอดโปรเจ็ค

ขั้นตอนจริงที่จะทำซ้ำๆ ตลอดทั้งปี:
1. สร้างไฟล์ใหม่ใน `src/components/` เช่น `src/components/SearchBar.tsx`
2. เขียน UI + logic ของ component นั้นในไฟล์เดียว (เหมือนเขียน mini-page หนึ่งหน้า)
3. เปิด `src/App.tsx` แล้ว `import SearchBar from './components/SearchBar'` แล้วเอาไปวางใน JSX ตรงจุดที่อยากให้ขึ้น

จบแค่นี้ — ไม่ต้องแตะ `index.html`, `main.tsx`, `vite.config.ts`, หรือ `tsconfig.json` เลยสักครั้งในการทำงานประจำวัน

---

## 📂 แยกไฟล์ Infra (ห้ามแตะ) ออกจากไฟล์ที่ทำงานจริง

### 🔒 Infra / Config — ตั้งไว้ครั้งเดียว ไม่ต้องเข้าใจลึก ไม่ต้องแก้เอง
ถ้าไม่แน่ใจว่าไฟล์ไหนอยู่กลุ่มนี้ ให้ถือหลักว่า **"ถ้าไม่ได้อยู่ใน `src/` แปลว่าไม่ใช่ที่ทำงาน"**

| ไฟล์ | ทำหน้าที่อะไร |
|---|---|
| `index.html` | จุดเริ่มต้นที่เบราว์เซอร์เปิดจริง เชื่อมไปที่ `main.tsx` — ตั้งไว้แล้ว ไม่ต้องแตะ |
| `main.tsx` | โค้ดที่ "เสียบ" `App.tsx` เข้ากับหน้าเว็บ — ตั้งไว้แล้ว ไม่ต้องแตะ |
| `vite.config.ts` | ตั้งค่าเครื่องมือ build (Vite) | 
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | ตั้งค่า TypeScript |
| `eslint.config.js` | ตั้งค่าตัวเช็ค code style |
| `package.json` | รายชื่อ library ที่ใช้ + คำสั่งที่เรียกได้ (`npm run dev` ฯลฯ) |
| `package-lock.json` | ล็อกเวอร์ชัน library ให้เหมือนกันทุกเครื่อง — npm สร้างให้เอง ห้ามแก้มือ |
| `.gitignore` | บอก git ว่าไฟล์ไหนไม่ต้อง track (เช่น `node_modules/`) |

### ⚠️ ข้อมูล — ใช้ได้ ห้ามแก้ไข
| ไฟล์ | ทำหน้าที่อะไร |
|---|---|
| `public/data/rooms.json` | ข้อมูลห้อง 131 รายการ — **ห้ามแก้ไฟล์นี้ตรงๆ เด็ดขาด** (เป็นไฟล์ generated จาก script ต้นทาง) ถ้าต้องการแปลง field ให้ทำใน `roomsService.ts` แทน |
| `public/maps/lc3/*.svg` | ผังอาคาร — ห้ามลบ/เขียนทับ |

### ✏️ ที่ที่คุณทำงานจริง — เปิดดูได้ทุกวัน แก้ได้เต็มที่
| โฟลเดอร์ | ใช้ทำอะไร |
|---|---|
| `src/components/` | **ที่หลักที่คุณจะสร้างไฟล์ใหม่** — UI แต่ละชิ้น (SearchBar, MapViewer, RoomDetailModal ฯลฯ) |
| `src/services/` | ฟังก์ชันดึงข้อมูล (เช่น `roomsService.ts`) |
| `src/hooks/` | custom hook (เช่น `useRooms.ts`) |
| `src/types/` | TypeScript interface (เช่น `Room` type) |
| `src/App.tsx` | หน้ารวม — import component มาแปะรวมกันตรงนี้ |
| `src/index.css` | ตั้งค่า Tailwind (ตั้งไว้แล้วบรรทัดเดียว ปกติไม่ต้องแก้) |
| `src/assets/` | รูปภาพ/ไอคอนที่ใช้ในโค้ด |

---

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev   # เปิดที่ http://localhost:5173
```

## 🛠️ คำสั่งที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run dev` | เปิด dev server, แก้โค้ดแล้วหน้าเว็บอัปเดตอัตโนมัติ (HMR) |
| `npm run build` | เช็ค TypeScript + build ไปที่ `frontend/dist/` |
| `npm run preview` | ทดสอบรัน production build บนเครื่อง local |
| `npm run lint` | เช็ค code style |

## 💡 กฎการทำงานสั้นๆ

1. อยากเพิ่ม UI ใหม่ → สร้างไฟล์ใน `src/components/` แล้ว import เข้า `App.tsx`
2. อยากดึงข้อมูล → ใช้ `useRooms()` hook (อย่าเขียน `fetch()` เองกระจายในหลาย component)
3. อยากใช้ path alias → `import { X } from '@/components/X'` แทนการไล่ `../../../`
4. ไฟล์ config (`vite.config.ts`, `tsconfig.json`, `.eslintrc`) — **อย่าแก้เองโดยไม่คุยกับทีมก่อน** เพราะกระทบทุกคนพร้อมกัน
