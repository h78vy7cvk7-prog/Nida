const prayerData = {
  İstanbul: {
    İmsak: "04:12",
    Güneş: "05:55",
    Öğle: "13:16",
    İkindi: "17:08",
    Akşam: "20:27",
    Yatsı: "22:03"
  },

  Ankara: {
    İmsak: "04:05",
    Güneş: "05:46",
    Öğle: "13:00",
    İkindi: "16:50",
    Akşam: "20:09",
    Yatsı: "21:43"
  },

  İzmir: {
    İmsak: "04:35",
    Güneş: "06:13",
    Öğle: "13:23",
    İkindi: "17:10",
    Akşam: "20:31",
    Yatsı: "22:02"
  },

  Elazığ: {
    İmsak: "03:43",
    Güneş: "05:26",
    Öğle: "12:39",
    İkindi: "16:30",
    Akşam: "19:49",
    Yatsı: "21:24"
  },

  Bingöl: {
    İmsak: "03:36",
    Güneş: "05:19",
    Öğle: "12:34",
    İkindi: "16:25",
    Akşam: "19:45",
    Yatsı: "21:20"
  },

  Diyarbakır: {
    İmsak: "03:41",
    Güneş: "05:23",
    Öğle: "12:35",
    İkindi: "16:25",
    Akşam: "19:44",
    Yatsı: "21:18"
  },

  Bursa: {
    İmsak: "04:16",
    Güneş: "05:58",
    Öğle: "13:14",
    İkindi: "17:05",
    Akşam: "20:24",
    Yatsı: "21:59"
  },

  Antalya: {
    İmsak: "04:20",
    Güneş: "05:56",
    Öğle: "13:06",
    İkindi: "16:52",
    Akşam: "20:10",
    Yatsı: "21:39"
  }
};

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
    "İstanbul",

  notifications:
    JSON.parse(
      localStorage.getItem(
        "nida-notifications"
      ) || "{}"
    )
};

const locationLabel =
  document.getElementById(
    "locationLabel"
  );

const prayerList =
  document.getElementById(
    "prayerList"
  );

const nextPrayerName =
  document.getElementById(
    "nextPrayerName"
  );

const nextPrayerTime =
  document.getElementById(
    "nextPrayerTime"
  );

const countdown =
  document.getElementById(
    "countdown"
  );

const gregorianDate =
  document.getElementById(
    "gregorianDate"
  );

const hijriDate =
  document.getElementById(
    "hijriDate"
  );

const cityDialog =
  document.getElementById(
    "cityDialog"
  );

const citySelect =
  document.getElementById(
    "citySelect"
  );

const notificationDialog =
  document.getElementById(
    "notificationDialog"
  );

const notificationOptions =
  document.getElementById(
    "notificationOptions"
  );

const toast =
  document.getElementById(
    "toast"
  );

const installButton =
  document.getElementById(
    "installButton"
  );

let deferredInstallPrompt = null;

function minutesFromTime(value) {
  const [hours, minutes] =
    value
      .split(":")
      .map(Number);

  return hours * 60 + minutes;
}

function getNextPrayer() {
  const now = new Date();

  const nowMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const entries =
    Object.entries(
      prayerData[state.city]
    );

  for (const [name, time] of entries) {

    if (
      minutesFromTime(time) >
      nowMinutes
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
  const now = new Date();

  const [hours, minutes] =
    targetTime
      .split(":")
      .map(Number);

  const target = new Date(now);

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
        (totalSeconds % 3600) / 60
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

function renderDates() {
  const now = new Date();

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
    "Hicrî tarih desteği sonraki sürümde";
}

function renderPrayerList() {
  const next =
    getNextPrayer();

  prayerList.innerHTML = "";

  const cityPrayerTimes =
    Object.entries(
      prayerData[state.city]
    );

  for (
    const [name, time]
    of cityPrayerTimes
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
      state.notifications[name] !== false;

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

  const bellButtons =
    document.querySelectorAll(
      ".bell-toggle"
    );

  bellButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const prayer =
          button.dataset.prayer;

        state.notifications[prayer] =
          state.notifications[prayer] === false;

        localStorage.setItem(
          "nida-notifications",
          JSON.stringify(
            state.notifications
          )
        );

        renderPrayerList();
        renderNotificationOptions();

        const status =
          state.notifications[prayer] === false
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
  notificationOptions.innerHTML = "";

  const prayers =
    Object.keys(
      prayerData[state.city]
    );

  prayers.forEach(name => {

    const enabled =
      state.notifications[name] !== false;

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

    notificationOptions.appendChild(
      wrapper
    );
  });

  const inputs =
    notificationOptions
      .querySelectorAll("input");

  inputs.forEach(input => {

    input.addEventListener(
      "change",
      () => {

        const prayer =
          input.dataset.prayer;

        state.notifications[prayer] =
          input.checked;

        localStorage.setItem(
          "nida-notifications",
          JSON.stringify(
            state.notifications
          )
        );

        renderPrayerList();
      }
    );

  });
}

function showToast(message) {
  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    setTimeout(
      () => {
        toast.classList.remove("show");
      },
      2200
    );
}

function renderAll() {
  locationLabel.textContent =
    `${state.city}, Türkiye`;

  citySelect.value =
    state.city;

  renderDates();
  renderPrayerList();
  renderNextPrayer();
  renderNotificationOptions();
}

document
  .getElementById(
    "changeCityButton"
  )
  .addEventListener(
    "click",
    () => {
      cityDialog.showModal();
    }
  );

document
  .getElementById(
    "saveCityButton"
  )
  .addEventListener(
    "click",
    event => {

      event.preventDefault();

      state.city =
        citySelect.value;

      localStorage.setItem(
        "nida-city",
        state.city
      );

      cityDialog.close();

      renderAll();

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
      notificationDialog.showModal();
    }
  );

document
  .getElementById(
    "requestPermissionButton"
  )
  .addEventListener(
    "click",
    async () => {

      if (
        !("Notification" in window)
      ) {
        showToast(
          "Bu tarayıcı bildirimleri desteklemiyor."
        );

        return;
      }

      const permission =
        await Notification
          .requestPermission();

      if (
        permission === "granted"
      ) {
        showToast(
          "Bildirim izni verildi."
        );
      } else {
        showToast(
          "Bildirim izni verilmedi."
        );
      }
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
        "Kıble pusulası ikinci sürümde eklenecek."
      );
    }
  );

document
  .getElementById(
    "settingsButton"
  )
  .addEventListener(
    "click",
    () => {
      notificationDialog.showModal();
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

    if (
      !deferredInstallPrompt
    ) {
      showToast(
        "Safari menüsünden Ana Ekrana Ekle seçeneğini kullan."
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

if (
  "serviceWorker" in navigator
) {
  window.addEventListener(
    "load",
    () => {

      navigator
        .serviceWorker
        .register(
          "service-worker.js"
        )
        .catch(error => {
          console.error(
            "Service worker hatası:",
            error
          );
        });

    }
  );
}

renderAll();

setInterval(
  renderNextPrayer,
  1000
);