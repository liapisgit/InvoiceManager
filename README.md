1. Multiple invoice Files
2. Add the following fields: 
ΑΦΜ, Σειρά, Αριθμός , ΜΑΡΚ, ΕΡΓΟ, ΙΒΑΝ, ΗΜΕΡΟΜΗΝΙΑ, ΠΛΗΡΩΜΗ, ΣΧΟΛΙΑ, ΠΡΟΜΗΘΕΥΤΗΣ, 
ΣΥΝΟΛΙΚΗ ΤΙΜΗ, ΤΙΜΗ ΚΑΘΕ ΠΡΟΙΟΝΤΟΣ


Stack
React 

id             String   @id @default(uuid())
afm            String?
invoice_series  String?
invoice_number  String?
mark           String?
project        String?
iban           String?
invoice_date   DateTime
isPaid         Boolean?
comments       String?
vendor_name    String
total_amount   Decimal  @db.Decimal(10, 2)