import type { Equipment } from "../types/equipment";

export const mockEquipment: Equipment[] = [
  {
    equipment_id: "eq_lat_pulldown",
    name_cn: "高位下拉器",
    beginner_name: "练背的下拉器械",
    category: "machine",
    target_body_parts_beginner: ["背两侧", "手臂前侧"],
    target_muscles: ["背阔肌", "肱二头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_seated_row",
    name_cn: "坐姿划船器",
    beginner_name: "把背夹紧的划船器械",
    category: "machine",
    target_body_parts_beginner: ["背中间", "手臂前侧"],
    target_muscles: ["菱形肌", "背阔肌", "肱二头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_chest_press",
    name_cn: "坐姿推胸器",
    beginner_name: "练胸前侧的推举器械",
    category: "machine",
    target_body_parts_beginner: ["胸前侧", "手臂后侧"],
    target_muscles: ["胸大肌", "肱三头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_leg_press",
    name_cn: "腿举机",
    beginner_name: "练大腿和屁股的蹬腿器械",
    category: "machine",
    target_body_parts_beginner: ["大腿前侧", "屁股"],
    target_muscles: ["股四头肌", "臀大肌"],
    beginner_friendly: true,
    risk_level: "medium"
  },
  {
    equipment_id: "eq_treadmill",
    name_cn: "跑步机",
    beginner_name: "热身和有氧用的跑步机",
    category: "cardio",
    target_body_parts_beginner: ["心肺", "腿部"],
    target_muscles: ["腘绳肌", "股四头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_unknown",
    name_cn: "暂不确定",
    beginner_name: "还需要再拍清楚一点",
    category: "machine",
    target_body_parts_beginner: [],
    target_muscles: [],
    beginner_friendly: false,
    risk_level: "medium"
  }
];

export const findEquipment = (equipmentId: string) =>
  mockEquipment.find((equipment) => equipment.equipment_id === equipmentId) ?? mockEquipment[0];
