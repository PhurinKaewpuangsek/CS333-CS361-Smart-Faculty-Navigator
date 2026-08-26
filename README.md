# Smart Faculty Navigator (V1)

ระบบนำทางและค้นหาห้องพัก/ห้องเรียนภายในอาคารแบบซอฟต์แวร์กำหนดตำแหน่ง (Software-defined Indoor Navigation System) สำหรับคณะวิทยาศาสตร์และเทคโนโลยี

## โครงสร้างโปรเจกต์ (Repository Structure)

โปรเจกต์ถูกจัดโครงสร้างให้โฟกัสการพัฒนา V1 Frontend โดยแยกส่วน Static Runtime Assets และ Archive Tools ออกจากกันชัดเจน:

```text
.
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
├── frontend/               # Workspace หลักสำหรับการพัฒนา React + Vite
│   ├── public/
│   │   ├── data/           # Active Runtime Data (rooms.json)
│   │   └── maps/           # SVG Floor plans (maps/br3/floor-1.svg, floor-2.svg)
│   └── src/                # React Source Code
├── tools/
│   └── data-extraction/    # Archive สคริปต์สกัดข้อมูล พิกัดหมุด และประวัติลงพื้นที่
├── .gitignore
├── package.json
└── README.md