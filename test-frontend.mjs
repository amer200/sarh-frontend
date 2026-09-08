// test-frontend.mjs
import { chromium } from 'playwright';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    gray: '\x1b[90m'
};

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ${colors.green}✔ PASS:${colors.reset} ${name}`);
    } catch (err) {
        failed++;
        console.log(`  ${colors.red}✖ FAIL:${colors.reset} ${name}`);
        console.log(`    ${colors.yellow}Reason:${colors.reset} ${err.message}`);
    }
}

async function main() {
    console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.yellow} 🚀 بدء الفحص الآلي لواجهات Next.js [SARH E2E UI TESTER]${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();

    // التقاط أي رسائل خطأ من المتصفح لمعرفة سبب أي فشل
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`    ${colors.gray}[Browser Console Error]: ${msg.text()}${colors.reset}`);
        }
    });

    // 0. تسخين الخادم
    process.stdout.write(`  ${colors.gray}⏳ جاري تسخين خادم Next.js...${colors.reset}`);
    try {
        await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
        console.log(` ${colors.green}[تم الجاهزية]${colors.reset}\n`);
    } catch {
        console.log(` ${colors.yellow}[متابعة الفحص]${colors.reset}\n`);
    }

    // 1. فحص تسجيل دخول السوبر أدمن والتوجيه لـ /admin
    await runTest('توجيه السوبر أدمن إلى لوحة التحكم المركزية (/admin)', async() => {
        await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
        await page.fill('#email-input', 'admin@sarh.cloud');
        await page.fill('#password-input', 'AdminSecret2026!');
        await page.click('#login-submit-btn');

        // ننتظر التوجيه لـ /admin
        await page.waitForURL('**/admin', { timeout: 15000 });

        const token = await page.evaluate(() => localStorage.getItem('sarh_token'));
        if (!token) throw new Error('sarh_token لم يُحفظ في localStorage');
    });

    // 2. فحص عناصر لوحة السوبر أدمن ومؤشرات الـ MRR
    await runTest('ظهور تبويبات ومؤشرات لوحة الإدارة المركزية بنجاح', async() => {
        if (!page.url().includes('/admin')) {
            await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'domcontentloaded' });
        }
        await page.waitForSelector('text=الدخل المتكرر (MRR)', { timeout: 15000 });
        await page.waitForSelector('button:has-text("المتاجر")', { timeout: 10000 });
        await page.waitForSelector('button:has-text("إشعارات التحويل")', { timeout: 10000 });
    });

    // 3. فحص الحماية وعزل التاجر غير الموثق
    await runTest('توجيه المتصفح غير الموثق إلى صفحة تسجيل الدخول تلقائياً', async() => {
        await context.clearCookies();
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
        await page.waitForURL('**/login', { timeout: 10000 });
    });

    // 4. فحص شاشة كاشير المطاعم ونافذة الشيفت (Shift Modal)
    await runTest('استجابة واجهة الكاشير /pos ومطالبتها بفتح شيفت كاشير أولاً', async() => {
        await page.goto(`${FRONTEND_URL}/pos`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const shiftButton = await page.waitForSelector('button:has-text("فتح شيفت"), button:has-text("بدء يومية")', { timeout: 10000 });
        if (!shiftButton) throw new Error('زر فتح الشيفت مفقود');
    });

    // 5. فحص اختصارات الكيبورد السريعة (Hotkeys)
    await runTest('استجابة اختصارات لوحة المفاتيح في الكاشير (F3 للمصروفات النثرية)', async() => {
        await page.keyboard.press('F3');
        const hasFatalError = await page.$('text=Application error');
        if (hasFatalError) throw new Error('أحدث اختصار الكيبورد خطأ تشغيلي غير معالج');
    });

    // 6. فحص كاشير التجزئة والملابس (/retail/pos)
    await runTest('تحميل واجهة التجزئة ومحاكي الباركود والفرع المختار', async() => {
        await page.goto(`${FRONTEND_URL}/retail/pos`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForSelector('input[placeholder*="باركود"]', { timeout: 10000 });
    });

    await browser.close();

    console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`  إجمالي الفحوصات: ${passed + failed} | ${colors.green}الناجحة: ${passed}${colors.reset} | ${colors.red}الفاشلة: ${failed}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}\n`);

    if (failed === 0) {
        console.log(`${colors.bold}${colors.green}🎉 مبروك! الواجهات الأمامية والـ Routing تعمل بكفاءة 100%!${colors.reset}\n`);
    }
}

main().catch(console.error);