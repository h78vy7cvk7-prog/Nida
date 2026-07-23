let prayerData = {};

const prayerIcons = {
  İmsak: "☾",
  Güneş: "☀",
  Öğle: "◉",
  İkindi: "◐",
  Akşam: "◒",
  Yatsı: "✦"
};

const state = {
  city:
    localStorage.getItem("nida-city") ||
    "Elazığ",

  notifications:
    JSON.parse(
      localStorage.getItem(
        "nida-notifications"
      ) || "{}"
    )
};

const locationLabel =
  document.getElementById("locationLabel");

const prayerList =
  document.getElementById("prayerList");

const nextPrayerName =
  document.getElementById("nextPrayerName");

const nextPrayerTime =
  document.getElementById("nextPrayerTime");

const countdown =
  document.getElementById("countdown");

const gregorianDate =
  document.getElementById("gregorianDate");

const hijriDate =
  document.getElementById("hijriDate");

const cityDialog =
  document.getElementById("cityDialog");

const citySelect =
  document.getElementById("citySelect");

const notificationDialog =
  document.getElementById(
    "notificationDialog"
  );

const notificationOptions =
  document.getElementById(
    "notificationOptions"
  );

const requestPermissionButton =
  document.getElementById(
    "requestPermissionButton"
  );

const toast =
  document.getElementById("toast");

const installButton =
  document.getElementById(
    "installButton"
  );

let deferredInstallPrompt = null;

function cleanTime(value) {
  if (!value) {
    return "--:--";
  }

  return value
    .split(" ")[0]
    .trim();
}

async function fetchPrayerTimes() {
  showLoadingState();

  const city =
    encodeURIComponent(state.city);

  const url =
    "https://api.aladhan.com/v1/" +
    "timingsByCity" +
    `?city=${city}` +
    "&country=Turkey" +
    "&method=13" +
    "&school=1";

  try {
    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Sunucu yanıt vermedi."
      );
    }

    const result =
      await response.json();

    if (
      result.code !== 200 ||
      !result.data ||
      !result.data.timings
    ) {
      throw new Error(
        "Vakit verisi alınamadı."
      );
    }

    const timings =
      result.data.timings;

    prayerData = {
      İmsak:
        cleanTime(timings.Fajr),

      Güneş:
        cleanTime(timings.Sunrise),

      Öğle:
        cleanTime(timings.Dhuhr),

      İkindi:
        cleanTime(timings.Asr),

      Akşam:
        cleanTime(timings.Maghrib),

      Yatsı:
        cleanTime(timings.Isha)
    };

    localStorage.setItem(
      `nida-times-${state.city}`,
      JSON.stringify({
        date:
          new Date()
            .toISOString()
            .slice(0, 10),

        times: prayerData
      })
    );

    renderApiDates(
      result.data.date
    );

    renderPrayerList();
    renderNextPrayer();
    renderNotificationOptions();

  } catch (error) {
    console.error(
      "Namaz vakti hatası:",
      error
    );

    const cacheLoaded =
      loadCachedPrayerTimes();

    if (!cacheLoaded) {
      showPrayerError();
    }

    showToast(
      cacheLoaded
        ? "Son kaydedilen vakitler gösteriliyor."
        : "Namaz vakitleri alınamadı."
    );
  }
}

function loadCachedPrayerTimes() {
  const saved =
    localStorage.getItem(
      `nida-times-${state.city}`
    );

  if (!saved) {
    return false;
  }

  try {
    const parsed =
      JSON.parse(saved);

    if (!parsed.times) {
      return false;
    }

    prayerData =
      parsed.times;

    renderLocalDate();
    renderPrayerList();
    renderNextPrayer();
    renderNotificationOptions();

    return true;

  } catch (error) {
    return false;
  }
}

