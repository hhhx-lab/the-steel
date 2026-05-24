export type EquipmentCategory = "machine" | "cable" | "free_weight" | "cardio";
export type RiskLevel = "low" | "medium" | "high";

export type Equipment = {
  equipment_id: string;
  name_cn: string;
  beginner_name: string;
  category: EquipmentCategory;
  target_body_parts_beginner: string[];
  target_muscles: string[];
  beginner_friendly: boolean;
  risk_level: RiskLevel;
};
