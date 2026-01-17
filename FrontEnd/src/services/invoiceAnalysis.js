const pickFromList = (items, seed) => {
  if (!items.length) return "";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000003;
  }
  return items[hash % items.length];
};

const buildDateString = (date = new Date()) => date.toISOString().slice(0, 10);

export const analyzeInvoiceImage = (file, { signal } = {}) =>
  new Promise((resolve, reject) => {
    const seed = `${file?.name ?? ""}:${file?.size ?? ""}`;
    const timeoutId = setTimeout(() => {
      resolve({
        afm: "123456789",
        series: "1",
        number: "1458",
        mark: "987654",
        project: pickFromList(["Site upgrade", "Retail refresh", "Internal tooling"], seed),
        date: buildDateString(),
        isPaid: false,
        comments: "Auto-filled from image analysis.",
        vendorName: pickFromList(["Athens Supplies SA", "Blue Harbor Ltd", "Delta Office"], seed),
        totalPrice: pickFromList(["12.50", "86.20", "240.00"], seed),
      });
    }, 1200);

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timeoutId);
          reject(new DOMException("Analysis aborted", "AbortError"));
        },
        { once: true }
      );
    }
  });
