export const runnerTypes = [
  "experience",
  "lifestyle",
  "performance"
];

export const quizData = {
  questions: [
    {
      id: "q1",
      prompt: {
        zh: "為什麼參加 Garmin Run？",
        en: "Why did you sign up for Garmin Run?"
      },
      options: [
        {
          id: "q1_experience",
          text: { zh: "Garmin Run 作為跑者盛會之一，當然要參加啦。", en: "Garmin Run is one of the biggest moments for runners, so of course I am joining." },
          detail: { zh: "和跑友一起享受社群、活動與賽道體驗。", en: "I want to enjoy the community, event, and course experience with fellow runners." },
          traits: ["experience"]
        },
        {
          id: "q1_lifestyle",
          text: { zh: "Garmin Run 可是每年必定參加的固定賽事呢。", en: "Garmin Run is a race I make sure to join every year." },
          detail: { zh: "跑步已經融入生活，自然而然成為習慣。", en: "Running is part of my lifestyle and this race is a natural yearly ritual." },
          traits: ["lifestyle"]
        },
        {
          id: "q1_performance",
          text: { zh: "目標賽事之一，11月底是突破 PB 的好時機。", en: "It is one of my target races, and late November is a great time to break my PB." },
          detail: { zh: "為訓練設定目標，準備在賽道上突破自己。", en: "I train toward a goal and prepare to push my limits on race day." },
          traits: ["performance"]
        }
      ]
    },
    {
      id: "q2",
      prompt: {
        zh: "賽前一晚收拾裝備的你……",
        en: "The night before the race, while packing your gear..."
      },
      options: [
        {
          id: "q2_experience",
          text: { zh: "晶片怎麼那麼難固定，啊號碼布不能忘記。", en: "The chip is so hard to attach, and I can't forget my bib." },
          traits: ["experience"]
        },
        {
          id: "q2_lifestyle",
          text: { zh: "把裝備們排好來張大合照上傳社群。", en: "Pack as I usually do for a run. Familiar gear feels the most natural." },
          traits: ["lifestyle"]
        },
        {
          id: "q2_performance",
          text: { zh: "確認競速裝備與補給策略萬無一失。", en: "Plan my pace, fueling, and hydration schedule in advance." },
          detail: { zh: "為訓練設定目標，準備在賽道上突破自己。", en: "I train toward a goal and prepare to push my limits on race day." },
          traits: ["performance"]
        },
        {
          id: "q2_sustainability",
          text: { zh: "帶上自己的補水裝備，讓明天的賽道更永續。", en: "Bring my own hydration gear to make tomorrow's course more sustainable." },
          detail: { zh: "我超怕脫水！補水策略100分自己的補水自己掌握，能不進站就不進站。", en: "I train toward a goal and prepare to push my limits on race day." },
          traits: [],
          sustainability: true
        }
      ]
    },
    {
      id: "q3",
      prompt: {
        zh: "站在起跑線前你會……",
        en: "At the starting line, you..."
      },
      options: [
        {
          id: "q3_experience",
          text: { zh: "和身邊的跑友打招呼，準備一起享受這場活動。", en: "Say hello to the runners around me and get ready to enjoy the event together." },
          traits: ["experience"]
        },
        {
          id: "q3_lifestyle",
          text: { zh: "檢查儀容，不管跑得怎麼樣，在賽道上要做好表情管理，才能帥帥美美的。", en: "Warm up at my own pace and run as I normally do." },
          traits: ["lifestyle"]
        },
        {
          id: "q3_performance",
          text: { zh: "確認手錶、鞋帶與配速策略，準備全力以赴。", en: "Check my watch, laces, and pacing strategy before giving it my all." },
          traits: ["performance"]
        },
        {
          id: "q3_meme",
          text: { zh: "肚子好餓喔！馬拉松只是一場補給桌之間距離有點遠的吃到飽活動。", en: "I am so hungry! A marathon is just an all-you-can-eat buffet with long distances between tables." },
          traits: [],
          isMeme: true
        }
      ]
    },
    {
      id: "q4",
      prompt: {
        zh: "跑到 7.5K，前方終於出現補給站，你會……",
        en: "At 7.5K, you finally see a hydration station ahead. You..."
      },
      options: [
        {
          id: "q4_experience",
          text: { zh: "終於到補給站啦！", en: "Join everyone at the station and enjoy this part of the course experience." },
          detail: { zh: "先喘口氣、喝水吃東西，順順的繼續上路。", en: "I train toward a goal and prepare to push my limits on race day." },
          traits: ["experience"]
        },
        {
          id: "q4_lifestyle",
          text: { zh: "來看看有什麼特別的", en: "Hydrate when it feels right, take a comfortable break, and keep going." },
          detail: { zh: "難得參加比賽，補給站當然不能錯過。", en: "I train toward a goal and prepare to push my limits on race day." },
          traits: ["lifestyle"]
        },
        {
          id: "q4_performance",
          text: { zh: "精準進站", en: "Make a precise, quick hydration stop without disrupting my rhythm." },
          detail: { zh: "快速拿水、補給，繼續追自己的配速。", en: "I train toward a goal and prepare to push my limits on race day." },
          traits: ["performance"]
        },
        {
          id: "q4_sustainability",
          text: { zh: "優雅地停下來使用自己的軟水杯／軟水壺裝水。", en: "Gracefully stop and fill my own soft cup or soft flask." },
          detail: { zh: "用自己的容器裝水，既環保又特別。", en: "Fill my own cup with water, which is both environmentally friendly and practical." },
          traits: [],
          sustainability: true
        }
      ]
    },
    {
      id: "q5",
      prompt: {
        zh: "剩下最後 2K 啦！你心想……",
        en: "Only 2K to go! You think..."
      },
      options: [
        {
          id: "q5_experience",
          text: { zh: "終點很多攝影師，再累都要漂漂亮亮", en: "Enjoy this final stretch too. The atmosphere of this race is amazing." },
          traits: ["experience"]
        },
        {
          id: "q5_lifestyle",
          text: { zh: "嗚嗚要結束了，美好的賽事總是過得特別快", en: "Finish at my own pace and complete a comfortable run today." },
          traits: ["lifestyle"]
        },
        {
          id: "q5_performance",
          text: { zh: "維持配速就能破PB啦，加油撐住！", en: "Hold this pace and I can break my PB. Keep going!" },
          traits: ["performance"]
        },
        {
          id: "q5_meme",
          text: { zh: "好累啊！下次不跑了嗚嗚，誰愛跑誰跑。", en: "I am so tired! I am never running again. Whoever likes running can do it." },
          traits: [],
          isMeme: true
        }
      ]
    },
    {
      id: "q6",
      prompt: {
        zh: "恭喜完賽！下一場賽事你想……",
        en: "Congratulations on finishing! For your next race, you want to try..."
      },
      options: [
        {
          id: "q6_soft_flask",
          text: { zh: "軟水壺在手，攜帶不酸手", en: "A soft flask that is easy to carry without tiring my hand" },
          traits: []
        },
        {
          id: "q6_soft_cup",
          text: { zh: "軟水杯輕便，停歇更輕快", en: "A lightweight soft cup for an easier break" },
          traits: []
        },
        {
          id: "q6_trail_vest",
          text: { zh: "野跑背心，風格速度兼備", en: "A trail vest that combines style and speed" },
          traits: []
        },
        {
          id: "q6_performance_gear",
          text: { zh: "屏除障礙，持續突破成績", en: "Remove obstacles and keep breaking my records" },
          traits: []
        },
        {
          id: "q6_sustainability",
          text: { zh: "與跑友分享自己為什麼選擇自帶補水裝備", en: "Share with fellow runners why I choose to bring my own hydration gear" },
          traits: [],
          sustainability: true
        }
      ]
    }
  ]
};
