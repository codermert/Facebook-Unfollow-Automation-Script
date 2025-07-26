// Zaman bilgisi ve kullanıcı
const startDateTime = "2025-07-26 09:21:37";
const currentUser = "codermert";

function createInputBox() {
  const oldOverlay = document.getElementById('ig-unfollow-overlay');
  if (oldOverlay) oldOverlay.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'ig-unfollow-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  const panel = document.createElement('div');
  panel.style.cssText = `
    background: white;
    border-radius: 10px;
    padding: 20px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
  `;
  
  panel.innerHTML = `
    <h2 style="margin-top: 0; color: #333; text-align: center;">Instagram Engelleme</h2>
    <p style="color: #666;">Engellemek istediğiniz kullanıcı adlarını alt alta girin:</p>
    <textarea id="ig-user-list" style="width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px; resize: vertical;" placeholder="Her satıra bir kullanıcı adı"></textarea>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; color: #666;">Aynı anda kaç kullanıcı işlensin:</label>
      <input type="number" id="ig-batch-size" min="1" max="10" value="5" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
      <small style="color: #999; display: block; margin-top: 5px;">Tavsiye: Sistemininiz kaldırabileceği kadar seçin (1-10 arası)</small>
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; color: #666;">İşlem Hızı:</label>
      <select id="ig-speed" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <option value="slow">Yavaş (Daha Güvenli)</option>
        <option value="normal" selected>Normal</option>
        <option value="fast">Hızlı (Riskli)</option>
      </select>
    </div>
    <div style="display: flex; justify-content: center; gap: 10px;">
      <button id="ig-start-btn" style="background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Başlat</button>
      <button id="ig-cancel-btn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">İptal</button>
    </div>
    <div id="ig-status" style="margin-top: 15px; text-align: center; color: #666;"></div>
  `;
  
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  
  document.getElementById('ig-start-btn').addEventListener('click', () => {
    const userInput = document.getElementById('ig-user-list').value.trim();
    if (!userInput) {
      document.getElementById('ig-status').textContent = 'Lütfen en az bir kullanıcı adı girin!';
      document.getElementById('ig-status').style.color = 'red';
      return;
    }
    
    const userList = userInput.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (userList.length === 0) {
      document.getElementById('ig-status').textContent = 'Geçerli kullanıcı adı bulunamadı!';
      document.getElementById('ig-status').style.color = 'red';
      return;
    }
    
    const batchSize = parseInt(document.getElementById('ig-batch-size').value) || 5;
    const speed = document.getElementById('ig-speed').value;
    
    overlay.remove();
    startBlockProcess(userList, speed, batchSize);
  });
  
  document.getElementById('ig-cancel-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

async function blockUser(username) {
  return new Promise(async (resolve) => {
    const userUrl = `https://www.instagram.com/${username}`;
    const newWindow = window.open(userUrl, '_blank');
    
    if (!newWindow) {
      console.error(`${username}: Yeni pencere açılamadı. Pop-up engelleyiciyi kontrol edin.`);
      resolve(false);
      return;
    }

    try {
      // Sayfa yüklenene kadar bekle
      await waitForPageLoad(newWindow);
      
      // Menü butonunu bul ve tıkla
      const menuButton = await findMenuButton(newWindow);
      if (!menuButton) {
        throw new Error('Menü butonu bulunamadı');
      }
      menuButton.click();
      
      // Engelle butonu için bekle
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Engelle butonunu bul ve tıkla
      const blockButton = await findBlockButton(newWindow);
      if (!blockButton) {
        throw new Error('Engelle butonu bulunamadı');
      }
      blockButton.click();
      
      // Onay butonu için bekle ve dene
      let confirmButton = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!confirmButton && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        confirmButton = await findConfirmButton(newWindow);
        attempts++;
        
        if (!confirmButton) {
          console.log(`${username}: Onay butonu denemesi ${attempts}/${maxAttempts}`);
        }
      }

      if (!confirmButton) {
        throw new Error('Onay butonu bulunamadı');
      }

      console.log(`${username}: Onay butonu bulundu, tıklanıyor...`);
      confirmButton.click();

      // İşlemin tamamlanması için bekle
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log(`%c${username}: Engellendi ✓`, 'color: green');
      newWindow.close();
      resolve(true);
    } catch (error) {
      console.error(`${username}: ${error.message}`);
      if (!newWindow.closed) newWindow.close();
      resolve(false);
    }
  });
}

async function waitForPageLoad(window) {
  return new Promise((resolve) => {
    const checkReadyState = setInterval(() => {
      if (window.document.readyState === 'complete') {
        clearInterval(checkReadyState);
        setTimeout(resolve, 2000); // Sayfa yüklendikten sonra ek bekleme
      }
    }, 100);

    // Timeout için
    setTimeout(() => {
      clearInterval(checkReadyState);
      resolve();
    }, 15000);
  });
}

async function findMenuButton(window) {
  const selectors = [
    'svg[aria-label="Seçenekler"]',
    'svg[aria-label="Options"]',
    'button[aria-label="Diğer seçenekler"]',
    'button[aria-label="More options"]'
  ];

  for (const selector of selectors) {
    const element = window.document.querySelector(selector);
    if (element) {
      return element.closest('button') || element.closest('div[role="button"]') || element;
    }
  }

  // Alternatif arama
  const headerSection = window.document.querySelector('section.x1xdureb.x1agbcgv.xieb3on.x1lhsz42.xr1yuqi.x6ikm8r.x10wlt62.x1jfgfrl');
  if (headerSection) {
    const svgElements = headerSection.querySelectorAll('svg');
    if (svgElements.length > 0) {
      const lastSvg = svgElements[svgElements.length - 1];
      return lastSvg.closest('button') || lastSvg.closest('div[role="button"]') || lastSvg;
    }
  }

  return null;
}

async function findBlockButton(window) {
  const menuItems = Array.from(window.document.querySelectorAll('div[role="dialog"] button, div[role="menu"] button'));
  return menuItems.find(button => {
    const text = button.textContent.toLowerCase();
    return text.includes('engelle') || text.includes('block') || text.includes('kısıtla');
  });
}

async function findConfirmButton(window) {
  // XPath ile dene
  try {
    const xpath = "/html/body/div[5]/div[1]/div/div[2]/div/div/div/div/div/div/div[2]/button[1]";
    const result = window.document.evaluate(xpath, window.document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const button = result.singleNodeValue;
    if (button) return button;
  } catch (e) {
    console.log("XPath ile buton bulunamadı, alternatif yöntemler deneniyor...");
  }

  // Alternatif yöntemler
  const dialogButtons = Array.from(window.document.querySelectorAll('div[role="dialog"] button, div[role="presentation"] button'));
  const confirmButton = dialogButtons.find(button => {
    const text = button.textContent.toLowerCase();
    return text.includes('engelle') || text.includes('block') || 
           text.includes('tamam') || text.includes('ok');
  });

  if (!confirmButton) {
    const alternativeSelectors = [
      'div[role="dialog"] button:first-of-type',
      'div[role="presentation"] button:first-of-type',
      '[data-testid="confirmDialog"] button',
      '.x7r02ix button',
      '.x78zum5 button'
    ];

    for (const selector of alternativeSelectors) {
      const button = window.document.querySelector(selector);
      if (button) return button;
    }

    // Son çare: Koordinat bazlı tıklama için element bul
    const dialogElement = window.document.querySelector('div[role="dialog"]');
    if (dialogElement) {
      const rect = dialogElement.getBoundingClientRect();
      const x = rect.left + (rect.width * 0.25);
      const y = rect.bottom - 50;
      
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });
      
      dialogElement.dispatchEvent(clickEvent);
      return dialogElement;
    }
  }

  return confirmButton;
}