function showLoadingState() {
  locationLabel.textContent =
    `${state.city}, Türkiye`;

  prayerList.innerHTML = `
    <div
      style="
        padding: 26px;
        text-align: center;
        color: #69756f;
      "
    >
      Güncel vakitler alınıyor...
    </div>
  `;

  nextPrayerName.textContent =
    "Yükleniyor";

  nextPrayerTime.textContent =
    "--:--";

  countdown.textContent =
    "Lütfen bekleyin";
}

function showPrayerError() {
  prayerList.innerHTML = `
    <div
      style="
        padding: 26px;
        text-align: center;
        color: #69756f;
      "
    >
      Namaz vakitleri alınamadı.
      İnternet bağlantını kontrol et.
    </div>
  `;

  nextPrayerName.textContent =
    "Veri yok";

  nextPrayerTime.textContent =
    "--:--";

  countdown.textContent =
    "Bağlantı gerekli";
}

function renderApiDates(dateData) {
  if (
    dateData &&
    dateData.gregorian
  ) {
    const gregorian =
      dateData.gregorian;

    gregorianDate.textContent =
      `${gregorian.day} ` +
      `${gregorian.month.en} ` +
      `${gregorian.year}`;
  } else {
    renderLocalDate();
  }

  if (
    dateData &&
    dateData.hijri
  ) {
    const hijri =
      dateData.hijri;

    hijriDate.textContent =
      `${hijri.day} ` +
      `${hijri.month.tr || hijri.month.en} ` +
      `${hijri.year}`;
  } else {
    hijriDate.textContent =
      "Hicrî tarih alınamadı";
  }
}

function renderLocalDate() {
  const now =
    new Date();

  gregorianDate.textContent =
    new Intl.DateTimeFormat(
      "tr-TR",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(now);

  hijriDate.textContent =
    "Son kaydedilen vakitler";
}

function minutesFromTime(value) {
  const [hours, minutes] =
    value
      .split(":")
      .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

function getNextPrayer() {
  const entries =
    Object.entries(prayerData);

  if (entries.length === 0) {
    return null;
  }

  const now =
    new Date();

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  for (
    const [name, time]
    of entries
  ) {
    if (
      minutesFromTime(time) >
      currentMinutes
    ) {
      return {
        name,
        time,
        tomorrow: false
      };
    }
  }

  return {
    name: entries[0][0],
    time: entries[0][1],
    tomorrow: true
  };
}

function getCountdown(
  targetTime,
  tomorrow = false
) {
  const now =
    new Date();

  const [hours, minutes] =
    targetTime
      .split(":")
      .map(Number);

  const target =
    new Date(now);

  target.setHours(
    hours,
    minutes,
    0,
    0
  );

  if (
    tomorrow ||
    target <= now
  ) {
    target.setDate(
      target.getDate() + 1
    );
  }

  const difference =
    Math.max(
      0,
      target - now
    );

  const totalSeconds =
    Math.floor(
      difference / 1000
    );

  const hoursLeft =
    String(
      Math.floor(
        totalSeconds / 3600
      )
    ).padStart(2, "0");

  const minutesLeft =
    String(
      Math.floor(
        (
          totalSeconds % 3600
        ) / 60
      )
    ).padStart(2, "0");

  const secondsLeft =
    String(
      totalSeconds % 60
    ).padStart(2, "0");

  return (
    `${hoursLeft}:` +
    `${minutesLeft}:` +
    `${secondsLeft} kaldı`
  );
}

function renderPrayerList() {
  const next =
    getNextPrayer();

  if (!next) {
    return;
  }

  prayerList.innerHTML = "";

  for (
    const [name, time]
    of Object.entries(prayerData)
  ) {
    const row =
      document.createElement("div");

    row.className =
      `prayer-row ${
        name === next.name
          ? "active"
          : ""
      }`;

    const enabled =
      state.notifications[name]
      !== false;

    row.innerHTML = `
      <div class="prayer-icon">
        ${prayerIcons[name]}
      </div>

      <div class="prayer-name">
        ${name}
      </div>

      <div class="prayer-time">
        ${time}
      </div>

      <button
        class="bell-toggle"
        data-prayer="${name}"
        aria-label="${name} bildirimi"
      >
        ${enabled ? "🔔" : "🔕"}
      </button>
    `;

    prayerList.appendChild(row);
  }

  document
    .querySelectorAll(
      ".bell-toggle"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const prayer =
            button.dataset.prayer;

          state.notifications[prayer] =
            state.notifications[prayer]
            === false;

          saveNotificationSettings();

          renderPrayerList();
          renderNotificationOptions();

          const status =
            state.notifications[prayer]
            === false
              ? "kapatıldı"
              : "açıldı";

          showToast(
            `${prayer} bildirimi ${status}.`
          );
        }
      );

    });
}

