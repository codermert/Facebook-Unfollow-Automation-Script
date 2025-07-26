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
    <textarea id="ig-user-list" style="width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px; resize: vertical;"></textarea>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; color: #666;">Aynı anda işlenecek kullanıcı sayısı:</label>
      <input type="number" id="ig-batch-size" min="1" max="10" value="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
      <small style="color: #999; display: block; margin-top: 5px;">Daha yüksek değerler daha hızlı işlem yapar, ancak Instagram tarafından engellenme riski artar.</small>
    </div>
    <div style="display: flex; justify-content: center; gap: 10px;">
      <button id="ig-start-btn" style="background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Başlat</button>
      <button id="ig-cancel-btn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">İptal</button>
    </div>
    <div id="ig-status" style="margin-top: 15px; text-align: center; color: #666;"></div>
  `;
  
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  
  // Buton işlevleri
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
    
    const batchSize = parseInt(document.getElementById('ig-batch-size').value) || 4;
    
    overlay.remove();
    
    startBlockProcess(userList, batchSize);
  });
  
  document.getElementById('ig-cancel-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

async function blockUser(username) {
  return new Promise((resolve) => {
    const userUrl = `https://www.instagram.com/${username}`;
    const newWindow = window.open(userUrl, '_blank');
    
    if (!newWindow) {
      console.error(`${username}: Yeni pencere açılamadı. Pop-up engelleyiciyi kontrol edin.`);
      resolve(false);
      return;
    }
    
    const checkButton = setInterval(() => {
      if (newWindow.document.readyState === 'complete') {
        clearInterval(checkButton);
        setTimeout(() => {
          try {
            // Kullanıcının verdiği CSS seçici ile üç nokta menü butonunu bul
            const menuButtonSelector = "#mount_0_0_jx > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.x1f5funs.xvbhtw8.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1qughib > div.xvc5jky.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.x1xdureb.x1agbcgv.xieb3on.x1lhsz42.xr1yuqi.x6ikm8r.x10wlt62.x1jfgfrl > div > div > div:nth-child(3) > div > div > svg";
            
            // Eğer tam olarak bu seçici çalışmazsa, alternatif olarak SVG içeren butonları da deneyelim
            let menuButton = newWindow.document.querySelector(menuButtonSelector);
            
            if (!menuButton) {
              // Alternatif olarak, header bölümündeki tüm SVG'leri kontrol et
              const headerSection = newWindow.document.querySelector('section.x1xdureb.x1agbcgv.xieb3on.x1lhsz42.xr1yuqi.x6ikm8r.x10wlt62.x1jfgfrl');
              if (headerSection) {
                const svgElements = headerSection.querySelectorAll('svg');
                // Son SVG elementi genellikle üç nokta menüsüdür
                if (svgElements.length > 0) {
                  menuButton = svgElements[svgElements.length - 1];
                }
              }
            }
            
            if (menuButton) {
              console.log(`${username}: Menü butonu bulundu, tıklanıyor...`);
              // SVG'nin kendisi değil, üst elementi tıklanabilir olabilir
              const clickableElement = menuButton.closest('button') || menuButton.closest('div[role="button"]') || menuButton;
              clickableElement.click();
              
              // Menü açıldıktan sonra engelle butonunu bul
              setTimeout(() => {
                // Kullanıcının verdiği CSS seçici ile engelle butonunu bul
                const blockButtonSelector = "body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > button:nth-child(1)";
                let blockButton = newWindow.document.querySelector(blockButtonSelector);
                
                if (!blockButton) {
                  // Alternatif olarak, açılan menüdeki tüm butonları kontrol et
                  const menuButtons = Array.from(newWindow.document.querySelectorAll('div[role="dialog"] button, div.x1n2onr6.xzkaem6 button'));
                  blockButton = menuButtons.find(button => {
                    const buttonText = button.textContent.toLowerCase();
                    return buttonText.includes('engelle') || 
                           buttonText.includes('block') || 
                           buttonText.includes('kısıtla');
                  });
                }
                
                if (blockButton) {
                  console.log(`${username}: Engelle butonu bulundu, tıklanıyor...`);
                  blockButton.click();
                  
                  // Engelleme onay butonunu bul
                  setTimeout(() => {
                    // Kullanıcının verdiği CSS seçici ile onay butonunu bul
                    const confirmButtonSelector = "body > div:nth-child(77) > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div.x78zum5.xdt5ytf.x1crbq5u.xvrdyt3.x179zr98 > button.xjbqb8w.x1qhh985.x10w94by.x14e42zd.x1yvgwvq.x13fuv20.x178xt8z.x1ypdohk.xvs91rp.x1evy7pa.xdj266r.x14z9mp.xat24cr.x1lziwak.x1wxaq2x.x1iorvi4.xf159sx.xjkvuk6.xmzvs34.x2b8uid.x87ps6o.xxymvpz.xh8yej3.x52vrxo.x4gyw5p.xkmlbd1.x1xlr1w8";
                    let confirmButton = newWindow.document.querySelector(confirmButtonSelector);
                    
                    if (!confirmButton) {
                      // Alternatif olarak, onay dialogundaki tüm butonları kontrol et
                      const dialogButtons = Array.from(newWindow.document.querySelectorAll('div[role="dialog"] button'));
                      confirmButton = dialogButtons.find(button => {
                        const buttonText = button.textContent.toLowerCase();
                        return buttonText.includes('engelle') || 
                               buttonText.includes('block') || 
                               buttonText.includes('tamam') || 
                               buttonText.includes('ok');
                      });
                    }
                    
                    if (confirmButton) {
                      console.log(`${username}: Onay butonu bulundu, tıklanıyor...`);
                      confirmButton.click();
                      setTimeout(() => {
                        newWindow.close();
                        console.log(`%c${username}: Engellendi ✓`, 'color: green');
                        resolve(true);
                      }, 500);
                    } else {
                      console.error(`${username}: Onay butonu bulunamadı`);
                      newWindow.close();
                      resolve(false);
                    }
                  }, 1000);
                } else {
                  console.error(`${username}: Engelle butonu bulunamadı`);
                  newWindow.close();
                  resolve(false);
                }
              }, 1000);
            } else {
              console.error(`${username}: Menü butonu bulunamadı`);
              newWindow.close();
              resolve(false);
            }
          } catch (error) {
            console.error(`${username}: Engelleme sırasında hata:`, error);
            newWindow.close();
            resolve(false);
          }
        }, 1500);
      }
    }, 300);
    
    // 10 saniye sonra timeout
    setTimeout(() => {
      clearInterval(checkButton);
      if (!newWindow.closed) {
        console.error(`${username}: İşlem zaman aşımına uğradı`);
        newWindow.close();
        resolve(false);
      }
    }, 10000);
  });
}

