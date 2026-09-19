# _archive — สคริปต์ที่ใช้ครั้งเดียวตอนสร้างระบบ

สคริปต์แกะโค้ดเว็บต้นทาง (`find_*`, `inspect_*`, `analyze_*`), ลองยิง API (`test_*`, `sample_*`), และเช็กข้อมูลเฉพาะกิจ (`check_*`, `print_*`, `debug_*`)
รวมถึงเวอร์ชันที่ถูกแทนที่แล้ว: `download_skills.cjs` → `download_skills_concurrent.cjs`, `parse_swgt.cjs` → `extract_all.cjs`, `parse_full_monsters.cjs` → `build_all_monsters.cjs`

ไม่มีตัวไหนผลิตไฟล์ที่เว็บใช้ และไม่ได้ดูแลต่อ — เก็บไว้เผื่อต้องแกะ swranking / swgt.io อีกรอบเมื่อเว็บต้นทางเปลี่ยน
ส่วนใหญ่คาดว่ามีไฟล์ดิบใน `swgt_raw/` (gitignore) อยู่แล้ว
