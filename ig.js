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
    <h2 style="margin-top: 0; color: #333; text-align: center;">Instagram Takipten Çıkma</h2>
    <p style="color: #666;">Takipten çıkarmak istediğiniz kullanıcı adlarını alt alta girin:</p>
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
    
    startUnfollowProcess(userList, batchSize);
  });
  
  document.getElementById('ig-cancel-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

async function unfollowUser(username) {
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
            // Tüm butonları bul
            const allButtons = Array.from(newWindow.document.querySelectorAll('button'));
            
            // Takip ediliyor/Takipten çık butonunu bul
            const followButton = allButtons.find(button => {
              // Butonun içindeki metni kontrol et
              const buttonText = button.textContent.toLowerCase();
              return buttonText.includes('takip ediliyor') || 
                     buttonText.includes('following') || 
                     buttonText.includes('takiptesin');
            });
            
            if (followButton) {
              console.log(`${username}: Takip butonu bulundu, tıklanıyor...`);
              followButton.click();
              
              // 1 saniye bekle, sonra onay butonunu bul
              setTimeout(() => {
                // Tüm div'leri bul
                const allDivs = Array.from(newWindow.document.querySelectorAll('div[role="button"]'));
                
                // Takipten çık onay butonunu bul
                const unfollowConfirm = allDivs.find(div => {
                  const divText = div.textContent.toLowerCase();
                  return divText.includes('takibi bırak') || 
                         divText.includes('unfollow') || 
                         divText.includes('takipten çık');
                });
                
                if (unfollowConfirm) {
                  console.log(`${username}: Onay butonu bulundu, tıklanıyor...`);
                  unfollowConfirm.click();
                  setTimeout(() => {
                    newWindow.close();
                    console.log(`%c${username}: Takipten çıkıldı ✓`, 'color: green');
                    resolve(true);
                  }, 500); // Daha hızlı kapanış
                } else {
                  // Alternatif olarak, tüm butonları kontrol et
                  const allButtons = Array.from(newWindow.document.querySelectorAll('button'));
                  const unfollowButton = allButtons.find(button => {
                    const buttonText = button.textContent.toLowerCase();
                    return buttonText.includes('takibi bırak') || 
                           buttonText.includes('unfollow') || 
                           buttonText.includes('takipten çık');
                  });
                  
                  if (unfollowButton) {
                    console.log(`${username}: Alternatif onay butonu bulundu, tıklanıyor...`);
                    unfollowButton.click();
                    setTimeout(() => {
                      newWindow.close();
                      console.log(`%c${username}: Takipten çıkıldı ✓`, 'color: green');
                      resolve(true);
                    }, 500); // Daha hızlı kapanış
                  } else {
                    console.error(`${username}: Onay butonu bulunamadı`);
                    newWindow.close();
                    resolve(false);
                  }
                }
              }, 1000); // Daha hızlı bekleme
            } else {
              console.error(`${username}: Takip butonu bulunamadı`);
              newWindow.close();
              resolve(false);
            }
          } catch (error) {
            console.error(`${username}: Takipten çıkılırken hata:`, error);
            newWindow.close();
            resolve(false);
          }
        }, 1500); // Daha hızlı sayfa yükleme bekleme süresi
      }
    }, 300); // Daha hızlı kontrol aralığı
    
    // 10 saniye sonra timeout (daha kısa süre)
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
async function startUnfollowProcess(userList, batchSize = 4) {
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
    const batchPromises = batch.map(user => unfollowUser(user));
    
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