async function startBlockProcess(userList, speed = 'normal', batchSize = 5) {
  console.log(`%c${userList.length} kullanıcı bulundu. İşlem başlatılıyor...`, 'color: blue; font-weight: bold');
  console.log(`Başlangıç: ${startDateTime}`);
  console.log(`Kullanıcı: ${currentUser}`);
  console.log(`Batch Boyutu: ${batchSize} kullanıcı/batch`);
  
  const startTime = new Date().getTime();
  let successCount = 0;
  let failCount = 0;
  let processedCount = 0;
  
  createProgressBar(userList.length);
  
  // Hız ayarlarını belirle
  const delays = {
    slow: 3000,
    normal: 1500,
    fast: 500
  };
  
  // Kullanıcıları batch'ler halinde işle
  for (let i = 0; i < userList.length; i += batchSize) {
    const batch = userList.slice(i, Math.min(i + batchSize, userList.length));
    console.log(`%c${i+1}-${Math.min(i+batchSize, userList.length)} arası kullanıcılar işleniyor...`, 'color: blue');
    
    const promises = batch.map(username => blockUser(username));
    const results = await Promise.all(promises);
    
    results.forEach((success, index) => {
      processedCount++;
      if (success) {
        successCount++;
        console.log(`%c${batch[index]}: Başarılı (${successCount} başarılı, ${failCount} başarısız)`, 'color: green');
      } else {
        failCount++;
        console.log(`%c${batch[index]}: Başarısız (${successCount} başarılı, ${failCount} başarısız)`, 'color: red');
      }
      updateProgressBar(processedCount, userList.length);
    });
    
    // Batch'ler arası bekleme
    if (i + batchSize < userList.length) {
      await new Promise(resolve => setTimeout(resolve, delays[speed]));
    }
  }

  const endTime = new Date().getTime();
  const elapsedTime = Math.floor((endTime - startTime) / 1000);
  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = elapsedTime % 60;
  
  removeProgressBar();
  showResultDialog(successCount, failCount, hours, minutes, seconds, batchSize);
}

