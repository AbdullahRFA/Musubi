export type Language = "en" | "ja";

export const translations = {
  en: {
    // Brand
    brandName: "Tsunagu Generations",
    brandSubtitle: "Connecting the Past to the Present",
    brandDescription:
      "An intergenerational community exchange platform connecting older and younger generations through knowledge sharing, skill exchange, daily assistance, and companionship.",

    // Header & Navigation
    nav: {
      posts: "Posts",
      explore: "Explore",
      search: "Search",
      myActivity: "My Activity",
      quickPost: "Quick Post",
      createQuickPost: "Create Quick Post",
      login: "Log In",
      register: "Register",
      signOut: "Sign Out",
      fontSize: "Font size",
      fontSizeStandard: "Standard font size",
      fontSizeLarge: "Large font size for easier reading",
      languageSelector: "Language selector",
      messages: "Messages",
      notifications: "Notifications",
      viewProfile: "View your profile",
    },

    // Mobile Bottom Nav
    bottomNav: {
      home: "Home",
      discover: "Discover",
      create: "Create",
      messages: "Messages",
      profile: "Profile",
    },

    // Hero Section
    hero: {
      badge: "Community Skill & Knowledge Exchange",
      headingLine1: "Connecting the",
      headingWisdom: "wisdom of the",
      headingPast: "past",
      headingWith: "with the",
      headingEnergy: "energy of today.",
      subtitle:
        "Tsunagu Generations brings older and younger generations together to share knowledge, exchange practical help, and build meaningful companionship.",
      exploreBtn: "Explore Community Posts",
      joinBtn: "Join Our Community",
      nowPlaying: "Now Playing:",
      slides: [
        {
          tag: "Connecting Generations",
          title: "Bringing Generations Together",
        },
        {
          tag: "Knowledge Sharing",
          title: "Exchanging Lifetime Wisdom & Modern Skills",
        },
        {
          tag: "Daily Assistance",
          title: "Practical Everyday Help & Neighborly Care",
        },
        {
          tag: "Companionship",
          title: "Meaningful Connection & Lasting Friendship",
        },
      ],
    },

    // About Our Platform Section
    about: {
      badge: "Our Core Philosophy",
      title: "Everyone Can Teach, Everyone Can Learn",
      subtitle:
        "Tsunagu Generations is founded on reciprocal community exchange. No user is locked into a permanent provider or receiver role—each generation brings valuable experience, curiosity, and care.",
      cards: [
        {
          title: "Knowledge Sharing",
          desc: "Pass down traditional recipes, cultural crafts, calligraphy, gardening wisdom, and life stories, while younger members exchange modern skills, digital tools, and fresh viewpoints.",
          tag: "Reciprocal learning",
        },
        {
          title: "Mutual Support",
          desc: "Help with everyday tasks such as smartphone settings, video calling, grocery errands, minor household chores, or seasonal preparation—provided with patience and neighborhood goodwill.",
          tag: "Practical assistance",
        },
        {
          title: "Companionship",
          desc: "Build genuine intergenerational friendships through casual conversation over tea, peaceful neighborhood walks, listening, and sharing hobbies that alleviate social isolation.",
          tag: "Social connection",
        },
      ],
    },

    // How Tsunagu Works Section
    howItWorks: {
      title: "How Tsunagu Works",
      subtitle:
        "A simple, respectful four-step process designed to make connecting effortless and safe for all ages.",
      steps: [
        {
          num: "01",
          title: "Create a Post",
          desc: "Post a skill or service you would love to share, or write a friendly request for assistance you need.",
          badge: "Easy quick-post format",
        },
        {
          num: "02",
          title: "Discover & Respond",
          desc: "Explore listings in your neighborhood. Send a polite connection request with an introductory message.",
          badge: "Filter by category & area",
        },
        {
          num: "03",
          title: "Connect & Coordinate",
          desc: "Chat securely within Tsunagu. Agree on the date, time, and comfortable public location for your exchange.",
          badge: "In-app private messaging",
        },
        {
          num: "04",
          title: "Complete & Review",
          desc: "Meet up, enjoy the mutual exchange, confirm completion, and leave warm, encouraging feedback for each other.",
          badge: "Build community trust",
        },
      ],
    },

    // Exchange Categories Section (6 categories)
    categories: {
      title: "Exchange Categories",
      subtitle: "Explore the diverse areas of mutual exchange supported across our community.",
      items: [
        {
          title: "Daily Assistance",
          desc: "Practical help with grocery runs, errands, light parcel carrying, and daily neighborhood tasks.",
          tags: ["Grocery Runs", "Errands", "Neighborhood Help"],
        },
        {
          title: "Technology Help",
          desc: "Patient guidance on smartphone navigation, video calls with family, email setup, and digital devices.",
          tags: ["Smartphones", "Video Calls", "Digital Apps"],
        },
        {
          title: "Companionship",
          desc: "Warm and friendly conversation over tea, park strolls, reminiscing, and sharing joyful moments.",
          tags: ["Tea Chats", "Walking", "Shared Hobbies"],
        },
        {
          title: "Learning & Skills",
          desc: "Traditional home cooking, calligraphy, origami, language practice, history, and craft techniques.",
          tags: ["Home Cooking", "Handicrafts", "Languages"],
        },
        {
          title: "Home Assistance",
          desc: "Balcony gardening tips, plant watering during trips, book organization, and seasonal home tidying.",
          tags: ["Gardening", "Plant Care", "Home Organization"],
        },
        {
          title: "Community & Local Activities",
          desc: "Join neighborhood events, cultural activities, community gardening, and local group activities to build friendships and stay connected.",
          tags: ["Local Events", "Cultural Activities", "Community Groups"],
        },
      ],
    },

    // Final Call to Action
    cta: {
      title: "Everyone has something to share. Everyone has something to gain.",
      subtitle:
        "Join your local Tsunagu community today. Whether you wish to share wisdom, lend an everyday hand, or connect with a neighbor, there is a place for you.",
      getStarted: "Get Started",
    },

    // Footer
    footer: {
      explorePlatform: "Platform",
      aboutUs: "About Us",
      howItWorks: "How It Works",
      communityPosts: "Community Posts",
      createPost: "Create Post",
      safetySupport: "Safety & Support",
      safety: "Safety Guidelines",
      support: "Support",
      contact: "Contact",
      search: "Search",
      language: "Language:",
      copyright: "© 2026 Tsunagu Generations. All rights reserved.",
      tagline: "Connecting the Past to the Present",
    },

    // Posts Directory Page
    postsPage: {
      title: "Community Posts",
      subtitle: "Explore skill offers, requests for assistance, and companionship in our neighborhood",
      quickPost: "Quick Post",
      standardPost: "Standard Post",
      guestBannerTitle: "Browsing Community Exchanges as a Guest",
      guestBannerDesc:
        "You can explore all skills, offers, and requests. Sign in or register when you are ready to respond to a neighbor or create your own post.",
      searchPlaceholder: "Filter by keyword, skill, title, or place...",
      typeLabel: "Type of Post",
      allTypes: "All",
      offers: "Offers",
      requests: "Requests",
      categoryLabel: "Category",
      allCategories: "All Categories",
      exchangeLabel: "Exchange Method",
      allExchanges: "All Exchange Types",
      showingCount: "Showing {count} posts",
      noPostsTitle: "No posts match your filters.",
      noPostsDesc: "Try adjusting your search keywords, or check back soon as neighbors add new posts.",
      resetFilters: "Clear all filters",
    },
  },

  ja: {
    // Brand
    brandName: "ツナグ・ジェネレーションズ",
    brandSubtitle: "過去の知恵と現在のエネルギーを繋ぐ",
    brandDescription:
      "知識の共有、スキル交換、日常の助け合い、そして心温まる交流を通じて、シニア世代と若者世代をつなぐ世代間コミュニティプラットフォームです。",

    // Header & Navigation
    nav: {
      posts: "投稿一覧",
      explore: "探索する",
      search: "検索",
      myActivity: "マイ活動",
      quickPost: "クイック投稿",
      createQuickPost: "クイック投稿を作成",
      login: "ログイン",
      register: "新規登録",
      signOut: "ログアウト",
      fontSize: "文字サイズ",
      fontSizeStandard: "標準文字サイズ",
      fontSizeLarge: "読みやすい大文字サイズ",
      languageSelector: "言語選択",
      messages: "メッセージ",
      notifications: "お知らせ",
      viewProfile: "プロフィールを見る",
    },

    // Mobile Bottom Nav
    bottomNav: {
      home: "ホーム",
      discover: "見つける",
      create: "投稿する",
      messages: "チャット",
      profile: "マイページ",
    },

    // Hero Section
    hero: {
      badge: "世代をつなぐスキル＆知識交換",
      headingLine1: "過去の",
      headingWisdom: "知恵を、",
      headingPast: "知恵と経験を",
      headingWith: "現在の",
      headingEnergy: "エネルギーと繋ぐ。",
      subtitle:
        "ツナグ・ジェネレーションズは、シニア世代と若者世代が互いに知恵を伝え、日常の困りごとを助け合い、温かい交流を育むコミュニティです。",
      exploreBtn: "投稿を探索する",
      joinBtn: "コミュニティに参加する",
      nowPlaying: "再生中:",
      slides: [
        {
          tag: "世代のつながり",
          title: "世代を超えて、共に支え合うまちへ",
        },
        {
          tag: "知識の継承",
          title: "伝統の知恵と現代のスキルを交換",
        },
        {
          tag: "日常の支援",
          title: "日常の助け合いと安心の見守り",
        },
        {
          tag: "心の交流",
          title: "心温まる会話と友情の輪を育む",
        },
      ],
    },

    // About Our Platform Section
    about: {
      badge: "私たちの基本理念",
      title: "誰もが教え、誰もが学べる場所",
      subtitle:
        "ツナグ・ジェネレーションズは、お互いに教え合い支え合う双方向の交流を大切にしています。一方的な支援ではなく、すべての世代が主役となって知恵と優しさを分かち合います。",
      cards: [
        {
          title: "知識とスキルの共有",
          desc: "伝統的な郷土料理や手芸、書道、庭木の手入れなどの豊かな知恵を伝え、若い世代からは最新のスマホ操作やデジタル知識を教え合います。",
          tag: "双方向の学び合い",
        },
        {
          title: "日常の助け合い",
          desc: "スマートフォンの設定やビデオ通話、買い物代行、簡単な力仕事など、日常のちょっとした困りごとをご近所で思いやりを持って助け合います。",
          tag: "暮らしのサポート",
        },
        {
          title: "心温まる交流",
          desc: "お茶を飲みながらの会話、公園でのお散歩、共通の趣味を通じて、世代を超えたかけがえのない友人関係を築き、孤独感のない温かい地域を作ります。",
          tag: "人とのつながり",
        },
      ],
    },

    // How Tsunagu Works Section
    howItWorks: {
      title: "ツナグの使い方",
      subtitle: "誰でも安心して利用できる、シンプルで安全な4つのステップ。",
      steps: [
        {
          num: "01",
          title: "投稿を作成",
          desc: "自分が教えてあげられるスキルや、手伝ってほしい日常の用事を気軽に投稿します。",
          badge: "簡単クイック作成",
        },
        {
          num: "02",
          title: "見つけて応募",
          desc: "近所の募集一覧を見て、気になる投稿に丁寧なメッセージを添えてリクエストを送ります。",
          badge: "分野・地域で探す",
        },
        {
          num: "03",
          title: "連絡・日程調整",
          desc: "サイト内の安全なプライベートメッセージで、日時や待ち合わせ場所を相談して決めます。",
          badge: "安心のサイト内チャット",
        },
        {
          num: "04",
          title: "交流・レビュー",
          desc: "実際に会って楽しく交流し、完了後に感謝の気持ちを込めて温かいレビューを残します。",
          badge: "信頼の輪を広げる",
        },
      ],
    },

    // Exchange Categories Section (6 categories)
    categories: {
      title: "交流カテゴリー",
      subtitle: "地域コミュニティで交換・支援できる多様なカテゴリーをご覧ください。",
      items: [
        {
          title: "日常生活のお手伝い",
          desc: "買い出し代行、ちょっとしたお使い、重い荷物の持ち運びなど、日々の暮らしに寄り添うご近所サポート。",
          tags: ["買い物代行", "日常の用事", "ご近所サポート"],
        },
        {
          title: "デジタル・スマホ支援",
          desc: "スマートフォンの基本操作、家族とのビデオ通話設定、メールやアプリの使い方を優しく丁寧にサポート。",
          tags: ["スマホ操作", "ビデオ通話", "アプリ活用"],
        },
        {
          title: "お話し・お散歩交流",
          desc: "お茶を飲みながらの楽しい会話、近所の散歩、思い出話や共通の趣味を共有する心温まる時間。",
          tags: ["お茶・対話", "お散歩", "趣味の共有"],
        },
        {
          title: "伝統・スキル継承",
          desc: "伝統的な家庭料理、書道、折り紙、語学学習、地域の歴史や工芸技術の伝承と学び合い。",
          tags: ["家庭料理", "手芸・工芸", "語学学習"],
        },
        {
          title: "住まい・庭のお手伝い",
          desc: "ベランダ菜園のコツ、旅行中の植物への水やり、本の整理や季節の片付けのお手伝い。",
          tags: ["ガーデニング", "植物の世話", "お部屋の片付け"],
        },
        {
          title: "地域・コミュニティ活動",
          desc: "地域の行事、文化イベント、共同花壇づくり、サークル活動に参加して交流を深め、仲間とつながります。",
          tags: ["地域イベント", "文化活動", "交流サークル"],
        },
      ],
    },

    // Final Call to Action
    cta: {
      title: "誰もが分かち合えるものを持ち、誰もが得るものがある。",
      subtitle:
        "ツナグ・ジェネレーションズで、新しい交流を始めませんか。知識を伝えたい方も、誰かの助けを必要としている方も、温かいご近所の輪が待っています。",
      getStarted: "今すぐ始める",
    },

    // Footer
    footer: {
      explorePlatform: "プラットフォーム",
      aboutUs: "私たちについて",
      howItWorks: "使い方ガイド",
      communityPosts: "コミュニティ投稿",
      createPost: "新規投稿作成",
      safetySupport: "安心とサポート",
      safety: "安全ガイドライン",
      support: "サポート窓口",
      contact: "お問い合わせ",
      search: "検索",
      language: "言語設定:",
      copyright: "© 2026 Tsunagu Generations. All rights reserved.",
      tagline: "過去の知恵と現在のエネルギーを繋ぐ",
    },

    // Posts Directory Page
    postsPage: {
      title: "コミュニティ投稿一覧",
      subtitle: "近所のスキル提供、日常のお手伝いのお願い、心温まる交流の募集を検索できます",
      quickPost: "クイック投稿",
      standardPost: "通常投稿",
      guestBannerTitle: "ゲストとして閲覧中",
      guestBannerDesc:
        "すべての募集を自由にご覧いただけます。投稿者へメッセージを送るには、ログインまたは新規登録してください。",
      searchPlaceholder: "キーワード、スキル、地域名で検索...",
      typeLabel: "投稿タイプ",
      allTypes: "すべて",
      offers: "提供",
      requests: "お願い",
      categoryLabel: "カテゴリー",
      allCategories: "すべてのカテゴリー",
      exchangeLabel: "交換方法",
      allExchanges: "すべての交換タイプ",
      showingCount: "{count}件の投稿を表示中",
      noPostsTitle: "条件に一致する投稿が見つかりませんでした。",
      noPostsDesc: "検索条件を変更するか、新しい投稿が追加されるのを待ちましょう。",
      resetFilters: "フィルターをリセット",
    },
  },
};
