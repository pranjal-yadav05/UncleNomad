/**
 * Format a date to dd/mm/yyyy format
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "N/A";

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";

    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

/**
 * Format a date with additional options
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeDayName - Whether to include the day name
 * @param {boolean} options.includeMonthName - Whether to include the month name
 * @returns {string} - Formatted date string
 */
export const formatDateWithOptions = (date, options = {}) => {
  if (!date) return "N/A";

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";

    const { includeDayName = false, includeMonthName = false } = options;

    if (includeDayName || includeMonthName) {
      const formatOptions = {};

      if (includeDayName) {
        formatOptions.weekday = "long";
      }

      if (includeMonthName) {
        formatOptions.month = "long";
      }

      formatOptions.day = "numeric";
      formatOptions.year = "numeric";

      return d.toLocaleDateString("en-US", formatOptions);
    }

    // Default dd/mm/yyyy format
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date with options:", error);
    return "Invalid Date";
  }
};
