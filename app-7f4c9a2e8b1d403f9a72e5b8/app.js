const MAX_BASE_PAX = 99;
const DEFAULTS = {
  basePax: 2,
  additionalPax: 4,
  weekendRate: 5406,
  weekdayRate: 4076,
  additionalRate: 4000,
  depositPercent: 50
};

const state = { ...DEFAULTS };
const currency = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });
const settingsDialog = document.querySelector("#settings-dialog");
const posterSelect = document.querySelector("#poster-select");
const settingsButton = document.querySelector("#settings-button");
const previewButton = document.querySelector("#preview-button");
const previewLabel = document.querySelector("#preview-label");
const downloadButton = document.querySelector("#download-button");
const packageTitle = document.querySelector(".package-title");
const packagesOption = posterSelect.querySelector('option[value="packages"]');

const settingInputs = {
  basePax: document.querySelector("#base-pax-setting"),
  additionalPax: document.querySelector("#additional-pax-setting"),
  weekendRate: document.querySelector("#weekend-rate-setting"),
  weekdayRate: document.querySelector("#weekday-rate-setting"),
  additionalRate: document.querySelector("#additional-rate-setting"),
  depositPercent: document.querySelector("#deposit-percent-setting")
};

function formatted(value) {
  return currency.format(Math.max(0, Math.round(Number(value) || 0)));
}

function additionalPax() {
  return state.additionalPax;
}

function getTotals() {
  return {
    weekend: state.weekendRate + state.additionalRate,
    weekday: state.weekdayRate + state.additionalRate
  };
}

function sizePaxInput(input, count) {
  const digits = String(count).length;
  const inputWidth = `${Math.max(0.9, digits * 0.72)}em`;
  input.style.width = inputWidth;
  input.style.minWidth = inputWidth;
  input.style.flexBasis = inputWidth;
  input.style.fontSize = `${Math.max(0.58, 1 - (digits - 1) * 0.14)}em`;

  const defaultScale = input.closest(".weekend-fields") ? 0.9 : 0.78;
  const scale = Math.max(0.46, defaultScale / (1 + (digits - 1) * 0.14));
  input.parentElement.style.setProperty("--pax-scale", scale);
}

function updateValueInputs() {
  document.querySelectorAll('.poster-fields [data-setting="basePax"]').forEach((input) => {
    if (input !== document.activeElement) input.value = state.basePax;
    sizePaxInput(input, state.basePax);
  });
  document.querySelectorAll('.poster-fields [data-setting="weekendRate"]').forEach((input) => {
    if (input !== document.activeElement) input.value = formatted(state.weekendRate);
  });
  document.querySelectorAll('.poster-fields [data-setting="weekdayRate"]').forEach((input) => {
    if (input !== document.activeElement) input.value = formatted(state.weekdayRate);
  });
  document.querySelectorAll('.poster-fields [data-setting="additionalRate"]').forEach((input) => {
    if (input !== document.activeElement) input.value = formatted(state.additionalRate);
  });
  document.querySelectorAll('.poster-fields [data-setting="depositPercent"]').forEach((input) => {
    if (input !== document.activeElement) input.value = `${state.depositPercent}%`;
  });
  document.querySelectorAll('.poster-fields [data-setting="additionalPax"]').forEach((input) => {
    if (input !== document.activeElement) input.value = additionalPax();
    sizePaxInput(input, additionalPax());
  });

  [
    ["weekendRate", state.weekendRate],
    ["weekdayRate", state.weekdayRate],
    ["additionalRate", state.additionalRate]
  ].forEach(([key, value]) => {
    const digits = String(Math.round(Number(value) || 0)).length;
    document.querySelectorAll(`.poster-fields [data-setting="${key}"]`).forEach((input) => {
      input.parentElement.classList.toggle("long-price", digits >= 5 && digits < 6);
      input.parentElement.classList.toggle("extra-long-price", digits >= 6);
      input.parentElement.classList.toggle("ultra-long-price", digits >= 7);
      input.parentElement.classList.toggle("mega-long-price", digits >= 8);
      input.style.width = `${Math.max(3.4, formatted(value).length * 0.68)}em`;
      input.style.flex = "0 0 auto";
    });
  });

  const weekendRateDigits = String(Math.round(Number(state.weekendRate) || 0)).length;
  const additionalRateDigits = String(Math.round(Number(state.additionalRate) || 0)).length;
  document.querySelector(".weekend-base-rate").classList.toggle("long-price", weekendRateDigits >= 5 && weekendRateDigits < 6);
  document.querySelector(".weekend-base-rate").classList.toggle("extra-long-price", weekendRateDigits >= 6);
  document.querySelector(".weekend-base-rate").classList.toggle("ultra-long-price", weekendRateDigits >= 7);
  document.querySelector(".weekend-base-rate").classList.toggle("mega-long-price", weekendRateDigits >= 8);
  document.querySelector(".weekend-add-rate").classList.toggle("long-price", additionalRateDigits >= 5 && additionalRateDigits < 6);
  document.querySelector(".weekend-add-rate").classList.toggle("extra-long-price", additionalRateDigits >= 6);
  document.querySelector(".weekend-add-rate").classList.toggle("ultra-long-price", additionalRateDigits >= 7);
  document.querySelector(".weekend-add-rate").classList.toggle("mega-long-price", additionalRateDigits >= 8);
}

