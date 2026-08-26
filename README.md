# Smart Faculty Navigator (V1)

ระบบนำทางและค้นหาห้องพัก/ห้องเรียนภายในอาคารแบบซอฟต์แวร์กำหนดตำแหน่ง (Software-defined Indoor Navigation System) สำหรับคณะวิทยาศาสตร์และเทคโนโลยี

---

## โครงสร้างโปรเจกต์ (Repository Structure)

โปรเจกต์ถูกจัดโครงสร้างให้โฟกัสการพัฒนา V1 Frontend โดยแยกส่วน Static Runtime Assets และ Archive Tools ออกจากกันชัดเจน:

```text
.
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
├── frontend/               # Workspace หลักสำหรับการพัฒนา React + Vite + TypeScript
│   ├── public/
│   │   ├── data/           # ⚠️ Active Runtime Data (rooms.json) - ห้ามลบ
│   │   └── maps/           # ⚠️ SVG Floor plans (maps/br3/floor-1.svg, floor-2.svg) - ห้ามลบ
│   └── src/                # React Source Code หลักสำหรับเขียนฟีเจอร์
├── tools/
│   └── data-extraction/    # Archive สคริปต์สกัดข้อมูล พิกัดหมุด และประวัติลงพื้นที่
├── .gitignore
├── package.json
└── README.md
```


## Frontend Development Guide (สำหรับทีมพัฒนา)

### 1. วิธีเริ่มต้นการทำงาน (Quick Start)

```bash
# 1. ย้ายเข้าไปที่โฟลเดอร์ frontend
cd frontend

# 2. ติดตั้ง Dependencies
npm install

# 3. เปิด local development server (เปิดที่ http://localhost:5173)
npm run dev
```

### 2. โครงสร้างภายในโฟลเดอร์ frontend/ & จุดที่ต้องแก้ไขงาน

งานส่วนใหญ่ของทีม Frontend จะอยู่ภายในโฟลเดอร์ src/ เป็นหลัก:

```text
frontend/
├── public/                    # Static Assets (เข้าถึงผ่าน URL โดยตรง)
│   ├── data/rooms.json        # ⚠️ ข้อมูลห้องพักและแผนที่ (ห้ามลบ/ห้ามเขียนทับ)
│   └── maps/br3/              # ⚠️ ไฟล์ SVG ผังอาคาร (ห้ามลบ/ห้ามเขียนทับ)
├── src/                       # 🛠️ พื้นที่เขียนโค้ดหลัก (ทำงานตรงนี้)
│   ├── assets/                # ไฟล์รูปภาพ ไอคอน หรือ Static Media ต่างๆ
│   ├── components/            # UI Components ที่นำกลับมาใช้ใหม่ได้ (เช่น Buttons, Modals, Map Viewer)
│   ├── services/              # Logic การดึงข้อมูล API และ Fetching
│   ├── App.tsx                # Main Component หลัก / ตัวจัดการ Routing
│   ├── index.css              # ตั้งค่า Tailwind CSS v4 (@import "tailwindcss";)
│   └── main.tsx               # Entry point หลักของ React (ไม่ต้องแก้ไข)
├── vite.config.ts             # Config ของ Vite & ตั้งค่า Path Alias (@/)
├── tsconfig.json              # Config ของ TypeScript
└── package.json               # รายการ Dependencies และ Scripts
```

### 💡 คำแนะนำสำหรับการพัฒนาฟีเจอร์

1. **การสร้าง UI / หน้าเว็บใหม่:** ให้สร้างไฟล์แยกใน `src/components/` หรือ `src/pages/` แล้วอิมพอร์ตไปเรียกใช้ที่ `src/App.tsx`
2. **การใช้ Path Alias (`@/`):** สามารถใช้ `@/` อ้างอิงโฟลเดอร์ `src/` ได้ทันที เช่น `import { Button } from '@/components/Button'`
3. **การแต่ง Style:** ใช้ Tailwind CSS v4 utility classes เขียนลงใน JSX ได้ทันที
4. **ไฟล์ Config:** หลีกเลี่ยงการแก้ไข `vite.config.ts`, `tsconfig.json` และ `.prettierrc` หากไม่มีการตกลงร่วมกันในทีม

### 🛠️ คำสั่งที่ใช้อยู่บ่อยๆ (Scripts)

1. `npm run dev` — เปิด Dev Server พร้อมระบบ HMR (บันทึกโค้ดแล้วหน้าเว็บอัปเดตทันที)
2. `npm run build` — เช็ก TypeScript Type และ Build ไฟล์สำหรับ Production ไปยังโฟลเดอร์ `frontend/dist/`
3. `npm run preview` — ทดสอบรัน Static Build บนเครื่อง Local ก่อน Push