import axios from "axios";

/**
 * Fetch all countries from RestCountries API
 * @returns {Promise<Array>} List of countries with common name and flag
 */
export const getAllCountries = async () => {
    try {
        const response = await axios.get("https://restcountries.com/v3.1/all?fields=name,cca2,flags");
        // Sort countries by common name
        return response.data.sort((a, b) => {
            const nameA = a.name.common.toUpperCase();
            const nameB = b.name.common.toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    } catch (error) {
        console.error("Error fetching countries:", error);
        // Fallback if API fails
        return [
            { name: { common: "Việt Nam" }, cca2: "VN" },
            { name: { common: "United States" }, cca2: "US" },
            { name: { common: "United Kingdom" }, cca2: "GB" },
            { name: { common: "Japan" }, cca2: "JP" },
            { name: { common: "South Korea" }, cca2: "KR" },
            { name: { common: "China" }, cca2: "CN" },
        ];
    }
};