function updatePosters() {
  const totals = getTotals();
  document.querySelector(".weekend-total").textContent = `₱${formatted(totals.weekend)}`;
  document.querySelector(".weekday-total").textContent = `₱${formatted(totals.weekday)}`;
  document.querySelector(".weekend-total-value").textContent = `₱${formatted(totals.weekend)}`;
  document.querySelector(".weekend-deposit-value").textContent =
    `₱${formatted(totals.weekend * state.depositPercent / 100)}`;
  document.querySelector("#additional-count-note").textContent =
    `${additionalPax()} additional ${additionalPax() === 1 ? "guest" : "guests"}`;

  Object.entries(settingInputs).forEach(([key, input]) => {
    if (input !== document.activeElement) input.value = state[key];
  });
  const packagePax = state.basePax + state.additionalPax;
  if (!packageTitle.dataset.customized && packageTitle !== document.activeElement) {
    packageTitle.value = `${packagePax} Pax Package`;
  }
  packagesOption.textContent = `${packagePax} Pax Package`;
  updateValueInputs();
}

function numericValue(rawValue) {
  const value = Number(String(rawValue).replace(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function setSetting(key, rawValue) {
  const parsed = numericValue(rawValue);
  if (parsed === null) return;

  if (key === "basePax") {
    state.basePax = Math.min(MAX_BASE_PAX, Math.max(1, Math.round(parsed)));
  } else if (key === "additionalPax") {
    state.additionalPax = Math.max(0, Math.round(parsed));
  } else if (key === "depositPercent") {
    state.depositPercent = Math.min(99, Math.max(0, parsed));
  } else {
    state[key] = Math.max(0, parsed);
  }
  updatePosters();
  if (key === "depositPercent" && parsed > 99) {
    settingInputs.depositPercent.value = state.depositPercent;
    document.querySelectorAll('.poster-fields [data-setting="depositPercent"]').forEach((input) => {
      input.value = `${state.depositPercent}%`;
    });
  }
}

packageTitle.addEventListener("input", () => {
  packageTitle.dataset.customized = "true";
  packagesOption.textContent = `${state.basePax + state.additionalPax} Pax Package`;
});

async function downloadPoster() {
  const isSafari = /^((?!chrome|chromium|android|crios|fxios|edg|opr).)*safari/i.test(navigator.userAgent);
  const safariPreview = isSafari ? window.open("about:blank", "_blank") : null;
  const isPackages = posterSelect.value === "packages";
  const poster = document.querySelector(isPackages ? "#packages-poster" : "#weekend-poster");
  const background = poster.querySelector(".poster-background");
  const posterBounds = poster.getBoundingClientRect();
  if (typeof background.decode === "function") {
    await background.decode();
  } else if (!background.complete) {
    await new Promise((resolve, reject) => {
      background.addEventListener("load", resolve, { once: true });
      background.addEventListener("error", reject, { once: true });
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = background.naturalWidth;
  canvas.height = background.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a canvas to export the poster.");
  ctx.drawImage(background, 0, 0);

  const scaleX = canvas.width / posterBounds.width;
  const scaleY = canvas.height / posterBounds.height;
  poster.querySelectorAll(".package-title-mask").forEach((mask) => {
    const bounds = mask.getBoundingClientRect();
    const maskStyle = getComputedStyle(mask);
    const path = maskStyle.clipPath.match(/^polygon\((.*)\)$/);
    if (!path) return;
    const points = path[1].split(",").map((point) => {
      const [xPercent, yPercent] = point.trim().split(/\s+/).map((value) => Number.parseFloat(value) / 100);
      return {
        x: (bounds.left - posterBounds.left + bounds.width * xPercent) * scaleX,
        y: (bounds.top - posterBounds.top + bounds.height * yPercent) * scaleY
      };
    });
    if (points.length < 3) return;
    const gradient = ctx.createLinearGradient(0, bounds.top * scaleY, 0, bounds.bottom * scaleY);
    gradient.addColorStop(0, "#865321");
    gradient.addColorStop(0.42, "#754313");
    gradient.addColorStop(1, "#804a16");
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  });

  const exportTargets = poster.querySelectorAll(
    ".poster-fields input, .poster-fields .pax-value > span, .poster-fields .money-value > span, " +
    ".weekend-total, .weekday-total, .weekend-total-value, .weekend-deposit-value"
  );

  exportTargets.forEach((element) => {
    const text = element instanceof HTMLInputElement ? element.value : element.textContent;
    if (!text || !text.trim()) return;

    const bounds = element.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const style = getComputedStyle(element);
    const left = (bounds.left - posterBounds.left) * scaleX;
    const top = (bounds.top - posterBounds.top) * scaleY;
    const width = bounds.width * scaleX;
    const height = bounds.height * scaleY;
    const paxLabel = element.closest(".pax-value");
    const paxTransform = paxLabel ? getComputedStyle(paxLabel).transform : "none";
    const transformMatch = paxTransform.match(/^matrix\(([^,]+)/);
    const horizontalScale = transformMatch ? Number(transformMatch[1]) : 1;
    const centeredFlex = style.justifyContent === "center";

    ctx.save();
    ctx.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${parseFloat(style.fontSize) * scaleY}px ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.textBaseline = "middle";
    ctx.textAlign = centeredFlex || style.textAlign === "center"
      ? "center"
      : style.textAlign === "right"
        ? "right"
        : "left";
    const x = ctx.textAlign === "right"
      ? left + width
      : ctx.textAlign === "center"
        ? left + width / 2
        : left;
    ctx.translate(x, top + height / 2);
    ctx.scale(horizontalScale, 1);
    ctx.fillText(text.trim(), 0, 0);
    ctx.restore();
  });

  const blob = await new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function") {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        if (safariPreview) {
          safariPreview.location.href = dataUrl;
        } else {
          const fallbackLink = document.createElement("a");
          fallbackLink.download = isPackages
            ? "caza-peregrine-6-pax-packages.png"
            : "caza-peregrine-weekend-package.png";
          fallbackLink.href = dataUrl;
          fallbackLink.click();
        }
        resolve(null);
      } catch (error) {
        reject(error);
      }
      return;
    }
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("The browser could not create the poster image."));
    }, "image/png");
  });
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  if (safariPreview) {
    safariPreview.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const link = document.createElement("a");
  link.download = isPackages ? "caza-peregrine-6-pax-packages.png" : "caza-peregrine-weekend-package.png";
  link.href = url;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

document.querySelectorAll("[data-setting]").forEach((input) => {
  input.addEventListener("input", () => setSetting(input.dataset.setting, input.value));
  input.addEventListener("blur", updateValueInputs);
});

document.querySelector("#reset-button").addEventListener("click", () => {
  Object.assign(state, DEFAULTS);
  delete packageTitle.dataset.customized;
  updatePosters();
});

settingsButton.addEventListener("click", () => settingsDialog.showModal());

previewButton.addEventListener("click", () => {
  const isPreview = document.body.classList.toggle("preview-mode");
  previewLabel.textContent = isPreview ? "Edit" : "Preview";
  previewButton.setAttribute("aria-label", isPreview ? "Return to editing mode" : "Switch to preview mode");
  document.querySelectorAll(".poster-fields input[data-setting]").forEach((input) => {
    input.readOnly = isPreview;
  });
});

posterSelect.addEventListener("change", () => {
  const showPackages = posterSelect.value === "packages";
  document.querySelector("#packages-poster").classList.toggle("is-hidden", !showPackages);
  document.querySelector("#weekend-poster").classList.toggle("is-hidden", showPackages);
});

downloadButton.addEventListener("click", () => {
  downloadPoster().catch((error) => {
    console.error("Could not download the poster.", error);
    window.alert("The poster could not be downloaded. Please try again.");
  });
});

updatePosters();
