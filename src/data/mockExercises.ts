import type { Exercise } from "../types/exercise";

export const mockExercises: Exercise[] = [
  {
    exercise_id: "ex_treadmill_warmup",
    name_cn: "跑步机热身",
    equipment_id: "eq_treadmill",
    beginner_explanation: "先让身体热起来，后面的力量训练会更顺。",
    target_body_parts_beginner: ["心肺", "腿部"],
    difficulty: "beginner",
    steps: ["速度调到能轻松说话的程度。", "肩膀放松，脚步稳定。", "走 5 分钟，身体微微发热就好。"],
    setup_tips: ["先站到两侧踏板上，再启动机器。", "安全夹能夹就夹上。"],
    common_mistakes: ["一上来速度太快。", "低头看手机导致脚步不稳。"],
    safety_notes: ["如果头晕或胸闷，先停下来休息。"],
    default_sets: 1,
    default_reps: "5 分钟",
    media_hint: "低速跑步机热身"
  },
  {
    exercise_id: "ex_lat_pulldown",
    name_cn: "高位下拉",
    equipment_id: "eq_lat_pulldown",
    beginner_explanation: "主要练背两侧，也就是让背看起来更挺、更宽的地方。",
    target_body_parts_beginner: ["背两侧", "手臂前侧"],
    difficulty: "beginner",
    steps: ["双手握住横杆，比肩稍宽。", "先把肩膀从耳朵旁边放下来，不要耸肩。", "想象用手肘往下夹，把横杆拉到锁骨附近。", "放回去的时候慢一点，不要让重量弹回去。"],
    setup_tips: ["坐下后，把大腿垫调到能稳稳压住大腿的位置。", "双脚踩实地面，身体不要被重量拉起来。"],
    common_mistakes: ["用手臂硬拉，背部没感觉。", "身体后仰太多，变成借力。", "重量太大，动作变形。", "放回去太快，控制不住重量。"],
    safety_notes: ["如果肩膀或手肘疼痛，先停止训练。小铁只能提供入门建议，不能替代专业教练或医生判断。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "坐姿下拉器械，双手握横杆"
  },
  {
    exercise_id: "ex_chest_press",
    name_cn: "坐姿推胸",
    equipment_id: "eq_chest_press",
    beginner_explanation: "主要练胸前侧，推门、推东西会用到这块力量。",
    target_body_parts_beginner: ["胸前侧", "手臂后侧"],
    difficulty: "beginner",
    steps: ["背部贴住靠垫。", "手握把手，手腕保持直。", "把把手向前推出去，不要锁死手肘。", "慢慢收回来，别让重量砸回去。"],
    setup_tips: ["座椅高度让把手大概在胸口位置。", "脚踩实地面，身体不要前后晃。"],
    common_mistakes: ["肩膀耸起来。", "手腕弯折。", "只顾推重，回来的时候太快。"],
    safety_notes: ["如果肩前侧疼，先减轻重量或停止。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "坐姿推胸器械"
  },
  {
    exercise_id: "ex_seated_row",
    name_cn: "坐姿划船",
    equipment_id: "eq_seated_row",
    beginner_explanation: "主要练背中间，帮助你把背挺起来。",
    target_body_parts_beginner: ["背中间", "手臂前侧"],
    difficulty: "beginner",
    steps: ["坐稳，脚踩好踏板。", "先把胸口轻轻挺起来。", "把把手拉向肚脐附近。", "慢慢放回去，背不要塌。"],
    setup_tips: ["把胸垫或座椅调到你能自然坐直的位置。", "第一组先用偏轻重量找感觉。"],
    common_mistakes: ["耸肩拉。", "身体来回甩。", "拉太高变成耸肩。"],
    safety_notes: ["腰不舒服时先停止，不要硬撑。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "坐姿划船器械"
  },
  {
    exercise_id: "ex_leg_press",
    name_cn: "腿举",
    equipment_id: "eq_leg_press",
    beginner_explanation: "主要练大腿前侧和屁股，是新手比较好上手的腿部动作。",
    target_body_parts_beginner: ["大腿前侧", "屁股"],
    difficulty: "beginner",
    steps: ["背部贴紧靠垫。", "双脚踩在踏板中间，和肩差不多宽。", "蹬出去时膝盖不要完全锁死。", "收回来时慢一点，膝盖朝脚尖方向。"],
    setup_tips: ["先确认安全挡位。", "第一组用很轻的重量试动作。"],
    common_mistakes: ["膝盖向内扣。", "蹬到膝盖完全锁死。", "重量太大导致腰离开靠垫。"],
    safety_notes: ["膝盖或腰疼时先停止训练。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "腿举机"
  },
  {
    exercise_id: "ex_plank",
    name_cn: "平板支撑",
    equipment_id: "eq_unknown",
    beginner_explanation: "练肚子和身体稳定，让你做其他动作更稳。",
    target_body_parts_beginner: ["肚子", "身体稳定"],
    difficulty: "beginner",
    steps: ["手肘撑地，肩膀在手肘正上方。", "身体从头到脚保持一条线。", "像有人要轻轻打你肚子一样提前绷住。"],
    setup_tips: ["可以先从 20 秒开始。", "垫子不要太滑。"],
    common_mistakes: ["屁股翘太高。", "腰塌下去。", "憋气。"],
    safety_notes: ["腰疼时先停，不要硬撑时间。"],
    default_sets: 2,
    default_reps: "20 秒",
    media_hint: "垫上核心稳定动作"
  }
];

export const findExercise = (exerciseId: string) =>
  mockExercises.find((exercise) => exercise.exercise_id === exerciseId) ?? mockExercises[1];
