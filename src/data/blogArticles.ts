/** Single source of truth for blog: list + detail. CTA target for habit-tracker links. */
export const HABIT_GARDEN_PATH = '/personal-growth?tab=habits';
/** Help center article for Habit Garden (used in blog and elsewhere). */
export const HABIT_GARDEN_KB_PATH = '/help-center/habit-garden';
/** In-app Zakah calculator (profile menu in Shaʿbān & Ramaḍān). */
export const ZAKAH_PAGE_PATH = '/zakah';

export interface BlogArticleDetail {
  title: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  image: string;
  summary: string;
  content: string;
}

export interface BlogArticleListItem {
  title: string;
  date: string;
  summary: string;
  slug: string;
}

const CTA_LINK_CLASS = 'inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors no-underline';

const BLOG_ARTICLE_ENTRIES: [string, BlogArticleDetail][] = [
  [
    'zakah-calculator-balanze',
    (() => {
      const path = ZAKAH_PAGE_PATH;
      return {
        title: 'Estimate Your Zakat with Balanze’s In-App Calculator',
        date: 'February 2025',
        author: 'Balanze Team',
        readTime: '5 min read',
        category: 'Zakah',
        image: '/zakah-calculator-banner.png',
        summary: 'Use the built-in Zakah calculator during Shaʿbān and Ramaḍān to estimate zakat from your accounts, gold, silver, and other assets—with nisab and 2.5% applied automatically.',
        content: `
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Zakat is due on wealth held for at least one lunar year above the nisab. Balanze’s in-app Zakah calculator uses your existing accounts and transaction history so you can see how much is zakatable and get an estimate of what you owe—all in one place.
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Where to Find It</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        The Zakah calculator is available from your <strong>profile menu</strong> (avatar in the top bar) under <strong>Donations</strong>. It is shown only during <strong>Shaʿbān</strong> and <strong>Ramaḍān</strong>, so you can plan and pay before Eid.
      </p>
      <figure class="my-8"><img src="/zakah-profile-menu.png" alt="Zakah option in profile menu under Donations" class="max-w-full h-auto rounded-2xl shadow-lg" /></figure>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">What It Uses</h2>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li><strong>From your accounts:</strong> Balanze uses your transaction history to compute the balance you held one Islamic year ago. Only the amount held for a full year counts toward zakatable wealth.</li>
        <li><strong>Add more:</strong> Enter the value of gold, silver, other zakatable assets, and any debts to subtract. Everything is converted to your chosen display currency.</li>
        <li><strong>Nisab:</strong> Choose gold or silver nisab. The calculator checks whether your total meets the threshold and applies 2.5% to the zakatable amount.</li>
      </ul>
      <figure class="my-8"><img src="/zakah-what-it-uses.png" alt="Zakah calculator: accounts, add more, and result" class="max-w-full h-auto rounded-2xl shadow-lg" /></figure>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Result at a Glance</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        The top section shows total from accounts (held 1+ year), your additions, minus debts, the nisab threshold, and the estimated zakat due. Use your profile and account currencies to keep everything consistent.
      </p>

      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        <a href="${path}" class="${CTA_LINK_CLASS}">Open Zakah calculator →</a>
      </p>
    `,
      };
    })(),
  ],
  [
    'ramadan-habits-with-balanze',
    {
      title: 'Ramadan with Balanze: Build Habits That Last',
      date: 'February 2025',
      author: 'Balanze Team',
      readTime: '10 min read',
      category: 'Habits',
      image: '/ramadan-habits-banner.png',
      summary: 'Use the Habit Garden to stay consistent with prayer, Quran, sadaqah, and more this Ramadan, and keep those habits after.',
      content: (() => {
        const path = HABIT_GARDEN_PATH;
        return `
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Ramadan is a month of intention and consistency: fasting, prayer, charity, and reflection. The challenge is keeping that momentum day after day, and carrying it beyond the month. Tracking your habits makes consistency visible and builds accountability. Here’s how to use Balanze’s Habit Garden to support your Ramadan and beyond.
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Why Track Ramadan Habits?</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        When you log a habit each day, you see streaks and progress. That visibility helps you show up even on busy or low-energy days. It also turns “I want to pray on time” or “I want to read Quran daily” into a clear, trackable commitment instead of a vague goal.
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Example Habits You Can Track</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
        You choose what matters to you. These are only examples, add or adapt to match your goals:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Pray Fajr on time</li>
        <li>Read one page (or one juz) of Quran</li>
        <li>Give sadaqah (any amount)</li>
        <li>10 minutes of dhikr</li>
        <li>Fast the full day</li>
        <li>Tarawih prayer</li>
        <li>Break fast with family (no phone)</li>
      </ul>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Start with one or two habits so you don’t overwhelm yourself. You can add more as the month goes on.
      </p>
      <figure class="my-8 w-full"><img src="/ramadan-habits-screenshot.png" alt="Habit Garden example" class="w-full rounded-2xl shadow-lg" /></figure>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        <a href="${path}" class="${CTA_LINK_CLASS}">Track these in Habit Garden →</a>
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">How the Habit Garden Helps</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        In Habit Garden you mark each habit done for the day. Streaks show how many days in a row you’ve kept it up, and the garden view makes progress feel tangible. Small, daily check-ins add up to a month, and then to lasting habits after Ramadan.
      </p>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        <a href="${HABIT_GARDEN_KB_PATH}" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Read more →</a>
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">After Ramadan</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        The habits you build in Ramadan don’t have to end on Eid. Use the same tracker to keep prayer, Quran, or sadaqah as part of your routine year-round. Consistency matters more than perfection.
      </p>

      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        <a href="${path}" class="${CTA_LINK_CLASS}">Open Habit Garden →</a>
      </p>
    `;
      })(),
    },
  ],
  [
    '5-simple-ways-to-save-money',
    {
      title: '5 Simple Ways to Save More Money Every Month',
      date: 'July 15, 2024',
      author: 'Balanze Team',
      readTime: '8 min read',
      category: 'Savings',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      summary: 'Discover practical tips to boost your savings and reach your financial goals faster with these easy-to-implement strategies.',
      content: `
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Saving money doesn't have to be complicated or overwhelming. In fact, the most effective strategies are often the simplest ones. Whether you're just starting your savings journey or looking to boost your existing savings, these five proven methods can help you build wealth month after month.
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">1. The 50/30/20 Rule: Your Financial Foundation</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        One of the most effective budgeting methods is the 50/30/20 rule. Here's how it works:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li><strong>50% for Needs:</strong> Essential expenses like housing, utilities, food, and transportation</li>
        <li><strong>30% for Wants:</strong> Discretionary spending like entertainment, dining out, and shopping</li>
        <li><strong>20% for Savings:</strong> Emergency fund, retirement, and financial goals</li>
      </ul>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Start by tracking your current spending for one month to see where your money goes. Then, gradually adjust your spending to match this ratio. Even if you can't achieve the perfect 50/30/20 split immediately, aiming for it will significantly improve your savings rate.
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">2. Automate Your Savings: Set It and Forget It</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        The easiest way to save money is to make it automatic. Set up automatic transfers from your checking account to your savings account on payday. This way, you never see the money in your main account, making it much easier to avoid spending it.
      </p>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Consider these automation strategies:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Direct deposit a portion of your paycheck into savings</li>
        <li>Set up recurring transfers on payday</li>
        <li>Use apps that round up purchases and save the difference</li>
        <li>Automate retirement contributions</li>
      </ul>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">3. Cut the Big Three: Housing, Transportation, and Food</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        These three categories typically consume 60-70% of most people's budgets. Small changes here can have massive impacts on your savings:
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Housing</h3>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-4 space-y-2">
        <li>Consider downsizing or getting a roommate</li>
        <li>Negotiate rent increases</li>
        <li>Look for energy-efficient homes to reduce utilities</li>
      </ul>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Transportation</h3>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-4 space-y-2">
        <li>Use public transportation when possible</li>
        <li>Carpool with colleagues</li>
        <li>Consider a more fuel-efficient vehicle</li>
        <li>Walk or bike for short trips</li>
      </ul>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Food</h3>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Meal prep to avoid expensive takeout</li>
        <li>Shop with a list and stick to it</li>
        <li>Buy generic brands when quality is similar</li>
        <li>Use grocery store loyalty programs</li>
      </ul>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">4. The No-Spend Challenge: Reset Your Spending Habits</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Try a no-spend challenge for a week, month, or even just a weekend. During this time, only spend money on absolute essentials like food, housing, and transportation. This challenge helps you:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Identify unnecessary spending habits</li>
        <li>Discover free or low-cost alternatives</li>
        <li>Build better financial discipline</li>
        <li>Save significantly in a short period</li>
      </ul>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Start with a weekend challenge, then gradually extend to longer periods. You'll be amazed at how much you can save and how creative you become with free activities.
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">5. The 24-Hour Rule: Curb Impulse Spending</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Before making any non-essential purchase over $50, wait 24 hours. This simple rule prevents impulse buying and gives you time to consider whether you really need the item.
      </p>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        During the 24-hour period, ask yourself:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Do I really need this, or do I just want it?</li>
        <li>Can I afford this without affecting my savings goals?</li>
        <li>Will I still want this tomorrow?</li>
        <li>Is there a cheaper alternative?</li>
      </ul>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        You'll be surprised how often you decide not to buy something after sleeping on it.
      </p>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Putting It All Together</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        The key to successful saving is consistency. Start with one or two of these strategies and gradually incorporate more as they become habits. Remember, even small changes can add up to significant savings over time.
      </p>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Track your progress using a budgeting app like Balanze, and celebrate your milestones along the way. Saving money is a marathon, not a sprint, and every step forward brings you closer to your financial goals.
      </p>
    `,
    },
  ],
  [
    'understanding-budgeting-basics',
    {
      title: 'Understanding the Basics of Budgeting',
      date: 'June 20, 2024',
      author: 'Balanze Team',
      readTime: '10 min read',
      category: 'Budgeting',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      summary: 'Learn how to create a budget that works for you, track your expenses, and avoid common pitfalls.',
      content: `
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Budgeting is the foundation of financial success. It's not about restricting yourself, it's about making intentional decisions with your money. In this comprehensive guide, we'll walk you through creating a budget that actually works for your lifestyle.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">What is a Budget?</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        A budget is simply a plan for your money. It helps you understand where your money comes from and where it goes. Think of it as a roadmap for your finances, it shows you the path to your financial goals.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Step 1: Track Your Income</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Start by listing all your sources of income:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Salary or wages</li>
        <li>Freelance income</li>
        <li>Investment returns</li>
        <li>Side hustles</li>
        <li>Any other income sources</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Step 2: List All Your Expenses</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Be thorough when listing your expenses. Don't forget about:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Fixed expenses (rent, utilities, insurance)</li>
        <li>Variable expenses (groceries, gas, entertainment)</li>
        <li>Periodic expenses (annual subscriptions, car maintenance)</li>
        <li>Debt payments</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Step 3: Choose Your Budgeting Method</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        There are several popular budgeting methods. Choose the one that fits your personality and lifestyle:
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">The 50/30/20 Rule</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
        Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment.
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Zero-Based Budgeting</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
        Every dollar has a job. Your income minus expenses equals zero.
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Envelope Method</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Use cash envelopes for different spending categories.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Step 4: Set Financial Goals</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Your budget should align with your financial goals. Common goals include:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Building an emergency fund</li>
        <li>Paying off debt</li>
        <li>Saving for retirement</li>
        <li>Buying a home</li>
        <li>Taking a vacation</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Step 5: Monitor and Adjust</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        A budget is not set in stone. Review it regularly and make adjustments as needed. Life changes, and your budget should change with it.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Common Budgeting Mistakes to Avoid</h2>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Being unrealistic about your spending</li>
        <li>Forgetting to include irregular expenses</li>
        <li>Not having an emergency fund</li>
        <li>Being too rigid with your budget</li>
        <li>Not tracking your progress</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Tools to Help You Budget</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Use technology to your advantage. Apps like Balanze can help you track your spending, set goals, and stay on top of your budget.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Final Thoughts</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Budgeting is a skill that takes time to master. Don't get discouraged if you don't get it right the first time. The important thing is to start and keep trying. With practice and patience, you'll develop a budget that works for you and helps you achieve your financial goals.
      </p>
    `,
    },
  ],
  [
    'manage-loans-responsibly',
    {
      title: 'How to Manage Loans and Borrow Responsibly',
      date: 'May 10, 2024',
      author: 'Balanze Team',
      readTime: '12 min read',
      category: 'Lending & Borrowing',
      image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      summary: 'A guide to borrowing smart, keeping track of your loans, and staying out of debt trouble.',
      content: `
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Loans can be powerful financial tools when used wisely, but they can also lead to financial trouble if not managed properly. This comprehensive guide will help you understand when to borrow, how to choose the right loan, and how to manage your debt effectively.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">When Should You Borrow?</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Not all debt is bad debt. Here are situations where borrowing might make sense:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li><strong>Education:</strong> Student loans for valuable skills and degrees</li>
        <li><strong>Home Purchase:</strong> Mortgages for real estate investment</li>
        <li><strong>Business:</strong> Loans to start or expand a business</li>
        <li><strong>Emergency:</strong> When you have no other options</li>
        <li><strong>Investment:</strong> When the return exceeds the cost</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Types of Loans</h2>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Secured Loans</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
        Backed by collateral (like a car or house). Generally have lower interest rates.
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Unsecured Loans</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
        Based on creditworthiness. Higher interest rates but no collateral required.
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Personal Loans</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Flexible loans for various purposes. Interest rates vary based on credit score.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Before You Borrow</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Ask yourself these important questions:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Do I really need this loan?</li>
        <li>Can I afford the monthly payments?</li>
        <li>What's the total cost including interest?</li>
        <li>Do I have other options?</li>
        <li>How will this affect my long-term financial goals?</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Understanding Interest Rates</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Interest rates significantly impact the total cost of your loan. Always compare:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li><strong>APR (Annual Percentage Rate):</strong> The true cost of borrowing</li>
        <li><strong>Fixed vs. Variable Rates:</strong> Stability vs. potential savings</li>
        <li><strong>Loan Terms:</strong> Longer terms mean more interest paid</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Managing Multiple Loans</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        If you have multiple loans, consider these strategies:
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Debt Snowball Method</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
        Pay off the smallest debt first, then roll that payment into the next smallest.
      </p>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Debt Avalanche Method</h3>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Pay off the highest interest rate debt first to minimize total interest paid.
      </p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Loan Tracking and Management</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Keep track of all your loans in one place. Use tools like Balanze to:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Track payment due dates</li>
        <li>Monitor outstanding balances</li>
        <li>Calculate total debt</li>
        <li>Set up payment reminders</li>
        <li>Track your progress</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Red Flags to Watch For</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Be cautious of these warning signs:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Using loans to pay for daily expenses</li>
        <li>Taking on new debt to pay old debt</li>
        <li>Missing payments regularly</li>
        <li>High debt-to-income ratio</li>
        <li>Payday loans or high-interest alternatives</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Building Good Credit</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Responsible borrowing helps build good credit:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Make payments on time</li>
        <li>Keep credit utilization low</li>
        <li>Don't close old accounts</li>
        <li>Monitor your credit report</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Getting Out of Debt</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        If you're struggling with debt:
      </p>
      <ul class="list-disc list-inside text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
        <li>Contact your lenders immediately</li>
        <li>Consider debt consolidation</li>
        <li>Seek credit counseling</li>
        <li>Create a strict budget</li>
        <li>Consider a side hustle for extra income</li>
      </ul>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Final Thoughts</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Borrowing money is a serious financial decision. Take the time to understand your options, read the fine print, and make sure you can afford the payments. Remember, the goal is to use debt as a tool to improve your financial situation, not to create long-term financial stress.
      </p>
    `,
    },
  ],
];

const BLOG_ARTICLES: Record<string, BlogArticleDetail> = Object.fromEntries(BLOG_ARTICLE_ENTRIES);

export const articles: BlogArticleListItem[] = BLOG_ARTICLE_ENTRIES.map(([slug, a]) => ({
  title: a.title,
  date: a.date,
  summary: a.summary,
  slug,
}));

export function getArticle(slug: string): BlogArticleDetail | undefined {
  return BLOG_ARTICLES[slug];
}