function renderNextPrayer() {
  const next =
    getNextPrayer();

  if (!next) {
    return;
  }

  nextPrayerName.textContent =
    next.name;

  nextPrayerTime.textContent =
    next.time;

  countdown.textContent =
    getCountdown(
      next.time,
      next.tomorrow
    );
}

function renderNotificationOptions() {
  notificationOptions.innerHTML =
    "";

  Object
    .keys(prayerData)
    .forEach(name => {

      const enabled =
        state.notifications[name]
        !== false;

      const wrapper =
        document.createElement("label");

      wrapper.className =
        "notification-option";

      wrapper.innerHTML = `
        <span>${name}</span>

        <input
          type="checkbox"
          data-prayer="${name}"
          ${enabled ? "checked" : ""}
        >
      `;

      notificationOptions
        .appendChild(wrapper);
    });

  notificationOptions
    .querySelectorAll("input")
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          const prayer =
            input.dataset.prayer;

          state.notifications[prayer] =
            input.checked;

          saveNotificationSettings();
          renderPrayerList();
        }
      );

    });
}

function saveNotificationSettings() {
  localStorage.setItem(
    "nida-notifications",
    JSON.stringify(
      state.notifications
    )
  );
}

function showToast(message) {
  toast.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    setTimeout(
      () => {
        toast.classList.remove(
          "show"
        );
      },
      2800
    );
}

function waitForSubscription(
  OneSignal,
  timeout = 10000
) {
  return new Promise(resolve => {
    const existingId =
      OneSignal
        .User
        .PushSubscription
        .id;

    if (existingId) {
      resolve(existingId);
      return;
    }

    let finished = false;

    const finish = id => {
      if (finished) {
        return;
      }

      finished = true;

      OneSignal
        .User
        .PushSubscription
        .removeEventListener(
          "change",
          listener
        );

      resolve(id || null);
    };

    const listener = event => {
      const subscriptionId =
        event.current?.id ||
        OneSignal
          .User
          .PushSubscription
          .id;

      const token =
        event.current?.token;

      if (
        subscriptionId ||
        token
      ) {
        setTimeout(
          () => {
            finish(
              OneSignal
                .User
                .PushSubscription
                .id ||
              subscriptionId
            );
          },
          800
        );
      }
    };

    OneSignal
      .User
      .PushSubscription
      .addEventListener(
        "change",
        listener
      );

    setTimeout(
      () => {
        finish(
          OneSignal
            .User
            .PushSubscription
            .id
        );
      },
      timeout
    );
  });
}

function updateOneSignalButton() {
  window.OneSignalDeferred =
    window.OneSignalDeferred || [];

  window.OneSignalDeferred.push(
    function (OneSignal) {
      const optedIn =
        OneSignal
          .User
          .PushSubscription
          .optedIn;

      const subscriptionId =
        OneSignal
          .User
          .PushSubscription
          .id;

      if (
        optedIn &&
        subscriptionId
      ) {
        requestPermissionButton
          .textContent =
            "Bildirimler açık";
      }
    }
  );
}

