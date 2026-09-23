export const runnerTypes = [
  "light",
  "freedom",
  "precision",
  "sustainability"
];

// Temporary trait mapping for UI prototyping. Replace these values with the approved matrix.
export const quizData = {
  questions: [
    {
      id: "q1",
      prompt: {
        zh: "Garmin Run 前一晚，你正在準備明天的裝備……",
        en: "The night before Garmin Run, you are preparing your gear..."
      },
      options: [
        {
          id: "q1_a",
          text: {
            zh: "能少帶就少帶。",
            en: "Pack only what you need."
          },
          detail: {
            zh: "鞋子、手錶、必要的東西準備好，輕裝出發最舒服。",
            en: "Shoes, watch, and essentials are ready. Running light feels best."
          },
          traits: ["light"]
        },
        {
          id: "q1_b",
          text: {
            zh: "先把整場怎麼跑想清楚。",
            en: "Plan the whole run first."
          },
          detail: {
            zh: "配速、補給、喝水時間，最好都先安排好。",
            en: "Pace, hydration, and fueling times should all be planned ahead."
          },
          traits: ["precision"]
        },
        {
          id: "q1_c",
          text: {
            zh: "明天想怎麼跑，就怎麼跑。",
            en: "Run tomorrow however you feel."
          },
          detail: {
            zh: "裝備準備齊全一點，到了賽道再看狀況調整。",
            en: "Bring enough gear and adjust when you see how the course feels."
          },
          traits: ["freedom"]
        },
        {
          id: "q1_d",
          text: {
            zh: "我已經準備好了。",
            en: "I am already ready."
          },
          detail: {
            zh: "平常怎麼跑，明天就怎麼跑，沒什麼好緊張的。",
            en: "Run tomorrow as you normally do. Nothing to worry about."
          },
          traits: ["sustainability"]
        }
      ]
    },
    {
      id: "q2",
      prompt: {
        zh: "Garmin Run 起跑線前，你想的是……",
        en: "At the Garmin Run starting line, you are thinking..."
      },
      options: [
        {
          id: "q2_a",
          text: { zh: "檢查手錶、鞋帶、確認配速策略", en: "Check my watch and laces, then confirm my pacing strategy" },
          traits: ["precision"]
        },
        {
          id: "q2_b",
          text: { zh: "好緊張腦袋一片空白", en: "I am so nervous that my mind goes blank" },
          traits: ["freedom"]
        },
        {
          id: "q2_c",
          text: { zh: "摸一下口袋，確認軟水杯的位置", en: "Check that my soft cup is in my pocket" },
          traits: ["light"]
        },
        {
          id: "q2_d",
          text: { zh: "檢查儀容，不管跑得怎麼樣，在賽道上都要表情管理（帥帥美美的）", en: "Check my look. Whatever happens, I need to look great on the course" },
          traits: ["sustainability"]
        },
        {
          id: "q2_e",
          text: { zh: "今日課表：長跑100分鐘", en: "Today's workout: 100-minute long run" },
          traits: ["freedom"]
        }
      ]
    },
    {
      id: "q3",
      prompt: {
        zh: "跑到 7.5K，前方終於出現補給站，你會……",
        en: "At 7.5K, you finally see a hydration station ahead. You..."
      },
      options: [
        {
          id: "q3_a",
          text: { zh: "優雅地停下來使用自己的軟水杯裝水", en: "Gracefully stop and fill my own soft cup" },
          traits: ["light"]
        },
        {
          id: "q3_b",
          text: { zh: "精準進站，快速抓水，一秒鐘都不能耽誤", en: "Enter precisely, grab water quickly, and lose not a second" },
          traits: ["precision"]
        },
        {
          id: "q3_c",
          text: { zh: "用自己的軟水壺、水袋背心，不用進站人擠人真順暢", en: "Use my soft flask or hydration vest and skip the crowded station" },
          traits: ["freedom"]
        },
        {
          id: "q3_d",
          text: { zh: "終於到了，停下來喘口氣喝點水吃點東西，再重新上路", en: "Finally. Stop, catch my breath, hydrate, refuel, then head out again" },
          traits: ["sustainability"]
        },
        {
          id: "q3_e",
          text: { zh: "挑戰極限不用補給！衝衝衝！", en: "Push the limit without a refill! Go, go, go!" },
          traits: ["precision"]
        }
      ]
    },
    {
      id: "q4",
      prompt: {
        zh: "剩下最後 2K 啦！你心想……",
        en: "Only 2K to go! You think..."
      },
      options: [
        {
          id: "q4_a",
          text: { zh: "終於要結束啦，下次不跑了好累！", en: "It is almost over. I am never running again. I am exhausted!" },
          traits: ["freedom"]
        },
        {
          id: "q4_b",
          text: { zh: "嗚嗚要結束了，美好的賽事總是過得特別快", en: "It is almost over. Great races always go by too fast" },
          traits: ["sustainability"]
        },
        {
          id: "q4_c",
          text: { zh: "維持配速就能破 PB，加油撐住！", en: "Hold this pace and I can set a new PB. Keep going!" },
          traits: ["precision"]
        },
        {
          id: "q4_d",
          text: { zh: "終點很多攝影師，再累都要漂漂亮亮", en: "There are photographers at the finish. Look good no matter how tired I am" },
          traits: ["light"]
        }
      ]
    },
    {
      id: "q5",
      prompt: {
        zh: "恭喜完賽！下一場賽事你想……",
        en: "Congratulations on finishing! For the next race, you want to..."
      },
      options: [
        {
          id: "q5_a",
          text: { zh: "軟水壺在手，攜帶不酸手", en: "Carry a soft flask without tiring my hand" },
          traits: ["freedom"]
        },
        {
          id: "q5_b",
          text: { zh: "軟水杯輕便，停歇更輕快", en: "A lightweight soft cup for an easier break" },
          traits: ["light"]
        },
        {
          id: "q5_c",
          text: { zh: "野跑背心，風格速度兼備", en: "A trail vest that combines style and speed" },
          traits: ["sustainability"]
        },
        {
          id: "q5_d",
          text: { zh: "屏除障礙，持續突破成績", en: "Remove obstacles and keep breaking my records" },
          traits: ["precision"]
        }
      ]
    }
  ]
};
