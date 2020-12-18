export const getAttributes = manager => {

    const file = require("../configs/campaigns.json");

    return {
        serviceBaseUrl: process.env.REACT_APP_SERVICE_BASE_URL,
        campaigns: file.campaigns || [ { name: "Default" } ]
    }
}