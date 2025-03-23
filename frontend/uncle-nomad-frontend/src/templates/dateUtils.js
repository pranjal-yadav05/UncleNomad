/**
 * Formats dates in DD/MM/YYYY format for ticket templates
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateDDMMYYYY = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};
