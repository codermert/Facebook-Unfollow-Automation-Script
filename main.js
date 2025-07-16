const delay = ms => new Promise(res => setTimeout(res, ms));
const UNFOLLOW_TEXT = "nicht mehr folgen"; 

async function unfollowAll() {
  let total = 0;
  while (true) {
    // 1. Sayfadaki üç nokta butonlarını bul (daha önce tıklanmamış olanlar)
    const threeDots = Array.from(document.querySelectorAll('div[aria-label^="Weitere Optionen für"], div[aria-label^="More options for"]'))
      .filter(btn => !btn.dataset.clicked);

    if (threeDots.length === 0) {
      console.log("✅ Tüm kullanıcılar için denendi.");
      break;
    }

    for (const btn of threeDots) {
      btn.dataset.clicked = "true";
      btn.click();
      await delay(1000);

      // 2. Menüde "Nicht mehr folgen" yazan butonu bul ve tıkla
      const unfollowBtn = Array.from(document.querySelectorAll('span, div[role="menuitem"]'))
        .find(el =>
          el.textContent.trim().toLowerCase() === UNFOLLOW_TEXT &&
          el.offsetParent !== null
        );

      if (unfollowBtn) {
        unfollowBtn.click();
        total++;
        console.log(`🚫 Takipten çıkıldı: ${total}`);
        await delay(1200);
      } else {
        console.log("⚠️ Menüde 'Nicht mehr folgen' butonu bulunamadı.");
      }

      await delay(500);
    }

    // 3. Sayfayı kaydır, yeni kullanıcılar gelsin
    window.scrollBy(0, 400);
    await delay(1200);
  }
  alert(`Tüm kullanıcılar için denendi. Toplam: ${total}`);
}

unfollowAll();
