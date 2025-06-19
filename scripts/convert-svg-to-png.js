import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertSvgToPng() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to exact OGP image dimensions
  await page.setViewport({ width: 1200, height: 630 });
  
  // Read SVG file
  const svgPath = path.join(__dirname, '../public/ogp-image-static.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  // Create HTML with embedded SVG
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; }
        svg { display: block; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `;
  
  await page.setContent(html);
  
  // Take screenshot
  const outputPath = path.join(__dirname, '../public/ogp-image.png');
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'png'
  });
  
  await browser.close();
  console.log(`PNG image generated: ${outputPath}`);
}

convertSvgToPng().catch(console.error);