# TORCH: Smart Faculty Navigator (V2)

**TORCH** คือระบบบริการข้อมูลและแผนที่นำทางภายในอาคารเรียน (Software-defined Indoor Navigation & Information Service) สำหรับคณะวิทยาศาสตร์และเทคโนโลยี สร้างขึ้นเพื่อแก้ไขปัญหาป้ายบอกทางที่ไม่ชัดเจน และช่วยให้นักศึกษาและคณาจารย์เข้าถึงข้อมูลห้องเรียน ตารางเรียน และตารางสอบได้อย่างแม่นยำ

โครงการนี้เป็นส่วนหนึ่งของรายวิชา **CS333 / CS361**

🔗 **[Live Demo (V1 Production บน AWS S3)](http://torch-navigator-v1-810160236906.s3-website-us-east-1.amazonaws.com/)**

---

## Core Features & Scope

ระบบ V2 ต่อยอดจากสถาปัตยกรรม V1 สู่ระบบ Dynamic Cloud Service เต็มรูปแบบ:

1. **Purpose-Based Search (New in V2):** ค้นหาห้องจากรหัสวิชา (เช่น `CS111`, `CS361`) หรือชื่อกิจกรรม เพื่อระบุห้องเรียน/ห้องสอบ พร้อมปักหมุดบนแผนที่อัตโนมัติ
2. **Dynamic Class & Exam Schedules (New in V2):** เชื่อมโยงข้อมูลตารางการใช้ห้องจริง (Ground Truth Data) จาก Cloud Database เพื่อแสดงสถานะการใช้งานของห้อง
3. **Smart Search & Synonyms:** ค้นหาห้องด้วยรหัสห้อง ชื่อทางการ หรือชื่อเรียกทั่วไปได้อย่างแม่นยำ
4. **Interactive SVG Map & Auto-Pan:** แผนที่ SVG ที่ตอบสนองการคลิก ซูม และเลื่อนตำแหน่งโฟกัสไปยังห้องเป้าหมายโดยอัตโนมัติ พร้อมสลับชั้น 1 และ 2
5. **Decoupled Map State:** หมุดตำแหน่งห้อง (Pin) ยังคงปักอยู่บนแผนที่แม้จะปิด Modal รายละเอียด เพื่อให้ผู้ใช้สำรวจเส้นทางได้สะดวก
6. **Responsive Spatial UI:** รองรับ Desktop (Floating Side Card) และ Mobile (Bottom Sheet ที่รองรับ `100dvh` Viewport)

---

## Architecture & Tech Stack
![TORCH V2 Architecture](docs/TorchV2_architecture.drawio.png)

* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (Hosted on AWS S3)
* **Backend & Compute:** AWS Lambda (Node.js 24.x) via Implicit API Gateway
* **Database:** Amazon DynamoDB (On-Demand Capacity)
* **Infrastructure as Code (IaC):** AWS SAM (`template.yaml`), `samconfig.toml`
* **Data & Tooling:** Node.js Scripts for CSV/JSON validation and DynamoDB batch seeding
* **CI/CD:** GitHub Actions (Automated Linting, Vitest, and `sam deploy`)

---

## 📂Project Structure (Monorepo)

```text
CS333-CS361-Smart-Faculty-Navigator/
├── frontend/                  # React client application
│   ├── public/
│   │   └── maps/              # Interactive SVG floor plans
│   ├── src/
│   │   ├── assets/            # รูปภาพและโลโก้ TORCH
│   │   ├── components/        # UI Components (MapContainer, SearchBar, RoomDetailModal, ...)
│   │   ├── hooks/             # Custom Hooks (useRooms, useSchedules, ...)
│   │   ├── services/          # API Services & Normalization (roomsService, schedulesService)
│   │   ├── types/             # TypeScript Interfaces
│   │   ├── App.tsx            # Root Component
│   │   └── main.tsx           # Entry Point
│   └── vite.config.ts
├── functions/                 # AWS Lambda source code (One directory per function)
│   ├── get-locations/         # GET /api/locations — ดึงข้อมูลสถานที่จาก DynamoDB
│   │   └── index.mjs
│   └── get-schedules/         # GET /api/schedules — ดึงข้อมูลตารางเรียนจาก DynamoDB
│       └── index.mjs
├── scripts/                   # Deploy helpers (bootstrap, seed, env:pull, site:publish, verify)
│   └── lib/stack.mjs          # อ่าน stack name/region จาก samconfig.toml และ Outputs จาก CloudFormation
├── tools/                     # Data extraction & Seeding scripts
│   └── data-extraction/
│       └── lc3/               # LC3 ground truth data (Seeds, CSVs, Validators)
├── template.yaml              # AWS SAM Template (IaC)
├── samconfig.toml             # SAM deployment settings (Safe for VCS)
└── README.md

```

---

## Developer Routine (How to Run & Develop)

โปรเจกต์นี้ทำงานแบบ Full-Stack Serverless เพื่อให้ทุกคนทดสอบระบบได้ 100% โดยไม่กวน Production ให้ทำตาม 5 ขั้นตอนนี้ตามลำดับ:

### 🛑 กฎสำคัญของทีม: ห้ามกดสร้าง Resource เองบน AWS Console (No ClickOps)

ทีมของเราอาจคุ้นเคยกับการกดสร้าง DynamoDB หรือตั้งค่าต่างๆ ผ่านหน้าเว็บ AWS (ClickOps) แต่สำหรับ V2 เราจะเปลี่ยนมาใช้ **Infrastructure as Code (IaC)** เต็มรูปแบบ

**💡 คลายข้อสงสัย: แล้วยังต้องเข้าเว็บ AWS Academy อยู่ไหม?**

* **ยังต้องเข้าเว็บไปกด "Start Lab" อยู่:** เพื่อเป็นการเปิดสวิตช์การทำงานของบัญชี และก๊อปปี้ Credentials ชั่วคราว (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`) มาใส่ใน Terminal ของเครื่องคอมพิวเตอร์เรา
* **แต่หลังจากนั้นให้ "ปิดหน้าเว็บทิ้งได้เลย":** ห้ามใช้เมาส์คลิกสร้าง Bucket, DynamoDB Table, API Gateway หรือ Lambda ผ่านหน้าจอ AWS Console เด็ดขาด

การสร้าง Cloud Infrastructure ทั้งหมดจะย้ายมาอยู่ที่ **VSCode Terminal** (หรือ Command Prompt) แทน เราจะเขียนสเปกของคลาวด์ทุกอย่างลงในไฟล์ `template.yaml` แล้วใช้คำสั่ง `sam deploy` ให้ AWS ก่อสร้างทุกอย่างตามโค้ดโดยอัตโนมัติ (นี่คือที่มาของคำว่า Infrastructure as Code)

**ทำไมต้องบังคับใช้ IaC?**

1. **แก้ปัญหาฝันร้ายตอนรวมโค้ด:** หากคุณแอบไปกดสร้าง Resource บน Console เอง ระบบ CI/CD (GitHub Actions) จะ "ตาบอด" และไม่รู้ว่าคุณทำอะไรไปบ้าง เมื่อคุณโยนโค้ดมาให้ Tech Lead กด Merge ระบบ Production จะพังทันทีเพราะการตั้งค่าบน Cloud ไม่ตรงกับโค้ด
2. **ป้องกัน Human Error:** มนุษย์กด UI 10 ครั้งไม่มีทางเหมือนกันทุกครั้ง (เช่น ลืมตั้งค่า CORS หรือพิมพ์ชื่อ Table ผิด) การใช้ไฟล์ `template.yaml` เปรียบเสมือนการใช้ "พิมพ์เขียว (Blueprint)" แผ่นเดียวกัน ทำให้สถาปัตยกรรมของทุกคนเป๊ะ 100%
3. **Automated Deployment:** ทันทีที่คุณอัปเดตไฟล์ `template.yaml` คำสั่ง `sam deploy` จะอ่านพิมพ์เขียวนี้และก่อสร้าง Resource ทุกชิ้นขึ้นบน AWS Learner Lab ของคุณให้อัตโนมัติในไม่กี่นาที

---

### 🛠️ Pre-requisites (สิ่งที่ต้องเตรียมก่อนเริ่มงาน)

**1. ติดตั้ง AWS SAM CLI + AWS CLI (ทำครั้งแรกครั้งเดียว)**
เครื่องคอมพิวเตอร์ของทุกคนต้องมีเครื่องมือสำหรับอ่านไฟล์ IaC และคุยกับ AWS หากยังไม่มี ให้ติดตั้งตามนี้:
*   **Windows (PowerShell as Admin):** `winget install -e --id Amazon.SAM-CLI` แล้ว `winget install -e --id Amazon.AWSCLI`
*   **Mac (Homebrew):** `brew install aws-sam-cli awscli`
*(💡 ติดตั้งเสร็จแล้ว ต้องปิดแล้วเปิด VSCode / Terminal ใหม่ด้วยนะ ไม่งั้น PATH จะยังเป็นของเก่าแล้วขึ้นว่า `sam : The term 'sam' is not recognized`)*
*(💡 SAM CLI ไม่ได้แถม AWS CLI มาให้ แต่ script ใน `scripts/` ใช้ทั้งคู่ ต้องลงทั้งสองตัว)*

**2. การใส่ AWS Credentials (ต้องทำทุกครั้งที่ Start Lab ใหม่)**
เนื่องจากเราใช้ AWS Academy Learner Lab กุญแจ (Credentials) ของเราจะหมดอายุทุกๆ 4 ชั่วโมง เมื่อคุณกดปุ่ม "Start Lab" บนหน้าเว็บ ให้ทำตามนี้:
1. คลิกที่ **AWS Details** (ข้างปุ่ม Start Lab)
2. กดปุ่ม **Show** ตรงหัวข้อ AWS CLI
3. **เลือกระบบปฏิบัติการให้ถูกแท็บ:** (Windows เลือก PowerShell / Mac เลือก bash)
4. ก๊อปปี้โค้ดทั้งหมดมา Paste ลงใน Terminal (VSCode) ของโปรเจกต์ แล้วกด Enter เช่น:
   ```powershell
   $env:AWS_ACCESS_KEY_ID="ASIA..."
   $env:AWS_SECRET_ACCESS_KEY="..."
   $env:AWS_SESSION_TOKEN="..."
   ```

*(⚠️ ถ้าไม่ทำขั้นตอนนี้ คุณจะรันคำสั่ง `sam deploy` ไม่ได้ เพราะ SAM จะไม่รู้ว่าต้องเอาโค้ดไปสร้างที่บัญชีของใคร)*

---

### Step 1: Initial Setup (ทำครั้งแรกครั้งเดียว)

ติดตั้ง Dependencies สำหรับฝั่งหน้าบ้าน (Frontend):

```bash
npm --prefix frontend install
```

### Step 2: สร้างระบบทั้งก้อนของตัวเอง (Personal Sandbox) — คำสั่งเดียวจบ

**ทำไมต้องทำขั้นตอนนี้?** เพื่อไม่ให้การทดสอบระบบของคุณไปกวนการทำงานของเพื่อน หรือเผลอไปทำข้อมูลบน Production พัง ทุกคนจึงต้องสร้าง Sandbox ส่วนตัวบนบัญชี AWS Academy Learner Lab ของตัวเอง

เปิด Terminal ที่ Root folder (หลังใส่ Credentials แล้ว) แล้วรัน:

```bash
npm run bootstrap
```

คำสั่งเดียวนี้ทำให้ครบทั้งระบบ:

| ขั้น | สิ่งที่เกิดขึ้น |
| :-- | :-- |
| `sam build` + `sam deploy` | สร้าง DynamoDB table, Lambda 2 ตัว, API Gateway และ **S3 bucket สำหรับโฮสต์เว็บ** ตาม `template.yaml` |
| seed | นำเข้าข้อมูลห้อง 131 รายการเข้า table ของคุณเอง (อ่านชื่อ table จาก Outputs ของ stack ตัวเอง ไม่แตะของเพื่อน) |
| env:pull | เขียน `frontend/.env.local` ให้ชี้ API URL ของคุณอัตโนมัติ — **ไม่ต้องก๊อป URL มาวางเองอีกแล้ว** |
| site:publish | build หน้าเว็บแล้ว sync ขึ้น S3 ของคุณ |
| verify | เช็ก 7 จุด แล้วพิมพ์ `[PASS]`/`[FAIL]` ทีละบรรทัด |

จบแล้วจะพิมพ์ URL ของเว็บกับ API ออกมา เปิด URL นั้นได้เลย

### Step 3: รันและทดสอบระบบ (Local Server)

1. รันเซิร์ฟเวอร์จำลองหน้าเว็บ:

```bash
npm run dev
```

2. เปิดบราวเซอร์ที่ `http://localhost:5173` หน้าเว็บจะดึงข้อมูลจริงจาก DynamoDB บน AWS ของคุณเอง
*(💡 หากต้องการเทสบนมือถือ ให้รัน `npm run dev -- --host` แล้วเข้าผ่าน URL ในช่อง Network)*

### Step 4: คำสั่งที่ใช้ประจำ

| สถานการณ์ | คำสั่ง |
| :-- | :-- |
| แก้ `template.yaml` หรือโค้ด Lambda | `npm run bootstrap` |
| แก้เฉพาะหน้าบ้าน อยากอัปขึ้นเว็บจริง | `npm run site:publish` |
| Start Lab ใหม่ / สงสัยว่าของตัวเองพัง | `npm run verify` |
| API URL เปลี่ยนหลังสร้าง stack ใหม่ | `npm run env:pull` |
| อยากโหลดข้อมูลใหม่ | `npm run seed` |
| เลิกใช้ อยากลบทิ้งให้หมด | `npm run site:empty` แล้วค่อย `sam delete` |

*(⚠️ ต้อง `npm run site:empty` ก่อน `sam delete` เสมอ — CloudFormation ลบ bucket ที่ยังมีไฟล์อยู่ไม่ได้ stack จะค้างกลางทาง)*

### Step 5: เปิด Pull Request & Deploy to Production

1. เมื่อเทสในเครื่องตัวเองผ่านหมดแล้ว ให้ Commit โค้ดและเปิด Pull Request (PR) เข้า Branch `main`
2. เมื่อ PR ถูกตรวจสอบและ Merge สำเร็จ ระบบ CI/CD (GitHub Actions) จะนำโค้ด `template.yaml` ชุดเดียวกันนี้ ไปรันสร้างและอัปเดตระบบบน **บัญชี Production หลัก** ให้อัตโนมัติ

### 🩺 Troubleshooting

| อาการ | สาเหตุ / วิธีแก้ |
| :-- | :-- |
| `ExpiredToken` หรือ `Unable to locate credentials` | Credentials หมดอายุ (4 ชม.) — กด Start Lab ใหม่ ก๊อป Credentials มาวางในเทอร์มินัลเดิม แล้วรัน `npm run bootstrap` อีกครั้ง |
| `sam : The term 'sam' is not recognized` | เทอร์มินัลเปิดค้างไว้ตั้งแต่ก่อนติดตั้ง PATH เลยยังเป็นของเก่า — ปิดเปิดเทอร์มินัลใหม่ |
| `BucketAlreadyExists` ตอน deploy | ชื่อ bucket มาจาก `<stack name>-site-<account id>` — ถ้าตั้งชื่อ stack เป็นตัวพิมพ์ใหญ่ มี `_` หรือยาวเกิน ~37 ตัวอักษร จะได้ชื่อที่ S3 ไม่รับ ให้ใช้ชื่อ stack ตัวเล็กสั้นๆ |
| deploy พังที่ `SiteBucketPolicy` เป็น `AccessDenied` | บัญชีเปิด Block Public Access ระดับ account ไว้ (ตั้งค่าระดับ bucket ทับไม่ได้) เช็กด้วย `aws s3control get-public-access-block --account-id <id>` ถ้าเปิดอยู่ให้ปิดสองตัวนี้: `aws s3control put-public-access-block --account-id <id> --public-access-block-configuration BlockPublicPolicy=false,RestrictPublicBuckets=false` |
| เว็บขึ้นแต่ไม่มีห้องเลย / `.env.local` หาย | `npm run env:pull` แล้ว `npm run site:publish` ใหม่ (Vite ฝัง API URL ตอน build ถ้าตอน build ไม่มีค่า เว็บจะยิงผิดที่) |

---

## Testing & Code Quality

ทุกการเปลี่ยนแปลงต้องผ่าน Automated Checks ทั้งหมดก่อนที่จะสามารถ Merge เข้าสู่ Branch `main`:

| Scope | คำสั่ง | คำอธิบาย |
| --- | --- | --- |
| Frontend | `npm test` (ใน `frontend/`) | รัน Unit & Component Tests ทั้งหมด |
| Frontend | `npm run lint` (ใน `frontend/`) | ตรวจสอบ Code Style และข้อผิดพลาดด้วย ESLint |
| Frontend | `npm run build` (ใน `frontend/`) | ตรวจสอบ TypeScript Types และสร้าง Production Bundle |
| Backend / IaC | `sam validate` (ที่ Root) | ตรวจสอบ Syntax และ Schema ของไฟล์ `template.yaml` |