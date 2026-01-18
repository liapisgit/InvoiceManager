import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "el";
  const stored = window.localStorage.getItem("lang");
  return stored || "el";
};

i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: "el",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    el: {
      translation: {
        app: {
          title: "INVOICE MANAGER",
          subtitle: "Συμπλήρωση και επαλήθευση τιμολογίων.",
          invoices: "Τιμολόγια",
          entries_one: "{{count}} καταχώρηση",
          entries_other: "{{count}} καταχωρήσεις",
          addInvoice: "Προσθήκη τιμολογίου",
          completeReview: "Ολοκλήρωση ελέγχου",
          success: "Η καταχώρηση των τιμολογίων ολοκληρώθηκε επιτυχώς.",
          language: "Γλώσσα",
        },
        invoice: {
          title: "Τιμολόγιο #{{index}}",
          hint: "Συμπλήρωσε όλα τα στοιχεία για να ολοκληρώσεις.",
          remove: "Αφαίρεση τιμολογίου",
          removeConfirm: "Θες σίγουρα να αφαιρέσεις αυτό το τιμολόγιο;",
        },
        fields: {
          afm: "ΑΦΜ",
          invoice_series: "Σειρά",
          invoice_number: "Αριθμός",
          mark: "MARK",
          project: "Έργο",
          invoice_date: "Ημερομηνία",
          isPaid: "Εξοφλημένο",
          comments: "Σχόλια",
          vendor_name: "Προμηθευτής",
          total_amount: "Σύνολο",
          receipt: "Απόδειξη",
        },
        file: {
          label: "Απόδειξη",
          helperText: "Σύρε ή πάτησε για να ανεβάσεις απόδειξη.",
          emptyTitle: "Ανέβασε απόδειξη",
          activeTitle: "Άφησε την εικόνα εδώ",
          replace: "Αντικατάσταση",
          dragReplace: "Σύρε μια άλλη εικόνα για αντικατάσταση.",
          unsupported: "Μη υποστηριζόμενο αρχείο ή πολύ μεγάλο.",
          reading: "Ανάγνωση…",
        },
        analysis: {
          running: "Ανάλυση εικόνας τιμολογίου...",
          complete: "Η ανάλυση ολοκληρώθηκε. Έλεγξε τα πεδία.",
          failed: "Η ανάλυση απέτυχε. Συμπλήρωσε τα στοιχεία χειροκίνητα.",
        },
        validation: {
          required: "Υποχρεωτικό πεδίο.",
          numbersOnly: "Μόνο αριθμοί.",
          afmLength: "Το ΑΦΜ πρέπει να έχει 9 ψηφία.",
          money: "Μη έγκυρο ποσό (π.χ. 12.50).",
          uploadReceipt: "Ανέβασε εικόνα απόδειξης.",
          checkbox: "Υποχρεωτικό πεδίο.",
        },
      },
    },
    en: {
      translation: {
        app: {
          title: "INVOICE MANAGER",
          subtitle: "Fill in and review your invoices.",
          invoices: "Invoices",
          entries_one: "{{count}} entry",
          entries_other: "{{count}} entries",
          addInvoice: "Add invoice",
          completeReview: "Complete review",
          success: "Submission completed successfully.",
          language: "Language",
        },
        invoice: {
          title: "Invoice #{{index}}",
          hint: "Complete all fields to finish the review.",
          remove: "Remove invoice",
          removeConfirm: "Remove this invoice?",
        },
        fields: {
          afm: "Tax ID",
          invoice_series: "Series",
          invoice_number: "Number",
          mark: "MARK",
          project: "Project",
          invoice_date: "Date",
          isPaid: "Paid",
          comments: "Comments",
          vendor_name: "Vendor",
          total_amount: "Total",
          receipt: "Receipt",
        },
        file: {
          label: "Receipt",
          helperText: "Drag or click to upload a receipt.",
          emptyTitle: "Upload receipt",
          activeTitle: "Drop the image here",
          replace: "Replace",
          dragReplace: "Drag another image here to replace.",
          unsupported: "Unsupported file or too large.",
          reading: "Reading…",
        },
        analysis: {
          running: "Analyzing invoice image...",
          complete: "Analysis complete. Review the fields below.",
          failed: "Analysis failed. Please enter details manually.",
        },
        validation: {
          required: "Required field.",
          numbersOnly: "Numbers only.",
          afmLength: "Tax ID must have 9 digits.",
          money: "Invalid amount (e.g. 12.50).",
          uploadReceipt: "Upload a receipt image.",
          checkbox: "Required field.",
        },
      },
    },
  },
});

export default i18n;
