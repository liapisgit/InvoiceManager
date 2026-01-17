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
          title: "Εφαρμογή Διαχείρησης Τιμολογίων",
          subtitle: "Συμπλήρωση και επαλήθευση τιμολογίων.",
          invoices: "Λίστα Τιμολογίων",
          entries_one: "{{count}} καταχώρηση",
          entries_other: "{{count}} καταχωρήσεις",
          addInvoice: "Προσθηκη τιμολογιου",
          completeReview: "Ολοκληρωση ελεγχου",
          success: "Η καταχώρηση των τιμολόγιων ολοκληρώθηκε επιτυχώς.",
          language: "Γλώσσα",
        },
        invoice: {
          title: "Τιμολόγιο #{{index}}",
          hint: "Συμπλήρωσε όλα τα στοιχεία για να ολοκληρώσεις.",
        },
        fields: {
          afm: "ΑΦΜ",
          series: "Σειρά",
          number: "Αριθμός",
          mark: "MARK",
          project: "Έργο",
          date: "Ημερομηνία",
          isPaid: "Εξοφλημένο",
          comments: "Σχόλια",
          vendorName: "Προμηθευτής",
          totalPrice: "Σύνολο",
          receipt: "Απόδειξη",
        },
        file: {
          label: "Απόδειξη",
          helperText: "Ανέβασε μια καθαρή φωτογραφία.",
          emptyTitle: "Ανέβασε απόδειξη",
          activeTitle: "Άφησε την εικόνα εδώ",
          replace: "Αντικατάσταση",
          browse: "Επιλογη αρχειου",
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
          title: "Invoice Manager",
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
        },
        fields: {
          afm: "Tax ID",
          series: "Series",
          number: "Number",
          mark: "MARK",
          project: "Project",
          date: "Date",
          isPaid: "Paid",
          comments: "Comments",
          vendorName: "Vendor",
          totalPrice: "Total",
          receipt: "Receipt",
        },
        file: {
          label: "Receipt",
          helperText: "Upload a clear receipt photo.",
          emptyTitle: "Upload receipt",
          activeTitle: "Drop the image here",
          replace: "Replace",
          browse: "Browse files",
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
