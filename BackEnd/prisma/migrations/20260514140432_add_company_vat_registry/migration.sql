CREATE TABLE public."CompanyVatRegistry" (
  vat_number text PRIMARY KEY,
  company_name text NOT NULL,
  source text DEFAULT 'auto',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

INSERT INTO public."CompanyVatRegistry" (vat_number, company_name, source)
VALUES
('801792430', 'THE OLON DEVELOPMENTS ΜΟΝΟΠΡΟΣΩΠΗ IKE', 'manual'),
('801227857', 'THE OLON HOSPITALITY IKE', 'manual'),
('802416678', 'A15 HOTEL VENTURES IKE', 'manual'),
('094116463', 'Ο ΛΥΡΑΣ ΞΕΝΟΔΟΧΕΙΑΚΑΙ ΚΑΙ ΕΜΠΟΡΙΚΑΙ ΕΠΙΧΕΙΡΗΣΕΙΣ ΑΝΩΝΥΜΟΣ ΕΤΑΙΡΕΙΑ', 'manual'),
('996611924', 'VOLUSPA', 'manual'),
('802209794', 'AIOLOU HUB', 'manual'),
('802323148', 'LAGONISI VENTURES', 'manual'),
('802376897', 'HERITAGE VENTURES', 'manual'),
('802231518', 'ALAMANAS ONE ΙΚΕ', 'manual'),
('801558740', 'HOT ΜΟΝΟΠΡΟΣΩΠΗ ΙΚΕ', 'manual');
