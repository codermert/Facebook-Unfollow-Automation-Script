// Zaman bilgisi ve kullanıcı
const startDateTime = "2025-07-26 11:29:52";
const currentUser = "codermert";

async function startUnblockProcess() {
  let successCount = 0;
  let failCount = 0;

  while (true) {
    try {
      // Listedeki "Engellemeyi Kaldır" butonlarını bul
      const unblockButtons = document.querySelectorAll('div[role="button"][aria-label="Engellemeyi Kaldır"]');
      
      if (unblockButtons.length === 0) {
        console.log('İşlem tamamlandı - Tüm engeller kaldırıldı!');
        break;
      }

      // İlk butonu al
      const unblockButton = unblockButtons[0];
      
      // 1. Engeli kaldır butonuna tıkla
      unblockButton.click();
      console.log('Engellemeyi Kaldır butonuna tıklandı, 2 saniye bekleniyor...');
      await new Promise(r => setTimeout(r, 2000));
      
      // 2. XPath ile onay butonunu bul ve tıkla
      const confirmButton = document.evaluate(
        '/html/body/div[4]/div[1]/div/div[2]/div/div/div/div/div[2]/div/div/div[2]/button[1]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      if (confirmButton) {
        confirmButton.click();
        console.log('Onay butonuna tıklandı, 5 saniye bekleniyor...');
        successCount++;
        console.log(`%c${successCount}. kullanıcının engeli kaldırıldı!`, 'color: green');
        
        // İşlem tamamlandıktan sonra 5 saniye bekle
        await new Promise(r => setTimeout(r, 5000));
        console.log('Sonraki kullanıcıya geçiliyor...');
      } else {
        throw new Error('Onay butonu bulunamadı');
      }

    } catch (error) {
      failCount++;
      console.error('Hata:', error);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log(`%cİşlem Tamamlandı!\nBaşarılı: ${successCount}\nBaşarısız: ${failCount}`, 'color: blue; font-weight: bold');
}

// Scripti başlat
console.log('%cScript başlatılıyor...', 'color: blue; font-weight: bold');
console.log(`Başlangıç: ${startDateTime}`);
console.log(`Kullanıcı: ${currentUser}`);
startUnblockProcess();
