/**
 * Stored FAQ for the Tsunagu Guide.
 *
 * Questions that match one of these entries are answered instantly in the
 * browser — no AI call, no cost, no waiting. Each entry lists several ways
 * people might phrase the question (in English and Japanese) so typed and
 * spoken questions can be matched.
 *
 * Keep answers short, warm and free of markdown: they may be read aloud.
 */

export type FaqLang = "en" | "ja";

export interface FaqEntry {
  id: string;
  topic: FaqTopic;
  question: Record<FaqLang, string>;
  /** Alternative phrasings used for matching (lower-case not required). */
  patterns: Record<FaqLang, string[]>;
  answer: Record<FaqLang, string>;
  /** Optional page button shown with the answer. */
  link?: { href: string; label: Record<FaqLang, string> };
  /** Related FAQ ids offered as follow-up chips. */
  related?: string[];
}

export type FaqTopic =
  | "about"
  | "account"
  | "profile"
  | "posts"
  | "requests"
  | "chat"
  | "reviews"
  | "payments"
  | "safety"
  | "help";

export const FAQ_TOPICS: Record<FaqTopic, Record<FaqLang, string>> = {
  about: { en: "About Tsunagu", ja: "つなぐについて" },
  account: { en: "Account & login", ja: "アカウント・ログイン" },
  profile: { en: "Your profile", ja: "プロフィール" },
  posts: { en: "Posts", ja: "投稿" },
  requests: { en: "Requests", ja: "依頼・応募" },
  chat: { en: "Chat & notifications", ja: "チャット・通知" },
  reviews: { en: "Completing & reviews", ja: "完了・レビュー" },
  payments: { en: "Payments", ja: "支払い" },
  safety: { en: "Safety & privacy", ja: "安全・プライバシー" },
  help: { en: "Using the website", ja: "サイトの使い方" },
};

