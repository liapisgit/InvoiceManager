import axios from "axios";

export const analyzeInvoiceImage = async (file, { signal } = {}) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post(
    "http://localhost:5000/api/upload/image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal,
    }
  );

  console.log(response.data.webhook.data);

  return response.data.webhook.data;
};
