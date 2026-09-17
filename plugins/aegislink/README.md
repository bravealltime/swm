# 🛡️ AegisLink (เอจิสลิงก์)
### ปลั๊กอินส่งข้อมูลการรบและสถิติบัญชีอัตโนมัติ สำหรับ Summoners War Exporter (SWEX)
*พัฒนาขึ้นเพื่อใช้งานคู่กับ SWM Tactical Intelligence Platform โดยเฉพาะ (ทดแทนและต่อยอดจากปลั๊กอินเดิมของ Cerusa / SWGT)*

---

## 🌟 จุดเด่นที่เหนือกว่าปลั๊กอินรุ่นเก่า:
1. **ชื่อและแบรนด์เฉพาะตัว (AegisLink)**: ไม่ใช้ชื่อซ้ำหรืออิงกับ SWGT / Cerusa
2. **น้ำหนักเบาและเสถียรสูง**: เขียนด้วย Modern JavaScript ไม่มี dependency เก่าอย่าง `request` ที่ตกรุ่น
3. **รองรับระบบครบวงจรในตัวเดียว**:
   - ⚔️ **Siege 3MDC Logger**: จับคู่ทีมบุก 3 ตัว vs ทีมตั้งรับ 3 ตัว พร้อมบันทึกผล Win/Loss อัตโนมัติ
   - 🏰 **World Guild Battle**: บันทึกการต่อสู้สงครามกิลด์โลก
   - 💎 **Dungeon Drop Rate Tracker**: บันทึกสถิติการดรอปของดันเจี้ยนไครอสและรอยแยกมิติ
   - 📜 **Account Character Sync**: รองรับการส่งข้อมูลรูนและมอนสเตอร์
4. **ความปลอดภัย**: รองรับการใส่ **SWM Sync Security Key** ป้องกันการส่งข้อมูลสวมรอย
5. **ใช้งานคู่กับเว็บ SWM**: มีหน้าจอ **"ศูนย์เชื่อมต่อปลั๊กอิน (AegisLink Station)"** บนเว็บ เพื่อดูสถานะแพ็กเก็ตแบบเรียลไทม์

---

## 📦 วิธีการติดตั้งใน SWEX (Summoners War Exporter):

1. ดาวน์โหลดหรือคัดลอกโฟลเดอร์ `aegislink`
2. ไปที่โฟลเดอร์ติดตั้งของโปรแกรม **Summoners War Exporter (SWEX)** บนคอมพิวเตอร์ของคุณ
3. เปิดโฟลเดอร์ `plugins/` (หากไม่มี ให้สร้างโฟลเดอร์ชื่อ `plugins`)
4. วางโฟลเดอร์ `aegislink` ลงในโฟลเดอร์ `plugins/`
   ```
   C:\Program Files\Summoners War Exporter\resources\app\plugins\aegislink\
   ├── index.js
   ├── package.json
   └── README.md
   ```
5. ปิดและเปิดโปรแกรม **SWEX** ใหม่
6. ไปที่เมนู **Settings** ➔ **Plugins** ใน SWEX แล้วเปิดใช้งาน **AegisLink**
7. กำหนด **Endpoint URL** เป็น URL ของเว็บ SWM (เช่น `http://localhost:5173/api/sync`) หรือ URL เซิร์ฟเวอร์ของคุณ

---

## ⚙️ ตัวเลือกการตั้งค่า (Settings):
- `enabled`: เปิด/ปิด การทำงานของปลั๊กอิน
- `endpointUrl`: URL ของเว็บ SWM ที่ต้องการให้ส่งข้อมูลไป
- `apiKey`: รหัสความปลอดภัย (สร้างได้จากหน้าเว็บ SWM)
- `log3MDC`: บันทึกข้อมูลเคาน์เตอร์ 3MDC อัตโนมัติ
- `logSiege`: บันทึกข้อมูล Siege Battle
- `logGuildWar`: บันทึกข้อมูล World Guild Battle
- `logDungeonDrops`: บันทึกสถิติดรอปไอเทมในดันเจี้ยน
- `syncRuneData`: ส่งข้อมูลรูนและมอนสเตอร์เมื่อล็อกอินเข้าเกม