function createProgressBar(total) {
  const progressContainer = document.createElement('div');
  progressContainer.id = 'ig-progress-container';
  progressContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 999999;
    width: 300px;
  `;
  
  progressContainer.innerHTML = `
    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
      <span style="font-weight: bold; color: #333;">İşlem Durumu</span>
      <span id="ig-progress-text">0/${total}</span>
    </div>
    <div style="height: 10px; background: #f1f1f1; border-radius: 5px; overflow: hidden;">
      <div id="ig-progress-bar" style="height: 100%; width: 0%; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); transition: width 0.3s;"></div>
    </div>
  `;
  
  document.body.appendChild(progressContainer);
}

function updateProgressBar(current, total) {
  const progressBar = document.getElementById('ig-progress-bar');
  const progressText = document.getElementById('ig-progress-text');
  
  if (progressBar && progressText) {
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${current}/${total}`;
  }
}

function removeProgressBar() {
  const progressContainer = document.getElementById('ig-progress-container');
  if (progressContainer) {
    progressContainer.remove();
  }
}

function showResultDialog(successCount, failCount, hours, minutes, seconds, batchSize) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    border-radius: 10px;
    padding: 25px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    text-align: center;
  `;
  
  dialog.innerHTML = `
    <h2 style="margin-top: 0; color: #333;">🎉 İşlem Tamamlandı!</h2>
    <div style="margin: 10px 0; color: #666;">
      <div>Başlangıç: ${startDateTime}</div>
      <div>Kullanıcı: ${currentUser}</div>
      <div>Batch Boyutu: ${batchSize} kullanıcı/batch</div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
      <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #28a745;">
        <span style="font-size: 24px; font-weight: bold; color: #28a745;">${successCount}</span>
        <span style="display: block; font-size: 14px; color: #666; margin-top: 5px;">Başarılı</span>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #dc3545;">
        <span style="font-size: 24px; font-weight: bold; color: #dc3545;">${failCount}</span>
        <span style="display: block; font-size: 14px; color: #666; margin-top: 5px;">Başarısız</span>
      </div>
    </div>
    <div style="background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 15px; border-radius: 10px; margin: 20px 0; font-size: 16px; font-weight: bold;">
      ⏱️ İşlem Süresi: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
    </div>
    <button id="ig-close-result" style="background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; border: none; padding: 12px 30px; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer;">Tamam</button>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  document.getElementById('ig-close-result').addEventListener('click', () => {
    overlay.remove();
  });
}

// Uygulamayı başlat
createInputBox();
