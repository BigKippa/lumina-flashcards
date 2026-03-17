import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    page.on('error', err => console.log('CRASH ERROR:', err.toString()));

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
        console.log('Page loaded.');
        
        // Find and click the "Log In" button
        const buttons = await page.$$('button');
        let logInButton = null;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Log In')) {
                logInButton = btn;
                break;
            }
        }
        
        if (logInButton) {
            await logInButton.click();
            await new Promise(r => setTimeout(r, 1000));
            console.log('Clicked Log In button overlay.');
            
            await page.type('input[type="text"]', 'admin');
            await page.type('input[type="password"]', 'secure_password');
            await page.click('button[type="submit"]');
            
            console.log('Submitted login credentials. Waiting for dashboard...');
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation wait timeout (SPA routing).'));
            await new Promise(r => setTimeout(r, 3000));
            
            const html = await page.content();
            if (html.includes('Manage Flashcards') || html.includes('Admin')) {
                console.log('Admin Dashboard loaded successfully without crashing!');
            } else {
                console.log('Did not find Admin Dashboard content. Dumping to dashboard_dump.html');
                fs.writeFileSync('dashboard_dump.html', html);
            }
        } else {
            console.log("Could not find Log In button on initial screen.");
        }

    } catch (e) {
        console.error('Script Error:', e.message);
    }
    
    await browser.close();
})();
