const bookingForm = document.getElementById("booking-form");
const bookingMessage = document.getElementById("booking-message");
const bookingDate = document.getElementById("date");
const classTypeSelect = document.getElementById("class-type");

// IDE KELL MAJD A GOOGLE APPS SCRIPT WEB APP URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTCboZRvWVd0TsDKg0tAkYY3iB4pveOGNasGwt3JVvlVy9abcHYxtIhCJE6_P2lzVOGQ/exec";


// --------------------------------------------------
// 1. Múltbeli dátumok tiltása
// --------------------------------------------------

if (bookingDate) {
  const today = new Date();

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  bookingDate.min = `${yyyy}-${mm}-${dd}`;
}


// --------------------------------------------------
// 2. A főoldalon kiválasztott óra automatikus betöltése
// --------------------------------------------------

if (classTypeSelect) {
  const params = new URLSearchParams(window.location.search);
  const requestedClass = params.get("class");

  if (requestedClass) {
    const optionExists = Array.from(classTypeSelect.options).some(
      (option) => option.value === requestedClass
    );

    if (optionExists) {
      classTypeSelect.value = requestedClass;
    }
  }
}


// --------------------------------------------------
// 3. Jelentkezési űrlap elküldése
// --------------------------------------------------

if (bookingForm && bookingMessage) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // HTML validáció ellenőrzése
    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    // A meglévő HTML mezők adatainak kiolvasása
    const originalFormData = new FormData(bookingForm);

    const name = originalFormData.get("nev");
    const email = originalFormData.get("email");
    const phone = originalFormData.get("telefon");
    const classType = originalFormData.get("class-type");
    const date = originalFormData.get("datum");
    const time = originalFormData.get("idopont");
    const message = originalFormData.get("megjegyzes");

    // Az Apps Script által várt mezőnevek összeállítása
    const formData = new FormData();

    formData.append("nev", name);
    formData.append("email", email);
    formData.append("telefon", phone);
    formData.append("ora", classType);
    formData.append("datum", date);
    formData.append("idopont", time);
    formData.append("megjegyzes", message || "");

    // Küldés alatt visszajelzés
    bookingMessage.textContent = "A jelentkezés elküldése folyamatban...";
    bookingMessage.classList.add("show");

    const submitButton = bookingForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const result = (await response.text()).trim();

      // ----------------------------------------------
      // Sikeres foglalás
      // ----------------------------------------------

      if (result === "success") {
        const formattedDate = new Intl.DateTimeFormat("hu-HU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(`${date}T12:00:00`));

        bookingMessage.textContent =
          `${name}, köszönjük! ` +
          `A jelentkezésedet rögzítettük a(z) ${classType} órára: ` +
          `${formattedDate}, ${time}. ` +
          `A visszaigazoló e-mailt elküldtük a megadott e-mail címre.`;

        bookingForm.reset();
      }

      // ----------------------------------------------
      // Betelt az óra
      // ----------------------------------------------

      else if (result === "full") {
        bookingMessage.textContent =
          "Sajnáljuk, erre az órára már betelt minden hely. " +
          "Kérjük, válassz másik időpontot.";
      }

      // ----------------------------------------------
      // Az óra nincs az Órák táblázatban
      // ----------------------------------------------

      else if (result === "not_found") {
        bookingMessage.textContent =
          "A kiválasztott óra vagy időpont nem található. " +
          "Kérjük, ellenőrizd a megadott adatokat.";
      }

      // ----------------------------------------------
      // Ismeretlen válasz
      // ----------------------------------------------

      else {
        bookingMessage.textContent =
          "A jelentkezés feldolgozása során hiba történt. " +
          "Kérjük, próbáld újra.";
      }
    } catch (error) {
      console.error("Hiba a jelentkezés elküldésekor:", error);

      bookingMessage.textContent =
        "Nem sikerült elküldeni a jelentkezést. " +
        "Kérjük, próbáld újra később.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }

      bookingMessage.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
}