export const FAQS: FaqEntry[] = [
  /* ------------------------------------------------------------------ */
  /* About                                                              */
  /* ------------------------------------------------------------------ */
  {
    id: "what-is",
    topic: "about",
    question: { en: "What is Tsunagu Generations?", ja: "つなぐジェネレーションズとは？" },
    patterns: {
      en: ["what is tsunagu", "what is this website", "what is this site", "what is this app", "tell me about tsunagu", "what do you do", "about this website", "what is tsunagu generations"],
      ja: ["つなぐとは", "このサイトは何", "このサイトについて", "つなぐジェネレーションズとは", "何のサイト", "どんなサイト"],
    },
    answer: {
      en: "Tsunagu Generations is a free community website in Nagasaki that connects older and younger neighbours. People share knowledge, help each other with everyday tasks, learn new skills, and enjoy each other's company. Everyone can both help and ask for help.",
      ja: "つなぐジェネレーションズは、長崎のシニア世代と若い世代をつなぐ無料の地域コミュニティサイトです。知識を分かち合ったり、日常の困りごとを助け合ったり、新しいことを学んだり、一緒の時間を楽しんだりできます。誰でも「助ける側」にも「助けてもらう側」にもなれます。",
    },
    link: { href: "/about", label: { en: "About us", ja: "私たちについて" } },
    related: ["how-it-works", "services", "is-free"],
  },
  {
    id: "how-it-works",
    topic: "about",
    question: { en: "How does this website work?", ja: "このサイトの使い方は？" },
    patterns: {
      en: ["how does this website work", "how does it work", "how do i use this website", "how to use this site", "how does tsunagu work", "explain how it works", "what are the steps", "how do i get started", "getting started"],
      ja: ["使い方", "このサイトの使い方を教えて", "どうやって使う", "仕組み", "始め方", "流れを教えて"],
    },
    answer: {
      en: "It works in six simple steps. 1. Create a free account and set up your profile. 2. Post what you need, or browse posts from neighbours. 3. Press **Respond** to send a friendly request. 4. The post owner accepts, and a private chat opens. 5. Agree on a time and a public place, then meet. 6. Both press **Mark Completed** and leave a short review.",
      ja: "6つの簡単なステップです。1. 無料アカウントを作り、プロフィールを設定します。2. 困りごとを投稿するか、ご近所さんの投稿を見ます。3.「応募する」を押して依頼を送ります。4. 投稿者が承認すると、個別チャットが使えます。5. 日時と公共の場所を決めて会います。6. お互いに「完了」を押して、レビューを残します。",
    },
    link: { href: "/register", label: { en: "Create an account", ja: "アカウントを作る" } },
    related: ["register", "create-post", "safety-meeting"],
  },
  {
    id: "services",
    topic: "about",
    question: { en: "What kinds of help can I find here?", ja: "どんなサービスがありますか？" },
    patterns: {
      en: ["what services", "what kind of help", "what can i get help with", "what categories", "what services do you provide", "what services are available", "what can people help with", "types of help"],
      ja: ["どんなサービス", "どんな手伝い", "カテゴリー", "何を頼める", "サービスの種類", "どんなことを頼める"],
    },
    answer: {
      en: "Neighbours help each other with cooking, technology such as smartphones and video calls, arts and crafts, gardening, daily assistance like shopping and errands, companionship such as tea and walks, and local community activities.",
      ja: "料理、スマホやビデオ通話などのテクノロジー、手芸・工作、庭仕事、買い物や用事などの日常のお手伝い、お茶や散歩などの話し相手、地域の活動など、さまざまなことで助け合っています。",
    },
    link: { href: "/posts", label: { en: "Browse posts", ja: "投稿を見る" } },
    related: ["how-it-works", "exchange-types", "find-help"],
  },
  {
    id: "is-free",
    topic: "about",
    question: { en: "Is it free to use?", ja: "利用は無料ですか？" },
    patterns: {
      en: ["is it free", "is this free", "does it cost", "how much does it cost", "do i have to pay", "is there a fee", "membership fee", "free to join"],
      ja: ["無料", "お金はかかる", "料金", "費用", "有料", "会費"],
    },
    answer: {
      en: "Yes. Joining and using Tsunagu Generations is completely free. Many exchanges are free or a skill swap. Some posts show a paid amount, but payments on this site are only demonstrations, and no real money is ever taken.",
      ja: "はい、登録も利用も完全に無料です。多くのやり取りは無料か、スキルの交換です。金額が表示される投稿もありますが、このサイトの支払いはデモだけで、実際のお金は一切動きません。",
    },
    related: ["exchange-types", "demo-payment"],
  },
  {
    id: "who-can-join",
    topic: "about",
    question: { en: "Who can join?", ja: "誰が参加できますか？" },
    patterns: {
      en: ["who can join", "who can use", "can anyone join", "age limit", "how old do i need to be", "is it only for seniors", "is it only for old people", "can young people join", "minimum age"],
      ja: ["誰が参加", "誰でも使える", "年齢制限", "何歳から", "高齢者だけ", "若い人も"],
    },
    answer: {
      en: "Anyone aged 13 or older can join. Members aged 60 and over are shown as Older Generation, and members under 60 as Younger Generation. This is set automatically from your age, and it never limits what you can do.",
      ja: "13歳以上なら誰でも参加できます。60歳以上の方は「シニア世代」、60歳未満の方は「若い世代」と表示されます。年齢から自動で決まり、できることに制限はありません。",
    },
    related: ["og-yg", "register"],
  },
  {
    id: "og-yg",
    topic: "about",
    question: { en: "What do O.G. and Y.G. mean?", ja: "O.G.とY.G.とは？" },
    patterns: {
      en: ["what is og", "what is yg", "what does og mean", "what does yg mean", "older generation", "younger generation", "og and yg", "generation group"],
      ja: ["ogとは", "ygとは", "シニア世代", "若い世代", "世代グループ"],
    },
    answer: {
      en: "O.G. means Older Generation, for members aged 60 and over. Y.G. means Younger Generation, for members under 60. It helps neighbours get to know each other. Everyone can offer help and ask for help, whatever their group.",
      ja: "O.G.は60歳以上の「シニア世代」、Y.G.は60歳未満の「若い世代」です。お互いを知る手がかりになります。どちらの世代でも、助けることも助けてもらうこともできます。",
    },
    related: ["who-can-join"],
  },
  {
    id: "where",
    topic: "about",
    question: { en: "Which areas does it cover?", ja: "どの地域で使えますか？" },
    patterns: {
      en: ["which areas", "where is it available", "which neighbourhoods", "which neighborhoods", "what area", "only nagasaki", "is it in my area", "location covered"],
      ja: ["どの地域", "どこで使える", "長崎だけ", "対応地域", "エリア"],
    },
    answer: {
      en: "Tsunagu Generations is for neighbourhoods in Nagasaki, such as Hamamachi, Urakami and Meganebashi. You can choose up to five neighbourhoods in your profile so people nearby can find you.",
      ja: "長崎の浜町、浦上、眼鏡橋などの地域が対象です。プロフィールで最大5つの地域を選ぶと、近くの方に見つけてもらいやすくなります。",
    },
    related: ["edit-profile"],
  },

  /* ------------------------------------------------------------------ */
  /* Account                                                            */
  /* ------------------------------------------------------------------ */
  {
    id: "register",
    topic: "account",
    question: { en: "How do I create an account?", ja: "アカウントの作り方は？" },
    patterns: {
      en: ["how do i create an account", "how do i sign up", "how to register", "sign up", "make an account", "join the website", "create account", "how do i join", "register"],
      ja: ["アカウント作成", "登録方法", "新規登録", "サインアップ", "会員登録", "どうやって登録"],
    },
    answer: {
      en: "Press **Register** at the top of the page. Enter your name, email, a password and your age, or simply use **Continue with Google**. Then a short setup page asks for your neighbourhood and what you can share or need. It takes about two minutes.",
      ja: "画面上の「新規登録」を押し、お名前、メール、パスワード、年齢を入力します。Googleで続けることもできます。その後、地域やできること・困りごとを聞く簡単な設定があります。2分ほどで終わります。",
    },
    link: { href: "/register", label: { en: "Register now", ja: "登録する" } },
    related: ["login", "edit-profile"],
  },
  {
    id: "login",
    topic: "account",
    question: { en: "How do I log in?", ja: "ログイン方法は？" },
    patterns: {
      en: ["how do i log in", "how do i login", "how to sign in", "log in", "sign in", "cannot log in", "can't log in", "login problem"],
      ja: ["ログイン", "サインイン", "ログインできない", "ログイン方法"],
    },
    answer: {
      en: "Press **Log in** at the top of the page and enter your email and password, or press **Continue with Google** if you signed up with Google. If you forgot your password, use the **Forgot password** link on the login page.",
      ja: "画面上の「ログイン」を押して、メールとパスワードを入力します。Googleで登録した方は「Googleで続ける」を押してください。パスワードを忘れた場合は、ログイン画面の「パスワードをお忘れですか？」を使ってください。",
    },
    link: { href: "/login", label: { en: "Log in", ja: "ログイン" } },
    related: ["forgot-password", "register"],
  },
  {
    id: "forgot-password",
    topic: "account",
    question: { en: "I forgot my password. What should I do?", ja: "パスワードを忘れました" },
    patterns: {
      en: ["forgot my password", "forgot password", "reset password", "reset my password", "lost my password", "can't remember my password", "password reset"],
      ja: ["パスワードを忘れ", "パスワードリセット", "パスワード再設定", "パスワードがわからない"],
    },
    answer: {
      en: "On the login page, press **Forgot password** and enter your email. We will send you a reset link. Open it on the same device, choose a new password, and you are done. The link works for one hour.",
      ja: "ログイン画面で「パスワードをお忘れですか？」を押し、メールアドレスを入力してください。再設定用のリンクをお送りします。同じ端末でリンクを開き、新しいパスワードを決めれば完了です。リンクの有効期限は1時間です。",
    },
    link: { href: "/forgot-password", label: { en: "Reset password", ja: "パスワード再設定" } },
    related: ["change-password", "login"],
  },
  {
    id: "change-password",
    topic: "account",
    question: { en: "How do I change my password?", ja: "パスワードの変更方法は？" },
    patterns: {
      en: ["change my password", "change password", "update my password", "new password", "set a password"],
      ja: ["パスワード変更", "パスワードを変えたい", "パスワードの変更"],
    },
    answer: {
      en: "Open your profile and press **Change Password**. Enter your current password, then your new one twice. A new password needs at least 8 characters, with letters and numbers. If you signed up with Google, you can set a password there too.",
      ja: "プロフィールを開き「パスワードを変更」を押します。今のパスワードと、新しいパスワードを2回入力してください。新しいパスワードは8文字以上で、英字と数字を含めてください。Googleで登録した方も、ここでパスワードを設定できます。",
    },
    link: { href: "/change-password", label: { en: "Change password", ja: "パスワード変更" } },
    related: ["forgot-password"],
  },
  {
    id: "logout",
    topic: "account",
    question: { en: "How do I log out?", ja: "ログアウト方法は？" },
    patterns: {
      en: ["how do i log out", "log out", "logout", "sign out", "how to sign out"],
      ja: ["ログアウト", "サインアウト"],
    },
    answer: {
      en: "On a computer, press the exit icon next to your picture at the top right. On a phone, press the menu button with three lines at the top, then press **Sign out**.",
      ja: "パソコンでは、右上の自分の写真の横にある退出アイコンを押します。スマホでは、上の三本線のメニューを開いて「ログアウト」を押してください。",
    },
  },
  {
    id: "delete-account",
    topic: "account",
    question: { en: "Can I delete my account?", ja: "アカウントを削除できますか？" },
    patterns: {
      en: ["delete my account", "delete account", "close my account", "remove my account", "deactivate account", "leave the website"],
      ja: ["アカウント削除", "退会", "アカウントを消したい"],
    },
    answer: {
      en: "Deleting an account from the website is not available yet. Please contact our community coordinators through the Support section on the About page, and they will help you.",
      ja: "サイト上でのアカウント削除はまだできません。「私たちについて」ページのサポート欄からコーディネーターにご連絡いただければ、お手伝いします。",
    },
    link: { href: "/about#support", label: { en: "Contact support", ja: "サポートに連絡" } },
  },

  /* ------------------------------------------------------------------ */
  /* Profile                                                            */
  /* ------------------------------------------------------------------ */
  {
    id: "edit-profile",
    topic: "profile",
    question: { en: "How do I edit my profile?", ja: "プロフィールの編集方法は？" },
    patterns: {
      en: ["edit my profile", "edit profile", "change my profile", "update my profile", "change my name", "change my bio", "change my neighbourhood", "change my neighborhood", "update profile"],
      ja: ["プロフィール編集", "プロフィールを変えたい", "名前を変えたい", "自己紹介を変えたい", "地域を変えたい"],
    },
    answer: {
      en: "Open your profile and press **Edit Profile**. You can change your name, age, short biography, neighbourhoods, contact method, availability, interests, skills and the help you need. Press **Save Profile** when you are done.",
      ja: "プロフィールを開いて「プロフィール編集」を押します。名前、年齢、自己紹介、地域、連絡方法、都合の良い時間、趣味、できること、困りごとを変更できます。最後に「保存」を押してください。",
    },
    link: { href: "/profile/edit", label: { en: "Edit profile", ja: "プロフィール編集" } },
    related: ["profile-photo", "skills-needs"],
  },
  {
    id: "profile-photo",
    topic: "profile",
    question: { en: "How do I add a profile picture?", ja: "プロフィール写真の追加方法は？" },
    patterns: {
      en: ["profile picture", "profile photo", "add a photo", "change my photo", "upload a picture", "add picture", "avatar"],
      ja: ["プロフィール写真", "写真を追加", "写真を変えたい", "アイコン"],
    },
    answer: {
      en: "Go to **Edit Profile** and press **Upload** next to your picture. Choose a photo up to 5 MB. It is resized automatically. Press **Save Profile** to keep it.",
      ja: "「プロフィール編集」で、写真の横の「アップロード」を押し、5MBまでの写真を選んでください。自動でサイズ調整されます。最後に「保存」を押してください。",
    },
    link: { href: "/profile/edit", label: { en: "Edit profile", ja: "プロフィール編集" } },
  },
  {
    id: "skills-needs",
    topic: "profile",
    question: { en: "How do I add my skills and the help I need?", ja: "できることや困りごとの追加方法は？" },
    patterns: {
      en: ["add my skills", "add skills", "services i need", "add what i need", "skills and needs", "list my skills", "add interests", "my interests"],
      ja: ["スキルを追加", "できることを追加", "困りごとを追加", "趣味を追加", "スキル"],
    },
    answer: {
      en: "In **Edit Profile**, type a skill such as Origami or a need such as Grocery Errands, or tap one of the suggestions. You can add up to 10 skills, 10 needs and 12 interests. This helps the right neighbours find you in Search.",
      ja: "「プロフィール編集」で、「折り紙」などのできることや「買い物のお手伝い」などの困りごとを入力するか、候補をタップします。できること・困りごとは最大10個、趣味は12個まで登録できます。検索で見つけてもらいやすくなります。",
    },
    link: { href: "/profile/edit", label: { en: "Edit profile", ja: "プロフィール編集" } },
    related: ["offer-skill"],
  },

  /* ------------------------------------------------------------------ */
  /* Posts                                                              */
  /* ------------------------------------------------------------------ */
  {
    id: "create-post",
    topic: "posts",
    question: { en: "How do I create a post?", ja: "投稿の作り方は？" },
    patterns: {
      en: ["how do i create a post", "how do i make a post", "how to post", "create a post", "make a post", "how do i ask for help", "post a request", "new post", "how to write a post"],
      ja: ["投稿の作り方", "投稿したい", "投稿方法", "依頼を出したい", "どうやって投稿"],
    },
    answer: {
      en: "The easiest way is the **Quick Post** wizard. 1. Choose a category. 2. Pick a ready-made template. 3. Check the details. 4. Press **Publish**. There is almost no typing. You can also use **Standard Post** to write everything yourself, or ask me to write a draft for you.",
      ja: "一番簡単なのは「かんたん投稿」です。1. カテゴリーを選ぶ。2. 用意されたテンプレートを選ぶ。3. 内容を確認する。4.「公開」を押す。ほとんど文字を打つ必要はありません。「通常の投稿」で自分で書くことも、私に下書きを頼むこともできます。",
    },
    link: { href: "/quick-post", label: { en: "Open Quick Post", ja: "かんたん投稿" } },
    related: ["quick-post", "edit-post"],
  },
  {
    id: "quick-post",
    topic: "posts",
    question: { en: "What is Quick Post?", ja: "かんたん投稿とは？" },
    patterns: {
      en: ["what is quick post", "quick post wizard", "quick post", "easy post", "templates", "post templates"],
      ja: ["かんたん投稿", "クイック投稿", "テンプレート"],
    },
    answer: {
      en: "**Quick Post** is a simple four-step way to post, made for older members. You pick a category and a ready-made template, and the post is written for you. You only check the details and press **Publish**.",
      ja: "かんたん投稿は、シニアの方向けの4ステップの簡単な投稿方法です。カテゴリーとテンプレートを選ぶと、投稿文が自動で作られます。内容を確認して「公開」を押すだけです。",
    },
    link: { href: "/quick-post", label: { en: "Open Quick Post", ja: "かんたん投稿" } },
    related: ["create-post"],
  },
  {
    id: "edit-post",
    topic: "posts",
    question: { en: "How do I edit, close or delete my post?", ja: "投稿の編集・終了・削除は？" },
    patterns: {
      en: ["edit my post", "change my post", "delete my post", "remove my post", "close my post", "cancel my post", "update my post", "edit post", "delete post"],
      ja: ["投稿を編集", "投稿を削除", "投稿を消したい", "投稿を終了", "投稿を変更"],
    },
    answer: {
      en: "Open your post. At the bottom you will see Edit, Close and Delete. Close stops new responses and declines pending ones. Delete removes the post completely. Only you can change your own posts.",
      ja: "自分の投稿を開くと、下に「編集」「終了」「削除」があります。「終了」は新しい応募を止め、保留中の応募をお断りします。「削除」は投稿を完全に消します。投稿を変更できるのは投稿者本人だけです。",
    },
    link: { href: "/my-activity", label: { en: "My posts", ja: "自分の投稿" } },
  },
  {
    id: "offer-skill",
    topic: "posts",
    question: { en: "Can I offer my skills to help others?", ja: "自分のスキルで人を助けられますか？" },
    patterns: {
      en: ["offer my skills", "offer help", "i want to help", "volunteer", "how can i help others", "share my skills", "teach something", "i want to teach"],
      ja: ["スキルを提供", "手伝いたい", "ボランティア", "人を助けたい", "教えたい", "役に立ちたい"],
    },
    answer: {
      en: "Yes, and thank you! Add your skills to your profile so neighbours can find you in Search under People. You can also browse posts and press **Respond** on any request you can help with.",
      ja: "はい、ありがとうございます！プロフィールにできることを登録すると、検索の「人」から見つけてもらえます。投稿を見て、お手伝いできる依頼に「応募する」を押すこともできます。",
    },
    link: { href: "/posts", label: { en: "Browse requests", ja: "依頼を見る" } },
    related: ["skills-needs", "respond"],
  },
  {
    id: "find-help",
    topic: "posts",
    question: { en: "How do I find someone to help me?", ja: "助けてくれる人の探し方は？" },
    patterns: {
      en: ["how do i search", "how to search", "how do i find posts", "how to find help", "search for people", "use search", "search posts"],
      ja: ["検索方法", "探し方", "投稿を探す", "人を探す方法"],
    },
    answer: {
      en: "Open Search and type what you need, such as smartphone or gardening. You can filter by category, area, availability and generation. If no post matches, we show neighbours whose skills match, and you can send them a request directly. You can also just tell me what you need.",
      ja: "「検索」を開き、「スマホ」「庭仕事」など必要なことを入力します。カテゴリー、地域、時間帯、世代で絞り込めます。合う投稿がない場合は、スキルが合うご近所さんを表示するので、直接依頼を送れます。私に困りごとを話していただいても大丈夫です。",
    },
    link: { href: "/search", label: { en: "Open Search", ja: "検索を開く" } },
  },

  /* ------------------------------------------------------------------ */
  /* Requests                                                           */
  /* ------------------------------------------------------------------ */
  {
    id: "respond",
    topic: "requests",
    question: { en: "How do I respond to a post?", ja: "投稿への応募方法は？" },
    patterns: {
      en: ["how do i respond", "respond to a post", "reply to a post", "how to respond", "send a request", "answer a post", "apply to a post", "contact the poster"],
      ja: ["応募方法", "投稿に応募", "返信したい", "依頼を送る", "連絡したい"],
    },
    answer: {
      en: "Open the post or find it in the list and press **Respond**. Write a short friendly note about yourself and when you are free, then press Send. The post owner will be notified and can accept or decline.",
      ja: "投稿を開くか一覧で見つけて「応募する」を押します。自己紹介や都合の良い時間を短く書いて「送信」してください。投稿者に通知が届き、承認またはお断りが決まります。",
    },
    related: ["request-status", "cancel-request"],
  },
  {
    id: "accept-request",
    topic: "requests",
    question: { en: "How do I accept or decline a request?", ja: "依頼の承認・お断りの方法は？" },
    patterns: {
      en: ["accept a request", "decline a request", "reject a request", "someone responded", "someone responded to my post", "approve request", "accept or decline"],
      ja: ["依頼を承認", "依頼を断る", "応募が来た", "承認方法"],
    },
    answer: {
      en: "Open **My Activity** and choose **My Requests**, then **Manage in Requests Inbox**. Under **Incoming** you will see who responded and their message. Press **Accept** to start a private chat, or **Decline** if it is not a good match. You can check their profile and reviews first.",
      ja: "「マイ活動」の「自分の依頼」から依頼一覧を開きます。「受け取った依頼」に応募者とメッセージが表示されます。「承認」を押すと個別チャットが始まり、合わない場合は「お断り」を押します。先にプロフィールやレビューを確認できます。",
    },
    link: { href: "/requests", label: { en: "Open Requests", ja: "依頼を開く" } },
    related: ["chat-unlock"],
  },
  {
    id: "request-status",
    topic: "requests",
    question: { en: "What do the request statuses mean?", ja: "依頼のステータスの意味は？" },
    patterns: {
      en: ["request status", "what does pending mean", "what does accepted mean", "status meaning", "pending", "my request is pending", "did they accept"],
      ja: ["ステータス", "保留中とは", "承認済み", "依頼の状況"],
    },
    answer: {
      en: "Pending means the owner has not answered yet. Accepted means chat is open. Declined means it was not a match this time. Cancelled means it was withdrawn. Completed means the exchange is finished and reviews are open.",
      ja: "「保留中」は投稿者がまだ返事をしていない状態、「承認」はチャットが使える状態、「お断り」は今回は合わなかったという意味です。「取り消し」は依頼が取り下げられた状態、「完了」はやり取りが終わりレビューができる状態です。",
    },
    link: { href: "/requests", label: { en: "My requests", ja: "自分の依頼" } },
  },
  {
    id: "cancel-request",
    topic: "requests",
    question: { en: "How do I cancel a request I sent?", ja: "送った依頼の取り消し方法は？" },
    patterns: {
      en: ["cancel my request", "cancel request", "withdraw my request", "undo my request", "take back my request"],
      ja: ["依頼を取り消し", "応募を取り消し", "キャンセルしたい"],
    },
    answer: {
      en: "Open the Requests page from **My Activity** and choose **Sent by Me**. While a request is still pending, press **Cancel Request**.",
      ja: "「マイ活動」から依頼一覧を開き、「送った依頼」を選びます。保留中の依頼なら「依頼を取り消す」を押してください。",
    },
    link: { href: "/requests", label: { en: "Open Requests", ja: "依頼を開く" } },
  },
  {
    id: "own-post",
    topic: "requests",
    question: { en: "Why can't I respond to my own post?", ja: "自分の投稿に応募できないのはなぜ？" },
    patterns: {
      en: ["respond to my own post", "can't respond", "no respond button", "respond button missing"],
      ja: ["自分の投稿に応募", "応募ボタンがない"],
    },
    answer: {
      en: "You cannot respond to your own post. Instead, neighbours respond to you, and you can accept or decline their requests from **My Activity**.",
      ja: "自分の投稿には応募できません。ご近所さんからの応募を「マイ活動」から承認またはお断りしてください。",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Chat & notifications                                               */
  /* ------------------------------------------------------------------ */
  {
    id: "chat-unlock",
    topic: "chat",
    question: { en: "When can I chat with someone?", ja: "いつチャットできますか？" },
    patterns: {
      en: ["when can i chat", "how do i chat", "how to message", "send a message", "can't send message", "chat not working", "private chat", "how do i talk to them", "message someone"],
      ja: ["チャット", "メッセージを送りたい", "いつ話せる", "メッセージ方法"],
    },
    answer: {
      en: "To protect everyone's privacy, chat opens only after a request is accepted. Then open **Messages** from the top bar or the bottom menu. You can type, use one-tap quick replies, and press **Listen** to hear messages read aloud.",
      ja: "皆さんのプライバシーを守るため、チャットは依頼が承認された後に使えます。上のバーか下のメニューから「メッセージ」を開いてください。入力のほか、ワンタップの簡単返信や、「聞く」でメッセージの読み上げも使えます。",
    },
    link: { href: "/chat", label: { en: "Open Messages", ja: "メッセージを開く" } },
    related: ["notifications", "phone-number"],
  },
  {
    id: "notifications",
    topic: "chat",
    question: { en: "How do notifications work?", ja: "通知の仕組みは？" },
    patterns: {
      en: ["notifications", "how do notifications work", "bell icon", "turn off sound", "mute sound", "notification sound", "red number", "alerts"],
      ja: ["通知", "ベル", "通知音", "音を消したい", "赤い数字"],
    },
    answer: {
      en: "The bell shows new requests, accepted requests and reviews. The message icon shows new chat messages. A red number tells you how many are new, and you hear a short sound. You can turn the sound on or off on the **Notifications** page.",
      ja: "ベルは新しい依頼、承認、レビューなどを、メッセージアイコンは新しいチャットをお知らせします。赤い数字が新着の数で、短い音も鳴ります。音のオン・オフは「通知」ページで切り替えられます。",
    },
    link: { href: "/notifications", label: { en: "Notifications", ja: "通知を見る" } },
  },
  {
    id: "phone-number",
    topic: "chat",
    question: { en: "Will my phone number be shared?", ja: "電話番号は公開されますか？" },
    patterns: {
      en: ["phone number", "share my phone", "is my number public", "call someone", "contact by phone", "phone contact"],
      ja: ["電話番号", "電話で連絡", "番号は公開"],
    },
    answer: {
      en: "Only if you choose Phone as your contact method in your profile, and only with members whose request you have accepted. Your number is never shown to the public.",
      ja: "プロフィールで連絡方法を「電話」にした場合に限り、承認した相手にだけ表示されます。一般に公開されることはありません。",
    },
    link: { href: "/profile/edit", label: { en: "Contact settings", ja: "連絡方法の設定" } },
  },

  /* ------------------------------------------------------------------ */
  /* Completing & reviews                                               */
  /* ------------------------------------------------------------------ */
  {
    id: "complete",
    topic: "reviews",
    question: { en: "How do I mark an exchange as completed?", ja: "やり取りを完了にする方法は？" },
    patterns: {
      en: ["mark completed", "mark as completed", "finish the exchange", "how do i complete", "complete an activity", "we finished", "done with the exchange", "mark it as done", "mark as done", "it is done", "exchange is finished"],
      ja: ["完了にする", "完了方法", "終わった", "やり取りを終える"],
    },
    answer: {
      en: "After you meet, press **Mark Completed** in the chat or on **My Activity**. When both of you have pressed it, the exchange is finished and you can each leave a review.",
      ja: "会った後、チャットか「マイ活動」で「完了にする」を押してください。お二人とも押すと完了となり、それぞれレビューを書けます。",
    },
    link: { href: "/my-activity?tab=inprogress", label: { en: "In progress", ja: "進行中" } },
    related: ["review"],
  },
  {
    id: "review",
    topic: "reviews",
    question: { en: "How do I leave a review?", ja: "レビューの書き方は？" },
    patterns: {
      en: ["leave a review", "write a review", "rate someone", "give feedback", "star rating", "how do i rate", "feedback"],
      ja: ["レビュー", "評価", "星をつけたい", "感想を書く"],
    },
    answer: {
      en: "After an exchange is completed, open **My Activity**, choose Completed, and press **Rate and Review**. Choose one to five stars and add a short thank-you note if you like. You can review each exchange once.",
      ja: "完了したやり取りは「マイ活動」の「完了」から「評価・レビュー」を押します。星を1つから5つ選び、よければ短いお礼の言葉を添えてください。レビューは1回のやり取りにつき1回です。",
    },
    link: { href: "/my-activity?tab=completed", label: { en: "Completed activities", ja: "完了した活動" } },
  },

  /* ------------------------------------------------------------------ */
  /* Payments                                                           */
  /* ------------------------------------------------------------------ */
  {
    id: "exchange-types",
    topic: "payments",
    question: { en: "What are Free, Skill Exchange and Paid?", ja: "無料・スキル交換・有料の違いは？" },
    patterns: {
      en: ["skill exchange", "what is skill exchange", "free or paid", "exchange types", "exchange method", "what does free mean", "what does paid mean", "difference between free and paid"],
      ja: ["スキル交換", "無料と有料", "交換方法", "支払い方法の違い"],
    },
    answer: {
      en: "Free means help given kindly at no cost. Skill Exchange means you trade help, for example cooking lessons for smartphone help. Paid shows an agreed amount, but on this site it is only a demonstration and no real money moves.",
      ja: "「無料」は好意によるお手伝いです。「スキル交換」は、料理を教える代わりにスマホを教えてもらうなど、助け合いの交換です。「有料」は金額が表示されますが、このサイトではデモのみで、実際のお金は動きません。",
    },
    related: ["demo-payment"],
  },
  {
    id: "demo-payment",
    topic: "payments",
    question: { en: "Do I need to pay real money?", ja: "本当にお金を払う必要がありますか？" },
    patterns: {
      en: ["real money", "do i need to pay", "how do i pay", "demo payment", "credit card", "bank details", "payment", "is payment real"],
      ja: ["本当のお金", "支払い", "クレジットカード", "銀行", "デモ支払い", "お金を払う"],
    },
    answer: {
      en: "No. Payments on Tsunagu Generations are only demonstrations, clearly marked DEMO. You never enter a card or bank details, and no real money is taken. Never share bank details with anyone.",
      ja: "いいえ。つなぐジェネレーションズの支払いはすべてデモで、「デモ」と表示されています。カードや銀行の情報を入力することはなく、実際のお金は一切動きません。銀行情報は誰にも教えないでください。",
    },
    link: { href: "/transactions", label: { en: "Demo payments", ja: "デモ支払い" } },
  },

  /* ------------------------------------------------------------------ */
  /* Safety & privacy                                                   */
  /* ------------------------------------------------------------------ */
  {
    id: "safety-meeting",
    topic: "safety",
    question: { en: "Is it safe to meet people?", ja: "人と会うのは安全ですか？" },
    patterns: {
      en: ["is it safe", "safe to meet", "safety tips", "how to stay safe", "meeting in person", "first meeting", "where should we meet", "safety"],
      ja: ["安全", "会っても大丈夫", "安全のコツ", "どこで会う", "初めて会う"],
    },
    answer: {
      en: "For your first meeting, choose a bright public place like a community centre, library, cafe or park. Check the person's profile, reviews and completed exchanges first. Never share bank details or passwords, and trust your feelings. You can report or block anyone at any time.",
      ja: "初めて会うときは、公民館、図書館、カフェ、公園など明るい公共の場所を選びましょう。事前に相手のプロフィール、レビュー、完了したやり取りを確認してください。銀行情報やパスワードは教えず、不安を感じたら無理をしないでください。いつでも通報やブロックができます。",
    },
    link: { href: "/about#safety", label: { en: "Safety guidelines", ja: "安全ガイド" } },
    related: ["report", "block"],
  },
  {
    id: "report",
    topic: "safety",
    question: { en: "How do I report a post or a person?", ja: "投稿や人を通報する方法は？" },
    patterns: {
      en: ["report a post", "report someone", "report a user", "inappropriate", "scam", "report", "something wrong", "suspicious"],
      ja: ["通報", "不適切", "詐欺", "怪しい", "報告したい"],
    },
    answer: {
      en: "Press **Report** on the post, or on the person's profile. Choose a reason and press **Submit Report**. Reports are private, so the person will not know who reported them. Our team reviews every report.",
      ja: "投稿か相手のプロフィールで「通報」を押し、理由を選んで「送信」してください。通報は非公開で、誰が通報したかは相手に伝わりません。すべての通報を確認します。",
    },
    related: ["block", "safety-meeting"],
  },
  {
    id: "block",
    topic: "safety",
    question: { en: "How do I block someone?", ja: "ブロックする方法は？" },
    patterns: {
      en: ["block someone", "block a user", "how to block", "stop someone contacting me", "block"],
      ja: ["ブロック", "連絡を止めたい", "ブロック方法"],
    },
    answer: {
      en: "Open the person's profile and press **Block**. After that, you will no longer see their posts or messages.",
      ja: "相手のプロフィールを開いて「ブロック」を押してください。その後は相手の投稿やメッセージが表示されなくなります。",
    },
    related: ["report"],
  },
  {
    id: "privacy",
    topic: "safety",
    question: { en: "Who can see my information?", ja: "自分の情報は誰に見えますか？" },
    patterns: {
      en: ["who can see my", "privacy", "my information", "is my data safe", "personal information", "who can see my profile", "are my messages private", "messages private", "is it private", "can others read my messages"],
      ja: ["プライバシー", "個人情報", "誰に見える", "情報は安全"],
    },
    answer: {
      en: "Your public profile shows your name, picture, generation, neighbourhoods, bio, skills, interests and reviews. Private messages are seen only by you and your chat partner. Your phone number is shared only if you choose, and only with accepted partners.",
      ja: "公開プロフィールには名前、写真、世代、地域、自己紹介、できること、趣味、レビューが表示されます。メッセージは本人とチャット相手だけが見られます。電話番号は、ご自身が選んだ場合に承認した相手にだけ表示されます。",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Using the website                                                  */
  /* ------------------------------------------------------------------ */
  {
    id: "text-size",
    topic: "help",
    question: { en: "How do I make the text bigger?", ja: "文字を大きくする方法は？" },
    patterns: {
      en: ["bigger text", "make the text bigger", "larger text", "text size", "font size", "hard to read", "increase font", "zoom"],
      ja: ["文字を大きく", "文字サイズ", "見えにくい", "大きい文字", "字が小さい"],
    },
    answer: {
      en: "Press the **A+** button at the top of the page to make the text larger. Press A to go back to normal size. On a phone, the **A+** button is inside the menu with three lines.",
      ja: "画面上の「A+」ボタンを押すと文字が大きくなります。「A」で元の大きさに戻ります。スマホでは三本線のメニューの中にあります。",
    },
  },
  {
    id: "language",
    topic: "help",
    question: { en: "How do I switch to Japanese or English?", ja: "日本語と英語の切り替え方法は？" },
    patterns: {
      en: ["switch language", "change language", "japanese", "english", "language setting", "in japanese"],
      ja: ["言語", "英語に切り替え", "日本語に切り替え", "言語設定", "英語"],
    },
    answer: {
      en: "Press EN or JA at the top of the page, or use the language buttons at the bottom of any page. On a phone, they are inside the menu with three lines.",
      ja: "画面上の「EN」か「JA」を押すか、ページ下部の言語ボタンを使ってください。スマホでは三本線のメニューの中にあります。",
    },
  },
  {
    id: "voice",
    topic: "help",
    question: { en: "Can I talk to you instead of typing?", ja: "文字を打たずに話しかけられますか？" },
    patterns: {
      en: ["can i talk", "use my voice", "voice", "speak instead", "microphone", "read aloud", "can you read it to me", "talk instead of typing"],
      ja: ["話しかけ", "音声", "声で", "マイク", "読み上げ", "しゃべりたい"],
    },
    answer: {
      en: "Yes! Press the microphone button and simply speak. When you stop talking, I will answer and read my reply out loud. You can also press **Listen** under any answer, or turn on the speaker button at the top to hear every reply.",
      ja: "はい！マイクボタンを押して話しかけてください。話し終えると、私が答えて読み上げます。答えの下の「聞く」を押したり、上のスピーカーボタンをオンにすると、毎回読み上げます。",
    },
  },
  {
    id: "assistant",
    topic: "help",
    question: { en: "What can you help me with?", ja: "何を手伝ってくれますか？" },
    patterns: {
      en: ["what can you do", "what can you help with", "who are you", "how can you help", "what are you", "help me", "what can you do for me"],
      ja: ["何ができる", "あなたは誰", "何を手伝える", "助けて"],
    },
    answer: {
      en: "I am Tsunagu Guide. I can explain how the website works, answer common questions, find posts that match what you need, and write a post for you to review. Just tell me what you need in your own words.",
      ja: "私はつなぐガイドです。サイトの使い方の説明、よくある質問へのお答え、ぴったりの投稿探し、投稿の下書き作りをお手伝いします。困っていることを、ご自分の言葉で教えてください。",
    },
    related: ["how-it-works", "create-post", "voice"],
  },
  {
    id: "contact-support",
    topic: "help",
    question: { en: "How do I contact a real person for help?", ja: "人に直接相談するには？" },
    patterns: {
      en: ["contact support", "talk to a person", "real person", "customer service", "contact you", "support team", "help desk"],
      ja: ["サポートに連絡", "人と話したい", "問い合わせ", "相談窓口"],
    },
    answer: {
      en: "Our community coordinators are happy to help. Please see the Support section on the About page.",
      ja: "地域コーディネーターがお手伝いします。「私たちについて」ページのサポート欄をご覧ください。",
    },
    link: { href: "/about#support", label: { en: "Support", ja: "サポート" } },
  },
];

export const FAQ_BY_ID = new Map(FAQS.map((f) => [f.id, f]));
