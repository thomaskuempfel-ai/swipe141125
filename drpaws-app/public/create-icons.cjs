const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#db2777');
  gradient.addColorStop(1, '#172554');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw paw print
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  
  // Main pad
  ctx.beginPath();
  ctx.ellipse(size/2, size*0.59, size*0.156, size*0.195, 0, 0, 2 * Math.PI);
  ctx.fill();
  
  // Top left toe
  ctx.beginPath();
  ctx.ellipse(size*0.352, size*0.391, size*0.088, size*0.117, -0.35, 0, 2 * Math.PI);
  ctx.fill();
  
  // Top center toe
  ctx.beginPath();
  ctx.ellipse(size/2, size*0.332, size*0.088, size*0.117, 0, 0, 2 * Math.PI);
  ctx.fill();
  
  // Top right toe
  ctx.beginPath();
  ctx.ellipse(size*0.648, size*0.391, size*0.088, size*0.117, 0.35, 0, 2 * Math.PI);
  ctx.fill();
  
  // Bottom right toe
  ctx.beginPath();
  ctx.ellipse(size*0.664, size*0.547, size*0.078, size*0.107, 0.52, 0, 2 * Math.PI);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

createIcon(192, 'icon-192x192.png');
createIcon(512, 'icon-512x512.png');
createIcon(180, 'apple-touch-icon.png');
createIcon(32, 'favicon-32x32.png');
createIcon(16, 'favicon-16x16.png');
