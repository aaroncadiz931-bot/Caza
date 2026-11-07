const CAPACITY = 6;
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

function updateValueInputs() {
  document.querySelectorAll('.poster-fields [data-setting="basePax"]').forEach((input) => {
    if (input !== document.activeElement) input.value = state.basePax;
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
  document.querySelectorAll('[data-derived="additionalPax"]').forEach((input) => {
    input.value = additionalPax();
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
    });
  });

  const weekendRateDigits = String(Math.round(Number(state.weekendRate) || 0)).length;
  const additionalRateDigits = String(Math.round(Number(state.additionalRate) || 0)).length;
  document.querySelector(".weekend-base-rate").classList.toggle("long-price", weekendRateDigits >= 5 && weekendRateDigits < 6);
  document.querySelector(".weekend-base-rate").classList.toggle("extra-long-price", weekendRateDigits >= 6);
  document.querySelector(".weekend-add-rate").classList.toggle("long-price", additionalRateDigits >= 5 && additionalRateDigits < 6);
  document.querySelector(".weekend-add-rate").classList.toggle("extra-long-price", additionalRateDigits >= 6);
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
    state.basePax = Math.min(CAPACITY, Math.max(1, Math.round(parsed)));
    state.additionalPax = CAPACITY - state.basePax;
  } else if (key === "additionalPax") {
    state.additionalPax = Math.min(CAPACITY - 1, Math.max(0, Math.round(parsed)));
    state.basePax = CAPACITY - state.additionalPax;
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

function drawText(ctx, text, x, y, {
  font,
  color = "#3e1c0c",
  align = "left",
  baseline = "middle"
}) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

function drawPaxLabel(ctx, x, y, count, additional, fontSize, align = "center", horizontalScale = 1) {
  const labelWeight = additional ? 600 : 700;
  const labelFont = `${labelWeight} ${fontSize}px "Arial Rounded MT Bold", Arial, sans-serif`;
  const numberFont = `700 ${fontSize}px "Goudy Old Style", Goudy, Georgia, "Times New Roman", serif`;
  const prefix = additional ? "ADD " : "";
  const suffix = " PAX";
  ctx.font = labelFont;
  const prefixWidth = ctx.measureText(prefix).width;
  const suffixWidth = ctx.measureText(suffix).width;
  ctx.font = numberFont;
  const numberWidth = ctx.measureText(String(count)).width;
  const textWidth = prefixWidth + numberWidth + suffixWidth;
  const startX = align === "center" ? x - textWidth * horizontalScale / 2 : x;
  ctx.save();
  ctx.translate(startX, y);
  ctx.scale(horizontalScale, 1);
  drawText(ctx, prefix, 0, 0, { font: labelFont, align: "left" });
  drawText(ctx, String(count), prefixWidth, 0, { font: numberFont, align: "left" });
  drawText(ctx, suffix, prefixWidth + numberWidth, 0, { font: labelFont, align: "left" });
  ctx.restore();
}

function drawMoney(ctx, value, x, y, fontSize, align = "right", color = "#3e1c0c") {
  drawText(ctx, `₱${formatted(value)}`, x, y, {
    font: `700 ${fontSize}px Georgia, "Times New Roman", serif`,
    align,
    color
  });
}

async function downloadPoster() {
  const isPackages = posterSelect.value === "packages";
  const image = new Image();
  image.src = isPackages
    ? "assets/images/background_6PaxPackages.png"
    : "assets/images/background_weekendPackage.png";
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a canvas to export the poster.");
  ctx.drawImage(image, 0, 0);

  const w = canvas.width;
  const h = canvas.height;
  const totals = getTotals();

  if (isPackages) {
    const rows = [
      { top: 0.437, left: 0.073, width: 0.387, paxLeft: 0.145, topRate: state.weekendRate },
      { top: 0.485, left: 0.073, width: 0.387, paxLeft: 0.145, topRate: state.additionalRate, additional: true },
      { top: 0.437, left: 0.523, width: 0.387, paxLeft: 0.073, topRate: state.weekdayRate },
      { top: 0.485, left: 0.523, width: 0.387, paxLeft: 0.073, topRate: state.additionalRate, additional: true }
    ];

    rows.forEach((row) => {
      const rowX = row.left * w;
      const rowY = row.top * h + 0.0112 * h;
      const paxX = rowX + row.paxLeft * w;
      drawPaxLabel(ctx, paxX, rowY, row.additional ? additionalPax() : state.basePax, row.additional, 0.027 * w, "left", 0.78);
      const priceRight = rowX + row.width * w + (row.left > 0.5 ? 0.03 * w : 0);
      drawMoney(ctx, row.topRate, priceRight, rowY, 0.0342 * w);
    });

    drawMoney(ctx, totals.weekend, 0.268 * w, 0.581 * h, 0.063 * w, "center");
    drawMoney(ctx, totals.weekday, 0.748 * w, 0.581 * h, 0.063 * w, "center");
    drawText(ctx, `${state.depositPercent}%`, 0.58 * w, 0.65 * h, {
      font: `700 ${0.036 * w}px Georgia, "Times New Roman", serif`,
      color: "#fff6df",
      align: "center"
    });
  } else {
    drawPaxLabel(ctx, 0.355 * w, 0.4265 * h, state.basePax, false, 0.036 * w, "center", 0.9);
    drawPaxLabel(ctx, 0.78 * w, 0.4265 * h, additionalPax(), true, 0.036 * w, "center", 0.9);
    drawMoney(ctx, state.weekendRate, 0.265 * w, 0.4635 * h, 0.061 * w, "center");
    drawMoney(ctx, state.additionalRate, 0.735 * w, 0.4635 * h, 0.061 * w, "center");
    drawMoney(ctx, totals.weekend, 0.5 * w, 0.542 * h, 0.084 * w, "center", "#fff6e3");
    drawMoney(ctx, totals.weekend * state.depositPercent / 100, 0.5 * w, 0.6325 * h, 0.052 * w, "center");
  }

  const link = document.createElement("a");
  link.download = isPackages ? "caza-peregrine-6-pax-packages.png" : "caza-peregrine-weekend-package.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

document.querySelectorAll("[data-setting]").forEach((input) => {
  input.addEventListener("input", () => setSetting(input.dataset.setting, input.value));
  input.addEventListener("blur", updateValueInputs);
});

document.querySelectorAll("[data-derived]").forEach((input) => {
  input.addEventListener("input", updateValueInputs);
});

document.querySelector("#reset-button").addEventListener("click", () => {
  Object.assign(state, DEFAULTS);
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
