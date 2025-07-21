const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, extensions, fileList);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Функция для исправления путей в файлах
function fixPaths() {
  const outDir = path.join(__dirname, '..', 'out');
  
  if (!fs.existsSync(outDir)) {
    console.log('Папка out не найдена, сначала выполните npm run build');
    return;
  }
  
  // Исправляем HTML файлы
  const htmlFiles = findFiles(outDir, ['.html']);
  htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Исправляем абсолютные пути на относительные
    content = content.replace(/href="\/_next\//g, 'href="./_next/');
    content = content.replace(/src="\/_next\//g, 'src="./_next/');
    content = content.replace(/href="\/favicon/g, 'href="./favicon');
    content = content.replace(/href="\/site.webmanifest"/g, 'href="./site.webmanifest"');
    content = content.replace(/href="\/apple-touch-icon/g, 'href="./apple-touch-icon');
    content = content.replace(/href="\/android-chrome/g, 'href="./android-chrome');
    
    // Исправляем пути в preload ссылках
    content = content.replace(/href="\//g, 'href="./');
    
    fs.writeFileSync(filePath, content);
    console.log(`HTML: ${path.relative(outDir, filePath)}`);
  });
  
  // Исправляем JS файлы
  const jsFiles = findFiles(outDir, ['.js']);
  jsFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Исправляем пути в JS файлах
    const originalContent = content;
    
    // Основные паттерны для Next.js
    content = content.replace(/"\/_next\//g, '"./_next/');
    content = content.replace(/'\/(_next\/)/g, '"./$1');
    content = content.replace(/`\/_next\//g, '`./_next/');
    
    // Исправляем абсолютные пути к ресурсам
    content = content.replace(/\"\/([^\/][^"]*\.(woff2?|ttf|eot||jpg|jpeg|gif|webp|ico))\"/g, '"./$1"');
    
    // Исправляем пути к статическим ресурсам (icons, sounds, etc.)
    content = content.replace(/\"\/icons\//g, '"./icons/');
    content = content.replace(/\"\/sounds\//g, '"./sounds/');
    content = content.replace(/\"\/piece\//g, '"./piece/');
    content = content.replace(/\"\/engines\//g, '"./engines/');
    
    // Исправляем в строковых литералах
    content = content.replace(/'\/icons\//g, "'./icons/");
    content = content.replace(/'\/sounds\//g, "'./sounds/");
    content = content.replace(/'\/piece\//g, "'./piece/");
    content = content.replace(/'\/engines\//g, "'./engines/");
    
    // Исправляем в template literals
    content = content.replace(/`\/icons\//g, "`./icons/");
    content = content.replace(/`\/sounds\//g, "`./sounds/");
    content = content.replace(/`\/piece\//g, "`./piece/");
    content = content.replace(/`\/engines\//g, "`./engines/");
    
    // Общий паттерн для любых абсолютных путей к файлам (кроме _next)
    content = content.replace(/("|\')\/([^\/"][^"']*\.(jpg|jpeg|gif|webp|ico|png|mp3|wav|ogg|js|wasm|nnue|ttf|woff2?|eot))\1/g, '$1./$2$1');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`JS: ${path.relative(outDir, filePath)}`);
    }
  });
  
  // Исправляем CSS файлы
  const cssFiles = findFiles(outDir, ['.css']);
  cssFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const originalContent = content;
    // Исправляем пути в CSS
    content = content.replace(/url\(\/_next\//g, 'url(./_next/');
    content = content.replace(/url\(\/([^\/][^)]*)\)/g, 'url(./$1)');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`CSS: ${path.relative(outDir, filePath)}`);
    }
  });
  
  console.log(`\nОбработано:`);
  console.log(`- HTML файлов: ${htmlFiles.length}`);
  console.log(`- JS файлов: ${jsFiles.length}`);
  console.log(`- CSS файлов: ${cssFiles.length}`);
}

// Запускаем исправление
fixPaths();