// Ana işlem fonksiyonu - Batch işleme ile
async function startBlockProcess(userList, batchSize = 4) {
  console.log(`%c${userList.length} kullanıcı bulundu. İşlem başlatılıyor...`, 'color: blue; font-weight: bold');
  console.log(`%cAynı anda ${batchSize} kullanıcı işlenecek`, 'color: blue');
  
  const startTime = new Date().getTime();
  let successCount = 0;
  let failCount = 0;
  let processedCount = 0;
  
  // İlerleme çubuğu oluştur
  createProgressBar(userList.length);
  
  // Kullanıcıları batch'ler halinde işle
  for (let i = 0; i < userList.length; i += batchSize) {
    const batch = userList.slice(i, i + batchSize);
    const batchPromises = batch.map(user => blockUser(user));
    
    console.log(`%cBatch işleniyor: ${i+1}-${Math.min(i+batchSize, userList.length)}/${userList.length}`, 'color: blue');
    
    try {
      const results = await Promise.all(batchPromises);
      
      results.forEach((result, index) => {
        processedCount++;
        updateProgressBar(processedCount, userList.length);
        
        if (result) {
          successCount++;
          console.log(`%c${batch[index]}: Başarılı (${successCount} başarılı, ${failCount} başarısız)`, 'color: green');
        } else {
          failCount++;
          console.log(`%c${batch[index]}: Başarısız (${successCount} başarılı, ${failCount} başarısız)`, 'color: red');
        }
      });
    } catch (error) {
      console.error(`Batch işleminde hata:`, error);
      failCount += batch.length;
      processedCount += batch.length;
      updateProgressBar(processedCount, userList.length);
    }
    
    // Batch'ler arası çok kısa bekleme (Instagram'ın engellemesini azaltmak için)
    if (i + batchSize < userList.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // İşlem tamamlandı
  const endTime = new Date().getTime();
  const elapsedTime = Math.floor((endTime - startTime) / 1000);
  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = elapsedTime % 60;
  
  console.log(
    `%c🎉 İşlem Tamamlandı!\n` +
    `✅ Başarılı: ${successCount}\n` +
    `❌ Başarısız: ${failCount}\n` +
    `⏱️ İşlem Süresi: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    'color: green; font-weight: bold; font-size: 14px;'
  );
  
  // İlerleme çubuğunu kaldır
  removeProgressBar();
  
  // Sonuç dialogu göster
  showResultDialog(successCount, failCount, hours, minutes, seconds);
}

// İlerleme çubuğu oluştur
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

// İlerleme çubuğunu güncelle
function updateProgressBar(current, total) {
  const progressBar = document.getElementById('ig-progress-bar');
  const progressText = document.getElementById('ig-progress-text');
  
  if (progressBar && progressText) {
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${current}/${total}`;
  }
}

// İlerleme çubuğunu kaldır
function removeProgressBar() {
  const progressContainer = document.getElementById('ig-progress-container');
  if (progressContainer) {
    progressContainer.remove();
  }
}

// Sonuç dialogu
function showResultDialog(successCount, failCount, hours, minutes, seconds) {
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
