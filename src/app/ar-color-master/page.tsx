import type { Metadata } from "next";
import { ArColorMasterGame } from "./ar-color-master-game";

export const metadata: Metadata = {
  title: "AR Color Master | ศึกนักเวทย์แห่งวงจรสี",
  description:
    "เกมต่อสู้สีแบบ AR สำหรับเรียนรู้แม่สี สีขั้นที่ 2 วรรณะร้อน-เย็น และสีคู่ตรงข้าม",
};

export default function ArColorMasterPage() {
  return <ArColorMasterGame />;
}