document
  .getElementById(
    "changeCityButton"
  )
  .addEventListener(
    "click",
    () => {
      citySelect.value =
        state.city;

      cityDialog.showModal();
    }
  );

document
  .getElementById(
    "saveCityButton"
  )
  .addEventListener(
    "click",
    async event => {

      event.preventDefault();

      state.city =
        citySelect.value;

      localStorage.setItem(
        "nida-city",
        state.city
      );

      cityDialog.close();

      await fetchPrayerTimes();

      showToast(
        `${state.city} seçildi.`
      );
    }
  );

document
  .getElementById(
    "notificationButton"
  )
  .addEventListener(
    "click",
    () => {
      notificationDialog
        .showModal();

      updateOneSignalButton();
    }
  );

document
  .getElementById(
    "settingsButton"
  )
  .addEventListener(
    "click",
    () => {
      notificationDialog
        .showModal();

      updateOneSignalButton();
    }
  );

requestPermissionButton
  .addEventListener(
    "click",
    () => {

      window.OneSignalDeferred =
        window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(
        async function (OneSignal) {

          requestPermissionButton
            .disabled = true;

          requestPermissionButton
            .textContent =
              "Bağlanıyor...";

          try {
            const supported =
              OneSignal
                .Notifications
                .isPushSupported();

            if (!supported) {
              throw new Error(
                "Push desteklenmiyor."
              );
            }

            if (
              !OneSignal
                .Notifications
                .permission
            ) {
              await OneSignal
                .Notifications
                .requestPermission();
            }

            if (
              !OneSignal
                .Notifications
                .permission
            ) {
              throw new Error(
                "Bildirim izni verilmedi."
              );
            }

            OneSignal
              .User
              .PushSubscription
              .optIn();

            const subscriptionId =
              await waitForSubscription(
                OneSignal
              );

            const optedIn =
              OneSignal
                .User
                .PushSubscription
                .optedIn;

            console.log(
              "OneSignal abonelik kimliği:",
              subscriptionId
            );

            console.log(
              "OneSignal abonelik durumu:",
              optedIn
            );

            if (
              optedIn &&
              subscriptionId
            ) {
              requestPermissionButton
                .textContent =
                  "Bildirimler açık";

              showToast(
                "Nida bildirimlerine abone oldun."
              );
            } else {
              throw new Error(
                "Abonelik kimliği oluşmadı."
              );
            }

          } catch (error) {
            console.error(
              "OneSignal hatası:",
              error
            );

            requestPermissionButton
              .textContent =
                "Tekrar dene";

            showToast(
              "Abonelik kurulamadı. Nida'yı ana ekran simgesinden aç."
            );
          } finally {
            requestPermissionButton
              .disabled = false;
          }

        }
      );

    }
  );

document
  .getElementById(
    "qiblaButton"
  )
  .addEventListener(
    "click",
    () => {
      showToast(
        "Kıble pusulası sonraki sürümde açılacak."
      );
    }
  );

[
  "timesNav",
  "trackNav",
  "profileNav"
].forEach(id => {

  document
    .getElementById(id)
    .addEventListener(
      "click",
      () => {
        showToast(
          "Bu bölüm sonraki sürümde açılacak."
        );
      }
    );

});

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstallPrompt =
      event;

    installButton.hidden =
      false;
  }
);

installButton.addEventListener(
  "click",
  async () => {

    if (!deferredInstallPrompt) {
      showToast(
        "Safari paylaş menüsünden Ana Ekrana Ekle seçeneğini kullan."
      );

      return;
    }

    deferredInstallPrompt.prompt();

    await deferredInstallPrompt
      .userChoice;

    deferredInstallPrompt = null;

    installButton.hidden = true;
  }
);

locationLabel.textContent =
  `${state.city}, Türkiye`;

citySelect.value =
  state.city;

fetchPrayerTimes();
updateOneSignalButton();

setInterval(
  renderNextPrayer,
  1000
);